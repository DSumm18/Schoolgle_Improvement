/**
 * Workflow Step API
 *
 * PATCH /api/workflows/[id]/steps/[stepId] - Update a workflow step and advance workflow
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const PATCH = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();

  // Extract workflowId and stepId from pathname
  // Pattern: /api/workflows/[id]/steps/[stepId]
  const segments = request.nextUrl.pathname.split("/");
  const workflowsIdx = segments.indexOf("workflows");
  const workflowId = segments[workflowsIdx + 1];
  const stepsIdx = segments.indexOf("steps");
  const stepId = segments[stepsIdx + 1];

  if (!workflowId || !stepId) {
    return apiError("Workflow ID and Step ID are required", 400);
  }

  // Verify workflow belongs to org
  const { data: workflow, error: wfError } = await supabase
    .from("workflows")
    .select("id, status")
    .eq("id", workflowId)
    .eq("organization_id", organizationId)
    .single();

  if (wfError || !workflow) {
    return apiError("Workflow not found", 404);
  }

  const body = await request.json();
  const { status, completion_notes, completion_evidence, external_reference } =
    body;

  const validStatuses = [
    "todo",
    "in_progress",
    "done",
    "skipped",
    "blocked",
    "waiting_external",
  ];
  if (!status || !validStatuses.includes(status)) {
    return apiError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
    );
  }

  // Update the step
  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "done") {
    updateData.completed_at = new Date().toISOString();
    updateData.completed_by = userId;
  }
  if (completion_notes !== undefined) {
    updateData.completion_notes = completion_notes;
  }
  if (completion_evidence !== undefined) {
    updateData.completion_evidence = completion_evidence;
  }
  if (external_reference !== undefined) {
    updateData.external_reference = external_reference;
  }

  const { data: step, error: stepError } = await supabase
    .from("workflow_steps")
    .update(updateData)
    .eq("id", stepId)
    .eq("workflow_id", workflowId)
    .select("*, phase_id")
    .single();

  if (stepError || !step) {
    return apiError("Step not found or update failed", 404);
  }

  // Advance workflow: check if phase is complete
  let phaseAdvanced = false;
  let workflowCompleted = false;

  // Get all steps in the same phase
  const { data: phaseSteps } = await supabase
    .from("workflow_steps")
    .select("id, status")
    .eq("phase_id", step.phase_id);

  const allRequiredComplete =
    phaseSteps?.every(
      (s: any) => s.status === "done" || s.status === "skipped",
    ) ?? false;

  if (allRequiredComplete) {
    // Mark phase as completed
    await supabase
      .from("workflow_phases")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", step.phase_id);

    phaseAdvanced = true;

    // Activate the next phase
    const { data: nextPhase } = await supabase
      .from("workflow_phases")
      .select("id")
      .eq("workflow_id", workflowId)
      .eq("status", "pending")
      .order("phase_number", { ascending: true })
      .limit(1)
      .single();

    if (nextPhase) {
      await supabase
        .from("workflow_phases")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", nextPhase.id);
    } else {
      // No more phases - check if workflow is complete
      const { data: remainingPhases } = await supabase
        .from("workflow_phases")
        .select("id")
        .eq("workflow_id", workflowId)
        .neq("status", "completed");

      if (!remainingPhases || remainingPhases.length === 0) {
        await supabase
          .from("workflows")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", workflowId);

        workflowCompleted = true;
      }
    }
  }

  // Compute overall progress
  const { data: allSteps } = await supabase
    .from("workflow_steps")
    .select("id, status")
    .eq("workflow_id", workflowId);

  const totalSteps = allSteps?.length || 0;
  const completedSteps =
    allSteps?.filter((s: any) => s.status === "done" || s.status === "skipped")
      .length || 0;

  return apiSuccess({
    step,
    advancement: {
      phaseAdvanced,
      workflowCompleted,
      progress: {
        total_steps: totalSteps,
        completed_steps: completedSteps,
        percentage:
          totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      },
    },
  });
});
