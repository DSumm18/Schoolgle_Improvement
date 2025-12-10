/**
 * MCP Tool: get_financial_records
 * 
 * Retrieves financial records (Pupil Premium, Sports Premium) for the authenticated organization.
 * Automatically scoped to tenant context - organizationId parameter is ignored if provided.
 * 
 * Based on actual database schema:
 * - pupil_premium_data table
 * - pp_spending table
 * - sports_premium_data table
 * - sports_premium_spending table
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';

/**
 * Zod schema matching actual pupil_premium_data table columns
 * 
 * Actual columns from schema:
 * - id: uuid
 * - organization_id: uuid (injected from context, not user input)
 * - academic_year: text (e.g., '2024-25')
 * - total_pupils: integer
 * - pp_pupils: integer
 * - pp_percentage: decimal(5,2)
 * - pp_allocation: decimal(12,2)
 * - recovery_premium: decimal(12,2)
 * - total_funding: decimal(12,2)
 * - barriers: jsonb
 * - outcomes: jsonb
 * - pp_attendance: decimal(5,2)
 * - non_pp_attendance: decimal(5,2)
 * - pp_persistent_absence: decimal(5,2)
 */
export const GetFinancialRecordsSchema = z.object({
  // organizationId is NOT in schema - it's injected from TenantContext
  // If user provides it, we ignore it for security
  
  fiscalYear: z.string()
    .regex(/^\d{4}-\d{2}$/, 'Academic year must be in format YYYY-YY (e.g., 2024-25)')
    .optional()
    .describe('Academic year in YYYY-YY format (e.g., "2024-25"). If omitted, returns current academic year data.'),
  
  category: z.enum(['pupil_premium', 'sports_premium', 'both'])
    .default('both')
    .describe('Financial category filter. "pupil_premium" returns PP data only, "sports_premium" returns Sports Premium only, "both" returns all financial records.'),
  
  includeSpending: z.boolean()
    .default(false)
    .describe('If true, includes spending breakdown (pp_spending and sports_premium_spending tables). Default: false.')
});

export type GetFinancialRecordsInput = z.infer<typeof GetFinancialRecordsSchema>;

