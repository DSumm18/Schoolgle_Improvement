import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { getAssetById } from "@/lib/estates-compliance/database/assets";
import { AssetService } from "@/lib/estates-compliance/services/AssetService";
import {
  mergePathfinderPin,
  type PathfinderAssetPin,
} from "@/lib/pathfinder/estates-integration";

function getAssetIdFromPath(pathname: string): string {
  const parts = pathname.split("/");
  return parts[parts.indexOf("assets") + 1] ?? "";
}

export const PATCH = protectedRoute(
  async (auth, request) => {
    const assetId = getAssetIdFromPath(request.nextUrl.pathname);
    if (!assetId) return apiError("Asset id is required", 400);

    const body = await request.json();
    const existing = await getAssetById(assetId, auth.organizationId);
    if (!existing) return apiError("Asset not found", 404);

    const pin: PathfinderAssetPin = {
      modelId: typeof body.modelId === "string" ? body.modelId : undefined,
      roomId: typeof body.roomId === "string" ? body.roomId : undefined,
      siteFeatureId: typeof body.siteFeatureId === "string" ? body.siteFeatureId : undefined,
      x: typeof body.x === "number" ? body.x : undefined,
      y: typeof body.y === "number" ? body.y : undefined,
      sceneX: typeof body.sceneX === "number" ? body.sceneX : undefined,
      sceneZ: typeof body.sceneZ === "number" ? body.sceneZ : undefined,
      wallSide: typeof body.wallSide === "string" ? body.wallSide : undefined,
      locationScope: body.siteFeatureId ? "site" : "building",
      confidence: typeof body.confidence === "number" ? body.confidence : 0.9,
      status:
        body.status === "needs_review" || body.status === "needs_position" || body.status === "mapped"
          ? body.status
          : body.roomId || body.siteFeatureId || (typeof body.x === "number" && typeof body.y === "number")
            ? "mapped"
            : "needs_position",
      updatedAt: new Date().toISOString(),
      updatedBy: auth.userId,
    };

    const updates = {
      location_id: typeof body.locationId === "string" ? body.locationId : existing.location_id ?? undefined,
      building: typeof body.building === "string" ? body.building : existing.building ?? undefined,
      floor: typeof body.floor === "string" ? body.floor : existing.floor ?? undefined,
      room: typeof body.room === "string" ? body.room : existing.room ?? undefined,
      location_details: mergePathfinderPin(existing.location_details, pin),
    };

    const asset = await AssetService.update(assetId, updates, auth.organizationId);
    return apiSuccess({ asset });
  },
  { requiredRole: "caretaker" },
);
