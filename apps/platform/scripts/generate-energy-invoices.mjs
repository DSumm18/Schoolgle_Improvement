#!/usr/bin/env node
/**
 * Generate realistic energy invoice XLSX files for Aurora Primary School.
 *
 * Creates 8 quarterly invoices (4 electricity + 4 gas) in
 * test-harness/aurora-primary/energy-invoices/
 *
 * Each XLSX has a professional invoice layout with:
 *   - Supplier header (EDF Energy / British Gas)
 *   - Invoice metadata (number, date, due date, account)
 *   - Supply address and meter details (MPAN/MPRN)
 *   - Billing period with meter readings
 *   - Itemised charges (energy, standing, CCL)
 *   - VAT and total
 *   - Consumption summary
 *
 * Run: node apps/platform/scripts/generate-energy-invoices.mjs
 */

import * as XLSX from "xlsx";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(
  __dirname,
  "..",
  "test-harness",
  "aurora-primary",
  "energy-invoices",
);
mkdirSync(OUTPUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// Constants — must match seed-energy-data.mjs
// ─────────────────────────────────────────────────────────────────────────────

const AURORA = {
  name: "Aurora Primary School",
  address1: "14 Meadowbrook Lane",
  address2: "Oakham",
  address3: "Rutland",
  postcode: "LE15 6GH",
};

const ELEC = {
  supplier: "EDF Energy",
  supplierAddr1: "EDF Energy",
  supplierAddr2: "Hove Park, Hove",
  supplierAddr3: "East Sussex BN3 7AH",
  supplierPhone: "0333 200 5100",
  supplierEmail: "business@edfenergy.com",
  accountRef: "EDF-AUR-2024-001",
  contractRef: "EDF/SCH/2024/4872",
  mpan: "03-801-110-13-0000-6945-816",
  meterSerial: "E22K04872",
  meterLocation: "Main intake cupboard - ground floor corridor",
  unitRate: 28.12, // p/kWh
  standingCharge: 50.0, // p/day
  cclRate: 0.775, // p/kWh
};

const GAS = {
  supplier: "British Gas",
  supplierAddr1: "British Gas Business",
  supplierAddr2: "PO Box 4805",
  supplierAddr3: "Worthing BN11 9QW",
  supplierPhone: "0333 202 9802",
  supplierEmail: "businessenergy@britishgas.co.uk",
  accountRef: "BG-AUR-2024-001",
  contractRef: "BG/EDU/2024/9103",
  mprn: "3574829103",
  meterSerial: "G4S19837264",
  meterLocation: "External meter box - boiler room wall",
  unitRate: 7.12, // p/kWh
  standingCharge: 28.0, // p/day
  cclRate: 0.568, // p/kWh
  calorificValue: 39.5,
  correctionFactor: 1.02264,
  volumeConversion: 3.6, // kWh per m3
};

const VAT_RATE = 5.0;

// Monthly kWh targets (same as seed script)
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

// ─────────────────────────────────────────────────────────────────────────────
// Quarter definitions for 2024-25 and 2025-26
// ─────────────────────────────────────────────────────────────────────────────

const QUARTERS = [
  {
    label: "Q4_2024-25",
    displayLabel: "Q4 2024-25",
    months: [
      { y: 2025, m: 4 },
      { y: 2025, m: 5 },
      { y: 2025, m: 6 },
    ],
    periodLabel: "April - June 2025",
  },
  {
    label: "Q1_2025-26",
    displayLabel: "Q1 2025-26",
    months: [
      { y: 2025, m: 7 },
      { y: 2025, m: 8 },
      { y: 2025, m: 9 },
    ],
    periodLabel: "July - September 2025",
  },
  {
    label: "Q2_2025-26",
    displayLabel: "Q2 2025-26",
    months: [
      { y: 2025, m: 10 },
      { y: 2025, m: 11 },
      { y: 2025, m: 12 },
    ],
    periodLabel: "October - December 2025",
  },
  {
    label: "Q3_2025-26",
    displayLabel: "Q3 2025-26",
    months: [
      { y: 2026, m: 1 },
      { y: 2026, m: 2 },
      { y: 2026, m: 3 },
    ],
    periodLabel: "January - March 2026",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

function dateStr(y, m, d) {
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function isoDate(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addNoise(val, pct = 0.03) {
  return val * (1 + (Math.random() - 0.5) * 2 * pct);
}

function fmt2(n) {
  return Number(n.toFixed(2));
}

function fmtMoney(n) {
  return `£${n.toFixed(2)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HH profile for electricity consumption summary
// ─────────────────────────────────────────────────────────────────────────────

function generateHHSummary(totalKwh, quarter) {
  // Approximate distribution across time-of-use periods
  const overnight = totalKwh * 0.15; // 00:00-07:00
  const morning = totalKwh * 0.12; // 07:00-09:00
  const schoolHours = totalKwh * 0.48; // 09:00-15:30
  const afternoon = totalKwh * 0.13; // 15:30-18:00
  const evening = totalKwh * 0.12; // 18:00-00:00
  return { overnight, morning, schoolHours, afternoon, evening };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build one invoice workbook
// ─────────────────────────────────────────────────────────────────────────────

function buildInvoice(energyType, quarter, startingReading) {
  const isElec = energyType === "electricity";
  const cfg = isElec ? ELEC : GAS;
  const monthlyKwh = isElec ? ELEC_MONTHLY_KWH : GAS_MONTHLY_KWH;

  // Calculate quarter totals
  let totalKwh = 0;
  let totalDays = 0;
  const monthBreakdown = [];
  let cumulativeReading = startingReading;

  for (const { y, m } of quarter.months) {
    const days = daysInMonth(y, m);
    const kwh = Math.round(addNoise(monthlyKwh[m], 0.05));
    totalKwh += kwh;
    totalDays += days;

    const openReading = fmt2(cumulativeReading);
    let closeReading;

    if (!isElec) {
      // Gas: meter reads in m3
      const m3 = kwh / ((GAS.calorificValue / 3.6) * GAS.correctionFactor);
      closeReading = fmt2(cumulativeReading + m3);
    } else {
      closeReading = fmt2(cumulativeReading + kwh);
    }
    cumulativeReading = closeReading;

    monthBreakdown.push({
      month: new Date(y, m - 1).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
      startDate: dateStr(y, m, 1),
      endDate: dateStr(y, m, days),
      days,
      openReading,
      closeReading,
      unitsConsumed: isElec ? kwh : fmt2(closeReading - openReading),
      kwhConsumed: kwh,
    });
  }

  // Charges
  const energyCharge = fmt2((totalKwh * cfg.unitRate) / 100);
  const standingCharge = fmt2((totalDays * cfg.standingCharge) / 100);
  const cclCharge = fmt2((totalKwh * cfg.cclRate) / 100);
  const subtotal = fmt2(energyCharge + standingCharge + cclCharge);
  const vatAmount = fmt2((subtotal * VAT_RATE) / 100);
  const totalAmount = fmt2(subtotal + vatAmount);

  // Invoice number and dates
  const lastMonth = quarter.months[quarter.months.length - 1];
  const lastDay = daysInMonth(lastMonth.y, lastMonth.m);
  const invoiceDate = new Date(lastMonth.y, lastMonth.m - 1, lastDay);
  invoiceDate.setDate(invoiceDate.getDate() + 14);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 28);

  const invoiceNumBase = isElec ? "INV-EDF" : "INV-BG";
  const qIdx = QUARTERS.indexOf(quarter);
  const invoiceNum = `${invoiceNumBase}-${lastMonth.y}${String(lastMonth.m).padStart(2, "0")}-${String(1001 + qIdx)}`;

  const firstMonth = quarter.months[0];
  const periodStart = isoDate(firstMonth.y, firstMonth.m, 1);
  const periodEnd = isoDate(lastMonth.y, lastMonth.m, lastDay);

  // ── Build workbook ──
  const wb = XLSX.utils.book_new();

  // === Sheet 1: Invoice ===
  const invoiceRows = [];

  // Header
  invoiceRows.push([cfg.supplier.toUpperCase()]);
  invoiceRows.push([
    isElec ? "ELECTRICITY SUPPLY INVOICE" : "GAS SUPPLY INVOICE",
  ]);
  invoiceRows.push([]);
  invoiceRows.push(["Supplier:", cfg.supplierAddr1]);
  invoiceRows.push(["", cfg.supplierAddr2]);
  invoiceRows.push(["", cfg.supplierAddr3]);
  invoiceRows.push(["Tel:", cfg.supplierPhone]);
  invoiceRows.push(["Email:", cfg.supplierEmail]);
  invoiceRows.push([]);

  // Invoice details
  invoiceRows.push(["INVOICE DETAILS"]);
  invoiceRows.push(["Invoice Number:", invoiceNum]);
  invoiceRows.push(["Invoice Date:", invoiceDate.toLocaleDateString("en-GB")]);
  invoiceRows.push(["Due Date:", dueDate.toLocaleDateString("en-GB")]);
  invoiceRows.push(["Account Reference:", cfg.accountRef]);
  invoiceRows.push(["Contract Reference:", cfg.contractRef]);
  invoiceRows.push([]);

  // Customer details
  invoiceRows.push(["CUSTOMER DETAILS"]);
  invoiceRows.push(["Customer:", AURORA.name]);
  invoiceRows.push(["Address:", AURORA.address1]);
  invoiceRows.push(["", AURORA.address2]);
  invoiceRows.push(["", AURORA.address3]);
  invoiceRows.push(["", AURORA.postcode]);
  invoiceRows.push([]);

  // Supply details
  invoiceRows.push(["SUPPLY DETAILS"]);
  invoiceRows.push([isElec ? "MPAN:" : "MPRN:", isElec ? cfg.mpan : cfg.mprn]);
  invoiceRows.push(["Meter Serial:", cfg.meterSerial]);
  invoiceRows.push(["Meter Location:", cfg.meterLocation]);
  invoiceRows.push([
    "Supply Address:",
    `${AURORA.address1}, ${AURORA.postcode}`,
  ]);
  invoiceRows.push(["Billing Period:", quarter.periodLabel]);
  invoiceRows.push(["Supply Days:", totalDays]);
  invoiceRows.push([]);

  // Meter readings table header
  invoiceRows.push(["METER READINGS"]);
  if (isElec) {
    invoiceRows.push([
      "Month",
      "Start Date",
      "End Date",
      "Days",
      "Opening Reading (kWh)",
      "Closing Reading (kWh)",
      "kWh Consumed",
    ]);
  } else {
    invoiceRows.push([
      "Month",
      "Start Date",
      "End Date",
      "Days",
      "Opening Reading (m\u00B3)",
      "Closing Reading (m\u00B3)",
      "Units (m\u00B3)",
      "kWh Consumed",
    ]);
  }

  for (const mb of monthBreakdown) {
    if (isElec) {
      invoiceRows.push([
        mb.month,
        mb.startDate,
        mb.endDate,
        mb.days,
        mb.openReading,
        mb.closeReading,
        mb.kwhConsumed,
      ]);
    } else {
      invoiceRows.push([
        mb.month,
        mb.startDate,
        mb.endDate,
        mb.days,
        mb.openReading,
        mb.closeReading,
        mb.unitsConsumed,
        mb.kwhConsumed,
      ]);
    }
  }

  // Totals row
  if (isElec) {
    invoiceRows.push([
      "TOTAL",
      "",
      "",
      totalDays,
      monthBreakdown[0].openReading,
      monthBreakdown[monthBreakdown.length - 1].closeReading,
      totalKwh,
    ]);
  } else {
    const totalM3 = monthBreakdown.reduce((s, mb) => s + mb.unitsConsumed, 0);
    invoiceRows.push([
      "TOTAL",
      "",
      "",
      totalDays,
      monthBreakdown[0].openReading,
      monthBreakdown[monthBreakdown.length - 1].closeReading,
      fmt2(totalM3),
      totalKwh,
    ]);
  }
  invoiceRows.push([]);

  // Gas conversion note
  if (!isElec) {
    invoiceRows.push(["GAS CONVERSION"]);
    invoiceRows.push([
      "Calorific Value (CV):",
      `${GAS.calorificValue} MJ/m\u00B3`,
    ]);
    invoiceRows.push(["Volume Correction Factor:", GAS.correctionFactor]);
    invoiceRows.push([
      "Formula:",
      "kWh = Volume (m\u00B3) x CV x Correction / 3.6",
    ]);
    invoiceRows.push([]);
  }

  // Charges breakdown
  invoiceRows.push(["CHARGES BREAKDOWN"]);
  invoiceRows.push(["Description", "Quantity", "Rate", "Amount"]);
  invoiceRows.push([
    `Energy Charges (${isElec ? "electricity" : "gas"})`,
    `${totalKwh} kWh`,
    `${cfg.unitRate}p/kWh`,
    energyCharge,
  ]);
  invoiceRows.push([
    "Standing Charge",
    `${totalDays} days`,
    `${cfg.standingCharge}p/day`,
    standingCharge,
  ]);
  invoiceRows.push([
    "Climate Change Levy (CCL)",
    `${totalKwh} kWh`,
    `${cfg.cclRate}p/kWh`,
    cclCharge,
  ]);
  invoiceRows.push([]);
  invoiceRows.push(["", "", "Subtotal (excl. VAT):", subtotal]);
  invoiceRows.push(["", "", `VAT @ ${VAT_RATE}%:`, vatAmount]);
  invoiceRows.push(["", "", "TOTAL AMOUNT DUE:", totalAmount]);
  invoiceRows.push([]);

  // Payment info
  invoiceRows.push(["PAYMENT INFORMATION"]);
  invoiceRows.push(["Payment Terms:", "28 days from invoice date"]);
  invoiceRows.push(["Payment Method:", "Direct Debit / BACS Transfer"]);
  if (isElec) {
    invoiceRows.push(["Sort Code:", "30-95-42"]);
    invoiceRows.push(["Account Number:", "12748593"]);
    invoiceRows.push(["Reference:", invoiceNum]);
  } else {
    invoiceRows.push(["Sort Code:", "20-00-00"]);
    invoiceRows.push(["Account Number:", "38291047"]);
    invoiceRows.push(["Reference:", invoiceNum]);
  }
  invoiceRows.push([]);

  // CO2
  const co2Factor = isElec ? 0.233 : 0.184;
  const co2Tonnes = fmt2((totalKwh * co2Factor) / 1000);
  invoiceRows.push(["ENVIRONMENTAL DATA"]);
  invoiceRows.push(["CO2 Emissions:", `${co2Tonnes} tonnes CO2e`]);
  invoiceRows.push(["Emission Factor:", `${co2Factor} kg CO2/kWh`]);
  invoiceRows.push([]);

  invoiceRows.push([
    "This invoice is produced in accordance with Ofgem regulations.",
  ]);
  invoiceRows.push([
    `${cfg.supplier} is a registered trademark. Company registered in England & Wales.`,
  ]);

  const wsInvoice = XLSX.utils.aoa_to_sheet(invoiceRows);

  // Set column widths
  wsInvoice["!cols"] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, wsInvoice, "Invoice");

  // === Sheet 2: Consumption Summary ===
  const summaryRows = [];
  summaryRows.push(["CONSUMPTION SUMMARY"]);
  summaryRows.push([]);
  summaryRows.push(["Account:", cfg.accountRef]);
  summaryRows.push([isElec ? "MPAN:" : "MPRN:", isElec ? cfg.mpan : cfg.mprn]);
  summaryRows.push(["Period:", quarter.periodLabel]);
  summaryRows.push([]);

  // Monthly breakdown
  summaryRows.push(["Monthly Breakdown"]);
  summaryRows.push([
    "Month",
    "kWh",
    "Daily Avg kWh",
    "Energy Cost",
    "Standing",
    "CCL",
    "Net Total",
  ]);

  for (const mb of monthBreakdown) {
    const mEnergy = fmt2((mb.kwhConsumed * cfg.unitRate) / 100);
    const mStanding = fmt2((mb.days * cfg.standingCharge) / 100);
    const mCCL = fmt2((mb.kwhConsumed * cfg.cclRate) / 100);
    const mNet = fmt2(mEnergy + mStanding + mCCL);
    summaryRows.push([
      mb.month,
      mb.kwhConsumed,
      fmt2(mb.kwhConsumed / mb.days),
      mEnergy,
      mStanding,
      mCCL,
      mNet,
    ]);
  }
  summaryRows.push([]);

  // YoY comparison placeholder
  summaryRows.push(["Year-on-Year Comparison"]);
  summaryRows.push([
    "Period",
    "kWh This Year",
    "kWh Previous Year",
    "Change %",
  ]);
  for (const mb of monthBreakdown) {
    const prevKwh = Math.round(mb.kwhConsumed * (0.95 + Math.random() * 0.1));
    const changePct = fmt2(((mb.kwhConsumed - prevKwh) / prevKwh) * 100);
    summaryRows.push([mb.month, mb.kwhConsumed, prevKwh, `${changePct}%`]);
  }
  summaryRows.push([]);

  if (isElec) {
    // HH data summary for electricity
    const hh = generateHHSummary(totalKwh, quarter);
    summaryRows.push(["Half-Hourly Data Summary"]);
    summaryRows.push(["Time Period", "kWh", "% of Total", "Avg kW"]);
    const hoursOvernight = 7 * totalDays;
    const hoursMorning = 2 * totalDays;
    const hoursSchool = 6.5 * totalDays;
    const hoursAfternoon = 2.5 * totalDays;
    const hoursEvening = 6 * totalDays;
    summaryRows.push([
      "00:00-07:00 (Overnight)",
      Math.round(hh.overnight),
      `${fmt2((hh.overnight / totalKwh) * 100)}%`,
      fmt2(hh.overnight / hoursOvernight),
    ]);
    summaryRows.push([
      "07:00-09:00 (Morning Ramp)",
      Math.round(hh.morning),
      `${fmt2((hh.morning / totalKwh) * 100)}%`,
      fmt2(hh.morning / hoursMorning),
    ]);
    summaryRows.push([
      "09:00-15:30 (School Hours)",
      Math.round(hh.schoolHours),
      `${fmt2((hh.schoolHours / totalKwh) * 100)}%`,
      fmt2(hh.schoolHours / hoursSchool),
    ]);
    summaryRows.push([
      "15:30-18:00 (Afternoon)",
      Math.round(hh.afternoon),
      `${fmt2((hh.afternoon / totalKwh) * 100)}%`,
      fmt2(hh.afternoon / hoursAfternoon),
    ]);
    summaryRows.push([
      "18:00-00:00 (Evening)",
      Math.round(hh.evening),
      `${fmt2((hh.evening / totalKwh) * 100)}%`,
      fmt2(hh.evening / hoursEvening),
    ]);
    summaryRows.push([
      "TOTAL",
      totalKwh,
      "100%",
      fmt2(totalKwh / (24 * totalDays)),
    ]);
    summaryRows.push([]);

    summaryRows.push(["Baseload Analysis"]);
    summaryRows.push([
      "Estimated Baseload:",
      `${fmt2(hh.overnight / hoursOvernight)} kW`,
    ]);
    summaryRows.push([
      "Annual Baseload Cost:",
      fmtMoney(((hh.overnight / hoursOvernight) * 8760 * cfg.unitRate) / 100),
    ]);
    summaryRows.push([
      "Peak Demand:",
      `${fmt2(hh.schoolHours / hoursSchool)} kW`,
    ]);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Consumption Summary");

  // === Sheet 3: Structured Data (for easy extraction) ===
  const dataRows = [];
  dataRows.push(["Field", "Value"]);
  dataRows.push(["Supplier", cfg.supplier]);
  dataRows.push(["Invoice Number", invoiceNum]);
  dataRows.push(["Invoice Date", invoiceDate.toISOString().slice(0, 10)]);
  dataRows.push(["Due Date", dueDate.toISOString().slice(0, 10)]);
  dataRows.push(["Account Reference", cfg.accountRef]);
  dataRows.push(["Contract Reference", cfg.contractRef]);
  dataRows.push(["Customer Name", AURORA.name]);
  dataRows.push(["Supply Address", `${AURORA.address1}, ${AURORA.postcode}`]);
  dataRows.push([isElec ? "MPAN" : "MPRN", isElec ? cfg.mpan : cfg.mprn]);
  dataRows.push(["Meter Serial", cfg.meterSerial]);
  dataRows.push(["Energy Type", energyType]);
  dataRows.push(["Billing Period Start", periodStart]);
  dataRows.push(["Billing Period End", periodEnd]);
  dataRows.push(["Supply Days", totalDays]);
  dataRows.push(["Opening Reading", monthBreakdown[0].openReading]);
  dataRows.push([
    "Closing Reading",
    monthBreakdown[monthBreakdown.length - 1].closeReading,
  ]);
  dataRows.push(["Total kWh", totalKwh]);
  dataRows.push(["Unit Rate (p/kWh)", cfg.unitRate]);
  dataRows.push(["Standing Charge (p/day)", cfg.standingCharge]);
  dataRows.push(["CCL Rate (p/kWh)", cfg.cclRate]);
  dataRows.push(["Energy Charge", energyCharge]);
  dataRows.push(["Standing Charge Total", standingCharge]);
  dataRows.push(["CCL Charge", cclCharge]);
  dataRows.push(["Net Amount", subtotal]);
  dataRows.push(["VAT Rate", `${VAT_RATE}%`]);
  dataRows.push(["VAT Amount", vatAmount]);
  dataRows.push(["Total Amount", totalAmount]);
  dataRows.push(["CO2 Tonnes", co2Tonnes]);

  if (!isElec) {
    dataRows.push(["Calorific Value", GAS.calorificValue]);
    dataRows.push(["Correction Factor", GAS.correctionFactor]);
  }

  // Per-month data
  dataRows.push([]);
  dataRows.push(["MONTHLY BREAKDOWN"]);
  dataRows.push(["Month", "Days", "kWh", "Opening Reading", "Closing Reading"]);
  for (const mb of monthBreakdown) {
    dataRows.push([
      mb.month,
      mb.days,
      mb.kwhConsumed,
      mb.openReading,
      mb.closeReading,
    ]);
  }

  const wsData = XLSX.utils.aoa_to_sheet(dataRows);
  wsData["!cols"] = [
    { wch: 25 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsData, "Extracted Data");

  return {
    workbook: wb,
    invoiceNum,
    totalKwh,
    totalAmount,
    endReading: cumulativeReading,
    periodStart,
    periodEnd,
    invoiceDate: invoiceDate.toISOString().slice(0, 10),
    dueDate: dueDate.toISOString().slice(0, 10),
    energyCharge,
    standingCharge,
    cclCharge,
    subtotal,
    vatAmount,
    monthBreakdown,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log(
    "================================================================",
  );
  console.log("  ENERGY INVOICE GENERATOR - Aurora Primary School");
  console.log("  8 quarterly invoices (4 electricity + 4 gas)");
  console.log(
    "================================================================\n",
  );

  // Starting meter readings (cumulative, must chain across quarters)
  // Electricity starts at ~45230 kWh (same as seed script)
  // Gas starts at ~18420 m3

  // We need to calculate the cumulative readings up to Q4 2024-25 start (Apr 2025)
  // The seed script runs from Apr 2024. We need readings from Apr 2025 onward for our 4 quarters.
  // Actually we produce Q4_2024-25 first (Apr-Jun 2025), so calculate starting reading at Apr 2025.

  // Electricity: Apr 2024 start = 45230, accumulate 12 months Apr 2024 - Mar 2025
  let elecStartReading = 45230.0;
  for (let m = 4; m <= 12; m++) {
    elecStartReading += Math.round(addNoise(ELEC_MONTHLY_KWH[m], 0.05));
  }
  for (let m = 1; m <= 3; m++) {
    elecStartReading += Math.round(addNoise(ELEC_MONTHLY_KWH[m], 0.05));
  }

  // Gas: Apr 2024 start = 18420 m3, accumulate 12 months
  let gasStartReading = 18420.0;
  for (let m = 4; m <= 12; m++) {
    const kwh = Math.round(addNoise(GAS_MONTHLY_KWH[m], 0.05));
    const m3 = kwh / ((GAS.calorificValue / 3.6) * GAS.correctionFactor);
    gasStartReading += m3;
  }
  for (let m = 1; m <= 3; m++) {
    const kwh = Math.round(addNoise(GAS_MONTHLY_KWH[m], 0.05));
    const m3 = kwh / ((GAS.calorificValue / 3.6) * GAS.correctionFactor);
    gasStartReading += m3;
  }

  gasStartReading = fmt2(gasStartReading);
  elecStartReading = fmt2(elecStartReading);

  console.log(
    `  Electricity starting reading (Apr 2025): ${elecStartReading} kWh`,
  );
  console.log(
    `  Gas starting reading (Apr 2025): ${gasStartReading} m\u00B3\n`,
  );

  const files = [];

  // Generate electricity invoices
  let elecReading = elecStartReading;
  for (const quarter of QUARTERS) {
    const result = buildInvoice("electricity", quarter, elecReading);
    const filename = `edf_electricity_invoice_${quarter.label}.xlsx`;
    const filePath = join(OUTPUT_DIR, filename);
    XLSX.writeFile(result.workbook, filePath);
    elecReading = result.endReading;
    files.push({ filename, ...result });
    console.log(`  Created: ${filename}`);
    console.log(
      `    Invoice: ${result.invoiceNum} | ${result.totalKwh} kWh | ${fmtMoney(result.totalAmount)}`,
    );
  }

  console.log();

  // Generate gas invoices
  let gasReading = gasStartReading;
  for (const quarter of QUARTERS) {
    const result = buildInvoice("gas", quarter, gasReading);
    const filename = `british_gas_invoice_${quarter.label}.xlsx`;
    const filePath = join(OUTPUT_DIR, filename);
    XLSX.writeFile(result.workbook, filePath);
    gasReading = result.endReading;
    files.push({ filename, ...result });
    console.log(`  Created: ${filename}`);
    console.log(
      `    Invoice: ${result.invoiceNum} | ${result.totalKwh} kWh | ${fmtMoney(result.totalAmount)}`,
    );
  }

  console.log();

  // Summary
  const elecFiles = files.filter((f) => f.filename.startsWith("edf"));
  const gasFiles = files.filter((f) => f.filename.startsWith("british"));
  const elecTotal = elecFiles.reduce((s, f) => s + f.totalAmount, 0);
  const gasTotal = gasFiles.reduce((s, f) => s + f.totalAmount, 0);
  const elecKwh = elecFiles.reduce((s, f) => s + f.totalKwh, 0);
  const gasKwh = gasFiles.reduce((s, f) => s + f.totalKwh, 0);

  console.log(
    "================================================================",
  );
  console.log("  SUMMARY");
  console.log(
    "================================================================",
  );
  console.log(`  Output:          ${OUTPUT_DIR}`);
  console.log(`  Files:           ${files.length}`);
  console.log();
  console.log(`  ELECTRICITY (EDF Energy)`);
  console.log(`    Invoices:      ${elecFiles.length}`);
  console.log(`    Total kWh:     ${elecKwh.toLocaleString()}`);
  console.log(`    Total cost:    ${fmtMoney(elecTotal)}`);
  console.log();
  console.log(`  GAS (British Gas)`);
  console.log(`    Invoices:      ${gasFiles.length}`);
  console.log(`    Total kWh:     ${gasKwh.toLocaleString()}`);
  console.log(`    Total cost:    ${fmtMoney(gasTotal)}`);
  console.log();
  console.log(`  COMBINED`);
  console.log(`    Total cost:    ${fmtMoney(elecTotal + gasTotal)}`);
  console.log(`    Total kWh:     ${(elecKwh + gasKwh).toLocaleString()}`);
  console.log(
    "================================================================",
  );
}

main();
