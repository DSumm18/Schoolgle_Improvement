/**
 * Finance Reconciliation Engine
 *
 * Compares the source spreadsheet data (captured at import time) against
 * what's currently in Supabase finance tables. Reports any exceptions
 * where the DB state has drifted from the source of truth.
 *
 * This ensures the budget monitor ALWAYS reflects the school's actual
 * FMS export data — not stale or corrupted data.
 *
 * Usage:
 *   const result = await reconcile(supabase, orgId, financialYear);
 *   // result.status: 'matched' | 'minor_exceptions' | 'major_exceptions' | 'failed'
 *   // result.exceptions: Array of {cfr_code, field, source_value, db_value, drift_pct}
 */

export interface CFRSnapshot {
  cfr_code: string;
  description: string;
  cost_centre: string;
  budget: number;
  actual: number;
  committed: number;
  txn_count: number;
}

export interface ReconciliationException {
  cfr_code: string;
  description: string;
  field: "budget" | "actual" | "committed" | "txn_count";
  source_value: number;
  db_value: number;
  drift: number;
  drift_pct: number;
  severity: "minor" | "major";
}

export interface ReconciliationResult {
  status: "matched" | "minor_exceptions" | "major_exceptions" | "failed";
  exceptions: ReconciliationException[];
  exception_count: number;
  max_drift_pct: number;
  source_totals: {
    expenditure: number;
    income: number;
    transactions: number;
  };
  db_totals: {
    expenditure: number;
    income: number;
    transactions: number;
  };
  source_snapshot: CFRSnapshot[];
  db_snapshot: CFRSnapshot[];
  duration_ms: number;
}

/**
 * Build a CFR snapshot from the current DB state.
 * This queries finance_budget_lines and finance_transactions
 * to get the current picture.
 */
export async function buildDBSnapshot(
  supabase: any,
  organizationId: string,
  financialYear: string,
): Promise<{
  snapshot: CFRSnapshot[];
  totalExpenditure: number;
  totalIncome: number;
  totalTransactions: number;
}> {
  // Get budget lines
  const { data: budgetLines, error: blErr } = await supabase
    .from("finance_budget_lines")
    .select(
      "cfr_code, cfr_description, cost_centre, budget_amount, actual_amount, committed_amount, is_income",
    )
    .eq("organization_id", organizationId)
    .eq("financial_year", financialYear)
    .order("cfr_code");

  if (blErr || !budgetLines) {
    throw new Error(
      `Failed to query budget lines: ${blErr?.message || "no data"}`,
    );
  }

  // Get transaction counts per CFR code
  const { data: txnCounts, error: txErr } = await supabase
    .from("finance_transactions")
    .select("cfr_code")
    .eq("organization_id", organizationId)
    .eq("financial_year", financialYear);

  if (txErr) {
    throw new Error(`Failed to query transactions: ${txErr.message}`);
  }

  // Count transactions per CFR
  const txnCountMap = new Map<string, number>();
  for (const t of txnCounts || []) {
    const code = t.cfr_code || "UNKNOWN";
    txnCountMap.set(code, (txnCountMap.get(code) || 0) + 1);
  }

  let totalExpenditure = 0;
  let totalIncome = 0;

  const snapshot: CFRSnapshot[] = budgetLines.map((bl: any) => {
    const budget = parseFloat(bl.budget_amount || "0");
    const actual = parseFloat(bl.actual_amount || "0");
    const committed = parseFloat(bl.committed_amount || "0");

    if (bl.is_income) {
      totalIncome += actual;
    } else {
      totalExpenditure += actual;
    }

    return {
      cfr_code: bl.cfr_code,
      description: bl.cfr_description || bl.cfr_code,
      cost_centre: bl.cost_centre || "",
      budget,
      actual,
      committed,
      txn_count: txnCountMap.get(bl.cfr_code) || 0,
    };
  });

  return {
    snapshot,
    totalExpenditure,
    totalIncome,
    totalTransactions: txnCounts?.length || 0,
  };
}

