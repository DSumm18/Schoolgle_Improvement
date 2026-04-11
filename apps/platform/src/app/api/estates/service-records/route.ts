/**
 * Service Records API
 *
 * POST /api/estates/service-records
 *   Create a service record covering 1+ assets with cost allocation.
 *
 * GET /api/estates/service-records?asset_id=X
 *   List service history for an asset (most recent first).
 *
 * GET /api/estates/service-records?bundling=true
 *   Return bundling opportunities across the organization.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  createServiceRecord,
  getServiceHistoryForAsset,
  findBundlingOpportunities,
  type CreateServiceRecordInput,
} from "@/lib/estates-compliance/database/service-records";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const { organizationId, userId } = auth;
  const body = (await request.json()) as Omit<CreateServiceRecordInput, "organization_id">;

  if (!body.assets || body.assets.length === 0) {
    return apiError("At least one asset must be specified", 400);
  }
  if (!body.service_date || !body.service_type) {
    return apiError("service_date and service_type are required", 400);
  }

  try {
    const result = await createServiceRecord({
      ...body,
      organization_id: organizationId,
      created_by: userId,
    });
    return apiSuccess(result, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create service record";
    return apiError(message, 500);
  }
});

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const { organizationId } = auth;
  const searchParams = request.nextUrl.searchParams;

  const bundling = searchParams.get("bundling") === "true";
  if (bundling) {
    const windowDays = parseInt(searchParams.get("window_days") || "90", 10);
    const callOutFee = parseInt(searchParams.get("callout_fee") || "100", 10);
    const opportunities = await findBundlingOpportunities(organizationId, windowDays, callOutFee);
    return apiSuccess({ opportunities, window_days: windowDays, callout_fee: callOutFee });
  }

  const assetId = searchParams.get("asset_id");
  if (!assetId) {
    return apiError("asset_id query parameter is required (or use ?bundling=true)", 400);
  }

  const history = await getServiceHistoryForAsset(assetId, organizationId);
  return apiSuccess({ asset_id: assetId, history, total_spend: history.reduce((s, r) => s + (Number(r.cost_allocated) || 0), 0) });
});
