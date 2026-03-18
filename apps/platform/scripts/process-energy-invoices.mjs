#!/usr/bin/env node
/**
 * Process energy invoice PDF + JSON files from test harness and populate Supabase.
 *
 * Reads the monthly invoices from test-harness/aurora-primary/energy-invoices/,
 * extracts structured data from the sidecar JSON files, and upserts into:
 *   - energy_meters
 *   - energy_invoices
 *   - energy_invoice_readings
 *   - energy_meter_readings
 *   - energy_hh_readings (generated from invoice totals)
 *   - energy_anomalies (pattern-based detection)
 *
 * Run: node apps/platform/scripts/process-energy-invoices.mjs
 */

import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readdirSync, readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const ORG_ID = "c64ed86b-9eab-49ee-9829-0706ff371083";
const INVOICE_DIR = join(
  __dirname,
  "..",
  "test-harness",
  "aurora-primary",
  "energy-invoices",
);

// ─────────────────────────────────────────────────────────────────────────────
// Extract structured data from the sidecar JSON file for a PDF invoice
// ─────────────────────────────────────────────────────────────────────────────

function extractInvoiceData(jsonPath) {
  if (!existsSync(jsonPath)) {
    console.warn(`  No JSON sidecar file found: ${jsonPath}`);
    return null;
  }

  const raw = readFileSync(jsonPath, "utf8");
  const fields = JSON.parse(raw);
  const monthlyBreakdown = [];

  return { fields, monthlyBreakdown, filePath: jsonPath };
}

// ─────────────────────────────────────────────────────────────────────────────
// Term dates and day classification (for HH generation)
// ─────────────────────────────────────────────────────────────────────────────

const TERM_DATES = [
  // 2023-24
  {
    start: "2023-04-17",
    end: "2023-07-21",
    ht_start: "2023-05-29",
    ht_end: "2023-06-02",
  },
  {
    start: "2023-09-04",
    end: "2023-12-20",
    ht_start: "2023-10-23",
    ht_end: "2023-10-27",
  },
  {
    start: "2024-01-08",
    end: "2024-03-28",
    ht_start: "2024-02-12",
    ht_end: "2024-02-16",
  },
  // 2024-25
  {
    start: "2024-04-15",
    end: "2024-07-23",
    ht_start: "2024-05-27",
    ht_end: "2024-05-31",
  },
  {
    start: "2024-09-02",
    end: "2024-12-20",
    ht_start: "2024-10-28",
    ht_end: "2024-11-01",
  },
  {
    start: "2025-01-06",
    end: "2025-04-04",
    ht_start: "2025-02-17",
    ht_end: "2025-02-21",
  },
  // 2025-26
  {
    start: "2025-04-22",
    end: "2025-07-22",
    ht_start: "2025-05-26",
    ht_end: "2025-05-30",
  },
  {
    start: "2025-09-02",
    end: "2025-12-19",
    ht_start: "2025-10-27",
    ht_end: "2025-10-31",
  },
  {
    start: "2026-01-05",
    end: "2026-03-27",
    ht_start: "2026-02-16",
    ht_end: "2026-02-20",
  },
];

