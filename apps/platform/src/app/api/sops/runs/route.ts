import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { startSopRun, getActiveRuns } from "@/lib/sop-engine";

// GET /api/sops/runs — List SOP runs for the user's organization
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const status = req.nextUrl.searchParams.get("status");
  const templateId = req.nextUrl.searchParams.get("template_id");
  const linkedModule = req.nextUrl.searchParams.get("linked_module");

  try {
    const supabase = createServiceRoleClient();
    const runs = await getActiveRuns(supabase, auth.organizationId, {
      status:
        status === "completed" || status === "abandoned"
          ? status
          : "in_progress",
      templateId: templateId || undefined,
      linkedModule: linkedModule || undefined,
    });

    if (runs.error) {
      return apiError(runs.error, 500);
    }

    return apiSuccess({ runs: runs.runs });
  } catch (err: any) {
    console.error("[SOP Runs] Error listing runs:", err.message);
    return apiError("Failed to list SOP runs", 500);
  }
});

// POST /api/sops/runs — Start a new SOP run
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const {
    template_id,
    context,
    linked_incident_id,
    linked_module,
    linked_entity_id,
    setup_answers,
  } = body;

  if (!template_id) {
    return apiError("template_id is required", 400, "MISSING_FIELD");
  }

  try {
    const supabase = createServiceRoleClient();
    const run = await startSopRun(supabase, {
      templateId: template_id,
      organizationId: auth.organizationId,
      startedBy: auth.userId,
      context: context || undefined,
      linkedIncidentId: linked_incident_id || undefined,
      linkedModule: linked_module || undefined,
      linkedEntityId: linked_entity_id || undefined,
      setupAnswers: setup_answers || undefined,
    });

    if (run.error || !run.run) {
      return apiError(run.error || "Failed to start SOP run", 400);
    }

    return apiSuccess({ run: run.run }, 201);
  } catch (err: any) {
    console.error("[SOP Runs] Error starting run:", err.message);
    return apiError("Failed to start SOP run", 500);
  }
});
