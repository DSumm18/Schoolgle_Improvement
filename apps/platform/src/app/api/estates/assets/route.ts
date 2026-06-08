/**
 * Assets API Routes
 *
 * GET    /api/estates/assets              - List assets
 * POST   /api/estates/assets              - Create asset
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { AssetService } from "@/lib/estates-compliance/services/AssetService";
import type { AssetInput } from "@/types/estates-compliance";

/**
 * GET /api/estates/assets
 *
 * Query params:
 * - page: number (default: 1)
 * - page_size: number (default: 50)
 * - asset_type: string
 * - category: string
 * - building: string
 * - floor: string
 * - room: string
 * - status: string
 * - compliance_domain: string
 * - search: string
 */
export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;

  // Parse filters
  const filters: {
    asset_type?: string;
    category?: string;
    building?: string;
    floor?: string;
    room?: string;
    status?: string;
    compliance_domain?: string;
    linked_compliance_check?: string;
    search?: string;
  } = {};

  if (searchParams.get("asset_type"))
    filters.asset_type = searchParams.get("asset_type")!;
  if (searchParams.get("category"))
    filters.category = searchParams.get("category")!;
  if (searchParams.get("building"))
    filters.building = searchParams.get("building")!;
  if (searchParams.get("floor")) filters.floor = searchParams.get("floor")!;
  if (searchParams.get("room")) filters.room = searchParams.get("room")!;
  if (searchParams.get("status")) filters.status = searchParams.get("status")!;
  if (searchParams.get("compliance_domain"))
    filters.compliance_domain = searchParams.get("compliance_domain")!;
  if (searchParams.get("check_id"))
    filters.linked_compliance_check = searchParams.get("check_id")!;
  if (searchParams.get("search")) filters.search = searchParams.get("search")!;

  // Parse pagination
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "50", 10);

  const result = await AssetService.list(auth.organizationId, filters as any, {
    page,
    pageSize,
  });

  return apiSuccess({
    assets: result.data,
    total: result.count,
    page: result.page,
    pageSize: result.page_size,
    hasMore: result.has_more,
  });
});

/**
 * POST /api/estates/assets
 *
 * Body: AssetInput
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const { organization_id: _ignored, ...assetData } = body;

    if (!assetData.asset_type) {
      return apiError("asset_type is required", 400);
    }

    if (!assetData.name) {
      return apiError("name is required", 400);
    }

    const asset = await AssetService.create(
      auth.organizationId,
      assetData as AssetInput,
    );
    return apiSuccess({ data: asset }, 201);
  },
  { requiredRole: "teacher" },
);
