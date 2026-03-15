/**
 * Assembly Schedules API
 *
 * GET  /api/assemblies - List assembly schedule
 * POST /api/assemblies - Create assembly schedule entry
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("assembly_schedules")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time");

  if (error) {
    return apiError("Failed to fetch assemblies", 500);
  }

  // Get today's assemblies
  const today = new Date().getDay(); // 0=Sun
  const todaysAssemblies = (data || []).filter((a: any) => a.day_of_week === today);

  // Get upcoming video rooms for assemblies
  const { data: liveRooms } = await supabase
    .from("video_rooms")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("room_type", "assembly")
    .in("status", ["scheduled", "live"])
    .gte("scheduled_start", new Date().toISOString())
    .order("scheduled_start")
    .limit(5);

  return apiSuccess({
    schedules: data || [],
    todaysAssemblies,
    upcomingRooms: liveRooms || [],
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    title,
    assembly_type = "assembly",
    day_of_week,
    start_time,
    end_time,
    location,
    is_virtual = false,
    led_by,
    worship_theme,
    target_year_groups,
    is_whole_school = true,
    default_provider,
    auto_create_room = true,
  } = body;

  if (!title || day_of_week === undefined || !start_time || !end_time) {
    return apiError("title, day_of_week, start_time, and end_time are required", 400);
  }

  const { data, error } = await supabase
    .from("assembly_schedules")
    .insert({
      organization_id: organizationId,
      title,
      assembly_type,
      day_of_week,
      start_time,
      end_time,
      location,
      is_virtual,
      led_by,
      worship_theme,
      target_year_groups: target_year_groups || [],
      is_whole_school,
      default_provider: default_provider || "google_meet",
      auto_create_room,
    })
    .select()
    .single();

  if (error) {
    return apiError("Failed to create assembly", 500);
  }

  return apiSuccess(data, 201);
});