/**
 * Build a CFR snapshot from the raw FMS spreadsheet data.
 * Re-parses the spreadsheet to get the definitive source of truth.
 */
export async function buildSourceSnapshot(rawData: unknown[][]): Promise<{
  snapshot: CFRSnapshot[];
  totalExpenditure: number;
  totalIncome: number;
  totalTransactions: number;
  checksum: string;
}> {
  const { parseFMSReport } = await import("./fms-parser");
  const { generateFileChecksum } = await import("./finance-validator");

  const parsed = parseFMSReport(rawData);
  const checksum = generateFileChecksum(rawData);

  if (!parsed.success) {
    throw new Error(`FMS parse failed: ${parsed.errors.join("; ")}`);
  }

  let totalExpenditure = 0;
  let totalIncome = 0;
  let totalTransactions = 0;

  const snapshot: CFRSnapshot[] = [];

  for (const cc of parsed.cost_centres) {
    if (!cc.cfr_code) continue;

    const isIncome = cc.category === "income" || cc.category === "balance";
    const actual = Math.abs(cc.actual);

    if (isIncome) {
      totalIncome += actual;
    } else {
      totalExpenditure += actual;
    }

    totalTransactions += cc.transactions.length;

    snapshot.push({
      cfr_code: cc.cfr_code,
      description: cc.name,
      cost_centre: cc.code,
      budget: Math.abs(cc.allocated),
      actual,
      committed: Math.abs(cc.committed),
      txn_count: cc.transactions.length,
    });
  }

  return {
    snapshot,
    totalExpenditure,
    totalIncome,
    totalTransactions,
    checksum,
  };
}

/**
 * Compare source snapshot against DB snapshot and report exceptions.
 */
export function compareSnapshots(
  source: CFRSnapshot[],
  db: CFRSnapshot[],
): ReconciliationException[] {
  const exceptions: ReconciliationException[] = [];

  // Build a map of DB entries by cfr_code+cost_centre
  const dbMap = new Map<string, CFRSnapshot>();
  for (const entry of db) {
    dbMap.set(`${entry.cfr_code}:${entry.cost_centre}`, entry);
  }

  for (const src of source) {
    const key = `${src.cfr_code}:${src.cost_centre}`;
    const dbEntry = dbMap.get(key);

    if (!dbEntry) {
      // Source CFR code not in DB at all — major exception
      exceptions.push({
        cfr_code: src.cfr_code,
        description: src.description,
        field: "actual",
        source_value: src.actual,
        db_value: 0,
        drift: src.actual,
        drift_pct: 100,
        severity: "major",
      });
      continue;
    }

    // Compare each field
    const fields: Array<{
      field: ReconciliationException["field"];
      src: number;
      db: number;
    }> = [
      { field: "budget", src: src.budget, db: dbEntry.budget },
      { field: "actual", src: src.actual, db: dbEntry.actual },
      { field: "committed", src: src.committed, db: dbEntry.committed },
      { field: "txn_count", src: src.txn_count, db: dbEntry.txn_count },
    ];

    for (const { field, src: srcVal, db: dbVal } of fields) {
      const drift = Math.abs(srcVal - dbVal);

      // Skip tiny drifts (rounding)
      if (field !== "txn_count" && drift < 0.02) continue;
      if (field === "txn_count" && drift === 0) continue;

      const driftPct =
        srcVal !== 0 ? (drift / Math.abs(srcVal)) * 100 : dbVal !== 0 ? 100 : 0;

      // Transaction count must be exact; amounts allow 0.5% rounding
      const isMajor = field === "txn_count" ? drift > 0 : driftPct > 1;

      if (drift > 0) {
        exceptions.push({
          cfr_code: src.cfr_code,
          description: src.description,
          field,
          source_value: srcVal,
          db_value: dbVal,
          drift,
          drift_pct: Math.round(driftPct * 100) / 100,
          severity: isMajor ? "major" : "minor",
        });
      }
    }
  }

  // Check for DB entries not in source (orphaned data)
  const sourceKeys = new Set(
    source.map((s) => `${s.cfr_code}:${s.cost_centre}`),
  );
  for (const [key, dbEntry] of dbMap) {
    if (!sourceKeys.has(key) && dbEntry.actual > 0) {
      exceptions.push({
        cfr_code: dbEntry.cfr_code,
        description: dbEntry.description,
        field: "actual",
        source_value: 0,
        db_value: dbEntry.actual,
        drift: dbEntry.actual,
        drift_pct: 100,
        severity: "major",
      });
    }
  }

  return exceptions;
}

