/**
 * MCP Tool: Precision Teaching & Interventions
 * 
 * Tools for managing interventions, research strategies, and cohort impact analysis.
 * Privacy-first: No PII stored, uses hashed identifiers and aggregated data.
 * 
 * Based on database schema:
 * - research_strategies table
 * - school_interventions table
 * - cohorts table
 * - pulse_checks table
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';

// ============================================================================
// TOOL 1: search_research_strategies
// ============================================================================

export const SearchResearchStrategiesSchema = z.object({
  topic: z.string()
    .min(1, 'Topic is required')
    .describe('Search topic (e.g., "phonics", "metacognition", "feedback", "reading").'),
  
  category: z.string()
    .optional()
    .describe('Optional category filter (e.g., "literacy", "numeracy", "metacognition").'),
  
  minEvidenceStrength: z.number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe('Minimum evidence strength (1-5). Default: 3 (moderate evidence).'),
  
  minImpactMonths: z.number()
    .optional()
    .describe('Minimum impact in months (e.g., 4 for "+4 months").'),
  
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of strategies to return. Default: 10.')
});

export type SearchResearchStrategiesInput = z.infer<typeof SearchResearchStrategiesSchema>;

export interface ResearchStrategy {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  impactMonths: string | null;
  impactMonthsNumeric: number | null;
  evidenceStrength: number | null;
  evidenceTier: number | null;
  category: string | null;
  subcategory: string | null;
  tags: string[] | null;
  url: string | null;
  eefToolkitId: string | null;
  costRating: string | null;
  implementationEffort: string | null;
}

export interface SearchResearchStrategiesResult {
  strategies: ResearchStrategy[];
  count: number;
  searchParams: {
    topic: string;
    category?: string;
    minEvidenceStrength?: number;
    minImpactMonths?: number;
  };
}

/**
 * Handler for search_research_strategies tool
 * 
 * Searches the research_strategies table for evidence-based strategies.
 * Returns "Best Bets" for the AI to suggest to school leaders.
 */
