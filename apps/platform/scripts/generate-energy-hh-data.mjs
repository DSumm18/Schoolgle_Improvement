#!/usr/bin/env node
/**
 * Generate realistic half-hourly (HH) energy data for Aurora Primary School.
 * Uses the extracted invoice totals as ground truth, then distributes kWh
 * across 48 daily slots using school usage profiles.
 *
 * Profiles model:
 *  - Weekday term time: high daytime, baseload overnight
 *  - Weekday holidays: reduced daytime, same baseload
 *  - Weekends: baseload + small bump
 *  - Gas: seasonal heating curve (high winter, zero summer)
 *  - Electricity: more stable, higher in winter (lighting)
 *  - Deliberate anomalies seeded for detection demo
 *
 * Run: node apps/platform/scripts/generate-energy-hh-data.mjs
 */

import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const ORG_ID = "c64ed86b-9eab-49ee-9829-0706ff371083";

// ─── Meter IDs from DB ───
const METERS = {
  elec_main: {
    id: "3cc15406-e5ae-4791-8d9d-a588053d4981",
    type: "electricity",
  },
  gas_boiler1: {
    id: "5d28bbc7-c81a-4f90-8187-0aacad16f77a",
    type: "gas",
  },
  gas_boiler2: {
    id: "aa698476-6345-4672-8482-2a725f6d4c08",
    type: "gas",
  },
};

// ─── Invoice kWh totals by quarter (from DB) ───
// NOTE: Only electricity has HH data. Gas meters only have monthly bill readings.
// This is realistic — HH data comes from the electricity smart meter (MPAN),
// gas meters are read quarterly/monthly and billed on consumption.
const INVOICE_KWH = {
  elec_main: [
    { start: "2025-04-01", end: "2025-06-30", kwh: 15648 },
    { start: "2025-07-01", end: "2025-09-30", kwh: 11908 },
    { start: "2025-10-01", end: "2025-12-31", kwh: 17456 },
    { start: "2026-01-01", end: "2026-03-31", kwh: 16626 },
  ],
  // Gas meters — NO HH data generated, only invoice readings exist
};

// ─── UK School Term Dates 2025-26 (approximate for a Leeds primary) ───
const TERM_DATES = [
  { name: "Autumn 1", start: "2025-09-03", end: "2025-10-24" },
  { name: "Autumn 2", start: "2025-11-03", end: "2025-12-19" },
  { name: "Spring 1", start: "2026-01-06", end: "2026-02-14" },
  { name: "Spring 2", start: "2026-02-23", end: "2026-04-02" },
  // Summer term of prev year (Apr-Jul 2025)
  { name: "Summer 1 (prev)", start: "2025-04-22", end: "2025-05-23" },
  { name: "Summer 2 (prev)", start: "2025-06-02", end: "2025-07-22" },
];

const BANK_HOLIDAYS_2025_26 = [
  "2025-04-18",
  "2025-04-21", // Easter
  "2025-05-05", // Early May
  "2025-05-26", // Spring
  "2025-08-25", // Summer
  "2025-12-25",
  "2025-12-26", // Christmas
  "2026-01-01", // New Year
  "2026-04-03",
  "2026-04-06", // Easter 2026
];

// ─── Half-hourly profile shapes (48 slots = 00:00-00:30 through 23:30-24:00) ───
// Based on real HH data from a UK primary school (669 days analysed).
// Values are relative weights that get normalized to match invoice kWh totals.
//
// Real data patterns observed:
//   Weekday avg: 378 kWh/day, Weekend avg: 140 kWh/day (37%)
//   Baseload: ~3 kWh/HH overnight (flat 22:00-04:00)
//   Ramp 06:00-08:00: 5.7→7.5→10.3→13.0→15.3 (lights/pumps/heating)
//   Peak 09:00-12:00: 16.5-17.6 kWh/HH
//   Decline 13:00-16:00: 14.9→12.4→10.8→8.2
//   Evening 17:00-18:00: 4.6→3.4→3.1 (cleaners leave)
//   Weekend: flat ~2.9 all day

