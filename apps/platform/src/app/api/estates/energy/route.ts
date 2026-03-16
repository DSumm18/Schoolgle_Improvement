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
const DEMO_METERS = [
  {
    id: "elec-main-01",
    meter_type: "electricity",
    label: "Main Electricity (MPAN ending 4821)",
    location: "Plant Room",
    latest_reading: 84_219,
    latest_date: "2026-03-08",
    unit: "kWh",
    monthly_cost: 2_847.5,
    monthly_kwh: 18_420,
  },
  {
    id: "gas-main-01",
    meter_type: "gas",
    label: "Main Gas (MPRN ending 3092)",
    location: "Boiler House",
    latest_reading: 41_887,
    latest_date: "2026-03-08",
    unit: "m\u00b3",
    monthly_cost: 1_623.0,
    monthly_kwh: 12_150,
  },
  {
    id: "water-main-01",
    meter_type: "water",
    label: "Water Supply Meter",
    location: "External - Gate",
    latest_reading: 6_842,
    latest_date: "2026-03-05",
    unit: "m\u00b3",
    monthly_cost: 412.8,
    monthly_kwh: 0,
  },
  {
    id: "elec-solar-01",
    meter_type: "solar_generation",
    label: "Solar PV Generation",
    location: "Roof Array (12kW)",
    latest_reading: 11_240,
    latest_date: "2026-03-08",
    unit: "kWh",
    monthly_cost: -186.0,
    monthly_kwh: 620,
  },
];
const DEMO_MONTHLY = [
  { month: "Apr 25", electricity: 14_200, gas: 8_100 },
  { month: "May 25", electricity: 13_800, gas: 5_400 },
  { month: "Jun 25", electricity: 12_900, gas: 2_100 },
  { month: "Jul 25", electricity: 8_200, gas: 800 },
  { month: "Aug 25", electricity: 7_600, gas: 600 },
  { month: "Sep 25", electricity: 13_100, gas: 3_200 },
  { month: "Oct 25", electricity: 15_600, gas: 9_800 },
  { month: "Nov 25", electricity: 17_200, gas: 13_400 },
  { month: "Dec 25", electricity: 16_800, gas: 14_900 },
  { month: "Jan 26", electricity: 18_100, gas: 15_200 },
  { month: "Feb 26", electricity: 17_800, gas: 13_800 },
  { month: "Mar 26", electricity: 18_420, gas: 12_150 },
];
const DEMO_SUMMARY = {
  total_monthly_cost: 4_697.3,
  total_monthly_kwh: 30_570,
  co2_tonnes: 6.53,
  anomaly_count: 4,
  floor_area_sqm: 3_200,
  dec_kwh_per_sqm: 114.6,
  dec_rating: "D",
};

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

  if (metersErr || !meters || meters.length === 0) {
    // Fallback to demo data
    return apiSuccess({
      demo: true,
      meters: DEMO_METERS,
      monthly_consumption: DEMO_MONTHLY,
      summary: DEMO_SUMMARY,
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
    const d = new Date(r.reading_timestamp);
    const monthNames = [
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
    const key = `${monthNames[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
    if (!monthlyMap.has(key)) monthlyMap.set(key, {});
    const bucket = monthlyMap.get(key)!;
    const type = meterTypeMap.get(r.meter_id) ?? "electricity";
    bucket[type] = (bucket[type] || 0) + (Number(r.kwh) || 0);
  }

  let monthlyConsumption = Array.from(monthlyMap.entries()).map(
    ([month, types]) => ({
      month,
      electricity: Math.round(types.electricity || 0),
      gas: Math.round(types.gas || 0),
    }),
  );

  // Sort chronologically
  const monthOrder = [
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];
  monthlyConsumption.sort((a, b) => {
    const aIdx = monthOrder.findIndex((m) => a.month.startsWith(m));
    const bIdx = monthOrder.findIndex((m) => b.month.startsWith(m));
    return aIdx - bIdx;
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

  // Annual kWh from HH data (ground truth)
  const annualKwhByType: Record<string, number> = {};
  for (const r of hhReadings ?? []) {
    const type = meterTypeMap.get(r.meter_id) ?? "electricity";
    annualKwhByType[type] = (annualKwhByType[type] || 0) + (Number(r.kwh) || 0);
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
  const {
    meter_id,
    reading_date,
    reading_value,
    previous_reading,
    cost_amount,
  } = body;

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
