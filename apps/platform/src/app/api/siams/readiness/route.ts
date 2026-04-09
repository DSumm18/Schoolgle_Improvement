import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  SiamsRating,
  SiamsStrandId,
  SiamsQuestionId,
  GetSiamsReadinessRequest,
  GetSiamsReadinessResponse,
  SiamsOverallReadiness,
  SiamsStrandSummary,
  SiamsGapsAnalysis,
  SiamsGapDetail,
  SiamsReadinessSnapshot,
} from "@/lib/siams";
import { SIAMS_STRANDS, SIAMS_QUESTIONS } from "@/lib/siams";

/**
 * Internal helper to calculate readiness data for an organization.
 * Used by both GET and POST handlers.
 */
async function calculateReadiness(
  organizationId: string,
  options: {
    includeGaps?: boolean;
    includeHistory?: boolean;
    fromDate?: string | null;
  },
): Promise<GetSiamsReadinessResponse> {
  const supabase = createServiceRoleClient();

  // Fetch assessments
  let assessmentsQuery = supabase
    .from("siams_assessments")
    .select("*")
    .eq("organization_id", organizationId);

  if (options.fromDate) {
    assessmentsQuery = assessmentsQuery.gte("updated_at", options.fromDate);
  }

  const { data: assessments, error: assessmentsError } = await assessmentsQuery;

  if (assessmentsError) {
    throw new Error("Failed to fetch assessments");
  }

  // Fetch evidence counts
  const { data: evidenceMatches } = await supabase
    .from("siams_evidence_matches")
    .select("question_id, confidence")
    .eq("organization_id", organizationId);

  // Group evidence by question
  const evidenceByQuestion = (evidenceMatches || []).reduce(
    (acc: any, ev: any) => {
      acc[ev.question_id] = (acc[ev.question_id] || 0) + 1;
      return acc;
    },
    {} as Record<SiamsQuestionId, number>,
  );

  // Build assessments map
  const assessmentsMap = new Map<
    SiamsQuestionId,
    {
      school_rating: SiamsRating | null;
      ai_rating: SiamsRating | null;
      evidence_count: number;
    }
  >();

  (assessments || []).forEach((a: any) => {
    assessmentsMap.set(a.question_id as SiamsQuestionId, {
      school_rating: a.school_rating,
      ai_rating: a.ai_rating,
      evidence_count:
        a.evidence_count || evidenceByQuestion[a.question_id] || 0,
    });
  });

  // Calculate strand scores
  const strandScores: Record<SiamsStrandId, number> = {} as any;
  const evidenceByStrand: Record<SiamsStrandId, number> = {} as any;
  const totalEvidence = (assessments || []).reduce(
    (sum: number, a: any) =>
      sum + (a.evidence_count || evidenceByQuestion[a.question_id] || 0),
    0,
  );

  let totalScore = 0;
  let strandCount = 0;

  (
    Object.entries(SIAMS_STRANDS) as [
      SiamsStrandId,
      (typeof SIAMS_STRANDS)[SiamsStrandId],
    ][]
  ).forEach(([strandId, strand]) => {
    const strandQuestions = (
      Object.entries(SIAMS_QUESTIONS) as [
        string,
        (typeof SIAMS_QUESTIONS)[SiamsQuestionId],
      ][]
    )
      .filter(([, q]) => q.strand === strandId)
      .map(([qId]) => qId);

    let strandTotal = 0;
    let assessedCount = 0;
    let strandEvidence = 0;

    strandQuestions.forEach((questionId) => {
      const assessment = assessmentsMap.get(questionId as SiamsQuestionId);
      if (assessment) {
        const score = calculateRatingScore(assessment.school_rating);
        strandTotal += score;
        if (assessment.school_rating) assessedCount++;
        strandEvidence += assessment.evidence_count;
      }
    });

    if (assessedCount > 0) {
      strandScores[strandId] = Math.round(strandTotal / assessedCount);
      totalScore += strandScores[strandId];
      strandCount++;
    }
    evidenceByStrand[strandId] = strandEvidence;
  });

  // Calculate overall score and rating
  const overallScore =
    strandCount > 0 ? Math.round(totalScore / strandCount) : 0;
  const overallRating = calculateRatingFromScore(overallScore);

  // Build strand summaries
  const strands: SiamsStrandSummary[] = (
    Object.entries(SIAMS_STRANDS) as [
      SiamsStrandId,
      (typeof SIAMS_STRANDS)[SiamsStrandId],
    ][]
  ).map(([strandId, strand]) => {
    const strandQuestions = (
      Object.entries(SIAMS_QUESTIONS) as [
        string,
        (typeof SIAMS_QUESTIONS)[SiamsQuestionId],
      ][]
    )
      .filter(([, q]) => q.strand === strandId)
      .map(([qId]) => qId);

    const assessedQuestions = strandQuestions.filter((qId) =>
      assessmentsMap.has(qId as SiamsQuestionId),
    );
    const questionsWithEvidence = strandQuestions.filter((qId) => {
      const assessment = assessmentsMap.get(qId as SiamsQuestionId);
      return assessment && assessment.evidence_count > 0;
    });

    const scores = assessedQuestions.map((qId) => {
      const assessment = assessmentsMap.get(qId as SiamsQuestionId);
      return calculateRatingScore(assessment?.school_rating);
    });

    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
          )
        : 0;

    const assessmentsForStrand = assessedQuestions.map((qId) =>
      assessmentsMap.get(qId as SiamsQuestionId),
    );
    const averageRating = getAverageRating(assessmentsForStrand);

    return {
      strand_id: strandId,
      strand_name: strand.name,
      strand_short_name: strand.shortName,
      strand_color: strand.color,
      total_questions: strandQuestions.length,
      questions_with_evidence: questionsWithEvidence.length,
      total_evidence: evidenceByStrand[strandId] || 0,
      average_score: averageScore,
      average_rating: averageRating,
      last_updated: "", // Could be calculated from assessments
    };
  });

  // Calculate gaps
  const gaps: SiamsGapsAnalysis[] = [];
  const gapDetails: SiamsGapDetail[] = [];

  (
    Object.entries(SIAMS_QUESTIONS) as [
      SiamsQuestionId,
      (typeof SIAMS_QUESTIONS)[SiamsQuestionId],
    ][]
  ).forEach(([questionId, question]) => {
    const assessment = assessmentsMap.get(questionId);
    const evidenceCount = assessment?.evidence_count || 0;
    const schoolRating = assessment?.school_rating;

    let gapLevel: "critical" | "moderate" | "none" = "none";
    let needsAttention = false;

    if (evidenceCount === 0) {
      gapLevel = "critical";
      needsAttention = true;
      gapDetails.push({
        strand: question.strand,
        question: questionId,
        missing_evidence: ["No evidence found"],
        priority: "critical",
      });
    } else if (evidenceCount < 2) {
      gapLevel = "moderate";
    }

    if (
      schoolRating === "requires_improvement" ||
      schoolRating === "ineffective"
    ) {
      needsAttention = true;
      if (gapLevel === "none") gapLevel = "moderate";
    }

    if (gapLevel !== "none" || needsAttention) {
      gaps.push({
        strand_id: question.strand,
        question_id: questionId,
        question_text: question.text,
        evidence_count: evidenceCount,
        school_rating: schoolRating || "not_assessed",
        ai_rating: assessment?.ai_rating || "not_assessed",
        gap_level: gapLevel,
        needs_attention: needsAttention,
        missing_evidence:
          evidenceCount === 0 ? ["No evidence linked to this question"] : [],
      });
    }
  });

  const criticalGaps = gaps.filter((g) => g.gap_level === "critical").length;

  const overall: SiamsOverallReadiness = {
    overall_score: overallScore,
    overall_rating: overallRating,
    strand_scores: strandScores,
    total_evidence: totalEvidence,
    critical_gaps: criticalGaps,
    strands,
    gaps,
  };

  const response: GetSiamsReadinessResponse = {
    overall,
  };

  // Add historical data if requested
  if (options.includeHistory) {
    const { data: snapshots } = await supabase
      .from("siams_readiness_snapshots")
      .select("*")
      .eq("organization_id", organizationId)
      .order("snapshot_date", { ascending: false })
      .limit(12);

    response.snapshots = snapshots || [];

    // Calculate trends
    if (snapshots && snapshots.length >= 2) {
      const latest = snapshots[0];
      const previous = snapshots[1];

      const scoreChange = overallScore - (latest.overall_score || 0);
      const strandChanges: Record<SiamsStrandId, number> = {} as any;

      Object.keys(latest.strand_scores || {}).forEach((strandId) => {
        const latestScore = latest.strand_scores[strandId];
        const previousScore = previous.strand_scores?.[strandId];
        if (latestScore !== undefined && previousScore !== undefined) {
          strandChanges[strandId as SiamsStrandId] =
            latestScore - previousScore;
        }
      });

      let direction: "improving" | "stable" | "declining" = "stable";
      if (scoreChange > 5) direction = "improving";
      else if (scoreChange < -5) direction = "declining";

      response.trends = {
        score_change: scoreChange,
        strand_changes: strandChanges,
        direction,
      };
    }
  }

  return response;
}

