/**
 * Asset Locations API — pin assets to positions on floor plans
 *
 * GET  /api/estates/asset-locations — List asset locations for a floor plan or location
 * POST /api/estates/asset-locations — Pin an asset to a position
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const floorPlanId = searchParams.get("floorPlanId");
  const locationId = searchParams.get("locationId");

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("asset_locations")
    .select("*")
    .eq("organization_id", organizationId);

  if (floorPlanId) {
    query = query.eq("floor_plan_id", floorPlanId);
  }
  if (locationId) {
    query = query.eq("location_id", locationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching asset locations:", error);
    return apiError("Failed to fetch asset locations", 500);
  }

  return apiSuccess({ assetLocations: data });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    organizationId,
    assetId,
    locationId,
    floorPlanId,
    positionX,
    positionY,
    iconType,
    label,
    qrCodeId,
    nfcTagId,
  } = body;

  const orgId = organizationId || auth.organizationId;

  if (!orgId || !assetId) {
    return apiError("organizationId and assetId are required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("asset_locations")
    .insert({
      organization_id: orgId,
      asset_id: assetId,
      location_id: locationId || null,
      floor_plan_id: floorPlanId || null,
      position_x: positionX || null,
      position_y: positionY || null,
      icon_type: iconType || null,
      label: label || null,
      qr_code_id: qrCodeId || null,
      nfc_tag_id: nfcTagId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating asset location:", error);
    return apiError("Failed to create asset location", 500);
  }

  return apiSuccess({ assetLocation: data }, 201);
});
