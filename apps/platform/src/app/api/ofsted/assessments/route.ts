import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  OfstedAssessment,
  OfstedAssessmentForm,
  OfstedRating,
  OfstedCategoryId,
  OfstedSubCategoryId,
  GetOfstedAssessmentsRequest,
  GetOfstedAssessmentsResponse,
  UpsertOfstedAssessmentRequest,
  UpsertOfstedAssessmentResponse,
} from "@/lib/ofsted";
import { v4 as uuidv4 } from "uuid";
import { OFSTED_JUDGEMENTS, OFSTED_SUBCATEGORIES } from "@/lib/ofsted";

/**
 * Helper: Calculate readiness score from assessment
 */
function calculateReadinessScore(assessment: OfstedAssessment): number {
  if (!assessment.school_rating) return 0;

  const ratingScores: Record<OfstedRating, number> = {
    exceptional: 100,
    strong_standard: 80,
    expected_standard: 60,
    needs_attention: 40,
    urgent_improvement: 20,
  };

  return ratingScores[assessment.school_rating] || 0;
}

/**
 * GET /api/ofsted/assessments
 * Get Ofsted assessments for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const categoryId = searchParams.get("categoryId") as OfstedCategoryId | null;
  const subcategoryId = searchParams.get(
    "subcategoryId",
  ) as OfstedSubCategoryId | null;

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("ofsted_assessments")
    .select("*")
    .eq("organization_id", organizationId);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (subcategoryId) {
    query = query.eq("subcategory_id", subcategoryId);
  }

  const { data: assessments, error } = await query;

  if (error) {
    console.error("Error fetching Ofsted assessments:", error);
    return apiError("Failed to fetch assessments", 500);
  }

  // Enrich with subcategory and category info
  const enrichedAssessments = (assessments || []).map((assessment) => {
    const categoryInfo =
      OFSTED_JUDGEMENTS[assessment.category_id as OfstedCategoryId];
    const subcategoryInfo =
      OFSTED_SUBCATEGORIES[assessment.subcategory_id as OfstedSubCategoryId];

    return {
      ...assessment,
      subcategory_name: subcategoryInfo?.name || "",
      subcategory_description: subcategoryInfo?.description || "",
      category_name: categoryInfo?.name || "",
      category_short_name: categoryInfo?.shortName || "",
      category_color: categoryInfo?.color || "",
      readiness_score: calculateReadinessScore(assessment),
    };
  });

  // Group by category for summary
  const categoriesMap = new Map<
    OfstedCategoryId,
    {
      category_id: OfstedCategoryId;
      category_name: string;
      category_short_name: string;
      category_color: string;
      total_subcategories: number;
      subcategories_with_evidence: number;
      total_evidence: number;
      average_score: number;
      average_rating: OfstedRating | "not_assessed";
      last_updated: string;
    }
  >();

  // Initialize categories
  Object.entries(OFSTED_JUDGEMENTS).forEach(([categoryId, category]) => {
    const subcategoryCount = Object.values(OFSTED_SUBCATEGORIES).filter(
      (sc) => sc.category === categoryId,
    ).length;

    categoriesMap.set(categoryId as OfstedCategoryId, {
      category_id: categoryId as OfstedCategoryId,
      category_name: category.name,
      category_short_name: category.shortName,
      category_color: category.color,
      total_subcategories: subcategoryCount,
      subcategories_with_evidence: 0,
      total_evidence: 0,
      average_score: 0,
      average_rating: "not_assessed",
      last_updated: "",
    });
  });

  // Populate with assessment data
  let maxUpdated = "";

  for (const assessment of assessments || []) {
    const category = categoriesMap.get(
      assessment.category_id as OfstedCategoryId,
    );
    if (category) {
      if (assessment.evidence_count > 0) {
        category.subcategories_with_evidence++;
      }
      category.total_evidence += assessment.evidence_count;

      if (assessment.updated_at > category.last_updated) {
        category.last_updated = assessment.updated_at;
      }
      if (assessment.updated_at > maxUpdated) {
        maxUpdated = assessment.updated_at;
      }
    }
  }

  // Calculate averages per category
  const categorySummaries: GetOfstedAssessmentsResponse["categories"] = [];

  for (const category of categoriesMap.values()) {
    const categoryAssessments = enrichedAssessments.filter(
      (a) => a.category_id === category.category_id,
    );

    if (categoryAssessments.length > 0) {
      const totalScore = categoryAssessments.reduce(
        (sum, a) => sum + calculateReadinessScore(a),
        0,
      );
      category.average_score = Math.round(
        totalScore / categoryAssessments.length,
      );

      // Calculate average rating
      const ratedAssessments = categoryAssessments.filter(
        (a) => a.school_rating,
      );
      if (ratedAssessments.length > 0) {
        const ratingValues = ratedAssessments.map((a) => {
          const scores: Record<OfstedRating, number> = {
            exceptional: 5,
            strong_standard: 4,
            expected_standard: 3,
            needs_attention: 2,
            urgent_improvement: 1,
          };
          return scores[a.school_rating as OfstedRating] || 0;
        });
        const avgRating =
          ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length;

        if (avgRating >= 4.5) category.average_rating = "exceptional";
        else if (avgRating >= 3.5) category.average_rating = "strong_standard";
        else if (avgRating >= 2.5)
          category.average_rating = "expected_standard";
        else if (avgRating >= 1.5) category.average_rating = "needs_attention";
        else category.average_rating = "urgent_improvement";
      }
    }

    categorySummaries.push({
      category_id: category.category_id,
      category_name: category.category_name,
      category_short_name: category.category_short_name,
      category_color: category.category_color,
      total_subcategories: category.total_subcategories,
      subcategories_with_evidence: category.subcategories_with_evidence,
      total_evidence: category.total_evidence,
      average_score: category.average_score,
      average_rating: category.average_rating,
      last_updated: category.last_updated,
    });
  }

  const totalEvidence = categorySummaries.reduce(
    (sum, cat) => sum + cat.total_evidence,
    0,
  );

  const response: GetOfstedAssessmentsResponse = {
    assessments: enrichedAssessments,
    categories: categorySummaries,
    total_evidence: totalEvidence,
    last_updated: maxUpdated,
  };

  return apiSuccess(response);
});

/**
 * POST /api/ofsted/assessments
 * Create or update Ofsted assessments
 */
