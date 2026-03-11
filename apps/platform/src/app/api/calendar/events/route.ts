/**
 * School Events API
 *
 * GET  /api/calendar/events - List events with filters
 * POST /api/calendar/events - Create a new event
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ── Event Types ──────────────────────────────────────────────────────

export type EventType =
  | "inset_day"
  | "parents_evening"
  | "open_day"
  | "school_trip"
  | "sports_day"
  | "concert"
  | "assembly"
  | "exam"
  | "assessment_week"
  | "inspection"
  | "governor_meeting"
  | "staff_meeting"
  | "celebration"
  | "fundraiser"
  | "closure"
  | "other";

// ── Demo Data ────────────────────────────────────────────────────────

const DEMO_EVENTS = [
  {
    id: "demo-evt-1",
    organization_id: "demo",
    title: "INSET Day - Staff Training",
    event_type: "inset_day",
    start_date: "2025-09-01",
    end_date: "2025-09-01",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description:
      "Whole school staff training - safeguarding update and curriculum planning",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-2",
    organization_id: "demo",
    title: "INSET Day - Assessment Moderation",
    event_type: "inset_day",
    start_date: "2025-09-02",
    end_date: "2025-09-02",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description: "Assessment moderation and data analysis day",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-3",
    organization_id: "demo",
    title: "Year 6 Residential Trip",
    event_type: "school_trip",
    start_date: "2025-10-06",
    end_date: "2025-10-08",
    start_time: "07:30",
    end_time: "17:00",
    all_day: false,
    location: "PGL Liddington",
    description: "Three-day residential trip for Year 6",
    year_groups: ["6"],
    visibility: "public",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-4",
    organization_id: "demo",
    title: "Harvest Festival Assembly",
    event_type: "assembly",
    start_date: "2025-10-17",
    end_date: "2025-10-17",
    start_time: "09:15",
    end_time: "10:00",
    all_day: false,
    location: "Main Hall",
    description: "Whole school harvest festival. Parents welcome.",
    year_groups: [],
    visibility: "public",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-5",
    organization_id: "demo",
    title: "Parents' Evening - Autumn",
    event_type: "parents_evening",
    start_date: "2025-11-12",
    end_date: "2025-11-12",
    start_time: "15:30",
    end_time: "19:00",
    all_day: false,
    location: "Classrooms",
    description: "Autumn term parents' evening for all year groups",
    year_groups: [],
    visibility: "public",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-6",
    organization_id: "demo",
    title: "Christmas Concert - KS1",
    event_type: "concert",
    start_date: "2025-12-10",
    end_date: "2025-12-10",
    start_time: "14:00",
    end_time: "15:00",
    all_day: false,
    location: "Main Hall",
    description: "Key Stage 1 Christmas concert performance",
    year_groups: ["R", "1", "2"],
    visibility: "public",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-7",
    organization_id: "demo",
    title: "Christmas Concert - KS2",
    event_type: "concert",
    start_date: "2025-12-11",
    end_date: "2025-12-11",
    start_time: "14:00",
    end_time: "15:00",
    all_day: false,
    location: "Main Hall",
    description: "Key Stage 2 Christmas concert performance",
    year_groups: ["3", "4", "5", "6"],
    visibility: "public",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-8",
    organization_id: "demo",
    title: "INSET Day",
    event_type: "inset_day",
    start_date: "2026-01-05",
    end_date: "2026-01-05",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description: "Spring term INSET day",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-9",
    organization_id: "demo",
    title: "Governor Meeting",
    event_type: "governor_meeting",
    start_date: "2026-01-22",
    end_date: "2026-01-22",
    start_time: "17:00",
    end_time: "19:00",
    all_day: false,
    location: "Headteacher's Office",
    description: "Full governing body meeting",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-10",
    organization_id: "demo",
    title: "Assessment Week - Spring",
    event_type: "assessment_week",
    start_date: "2026-02-09",
    end_date: "2026-02-13",
    start_time: null,
    end_time: null,
    all_day: true,
    location: null,
    description: "Spring term assessment window for Years 1-6",
    year_groups: ["1", "2", "3", "4", "5", "6"],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-11",
    organization_id: "demo",
    title: "Parents' Evening - Spring",
    event_type: "parents_evening",
    start_date: "2026-03-18",
    end_date: "2026-03-18",
    start_time: "15:30",
    end_time: "19:00",
    all_day: false,
    location: "Classrooms",
    description: "Spring term parents' evening",
    year_groups: [],
    visibility: "public",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-12",
    organization_id: "demo",
    title: "INSET Day",
    event_type: "inset_day",
    start_date: "2026-04-20",
    end_date: "2026-04-20",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description: "Summer term INSET day",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-13",
    organization_id: "demo",
    title: "Sports Day",
    event_type: "sports_day",
    start_date: "2026-06-19",
    end_date: "2026-06-19",
    start_time: "09:30",
    end_time: "15:00",
    all_day: false,
    location: "School Field",
    description: "Annual sports day - parents welcome from 12:30",
    year_groups: [],
    visibility: "public",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-14",
    organization_id: "demo",
    title: "Year 6 Leavers' Assembly",
    event_type: "celebration",
    start_date: "2026-07-17",
    end_date: "2026-07-17",
    start_time: "14:00",
    end_time: "15:30",
    all_day: false,
    location: "Main Hall",
    description: "Year 6 leavers' celebration assembly. Parents invited.",
    year_groups: ["6"],
    visibility: "public",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "demo-evt-15",
    organization_id: "demo",
    title: "INSET Day",
    event_type: "inset_day",
    start_date: "2026-07-22",
    end_date: "2026-07-22",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description: "End of year INSET day - transition planning",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
    created_at: "2025-08-15T00:00:00Z",
  },
];

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const eventType = searchParams.get("event_type");
  const yearGroup = searchParams.get("year_group");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("school_events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("start_date", { ascending: true });

  if (startDate) query = query.gte("start_date", startDate);
  if (endDate) query = query.lte("start_date", endDate);
  if (eventType) query = query.eq("event_type", eventType);

  const { data, error } = await query;

  if (error) {
    console.error("[Calendar Events] DB error:", error.message);
  }

  let events = data || [];

  // Filter by year group in application (jsonb array)
  if (yearGroup && events.length > 0) {
    events = events.filter(
      (e: any) =>
        !e.year_groups ||
        e.year_groups.length === 0 ||
        e.year_groups.includes(yearGroup),
    );
  }

  // Return demo data if no real data exists
  if (events.length === 0) {
    let demoFiltered = [...DEMO_EVENTS];
    if (startDate)
      demoFiltered = demoFiltered.filter((e) => e.start_date >= startDate);
    if (endDate)
      demoFiltered = demoFiltered.filter((e) => e.start_date <= endDate);
    if (eventType)
      demoFiltered = demoFiltered.filter((e) => e.event_type === eventType);
    if (yearGroup)
      demoFiltered = demoFiltered.filter(
        (e) => e.year_groups.length === 0 || e.year_groups.includes(yearGroup),
      );

    return apiSuccess({
      events: demoFiltered,
      total: demoFiltered.length,
      is_demo: true,
    });
  }

  return apiSuccess({
    events,
    total: events.length,
    is_demo: false,
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const body = await request.json();

  if (!body.title || !body.event_type || !body.start_date) {
    return apiError("title, event_type, and start_date are required", 400);
  }

  const supabase = createServiceRoleClient();

  const eventData = {
    organization_id: organizationId,
    title: body.title,
    event_type: body.event_type,
    start_date: body.start_date,
    end_date: body.end_date || body.start_date,
    start_time: body.start_time || null,
    end_time: body.end_time || null,
    all_day: body.all_day ?? true,
    location: body.location || null,
    description: body.description || null,
    year_groups: body.year_groups || [],
    visibility: body.visibility || "public",
    recurring: body.recurring || null,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("school_events")
    .insert(eventData)
    .select()
    .single();

  if (error) {
    console.error("[Calendar Events] Insert error:", error.message);
    return apiError("Failed to create event", 500);
  }

  return apiSuccess({ event: data }, 201);
});