export interface FinancialRecordsResult {
  pupilPremium?: {
    data: {
      id: string;
      academicYear: string;
      totalPupils: number | null;
      ppPupils: number | null;
      ppPercentage: number | null;
      ppAllocation: number | null;
      recoveryPremium: number | null;
      totalFunding: number | null;
      barriers: any; // jsonb
      outcomes: any; // jsonb
      ppAttendance: number | null;
      nonPpAttendance: number | null;
      ppPersistentAbsence: number | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    spending?: Array<{
      id: string;
      tier: 1 | 2 | 3;
      activityName: string;
      description: string | null;
      eefStrategyId: string | null;
      eefImpactMonths: number | null;
      allocatedAmount: number | null;
      actualSpent: number | null;
      barrierIds: string[] | null;
      intendedOutcomes: string | null;
      successCriteria: string | null;
      actualImpact: string | null;
      impactRating: 'high' | 'moderate' | 'low' | 'not_measured' | null;
      staffLead: string | null;
    }>;
  };
  
  sportsPremium?: {
    data: {
      id: string;
      academicYear: string;
      allocation: number | null;
      carriedForward: number | null;
      totalAvailable: number | null;
      swimming25mPercentage: number | null;
      swimmingStrokesPercentage: number | null;
      swimmingRescuePercentage: number | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    spending?: Array<{
      id: string;
      keyIndicator: 1 | 2 | 3 | 4 | 5;
      activityName: string;
      description: string | null;
      allocatedAmount: number | null;
      actualSpent: number | null;
      intendedImpact: string | null;
      actualImpact: string | null;
      isSustainable: boolean;
      sustainabilityPlan: string | null;
    }>;
  };
  
  fiscalYear: string;
  organizationId: string;
}

/**
 * Handler for get_financial_records tool
 * 
 * CRITICAL SECURITY: organizationId is injected from TenantContext, NOT from user input.
 * Any organizationId provided in args is ignored.
 */
export async function handleGetFinancialRecords(
  args: GetFinancialRecordsInput,
  context: AuthContext
): Promise<FinancialRecordsResult> {
  const orgId = context.organizationId; // CRITICAL: Use context, not args
  
  // Validate user has access (RLS should handle this, but double-check)
  const { data: membership, error: membershipError } = await context.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', context.userId)
    .single();
  
  if (membershipError || !membership) {
    throw new Error(`Access denied: User ${context.userId} is not a member of organization ${orgId}`);
  }
  
  // Determine academic year (default to current if not provided)
  const academicYear = args.fiscalYear || getCurrentAcademicYear();
  
  const result: FinancialRecordsResult = {
    fiscalYear: academicYear,
    organizationId: orgId
  };
  
  // Fetch Pupil Premium data if requested
  if (args.category === 'pupil_premium' || args.category === 'both') {
    const { data: ppData, error: ppError } = await context.supabase
      .from('pupil_premium_data')
      .select('*')
      .eq('organization_id', orgId) // RLS will enforce this automatically
      .eq('academic_year', academicYear)
      .single();
    
    if (ppError && ppError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to fetch Pupil Premium data: ${ppError.message}`);
    }
    
    result.pupilPremium = {
      data: ppData ? {
        id: ppData.id,
        academicYear: ppData.academic_year,
        totalPupils: ppData.total_pupils,
        ppPupils: ppData.pp_pupils,
        ppPercentage: ppData.pp_percentage ? parseFloat(ppData.pp_percentage.toString()) : null,
        ppAllocation: ppData.pp_allocation ? parseFloat(ppData.pp_allocation.toString()) : null,
        recoveryPremium: ppData.recovery_premium ? parseFloat(ppData.recovery_premium.toString()) : null,
        totalFunding: ppData.total_funding ? parseFloat(ppData.total_funding.toString()) : null,
        barriers: ppData.barriers,
        outcomes: ppData.outcomes,
        ppAttendance: ppData.pp_attendance ? parseFloat(ppData.pp_attendance.toString()) : null,
        nonPpAttendance: ppData.non_pp_attendance ? parseFloat(ppData.non_pp_attendance.toString()) : null,
        ppPersistentAbsence: ppData.pp_persistent_absence ? parseFloat(ppData.pp_persistent_absence.toString()) : null,
        createdAt: ppData.created_at,
        updatedAt: ppData.updated_at
      } : null
    };
    
    // Fetch spending if requested
    if (args.includeSpending && result.pupilPremium.data) {
      const { data: spending, error: spendingError } = await context.supabase
        .from('pp_spending')
        .select('*')
        .eq('organization_id', orgId)
        .eq('academic_year', academicYear)
        .order('tier', { ascending: true });
      
      if (spendingError) {
        throw new Error(`Failed to fetch PP spending: ${spendingError.message}`);
      }
      
      result.pupilPremium.spending = (spending || []).map(s => ({
        id: s.id,
        tier: s.tier as 1 | 2 | 3,
        activityName: s.activity_name,
        description: s.description,
        eefStrategyId: s.eef_strategy_id,
        eefImpactMonths: s.eef_impact_months ? parseFloat(s.eef_impact_months.toString()) : null,
        allocatedAmount: s.allocated_amount ? parseFloat(s.allocated_amount.toString()) : null,
        actualSpent: s.actual_spent ? parseFloat(s.actual_spent.toString()) : null,
        barrierIds: s.barrier_ids,
        intendedOutcomes: s.intended_outcomes,
        successCriteria: s.success_criteria,
        actualImpact: s.actual_impact,
        impactRating: s.impact_rating as 'high' | 'moderate' | 'low' | 'not_measured' | null,
        staffLead: s.staff_lead
      }));
    }
  }
  
  // Fetch Sports Premium data if requested
  if (args.category === 'sports_premium' || args.category === 'both') {
    const { data: sportsData, error: sportsError } = await context.supabase
      .from('sports_premium_data')
      .select('*')
      .eq('organization_id', orgId)
      .eq('academic_year', academicYear)
      .single();
    
    if (sportsError && sportsError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch Sports Premium data: ${sportsError.message}`);
    }
    
    result.sportsPremium = {
      data: sportsData ? {
        id: sportsData.id,
        academicYear: sportsData.academic_year,
        allocation: sportsData.allocation ? parseFloat(sportsData.allocation.toString()) : null,
        carriedForward: sportsData.carried_forward ? parseFloat(sportsData.carried_forward.toString()) : null,
        totalAvailable: sportsData.total_available ? parseFloat(sportsData.total_available.toString()) : null,
        swimming25mPercentage: sportsData.swimming_25m_percentage ? parseFloat(sportsData.swimming_25m_percentage.toString()) : null,
        swimmingStrokesPercentage: sportsData.swimming_strokes_percentage ? parseFloat(sportsData.swimming_strokes_percentage.toString()) : null,
        swimmingRescuePercentage: sportsData.swimming_rescue_percentage ? parseFloat(sportsData.swimming_rescue_percentage.toString()) : null,
        createdAt: sportsData.created_at,
        updatedAt: sportsData.updated_at
      } : null
    };
    
    // Fetch spending if requested
    if (args.includeSpending && result.sportsPremium.data) {
      const { data: spending, error: spendingError } = await context.supabase
        .from('sports_premium_spending')
        .select('*')
        .eq('organization_id', orgId)
        .eq('academic_year', academicYear)
        .order('key_indicator', { ascending: true });
      
      if (spendingError) {
        throw new Error(`Failed to fetch Sports Premium spending: ${spendingError.message}`);
      }
      
      result.sportsPremium.spending = (spending || []).map(s => ({
        id: s.id,
        keyIndicator: s.key_indicator as 1 | 2 | 3 | 4 | 5,
        activityName: s.activity_name,
        description: s.description,
        allocatedAmount: s.allocated_amount ? parseFloat(s.allocated_amount.toString()) : null,
        actualSpent: s.actual_spent ? parseFloat(s.actual_spent.toString()) : null,
        intendedImpact: s.intended_impact,
        actualImpact: s.actual_impact,
        isSustainable: s.is_sustainable,
        sustainabilityPlan: s.sustainability_plan
      }));
    }
  }
  
  return result;
}

/**
 * Helper: Get current academic year in YYYY-YY format
 * UK academic year runs from September to August
 */
function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  
  // If before September, use previous year
  if (month < 9) {
    return `${year - 1}-${year.toString().slice(-2)}`;
  } else {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
}

