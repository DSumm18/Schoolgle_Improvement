/**
 * Helpdesk Statistics API
 *
 * GET /api/estates/helpdesk/stats - Get ticket statistics for dashboard
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { HelpdeskService } from "@/lib/estates-compliance/services/HelpdeskService";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;

  const stats = await HelpdeskService.getStats(organizationId);

  return apiSuccess(stats);
});
