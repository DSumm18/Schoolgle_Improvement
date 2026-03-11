/**
 * Individual Task API
 *
 * GET /api/estates/tasks/[id] - Get a single task
 * PATCH /api/estates/tasks/[id] - Update a task
 * DELETE /api/estates/tasks/[id] - Delete a task
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { TaskService } from "@/lib/estates-compliance/services/TaskService";

export const GET = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop()!;

  const task = await TaskService.getById(id);

  if (!task) {
    return apiError("Task not found", 404);
  }

  return apiSuccess({ task });
});

export const PATCH = protectedRoute(
  async (auth, request) => {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop()!;

    const body = await request.json();
    const task = await TaskService.update(id, body);

    return apiSuccess({ task });
  },
  { requiredRole: "caretaker" },
);

export const DELETE = protectedRoute(
  async (auth, request) => {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop()!;

    await TaskService.delete(id);

    return apiSuccess({ message: "Task deleted successfully" });
  },
  { requiredRole: "caretaker" },
);
