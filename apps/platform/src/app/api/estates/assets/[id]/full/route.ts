/**
 * Asset full detail API
 *
 * GET /api/estates/assets/[id]/full
 * Returns the asset with computed warranty status, supplier contact,
 * linked tickets, linked compliance tasks, and linked evidence.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { getAssetWithLinks } from "@/lib/estates-compliance/database/assets";

export const GET = protectedRoute(async (_auth, request: NextRequest) => {
  const parts = request.nextUrl.pathname.split("/");
  const idIdx = parts.indexOf("assets") + 1;
  const assetId = parts[idIdx];

  if (!assetId) {
    return apiError("asset id is required", 400);
  }

  const asset = await getAssetWithLinks(assetId);
  if (!asset) {
    return apiError("Asset not found", 404);
  }

  return apiSuccess(asset);
});
