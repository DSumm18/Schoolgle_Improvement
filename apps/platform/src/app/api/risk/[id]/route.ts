/**
 * Risk Register - Single Risk API
 *
 * GET    /api/risk/[id] - Get single risk with mitigations, decisions, events, score history
 * PUT    /api/risk/[id] - Update risk (including override scores with audit trail)
 * DELETE /api/risk/[id] - Soft-close a risk (set status to 'closed')
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const id = request.nextUrl.pathname.split("/").pop()!;
  const supabase = createServiceRoleClient();

  // Fetch the risk
  const { data: risk, error: riskError } = await supabase
    .from("risk_register")
    .select("*")
    .eq("id", id)
    .single();

  if (riskError || !risk) {
    return apiError("Risk not found", 404);
  }

  // Fetch related data in parallel
  const [mitigationsRes, decisionsRes, eventsRes, historyRes] =
    await Promise.all([
      supabase
        .from("risk_mitigations")
        .select("*")
        .eq("risk_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("risk_decisions")
        .select("*")
        .eq("risk_id", id)
        .order("decision_date", { ascending: false }),
      supabase
        .from("risk_events")
        .select("*")
        .eq("risk_id", id)
        .order("event_date", { ascending: false }),
      supabase
        .from("risk_score_history")
        .select("*")
        .eq("risk_id", id)
        .order("recorded_at", { ascending: false })
        .limit(50),
    ]);

  return apiSuccess({
    risk,
    mitigations: mitigationsRes.data || [],
    decisions: decisionsRes.data || [],
    events: eventsRes.data || [],
    score_history: historyRes.data || [],
  });
});

export const PUT = protectedRoute(async (auth, request) => {
  const id = request.nextUrl.pathname.split("/").pop()!;
  const body = await request.json();
  const supabase = createServiceRoleClient();

  // Fetch current risk for audit trail
  const { data: currentRisk, error: fetchError } = await supabase
    .from("risk_register")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !currentRisk) {
    return apiError("Risk not found", 404);
  }

  const {
    title,
    description,
    tier,
    status,
    risk_categories,
    inherent_likelihood,
    inherent_impact,
    impact_by_category,
    target_score,
    risk_appetite_threshold,
    risk_owner_id,
    risk_owner_name,
    sef_area_id,
    sdp_priority_id,
    budget_line_cfr,
    legislation_refs,
    review_frequency,
    last_reviewed_at,
    next_review_at,
    board_decision_ref,
    // Override fields
    override_residual_likelihood,
    override_residual_impact,
    override_reason,
    override_by,
    override_expires_at,
  } = body;

  const updateData: Record<string, any> = {};

  // Basic fields
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (tier !== undefined) updateData.tier = tier;
  if (status !== undefined) updateData.status = status;
  if (risk_categories !== undefined)
    updateData.risk_categories = risk_categories;
  if (inherent_likelihood !== undefined)
    updateData.inherent_likelihood = inherent_likelihood;
  if (inherent_impact !== undefined)
    updateData.inherent_impact = inherent_impact;
  if (impact_by_category !== undefined)
    updateData.impact_by_category = impact_by_category;
  if (target_score !== undefined) updateData.target_score = target_score;
  if (risk_appetite_threshold !== undefined)
    updateData.risk_appetite_threshold = risk_appetite_threshold;
  if (risk_owner_id !== undefined) updateData.risk_owner_id = risk_owner_id;
  if (risk_owner_name !== undefined)
    updateData.risk_owner_name = risk_owner_name;
  if (sef_area_id !== undefined) updateData.sef_area_id = sef_area_id;
  if (sdp_priority_id !== undefined)
    updateData.sdp_priority_id = sdp_priority_id;
  if (budget_line_cfr !== undefined)
    updateData.budget_line_cfr = budget_line_cfr;
  if (legislation_refs !== undefined)
    updateData.legislation_refs = legislation_refs;
  if (review_frequency !== undefined)
    updateData.review_frequency = review_frequency;
  if (last_reviewed_at !== undefined)
    updateData.last_reviewed_at = last_reviewed_at;
  if (next_review_at !== undefined) updateData.next_review_at = next_review_at;
  if (board_decision_ref !== undefined)
    updateData.board_decision_ref = board_decision_ref;

  // Handle score override with audit trail
  const isOverrideUpdate =
    override_residual_likelihood !== undefined ||
    override_residual_impact !== undefined;

  if (isOverrideUpdate) {
    updateData.override_residual_likelihood = override_residual_likelihood;
    updateData.override_residual_impact = override_residual_impact;
    updateData.override_reason = override_reason;
    updateData.override_by = override_by;
    updateData.override_at = new Date().toISOString();
    updateData.override_expires_at = override_expires_at;

    // Compute effective score with override
    if (override_residual_likelihood && override_residual_impact) {
      updateData.effective_residual_score =
        override_residual_likelihood * override_residual_impact;
    }

    // Insert score history for the override
    const systemScore =
      currentRisk.system_residual_likelihood *
      currentRisk.system_residual_impact;
    const overrideScore =
      (override_residual_likelihood ?? currentRisk.system_residual_likelihood) *
      (override_residual_impact ?? currentRisk.system_residual_impact);

    await supabase.from("risk_score_history").insert({
      risk_id: id,
      organization_id: currentRisk.organization_id,
      score_type: "manual_override",
      system_likelihood: currentRisk.system_residual_likelihood,
      system_impact: currentRisk.system_residual_impact,
      system_score: systemScore,
      recorded_likelihood:
        override_residual_likelihood ?? currentRisk.system_residual_likelihood,
      recorded_impact:
        override_residual_impact ?? currentRisk.system_residual_impact,
      recorded_score: overrideScore,
      override_reason: override_reason,
      override_by_user_id: override_by,
      variance_from_system: overrideScore - systemScore,
      flagged_for_review: Math.abs(overrideScore - systemScore) >= 5,
      trigger_type: "manual_override",
    });
  }

  if (Object.keys(updateData).length === 0) {
    return apiError("No fields to update", 400);
  }

  const { data, error } = await supabase
    .from("risk_register")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating risk:", error);
    return apiError("Failed to update risk", 500);
  }

  return apiSuccess({ risk: data });
});

export const DELETE = protectedRoute(async (auth, request) => {
  const id = request.nextUrl.pathname.split("/").pop()!;
  const supabase = createServiceRoleClient();

  // Soft-close: set status to 'closed' rather than deleting
  const { data, error } = await supabase
    .from("risk_register")
    .update({ status: "closed" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error closing risk:", error);
    return apiError("Failed to close risk", 500);
  }

  if (!data) {
    return apiError("Risk not found", 404);
  }

  return apiSuccess({ risk: data, message: "Risk closed" });
});
