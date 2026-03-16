/**
 * Finance Import API
 *
 * POST /api/finance/import — Import FMS report into finance tables
 *
 * Accepts an FMS Excel/CSV file, runs it through:
 * 1. FMS Parser (extracts transactions, maps CFR codes, strips PII)
 * 2. Finance Validator (checksum dedup, balance reconciliation, reversal tracking,
 *    period continuity, supplier normalisation, anomaly detection)
 * 3. Database insert (finance_transactions, finance_suppliers, finance_budget_lines)
 *
 * All validation issues are returned in the response.
 * Errors block import. Warnings allow import but are flagged.
 * Reversals/credits are preserved in the data — they appear in reports
 * so net balances across CFR codes are always accurate.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import * as XLSX from "xlsx";

export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const supabase = createServiceRoleClient();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const financialYear = formData.get("financial_year") as string | null;
    const dryRun = formData.get("dry_run") === "true";

    if (!file) {
      return apiError("No file provided", 400, "MISSING_FILE");
    }

    // Read file into buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
    }) as unknown[][];

    if (rawData.length < 15) {
      return apiError(
        "File appears too short to be an FMS report",
        400,
        "INVALID_FORMAT",
      );
    }

    // Step 1: Parse the FMS report
    const { parseFMSReport } = await import("@/lib/budget-engine/fms-parser");
    const parsed = parseFMSReport(rawData);

    if (!parsed.success) {
      return apiError(
        `FMS parsing failed: ${parsed.errors.join("; ")}`,
        400,
        "PARSE_ERROR",
        { warnings: parsed.warnings, errors: parsed.errors },
      );
    }

    // Step 2: Validate
    const { validateAndPrepareImport } =
      await import("@/lib/budget-engine/finance-validator");
    const { validation, canImport, reason } = await validateAndPrepareImport(
      supabase,
      auth.organizationId,
      rawData,
      parsed,
    );

    // If dry run, return validation results without importing
    if (dryRun) {
      return apiSuccess({
        dry_run: true,
        can_import: canImport,
        reason,
        validation: {
          issues: validation.issues,
          summary: validation.summary,
          reversals: validation.reversals.map((r) => ({
            amount: r.reversal.actual,
            details: r.reversal.details,
            cost_centre: r.reversal.cost_centre,
            matched_original: !!r.original,
            confidence: r.confidence,
            net_amount: r.net_amount,
          })),
          cfr_balances: validation.cfr_balances,
        },
        parsed_summary: {
          school_name: parsed.school_name,
          financial_year: parsed.financial_year || financialYear,
          cost_centres: parsed.cost_centres.length,
          total_transactions: validation.summary.total_transactions,
          total_income: parsed.summary.total_income_actual,
          total_expenditure: parsed.summary.total_expenditure_actual,
          net_position: parsed.summary.net_position,
        },
      });
    }

    if (!canImport) {
      return apiError(reason || "Validation failed", 400, "VALIDATION_ERROR", {
        issues: validation.issues,
        summary: validation.summary,
      });
    }

    // Step 3: Create import audit record
    const fy =
      financialYear || parsed.financial_year || `${new Date().getFullYear()}`;
    const { data: importRecord, error: importErr } = await supabase
      .from("data_imports")
      .insert({
        organization_id: auth.organizationId,
        import_type: "transactions",
        file_name: file.name,
        file_type: file.name.endsWith(".csv") ? "csv" : "xlsx",
        file_size_bytes: buffer.length,
        financial_year: fy,
        status: "processing",
        total_rows: validation.summary.total_transactions,
        raw_checksum: validation.checksum,
        imported_by: auth.userId,
        column_mapping: {},
      })
      .select("id")
      .single();

    if (importErr) {
      console.error(
        "[Finance Import] Failed to create import record:",
        importErr,
      );
      return apiError("Failed to create import record", 500, "DB_ERROR");
    }

    const importId = importRecord.id;

    // Step 4: Insert transactions (including reversals — they stay in the data)
    let txnInserted = 0;
    let txnErrors = 0;
    const errorDetails: Array<{ cc: string; error: string }> = [];

    for (const cc of parsed.cost_centres) {
      if (cc.transactions.length === 0) continue;

      const isIncome = cc.category === "income";
      const rows = cc.transactions.map((txn, idx) => ({
        organization_id: auth.organizationId,
        import_id: importId,
        transaction_date: txn.date || null,
        transaction_ref: `${txn.type}:${txn.period}:${idx}`,
        transaction_type: mapTransactionType(txn.type),
        cost_centre: cc.code,
        ledger_code: txn.ledger_code || null,
        cfr_code: cc.cfr_code || null,
        cfr_description: cc.name,
        supplier_name: extractSupplierFromDetails(
          txn.details,
          validation.supplier_mappings,
        ),
        gross_amount: txn.actual,
        vat_amount: 0,
        is_income: isIncome,
        financial_year: fy,
        period_number: txn.period,
        source_system: "SIMS FMS",
        source_row_number: idx + 1,
        // Commitment tracking for POs
        ...(txn.commitment !== 0 ? { budget_amount: txn.commitment } : {}),
      }));

      const { error: txnErr } = await supabase
        .from("finance_transactions")
        .insert(rows);

      if (txnErr) {
        txnErrors += rows.length;
        errorDetails.push({ cc: cc.code, error: txnErr.message });
      } else {
        txnInserted += rows.length;
      }
    }

    // Step 5: Upsert budget lines (one per CFR code)
    let budgetLinesUpserted = 0;
    for (const cc of parsed.cost_centres) {
      if (!cc.cfr_code) continue;

      const isIncome = cc.category === "income";
      const { error: blErr } = await supabase
        .from("finance_budget_lines")
        .upsert(
          {
            organization_id: auth.organizationId,
            financial_year: fy,
            cfr_code: cc.cfr_code,
            cost_centre: cc.code,
            budget_amount: Math.abs(cc.allocated),
            committed_amount: Math.abs(cc.committed),
            actual_amount: Math.abs(cc.actual),
            forecast_amount: null, // calculated separately
            variance: cc.balance,
            spend_percent: cc.spent_percent,
            rag_status:
              cc.spent_percent > 100
                ? "red"
                : cc.spent_percent > 85
                  ? "amber"
                  : "green",
            is_income: isIncome,
          },
          {
            onConflict: "organization_id,financial_year,cfr_code,cost_centre",
          },
        );

      if (!blErr) budgetLinesUpserted++;
    }

    // Step 6: Upsert suppliers
    let suppliersUpserted = 0;
    const supplierNames = new Set<string>();
    for (const cc of parsed.cost_centres) {
      for (const txn of cc.transactions) {
        const name = extractSupplierFromDetails(
          txn.details,
          validation.supplier_mappings,
        );
        if (name && name.length > 2) supplierNames.add(name);
      }
    }

    for (const name of supplierNames) {
      const { error: supErr } = await supabase.from("finance_suppliers").upsert(
        {
          organization_id: auth.organizationId,
          supplier_name: name,
          financial_year: fy,
        },
        { onConflict: "organization_id,supplier_name,financial_year" },
      );
      if (!supErr) suppliersUpserted++;
    }

    // Step 7: Update import record with results
    await supabase
      .from("data_imports")
      .update({
        status: txnErrors > 0 ? "partial" : "imported",
        rows_imported: txnInserted,
        rows_errored: txnErrors,
        error_details: errorDetails.length > 0 ? errorDetails : null,
      })
      .eq("id", importId);

    return apiSuccess({
      import_id: importId,
      financial_year: fy,
      transactions_imported: txnInserted,
      transactions_errors: txnErrors,
      budget_lines_upserted: budgetLinesUpserted,
      suppliers_upserted: suppliersUpserted,
      validation: {
        issues: validation.issues,
        summary: validation.summary,
        reversals_count: validation.reversals.length,
        reversals_matched: validation.reversals.filter((r) => r.original)
          .length,
      },
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
    });
  },
  { requiredRole: "slt" },
);

// ─── Helpers ─────────────────────────────────────────────

function mapTransactionType(fmsType: string): string {
  const map: Record<string, string> = {
    GL: "journal",
    PO: "purchase_order",
    AP: "invoice",
    SI: "receipt",
    SC: "credit_note",
    OB: "journal", // opening balance
    JV: "journal",
  };
  return map[fmsType] || "journal";
}

function extractSupplierFromDetails(
  details: string,
  mappings: Array<{ raw_name: string; canonical_name: string }>,
): string | null {
  // Strip reference patterns to get supplier name
  let supplier = details
    .replace(/\b(INV|PO|AP|SI|JV|SC|OB|MTH|Period)[.:# ]*[\w\[\]]*\b/gi, "")
    .replace(/\[name\]|\[invoice\]|\[school\]|\[email\]/g, "")
    .replace(/\bSalary\b/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (supplier.length < 3) return null;

  // Check if we have a normalised mapping for this name
  const mapping = mappings.find((m) => m.raw_name === supplier);
  if (mapping) return mapping.canonical_name;

  return supplier;
}
