/**
 * MCP Tool: get_inspection_risk_profile
 * 
 * Calculates inspection risk based on:
 * - Time since last inspection
 * - Headteacher tenure (change = risk)
 * - Performance trends
 * - School characteristics from DfE data
 * 
 * Uses existing DfE tables in dfe_data schema (no ingestion needed).
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';

// ============================================================================
// ZOD SCHEMA
// ============================================================================

export const GetInspectionRiskProfileSchema = z.object({
  urn: z.string()
    .optional()
    .describe('Unique Reference Number (URN). If omitted, uses organization.urn from context.'),
});

export type GetInspectionRiskProfileInput = z.infer<typeof GetInspectionRiskProfileSchema>;

export interface InspectionRiskProfile {
  urn: string;
  schoolName: string;
  riskScore: number; // 0-100, higher = more risk
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedWindow: {
    earliest: string; // ISO date
    latest: string; // ISO date
  };
  lastInspection: {
    date: string | null;
    rating: string | null;
    daysSince: number | null;
  };
  headteacher: {
    startDate: string | null;
    tenureMonths: number | null;
    isNew: boolean; // < 12 months = new
  };
  performanceTrends: {
    ks2Progress: number | null; // Progress score
    ks2Attainment: number | null; // Average scaled score
    ks4Progress: number | null;
    ks4Attainment: number | null;
    trend: 'improving' | 'stable' | 'declining' | 'unknown';
  };
  riskFactors: Array<{
    category: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    impact: number; // Contribution to risk score (0-100)
  }>;
  recommendations: string[];
}

// ============================================================================
// RISK CALCULATION LOGIC
// ============================================================================

/**
 * Calculate risk score based on multiple factors
 * Formula: Time + Change + Performance = Risk
 */
function calculateRiskScore(
  daysSinceInspection: number | null,
  headteacherTenureMonths: number | null,
  lastRating: string | null,
  performanceTrend: 'improving' | 'stable' | 'declining' | 'unknown'
): number {
  let riskScore = 0;

  // Factor 1: Time since last inspection (0-40 points)
  if (daysSinceInspection !== null) {
    if (daysSinceInspection > 2000) { // > 5.5 years
      riskScore += 40;
    } else if (daysSinceInspection > 1500) { // > 4 years
      riskScore += 30;
    } else if (daysSinceInspection > 1000) { // > 2.7 years
      riskScore += 20;
    } else if (daysSinceInspection > 500) { // > 1.4 years
      riskScore += 10;
    }
  } else {
    // No inspection data = medium risk
    riskScore += 25;
  }

  // Factor 2: Headteacher change (0-30 points)
  if (headteacherTenureMonths !== null) {
    if (headteacherTenureMonths < 6) {
      riskScore += 30; // Very new head = high risk
    } else if (headteacherTenureMonths < 12) {
      riskScore += 20; // New head = medium-high risk
    } else if (headteacherTenureMonths < 24) {
      riskScore += 10; // Recent head = medium risk
    }
  }

  // Factor 3: Last rating (0-20 points)
  if (lastRating) {
    const rating = lastRating.toLowerCase();
    if (rating.includes('inadequate') || rating.includes('serious weaknesses')) {
      riskScore += 20;
    } else if (rating.includes('requires improvement') || rating.includes('special measures')) {
      riskScore += 15;
    } else if (rating.includes('satisfactory')) {
      riskScore += 10;
    }
  }

  // Factor 4: Performance trend (0-10 points)
  if (performanceTrend === 'declining') {
    riskScore += 10;
  } else if (performanceTrend === 'stable') {
    riskScore += 5;
  }

  return Math.min(riskScore, 100); // Cap at 100
}

/**
 * Predict inspection window based on risk factors
 */
