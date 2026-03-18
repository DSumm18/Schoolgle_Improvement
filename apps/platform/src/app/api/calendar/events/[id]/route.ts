/**
 * Single Calendar Event API
 *
 * GET    /api/calendar/events/[id] - Get event by ID
 * PATCH  /api/calendar/events/[id] - Update event fields
 * DELETE /api/calendar/events/[id] - Delete event
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function extractId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  return segments[segments.length - 1];
}

// ── GET — single event ──────────────────────────────────────────────

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const id = extractId(request);
  const supabase = createServiceRoleClient();

  const { data: event, error } = await supabase
    .from("school_calendar_events")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !event) {
    return apiError("Event not found", 404);
  }

  return apiSuccess({ event });
});

// ── PATCH — update event fields ─────────────────────────────────────

export const PATCH = protectedRoute(async (auth, request: NextRequest) => {
  const id = extractId(request);
  const body = await request.json();
  const supabase = createServiceRoleClient();

  const allowedFields = [
    "event_type",
    "title",
    "start_date",
    "end_date",
    "start_time",
    "end_time",
    "recurrence_pattern",
    "academic_year",
    "affects_energy",
    "expected_occupancy_pct",
    "colour",
    "notes",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return apiError("No valid fields to update", 400);
  }

  const { data, error } = await supabase
    .from("school_calendar_events")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) {
    console.error("[Calendar Events] Update error:", error.message);
    return apiError(`Failed to update event: ${error.message}`, 500);
  }

  if (!data) {
    return apiError("Event not found", 404);
  }

  return apiSuccess({ event: data });
});

// ── DELETE — remove event ───────────────────────────────────────────

export const DELETE = protectedRoute(async (auth, request: NextRequest) => {
  const id = extractId(request);
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("school_calendar_events")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) {
    console.error("[Calendar Events] Delete error:", error.message);
    return apiError(`Failed to delete event: ${error.message}`, 500);
  }

  return apiSuccess({ deleted: true });
});
