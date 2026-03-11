/**
 * Task Statistics API
 *
 * GET /api/estates/tasks/stats - Get task statistics for dashboard
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { TaskService } from "@/lib/estates-compliance/services/TaskService";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;

  const stats = await TaskService.getStats(organizationId);

  return apiSuccess(stats);
});
