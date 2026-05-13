import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import {
  broadLocationType,
  normaliseLocationType,
  parseLocationUploadCsv,
  type LocationUploadRow,
} from "@/lib/location-upload";
import { createServiceRoleClient } from "@/lib/supabase-server";

type ExistingLocation = {
  id: string;
  room_code: string | null;
};

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("estates_locations")
    .select("id,room_code,name,location_type,type,current_use,area_sqm,capacity,updated_at")
    .eq("organization_id", auth.organizationId)
    .order("room_code");

  if (error) return apiError(error.message, 500);

  return apiSuccess({
    locations: (data ?? []).map((location: any) => ({
      id: location.id,
      location_code: location.room_code,
      location_name: location.name,
      location_type: location.location_type || "TBC / Other",
      broad_type: location.type,
      current_use: location.current_use,
      area_sqm: location.area_sqm,
      capacity: location.capacity,
      updated_at: location.updated_at,
    })),
  });
}, { requiredRole: "slt", rateLimit: false });

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const parsed = parseLocationUploadCsv(String(body.csvText || body.csv || ""));
  if (parsed.errors.length > 0) {
    return apiError("Location upload has validation errors", 400, "INVALID_CSV", {
      errors: parsed.errors,
    });
  }
  if (parsed.locations.length === 0) return apiError("No location rows found", 400);

  const supabase = createServiceRoleClient();
  const codes = parsed.locations.map((location) => location.location_code);
  const { data: existingRows, error: existingError } = await supabase
    .from("estates_locations")
    .select("id,room_code")
    .eq("organization_id", auth.organizationId)
    .in("room_code", codes);

  if (existingError) return apiError(existingError.message, 500);

  const byCode = new Map<string, ExistingLocation>(
    ((existingRows ?? []) as ExistingLocation[])
      .filter((location) => location.room_code)
      .map((location) => [location.room_code!.toUpperCase(), location]),
  );

  let imported = 0;
  let updated = 0;
  const warnings: string[] = [];

  for (const location of parsed.locations) {
    const existing = byCode.get(location.location_code);
    const row = toLocationDbRow(auth.organizationId, location);

    if (existing) {
      const { error } = await supabase
        .from("estates_locations")
        .update(row)
        .eq("id", existing.id)
        .eq("organization_id", auth.organizationId);
      if (error) return apiError(error.message, 500);
      updated += 1;
      continue;
    }

    const { data: inserted, error } = await supabase
      .from("estates_locations")
      .insert(row)
      .select("id,room_code")
      .single();
    if (error) return apiError(error.message, 500);
    if (inserted?.room_code) byCode.set(inserted.room_code.toUpperCase(), inserted as ExistingLocation);
    imported += 1;
  }

  for (const location of parsed.locations) {
    if (!location.parent_location_code) continue;
    const child = byCode.get(location.location_code);
    const parent = byCode.get(location.parent_location_code);
    if (!child) continue;
    if (!parent) {
      warnings.push(`${location.location_code} parent ${location.parent_location_code} was not found.`);
      continue;
    }
    const { error } = await supabase
      .from("estates_locations")
      .update({ parent_id: parent.id, parent_location_id: parent.id, updated_at: new Date().toISOString() })
      .eq("id", child.id)
      .eq("organization_id", auth.organizationId);
    if (error) warnings.push(`${location.location_code} parent link could not be saved: ${error.message}`);
  }

  return apiSuccess({
    imported,
    updated,
    warnings,
    locations: parsed.locations.map((location) => location.location_code),
  });
}, { requiredRole: "slt" });

export const PATCH = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return apiError("Location id is required", 400);

  const locationType = normaliseLocationType(body.location_type);
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("estates_locations")
    .update({
      location_type: locationType,
      type: broadLocationType(locationType),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select("id,room_code,name,location_type,type,current_use,area_sqm,capacity,updated_at")
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess({
    location: {
      id: data.id,
      location_code: data.room_code,
      location_name: data.name,
      location_type: data.location_type || "TBC / Other",
      broad_type: data.type,
      current_use: data.current_use,
      area_sqm: data.area_sqm,
      capacity: data.capacity,
      updated_at: data.updated_at,
    },
  });
}, { requiredRole: "slt" });

function toLocationDbRow(organizationId: string, location: LocationUploadRow) {
  return {
    organization_id: organizationId,
    name: location.location_name,
    type: location.broad_type,
    location_type: location.location_type,
    room_code: location.location_code,
    floor_number: parseFloorNumber(location.floor),
    area_sqm: location.area_sqm,
    capacity: location.capacity,
    current_use: location.current_use,
    accessibility: null,
    accessibility_notes: null,
    hazards: [],
    hazard_details: null,
    metadata: {
      building_or_block: location.building_or_block,
      floor: location.floor,
      year_built: location.year_built,
      notes: location.notes,
      active: location.active,
    },
    updated_at: new Date().toISOString(),
  };
}

function parseFloorNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
