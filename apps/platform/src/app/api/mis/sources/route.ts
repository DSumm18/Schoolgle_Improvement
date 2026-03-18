/**
 * MIS Data Sources API
 *
 * GET /api/mis/sources - Returns available data sources and freshness for the user's organization
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

export const GET = protectedRoute(async (auth) => {
  try {
    // Dynamic import to avoid bundling server-only modules at compile time
    const { getMISDataServiceForOrg } = await import("@/lib/mis/data-service");
    const service = await getMISDataServiceForOrg(auth.organizationId);
    const sources = await service.getAvailableSources(auth.organizationId);

    return apiSuccess({
      success: true,
      data: sources,
    });
  } catch (error: any) {
    console.error("[MIS Sources] Error:", error.message);
    return apiError(
      error.message || "Failed to fetch MIS data sources",
      500,
      "MIS_SOURCES_ERROR",
    );
  }
});
