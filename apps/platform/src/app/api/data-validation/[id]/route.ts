/**
 * Data Validation Pipeline - Single Record API
 *
 * GET /api/data-validation/[id] - Get extracted_data with validation log
 * PUT /api/data-validation/[id] - Human review: confirm, edit_and_confirm, or reject
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/data-validation/[id]
 * Get a single extracted_data record with its full validation_log history.
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const id = request.nextUrl.pathname.split("/").pop();
  if (!id) {
    return apiError("Missing record ID", 400);
  }

  // Fetch the extracted_data record
  const { data: extracted, error: fetchError } = await supabase
    .from("extracted_data")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !extracted) {
    if (fetchError?.code === "PGRST116") {
      return apiError("Record not found", 404, "NOT_FOUND");
    }
    console.error("[data-validation/id] GET error:", fetchError);
    return apiError("Failed to fetch record", 500);
  }

  // Fetch the validation log for this record
  const { data: logs, error: logError } = await supabase
    .from("data_validation_log")
    .select("*")
    .eq("extracted_data_id", id)
    .order("created_at", { ascending: true });

  if (logError) {
    console.error("[data-validation/id] GET log error:", logError);
  }

  return apiSuccess({
    ...extracted,
    validation_log: logs || [],
  });
});

/**
 * PUT /api/data-validation/[id]
 * Human review actions on an extracted_data record.
 *
 * Body must include `action`:
 * - "confirm"            → status='confirmed', creates validated_data, logs 'confirmed'
 * - "edit_and_confirm"   → status='edited_and_confirmed', creates validated_data with edits, logs 'edited_and_confirmed'
 * - "reject"             → status='rejected', logs 'rejected' with reason
 */
export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();

  const id = request.nextUrl.pathname.split("/").pop();
  if (!id) {
    return apiError("Missing record ID", 400);
  }

  const body = await request.json();
  const { action, edits, reason, data_type } = body;

  if (!action || !["confirm", "edit_and_confirm", "reject"].includes(action)) {
    return apiError(
      "action must be one of: confirm, edit_and_confirm, reject",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Fetch the existing record to verify ownership and current status
  const { data: existing, error: fetchError } = await supabase
    .from("extracted_data")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !existing) {
    if (fetchError?.code === "PGRST116") {
      return apiError("Record not found", 404, "NOT_FOUND");
    }
    console.error("[data-validation/id] PUT fetch error:", fetchError);
    return apiError("Failed to fetch record", 500);
  }

  if (existing.status !== "pending_review") {
    return apiError(
      `Cannot review a record with status '${existing.status}'. Only pending_review records can be actioned.`,
      409,
      "INVALID_STATUS",
    );
  }

  // Handle reject
  if (action === "reject") {
    if (!reason) {
      return apiError(
        "reason is required when rejecting",
        400,
        "VALIDATION_ERROR",
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("extracted_data")
      .update({
        status: "rejected",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[data-validation/id] PUT reject error:", updateError);
      return apiError("Failed to reject record", 500);
    }

    await supabase.from("data_validation_log").insert({
      extracted_data_id: id,
      action: "rejected",
      performed_by: userId,
      details: { reason },
    });

    return apiSuccess(updated);
  }

  // Handle confirm or edit_and_confirm
  const isEdited = action === "edit_and_confirm";
  const newStatus = isEdited ? "edited_and_confirmed" : "confirmed";

  if (isEdited && !edits) {
    return apiError(
      "edits object is required for edit_and_confirm",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Determine the final validated fields
  const validatedFields = isEdited
    ? { ...existing.extracted_fields, ...edits }
    : existing.extracted_fields;

  // Update extracted_data status
  const { data: updated, error: updateError } = await supabase
    .from("extracted_data")
    .update({
      status: newStatus,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      ...(isEdited ? { user_edits: edits } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("[data-validation/id] PUT update error:", updateError);
    return apiError("Failed to update record", 500);
  }

  // Create validated_data record
  const { data: validated, error: validatedError } = await supabase
    .from("validated_data")
    .insert({
      organization_id: organizationId,
      extracted_data_id: id,
      data_type: data_type || existing.document_type,
      validated_fields: validatedFields,
      user_edits: isEdited ? edits : null,
      confirmed_by: userId,
      is_current: true,
    })
    .select()
    .single();

  if (validatedError) {
    console.error(
      "[data-validation/id] PUT validated insert error:",
      validatedError,
    );
    // Attempt to roll back the status update
    await supabase
      .from("extracted_data")
      .update({
        status: "pending_review",
        reviewed_by: null,
        reviewed_at: null,
      })
      .eq("id", id);
    return apiError("Failed to create validated data record", 500);
  }

  // Log the action
  await supabase.from("data_validation_log").insert({
    extracted_data_id: id,
    action: isEdited ? "edited_and_confirmed" : "confirmed",
    performed_by: userId,
    details: {
      validated_data_id: validated.id,
      data_type: validated.data_type,
      ...(isEdited ? { edits } : {}),
    },
  });

  return apiSuccess({
    extracted: updated,
    validated,
  });
});
