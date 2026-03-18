#!/usr/bin/env node
/**
 * Test the finance import API — the ACTUAL route a school would use.
 * 
 * 1. Reads the FMS spreadsheet file
 * 2. POSTs it to /api/finance/import (dry_run first, then real)
 * 3. Reports what happened
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const BASE_URL = "http://localhost:3002";
const FMS_FILE = join(__dirname, "..", "test-harness", "aurora-primary", "fms-exports", "fms_detailed_cost_centre_2025-26.xlsx");

// Get an auth token for the test user
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = "c64ed86b-9eab-49ee-9829-0706ff371083";

async function getAuthToken() {
  // Sign in as test user
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "ui-test@schoolgle.co.uk",
    password: process.env.TEST_USER_PASSWORD || "test-password-123"
  });
  if (error) {
    console.error("Auth failed:", error.message);
    // Try with service role token approach instead
    return null;
  }
  return data.session?.access_token;
}

async function importViaAPI(dryRun = false) {
  const fileBuffer = readFileSync(FMS_FILE);
  const blob = new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  const formData = new FormData();
  formData.append("file", blob, "fms_detailed_cost_centre_2025-26.xlsx");
  formData.append("financial_year", "2025-26");
  if (dryRun) formData.append("dry_run", "true");

  const token = await getAuthToken();
  
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}/api/finance/import?organizationId=${ORG_ID}`;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${dryRun ? "DRY RUN" : "REAL IMPORT"}: POST ${url}`);
  console.log(`${"=".repeat(60)}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
    });
    
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(json, null, 2));
    return json;
  } catch (err) {
    console.error("Fetch failed:", err.message);
    console.error("Is the dev server running on port 3002?");
    return null;
  }
}

async function main() {
  // Step 1: Dry run
  console.log("Step 1: Dry run (validate without importing)...");
  const dryResult = await importViaAPI(true);
  
  if (!dryResult) {
    console.error("\nDry run failed. Make sure the dev server is running: npm run dev");
    process.exit(1);
  }

  if (dryResult.error) {
    console.error("\nDry run returned error:", dryResult.error);
    if (dryResult.data?.issues) {
      console.log("Validation issues:", JSON.stringify(dryResult.data.issues, null, 2));
    }
    process.exit(1);
  }

  console.log("\nDry run passed. Proceeding to real import...\n");

  // Step 2: Real import
  const result = await importViaAPI(false);

  if (!result || result.error) {
    console.error("Import failed:", result?.error);
    process.exit(1);
  }

  console.log("\n✓ Import complete!");
  
  // Step 3: Verify in database
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

  console.log(`\n─── Database Verification ───`);
  console.log(`  Transactions: ${txnCount}`);
  console.log(`  Budget lines: ${blCount}`);
  console.log(`  Suppliers: ${supCount}`);
}

main().catch(console.error);
