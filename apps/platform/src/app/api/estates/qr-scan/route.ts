/**
 * QR/NFC Asset Scan API
 *
 * GET  /api/estates/qr-scan — Get scan history for an asset or location
 * POST /api/estates/qr-scan — Log a new scan (append-only)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const assetId = searchParams.get("assetId");
  const assetLocationId = searchParams.get("assetLocationId");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("asset_qr_scans")
    .select("*")
    .eq("organization_id", organizationId)
    .order("scanned_at", { ascending: false })
    .limit(limit);

  if (assetId) {
    query = query.eq("asset_id", assetId);
  }
  if (assetLocationId) {
    query = query.eq("asset_location_id", assetLocationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching scans:", error);
    return apiError("Failed to fetch scan history", 500);
  }

  return apiSuccess({ scans: data });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    assetLocationId,
    assetId,
    scannedBy,
    scannedByName,
    scanType,
    scanContext,
    result,
    locationLat,
    locationLng,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId) {
    return apiError("organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("asset_qr_scans")
    .insert({
      organization_id: orgId,
      asset_location_id: assetLocationId || null,
      asset_id: assetId || null,
      scanned_by: scannedBy || null,
      scanned_by_name: scannedByName || null,
      scan_type: scanType || "info_view",
      scan_context: scanContext || "ad_hoc",
      result: result || null,
      location_lat: locationLat || null,
      location_lng: locationLng || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error logging scan:", error);
    return apiError("Failed to log scan", 500);
  }

  return apiSuccess({ scan: data }, 201);
});
