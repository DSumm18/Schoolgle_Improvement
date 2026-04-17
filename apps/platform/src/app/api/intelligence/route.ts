import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { getIntelligenceEngine } from "@/lib/school-intelligence-engine";
import {
  buildShadowComparison,
  getIntelligenceBrainMode,
  isDebugBrainRequest,
  persistShadowComparison,
} from "@/lib/intelligence-brain/orchestrator";

/**
 * POST /api/intelligence
 * Run full school intelligence analysis
 *
 * Body: { organizationId, urn, focusAreas?, focusYearGroups?, academicYear? }
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { urn, focusAreas, focusYearGroups, academicYear } = body;
  const brainMode = getIntelligenceBrainMode("school-intelligence");
  const debugBrain =
    isDebugBrainRequest(request.nextUrl.searchParams.get("debug_brain")) ||
    isDebugBrainRequest(request.headers.get("x-schoolgle-debug-brain"));

  // orgId MUST come from authenticated session, never from caller
  const orgId = auth.organizationId;

  if (!orgId || !urn) {
    return apiError("Missing required fields: urn", 400);
  }

  const engine = getIntelligenceEngine();

  const analysis = await engine.runFullAnalysis(orgId, urn, {
    focusAreas,
    focusYearGroups,
    academicYear,
  });

  let shadowComparison:
    | ReturnType<typeof buildShadowComparison>
    | null = null;

  if (brainMode === "shadow" || brainMode === "primary") {
    const signals = await engine.getCrossModuleSignals(orgId);
    const deterministicSignalAlertCount =
      (signals.estatesOverdueTasks > 0 ? 1 : 0) +
      (signals.scrGaps > 0 ? 1 : 0) +
      (signals.overduePolicies > 0 ? 1 : 0) +
      (signals.trainingComplianceRate < 90 ? 1 : 0) +
      (signals.safeguardingConcerns > 0 ? 1 : 0);

    const baselineCrossModuleAlerts =
      analysis.detailed_analysis.cross_module_alerts?.length ?? 0;
    const baselineActions = analysis.suggested_actions?.length ?? 0;

    shadowComparison = buildShadowComparison({
      route: "school-intelligence",
      mode: brainMode,
      organizationId: orgId,
      candidateVersion: "signals-v1",
      baseline: {
        cross_module_alerts: baselineCrossModuleAlerts,
        suggested_actions: baselineActions,
        confidence_score: analysis.confidence_score,
      },
      candidate: {
        cross_module_alerts: deterministicSignalAlertCount,
        suggested_actions:
          deterministicSignalAlertCount > 0
            ? Math.max(1, Math.ceil(deterministicSignalAlertCount / 2))
            : 0,
        confidence_score: analysis.confidence_score,
      },
    });

    await persistShadowComparison(createServiceRoleClient(), shadowComparison);
  }

  if (debugBrain) {
    return apiSuccess({
      ...analysis,
      _brainShadow: {
        mode: brainMode,
        comparison: shadowComparison,
      },
    });
  }

  return apiSuccess(analysis);
});

/**
 * GET /api/intelligence
 * Get previous analyses for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session, never from caller
  const organizationId = auth.organizationId;
  const analysisType = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "10");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("school_intelligence_analyses")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (analysisType) {
    query = query.eq("analysis_type", analysisType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Intelligence API] Fetch error:", error);
    return apiError("Failed to fetch analyses", 500);
  }

  return apiSuccess({ analyses: data || [] });
});
