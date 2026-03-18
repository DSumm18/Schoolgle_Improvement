/**
 * Finance Reconciliation API
 *
 * GET  /api/finance/reconcile — Get latest reconciliation status
 * POST /api/finance/reconcile — Trigger a new reconciliation against source spreadsheet
 *
 * The reconciliation compares what's in Supabase (finance_budget_lines,
 * finance_transactions) against the original FMS spreadsheet to ensure
 * the budget monitor reflects the school's actual data.
 *
 * POST accepts either:
 * - A file upload (re-reconcile against the provided spreadsheet)
 * - No file (re-read from the stored data_imports record and compare checksums/totals)
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const sp = request.nextUrl.searchParams;
  const financialYear = sp.get("financial_year");

  // Get latest reconciliation
  const { getLatestReconciliation } =
    await import("@/lib/budget-engine/reconciliation");
  const latest = await getLatestReconciliation(
    supabase,
    auth.organizationId,
    financialYear || undefined,
  );

  if (!latest) {
    return apiSuccess({
      has_reconciliation: false,
      message:
        "No reconciliation has been run yet. Import FMS data and run reconciliation.",
    });
  }

  // Also get the last import info
  let importQuery = supabase
    .from("data_imports")
    .select("id, file_name, created_at, rows_imported, raw_checksum, status")
    .eq("organization_id", auth.organizationId)
    .eq("import_type", "transactions")
    .order("created_at", { ascending: false })
    .limit(1);

  if (financialYear) {
    importQuery = importQuery.eq("financial_year", financialYear);
  }

  const { data: lastImport } = await importQuery;

  // Get full exception details from latest reconciliation
  const { data: fullRecon } = await supabase
    .from("finance_reconciliation_log")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .limit(1);

  return apiSuccess({
    has_reconciliation: true,
    reconciliation: latest,
    exceptions: fullRecon?.[0]?.exceptions || [],
    last_import: lastImport?.[0] || null,
  });
});

export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const supabase = createServiceRoleClient();

    // Check content type - could be multipart (file upload) or JSON
    const contentType = request.headers.get("content-type") || "";
    let rawData: unknown[][] | null = null;
    let financialYear: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      // File upload - re-reconcile against provided spreadsheet
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      financialYear = formData.get("financial_year") as string | null;

      if (file) {
        const XLSX = await import("xlsx");
        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rawData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
        }) as unknown[][];
      }
    } else {
      // JSON body - try to get financial_year
      try {
        const body = await request.json();
        financialYear = body.financial_year || null;
      } catch {
        // No body is fine
      }
    }

    // If no file provided, try to re-read from test harness / last import
    if (!rawData) {
      // Try reading the FMS file from the test harness (for Aurora Primary)
      // In production, this would read from Google Drive using stored connection
      try {
        const fs = await import("fs");
        const path = await import("path");
        const XLSX = await import("xlsx");

        // Check for test harness file
        const testFile = path.join(
          process.cwd(),
          "test-harness",
          "aurora-primary",
          "fms-exports",
          "fms_detailed_cost_centre_2025-26.xlsx",
        );

        if (fs.existsSync(testFile)) {
          const buffer = fs.readFileSync(testFile);
          const workbook = XLSX.read(buffer);
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          rawData = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1,
          }) as unknown[][];
          financialYear = financialYear || "2025-26";
        }
      } catch {
        // File not available
      }
    }

    // Also try reading from Google Drive if we have a data connection
    if (!rawData) {
      // Check for stored data connection with FMS files
      const { data: connection } = await supabase
        .from("school_data_connections")
        .select("*")
        .eq("organization_id", auth.organizationId)
        .eq("provider", "google_drive")
        .eq("is_active", true)
        .limit(1);

      if (connection && connection.length > 0) {
        // TODO: Re-read file from Google Drive using stored connection
        // For now, fall back to DB-only comparison
      }
    }

    if (!rawData) {
      // No source file available — do a DB-only integrity check
      // Compare budget_lines totals against transaction sums
      return await runDBIntegrityCheck(
        supabase,
        auth.organizationId,
        financialYear || "2025-26",
        auth.userId,
      );
    }

    // Run full reconciliation
    const { reconcile } = await import("@/lib/budget-engine/reconciliation");
    const result = await reconcile(
      supabase,
      auth.organizationId,
      financialYear || "2025-26",
      rawData,
      "api",
      auth.userId,
    );

    return apiSuccess({
      reconciliation: {
        status: result.status,
        exception_count: result.exception_count,
        max_drift_pct: result.max_drift_pct,
        duration_ms: result.duration_ms,
      },
      exceptions: result.exceptions,
      source_totals: result.source_totals,
      db_totals: result.db_totals,
    });
  },
  { requiredRole: "slt" },
);

/**
 * DB-only integrity check when source file isn't available.
 * Compares finance_budget_lines totals against finance_transactions sums
 * to catch internal inconsistencies.
 */
