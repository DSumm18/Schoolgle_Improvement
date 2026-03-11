/**
 * Compliance Tasks API
 *
 * GET /api/estates/tasks - List tasks with filters
 * POST /api/estates/tasks - Create a new task
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { TaskService } from "@/lib/estates-compliance/services/TaskService";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;

  const searchParams = request.nextUrl.searchParams;
  const filters = {
    status: searchParams.get("status") as any,
    priority: searchParams.get("priority") as any,
    domain: searchParams.get("domain") as any,
    assigned_to: searchParams.get("assigned_to") || undefined,
    overdue_only: searchParams.get("overdue_only") === "true",
    search: searchParams.get("search") || undefined,
  };

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const result = await TaskService.list(
    organizationId,
    Object.keys(filters).reduce((acc, key) => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined && value !== false) {
        acc[key] = value;
      }
      return acc;
    }, {} as any),
    { page, pageSize },
  );

  return apiSuccess({
    tasks: result.data,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
});

export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;

    const body = await request.json();

    const task = await TaskService.create(organizationId, body);

    return apiSuccess(task, 201);
  },
  { requiredRole: "caretaker" },
);