function electricityProfile(dayType) {
  // Real-data-derived profile weights (from analysed HH export)
  if (dayType === "weekday_term") {
    return [
      // 00:00-05:30 (slots 0-11): overnight baseload ~3.0
      3.06, 3.05, 3.05, 3.06, 3.07, 3.08, 3.09, 3.08, 3.27, 3.25, 3.56, 4.12,
      // 06:00-11:30 (slots 12-23): steep ramp up then peak
      5.74, 7.46, 10.31, 12.96, 15.27, 16.5, 16.75, 16.79, 17.01, 17.58, 17.4,
      17.27,
      // 12:00-17:30 (slots 24-35): lunch dip then school empties
      16.62, 15.94, 14.94, 14.27, 13.32, 12.42, 10.82, 9.83, 8.15, 6.05, 4.56,
      3.39,
      // 18:00-23:30 (slots 36-47): back to baseload
      3.05, 2.7, 2.75, 2.8, 2.86, 2.9, 2.93, 2.93, 2.95, 2.99, 3.01, 3.03,
    ];
  }

  if (dayType === "weekday_holiday") {
    // Holiday weekday: baseload + small caretaker bump 09:00-15:00
    // Real data: summer Mon ~135 kWh/day (~36% of term weekday)
    return [
      2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.6, 2.8, 3.2, 3.6, 4.0,
      4.4, 4.8, 5.0, 5.1, 5.1, 5.0, 4.9, 4.8, 4.6, 4.4, 4.2, 3.9, 3.6, 3.3, 3.1,
      2.9, 2.8, 2.7, 2.6, 2.55, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5,
      2.5, 2.5, 2.5, 2.5,
    ];
  }

  // Weekend (term or holiday): flat baseload ~2.9 kWh/HH
  // Real data: Sat/Sun avg ~140 kWh/day = 2.9/slot
  if (dayType === "weekend_term") {
    // Slight bump for Saturday morning lettings
    return [
      3.05, 3.03, 3.04, 3.03, 3.05, 3.07, 3.08, 3.08, 3.04, 2.99, 2.93, 2.9,
      2.9, 2.83, 2.84, 2.8, 3.32, 3.23, 3.17, 3.11, 3.07, 3.05, 3.02, 2.98,
      2.95, 2.91, 2.89, 2.87, 2.87, 2.83, 2.45, 2.48, 2.53, 2.57, 2.61, 2.66,
      2.72, 2.78, 2.84, 2.89, 2.94, 2.99, 2.98, 3.01, 3.02, 3.05, 3.07, 3.06,
    ];
  }

  // Weekend holiday / bank holiday: pure baseload
  return new Array(48).fill(2.9);
}

function gasProfile(dayType, month) {
  // Gas heating is seasonal — heating degree days approach
  // Real school pattern: BMS fires boilers at ~04:30, peak 06:00-08:00,
  // maintains temperature 08:00-15:30, cuts off 16:00, cold overnight
  const heatingMonths = {
    1: 1.0,
    2: 0.95,
    3: 0.7,
    4: 0.4,
    5: 0.15,
    6: 0,
    7: 0,
    8: 0,
    9: 0.1,
    10: 0.5,
    11: 0.8,
    12: 1.0,
  };
  const hf = heatingMonths[month] || 0;

  if (hf === 0) {
    // Summer: DHW (domestic hot water) only — kitchen/toilets
    // Tiny pilot + hot water draw 07:00-14:00
    return [
      0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
      0.08, 0.1, 0.15, 0.2, 0.25, 0.25, 0.2, 0.2, 0.18, 0.15, 0.15, 0.12, 0.12,
      0.1, 0.1, 0.08, 0.08, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
      0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
    ];
  }

  if (dayType === "weekday_term") {
    // Real pattern: boilers fire at 04:30 (slot 9), peak at 06:00-07:30,
    // steady maintain 08:00-15:00, off by 16:00, cold overnight
    return [
      // 00:00-05:30: cold overnight, BMS fires at 04:30
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.5 * hf,
      2.0 * hf,
      4.5 * hf,
      6.5 * hf,
      // 06:00-11:30: peak heating then maintain
      8.0 * hf,
      8.5 * hf,
      7.0 * hf,
      6.0 * hf,
      5.5 * hf,
      5.0 * hf,
      4.8 * hf,
      4.5 * hf,
      4.3 * hf,
      4.2 * hf,
      4.0 * hf,
      3.8 * hf,
      // 12:00-17:30: afternoon maintain then shut off
      3.5 * hf,
      3.3 * hf,
      3.0 * hf,
      2.8 * hf,
      2.5 * hf,
      2.0 * hf,
      1.5 * hf,
      1.0 * hf,
      0.5 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      // 18:00-23:30: cold overnight
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
      0.3 * hf,
    ];
  }

  if (dayType === "weekday_holiday") {
    // Frost protection only: low-level cycling
    // BMS may do brief warm-up if temp drops below 5°C
    return [
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.6 * hf,
      0.8 * hf,
      1.0 * hf,
      1.2 * hf,
      1.2 * hf,
      1.2 * hf,
      1.2 * hf,
      1.2 * hf,
      1.2 * hf,
      1.0 * hf,
      1.0 * hf,
      0.8 * hf,
      0.8 * hf,
      0.6 * hf,
      0.6 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
      0.5 * hf,
    ];
  }

  if (dayType === "weekend_term") {
    // Weekend frost protection + possible Saturday lettings warm-up
    return [
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.6 * hf,
      1.0 * hf,
      1.5 * hf,
      2.0 * hf,
      2.0 * hf,
      2.0 * hf,
      2.0 * hf,
      2.0 * hf,
      1.8 * hf,
      1.5 * hf,
      1.2 * hf,
      1.0 * hf,
      0.8 * hf,
      0.6 * hf,
      0.5 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
      0.4 * hf,
    ];
  }

  // Weekend holiday / bank holiday: frost protection only
  return new Array(48).fill(0.4 * hf);
}

