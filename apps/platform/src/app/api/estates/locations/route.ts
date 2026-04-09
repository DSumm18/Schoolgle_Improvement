/**
 * Estates Locations API
 *
 * GET  /api/estates/locations — List locations (rooms, buildings, floors) for an organization
 * POST /api/estates/locations — Create a new location
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const locationType = searchParams.get("type");
  const buildingId = searchParams.get("buildingId");
  const parentId = searchParams.get("parentId");

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("estates_locations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  if (locationType) {
    query = query.eq("location_type", locationType);
  }
  if (buildingId) {
    query = query.eq("building_id", buildingId);
  }
  if (parentId) {
    query = query.eq("parent_location_id", parentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching locations:", error);
    return apiError("Failed to fetch locations", 500);
  }

  return apiSuccess({ locations: data });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    buildingId,
    parentLocationId,
    name,
    locationType,
    roomCode,
    floorNumber,
    areaSqm,
    capacity,
    currentUse,
    accessibility,
    accessibilityNotes,
    hazards,
    hazardDetails,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !name || !locationType) {
    return apiError("organizationId, name, and locationType are required", 400);
  }

  const validTypes = [
    "site",
    "building",
    "floor",
    "room",
    "outdoor_area",
    "corridor",
    "stairwell",
    "plant_room",
    "storage",
  ];
  if (!validTypes.includes(locationType)) {
    return apiError(
      `locationType must be one of: ${validTypes.join(", ")}`,
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("estates_locations")
    .insert({
      organization_id: orgId,
      building_id: buildingId || null,
      parent_location_id: parentLocationId || null,
      name,
      location_type: locationType,
      room_code: roomCode || null,
      floor_number: floorNumber || null,
      area_sqm: areaSqm || null,
      capacity: capacity || null,
      current_use: currentUse || null,
      accessibility: accessibility || "full",
      accessibility_notes: accessibilityNotes || null,
      hazards: hazards || [],
      hazard_details: hazardDetails || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating location:", error);
    return apiError("Failed to create location", 500);
  }

  return apiSuccess({ location: data }, 201);
});
