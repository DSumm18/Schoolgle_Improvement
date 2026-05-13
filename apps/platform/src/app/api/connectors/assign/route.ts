import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";
import { validateBody } from "@/lib/validation";

const assignSchema = z.object({
  staff_id: z.string().uuid(),
  connector_type_id: z.string().min(1),
  is_primary: z.boolean().default(true),
  scope: z.string().max(200).default("whole school"),
  scope_type: z.enum([
    "whole_school", "key_stage", "year_group", "building", "department", "custom",
  ]).default("whole_school"),
  training_completed: z.boolean().default(false),
  training_completed_date: z.string().nullable().optional(),
  training_expiry_date: z.string().nullable().optional(),
  training_certificate_url: z.string().url().max(2000).nullable().optional(),
  training_provider: z.string().max(200).nullable().optional(),
  // NOTE: Do NOT store personal/sensitive information in notes.
  // This field is for role-related context only (e.g. "covers Block B on Tuesdays").
  notes: z.string().max(1000).nullable().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  is_primary: z.boolean().optional(),
  scope: z.string().max(200).optional(),
  scope_type: z.enum([
    "whole_school", "key_stage", "year_group", "building", "department", "custom",
  ]).optional(),
  training_completed: z.boolean().optional(),
  training_completed_date: z.string().nullable().optional(),
  training_expiry_date: z.string().nullable().optional(),
  training_certificate_url: z.string().url().max(2000).nullable().optional(),
  training_provider: z.string().max(200).nullable().optional(),
  status: z.enum(["active", "pending_training", "expired_training", "ended"]).optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// POST /api/connectors/assign - Assign a connector to a staff member
export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const validated = validateBody(body, assignSchema);
    if (!validated.success) return validated.response;

    const supabase = createServiceRoleClient();
    const data = validated.data;

    // Determine initial status
    let status = "active";
    const { data: connectorType } = await supabase
      .from("connector_types")
      .select("requires_training, name")
      .eq("id", data.connector_type_id)
      .single();

    if (connectorType?.requires_training && !data.training_completed) {
      status = "pending_training";
    }

    const { data: staffMember } = await supabase
      .from("staff_directory")
      .select("first_name, last_name, display_name")
      .eq("id", data.staff_id)
      .eq("organization_id", auth.organizationId)
      .single();

    const staffName =
      staffMember?.display_name ||
      `${staffMember?.first_name || ""} ${staffMember?.last_name || ""}`.trim() ||
      null;

    // Create the assignment using the currently deployed staff_connectors schema.
    const { data: connector, error } = await supabase
      .from("staff_connectors")
      .insert({
        organization_id: auth.organizationId,
        staff_id: data.staff_id,
        staff_name: staffName,
        connector_type_id: data.connector_type_id,
        coverage_area: data.scope,
        training_expires_at: data.training_expiry_date,
        assigned_at: new Date().toISOString(),
        status,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error assigning connector:", error);
      if (error.code === "23505") {
        return apiError("This staff member already has this connector in this scope", 409);
      }
      return apiError("Failed to assign connector", 500);
    }

    // Log the assignment
    await supabase.from("connector_change_log").insert({
      organization_id: auth.organizationId,
      staff_connector_id: connector.id,
      connector_type_id: data.connector_type_id,
      change_type: "assigned",
      to_staff_id: data.staff_id,
      changed_by: auth.userId,
      details: { scope: data.scope, is_primary: data.is_primary },
    });

    return apiSuccess(connector, 201);
  },
  { requiredRole: "slt" }
);

// PUT /api/connectors/assign - Update an existing connector assignment
export const PUT = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const validated = validateBody(body, updateSchema);
    if (!validated.success) return validated.response;

    const supabase = createServiceRoleClient();
    const { id, ...updateData } = validated.data;

    const { data: connector, error } = await supabase
      .from("staff_connectors")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", auth.organizationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating connector:", error);
      return apiError("Failed to update connector", 500);
    }

    // Log training update if training fields changed
    if (updateData.training_completed !== undefined || updateData.training_expiry_date !== undefined) {
      await supabase.from("connector_change_log").insert({
        organization_id: auth.organizationId,
        staff_connector_id: id,
        connector_type_id: connector.connector_type_id,
        change_type: "training_updated",
        to_staff_id: connector.staff_id,
        changed_by: auth.userId,
        details: {
          training_completed: updateData.training_completed,
          training_expiry_date: updateData.training_expiry_date,
          training_completed_date: updateData.training_completed_date,
        },
      });
    }

    return apiSuccess(connector);
  },
  { requiredRole: "slt" }
);

// DELETE /api/connectors/assign - Remove a connector from a staff member
export const DELETE = protectedRoute(
  async (auth, request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return apiError("ID is required", 400);

    const supabase = createServiceRoleClient();

    // Get connector details for the log
    const { data: existing } = await supabase
      .from("staff_connectors")
      .select("staff_id, connector_type_id, scope")
      .eq("id", id)
      .eq("organization_id", auth.organizationId)
      .single();

    if (!existing) return apiError("Connector not found", 404);

    // End the connector (soft delete — keep for audit)
    const { error } = await supabase
      .from("staff_connectors")
      .update({ status: "ended", end_date: new Date().toISOString().split("T")[0] })
      .eq("id", id)
      .eq("organization_id", auth.organizationId);

    if (error) {
      console.error("Error removing connector:", error);
      return apiError("Failed to remove connector", 500);
    }

    // Log
    await supabase.from("connector_change_log").insert({
      organization_id: auth.organizationId,
      staff_connector_id: id,
      connector_type_id: existing.connector_type_id,
      change_type: "unassigned",
      from_staff_id: existing.staff_id,
      changed_by: auth.userId,
    });

    return apiSuccess({ success: true });
  },
  { requiredRole: "slt" }
);

// ─── Helpers ─────────────────────────────────────────────────────────────
