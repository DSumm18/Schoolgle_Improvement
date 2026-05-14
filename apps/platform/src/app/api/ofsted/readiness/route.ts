import { createHmac } from "crypto";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { buildAssessmentIntelligenceReportingSummary } from "@/lib/assessment-intelligence/reporting";
import { buildCohortGapLens } from "@/lib/trust-assessor/cohort-gap-lens";
import type {
  OfstedCategoryId,
  OfstedRating,
  GetOfstedReadinessResponse,
  OfstedOverallReadiness,
  OfstedCategorySummary,
  OfstedGapsAnalysis,
  OfstedReadinessSnapshot,
} from "@/lib/ofsted";
import { OFSTED_JUDGEMENTS, OFSTED_SUBCATEGORIES } from "@/lib/ofsted";
import {
  buildShadowComparison,
  getIntelligenceBrainMode,
  isDebugBrainRequest,
  persistShadowComparison,
} from "@/lib/intelligence-brain/orchestrator";
import { buildOfstedShadowCandidate } from "@/lib/intelligence-brain/ofsted-shadow-candidate";
import { resolveRequestedTrustAnalysisOrganization } from "@/lib/trust-analysis/organization-access";

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
  const requestedOrganizationId = searchParams.get("organizationId");
  const includeGaps = searchParams.get("include_gaps") === "true";
  const includeHistory = searchParams.get("include_history") === "true";
  const debugBrain =
    isDebugBrainRequest(searchParams.get("debug_brain")) ||
    isDebugBrainRequest(req.headers.get("x-schoolgle-debug-brain"));
  const brainMode = getIntelligenceBrainMode("ofsted-readiness");

  if (!auth.organizationId) {
    return apiError("Missing organizationId from session", 400);
  }

  const supabase = createServiceRoleClient();
  const access = await resolveRequestedTrustAnalysisOrganization(
    supabase,
    auth.organizationId,
    requestedOrganizationId,
  );

  if (!access.allowed || !access.organizationId) {
    return apiError("You do not have access to this Ofsted readiness scope", 403);
  }

  const organizationId = access.organizationId;

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
          gap_level: gapLevel,
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

  const assessmentEvidence = await buildAssessmentIntelligenceReportingSummary(supabase, {
    organizationId,
    includeChildOrganizations: true,
    limit: 10,
  });
  const cohortGapEvidence = await buildReadinessCohortGapEvidence(
    supabase,
    organizationId,
  );

  const response: GetOfstedReadinessResponse = {
    overall,
    assessmentEvidence: {
      source: assessmentEvidence.source,
      caveat: assessmentEvidence.caveat,
      batchCount: assessmentEvidence.batchCount,
      eventCount: assessmentEvidence.eventCount,
      pupilCount: assessmentEvidence.pupilCount,
      latestSourceLabel: assessmentEvidence.latestSourceLabel,
      latestAssessmentPeriod: assessmentEvidence.latestAssessmentPeriod,
      latestAcademicYearStart: assessmentEvidence.latestAcademicYearStart,
    },
    cohortGapEvidence,
    snapshots,
    trends,
  };

  let shadowComparison:
    | ReturnType<typeof buildShadowComparison>
    | null = null;

  if (brainMode === "shadow" || brainMode === "primary") {
    const candidate = await buildOfstedShadowCandidate(supabase, organizationId);

    if (candidate) {
      shadowComparison = buildShadowComparison({
        route: "ofsted-readiness",
        mode: brainMode,
        organizationId,
        candidateVersion: candidate.candidateVersion,
        baseline: {
          overall_score: overall.overall_score,
          critical_gaps: overall.critical_gaps,
          total_evidence: overall.total_evidence,
          areas_analyzed: Object.keys(overall.category_scores).length,
        },
        candidate: candidate.baselineComparable,
      });

      await persistShadowComparison(supabase, shadowComparison);
    } else {
      console.info(
        "[IntelligenceBrain] Ofsted shadow candidate unavailable (no gap cache rows).",
      );
    }
  }

  if (debugBrain) {
    return apiSuccess({
      ...response,
      _brainShadow: {
        mode: brainMode,
        comparison: shadowComparison,
      },
    });
  }

  return apiSuccess(response);
});

type OfstedScopedOrgRow = {
  id: string;
  name: string | null;
};

type OfstedAssessmentRecord = {
  organization_id: string;
  pupil_hash: string;
  year_group: number | null;
  subject: string;
  attainment_level: string | null;
  academic_year_start: number;
  assessment_period: string | null;
  is_fsm: boolean | null;
  is_send: boolean | null;
  is_eal: boolean | null;
};

type OfstedPupilProfile = {
  organization_id: string;
  pupil_ref: string | null;
  has_ehcp: boolean | null;
  has_send_support: boolean | null;
  is_eal: boolean | null;
  is_pupil_premium: boolean | null;
  fsm_eligible?: boolean | null;
};

