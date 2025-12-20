/**
 * MCP Tool: get_assessments
 * 
 * Retrieves Ofsted assessment data for the authenticated organization.
 * Returns school self-assessments and AI-generated assessments for Ofsted subcategories.
 * Automatically scoped to tenant context - organizationId parameter is ignored if provided.
 * 
 * Based on actual database schema:
 * - ofsted_assessments table
 * - ofsted_subcategories table (joined)
 * - ofsted_categories table (joined)
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';

/**
 * Zod schema matching actual ofsted_assessments table columns
 * 
 * Actual columns from schema:
 * - id: uuid
 * - organization_id: uuid (injected from context, not user input)
 * - subcategory_id: text (references ofsted_subcategories.id)
 * - school_rating: text ('exceptional' | 'strong_standard' | 'expected_standard' | 'needs_attention' | 'urgent_improvement' | 'not_assessed')
 * - school_rationale: text
 * - ai_rating: text (same enum as school_rating)
 * - ai_rationale: text
 * - ai_confidence: decimal(3,2) (0-1)
 * - evidence_count: integer
 * - evidence_quality_score: decimal(3,2) (0-1)
 * - assessed_by: text (references users.id)
 * - assessed_at: timestamp
 */
export const GetAssessmentsSchema = z.object({
  // organizationId is NOT in schema - it's injected from TenantContext
  // If user provides it, we ignore it for security
  
  subcategoryId: z.string()
    .optional()
    .describe('Optional filter by Ofsted subcategory ID (e.g., "curriculum-teaching-1"). If omitted, returns all assessments.'),
  
  categoryId: z.string()
    .optional()
    .describe('Optional filter by Ofsted category ID (e.g., "curriculum-teaching", "inclusion"). If omitted, returns all categories.'),
  
  includeNotAssessed: z.boolean()
    .default(false)
    .describe('If true, includes subcategories with "not_assessed" ratings. Default: false (only returns assessed subcategories).'),
  
  ratingFilter: z.enum(['exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement'])
    .optional()
    .describe('Optional filter by rating. Returns assessments matching this rating (checks both school_rating and ai_rating).'),
  
  minEvidenceCount: z.number()
    .int()
    .min(0)
    .default(0)
    .describe('Minimum evidence count threshold. Default: 0 (returns all regardless of evidence count).'),
  
  minQualityScore: z.number()
    .min(0)
    .max(1)
    .optional()
    .describe('Minimum evidence quality score (0-1). If provided, only returns assessments with quality_score >= this value.'),
});

export type GetAssessmentsInput = z.infer<typeof GetAssessmentsSchema>;

export interface AssessmentResult {
  id: string;
  subcategoryId: string;
  subcategoryName: string;
  categoryId: string;
  categoryName: string;
  schoolRating: 'exceptional' | 'strong_standard' | 'expected_standard' | 'needs_attention' | 'urgent_improvement' | 'not_assessed' | null;
  schoolRationale: string | null;
  aiRating: 'exceptional' | 'strong_standard' | 'expected_standard' | 'needs_attention' | 'urgent_improvement' | 'not_assessed' | null;
  aiRationale: string | null;
  aiConfidence: number | null;
  evidenceCount: number;
  evidenceQualityScore: number | null;
  assessedBy: string | null;
  assessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentsResult {
  assessments: AssessmentResult[];
  count: number;
  organizationId: string;
  filters: {
    subcategoryId?: string;
    categoryId?: string;
    includeNotAssessed: boolean;
    ratingFilter?: string;
    minEvidenceCount: number;
    minQualityScore?: number;
  };
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

/**
 * Handler for get_assessments tool
 * 
 * CRITICAL SECURITY: organizationId is injected from TenantContext, NOT from user input.
 * Any organizationId provided in args is ignored.
 */
export async function handleGetAssessments(
  args: GetAssessmentsInput,
  context: AuthContext
): Promise<AssessmentsResult> {
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
  
  // Build query with RLS-enforced filtering
  let query = context.supabase
    .from('ofsted_assessments')
    .select(`
      id,
      subcategory_id,
      school_rating,
      school_rationale,
      ai_rating,
      ai_rationale,
      ai_confidence,
      evidence_count,
      evidence_quality_score,
      assessed_by,
      assessed_at,
      created_at,
      updated_at,
      ofsted_subcategories!inner (
        id,
        name,
        category_id,
        ofsted_categories!inner (
          id,
          name
        )
      )
    `)
    .eq('organization_id', orgId); // RLS will enforce this automatically
  
  // Apply filters
  if (args.subcategoryId) {
    query = query.eq('subcategory_id', args.subcategoryId);
  }
  
  if (args.categoryId) {
    query = query.eq('ofsted_subcategories.category_id', args.categoryId);
  }
  
  if (!args.includeNotAssessed) {
    // Exclude 'not_assessed' ratings (check both school_rating and ai_rating)
    query = query.not('school_rating', 'eq', 'not_assessed')
                 .not('ai_rating', 'eq', 'not_assessed');
  }
  
  if (args.ratingFilter) {
    // Filter by rating (check both school_rating and ai_rating)
    // Use PostgREST OR syntax: (school_rating.eq.value OR ai_rating.eq.value)
    query = query.or(`school_rating.eq.${args.ratingFilter},ai_rating.eq.${args.ratingFilter}`);
  }
  
  if (args.minEvidenceCount > 0) {
    query = query.gte('evidence_count', args.minEvidenceCount);
  }
  
  if (args.minQualityScore !== undefined) {
    query = query.gte('evidence_quality_score', args.minQualityScore);
  }
  
  // Order by category, then subcategory
  query = query.order('ofsted_subcategories.category_id', { ascending: true })
               .order('ofsted_subcategories.display_order', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch assessments: ${error.message}`);
  }
  
  // Transform data for response
  const assessments: AssessmentResult[] = (data || []).map((assessment: any) => {
    const subcategory = assessment.ofsted_subcategories;
    const category = subcategory.ofsted_categories;
    
    return {
      id: assessment.id,
      subcategoryId: assessment.subcategory_id,
      subcategoryName: subcategory.name,
      categoryId: category.id,
      categoryName: category.name,
      schoolRating: assessment.school_rating as AssessmentResult['schoolRating'],
      schoolRationale: assessment.school_rationale,
      aiRating: assessment.ai_rating as AssessmentResult['aiRating'],
      aiRationale: assessment.ai_rationale,
      aiConfidence: assessment.ai_confidence ? parseFloat(assessment.ai_confidence.toString()) : null,
      evidenceCount: assessment.evidence_count || 0,
      evidenceQualityScore: assessment.evidence_quality_score ? parseFloat(assessment.evidence_quality_score.toString()) : null,
      assessedBy: assessment.assessed_by,
      assessedAt: assessment.assessed_at,
      createdAt: assessment.created_at,
      updatedAt: assessment.updated_at
    };
  });
  
  return {
    assessments,
    count: assessments.length,
    organizationId: orgId,
    filters: {
      subcategoryId: args.subcategoryId,
      categoryId: args.categoryId,
      includeNotAssessed: args.includeNotAssessed,
      ratingFilter: args.ratingFilter,
      minEvidenceCount: args.minEvidenceCount,
      minQualityScore: args.minQualityScore
    }
  };
}

