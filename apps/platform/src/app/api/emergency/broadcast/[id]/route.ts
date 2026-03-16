/**
 * Emergency Broadcast Operations
 *
 * GET    /api/emergency/broadcast/[id] - Get broadcast details
 * PATCH  /api/emergency/broadcast/[id] - Update (resolve, escalate, update message)
 * DELETE /api/emergency/broadcast/[id] - Cancel broadcast
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function extractId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  return segments[segments.length - 1];
}

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = extractId(request);

  const { data: broadcast, error } = await supabase
    .from("emergency_broadcasts")
    .select(`
      *,
      emergency_zone_instructions(*, emergency_zones:zone_id(zone_name, zone_code)),
      emergency_acknowledgements(*, emergency_zones:zone_id(zone_name)),
      emergency_broadcast_log(*)
    `)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !broadcast) {
    return apiError("Broadcast not found", 404);
  }

  // Get zone details
  const { data: zones } = await supabase
    .from("emergency_zones")
    .select("*")
    .eq("organization_id", organizationId);

  // Get connected device count
  const { count: onlineDevices } = await supabase
    .from("emergency_display_devices")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_online", true);

  // Get acknowledgement stats
  const { count: ackCount } = await supabase
    .from("emergency_acknowledgements")
    .select("*", { count: "exact", head: true })
    .eq("broadcast_id", id);

  return apiSuccess({
    broadcast,
    zones: zones || [],
    stats: {
      onlineDevices: onlineDevices || 0,
      totalZones: (zones || []).length,
      acknowledgedZones: ackCount || 0,
    },
  });
});

export const PATCH = protectedRoute(async (auth, request) => {
  const { organizationId, userId, email } = auth;
  const supabase = createServiceRoleClient();
  const id = extractId(request);
  const body = await request.json();

  const { action, ...updates } = body;

  // Get current broadcast
  const { data: current } = await supabase
    .from("emergency_broadcasts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!current) {
    return apiError("Broadcast not found", 404);
  }

  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();
  const actorName = userData?.full_name || email;

  if (action === "resolve" || action === "all_clear") {
    // Stand down the emergency
    const { data, error } = await supabase
      .from("emergency_broadcasts")
      .update({
        status: "resolved",
        resolved_by: userId,
        resolved_by_name: actorName,
        resolved_at: new Date().toISOString(),
        resolution_notes: updates.resolution_notes || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return apiError("Failed to resolve broadcast", 500);

    await supabase.from("emergency_broadcast_log").insert({
      broadcast_id: id,
      event_type: action === "all_clear" ? "all_clear" : "resolved",
      actor_id: userId,
      actor_name: actorName,
      details: { resolution_notes: updates.resolution_notes },
    });

    return apiSuccess(data);
  }

  if (action === "escalate") {
    const { data, error } = await supabase
      .from("emergency_broadcasts")
      .update({
        severity: updates.severity || "critical",
        message: updates.message || current.message,
        status: "escalated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return apiError("Failed to escalate broadcast", 500);

    await supabase.from("emergency_broadcast_log").insert({
      broadcast_id: id,
      event_type: "escalated",
      actor_id: userId,
      actor_name: actorName,
      details: { new_severity: updates.severity, updated_message: updates.message },
    });

    return apiSuccess(data);
  }

  if (action === "acknowledge") {
    // A zone/device acknowledges receipt
    const { data, error } = await supabase
      .from("emergency_acknowledgements")
      .insert({
        broadcast_id: id,
        device_id: updates.device_id,
        zone_id: updates.zone_id,
        acknowledged_by: userId,
        acknowledged_by_name: actorName,
        headcount: updates.headcount,
        all_accounted_for: updates.all_accounted_for,
        missing_persons: updates.missing_persons,
        needs_assistance: updates.needs_assistance || false,
        notes: updates.notes,
      })
      .select()
      .single();

    if (error) return apiError("Failed to record acknowledgement", 500);

    await supabase.from("emergency_broadcast_log").insert({
      broadcast_id: id,
      event_type: "acknowledged",
      actor_id: userId,
      actor_name: actorName,
      details: {
        zone_id: updates.zone_id,
        headcount: updates.headcount,
        all_accounted_for: updates.all_accounted_for,
        needs_assistance: updates.needs_assistance,
      },
    });

    return apiSuccess(data);
  }

  if (action === "update_message") {
    const { data, error } = await supabase
      .from("emergency_broadcasts")
      .update({
        message: updates.message,
        custom_instructions: updates.custom_instructions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return apiError("Failed to update message", 500);

    await supabase.from("emergency_broadcast_log").insert({
      broadcast_id: id,
      event_type: "message_updated",
      actor_id: userId,
      actor_name: actorName,
      details: { new_message: updates.message },
    });

    return apiSuccess(data);
  }

  return apiError("Unknown action. Use: resolve, all_clear, escalate, acknowledge, update_message", 400);
});

export const DELETE = protectedRoute(async (auth, request) => {
  const { organizationId, userId, email } = auth;
  const supabase = createServiceRoleClient();
  const id = extractId(request);

  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();
  const actorName = userData?.full_name || email;

  const { data, error } = await supabase
    .from("emergency_broadcasts")
    .update({
      status: "cancelled",
      resolved_by: userId,
      resolved_by_name: actorName,
      resolved_at: new Date().toISOString(),
      resolution_notes: "Cancelled - false alarm",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) return apiError("Failed to cancel broadcast", 500);

  await supabase.from("emergency_broadcast_log").insert({
    broadcast_id: id,
    event_type: "cancelled",
    actor_id: userId,
    actor_name: actorName,
    details: { reason: "false_alarm" },
  });

  return apiSuccess(data);
});
