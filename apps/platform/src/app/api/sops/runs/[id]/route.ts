import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { getSopRun, completeSopRun } from "@/lib/sop-engine";

function getRunId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  const idx = segments.indexOf("runs");
  return segments[idx + 1];
}

// GET /api/sops/runs/[id] — Get a single SOP run with full details + template info
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const runId = getRunId(req);

  if (!runId) {
    return apiError("Run ID is required", 400, "MISSING_PARAM");
  }

  try {
    const supabase = createServiceRoleClient();
    const run = await getSopRun(supabase, runId, auth.organizationId);

    if (!run) {
      return apiError("SOP run not found", 404, "NOT_FOUND");
    }

    return apiSuccess({ run });
  } catch (err: any) {
    console.error("[SOP Run] Error fetching run:", err.message);
    return apiError("Failed to fetch SOP run", 500);
  }
});

// PATCH /api/sops/runs/[id] — Update run status (complete or abandon)
export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const runId = getRunId(req);

  if (!runId) {
    return apiError("Run ID is required", 400, "MISSING_PARAM");
  }

  const body = await req.json();
  const { status, completion_notes } = body;

  if (!status || !["completed", "abandoned"].includes(status)) {
    return apiError(
      "status must be 'completed' or 'abandoned'",
      400,
      "INVALID_STATUS",
    );
  }

  try {
    const supabase = createServiceRoleClient();
    const run = await completeSopRun(supabase, {
      runId,
      organizationId: auth.organizationId,
      completedBy: auth.userId,
      status,
      completionNotes: completion_notes || undefined,
    });

    if (!run) {
      return apiError("SOP run not found", 404, "NOT_FOUND");
    }

    return apiSuccess({ run });
  } catch (err: any) {
    console.error("[SOP Run] Error updating run:", err.message);
    return apiError("Failed to update SOP run", 500);
  }
});
