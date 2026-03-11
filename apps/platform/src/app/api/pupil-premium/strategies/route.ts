import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Data ───────────────────────────────────────────────────────

const DEMO_STRATEGIES = [
  {
    id: "demo-strategy-2025",
    organization_id: "demo",
    academic_year: "2025-26",
    status: "published",
    total_pupils: 210,
    pp_eligible: 42,
    pp_funding: 56700,
    service_children: 3,
    lac_children: 2,
    post_lac_children: 1,
    fsm_ever6: 38,
    statement_summary:
      "Our pupil premium strategy focuses on high-quality teaching as the most effective lever for closing the disadvantage gap. We use the EEF tiered approach to allocate funding across teaching, targeted academic support, and wider strategies.",
    barriers_to_learning:
      "Lower literacy levels on entry; limited vocabulary; less access to enrichment activities; higher rates of absence; social and emotional challenges.",
    desired_outcomes:
      "Close the reading gap by 10%; improve maths attainment for PP pupils to be in line with national non-PP; reduce PP absence to below 5%; all PP pupils access enrichment.",
    strategy_aims_teaching:
      "Improve quality of teaching for all through investment in CPD, metacognition strategies, and structured feedback approaches aligned to EEF guidance.",
    strategy_aims_targeted:
      "Provide targeted small group and 1:1 tuition in reading and maths; deploy trained TAs to deliver evidence-based interventions.",
    strategy_aims_wider:
      "Improve attendance through family engagement; provide access to enrichment and cultural capital experiences; support social and emotional wellbeing.",
    review_date: "2026-07-18",
    year_1_status: "in_progress",
    year_2_status: "planned",
    year_3_status: "planned",
    publish_date: "2025-09-01",
    headteacher_name: "Mrs A. Thompson",
    governor_name: "Mr J. Roberts",
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
  },
];

/**
 * GET /api/pupil-premium/strategies
 * List strategies for an organization, optionally filtered by academic year
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const academicYear = searchParams.get("academic_year");

  let query = supabase
    .from("pupil_premium_strategies")
    .select("*")
    .eq("organization_id", organizationId)
    .order("academic_year", { ascending: false });

  if (academicYear) {
    query = query.eq("academic_year", academicYear);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[PP Strategies GET] DB error:", error);
  }

  // Return demo data if no real data
  if (!data || data.length === 0) {
    return apiSuccess({ strategies: DEMO_STRATEGIES, demo: true });
  }

  return apiSuccess({ strategies: data, demo: false });
});

/**
 * POST /api/pupil-premium/strategies
 * Create a new pupil premium strategy
 */
export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    academic_year,
    total_pupils,
    pp_eligible,
    pp_funding,
    service_children = 0,
    lac_children = 0,
    post_lac_children = 0,
    fsm_ever6 = 0,
    statement_summary = "",
    barriers_to_learning = "",
    desired_outcomes = "",
    strategy_aims_teaching = "",
    strategy_aims_targeted = "",
    strategy_aims_wider = "",
    review_date,
    headteacher_name = "",
    governor_name = "",
  } = body;

  if (!academic_year || !pp_funding) {
    return apiError("academic_year and pp_funding are required", 400);
  }

  const { data, error } = await supabase
    .from("pupil_premium_strategies")
    .insert({
      organization_id: organizationId,
      academic_year,
      status: "draft",
      total_pupils: total_pupils || 0,
      pp_eligible: pp_eligible || 0,
      pp_funding,
      service_children,
      lac_children,
      post_lac_children,
      fsm_ever6,
      statement_summary,
      barriers_to_learning,
      desired_outcomes,
      strategy_aims_teaching,
      strategy_aims_targeted,
      strategy_aims_wider,
      review_date,
      headteacher_name,
      governor_name,
      year_1_status: "in_progress",
      year_2_status: "planned",
      year_3_status: "planned",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[PP Strategies POST] DB error:", error);
    return apiError("Failed to create strategy: " + error.message, 500);
  }

  return apiSuccess(data, 201);
});
