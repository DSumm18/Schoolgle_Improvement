/**
 * MCP Tool: generate_inspection_narrative
 * 
 * Inspection Narrative & SEF Generator (LLM-assisted, evidence-grounded)
 * 
 * Purpose:
 * - Turns gap analysis + actions + evidence into a calm, inspection-ready narrative
 * - Supports SEF-style documentation without claiming to be "the SEF"
 * - Reduces workload for Headteachers and SLT
 * - Uses advisory language only
 * - Safe, defensible, and explainable
 * 
 * Logic:
 * 1. Gather gap analysis results (via analyze_framework_gaps)
 * 2. Gather actions linked to framework areas
 * 3. Gather evidence metadata by framework area
 * 4. If sufficient data: Call LLM to structure narrative
 * 5. If insufficient data: Return structured fallback explaining what's missing
 * 
 * LLM Usage:
 * - ONLY for structuring narrative and improving clarity/flow
 * - MUST NOT invent actions, evidence, outcomes, or judgements
 * - MUST NOT predict inspection outcomes or assign grades
 * - MUST use advisory language only
 * 
 * Cost: Paid skill (uses LLM)
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';
import { logTelemetry, type TelemetryOutcome } from '../utils/telemetry.js';
import { handleAnalyzeFrameworkGaps, type FrameworkGapAnalysisResult } from './gap-analysis.js';
import { callOpenRouter, getDefaultModels, estimateTokenUsage } from '../llm/openrouter.js';
import { handleConsultKnowledgePack } from './knowledge.js';
import type { Rule } from '../knowledge/schema.js';

// ============================================================================
// ZOD SCHEMA
// ============================================================================

export const GenerateInspectionNarrativeSchema = z.object({
  school_id: z.string()
    .describe('School/organization ID to generate narrative for'),
  
  framework: z.enum(['ofsted', 'siams', 'csi', 'isi', 'section48', 'other'])
    .describe('Framework to generate narrative for (e.g., "ofsted", "siams")'),
  
  mode: z.enum(['inspection_narrative', 'sef_draft', 'leadership_brief'])
    .default('inspection_narrative')
    .describe('Output mode: "inspection_narrative" (default), "sef_draft", or "leadership_brief"'),
});

export type GenerateInspectionNarrativeInput = z.infer<typeof GenerateInspectionNarrativeSchema>;

// ============================================================================
// INTERFACES
// ============================================================================

export interface ActionData {
  id: string;
  title: string;
  description: string | null;
  success_criteria: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  category_id: string | null;
  subcategory_id: string | null;
  eef_strategy: string | null;
  eef_impact_months: number | null;
  due_date: string | null;
  completed_date: string | null;
  created_at: string;
}

export interface EvidenceMetadata {
  area_key: string;
  area_name: string;
  evidence_count: number;
  oldest_evidence_date: string | null;
  newest_evidence_date: string | null;
  recency_status: 'up_to_date' | 'ageing' | 'missing';
  evidence_types: string[];
}

export interface GroundingMetadata {
  expectations_count: number;
  requirements_count: number;
  gaps_count: number;
  actions_count: number;
  evidence_count: number;
  sources_used: string[]; // Deduped list of source names
}

export interface InspectionNarrativeResult {
  framework: string;
  mode: string;
  generated_at: string;
  context_and_self_understanding: string;
  strengths_and_secure_practice: string;
  areas_of_focus_and_improvement: string;
  actions_taken_and_rationale: string;
  review_and_impact_monitoring: string;
  next_steps_and_priorities: string;
  evidence_and_sources_referenced: {
    evidence_categories: string[];
    guidance_sources: Array<{
      source: string;
      authority_level: 'statutory' | 'guidance' | 'best_practice';
    }>;
  };
  grounding_metadata: GroundingMetadata;
  data_quality: {
    has_gap_analysis: boolean;
    has_actions: boolean;
    has_evidence: boolean;
    confidence_level: 'high' | 'medium' | 'low';
  };
  telemetry: {
    used_llm: boolean;
    model?: string;
    token_usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    duration_ms: number;
    grounding_counts: GroundingMetadata;
    threshold_blocked: boolean;
  };
}

export interface InsufficientDataResult {
  framework: string;
  mode: string;
  generated_at: string;
  outcome: 'insufficient_data' | 'threshold_blocked';
  missing_data: {
    gap_analysis: boolean;
    actions: boolean;
    evidence: boolean;
  };
  message: string;
  suggested_next_actions: string[];
  threshold_details?: {
    min_gaps_required: number;
    min_confidence_required: number;
    actual_gaps: number;
    actual_confidence: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gather actions linked to framework areas
 */
async function gatherActions(
  supabase: any,
  organizationId: string,
  framework: string
): Promise<ActionData[]> {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('framework_type', framework)
    .in('status', ['approved', 'in_progress', 'completed'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Inspection Narrative] Error fetching actions:', error);
    return [];
  }

  return (data || []) as ActionData[];
}

