#!/usr/bin/env node
/**
 * Seed realistic energy data for Aurora Primary School.
 *
 * Creates:
 *   - 2 energy meters (electricity MPAN + gas MPRN)
 *   - 24 monthly invoices for each meter (Apr 2024 - Mar 2026)
 *   - Invoice line-item readings with meter readings, rates, charges
 *   - Monthly meter readings
 *   - ~35,000 half-hourly electricity readings (48/day x 731 days)
 *   - 6 school term date ranges (2 academic years)
 *   - 5 realistic energy anomalies
 *
 * Run: node apps/platform/scripts/seed-energy-data.mjs
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Constants
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ORG_ID = "c64ed86b-9eab-49ee-9829-0706ff371083"; // Aurora Primary

const ELEC_METER = {
  meter_type: "electricity",
  meter_reference: "03-801-110-13-0000-6945-816",
  serial_number: "E22K04872",
  location: "Main intake cupboard â€” ground floor corridor",
  description: "Main electricity supply (MPAN)",
};

const GAS_METER = {
  meter_type: "gas",
  meter_reference: "3574829103",
  serial_number: "G4S19837264",
  location: "External meter box â€” boiler room wall",
  description: "Main gas supply (MPRN)",
};

// UK energy prices (realistic 2024-2026 rates for non-domestic)
const ELEC_UNIT_RATE = 28.12; // p/kWh
const ELEC_STANDING_CHARGE = 50.0; // p/day
const ELEC_CCL_RATE = 0.775; // p/kWh (Climate Change Levy 2024/25)
const GAS_UNIT_RATE = 7.12; // p/kWh
const GAS_STANDING_CHARGE = 28.0; // p/day
const GAS_CCL_RATE = 0.568; // p/kWh
const GAS_CALORIFIC_VALUE = 39.5; // MJ/mÂ³
const GAS_CORRECTION_FACTOR = 1.02264;
const GAS_VOLUME_CORRECTION = 3.6; // kWh per mÂ³ (approx from CV)
const VAT_RATE = 5.0; // % (reduced rate for schools)

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Monthly kWh targets â€” realistic seasonal patterns for a 2FE primary
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Electricity: ~150,000 kWh/year, slight summer dip, winter bump for lighting
const ELEC_MONTHLY_KWH = {
  1: 14200,
  2: 13800,
  3: 13200,
  4: 12500,
  5: 11800,
  6: 11200,
  7: 10800,
  8: 10400,
  9: 12000,
  10: 12800,
  11: 13500,
  12: 14000,
};

// Gas: ~300,000 kWh/year, huge winter peak, minimal summer
const GAS_MONTHLY_KWH = {
  1: 48000,
  2: 42000,
  3: 32000,
  4: 18000,
  5: 8000,
  6: 1200,
  7: 800,
  8: 600,
  9: 5000,
  10: 22000,
  11: 38000,
  12: 50000,
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UK School Term Dates â€” 2 academic years
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TERM_DATES = [
  // 2023-24 (partial â€” we only need summer term for Apr-Jul 2024)
  {
    academic_year: "2023-24",
    term_name: "Summer 1",
    start: "2024-04-15",
    end: "2024-05-24",
    ht_start: null,
    ht_end: null,
  },
  {
    academic_year: "2023-24",
    term_name: "Summer 2",
    start: "2024-06-03",
    end: "2024-07-19",
    ht_start: null,
    ht_end: null,
  },
  // 2024-25
  {
    academic_year: "2024-25",
    term_name: "Autumn",
    start: "2024-09-03",
    end: "2024-12-20",
    ht_start: "2024-10-28",
    ht_end: "2024-11-01",
  },
  {
    academic_year: "2024-25",
    term_name: "Spring",
    start: "2025-01-06",
    end: "2025-04-04",
    ht_start: "2025-02-17",
    ht_end: "2025-02-21",
  },
  {
    academic_year: "2024-25",
    term_name: "Summer",
    start: "2025-04-22",
    end: "2025-07-22",
    ht_start: "2025-05-26",
    ht_end: "2025-05-30",
  },
  // 2025-26
  {
    academic_year: "2025-26",
    term_name: "Autumn",
    start: "2025-09-02",
    end: "2025-12-19",
    ht_start: "2025-10-27",
    ht_end: "2025-10-31",
  },
  {
    academic_year: "2025-26",
    term_name: "Spring",
    start: "2026-01-05",
    end: "2026-03-27",
    ht_start: "2026-02-16",
    ht_end: "2026-02-20",
  },
  {
    academic_year: "2025-26",
    term_name: "Summer",
    start: "2026-04-13",
    end: "2026-07-21",
    ht_start: "2026-05-25",
    ht_end: "2026-05-29",
  },
];

const BANK_HOLIDAYS = [
  // 2024
  "2024-04-01",
  "2024-05-06",
  "2024-05-27",
  "2024-08-26",
  "2024-12-25",
  "2024-12-26",
  // 2025
  "2025-01-01",
  "2025-04-18",
  "2025-04-21",
  "2025-05-05",
  "2025-05-26",
  "2025-08-25",
  "2025-12-25",
  "2025-12-26",
  // 2026
  "2026-01-01",
  "2026-04-03",
  "2026-04-06",
  "2026-05-04",
  "2026-05-25",
];

const INSET_DAYS = [
  // 2024-25
  "2024-09-02",
  "2024-11-04",
  "2025-01-06",
  "2025-04-22",
  "2025-07-22",
  // 2025-26
  "2025-09-01",
  "2025-11-03",
  "2026-01-05",
  "2026-04-13",
  "2026-07-21",
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function dateStr(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addNoise(value, pct = 0.05) {
  return value * (1 + (Math.random() - 0.5) * 2 * pct);
}

function isInTermTime(ds) {
  for (const t of TERM_DATES) {
    if (ds >= t.start && ds <= t.end) {
      // Check if it's half-term
      if (t.ht_start && t.ht_end && ds >= t.ht_start && ds <= t.ht_end) {
        return false; // half-term = holiday
      }
      return true;
    }
  }
  return false;
}

function classifyDay(ds) {
  const d = new Date(ds + "T12:00:00Z");
  const dow = d.getUTCDay();
  const isWeekend = dow === 0 || dow === 6;
  const isBankHol = BANK_HOLIDAYS.includes(ds);
  const isInset = INSET_DAYS.includes(ds);

  if (isBankHol)
    return { dayType: "bank_holiday", isSchoolDay: false, isHoliday: true };
  if (isInset)
    return { dayType: "weekday_holiday", isSchoolDay: false, isHoliday: false };

  const inTerm = isInTermTime(ds);

  if (isWeekend) {
    return {
      dayType: inTerm ? "weekend_term" : "weekend_holiday",
      isSchoolDay: false,
      isHoliday: !inTerm,
    };
  }

  return {
    dayType: inTerm ? "weekday_term" : "weekday_holiday",
    isSchoolDay: inTerm,
    isHoliday: !inTerm,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Half-hourly electricity profiles (48 slots per day)
// Based on real UK primary school HH data
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function electricityProfile(dayType) {
  if (dayType === "weekday_term") {
    // Baseload overnight ~3kW, ramp 7am, peak 10-15kW school hours, down by 6pm
    return [
      // 00:00-05:30 (slots 0-11): overnight baseload
      3.1, 3.0, 3.0, 3.1, 3.1, 3.1, 3.1, 3.0, 3.3, 3.3, 3.6, 4.1,
      // 06:00-11:30 (slots 12-23): ramp up to peak
      5.7, 7.5, 10.3, 13.0, 15.3, 16.5, 16.8, 16.8, 17.0, 17.6, 17.4, 17.3,
      // 12:00-17:30 (slots 24-35): afternoon decline
      16.6, 15.9, 14.9, 14.3, 13.3, 12.4, 10.8, 9.8, 8.2, 6.1, 4.6, 3.4,
      // 18:00-23:30 (slots 36-47): back to baseload
      3.1, 2.7, 2.8, 2.8, 2.9, 2.9, 2.9, 2.9, 3.0, 3.0, 3.0, 3.0,
    ];
  }

  if (dayType === "weekday_holiday" || dayType === "inset") {
    // Holiday weekday: baseload + small daytime bump (caretaker, some systems)
    return [
      2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.6, 2.8, 3.2, 3.6, 4.0,
      4.4, 4.8, 5.0, 5.1, 5.1, 5.0, 4.9, 4.8, 4.6, 4.4, 4.2, 3.9, 3.6, 3.3, 3.1,
      2.9, 2.8, 2.7, 2.6, 2.6, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5,
      2.5, 2.5, 2.5,
    ];
  }

  if (dayType === "weekend_term") {
    // Weekend: flat baseload, small Saturday morning lettings bump
    return [
      3.1, 3.0, 3.0, 3.0, 3.1, 3.1, 3.1, 3.1, 3.0, 3.0, 2.9, 2.9, 2.9, 2.8, 2.8,
      2.8, 3.3, 3.2, 3.2, 3.1, 3.1, 3.1, 3.0, 3.0, 3.0, 2.9, 2.9, 2.9, 2.9, 2.8,
      2.5, 2.5, 2.5, 2.6, 2.6, 2.7, 2.7, 2.8, 2.8, 2.9, 2.9, 3.0, 3.0, 3.0, 3.0,
      3.1, 3.1, 3.1,
    ];
  }

  // Weekend holiday / bank holiday: pure baseload
  return new Array(48).fill(2.9);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Anomalies to inject into HH data
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ANOMALIES_DEF = [
  {
    dateRange: ["2024-12-21", "2024-12-23"],
    type: "weekend_usage",
    title: "Lights and ICT left on after Christmas break",
    description:
      "Electricity usage 2.5x normal weekend levels â€” hall lights, ICT suite, and interactive whiteboards left powered on after last day of term (20 Dec). Caretaker confirmed systems were not shut down before building was locked.",
    multiplier: 2.5,
  },
  {
    dateRange: ["2025-02-15", "2025-02-16"],
    type: "weekend_usage",
    title: "High weekend electricity â€” no lettings booked",
    description:
      "Saturday and Sunday consumption 3x normal baseload. Kitchen extraction fans and corridor lights found running on Monday. No lettings or events scheduled.",
    multiplier: 3.0,
  },
  {
    dateRange: ["2025-08-04", "2025-08-08"],
    type: "holiday_heating",
    title: "Summer holiday electricity above baseload",
    description:
      "Full week of 80% above-baseload consumption during summer holidays. Investigation found server room AC unit running 24/7 and external security floodlights on continuous mode instead of PIR sensor.",
    multiplier: 1.8,
  },
  {
    dateRange: ["2025-10-28", "2025-10-31"],
    type: "holiday_heating",
    title: "October half-term â€” heating schedule not adjusted",
    description:
      "BMS heating schedule was not updated for half-term break. Heating circulation pumps and corridor lighting ran on full term-time schedule for 4 days with no occupants.",
    multiplier: 2.0,
  },
  {
    dateRange: ["2026-01-17", "2026-01-17"],
    type: "overnight_excess",
    title: "Overnight electricity spike â€” possible immersion heater fault",
    description:
      "Electricity consumption 4x normal baseload between midnight and 5am on Saturday 17 Jan. Pattern consistent with immersion heater thermostat failure or stuck relay. Returned to normal by 06:00 suggesting automatic trip/reset.",
    multiplier: 4.0,
    slotsAffected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
];

function getAnomalyMultiplier(ds, slot) {
  for (const a of ANOMALIES_DEF) {
    if (ds < a.dateRange[0] || ds > a.dateRange[1]) continue;
    if (a.slotsAffected && !a.slotsAffected.includes(slot)) continue;
    return a.multiplier;
  }
  return 1.0;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Invoice generation
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function generateInvoices(meterType, meterRef, meterId, monthlyKwh) {
  const invoices = [];
  const readings = [];
  let elecInvoiceNum = 100000;
  let gasInvoiceNum = 200000;
  let cumulativeReading = meterType === "electricity" ? 45230.0 : 18420.0;

  // Iterate month by month from Apr 2024 to Mar 2026
  const months = [];
  for (let y = 2024; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2024 && m < 4) continue;
      if (y === 2026 && m > 3) continue;
      months.push({ year: y, month: m });
    }
  }

  const supplier = meterType === "electricity" ? "EDF Energy" : "British Gas";
  const accountRef =
    meterType === "electricity" ? "EDF-AUR-2024-001" : "BG-AUR-2024-001";
  const unitRate = meterType === "electricity" ? ELEC_UNIT_RATE : GAS_UNIT_RATE;
  const standingRate =
    meterType === "electricity" ? ELEC_STANDING_CHARGE : GAS_STANDING_CHARGE;
  const cclRate = meterType === "electricity" ? ELEC_CCL_RATE : GAS_CCL_RATE;

  for (const { year, month } of months) {
    const days = daysInMonth(year, month);
    const periodStart = dateStr(year, month, 1);
    const periodEnd = dateStr(year, month, days);

    // Target kWh with small YoY variation (year 2 slightly higher â€” price inflation response)
    const baseKwh = monthlyKwh[month];
    const yearFactor = year >= 2025 && month >= 4 ? 1.02 : 1.0; // slight increase in Y2
    const kwh = Math.round(addNoise(baseKwh * yearFactor, 0.08));

    // Meter reading
    const openingReading = Math.round(cumulativeReading * 10) / 10;
    let closingReading;

    if (meterType === "gas") {
      // Gas meters read in mÂ³, convert to kWh
      const m3consumed =
        kwh / ((GAS_CALORIFIC_VALUE / 3.6) * GAS_CORRECTION_FACTOR);
      closingReading = Math.round((openingReading + m3consumed) * 10) / 10;
      cumulativeReading = closingReading;
    } else {
      closingReading = Math.round((openingReading + kwh) * 10) / 10;
      cumulativeReading = closingReading;
    }

    // Charges
    const energyCharge = Number(((kwh * unitRate) / 100).toFixed(2));
    const standingCharge = Number(((days * standingRate) / 100).toFixed(2));
    const cclCharge = Number(((kwh * cclRate) / 100).toFixed(2));
    const subtotal = Number(
      (energyCharge + standingCharge + cclCharge).toFixed(2),
    );
    const vatAmount = Number(((subtotal * VAT_RATE) / 100).toFixed(2));
    const totalAmount = Number((subtotal + vatAmount).toFixed(2));

    // Invoice date is ~14 days after period end
    const invDate = new Date(year, month - 1, days);
    invDate.setDate(invDate.getDate() + 14);
    const invoiceDate = invDate.toISOString().slice(0, 10);

    // Due date is 28 days after invoice
    const dueDate = new Date(invDate);
    dueDate.setDate(dueDate.getDate() + 28);

    const invoiceNum =
      meterType === "electricity"
        ? `EDF-${String(++elecInvoiceNum)}`
        : `BG-${String(++gasInvoiceNum)}`;

    // CO2 emissions (kg CO2/kWh: elec 0.233, gas 0.184)
    const co2Factor = meterType === "electricity" ? 0.000233 : 0.000184;
    const co2Tonnes = Number((kwh * co2Factor).toFixed(4));

    const confidence = Number((92 + Math.random() * 6).toFixed(1));

    const invoice = {
      organization_id: ORG_ID,
      supplier_name: supplier,
      invoice_number: invoiceNum,
      invoice_date: invoiceDate,
      due_date: dueDate.toISOString().slice(0, 10),
      account_reference: accountRef,
      supply_period_start: periodStart,
      supply_period_end: periodEnd,
      supply_days: days,
      contract_reference:
        meterType === "electricity" ? "EDF/SCH/2024/4872" : "BG/EDU/2024/9103",
      net_amount: subtotal,
      vat_amount: vatAmount,
      vat_rate: VAT_RATE,
      total_amount: totalAmount,
      energy_type: meterType,
      source_file_name: `${supplier.replace(/ /g, "_")}_${invoiceNum}_${periodStart.replace(/-/g, "")}.pdf`,
      extraction_model: "openai/gpt-4o-mini",
      extraction_confidence: confidence,
      extraction_status: "verified",
      raw_extraction: {
        extraction_source: "ai_scan",
        scanned_at: new Date().toISOString(),
        model: "openai/gpt-4o-mini",
        pages: 2,
        fields_extracted: 18,
        fields_confident: Math.floor((confidence / 100) * 18),
      },
    };

    const reading = {
      organization_id: ORG_ID,
      meter_id: meterId,
      meter_reference: meterRef,
      reading_date: periodEnd,
      previous_reading: openingReading,
      current_reading: closingReading,
      units_consumed:
        meterType === "gas"
          ? Math.round((closingReading - openingReading) * 10) / 10
          : kwh,
      kwh_consumed: kwh,
      energy_charge: energyCharge,
      standing_charge: standingCharge,
      ccl_charge: cclCharge,
      subtotal: subtotal,
      unit_rate_pence: unitRate,
      standing_rate_pence: standingRate,
      ccl_rate_pence: cclRate,
      daily_average_kwh: Number((kwh / days).toFixed(2)),
      co2_tonnes: co2Tonnes,
      gas_calorific_value: meterType === "gas" ? GAS_CALORIFIC_VALUE : null,
      gas_correction_factor: meterType === "gas" ? GAS_CORRECTION_FACTOR : null,
      source: "invoice",
    };

    invoices.push(invoice);
    readings.push(reading);
  }

  return { invoices, readings };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Monthly meter readings (for energy_meter_readings table)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function generateMeterReadings(invoiceReadings, meterId) {
  return invoiceReadings.map((r) => ({
    organization_id: ORG_ID,
    meter_id: meterId,
    reading_value: r.current_reading,
    reading_date: r.reading_date,
    source: "invoice",
    submitted_by: "seed-script",
    verified: true,
    notes: `From invoice. ${r.kwh_consumed} kWh consumed.`,
  }));
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Half-hourly electricity data generation
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function generateHHData(meterId, invoiceReadings) {
  const allReadings = [];

  for (const inv of invoiceReadings) {
    const startDate = new Date(inv.reading_date);
    // Period is the full month â€” use previous_reading date to get start
    // Actually we have the kwh_consumed per month, let's distribute
    const year = parseInt(inv.reading_date.slice(0, 4));
    const month = parseInt(inv.reading_date.slice(5, 7));
    const days = daysInMonth(year, month);
    const periodStart = dateStr(year, month, 1);
    const targetKwh = inv.kwh_consumed;

    // First pass: compute raw profile weights for the entire month
    const dayProfiles = [];
    let totalWeight = 0;

    for (let d = 1; d <= days; d++) {
      const ds = dateStr(year, month, d);
      const { dayType, isSchoolDay, isHoliday } = classifyDay(ds);
      const profile = electricityProfile(dayType);

      // Apply anomaly multipliers
      const adjusted = profile.map((val, slot) => {
        const mult = getAnomalyMultiplier(ds, slot);
        return val * mult;
      });

      const dayWeight = adjusted.reduce((s, v) => s + v, 0);
      totalWeight += dayWeight;

      dayProfiles.push({
        ds,
        dayType,
        isSchoolDay,
        isHoliday,
        profile: adjusted,
      });
    }

    // Scale to match invoice total
    const scale = targetKwh / totalWeight;

    for (const day of dayProfiles) {
      for (let slot = 0; slot < 48; slot++) {
        const hour = Math.floor(slot / 2);
        const min = (slot % 2) * 30;
        const ts = `${day.ds}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+00:00`;

        // Add Â±10% noise for realism
        const noise = 1 + (Math.random() - 0.5) * 0.2;
        const kwh = Math.max(
          0.001,
          Number((day.profile[slot] * scale * noise).toFixed(3)),
        );

        allReadings.push({
          organization_id: ORG_ID,
          meter_id: meterId,
          reading_timestamp: ts,
          kwh,
          day_type: day.dayType,
          is_school_day: day.isSchoolDay,
          is_holiday: day.isHoliday,
          source: "smart_meter",
        });
      }
    }
  }

  return allReadings;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Anomaly records
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function generateAnomalyRecords(elecMeterId) {
  const elecRate = ELEC_UNIT_RATE;

  return ANOMALIES_DEF.map((a) => {
    const daysCount =
      (new Date(a.dateRange[1]) - new Date(a.dateRange[0])) / 86400000 + 1;
    const normalDailyKwh = 140; // weekend/holiday baseload
    const excessKwh = Math.round(
      normalDailyKwh * daysCount * (a.multiplier - 1),
    );
    const wasteCost = Number(((excessKwh * elecRate) / 100).toFixed(2));
    const annualCost = Number(
      (wasteCost * (52 / Math.max(daysCount * 2, 1))).toFixed(2),
    );

    return {
      organization_id: ORG_ID,
      anomaly_type: a.type,
      title: a.title,
      description: a.description,
      detected_date: a.dateRange[1],
      estimated_waste_kwh: excessKwh,
      estimated_waste_cost: wasteCost,
      estimated_annual_cost: annualCost,
      meter_id: elecMeterId, // TEXT field in the existing schema
      evidence: {
        multiplier: a.multiplier,
        period: `${a.dateRange[0]} to ${a.dateRange[1]}`,
        normal_daily_kwh: normalDailyKwh,
        slots_affected: a.slotsAffected || "all",
        detection_method: "statistical_analysis",
      },
      status: a.dateRange[0] < "2025-06-01" ? "confirmed" : "detected",
    };
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function main() {
  console.log(
    "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•",
  );
  console.log("  ENERGY DATA SEEDER â€” Aurora Primary School");
  console.log("  24 months of invoices + half-hourly electricity data");
  console.log(
    "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n",
  );

  // â”€â”€ Step 0: Verify org exists â”€â”€
  console.log("Step 0: Verifying Aurora Primary organization...");
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", ORG_ID)
    .single();

  if (orgErr || !org) {
    console.error(
      "ERROR: Aurora Primary organization not found:",
      orgErr?.message,
    );
    process.exit(1);
  }
  console.log(`  Found: ${org.name} (${org.id})\n`);

  // â”€â”€ Step 1: Upsert meters â”€â”€
  console.log("Step 1: Creating/updating energy meters...");

  const { data: elecMeterData, error: elecMeterErr } = await supabase
    .from("energy_meters")
    .upsert(
      { organization_id: ORG_ID, ...ELEC_METER, is_active: true },
      { onConflict: "organization_id,meter_reference" },
    )
    .select("id")
    .single();

  if (elecMeterErr) {
    console.error("  Electricity meter error:", elecMeterErr.message);
    process.exit(1);
  }
  const elecMeterId = elecMeterData.id;
  console.log(
    `  Electricity meter: ${elecMeterId} (${ELEC_METER.meter_reference})`,
  );

  const { data: gasMeterData, error: gasMeterErr } = await supabase
    .from("energy_meters")
    .upsert(
      { organization_id: ORG_ID, ...GAS_METER, is_active: true },
      { onConflict: "organization_id,meter_reference" },
    )
    .select("id")
    .single();

  if (gasMeterErr) {
    console.error("  Gas meter error:", gasMeterErr.message);
    process.exit(1);
  }
  const gasMeterId = gasMeterData.id;
  console.log(`  Gas meter: ${gasMeterId} (${GAS_METER.meter_reference})\n`);

  // â”€â”€ Step 2: Clean existing data â”€â”€
  console.log("Step 2: Cleaning existing data for Aurora Primary...");

  const tables = [
    "energy_hh_readings",
    "energy_anomalies",
    "energy_meter_readings",
    "energy_invoice_readings",
    "energy_invoices",
    "school_term_dates",
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("organization_id", ORG_ID);
    if (error) {
      console.log(`  Warning: Could not clean ${table}: ${error.message}`);
    } else {
      console.log(`  Cleared: ${table}`);
    }
  }
  console.log();

  // â”€â”€ Step 3: Store term dates â”€â”€
  console.log("Step 3: Inserting school term dates...");

  const termRecords = TERM_DATES.map((t) => ({
    organization_id: ORG_ID,
    academic_year: t.academic_year,
    term_name: t.term_name,
    term_start: t.start,
    term_end: t.end,
  }));

  const { error: termErr } = await supabase
    .from("school_term_dates")
    .upsert(termRecords, {
      onConflict: "organization_id,academic_year,term_name",
    });

  if (termErr) {
    console.log(`  Warning: Term dates insert failed: ${termErr.message}`);
    console.log("  (Table may not exist yet â€” run the migration first)");
  } else {
    console.log(`  Inserted ${termRecords.length} term date ranges\n`);
  }

  // â”€â”€ Step 4: Generate and insert invoices â”€â”€
  console.log("Step 4: Generating monthly invoices...");

  const elecResult = generateInvoices(
    "electricity",
    ELEC_METER.meter_reference,
    elecMeterId,
    ELEC_MONTHLY_KWH,
  );
  const gasResult = generateInvoices(
    "gas",
    GAS_METER.meter_reference,
    gasMeterId,
    GAS_MONTHLY_KWH,
  );

  console.log(`  Electricity: ${elecResult.invoices.length} invoices`);
  console.log(`  Gas: ${gasResult.invoices.length} invoices`);

  // Insert invoices and get back IDs to link readings
  const allInvoices = [...elecResult.invoices, ...gasResult.invoices];
  const allReadings = [...elecResult.readings, ...gasResult.readings];

  // Insert invoices in batches
  const insertedInvoiceIds = [];
  for (let i = 0; i < allInvoices.length; i += 10) {
    const batch = allInvoices.slice(i, i + 10);
    const { data: inserted, error: invErr } = await supabase
      .from("energy_invoices")
      .insert(batch)
      .select("id, invoice_number, energy_type");

    if (invErr) {
      console.error(`  Invoice batch ${i} error:`, invErr.message);
      continue;
    }
    insertedInvoiceIds.push(...inserted);
  }
  console.log(`  Inserted ${insertedInvoiceIds.length} invoices`);

  // Link readings to invoices
  const invoiceMap = {};
  for (const inv of insertedInvoiceIds) {
    invoiceMap[`${inv.energy_type}_${inv.invoice_number}`] = inv.id;
  }

  const readingsWithInvoiceId = allReadings.map((r, idx) => {
    const inv = allInvoices[idx];
    const key = `${inv.energy_type}_${inv.invoice_number}`;
    return {
      ...r,
      invoice_id: invoiceMap[key],
    };
  });

  // Insert invoice readings
  for (let i = 0; i < readingsWithInvoiceId.length; i += 10) {
    const batch = readingsWithInvoiceId.slice(i, i + 10);
    const { error: rdErr } = await supabase
      .from("energy_invoice_readings")
      .insert(batch);
    if (rdErr) {
      console.error(`  Invoice readings batch ${i} error:`, rdErr.message);
    }
  }
  console.log(
    `  Inserted ${readingsWithInvoiceId.length} invoice line-item readings\n`,
  );

  // â”€â”€ Step 5: Monthly meter readings â”€â”€
  console.log("Step 5: Inserting monthly meter readings...");

  const elecMeterReadings = generateMeterReadings(
    elecResult.readings,
    elecMeterId,
  );
  const gasMeterReadings = generateMeterReadings(
    gasResult.readings,
    gasMeterId,
  );
  const allMeterReadings = [...elecMeterReadings, ...gasMeterReadings];

  for (let i = 0; i < allMeterReadings.length; i += 10) {
    const batch = allMeterReadings.slice(i, i + 10);
    const { error: mrErr } = await supabase
      .from("energy_meter_readings")
      .insert(batch);
    if (mrErr) {
      console.error(`  Meter readings batch ${i} error:`, mrErr.message);
    }
  }
  console.log(`  Inserted ${allMeterReadings.length} meter readings\n`);

  // â”€â”€ Step 6: Half-hourly electricity data â”€â”€
  console.log("Step 6: Generating half-hourly electricity data...");
  console.log("  This will generate ~35,000 readings across 24 months...");

  const hhData = generateHHData(elecMeterId, elecResult.readings);

  // Verify totals match invoices
  let hhTotalKwh = 0;
  for (const r of hhData) hhTotalKwh += r.kwh;
  const invoiceTotalKwh = elecResult.readings.reduce(
    (s, r) => s + r.kwh_consumed,
    0,
  );
  const diffPct = (
    ((hhTotalKwh - invoiceTotalKwh) / invoiceTotalKwh) *
    100
  ).toFixed(1);
  console.log(
    `  Generated ${hhData.length.toLocaleString()} half-hourly readings`,
  );
  console.log(`  HH total: ${Math.round(hhTotalKwh).toLocaleString()} kWh`);
  console.log(`  Invoice total: ${invoiceTotalKwh.toLocaleString()} kWh`);
  console.log(`  Difference: ${diffPct}% (noise)`);

  // Insert in batches of 1000
  let hhInserted = 0;
  const batchSize = 1000;
  for (let i = 0; i < hhData.length; i += batchSize) {
    const batch = hhData.slice(i, i + batchSize);
    const { error: hhErr } = await supabase
      .from("energy_hh_readings")
      .insert(batch);
    if (hhErr) {
      console.error(`  HH batch ${i} error:`, hhErr.message);
      console.log("  (Table may not exist yet â€” run the migration first)");
      break;
    }
    hhInserted += batch.length;
    if (hhInserted % 5000 === 0 || hhInserted === hhData.length) {
      process.stdout.write(
        `  Inserted ${hhInserted.toLocaleString()} / ${hhData.length.toLocaleString()} readings\r`,
      );
    }
  }
  console.log(`\n  Completed HH data insertion\n`);

  // â”€â”€ Step 7: Anomalies â”€â”€
  console.log("Step 7: Inserting energy anomaly records...");

  const anomalyRecords = generateAnomalyRecords(elecMeterId);
  const { error: anomErr } = await supabase
    .from("energy_anomalies")
    .insert(anomalyRecords);

  if (anomErr) {
    console.error("  Anomaly insert error:", anomErr.message);
  } else {
    console.log(`  Inserted ${anomalyRecords.length} anomalies`);
  }
  console.log();

  // â”€â”€ Summary â”€â”€
  console.log(
    "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•",
  );
  console.log("  SUMMARY");
  console.log(
    "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•",
  );

  const elecTotalKwh = elecResult.readings.reduce(
    (s, r) => s + r.kwh_consumed,
    0,
  );
  const gasTotalKwh = gasResult.readings.reduce(
    (s, r) => s + r.kwh_consumed,
    0,
  );
  const elecTotalCost = elecResult.invoices.reduce(
    (s, r) => s + r.total_amount,
    0,
  );
  const gasTotalCost = gasResult.invoices.reduce(
    (s, r) => s + r.total_amount,
    0,
  );
  const totalWaste = anomalyRecords.reduce(
    (s, a) => s + a.estimated_waste_cost,
    0,
  );

  console.log(`  Organization:       ${org.name}`);
  console.log(`  Period:             April 2024 â€” March 2026 (24 months)`);
  console.log();
  console.log(`  ELECTRICITY (EDF Energy)`);
  console.log(`    Meter:            ${ELEC_METER.meter_reference}`);
  console.log(`    Invoices:         ${elecResult.invoices.length}`);
  console.log(`    Total kWh:        ${elecTotalKwh.toLocaleString()}`);
  console.log(
    `    Total cost:       Â£${elecTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  );
  console.log(`    Avg monthly:      Â£${(elecTotalCost / 24).toFixed(2)}`);
  console.log(`    HH readings:      ${hhInserted.toLocaleString()}`);
  console.log();
  console.log(`  GAS (British Gas)`);
  console.log(`    Meter:            ${GAS_METER.meter_reference}`);
  console.log(`    Invoices:         ${gasResult.invoices.length}`);
  console.log(`    Total kWh:        ${gasTotalKwh.toLocaleString()}`);
  console.log(
    `    Total cost:       Â£${gasTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  );
  console.log(`    Avg monthly:      Â£${(gasTotalCost / 24).toFixed(2)}`);
  console.log();
  console.log(`  COMBINED`);
  console.log(
    `    Total cost:       Â£${(elecTotalCost + gasTotalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  );
  console.log(
    `    Total kWh:        ${(elecTotalKwh + gasTotalKwh).toLocaleString()}`,
  );
  console.log(
    `    CO2 (tonnes):     ${(elecTotalKwh * 0.000233 + gasTotalKwh * 0.000184).toFixed(1)}`,
  );
  console.log();
  console.log(`  ANOMALIES`);
  console.log(`    Records:          ${anomalyRecords.length}`);
  console.log(`    Est. waste cost:  Â£${totalWaste.toFixed(2)}`);
  console.log();
  console.log(`  TERM DATES`);
  console.log(`    Ranges:           ${termRecords.length}`);
  console.log(`    Academic years:   2023-24, 2024-25, 2025-26`);
  console.log();
  console.log(`  METER READINGS`);
  console.log(`    Monthly readings: ${allMeterReadings.length}`);
  console.log();

  // â”€â”€ Verify DB counts â”€â”€
  console.log("  DB VERIFICATION:");
  for (const table of [
    "energy_meters",
    "energy_invoices",
    "energy_invoice_readings",
    "energy_meter_readings",
    "energy_hh_readings",
    "energy_anomalies",
    "school_term_dates",
  ]) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ORG_ID);
    if (error) {
      console.log(`    ${table}: ERROR (${error.message})`);
    } else {
      console.log(`    ${table}: ${count}`);
    }
  }

  console.log(
    "\n  Done. Run the script again to refresh all data (idempotent).",
  );
  console.log(
    "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•",
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

