import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";
import { validateBody } from "@/lib/validation";

const transferSchema = z.object({
  connector_id: z.string().uuid(),
  to_staff_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const bulkTransferSchema = z.object({
  from_staff_id: z.string().uuid(),
  transfers: z.array(z.object({
    connector_id: z.string().uuid(),
    to_staff_id: z.string().uuid(),
  })).max(50),
  reason: z.string().max(500).optional(),
});

// POST /api/connectors/transfer - Transfer a single connector to another staff member
export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();

    // Check if this is a bulk transfer
    if (body.transfers) {
      const validated = validateBody(body, bulkTransferSchema);
      if (!validated.success) return validated.response;

      const supabase = createServiceRoleClient();
      const results = [];

      for (const transfer of validated.data.transfers) {
        const result = await transferConnector(
          supabase,
          auth,
          transfer.connector_id,
          transfer.to_staff_id,
          validated.data.reason
        );
        results.push(result);
      }

      const failures = results.filter((r) => r.error);
      if (failures.length > 0) {
        return apiSuccess({
          success: true,
          transferred: results.filter((r) => !r.error).length,
          failed: failures.length,
          errors: failures.map((f) => f.error),
        });
      }

      return apiSuccess({
        success: true,
        transferred: results.length,
        failed: 0,
      });
    }

    // Single transfer
    const validated = validateBody(body, transferSchema);
    if (!validated.success) return validated.response;

    const supabase = createServiceRoleClient();
    const result = await transferConnector(
      supabase,
      auth,
      validated.data.connector_id,
      validated.data.to_staff_id,
      validated.data.reason
    );

    if (result.error) {
      return apiError(result.error, 400);
    }

    return apiSuccess(result.data);
  },
  { requiredRole: "slt" }
);

async function transferConnector(
  supabase: any,
  auth: any,
  connectorId: string,
  toStaffId: string,
  reason?: string
) {
  // Get the existing connector
  const { data: existing, error: fetchError } = await supabase
    .from("staff_connectors")
    .select("*, connector_types(*)")
    .eq("id", connectorId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !existing) {
    return { error: `Connector ${connectorId} not found` };
  }

  const fromStaffId = existing.staff_id;

  // End the old assignment
  await supabase
    .from("staff_connectors")
    .update({
      status: "ended",
      end_date: new Date().toISOString().split("T")[0],
    })
    .eq("id", connectorId);

  // Create new assignment for the new staff member
  const { data: newConnector, error: createError } = await supabase
    .from("staff_connectors")
    .insert({
      organization_id: auth.organizationId,
      staff_id: toStaffId,
      connector_type_id: existing.connector_type_id,
      is_primary: existing.is_primary,
      scope: existing.scope,
      scope_type: existing.scope_type,
      training_completed: false, // New person needs their own training verification
      assigned_by: auth.userId,
      status: existing.connector_types?.requires_training ? "pending_training" : "active",
    })
    .select()
    .single();

  if (createError) {
    // If creation fails (e.g. duplicate), restore old connector
    await supabase
      .from("staff_connectors")
      .update({ status: "active", end_date: null })
      .eq("id", connectorId);

    return { error: `Failed to transfer connector ${connectorId}` };
  }

  // Transfer active tasks to the new connector
  await supabase
    .from("connector_tasks")
    .update({ staff_connector_id: newConnector.id })
    .eq("staff_connector_id", connectorId)
    .in("status", ["pending", "due", "overdue"]);

  // Log the transfer
  await supabase.from("connector_change_log").insert({
    organization_id: auth.organizationId,
    staff_connector_id: newConnector.id,
    connector_type_id: existing.connector_type_id,
    change_type: "transferred",
    from_staff_id: fromStaffId,
    to_staff_id: toStaffId,
    changed_by: auth.userId,
    reason,
    details: {
      old_connector_id: connectorId,
      new_connector_id: newConnector.id,
    },
  });

  return { data: newConnector };
}