/**
 * Gather evidence metadata by framework area
 * Uses gap analysis result fields directly - no additional queries
 */
async function gatherEvidenceMetadata(
  supabase: any,
  organizationId: string,
  framework: string,
  gapAnalysis: FrameworkGapAnalysisResult
): Promise<EvidenceMetadata[]> {
  const evidenceMetadata: EvidenceMetadata[] = [];

  // Use gap analysis results directly - they already contain evidence info
  for (const gap of gapAnalysis.priority_gaps) {
    // Determine recency status using MOST RECENT evidence date (newest_evidence_date)
    let recencyStatus: 'up_to_date' | 'ageing' | 'missing' = 'missing';
    if (gap.evidence_count > 0) {
      // Use newest_evidence_date (most recent) for recency calculation
      const mostRecentDate = gap.newest_evidence_date;
      if (mostRecentDate) {
        const now = new Date();
        const newestDate = new Date(mostRecentDate);
        const monthsAgo = (now.getTime() - newestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsAgo <= 12) {
          recencyStatus = 'up_to_date';
        } else {
          recencyStatus = 'ageing';
        }
      } else {
        recencyStatus = 'ageing'; // Has evidence but no date
      }
    }

    evidenceMetadata.push({
      area_key: gap.area_key,
      area_name: gap.area_name,
      evidence_count: gap.evidence_count,
      oldest_evidence_date: gap.oldest_evidence_date,
      newest_evidence_date: gap.newest_evidence_date,
      recency_status: recencyStatus,
      evidence_types: gap.required_evidence.map(e => e.evidence_type),
    });
  }

  // Add areas of strength
  for (const strength of gapAnalysis.areas_of_strength) {
    // Use last_updated (most recent) for recency calculation
    let recencyStatus: 'up_to_date' | 'ageing' | 'missing' = 'missing';
    if (strength.evidence_count > 0) {
      const mostRecentDate = strength.last_updated;
      if (mostRecentDate) {
        const now = new Date();
        const lastUpdated = new Date(mostRecentDate);
        const monthsAgo = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30);
        recencyStatus = monthsAgo <= 12 ? 'up_to_date' : 'ageing';
      } else {
        recencyStatus = 'ageing';
      }
    }

    evidenceMetadata.push({
      area_key: strength.area_key,
      area_name: strength.area_name || strength.area_key,
      evidence_count: strength.evidence_count,
      oldest_evidence_date: null,
      newest_evidence_date: strength.last_updated,
      recency_status: recencyStatus,
      evidence_types: [],
    });
  }

  return evidenceMetadata;
}

/**
 * Check if sufficient data exists to generate narrative
 */
function hasSufficientData(
  gapAnalysis: FrameworkGapAnalysisResult | null,
  actions: ActionData[],
  evidenceMetadata: EvidenceMetadata[]
): boolean {
  if (!gapAnalysis || gapAnalysis.areas_analyzed === 0) {
    return false;
  }

  // Need at least some data in one of: actions, evidence, or gap analysis results
  const hasActions = actions.length > 0;
  const hasEvidence = evidenceMetadata.length > 0;
  const hasGapResults = gapAnalysis.priority_gaps.length > 0 || gapAnalysis.areas_of_strength.length > 0;

  return hasGapResults && (hasActions || hasEvidence);
}

/**
 * Check if data meets deterministic thresholds
 * Returns null if thresholds are met, or threshold details if blocked
 */
function checkThresholds(
  gapAnalysis: FrameworkGapAnalysisResult | null
): { blocked: boolean; details?: InsufficientDataResult['threshold_details'] } {
  if (!gapAnalysis) {
    return { blocked: true };
  }

  // Get configurable thresholds from env vars (defaults: min 1 gap, min 0.5 confidence)
  const minGaps = parseInt(process.env.INSPECTION_NARRATIVE_MIN_GAPS || '1', 10);
  const minConfidence = parseFloat(process.env.INSPECTION_NARRATIVE_MIN_CONFIDENCE || '0.5');

  const actualGaps = gapAnalysis.priority_gaps.length;
  // Use average confidence score from priority gaps, or overall readiness score as fallback
  const avgConfidence = gapAnalysis.priority_gaps.length > 0
    ? gapAnalysis.priority_gaps.reduce((sum, gap) => sum + gap.confidence_score, 0) / gapAnalysis.priority_gaps.length
    : 1 - (gapAnalysis.overall_readiness_score / 100); // Convert readiness score to confidence

  const blocked = actualGaps < minGaps || avgConfidence < minConfidence;

  if (blocked) {
    return {
      blocked: true,
      details: {
        min_gaps_required: minGaps,
        min_confidence_required: minConfidence,
        actual_gaps: actualGaps,
        actual_confidence: avgConfidence,
      },
    };
  }

  return { blocked: false };
}

