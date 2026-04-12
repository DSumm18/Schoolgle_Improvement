/**
 * Single Asset API Routes
 *
 * GET    /api/estates/assets/[id]  - Get asset
 * PUT    /api/estates/assets/[id]  - Update asset
 * DELETE /api/estates/assets/[id]  - Delete asset
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { AssetService } from "@/lib/estates-compliance/services/AssetService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/estates/assets/[id]
 */
export const GET = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop()!;

  const asset = await AssetService.get(id);

  if (!asset) {
    return apiError("Asset not found", 404);
  }

  return apiSuccess({ data: asset });
});

/**
 * PUT /api/estates/assets/[id]
 */
export const PUT = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop()!;
  const updates = await request.json();

  try {
    const asset = await AssetService.update(id, updates, auth.organizationId);
    return apiSuccess({ data: asset });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return apiError(error.message, 404);
      }
      if (error.message.includes("child assets")) {
        return apiError(error.message, 400);
      }
    }
    throw error;
  }
});

/**
 * DELETE /api/estates/assets/[id]
 */
export const DELETE = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop()!;

  try {
    await AssetService.delete(id, auth.organizationId);
    return apiSuccess({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return apiError(error.message, 404);
      }
      if (error.message.includes("child assets")) {
        return apiError(error.message, 400);
      }
    }
    throw error;
  }
});
