/**
 * Emergency Broadcast API
 *
 * GET  /api/emergency/broadcast - List broadcasts (active + recent)
 * POST /api/emergency/broadcast - TRIGGER a new emergency broadcast
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const url = new URL(request.url);
  const status = url.searchParams.get("status"); // 'active', 'resolved', etc.
  const limit = parseInt(url.searchParams.get("limit") || "20");

  let query = supabase
    .from("emergency_broadcasts")
    .select("*, emergency_zone_instructions(*), emergency_acknowledgements(count)")
    .eq("organization_id", organizationId)
    .order("triggered_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Emergency Broadcast] GET error:", error);
    return apiError("Failed to fetch broadcasts", 500);
  }

  // Also get count of active broadcasts
  const { count: activeCount } = await supabase
    .from("emergency_broadcasts")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "active");

  return apiSuccess({
    broadcasts: data || [],
    activeCount: activeCount || 0,
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId, email } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    alert_type,
    severity = "critical",
    title,
    message,
    custom_instructions,
    affected_zone_ids = [],
    is_whole_school = false,
    play_audio = true,
    audio_type = "alarm",
    screen_color = "red",
    flash_screen = false,
    show_floor_plan = true,
    emergency_plan_id,
    is_drill = false,
    drill_id,
    // Zone-specific instructions
    zone_instructions = [],
  } = body;

  if (!alert_type || !title || !message) {
    return apiError("alert_type, title, and message are required", 400);
  }

  // For lockdown, force silent audio
  const effectiveAudioType = alert_type === "lockdown" ? "silent" : audio_type;
  const effectivePlayAudio = alert_type === "lockdown" ? false : play_audio;

  // Get zone names for denormalization
  let affectedZoneNames: string[] = [];
  if (affected_zone_ids.length > 0) {
    const { data: zones } = await supabase
      .from("emergency_zones")
      .select("id, zone_name, zone_code, adjacent_zone_ids")
      .in("id", affected_zone_ids);
    affectedZoneNames = (zones || []).map((z: any) => z.zone_name);
  }

  // Get triggerer name
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  const triggeredByName = userData?.full_name || email;

  // Create the broadcast
  const { data: broadcast, error } = await supabase
    .from("emergency_broadcasts")
    .insert({
      organization_id: organizationId,
      alert_type,
      severity,
      title,
      message,
      custom_instructions,
      affected_zone_ids,
      affected_zone_names: affectedZoneNames,
      is_whole_school,
      show_floor_plan,
      floor_plan_id: null,
      emergency_plan_id,
      play_audio: effectivePlayAudio,
      audio_type: effectiveAudioType,
      screen_color: alert_type === "lockdown" ? "black" : screen_color,
      flash_screen,
      status: is_drill ? "drill" : "active",
      triggered_by: userId,
      triggered_by_name: triggeredByName,
      triggered_from: "dashboard",
      is_drill,
      drill_id,
    })
    .select()
    .single();

  if (error) {
    console.error("[Emergency Broadcast] POST error:", error);
    return apiError("Failed to create broadcast", 500);
  }

  // Create zone-specific instructions
  if (zone_instructions.length > 0) {
    const instructions = zone_instructions.map((zi: any) => ({
      broadcast_id: broadcast.id,
      zone_id: zi.zone_id,
      proximity: zi.proximity || "affected",
      instruction: zi.instruction,
      secondary_instruction: zi.secondary_instruction,
      assembly_point: zi.assembly_point,
      evacuation_route: zi.evacuation_route,
    }));

    await supabase.from("emergency_zone_instructions").insert(instructions);
  }

  // Auto-generate zone instructions based on proximity if not manually specified
  if (zone_instructions.length === 0 && affected_zone_ids.length > 0) {
    const { data: allZones } = await supabase
      .from("emergency_zones")
      .select("*")
      .eq("organization_id", organizationId);

    if (allZones) {
      const autoInstructions: any[] = [];

      for (const zone of allZones) {
        const isAffected = affected_zone_ids.includes(zone.id);
        const isAdjacent = affected_zone_ids.some((aid: string) =>
          (zone.adjacent_zone_ids || []).includes(aid)
        );

        let proximity = "distant";
        let instruction = "";
        let secondaryInstruction = "";

        if (isAffected) {
          proximity = "affected";
          if (alert_type === "lockdown") {
            instruction = "LOCKDOWN: Lock doors, lights off, move away from windows and doors. Stay silent.";
            secondaryInstruction = "Do NOT open the door for anyone. Wait for ALL CLEAR from SLT or Police.";
          } else if (alert_type === "evacuation") {
            instruction = `EVACUATE IMMEDIATELY via ${zone.evacuation_route || "nearest fire exit"}.`;
            secondaryInstruction = `Go to: ${zone.assembly_point || "Main Assembly Point"}. Take register on arrival.`;
          } else if (alert_type === "medical") {
            instruction = "Medical emergency in your area. Clear space for first aiders. Keep pupils calm.";
            secondaryInstruction = "First aiders report to this zone immediately.";
          } else {
            instruction = message;
          }
        } else if (isAdjacent) {
          proximity = "adjacent";
          if (alert_type === "lockdown") {
            instruction = "LOCKDOWN: Lock doors, lights off, stay away from windows. Incident reported in adjacent area.";
            secondaryInstruction = "Exercise extreme caution. Do NOT enter corridors.";
          } else if (alert_type === "evacuation") {
            instruction = `Prepare to evacuate. Incident in adjacent zone. Use ${zone.evacuation_route || "your normal fire exit route"}.`;
            secondaryInstruction = `Assembly point: ${zone.assembly_point || "Main Assembly Point"}`;
          } else {
            instruction = `Alert in adjacent zone. ${message}`;
          }
        } else {
          proximity = "distant";
          if (alert_type === "lockdown") {
            instruction = "LOCKDOWN in effect. Secure your area as a precaution. Await further instructions.";
          } else if (alert_type === "evacuation") {
            instruction = "Evacuation in progress in another area. Be ready to evacuate if instructed. Continue normal activity for now.";
          } else {
            instruction = `School alert: ${title}. No immediate action required for your area.`;
          }
        }

        autoInstructions.push({
          broadcast_id: broadcast.id,
          zone_id: zone.id,
          proximity,
          instruction,
          secondary_instruction: secondaryInstruction,
          assembly_point: isAffected || isAdjacent ? zone.assembly_point : null,
          evacuation_route: isAffected ? zone.evacuation_route : null,
        });
      }

      if (autoInstructions.length > 0) {
        await supabase.from("emergency_zone_instructions").insert(autoInstructions);
      }
    }
  }

  // Log the trigger event
  await supabase.from("emergency_broadcast_log").insert({
    broadcast_id: broadcast.id,
    event_type: "triggered",
    actor_id: userId,
    actor_name: triggeredByName,
    details: {
      alert_type,
      severity,
      affected_zones: affectedZoneNames,
      is_whole_school,
      is_drill,
    },
  });

  return apiSuccess(broadcast, 201);
});
