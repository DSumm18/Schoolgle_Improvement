/**
 * Estates Location Detail API
 *
 * GET    /api/estates/locations/[id] — Get location with child locations and asset counts
 * PUT    /api/estates/locations/[id] — Update a location
 * DELETE /api/estates/locations/[id] — Delete a location (cascades children to null parent)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").filter(Boolean).pop()!;
  const supabase = createServiceRoleClient();

  // Get the location
  const { data: location, error } = await supabase
    .from("estates_locations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !location) {
    return apiError("Location not found", 404);
  }

  // Get child locations
  const { data: children } = await supabase
    .from("estates_locations")
    .select("id, name, location_type, room_code, capacity, current_use")
    .eq("parent_location_id", id)
    .order("name");

  // Get assets at this location
  const { data: assets } = await supabase
    .from("asset_locations")
    .select(
      "id, asset_id, label, icon_type, position_x, position_y, qr_code_id",
    )
    .eq("location_id", id);

  // Get recent scans at this location's assets
  const assetLocationIds = (assets || []).map((a) => a.id);
  let recentScans: any[] = [];
  if (assetLocationIds.length > 0) {
    const { data: scans } = await supabase
      .from("asset_qr_scans")
      .select("*")
      .in("asset_location_id", assetLocationIds)
      .order("scanned_at", { ascending: false })
      .limit(10);
    recentScans = scans || [];
  }

  return apiSuccess({
    location,
    children: children || [],
    assets: assets || [],
    recentScans,
  });
});

export const PUT = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").filter(Boolean).pop()!;
  const body = await request.json();
  const supabase = createServiceRoleClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  const allowedFields = [
    "name",
    "location_type",
    "room_code",
    "floor_number",
    "area_sqm",
    "capacity",
    "current_use",
    "accessibility",
    "accessibility_notes",
    "hazards",
    "hazard_details",
    "building_id",
    "parent_location_id",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("estates_locations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating location:", error);
    return apiError("Failed to update location", 500);
  }

  return apiSuccess({ location: data });
});

export const DELETE = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").filter(Boolean).pop()!;
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("estates_locations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting location:", error);
    return apiError("Failed to delete location", 500);
  }

  return apiSuccess({ success: true });
});