/**
 * Calculate grounding metadata from gathered data
 */
function calculateGroundingMetadata(
  gapAnalysis: FrameworkGapAnalysisResult | null,
  actions: ActionData[],
  evidenceMetadata: EvidenceMetadata[],
  guidanceSources: Array<{ source: string; authority_level: 'statutory' | 'guidance' | 'best_practice' }>
): GroundingMetadata {
  // Count expectations (areas analyzed)
  const expectationsCount = gapAnalysis?.areas_analyzed || 0;

  // Count requirements (sum of required_evidence across all gaps)
  const requirementsCount = gapAnalysis?.priority_gaps.reduce((sum, gap) => {
    return sum + (gap.required_evidence?.length || 0);
  }, 0) || 0;

  // Count gaps
  const gapsCount = gapAnalysis?.priority_gaps.length || 0;

  // Count actions
  const actionsCount = actions.length;

  // Count evidence (sum of evidence_count across all metadata)
  const evidenceCount = evidenceMetadata.reduce((sum, ev) => sum + ev.evidence_count, 0);

  // Deduped list of sources
  const sourcesUsed = Array.from(new Set(guidanceSources.map(s => s.source)));

  return {
    expectations_count: expectationsCount,
    requirements_count: requirementsCount,
    gaps_count: gapsCount,
    actions_count: actionsCount,
    evidence_count: evidenceCount,
    sources_used: sourcesUsed,
  };
}

/**
 * Fetch relevant EEF research entries for actions
 * Returns empty array if no EEF entries found (no failure)
 */
async function fetchEEFResearchForActions(
  actions: ActionData[],
  context: AuthContext
): Promise<Array<{ action_title: string; eef_rule: Rule }>> {
  const eefEntries: Array<{ action_title: string; eef_rule: Rule }> = [];

  // Map common EEF strategy names to topics
  const strategyToTopic: Record<string, string> = {
    'feedback': 'feedback',
    'metacognition': 'metacognition_self_regulation',
    'self-regulation': 'metacognition_self_regulation',
    'early language': 'early_language',
    'language development': 'early_language',
    'reading comprehension': 'reading_comprehension',
    'phonics': 'phonics',
    'small group tuition': 'small_group_tuition',
    'targeted intervention': 'small_group_tuition',
    'send': 'send_targeted_interventions',
    'behaviour': 'behaviour_interventions',
    'professional development': 'professional_development',
    'cpd': 'professional_development',
    'assessment for learning': 'assessment_for_learning',
    'formative assessment': 'assessment_for_learning',
  };

  for (const action of actions) {
    // Check if action has EEF strategy or mentions research
    const eefStrategy = action.eef_strategy?.toLowerCase() || '';
    const actionText = `${action.title} ${action.description || ''}`.toLowerCase();

    // Try to find matching EEF topic
    let topic: string | undefined;
    for (const [strategy, eefTopic] of Object.entries(strategyToTopic)) {
      if (eefStrategy.includes(strategy) || actionText.includes(strategy)) {
        topic = eefTopic;
        break;
      }
    }

    if (topic) {
      try {
        const eefResult = await handleConsultKnowledgePack(
          {
            domain: 'research',
            topic,
            context: undefined,
          },
          context
        );

        if (eefResult.rules && eefResult.rules.length > 0) {
          // Use first matching rule
          eefEntries.push({
            action_title: action.title,
            eef_rule: eefResult.rules[0],
          });
        }
      } catch (error) {
        // Silently continue if EEF lookup fails (no failure mode)
        console.warn(`[Inspection Narrative] EEF lookup failed for action "${action.title}":`, error);
      }
    }
  }

  return eefEntries;
}

/**
 * Build LLM prompt for narrative generation
 */