async function buildReadinessCohortGapEvidence(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
): Promise<GetOfstedReadinessResponse["cohortGapEvidence"]> {
  const { data: orgRows, error: orgError } = await supabase
    .from("organizations")
    .select("id,name")
    .or(`id.eq.${organizationId},parent_organization_id.eq.${organizationId}`);

  if (orgError) {
    console.error("[Ofsted Readiness] Cohort-gap organization scope failed:", orgError);
    return undefined;
  }

  const organizations = ((orgRows || []) as OfstedScopedOrgRow[]).filter(
    (row) => row.id,
  );
  const orgIds = organizations.map((row) => row.id);
  if (orgIds.length === 0) return undefined;

  const [{ data: profileRows, error: profileError }, records] =
    await Promise.all([
      supabase
        .from("ls_pupils")
        .select("organization_id,pupil_ref,has_ehcp,has_send_support,is_eal,is_pupil_premium")
        .in("organization_id", orgIds)
        .limit(10000),
      fetchAssessmentRowsForOrganizations(supabase, orgIds),
    ]);

  if (profileError) {
    console.warn("[Ofsted Readiness] Cohort-gap profile enrichment unavailable:", profileError.message);
  }

  if (records.length === 0) return undefined;

  const profilesByOrgAndHash = new Map<string, OfstedPupilProfile>();
  for (const profile of (profileRows || []) as OfstedPupilProfile[]) {
    if (!profile.pupil_ref) continue;
    profilesByOrgAndHash.set(
      `${profile.organization_id}:${pupilHashForOrg(profile.pupil_ref, profile.organization_id)}`,
      profile,
    );
  }

  const comparisons = organizations.flatMap((organization) => {
    const orgRecords = records.filter(
      (record) => record.organization_id === organization.id,
    );
    if (orgRecords.length === 0) return [];

    const lens = buildCohortGapLens({
      records: orgRecords.map((record) => ({
        pupilHash: record.pupil_hash,
        subject: record.subject,
        attainmentLevel: record.attainment_level,
        academicYearStart: Number(record.academic_year_start),
        yearGroup: record.year_group,
        assessmentPeriod: record.assessment_period,
      })),
      getDemographics: (hash) => {
        const profile = profilesByOrgAndHash.get(`${organization.id}:${hash}`);
        return {
          isFsm:
            profile?.fsm_eligible === true ||
            profile?.is_pupil_premium === true ||
            orgRecords.some((record) => record.pupil_hash === hash && record.is_fsm === true),
          isSend:
            profile?.has_ehcp === true ||
            profile?.has_send_support === true ||
            orgRecords.some((record) => record.pupil_hash === hash && record.is_send === true),
          isEal:
            profile?.is_eal === true ||
            orgRecords.some((record) => record.pupil_hash === hash && record.is_eal === true),
        };
      },
      source:
        "pupil_assessments_pseudo selected complete RWM cohort enriched from ls_pupils profile flags where available",
    });

    return lens.comparisons
      .filter(
        (comparison) =>
          comparison.confidence !== "unavailable" &&
          Math.abs(comparison.combinedGapPp ?? 0) >= 8,
      )
      .map((comparison) => ({
        organizationId: organization.id,
        schoolName: organization.name || "This school",
        key: comparison.key,
        groupLabel: comparison.groupLabel,
        comparatorLabel: comparison.comparatorLabel,
        groupCount: comparison.groupCount,
        comparatorCount: comparison.comparatorCount,
        combinedGapPp: comparison.combinedGapPp,
        confidence: comparison.confidence,
        narrative: comparison.narrative,
        ofstedArea: comparison.ofstedArea,
        academicYearStart: lens.latestYear,
        yearGroupLabel: lens.yearGroupLabel,
        assessmentPeriod: lens.assessmentPeriod,
      }));
  });

  if (comparisons.length === 0) return undefined;

  const comparisonYears = comparisons
    .map((comparison) => comparison.academicYearStart)
    .filter((year): year is number => typeof year === "number");

  return {
    source:
      "Trust Assessor Cohort Gap Lens: pupil_assessments_pseudo + ls_pupils enrichment",
    caveat:
      "Cohort gaps explain patterns for Ofsted evidence conversations. They do not judge pupils, and small groups must be triangulated with books, provision records and teacher assessment.",
    latestYear:
      comparisonYears.length > 0
        ? Math.max(...comparisonYears)
        : null,
    organizationCount: organizations.length,
    comparisons: comparisons
      .sort((a, b) => Math.abs(b.combinedGapPp ?? 0) - Math.abs(a.combinedGapPp ?? 0))
      .slice(0, 6),
  };
}

async function fetchAssessmentRowsForOrganizations(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationIds: string[],
): Promise<OfstedAssessmentRecord[]> {
  const rows: OfstedAssessmentRecord[] = [];
  const pageSize = 1000;

  for (const organizationId of organizationIds) {
    for (let page = 0; ; page++) {
      const { data, error } = await supabase
        .from("pupil_assessments_pseudo")
        .select("organization_id,pupil_hash,year_group,subject,attainment_level,academic_year_start,assessment_period,is_fsm,is_send,is_eal")
        .eq("organization_id", organizationId)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error(
          "[Ofsted Readiness] Cohort-gap assessment fetch failed:",
          error,
        );
        break;
      }

      rows.push(...((data || []) as OfstedAssessmentRecord[]));
      if (!data || data.length < pageSize) break;
    }
  }

  return rows;
}

function pupilHashForOrg(pupilRef: string, organizationId: string): string {
  return createHmac("sha256", organizationId)
    .update(pupilRef.toLowerCase().trim())
    .digest("hex");
}

/**
 * POST /api/ofsted/readiness
 * Create a readiness snapshot
 */
export const POST = protectedRoute(async (auth) => {
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId) {
    return apiError("Missing organizationId from session", 400);
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
    evidence_by_category: {} as Record<OfstedCategoryId, number>, // Would need to calculate
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
