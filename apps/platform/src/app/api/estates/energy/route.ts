/**
 * Energy & Utilities API
 *
 * GET  /api/estates/energy - Get meters and readings (demo data for now)
 * POST /api/estates/energy - Add a new reading
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

// ─── Demo Data ───────────────────────────────────────────────────────

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

const DEMO_MONTHLY_CONSUMPTION = [
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
  dec_rating: "D" as string,
};

export const GET = protectedRoute(async () => {
  return apiSuccess({
    demo: true,
    meters: DEMO_METERS,
    monthly_consumption: DEMO_MONTHLY_CONSUMPTION,
    summary: DEMO_SUMMARY,
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { meter_id, reading_date, reading_value, cost_amount } = body;

  if (!meter_id || !reading_date || reading_value == null) {
    return apiError(
      "meter_id, reading_date, and reading_value are required",
      400,
    );
  }

  // In production this would insert into energy_readings table
  // For now return a success stub
  return apiSuccess({
    demo: true,
    message: "Reading recorded (demo mode)",
    reading: {
      id: crypto.randomUUID(),
      meter_id,
      reading_date,
      reading_value,
      cost_amount: cost_amount ?? null,
      source: "manual",
      created_at: new Date().toISOString(),
    },
  });
});
