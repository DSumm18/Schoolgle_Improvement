import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * PUT /api/pupil-premium/interventions/[id]
 * Update an intervention (costs, impact assessment, details)
 */
export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("interventions") + 1];
  const body = await request.json();

  if (!id) {
    return apiError("Intervention ID is required", 400);
  }

  // Verify intervention belongs to an org strategy
  const { data: existing } = await supabase
    .from("pupil_premium_interventions")
    .select("id, strategy_id, pupil_premium_strategies!inner(organization_id)")
    .eq("id", id)
    .eq("pupil_premium_strategies.organization_id", organizationId)
    .single();

  if (!existing) {
    return apiError("Intervention not found or access denied", 404);
  }

  // Remove fields that shouldn't be updated
  const {
    id: _id,
    strategy_id: _sid,
    created_at: _created,
    created_by: _cb,
    pupil_premium_strategies: _rel,
    ...updates
  } = body;

  // Validate impact_status if provided
  if (updates.impact_status) {
    const validStatuses = [
      "not_yet_measured",
      "below_expected",
      "expected",
      "above_expected",
      "significant",
    ];
    if (!validStatuses.includes(updates.impact_status)) {
      return apiError(
        "Invalid impact_status. Must be: " + validStatuses.join(", "),
        400,
      );
    }
  }

  // Validate strand if provided
  if (
    updates.strand &&
    !["teaching", "targeted", "wider"].includes(updates.strand)
  ) {
    return apiError("strand must be teaching, targeted, or wider", 400);
  }

  const { data, error } = await supabase
    .from("pupil_premium_interventions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PP Intervention PUT] DB error:", error);
    return apiError("Failed to update intervention: " + error.message, 500);
  }

  return apiSuccess(data);
});