export async function handleSearchResearchStrategies(
  args: SearchResearchStrategiesInput,
  context: AuthContext
): Promise<SearchResearchStrategiesResult> {
  // Build query
  let query = context.supabase
    .from('research_strategies')
    .select('*')
    .eq('is_active', true)
    .order('evidence_strength', { ascending: false })
    .order('impact_months_numeric', { ascending: false })
    .limit(args.limit);
  
  // Topic search (search in title, summary, description, tags)
  if (args.topic) {
    // Use OR to search across multiple fields
    query = query.or(`title.ilike.%${args.topic}%,summary.ilike.%${args.topic}%,description.ilike.%${args.topic}%`);
    // For tags, we need a separate check - tags is an array, so we check if it contains the topic
    // This is a simplified approach - in production, you might want more sophisticated text search
  }
  
  // Category filter
  if (args.category) {
    query = query.eq('category', args.category);
  }
  
  // Evidence strength filter
  if (args.minEvidenceStrength) {
    query = query.gte('evidence_strength', args.minEvidenceStrength);
  } else {
    // Default: minimum moderate evidence
    query = query.gte('evidence_strength', 3);
  }
  
  // Impact months filter
  if (args.minImpactMonths) {
    query = query.gte('impact_months_numeric', args.minImpactMonths);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to search research strategies: ${error.message}`);
  }
  
  // Transform data
  const strategies: ResearchStrategy[] = (data || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    summary: s.summary,
    description: s.description,
    impactMonths: s.impact_months,
    impactMonthsNumeric: s.impact_months_numeric ? parseFloat(s.impact_months_numeric.toString()) : null,
    evidenceStrength: s.evidence_strength,
    evidenceTier: s.evidence_tier,
    category: s.category,
    subcategory: s.subcategory,
    tags: s.tags,
    url: s.url,
    eefToolkitId: s.eef_toolkit_id,
    costRating: s.cost_rating,
    implementationEffort: s.implementation_effort
  }));
  
  return {
    strategies,
    count: strategies.length,
    searchParams: {
      topic: args.topic,
      category: args.category,
      minEvidenceStrength: args.minEvidenceStrength || 3,
      minImpactMonths: args.minImpactMonths
    }
  };
}

// ============================================================================
// TOOL 2: create_intervention
// ============================================================================

export const CreateInterventionSchema = z.object({
  cohortId: z.string()
    .uuid('Cohort ID must be a valid UUID')
    .describe('UUID of the cohort this intervention targets.'),
  
  strategyId: z.string()
    .uuid('Strategy ID must be a valid UUID')
    .describe('UUID of the research strategy being implemented.'),
  
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .describe('Start date for the intervention (YYYY-MM-DD).'),
  
  plannedEndDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .describe('Planned end date (YYYY-MM-DD). Optional.'),
  
  frequency: z.string()
    .optional()
    .describe('Frequency of sessions (e.g., "daily", "weekly", "3x per week").'),
  
  durationMinutes: z.number()
    .int()
    .min(1)
    .optional()
    .describe('Duration per session in minutes.'),
  
  staffLead: z.string()
    .optional()
    .describe('Name of staff member leading the intervention (no PII).'),
  
  intendedOutcomes: z.string()
    .optional()
    .describe('What outcomes are expected from this intervention.'),
  
  successCriteria: z.string()
    .optional()
    .describe('How success will be measured.')
});

export type CreateInterventionInput = z.infer<typeof CreateInterventionSchema>;

export interface Intervention {
  id: string;
  organizationId: string;
  cohortId: string;
  cohortName: string | null;
  strategyId: string;
  strategyTitle: string | null;
  startDate: string;
  plannedEndDate: string | null;
  actualEndDate: string | null;
  status: 'planned' | 'active' | 'completed' | 'paused' | 'cancelled';
  implementationNotes: string | null;
  staffLead: string | null;
  frequency: string | null;
  durationMinutes: number | null;
  intendedOutcomes: string | null;
  successCriteria: string | null;
  actualOutcomes: string | null;
  impactAssessment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterventionResult {
  intervention: Intervention;
  message: string;
}

/**
 * Handler for create_intervention tool
 * 
 * Creates a new intervention on the timeline.
 * Logs the action for tracking and impact analysis.
 */
export async function handleCreateIntervention(
  args: CreateInterventionInput,
  context: AuthContext
): Promise<CreateInterventionResult> {
  const orgId = context.organizationId;
  
  // Validate user has access
  const { data: membership, error: membershipError } = await context.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', context.userId)
    .single();
  
  if (membershipError || !membership) {
    throw new Error(`Access denied: User ${context.userId} is not a member of organization ${orgId}`);
  }
  
  // Verify cohort exists and belongs to organization
  const { data: cohort, error: cohortError } = await context.supabase
    .from('cohorts')
    .select('id, name, organization_id')
    .eq('id', args.cohortId)
    .eq('organization_id', orgId)
    .single();
  
  if (cohortError || !cohort) {
    throw new Error(`Cohort not found or access denied: ${cohortError?.message || 'Cohort does not exist'}`);
  }
  
  // Verify strategy exists
  const { data: strategy, error: strategyError } = await context.supabase
    .from('research_strategies')
    .select('id, title')
    .eq('id', args.strategyId)
    .eq('is_active', true)
    .single();
  
  if (strategyError || !strategy) {
    throw new Error(`Research strategy not found: ${strategyError?.message || 'Strategy does not exist'}`);
  }
  
  // Create intervention
  const { data: intervention, error: insertError } = await context.supabase
    .from('school_interventions')
    .insert({
      organization_id: orgId,
      cohort_id: args.cohortId,
      strategy_id: args.strategyId,
      start_date: args.startDate,
      planned_end_date: args.plannedEndDate || null,
      status: 'planned',
      frequency: args.frequency || null,
      duration_minutes: args.durationMinutes || null,
      staff_lead: args.staffLead || null,
      intended_outcomes: args.intendedOutcomes || null,
      success_criteria: args.successCriteria || null,
      created_by: context.userId
    })
    .select(`
      *,
      cohorts!inner (name),
      research_strategies!inner (title)
    `)
    .single();
  
  if (insertError || !intervention) {
    throw new Error(`Failed to create intervention: ${insertError?.message || 'Unknown error'}`);
  }
  
  const result: Intervention = {
    id: intervention.id,
    organizationId: intervention.organization_id,
    cohortId: intervention.cohort_id,
    cohortName: (intervention.cohorts as any)?.name || null,
    strategyId: intervention.strategy_id,
    strategyTitle: (intervention.research_strategies as any)?.title || null,
    startDate: intervention.start_date,
    plannedEndDate: intervention.planned_end_date,
    actualEndDate: intervention.actual_end_date,
    status: intervention.status as Intervention['status'],
    implementationNotes: intervention.implementation_notes,
    staffLead: intervention.staff_lead,
    frequency: intervention.frequency,
    durationMinutes: intervention.duration_minutes,
    intendedOutcomes: intervention.intended_outcomes,
    successCriteria: intervention.success_criteria,
    actualOutcomes: intervention.actual_outcomes,
    impactAssessment: intervention.impact_assessment,
    createdAt: intervention.created_at,
    updatedAt: intervention.updated_at
  };
  
  return {
    intervention: result,
    message: `Intervention created successfully for cohort "${cohort.name}" using strategy "${strategy.title}"`
  };
}

// ============================================================================
// TOOL 3: analyze_cohort_impact
// ============================================================================

export const AnalyzeCohortImpactSchema = z.object({
  cohortId: z.string()
    .uuid('Cohort ID must be a valid UUID')
    .describe('UUID of the cohort to analyze.'),
  
  includeInterventions: z.boolean()
    .default(true)
    .describe('Include intervention details in the analysis. Default: true.'),
  
  includePulseChecks: z.boolean()
    .default(true)
    .describe('Include pulse check data in the analysis. Default: true.')
});

export type AnalyzeCohortImpactInput = z.infer<typeof AnalyzeCohortImpactSchema>;

export interface IndividualScore {
  studentId: string; // References students.id (anonymous UUID)
  score: number;
  characteristics?: string[]; // Optional: ['pp', 'send', etc.] for filtering
}

export interface PulseCheck {
  id: string;
  date: string;
  topic: string;
  summary: {
    average: number | null;
    participation: number | null;
    cohortSize: number | null;
    scoreDistribution?: Record<string, number>;
    improvementFromBaseline?: number | null;
  };
  individualScores: IndividualScore[]; // Array of anonymous student scores
  notes: string | null;
}

export interface InterventionSummary {
  id: string;
  strategyTitle: string;
  startDate: string;
  status: string;
  pulseCheckCount: number;
  avgScoreTrend: number[] | null;
}

export interface CohortImpactAnalysis {
  cohortId: string;
  cohortName: string;
  organizationId: string;
  totalInterventions: number;
  activeInterventions: number;
  completedInterventions: number;
  totalPulseChecks: number;
  avgScoreTrend: Array<{ date: string; avgScore: number }>;
  participationTrend: Array<{ date: string; participation: number }>;
  interventions: InterventionSummary[];
  pulseChecks: PulseCheck[];
  overallImpact: {
    avgScoreChange: number | null;
    participationTrend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
    recommendation: string;
  };
  cohortSpecificAnalysis?: {
    // Analysis for specific subgroups within the cohort
    ppPupils?: {
      avgScoreChange: number | null;
      studentCount: number;
      trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
    };
    sendPupils?: {
      avgScoreChange: number | null;
      studentCount: number;
      trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
    };
    // Can add more subgroups as needed
  };
}

/**
 * Handler for analyze_cohort_impact tool
 * 
 * Complex Logic: Fetches all pulse_checks for this cohort and calculates the trend over time.
 * Provides impact analysis and recommendations.
 */
export async function handleAnalyzeCohortImpact(
  args: AnalyzeCohortImpactInput,
  context: AuthContext
): Promise<CohortImpactAnalysis> {
  const orgId = context.organizationId;
  
  // Validate user has access
  const { data: membership, error: membershipError } = await context.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', context.userId)
    .single();
  
  if (membershipError || !membership) {
    throw new Error(`Access denied: User ${context.userId} is not a member of organization ${orgId}`);
  }
  
  // Get cohort details
  const { data: cohort, error: cohortError } = await context.supabase
    .from('cohorts')
    .select('id, name, organization_id')
    .eq('id', args.cohortId)
    .eq('organization_id', orgId)
    .single();
  
  if (cohortError || !cohort) {
    throw new Error(`Cohort not found or access denied: ${cohortError?.message || 'Cohort does not exist'}`);
  }
  
  // Get interventions for this cohort
  let interventionsQuery = context.supabase
    .from('school_interventions')
    .select(`
      id,
      strategy_id,
      start_date,
      status,
      research_strategies!inner (title)
    `)
    .eq('cohort_id', args.cohortId)
    .order('start_date', { ascending: false });
  
  const { data: interventions, error: interventionsError } = await interventionsQuery;
  
  if (interventionsError) {
    throw new Error(`Failed to fetch interventions: ${interventionsError.message}`);
  }
  
  // Get pulse checks for all interventions in this cohort
  const interventionIds = (interventions || []).map((i: any) => i.id);
  
  let pulseChecksQuery = context.supabase
    .from('pulse_checks')
    .select('*')
    .in('intervention_id', interventionIds)
    .order('date', { ascending: true });
  
  const { data: pulseChecks, error: pulseChecksError } = await pulseChecksQuery;
  
  if (pulseChecksError) {
    throw new Error(`Failed to fetch pulse checks: ${pulseChecksError.message}`);
  }
  
  // Transform pulse checks - handle new structure with individual_scores
  const transformedPulseChecks: PulseCheck[] = (pulseChecks || []).map((pc: any) => {
    const results = pc.results || {};
    const summary = results.summary || {};
    const individualScores = results.individual_scores || [];
    
    return {
      id: pc.id,
      date: pc.date,
      topic: pc.topic,
      summary: {
        average: summary.average ? parseFloat(summary.average.toString()) : null,
        participation: summary.participation ? parseFloat(summary.participation.toString()) : null,
        cohortSize: summary.cohort_size ? parseInt(summary.cohort_size.toString()) : null,
        scoreDistribution: summary.score_distribution || undefined,
        improvementFromBaseline: summary.improvement_from_baseline ? parseFloat(summary.improvement_from_baseline.toString()) : null
      },
      individualScores: individualScores.map((is: any) => ({
        studentId: is.student_id,
        score: parseFloat(is.score.toString()),
        characteristics: is.characteristics || []
      })),
      notes: pc.notes
    };
  });
  
  // Calculate trends from summary data (for quick overview)
  const avgScoreTrend = transformedPulseChecks
    .filter(pc => pc.summary.average !== null)
    .map(pc => ({ date: pc.date, avgScore: pc.summary.average! }));
  
  const participationTrend = transformedPulseChecks
    .filter(pc => pc.summary.participation !== null)
    .map(pc => ({ date: pc.date, participation: pc.summary.participation! }));
  
  // Calculate overall impact from summary averages
  let avgScoreChange: number | null = null;
  if (avgScoreTrend.length >= 2) {
    const firstScore = avgScoreTrend[0].avgScore;
    const lastScore = avgScoreTrend[avgScoreTrend.length - 1].avgScore;
    avgScoreChange = lastScore - firstScore;
  }
  
  // Calculate impact from individual scores (more accurate)
  // This allows tracking specific cohorts (e.g., PP pupils) even if they're a subset
  let individualScoreChange: number | null = null;
  if (transformedPulseChecks.length >= 2) {
    // Get first and last pulse checks with individual scores
    const firstPulseCheck = transformedPulseChecks.find(pc => pc.individualScores.length > 0);
    const lastPulseCheck = transformedPulseChecks.slice().reverse().find(pc => pc.individualScores.length > 0);
    
    if (firstPulseCheck && lastPulseCheck && firstPulseCheck.id !== lastPulseCheck.id) {
      // Calculate average improvement for students present in both checks
      const firstScores = new Map(firstPulseCheck.individualScores.map(is => [is.studentId, is.score]));
      const lastScores = new Map(lastPulseCheck.individualScores.map(is => [is.studentId, is.score]));
      
      // Find students present in both checks
      const commonStudents: string[] = [];
      firstScores.forEach((_, studentId) => {
        if (lastScores.has(studentId)) {
          commonStudents.push(studentId);
        }
      });
      
      if (commonStudents.length > 0) {
        // Calculate average improvement for these students
        const improvements = commonStudents.map(studentId => {
          const firstScore = firstScores.get(studentId)!;
          const lastScore = lastScores.get(studentId)!;
          return lastScore - firstScore;
        });
        
        individualScoreChange = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
      }
    }
  }
  
  // Use individual score change if available (more accurate), otherwise fall back to summary
  const finalScoreChange = individualScoreChange !== null ? individualScoreChange : avgScoreChange;
  
  let participationTrendDirection: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data' = 'insufficient_data';
  if (participationTrend.length >= 2) {
    const firstParticipation = participationTrend[0].participation;
    const lastParticipation = participationTrend[participationTrend.length - 1].participation;
    const change = lastParticipation - firstParticipation;
    
    if (Math.abs(change) < 5) {
      participationTrendDirection = 'stable';
    } else if (change > 0) {
      participationTrendDirection = 'increasing';
    } else {
      participationTrendDirection = 'decreasing';
    }
  }
  
  // Calculate cohort-specific analysis (e.g., PP pupils, SEND pupils)
  const cohortSpecificAnalysis: CohortImpactAnalysis['cohortSpecificAnalysis'] = {};
  
  // Analyze PP pupils if we have individual scores with characteristics
  const ppScores: Array<{ date: string; studentId: string; score: number }> = [];
  transformedPulseChecks.forEach(pc => {
    pc.individualScores.forEach(is => {
      if (is.characteristics?.includes('pp')) {
        ppScores.push({ date: pc.date, studentId: is.studentId, score: is.score });
      }
    });
  });
  
  if (ppScores.length > 0) {
    // Group by student and calculate their improvement
    const ppStudents = new Map<string, Array<{ date: string; score: number }>>();
    ppScores.forEach(ps => {
      if (!ppStudents.has(ps.studentId)) {
        ppStudents.set(ps.studentId, []);
      }
      ppStudents.get(ps.studentId)!.push({ date: ps.date, score: ps.score });
    });
    
    // Calculate average improvement for PP pupils
    const ppImprovements: number[] = [];
    ppStudents.forEach((scores, studentId) => {
      if (scores.length >= 2) {
        scores.sort((a, b) => a.date.localeCompare(b.date));
        const firstScore = scores[0].score;
        const lastScore = scores[scores.length - 1].score;
        ppImprovements.push(lastScore - firstScore);
      }
    });
    
    if (ppImprovements.length > 0) {
      const ppAvgChange = ppImprovements.reduce((sum, imp) => sum + imp, 0) / ppImprovements.length;
      cohortSpecificAnalysis.ppPupils = {
        avgScoreChange: ppAvgChange,
        studentCount: ppStudents.size,
        trend: ppAvgChange > 5 ? 'improving' : ppAvgChange < -5 ? 'declining' : 'stable'
      };
    }
  }
  
  // Similar analysis for SEND pupils
  const sendScores: Array<{ date: string; studentId: string; score: number }> = [];
  transformedPulseChecks.forEach(pc => {
    pc.individualScores.forEach(is => {
      if (is.characteristics?.includes('send')) {
        sendScores.push({ date: pc.date, studentId: is.studentId, score: is.score });
      }
    });
  });
  
  if (sendScores.length > 0) {
    const sendStudents = new Map<string, Array<{ date: string; score: number }>>();
    sendScores.forEach(ss => {
      if (!sendStudents.has(ss.studentId)) {
        sendStudents.set(ss.studentId, []);
      }
      sendStudents.get(ss.studentId)!.push({ date: ss.date, score: ss.score });
    });
    
    const sendImprovements: number[] = [];
    sendStudents.forEach((scores, studentId) => {
      if (scores.length >= 2) {
        scores.sort((a, b) => a.date.localeCompare(b.date));
        const firstScore = scores[0].score;
        const lastScore = scores[scores.length - 1].score;
        sendImprovements.push(lastScore - firstScore);
      }
    });
    
    if (sendImprovements.length > 0) {
      const sendAvgChange = sendImprovements.reduce((sum, imp) => sum + imp, 0) / sendImprovements.length;
      cohortSpecificAnalysis.sendPupils = {
        avgScoreChange: sendAvgChange,
        studentCount: sendStudents.size,
        trend: sendAvgChange > 5 ? 'improving' : sendAvgChange < -5 ? 'declining' : 'stable'
      };
    }
  }
  
  // Generate recommendation based on individual score analysis (more accurate)
  let recommendation = '';
  const scoreChangeToUse = finalScoreChange !== null ? finalScoreChange : avgScoreChange;
  
    if (scoreChangeToUse !== null && scoreChangeToUse > 5) {
      recommendation = 'Strong positive impact observed. Consider continuing or scaling this intervention.';
      if (cohortSpecificAnalysis.ppPupils && cohortSpecificAnalysis.ppPupils.avgScoreChange !== null && cohortSpecificAnalysis.ppPupils.avgScoreChange > 5) {
        recommendation += ` Notably, disadvantaged pupils (PP) showed strong improvement (+${cohortSpecificAnalysis.ppPupils.avgScoreChange.toFixed(1)} points).`;
      }
    } else if (scoreChangeToUse !== null && scoreChangeToUse > 0) {
      recommendation = 'Moderate positive impact. Review implementation and consider adjustments.';
    } else if (scoreChangeToUse !== null && scoreChangeToUse < 0) {
      recommendation = 'Negative or no impact observed. Review strategy and consider alternative approaches.';
      if (cohortSpecificAnalysis.ppPupils && cohortSpecificAnalysis.ppPupils.avgScoreChange !== null && cohortSpecificAnalysis.ppPupils.avgScoreChange < 0) {
        recommendation += ` Disadvantaged pupils (PP) are not making progress - urgent review needed.`;
      }
  } else {
    recommendation = 'Insufficient data to assess impact. Continue monitoring and collecting pulse check data.';
  }
  
  // Build intervention summaries
  const interventionSummaries: InterventionSummary[] = (interventions || []).map((intervention: any) => {
    // Get pulse checks for this specific intervention
    const thisInterventionPulseChecks = transformedPulseChecks.filter(
      pc => {
        // Find the pulse check's intervention_id from the original data
        const originalPc = pulseChecks?.find((p: any) => p.id === pc.id);
        return originalPc?.intervention_id === intervention.id;
      }
    );
    
    // Extract scores from individual_scores (more accurate than summary)
    const scores: number[] = [];
    thisInterventionPulseChecks.forEach(pc => {
      if (pc.individualScores.length > 0) {
        // Calculate average from individual scores for this pulse check
        const avg = pc.individualScores.reduce((sum, is) => sum + is.score, 0) / pc.individualScores.length;
        scores.push(avg);
      } else if (pc.summary.average !== null) {
        // Fallback to summary if individual scores not available
        scores.push(pc.summary.average);
      }
    });
    
    return {
      id: intervention.id,
      strategyTitle: (intervention.research_strategies as any)?.title || 'Unknown',
      startDate: intervention.start_date,
      status: intervention.status,
      pulseCheckCount: thisInterventionPulseChecks.length,
      avgScoreTrend: scores.length > 0 ? scores : null
    };
  });
  
  return {
    cohortId: args.cohortId,
    cohortName: cohort.name,
    organizationId: orgId,
    totalInterventions: interventions?.length || 0,
    activeInterventions: interventions?.filter((i: any) => i.status === 'active').length || 0,
    completedInterventions: interventions?.filter((i: any) => i.status === 'completed').length || 0,
    totalPulseChecks: transformedPulseChecks.length,
    avgScoreTrend,
    participationTrend,
    interventions: args.includeInterventions ? interventionSummaries : [],
    pulseChecks: args.includePulseChecks ? transformedPulseChecks : [],
    overallImpact: {
      avgScoreChange: finalScoreChange !== null ? finalScoreChange : avgScoreChange,
      participationTrend: participationTrendDirection,
      recommendation
    },
    cohortSpecificAnalysis: Object.keys(cohortSpecificAnalysis).length > 0 ? cohortSpecificAnalysis : undefined
  };
}

