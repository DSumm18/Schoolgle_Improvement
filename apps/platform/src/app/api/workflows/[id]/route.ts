/**
 * Individual Workflow API
 *
 * GET /api/workflows/[id] - Get full workflow detail with phases and steps
 * PATCH /api/workflows/[id] - Update workflow status
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("workflows") + 1];

  if (!id) {
    return apiError("Workflow ID is required", 400);
  }

  const { data: workflow, error } = await supabase
    .from("workflows")
    .select(
      `
      *,
      workflow_phases(
        *,
        workflow_steps(*)
      )
    `,
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .order("phase_number", {
      referencedTable: "workflow_phases",
      ascending: true,
    })
    .order("step_number", {
      referencedTable: "workflow_phases.workflow_steps",
      ascending: true,
    })
    .single();

  if (error || !workflow) {
    return apiError("Workflow not found", 404);
  }

  // Compute progress
  const allSteps =
    workflow.workflow_phases?.flatMap((p: any) => p.workflow_steps || []) || [];
  const completedSteps = allSteps.filter(
    (s: any) => s.status === "done" || s.status === "skipped",
  );
  const progress = {
    total_steps: allSteps.length,
    completed_steps: completedSteps.length,
    percentage:
      allSteps.length > 0
        ? Math.round((completedSteps.length / allSteps.length) * 100)
        : 0,
  };

  return apiSuccess({ workflow, progress });
});

export const PATCH = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("workflows") + 1];

  if (!id) {
    return apiError("Workflow ID is required", 400);
  }

  const body = await request.json();
  const { status } = body;

  const validStatuses = ["draft", "active", "paused", "completed", "cancelled"];
  if (!status || !validStatuses.includes(status)) {
    return apiError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
    );
  }

  // Verify workflow belongs to this org
  const { data: existing, error: fetchError } = await supabase
    .from("workflows")
    .select("id, status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !existing) {
    return apiError("Workflow not found", 404);
  }

  const { data: workflow, error: updateError } = await supabase
    .from("workflows")
    .update({
      status,
      ...(status === "completed"
        ? { completed_at: new Date().toISOString() }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return apiError(`Failed to update workflow: ${updateError.message}`, 500);
  }

  return apiSuccess({ workflow });
});