/**
 * GET /api/siams/readiness
 * Get SIAMS readiness score and gaps analysis for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const includeGaps = searchParams.get("includeGaps") !== "false";
  const includeHistory = searchParams.get("includeHistory") === "true";
  const fromDate = searchParams.get("from_date");

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const response = await calculateReadiness(organizationId, {
    includeGaps,
    includeHistory,
    fromDate,
  });

  return apiSuccess(response);
});

/**
 * POST /api/siams/readiness
 * Create a readiness snapshot (for tracking over time)
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Calculate current readiness data
  const readinessData = await calculateReadiness(orgId, {
    includeGaps: true,
    includeHistory: false,
  });

  // Create snapshot
  const { data: snapshot, error } = await supabase
    .from("siams_readiness_snapshots")
    .insert({
      id: crypto.randomUUID(),
      organization_id: orgId,
      overall_score: readinessData.overall.overall_score,
      overall_rating: readinessData.overall.overall_rating,
      strand_scores: readinessData.overall.strand_scores,
      total_evidence: readinessData.overall.total_evidence,
      critical_gaps: readinessData.overall.critical_gaps,
      gap_details: readinessData.overall.gaps.map((g) => ({
        strand: g.strand_id,
        question: g.question_id,
        missing_evidence: g.missing_evidence,
      })),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating SIAMS snapshot:", error);
    return apiError("Failed to create snapshot", 500);
  }

  return apiSuccess({
    success: true,
    snapshot,
  });
});

/**
 * Helper function to convert rating to score
 */
function calculateRatingScore(rating: SiamsRating | null | undefined): number {
  switch (rating) {
    case "excellent":
      return 100;
    case "good":
      return 75;
    case "requires_improvement":
      return 50;
    case "ineffective":
      return 25;
    default:
      return 0;
  }
}

/**
 * Helper function to convert score to rating
 */
function calculateRatingFromScore(score: number): SiamsRating | "not_assessed" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "requires_improvement";
  if (score >= 25) return "ineffective";
  return "not_assessed";
}

/**
 * Helper function to get average rating from assessments
 */
function getAverageRating(
  assessments: Array<{ school_rating: SiamsRating | null } | undefined>,
): SiamsRating | "not_assessed" {
  const ratings = assessments
    .map((a) => a?.school_rating)
    .filter(
      (r): r is SiamsRating => r !== null && r !== undefined,
    ) as SiamsRating[];

  if (ratings.length === 0) return "not_assessed";

  // Count each rating
  const counts = ratings.reduce(
    (acc, r) => {
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    },
    {} as Record<SiamsRating, number>,
  );

  // Return most common rating
  return Object.entries(counts).sort(
    (a, b) => b[1] - a[1],
  )[0][0] as SiamsRating;
}
