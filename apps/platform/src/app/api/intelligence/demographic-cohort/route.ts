import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { getIntelligenceEngine } from "@/lib/school-intelligence-engine";

/**
 * GET /api/intelligence/demographic-cohort?urn={urn}
 *
 * Get demographic cohort for fair comparison
 * Groups schools with similar FSM%, EAL%, SEN% profiles
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const urnParam = searchParams.get("urn");

  if (!urnParam) {
    return apiError("Missing required parameter: urn", 400);
  }

  const urn = parseInt(urnParam, 10);
  if (isNaN(urn)) {
    return apiError("Invalid URN format", 400);
  }

  try {
    const engine = getIntelligenceEngine();
    const cohort = await engine.getDemographicCohort(urn, 3);

    if (!cohort) {
      return apiError("No demographic cohort available - insufficient similar schools", 404);
    }

    return apiSuccess(cohort);
  } catch (error) {
    console.error("[Demographic Cohort API] Error:", error);
    return apiError(error instanceof Error ? error.message : "Failed to fetch demographic cohort", 500);
  }
}, { orgOptional: true });
