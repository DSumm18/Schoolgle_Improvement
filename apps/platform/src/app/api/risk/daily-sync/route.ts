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
import { runAutoEscalation } from "@/lib/risk/auto-escalation";

export const POST = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId query parameter is required", 400);
  }

  // Step 1: Run the existing daily risk recalculation pipeline
  const summary = await runDailyRiskRecalculation(organizationId);

  // Step 2: Run the dynamic auto-escalation pipeline
  const escalationSummary = await runAutoEscalation(organizationId);

  return apiSuccess({
    success: true,
    summary,
    escalation: escalationSummary,
    timestamp: new Date().toISOString(),
  });
});