export const POST = protectedRoute(async (auth, req) => {
  const body: UpsertOfstedAssessmentRequest = await req.json();
  const { organization_id, assessments, user_id } = body;

  const orgId = organization_id || auth.organizationId;

  if (!orgId || !assessments || assessments.length === 0) {
    return apiError(
      "Missing required fields: organization_id, assessments",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Upsert each assessment
  const results: OfstedAssessment[] = [];
  let updated = 0;
  let created = 0;

  for (const assessment of assessments) {
    // Check if exists
    const { data: existing } = await supabase
      .from("ofsted_assessments")
      .select("id")
      .eq("organization_id", orgId)
      .eq("subcategory_id", assessment.subcategory_id)
      .single();

    const now = new Date().toISOString();
    const record = {
      id: existing?.id || uuidv4(),
      organization_id: orgId,
      category_id: assessment.category_id,
      subcategory_id: assessment.subcategory_id,
      school_rating: assessment.school_rating || null,
      school_rationale: assessment.school_rationale || null,
      assessed_by: user_id || auth.userId || null,
      assessed_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("ofsted_assessments")
      .upsert(record)
      .select()
      .single();

    if (!error && data) {
      results.push(data);
      if (existing) updated++;
      else created++;
    }
  }

  const response: UpsertOfstedAssessmentResponse = {
    success: true,
    updated,
    created,
    assessments: results,
  };

  return apiSuccess(response);
});
