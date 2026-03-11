import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/pupil-premium/interventions
 * List interventions, optionally filtered by strategy_id, strand, active status
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const strategyId = searchParams.get("strategy_id");
  const strand = searchParams.get("strand");
  const active = searchParams.get("active");

  let query = supabase
    .from("pupil_premium_interventions")
    .select("*, pupil_premium_strategies!inner(organization_id)")
    .eq("pupil_premium_strategies.organization_id", organizationId)
    .order("strand", { ascending: true })
    .order("created_at", { ascending: true });

  if (strategyId) {
    query = query.eq("strategy_id", strategyId);
  }
  if (strand) {
    query = query.eq("strand", strand);
  }
  if (active !== null && active !== undefined) {
    query = query.eq("active", active === "true");
  }

  const { data, error } = await query;

  if (error) {
    console.error("[PP Interventions GET] DB error:", error);
  }

  if (!data || data.length === 0) {
    return apiSuccess({ interventions: [], demo: true });
  }

  return apiSuccess({ interventions: data, demo: false });
});

/**
 * POST /api/pupil-premium/interventions
 * Create a new intervention linked to a strategy
 */
export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    strategy_id,
    name,
    description = "",
    strand,
    budgeted_cost = 0,
    actual_cost = 0,
    staff_lead = "",
    target_pupils = "",
    year_groups = "",
    eef_strategy_id = null,
    eef_strategy_name = null,
    eef_months_progress = null,
    eef_evidence_strength = null,
    start_date = null,
    end_date = null,
  } = body;

  if (!strategy_id || !name || !strand) {
    return apiError("strategy_id, name, and strand are required", 400);
  }

  if (!["teaching", "targeted", "wider"].includes(strand)) {
    return apiError("strand must be teaching, targeted, or wider", 400);
  }

  // Verify strategy belongs to this org
  const { data: strategy } = await supabase
    .from("pupil_premium_strategies")
    .select("id")
    .eq("id", strategy_id)
    .eq("organization_id", organizationId)
    .single();

  if (!strategy) {
    return apiError(
      "Strategy not found or does not belong to your organisation",
      404,
    );
  }

  const { data, error } = await supabase
    .from("pupil_premium_interventions")
    .insert({
      strategy_id,
      name,
      description,
      strand,
      budgeted_cost,
      actual_cost,
      staff_lead,
      target_pupils,
      year_groups,
      eef_strategy_id,
      eef_strategy_name,
      eef_months_progress,
      eef_evidence_strength,
      impact_status: "not_yet_measured",
      impact_notes: "",
      start_date,
      end_date,
      active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[PP Interventions POST] DB error:", error);
    return apiError("Failed to create intervention: " + error.message, 500);
  }

  return apiSuccess(data, 201);
});