/**
 * Run full reconciliation: re-parse source file, compare with DB, log result.
 */
export async function reconcile(
  supabase: any,
  organizationId: string,
  financialYear: string,
  rawData: unknown[][],
  triggeredBy: string = "manual",
  userId?: string,
): Promise<ReconciliationResult> {
  const startTime = Date.now();

  // Build both snapshots
  const sourceResult = await buildSourceSnapshot(rawData);
  const dbResult = await buildDBSnapshot(
    supabase,
    organizationId,
    financialYear,
  );

  // Compare
  const exceptions = compareSnapshots(sourceResult.snapshot, dbResult.snapshot);

  const majorCount = exceptions.filter((e) => e.severity === "major").length;
  const maxDrift =
    exceptions.length > 0 ? Math.max(...exceptions.map((e) => e.drift_pct)) : 0;

  const status: ReconciliationResult["status"] =
    exceptions.length === 0
      ? "matched"
      : majorCount > 0
        ? "major_exceptions"
        : "minor_exceptions";

  const durationMs = Date.now() - startTime;

  const result: ReconciliationResult = {
    status,
    exceptions,
    exception_count: exceptions.length,
    max_drift_pct: maxDrift,
    source_totals: {
      expenditure: sourceResult.totalExpenditure,
      income: sourceResult.totalIncome,
      transactions: sourceResult.totalTransactions,
    },
    db_totals: {
      expenditure: dbResult.totalExpenditure,
      income: dbResult.totalIncome,
      transactions: dbResult.totalTransactions,
    },
    source_snapshot: sourceResult.snapshot,
    db_snapshot: dbResult.snapshot,
    duration_ms: durationMs,
  };

  // Log to database
  const { data: latestImport } = await supabase
    .from("data_imports")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("import_type", "transactions")
    .eq("status", "imported")
    .order("created_at", { ascending: false })
    .limit(1);

  await supabase.from("finance_reconciliation_log").insert({
    organization_id: organizationId,
    import_id: latestImport?.[0]?.id || null,
    source_checksum: sourceResult.checksum,
    source_total_expenditure: sourceResult.totalExpenditure,
    source_total_income: sourceResult.totalIncome,
    source_total_transactions: sourceResult.totalTransactions,
    source_cfr_snapshot: sourceResult.snapshot,
    db_total_expenditure: dbResult.totalExpenditure,
    db_total_income: dbResult.totalIncome,
    db_total_transactions: dbResult.totalTransactions,
    db_cfr_snapshot: dbResult.snapshot,
    status,
    exceptions,
    exception_count: exceptions.length,
    max_drift_pct: maxDrift,
    financial_year: financialYear,
    triggered_by: triggeredBy,
    duration_ms: durationMs,
    created_by: userId,
  });

  return result;
}

/**
 * Get the latest reconciliation status for an org.
 * Used by the monitor page to show data integrity badge.
 */
export async function getLatestReconciliation(
  supabase: any,
  organizationId: string,
  financialYear?: string,
): Promise<{
  status: string;
  exception_count: number;
  max_drift_pct: number;
  last_checked: string;
  triggered_by: string;
} | null> {
  let query = supabase
    .from("finance_reconciliation_log")
    .select("status, exception_count, max_drift_pct, created_at, triggered_by")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (financialYear) {
    query = query.eq("financial_year", financialYear);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) return null;

  return {
    status: data[0].status,
    exception_count: data[0].exception_count,
    max_drift_pct: data[0].max_drift_pct,
    last_checked: data[0].created_at,
    triggered_by: data[0].triggered_by,
  };
}