function predictInspectionWindow(
  daysSinceInspection: number | null,
  riskScore: number
): { earliest: string; latest: string } {
  const now = new Date();
  let earliestMonths = 6;
  let latestMonths = 18;

  // Higher risk = sooner inspection
  if (riskScore >= 70) {
    earliestMonths = 0; // Could be any time
    latestMonths = 6;
  } else if (riskScore >= 50) {
    earliestMonths = 3;
    latestMonths = 12;
  } else if (riskScore >= 30) {
    earliestMonths = 6;
    latestMonths = 18;
  } else {
    earliestMonths = 12;
    latestMonths = 24;
  }

  // If it's been a long time, inspection is more likely soon
  if (daysSinceInspection && daysSinceInspection > 1500) {
    earliestMonths = Math.max(0, earliestMonths - 3);
    latestMonths = Math.max(6, latestMonths - 6);
  }

  const earliest = new Date(now);
  earliest.setMonth(earliest.getMonth() + earliestMonths);

  const latest = new Date(now);
  latest.setMonth(latest.getMonth() + latestMonths);

  return {
    earliest: earliest.toISOString().split('T')[0],
    latest: latest.toISOString().split('T')[0],
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export async function handleGetInspectionRiskProfile(
  args: GetInspectionRiskProfileInput,
  context: AuthContext
): Promise<InspectionRiskProfile> {
  const orgId = context.organizationId;

  // Get organization URN
  const { data: org, error: orgError } = await context.supabase
    .from('organizations')
    .select('urn, name')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    throw new Error(`Organization not found: ${orgError?.message || 'Unknown error'}`);
  }

  const urn = args.urn || org.urn;
  if (!urn) {
    throw new Error('URN is required. Please provide urn parameter or ensure organization has a URN.');
  }

  // Query DfE data from dfe_data schema (via public view if exists, or direct query)
  // Try public.schools view first (created by create-dfe-views.sql)
  let schoolData: any = null;
  let inspectionData: any = null;
  let performanceData: any = null;

  // Query 1: School basic info from DfE
  const { data: school, error: schoolError } = await context.supabase
    .from('schools')
    .select('*')
    .eq('urn', parseInt(urn))
    .single();

  if (!schoolError && school) {
    schoolData = school;
  } else {
    // Fallback: Try direct query to dfe_data schema (requires service role or RPC)
    console.warn('Could not query schools view, trying alternative methods');
  }

  // Query 2: Last inspection data using RPC function
  const { data: inspections, error: inspectionError } = await context.supabase
    .rpc('get_last_inspection', { lookup_urn: urn });

  if (!inspectionError && inspections) {
    inspectionData = inspections;
  } else {
    console.warn('Error fetching last inspection:', inspectionError);
  }

  // Query 3: Performance data (KS2/KS4) using RPC function
  const { data: performance, error: perfError } = await context.supabase
    .rpc('get_performance_trends', { lookup_urn: urn });

  if (!perfError && performance) {
    performanceData = performance;
  } else {
    console.warn('Error fetching performance trends:', perfError);
  }

  // Query 4: Headteacher data using RPC function
  const { data: headteacher, error: htError } = await context.supabase
    .rpc('get_headteacher_info', { lookup_urn: urn });

  if (htError) {
    console.warn('Error fetching headteacher info:', htError);
  }

  // Calculate days since last inspection
  // inspectionData is now JSON from RPC function
  let daysSinceInspection: number | null = null;
  let lastInspectionDate: string | null = null;
  let lastRating: string | null = null;

  if (inspectionData && typeof inspectionData === 'object') {
    lastInspectionDate = inspectionData.date || null;
    lastRating = inspectionData.rating || null;

    if (lastInspectionDate) {
      const inspectionDate = new Date(lastInspectionDate);
      const now = new Date();
      daysSinceInspection = Math.floor((now.getTime() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // Calculate headteacher tenure
  // headteacher is now JSON from RPC function
  let headteacherStartDate: string | null = null;
  let headteacherTenureMonths: number | null = null;
  let isNewHeadteacher = false;

  if (headteacher && typeof headteacher === 'object') {
    headteacherStartDate = headteacher.start_date || null;
    headteacherTenureMonths = headteacher.tenure_months || null;
    isNewHeadteacher = headteacher.is_new || false;
  }

  // Determine performance trend
  // performanceData is now JSON from RPC function
  let performanceTrend: 'improving' | 'stable' | 'declining' | 'unknown' = 'unknown';
  if (performanceData && typeof performanceData === 'object') {
    const trend = performanceData.trend;
    if (trend === 'improving') {
      performanceTrend = 'improving';
    } else if (trend === 'declining') {
      performanceTrend = 'declining';
    } else if (trend === 'stable') {
      performanceTrend = 'stable';
    } else {
      performanceTrend = 'unknown';
    }
  }

  // Calculate risk score
  const riskScore = calculateRiskScore(
    daysSinceInspection,
    headteacherTenureMonths,
    lastRating,
    performanceTrend
  );

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore >= 70) {
    riskLevel = 'critical';
  } else if (riskScore >= 50) {
    riskLevel = 'high';
  } else if (riskScore >= 30) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Predict inspection window
  const predictedWindow = predictInspectionWindow(daysSinceInspection, riskScore);

  // Build risk factors
  const riskFactors: InspectionRiskProfile['riskFactors'] = [];

  if (daysSinceInspection && daysSinceInspection > 1500) {
    riskFactors.push({
      category: 'Time Since Inspection',
      severity: 'high',
      description: `Last inspection was ${Math.floor(daysSinceInspection / 365)} years ago`,
      impact: 30,
    });
  }

  if (isNewHeadteacher) {
    riskFactors.push({
      category: 'Leadership Change',
      severity: 'high',
      description: `Headteacher in post for ${headteacherTenureMonths} months`,
      impact: 25,
    });
  }

  if (lastRating && (lastRating.includes('inadequate') || lastRating.includes('requires improvement'))) {
    riskFactors.push({
      category: 'Previous Rating',
      severity: 'high',
      description: `Last inspection: ${lastRating}`,
      impact: 20,
    });
  }

  if (performanceTrend === 'declining') {
    riskFactors.push({
      category: 'Performance Trend',
      severity: 'medium',
      description: 'Performance indicators showing decline',
      impact: 10,
    });
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (riskScore >= 50) {
    recommendations.push('Prioritize evidence gathering and self-evaluation');
    recommendations.push('Review and update statutory documents (SEF, SDP)');
  }
  if (isNewHeadteacher) {
    recommendations.push('Ensure new headteacher is fully briefed on inspection readiness');
  }
  if (daysSinceInspection && daysSinceInspection > 1500) {
    recommendations.push('Prepare for potential short-notice inspection');
  }

  return {
    urn,
    schoolName: schoolData?.name || org.name,
    riskScore,
    riskLevel,
    predictedWindow,
    lastInspection: {
      date: lastInspectionDate,
      rating: lastRating,
      daysSince: daysSinceInspection,
    },
    headteacher: {
      startDate: headteacherStartDate,
      tenureMonths: headteacherTenureMonths,
      isNew: isNewHeadteacher,
    },
    performanceTrends: {
      ks2Progress: performanceData?.ks2_progress || null,
      ks2Attainment: performanceData?.ks2_attainment || null,
      ks4Progress: performanceData?.ks4_progress || null,
      ks4Attainment: performanceData?.ks4_attainment || null,
      trend: performanceTrend,
    },
    riskFactors,
    recommendations,
  };
}

