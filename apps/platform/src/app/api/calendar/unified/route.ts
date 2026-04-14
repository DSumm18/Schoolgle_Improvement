/**
 * Unified Calendar API
 *
 * GET /api/calendar/unified?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Aggregates events from all modules in parallel:
 * - school_calendar_events
 * - ls_calendar_events (lesson timetable)
 * - staff_absences
 * - meetings (governance)
 * - estates_daily_diary
 * - estates_statutory_completions (compliance due dates)
 *
 * Each source is wrapped in try/catch so a missing table never breaks the whole response.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Types ───────────────────────────────────────────────────────────

export type CalendarSource =
  | "school_events"
  | "lessons"
  | "absences"
  | "meetings"
  | "estates"
  | "compliance";

export interface UnifiedCalendarEvent {
  id: string;
  source: CalendarSource;
  title: string;
  date: string; // YYYY-MM-DD of first day
  endDate?: string; // YYYY-MM-DD, for multi-day events
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  allDay: boolean;
  color: string;
  metadata: Record<string, unknown>;
}

const COLORS: Record<CalendarSource, string> = {
  school_events: "#3B82F6",
  lessons: "#06B6D4",
  absences: "#EF4444",
  meetings: "#8B5CF6",
  estates: "#F59E0B",
  compliance: "#10B981",
};

// ─── Individual fetchers ──────────────────────────────────────────────

async function fetchSchoolEvents(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
  start: string,
  end: string,
): Promise<UnifiedCalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from("school_calendar_events")
      .select("*")
      .eq("organization_id", orgId)
      .gte("start_date", start)
      .lte("start_date", end)
      .order("start_date", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((e) => ({
      id: `school-${e.id}`,
      source: "school_events" as CalendarSource,
      title: e.title,
      date: e.start_date,
      endDate: e.end_date ?? undefined,
      startTime: e.start_time ?? undefined,
      endTime: e.end_time ?? undefined,
      allDay: !e.start_time,
      color: COLORS.school_events,
      metadata: {
        event_type: e.event_type,
        year_groups: e.year_groups,
        location: e.location,
        notes: e.notes,
      },
    }));
  } catch (err) {
    console.warn("[UnifiedCalendar] school_events fetch failed:", err);
    return [];
  }
}

async function fetchLessons(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
  start: string,
  end: string,
): Promise<UnifiedCalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from("ls_calendar_events")
      .select("*, lesson_plan:ls_lesson_plans(id, title, learning_objective)")
      .eq("organization_id", orgId)
      .gte("event_date", start)
      .lte("event_date", end)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((e) => ({
      id: `lesson-${e.id}`,
      source: "lessons" as CalendarSource,
      title: e.title || e.subject || "Lesson",
      date: e.event_date,
      startTime: e.start_time ?? undefined,
      endTime: e.end_time ?? undefined,
      allDay: false,
      color: COLORS.lessons,
      metadata: {
        subject: e.subject,
        class_id: e.class_id,
        room: e.room,
        lesson_plan: e.lesson_plan,
      },
    }));
  } catch (err) {
    console.warn("[UnifiedCalendar] lessons fetch failed:", err);
    return [];
  }
}

async function fetchAbsences(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
  start: string,
  end: string,
): Promise<UnifiedCalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from("staff_absences")
      .select("*")
      .eq("organization_id", orgId)
      .lte("start_date", end)
      .gte("end_date", start)
      .order("start_date", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((e) => ({
      id: `absence-${e.id}`,
      source: "absences" as CalendarSource,
      title: `${e.staff_name ?? "Staff"} — ${formatAbsenceType(e.absence_type)}`,
      date: e.start_date,
      endDate: e.end_date ?? undefined,
      allDay: true,
      color: COLORS.absences,
      metadata: {
        staff_name: e.staff_name,
        staff_role: e.staff_role,
        absence_type: e.absence_type,
        half_day: e.half_day,
        half_day_period: e.half_day_period,
        total_days: e.total_days,
        cover_required: e.cover_required,
      },
    }));
  } catch (err) {
    console.warn("[UnifiedCalendar] absences fetch failed:", err);
    return [];
  }
}

async function fetchMeetings(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
  start: string,
  end: string,
): Promise<UnifiedCalendarEvent[]> {
  try {
    const startIso = `${start}T00:00:00`;
    const endIso = `${end}T23:59:59`;

    const { data, error } = await supabase
      .from("meetings")
      .select("id, title, status, scheduled_at, location, video_link, meeting_templates(id, name, category)")
      .eq("organization_id", orgId)
      .gte("scheduled_at", startIso)
      .lte("scheduled_at", endIso)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((m) => {
      const dt = new Date(m.scheduled_at);
      const date = dt.toISOString().split("T")[0];
      const startTime = dt.toTimeString().slice(0, 5);
      return {
        id: `meeting-${m.id}`,
        source: "meetings" as CalendarSource,
        title: m.title,
        date,
        startTime,
        allDay: false,
        color: COLORS.meetings,
        metadata: {
          status: m.status,
          location: m.location,
          video_link: m.video_link,
          template: m.meeting_templates,
        },
      };
    });
  } catch (err) {
    console.warn("[UnifiedCalendar] meetings fetch failed:", err);
    return [];
  }
}

async function fetchEstatesDiary(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
  start: string,
  end: string,
): Promise<UnifiedCalendarEvent[]> {
  try {
    const startIso = `${start}T00:00:00`;
    const endIso = `${end}T23:59:59`;

    const { data, error } = await supabase
      .from("estates_daily_diary")
      .select("*")
      .eq("organization_id", orgId)
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((e) => {
      const date = new Date(e.created_at).toISOString().split("T")[0];
      return {
        id: `estates-${e.id}`,
        source: "estates" as CalendarSource,
        title: e.title || "Estates Entry",
        date,
        allDay: true,
        color: COLORS.estates,
        metadata: {
          tags: e.tags,
          notes: e.entry ?? e.notes,
        },
      };
    });
  } catch (err) {
    console.warn("[UnifiedCalendar] estates diary fetch failed:", err);
    return [];
  }
}

async function fetchComplianceDue(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
  start: string,
  end: string,
): Promise<UnifiedCalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from("estates_statutory_completions")
      .select("*")
      .eq("organization_id", orgId)
      .gte("next_due_date", start)
      .lte("next_due_date", end)
      .order("next_due_date", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((e) => ({
      id: `compliance-${e.id}`,
      source: "compliance" as CalendarSource,
      title: `Due: ${e.name || e.check_name || "Compliance Check"}`,
      date: e.next_due_date,
      allDay: true,
      color: COLORS.compliance,
      metadata: {
        domain: e.domain,
        frequency: e.frequency,
        status: e.status,
      },
    }));
  } catch (err) {
    console.warn("[UnifiedCalendar] compliance fetch failed:", err);
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatAbsenceType(type: string): string {
  return (type ?? "absence")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── GET handler ──────────────────────────────────────────────────────

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const sp = req.nextUrl.searchParams;
  const start = sp.get("start");
  const end = sp.get("end");

  if (!start || !end) {
    return apiError("start and end query params are required (YYYY-MM-DD)", 400);
  }

  // Fetch all sources in parallel — each is isolated in try/catch
  const [schoolEvents, lessons, absences, meetings, estates, compliance] =
    await Promise.all([
      fetchSchoolEvents(supabase, orgId, start, end),
      fetchLessons(supabase, orgId, start, end),
      fetchAbsences(supabase, orgId, start, end),
      fetchMeetings(supabase, orgId, start, end),
      fetchEstatesDiary(supabase, orgId, start, end),
      fetchComplianceDue(supabase, orgId, start, end),
    ]);

  const events: UnifiedCalendarEvent[] = [
    ...schoolEvents,
    ...lessons,
    ...absences,
    ...meetings,
    ...estates,
    ...compliance,
  ].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return 1; // all-day events first
    if (b.startTime) return -1;
    return 0;
  });

  return apiSuccess({
    events,
    counts: {
      school_events: schoolEvents.length,
      lessons: lessons.length,
      absences: absences.length,
      meetings: meetings.length,
      estates: estates.length,
      compliance: compliance.length,
      total: events.length,
    },
  });
});
