/**
 * Emergency Display Devices API
 *
 * GET  /api/emergency/devices - List registered devices
 * POST /api/emergency/devices - Register a new device
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { randomBytes } from "crypto";

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("emergency_display_devices")
    .select("*, emergency_zones:zone_id(zone_name, zone_code)")
    .eq("organization_id", organizationId)
    .order("device_name");

  if (error) {
    return apiError("Failed to fetch devices", 500);
  }

  return apiSuccess({ devices: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const { device_name, device_type, zone_id, room_name, has_audio, has_display, screen_size } = body;

  if (!device_name) {
    return apiError("device_name is required", 400);
  }

  const connectionToken = randomBytes(32).toString("hex");

  const { data, error } = await supabase
    .from("emergency_display_devices")
    .insert({
      organization_id: organizationId,
      device_name,
      device_type: device_type || "display",
      zone_id,
      room_name,
      has_audio: has_audio !== false,
      has_display: has_display !== false,
      screen_size,
      connection_token: connectionToken,
      is_online: false,
    })
    .select()
    .single();

  if (error) {
    return apiError("Failed to register device", 500);
  }

  return apiSuccess(data, 201);
});
