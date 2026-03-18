import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { updateSopStep } from "@/lib/sop-engine";

function getRunId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  const idx = segments.indexOf("runs");
  return segments[idx + 1];
}

function getStepId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  const idx = segments.indexOf("steps");
  return segments[idx + 1];
}

// PATCH /api/sops/runs/[id]/steps/[stepId] — Update a step in a run
export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const runId = getRunId(req);
  const stepId = getStepId(req);

  if (!runId) {
    return apiError("Run ID is required", 400, "MISSING_PARAM");
  }

  if (!stepId) {
    return apiError("Step ID is required", 400, "MISSING_PARAM");
  }

  const body = await req.json();
  const { status, notes, evidence } = body;

  if (!status || !["done", "skipped", "blocked"].includes(status)) {
    return apiError(
      "status must be 'done', 'skipped', or 'blocked'",
      400,
      "INVALID_STATUS",
    );
  }

  // Validate evidence array if provided
  if (evidence && !Array.isArray(evidence)) {
    return apiError("evidence must be an array", 400, "INVALID_FIELD");
  }

  if (evidence) {
    for (const item of evidence) {
      if (!item.type) {
        return apiError(
          "Each evidence item must have a type",
          400,
          "INVALID_EVIDENCE",
        );
      }
    }
  }

  try {
    const supabase = createServiceRoleClient();
    const run = await updateSopStep(supabase, {
      runId,
      stepId,
      organizationId: auth.organizationId,
      completedBy: auth.userId,
      status,
      notes: notes || undefined,
      evidence: evidence || undefined,
    });

    if (!run) {
      return apiError("SOP run or step not found", 404, "NOT_FOUND");
    }

    return apiSuccess({ run });
  } catch (err: any) {
    console.error("[SOP Step] Error updating step:", err.message);
    return apiError("Failed to update SOP step", 500);
  }
});