function buildNarrativePrompt(
  gapAnalysis: FrameworkGapAnalysisResult,
  actions: ActionData[],
  evidenceMetadata: EvidenceMetadata[],
  eefResearch: Array<{ action_title: string; eef_rule: Rule }>,
  mode: string
): string {
  // Mode handling: same 7 headings, vary only depth/verbosity and audience tone
  const modeInstructions = {
    inspection_narrative: 'Generate a calm, inspection-ready narrative that helps the school articulate its position. Use standard depth and formal tone.',
    sef_draft: 'Generate a SEF-style draft document (do not claim this is "the SEF", but structure it similarly). Use standard depth and formal tone.',
    leadership_brief: 'Generate a concise leadership brief for SLT review. Use concise depth and executive tone.',
  }[mode];

  return `You are helping a school generate an ${mode === 'inspection_narrative' ? 'inspection narrative' : mode === 'sef_draft' ? 'SEF-style draft' : 'leadership brief'} for framework: ${gapAnalysis.framework}.

${modeInstructions}

CRITICAL RULES:
1. Use ADVISORY language only ("we consider", "we are focusing on", "we are working towards")
2. NEVER invent actions, evidence, outcomes, or judgements
3. NEVER predict inspection outcomes or assign grades
4. NEVER use authoritative language ("must", "requires") unless explicitly citing statutory sources
5. If data is missing or weak, say so explicitly
6. If confidence is low, flag it clearly
7. EEF research references:
   - Use ONLY in "Actions taken and rationale" and "Next steps and priorities" sections
   - Use advisory language: "EEF evidence suggests...", "Research indicates this may be effective when..."
   - NEVER say "EEF requires" or "best practice" - always use "suggests" or "indicates"
   - If no EEF research is provided, do not invent research references

INPUT DATA:

Gap Analysis Results:
- Framework: ${gapAnalysis.framework}
- Analyzed at: ${gapAnalysis.analyzed_at}
- Overall readiness score: ${gapAnalysis.overall_readiness_score}/100 (lower is better)
- Areas analyzed: ${gapAnalysis.areas_analyzed}
- Gaps found: ${gapAnalysis.gaps_found}

Priority Gaps:
${gapAnalysis.priority_gaps.map(gap => `
- ${gap.area_name} (${gap.area_key})
  Status: ${gap.status}
  Gap score: ${gap.gap_score}
  Confidence: ${gap.confidence_score}
  Evidence count: ${gap.evidence_count}/${gap.required_evidence_count}
  Strengths: ${gap.strengths.join('; ') || 'None noted'}
  Gaps: ${gap.gaps.join('; ') || 'None noted'}
  Notes: ${gap.notes.join('; ') || 'None'}
`).join('\n')}

Areas of Strength:
${gapAnalysis.areas_of_strength.map(s => `
- ${s.area_name || s.area_key}
  Evidence count: ${s.evidence_count}
  Last updated: ${s.last_updated || 'Unknown'}
`).join('\n')}

Actions Taken:
${actions.map(action => `
- ${action.title}
  Status: ${action.status}
  Priority: ${action.priority}
  Description: ${action.description || 'No description'}
  Success criteria: ${action.success_criteria || 'Not specified'}
  EEF strategy: ${action.eef_strategy || 'Not specified'}
  Due date: ${action.due_date || 'Not set'}
  Completed: ${action.completed_date || 'Not completed'}
`).join('\n')}

EEF Research Evidence (if available):
${eefResearch.length > 0
  ? eefResearch.map(({ action_title, eef_rule }) => {
      let eefContent: any = {};
      try {
        eefContent = typeof eef_rule.content === 'string' ? JSON.parse(eef_rule.content) : eef_rule.content;
      } catch {
        eefContent = { summary_plain_english: eef_rule.content };
      }
      
      return `
- For action: "${action_title}"
  Theme: ${eefContent.theme || 'N/A'}
  Summary: ${eefContent.summary_plain_english || 'N/A'}
  Strength of evidence: ${eefContent.strength_of_evidence || 'N/A'}
  Cost implication: ${eefContent.cost_implication || 'N/A'}
  Limitations: ${eefContent.limitations_or_caveats || 'None specified'}
`;
    }).join('\n')
  : 'No EEF research entries found for these actions. Continue without research references.'}

Evidence Metadata:
${evidenceMetadata.map(ev => `
- ${ev.area_name} (${ev.area_key})
  Evidence count: ${ev.evidence_count}
  Recency: ${ev.recency_status}
  Oldest evidence: ${ev.oldest_evidence_date || 'None'}
  Newest evidence: ${ev.newest_evidence_date || 'None'}
  Evidence types: ${ev.evidence_types.join(', ') || 'None'}
`).join('\n')}

OUTPUT REQUIREMENTS:

Generate a structured narrative with these EXACT sections (as JSON):

{
  "context_and_self_understanding": "How the school understands its current position. Reference timeframe (e.g., 'since last inspection' or 'over the last X years').",
  "strengths_and_secure_practice": "Based only on areas marked strong/low-risk. Cite evidence presence and review cycles.",
  "areas_of_focus_and_improvement": "Priority gaps identified. Use calm, non-judgemental language. Explain why these areas are priorities.",
  "actions_taken_and_rationale": "Link actions to gaps. Explain intent and expected impact. Reference research sources where applicable (EEF, DfE).",
  "review_and_impact_monitoring": "How actions are being reviewed. What indicators are being monitored. Acknowledge where impact is not yet measurable.",
  "next_steps_and_priorities": "Clear, practical next steps. Risk-weighted ordering. Advisory phrasing only.",
  "evidence_categories": ["List of evidence categories referenced"],
  "guidance_sources": [
    {"source": "EEF", "authority_level": "guidance"},
    {"source": "DfE", "authority_level": "statutory"}
  ]
}

Return ONLY valid JSON, no markdown, no code blocks.`;
}