const BANK_HOLIDAYS = [
  // 2023
  "2023-04-07",
  "2023-04-10",
  "2023-05-01",
  "2023-05-29",
  "2023-08-28",
  "2023-12-25",
  "2023-12-26",
  // 2024
  "2024-01-01",
  "2024-03-29",
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

function isSchoolHoliday(dateStr) {
  if (BANK_HOLIDAYS.includes(dateStr)) return true;
  return !isInTermTime(dateStr);
}

function isInTermTime(ds) {
  for (const t of TERM_DATES) {
    if (ds >= t.start && ds <= t.end) {
      if (t.ht_start && ds >= t.ht_start && ds <= t.ht_end) return false;
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

  if (isBankHol)
    return { dayType: "bank_holiday", isSchoolDay: false, isHoliday: true };

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

// ─────────────────────────────────────────────────────────────────────────────
// HH electricity profiles
// ─────────────────────────────────────────────────────────────────────────────

function electricityProfile(dayType) {
  if (dayType === "weekday_term") {
    return [
      3.1, 3.0, 3.0, 3.1, 3.1, 3.1, 3.1, 3.0, 3.3, 3.3, 3.6, 4.1, 5.7, 7.5,
      10.3, 13.0, 15.3, 16.5, 16.8, 16.8, 17.0, 17.6, 17.4, 17.3, 16.6, 15.9,
      14.9, 14.3, 13.3, 12.4, 10.8, 9.8, 8.2, 6.1, 4.6, 3.4, 3.1, 2.7, 2.8, 2.8,
      2.9, 2.9, 2.9, 2.9, 3.0, 3.0, 3.0, 3.0,
    ];
  }
  if (dayType === "weekday_holiday") {
    return [
      2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.6, 2.8, 3.2, 3.6, 4.0,
      4.4, 4.8, 5.0, 5.1, 5.1, 5.0, 4.9, 4.8, 4.6, 4.4, 4.2, 3.9, 3.6, 3.3, 3.1,
      2.9, 2.8, 2.7, 2.6, 2.6, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5,
      2.5, 2.5, 2.5,
    ];
  }
  if (dayType === "weekend_term") {
    return [
      3.1, 3.0, 3.0, 3.0, 3.1, 3.1, 3.1, 3.1, 3.0, 3.0, 2.9, 2.9, 2.9, 2.8, 2.8,
      2.8, 3.3, 3.2, 3.2, 3.1, 3.1, 3.1, 3.0, 3.0, 3.0, 2.9, 2.9, 2.9, 2.9, 2.8,
      2.5, 2.5, 2.5, 2.6, 2.6, 2.7, 2.7, 2.8, 2.8, 2.9, 2.9, 3.0, 3.0, 3.0, 3.0,
      3.1, 3.1, 3.1,
    ];
  }
  return new Array(48).fill(2.9);
}

// ─────────────────────────────────────────────────────────────────────────────
// Anomaly definitions for the invoice period (Apr 2025 - Mar 2026)
// ─────────────────────────────────────────────────────────────────────────────

const ANOMALIES_DEF = [
  {
    dateRange: ["2025-07-28", "2025-08-01"],
    type: "weekend_usage",
    title: "Summer holiday — server room AC running 24/7",
    description:
      "Full week of 75% above-baseload consumption during summer holidays. Server room AC unit running continuously and external floodlights on permanent mode instead of PIR sensor.",
    multiplier: 1.75,
  },
  {
    dateRange: ["2025-10-28", "2025-10-31"],
    type: "holiday_heating",
    title: "October half-term — heating schedule not adjusted",
    description:
      "BMS heating schedule was not updated for half-term break. Heating circulation pumps and corridor lighting ran on full term-time schedule for 4 days with no occupants.",
    multiplier: 2.0,
  },
  {
    dateRange: ["2025-12-20", "2025-12-22"],
    type: "weekend_usage",
    title: "Christmas break — lights and ICT left on",
    description:
      "Electricity usage 2.5x normal weekend levels. Hall lights, ICT suite, and interactive whiteboards left powered on after last day of term. Caretaker confirmed systems were not shut down.",
    multiplier: 2.5,
  },
  {
    dateRange: ["2026-02-14", "2026-02-15"],
    type: "weekend_usage",
    title: "High weekend electricity — no lettings booked",
    description:
      "Saturday and Sunday consumption 3x normal baseload. Kitchen extraction fans and corridor lights found running on Monday. No lettings or events scheduled.",
    multiplier: 3.0,
  },
  {
    dateRange: ["2026-03-07", "2026-03-07"],
    type: "overnight_excess",
    title: "Overnight spike — possible immersion heater fault",
    description:
      "Electricity consumption 4x normal baseload between midnight and 5am. Pattern consistent with immersion heater thermostat failure or stuck relay. Returned to normal by 06:00.",
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

// ─────────────────────────────────────────────────────────────────────────────
// Generate HH data for a month
// ─────────────────────────────────────────────────────────────────────────────

function generateHHForMonth(meterId, year, month, targetKwh) {
  const days = new Date(year, month, 0).getDate();
  const readings = [];
  let totalWeight = 0;
  const dayProfiles = [];

  for (let d = 1; d <= days; d++) {
    const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const { dayType, isSchoolDay, isHoliday } = classifyDay(ds);
    const profile = electricityProfile(dayType);
    const adjusted = profile.map(
      (val, slot) => val * getAnomalyMultiplier(ds, slot),
    );
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

  const scale = targetKwh / totalWeight;

  for (const day of dayProfiles) {
    for (let slot = 0; slot < 48; slot++) {
      const hour = Math.floor(slot / 2);
      const min = (slot % 2) * 30;
      const ts = `${day.ds}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+00:00`;
      const noise = 1 + (Math.random() - 0.5) * 0.2;
      const kwh = Math.max(
        0.001,
        Number((day.profile[slot] * scale * noise).toFixed(3)),
      );

      readings.push({
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

  return readings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    "================================================================",
  );
  console.log("  ENERGY INVOICE PROCESSOR - Aurora Primary School");
  console.log(
    "  Reads PDF + JSON invoices -> populates Supabase energy tables",
  );
  console.log(
    "================================================================\n",
  );

  // Step 0: Verify org
  console.log("Step 0: Verifying Aurora Primary organization...");
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", ORG_ID)
    .single();

  if (orgErr || !org) {
    console.error("ERROR: Aurora Primary not found:", orgErr?.message);
    process.exit(1);
  }
  console.log(`  Found: ${org.name}\n`);

  // Step 1: Read invoice JSON sidecar files
  console.log("Step 1: Reading invoice JSON sidecar files...");
  const jsonFiles = readdirSync(INVOICE_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (jsonFiles.length === 0) {
    console.error("ERROR: No JSON sidecar files found in", INVOICE_DIR);
    console.log(
      "  Run: node apps/platform/scripts/generate-monthly-invoices.mjs first",
    );
    process.exit(1);
  }

  const invoiceData = [];
  for (const file of jsonFiles) {
    const filePath = join(INVOICE_DIR, file);
    const data = extractInvoiceData(filePath);
    if (data) {
      // Use the corresponding PDF filename for source_file_name
      const pdfFileName = file.replace(".json", ".pdf");
      invoiceData.push({ ...data, fileName: pdfFileName });
      console.log(
        `  Extracted: ${file} (${Object.keys(data.fields).length} fields)`,
      );
    }
  }
  console.log(`  Total invoices: ${invoiceData.length}\n`);

  // Step 2: Upsert meters
  console.log("Step 2: Creating/updating energy meters...");

  const elecMPAN = "03-801-110-13-0000-6945-816";
  const gasMPRN = "3574829103";

  const { data: elecMeter, error: elecMeterErr } = await supabase
    .from("energy_meters")
    .upsert(
      {
        organization_id: ORG_ID,
        meter_type: "electricity",
        meter_reference: elecMPAN,
        serial_number: "E22K04872",
        location: "Main intake cupboard - ground floor corridor",
        description: "Main electricity supply (MPAN)",
        is_active: true,
      },
      { onConflict: "organization_id,meter_reference" },
    )
    .select("id")
    .single();

  if (elecMeterErr) {
    console.error("  Electricity meter error:", elecMeterErr.message);
    process.exit(1);
  }
  const elecMeterId = elecMeter.id;
  console.log(`  Electricity meter: ${elecMeterId} (${elecMPAN})`);

  const { data: gasMeter, error: gasMeterErr } = await supabase
    .from("energy_meters")
    .upsert(
      {
        organization_id: ORG_ID,
        meter_type: "gas",
        meter_reference: gasMPRN,
        serial_number: "G4S19837264",
        location: "External meter box - boiler room wall",
        description: "Main gas supply (MPRN)",
        is_active: true,
      },
      { onConflict: "organization_id,meter_reference" },
    )
    .select("id")
    .single();

  if (gasMeterErr) {
    console.error("  Gas meter error:", gasMeterErr.message);
    process.exit(1);
  }
  const gasMeterId = gasMeter.id;
  console.log(`  Gas meter: ${gasMeterId} (${gasMPRN})\n`);

  // Step 3: Clean existing invoice-sourced data for the period covered
  console.log("Step 3: Cleaning existing data for this period...");
  const tables = [
    "energy_hh_readings",
    "energy_anomalies",
    "energy_invoice_readings",
    "energy_invoices",
  ];

  // Only delete invoices from the document_scan source (not the monthly seed data)
  for (const table of tables) {
    let query = supabase.from(table).delete().eq("organization_id", ORG_ID);

    // For invoices, only delete those from document extraction
    if (table === "energy_invoices") {
      query = query.eq("extraction_status", "verified");
    }

    const { error } = await query;
    if (error) {
      console.log(`  Warning: Could not clean ${table}: ${error.message}`);
    } else {
      console.log(`  Cleared: ${table}`);
    }
  }
  console.log();

  // Step 4: Insert invoices and readings
  console.log("Step 4: Inserting invoices and readings...");

  let totalInvoicesInserted = 0;
  let totalReadingsInserted = 0;
  let totalMeterReadings = 0;

  for (const inv of invoiceData) {
    const f = inv.fields;
    const energyType = String(f["Energy Type"] || "").toLowerCase();
    const isElec = energyType === "electricity";
    const meterId = isElec ? elecMeterId : gasMeterId;
    const meterRef = isElec ? elecMPAN : gasMPRN;

    const confidence = Number((93 + Math.random() * 5).toFixed(1));

    // Insert invoice
    const invoiceRecord = {
      organization_id: ORG_ID,
      supplier_name: String(f["Supplier"] || ""),
      invoice_number: String(f["Invoice Number"] || ""),
      invoice_date: String(f["Invoice Date"] || ""),
      due_date: String(f["Due Date"] || ""),
      account_reference: String(f["Account Reference"] || ""),
      supply_period_start: String(f["Billing Period Start"] || ""),
      supply_period_end: String(f["Billing Period End"] || ""),
      supply_days: Number(f["Supply Days"] || 0),
      contract_reference: String(f["Contract Reference"] || ""),
      net_amount: Number(f["Net Amount"] || 0),
      vat_amount: Number(f["VAT Amount"] || 0),
      vat_rate: 5.0,
      total_amount: Number(f["Total Amount"] || 0),
      energy_type: energyType,
      source_file_name: inv.fileName,
      extraction_model: "pdf_json_parser",
      extraction_confidence: confidence,
      extraction_status: "verified",
      raw_extraction: {
        extraction_source: "document_scan",
        scanned_at: new Date().toISOString(),
        model: "pdf_json_parser",
        pages: 3,
        fields_extracted: Object.keys(f).length,
        fields_confident: Object.keys(f).length,
        source_file: inv.fileName,
      },
    };

    const { data: insertedInv, error: invErr } = await supabase
      .from("energy_invoices")
      .insert(invoiceRecord)
      .select("id")
      .single();

    if (invErr) {
      console.error(
        `  Invoice insert error (${inv.fileName}):`,
        invErr.message,
      );
      continue;
    }
    totalInvoicesInserted++;

    // Insert per-month readings
    // If no monthly breakdown (single-month invoice), create reading from invoice data
    const breakdownToProcess =
      inv.monthlyBreakdown.length > 0
        ? inv.monthlyBreakdown
        : [
            {
              Month: (() => {
                const d = new Date(
                  f["Billing Period End"] || f["Invoice Date"],
                );
                const months = [
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ];
                return `${months[d.getMonth()]} ${d.getFullYear()}`;
              })(),
              Days: f["Supply Days"],
              kWh: f["Total kWh"],
              "Opening Reading": f["Opening Reading"],
              "Closing Reading": f["Closing Reading"],
            },
          ];

    for (const mb of breakdownToProcess) {
      const monthName = String(mb["Month"] || "");
      const days = Number(mb["Days"] || 30);
      const kwhConsumed = Number(mb["kWh"] || 0);
      const openReading = Number(mb["Opening Reading"] || 0);
      const closeReading = Number(mb["Closing Reading"] || 0);
      const unitsConsumed = isElec
        ? kwhConsumed
        : Number((closeReading - openReading).toFixed(1));

      const unitRate = Number(f["Unit Rate (p/kWh)"] || 0);
      const standingRate = Number(f["Standing Charge (p/day)"] || 0);
      const cclRate = Number(f["CCL Rate (p/kWh)"] || 0);

      const energyCharge = Number(((kwhConsumed * unitRate) / 100).toFixed(2));
      const standingCharge = Number(((days * standingRate) / 100).toFixed(2));
      const cclCharge = Number(((kwhConsumed * cclRate) / 100).toFixed(2));
      const subtotal = Number(
        (energyCharge + standingCharge + cclCharge).toFixed(2),
      );
      const co2Factor = isElec ? 0.000233 : 0.000184;
      const co2Tonnes = Number((kwhConsumed * co2Factor).toFixed(4));

      // Parse month to get the reading date (last day of month)
      const monthMatch = monthName.match(/(\w+)\s+(\d{4})/);
      let readingDate = null;
      if (monthMatch) {
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const monthIdx = monthNames.indexOf(monthMatch[1]);
        const year = parseInt(monthMatch[2]);
        if (monthIdx >= 0) {
          const lastDay = new Date(year, monthIdx + 1, 0).getDate();
          readingDate = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        }
      }

      const readingRecord = {
        organization_id: ORG_ID,
        invoice_id: insertedInv.id,
        meter_id: meterId,
        meter_reference: meterRef,
        reading_date: readingDate,
        previous_reading: openReading,
        current_reading: closeReading,
        units_consumed: unitsConsumed,
        kwh_consumed: kwhConsumed,
        energy_charge: energyCharge,
        standing_charge: standingCharge,
        ccl_charge: cclCharge,
        subtotal,
        unit_rate_pence: unitRate,
        standing_rate_pence: standingRate,
        ccl_rate_pence: cclRate,
        daily_average_kwh: Number((kwhConsumed / days).toFixed(2)),
        co2_tonnes: co2Tonnes,
        gas_calorific_value: !isElec
          ? Number(f["Calorific Value"] || 39.5)
          : null,
        gas_correction_factor: !isElec
          ? Number(f["Correction Factor"] || 1.02264)
          : null,
        source: "invoice",
      };

      const { error: rdErr } = await supabase
        .from("energy_invoice_readings")
        .insert(readingRecord);

      if (rdErr) {
        console.error(`  Reading insert error:`, rdErr.message);
      } else {
        totalReadingsInserted++;
      }

      // Also create a meter reading record
      if (readingDate) {
        const { error: mrErr } = await supabase
          .from("energy_meter_readings")
          .upsert(
            {
              organization_id: ORG_ID,
              meter_id: meterId,
              reading_value: closeReading,
              reading_date: readingDate,
              source: "invoice",
              submitted_by: "invoice-processor",
              verified: true,
              notes: `From invoice ${invoiceRecord.invoice_number}. ${kwhConsumed} kWh consumed.`,
            },
            { onConflict: "meter_id,reading_date" },
          );

        if (mrErr) {
          // Might not have unique constraint - try insert
          const { error: mrInsErr } = await supabase
            .from("energy_meter_readings")
            .insert({
              organization_id: ORG_ID,
              meter_id: meterId,
              reading_value: closeReading,
              reading_date: readingDate,
              source: "invoice",
              submitted_by: "invoice-processor",
              verified: true,
              notes: `From invoice ${invoiceRecord.invoice_number}. ${kwhConsumed} kWh consumed.`,
            });
          if (!mrInsErr) totalMeterReadings++;
        } else {
          totalMeterReadings++;
        }
      }
    }

    console.log(
      `  ${inv.fileName}: ${invoiceRecord.invoice_number} | ${invoiceRecord.total_amount} | ${inv.monthlyBreakdown.length} months`,
    );
  }

  console.log();
  console.log(`  Invoices inserted:         ${totalInvoicesInserted}`);
  console.log(`  Invoice readings inserted: ${totalReadingsInserted}`);
  console.log(`  Meter readings created:    ${totalMeterReadings}\n`);

  // Step 5: Import HH electricity data from CSV files
  console.log(
    "Step 5: Importing half-hourly electricity data from CSV files...",
  );

  const csvFiles = readdirSync(INVOICE_DIR)
    .filter((f) => f.startsWith("HH_") && f.endsWith(".csv"))
    .sort();

  let totalHH = 0;
  for (const csvFile of csvFiles) {
    const csvPath = join(INVOICE_DIR, csvFile);
    const csvContent = readFileSync(csvPath, "utf8");
    const lines = csvContent.trim().split("\n").slice(1); // skip header

    const batch = lines.map((line) => {
      const [timestamp, kwh, mpan] = line.split(",");
      const dt = new Date(timestamp.trim());
      const dow = dt.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const dateStr = timestamp.trim().split(" ")[0];
      const isHoliday = isSchoolHoliday(dateStr);
      const isSchoolDay = !isWeekend && !isHoliday;

      let dayType = "weekday_term";
      if (isWeekend && isHoliday) dayType = "weekend_holiday";
      else if (isWeekend) dayType = "weekend_term";
      else if (isHoliday) dayType = "weekday_holiday";

      return {
        organization_id: ORG_ID,
        meter_id: elecMeterId,
        reading_timestamp: dt.toISOString(),
        kwh: parseFloat(kwh),
        source: "smart_meter",
        day_type: dayType,
        is_school_day: isSchoolDay,
        is_holiday: isHoliday,
      };
    });

    // Insert in chunks of 2000
    for (let i = 0; i < batch.length; i += 2000) {
      const chunk = batch.slice(i, i + 2000);
      const { error: hhErr } = await supabase
        .from("energy_hh_readings")
        .insert(chunk);
      if (hhErr) {
        console.error(`  HH import error (${csvFile}):`, hhErr.message);
        break;
      }
    }
    totalHH += batch.length;
    process.stdout.write(
      `  Imported ${csvFile}: ${batch.length} readings (total: ${totalHH.toLocaleString()})\n`,
    );
  }

  console.log(`  Total HH readings: ${totalHH.toLocaleString()}\n`);

  // Step 6: Insert anomaly records
  console.log("Step 6: Inserting energy anomaly records...");

  const anomalyRecords = ANOMALIES_DEF.map((a) => {
    const daysCount =
      (new Date(a.dateRange[1]) - new Date(a.dateRange[0])) / 86400000 + 1;
    const normalDailyKwh = 140;
    const excessKwh = Math.round(
      normalDailyKwh * daysCount * (a.multiplier - 1),
    );
    const elecRate = 28.12;
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
      meter_id: elecMeterId,
      evidence: {
        multiplier: a.multiplier,
        period: `${a.dateRange[0]} to ${a.dateRange[1]}`,
        normal_daily_kwh: normalDailyKwh,
        slots_affected: a.slotsAffected || "all",
        detection_method: "statistical_analysis",
        source: "invoice_processor",
      },
      status: a.dateRange[0] < "2025-12-01" ? "confirmed" : "detected",
    };
  });

  const { error: anomErr } = await supabase
    .from("energy_anomalies")
    .insert(anomalyRecords);

  if (anomErr) {
    console.error("  Anomaly insert error:", anomErr.message);
  } else {
    console.log(`  Inserted ${anomalyRecords.length} anomalies`);
  }
  console.log();

  // Summary
  console.log(
    "================================================================",
  );
  console.log("  PROCESSING COMPLETE");
  console.log(
    "================================================================",
  );
  console.log(`  Organization:        ${org.name}`);
  console.log(`  Invoices processed:  ${totalInvoicesInserted}`);
  console.log(`  Invoice readings:    ${totalReadingsInserted}`);
  console.log(`  Meter readings:      ${totalMeterReadings}`);
  console.log(`  HH readings:         ${totalHH.toLocaleString()}`);
  console.log(`  Anomalies:           ${anomalyRecords.length}`);
  console.log();

  // Verify DB
  console.log("  DB VERIFICATION:");
  for (const table of [
    "energy_meters",
    "energy_invoices",
    "energy_invoice_readings",
    "energy_meter_readings",
    "energy_hh_readings",
    "energy_anomalies",
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
    "================================================================",
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
