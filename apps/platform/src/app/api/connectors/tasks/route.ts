import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";
import { validateBody } from "@/lib/validation";

const completeTaskSchema = z.object({
  id: z.string().uuid(),
  completion_notes: z.string().optional(),
  completion_evidence_url: z.string().optional(),
});

// GET /api/connectors/tasks - List tasks for the current user or all org tasks
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");
  const status = searchParams.get("status"); // 'overdue', 'due', 'pending', 'completed', 'all'
  const module = searchParams.get("module");

  let query = supabase
    .from("connector_tasks")
    .select(`
      *,
      staff_connectors (
        id, staff_id, scope,
        connector_types (
          id, name, slug, icon, color, category
        )
      )
    `)
    .eq("organization_id", auth.organizationId)
    .order("next_due_date", { ascending: true });

  if (status && status !== "all") {
    query = query.eq("status", status);
  } else if (!status) {
    // Default: show pending, due, overdue
    query = query.in("status", ["pending", "due", "overdue"]);
  }

  if (module) {
    query = query.eq("module", module);
  }

  const { data: tasks, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return apiError(error.message, 500);
  }

  // Filter by staff if requested
  let filtered = tasks || [];
  if (staffId) {
    filtered = filtered.filter(
      (t: any) => t.staff_connectors?.staff_id === staffId
    );
  }

  // Fetch staff names for display
  const staffIds = [...new Set(filtered.map((t: any) => t.staff_connectors?.staff_id).filter(Boolean))];
  let staffMap: Record<string, any> = {};

  if (staffIds.length > 0) {
    const { data: staffData } = await supabase
      .from("staff_directory")
      .select("id, first_name, last_name, display_name")
      .in("id", staffIds);

    if (staffData) {
      staffMap = Object.fromEntries(staffData.map((s: any) => [s.id, s]));
    }
  }

  // Enrich and flatten
  const enriched = filtered.map((t: any) => ({
    ...t,
    connector_type: t.staff_connectors?.connector_types || null,
    staff: staffMap[t.staff_connectors?.staff_id] || null,
    scope: t.staff_connectors?.scope || null,
    staff_connectors: undefined,
  }));

  return apiSuccess(enriched);
});

// POST /api/connectors/tasks - Complete a task
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const validated = validateBody(body, completeTaskSchema);
  if (!validated.success) return validated.response;

  const supabase = createServiceRoleClient();
  const { id, completion_notes, completion_evidence_url } = validated.data;

  // Get the task to calculate next occurrence
  const { data: task, error: fetchError } = await supabase
    .from("connector_tasks")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !task) {
    return apiError("Task not found", 404);
  }

  const now = new Date();

  // Update current task as completed
  const { error: updateError } = await supabase
    .from("connector_tasks")
    .update({
      status: "completed",
      completed_by: auth.userId,
      completed_at: now.toISOString(),
      completion_notes,
      completion_evidence_url,
      last_completed_date: now.toISOString().split("T")[0],
    })
    .eq("id", id);

  if (updateError) {
    console.error("Error completing task:", updateError);
    return apiError(updateError.message, 500);
  }

  // If recurring, create next instance
  if (task.frequency !== "once") {
    const nextDueDate = calculateNextDueFromCompleted(task);

    await supabase.from("connector_tasks").insert({
      organization_id: auth.organizationId,
      staff_connector_id: task.staff_connector_id,
      connector_type_id: task.connector_type_id,
      title: task.title,
      description: task.description,
      frequency: task.frequency,
      next_due_date: nextDueDate,
      recurrence_config: task.recurrence_config,
      module: task.module,
      status: "pending",
    });
  }

  return apiSuccess({ success: true, completed: true });
});

function calculateNextDueFromCompleted(task: any): string {
  const now = new Date();
  const config = task.recurrence_config || {};

  switch (task.frequency) {
    case "daily":
      now.setDate(now.getDate() + 1);
      break;
    case "weekly": {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const targetDay = days.indexOf(config.day?.toLowerCase() || "friday");
      now.setDate(now.getDate() + 7);
      if (targetDay >= 0) {
        const currentDay = now.getDay();
        const diff = targetDay - currentDay;
        now.setDate(now.getDate() + diff);
      }
      break;
    }
    case "monthly":
      now.setMonth(now.getMonth() + 1);
      break;
    case "termly":
      now.setMonth(now.getMonth() + 4); // Approximate
      break;
    case "yearly":
      if (config.month) {
        now.setFullYear(now.getFullYear() + 1);
        now.setMonth(config.month - 1, 1);
      } else {
        now.setFullYear(now.getFullYear() + 1);
      }
      break;
  }

  return now.toISOString().split("T")[0];
}
