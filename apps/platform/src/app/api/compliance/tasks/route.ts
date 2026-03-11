import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/tasks
 * List compliance tasks for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const assignedTo = searchParams.get("assignedTo");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("compliance_tasks")
    .select("*, compliance_item:compliance_items(id, title, type, status)")
    .eq("organization_id", organizationId)
    .order("due_date", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }
  if (assignedTo) {
    query = query.eq("assigned_to_user_id", assignedTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return apiError("Failed to fetch tasks", 500);
  }

  return apiSuccess({ tasks: data || [] });
});

/**
 * POST /api/compliance/tasks
 * Create a new compliance task
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      compliance_item_id,
      title,
      description,
      assigned_to_user_id,
      assigned_to_role,
      due_date,
      evidence_required,
    } = body;

    if (!title) {
      return apiError("Missing required field: title", 400);
    }

    const supabase = createServiceRoleClient();

    const { data: task, error } = await supabase
      .from("compliance_tasks")
      .insert({
        organization_id: organizationId,
        compliance_item_id,
        title,
        description,
        assigned_to_user_id,
        assigned_to_role,
        due_date,
        status: "pending",
        evidence_required: evidence_required || false,
        created_by_user_id: userId,
      })
      .select("*, compliance_item:compliance_items(id, title, type, status)")
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return apiError("Failed to create task", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "compliance_task",
      entity_id: task.id,
      action: "created",
      actor_user_id: userId,
      metadata: { title, due_date, assigned_to_user_id },
    });

    return apiSuccess({ task }, 201);
  },
  { requiredRole: "teacher" },
);

/**
 * PUT /api/compliance/tasks
 * Update task status
 */
export const PUT = protectedRoute(
  async (auth, request) => {
    const { userId } = auth;
    const body = await request.json();
    const { id, status, completed_at } = body;

    if (!id || !status) {
      return apiError("Missing required fields: id, status", 400);
    }

    const supabase = createServiceRoleClient();

    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completed_at = completed_at || new Date().toISOString();
    }

    const { data: task, error } = await supabase
      .from("compliance_tasks")
      .update(updateData)
      .eq("id", id)
      .select("*, compliance_item:compliance_items(id, title, type, status)")
      .single();

    if (error) {
      console.error("Error updating task:", error);
      return apiError("Failed to update task", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: task.organization_id,
      entity_type: "compliance_task",
      entity_id: id,
      action: status === "completed" ? "completed" : "status_changed",
      actor_user_id: userId,
      metadata: { status },
    });

    return apiSuccess({ task });
  },
  { requiredRole: "teacher" },
);
