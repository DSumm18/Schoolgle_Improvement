/**
 * Daily Risk Sync API
 *
 * POST /api/risk/daily-sync?organizationId=xxx
 *
 * Runs the full daily risk recalculation pipeline:
 *   1. Creates/updates risks from overdue statutory tasks
 *   2. Syncs mitigation statuses from linked tasks
 *   3. Recalculates residual scores for all open risks
 *   4. Sends notifications for new, above-appetite, and worsening risks
 *
 * Intended to be called by a Vercel cron job or authenticated admin.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { runDailyRiskRecalculation } from "@/lib/risk-integration";

export const POST = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId query parameter is required", 400);
  }

  const summary = await runDailyRiskRecalculation(organizationId);

  return apiSuccess({
    success: true,
    summary,
    timestamp: new Date().toISOString(),
  });
});