// ─── Classify each day ───
function classifyDay(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0=Sun, 6=Sat
  const isWeekend = dow === 0 || dow === 6;
  const isBankHol = BANK_HOLIDAYS_2025_26.includes(dateStr);

  if (isBankHol)
    return { dayType: "bank_holiday", isSchoolDay: false, isHoliday: true };

  const isTerm = TERM_DATES.some((t) => dateStr >= t.start && dateStr <= t.end);

  if (isWeekend) {
    return {
      dayType: isTerm ? "weekend_term" : "weekend_holiday",
      isSchoolDay: false,
      isHoliday: !isTerm,
    };
  }

  return {
    dayType: isTerm ? "weekday_term" : "weekday_holiday",
    isSchoolDay: isTerm,
    isHoliday: !isTerm,
  };
}

// ─── Deliberate anomalies to seed (electricity HH data only) ───
const ANOMALIES = [
  {
    // Lights/equipment left on over Christmas weekend
    dateRange: ["2025-12-20", "2025-12-22"],
    meter: "elec_main",
    type: "equipment_left_on",
    multiplier: 2.5,
    description:
      "Electricity usage 2.5x normal weekend — lights and ICT equipment left on after term ended on Friday 19 Dec.",
  },
  {
    // Overnight spike suggesting equipment fault
    dateRange: ["2026-02-10", "2026-02-10"],
    meter: "elec_main",
    type: "overnight_baseload",
    multiplier: 4.0,
    description:
      "Overnight electricity spike 4x baseload between midnight and 5am — possible immersion heater stuck on or equipment fault.",
    slotsAffected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // 00:00-05:00
  },
  {
    // High weekend usage — someone left everything on
    dateRange: ["2026-02-08", "2026-02-09"],
    meter: "elec_main",
    type: "weekend_high",
    multiplier: 3.0,
    description:
      "Weekend electricity consumption 3x normal baseload — hall lights, ICT suite and kitchen equipment appear to have been left running. No lettings were scheduled.",
  },
  {
    // October half-term: school should be near baseload but usage stayed high
    dateRange: ["2025-10-27", "2025-10-31"],
    meter: "elec_main",
    type: "heating_holiday",
    multiplier: 2.0,
    description:
      "Electricity usage during October half-term was 2x expected baseload — heating circulation pumps and corridor lighting left on full schedule.",
  },
  {
    // Summer holiday spike — caretaker left server room AC running?
    dateRange: ["2025-08-04", "2025-08-08"],
    meter: "elec_main",
    type: "holiday_high",
    multiplier: 1.8,
    description:
      "Summer holiday electricity 80% above baseload for full week — server room AC unit running continuously, external security lights on 24hr.",
  },
];

function isAnomaly(dateStr, meterKey, slot) {
  for (const a of ANOMALIES) {
    if (a.meter !== meterKey) continue;
    if (dateStr < a.dateRange[0] || dateStr > a.dateRange[1]) continue;
    if (a.slotsAffected && !a.slotsAffected.includes(slot)) continue;
    return a.multiplier;
  }
  return 1.0;
}

