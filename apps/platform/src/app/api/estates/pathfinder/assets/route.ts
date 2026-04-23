import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { AssetService } from "@/lib/estates-compliance/services/AssetService";
import {
  estateAssetToPathfinderAsset,
  getPathfinderPin,
  isMappedPathfinderPin,
} from "@/lib/pathfinder/estates-integration";
import type { PathfinderExtractionResult } from "@/lib/pathfinder/prototype";
import type { AssetFilters, AssetStatus, AssetType } from "@/types/estates-compliance";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const pageSize = Math.min(parseInt(searchParams.get("page_size") || "500", 10), 1000);
  const filters: AssetFilters = {
    status: (searchParams.get("status") as AssetStatus | null) || "active",
    asset_type: (searchParams.get("asset_type") as AssetType | null) || undefined,
    category: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
  };

  const result = await AssetService.list(auth.organizationId, filters, {
    page: 1,
    pageSize,
  });

  const mapped = result.data.filter((asset) =>
    isMappedPathfinderPin(getPathfinderPin(asset.location_details)),
  );

  return apiSuccess({
    assets: result.data,
    pathfinderAssets: result.data.map((asset) => estateAssetToPathfinderAsset(asset)),
    summary: {
      total: result.data.length,
      mapped: mapped.length,
      unplaced: result.data.length - mapped.length,
    },
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const model = body.model as PathfinderExtractionResult | undefined;
  const pageSize = Math.min(Number(body.pageSize ?? 500), 1000);
  const filters: AssetFilters = { status: "active" };
  const result = await AssetService.list(auth.organizationId, filters, {
    page: 1,
    pageSize,
  });
  const mapped = result.data.filter((asset) =>
    isMappedPathfinderPin(getPathfinderPin(asset.location_details)),
  );

  return apiSuccess({
    assets: result.data,
    pathfinderAssets: result.data.map((asset) => estateAssetToPathfinderAsset(asset, model)),
    summary: {
      total: result.data.length,
      mapped: mapped.length,
      unplaced: result.data.length - mapped.length,
    },
  });
});
