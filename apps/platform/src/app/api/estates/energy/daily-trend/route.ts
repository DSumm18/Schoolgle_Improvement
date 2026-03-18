/**
 * Daily Energy Trend API
 *
 * GET /api/estates/energy/daily-trend?organizationId=xxx&months=13
 *
 * Returns daily electricity consumption aggregated from HH readings,
 * plus term dates and holiday periods derived from school_term_dates.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface DailyEntry {
  date: string;
  kwh: number;
  day_type: string;
  is_school_day: boolean;
}

interface TermDate {
  term_name: string;
  start: string;
  end: string;
}

interface HolidayPeriod {
  name: string;
  start: string;
  end: string;
}

interface SchoolEvent {
  name: string;
  days?: string[];
  time?: string;
  start?: string;
  end?: string;
}

// Derive holiday periods from gaps between consecutive term periods
function deriveHolidays(terms: TermDate[]): HolidayPeriod[] {
  if (terms.length < 2) return [];

  // Sort terms by start date
  const sorted = [...terms].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const holidays: HolidayPeriod[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = new Date(sorted[i].end);
    const nextStart = new Date(sorted[i + 1].start);

    // Gap must be at least 2 days to count as a holiday
    const gapDays =
      (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24);
    if (gapDays < 2) continue;

    // Holiday starts day after current term ends
    const holStart = new Date(currentEnd);
    holStart.setDate(holStart.getDate() + 1);

    // Holiday ends day before next term starts
    const holEnd = new Date(nextStart);
    holEnd.setDate(holEnd.getDate() - 1);

    // Name the holiday based on duration and time of year
    const name = inferHolidayName(holStart, gapDays);

    holidays.push({
      name,
      start: holStart.toISOString().slice(0, 10),
      end: holEnd.toISOString().slice(0, 10),
    });
  }

  return holidays;
}

function inferHolidayName(start: Date, durationDays: number): string {
  const month = start.getMonth(); // 0-indexed

  if (durationDays > 30) {
    return "Summer holidays";
  }
  if (month === 11 || month === 0) {
    return "Christmas holidays";
  }
  if (month === 3 || month === 4) {
    return "Easter holidays";
  }
  if (month === 1) {
    return "February half-term";
  }
  if (month === 4 || month === 5) {
    return "May half-term";
  }
  if (month === 9 || month === 10) {
    return "October half-term";
  }
  return "School holiday";
}

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  const url = request.nextUrl;

  const months = parseInt(url.searchParams.get("months") ?? "13", 10);

  // Calculate date range — go back `months` months from today
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  // ─── 1. Fetch daily aggregated kWh from energy_hh_readings ───────
  // Use RPC or manual aggregation: SUM(kwh) GROUP BY date
  const { data: readings, error: readingsError } = await supabase
    .from("energy_hh_readings")
    .select("reading_timestamp, kwh, day_type, is_school_day")
    .eq("organization_id", orgId)
    .gte("reading_timestamp", `${startStr}T00:00:00Z`)
    .lte("reading_timestamp", `${endStr}T23:59:59Z`)
    .order("reading_timestamp");

  if (readingsError) {
    return apiError(`Failed to fetch HH data: ${readingsError.message}`, 500);
  }

  // Aggregate per day
  const dayMap = new Map<
    string,
    { kwh: number; day_type: string; is_school_day: boolean }
  >();

  for (const r of readings ?? []) {
    const date = (r.reading_timestamp as string).slice(0, 10);
    const existing = dayMap.get(date);
    if (existing) {
      existing.kwh += r.kwh ?? 0;
    } else {
      dayMap.set(date, {
        kwh: r.kwh ?? 0,
        day_type: r.day_type ?? "unknown",
        is_school_day: r.is_school_day ?? false,
      });
    }
  }

  const daily: DailyEntry[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      kwh: Math.round(data.kwh * 100) / 100,
      day_type: data.day_type,
      is_school_day: data.is_school_day,
    }));

  // ─── 2. Fetch term dates ─────────────────────────────────────────
  const { data: termRows } = await supabase
    .from("school_term_dates")
    .select("term_name, start_date, end_date")
    .eq("organization_id", orgId)
    .gte("end_date", startStr)
    .lte("start_date", endStr)
    .order("start_date");

  const term_dates: TermDate[] = (termRows ?? []).map((t) => ({
    term_name: t.term_name,
    start: t.start_date,
    end: t.end_date,
  }));

  // ─── 3. Derive holidays from gaps between terms ──────────────────
  const holidays = deriveHolidays(term_dates);

  // ─── 4. Fetch school calendar events that affect energy ─────────
  const { data: calendarEvents } = await supabase
    .from("school_calendar_events")
    .select("*")
    .eq("organization_id", orgId)
    .eq("affects_energy", true)
    .or(`start_date.gte.${startStr},end_date.gte.${startStr}`)
    .order("start_date");

  const school_events: SchoolEvent[] = (calendarEvents ?? []).map((e: any) => ({
    name: e.title,
    days: e.recurrence_pattern?.days,
    time:
      e.start_time && e.end_time
        ? `${e.start_time.slice(0, 5)}-${e.end_time.slice(0, 5)}`
        : undefined,
    start: e.start_date,
    end: e.end_date ?? e.start_date,
  }));

  return apiSuccess({
    daily,
    term_dates,
    holidays,
    school_events,
    period: { start: startStr, end: endStr },
  });
});