/**
 * Gather guidance sources from framework_expectations and evidence_requirements
 * Only uses actual DB data - no inference
 */
async function gatherGuidanceSources(
  supabase: any,
  framework: string,
  gapAnalysis: FrameworkGapAnalysisResult
): Promise<Array<{ source: string; authority_level: 'statutory' | 'guidance' | 'best_practice' }>> {
  const sourcesMap = new Map<string, 'statutory' | 'guidance' | 'best_practice'>();
  const areaKeys = new Set<string>();
  
  // Collect all area_keys from gap analysis
  gapAnalysis.priority_gaps.forEach(gap => areaKeys.add(gap.area_key));
  gapAnalysis.areas_of_strength.forEach(strength => areaKeys.add(strength.area_key));

  if (areaKeys.size === 0) {
    return [];
  }

  // Query framework_expectations for source and authority_level
  const { data: expectations, error: expectationsError } = await supabase
    .from('framework_expectations')
    .select('source, authority_level')
    .eq('framework', framework)
    .eq('is_active', true)
    .in('area_key', Array.from(areaKeys));

  if (expectationsError) {
    console.warn('[Inspection Narrative] Error fetching framework_expectations for sources:', expectationsError);
  } else if (expectations && expectations.length > 0) {
    for (const exp of expectations) {
      if (exp.source) {
        // Map source to display name
        const sourceName = exp.source === 'ofsted' ? 'Ofsted' :
                          exp.source === 'siams' ? 'SIAMS' :
                          exp.source === 'dfe' ? 'DfE' :
                          exp.source === 'eef' ? 'EEF' :
                          exp.source.toUpperCase();
        
        const authorityLevel = (exp.authority_level || 'guidance') as 'statutory' | 'guidance' | 'best_practice';
        
        // Prefer statutory over guidance, guidance over best_practice
        const existing = sourcesMap.get(sourceName);
        if (!existing || (authorityLevel === 'statutory' && existing !== 'statutory')) {
          sourcesMap.set(sourceName, authorityLevel);
        }
      }
    }
  }

  // Query evidence_requirements for additional sources
  // First get framework_expectation_ids for the area_keys
  const { data: expectationIds, error: expectationIdsError } = await supabase
    .from('framework_expectations')
    .select('id')
    .eq('framework', framework)
    .eq('is_active', true)
    .in('area_key', Array.from(areaKeys));

  if (!expectationIdsError && expectationIds && expectationIds.length > 0) {
    const ids = expectationIds.map((e: any) => e.id);
    
    const { data: requirements, error: requirementsError } = await supabase
      .from('evidence_requirements')
      .select('source, framework_expectations(authority_level)')
      .eq('is_active', true)
      .in('framework_expectation_id', ids);

    if (!requirementsError && requirements && requirements.length > 0) {
      for (const req of requirements) {
        if (req.source) {
          const sourceName = req.source === 'ofsted' ? 'Ofsted' :
                            req.source === 'siams' ? 'SIAMS' :
                            req.source === 'dfe' ? 'DfE' :
                            req.source === 'eef' ? 'EEF' :
                            req.source.toUpperCase();
          
          const authorityLevel = (req.framework_expectations?.authority_level || 'guidance') as 'statutory' | 'guidance' | 'best_practice';
          
          const existing = sourcesMap.get(sourceName);
          if (!existing || (authorityLevel === 'statutory' && existing !== 'statutory')) {
            sourcesMap.set(sourceName, authorityLevel);
          }
        }
      }
    }
  }

  // If no sources found, return "Source not recorded"
  if (sourcesMap.size === 0) {
    console.warn('[Inspection Narrative] No guidance sources found in framework_expectations or evidence_requirements');
    return [{
      source: 'Source not recorded',
      authority_level: 'guidance',
    }];
  }

  return Array.from(sourcesMap.entries()).map(([source, authority_level]) => ({
    source,
    authority_level,
  }));
}

/**
 * Parse LLM response into structured narrative
 */