// ─── Generate HH data for electricity meter, one quarter ───
function generateQuarterHH(meterKey, quarterKwh, startDate, endDate) {
  const meter = METERS[meterKey];
  const readings = [];

  // First pass: generate raw profiles to get total weight
  const days = [];
  let d = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  while (d <= end) {
    const dateStr = d.toISOString().slice(0, 10);
    const { dayType, isSchoolDay, isHoliday } = classifyDay(dateStr);

    const profile = electricityProfile(dayType);

    // Apply anomaly multipliers
    const adjustedProfile = profile.map((val, slot) => {
      const mult = isAnomaly(dateStr, meterKey, slot);
      return val * mult;
    });

    days.push({
      dateStr,
      dayType,
      isSchoolDay,
      isHoliday,
      profile: adjustedProfile,
    });
    d = new Date(d.getTime() + 86400000);
  }

  // Sum all weights
  const totalWeight = days.reduce(
    (sum, day) => sum + day.profile.reduce((s, v) => s + v, 0),
    0,
  );

  if (totalWeight === 0) {
    // Edge case: no heating in summer for gas
    // Distribute minimally
    const perSlot = quarterKwh / (days.length * 48);
    for (const day of days) {
      for (let slot = 0; slot < 48; slot++) {
        const hour = Math.floor(slot / 2);
        const min = (slot % 2) * 30;
        const ts = `${day.dateStr}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+00:00`;
        readings.push({
          organization_id: ORG_ID,
          meter_id: meter.id,
          reading_timestamp: ts,
          kwh: Math.max(0.001, perSlot + (Math.random() - 0.5) * perSlot * 0.3),
          source: "estimated",
          is_school_day: day.isSchoolDay,
          is_holiday: day.isHoliday,
          day_type: day.dayType,
        });
      }
    }
    return readings;
  }

  // Scale factor to match invoice total
  const scale = quarterKwh / totalWeight;

  for (const day of days) {
    for (let slot = 0; slot < 48; slot++) {
      const hour = Math.floor(slot / 2);
      const min = (slot % 2) * 30;
      const ts = `${day.dateStr}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+00:00`;

      // Add ±10% random noise for realism
      const noise = 1 + (Math.random() - 0.5) * 0.2;
      const kwh = Math.max(0.001, day.profile[slot] * scale * noise);

      readings.push({
        organization_id: ORG_ID,
        meter_id: meter.id,
        reading_timestamp: ts,
        kwh: Number(kwh.toFixed(3)),
        source: "estimated",
        is_school_day: day.isSchoolDay,
        is_holiday: day.isHoliday,
        day_type: day.dayType,
      });
    }
  }

  return readings;
}

// ─── Store anomaly records ───
// energy_anomalies table schema:
//   id, organization_id, anomaly_type (CHECK: weekend_usage, overnight_excess,
//   holiday_heating, spike, baseload_increase, unusual_pattern),
//   title, description, detected_date, estimated_waste_kwh, estimated_waste_cost,
//   estimated_annual_cost, meter_id (text), location_id, evidence (jsonb),
//   status (CHECK: detected, investigating, confirmed, resolved, accepted),
//   task_id, risk_id
async function storeAnomalies() {
  const elecRate = 28.5; // p/kWh
  const gasRate = 7.2; // p/kWh

  // Map our anomaly types to the CHECK constraint values
  const typeMap = {
    heating_holiday: "holiday_heating",
    equipment_left_on: "weekend_usage",
    overnight_baseload: "overnight_excess",
    weekend_high: "weekend_usage",
    holiday_high: "holiday_heating",
  };

  const records = ANOMALIES.map((a) => {
    const isGas = METERS[a.meter].type === "gas";
    const rate = isGas ? gasRate : elecRate;
    const daysCount =
      (new Date(a.dateRange[1]) - new Date(a.dateRange[0])) / 86400000 + 1;
    const normalDailyKwh = isGas ? 80 : 170;
    const excessKwh = normalDailyKwh * daysCount * (a.multiplier - 1);
    const wasteCost = Number(((excessKwh * rate) / 100).toFixed(2));
    // Annualise: assume this type of issue could recur ~X times/year
    const annualCost = Number((wasteCost * (52 / (daysCount * 2))).toFixed(2));

    const titles = {
      heating_holiday: `Electricity high during ${a.dateRange[0].includes("10") ? "October" : "summer"} half-term`,
      equipment_left_on: "Equipment left on after Christmas break",
      overnight_baseload: "Overnight electricity spike — possible fault",
      weekend_high: "High weekend electricity — no lettings scheduled",
      holiday_high: "Summer holiday electricity above baseload",
    };

    return {
      organization_id: ORG_ID,
      anomaly_type: typeMap[a.type] || "unusual_pattern",
      title: titles[a.type] || a.description.slice(0, 80),
      description: a.description,
      detected_date: a.dateRange[1],
      estimated_waste_kwh: Math.round(excessKwh),
      estimated_waste_cost: wasteCost,
      estimated_annual_cost: annualCost,
      meter_id: METERS[a.meter].id,
      evidence: {
        multiplier: a.multiplier,
        period: `${a.dateRange[0]} to ${a.dateRange[1]}`,
        normal_daily_kwh: normalDailyKwh,
      },
      status: "detected",
    };
  });

  const { error } = await supabase.from("energy_anomalies").insert(records);
  if (error) console.error("Anomaly insert error:", error.message);
  else console.log(`  Stored ${records.length} anomalies`);

  return records;
}

