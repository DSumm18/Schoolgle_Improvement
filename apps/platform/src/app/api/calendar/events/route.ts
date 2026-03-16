/**
 * School Calendar Events API
 *
 * GET  /api/calendar/events - List events (+ term dates) with filters
 * POST /api/calendar/events - Create a new calendar event
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ── GET — list calendar events ──────────────────────────────────────

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  const sp = request.nextUrl.searchParams;

  const from = sp.get("from");
  const to = sp.get("to");
  const eventType = sp.get("event_type");
  const academicYear = sp.get("academic_year");

  // 1. Fetch calendar events
  let eventsQuery = supabase
    .from("school_calendar_events")
    .select("*")
    .eq("organization_id", orgId)
    .order("start_date", { ascending: true });

  if (from) eventsQuery = eventsQuery.gte("start_date", from);
  if (to) eventsQuery = eventsQuery.lte("start_date", to);
  if (eventType) eventsQuery = eventsQuery.eq("event_type", eventType);
  if (academicYear) eventsQuery = eventsQuery.eq("academic_year", academicYear);

  const { data: events, error: eventsErr } = await eventsQuery;

  if (eventsErr) {
    console.error("[Calendar Events] DB error:", eventsErr.message);
    return apiError("Failed to fetch calendar events", 500);
  }

  // 2. Fetch term dates and convert to event-like format
  let termsQuery = supabase
    .from("school_term_dates")
    .select("id, term_name, start_date, end_date, academic_year")
    .eq("organization_id", orgId)
    .order("start_date", { ascending: true });

  if (from) termsQuery = termsQuery.gte("end_date", from);
  if (to) termsQuery = termsQuery.lte("start_date", to);
  if (academicYear) termsQuery = termsQuery.eq("academic_year", academicYear);

  const { data: terms } = await termsQuery;

  const termEvents = (terms ?? []).map((t) => ({
    id: `term-${t.id}`,
    organization_id: orgId,
    event_type: "term_date" as const,
    title: t.term_name,
    start_date: t.start_date,
    end_date: t.end_date,
    start_time: null,
    end_time: null,
    recurrence_pattern: null,
    academic_year: t.academic_year,
    affects_energy: false,
    expected_occupancy_pct: null,
    colour: null,
    notes: null,
    created_by: null,
    created_at: null,
    _source: "term_dates",
  }));

  // 3. Merge and sort by start_date
  const allEvents = [...(events ?? []), ...termEvents].sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );

  return apiSuccess({
    events: allEvents,
    total: allEvents.length,
  });
});

// ── POST — create a new calendar event ──────────────────────────────

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  const body = await request.json();

  if (!body.title || !body.event_type || !body.start_date) {
    return apiError("title, event_type, and start_date are required", 400);
  }

  const eventData = {
    organization_id: orgId,
    event_type: body.event_type,
    title: body.title,
    start_date: body.start_date,
    end_date: body.end_date ?? null,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    recurrence_pattern: body.recurrence_pattern ?? null,
    academic_year: body.academic_year ?? null,
    affects_energy: body.affects_energy ?? false,
    expected_occupancy_pct: body.expected_occupancy_pct ?? null,
    colour: body.colour ?? null,
    notes: body.notes ?? null,
    created_by: auth.userId,
  };

  const { data, error } = await supabase
    .from("school_calendar_events")
    .insert(eventData)
    .select()
    .single();

  if (error) {
    console.error("[Calendar Events] Insert error:", error.message);
    return apiError(`Failed to create event: ${error.message}`, 500);
  }

  return apiSuccess({ event: data }, 201);
});
