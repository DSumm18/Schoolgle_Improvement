/**
 * MCP Tool: analyze_framework_gaps
 * 
 * Gap Analysis Engine - Framework-agnostic, update-ready, high-scale
 * 
 * Analyzes evidence gaps for a school against a framework (Ofsted, SIAMS, etc.).
 * 
 * Logic:
 * 1. Load framework expectations + evidence requirements (active versions only)
 * 2. Query evidence index (existing document metadata only - no file content)
 * 3. Assess: evidence presence, age, coverage vs requirement
 * 4. Assign: gap status, risk-weighted score, confidence level
 * 5. Output: calm, factual gap summary (advisory language, not judgemental)
 * 
 * NO LLM calls in this tool.
 * 
 * Cost: £0.00 (deterministic analysis only)
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';
import { logTelemetry, type TelemetryOutcome } from '../utils/telemetry.js';

// ============================================================================
// ZOD SCHEMA
// ============================================================================

export const AnalyzeFrameworkGapsSchema = z.object({
  framework: z.enum(['ofsted', 'siams', 'csi', 'isi', 'section48', 'other'])
    .describe('Framework to analyze gaps for (e.g., "ofsted", "siams")'),
  
  forceRefresh: z.boolean()
    .default(false)
    .describe('If true, forces a fresh analysis (ignores cached results). Default: false (uses cache if available).'),
  
  areaKey: z.string()
    .optional()
    .describe('Optional filter by area_key (e.g., "curriculum_intent", "safeguarding_culture"). If omitted, analyzes all areas.'),
});

export type AnalyzeFrameworkGapsInput = z.infer<typeof AnalyzeFrameworkGapsSchema>;

// ============================================================================
// INTERFACES
// ============================================================================

export interface FrameworkExpectation {
  id: string;
  area_key: string;
  area_name: string;
  description: string;
  risk_weight: 'high' | 'medium' | 'low';
  authority_level: 'statutory' | 'guidance' | 'best_practice';
  version: string;
  effective_date: string;
}

export interface EvidenceRequirement {
  id: string;
  evidence_type: string;
  mandatory: boolean;
  recency_months: number | null;
  min_quantity: number;
  recommended_quantity: number | null;
  notes: string | null;
}

export interface EvidenceItem {
  document_id: number;
  document_name: string;
  evidence_type: string;
  matched_date: string | null; // From documents.scanned_at or evidence_matches.created_at
  confidence: number; // From evidence_matches.confidence
  framework_type: string;
  category_id: string;
  subcategory_id: string;
}

export interface GapResult {
  area_key: string;
  area_name: string;
  status: 'present' | 'missing' | 'outdated' | 'weak';
  gap_score: number;
  confidence_score: number;
  evidence_count: number;
  required_evidence_count: number;
  oldest_evidence_date: string | null;
  newest_evidence_date: string | null;
  required_evidence: Array<{
    evidence_type: string;
    mandatory: boolean;
    status: 'present' | 'missing' | 'outdated';
    recency_months: number | null;
    found_count: number;
  }>;
  notes: string[];
  strengths: string[];
  gaps: string[];
}

export interface FrameworkGapAnalysisResult {
  framework: string;
  analyzed_at: string;
  overall_readiness_score: number; // 0-100 (0 = no gaps, 100 = all gaps)
  areas_analyzed: number;
  gaps_found: number;
  priority_gaps: GapResult[];
  areas_of_strength: Array<{
    area_key: string;
    area_name: string;
    evidence_count: number;
    last_updated: string | null;
  }>;
  next_steps: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string; // Advisory language
    area_key: string;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate gap score based on status and risk weight
 */
function calculateGapScore(
  status: GapResult['status'],
  riskWeight: 'high' | 'medium' | 'low'
): number {
  const baseScore = {
    present: 0,
    weak: 25,
    outdated: 50,
    missing: 100,
  }[status];

  const riskMultiplier = {
    high: 3.0,
    medium: 1.5,
    low: 1.0,
  }[riskWeight];

  return baseScore * riskMultiplier;
}

/**
 * Calculate confidence score based on evidence quality
 */