// ─── Store term dates ───
async function storeTermDates() {
  const records = TERM_DATES.map((t) => ({
    organization_id: ORG_ID,
    academic_year: t.name.includes("prev") ? "2024-25" : "2025-26",
    term_name: t.name.replace(" (prev)", ""),
    term_start: t.start,
    term_end: t.end,
  }));

  const { error } = await supabase
    .from("school_term_dates")
    .upsert(records, { onConflict: "organization_id,academic_year,term_name" });
  if (error) console.error("Term dates error:", error.message);
  else console.log(`  Stored ${records.length} term date ranges`);
}

async function main() {
  console.log("============================================================");
  console.log("  ENERGY HH DATA GENERATOR");
  console.log("  Generating realistic half-hourly readings from invoices");
  console.log("============================================================\n");

  // Clear existing HH data
  console.log("Clearing existing HH data...");
  await supabase
    .from("energy_hh_readings")
    .delete()
    .eq("organization_id", ORG_ID);
  await supabase
    .from("energy_anomalies")
    .delete()
    .eq("organization_id", ORG_ID);

  // Store term dates
  console.log("\nStoring term dates...");
  await storeTermDates();

  // Generate HH data for each meter and quarter
  let totalReadings = 0;
  let totalKwh = 0;

  for (const [meterKey, quarters] of Object.entries(INVOICE_KWH)) {
    const meter = METERS[meterKey];
    console.log(`\n--- ${meterKey} (${meter.type}) ---`);

    for (const q of quarters) {
      console.log(`  Quarter ${q.start} to ${q.end}: ${q.kwh} kWh`);
      const readings = generateQuarterHH(meterKey, q.kwh, q.start, q.end);

      // Verify sum matches
      const genSum = readings.reduce((s, r) => s + r.kwh, 0);
      console.log(
        `    Generated ${readings.length} readings, total ${genSum.toFixed(0)} kWh (target: ${q.kwh}, diff: ${(((genSum - q.kwh) / q.kwh) * 100).toFixed(1)}%)`,
      );

      // Insert in batches of 1000
      for (let i = 0; i < readings.length; i += 1000) {
        const batch = readings.slice(i, i + 1000);
        const { error } = await supabase
          .from("energy_hh_readings")
          .insert(batch);
        if (error) {
          console.error(`    Insert error at batch ${i}: ${error.message}`);
          break;
        }
      }

      totalReadings += readings.length;
      totalKwh += genSum;
    }
  }

  // Store anomalies
  console.log("\nStoring anomaly records...");
  const anomalies = await storeAnomalies();

  // Summary
  console.log("\n============================================================");
  console.log("  SUMMARY");
  console.log("============================================================");
  console.log(`  Total HH readings:  ${totalReadings.toLocaleString()}`);
  console.log(`  Total kWh:          ${totalKwh.toFixed(0)}`);
  console.log(`  Anomalies seeded:   ${anomalies.length}`);
  console.log(
    `  Waste cost est:     £${anomalies.reduce((s, a) => s + a.estimated_waste_cost, 0).toFixed(2)}`,
  );

  // Verify DB counts
  const { count: hhCount } = await supabase
    .from("energy_hh_readings")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);
  const { count: anomCount } = await supabase
    .from("energy_anomalies")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);

  console.log(`\n  DB Verification:`);
  console.log(`    HH readings:  ${hhCount}`);
  console.log(`    Anomalies:    ${anomCount}`);
  console.log("\nDone.");
}

main().catch(console.error);
