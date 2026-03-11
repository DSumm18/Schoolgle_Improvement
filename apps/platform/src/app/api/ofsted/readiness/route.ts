import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  OfstedAssessment,
  OfstedCategoryId,
  OfstedRating,
  GetOfstedReadinessRequest,
  GetOfstedReadinessResponse,
  OfstedOverallReadiness,
  OfstedCategorySummary,
  OfstedGapsAnalysis,
  OfstedReadinessSnapshot,
  OfstedGapDetail,
} from "@/lib/ofsted";
import { OFSTED_JUDGEMENTS, OFSTED_SUBCATEGORIES } from "@/lib/ofsted";

/**
 * Helper: Calculate readiness score from rating
 */
function ratingToScore(rating: OfstedRating | "not_assessed"): number {
  const scores: Record<OfstedRating | "not_assessed", number> = {
    exceptional: 100,
    strong_standard: 80,
    expected_standard: 60,
    needs_attention: 40,
    urgent_improvement: 20,
    not_assessed: 0,
  };
  return scores[rating] || 0;
}

/**
 * GET /api/ofsted/readiness
 * Get Ofsted readiness report for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const includeGaps = searchParams.get("include_gaps") === "true";
  const includeHistory = searchParams.get("include_history") === "true";

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  // Fetch all assessments
  const { data: assessments, error: assessmentsError } = await supabase
    .from("ofsted_assessments")
    .select("*")
    .eq("organization_id", organizationId);

  if (assessmentsError) {
    console.error(
      "Error fetching Ofsted assessments for readiness:",
      assessmentsError,
    );
    return apiError("Failed to fetch assessments", 500);
  }

  // Calculate category summaries
  const categoriesMap = new Map<OfstedCategoryId, OfstedCategorySummary>();

  // Initialize categories
  for (const [id, category] of Object.entries(OFSTED_JUDGEMENTS)) {
    const subcategoryCount = Object.values(OFSTED_SUBCATEGORIES).filter(
      (sc) => sc.category === id,
    ).length;

    categoriesMap.set(id as OfstedCategoryId, {
      category_id: id as OfstedCategoryId,
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
  }

  // Populate with assessment data
  const categoryScores: Record<OfstedCategoryId, number[]> = {
    inclusion: [],
    "curriculum-teaching": [],
    achievement: [],
    "attendance-behaviour": [],
    "personal-development": [],
    "leadership-governance": [],
  };

  let totalEvidence = 0;
  const gaps: OfstedGapsAnalysis[] = [];

  for (const assessment of assessments || []) {
    const category = categoriesMap.get(
      assessment.category_id as OfstedCategoryId,
    );
    if (category) {
      if (assessment.evidence_count > 0) {
        category.subcategories_with_evidence++;
      }
      category.total_evidence += assessment.evidence_count;
      totalEvidence += assessment.evidence_count;

      if (assessment.updated_at > category.last_updated) {
        category.last_updated = assessment.updated_at;
      }

      if (assessment.school_rating) {
        categoryScores[assessment.category_id as OfstedCategoryId].push(
          ratingToScore(assessment.school_rating),
        );
      }
    }

    // Identify gaps if requested
    if (includeGaps) {
      const subcategoryInfo =
        OFSTED_SUBCATEGORIES[
          assessment.subcategory_id as keyof typeof OFSTED_SUBCATEGORIES
        ];
      const isCritical =
        !assessment.school_rating ||
        assessment.school_rating === "needs_attention" ||
        assessment.school_rating === "urgent_improvement";
      const hasNoEvidence = assessment.evidence_count === 0;

      if (isCritical || hasNoEvidence) {
        const gapLevel: "critical" | "moderate" | "none" =
          isCritical && hasNoEvidence
            ? "critical"
            : isCritical
              ? "moderate"
              : "none";

        gaps.push({
          category_id: assessment.category_id as OfstedCategoryId,
          subcategory_id:
            assessment.subcategory_id as keyof typeof OFSTED_SUBCATEGORIES,
          subcategory_name: subcategoryInfo?.name || "",
          evidence_count: assessment.evidence_count,
          school_rating: assessment.school_rating || "not_assessed",
          ai_rating: assessment.ai_rating || "not_assessed",
          gap_level,
          needs_attention: gapLevel !== "none",
          missing_evidence: hasNoEvidence
            ? ["No evidence found for this subcategory"]
            : [],
        });
      }
    }
  }

  // Calculate category averages and overall
  let totalScore = 0;
  let categoryCount = 0;

  for (const category of categoriesMap.values()) {
    const scores = categoryScores[category.category_id];
    if (scores.length > 0) {
      category.average_score = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length,
      );

      // Calculate average rating
      const avgScore = category.average_score;
      if (avgScore >= 90) category.average_rating = "exceptional";
      else if (avgScore >= 70) category.average_rating = "strong_standard";
      else if (avgScore >= 50) category.average_rating = "expected_standard";
      else if (avgScore >= 30) category.average_rating = "needs_attention";
      else category.average_rating = "urgent_improvement";

      totalScore += avgScore;
      categoryCount++;
    }
  }

  const overallScore =
    categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0;
  let overallRating: OfstedRating | "not_assessed" = "not_assessed";

  if (overallScore >= 90) overallRating = "exceptional";
  else if (overallScore >= 70) overallRating = "strong_standard";
  else if (overallScore >= 50) overallRating = "expected_standard";
  else if (overallScore >= 30) overallRating = "needs_attention";
  else if (overallScore > 0) overallRating = "urgent_improvement";

  const criticalGaps = gaps.filter((g) => g.gap_level === "critical").length;

  // Build category scores record
  const categoryScoresRecord: Record<OfstedCategoryId, number> = {
    inclusion: 0,
    "curriculum-teaching": 0,
    achievement: 0,
    "attendance-behaviour": 0,
    "personal-development": 0,
    "leadership-governance": 0,
  };

  for (const category of categoriesMap.values()) {
    categoryScoresRecord[category.category_id] = category.average_score;
  }

  // Build overall readiness
  const overall: OfstedOverallReadiness = {
    overall_score: overallScore,
    overall_rating: overallRating,
    category_scores: categoryScoresRecord,
    total_evidence: totalEvidence,
    critical_gaps: criticalGaps,
    safeguarding_met: null, // TODO: Add safeguarding assessment
    categories: Array.from(categoriesMap.values()),
    gaps: includeGaps ? gaps : [],
  };

  // Fetch historical snapshots if requested
  let snapshots: OfstedReadinessSnapshot[] | undefined;
  if (includeHistory) {
    const { data: snapData } = await supabase
      .from("ofsted_readiness_snapshots")
      .select("*")
      .eq("organization_id", organizationId)
      .order("snapshot_date", { ascending: false })
      .limit(10);

    snapshots = snapData || undefined;
  }

  // Calculate trends if history available
  let trends;
  if (snapshots && snapshots.length > 1) {
    const latest = snapshots[0];
    const previous = snapshots[1];

    const scoreChange = latest.overall_score - previous.overall_score;
    const direction: "improving" | "stable" | "declining" =
      scoreChange > 5 ? "improving" : scoreChange < -5 ? "declining" : "stable";

    const categoryChanges: Record<OfstedCategoryId, number> = {
      inclusion: 0,
      "curriculum-teaching": 0,
      achievement: 0,
      "attendance-behaviour": 0,
      "personal-development": 0,
      "leadership-governance": 0,
    };

    for (const cat of Object.keys(categoryChanges) as OfstedCategoryId[]) {
      categoryChanges[cat] =
        (latest.category_scores[cat] || 0) -
        (previous.category_scores[cat] || 0);
    }

    trends = {
      score_change: scoreChange,
      category_changes: categoryChanges,
      direction,
    };
  }

  const response: GetOfstedReadinessResponse = {
    overall,
    snapshots,
    trends,
  };

  return apiSuccess(response);
});

/**
 * POST /api/ofsted/readiness
 * Create a readiness snapshot
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { organization_id } = body;

  const orgId = organization_id || auth.organizationId;

  if (!orgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Calculate readiness using the function
  const { data: readinessData } = await supabase.rpc(
    "calculate_ofsted_readiness",
    { p_org_id: orgId },
  );

  if (!readinessData || readinessData.length === 0) {
    return apiError("Failed to calculate readiness", 500);
  }

  const data = readinessData[0];

  // Create snapshot
  const snapshot: OfstedReadinessSnapshot = {
    id: crypto.randomUUID(),
    organization_id: orgId,
    overall_score: data.overall_score,
    overall_rating: data.overall_rating,
    category_scores: data.category_scores,
    total_evidence: data.total_evidence,
    evidence_by_category: {}, // Would need to calculate
    critical_gaps: data.critical_gaps,
    gap_details: [],
    safeguarding_met: null,
    safeguarding_notes: null,
    snapshot_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data: createdSnapshot, error } = await supabase
    .from("ofsted_readiness_snapshots")
    .insert(snapshot)
    .select()
    .single();

  if (error) {
    console.error("Error creating readiness snapshot:", error);
    return apiError("Failed to create snapshot", 500);
  }

  return apiSuccess(createdSnapshot);
});
