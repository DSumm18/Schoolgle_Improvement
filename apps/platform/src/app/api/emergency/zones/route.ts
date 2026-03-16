/**
 * Emergency Zones API
 *
 * GET  /api/emergency/zones - List all emergency zones
 * POST /api/emergency/zones - Create a new zone
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data: zones, error } = await supabase
    .from("emergency_zones")
    .select("*, estates_locations:location_id(name, location_type, room_code), floor_plans:floor_plan_id(title, svg_data)")
    .eq("organization_id", organizationId)
    .order("zone_name");

  if (error) {
    console.error("[Emergency Zones] GET error:", error);
    return apiError("Failed to fetch zones", 500);
  }

  // Also get online device count per zone
  const { data: deviceCounts } = await supabase
    .from("emergency_display_devices")
    .select("zone_id")
    .eq("organization_id", organizationId)
    .eq("is_online", true);

  const zoneDeviceCounts: Record<string, number> = {};
  (deviceCounts || []).forEach((d: any) => {
    if (d.zone_id) {
      zoneDeviceCounts[d.zone_id] = (zoneDeviceCounts[d.zone_id] || 0) + 1;
    }
  });

  const zonesWithDevices = (zones || []).map((z: any) => ({
    ...z,
    online_devices: zoneDeviceCounts[z.id] || 0,
  }));

  return apiSuccess({ zones: zonesWithDevices });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const { zone_name, zone_code, zone_type, location_id, assembly_point, evacuation_route, floor_plan_id, adjacent_zone_ids } = body;

  if (!zone_name) {
    return apiError("zone_name is required", 400);
  }

  const { data, error } = await supabase
    .from("emergency_zones")
    .insert({
      organization_id: organizationId,
      zone_name,
      zone_code,
      zone_type: zone_type || "building",
      location_id,
      assembly_point,
      evacuation_route,
      floor_plan_id,
      adjacent_zone_ids: adjacent_zone_ids || [],
    })
    .select()
    .single();

  if (error) {
    console.error("[Emergency Zones] POST error:", error);
    return apiError("Failed to create zone", 500);
  }

  return apiSuccess(data, 201);
});
