/**
 * Half-Hourly Energy Analysis API
 *
 * GET /api/estates/energy/hh-analysis
 *
 * Returns detailed HH analysis:
 *   - day_of_week_profile: avg kWh per HH slot grouped by day of week per meter
 *   - term_vs_holiday: avg daily kWh comparison
 *   - baseload_analysis: overnight vs daytime averages per meter
 *   - anomaly_periods: raw HH data for anomaly windows
 *
 * Query params:
 *   ?meter_id=xxx  (optional, defaults to all org meters)
 *   ?from=2025-04-01&to=2026-03-31  (date range)
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  const url = request.nextUrl;

  const meterId = url.searchParams.get("meter_id");
  const fromDate = url.searchParams.get("from") ?? "2025-04-01";
  const toDate = url.searchParams.get("to") ?? "2026-03-31";

  // Fetch meters for this org (for type lookup)
  const { data: meters } = await supabase
    .from("energy_meters")
    .select("id, meter_type, location, meter_reference")
    .eq("organization_id", orgId);

  const meterTypeMap = new Map((meters ?? []).map((m) => [m.id, m.meter_type]));
  const meterLocationMap = new Map(
    (meters ?? []).map((m) => [m.id, m.location]),
  );

  // Fetch HH readings from energy_hh_readings
  let query = supabase
    .from("energy_hh_readings")
    .select(
      "meter_id, reading_timestamp, kwh, day_type, is_school_day, is_holiday",
    )
    .eq("organization_id", orgId)
    .gte("reading_timestamp", `${fromDate}T00:00:00Z`)
    .lte("reading_timestamp", `${toDate}T23:59:59Z`)
    .order("reading_timestamp");

  if (meterId) {
    query = query.eq("meter_id", meterId);
  }

  const { data: readings, error } = await query;

  if (error) {
    return apiError(`Failed to fetch HH data: ${error.message}`, 500);
  }

  if (!readings || readings.length === 0) {
    return apiSuccess({
      message: "No half-hourly data available for this period",
      day_of_week_profile: [],
      term_vs_holiday: [],
      baseload_analysis: [],
      anomaly_periods: [],
    });
  }

  // ─── 1. Day-of-week profile ───────────────────────────────────────
  // For each meter × day-of-week, compute avg kWh per 48 HH slots
  const dowAccum: Record<
    string,
    Record<number, { totals: number[]; counts: number[] }>
  > = {};

  for (const r of readings) {
    const d = new Date(r.reading_timestamp);
    const day = d.getUTCDay(); // 0=Sun
    const slot = d.getUTCHours() * 2 + (d.getUTCMinutes() >= 30 ? 1 : 0);
    const key = r.meter_id;
    if (!dowAccum[key]) dowAccum[key] = {};
    if (!dowAccum[key][day])
      dowAccum[key][day] = {
        totals: new Array(48).fill(0),
        counts: new Array(48).fill(0),
      };
    dowAccum[key][day].totals[slot] += Number(r.kwh) || 0;
    dowAccum[key][day].counts[slot] += 1;
  }

  const dayOfWeekProfile = Object.entries(dowAccum).flatMap(([mId, days]) =>
    Object.entries(days).map(([dayIdx, { totals, counts }]) => ({
      meter_id: mId,
      meter_type: meterTypeMap.get(mId) ?? "unknown",
      meter_location: meterLocationMap.get(mId) ?? "",
      day: DAYS[Number(dayIdx)],
      day_index: Number(dayIdx),
      slots: totals.map((t, i) =>
        counts[i] > 0 ? Math.round((t / counts[i]) * 1000) / 1000 : 0,
      ),
    })),
  );

  // Sort: Mon-Sun
  dayOfWeekProfile.sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0]; // Mon=1 first, Sun=0 last
    return order.indexOf(a.day_index) - order.indexOf(b.day_index);
  });

  // ─── 2. Term vs holiday ───────────────────────────────────────────
  // Use the day_type field from our HH data (ground truth from term dates)
  const termDaily: Record<string, Record<string, number>> = {};
  const holidayDaily: Record<string, Record<string, number>> = {};

  for (const r of readings) {
    const dateStr = r.reading_timestamp.split("T")[0];
    const mId = r.meter_id;
    const kwh = Number(r.kwh) || 0;
    const dayType = r.day_type ?? "weekday_term";

    const isTerm = dayType === "weekday_term" || dayType === "weekend_term";
    const target = isTerm ? termDaily : holidayDaily;

    const key = `${mId}|${dateStr}`;
    if (!target[key]) target[key] = { meter_id: mId as any, kwh: 0 };
    target[key].kwh += kwh;
  }

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const allMeterIds = [...new Set(readings.map((r) => r.meter_id))];
  const termVsHoliday = allMeterIds.map((mId) => {
    const termDays = Object.values(termDaily)
      .filter((v: any) => v.meter_id === mId)
      .map((v) => v.kwh);
    const holDays = Object.values(holidayDaily)
      .filter((v: any) => v.meter_id === mId)
      .map((v) => v.kwh);

    return {
      meter_id: mId,
      meter_type: meterTypeMap.get(mId) ?? "unknown",
      meter_location: meterLocationMap.get(mId) ?? "",
      term_avg_daily_kwh: Math.round(avg(termDays) * 10) / 10,
      term_days: termDays.length,
      holiday_avg_daily_kwh: Math.round(avg(holDays) * 10) / 10,
      holiday_days: holDays.length,
      savings_potential_pct:
        termDays.length > 0
          ? Math.round(
              ((avg(termDays) - avg(holDays)) / Math.max(avg(termDays), 0.01)) *
                100,
            )
          : null,
    };
  });

  // ─── 3. Baseload analysis ─────────────────────────────────────────
  // Overnight: 22:00-06:00 (hours 22,23,0,1,2,3,4,5)
  // Daytime: 08:00-16:00 (hours 8-15)
  const baseloadAccum: Record<
    string,
    { overnight: number[]; daytime: number[] }
  > = {};

  for (const r of readings) {
    const d = new Date(r.reading_timestamp);
    const hour = d.getUTCHours();
    const kwh = Number(r.kwh) || 0;
    const key = r.meter_id;

    if (!baseloadAccum[key])
      baseloadAccum[key] = { overnight: [], daytime: [] };

    if (hour >= 22 || hour < 6) {
      baseloadAccum[key].overnight.push(kwh);
    } else if (hour >= 8 && hour < 16) {
      baseloadAccum[key].daytime.push(kwh);
    }
  }

  const baseloadAnalysis = Object.entries(baseloadAccum).map(
    ([mId, { overnight, daytime }]) => ({
      meter_id: mId,
      meter_type: meterTypeMap.get(mId) ?? "unknown",
      meter_location: meterLocationMap.get(mId) ?? "",
      overnight_avg_kwh: Math.round(avg(overnight) * 1000) / 1000,
      overnight_readings: overnight.length,
      daytime_avg_kwh: Math.round(avg(daytime) * 1000) / 1000,
      daytime_readings: daytime.length,
      baseload_ratio_pct:
        daytime.length > 0
          ? Math.round((avg(overnight) / Math.max(avg(daytime), 0.001)) * 100)
          : null,
    }),
  );

  // ─── 4. Anomaly periods — raw HH data around anomalies ───────────
  const { data: anomalies } = await supabase
    .from("energy_anomalies")
    .select(
      "id, anomaly_type, title, detected_date, meter_id, estimated_waste_kwh, estimated_waste_cost, evidence",
    )
    .eq("organization_id", orgId)
    .in("status", ["detected", "investigating", "confirmed"])
    .order("detected_date", { ascending: false })
    .limit(10);

  const anomalyPeriods = await Promise.all(
    (anomalies ?? []).map(async (a) => {
      // Parse period from evidence JSON if available
      const evidence = a.evidence as { period?: string } | null;
      let windowStart: string;
      let windowEnd: string;

      if (evidence?.period) {
        const parts = evidence.period.split(" to ");
        windowStart = (parts[0] ?? a.detected_date) + "T00:00:00Z";
        windowEnd = (parts[1] ?? parts[0] ?? a.detected_date) + "T23:59:59Z";
      } else {
        const aDate = new Date(a.detected_date);
        const ws = new Date(aDate);
        ws.setDate(ws.getDate() - 1);
        const we = new Date(aDate);
        we.setDate(we.getDate() + 1);
        windowStart = ws.toISOString();
        windowEnd = we.toISOString();
      }

      // Find the meter UUID from the meter_id text field
      const matchedMeter = (meters ?? []).find(
        (m) => m.id === a.meter_id || m.meter_reference === a.meter_id,
      );

      let hhQuery = supabase
        .from("energy_hh_readings")
        .select("reading_timestamp, kwh")
        .eq("organization_id", orgId)
        .gte("reading_timestamp", windowStart)
        .lte("reading_timestamp", windowEnd)
        .order("reading_timestamp");

      if (matchedMeter) hhQuery = hhQuery.eq("meter_id", matchedMeter.id);

      const { data: hhData } = await hhQuery;

      return {
        anomaly_id: a.id,
        anomaly_type: a.anomaly_type,
        title: a.title,
        detected_date: a.detected_date,
        meter_id: a.meter_id,
        waste_kwh: a.estimated_waste_kwh,
        waste_cost: a.estimated_waste_cost,
        readings: (hhData ?? []).map((r) => ({
          timestamp: r.reading_timestamp,
          kwh: Number(r.kwh) || 0,
        })),
      };
    }),
  );

  return apiSuccess({
    period: { from: fromDate, to: toDate },
    total_hh_readings: readings.length,
    meters: (meters ?? []).map((m) => ({
      id: m.id,
      type: m.meter_type,
      location: m.location,
      reference: m.meter_reference,
    })),
    day_of_week_profile: dayOfWeekProfile,
    term_vs_holiday: termVsHoliday,
    baseload_analysis: baseloadAnalysis,
    anomaly_periods: anomalyPeriods,
  });
});