function parseNarrativeResponse(
  llmResponse: string,
  guidanceSources: Array<{ source: string; authority_level: 'statutory' | 'guidance' | 'best_practice' }>
): Pick<InspectionNarrativeResult, 'context_and_self_understanding' | 'strengths_and_secure_practice' | 'areas_of_focus_and_improvement' | 'actions_taken_and_rationale' | 'review_and_impact_monitoring' | 'next_steps_and_priorities' | 'evidence_and_sources_referenced'> {
  try {
    // Try to extract JSON from response (handle markdown code blocks)
    let jsonText = llmResponse.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Use guidance sources from DB queries (no inference)
    // LLM-provided sources are ignored - we only trust DB data
    const finalSources = guidanceSources.length > 0 
      ? guidanceSources 
      : [{ source: 'Source not recorded', authority_level: 'guidance' as const }];

    return {
      context_and_self_understanding: parsed.context_and_self_understanding || 'Unable to generate context section.',
      strengths_and_secure_practice: parsed.strengths_and_secure_practice || 'Unable to generate strengths section.',
      areas_of_focus_and_improvement: parsed.areas_of_focus_and_improvement || 'Unable to generate areas of focus section.',
      actions_taken_and_rationale: parsed.actions_taken_and_rationale || 'Unable to generate actions section.',
      review_and_impact_monitoring: parsed.review_and_impact_monitoring || 'Unable to generate review section.',
      next_steps_and_priorities: parsed.next_steps_and_priorities || 'Unable to generate next steps section.',
      evidence_and_sources_referenced: {
        evidence_categories: parsed.evidence_categories || [],
        guidance_sources: finalSources,
      },
    };
  } catch (error) {
    console.error('[Inspection Narrative] Failed to parse LLM response:', error);
    // Return fallback structure
    return {
      context_and_self_understanding: 'Unable to parse narrative response. Please review gap analysis and actions manually.',
      strengths_and_secure_practice: 'See gap analysis results for areas of strength.',
      areas_of_focus_and_improvement: 'See gap analysis results for priority gaps.',
      actions_taken_and_rationale: 'See actions list for details.',
      review_and_impact_monitoring: 'Review actions and evidence regularly.',
      next_steps_and_priorities: 'Address priority gaps identified in gap analysis.',
      evidence_and_sources_referenced: {
        evidence_categories: [],
        guidance_sources: guidanceSources.length > 0 
          ? guidanceSources 
          : [{ source: 'Source not recorded', authority_level: 'guidance' }],
      },
    };
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function handleGenerateInspectionNarrative(
  args: GenerateInspectionNarrativeInput,
  context: AuthContext,
  requestId?: string,
  sessionId?: string
): Promise<InspectionNarrativeResult | InsufficientDataResult> {
  const startTime = Date.now();
  const { school_id, framework, mode } = args;
  let outcome: TelemetryOutcome = 'success';
  let errorCode: string | undefined;
  let usedLLM = false;
  let model: string | undefined;
  let tokenUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;

  try {
    const { organizationId, supabase } = context;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Verify school_id matches organizationId (security check)
    if (school_id !== organizationId) {
      throw new Error('school_id does not match authenticated organization');
    }

    // Step 1: Gather gap analysis results
    let gapAnalysis: FrameworkGapAnalysisResult | null = null;
    try {
      gapAnalysis = await handleAnalyzeFrameworkGaps(
        { framework, forceRefresh: false },
        context,
        requestId,
        sessionId
      );
    } catch (error) {
      console.warn('[Inspection Narrative] Gap analysis failed:', error);
      outcome = 'insufficient_data';
    }

    // Step 2: Gather actions
    const actions = await gatherActions(supabase, organizationId, framework);

    // Step 3: Gather evidence metadata
    const evidenceMetadata = gapAnalysis
      ? await gatherEvidenceMetadata(supabase, organizationId, framework, gapAnalysis)
      : [];

    // Step 4: Check if sufficient data exists
    if (!hasSufficientData(gapAnalysis, actions, evidenceMetadata)) {
      const missingData = {
        gap_analysis: !gapAnalysis || gapAnalysis.areas_analyzed === 0,
        actions: actions.length === 0,
        evidence: evidenceMetadata.length === 0,
      };

      const suggestedActions: string[] = [];
      if (missingData.gap_analysis) {
        suggestedActions.push('Run gap analysis to identify framework areas and evidence gaps');
      }
      if (missingData.actions) {
        suggestedActions.push('Add improvement actions linked to framework areas');
      }
      if (missingData.evidence) {
        suggestedActions.push('Upload and scan documents to build evidence base');
      }

      const result: InsufficientDataResult = {
        framework,
        mode,
        generated_at: new Date().toISOString(),
        outcome: 'insufficient_data',
        missing_data: missingData,
        message: 'Insufficient data to generate narrative. Please add the missing data and try again.',
        suggested_next_actions: suggestedActions,
      };

      // Calculate grounding metadata for telemetry (even when insufficient)
      const emptyGuidanceSources: Array<{ source: string; authority_level: 'statutory' | 'guidance' | 'best_practice' }> = [];
      const groundingMetadata = calculateGroundingMetadata(
        gapAnalysis,
        actions,
        evidenceMetadata,
        emptyGuidanceSources
      );

      await logTelemetry(
        {
          tool_name: 'generate_inspection_narrative',
          used_llm: false,
          timestamp: new Date().toISOString(),
          organization_id: organizationId,
          user_id: context.userId,
          duration_ms: Date.now() - startTime,
          request_id: requestId,
          session_id: sessionId,
          outcome: 'insufficient_data',
          // Note: grounding_counts and threshold_blocked would go here if telemetry schema supports it
        },
        supabase
      );

      return result;
    }

    // Step 4.5: Check deterministic thresholds
    const thresholdCheck = checkThresholds(gapAnalysis);
    if (thresholdCheck.blocked) {
      const missingData = {
        gap_analysis: !gapAnalysis || gapAnalysis.areas_analyzed === 0,
        actions: actions.length === 0,
        evidence: evidenceMetadata.length === 0,
      };

      const suggestedActions: string[] = [
        `Ensure at least ${thresholdCheck.details?.min_gaps_required || 1} priority gap(s) are identified`,
        `Ensure confidence score is at least ${thresholdCheck.details?.min_confidence_required || 0.5}`,
      ];

      const result: InsufficientDataResult = {
        framework,
        mode,
        generated_at: new Date().toISOString(),
        outcome: 'threshold_blocked',
        missing_data: missingData,
        message: 'Data does not meet minimum thresholds for narrative generation.',
        suggested_next_actions: suggestedActions,
        threshold_details: thresholdCheck.details,
      };

      // Calculate grounding metadata for telemetry
      const emptyGuidanceSources: Array<{ source: string; authority_level: 'statutory' | 'guidance' | 'best_practice' }> = [];
      const groundingMetadata = calculateGroundingMetadata(
        gapAnalysis,
        actions,
        evidenceMetadata,
        emptyGuidanceSources
      );

      await logTelemetry(
        {
          tool_name: 'generate_inspection_narrative',
          used_llm: false,
          timestamp: new Date().toISOString(),
          organization_id: organizationId,
          user_id: context.userId,
          duration_ms: Date.now() - startTime,
          request_id: requestId,
          session_id: sessionId,
          outcome: 'insufficient_data',
          // Note: grounding_counts and threshold_blocked would go here if telemetry schema supports it
        },
        supabase
      );

      return result;
    }

    // Step 5: Call LLM to generate narrative
    usedLLM = true;
    const models = getDefaultModels();
    const selectedModel = process.env.OPENROUTER_SMART_MODEL || models.cheap;

    // Step 5.25: Fetch EEF research for actions (optional, no failure if not found)
    const eefResearch = await fetchEEFResearchForActions(actions, context);

    const prompt = buildNarrativePrompt(gapAnalysis!, actions, evidenceMetadata, eefResearch, mode);

    const llmResponse = await callOpenRouter({
      model: selectedModel,
      system: `You are a professional education consultant helping schools prepare inspection-ready documentation. You use calm, advisory language and never make authoritative claims unless citing statutory sources.`,
      user: prompt,
      temperature: 0.3, // Lower temperature for more consistent, factual output
      maxTokens: 3000,
    });

    model = llmResponse.model;
    tokenUsage = llmResponse.usage || {
      prompt_tokens: estimateTokenUsage(prompt),
      completion_tokens: estimateTokenUsage(llmResponse.text),
      total_tokens: estimateTokenUsage(prompt) + estimateTokenUsage(llmResponse.text),
    };

    // Step 5.5: Gather guidance sources from DB (no inference)
    const guidanceSources = await gatherGuidanceSources(supabase, framework, gapAnalysis!);

    // Step 6: Calculate grounding metadata
    const groundingMetadata = calculateGroundingMetadata(
      gapAnalysis!,
      actions,
      evidenceMetadata,
      guidanceSources
    );

    // Step 7: Parse LLM response
    const parsed = parseNarrativeResponse(llmResponse.text, guidanceSources);

    // Step 8: Build final result
    const result: InspectionNarrativeResult = {
      framework,
      mode,
      generated_at: new Date().toISOString(),
      ...parsed,
      grounding_metadata: groundingMetadata,
      data_quality: {
        has_gap_analysis: !!gapAnalysis,
        has_actions: actions.length > 0,
        has_evidence: evidenceMetadata.length > 0,
        confidence_level: gapAnalysis!.overall_readiness_score < 30 ? 'high' : gapAnalysis!.overall_readiness_score < 60 ? 'medium' : 'low',
      },
      telemetry: {
        used_llm: true,
        model,
        token_usage: tokenUsage,
        duration_ms: Date.now() - startTime,
        grounding_counts: groundingMetadata,
        threshold_blocked: false,
      },
    };

    // Log telemetry
    await logTelemetry(
      {
        tool_name: 'generate_inspection_narrative',
        used_llm: true,
        model,
        timestamp: new Date().toISOString(),
        organization_id: organizationId,
        user_id: context.userId,
        duration_ms: Date.now() - startTime,
        request_id: requestId,
        session_id: sessionId,
        outcome: 'success',
        token_usage: tokenUsage,
        // Note: grounding_counts and threshold_blocked are in result.telemetry, not logged separately
        // as telemetry log structure may not support these fields yet
      },
      supabase
    );

    return result;

  } catch (error) {
    outcome = 'error';
    errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR';

    await logTelemetry(
      {
        tool_name: 'generate_inspection_narrative',
        used_llm,
        model,
        timestamp: new Date().toISOString(),
        organization_id: context.organizationId,
        user_id: context.userId,
        duration_ms: Date.now() - startTime,
        request_id: requestId,
        session_id: sessionId,
        outcome: 'error',
        error_code: errorCode,
        token_usage: tokenUsage,
      },
      context.supabase
    );

    throw error;
  }
}

// ============================================================================
// PILOT EXPORT HELPERS
// ============================================================================

/**
 * Export narrative as markdown
 */
export function exportNarrativeAsMarkdown(result: InspectionNarrativeResult): string {
  const { framework, mode, generated_at } = result;
  
  const modeTitle = {
    inspection_narrative: 'Inspection Narrative',
    sef_draft: 'SEF Draft',
    leadership_brief: 'Leadership Brief',
  }[mode] || 'Narrative';

  return `# ${modeTitle} - ${framework.toUpperCase()}

**Generated:** ${new Date(generated_at).toLocaleDateString()}

---

## Context and Self-Understanding

${result.context_and_self_understanding}

---

## Strengths and Secure Practice

${result.strengths_and_secure_practice}

---

## Areas of Focus and Improvement

${result.areas_of_focus_and_improvement}

---

## Actions Taken and Rationale

${result.actions_taken_and_rationale}

---

## Review and Impact Monitoring

${result.review_and_impact_monitoring}

---

## Next Steps and Priorities

${result.next_steps_and_priorities}

---

## Evidence and Sources Referenced

### Evidence Categories
${result.evidence_and_sources_referenced.evidence_categories.length > 0
  ? result.evidence_and_sources_referenced.evidence_categories.map(cat => `- ${cat}`).join('\n')
  : 'None specified'}

### Guidance Sources
${result.evidence_and_sources_referenced.guidance_sources.map(s => 
  `- **${s.source}** (${s.authority_level})`
).join('\n')}

---

## Grounding Metadata

- Expectations analyzed: ${result.grounding_metadata.expectations_count}
- Requirements identified: ${result.grounding_metadata.requirements_count}
- Priority gaps: ${result.grounding_metadata.gaps_count}
- Actions linked: ${result.grounding_metadata.actions_count}
- Evidence items: ${result.grounding_metadata.evidence_count}
- Sources used: ${result.grounding_metadata.sources_used.join(', ') || 'None'}

---
`;
}

/**
 * Export narrative as plain text
 */
export function exportNarrativeAsPlainText(result: InspectionNarrativeResult): string {
  const { framework, mode, generated_at } = result;
  
  const modeTitle = {
    inspection_narrative: 'Inspection Narrative',
    sef_draft: 'SEF Draft',
    leadership_brief: 'Leadership Brief',
  }[mode] || 'Narrative';

  return `${modeTitle} - ${framework.toUpperCase()}
Generated: ${new Date(generated_at).toLocaleDateString()}

================================================================================
CONTEXT AND SELF-UNDERSTANDING
================================================================================

${result.context_and_self_understanding}

================================================================================
STRENGTHS AND SECURE PRACTICE
================================================================================

${result.strengths_and_secure_practice}

================================================================================
AREAS OF FOCUS AND IMPROVEMENT
================================================================================

${result.areas_of_focus_and_improvement}

================================================================================
ACTIONS TAKEN AND RATIONALE
================================================================================

${result.actions_taken_and_rationale}

================================================================================
REVIEW AND IMPACT MONITORING
================================================================================

${result.review_and_impact_monitoring}

================================================================================
NEXT STEPS AND PRIORITIES
================================================================================

${result.next_steps_and_priorities}

================================================================================
EVIDENCE AND SOURCES REFERENCED
================================================================================

Evidence Categories:
${result.evidence_and_sources_referenced.evidence_categories.length > 0
  ? result.evidence_and_sources_referenced.evidence_categories.map(cat => `  - ${cat}`).join('\n')
  : '  None specified'}

Guidance Sources:
${result.evidence_and_sources_referenced.guidance_sources.map(s => 
  `  - ${s.source} (${s.authority_level})`
).join('\n')}

================================================================================
GROUNDING METADATA
================================================================================

Expectations analyzed: ${result.grounding_metadata.expectations_count}
Requirements identified: ${result.grounding_metadata.requirements_count}
Priority gaps: ${result.grounding_metadata.gaps_count}
Actions linked: ${result.grounding_metadata.actions_count}
Evidence items: ${result.grounding_metadata.evidence_count}
Sources used: ${result.grounding_metadata.sources_used.join(', ') || 'None'}

`;
}

