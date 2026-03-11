import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/intelligence/cohort-outcomes
 * Get cohort outcome data for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const yearGroup = searchParams.get("yearGroup");
  const academicYear = searchParams.get("academicYear");

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("school_cohort_outcomes")
    .select("*, school_cohorts(label)")
    .eq("organization_id", organizationId)
    .order("academic_year_start", { ascending: false })
    .order("year_group", { ascending: true });

  if (yearGroup) {
    query = query.eq("year_group", parseInt(yearGroup));
  }
  if (academicYear) {
    query = query.eq("academic_year_start", parseInt(academicYear));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Cohort Outcomes] Fetch error:", error);
    return apiError("Failed to fetch cohort outcomes", 500);
  }

  return apiSuccess({
    outcomes: data || [],
    total: data?.length || 0,
  });
});

/**
 * POST /api/intelligence/cohort-outcomes
 * Create or update cohort outcome data
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    organization_id,
    cohort_id,
    year_group,
    academic_year_start,
    assessment_period,
    ...outcomeData
  } = body;

  const orgId = organization_id || auth.organizationId;

  if (
    !orgId ||
    year_group === undefined ||
    !academic_year_start ||
    !assessment_period
  ) {
    return apiError(
      "Missing required fields: organization_id, year_group, academic_year_start, assessment_period",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Upsert to handle updates to existing period
  const { data, error } = await supabase
    .from("school_cohort_outcomes")
    .upsert(
      {
        organization_id: orgId,
        cohort_id: cohort_id || null,
        year_group,
        academic_year_start,
        assessment_period,
        ...outcomeData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict:
          "organization_id,year_group,academic_year_start,assessment_period",
      },
    )
    .select()
    .single();

  if (error) {
    console.error("[Cohort Outcomes] Upsert error:", error);
    return apiError("Failed to save cohort outcomes", 500);
  }

  return apiSuccess({ outcome: data });
});
