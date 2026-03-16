/**
 * Workflow Engine
 *
 * Core library for managing templated workflows with phases, steps,
 * progress tracking, and procurement integration.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkflowStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";
export type PhaseStatus = "pending" | "active" | "completed" | "skipped";
export type StepStatus =
  | "blocked"
  | "todo"
  | "in_progress"
  | "done"
  | "skipped";

export interface WorkflowStep {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: StepStatus;
  owner_role: string | null;
  assigned_to: string | null;
  depends_on_step_ids: string[];
  due_days_offset: number | null;
  completion_notes: string | null;
  completion_evidence: Record<string, unknown> | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowPhase {
  id: string;
  workflow_id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: PhaseStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  steps: WorkflowStep[];
}

export interface Workflow {
  id: string;
  organization_id: string;
  template_slug: string | null;
  title: string;
  description: string | null;
  status: WorkflowStatus;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  phases: WorkflowPhase[];
}

export interface CreateWorkflowOptions {
  title?: string;
  description?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
  startImmediately?: boolean;
}

export interface ProcurementRequest {
  id: string;
  organization_id: string;
  workflow_id: string | null;
  workflow_step_id: string | null;
  title: string;
  description: string | null;
  estimated_value: number | null;
  currency: string;
  status: string;
  requested_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AdvanceResult {
  phaseAdvanced: boolean;
  workflowCompleted: boolean;
  nextPhase: WorkflowPhase | null;
  progress: number;
}

interface TaskGroup {
  workflow: Pick<Workflow, "id" | "title" | "status">;
  phase: Pick<WorkflowPhase, "id" | "title">;
  steps: WorkflowStep[];
}

// ---------------------------------------------------------------------------
// 1. createFromTemplate
// ---------------------------------------------------------------------------

export async function createFromTemplate(
  supabase: SupabaseClient,
  orgId: string,
  templateSlug: string,
  options: CreateWorkflowOptions = {},
): Promise<Workflow> {
  // Load template
  const { data: template, error: tplErr } = await supabase
    .from("workflow_templates")
    .select("*")
    .eq("slug", templateSlug)
    .single();

  if (tplErr || !template) {
    throw new Error(`Template not found: ${templateSlug}`);
  }

  const templatePhases: Array<{
    title: string;
    description?: string;
    order_index: number;
    steps: Array<{
      title: string;
      description?: string;
      order_index: number;
      owner_role?: string;
      depends_on_step_indexes?: number[];
      due_days_offset?: number;
    }>;
  }> = template.phases ?? [];

  // Create workflow record
  const now = new Date().toISOString();
  const startImmediately = options.startImmediately !== false;

  const { data: workflow, error: wfErr } = await supabase
    .from("workflows")
    .insert({
      organization_id: orgId,
      template_slug: templateSlug,
      title: options.title ?? template.title,
      description: options.description ?? template.description ?? null,
      status: startImmediately ? "active" : ("draft" as WorkflowStatus),
      progress: 0,
      started_at: startImmediately ? now : null,
      created_by: options.createdBy ?? null,
      metadata: options.metadata ?? null,
    })
    .select("*")
    .single();

  if (wfErr || !workflow) {
    throw new Error(`Failed to create workflow: ${wfErr?.message}`);
  }

  // Track step id mapping for dependency resolution (template order_index → DB id)
  const stepIdMap = new Map<string, string>(); // "phaseIdx:stepIdx" → step.id

  const phases: WorkflowPhase[] = [];

  for (const tplPhase of templatePhases) {
    const isFirstPhase =
      tplPhase.order_index === 0 || tplPhase.order_index === 1;
    const phaseStatus: PhaseStatus =
      startImmediately && isFirstPhase ? "active" : "pending";

    const { data: phase, error: phErr } = await supabase
      .from("workflow_phases")
      .insert({
        workflow_id: workflow.id,
        title: tplPhase.title,
        description: tplPhase.description ?? null,
        order_index: tplPhase.order_index,
        status: phaseStatus,
      })
      .select("*")
      .single();

    if (phErr || !phase) {
      throw new Error(`Failed to create phase: ${phErr?.message}`);
    }

    const steps: WorkflowStep[] = [];
    const tplSteps = tplPhase.steps ?? [];

    for (const tplStep of tplSteps) {
      const isFirstStep =
        isFirstPhase &&
        (tplStep.order_index === 0 || tplStep.order_index === 1);

      // Resolve dependency ids
      const dependsOnIds: string[] = [];
      if (tplStep.depends_on_step_indexes) {
        for (const depIdx of tplStep.depends_on_step_indexes) {
          // depends_on_step_indexes references flat step indexes within the same phase
          const depKey = `${tplPhase.order_index}:${depIdx}`;
          const depId = stepIdMap.get(depKey);
          if (depId) dependsOnIds.push(depId);
        }
      }

      let stepStatus: StepStatus = "blocked";
      if (startImmediately && isFirstStep && dependsOnIds.length === 0) {
        stepStatus = "todo";
      } else if (
        startImmediately &&
        phaseStatus === "active" &&
        dependsOnIds.length === 0
      ) {
        stepStatus = "todo";
      }

      const { data: step, error: stErr } = await supabase
        .from("workflow_steps")
        .insert({
          phase_id: phase.id,
          title: tplStep.title,
          description: tplStep.description ?? null,
          order_index: tplStep.order_index,
          status: stepStatus,
          owner_role: tplStep.owner_role ?? null,
          depends_on_step_ids: dependsOnIds,
          due_days_offset: tplStep.due_days_offset ?? null,
        })
        .select("*")
        .single();

      if (stErr || !step) {
        throw new Error(`Failed to create step: ${stErr?.message}`);
      }

      stepIdMap.set(`${tplPhase.order_index}:${tplStep.order_index}`, step.id);
      steps.push(step as WorkflowStep);
    }

    phases.push({ ...phase, steps } as WorkflowPhase);
  }

  return { ...workflow, phases } as Workflow;
}

// ---------------------------------------------------------------------------
// 2. getWorkflowWithDetails
// ---------------------------------------------------------------------------

export async function getWorkflowWithDetails(
  supabase: SupabaseClient,
  workflowId: string,
): Promise<Workflow> {
  const { data: workflow, error: wfErr } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", workflowId)
    .single();

  if (wfErr || !workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const { data: phases, error: phErr } = await supabase
    .from("workflow_phases")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("order_index", { ascending: true });

  if (phErr) {
    throw new Error(`Failed to load phases: ${phErr.message}`);
  }

  const phaseIds = (phases ?? []).map((p: { id: string }) => p.id);

  let allSteps: WorkflowStep[] = [];
  if (phaseIds.length > 0) {
    const { data: steps, error: stErr } = await supabase
      .from("workflow_steps")
      .select("*")
      .in("phase_id", phaseIds)
      .order("order_index", { ascending: true });

    if (stErr) {
      throw new Error(`Failed to load steps: ${stErr.message}`);
    }
    allSteps = (steps ?? []) as WorkflowStep[];
  }

  // Group steps by phase
  const stepsByPhase = new Map<string, WorkflowStep[]>();
  for (const step of allSteps) {
    const list = stepsByPhase.get(step.phase_id) ?? [];
    list.push(step);
    stepsByPhase.set(step.phase_id, list);
  }

  const enrichedPhases: WorkflowPhase[] = (phases ?? []).map(
    (p: Record<string, unknown>) => ({
      ...p,
      steps: stepsByPhase.get(p.id as string) ?? [],
    }),
  ) as WorkflowPhase[];

  return { ...workflow, phases: enrichedPhases } as Workflow;
}

// ---------------------------------------------------------------------------
// 3. updateStepStatus
// ---------------------------------------------------------------------------

export async function updateStepStatus(
  supabase: SupabaseClient,
  stepId: string,
  status: StepStatus,
  completedBy?: string,
  completionNotes?: string,
  completionEvidence?: Record<string, unknown>,
): Promise<WorkflowStep> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "done") {
    updates.completed_at = new Date().toISOString();
    if (completedBy) updates.completed_by = completedBy;
    if (completionNotes) updates.completion_notes = completionNotes;
    if (completionEvidence) updates.completion_evidence = completionEvidence;
  }

  const { data: step, error } = await supabase
    .from("workflow_steps")
    .update(updates)
    .eq("id", stepId)
    .select("*")
    .single();

  if (error || !step) {
    throw new Error(`Failed to update step: ${error?.message}`);
  }

  return step as WorkflowStep;
}

// ---------------------------------------------------------------------------
// 4. advanceWorkflow
// ---------------------------------------------------------------------------

export async function advanceWorkflow(
  supabase: SupabaseClient,
  workflowId: string,
): Promise<AdvanceResult> {
  const workflow = await getWorkflowWithDetails(supabase, workflowId);
  const now = new Date().toISOString();

  let phaseAdvanced = false;
  let workflowCompleted = false;
  let nextPhase: WorkflowPhase | null = null;

  // Calculate progress
  const allSteps = workflow.phases.flatMap((p) => p.steps);
  const totalSteps = allSteps.length;
  const doneSteps = allSteps.filter(
    (s) => s.status === "done" || s.status === "skipped",
  ).length;
  const progress =
    totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  // Find current active phase
  const activePhase = workflow.phases.find((p) => p.status === "active");

  if (activePhase) {
    const phaseSteps = activePhase.steps;
    const allPhaseDone = phaseSteps.every(
      (s) => s.status === "done" || s.status === "skipped",
    );

    if (allPhaseDone) {
      // Mark current phase completed
      await supabase
        .from("workflow_phases")
        .update({
          status: "completed" as PhaseStatus,
          completed_at: now,
          updated_at: now,
        })
        .eq("id", activePhase.id);

      // Find next pending phase
      const pendingPhases = workflow.phases
        .filter((p) => p.status === "pending")
        .sort((a, b) => a.order_index - b.order_index);

      if (pendingPhases.length > 0) {
        const next = pendingPhases[0];

        // Activate next phase
        await supabase
          .from("workflow_phases")
          .update({ status: "active" as PhaseStatus, updated_at: now })
          .eq("id", next.id);

        // Unblock steps in the new phase that have no unmet dependencies
        const doneStepIds = new Set(
          allSteps
            .filter((s) => s.status === "done" || s.status === "skipped")
            .map((s) => s.id),
        );

        for (const step of next.steps) {
          const deps = step.depends_on_step_ids ?? [];
          const allDepsMet = deps.every((d) => doneStepIds.has(d));
          if (allDepsMet && step.status === "blocked") {
            await supabase
              .from("workflow_steps")
              .update({ status: "todo" as StepStatus, updated_at: now })
              .eq("id", step.id);
          }
        }

        phaseAdvanced = true;
        nextPhase = { ...next, status: "active", steps: next.steps };
      } else {
        // All phases done — complete workflow
        await supabase
          .from("workflows")
          .update({
            status: "completed" as WorkflowStatus,
            progress: 100,
            completed_at: now,
            updated_at: now,
          })
          .eq("id", workflowId);

        workflowCompleted = true;
      }
    }
  }

  // Update progress on workflow
  if (!workflowCompleted) {
    await supabase
      .from("workflows")
      .update({ progress, updated_at: now })
      .eq("id", workflowId);
  }

  return {
    phaseAdvanced,
    workflowCompleted,
    nextPhase,
    progress: workflowCompleted ? 100 : progress,
  };
}

// ---------------------------------------------------------------------------
// 5. getMyTasks
// ---------------------------------------------------------------------------

export async function getMyTasks(
  supabase: SupabaseClient,
  orgId: string,
  userRole: string,
  userId?: string,
): Promise<TaskGroup[]> {
  // Get active workflows for the org
  const { data: workflows, error: wfErr } = await supabase
    .from("workflows")
    .select("id, title, status")
    .eq("organization_id", orgId)
    .eq("status", "active");

  if (wfErr || !workflows || workflows.length === 0) return [];

  const workflowIds = workflows.map((w: { id: string }) => w.id);

  // Get active phases
  const { data: phases, error: phErr } = await supabase
    .from("workflow_phases")
    .select("id, workflow_id, title")
    .in("workflow_id", workflowIds)
    .eq("status", "active");

  if (phErr || !phases || phases.length === 0) return [];

  const phaseIds = phases.map((p: { id: string }) => p.id);

  // Get actionable steps matching role
  let query = supabase
    .from("workflow_steps")
    .select("*")
    .in("phase_id", phaseIds)
    .eq("owner_role", userRole)
    .in("status", ["todo", "in_progress"]);

  if (userId) {
    // Also include steps explicitly assigned to this user regardless of role
    const { data: assignedSteps } = await supabase
      .from("workflow_steps")
      .select("*")
      .in("phase_id", phaseIds)
      .eq("assigned_to", userId)
      .in("status", ["todo", "in_progress"]);

    const { data: roleSteps, error: stErr } = await query;
    if (stErr) throw new Error(`Failed to load steps: ${stErr.message}`);

    // Merge and deduplicate
    const stepMap = new Map<string, WorkflowStep>();
    for (const s of [...(roleSteps ?? []), ...(assignedSteps ?? [])]) {
      stepMap.set(s.id, s as WorkflowStep);
    }
    var candidateSteps = Array.from(stepMap.values());
  } else {
    const { data: roleSteps, error: stErr } = await query;
    if (stErr) throw new Error(`Failed to load steps: ${stErr.message}`);
    var candidateSteps = (roleSteps ?? []) as WorkflowStep[];
  }

  if (candidateSteps.length === 0) return [];

  // Filter out steps whose dependencies are not met
  // Collect all dependency ids we need to check
  const allDepIds = new Set<string>();
  for (const step of candidateSteps) {
    for (const depId of step.depends_on_step_ids ?? []) {
      allDepIds.add(depId);
    }
  }

  const doneDepIds = new Set<string>();
  if (allDepIds.size > 0) {
    const { data: depSteps } = await supabase
      .from("workflow_steps")
      .select("id, status")
      .in("id", Array.from(allDepIds));

    for (const ds of depSteps ?? []) {
      if (ds.status === "done" || ds.status === "skipped") {
        doneDepIds.add(ds.id);
      }
    }
  }

  const actionableSteps = candidateSteps.filter((step) => {
    const deps = step.depends_on_step_ids ?? [];
    return deps.every((d) => doneDepIds.has(d));
  });

  // Group by workflow
  const phaseMap = new Map(
    phases.map((p: { id: string; workflow_id: string; title: string }) => [
      p.id,
      p,
    ]),
  );
  const workflowMap = new Map(
    workflows.map((w: { id: string; title: string; status: string }) => [
      w.id,
      w,
    ]),
  );

  const groups = new Map<string, TaskGroup>();
  for (const step of actionableSteps) {
    const phase = phaseMap.get(step.phase_id);
    if (!phase) continue;
    const wf = workflowMap.get(phase.workflow_id);
    if (!wf) continue;

    const key = `${wf.id}:${phase.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        workflow: {
          id: wf.id,
          title: wf.title,
          status: wf.status as WorkflowStatus,
        },
        phase: { id: phase.id, title: phase.title },
        steps: [],
      });
    }
    groups.get(key)!.steps.push(step);
  }

  return Array.from(groups.values());
}

// ---------------------------------------------------------------------------
// 6. calculateProgress
// ---------------------------------------------------------------------------

export async function calculateProgress(
  supabase: SupabaseClient,
  workflowId: string,
): Promise<number> {
  const { data: phases } = await supabase
    .from("workflow_phases")
    .select("id")
    .eq("workflow_id", workflowId);

  if (!phases || phases.length === 0) return 0;

  const phaseIds = phases.map((p: { id: string }) => p.id);

  const { data: steps } = await supabase
    .from("workflow_steps")
    .select("id, status")
    .in("phase_id", phaseIds);

  if (!steps || steps.length === 0) return 0;

  const done = steps.filter(
    (s: { status: string }) => s.status === "done" || s.status === "skipped",
  ).length;
  const progress = Math.round((done / steps.length) * 100);

  // Persist
  await supabase
    .from("workflows")
    .update({ progress, updated_at: new Date().toISOString() })
    .eq("id", workflowId);

  return progress;
}

// ---------------------------------------------------------------------------
// 7. createProcurementRequest
// ---------------------------------------------------------------------------

export async function createProcurementRequest(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    workflowId?: string;
    workflowStepId?: string;
    title: string;
    description?: string;
    estimatedValue?: number;
    currency?: string;
    requestedBy?: string;
  },
): Promise<ProcurementRequest> {
  const { data, error } = await supabase
    .from("procurement_requests")
    .insert({
      organization_id: params.organizationId,
      workflow_id: params.workflowId ?? null,
      workflow_step_id: params.workflowStepId ?? null,
      title: params.title,
      description: params.description ?? null,
      estimated_value: params.estimatedValue ?? null,
      currency: params.currency ?? "GBP",
      status: "draft",
      requested_by: params.requestedBy ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create procurement request: ${error?.message}`);
  }

  return data as ProcurementRequest;
}
