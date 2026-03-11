/**
 * Evidence Stats API Route
 *
 * GET /api/estates/evidence/stats - Get evidence statistics
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { EvidenceService } from "@/lib/estates-compliance/services/EvidenceService";

/**
 * GET /api/estates/evidence/stats
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;

  const stats = await EvidenceService.getStats(organizationId);

  return apiSuccess(stats);
});
