import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { getIntelligenceEngine } from "@/lib/school-intelligence-engine";

/**
 * GET /api/intelligence/la-benchmarks?urn={urn}
 *
 * Get Local Authority benchmark data for a school
 * Returns KS2, attendance, progress scores, disadvantaged gap, and 3-year trends
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
    const benchmarks = await engine.getLaBenchmarks(urn, 5);

    if (!benchmarks) {
      return apiError("School not found or no LA data available", 404);
    }

    return apiSuccess(benchmarks);
  } catch (error) {
    console.error("[LA Benchmarks API] Error:", error);
    return apiError(error instanceof Error ? error.message : "Failed to fetch LA benchmarks", 500);
  }
}, { orgOptional: true });
