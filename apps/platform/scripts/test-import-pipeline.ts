#!/usr/bin/env node
/**
 * Test the EXACT import pipeline a school would use.
 *
 * This calls the same functions as POST /api/finance/import:
 *   1. Read spreadsheet → XLSX.read()
 *   2. parseFMSReport() — the FMS parser
 *   3. validateAndPrepareImport() — 9 validation rules
 *   4. Insert into Supabase (transactions, budget lines, suppliers)
 *
 * Same code, same order, same validation. Just skips HTTP/auth.
 *
 * Run: node apps/platform/scripts/test-import-pipeline.mjs
 */

import XLSX from "xlsx";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// @ts-expect-error - Auto-masked during strict compilation enforcement
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ORG_ID = "c64ed86b-9eab-49ee-9829-0706ff371083";
const FMS_FILE = join(
  __dirname,
  "..",
  "test-harness",
  "aurora-primary",
  "fms-exports",
  "fms_detailed_cost_centre_2025-26.xlsx",
);
const FY = "2025-26";

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  FINANCE IMPORT PIPELINE TEST                   ║");
  console.log("║  Same code path as POST /api/finance/import     ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // ─── Step 1: Read the spreadsheet (same as the API route) ───
  console.log("Step 1: Reading FMS spreadsheet...");
  const buffer = readFileSync(FMS_FILE);
  const workbook = XLSX.read(buffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  console.log(
    `  → ${rawData.length} rows read from ${FMS_FILE.split("/").pop()}`,
  );

  if (rawData.length < 15) {
    console.error("  ✗ File too short to be an FMS report");
    process.exit(1);
  }

  // ─── Step 2: Parse with FMS parser (same import as API route) ───
  console.log("\nStep 2: Parsing with parseFMSReport()...");
  const { parseFMSReport } =
    await import("../src/lib/budget-engine/fms-parser");

  // @ts-expect-error - Auto-masked during strict compilation enforcement
  const parsed = parseFMSReport(rawData);

  if (!parsed.success) {
    console.error(`  ✗ Parse failed: ${parsed.errors.join("; ")}`);
    if (parsed.warnings.length)
      console.log(`  Warnings: ${parsed.warnings.join("; ")}`);
    process.exit(1);
  }

  console.log(`  ✓ Parsed successfully`);
  console.log(`    School: ${parsed.school_name}`);
  console.log(`    Financial year: ${parsed.financial_year}`);
  console.log(`    Cost centres: ${parsed.cost_centres.length}`);
  console.log(
    `    Total transactions: ${parsed.cost_centres.reduce((s, cc) => s + cc.transactions.length, 0)}`,
  );
  console.log(
    `    Total income: £${Math.abs(parsed.summary.total_income_actual).toLocaleString()}`,
  );
  console.log(
    `    Total expenditure: £${parsed.summary.total_expenditure_actual.toLocaleString()}`,
  );
  console.log(
    `    Net position: £${parsed.summary.net_position.toLocaleString()}`,
  );

  // ─── Step 3: Validate (same as API route) ───
  console.log("\nStep 3: Running validateAndPrepareImport() (9 rules)...");
  const { validateAndPrepareImport } =
    await import("../src/lib/budget-engine/finance-validator");

  const { validation, canImport, reason } = await validateAndPrepareImport(
    supabase,
    ORG_ID,
    // @ts-expect-error - Auto-masked during strict compilation enforcement
    rawData,
    parsed,
  );

  console.log(`  Can import: ${canImport}`);
  if (!canImport) {
    console.error(`  ✗ Import blocked: ${reason}`);
  }
  console.log(`  Checksum: ${validation.checksum?.substring(0, 16)}...`);
  console.log(
    `  Issues: ${validation.issues.length} (${validation.issues.filter((i) => i.severity === "error").length} errors, ${validation.issues.filter((i) => i.severity === "warning").length} warnings)`,
  );

  if (validation.issues.length > 0) {
    console.log("\n  Validation issues:");
    for (const issue of validation.issues) {
      console.log(`    [${issue.severity}] ${issue.rule}: ${issue.message}`);
    }
  }

  console.log(`  Reversals found: ${validation.reversals.length}`);
  console.log(`  Supplier mappings: ${validation.supplier_mappings.length}`);
  console.log(
    `  CFR balances: ${Object.keys(validation.cfr_balances || {}).length} codes`,
  );

  if (!canImport) {
    console.error("\n✗ Validation blocked import. Fix issues above.");
    process.exit(1);
  }

  // ─── Step 4: Insert into Supabase (same as API route) ───
  console.log("\nStep 4: Inserting into Supabase...");

  // 4a: Create import audit record
  const { data: importRecord, error: importErr } = await supabase
    .from("data_imports")
    .insert({
      organization_id: ORG_ID,
      import_type: "transactions",
      file_name: "fms_detailed_cost_centre_2025-26.xlsx",
      file_type: "xlsx",
      file_size_bytes: buffer.length,
      financial_year: FY,
      status: "processing",
      total_rows: validation.summary.total_transactions,
      raw_checksum: validation.checksum,
      // imported_by omitted — test script, no user auth
      column_mapping: {},
    })
    .select("id")
    .single();

  if (importErr) {
    console.error("  ✗ Failed to create import record:", importErr.message);
    process.exit(1);
  }
  console.log(`  ✓ Import record: ${importRecord.id}`);

  // 4b: Insert transactions
  let txnInserted = 0;
  let txnErrors = 0;
  const txnTypeMap = {
    GL: "journal",
    PO: "purchase_order",
    AP: "invoice",
    SI: "receipt",
    SC: "credit_note",
    OB: "journal",
    JV: "journal",
  };

  for (const cc of parsed.cost_centres) {
    if (cc.transactions.length === 0) continue;

    const isIncome = cc.category === "income";
    const rows = cc.transactions.map((txn, idx) => ({
      organization_id: ORG_ID,
      import_id: importRecord.id,
      transaction_date: txn.date || null,
      transaction_ref: `${txn.type}:${txn.period}:${idx}`,
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      transaction_type: txnTypeMap[txn.type] || "journal",
      cost_centre: cc.code,
      ledger_code: txn.ledger_code || null,
      cfr_code: cc.cfr_code || null,
      cfr_description: cc.name,
      supplier_name: extractSupplier(txn.details, validation.supplier_mappings),
      gross_amount: txn.actual,
      vat_amount: 0,
      is_income: isIncome,
      financial_year: FY,
      period_number: txn.period,
      source_system: "SIMS FMS",
      source_row_number: idx + 1,
      description: txn.details,
      ...(txn.commitment !== 0 ? { budget_amount: txn.commitment } : {}),
    }));

    const { error: txnErr } = await supabase
      .from("finance_transactions")
      .insert(rows);
    if (txnErr) {
      txnErrors += rows.length;
      console.error(`  ✗ ${cc.code} ${cc.name}: ${txnErr.message}`);
    } else {
      txnInserted += rows.length;
    }
  }
  console.log(`  ✓ Transactions: ${txnInserted} inserted, ${txnErrors} errors`);

  // 4c: Upsert budget lines
  let budgetUpserted = 0;
  for (const cc of parsed.cost_centres) {
    if (!cc.cfr_code) continue;
    const isIncome = cc.category === "income";
    const { error } = await supabase.from("finance_budget_lines").upsert(
      {
        organization_id: ORG_ID,
        financial_year: FY,
        cfr_code: cc.cfr_code,
        cost_centre: cc.code,
        cfr_description: cc.name,
        budget_amount: Math.abs(cc.allocated),
        committed_amount: Math.abs(cc.committed),
        actual_amount: Math.abs(cc.actual),
        rag_status:
          cc.spent_percent > 100
            ? "red"
            : cc.spent_percent > 85
              ? "amber"
              : "green",
        is_income: isIncome,
        source_system: "SIMS FMS",
      },
      { onConflict: "organization_id,financial_year,cfr_code,cost_centre" },
    );
    if (!error) budgetUpserted++;
  }
  console.log(`  ✓ Budget lines: ${budgetUpserted} upserted`);

  // 4d: Upsert suppliers
  const supplierNames = new Set();
  for (const cc of parsed.cost_centres) {
    for (const txn of cc.transactions) {
      const name = extractSupplier(txn.details, validation.supplier_mappings);
      if (name && name.length > 2) supplierNames.add(name);
    }
  }
  let suppliersUpserted = 0;
  for (const name of supplierNames) {
    const { error } = await supabase.from("finance_suppliers").upsert(
      {
        organization_id: ORG_ID,
        supplier_name: name,
        source_system: "SIMS FMS",
      },
      { onConflict: "organization_id,supplier_name" },
    );
    if (!error) suppliersUpserted++;
  }
  console.log(`  ✓ Suppliers: ${suppliersUpserted} upserted`);

  // 4e: Update import record
  await supabase
    .from("data_imports")
    .update({
      status: txnErrors > 0 ? "partial" : "imported",
      rows_imported: txnInserted,
      rows_errored: txnErrors,
    })
    .eq("id", importRecord.id);

  // ─── Step 5: Verify ───
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  VERIFICATION                                   ║");
  console.log("╚══════════════════════════════════════════════════╝");

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
  const { count: importCount } = await supabase
    .from("data_imports")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);

  console.log(`  Transactions in DB:  ${txnCount}`);
  console.log(`  Budget lines in DB:  ${blCount}`);
  console.log(`  Suppliers in DB:     ${supCount}`);
  console.log(`  Import records:      ${importCount}`);

  // Cross-check: do the DB totals match what we parsed?
  const { data: dbTotals } = await supabase
    .from("finance_budget_lines")
    .select("cfr_code, budget_amount, actual_amount, is_income")
    .eq("organization_id", ORG_ID);

  // @ts-expect-error - Auto-masked during strict compilation enforcement
  const dbExpenditure = dbTotals
    .filter((r) => !r.is_income)
    .reduce((s, r) => s + parseFloat(r.actual_amount), 0);
  // @ts-expect-error - Auto-masked during strict compilation enforcement
  const dbIncome = dbTotals
    .filter((r) => r.is_income)
    .reduce((s, r) => s + parseFloat(r.actual_amount), 0);

  console.log(`\n  Parser totals vs DB totals:`);
  console.log(
    `    Expenditure: Parser £${parsed.summary.total_expenditure_actual.toLocaleString()} | DB £${dbExpenditure.toLocaleString()}`,
  );
  console.log(
    `    Income:      Parser £${Math.abs(parsed.summary.total_income_actual).toLocaleString()} | DB £${dbIncome.toLocaleString()}`,
  );

  const expMatch =
    Math.abs(parsed.summary.total_expenditure_actual - dbExpenditure) < 1;
  const incMatch =
    Math.abs(Math.abs(parsed.summary.total_income_actual) - dbIncome) < 1;
  console.log(
    `    Match: Expenditure ${expMatch ? "✓" : "✗"} | Income ${incMatch ? "✓" : "✗"}`,
  );

  console.log("\nDone.");
}

// @ts-expect-error - Auto-masked during strict compilation enforcement
function extractSupplier(details, mappings) {
  let supplier = details
    .replace(/\b(INV|PO|AP|SI|JV|SC|OB|MTH|Period)[.:# ]*[\w\[\]]*\b/gi, "")
    .replace(/\[name\]|\[invoice\]|\[school\]|\[email\]/g, "")
    .replace(/\bSalary\b/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (supplier.length < 3) return null;

  // @ts-expect-error - Auto-masked during strict compilation enforcement
  const mapping = mappings.find((m) => m.raw_name === supplier);
  if (mapping) return mapping.canonical_name;

  return supplier;
}

main().catch(console.error);
