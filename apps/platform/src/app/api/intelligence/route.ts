import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { getIntelligenceEngine } from "@/lib/school-intelligence-engine";

/**
 * POST /api/intelligence
 * Run full school intelligence analysis
 *
 * Body: { organizationId, urn, focusAreas?, focusYearGroups?, academicYear? }
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { urn, focusAreas, focusYearGroups, academicYear } = body;

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
