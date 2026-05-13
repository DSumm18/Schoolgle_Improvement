/**
 * SOP Engine
 *
 * Business logic for running Standard Operating Procedures (SOPs).
 * Schools define templates (e.g. "Fire Drill", "RIDDOR Report", "End of Term
 * Lockdown Checklist") and staff work through them step-by-step, collecting
 * evidence along the way.
 *
 * Database tables: sop_templates, sop_runs, sop_reminders
 * All functions take a SupabaseClient so they work with both service-role
 * and user-scoped clients.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  getBuiltInSopTemplate,
  mergeBuiltInSopTemplates,
  toSopTemplateSeed,
} from "./sop-starter-library";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SopCategory =
  | "estates"
  | "safeguarding"
  | "compliance"
  | "governance"
  | "finance"
  | "hr"
  | "h_and_s";

export type SopFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "termly"
  | "annual"
  | "ad_hoc";

export type SopRunStatus = "in_progress" | "completed" | "abandoned";

export type SopStepStatus = "pending" | "done" | "skipped" | "blocked";

/** A single step as defined in a template */
export interface SopStep {
  step_id: string;
  order: number;
  title: string;
  instruction: string;
  evidence_required: boolean;
  evidence_types: string[];
  evidence_guidance: string;
  linked_module?: string;
  ai_assist?: string;
}

/** Evidence attached to a completed step */
export interface SopStepEvidence {
  type: string;
  url?: string;
  content?: string;
  caption?: string;
}

/** Runtime state for a step within a run */
export interface SopRunStep {
  step_id: string;
  order: number;
  title: string;
  instruction: string;
  evidence_required: boolean;
  evidence_types: string[];
  evidence_guidance: string;
  linked_module?: string;
  ai_assist?: string;
  status: SopStepStatus;
  completed_at: string | null;
  completed_by: string | null;
  evidence: SopStepEvidence[];
  notes: string | null;
}

/** SOP template (matches sop_templates table) */
export interface SopTemplate {
  id: string;
  template_id: string;
  name: string;
  description: string;
  category: SopCategory;
  frequency: SopFrequency;
  steps: SopStep[];
  estimated_time_minutes: number;
  owner_role: string;
  is_active: boolean;
  source?: "database" | "schoolgle_builtin";
  linked_policy_requirement_ids?: string[];
  recommended_modules?: string[];
  setup_questions?: Array<{
    id: string;
    question: string;
    why: string;
    fieldHint: string;
  }>;
  source_refs?: Array<{
    title: string;
    publisher: string;
    url: string;
    authority: string;
    lastChecked: string;
  }>;
  visual_flow?: Array<{
    label: string;
    detail: string;
  }>;
  document_resources?: Array<{
    title: string;
    type: "form" | "template" | "policy" | "guidance" | "register" | "system";
    description: string;
    action: string;
    locationHint: string;
  }>;
  ed_prompt?: string;
}

/** SOP run (matches sop_runs table) */
export interface SopRun {
  id: string;
  organization_id: string;
  template_id: string;
  context: string | null;
  status: SopRunStatus;
  steps_data: SopRunStep[];
  completion_notes: string | null;
  started_by: string;
  completed_by: string | null;
  started_at: string;
  completed_at: string | null;
  linked_incident_id: string | null;
  linked_module: string | null;
  linked_entity_id: string | null;
}

export type SopSetupAnswers = Record<string, string>;

