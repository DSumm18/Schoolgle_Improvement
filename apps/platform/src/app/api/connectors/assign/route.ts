import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";
import { validateBody } from "@/lib/validation";

const assignSchema = z.object({
  staff_id: z.string().uuid(),
  connector_type_id: z.string().uuid(),
  is_primary: z.boolean().default(true),
  scope: z.string().default("whole school"),
  scope_type: z.enum([
    "whole_school", "key_stage", "year_group", "building", "department", "custom",
  ]).default("whole_school"),
  training_completed: z.boolean().default(false),
  training_completed_date: z.string().nullable().optional(),
  training_expiry_date: z.string().nullable().optional(),
  training_certificate_url: z.string().nullable().optional(),
  training_provider: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  is_primary: z.boolean().optional(),
  scope: z.string().optional(),
  scope_type: z.enum([
    "whole_school", "key_stage", "year_group", "building", "department", "custom",
  ]).optional(),
  training_completed: z.boolean().optional(),
  training_completed_date: z.string().nullable().optional(),
  training_expiry_date: z.string().nullable().optional(),
  training_certificate_url: z.string().nullable().optional(),
  training_provider: z.string().nullable().optional(),
  status: z.enum(["active", "pending_training", "expired_training", "ended"]).optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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
      .select("requires_training, auto_tasks, name")
      .eq("id", data.connector_type_id)
      .single();

    if (connectorType?.requires_training && !data.training_completed) {
      status = "pending_training";
    }

    // Create the assignment
    const { data: connector, error } = await supabase
      .from("staff_connectors")
      .insert({
        organization_id: auth.organizationId,
        staff_id: data.staff_id,
        connector_type_id: data.connector_type_id,
        is_primary: data.is_primary,
        scope: data.scope,
        scope_type: data.scope_type,
        training_completed: data.training_completed,
        training_completed_date: data.training_completed_date,
        training_expiry_date: data.training_expiry_date,
        training_certificate_url: data.training_certificate_url,
        training_provider: data.training_provider,
        assigned_by: auth.userId,
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
      return apiError(error.message, 500);
    }

    // Auto-generate tasks from connector type definition
    if (connectorType?.auto_tasks && Array.isArray(connectorType.auto_tasks)) {
      const tasks = connectorType.auto_tasks.map((task: any) => ({
        organization_id: auth.organizationId,
        staff_connector_id: connector.id,
        connector_type_id: data.connector_type_id,
        title: task.name,
        description: task.description || null,
        frequency: task.frequency,
        module: task.module || null,
        recurrence_config: {
          day: task.day || null,
          month: task.month || null,
        },
        next_due_date: calculateNextDueDate(task),
        status: "pending",
      }));

      if (tasks.length > 0) {
        const { error: taskError } = await supabase
          .from("connector_tasks")
          .insert(tasks);

        if (taskError) {
          console.error("Error creating auto-tasks:", taskError);
          // Non-fatal: connector was created, tasks failed
        }
      }
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
      return apiError(error.message, 500);
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
        details: updateData,
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
      return apiError(error.message, 500);
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

function calculateNextDueDate(task: any): string {
  const now = new Date();

  switch (task.frequency) {
    case "daily":
      now.setDate(now.getDate() + 1);
      break;
    case "weekly": {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const targetDay = days.indexOf(task.day?.toLowerCase() || "friday");
      const currentDay = now.getDay();
      const daysUntil = targetDay > currentDay ? targetDay - currentDay : 7 - (currentDay - targetDay);
      now.setDate(now.getDate() + daysUntil);
      break;
    }
    case "monthly":
      now.setMonth(now.getMonth() + 1, 1);
      break;
    case "termly":
      // Approximate: next term boundary
      if (now.getMonth() < 3) now.setMonth(3, 1);       // Easter
      else if (now.getMonth() < 6) now.setMonth(6, 20);  // Summer
      else if (now.getMonth() < 11) now.setMonth(11, 15); // Christmas
      else { now.setFullYear(now.getFullYear() + 1); now.setMonth(3, 1); }
      break;
    case "yearly":
      if (task.month) {
        const targetMonth = task.month - 1; // 0-indexed
        if (now.getMonth() >= targetMonth) {
          now.setFullYear(now.getFullYear() + 1);
        }
        now.setMonth(targetMonth, 1);
      } else {
        now.setFullYear(now.getFullYear() + 1);
      }
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }

  return now.toISOString().split("T")[0];
}
