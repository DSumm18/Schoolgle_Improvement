/**
 * Individual Custom Check API
 *
 * GET /api/estates/checks/custom/[id] - Get a single custom check
 * PUT /api/estates/checks/custom/[id] - Update a custom check
 * DELETE /api/estates/checks/custom/[id] - Archive/delete a custom check
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  getCustomCheckById,
  updateCustomCheck,
  archiveCustomCheck,
  deleteCustomCheck,
} from "@/lib/estates-compliance/database/custom-checks";

export const GET = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop()!;

  const check = await getCustomCheckById(id);

  if (!check) {
    return apiError("Custom check not found", 404);
  }

  return apiSuccess(check);
});

export const PUT = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop()!;
  const body = await request.json();

  // Check if exists
  const existing = await getCustomCheckById(id);
  if (!existing) {
    return apiError("Custom check not found", 404);
  }

  const updated = await updateCustomCheck(id, {
    ...body,
    updated_at: new Date().toISOString(),
  });

  return apiSuccess(updated);
});

export const DELETE = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop()!;

  const searchParams = request.nextUrl.searchParams;
  const permanent = searchParams.get("permanent") === "true";

  // Check if exists
  const existing = await getCustomCheckById(id);
  if (!existing) {
    return apiError("Custom check not found", 404);
  }

  if (permanent) {
    await deleteCustomCheck(id);
  } else {
    await archiveCustomCheck(id);
  }

  return apiSuccess({ success: true });
});
