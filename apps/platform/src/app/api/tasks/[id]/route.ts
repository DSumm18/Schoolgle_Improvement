import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { ActionForm } from "@/lib/tasks";
import { v4 as uuidv4 } from "uuid";

async function moveAssignedOfstedFindingToVerification(
  supabase: ReturnType<typeof createServiceRoleClient>,
  input: {
    organizationId: string;
    taskId: string;
    actorUserId: string;
    now: string;
  },
) {
  const { data: existingFindings } = await supabase
    .from("ofsted_findings")
    .select("id,status")
    .eq("organization_id", input.organizationId)
    .eq("assigned_task_id", input.taskId)
    .neq("status", "verified");

  if (!existingFindings?.length) return;

  const findingIds = existingFindings.map((finding: any) => finding.id);
  const { error } = await supabase
    .from("ofsted_findings")
    .update({
      status: "verification_required",
      verification_status: "pending",
      updated_at: input.now,
    })
    .eq("organization_id", input.organizationId)
    .in("id", findingIds);

  if (error) {
    console.warn("[Tasks] Could not move Ofsted finding to verification:", error.message);
    return;
  }

  await supabase.from("ofsted_finding_events").insert(
    existingFindings.map((finding: any) => ({
      organization_id: input.organizationId,
      finding_id: finding.id,
      event_type: "task_completed_verification_required",
      actor_user_id: input.actorUserId,
      previous_status: finding.status,
      new_status: "verification_required",
      metadata: {
        task_id: input.taskId,
      },
    })),
  );
}

/**
 * GET /api/tasks/[id]
 * Get a specific task by ID
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/").at(-1)!;
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  const supabase = createServiceRoleClient();

  // Try to find in actions first
  const { data: taskRaw, error } = await supabase
    .from("actions")
    .select(
      `
            *,
            assignee:users!actions_assignee_id_fkey (
                id,
                email,
                raw_user_meta_data->>'full_name' as full_name
            ),
            approver:users!actions_approved_by_fkey (
                id,
                email,
                raw_user_meta_data->>'full_name' as full_name
            )
        `,
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const task = taskRaw as any;

  if (task) {
    // Enrich with subtasks if parent
    let subtasks: any[] = [];
    if (task.parent_task_id) {
      const { data: siblings } = await supabase
        .from("actions")
        .select("id, title, status, progress")
        .eq("parent_task_id", task.parent_task_id)
        .order("sort_order", { ascending: true });
      subtasks = siblings || [];
    } else {
      const { data: subtasksData } = await supabase
        .from("task_subtasks")
        .select("*")
        .eq("parent_task_id", id)
        .order("sort_order", { ascending: true });
      subtasks = subtasksData || [];
    }

    return apiSuccess({
      task: {
        ...task,
        source_table: "actions",
        assignee_name:
          task.assignee?.full_name ||
          task.assignee?.email ||
          task.owner_name ||
          null,
        approver_name: task.approver?.full_name || task.approver?.email || null,
        subtasks,
      },
    });
  }

  // Try estates compliance tasks
  const { data: estatesTaskRaw } = await supabase
    .from("estates_compliance_tasks")
    .select(
      `
            *,
            assignee:users!estates_compliance_tasks_assigned_to_id_fkey (
                id,
                email,
                raw_user_meta_data->>'full_name' as full_name
            )
        `,
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const estatesTask = estatesTaskRaw as any;

  if (estatesTask) {
    return apiSuccess({
      task: {
        ...estatesTask,
        source_table: "estates_compliance_tasks",
        assignee_name:
          estatesTask.assignee?.full_name ||
          estatesTask.assignee?.email ||
          null,
      },
    });
  }

  return apiError("Task not found", 404);
});

/**
 * PATCH /api/tasks/[id]
 * Update a specific task
 */
