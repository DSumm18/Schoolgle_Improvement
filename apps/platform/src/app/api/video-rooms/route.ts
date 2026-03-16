/**
 * Video Rooms API
 *
 * GET  /api/video-rooms - List rooms (upcoming, live, past)
 * POST /api/video-rooms - Create a new video room
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);

  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const display = url.searchParams.get("display"); // 'true' = display-mode rooms only
  const limit = parseInt(url.searchParams.get("limit") || "30");

  let query = supabase
    .from("video_rooms")
    .select("*")
    .eq("organization_id", organizationId)
    .order("scheduled_start", { ascending: true })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  } else {
    // Default: show upcoming + live
    query = query.in("status", ["scheduled", "live"]);
  }

  if (type) {
    query = query.eq("room_type", type);
  }

  if (display === "true") {
    query = query.eq("show_on_display", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Video Rooms] GET error:", error);
    return apiError("Failed to fetch rooms", 500);
  }

  // Check for live rooms
  const { count: liveCount } = await supabase
    .from("video_rooms")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "live");

  return apiSuccess({
    rooms: data || [],
    liveCount: liveCount || 0,
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId, email } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    room_name,
    room_type = "meeting",
    provider,
    meeting_url,
    meeting_id,
    scheduled_start,
    scheduled_end,
    participants,
    target_zones,
    target_year_groups,
    is_whole_school = false,
    show_on_display = false,
    auto_join_display = false,
    display_message,
    notes,
  } = body;

  if (!room_name) {
    return apiError("room_name is required", 400);
  }

  // Get default provider from settings if not specified
  let effectiveProvider = provider;
  if (!effectiveProvider) {
    const { data: settings } = await supabase
      .from("communication_settings")
      .select("default_video_provider")
      .eq("organization_id", organizationId)
      .single();
    effectiveProvider = settings?.default_video_provider || "google_meet";
  }

  // Get host name
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  const { data, error } = await supabase
    .from("video_rooms")
    .insert({
      organization_id: organizationId,
      room_name,
      room_type,
      provider: effectiveProvider,
      meeting_url,
      meeting_id,
      scheduled_start,
      scheduled_end,
      host_id: userId,
      host_name: userData?.full_name || email,
      participants: participants || [],
      target_zones: target_zones || [],
      target_year_groups: target_year_groups || [],
      is_whole_school,
      show_on_display,
      auto_join_display,
      display_message,
      notes,
      status: "scheduled",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[Video Rooms] POST error:", error);
    return apiError("Failed to create room", 500);
  }

  return apiSuccess(data, 201);
});
