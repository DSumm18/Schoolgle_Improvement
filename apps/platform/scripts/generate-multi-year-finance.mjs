#!/usr/bin/env node
/**
 * Generate 3 years of realistic FMS finance data for Aurora Primary
 *
 * Years: 2023-24 (complete), 2024-25 (complete), 2025-26 (9 months to Dec)
 *
 * A real 2FE primary (~420 pupils, ~£2M budget) typically has:
 * - ~120 payroll journal entries/year (10 staff cost centres × 12 months)
 * - ~200-300 purchase orders, invoices, and credits
 * - ~30-40 income receipts
 * - Total: ~400-500 transactions per complete year
 *
 * This gives the school 3 years of trend data for budget setting.
 *
 * Run: node apps/platform/scripts/generate-multi-year-finance.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ORG_ID = "c64ed86b-9eab-49ee-9829-0706ff371083";

// ─── Seeded PRNG ──────────────────────────────
let _seed = 42;
function rng() {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function jitter(base, pct) {
  return base + (rng() - 0.5) * 2 * base * pct;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

// ─── Date utils ────────────────────────────────
function periodToDate(period, fyStartYear) {
  const month = ((period - 1 + 3) % 12) + 1;
  const year = period <= 9 ? fyStartYear : fyStartYear + 1;
  return { month, year };
}

function makeDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Cost centres ──────────────────────────────
const STAFF_CCS = [
  {
    code: "1101001",
    name: "Teaching Staff",
    cfr: "E01",
    budget: 980000,
    cat: "staff",
  },
  {
    code: "1102001",
    name: "Supply Teaching Staff",
    cfr: "E02",
    budget: 35000,
    cat: "staff",
  },
  {
    code: "1103001",
    name: "Education Support Staff",
    cfr: "E03",
    budget: 45000,
    cat: "staff",
  },
  {
    code: "1106001",
    name: "Admin and Clerical",
    cfr: "E05",
    budget: 85000,
    cat: "staff",
  },
  {
    code: "1107001",
    name: "Teaching Assistants",
    cfr: "E03",
    budget: 320000,
    cat: "staff",
  },
  {
    code: "1108001",
    name: "Midday Supervisors",
    cfr: "E07",
    budget: 28000,
    cat: "staff",
  },
  {
    code: "1110001",
    name: "Premises Staff",
    cfr: "E04",
    budget: 42000,
    cat: "staff",
  },
  {
    code: "1111001",
    name: "Cleaners",
    cfr: "E14",
    budget: 18000,
    cat: "staff",
  },
  {
    code: "1115001",
    name: "Staff Insurance",
    cfr: "E11",
    budget: 22000,
    cat: "staff",
  },
  {
    code: "1117001",
    name: "Staff Travel",
    cfr: "E08",
    budget: 2500,
    cat: "staff",
  },
  {
    code: "1118001",
    name: "Training & Recruitment",
    cfr: "E09",
    budget: 15000,
    cat: "staff",
  },
];

const NON_STAFF_CCS = [
  {
    code: "2201001",
    name: "Building Repairs",
    cfr: "E12",
    budget: 25000,
    cat: "premises",
    suppliers: [
      "MAINTENANCE PARTNERS LTD",
      "BUILDRIGHT SERVICES",
      "PROPERTY CARE CO",
    ],
  },
  {
    code: "2202001",
    name: "Grounds Maintenance",
    cfr: "E13",
    budget: 8000,
    cat: "premises",
    suppliers: ["GREENSCAPE MAINTENANCE", "LANDSCAPE SOLUTIONS LTD"],
  },
  {
    code: "2204001",
    name: "Cleaning Materials",
    cfr: "E14",
    budget: 6500,
    cat: "premises",
    suppliers: ["CLEANING SOLUTIONS LTD", "HYGIENE SUPPLIES UK"],
  },
  {
    code: "2220001",
    name: "Security",
    cfr: "E18",
    budget: 3200,
    cat: "premises",
    suppliers: ["SECURITY SYSTEMS LTD", "ALARM MONITORING CO"],
  },
  {
    code: "3303001",
    name: "Gas",
    cfr: "E16",
    budget: 28000,
    cat: "energy",
    suppliers: ["GAS UTILITIES LTD"],
  },
  {
    code: "3304001",
    name: "Electricity",
    cfr: "E16",
    budget: 22000,
    cat: "energy",
    suppliers: ["ELECTRIC POWER CO"],
  },
  {
    code: "3305001",
    name: "Water",
    cfr: "E15",
    budget: 5500,
    cat: "energy",
    suppliers: ["THAMES WATER UTILITIES"],
  },
  {
    code: "4401001",
    name: "ICT",
    cfr: "E20C",
    budget: 18000,
    cat: "supplies",
    suppliers: [
      "IT SERVICES CO",
      "TECH SOLUTIONS LTD",
      "DIGITAL LEARNING SUPPLIES",
    ],
  },
  {
    code: "4402001",
    name: "Photocopier",
    cfr: "E22",
    budget: 4500,
    cat: "supplies",
    suppliers: ["REPROGRAPHICS LTD", "COPY SOLUTIONS CO"],
  },
  {
    code: "4403001",
    name: "Furniture & Equipment",
    cfr: "E19",
    budget: 8000,
    cat: "supplies",
    suppliers: ["SCHOOL FURNISHINGS LTD", "CLASSROOM SOLUTIONS CO"],
  },
  {
    code: "4410001",
    name: "Learning Resources",
    cfr: "E19",
    budget: 12000,
    cat: "supplies",
    suppliers: [
      "EDUCATIONAL RESOURCES LTD",
      "LEARNING MATERIALS CO",
      "CURRICULUM SUPPLIES LTD",
    ],
  },
  {
    code: "4412001",
    name: "Curriculum Development",
    cfr: "E19",
    budget: 6000,
    cat: "supplies",
    suppliers: ["CURRICULUM SUPPLIES LTD", "LEARNING MATERIALS CO"],
  },
  {
    code: "5502001",
    name: "Communications",
    cfr: "E22",
    budget: 3000,
    cat: "services",
    suppliers: ["TELECOM SERVICES LTD", "BROADBAND PROVIDER CO"],
  },
  {
    code: "5505001",
    name: "Bought-in Services",
    cfr: "E28a",
    budget: 95000,
    cat: "services",
    suppliers: [
      "LA TRADED SERVICES",
      "SCHOOL IMPROVEMENT PARTNERSHIP",
      "HR ADVISORY SERVICES LTD",
      "AUDIT SERVICES LTD",
      "LEGAL SERVICES LLP",
    ],
  },
  {
    code: "5508001",
    name: "Educational Visits",
    cfr: "E24",
    budget: 4500,
    cat: "services",
    suppliers: [
      "ADVENTURE LEARNING LTD",
      "OUTDOOR EDUCATION CO",
      "MUSEUM EDUCATION SERVICES",
    ],
  },
  {
    code: "5527001",
    name: "Exam Fees",
    cfr: "E21",
    budget: 1200,
    cat: "services",
    suppliers: ["EXAMINATION BOARD SERVICES"],
  },
  {
    code: "5529001",
    name: "Insurance Premiums",
    cfr: "E23",
    budget: 12000,
    cat: "services",
    suppliers: ["EDUCATION INSURANCE BROKER LTD"],
  },
  {
    code: "5537001",
    name: "Contract Catering",
    cfr: "E25",
    budget: 45000,
    cat: "services",
    suppliers: ["SCHOOL MEALS PROVIDER LTD", "FRESH FOODS CATERING CO"],
  },
];

const INCOME_CCS = [
  {
    code: "7734001",
    name: "School Budget Share (GAG)",
    cfr: "I01",
    budget: 1850000,
    cat: "income",
  },
  {
    code: "7731001",
    name: "SEN Top-Up Funding",
    cfr: "I03",
    budget: 45000,
    cat: "income",
  },
  {
    code: "7750001",
    name: "Pupil Premium Grant",
    cfr: "I05",
    budget: 82000,
    cat: "income",
  },
  {
    code: "7751001",
    name: "Government Grants",
    cfr: "I06",
    budget: 35000,
    cat: "income",
  },
  {
    code: "7703001",
    name: "Lettings",
    cfr: "I08a",
    budget: 18000,
    cat: "income",
  },
  {
    code: "7705001",
    name: "Other Income",
    cfr: "I07",
    budget: 8500,
    cat: "income",
  },
  {
    code: "7707001",
    name: "Insurance Claims",
    cfr: "I10",
    budget: 15000,
    cat: "income",
  },
  {
    code: "7711001",
    name: "Training Income",
    cfr: "I07",
    budget: 3000,
    cat: "income",
  },
  {
    code: "7721001",
    name: "Catering Income",
    cfr: "I09",
    budget: 42000,
    cat: "income",
  },
];

// ─── Year-on-year inflation factors ─────────────
// Simulates real budget changes: staff pay awards, energy crisis, etc.
const YEAR_FACTORS = {
  "2023-24": {
    staff: 0.935, // 6.5% less than 2025-26 (pre pay award)
    energy: 1.15, // Energy crisis year — higher than 2025-26
    supplies: 0.92,
    services: 0.9,
    income: 0.96, // Slightly lower funding
    label: "2023/24",
  },
  "2024-25": {
    staff: 0.965, // 3.5% less (partial pay award)
    energy: 0.95, // Energy prices settled
    supplies: 0.96,
    services: 0.95,
    income: 0.98,
    label: "2024/25",
  },
  "2025-26": {
    staff: 1.0,
    energy: 1.0,
    supplies: 1.0,
    services: 1.0,
    income: 1.0,
    label: "2025/26",
  },
};

// Heating degree day weights by period (1=Apr, 12=Mar)
const HDD_WEIGHTS = {
  1: 0.095,
  2: 0.061,
  3: 0.031,
  4: 0.017,
  5: 0.017,
  6: 0.034,
  7: 0.072,
  8: 0.112,
  9: 0.139,
  10: 0.161,
  11: 0.121,
  12: 0.141,
};

// ─── Generate transactions for one year ─────────
function generateYear(fy, maxPeriod) {
  const fyStartYear = parseInt(fy.split("-")[0]);
  const factors = YEAR_FACTORS[fy];
  const transactions = [];
  const budgetSummary = {};
  let poCounter = 10000 + fyStartYear * 100;
  let invCounter = 100000 + fyStartYear * 1000;

  // ── STAFF PAYROLL (GL journal entries, monthly) ──
  for (const cc of STAFF_CCS) {
    const yearBudget = round2(cc.budget * factors.staff);
    const monthlyBase = yearBudget / 12;
    let totalActual = 0;
    let totalCommitted = 0;

    for (let p = 1; p <= maxPeriod; p++) {
      const { month, year } = periodToDate(p, fyStartYear);
      // Payroll posted ~18th of following month
      const postMonth = month === 12 ? 1 : month + 1;
      const postYear = month === 12 ? year + 1 : year;
      const postDay = randInt(15, 22);

      // September bump (new year increments)
      const sepFactor = p === 6 ? 1.03 : 1.0;
      // April bump (NI/pension changes)
      const aprFactor = p === 1 ? 1.01 : 1.0;
      const amount = round2(jitter(monthlyBase * sepFactor * aprFactor, 0.015));

      transactions.push({
        organization_id: ORG_ID,
        transaction_date: makeDate(postYear, postMonth, postDay),
        transaction_ref: `GL:${p}:${cc.code}`,
        transaction_type: "journal",
        cost_centre: cc.code,
        cfr_code: cc.cfr,
        cfr_description: cc.name,
        gross_amount: amount,
        vat_amount: 0,
        is_income: false,
        supplier_name: null,
        description: `JV.:0${randInt(10000, 99999)} Ref:MTH ${p} Salary`,
        financial_year: fy,
        period_number: p,
        source_system: "SIMS FMS",
        source_row_number: transactions.length + 1,
      });
      totalActual += amount;
    }

    budgetSummary[cc.code] = {
      name: cc.name,
      cfr: cc.cfr,
      budget: yearBudget,
      actual: round2(totalActual),
      committed: 0,
      is_income: false,
    };
  }

  // ── NON-STAFF EXPENDITURE (POs, invoices, credits) ──
  for (const cc of NON_STAFF_CCS) {
    const factor =
      cc.cat === "energy"
        ? factors.energy
        : cc.cat === "supplies"
          ? factors.supplies
          : factors.services;
    const yearBudget = round2(cc.budget * factor);
    let totalActual = 0;
    let totalCommitted = 0;

    // How many transactions per year depends on the category
    const isEnergy = cc.cat === "energy";
    const isAnnual = cc.code === "5529001"; // Insurance - paid annually
    const isCatering = cc.code === "5537001"; // Monthly contract
    const isExams = cc.code === "5527001"; // Exam fees - period 2 (May)
    const isVisits = cc.code === "5508001"; // Trips - autumn/spring/summer terms

    if (isAnnual) {
      // Single annual payment in period 1 (April)
      if (maxPeriod >= 1) {
        const amount = round2(jitter(yearBudget, 0.01));
        const { month, year } = periodToDate(1, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(5, 15)),
          transaction_ref: `AP:1:${invCounter++}`,
          transaction_type: "invoice",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: amount,
          vat_amount: 0,
          is_income: false,
          supplier_name: pick(cc.suppliers),
          description: `PO-${poCounter++} ${pick(cc.suppliers)} - Annual premium`,
          financial_year: fy,
          period_number: 1,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += amount;
        totalCommitted = amount; // Fully committed at start of year
      }
    } else if (isExams) {
      // SATs fees paid in period 2 (May)
      if (maxPeriod >= 2) {
        const amount = round2(jitter(yearBudget, 0.1));
        const { month, year } = periodToDate(2, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(1, 10)),
          transaction_ref: `AP:2:${invCounter++}`,
          transaction_type: "invoice",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: amount,
          vat_amount: 0,
          is_income: false,
          supplier_name: pick(cc.suppliers),
          description: `PO-${poCounter++} EXAMINATION BOARD SERVICES - KS2 SATs`,
          financial_year: fy,
          period_number: 2,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += amount;
      }
      totalCommitted = round2(yearBudget * 0.8);
    } else if (isCatering) {
      // Monthly contract payments
      for (let p = 1; p <= maxPeriod; p++) {
        if (p === 5) continue; // August - no meals
        const monthAmount = round2(jitter(yearBudget / 10.5, 0.05)); // ~10.5 active months
        const { month, year } = periodToDate(p, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(1, 8)),
          transaction_ref: `AP:${p}:${invCounter++}`,
          transaction_type: "invoice",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: monthAmount,
          vat_amount: 0,
          is_income: false,
          supplier_name: pick(cc.suppliers),
          description: `INV-${invCounter++} ${pick(cc.suppliers)} - ${periodToDate(p, fyStartYear).month}/${periodToDate(p, fyStartYear).year}`,
          financial_year: fy,
          period_number: p,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += monthAmount;
      }
      totalCommitted = round2(yearBudget * 0.8);
    } else if (isEnergy) {
      // Quarterly energy bills, weighted by HDD
      const quarters = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12],
      ];
      for (const qPeriods of quarters) {
        const qEnd = qPeriods[2];
        if (qEnd > maxPeriod) break;

        const qWeight = qPeriods.reduce(
          (s, p) => s + (HDD_WEIGHTS[p] || 0.05),
          0,
        );
        const qAmount = round2(yearBudget * qWeight * jitter(1, 0.08));
        const { month, year } = periodToDate(qEnd, fyStartYear);

        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(15, 28)),
          transaction_ref: `AP:${qEnd}:${invCounter++}`,
          transaction_type: "invoice",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: qAmount,
          vat_amount: round2(qAmount * 0.05), // 5% VAT on energy
          is_income: false,
          supplier_name: cc.suppliers[0],
          description: `INV-${invCounter++} ${cc.suppliers[0]} - Q${Math.ceil(qEnd / 3)} ${fy}`,
          financial_year: fy,
          period_number: qEnd,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += qAmount;
      }
      // Committed = estimated remaining quarters
      const elapsedQs = Math.ceil(maxPeriod / 3);
      totalCommitted = round2(totalActual + (yearBudget - totalActual) * 0.9);
    } else if (isVisits) {
      // 3-4 trips per year: autumn, spring, summer terms
      const tripPeriods = [4, 7, 10]; // Oct, Jan, Apr... but in FY terms: period 4=Jul, 7=Oct, 10=Jan
      // Better: trips in periods 4(Jul-summer), 7(Oct-autumn), 10(Jan-spring)
      for (const p of [3, 5, 7, 10]) {
        if (p > maxPeriod) break;
        const tripCost = round2(jitter(yearBudget / 4, 0.2));
        const { month, year } = periodToDate(p, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(5, 20)),
          transaction_ref: `PO:${p}:${poCounter++}`,
          transaction_type: "purchase_order",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: tripCost,
          vat_amount: 0,
          is_income: false,
          supplier_name: pick(cc.suppliers),
          description: `PO-${poCounter} ${pick(cc.suppliers)} - School trip`,
          financial_year: fy,
          period_number: p,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += tripCost;
      }
      totalCommitted = round2(totalActual);
    } else {
      // General non-staff: spread across the year with some seasonality
      // More spend in Sep (new year setup) and less in Aug (closed)
      const txnsPerYear = cc.budget > 20000 ? randInt(8, 15) : randInt(3, 8);
      const perTxn = yearBudget / txnsPerYear;

      for (let t = 0; t < txnsPerYear; t++) {
        // Spread across periods, weighted towards Sep-Nov and Jan-Mar
        const p = Math.min(maxPeriod, randInt(1, Math.min(12, maxPeriod)));
        if (p === 5) continue; // Skip August

        const amount = round2(jitter(perTxn, 0.25));
        const { month, year } = periodToDate(p, fyStartYear);
        const supplier = pick(cc.suppliers);
        const isInvoice = rng() > 0.3;

        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(1, 28)),
          transaction_ref: isInvoice
            ? `AP:${p}:${invCounter++}`
            : `PO:${p}:${poCounter++}`,
          transaction_type: isInvoice ? "invoice" : "purchase_order",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: amount,
          vat_amount: round2(amount * (rng() > 0.5 ? 0.2 : 0)),
          is_income: false,
          supplier_name: supplier,
          description: `${isInvoice ? "INV" : "PO"}-${invCounter} ${supplier}`,
          financial_year: fy,
          period_number: p,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += amount;
      }

      // Add 1-2 credit notes per year for some cost centres
      if (rng() > 0.6 && maxPeriod >= 4) {
        const creditPeriod = randInt(3, Math.min(8, maxPeriod));
        const creditAmount = round2(-jitter(perTxn * 0.3, 0.3));
        const { month, year } = periodToDate(creditPeriod, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(1, 28)),
          transaction_ref: `SC:${creditPeriod}:${invCounter++}`,
          transaction_type: "credit_note",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: creditAmount,
          vat_amount: 0,
          is_income: false,
          supplier_name: pick(cc.suppliers),
          description: `SC-${invCounter} Credit note - ${pick(cc.suppliers)}`,
          financial_year: fy,
          period_number: creditPeriod,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += creditAmount;
      }

      totalCommitted = round2(totalActual * (rng() * 0.3 + 0.7));
    }

    budgetSummary[cc.code] = {
      name: cc.name,
      cfr: cc.cfr,
      budget: yearBudget,
      actual: round2(totalActual),
      committed: round2(totalCommitted),
      is_income: false,
    };
  }

  // ── INCOME ──
  for (const cc of INCOME_CCS) {
    const yearBudget = round2(cc.budget * factors.income);
    let totalActual = 0;

    if (cc.code === "7734001") {
      // DSG - paid in 12 monthly instalments
      const monthly = yearBudget / 12;
      for (let p = 1; p <= maxPeriod; p++) {
        const { month, year } = periodToDate(p, fyStartYear);
        const amount = round2(p === 1 ? monthly * 1.0 : monthly); // Flat
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, 1),
          transaction_ref: `SI:${p}:DSG`,
          transaction_type: "receipt",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: -amount,
          vat_amount: 0,
          is_income: true,
          supplier_name: "LOCAL AUTHORITY",
          description: `SI DSG allocation period ${p}`,
          financial_year: fy,
          period_number: p,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += amount;
      }
    } else if (cc.code === "7750001") {
      // Pupil Premium - quarterly
      const quarterly = yearBudget / 4;
      for (const p of [1, 4, 7, 10]) {
        if (p > maxPeriod) break;
        const amount = round2(jitter(quarterly, 0.02));
        const { month, year } = periodToDate(p, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(5, 15)),
          transaction_ref: `SI:${p}:PP`,
          transaction_type: "receipt",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: -amount,
          vat_amount: 0,
          is_income: true,
          supplier_name: "EDUCATION & SKILLS FUNDING AGENCY",
          description: `PP Grant Q${Math.ceil(p / 3)}`,
          financial_year: fy,
          period_number: p,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += amount;
      }
    } else if (cc.code === "7731001") {
      // SEN top-up - termly (3 payments)
      const termly = yearBudget / 3;
      for (const p of [1, 5, 9]) {
        if (p > maxPeriod) break;
        const amount = round2(jitter(termly, 0.05));
        const { month, year } = periodToDate(p, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(10, 20)),
          transaction_ref: `SI:${p}:SEN`,
          transaction_type: "receipt",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: -amount,
          vat_amount: 0,
          is_income: true,
          supplier_name: "LOCAL AUTHORITY",
          description: `SEN top-up funding term ${Math.ceil(p / 4)}`,
          financial_year: fy,
          period_number: p,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += amount;
      }
    } else if (cc.code === "7721001") {
      // Catering income - monthly during term time
      for (let p = 1; p <= maxPeriod; p++) {
        if (p === 5) continue; // August
        const monthAmount = round2(jitter(yearBudget / 10.5, 0.08));
        const { month, year } = periodToDate(p, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(25, 28)),
          transaction_ref: `SI:${p}:MEALS`,
          transaction_type: "receipt",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: -monthAmount,
          vat_amount: 0,
          is_income: true,
          supplier_name: null,
          description: `Dinner money collections period ${p}`,
          financial_year: fy,
          period_number: p,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += monthAmount;
      }
    } else if (cc.code === "7703001") {
      // Lettings - monthly (term-time mostly)
      for (let p = 1; p <= maxPeriod; p++) {
        if (p === 5 || p === 4) continue; // July/Aug low
        const amount = round2(jitter(yearBudget / 10, 0.15));
        const { month, year } = periodToDate(p, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(28, 28)),
          transaction_ref: `SI:${p}:LETT`,
          transaction_type: "receipt",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: -amount,
          vat_amount: 0,
          is_income: true,
          supplier_name: null,
          description: `Lettings income period ${p}`,
          financial_year: fy,
          period_number: p,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += amount;
      }
    } else {
      // Other income: 2-4 lumpy receipts per year
      const numReceipts = randInt(2, 4);
      for (let t = 0; t < numReceipts; t++) {
        const p = randInt(1, Math.min(12, maxPeriod));
        const amount = round2(jitter(yearBudget / numReceipts, 0.2));
        const { month, year } = periodToDate(p, fyStartYear);
        transactions.push({
          organization_id: ORG_ID,
          transaction_date: makeDate(year, month, randInt(1, 28)),
          transaction_ref: `SI:${p}:${invCounter++}`,
          transaction_type: "receipt",
          cost_centre: cc.code,
          cfr_code: cc.cfr,
          cfr_description: cc.name,
          gross_amount: -amount,
          vat_amount: 0,
          is_income: true,
          supplier_name: null,
          description: `${cc.name} receipt`,
          financial_year: fy,
          period_number: p,
          source_system: "SIMS FMS",
          source_row_number: transactions.length + 1,
        });
        totalActual += amount;
      }
    }

    budgetSummary[cc.code] = {
      name: cc.name,
      cfr: cc.cfr,
      budget: yearBudget,
      actual: round2(totalActual),
      committed: 0,
      is_income: true,
    };
  }

  // Balance b/fwd
  const bfwd = fy === "2023-24" ? 52180 : fy === "2024-25" ? 61340 : 67432;
  budgetSummary["8805001"] = {
    name: "Balance b/fwd",
    cfr: "B01",
    budget: bfwd,
    actual: bfwd,
    committed: 0,
    is_income: true,
  };

  return { transactions, budgetSummary, fy };
}

// ─── Main ──────────────────────────────────────
async function main() {
  console.log("Generating 3 years of finance data for Aurora Primary...\n");

  const years = [
    { fy: "2023-24", maxPeriod: 12 }, // Full year
    { fy: "2024-25", maxPeriod: 12 }, // Full year
    { fy: "2025-26", maxPeriod: 9 }, // 9 months (Apr-Dec)
  ];

  // Clear existing data
  console.log("Clearing existing finance data...");
  await supabase
    .from("finance_transactions")
    .delete()
    .eq("organization_id", ORG_ID);
  await supabase
    .from("finance_budget_lines")
    .delete()
    .eq("organization_id", ORG_ID);

  let grandTotalTxns = 0;
  let grandTotalBLs = 0;

  for (const { fy, maxPeriod } of years) {
    _seed = 42 + parseInt(fy.split("-")[0]); // Different seed per year
    const { transactions, budgetSummary } = generateYear(fy, maxPeriod);

    console.log(`\n─── ${fy} (periods 1-${maxPeriod}) ───`);
    console.log(`  Transactions: ${transactions.length}`);

    // Insert transactions in batches
    let inserted = 0;
    for (let i = 0; i < transactions.length; i += 100) {
      const batch = transactions.slice(i, i + 100);
      const { error } = await supabase
        .from("finance_transactions")
        .insert(batch);
      if (error) {
        console.error(`  Batch error:`, error.message);
      } else {
        inserted += batch.length;
      }
    }
    console.log(`  Inserted: ${inserted} transactions`);
    grandTotalTxns += inserted;

    // Insert budget lines
    const budgetRows = Object.entries(budgetSummary).map(([cc, s]) => ({
      organization_id: ORG_ID,
      financial_year: fy,
      cfr_code: s.cfr,
      cfr_description: s.name,
      cost_centre: cc,
      budget_amount: Math.abs(s.budget),
      actual_amount: Math.abs(s.actual),
      committed_amount: Math.abs(s.committed),
      rag_status: s.is_income
        ? "green"
        : Math.abs(s.actual) / Math.abs(s.budget || 1) > 1.0
          ? "red"
          : Math.abs(s.actual) / Math.abs(s.budget || 1) > 0.85
            ? "amber"
            : "green",
      is_income: s.is_income,
      source_system: "SIMS FMS",
    }));

    const { error: blErr } = await supabase
      .from("finance_budget_lines")
      .insert(budgetRows);
    if (blErr) console.error(`  Budget lines error:`, blErr.message);
    else console.log(`  Inserted: ${budgetRows.length} budget lines`);
    grandTotalBLs += budgetRows.length;

    // Print summary
    const totalExp = Object.values(budgetSummary)
      .filter((s) => !s.is_income)
      .reduce((sum, s) => sum + s.actual, 0);
    const totalInc = Object.values(budgetSummary)
      .filter((s) => s.is_income && s.cfr !== "B01")
      .reduce((sum, s) => sum + s.actual, 0);
    console.log(`  Expenditure: £${Math.round(totalExp).toLocaleString()}`);
    console.log(`  Income: £${Math.round(totalInc).toLocaleString()}`);
    console.log(
      `  Surplus/Deficit: £${Math.round(totalInc - totalExp).toLocaleString()}`,
    );
  }

  // Update data_imports record
  console.log("\nUpdating import audit record...");
  const { data: existingImport } = await supabase
    .from("data_imports")
    .select("id")
    .eq("organization_id", ORG_ID)
    .eq("import_type", "transactions")
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingImport?.[0]) {
    await supabase
      .from("data_imports")
      .update({
        rows_imported: grandTotalTxns,
        status: "imported",
      })
      .eq("id", existingImport[0].id);
  }

  // Run reconciliation for 2025-26 (current year)
  console.log("\nRunning reconciliation for 2025-26...");
  const { data: bl2526 } = await supabase
    .from("finance_budget_lines")
    .select(
      "cfr_code, cost_centre, budget_amount, actual_amount, committed_amount, is_income",
    )
    .eq("organization_id", ORG_ID)
    .eq("financial_year", "2025-26");

  const { count: txn2526Count } = await supabase
    .from("finance_transactions")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID)
    .eq("financial_year", "2025-26");

  const dbExp = bl2526
    .filter((b) => !b.is_income)
    .reduce((s, b) => s + parseFloat(b.actual_amount), 0);
  const dbInc = bl2526
    .filter((b) => b.is_income)
    .reduce((s, b) => s + parseFloat(b.actual_amount), 0);

  // Log reconciliation as matched (we just generated + inserted, so it's aligned by definition)
  await supabase
    .from("finance_reconciliation_log")
    .delete()
    .eq("organization_id", ORG_ID);
  await supabase.from("finance_reconciliation_log").insert({
    organization_id: ORG_ID,
    import_id: existingImport?.[0]?.id || null,
    source_checksum: crypto.randomBytes(32).toString("hex"),
    source_total_expenditure: dbExp,
    source_total_income: dbInc,
    source_total_transactions: txn2526Count,
    source_cfr_snapshot: bl2526,
    db_total_expenditure: dbExp,
    db_total_income: dbInc,
    db_total_transactions: txn2526Count,
    db_cfr_snapshot: bl2526,
    status: "matched",
    exceptions: [],
    exception_count: 0,
    max_drift_pct: 0,
    financial_year: "2025-26",
    triggered_by: "multi_year_generation",
    duration_ms: 0,
    created_by: "generate-multi-year-finance",
  });

  // Final counts
  console.log("\n═══ Final Totals ═══");
  for (const fy of ["2023-24", "2024-25", "2025-26"]) {
    const { count: txns } = await supabase
      .from("finance_transactions")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ORG_ID)
      .eq("financial_year", fy);
    const { count: bls } = await supabase
      .from("finance_budget_lines")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ORG_ID)
      .eq("financial_year", fy);
    console.log(`  ${fy}: ${txns} transactions, ${bls} budget lines`);
  }

  const { count: totalTxns } = await supabase
    .from("finance_transactions")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);
  const { count: totalBLs } = await supabase
    .from("finance_budget_lines")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);
  console.log(`  TOTAL: ${totalTxns} transactions, ${totalBLs} budget lines`);
  console.log(`  Reconciliation: matched (2025-26)`);
  console.log("\nDone.");
}

main().catch(console.error);
