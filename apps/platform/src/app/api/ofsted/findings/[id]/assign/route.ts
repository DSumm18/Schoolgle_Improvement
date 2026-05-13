import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { buildActionFormFromFinding } from "@/lib/ofsted-readiness/findings";

export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const findingId = request.nextUrl.pathname
      .split("/ofsted/findings/")[1]
      ?.split("/")[0];

    if (!findingId) {
      return apiError("Missing finding id", 400);
    }

    const body = await request.json();
    const assigneeId = body.assignee_id || body.assigneeId || null;
    const dueDate = body.due_date || body.dueDate || null;

    if (!assigneeId) {
      return apiError("Missing assignee_id", 400);
    }

    const supabase = createServiceRoleClient();

    const { data: finding, error: findingError } = await supabase
      .from("ofsted_findings")
      .select("*")
      .eq("id", findingId)
      .eq("organization_id", auth.organizationId)
      .single();

    if (findingError || !finding) {
      return apiError("Finding not found", 404);
    }

    if (finding.assigned_task_id) {
      return apiSuccess({
        finding,
        task_id: finding.assigned_task_id,
        already_assigned: true,
      });
    }

    const task = buildActionFormFromFinding(finding);
    const taskId = uuidv4();
    const now = new Date().toISOString();

    const checklistWithIds = (task.checklist || []).map((item: any) => ({
      ...item,
      id: item.id || uuidv4(),
      completed: false,
      completed_by: null,
      completed_at: null,
    }));

    const { data: createdTask, error: taskError } = await supabase
      .from("actions")
      .insert({
        id: taskId,
        organization_id: auth.organizationId,
        user_id: auth.userId,
        title: body.title || task.title,
        description: body.description || task.description,
        category_id: task.category_id || null,
        subcategory_id: task.subcategory_id || null,
        module: task.module,
        task_type: task.task_type,
        team_id: body.team_id || null,
        department: body.department || null,
        priority: body.priority || task.priority,
        status: "not_started",
        due_date: dueDate,
        start_date: body.start_date || null,
        assignee_id: assigneeId,
        dependencies: [],
        checklist: checklistWithIds,
        estimated_hours: body.estimated_hours || null,
        linked_evidence: task.linked_evidence || [],
        notes: [],
        approval_status: "approved",
        approved_by: auth.userId,
        approved_at: now,
        framework_type: task.framework_type,
        source: task.source,
        route_path: task.route_path,
        source_record_id: task.source_record_id,
        source_table_name: task.source_table_name,
        created_from_finding_id: task.created_from_finding_id,
        progress: 0,
      })
      .select()
      .single();

    if (taskError || !createdTask) {
      console.error("[Ofsted Findings] Assignment task create failed:", taskError);
      return apiError("Failed to create task from finding", 500);
    }

    const { data: updatedFinding, error: updateError } = await supabase
      .from("ofsted_findings")
      .update({
        status: "assigned",
        assigned_task_id: createdTask.id,
        assigned_task_source: "actions",
        assigned_to: assigneeId,
        approved_by: auth.userId,
        approved_at: now,
        updated_at: now,
      })
      .eq("id", findingId)
      .eq("organization_id", auth.organizationId)
      .select()
      .single();

    if (updateError) {
      console.error("[Ofsted Findings] Assignment update failed:", updateError);
      return apiError("Task created but finding update failed", 500);
    }

    await supabase.from("ofsted_finding_events").insert({
      organization_id: auth.organizationId,
      finding_id: findingId,
      event_type: "assigned",
      actor_user_id: auth.userId,
      previous_status: finding.status,
      new_status: "assigned",
      metadata: {
        task_id: createdTask.id,
        assigned_to: assigneeId,
      },
    });

    return apiSuccess(
      {
        finding: updatedFinding,
        task: { ...createdTask, source_table: "actions" },
        assigned: true,
      },
      201,
    );
  },
  { requiredRole: "teacher" },
);