export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/").at(-1)!;
  const body = await req.json();
  const { ...changes } = body as Partial<ActionForm>;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  const supabase = createServiceRoleClient();

  // Prepare update data
  let updateData: any = { ...changes };

  if (changes.checklist) {
    updateData.checklist = changes.checklist.map((item) => ({
      ...item,
      id: item.id || uuidv4(),
    }));
  }

  if (changes.checklist) {
    const completedCount = changes.checklist.filter((c) => c.completed).length;
    updateData.progress = Math.round(
      (completedCount / changes.checklist.length) * 100,
    );
  }

  if (changes.status === "completed" && !updateData.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  updateData.updated_at = new Date().toISOString();

  // Update in actions table
  const { data: task, error } = await supabase
    .from("actions")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .maybeSingle();

  if (error) {
    // Try estates compliance tasks
    const estatesUpdateData: any = {};
    if (changes.status === "completed") {
      estatesUpdateData.completed_at = new Date().toISOString();
      estatesUpdateData.progress = 100;
    }

    const { data: estatesTask, error: estatesError } = await supabase
      .from("estates_compliance_tasks")
      .update(estatesUpdateData)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .maybeSingle();

    if (estatesError || !estatesTask) {
      return apiError("Task not found or update failed", 404);
    }

    return apiSuccess({
      task: estatesTask,
      source: "estates_compliance_tasks",
    });
  }

  if (changes.status === "completed" && task) {
    await moveAssignedOfstedFindingToVerification(supabase, {
      organizationId: orgId,
      taskId: id,
      actorUserId: auth.userId,
      now: updateData.updated_at,
    });
  }

  return apiSuccess({ task, source: "actions" });
});

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/").at(-1)!;
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  const supabase = createServiceRoleClient();

  // Try actions first
  const { error: actionsError } = await supabase
    .from("actions")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (!actionsError) {
    return apiSuccess({ success: true });
  }

  // Try estates compliance tasks
  const { error: estatesError } = await supabase
    .from("estates_compliance_tasks")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (estatesError) {
    return apiError("Task not found", 404);
  }

  return apiSuccess({ success: true });
});

/**
 * POST /api/tasks/[id]/complete
 * Mark a task as complete
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/").at(-1)!;
  const body = await req.json();
  const { userId, completionNotes } = body as {
    userId?: string;
    completionNotes?: string;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  const supabase = createServiceRoleClient();

  const now = new Date().toISOString();

  // Update in actions table
  const { data: task, error } = await supabase
    .from("actions")
    .update({
      status: "completed",
      progress: 100,
      completed_at: now,
      completed_by: userId || auth.userId,
      updated_at: now,
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .maybeSingle();

  if (error) {
    // Try estates compliance tasks
    const { data: estatesTask, error: estatesError } = await supabase
      .from("estates_compliance_tasks")
      .update({
        status: "completed",
        progress: 100,
        completed_at: now,
        completed_by: userId || auth.userId,
        updated_at: now,
      })
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .maybeSingle();

    if (estatesError || !estatesTask) {
      return apiError("Task not found", 404);
    }

    // Add completion note as a comment if estates task
    if (completionNotes) {
      await supabase.from("task_comments").insert({
        id: uuidv4(),
        organization_id: orgId,
        task_id: id,
        task_source: "estates_compliance_tasks",
        content: completionNotes,
        comment_type: "system",
        user_id: userId || auth.userId,
        created_at: now,
      });
    }

    return apiSuccess({ task: estatesTask });
  }

  // Add completion note if provided
  if (completionNotes) {
    await supabase.from("task_comments").insert({
      id: uuidv4(),
      organization_id: orgId,
      task_id: id,
      task_source: "actions",
      content: completionNotes,
      comment_type: "system",
      user_id: userId || auth.userId,
      created_at: now,
    });
  }

  if (task) {
    await moveAssignedOfstedFindingToVerification(supabase, {
      organizationId: orgId,
      taskId: id,
      actorUserId: userId || auth.userId,
      now,
    });
  }

  return apiSuccess({ task });
});
