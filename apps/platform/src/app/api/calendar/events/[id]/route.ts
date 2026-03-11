/**
 * Single Event API
 *
 * GET    /api/calendar/events/[id] - Get event with parents' evening slots
 * PUT    /api/calendar/events/[id] - Update event
 * DELETE /api/calendar/events/[id] - Delete event
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const id = request.nextUrl.pathname.split("/").pop();

  const supabase = createServiceRoleClient();

  const { data: event, error } = await supabase
    .from("school_events")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !event) {
    return apiError("Event not found", 404);
  }

  // If parents' evening, also fetch slots
  let slots = null;
  if (event.event_type === "parents_evening") {
    const { data: slotData } = await supabase
      .from("parents_evening_slots")
      .select("*")
      .eq("event_id", id)
      .order("teacher_name", { ascending: true })
      .order("start_time", { ascending: true });

    slots = slotData || [];
  }

  return apiSuccess({ event, slots });
});

export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const id = request.nextUrl.pathname.split("/").pop();
  const body = await request.json();

  const supabase = createServiceRoleClient();

  const updateData: Record<string, any> = {};
  const allowedFields = [
    "title",
    "event_type",
    "start_date",
    "end_date",
    "start_time",
    "end_time",
    "all_day",
    "location",
    "description",
    "year_groups",
    "visibility",
    "recurring",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return apiError("No fields to update", 400);
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("school_events")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    console.error("[Calendar Events] Update error:", error.message);
    return apiError("Failed to update event", 500);
  }

  return apiSuccess({ event: data });
});

export const DELETE = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const id = request.nextUrl.pathname.split("/").pop();

  const supabase = createServiceRoleClient();

  // Delete associated slots first (if parents' evening)
  await supabase.from("parents_evening_slots").delete().eq("event_id", id);

  const { error } = await supabase
    .from("school_events")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[Calendar Events] Delete error:", error.message);
    return apiError("Failed to delete event", 500);
  }

  return apiSuccess({ deleted: true });
});