async function runDBIntegrityCheck(
  supabase: any,
  organizationId: string,
  financialYear: string,
  userId?: string,
) {
  const startTime = Date.now();

  // Get budget lines
  const { data: budgetLines } = await supabase
    .from("finance_budget_lines")
    .select(
      "cfr_code, cfr_description, cost_centre, budget_amount, actual_amount, committed_amount, is_income",
    )
    .eq("organization_id", organizationId)
    .eq("financial_year", financialYear);

  if (!budgetLines || budgetLines.length === 0) {
    return apiError(
      "No finance data found. Import FMS data first.",
      404,
      "NO_DATA",
    );
  }

  // Get transaction sums per CFR code
  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select("cfr_code, gross_amount")
    .eq("organization_id", organizationId)
    .eq("financial_year", financialYear);

  // Sum transactions by CFR code
  const txnSums = new Map<string, { total: number; count: number }>();
  for (const txn of transactions || []) {
    const code = txn.cfr_code || "UNKNOWN";
    const existing = txnSums.get(code) || { total: 0, count: 0 };
    existing.total += parseFloat(txn.gross_amount || "0");
    existing.count += 1;
    txnSums.set(code, existing);
  }

  // Compare
  const exceptions: Array<{
    cfr_code: string;
    description: string;
    field: string;
    budget_line_value: number;
    transaction_sum: number;
    drift: number;
    drift_pct: number;
  }> = [];

  for (const bl of budgetLines) {
    const actual = parseFloat(bl.actual_amount || "0");
    const txnData = txnSums.get(bl.cfr_code);
    const txnSum = txnData ? Math.abs(txnData.total) : 0;

    const drift = Math.abs(actual - txnSum);
    const driftPct = actual > 0 ? (drift / actual) * 100 : txnSum > 0 ? 100 : 0;

    if (drift > 1) {
      // More than £1 difference
      exceptions.push({
        cfr_code: bl.cfr_code,
        description: bl.cfr_description || bl.cfr_code,
        field: "actual_vs_transactions",
        budget_line_value: actual,
        transaction_sum: txnSum,
        drift: Math.round(drift * 100) / 100,
        drift_pct: Math.round(driftPct * 100) / 100,
      });
    }
  }

  const durationMs = Date.now() - startTime;
  const status =
    exceptions.length === 0
      ? "matched"
      : exceptions.some((e) => e.drift_pct > 5)
        ? "major_exceptions"
        : "minor_exceptions";

  // Log the check
  await supabase.from("finance_reconciliation_log").insert({
    organization_id: organizationId,
    source_checksum: "db-internal-check",
    source_total_expenditure: 0,
    source_total_income: 0,
    source_total_transactions: transactions?.length || 0,
    source_cfr_snapshot: [],
    db_total_expenditure: budgetLines
      .filter((bl: any) => !bl.is_income)
      .reduce(
        (s: number, bl: any) => s + parseFloat(bl.actual_amount || "0"),
        0,
      ),
    db_total_income: budgetLines
      .filter((bl: any) => bl.is_income)
      .reduce(
        (s: number, bl: any) => s + parseFloat(bl.actual_amount || "0"),
        0,
      ),
    db_total_transactions: transactions?.length || 0,
    db_cfr_snapshot: budgetLines,
    status,
    exceptions,
    exception_count: exceptions.length,
    max_drift_pct:
      exceptions.length > 0
        ? Math.max(...exceptions.map((e: any) => e.drift_pct))
        : 0,
    financial_year: financialYear,
    triggered_by: "db_integrity_check",
    duration_ms: durationMs,
    created_by: userId,
  });

  return apiSuccess({
    check_type: "db_integrity",
    status,
    exception_count: exceptions.length,
    exceptions,
    duration_ms: durationMs,
    message:
      "Source file not available — ran internal DB consistency check (budget_lines vs transaction sums). Upload the FMS file for full reconciliation.",
  });
}
