/**
 * Energy & Utilities API
 *
 * GET  /api/estates/energy — meters, monthly consumption, summary (real Supabase data, demo fallback)
 * POST /api/estates/energy — insert a manual meter reading
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── CO2 factors (kgCO2 per kWh) ────────────────────────────────────
const CO2_FACTOR: Record<string, number> = {
  electricity: 0.233,
  gas: 0.184,
  water: 0,
  solar_generation: -0.233, // offset
};

const FLOOR_AREA_SQM = 3_200; // hardcoded until buildings table stores this

function decRating(kwhPerSqm: number): string {
  if (kwhPerSqm <= 25) return "A";
  if (kwhPerSqm <= 50) return "B";
  if (kwhPerSqm <= 75) return "C";
  if (kwhPerSqm <= 100) return "D";
  if (kwhPerSqm <= 125) return "E";
  if (kwhPerSqm <= 150) return "F";
  return "G";
}

// ─── Demo fallback ───────────────────────────────────────────────────

// ─── GET ─────────────────────────────────────────────────────────────

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  // 1. Fetch active meters
  const { data: meters, error: metersErr } = await supabase
    .from("energy_meters")
    .select(
      "id, meter_type, meter_reference, serial_number, location, description, is_active",
    )
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("meter_type");

  if (metersErr) throw metersErr;

  if (!meters || meters.length === 0) {
    return apiSuccess({
      demo: false,
      meters: [],
      monthly_consumption: [],
      summary: {
        total_monthly_cost: 0,
        total_monthly_kwh: 0,
        co2_tonnes: 0,
        anomaly_count: 0,
        floor_area_sqm: FLOOR_AREA_SQM,
        dec_kwh_per_sqm: 0,
        dec_rating: "N/A",
      },
    });
  }

  // 2. For each meter, get latest invoice reading
  const meterResults = await Promise.all(
    meters.map(async (m) => {
      const { data: latest } = await supabase
        .from("energy_invoice_readings")
        .select("reading_date, current_reading, kwh_consumed, subtotal")
        .eq("meter_id", m.id)
        .order("reading_date", { ascending: false })
        .limit(1)
        .single();

      // Get the most recent month's consumption from HH readings
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const { data: monthHH } = await supabase
        .from("energy_hh_readings")
        .select("kwh")
        .eq("organization_id", orgId)
        .eq("meter_id", m.id)
        .gte("reading_timestamp", oneMonthAgo.toISOString());

      const monthlyKwh = (monthHH ?? []).reduce(
        (s, r) => s + (Number(r.kwh) || 0),
        0,
      );
      // Estimate cost from invoice rates
      const avgRate = m.meter_type === "gas" ? 7.2 : 28.5; // p/kWh from invoices
      const monthlyCost = (monthlyKwh * avgRate) / 100;

      const unit =
        m.meter_type === "gas"
          ? "m\u00b3"
          : m.meter_type === "water"
            ? "m\u00b3"
            : "kWh";
      return {
        id: m.id,
        meter_type: m.meter_type,
        label: `${m.description || m.meter_type} (${m.meter_reference})`,
        location: m.location ?? "",
        latest_reading: latest ? Number(latest.current_reading) : null,
        latest_date: latest?.reading_date ?? null,
        unit,
        monthly_cost: monthlyCost || (latest ? Number(latest.subtotal) : 0),
        monthly_kwh: monthlyKwh || (latest ? Number(latest.kwh_consumed) : 0),
      };
    }),
  );

  // 3. Monthly consumption from HH readings (real granular data)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  // Build meter type lookup
  const meterTypeMap = new Map(meters.map((m) => [m.id, m.meter_type]));

  const { data: hhReadings } = await supabase
    .from("energy_hh_readings")
    .select("meter_id, reading_timestamp, kwh")
    .eq("organization_id", orgId)
    .gte("reading_timestamp", twelveMonthsAgo.toISOString())
    .order("reading_timestamp");

  const monthlyMap = new Map<string, Record<string, number>>();
  for (const r of hhReadings ?? []) {
    const key = r.reading_timestamp.slice(0, 7); // "2025-03" from ISO timestamp
    const parts = key.split("-");
    const mn = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const mKey = `${mn[parseInt(parts[1]) - 1]} ${parts[0].slice(2)}`;
    if (!monthlyMap.has(mKey)) monthlyMap.set(mKey, {});
    const bucket = monthlyMap.get(mKey)!;
    const type = meterTypeMap.get(r.meter_id) ?? "electricity";
    bucket[type] = (bucket[type] || 0) + (Number(r.kwh) || 0);
  }

  // Also get monthly gas (and any other type without HH data) from invoice readings
  const { data: invoiceReadings } = await supabase
    .from("energy_invoice_readings")
    .select("meter_id, reading_date, kwh_consumed")
    .eq("organization_id", orgId)
    .gte("reading_date", twelveMonthsAgo.toISOString().split("T")[0])
    .order("reading_date");

  // Helper to make consistent month keys from date strings (avoids timezone issues)
  const MN = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  function monthKey(dateStr: string): string {
    const parts = String(dateStr).split(/[-T]/);
    const yr = parseInt(parts[0]);
    const mo = parseInt(parts[1]) - 1;
    return `${MN[mo]} ${String(yr).slice(2)}`;
  }

  for (const r of invoiceReadings ?? []) {
    const type = meterTypeMap.get(r.meter_id) ?? "gas";
    if (type === "electricity") continue; // HH covers electricity
    const key = monthKey(r.reading_date);
    if (!monthlyMap.has(key)) monthlyMap.set(key, {});
    const bucket = monthlyMap.get(key)!;
    bucket[type] = (bucket[type] || 0) + (Number(r.kwh_consumed) || 0);
  }

  const monthlyConsumption = Array.from(monthlyMap.entries()).map(
    ([month, types]) => ({
      month,
      electricity: Math.round(types.electricity || 0),
      gas: Math.round(types.gas || 0),
    }),
  );

  // Sort chronologically by actual date
  const mnIdx: Record<string, number> = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };
  monthlyConsumption.sort((a, b) => {
    const [aM, aY] = a.month.split(" ");
    const [bM, bY] = b.month.split(" ");
    const aDate = (parseInt(aY) || 0) * 100 + (mnIdx[aM] || 0);
    const bDate = (parseInt(bY) || 0) * 100 + (mnIdx[bM] || 0);
    return aDate - bDate;
  });

  // 4. Summary
  const { data: invoicesYear } = await supabase
    .from("energy_invoices")
    .select("total_amount, energy_type")
    .eq("organization_id", orgId)
    .gte("invoice_date", twelveMonthsAgo.toISOString().split("T")[0]);

  const totalAnnualCost = (invoicesYear ?? []).reduce(
    (s, i) => s + (Number(i.total_amount) || 0),
    0,
  );

  // Annual kWh from HH data (electricity) + invoice readings (gas)
  const annualKwhByType: Record<string, number> = {};
  for (const r of hhReadings ?? []) {
    const type = meterTypeMap.get(r.meter_id) ?? "electricity";
    annualKwhByType[type] = (annualKwhByType[type] || 0) + (Number(r.kwh) || 0);
  }
  // Add gas (and other non-HH types) from invoice readings
  for (const r of invoiceReadings ?? []) {
    const type = meterTypeMap.get(r.meter_id) ?? "gas";
    if (type === "electricity") continue; // HH already covers electricity
    annualKwhByType[type] =
      (annualKwhByType[type] || 0) + (Number(r.kwh_consumed) || 0);
  }
  const totalAnnualKwh = Object.values(annualKwhByType).reduce(
    (s, v) => s + v,
    0,
  );
  const co2Tonnes = Object.entries(annualKwhByType).reduce(
    (s, [type, kwh]) => s + (kwh * (CO2_FACTOR[type] ?? 0)) / 1000,
    0,
  );

  const { count: anomalyCount } = await supabase
    .from("energy_anomalies")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .in("status", ["detected", "investigating"]);

  const annualKwhPerSqm = totalAnnualKwh / FLOOR_AREA_SQM;

  const summary = {
    total_monthly_cost: totalAnnualCost / 12,
    total_monthly_kwh: Math.round(totalAnnualKwh / 12),
    co2_tonnes: Math.round(co2Tonnes * 100) / 100,
    anomaly_count: anomalyCount ?? 0,
    floor_area_sqm: FLOOR_AREA_SQM,
    dec_kwh_per_sqm: Math.round(annualKwhPerSqm * 10) / 10,
    dec_rating: decRating(annualKwhPerSqm),
  };

  return apiSuccess({
    demo: false,
    meters: meterResults,
    monthly_consumption: monthlyConsumption,
    summary,
  });
});

// ─── POST — insert manual reading ────────────────────────────────────

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();
  const { meter_id, reading_date, reading_value } = body;

  if (!meter_id || !reading_date || reading_value == null) {
    return apiError(
      "meter_id, reading_date, and reading_value are required",
      400,
    );
  }

  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  // Verify the meter belongs to this org
  const { data: meter } = await supabase
    .from("energy_meters")
    .select("id, meter_type")
    .eq("id", meter_id)
    .eq("organization_id", orgId)
    .single();

  if (!meter) {
    return apiError("Meter not found", 404);
  }

  // Insert a manual HH reading for the given date (single point-in-time reading)
  const readingTs = new Date(reading_date + "T12:00:00Z").toISOString();

  const { data: inserted, error } = await supabase
    .from("energy_hh_readings")
    .upsert(
      {
        organization_id: orgId,
        meter_id: meter.id,
        reading_timestamp: readingTs,
        kwh: reading_value,
        source: "manual",
        is_school_day: null,
        is_holiday: null,
        day_type: null,
      },
      { onConflict: "organization_id,meter_id,reading_timestamp" },
    )
    .select()
    .single();

  if (error) {
    return apiError(`Failed to insert reading: ${error.message}`, 500);
  }

  // Also update the meter's latest reading in invoice_readings for display
  await supabase
    .from("energy_invoice_readings")
    .upsert(
      {
        organization_id: orgId,
        meter_id: meter.id,
        meter_reference: meter.meter_type,
        reading_date,
        current_reading: reading_value,
        source: "manual",
      },
      { onConflict: "organization_id,meter_id,reading_date" },
    )
    .select();

  return apiSuccess({
    message: "Reading recorded",
    reading: inserted,
  });
});
