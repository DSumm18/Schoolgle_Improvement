#!/usr/bin/env node
/**
 * Aurora Primary School — FMS Finance Test Data Generator
 *
 * Generates realistic SIMS FMS-style financial data for a 2-form-entry
 * LA-maintained primary school (~420 pupils, ~£2.2M budget).
 *
 * Output files:
 *   test-harness/aurora-primary/fms-exports/fms_detailed_cost_centre_2025-26.xlsx
 *   test-harness/aurora-primary/fms-exports/fms_detailed_cost_centre_2024-25.xlsx
 *   test-harness/aurora-primary/fms-exports/fms_budget_summary_3yr.xlsx
 *
 * Run:  node apps/platform/scripts/generate-finance-harness.mjs
 */

import XLSX from "xlsx";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(
  __dirname,
  "..",
  "test-harness",
  "aurora-primary",
  "fms-exports",
);

// ──────────────────────────────────────────────
// 0.  SEEDED PRNG (same algorithm as main harness)
// ──────────────────────────────────────────────
let _seed = 42;
function seededRandom(seed) {
  if (seed !== undefined) _seed = seed;
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function rng() {
  return seededRandom();
}
function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function jitter(base, pct) {
  const variance = base * pct;
  return base + (rng() - 0.5) * 2 * variance;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

// ──────────────────────────────────────────────
// 1.  DATE UTILITIES
// ──────────────────────────────────────────────

// Excel serial date: days since 1900-01-00 (with the Lotus 1-2-3 bug)
// 2025-04-01 = 45748
const EXCEL_EPOCH = new Date(1899, 11, 30); // Dec 30, 1899

function dateToExcel(year, month, day) {
  const d = new Date(year, month - 1, day);
  const diff = d - EXCEL_EPOCH;
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

function excelToDateStr(serial) {
  const d = new Date(EXCEL_EPOCH.getTime() + serial * 24 * 60 * 60 * 1000);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Financial year months: Period 1 = April, Period 12 = March
function periodToMonth(period, fyStartYear) {
  // Period 1 = April of fyStartYear, Period 12 = March of fyStartYear+1
  const month = ((period - 1 + 3) % 12) + 1; // 1=Apr→4, 2=May→5, ..., 9=Dec→12, 10=Jan→1
  const year = period <= 9 ? fyStartYear : fyStartYear + 1;
  return { month, year };
}

// ──────────────────────────────────────────────
// 2.  COST CENTRE DEFINITIONS
// ──────────────────────────────────────────────

const EXPENDITURE_COST_CENTRES = [
  { code: "1101001", name: "Teaching Staff", cfr: "E01", budget: 980000 },
  { code: "1102001", name: "Supply Teaching Staff", cfr: "E02", budget: 35000 },
  {
    code: "1103001",
    name: "Education Support Staff",
    cfr: "E03",
    budget: 45000,
  },
  { code: "1106001", name: "Admin and Clerical", cfr: "E05", budget: 85000 },
  { code: "1107001", name: "Teaching Assistants", cfr: "E03", budget: 320000 },
  { code: "1108001", name: "Midday Supervisors", cfr: "E07", budget: 28000 },
  { code: "1110001", name: "Premises Staff", cfr: "E04", budget: 42000 },
  { code: "1111001", name: "Cleaners", cfr: "E14", budget: 18000 },
  { code: "1115001", name: "Staff Insurance", cfr: "E11", budget: 22000 },
  { code: "1117001", name: "Staff Travel", cfr: "E08", budget: 2500 },
  {
    code: "1118001",
    name: "Training & Recruitment",
    cfr: "E09",
    budget: 15000,
  },
  { code: "2201001", name: "Building Repairs", cfr: "E12", budget: 25000 },
  { code: "2202001", name: "Grounds Maintenance", cfr: "E13", budget: 8000 },
  { code: "2204001", name: "Cleaning Materials", cfr: "E14", budget: 6500 },
  { code: "2220001", name: "Security", cfr: "E18", budget: 3200 },
  { code: "3303001", name: "Gas", cfr: "E16", budget: 28000 },
  { code: "3304001", name: "Electricity", cfr: "E16", budget: 22000 },
  { code: "3305001", name: "Water", cfr: "E15", budget: 5500 },
  { code: "4401001", name: "ICT", cfr: "E20", budget: 18000 },
  { code: "4402001", name: "Photocopier", cfr: "E22", budget: 4500 },
  { code: "4403001", name: "Furniture & Equipment", cfr: "E19", budget: 8000 },
  { code: "4410001", name: "Learning Resources", cfr: "E19", budget: 12000 },
  { code: "4412001", name: "Curriculum Development", cfr: "E19", budget: 6000 },
  { code: "5502001", name: "Communications", cfr: "E22", budget: 3000 },
  { code: "5505001", name: "Bought-in Services", cfr: "E28a", budget: 95000 },
  { code: "5508001", name: "Educational Visits", cfr: "E24", budget: 4500 },
  { code: "5527001", name: "Exam Fees", cfr: "E21", budget: 1200 },
  { code: "5529001", name: "Insurance Premiums", cfr: "E23", budget: 12000 },
  { code: "5537001", name: "Contract Catering", cfr: "E25", budget: 45000 },
];

const INCOME_COST_CENTRES = [
  { code: "7703001", name: "Lettings", cfr: "I08a", budget: -18000 },
  { code: "7705001", name: "Other Income", cfr: "I07", budget: -8500 },
  { code: "7707001", name: "Insurance Claims", cfr: "I10", budget: -15000 },
  { code: "7711001", name: "Training Income", cfr: "I07", budget: -3000 },
  { code: "7721001", name: "Catering Income", cfr: "I09", budget: -42000 },
  { code: "7731001", name: "SEN Top-Up Funding", cfr: "I03", budget: -45000 },
  {
    code: "7734001",
    name: "School Budget Share (GAG)",
    cfr: "I01",
    budget: -1850000,
  },
  { code: "7750001", name: "Pupil Premium Grant", cfr: "I05", budget: -82000 },
  { code: "7751001", name: "Government Grants", cfr: "I06", budget: -35000 },
];

const BALANCE_BFWD = {
  code: "8805001",
  name: "Balance b/fwd",
  cfr: "B01",
  budget: 0,
  actual: 67432,
};

const ALL_COST_CENTRES = [
  ...EXPENDITURE_COST_CENTRES,
  ...INCOME_COST_CENTRES,
  BALANCE_BFWD,
];

// ──────────────────────────────────────────────
// 3.  SUPPLIER / DETAIL POOLS (anonymised)
// ──────────────────────────────────────────────

const SUPPLIERS = {
  cleaning: [
    "CLEANING SOLUTIONS LTD",
    "HYGIENE SUPPLIES UK",
    "SPARKLE SERVICES CO",
  ],
  it: ["IT SERVICES CO", "TECH SOLUTIONS LTD", "DIGITAL LEARNING SUPPLIES"],
  office: ["OFFICE SUPPLIES LTD", "STATIONERY WORLD", "PAPER & PRINT CO"],
  building: [
    "MAINTENANCE PARTNERS LTD",
    "BUILDRIGHT SERVICES",
    "PROPERTY CARE CO",
  ],
  grounds: ["GREENSCAPE MAINTENANCE", "LANDSCAPE SOLUTIONS LTD"],
  furniture: ["SCHOOL FURNISHINGS LTD", "CLASSROOM SOLUTIONS CO"],
  learning: [
    "EDUCATIONAL RESOURCES LTD",
    "LEARNING MATERIALS CO",
    "CURRICULUM SUPPLIES LTD",
  ],
  catering: ["SCHOOL MEALS PROVIDER LTD", "FRESH FOODS CATERING CO"],
  services: [
    "LA TRADED SERVICES",
    "SCHOOL IMPROVEMENT PARTNERSHIP",
    "HR ADVISORY SERVICES LTD",
    "FINANCE SUPPORT SERVICES",
    "LEGAL SERVICES LLP",
    "AUDIT SERVICES LTD",
  ],
  energy: ["ENERGY SUPPLIER CO", "GAS UTILITIES LTD", "ELECTRIC POWER CO"],
  insurance: ["EDUCATION INSURANCE BROKER LTD"],
  comms: ["TELECOM SERVICES LTD", "BROADBAND PROVIDER CO"],
  security: ["SECURITY SYSTEMS LTD", "ALARM MONITORING CO"],
  training: [
    "CPD TRAINING PROVIDER",
    "PROFESSIONAL DEVELOPMENT CO",
    "SAFEGUARDING TRAINING LTD",
  ],
  visits: [
    "ADVENTURE LEARNING LTD",
    "OUTDOOR EDUCATION CO",
    "MUSEUM EDUCATION SERVICES",
  ],
  photocopier: ["REPROGRAPHICS LTD", "COPY SOLUTIONS CO"],
  exams: ["EXAMINATION BOARD SERVICES"],
};

function generateInvoiceRef() {
  return `INV-${randInt(100000, 999999)}`;
}

function generatePORef() {
  return `PO-${randInt(10000, 99999)}`;
}

function generateJVRef(period) {
  return `JV.:0${randInt(10000, 99999)} Ref:MTH ${period}`;
}

// ──────────────────────────────────────────────
// 4.  TRANSACTION GENERATORS
// ──────────────────────────────────────────────

/**
 * Generate payroll journal entries for a staff cost centre.
 * LA posts payroll ~2-3 weeks after month end.
 */
function generatePayrollTransactions(cc, fyYear, maxPeriod) {
  const transactions = [];
  const monthlyBudget = cc.budget / 12;

  for (let period = 1; period <= maxPeriod; period++) {
    const { month, year } = periodToMonth(period, fyYear);
    // LA posts payroll 2-3 weeks after month end
    const postDay = randInt(15, 22);
    const postMonth = month === 12 ? 1 : month + 1;
    const postYear = month === 12 ? year + 1 : year;

    // For December (period 9), payroll may not be posted yet if we're mid-Dec
    // Let's say it's posted for periods 1-8, period 9 (December) is pending
    if (period === maxPeriod && maxPeriod === 9) {
      // December payroll not yet posted (it's mid-December)
      continue;
    }

    const amount = round2(jitter(monthlyBudget, 0.02));
    const jvRef = generateJVRef(period);

    transactions.push({
      type: "GL",
      period,
      date: dateToExcel(postYear, postMonth, postDay),
      details: jvRef,
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: amount,
      transStatus: "Posted",
      yearStatus: "Open",
    });
  }

  return transactions;
}

/**
 * Generate energy transactions — gas is seasonal, electricity more even.
 * LA posts quarterly in arrears.
 */
function generateGasTransactions(cc, fyYear, maxPeriod) {
  const transactions = [];
  // Gas seasonal profile: Apr=800, May=500, Jun=300, Jul=200, Aug=200,
  // Sep=800, Oct=1500, Nov=3500, Dec=4000, Jan=4500, Feb=4000, Mar=2500
  const gasProfile = [
    800, 500, 300, 200, 200, 800, 1500, 3500, 4000, 4500, 4000, 2500,
  ];

  // LA posts quarterly in arrears: Q1 (Apr-Jun) posted late July, Q2 (Jul-Sep) posted late Oct, Q3 (Oct-Dec) posted late Jan
  const quarters = [
    { periods: [1, 2, 3], postPeriod: 4, postDay: randInt(20, 28) },
    { periods: [4, 5, 6], postPeriod: 7, postDay: randInt(20, 28) },
    { periods: [7, 8, 9], postPeriod: 10, postDay: randInt(15, 25) },
    { periods: [10, 11, 12], postPeriod: 13, postDay: 20 }, // won't be reached
  ];

  for (const q of quarters) {
    const lastPeriodInQ = q.periods[q.periods.length - 1];
    if (lastPeriodInQ > maxPeriod) {
      // Check if Q3 (Oct-Dec) — it's now Dec, so Q3 won't be posted until late Jan
      // This means Oct+Nov+Dec gas is NOT yet posted as a quarterly invoice
      // But we can show individual monthly GL journals for the ones the LA has processed
      break;
    }
    if (q.postPeriod > maxPeriod + 1) break; // not posted yet

    let qTotal = 0;
    for (const p of q.periods) {
      qTotal += round2(jitter(gasProfile[p - 1], 0.08));
    }

    const { month: postMonth, year: postYear } = periodToMonth(
      Math.min(q.postPeriod, 12),
      fyYear,
    );

    transactions.push({
      type: "GL",
      period: q.postPeriod <= 12 ? q.postPeriod : 12,
      date: dateToExcel(postYear, postMonth, q.postDay),
      details: `JV.:0${randInt(10000, 99999)} Energy quarterly accrual Q${quarters.indexOf(q) + 1}`,
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: round2(qTotal),
      transStatus: "Posted",
      yearStatus: "Open",
    });
  }

  // Scenario B: Gas looks overspent because budget was set flat (28000/12 = 2333/month)
  // but actual is seasonal. Through Q2 (periods 1-6), actual = 800+500+300+200+200+800 = 2800
  // which is LESS than budget. But Q3 will be high. FMS just shows quarterly lumps.
  // The "overspend" illusion comes from the Q2 posting including Jul-Sep (low months)
  // then Q3 not yet posted but commitment should be there.

  // Add a commitment for Q3 that the school has raised
  if (maxPeriod >= 7) {
    let q3Estimate = 0;
    for (const p of [7, 8, 9]) {
      q3Estimate += gasProfile[p - 1];
    }
    transactions.push({
      type: "PO",
      period: 7,
      date: dateToExcel(fyYear, 10, 5), // October
      details: `${generatePORef()} GAS UTILITIES LTD - Estimated Q3`,
      d1: "",
      d2: "",
      d3: "",
      commitment: round2(jitter(q3Estimate, 0.05)),
      centInvd: 0,
      actual: 0,
      transStatus: "Printed",
      yearStatus: "Open",
    });
  }

  return transactions;
}

function generateElectricityTransactions(cc, fyYear, maxPeriod) {
  const transactions = [];
  // Electricity is more even: ~1800/month with slight winter increase
  const elecProfile = [
    1600, 1500, 1400, 1300, 1300, 1600, 1900, 2100, 2200, 2300, 2200, 1800,
  ];

  // Also posted quarterly by LA
  const quarters = [
    { periods: [1, 2, 3], postPeriod: 4, postDay: randInt(22, 28) },
    { periods: [4, 5, 6], postPeriod: 7, postDay: randInt(22, 28) },
    { periods: [7, 8, 9], postPeriod: 10, postDay: randInt(18, 25) },
  ];

  for (const q of quarters) {
    const lastPeriodInQ = q.periods[q.periods.length - 1];
    if (lastPeriodInQ > maxPeriod) break;
    if (q.postPeriod > maxPeriod + 1) break;

    let qTotal = 0;
    for (const p of q.periods) {
      qTotal += round2(jitter(elecProfile[p - 1], 0.06));
    }

    const { month: postMonth, year: postYear } = periodToMonth(
      Math.min(q.postPeriod, 12),
      fyYear,
    );

    transactions.push({
      type: "GL",
      period: q.postPeriod <= 12 ? q.postPeriod : 12,
      date: dateToExcel(postYear, postMonth, q.postDay),
      details: `JV.:0${randInt(10000, 99999)} Energy quarterly accrual Q${quarters.indexOf(q) + 1}`,
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: round2(qTotal),
      transStatus: "Posted",
      yearStatus: "Open",
    });
  }

  return transactions;
}

/**
 * Generate purchase order transactions for non-payroll, non-energy cost centres.
 */
function generatePOTransactions(cc, fyYear, maxPeriod) {
  const transactions = [];

  // Map cost centres to supplier pools
  const supplierMap = {
    2201001: "building",
    2202001: "grounds",
    2204001: "cleaning",
    2220001: "security",
    4401001: "it",
    4402001: "photocopier",
    4403001: "furniture",
    4410001: "learning",
    4412001: "learning",
    5502001: "comms",
    5505001: "services",
    5508001: "visits",
    5527001: "exams",
    5529001: "insurance",
    5537001: "catering",
    1115001: "insurance",
    1117001: "office",
    1118001: "training",
  };

  const pool = supplierMap[cc.code] || "office";

  // Determine how many POs this cost centre typically generates
  let numPOs;
  if (cc.budget >= 90000) numPOs = randInt(8, 14);
  else if (cc.budget >= 20000) numPOs = randInt(4, 8);
  else if (cc.budget >= 8000) numPOs = randInt(3, 5);
  else numPOs = randInt(1, 3);

  // Scale to how far through the year we are (9/12)
  numPOs = Math.ceil(numPOs * (maxPeriod / 12));

  // Distribute POs across available periods
  const totalSpent = round2(cc.budget * (maxPeriod / 12) * jitter(1.0, 0.08));
  let remaining = totalSpent;

  for (let i = 0; i < numPOs; i++) {
    const period = randInt(1, maxPeriod);
    const { month, year } = periodToMonth(period, fyYear);
    const supplier = pick(SUPPLIERS[pool] || SUPPLIERS.office);

    const isLast = i === numPOs - 1;
    const amount = isLast
      ? remaining
      : round2(remaining * jitter(1 / (numPOs - i), 0.3));
    if (amount <= 0) continue;
    remaining = round2(remaining - amount);
    if (remaining < 0) remaining = 0;

    const poRef = generatePORef();
    const invRef = generateInvoiceRef();
    const orderDay = randInt(1, 20);
    const invoiceDay = randInt(orderDay + 5, 28);

    // Determine status — most are reconciled, some partly invoiced
    const statusRoll = rng();
    const isReconciled = statusRoll < 0.75;
    const isPartlyInvoiced = statusRoll >= 0.75 && statusRoll < 0.9;

    // PO line (commitment)
    transactions.push({
      type: "PO",
      period,
      date: dateToExcel(year, month, orderDay),
      details: `${poRef} ${supplier}`,
      d1: "",
      d2: "",
      d3: "",
      commitment: round2(amount),
      centInvd: 0,
      actual: 0,
      transStatus: isReconciled
        ? "Reconciled"
        : isPartlyInvoiced
          ? "Partly Invoiced"
          : "Printed",
      yearStatus: "Open",
    });

    // AP line (actual) — only if invoiced
    if (isReconciled || isPartlyInvoiced) {
      const invoicedAmount = isPartlyInvoiced
        ? round2(amount * jitter(0.6, 0.15))
        : amount;
      transactions.push({
        type: "AP",
        period,
        date: dateToExcel(year, month, Math.min(invoiceDay, 28)),
        details: `${invRef} ${supplier}`,
        d1: "",
        d2: "",
        d3: "",
        commitment: 0,
        centInvd: isReconciled ? round2(amount) : round2(invoicedAmount),
        actual: isReconciled ? round2(amount) : round2(invoicedAmount),
        transStatus: isReconciled ? "Reconciled" : "Partly Invoiced",
        yearStatus: "Open",
      });
    }
  }

  return transactions;
}

// ──────────────────────────────────────────────
// 5.  INCOME TRANSACTION GENERATORS
// ──────────────────────────────────────────────

function generateIncomeTransactions(fyYear, maxPeriod) {
  const allIncome = {};

  // --- School Budget Share: lump sum in April (period 1) ---
  allIncome["7734001"] = [
    {
      type: "GL",
      period: 1,
      date: dateToExcel(fyYear, 4, 3),
      details: "JV.:098001 LA BUDGET SHARE ALLOCATION 2025/26",
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: -1850000,
      transStatus: "Posted",
      yearStatus: "Open",
    },
  ];

  // --- Pupil Premium: quarterly, but Q2 is LATE (Scenario A) ---
  // Q1 posted April: £20,500
  // Q2 expected July: £20,500 — NOT POSTED (overdue)
  // Q3 expected Oct: £20,500 — NOT POSTED (not due yet in Dec)
  // Q4 expected Jan: £20,500
  allIncome["7750001"] = [
    {
      type: "GL",
      period: 1,
      date: dateToExcel(fyYear, 4, 15),
      details: "JV.:098050 PUPIL PREMIUM GRANT Q1 2025/26",
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: -20500,
      transStatus: "Posted",
      yearStatus: "Open",
    },
  ];
  // Q2 and Q3 are missing — this is the "working blind" scenario

  // --- SEN Top-Up Funding: termly ---
  // Summer term (Apr-Jul): posted May = £15,000
  // Autumn term (Sep-Dec): posted Oct = £15,000
  // Spring term (Jan-Mar): NOT YET POSTED (Scenario A)
  allIncome["7731001"] = [
    {
      type: "GL",
      period: 2,
      date: dateToExcel(fyYear, 5, 10),
      details: "JV.:098031 SEN TOP-UP FUNDING SUMMER TERM",
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: -15000,
      transStatus: "Posted",
      yearStatus: "Open",
    },
    {
      type: "GL",
      period: 7,
      date: dateToExcel(fyYear, 10, 8),
      details: "JV.:098032 SEN TOP-UP FUNDING AUTUMN TERM",
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: -15000,
      transStatus: "Posted",
      yearStatus: "Open",
    },
  ];
  // Spring term £15,000 not yet posted

  // --- Government Grants (PE/Sport Premium + UIFSM) ---
  // PE/Sport premium (£16,000) — usually posted October, NOT YET POSTED (Scenario A)
  // UIFSM (£19,000) — posted September
  allIncome["7751001"] = [
    {
      type: "GL",
      period: 6,
      date: dateToExcel(fyYear, 9, 5),
      details: "JV.:098051 UNIVERSAL INFANT FREE SCHOOL MEALS GRANT",
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: -19000,
      transStatus: "Posted",
      yearStatus: "Open",
    },
  ];
  // PE/Sport premium £16,000 not posted — but was budgeted at £35K total
  // This leaves £16K "missing" from FMS perspective

  // --- Insurance Claims ---
  // One claim for long-term sick teacher cover (submitted Sept, not yet paid)
  // Budget: -£15,000, nothing posted yet (Scenario A: £6,200 expected)
  // But we'll show the claim as a note/commitment
  allIncome["7707001"] = [
    {
      type: "PO",
      period: 6,
      date: dateToExcel(fyYear, 9, 18),
      details: `${generatePORef()} EDUCATION INSURANCE BROKER LTD - Staff absence claim ref SA-2025-0847`,
      d1: "",
      d2: "",
      d3: "",
      commitment: -6200,
      centInvd: 0,
      actual: 0,
      transStatus: "Printed",
      yearStatus: "Open",
    },
  ];
  // Additional small claim that DID pay out
  allIncome["7707001"].push({
    type: "AP",
    period: 4,
    date: dateToExcel(fyYear, 7, 22),
    details: `${generateInvoiceRef()} EDUCATION INSURANCE BROKER LTD - Property claim`,
    d1: "",
    d2: "",
    d3: "",
    commitment: 0,
    centInvd: 0,
    actual: -2800,
    transStatus: "Reconciled",
    yearStatus: "Open",
  });

  // --- Lettings: monthly but 2 months behind ---
  // Should be ~£1,500/month. Posted for Apr-Oct (7 months), Nov+Dec not yet posted
  allIncome["7703001"] = [];
  for (let p = 1; p <= 7; p++) {
    const { month, year } = periodToMonth(p, fyYear);
    const postPeriod = p + 2; // 2 months behind
    const { month: postMonth, year: postYear } = periodToMonth(
      Math.min(postPeriod, maxPeriod),
      fyYear,
    );
    if (postPeriod > maxPeriod) break;

    allIncome["7703001"].push({
      type: "GL",
      period: p,
      date: dateToExcel(postYear, postMonth, randInt(10, 20)),
      details: `JV.:0${randInt(10000, 99999)} LETTINGS INCOME ${["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"][p - 1]} 2025`,
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: round2(jitter(-1500, 0.15)),
      transStatus: "Posted",
      yearStatus: "Open",
    });
  }

  // --- Catering Income: termly ---
  // Autumn term posted: ~£14,000
  // Spring not yet due
  allIncome["7721001"] = [
    {
      type: "GL",
      period: 7,
      date: dateToExcel(fyYear, 10, 28),
      details: "JV.:098721 CATERING INCOME AUTUMN TERM 2025",
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: round2(jitter(-14000, 0.05)),
      transStatus: "Posted",
      yearStatus: "Open",
    },
  ];

  // --- Other Income ---
  allIncome["7705001"] = [];
  // A few miscellaneous income items
  const otherIncomeItems = [
    { period: 2, desc: "PARENTAL CONTRIBUTIONS - SCHOOL FUND", amount: -1200 },
    { period: 4, desc: "DONATION - AURORA PTA SUMMER FAIR", amount: -2100 },
    {
      period: 6,
      desc: "PARENTAL CONTRIBUTIONS - RESIDENTIAL TRIP",
      amount: -1800,
    },
  ];
  for (const item of otherIncomeItems) {
    const { month, year } = periodToMonth(item.period, fyYear);
    allIncome["7705001"].push({
      type: "GL",
      period: item.period,
      date: dateToExcel(year, month, randInt(5, 25)),
      details: `JV.:0${randInt(10000, 99999)} ${item.desc}`,
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: round2(jitter(item.amount, 0.05)),
      transStatus: "Posted",
      yearStatus: "Open",
    });
  }

  // --- Training Income ---
  allIncome["7711001"] = [
    {
      type: "GL",
      period: 5,
      date: dateToExcel(fyYear, 8, 15),
      details: "JV.:098711 TRAINING COURSE INCOME - MATHS HUB",
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: -1500,
      transStatus: "Posted",
      yearStatus: "Open",
    },
  ];

  // --- Balance b/fwd ---
  allIncome["8805001"] = [
    {
      type: "GL",
      period: 1,
      date: dateToExcel(fyYear, 4, 1),
      details: "BALANCE BROUGHT FORWARD FROM 2024/25",
      d1: "",
      d2: "",
      d3: "",
      commitment: 0,
      centInvd: 0,
      actual: -67432, // surplus carried forward (negative = income/credit)
      transStatus: "Posted",
      yearStatus: "Open",
    },
  ];

  return allIncome;
}

// ──────────────────────────────────────────────
// 6.  SCENARIO C: Staff secondment recharge
// ──────────────────────────────────────────────

/**
 * A teacher is seconded to neighbouring school since September.
 * School pays salary (visible in 1101001 Teaching Staff) but
 * recharge income (£4,500/month = £13,500 for Sep-Nov) hasn't been posted by LA.
 *
 * This shows up as teaching staff appearing over-profile because the offsetting
 * income hasn't arrived.
 */
function generateSecondmentTransactions(fyYear) {
  // The salary costs are already in the payroll transactions for 1101001.
  // We add a note that the recharge for 7705001 Other Income hasn't been posted.
  // In a real FMS, there would be nothing to show — that's the point.
  // We add a commitment the school has raised to track it.
  return [
    {
      type: "PO",
      period: 6,
      date: dateToExcel(fyYear, 9, 5),
      details: `${generatePORef()} NEIGHBOURING PRIMARY ACADEMY - Staff secondment recharge Sep-Mar`,
      d1: "",
      d2: "",
      d3: "",
      commitment: -31500, // full year expectation (7 months x £4,500)
      centInvd: 0,
      actual: 0,
      transStatus: "Printed",
      yearStatus: "Open",
    },
  ];
}

// ──────────────────────────────────────────────
// 7.  PAYROLL COST CENTRE IDENTIFICATION
// ──────────────────────────────────────────────

const PAYROLL_CODES = new Set([
  "1101001",
  "1102001",
  "1103001",
  "1106001",
  "1107001",
  "1108001",
  "1110001",
  "1111001",
]);

const ENERGY_CODES = { 3303001: "gas", 3304001: "electricity" };

// Cost centres that are annual lump payments (insurance, etc.)
const ANNUAL_LUMP_CODES = new Set(["1115001", "5529001"]);

// ──────────────────────────────────────────────
// 8.  GENERATE ANNUAL LUMP TRANSACTIONS
// ──────────────────────────────────────────────

function generateAnnualLumpTransactions(cc, fyYear) {
  const transactions = [];
  const supplier =
    cc.code === "1115001"
      ? "EDUCATION INSURANCE BROKER LTD"
      : "EDUCATION INSURANCE BROKER LTD";
  const poRef = generatePORef();
  const invRef = generateInvoiceRef();

  // Typically paid in full in April/May
  transactions.push({
    type: "PO",
    period: 1,
    date: dateToExcel(fyYear, 4, 5),
    details: `${poRef} ${supplier}`,
    d1: "",
    d2: "",
    d3: "",
    commitment: round2(cc.budget),
    centInvd: 0,
    actual: 0,
    transStatus: "Reconciled",
    yearStatus: "Open",
  });
  transactions.push({
    type: "AP",
    period: 1,
    date: dateToExcel(fyYear, 4, 18),
    details: `${invRef} ${supplier}`,
    d1: "",
    d2: "",
    d3: "",
    commitment: 0,
    centInvd: round2(cc.budget),
    actual: round2(jitter(cc.budget, 0.02)),
    transStatus: "Reconciled",
    yearStatus: "Open",
  });

  return transactions;
}

// ──────────────────────────────────────────────
// 9.  ASSEMBLE FULL DETAILED REPORT (2025/26)
// ──────────────────────────────────────────────

function buildDetailedReport2526() {
  const FY_YEAR = 2025;
  const MAX_PERIOD = 9; // As at December 2025

  // Reset seed for reproducibility
  seededRandom(42);

  const allTransactions = {}; // code -> { cc, budget, transactions[] }

  // --- Expenditure ---
  for (const cc of EXPENDITURE_COST_CENTRES) {
    let transactions = [];

    if (PAYROLL_CODES.has(cc.code)) {
      transactions = generatePayrollTransactions(cc, FY_YEAR, MAX_PERIOD);
    } else if (ENERGY_CODES[cc.code] === "gas") {
      transactions = generateGasTransactions(cc, FY_YEAR, MAX_PERIOD);
    } else if (ENERGY_CODES[cc.code] === "electricity") {
      transactions = generateElectricityTransactions(cc, FY_YEAR, MAX_PERIOD);
    } else if (ANNUAL_LUMP_CODES.has(cc.code)) {
      transactions = generateAnnualLumpTransactions(cc, FY_YEAR);
    } else {
      transactions = generatePOTransactions(cc, FY_YEAR, MAX_PERIOD);
    }

    allTransactions[cc.code] = { cc, transactions };
  }

  // --- Income ---
  const incomeData = generateIncomeTransactions(FY_YEAR, MAX_PERIOD);
  for (const icc of INCOME_COST_CENTRES) {
    allTransactions[icc.code] = {
      cc: icc,
      transactions: incomeData[icc.code] || [],
    };
  }

  // Balance b/fwd
  allTransactions[BALANCE_BFWD.code] = {
    cc: BALANCE_BFWD,
    transactions: incomeData[BALANCE_BFWD.code] || [],
  };

  // Scenario C: secondment recharge (add to Other Income)
  const secondmentTxns = generateSecondmentTransactions(FY_YEAR);
  if (allTransactions["7705001"]) {
    allTransactions["7705001"].transactions.push(...secondmentTxns);
  }

  return allTransactions;
}

// ──────────────────────────────────────────────
// 9b.  LEDGER-FUND CODE MAPPING (realistic FMS codes)
// ──────────────────────────────────────────────

const LEDGER_CODE_MAP = {
  1101001: { code: "00103-01", desc: "Teachers-School Budget Share" },
  1102001: { code: "00867-01", desc: "Supply Teachers-School Budget Share" },
  1103001: {
    code: "00156-01",
    desc: "Education Support Staff-School Budget Share",
  },
  1106001: {
    code: "00108-01",
    desc: "Basic Pay Administration-School Budget Share",
  },
  1107001: {
    code: "00199-01",
    desc: "Classroom Assistants-School Budget Share",
  },
  1108001: { code: "00189-01", desc: "Midday Supervisors-School Budget Share" },
  1110001: {
    code: "00127-01",
    desc: "Superintendents Basic Pay-School Budget Share",
  },
  1111001: { code: "00106-01", desc: "Cleaners Basic Pay-School Budget Share" },
  1115001: {
    code: "05073-01",
    desc: "Insurance Premiums Staff-School Budget Share",
  },
  1117001: { code: "31000-01", desc: "Staff Travel-School Budget Share" },
  1118001: { code: "07000-01", desc: "Training Costs-School Budget Share" },
  2201001: {
    code: "10100-01",
    desc: "Building Repairs & Maintenance-School Budget Share",
  },
  2202001: {
    code: "11100-01",
    desc: "Horticultural/Grounds Maint-School Budget Share",
  },
  2204001: { code: "12710-01", desc: "Cleaning Materials-School Budget Share" },
  2220001: { code: "16220-01", desc: "Security Costs-School Budget Share" },
  3303001: { code: "12300-01", desc: "Gas-School Budget Share" },
  3304001: { code: "12400-01", desc: "Electricity-School Budget Share" },
  3305001: { code: "12500-01", desc: "Water & Sewerage-School Budget Share" },
  4401001: {
    code: "30100-01",
    desc: "ICT Equipment & Software-School Budget Share",
  },
  4402001: { code: "30200-01", desc: "Reprographics-School Budget Share" },
  4403001: {
    code: "30300-01",
    desc: "Furniture & Equipment-School Budget Share",
  },
  4410001: { code: "30400-01", desc: "Learning Resources-School Budget Share" },
  4412001: {
    code: "30500-01",
    desc: "Curriculum Development-School Budget Share",
  },
  5502001: { code: "33000-01", desc: "Communications-School Budget Share" },
  5505001: {
    code: "40100-01",
    desc: "Bought-in Professional Services-School Budget Share",
  },
  5508001: { code: "41000-01", desc: "Educational Visits-School Budget Share" },
  5527001: { code: "42000-01", desc: "Examination Fees-School Budget Share" },
  5529001: {
    code: "05071-01",
    desc: "Other Insurance Premiums-School Budget Share",
  },
  5537001: { code: "43000-01", desc: "Contract Catering-School Budget Share" },
  7703001: { code: "95600-01", desc: "Lettings-School Budget Share" },
  7705001: { code: "97300-01", desc: "Other Income-School Budget Share" },
  7707001: {
    code: "97473-01",
    desc: "Insurance Income Staff-School Budget Share",
  },
  7711001: { code: "97360-01", desc: "Training Income-School Budget Share" },
  7721001: { code: "91310-01", desc: "Catering Income-School Budget Share" },
  7731001: { code: "94340-01", desc: "SEN Top-Up Funding-School Budget Share" },
  7734001: {
    code: "61100-01",
    desc: "School Budget Share-School Budget Share",
  },
  7750001: { code: "87400-01", desc: "Pupil Premium-School Budget Share" },
  7751001: { code: "87471-01", desc: "Government Grants-School Budget Share" },
  8805001: {
    code: "61201-01",
    desc: "Balance Brought Forward-School Budget Share",
  },
};

// ──────────────────────────────────────────────
// 10.  EXCEL SHEET BUILDER — Detailed Cost Centre Report
// ──────────────────────────────────────────────

function buildDetailedExcel(allTransactions, fyLabel) {
  const rows = [];

  // Header rows — exact SIMS FMS format (rows 0-14)
  rows.push([
    "Detailed Cost Centre Transaction Report",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
  rows.push(["Selection  :", "", "", "", "", "", "", "", "", "", "", ""]);
  rows.push([
    `Financial Year - ${fyLabel}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push(["Year to Date - No", "", "", "", "", "", "", "", "", "", "", ""]);
  rows.push(["From Period - N/A", "", "", "", "", "", "", "", "", "", "", ""]);
  rows.push(["To Period - N/A", "", "", "", "", "", "", "", "", "", "", ""]);
  rows.push(["Fund - All", "", "", "", "", "", "", "", "", "", "", ""]);
  rows.push([
    "Cost Centres - All",
    "",
    "",
    "",
    "Transaction Type - All",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push([
    "Cost Centre Group - N/A",
    "",
    "",
    "",
    "Exclude Cost Centres with Zero Transaction Balances - Yes",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push([
    "Exclude Zero Value Order Lines - Yes",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
  rows.push([
    "User : SB",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Establishment : Aurora Primary School",
  ]);
  rows.push([]);
  rows.push([]);
  // Row 15: Headers
  rows.push([
    "Type",
    "Period",
    "Date",
    "Details",
    "",
    "",
    "",
    "Commitment",
    "Cent. Inv'd",
    "Actual",
    "Trans. Status",
    "Year Status",
  ]);
  rows.push([]); // blank separator

  const allCodes = [
    ...EXPENDITURE_COST_CENTRES,
    ...INCOME_COST_CENTRES,
    BALANCE_BFWD,
  ];

  for (const ccDef of allCodes) {
    const data = allTransactions[ccDef.code];
    if (!data) continue;

    const { cc, transactions } = data;

    // Sort transactions by period then date
    const sorted = [...transactions].sort((a, b) => {
      if (a.period !== b.period) return a.period - b.period;
      return a.date - b.date;
    });

    // Calculate totals for the allocation row
    let ccCommitment = 0;
    let ccCentInvd = 0;
    let ccActual = 0;
    for (const txn of sorted) {
      ccCommitment = round2(ccCommitment + txn.commitment);
      ccCentInvd = round2(ccCentInvd + txn.centInvd);
      ccActual = round2(ccActual + txn.actual);
    }
    const balance = round2(cc.budget - ccActual);
    const spentPct = cc.budget !== 0 ? round2((ccActual / cc.budget) * 100) : 0;

    // --- Cost Centre header (exact FMS format) ---
    rows.push([
      `Cost Centre : ${cc.code} ${cc.name}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    // Allocation header row
    rows.push([
      "Allocated",
      "Committed",
      "",
      "Cent. Inv'd",
      "Actual",
      "Balance",
      "Spent %",
      "Threshold %",
      "",
      "",
      "",
      "",
    ]);
    // Allocation values row
    rows.push([
      cc.budget,
      ccCommitment,
      "",
      ccCentInvd,
      ccActual,
      balance,
      Math.abs(spentPct),
      100,
      "",
      "",
      "",
      "",
    ]);

    // --- Ledger-Fund Code header ---
    // Map cost centre to a realistic ledger-fund code
    const ledgerCode = LEDGER_CODE_MAP[cc.code] || {
      code: "99999-01",
      desc: `${cc.name}-School Budget Share`,
    };
    rows.push([
      `Ledger-Fund Code : ${ledgerCode.code}`,
      "",
      "",
      `${ledgerCode.desc}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    if (sorted.length === 0) {
      rows.push([
        "",
        "",
        "",
        "No transactions posted",
        "",
        "",
        "",
        0,
        0,
        0,
        "",
        "",
      ]);
    }

    // --- Transaction rows with narratives ---
    for (const txn of sorted) {
      // Transaction row
      rows.push([
        txn.type,
        txn.period,
        txn.date, // Excel serial number (not date string)
        txn.details,
        "",
        "",
        "",
        txn.commitment,
        txn.centInvd,
        txn.actual,
        txn.transStatus,
        txn.yearStatus || "",
      ]);
      // Narrative row (FMS always has one after each transaction)
      const narrative = txn.narrative || "Narrative not available";
      rows.push([
        "",
        "",
        "",
        narrative,
        "",
        "",
        "",
        txn.commitment,
        txn.centInvd,
        txn.actual,
        "",
        "",
      ]);
      // Blank separator
      rows.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
    }

    // Ledger-Fund Code Total
    rows.push([
      "",
      "",
      "",
      "",
      "Ledger-Fund Code Total :",
      "",
      "",
      ccCommitment,
      ccCentInvd,
      ccActual,
      "",
      "",
    ]);
    rows.push(["", "", "", "", "", "", "", "", "", "", "", ""]);

    // Cost Centre Total
    rows.push([
      "",
      "",
      "",
      "",
      "",
      "Cost Centre Total :",
      "",
      ccCommitment,
      ccCentInvd,
      ccActual,
      "",
      "",
    ]);
    rows.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
    rows.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
  }

  // Grand totals
  rows.push([]);
  rows.push(["═══════════════════════════════════════════════════════════"]);

  let grandBudget = 0,
    grandCommitment = 0,
    grandCentInvd = 0,
    grandActual = 0;
  for (const ccDef of allCodes) {
    grandBudget += ccDef.budget || 0;
    const data = allTransactions[ccDef.code];
    if (data) {
      for (const txn of data.transactions) {
        grandCommitment = round2(grandCommitment + txn.commitment);
        grandCentInvd = round2(grandCentInvd + txn.centInvd);
        grandActual = round2(grandActual + txn.actual);
      }
    }
  }
  // Add balance b/fwd budget (it's 0 in definition but has actual)
  rows.push([
    "",
    "",
    "",
    "GRAND TOTAL",
    "",
    "",
    "",
    grandCommitment,
    grandCentInvd,
    grandActual,
    "",
    "",
  ]);
  rows.push([
    "",
    "",
    "",
    `Total Budget: ${grandBudget.toLocaleString("en-GB")}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push([
    "",
    "",
    "",
    `Variance (Budget - Actual): ${round2(grandBudget - grandActual).toLocaleString("en-GB")}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  return rows;
}

// ──────────────────────────────────────────────
// 11.  PREVIOUS YEAR (2024/25) — Summary Only
// ──────────────────────────────────────────────

function buildPreviousYearSummary() {
  seededRandom(1337); // different seed for last year

  const rows = [];
  rows.push(["Detailed Cost Centre Transaction Report"]);
  rows.push([]);
  rows.push([]);
  rows.push(["Financial Year - 2024/25"]);
  rows.push([]);
  rows.push(["Report Date: 30/04/2025"]);
  rows.push(["Report Time: 09:15"]);
  rows.push([]);
  rows.push(["Fund: School Budget"]);
  rows.push(["Cost Centre: All"]);
  rows.push([]);
  rows.push([]);
  rows.push([
    "User : SB",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Establishment : Aurora Primary School",
  ]);
  rows.push([]);
  rows.push([]);
  rows.push([
    "Cost Centre",
    "Cost Centre Name",
    "CFR Code",
    "Budget",
    "Actual",
    "Variance",
    "% Spent",
  ]);
  rows.push([]);

  const allCodes = [
    ...EXPENDITURE_COST_CENTRES,
    ...INCOME_COST_CENTRES,
    BALANCE_BFWD,
  ];

  let totalBudget = 0;
  let totalActual = 0;

  for (const cc of allCodes) {
    // Previous year: slightly different budgets (3-5% less, it was a smaller budget)
    const prevBudget = round2(cc.budget * jitter(0.96, 0.02));
    // Actual close to budget with small variance
    let prevActual;
    if (cc.code === "8805001") {
      // Balance b/fwd last year was different
      prevActual = -52180; // smaller surplus carried in
    } else {
      prevActual = round2(prevBudget * jitter(1.0, 0.04));
    }
    const variance = round2(prevBudget - prevActual);
    const pctSpent =
      prevBudget !== 0 ? round2((prevActual / prevBudget) * 100) : 0;

    rows.push([
      cc.code,
      cc.name,
      cc.cfr,
      prevBudget,
      prevActual,
      variance,
      pctSpent,
    ]);

    totalBudget = round2(totalBudget + prevBudget);
    totalActual = round2(totalActual + prevActual);
  }

  rows.push([]);
  rows.push([
    "",
    "TOTAL",
    "",
    totalBudget,
    totalActual,
    round2(totalBudget - totalActual),
    totalBudget !== 0 ? round2((totalActual / totalBudget) * 100) : 0,
  ]);

  // Closing balance carried forward
  rows.push([]);
  rows.push([
    "",
    "Closing Balance (carried forward to 2025/26):",
    "",
    "",
    -67432,
    "",
    "",
  ]);

  return rows;
}

// ──────────────────────────────────────────────
// 12.  THREE-YEAR FORWARD PROJECTION
// ──────────────────────────────────────────────

function buildThreeYearProjection() {
  seededRandom(9999);

  const rows = [];
  rows.push(["Aurora Primary School — 3-Year Budget Projection"]);
  rows.push([]);
  rows.push(["Prepared: 15/12/2025"]);
  rows.push([
    "Basis: Current year actuals + known commitments, CPI inflation applied to non-staff",
  ]);
  rows.push([]);
  rows.push([
    "CFR Code",
    "Description",
    "2024/25 Actual",
    "2025/26 Budget",
    "2025/26 Forecast",
    "2026/27 Projected",
    "2027/28 Projected",
  ]);
  rows.push([]);

  // Inflation assumptions
  const staffInflation = 1.03; // 3% pay award
  const nonStaffInflation = 1.04; // 4% CPI
  const incomeInflation = 1.02; // 2% funding increase

  const summaryLines = [];

  // Expenditure section
  rows.push(["", "EXPENDITURE", "", "", "", "", ""]);
  rows.push([]);

  let totalExpPrev = 0,
    totalExpBudget = 0,
    totalExpForecast = 0,
    totalExpY2 = 0,
    totalExpY3 = 0;

  for (const cc of EXPENDITURE_COST_CENTRES) {
    const prevActual = round2(cc.budget * jitter(0.96, 0.03));
    const forecast = round2(cc.budget * (9 / 12) * jitter(1.0, 0.05)); // 9 months actual extrapolated
    const fullYearForecast = round2(forecast * (12 / 9));

    const isStaff = PAYROLL_CODES.has(cc.code);
    const inflator = isStaff ? staffInflation : nonStaffInflation;

    const y2 = round2(fullYearForecast * inflator);
    const y3 = round2(y2 * inflator);

    rows.push([
      cc.cfr,
      cc.name,
      prevActual,
      cc.budget,
      fullYearForecast,
      y2,
      y3,
    ]);

    totalExpPrev += prevActual;
    totalExpBudget += cc.budget;
    totalExpForecast += fullYearForecast;
    totalExpY2 += y2;
    totalExpY3 += y3;
  }

  rows.push([]);
  rows.push([
    "",
    "Total Expenditure",
    round2(totalExpPrev),
    round2(totalExpBudget),
    round2(totalExpForecast),
    round2(totalExpY2),
    round2(totalExpY3),
  ]);

  // Income section
  rows.push([]);
  rows.push(["", "INCOME", "", "", "", "", ""]);
  rows.push([]);

  let totalIncPrev = 0,
    totalIncBudget = 0,
    totalIncForecast = 0,
    totalIncY2 = 0,
    totalIncY3 = 0;

  for (const cc of INCOME_COST_CENTRES) {
    const prevActual = round2(cc.budget * jitter(0.97, 0.03));
    // Forecast based on what's actually been received
    const forecast = round2(cc.budget * jitter(0.85, 0.1)); // some income missing
    const y2 = round2(cc.budget * incomeInflation);
    const y3 = round2(y2 * incomeInflation);

    rows.push([cc.cfr, cc.name, prevActual, cc.budget, forecast, y2, y3]);

    totalIncPrev += prevActual;
    totalIncBudget += cc.budget;
    totalIncForecast += forecast;
    totalIncY2 += y2;
    totalIncY3 += y3;
  }

  rows.push([]);
  rows.push([
    "",
    "Total Income",
    round2(totalIncPrev),
    round2(totalIncBudget),
    round2(totalIncForecast),
    round2(totalIncY2),
    round2(totalIncY3),
  ]);

  // Net position
  rows.push([]);
  rows.push(["", "═══════════════════════════════════", "", "", "", "", ""]);
  rows.push([
    "",
    "In-Year Balance (Income - Expenditure)",
    round2(totalIncPrev + totalExpPrev), // income is negative, so adding gives net
    round2(totalIncBudget + totalExpBudget),
    round2(totalIncForecast + totalExpForecast),
    round2(totalIncY2 + totalExpY2),
    round2(totalIncY3 + totalExpY3),
  ]);

  // Cumulative balance
  const bfwd = 67432;
  const y1Net = round2(totalIncBudget + totalExpBudget); // planned
  const y1Forecast = round2(totalIncForecast + totalExpForecast);
  const y2Net = round2(totalIncY2 + totalExpY2);
  const y3Net = round2(totalIncY3 + totalExpY3);

  rows.push([
    "",
    "Balance Brought Forward",
    52180,
    bfwd,
    bfwd,
    round2(bfwd - y1Forecast),
    round2(bfwd - y1Forecast - y2Net),
  ]);
  rows.push([
    "",
    "Cumulative Balance",
    round2(52180 + totalIncPrev + totalExpPrev),
    round2(bfwd + y1Net),
    round2(bfwd - y1Forecast),
    round2(bfwd - y1Forecast - y2Net),
    round2(bfwd - y1Forecast - y2Net - y3Net),
  ]);

  rows.push([]);
  rows.push([]);
  rows.push(["ASSUMPTIONS:"]);
  rows.push(["", "Staff costs: 3.0% annual increase (pay award)"]);
  rows.push(["", "Non-staff costs: 4.0% annual increase (CPI)"]);
  rows.push(["", "Income: 2.0% annual increase (funding settlement)"]);
  rows.push(["", "Pupil numbers: assumed stable at 420"]);
  rows.push(["", "No new grants or one-off income assumed"]);
  rows.push([]);
  rows.push(["NOTES:"]);
  rows.push([
    "",
    "2025/26 forecast based on 9 months actual, extrapolated to full year",
  ]);
  rows.push([
    "",
    "Known outstanding income not yet posted: ~£62K (PP Q2+Q3, SEN Spring, PE Premium, Insurance, Secondment)",
  ]);
  rows.push([
    "",
    "If all outstanding income is received, 2025/26 forecast improves by ~£62K",
  ]);

  return rows;
}

// ──────────────────────────────────────────────
// 13.  WRITE FILES
// ──────────────────────────────────────────────

function writeExcel(rows, filePath, sheetName) {
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for readability
  ws["!cols"] = [
    { wch: 8 }, // Type / Cost Centre
    { wch: 8 }, // Period
    { wch: 12 }, // Date
    { wch: 55 }, // Details
    { wch: 4 }, // blank
    { wch: 4 }, // blank
    { wch: 4 }, // blank
    { wch: 14 }, // Commitment
    { wch: 14 }, // Cent. Inv'd
    { wch: 14 }, // Actual
    { wch: 16 }, // Trans. Status
    { wch: 12 }, // Year Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filePath);
  console.log(`  Written: ${filePath}`);
}

function main() {
  console.log("Aurora Primary School — FMS Finance Test Data Generator");
  console.log("========================================================\n");

  // Ensure output directory exists
  mkdirSync(BASE, { recursive: true });

  // --- File 1: Current Year Detailed Report ---
  console.log("Generating 2025/26 detailed cost centre report...");
  const currentYear = buildDetailedReport2526();
  const currentRows = buildDetailedExcel(currentYear, "2025/26");
  writeExcel(
    currentRows,
    join(BASE, "fms_detailed_cost_centre_2025-26.xlsx"),
    "Detailed 2025-26",
  );

  // --- File 2: Previous Year Summary ---
  console.log("Generating 2024/25 summary report...");
  const prevRows = buildPreviousYearSummary();
  writeExcel(
    prevRows,
    join(BASE, "fms_detailed_cost_centre_2024-25.xlsx"),
    "Summary 2024-25",
  );

  // --- File 3: 3-Year Forward Projection ---
  console.log("Generating 3-year budget projection...");
  const projRows = buildThreeYearProjection();
  writeExcel(
    projRows,
    join(BASE, "fms_budget_summary_3yr.xlsx"),
    "3-Year Projection",
  );

  // --- Summary ---
  console.log("\n✓ All files generated in:");
  console.log(`  ${BASE}/\n`);

  // Print scenario summary
  console.log("Embedded Scenarios:");
  console.log("───────────────────");
  console.log(
    "Scenario A: FMS shows apparent deficit, but ~£62K income is expected but not posted:",
  );
  console.log("  • Pupil Premium Q2+Q3: £41,000 (overdue/not due)");
  console.log("  • SEN Spring top-up: £15,000 (not yet posted)");
  console.log("  • PE/Sport premium: £16,000 (not posted, usually October)");
  console.log("  • Insurance claim: £6,200 (submitted Sept, awaiting payment)");
  console.log("  = £78,200 total expected but not in FMS actuals");
  console.log("");
  console.log("Scenario B: Gas appears overspent but is seasonal:");
  console.log("  • Budget set flat (£2,333/month) but actual is seasonal");
  console.log("  • Q1+Q2 low (summer): ~£2,800. Q3 high (winter): ~£11,000");
  console.log("  • Looks alarming in Dec but full-year is on track");
  console.log("");
  console.log(
    "Scenario C: Staff secondment — salary paid but recharge not posted:",
  );
  console.log("  • Teacher seconded since September, £4,500/month");
  console.log(
    "  • 4 months x £4,500 = £18,000 salary paid, £0 recharge received",
  );
  console.log(
    "  • Full recharge (£31,500 for Sep-Mar) raised as PO but not invoiced",
  );
  console.log("");
}

main();
