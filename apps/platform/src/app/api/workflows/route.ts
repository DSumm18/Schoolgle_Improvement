/**
 * Workflows API
 *
 * GET /api/workflows - List workflows for the org
 * POST /api/workflows - Create workflow from template
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const templateSlug = searchParams.get("template_slug");
  const limit = parseInt(searchParams.get("limit") || "20");

  let query = supabase
    .from("workflows")
    .select(
      `
      *,
      workflow_phases(
        id,
        workflow_steps(id)
      )
    `,
      { count: "exact" },
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }
  if (templateSlug) {
    query = query.eq("template_slug", templateSlug);
  }

  const { data, error, count } = await query;

  if (error) {
    return apiError(`Failed to fetch workflows: ${error.message}`, 500);
  }

  const workflows = (data || []).map((w) => ({
    ...w,
    phase_count: w.workflow_phases?.length || 0,
    step_count:
      w.workflow_phases?.reduce(
        (sum: number, p: any) => sum + (p.workflow_steps?.length || 0),
        0,
      ) || 0,
    workflow_phases: undefined,
  }));

  return apiSuccess({ workflows, total: count || 0 });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();

  const body = await request.json();
  const {
    template_slug,
    title,
    description,
    trigger_type,
    trigger_source_id,
    owner_name,
    owner_role,
  } = body;

  if (!template_slug) {
    return apiError("template_slug is required", 400);
  }

  // Look up the template
  const { data: template, error: templateError } = await supabase
    .from("workflow_templates")
    .select("*")
    .eq("slug", template_slug)
    .single();

  if (templateError || !template) {
    return apiError(`Template not found: ${template_slug}`, 404);
  }

  // Create the workflow
  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .insert({
      organization_id: organizationId,
      template_slug,
      title: title || template.title,
      description: description || template.description,
      status: "active",
      current_phase: 1,
      progress: 0,
      trigger_type: trigger_type || "manual",
      trigger_source_id: trigger_source_id || null,
      owner_id: userId,
      owner_name: owner_name || null,
      owner_role: owner_role || null,
      started_at: new Date().toISOString(),
      target_completion: new Date(
        Date.now() + (template.estimated_days || 21) * 86400000,
      ).toISOString(),
    })
    .select()
    .single();

  if (workflowError) {
    return apiError(`Failed to create workflow: ${workflowError.message}`, 500);
  }

  // Create phases and steps from template JSONB phases column
  const templatePhases = (template.phases || []) as Array<{
    phase_number: number;
    title: string;
    description?: string;
    gate_type?: string;
    steps: Array<{
      step_number: number;
      title: string;
      description?: string;
      owner_role?: string;
      is_automated?: boolean;
      is_external?: boolean;
      requires_approval?: boolean;
      approval_type?: string;
      linked_entity_type?: string;
      external_system?: string;
      external_reference?: string;
      ai_assist_type?: string;
      ai_assist_config?: any;
      check_frequency?: string;
      escalation_rule?: any;
      notify_on_actionable?: boolean;
    }>;
  }>;

  const createdPhases = [];

  for (let i = 0; i < templatePhases.length; i++) {
    const phaseDef = templatePhases[i];
    const isFirst = i === 0;

    const { data: phase, error: phaseError } = await supabase
      .from("workflow_phases")
      .insert({
        workflow_id: workflow.id,
        phase_number: phaseDef.phase_number,
        title: phaseDef.title,
        description: phaseDef.description || null,
        gate_type: phaseDef.gate_type || "all_previous",
        status: isFirst ? "active" : "pending",
        started_at: isFirst ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (phaseError) {
      return apiError(`Failed to create phase: ${phaseError.message}`, 500);
    }

    const steps = phaseDef.steps || [];
    const createdSteps = [];

    for (const stepDef of steps) {
      const { data: step, error: stepError } = await supabase
        .from("workflow_steps")
        .insert({
          phase_id: phase.id,
          workflow_id: workflow.id,
          step_number: stepDef.step_number,
          title: stepDef.title,
          description: stepDef.description || null,
          owner_role: stepDef.owner_role || null,
          is_automated: stepDef.is_automated || false,
          is_external: stepDef.is_external || false,
          requires_approval: stepDef.requires_approval || false,
          approval_type: stepDef.approval_type || null,
          linked_entity_type: stepDef.linked_entity_type || null,
          external_system: stepDef.external_system || null,
          external_reference: stepDef.external_reference || null,
          ai_assist_type: stepDef.ai_assist_type || null,
          ai_assist_config: stepDef.ai_assist_config || null,
          check_frequency: stepDef.check_frequency || null,
          escalation_rule: stepDef.escalation_rule || null,
          notify_on_actionable: stepDef.notify_on_actionable !== false,
          status: "todo",
        })
        .select()
        .single();

      if (stepError) {
        return apiError(`Failed to create step: ${stepError.message}`, 500);
      }

      createdSteps.push(step);
    }

    createdPhases.push({ ...phase, workflow_steps: createdSteps });
  }

  return apiSuccess({ ...workflow, workflow_phases: createdPhases }, 201);
});