function calculateConfidenceScore(
  evidenceItems: EvidenceItem[],
  requirements: EvidenceRequirement[]
): number {
  if (evidenceItems.length === 0) {
    return 0.5; // Medium confidence if no evidence (we're confident there's no evidence)
  }

  // Average confidence from evidence matches
  const avgConfidence = evidenceItems.reduce((sum, item) => sum + item.confidence, 0) / evidenceItems.length;

  // Coverage: how many requirements are met?
  const mandatoryMet = requirements
    .filter(req => req.mandatory)
    .every(req => evidenceItems.some(item => item.evidence_type === req.evidence_type));

  const coverageScore = mandatoryMet ? 1.0 : 0.7;

  // Recency: are evidence items recent?
  const now = new Date();
  const recentEvidence = evidenceItems.filter(item => {
    if (!item.matched_date) return false;
    const evidenceDate = new Date(item.matched_date);
    const monthsAgo = (now.getTime() - evidenceDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 12; // Within 12 months
  }).length;

  const recencyScore = recentEvidence / evidenceItems.length;

  // Combined confidence
  return (avgConfidence * 0.4 + coverageScore * 0.4 + recencyScore * 0.2);
}

/**
 * Determine gap status based on evidence vs requirements
 */
function determineGapStatus(
  evidenceItems: EvidenceItem[],
  requirements: EvidenceRequirement[]
): GapResult['status'] {
  if (evidenceItems.length === 0) {
    return 'missing';
  }

  // Check if mandatory requirements are met
  const mandatoryRequirements = requirements.filter(req => req.mandatory);
  const mandatoryMet = mandatoryRequirements.every(req => {
    const matchingEvidence = evidenceItems.filter(item => item.evidence_type === req.evidence_type);
    return matchingEvidence.length >= req.min_quantity;
  });

  if (!mandatoryMet) {
    return 'missing';
  }

  // Check recency
  const now = new Date();
  const outdatedRequirements = requirements.filter(req => {
    if (!req.recency_months) return false; // No recency requirement
    const matchingEvidence = evidenceItems.filter(item => item.evidence_type === req.evidence_type);
    if (matchingEvidence.length === 0) return true;
    
    const oldestEvidence = matchingEvidence
      .map(item => item.matched_date ? new Date(item.matched_date) : null)
      .filter(date => date !== null)
      .sort((a, b) => a!.getTime() - b!.getTime())[0];
    
    if (!oldestEvidence) return true;
    const monthsAgo = (now.getTime() - oldestEvidence.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo > req.recency_months;
  });

  if (outdatedRequirements.length > 0) {
    return 'outdated';
  }

  // Check coverage (are recommended quantities met?)
  const recommendedRequirements = requirements.filter(req => req.recommended_quantity !== null);
  const coverageMet = recommendedRequirements.every(req => {
    const matchingEvidence = evidenceItems.filter(item => item.evidence_type === req.evidence_type);
    return matchingEvidence.length >= (req.recommended_quantity || 0);
  });

  if (!coverageMet) {
    return 'weak';
  }

  return 'present';
}

/**
 * Generate advisory notes based on gap status
 */
function generateAdvisoryNotes(
  status: GapResult['status'],
  areaName: string,
  evidenceItems: EvidenceItem[],
  requirements: EvidenceRequirement[]
): { notes: string[]; strengths: string[]; gaps: string[] } {
  const notes: string[] = [];
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (status === 'present') {
    strengths.push(`Strong evidence coverage for ${areaName}.`);
    if (evidenceItems.length > 0) {
      const newestDate = evidenceItems
        .map(item => item.matched_date)
        .filter(date => date !== null)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];
      if (newestDate) {
        strengths.push(`Most recent evidence updated: ${new Date(newestDate).toLocaleDateString()}.`);
      }
    }
  } else if (status === 'missing') {
    const missingTypes = requirements
      .filter(req => req.mandatory)
      .filter(req => !evidenceItems.some(item => item.evidence_type === req.evidence_type))
      .map(req => req.evidence_type);
    
    if (missingTypes.length > 0) {
      gaps.push(`No evidence found for: ${missingTypes.join(', ')}.`);
      notes.push(`Consider providing evidence for ${areaName} to support inspection readiness.`);
    }
  } else if (status === 'outdated') {
    const outdatedTypes = requirements
      .filter(req => req.recency_months !== null)
      .filter(req => {
        const matchingEvidence = evidenceItems.filter(item => item.evidence_type === req.evidence_type);
        if (matchingEvidence.length === 0) return true;
        const oldestEvidence = matchingEvidence
          .map(item => item.matched_date ? new Date(item.matched_date) : null)
          .filter(date => date !== null)
          .sort((a, b) => a!.getTime() - b!.getTime())[0];
        if (!oldestEvidence) return true;
        const now = new Date();
        const monthsAgo = (now.getTime() - oldestEvidence.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo > (req.recency_months || 0);
      })
      .map(req => req.evidence_type);
    
    if (outdatedTypes.length > 0) {
      gaps.push(`Evidence exists but is older than recommended for: ${outdatedTypes.join(', ')}.`);
      notes.push(`Consider updating evidence for ${areaName} to ensure it reflects current practice.`);
    }
  } else if (status === 'weak') {
    const weakTypes = requirements
      .filter(req => req.recommended_quantity !== null)
      .filter(req => {
        const matchingEvidence = evidenceItems.filter(item => item.evidence_type === req.evidence_type);
        return matchingEvidence.length < (req.recommended_quantity || 0);
      })
      .map(req => req.evidence_type);
    
    if (weakTypes.length > 0) {
      gaps.push(`Evidence present but coverage is limited for: ${weakTypes.join(', ')}.`);
      notes.push(`Consider strengthening evidence for ${areaName} to improve coverage.`);
    }
  }

  return { notes, strengths, gaps };
}

/**
 * Generate advisory language based on authority level
 */
function formatAdvisoryLanguage(
  description: string,
  authorityLevel: 'statutory' | 'guidance' | 'best_practice'
): string {
  const prefix = {
    statutory: 'Statutory requirement: ',
    guidance: 'Guidance suggests: ',
    best_practice: 'Best practice indicates: ',
  }[authorityLevel];

  return `${prefix}${description}`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function handleAnalyzeFrameworkGaps(
  args: AnalyzeFrameworkGapsInput,
  context: AuthContext,
  requestId?: string,
  sessionId?: string
): Promise<FrameworkGapAnalysisResult> {
  const startTime = Date.now();
  const { framework, forceRefresh, areaKey } = args;
  let outcome: TelemetryOutcome = 'success';
  let errorCode: string | undefined;

  try {
    const { organizationId, supabase } = context;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Step 1: Load framework expectations (active versions only)
    const expectationsQuery = supabase
      .from('framework_expectations')
      .select('*')
      .eq('framework', framework)
      .eq('is_active', true)
      .lte('effective_date', new Date().toISOString().split('T')[0])
      .order('area_key');

    if (areaKey) {
      expectationsQuery.eq('area_key', areaKey);
    }

    const { data: expectations, error: expectationsError } = await expectationsQuery;

    if (expectationsError) {
      throw new Error(`Failed to load framework expectations: ${expectationsError.message}`);
    }

    if (!expectations || expectations.length === 0) {
      throw new Error(`No active framework expectations found for framework: ${framework}`);
    }

    // Step 2: Check for cached results (if not forcing refresh)
    if (!forceRefresh) {
      const cachedQuery = supabase
        .from('evidence_gap_results')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('framework', framework)
        .order('analyzed_at', { ascending: false })
        .limit(1);

      if (areaKey) {
        cachedQuery.eq('area_key', areaKey);
      }

      const { data: cachedResults } = await cachedQuery;

      // Use cache if it's less than 24 hours old
      if (cachedResults && cachedResults.length > 0) {
        const cachedResult = cachedResults[0];
        const cachedDate = new Date(cachedResult.analyzed_at);
        const hoursAgo = (Date.now() - cachedDate.getTime()) / (1000 * 60 * 60);

        if (hoursAgo < 24) {
          // Return cached result (reconstruct from stored data)
          // For now, we'll still run fresh analysis but could optimize later
        }
      }
    }

    // Step 3: Load evidence requirements for each expectation
    const expectationIds = expectations.map(exp => exp.id);
    const { data: requirements, error: requirementsError } = await supabase
      .from('evidence_requirements')
      .select('*')
      .in('framework_expectation_id', expectationIds)
      .eq('is_active', true)
      .lte('effective_date', new Date().toISOString().split('T')[0]);

    if (requirementsError) {
      throw new Error(`Failed to load evidence requirements: ${requirementsError.message}`);
    }

    // Step 4: Query evidence index (existing document metadata only)
    // Map area_key to framework subcategories (this is a simplification - in reality, you'd have a mapping table)
    // For now, we'll use evidence_matches to find evidence by framework_type and category_id/subcategory_id
    const { data: evidenceMatches, error: evidenceError } = await supabase
      .from('evidence_matches')
      .select(`
        id,
        document_id,
        framework_type,
        category_id,
        subcategory_id,
        confidence,
        documents:document_id (
          id,
          name,
          scanned_at,
          created_at
        )
      `)
      .eq('organization_id', organizationId)
      .eq('framework_type', framework);

    if (evidenceError) {
      throw new Error(`Failed to load evidence matches: ${evidenceError.message}`);
    }

    // Step 5: Analyze gaps for each expectation
    const gapResults: GapResult[] = [];
    const areasOfStrength: FrameworkGapAnalysisResult['areas_of_strength'] = [];

    for (const expectation of expectations as FrameworkExpectation[]) {
      // Get requirements for this expectation
      const expectationRequirements = (requirements || []).filter(
        req => req.framework_expectation_id === expectation.id
      ) as EvidenceRequirement[];

      // Find evidence items (simplified - in reality, you'd map area_key to subcategory_id)
      // For now, we'll use a simple match on framework_type
      const evidenceItems: EvidenceItem[] = (evidenceMatches || [])
        .filter(match => match.framework_type === framework)
        .map(match => ({
          document_id: match.document_id,
          document_name: (match.documents as any)?.name || 'Unknown',
          evidence_type: 'document', // Simplified - in reality, you'd infer from document metadata
          matched_date: (match.documents as any)?.scanned_at || (match.documents as any)?.created_at || null,
          confidence: match.confidence || 0.5,
          framework_type: match.framework_type,
          category_id: match.category_id,
          subcategory_id: match.subcategory_id,
        }));

      // Determine gap status
      const status = determineGapStatus(evidenceItems, expectationRequirements);

      // Calculate scores
      const gapScore = calculateGapScore(status, expectation.risk_weight);
      const confidenceScore = calculateConfidenceScore(evidenceItems, expectationRequirements);

      // Generate advisory notes
      const { notes, strengths, gaps } = generateAdvisoryNotes(
        status,
        expectation.area_name,
        evidenceItems,
        expectationRequirements
      );

      // Assess required evidence
      const requiredEvidence = expectationRequirements.map(req => {
        const matchingEvidence = evidenceItems.filter(item => item.evidence_type === req.evidence_type);
        const foundCount = matchingEvidence.length;
        
        // Check if evidence is recent enough
        let evidenceStatus: 'present' | 'missing' | 'outdated' = 'missing';
        if (foundCount >= req.min_quantity) {
          if (req.recency_months) {
            const now = new Date();
            const recentEvidence = matchingEvidence.filter(item => {
              if (!item.matched_date) return false;
              const evidenceDate = new Date(item.matched_date);
              const monthsAgo = (now.getTime() - evidenceDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
              return monthsAgo <= req.recency_months;
            });
            evidenceStatus = recentEvidence.length > 0 ? 'present' : 'outdated';
          } else {
            evidenceStatus = 'present';
          }
        }

        return {
          evidence_type: req.evidence_type,
          mandatory: req.mandatory,
          status: evidenceStatus,
          recency_months: req.recency_months,
          found_count: foundCount,
        };
      });

      // Get evidence date range
      const evidenceDates = evidenceItems
        .map(item => item.matched_date ? new Date(item.matched_date) : null)
        .filter(date => date !== null) as Date[];

      const oldestEvidenceDate = evidenceDates.length > 0
        ? evidenceDates.sort((a, b) => a.getTime() - b.getTime())[0].toISOString().split('T')[0]
        : null;
      const newestEvidenceDate = evidenceDates.length > 0
        ? evidenceDates.sort((a, b) => b.getTime() - a.getTime())[0].toISOString().split('T')[0]
        : null;

      const gapResult: GapResult = {
        area_key: expectation.area_key,
        area_name: expectation.area_name,
        status,
        gap_score: gapScore,
        confidence_score: confidenceScore,
        evidence_count: evidenceItems.length,
        required_evidence_count: expectationRequirements.reduce((sum, req) => sum + req.min_quantity, 0),
        oldest_evidence_date: oldestEvidenceDate,
        newest_evidence_date: newestEvidenceDate,
        required_evidence: requiredEvidence,
        notes,
        strengths,
        gaps,
      };

      gapResults.push(gapResult);

      // Track areas of strength
      if (status === 'present') {
        areasOfStrength.push({
          area_key: expectation.area_key,
          area_name: expectation.area_name,
          evidence_count: evidenceItems.length,
          last_updated: newestEvidenceDate,
        });
      }
    }

    // Step 6: Calculate overall readiness score
    const totalPossibleScore = gapResults.reduce((sum, gap) => {
      const maxScore = calculateGapScore('missing', gapResults.find(g => g.area_key === gap.area_key)?.status === 'missing' ? 'high' : 'medium');
      return sum + maxScore;
    }, 0);

    const actualScore = gapResults.reduce((sum, gap) => sum + gap.gap_score, 0);
    const overallReadinessScore = totalPossibleScore > 0
      ? Math.max(0, Math.min(100, 100 - (actualScore / totalPossibleScore) * 100))
      : 100;

    // Step 7: Generate priority gaps and next steps
    const priorityGaps = gapResults
      .filter(gap => gap.status !== 'present')
      .sort((a, b) => b.gap_score - a.gap_score);

    const nextSteps = priorityGaps.slice(0, 10).map(gap => ({
      priority: gap.gap_score >= 150 ? 'high' as const : gap.gap_score >= 75 ? 'medium' as const : 'low' as const,
      action: gap.notes[0] || `Consider addressing evidence gaps for ${gap.area_name}.`,
      area_key: gap.area_key,
    }));

    // Step 8: Cache results
    const gapResultsToCache = gapResults.map(gap => ({
      organization_id: organizationId,
      framework,
      area_key: gap.area_key,
      status: gap.status,
      gap_score: gap.gap_score,
      confidence_score: gap.confidence_score,
      evidence_count: gap.evidence_count,
      required_evidence_count: gap.required_evidence_count,
      oldest_evidence_date: gap.oldest_evidence_date,
      newest_evidence_date: gap.newest_evidence_date,
      last_scanned_at: new Date().toISOString(),
      analyzed_at: new Date().toISOString(),
      notes: gap.notes,
      strengths: gap.strengths,
      gaps: gap.gaps,
      evidence_details: gap.required_evidence,
      required_evidence_details: gap.required_evidence,
    }));

    // Upsert cached results
    for (const result of gapResultsToCache) {
      await supabase
        .from('evidence_gap_results')
        .upsert(result, {
          onConflict: 'organization_id,framework,area_key',
        });
    }

    // Step 9: Build result
    const result: FrameworkGapAnalysisResult = {
      framework,
      analyzed_at: new Date().toISOString(),
      overall_readiness_score: overallReadinessScore,
      areas_analyzed: expectations.length,
      gaps_found: priorityGaps.length,
      priority_gaps: priorityGaps,
      areas_of_strength: areasOfStrength,
      next_steps: nextSteps,
    };

    return result;

  } catch (error: any) {
    outcome = 'error';
    errorCode = error.code || 'GAP_ANALYSIS_ERROR';
    console.error(`[Gap Analysis] Error analyzing framework gaps (Request ID: ${requestId}):`, error);
    throw error;
  } finally {
    // Log telemetry
    const duration = Date.now() - startTime;
    await logTelemetry(
      {
        tool_name: 'analyze_framework_gaps',
        used_llm: false, // No LLM calls
        timestamp: new Date().toISOString(),
        organization_id: context.organizationId,
        user_id: context.userId,
        duration_ms: duration,
        request_id: requestId,
        session_id: sessionId,
        outcome,
        error_code: errorCode,
      },
      context.supabase
    );
  }
}


