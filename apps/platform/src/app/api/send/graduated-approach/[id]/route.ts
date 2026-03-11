import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const STAGE_ORDER = ["assess", "plan", "do", "review"] as const;

/**
 * PUT /api/send/graduated-approach/[id]
 * Update a graduated approach cycle — advance stages or update notes
 */
export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").pop();
  const body = await request.json();

  const {
    current_stage,
    assess_date,
    assess_notes,
    plan_date,
    plan_notes,
    plan_targets,
    do_date,
    do_notes,
    review_date,
    review_notes,
    review_outcome,
    advance_stage,
  } = body;

  // Fetch current cycle
  const { data: existing, error: fetchError } = await supabase
    .from("send_graduated_approach")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !existing) {
    return apiError("Cycle not found", 404);
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Auto-advance to next stage if requested
  if (advance_stage) {
    const currentIdx = STAGE_ORDER.indexOf(existing.current_stage);
    if (currentIdx < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIdx + 1];
      updates.current_stage = nextStage;
      // Auto-set date for the new stage
      const dateField = `${nextStage}_date`;
      if (!body[dateField]) {
        updates[dateField] = new Date().toISOString().split("T")[0];
      }
    }
  }

  // Allow explicit stage setting
  if (current_stage && STAGE_ORDER.includes(current_stage)) {
    updates.current_stage = current_stage;
  }

  // Update individual fields
  const fields = [
    "assess_date",
    "assess_notes",
    "plan_date",
    "plan_notes",
    "plan_targets",
    "do_date",
    "do_notes",
    "review_date",
    "review_notes",
    "review_outcome",
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("send_graduated_approach")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    console.error("[SEND Graduated Approach PUT]", error);
    return apiError("Failed to update cycle", 500);
  }

  return apiSuccess(data);
});
