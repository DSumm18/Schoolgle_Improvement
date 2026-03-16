/**
 * Individual Video Room Operations
 *
 * GET    /api/video-rooms/[id] - Get room details + participants
 * PATCH  /api/video-rooms/[id] - Update room (go live, end, update URL)
 * DELETE /api/video-rooms/[id] - Cancel room
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

  const { data: room, error } = await supabase
    .from("video_rooms")
    .select("*, video_room_participants(*)")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !room) return apiError("Room not found", 404);

  return apiSuccess(room);
});

export const PATCH = protectedRoute(async (auth, request) => {
  const { organizationId, userId, email } = auth;
  const supabase = createServiceRoleClient();
  const id = extractId(request);
  const body = await request.json();

  const { action, ...updates } = body;

  if (action === "go_live") {
    // Start the meeting — marks room as live
    const { data, error } = await supabase
      .from("video_rooms")
      .update({
        status: "live",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) return apiError("Failed to go live", 500);

    // If this is an assembly with auto_join_display, push to connected displays
    // via the emergency/notice stream infrastructure
    if (data.auto_join_display) {
      // Create a high-priority notice that displays see
      await supabase.from("school_notices").insert({
        organization_id: organizationId,
        title: `🔴 LIVE: ${data.room_name}`,
        body: data.display_message || `${data.room_name} is now live. ${data.meeting_url ? "Join via the link." : ""}`,
        notice_type: "announcement",
        priority: "urgent",
        show_on_display: true,
        show_on_dashboard: true,
        audience: "all",
        target_zone_ids: data.target_zones || [],
        display_style: "banner",
        display_duration_seconds: 30,
        expires_at: data.scheduled_end || new Date(Date.now() + 3600000).toISOString(),
        created_by: userId,
        created_by_name: data.host_name || email,
      });
    }

    return apiSuccess(data);
  }

  if (action === "end") {
    const { data, error } = await supabase
      .from("video_rooms")
      .update({
        status: "ended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) return apiError("Failed to end room", 500);

    // Mark all participants as left
    await supabase
      .from("video_room_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("room_id", id)
      .is("left_at", null);

    return apiSuccess(data);
  }

  if (action === "join") {
    // Record participant join
    const { data: userData } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .single();

    const { data, error } = await supabase
      .from("video_room_participants")
      .insert({
        room_id: id,
        user_id: userId,
        user_name: userData?.full_name || email,
        user_role: auth.role || "staff",
        join_method: updates.join_method || "link",
        device_type: updates.device_type || "desktop",
      })
      .select()
      .single();

    if (error) return apiError("Failed to record join", 500);
    return apiSuccess(data);
  }

  if (action === "leave") {
    await supabase
      .from("video_room_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("room_id", id)
      .eq("user_id", userId)
      .is("left_at", null);

    return apiSuccess({ left: true });
  }

  // Generic update (meeting URL, schedule, etc.)
  const allowedFields = [
    "room_name", "meeting_url", "meeting_id", "scheduled_start", "scheduled_end",
    "participants", "target_zones", "target_year_groups", "is_whole_school",
    "show_on_display", "auto_join_display", "display_message", "notes",
    "recording_url", "recording_consent",
  ];

  const safeUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      safeUpdates[key] = updates[key];
    }
  }

  const { data, error } = await supabase
    .from("video_rooms")
    .update(safeUpdates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) return apiError("Failed to update room", 500);
  return apiSuccess(data);
});

export const DELETE = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = extractId(request);

  const { error } = await supabase
    .from("video_rooms")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return apiError("Failed to cancel room", 500);
  return apiSuccess({ cancelled: true });
});