/** SOP reminder (matches sop_reminders table) */
export interface SopReminder {
  id: string;
  organization_id: string;
  template_id: string;
  next_due_at: string;
  last_completed_at: string | null;
  last_run_id: string | null;
  assigned_to: string | null;
  snoozed_until: string | null;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initRunSteps(templateSteps: SopStep[]): SopRunStep[] {
  return templateSteps
    .sort((a, b) => a.order - b.order)
    .map((step) => ({
      step_id: step.step_id,
      order: step.order,
      title: step.title,
      instruction: step.instruction,
      evidence_required: step.evidence_required,
      evidence_types: step.evidence_types ?? [],
      evidence_guidance: step.evidence_guidance ?? "",
      linked_module: step.linked_module,
      ai_assist: step.ai_assist,
      status: "pending" as SopStepStatus,
      completed_at: null,
      completed_by: null,
      evidence: [],
      notes: null,
    }));
}

function applySetupAnswersToRunSteps(
  template: SopTemplate | null,
  stepsData: SopRunStep[],
  setupAnswers?: SopSetupAnswers,
): SopRunStep[] {
  const entries = Object.entries(setupAnswers || {}).filter(([, answer]) =>
    answer.trim(),
  );

  if (!template?.setup_questions?.length || entries.length === 0) {
    return stepsData;
  }

  const answerLines = template.setup_questions
    .map((questionItem) => {
      const answer = setupAnswers?.[questionItem.id]?.trim();
      if (!answer) return null;
      return `• ${questionItem.question} ${answer}`;
    })
    .filter(Boolean)
    .join("\n");

  return [
    {
      step_id: "local_setup_answers",
      order: 0,
      title: "Confirm local setup answers",
      instruction: [
        "These local answers personalise this Schoolgle starter into this school's working procedure.",
        answerLines,
        "Check these are accurate before staff use the SOP as approved practice.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      evidence_required: false,
      evidence_types: ["note"],
      evidence_guidance:
        "If anything is wrong, abandon this run and create a new personalised SOP with corrected answers.",
      status: "pending",
      completed_at: null,
      completed_by: null,
      evidence: [],
      notes: null,
    },
    ...stepsData,
  ];
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Start a new SOP run from a template.
 * Fetches the template, initialises step state, and inserts the run record.
 */
export async function startSopRun(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    templateId: string;
    startedBy: string;
    context?: string;
    linkedIncidentId?: string;
    linkedModule?: string;
    linkedEntityId?: string;
    setupAnswers?: SopSetupAnswers;
  },
): Promise<{ run: SopRun; error?: string }> {
  // 1. Fetch the template
  const { data: template, error: tErr } = await supabase
    .from("sop_templates")
    .select("*")
    .eq("template_id", params.templateId)
    .eq("is_active", true)
    .single();

  if (tErr || !template) {
    const builtInTemplate = getBuiltInSopTemplate(params.templateId);

    if (!builtInTemplate) {
      return {
        run: null as unknown as SopRun,
        error:
          tErr?.message ??
          `Template '${params.templateId}' not found or inactive`,
      };
    }

    const { error: seedError } = await supabase
      .from("sop_templates")
      .upsert(toSopTemplateSeed(builtInTemplate), {
        onConflict: "template_id",
      });

    if (seedError) {
      return {
        run: null as unknown as SopRun,
        error: seedError.message,
      };
    }

    return startSopRun(supabase, params);
  }

  // 2. Initialise steps_data from template steps
  const builtInMetadata = getBuiltInSopTemplate(params.templateId);
  const templateWithMetadata = builtInMetadata
    ? {
        ...builtInMetadata,
        ...(template as SopTemplate),
        setup_questions: builtInMetadata.setup_questions,
      }
    : (template as SopTemplate);
  const stepsData = applySetupAnswersToRunSteps(
    templateWithMetadata,
    initRunSteps(template.steps as SopStep[]),
    params.setupAnswers,
  );

  // 3. Insert the run
  const now = new Date().toISOString();
  const { data: run, error: rErr } = await supabase
    .from("sop_runs")
    .insert({
      organization_id: params.organizationId,
      template_id: params.templateId,
      context: params.context ?? null,
      status: "in_progress",
      steps_data: stepsData,
      started_by: params.startedBy,
      started_at: now,
      linked_incident_id: params.linkedIncidentId ?? null,
      linked_module: params.linkedModule ?? null,
      linked_entity_id: params.linkedEntityId ?? null,
    })
    .select()
    .single();

  if (rErr || !run) {
    return {
      run: null as unknown as SopRun,
      error: rErr?.message ?? "Failed to create SOP run",
    };
  }

  return { run: run as SopRun };
}

/**
 * Get a run with its associated template.
 */
export async function getSopRun(
  supabase: SupabaseClient,
  runId: string,
  organizationId: string,
): Promise<{
  run: SopRun | null;
  template: SopTemplate | null;
  error?: string;
}> {
  const { data: run, error: rErr } = await supabase
    .from("sop_runs")
    .select("*")
    .eq("id", runId)
    .eq("organization_id", organizationId)
    .single();

  if (rErr || !run) {
    return {
      run: null,
      template: null,
      error: rErr?.message ?? "Run not found",
    };
  }

  const { data: template, error: tErr } = await supabase
    .from("sop_templates")
    .select("*")
    .eq("template_id", run.template_id)
    .single();

  if (tErr) {
    return {
      run: run as SopRun,
      template: null,
      error: tErr.message,
    };
  }

  const builtInTemplate = getBuiltInSopTemplate(run.template_id);

  return {
    run: run as SopRun,
    template: builtInTemplate
      ? {
          ...builtInTemplate,
          ...(template as SopTemplate),
          source: "schoolgle_builtin",
          linked_policy_requirement_ids:
            builtInTemplate.linked_policy_requirement_ids,
          recommended_modules: builtInTemplate.recommended_modules,
          setup_questions: builtInTemplate.setup_questions,
          source_refs: builtInTemplate.source_refs,
          visual_flow: builtInTemplate.visual_flow,
          document_resources: builtInTemplate.document_resources,
          ed_prompt: builtInTemplate.ed_prompt,
        }
      : (template as SopTemplate),
  };
}

/**
 * Update a single step in a run (mark done/skipped/blocked, attach evidence
 * or notes). Returns the updated run.
 */
export async function updateSopStep(
  supabase: SupabaseClient,
  params: {
    runId: string;
    organizationId: string;
    stepId: string;
    status: "done" | "skipped" | "blocked";
    notes?: string;
    evidence?: Array<{
      type: string;
      url?: string;
      content?: string;
      caption?: string;
    }>;
    completedBy: string;
  },
): Promise<{ run: SopRun; error?: string }> {
  // Fetch the current run
  const { data: run, error: rErr } = await supabase
    .from("sop_runs")
    .select("*")
    .eq("id", params.runId)
    .eq("organization_id", params.organizationId)
    .single();

  if (rErr || !run) {
    return {
      run: null as unknown as SopRun,
      error: rErr?.message ?? "Run not found",
    };
  }

  if (run.status !== "in_progress") {
    return {
      run: run as SopRun,
      error: `Cannot update steps on a run with status '${run.status}'`,
    };
  }

  const stepsData = (run.steps_data as SopRunStep[]).map((step) => {
    if (step.step_id !== params.stepId) return step;
    return {
      ...step,
      status: params.status,
      completed_at: new Date().toISOString(),
      completed_by: params.completedBy,
      notes: params.notes ?? step.notes,
      evidence: [...step.evidence, ...(params.evidence ?? [])],
    };
  });

  const { data: updated, error: uErr } = await supabase
    .from("sop_runs")
    .update({ steps_data: stepsData })
    .eq("id", params.runId)
    .eq("organization_id", params.organizationId)
    .select()
    .single();

  if (uErr || !updated) {
    return {
      run: null as unknown as SopRun,
      error: uErr?.message ?? "Failed to update step",
    };
  }

  return { run: updated as SopRun };
}

/**
 * Complete or abandon a run. Sets the final status, completion notes,
 * completed_by, and completed_at timestamp.
 */
export async function completeSopRun(
  supabase: SupabaseClient,
  params: {
    runId: string;
    organizationId: string;
    status: "completed" | "abandoned";
    completionNotes?: string;
    completedBy: string;
  },
): Promise<{ run: SopRun; error?: string }> {
  const { data: existing, error: eErr } = await supabase
    .from("sop_runs")
    .select("status")
    .eq("id", params.runId)
    .eq("organization_id", params.organizationId)
    .single();

  if (eErr || !existing) {
    return {
      run: null as unknown as SopRun,
      error: eErr?.message ?? "Run not found",
    };
  }

  if (existing.status !== "in_progress") {
    return {
      run: null as unknown as SopRun,
      error: `Run is already '${existing.status}' and cannot be updated`,
    };
  }

  const now = new Date().toISOString();
  const { data: run, error: uErr } = await supabase
    .from("sop_runs")
    .update({
      status: params.status,
      completion_notes: params.completionNotes ?? null,
      completed_by: params.completedBy,
      completed_at: now,
    })
    .eq("id", params.runId)
    .eq("organization_id", params.organizationId)
    .select()
    .single();

  if (uErr || !run) {
    return {
      run: null as unknown as SopRun,
      error: uErr?.message ?? "Failed to complete run",
    };
  }

  return { run: run as SopRun };
}

/**
 * Get active (in_progress) runs for an organization, optionally filtered
 * by template or linked module.
 */
export async function getActiveRuns(
  supabase: SupabaseClient,
  organizationId: string,
  options?: {
    status?: SopRunStatus;
    templateId?: string;
    linkedModule?: string;
  },
): Promise<{ runs: SopRun[]; error?: string }> {
  let query = supabase
    .from("sop_runs")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", options?.status || "in_progress")
    .order("started_at", { ascending: false });

  if (options?.templateId) {
    query = query.eq("template_id", options.templateId);
  }
  if (options?.linkedModule) {
    query = query.eq("linked_module", options.linkedModule);
  }

  const { data, error } = await query;

  if (error) {
    return { runs: [], error: error.message };
  }

  return { runs: (data ?? []) as SopRun[] };
}

/**
 * Get all SOP templates, optionally filtered by category and/or active status.
 */
export async function getTemplates(
  supabase: SupabaseClient,
  options?: { category?: string; isActive?: boolean },
): Promise<{ templates: SopTemplate[]; error?: string }> {
  let query = supabase
    .from("sop_templates")
    .select("*")
    .order("category")
    .order("name");

  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (options?.isActive !== undefined) {
    query = query.eq("is_active", options.isActive);
  }

  const { data, error } = await query;

  if (error) {
    return { templates: [], error: error.message };
  }

  return {
    templates: mergeBuiltInSopTemplates((data ?? []) as SopTemplate[]),
  };
}

// ---------------------------------------------------------------------------
// Pure functions (no DB access)
// ---------------------------------------------------------------------------

/**
 * Calculate progress for a run based on its steps_data.
 */
export function calculateProgress(stepsData: SopRunStep[]): {
  total: number;
  completed: number;
  skipped: number;
  blocked: number;
  remaining: number;
  percentage: number;
} {
  const total = stepsData.length;
  const completed = stepsData.filter((s) => s.status === "done").length;
  const skipped = stepsData.filter((s) => s.status === "skipped").length;
  const blocked = stepsData.filter((s) => s.status === "blocked").length;
  const remaining = stepsData.filter((s) => s.status === "pending").length;

  // Percentage counts done + skipped as "progressed through"
  const percentage =
    total > 0 ? Math.round(((completed + skipped) / total) * 100) : 0;

  return { total, completed, skipped, blocked, remaining, percentage };
}

/**
 * Get the next actionable step — the first step still in 'pending' status,
 * ordered by `order`.
 */
export function getNextStep(stepsData: SopRunStep[]): SopRunStep | null {
  const sorted = [...stepsData].sort((a, b) => a.order - b.order);
  return sorted.find((s) => s.status === "pending") ?? null;
}

/**
 * Determine which SOP templates should be auto-triggered for a given incident.
 *
 * Mapping:
 *  - All incidents       → 'incident_response'
 *  - Near miss           → replace with 'near_miss_recording' (instead of incident_response)
 *  - RIDDOR reportable   → add 'riddor_assessment'
 *  - Investigation needed OR severity major/critical → add 'incident_investigation'
 *  - Violence type       → add 'violence_response'
 *  - Dangerous occurrence → add 'dangerous_occurrence'
 */
export function getSopTriggersForIncident(incident: {
  incident_type: string;
  severity: string;
  is_riddor_reportable?: boolean;
  investigation_required?: boolean;
}): string[] {
  const triggers: string[] = [];
  const type = incident.incident_type?.toLowerCase() ?? "";
  const severity = incident.severity?.toLowerCase() ?? "";

  // Near miss gets its own SOP instead of the generic incident_response
  if (type === "near_miss" || type === "near miss") {
    triggers.push("near_miss_recording");
  } else {
    triggers.push("incident_response");
  }

  // RIDDOR reportable
  if (incident.is_riddor_reportable) {
    triggers.push("riddor_assessment");
  }

  // Investigation required or high severity
  if (
    incident.investigation_required ||
    severity === "major" ||
    severity === "critical"
  ) {
    triggers.push("incident_investigation");
  }

  // Violence-related
  if (type.includes("violence") || type.includes("assault")) {
    triggers.push("violence_response");
  }

  // Dangerous occurrence
  if (type === "dangerous_occurrence" || type === "dangerous occurrence") {
    triggers.push("dangerous_occurrence");
  }

  return triggers;
}
