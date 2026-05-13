import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  UnifiedTask,
  ActionForm,
  TaskType,
  TaskStatus,
  TaskSortOption,
  OrgTaskSummary,
} from "@/lib/tasks";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/tasks
 * Get unified tasks (combines actions and estates_compliance_tasks)
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const source = searchParams.get("source")?.split(",") as Array<
    "actions" | "estates_compliance_tasks"
  > | null;
  const status = searchParams.get("status")?.split(",") as TaskStatus[] | null;
  const taskType = searchParams.get("task_type")?.split(",") as
    | TaskType[]
    | null;
  const assigneeId = searchParams.get("assigneeId");
  const teamId = searchParams.get("teamId");
  const department = searchParams.get("department")?.split(",");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") as TaskSortOption | null;
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");
  const isOverdue = searchParams.get("is_overdue") === "true";

  const supabase = createServiceRoleClient();

  // Fetch actions with assignee info
  let actionsQuery = supabase
    .from("actions")
    .select(
      `
              *,
              assignee:users!actions_assignee_id_fkey (
                  id,
                  email,
                  raw_user_meta_data->>'full_name' as full_name
              )
          `,
    )
    .eq("organization_id", organizationId);

  // Apply filters
  if (status && status.length > 0) {
    actionsQuery = actionsQuery.in("status", status);
  }
  if (taskType && taskType.length > 0) {
    actionsQuery = actionsQuery.in("task_type", taskType);
  }
  if (assigneeId) {
    actionsQuery = actionsQuery.eq("assignee_id", assigneeId);
  }
  if (teamId) {
    actionsQuery = actionsQuery.eq("team_id", teamId);
  }
  if (department && department.length > 0) {
    actionsQuery = actionsQuery.in("department", department);
  }
  if (search) {
    actionsQuery = actionsQuery.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`,
    );
  }
  if (isOverdue) {
    actionsQuery = actionsQuery
      .lt("due_date", new Date().toISOString().split("T")[0])
      .not("status", "in", ["completed", "cancelled"]);
  }

  // Get total count before pagination (create a separate query for count)
  const countQuery = supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  // Apply same filters to count query
  if (status && status.length > 0) countQuery.in("status", status);
  if (taskType && taskType.length > 0) countQuery.in("task_type", taskType);
  if (assigneeId) countQuery.eq("assignee_id", assigneeId);
  if (teamId) countQuery.eq("team_id", teamId);
  if (department && department.length > 0)
    countQuery.in("department", department);
  if (search)
    countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  if (isOverdue) {
    countQuery
      .lt("due_date", new Date().toISOString().split("T")[0])
      .not("status", "in", ["completed", "cancelled"]);
  }

  const { count: actionsCount } = await countQuery;

  // Apply pagination
  actionsQuery = actionsQuery.range(offset, offset + limit - 1);

  // Apply sorting
  switch (sort) {
    case "due_date_asc":
      actionsQuery = actionsQuery.order("due_date", {
        ascending: true,
        nullsFirst: true,
      });
      break;
    case "due_date_desc":
      actionsQuery = actionsQuery.order("due_date", {
        ascending: false,
        nullsFirst: true,
      });
      break;
    case "priority_desc":
      actionsQuery = actionsQuery.order("priority", { ascending: false });
      break;
    case "priority_asc":
      actionsQuery = actionsQuery.order("priority", { ascending: true });
      break;
    case "created_desc":
      actionsQuery = actionsQuery.order("created_at", { ascending: false });
      break;
    case "created_asc":
      actionsQuery = actionsQuery.order("created_at", { ascending: true });
      break;
    case "title_asc":
      actionsQuery = actionsQuery.order("title", { ascending: true });
      break;
    case "title_desc":
      actionsQuery = actionsQuery.order("title", { ascending: false });
      break;
    default:
      actionsQuery = actionsQuery.order("created_at", { ascending: false });
  }

  const { data: actions, error: actionsError } = await actionsQuery;

  if (actionsError) {
    console.error("Error fetching tasks:", actionsError);
    return apiError("Failed to fetch tasks", 500);
  }

  // Fetch estates compliance tasks if needed
  let estatesTasks: any[] = [];
  if (!source || source.includes("estates_compliance_tasks")) {
    let estatesQuery = supabase
      .from("estates_compliance_tasks")
      .select("*")
      .eq("organization_id", organizationId);

    if (status && status.length > 0) {
      estatesQuery = estatesQuery.in("status", status);
    }
    if (assigneeId) {
      estatesQuery = estatesQuery.eq("assigned_to_id", assigneeId);
    }
    if (teamId) {
      estatesQuery = estatesQuery.eq("team_id", teamId);
    }
    if (search) {
      estatesQuery = estatesQuery.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }
    if (isOverdue) {
      estatesQuery = estatesQuery
        .lt("due_date", new Date().toISOString().split("T")[0])
        .not("status", "in", ["completed", "cancelled"]);
    }

    const { data: estatesData, error: estatesError } =
      await estatesQuery.limit(limit);

    if (!estatesError && estatesData) {
      estatesTasks = estatesData;
    }
  }

  // Fetch compliance tasks
  let complianceTasks: any[] = [];
  {
    let complianceQuery = supabase
      .from("compliance_tasks")
      .select("*")
      .eq("organization_id", organizationId);

    if (status && status.length > 0) {
      complianceQuery = complianceQuery.in("status", status);
    }
    if (assigneeId) {
      complianceQuery = complianceQuery.eq("assigned_to_user_id", assigneeId);
    }
    if (search) {
      complianceQuery = complianceQuery.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }
    if (isOverdue) {
      complianceQuery = complianceQuery
        .lt("due_date", new Date().toISOString().split("T")[0])
        .neq("status", "completed");
    }

    const { data: complianceData, error: complianceError } =
      await complianceQuery.limit(limit);

    if (!complianceError && complianceData) {
      complianceTasks = complianceData;
    }
  }

  // Fetch training tasks (completions that are expiring or expired)
  let trainingTasks: any[] = [];
  {
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split("T")[0];

    let trainingQuery = supabase
      .from("compliance_training_completions")
      .select(
        `
                  *,
                  course:compliance_training_courses!compliance_training_completions_course_id_fkey (
                      id, title, category
                  )
              `,
      )
      .eq("organization_id", organizationId)
      .not("expires_at", "is", null)
      .lte("expires_at", thirtyDaysStr);

    if (assigneeId) {
      trainingQuery = trainingQuery.eq("user_id", assigneeId);
    }

    const { data: trainingData, error: trainingError } =
      await trainingQuery.limit(limit);

    if (!trainingError && trainingData) {
      trainingTasks = trainingData;
    }
  }

  // Fetch risk register entries
  let riskTasks: any[] = [];
  {
    let riskQuery = supabase
      .from("risk_register")
      .select(
        `
                  *,
                  mitigations:risk_mitigations (
                      id, title, overdue, effectiveness
                  )
              `,
      )
      .eq("organization_id", organizationId)
      .in("status", ["treating", "assessing"]);

    if (assigneeId) {
      riskQuery = riskQuery.eq("risk_owner_id", assigneeId);
    }
    if (search) {
      riskQuery = riskQuery.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    const { data: riskData, error: riskError } = await riskQuery.limit(limit);

    if (!riskError && riskData) {
      riskTasks = riskData.filter((r: any) => {
        const hasOverdueMitigations = r.mitigations?.some(
          (m: any) => m.overdue,
        );
        return (
          r.status === "treating" ||
          r.status === "assessing" ||
          hasOverdueMitigations
        );
      });
    }
  }

  // Combine and format tasks
  const unifiedTasks: any[] = [
    ...(actions || []).map((a: any) => ({
      id: a.id,
      organization_id: a.organization_id,
      source_table: "actions" as const,
      task_type: a.task_type || "general",
      title: a.title,
      description: a.description,
      category: a.category_id,
      subcategory: a.subcategory_id,
      module: a.module,
      priority: a.priority,
      status: a.status,
      progress: a.progress || 0,
      due_date: a.due_date,
      start_date: a.start_date,
      owner: a.owner_name,
      assignee_id: a.assignee_id,
      team_id: a.team_id,
      department: a.department,
      estimated_hours: a.estimated_hours,
      actual_hours: a.actual_hours,
      parent_task_id: a.parent_task_id,
      dependencies: a.dependencies || [],
      checklist: a.checklist || [],
      linked_evidence: a.linked_evidence || [],
      notes: a.notes || [],
      approval_status: a.approval_status || "approved",
      approved_by: a.approved_by,
      approved_at: a.approved_at,
      completed_at: a.completed_at,
      completed_by: a.completed_by,
      template_id: a.template_id,
      recurrence_rule: a.recurrence_rule,
      recurrence_id: a.recurrence_id,
      siams_strand_id: a.siams_strand_id,
      siams_question_id: a.siams_question_id,
      framework_type: a.framework_type,
      source: a.source,
      route_path: a.route_path,
      source_record_id: a.source_record_id,
      source_table_name: a.source_table_name,
      created_from_finding_id: a.created_from_finding_id,
      created_at: a.created_at,
      updated_at: a.updated_at,
    })),
    ...estatesTasks.map((e: any) => ({
      id: e.id,
      organization_id: e.organization_id,
      source_table: "estates_compliance_tasks" as const,
      task_type: "estates",
      title: e.title,
      description: e.description,
      category: e.domain_id,
      subcategory: e.check_type_id,
      module: "estates",
      priority: e.priority,
      status: e.status,
      progress: e.progress || 0,
      due_date: e.due_date,
      start_date: e.scheduled_date,
      owner: e.assigned_to_name,
      assignee_id: e.assigned_to_id,
      team_id: e.team_id,
      department: "estates",
      estimated_hours: e.estimated_hours,
      actual_hours: e.actual_hours,
      parent_task_id: null,
      dependencies: e.dependencies || [],
      checklist: [],
      linked_evidence: e.evidence_ids || [],
      notes: e.findings || null,
      approval_status: "approved",
      approved_by: e.approved_by,
      approved_at: e.approved_at,
      completed_at: e.completed_at,
      completed_by: e.completed_by,
      template_id: null,
      recurrence_rule: null,
      recurrence_id: null,
      siams_strand_id: null,
      siams_question_id: null,
      created_at: e.created_at,
      updated_at: e.updated_at,
    })),
    // Compliance tasks
    ...complianceTasks.map((c: any) => ({
      id: c.id,
      organization_id: c.organization_id,
      source_table: "compliance_tasks" as const,
      task_type: "compliance",
      title: c.title,
      description: c.description,
      module: "compliance",
      priority: "medium" as const,
      status: c.status,
      progress: c.status === "completed" ? 100 : 0,
      due_date: c.due_date,
      assignee_id: c.assigned_to_user_id,
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    // Training tasks
    ...trainingTasks.map((t: any) => {
      const today = new Date().toISOString().split("T")[0];
      const isExpired = t.expires_at && t.expires_at < today;
      const courseName = t.course?.title || "Training course";
      return {
        id: t.id,
        organization_id: t.organization_id,
        source_table: "compliance_training_completions" as const,
        task_type: "training",
        title: isExpired
          ? `Renew: ${courseName}`
          : `Expiring soon: ${courseName}`,
        description: isExpired
          ? `Training expired on ${t.expires_at}. Renewal required.`
          : `Training expires on ${t.expires_at}. Please renew before it lapses.`,
        module: "training",
        priority: isExpired ? ("high" as const) : ("medium" as const),
        status: isExpired ? ("pending" as const) : ("in_progress" as const),
        progress: 0,
        due_date: t.expires_at,
        assignee_id: t.user_id,
        created_at: t.created_at,
        updated_at: t.created_at,
      };
    }),
    // Risk register tasks
    ...riskTasks.map((r: any) => {
      const overdueMitigations =
        r.mitigations?.filter((m: any) => m.overdue) || [];
      const hasOverdue = overdueMitigations.length > 0;
      const riskScore = r.effective_residual_score || r.inherent_score || null;
      return {
        id: r.id,
        organization_id: r.organization_id,
        source_table: "risk_register" as const,
        task_type: "risk",
        title: hasOverdue
          ? `Risk: ${r.title} (${overdueMitigations.length} overdue mitigation${overdueMitigations.length > 1 ? "s" : ""})`
          : `Risk: ${r.title}`,
        description: r.description,
        module: "risk",
        priority:
          riskScore && riskScore >= 15
            ? ("critical" as const)
            : riskScore && riskScore >= 10
              ? ("high" as const)
              : riskScore && riskScore >= 5
                ? ("medium" as const)
                : ("low" as const),
        status:
          r.status === "treating"
            ? ("in_progress" as const)
            : ("pending" as const),
        progress: 0,
        due_date: r.next_review_at ? r.next_review_at.split("T")[0] : null,
        assignee_id: r.risk_owner_id,
        risk_score: riskScore,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    }),
  ];

  // Enrich with assignee info
  const userIds = unifiedTasks
    .map((t) => t.assignee_id)
    .filter((id): id is string => id !== null && id !== undefined);

  let usersMap: Record<string, { name: string; email: string }> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, email, raw_user_meta_data->>'full_name' as full_name")
      .in("id", userIds.slice(0, 100));

    usersMap = (users || []).reduce((acc: any, u: any) => {
      acc[u.id] = { name: u.full_name || u.email, email: u.email };
      return acc;
    }, {});
  }

  const tasksWithAssignee = unifiedTasks.map((task) => ({
    ...task,
    assignee_name: task.assignee_id
      ? usersMap[task.assignee_id]?.name || null
      : null,
  }));

  // Calculate summary statistics
  const summary = await calculateTaskSummary(supabase, organizationId);

  return apiSuccess({
    tasks: tasksWithAssignee,
    total:
      (actionsCount || 0) +
      estatesTasks.length +
      complianceTasks.length +
      trainingTasks.length +
      riskTasks.length,
    summary,
  });
});

/**
 * POST /api/tasks
 * Create a new task
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { userId, task } = body;
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!task) {
    return apiError("Missing required fields: task", 400);
  }

  const supabase = createServiceRoleClient();

  const taskId = uuidv4();
  const checklistWithIds = (task.checklist || []).map((item: any) => ({
    ...item,
    id: item.id || uuidv4(),
    completed: false,
    completed_by: null,
    completed_at: null,
  }));

  const { data: newTask, error } = await supabase
    .from("actions")
    .insert({
      id: taskId,
      organization_id: orgId,
      user_id: userId || auth.userId,
      title: task.title,
      description: task.description,
      category_id: task.category_id || null,
      subcategory_id: task.subcategory_id || null,
      module: task.module || null,
      task_type: task.task_type || "general",
      team_id: task.team_id || null,
      department: task.department || null,
      priority: task.priority,
      status: task.status || "not_started",
      due_date: task.due_date || null,
      start_date: task.start_date || null,
      assignee_id: task.assignee_id || null,
      dependencies: task.dependencies || [],
      checklist: checklistWithIds,
      estimated_hours: task.estimated_hours || null,
      siams_strand_id: task.siams_strand_id || null,
      siams_question_id: task.siams_question_id || null,
      parent_task_id: task.parent_task_id || null,
      template_id: task.template_id || null,
      recurrence_rule: task.recurrence_rule || null,
      framework_type: task.framework_type || null,
      source: task.source || null,
      route_path: task.route_path || null,
      source_record_id: task.source_record_id || null,
      source_table_name: task.source_table_name || null,
      created_from_finding_id: task.created_from_finding_id || null,
      linked_evidence: task.linked_evidence || [],
      notes: [],
      approval_status: task.needs_approval ? "pending_approval" : "approved",
      progress: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    return apiError("Failed to create task", 500);
  }

  return apiSuccess(
    { task: { ...newTask, source_table: "actions" }, created: true },
    201,
  );
});

/**
 * PATCH /api/tasks
 * Bulk update tasks
 */
export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { updates } = body as {
    updates: Array<{ id: string; changes: Partial<ActionForm> }>;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!updates || !Array.isArray(updates)) {
    return apiError("Missing required fields: updates (array)", 400);
  }

  const supabase = createServiceRoleClient();

  const results = await Promise.all(
    updates.map(async ({ id, changes }) => {
      const updateData: any = { ...changes };

      if (changes.checklist) {
        updateData.checklist = changes.checklist.map((item) => ({
          ...item,
          id: item.id || uuidv4(),
        }));
      }

      if (changes.checklist) {
        const completedCount = changes.checklist.filter(
          (c) => c.completed,
        ).length;
        updateData.progress = Math.round(
          (completedCount / changes.checklist.length) * 100,
        );
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("actions")
        .update(updateData)
        .eq("id", id)
        .eq("organization_id", orgId)
        .select()
        .maybeSingle();

      return { task: data, error };
    }),
  );

  const successCount = results.filter((r) => !r.error && r.task).length;
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return apiSuccess({
    updated: successCount,
    failed: results.length - successCount,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * DELETE /api/tasks
 * Delete tasks
 */
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const ids = searchParams.get("ids")?.split(",");
  const source = searchParams.get("source");

  if (!ids || ids.length === 0) {
    return apiError("Missing required parameters: ids", 400);
  }

  const supabase = createServiceRoleClient();

  let deleted = 0;
  let errors: string[] = [];

  // Delete from actions
  if (!source || source.includes("actions")) {
    const { error } = await supabase
      .from("actions")
      .delete()
      .in("id", ids)
      .eq("organization_id", organizationId);

    if (error) {
      errors.push(`Actions: ${error.message}`);
    } else {
      deleted += error === null ? ids.length : 0;
    }
  }

  // Delete from estates_compliance_tasks
  if (!source || source.includes("estates_compliance_tasks")) {
    const { error } = await supabase
      .from("estates_compliance_tasks")
      .delete()
      .in("id", ids)
      .eq("organization_id", organizationId);

    if (error) {
      errors.push(`Estates: ${error.message}`);
    } else {
      deleted += 1;
    }
  }

  if (errors.length > 0) {
    return apiError("Some deletions failed", 500, undefined, errors);
  }

  return apiSuccess({ success: true, deleted });
});

/**
 * Helper function to calculate task summary statistics
 */
async function calculateTaskSummary(
  supabase: any,
  organizationId: string,
): Promise<OrgTaskSummary> {
  const { data: actions } = await supabase
    .from("actions")
    .select("status, priority, task_type, due_date")
    .eq("organization_id", organizationId);

  if (!actions) {
    return {
      total_tasks: 0,
      by_status: {} as any,
      by_priority: {} as any,
      by_type: {} as any,
      overdue_count: 0,
      due_this_week: 0,
      completion_rate: 0,
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekFromNowStr = weekFromNow.toISOString().split("T")[0];

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let overdueCount = 0;
  let dueThisWeek = 0;
  let completedCount = 0;

  actions.forEach((a: any) => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byPriority[a.priority] = (byPriority[a.priority] || 0) + 1;
    byType[a.task_type || "general"] =
      (byType[a.task_type || "general"] || 0) + 1;

    if (a.status === "completed") completedCount++;

    if (a.due_date && a.status !== "completed" && a.status !== "cancelled") {
      if (a.due_date < today) overdueCount++;
      if (a.due_date >= today && a.due_date <= weekFromNowStr) dueThisWeek++;
    }
  });

  return {
    total_tasks: actions.length,
    by_status: byStatus,
    by_priority: byPriority,
    by_type: byType,
    overdue_count: overdueCount,
    due_this_week: dueThisWeek,
    completion_rate:
      actions.length > 0
        ? Math.round((completedCount / actions.length) * 100)
        : 0,
  };
}
