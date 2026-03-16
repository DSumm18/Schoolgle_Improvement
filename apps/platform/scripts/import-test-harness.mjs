#!/usr/bin/env node
/**
 * Import FMS Test Harness into Supabase
 *
 * Reads the generated FMS spreadsheet, parses it through the FMS parser,
 * and inserts all transactions + budget lines into Supabase finance tables.
 *
 * Run:  node apps/platform/scripts/import-test-harness.mjs
 */

import XLSX from "xlsx";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from apps/platform/.env.local
config({ path: join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ORG_ID = "c64ed86b-9eab-49ee-9829-0706ff371083"; // Aurora Primary
const FY = "2025-26";
const FMS_FILE = join(
  __dirname,
  "..",
  "test-harness",
  "aurora-primary",
  "fms-exports",
  "fms_detailed_cost_centre_2025-26.xlsx",
);

// ─── Excel date conversion ─────────────────────
const EXCEL_EPOCH = new Date(1899, 11, 30);
function excelSerialToDate(serial) {
  if (!serial || typeof serial !== "number") return null;
  const d = new Date(EXCEL_EPOCH.getTime() + serial * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

// ─── CFR mapping ────────────────────────────────
const CFR_MAP = {
  1101001: { cfr: "E01", desc: "Teaching Staff", category: "staff" },
  1102001: { cfr: "E02", desc: "Supply Teaching Staff", category: "staff" },
  1103001: { cfr: "E03", desc: "Education Support Staff", category: "staff" },
  1106001: { cfr: "E05", desc: "Admin & Clerical Staff", category: "staff" },
  1107001: { cfr: "E03", desc: "Teaching Assistants", category: "staff" },
  1108001: { cfr: "E07", desc: "Midday Supervisors", category: "staff" },
  1110001: { cfr: "E04", desc: "Premises Staff", category: "staff" },
  1111001: { cfr: "E14", desc: "Cleaners", category: "staff" },
  1115001: { cfr: "E11", desc: "Staff Insurance", category: "staff" },
  1117001: { cfr: "E08", desc: "Staff Travel", category: "staff" },
  1118001: { cfr: "E09", desc: "Training & Recruitment", category: "staff" },
  2201001: { cfr: "E12", desc: "Building Repairs", category: "premises" },
  2202001: { cfr: "E13", desc: "Grounds Maintenance", category: "premises" },
  2204001: { cfr: "E14", desc: "Cleaning Materials", category: "premises" },
  2220001: { cfr: "E18", desc: "Security", category: "premises" },
  3303001: { cfr: "E16", desc: "Gas", category: "utilities" },
  3304001: { cfr: "E16", desc: "Electricity", category: "utilities" },
  3305001: { cfr: "E15", desc: "Water & Sewerage", category: "utilities" },
  4401001: { cfr: "E20", desc: "ICT", category: "resources" },
  4402001: { cfr: "E22", desc: "Photocopier", category: "resources" },
  4403001: { cfr: "E19", desc: "Furniture & Equipment", category: "resources" },
  4410001: { cfr: "E19", desc: "Learning Resources", category: "resources" },
  4412001: {
    cfr: "E19",
    desc: "Curriculum Development",
    category: "resources",
  },
  5502001: { cfr: "E22", desc: "Communications", category: "services" },
  5505001: { cfr: "E28a", desc: "Bought-in Services", category: "services" },
  5508001: { cfr: "E24", desc: "Educational Visits", category: "services" },
  5527001: { cfr: "E21", desc: "Exam Fees", category: "services" },
  5529001: { cfr: "E23", desc: "Insurance Premiums", category: "services" },
  5537001: { cfr: "E25", desc: "Contract Catering", category: "services" },
  7703001: { cfr: "I08a", desc: "Lettings", category: "income" },
  7705001: { cfr: "I07", desc: "Other Income", category: "income" },
  7707001: { cfr: "I10", desc: "Insurance Claims", category: "income" },
  7711001: { cfr: "I07", desc: "Training Income", category: "income" },
  7721001: { cfr: "I09", desc: "Catering Income", category: "income" },
  7731001: { cfr: "I03", desc: "SEN Top-Up Funding", category: "income" },
  7734001: {
    cfr: "I01",
    desc: "School Budget Share (DSG)",
    category: "income",
  },
  7750001: { cfr: "I05", desc: "Pupil Premium Grant", category: "income" },
  7751001: { cfr: "I06", desc: "Government Grants", category: "income" },
  8805001: { cfr: "B01", desc: "Balance b/fwd", category: "balance" },
};

const TXN_TYPE_MAP = {
  GL: "journal",
  PO: "purchase_order",
  AP: "invoice",
  SI: "receipt",
  SC: "credit_note",
  OB: "journal",
  JV: "journal",
};

// ─── Parse the FMS spreadsheet ──────────────────
function parseFMSSpreadsheet(filePath) {
  console.log(`Reading ${filePath}...`);
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Raw rows: ${rawData.length}`);

  const transactions = [];
  const budgetSummary = {}; // costCentre -> { budget, committed, actual }
  let currentCC = null;
  let currentCCName = null;
  let rowIdx = 0;

  for (const row of rawData) {
    rowIdx++;
    if (!row || row.length === 0) continue;

    const cell0 = String(row[0] || "").trim();

    // Detect cost centre header: "Cost Centre : 1101001 Teaching Staff"
    const ccMatch = cell0.match(/^Cost Centre\s*:\s*(\d{7})\s+(.+)/);
    if (ccMatch) {
      currentCC = ccMatch[1];
      currentCCName = ccMatch[2].trim();

      if (!budgetSummary[currentCC]) {
        budgetSummary[currentCC] = {
          name: currentCCName,
          allocated: 0,
          committed: 0,
          actual: 0,
          balance: 0,
        };
      }
      continue;
    }

    // Detect allocation header row — values are in the NEXT row
    // Header: ["Allocated","Committed","","Cent. Inv'd","Actual","Balance","Spent %","Threshold %"]
    // Values: [980000, 0, "", 0, 651566.4, 328433.6, 66.49, 100]
    if (
      currentCC &&
      cell0 === "Allocated" &&
      String(row[1] || "").includes("Committed")
    ) {
      const nextRow = rawData[rowIdx]; // rowIdx is 1-based, so rawData[rowIdx] is the next row
      if (nextRow && typeof nextRow[0] === "number") {
        budgetSummary[currentCC].allocated = nextRow[0] || 0;
        budgetSummary[currentCC].committed = nextRow[1] || 0;
        budgetSummary[currentCC].actual = nextRow[4] || 0;
        budgetSummary[currentCC].balance = nextRow[5] || 0;
      }
      continue;
    }

    // Detect transaction rows: type is GL, PO, AP, SI, SC
    if (
      currentCC &&
      ["GL", "PO", "AP", "SI", "SC", "OB", "JV"].includes(cell0)
    ) {
      const period = parseInt(row[1]) || 0;
      const dateVal = row[2];
      const details = String(row[3] || "").trim();
      const commitment = parseFloat(row[7]) || 0;
      const centInvd = parseFloat(row[8]) || 0;
      const actual = parseFloat(row[9]) || 0;
      const transStatus = String(row[10] || "").trim();
      const yearStatus = String(row[11] || "").trim();

      // Extract supplier from details
      let supplier = null;
      // PO/AP lines: "PO-12345 SUPPLIER NAME" or "INV-123456 SUPPLIER NAME"
      const supplierMatch = details.match(/(?:PO-\d+|INV-\d+)\s+(.+)/);
      if (supplierMatch) {
        supplier = supplierMatch[1].replace(/\s*-\s*.*$/, "").trim(); // Remove trailing description
      }

      transactions.push({
        cost_centre: currentCC,
        cost_centre_name: currentCCName,
        type: cell0,
        period,
        date: excelSerialToDate(dateVal),
        details,
        commitment,
        centrally_invoiced: centInvd,
        actual,
        trans_status: transStatus,
        year_status: yearStatus,
        supplier,
        row_number: rowIdx,
      });
    }
  }

  return { transactions, budgetSummary };
}

// ─── Main ───────────────────────────────────────
async function main() {
  const { transactions, budgetSummary } = parseFMSSpreadsheet(FMS_FILE);

  console.log(
    `\nParsed: ${transactions.length} transactions across ${Object.keys(budgetSummary).length} cost centres\n`,
  );

  // Show summary
  for (const [cc, summary] of Object.entries(budgetSummary)) {
    const mapping = CFR_MAP[cc];
    const cfr = mapping ? mapping.cfr : "???";
    console.log(
      `  ${cc} (${cfr}) ${summary.name}: Budget £${summary.allocated.toLocaleString()}, Actual £${summary.actual.toLocaleString()}, Committed £${summary.committed.toLocaleString()}`,
    );
  }

  // Step 1: Clear existing data
  console.log("\nClearing existing finance data for Aurora Primary...");
  await supabase
    .from("finance_transactions")
    .delete()
    .eq("organization_id", ORG_ID);
  await supabase
    .from("finance_budget_lines")
    .delete()
    .eq("organization_id", ORG_ID);
  await supabase
    .from("finance_suppliers")
    .delete()
    .eq("organization_id", ORG_ID);

  // Step 2: Insert budget lines from the parsed summary
  console.log("Inserting budget lines...");
  const budgetRows = [];
  for (const [cc, summary] of Object.entries(budgetSummary)) {
    const mapping = CFR_MAP[cc];
    if (!mapping) {
      console.log(
        `  WARNING: No CFR mapping for cost centre ${cc} (${summary.name})`,
      );
      continue;
    }

    const isIncome =
      mapping.category === "income" || mapping.category === "balance";

    budgetRows.push({
      organization_id: ORG_ID,
      financial_year: FY,
      cfr_code: mapping.cfr,
      cfr_description: summary.name,
      cost_centre: cc,
      budget_amount: Math.abs(summary.allocated),
      committed_amount: Math.abs(summary.committed),
      actual_amount: Math.abs(summary.actual),
      rag_status: isIncome
        ? "green"
        : Math.abs(summary.actual) / Math.abs(summary.allocated || 1) > 1.0
          ? "red"
          : Math.abs(summary.actual) / Math.abs(summary.allocated || 1) > 0.85
            ? "amber"
            : "green",
      is_income: isIncome,
      source_system: "SIMS FMS",
    });
  }

  const { error: blErr, data: blData } = await supabase
    .from("finance_budget_lines")
    .insert(budgetRows);

  if (blErr) {
    console.error("Budget lines insert error:", blErr.message);
  } else {
    console.log(`  Inserted ${budgetRows.length} budget lines`);
  }

  // Step 3: Insert transactions
  console.log("Inserting transactions...");
  const txnRows = transactions.map((txn, idx) => {
    const mapping = CFR_MAP[txn.cost_centre];
    const isIncome =
      mapping &&
      (mapping.category === "income" || mapping.category === "balance");

    return {
      organization_id: ORG_ID,
      transaction_date: txn.date,
      transaction_ref: `${txn.type}:${txn.period}:${idx}`,
      transaction_type: TXN_TYPE_MAP[txn.type] || "journal",
      cost_centre: txn.cost_centre,
      cfr_code: mapping ? mapping.cfr : null,
      cfr_description: txn.cost_centre_name,
      gross_amount: txn.actual || txn.commitment,
      vat_amount: 0,
      is_income: !!isIncome,
      supplier_name: txn.supplier,
      description: txn.details,
      financial_year: FY,
      period_number: txn.period,
      source_system: "SIMS FMS",
      source_row_number: txn.row_number,
      // Store commitment in budget_amount field for PO lines
      ...(txn.commitment !== 0 ? { budget_amount: txn.commitment } : {}),
    };
  });

  // Insert in batches of 100
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < txnRows.length; i += 100) {
    const batch = txnRows.slice(i, i + 100);
    const { error: txnErr } = await supabase
      .from("finance_transactions")
      .insert(batch);

    if (txnErr) {
      console.error(
        `  Batch ${Math.floor(i / 100) + 1} error:`,
        txnErr.message,
      );
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }
  console.log(`  Inserted ${inserted} transactions (${errors} errors)`);

  // Step 4: Extract and insert unique suppliers
  console.log("Inserting suppliers...");
  const supplierNames = new Set();
  for (const txn of transactions) {
    if (txn.supplier && txn.supplier.length > 2) {
      supplierNames.add(txn.supplier);
    }
  }

  // Also extract supplier names from journal details (JV lines reference suppliers sometimes)
  for (const txn of transactions) {
    if (txn.details) {
      // Look for known supplier patterns
      const knownSuppliers = [
        "CLEANING SOLUTIONS LTD",
        "IT SERVICES CO",
        "MAINTENANCE PARTNERS LTD",
        "GREENSCAPE MAINTENANCE",
        "EDUCATIONAL RESOURCES LTD",
        "SCHOOL MEALS PROVIDER LTD",
        "GAS UTILITIES LTD",
        "ELECTRIC POWER CO",
        "EDUCATION INSURANCE BROKER LTD",
        "SECURITY SYSTEMS LTD",
        "CPD TRAINING PROVIDER",
        "REPROGRAPHICS LTD",
        "TELECOM SERVICES LTD",
        "LA TRADED SERVICES",
        "NEIGHBOURING PRIMARY ACADEMY",
        "TECH SOLUTIONS LTD",
        "DIGITAL LEARNING SUPPLIES",
        "OFFICE SUPPLIES LTD",
        "STATIONERY WORLD",
        "BUILDRIGHT SERVICES",
        "PROPERTY CARE CO",
        "LANDSCAPE SOLUTIONS LTD",
        "SCHOOL FURNISHINGS LTD",
        "CLASSROOM SOLUTIONS CO",
        "LEARNING MATERIALS CO",
        "CURRICULUM SUPPLIES LTD",
        "FRESH FOODS CATERING CO",
        "SCHOOL IMPROVEMENT PARTNERSHIP",
        "HR ADVISORY SERVICES LTD",
        "FINANCE SUPPORT SERVICES",
        "LEGAL SERVICES LLP",
        "AUDIT SERVICES LTD",
        "ENERGY SUPPLIER CO",
        "BROADBAND PROVIDER CO",
        "ALARM MONITORING CO",
        "PROFESSIONAL DEVELOPMENT CO",
        "SAFEGUARDING TRAINING LTD",
        "ADVENTURE LEARNING LTD",
        "OUTDOOR EDUCATION CO",
        "MUSEUM EDUCATION SERVICES",
        "COPY SOLUTIONS CO",
        "EXAMINATION BOARD SERVICES",
        "HYGIENE SUPPLIES UK",
        "SPARKLE SERVICES CO",
        "PAPER & PRINT CO",
      ];
      for (const s of knownSuppliers) {
        if (txn.details.includes(s)) {
          supplierNames.add(s);
        }
      }
    }
  }

  const supplierRows = Array.from(supplierNames).map((name) => ({
    organization_id: ORG_ID,
    supplier_name: name,
    source_system: "SIMS FMS",
  }));

  if (supplierRows.length > 0) {
    const { error: supErr } = await supabase
      .from("finance_suppliers")
      .insert(supplierRows);

    if (supErr) {
      console.error("Suppliers insert error:", supErr.message);
    } else {
      console.log(`  Inserted ${supplierRows.length} suppliers`);
    }
  }

  // Step 5: Final verification
  console.log("\n─── Verification ───");
  const { count: txnCount } = await supabase
    .from("finance_transactions")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);
  const { count: blCount } = await supabase
    .from("finance_budget_lines")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);
  const { count: supCount } = await supabase
    .from("finance_suppliers")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);

  console.log(`  Transactions: ${txnCount}`);
  console.log(`  Budget lines: ${blCount}`);
  console.log(`  Suppliers: ${supCount}`);
  console.log("\nDone.");
}

main().catch(console.error);
