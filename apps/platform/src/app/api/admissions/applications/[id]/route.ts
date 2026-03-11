import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/admissions/applications/[id]
 * Fetch a single application by ID
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").pop();

  if (!id) {
    return apiError("Application ID is required", 400);
  }

  const { data, error } = await supabase
    .from("admissions_applications")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return apiError("Application not found", 404);
  }

  return apiSuccess(data);
});

/**
 * PUT /api/admissions/applications/[id]
 * Update application status, waiting list position, appeal outcome, etc.
 */
export const PUT = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;
    const supabase = createServiceRoleClient();
    const id = request.nextUrl.pathname.split("/").pop();
    const body = await request.json();

    if (!id) {
      return apiError("Application ID is required", 400);
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("admissions_applications")
      .select("id, status")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (!existing) {
      return apiError("Application not found", 404);
    }

    // Build update object — only include fields that were provided
    const allowedFields = [
      "status",
      "preference_rank",
      "distance_miles",
      "oversubscription_criterion",
      "sibling_at_school",
      "looked_after_child",
      "ehcp_naming_school",
      "faith_evidence",
      "waiting_list_position",
      "appeal_submitted",
      "appeal_date",
      "appeal_outcome",
      "appeal_notes",
      "offer_date",
      "acceptance_date",
      "decline_date",
      "notes",
      "child_name",
      "child_dob",
      "parent_name",
      "parent_email",
      "parent_phone",
      "address",
      "postcode",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No valid fields to update", 400);
    }

    updates.updated_at = new Date().toISOString();

    // Auto-set timestamps based on status transitions
    if (updates.status === "offered" && !updates.offer_date) {
      updates.offer_date = new Date().toISOString().split("T")[0];
    }
    if (updates.status === "accepted" && !updates.acceptance_date) {
      updates.acceptance_date = new Date().toISOString().split("T")[0];
    }
    if (updates.status === "declined" && !updates.decline_date) {
      updates.decline_date = new Date().toISOString().split("T")[0];
    }

    const { data, error } = await supabase
      .from("admissions_applications")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("[Admissions Application PUT]", error);
      return apiError("Failed to update application", 500);
    }

    return apiSuccess(data);
  },
  { requiredRole: "slt" },
);

/**
 * DELETE /api/admissions/applications/[id]
 * Soft-delete by setting status to withdrawn
 */
export const DELETE = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;
    const supabase = createServiceRoleClient();
    const id = request.nextUrl.pathname.split("/").pop();

    if (!id) {
      return apiError("Application ID is required", 400);
    }

    const { data, error } = await supabase
      .from("admissions_applications")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("[Admissions Application DELETE]", error);
      return apiError("Failed to withdraw application", 500);
    }

    return apiSuccess(data);
  },
  { requiredRole: "slt" },
);
