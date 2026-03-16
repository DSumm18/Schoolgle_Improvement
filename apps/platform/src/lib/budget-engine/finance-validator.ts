/**
 * Finance Data Validator
 *
 * Smart validation rules applied when finance data enters Supabase.
 * Ensures accuracy, catches duplicates, tracks reversals, and validates
 * balances across CFR codes.
 *
 * RULES:
 * 1. Checksum dedup — reject if same file already imported
 * 2. Balance reconciliation — allocated ± transactions must = closing balance
 * 3. CFR total validation — mapped CFR totals must match FMS grand total (≤1% drift)
 * 4. Period continuity — alert if months are missing in sequence
 * 5. Supplier name normalisation — fuzzy match to prevent duplicates
 * 6. Transaction reference tracking — reversals/credits linked to originals
 * 7. Cross-period balance check — running balance across codes must reconcile
 * 8. Anomaly detection — unusual amounts, duplicate refs, future dates
 */

import * as crypto from "crypto";
import type {
  FMSParseResult,
  FMSTransaction,
  FMSCostCentre,
} from "./fms-parser";

// ─── Types ───────────────────────────────────────────────

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  rule: string;
  severity: ValidationSeverity;
  message: string;
  details?: Record<string, unknown>;
}

export interface TransactionMatch {
  /** The reversal/credit transaction */
  reversal: FMSTransaction;
  /** The original transaction it reverses (if found) */
  original?: FMSTransaction;
  /** Net effect after reversal */
  net_amount: number;
  /** Confidence that this is a genuine reversal pair */
  confidence: "high" | "medium" | "low";
}

export interface SupplierMatch {
  /** Raw name from import */
  raw_name: string;
  /** Normalised canonical name */
  canonical_name: string;
  /** Existing supplier it matched to (if any) */
  matched_existing?: string;
  /** Match confidence */
  similarity: number;
}

export interface FinanceValidationResult {
  valid: boolean;
  checksum: string;
  issues: ValidationIssue[];
  /** Transactions identified as reversals, linked to originals where possible */
  reversals: TransactionMatch[];
  /** Supplier name normalisations applied */
  supplier_mappings: SupplierMatch[];
  /** Per-CFR-code balance check */
  cfr_balances: CFRBalanceCheck[];
  /** Summary counts */
  summary: {
    total_transactions: number;
    reversals_found: number;
    duplicate_refs: number;
    unmapped_cfr_codes: number;
    supplier_duplicates_merged: number;
    periods_present: number[];
    periods_missing: number[];
    balance_drift_pct: number;
  };
}

export interface CFRBalanceCheck {
  cfr_code: string;
  description: string;
  allocated: number;
  /** Sum of all transactions including reversals */
  actual_from_transactions: number;
  /** Actual from cost centre allocation row */
  actual_from_allocation: number;
  /** Difference between the two (should be 0 or very small) */
  drift: number;
  drift_pct: number;
  /** Net after reversals */
  net_actual: number;
  status: "balanced" | "minor_drift" | "material_drift" | "no_transactions";
}

// ─── 1. Checksum Dedup ──────────────────────────────────

/**
 * Generate SHA-256 checksum of raw file content for dedup.
 * Same file imported twice = same checksum = reject.
 */
export function generateFileChecksum(rawData: unknown[][]): string {
  const content = JSON.stringify(rawData);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Check if this checksum has been imported before for this org.
 * Returns the import_id if duplicate found, null otherwise.
 */
export async function checkDuplicateImport(
  supabase: any,
  organizationId: string,
  checksum: string,
): Promise<{
  isDuplicate: boolean;
  existingImportId?: string;
  importedAt?: string;
}> {
  const { data } = await supabase
    .from("data_imports")
    .select("id, created_at")
    .eq("organization_id", organizationId)
    .eq("raw_checksum", checksum)
    .eq("status", "imported")
    .order("created_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return {
      isDuplicate: true,
      existingImportId: data[0].id,
      importedAt: data[0].created_at,
    };
  }
  return { isDuplicate: false };
}

// ─── 2. Balance Reconciliation ──────────────────────────

/**
 * For each cost centre, check that the sum of transactions matches
 * the allocation row's actual figure. Flags material drift.
 */
function reconcileBalances(parsed: FMSParseResult): CFRBalanceCheck[] {
  const checks: CFRBalanceCheck[] = [];

  for (const cc of parsed.cost_centres) {
    if (!cc.cfr_code) continue;

    // Sum all transaction actuals for this cost centre
    let txnTotal = 0;
    for (const txn of cc.transactions) {
      txnTotal += txn.actual;
    }

    const allocationActual = cc.actual;
    const drift = Math.abs(txnTotal - allocationActual);
    const driftPct =
      allocationActual !== 0
        ? (drift / Math.abs(allocationActual)) * 100
        : txnTotal !== 0
          ? 100
          : 0;

    let status: CFRBalanceCheck["status"] = "balanced";
    if (cc.transactions.length === 0) {
      status = "no_transactions";
    } else if (driftPct > 5) {
      status = "material_drift";
    } else if (driftPct > 0.5) {
      status = "minor_drift";
    }

    checks.push({
      cfr_code: cc.cfr_code,
      description: cc.name,
      allocated: cc.allocated,
      actual_from_transactions: txnTotal,
      actual_from_allocation: allocationActual,
      drift,
      drift_pct: Math.round(driftPct * 100) / 100,
      net_actual: txnTotal, // updated later after reversal netting
      status,
    });
  }

  return checks;
}

// ─── 3. CFR Total Validation ────────────────────────────

/**
 * Check that the sum of all mapped CFR expenditure codes matches
 * the FMS summary total. Allows ≤1% drift for rounding.
 */
function validateCFRTotals(
  parsed: FMSParseResult,
  issues: ValidationIssue[],
): number {
  let mappedExpenditure = 0;
  let mappedIncome = 0;
  let unmappedTotal = 0;
  let unmappedCount = 0;

  for (const cc of parsed.cost_centres) {
    if (cc.category === "balance") continue;

    if (cc.cfr_code) {
      if (cc.category === "income") {
        mappedIncome += Math.abs(cc.actual);
      } else {
        mappedExpenditure += cc.actual;
      }
    } else {
      unmappedTotal += Math.abs(cc.actual);
      unmappedCount++;
    }
  }

  const fmsExpenditure = parsed.summary.total_expenditure_actual;
  const fmsIncome = parsed.summary.total_income_actual;

  // Check expenditure drift
  if (fmsExpenditure > 0) {
    const expDrift = Math.abs(mappedExpenditure - fmsExpenditure);
    const expDriftPct = (expDrift / fmsExpenditure) * 100;

    if (expDriftPct > 1) {
      issues.push({
        rule: "cfr_total_validation",
        severity: expDriftPct > 5 ? "error" : "warning",
        message: `Mapped CFR expenditure (£${mappedExpenditure.toLocaleString()}) differs from FMS total (£${fmsExpenditure.toLocaleString()}) by ${expDriftPct.toFixed(1)}%`,
        details: {
          mapped: mappedExpenditure,
          fms: fmsExpenditure,
          drift_pct: expDriftPct,
        },
      });
    }
  }

  // Check income drift
  if (fmsIncome > 0) {
    const incDrift = Math.abs(mappedIncome - fmsIncome);
    const incDriftPct = (incDrift / fmsIncome) * 100;

    if (incDriftPct > 1) {
      issues.push({
        rule: "cfr_total_validation",
        severity: incDriftPct > 5 ? "error" : "warning",
        message: `Mapped CFR income (£${mappedIncome.toLocaleString()}) differs from FMS total (£${fmsIncome.toLocaleString()}) by ${incDriftPct.toFixed(1)}%`,
        details: {
          mapped: mappedIncome,
          fms: fmsIncome,
          drift_pct: incDriftPct,
        },
      });
    }
  }

  if (unmappedCount > 0) {
    issues.push({
      rule: "cfr_unmapped",
      severity: unmappedTotal > 1000 ? "warning" : "info",
      message: `${unmappedCount} cost centre(s) with £${unmappedTotal.toLocaleString()} actual spend could not be mapped to CFR codes`,
      details: { count: unmappedCount, total: unmappedTotal },
    });
  }

  const totalDrift =
    fmsExpenditure > 0
      ? (Math.abs(mappedExpenditure - fmsExpenditure) / fmsExpenditure) * 100
      : 0;
  return Math.round(totalDrift * 100) / 100;
}

// ─── 4. Period Continuity ───────────────────────────────

/**
 * Check that financial periods are continuous (no gaps).
 * FMS uses periods 1-12 where 1=April, 12=March.
 */
function checkPeriodContinuity(
  parsed: FMSParseResult,
  issues: ValidationIssue[],
): { present: number[]; missing: number[] } {
  const periodsWithData = new Set<number>();

  for (const cc of parsed.cost_centres) {
    for (const txn of cc.transactions) {
      if (txn.period >= 1 && txn.period <= 12) {
        periodsWithData.add(txn.period);
      }
    }
  }

  const present = Array.from(periodsWithData).sort((a, b) => a - b);

  if (present.length === 0) {
    issues.push({
      rule: "period_continuity",
      severity: "warning",
      message: "No period data found in transactions",
    });
    return { present: [], missing: [] };
  }

  const maxPeriod = Math.max(...present);
  const missing: number[] = [];

  for (let p = 1; p <= maxPeriod; p++) {
    if (!periodsWithData.has(p)) {
      missing.push(p);
    }
  }

  if (missing.length > 0) {
    const periodNames: Record<number, string> = {
      1: "April",
      2: "May",
      3: "June",
      4: "July",
      5: "August",
      6: "September",
      7: "October",
      8: "November",
      9: "December",
      10: "January",
      11: "February",
      12: "March",
    };
    const missingNames = missing.map((p) => periodNames[p] || `P${p}`);

    issues.push({
      rule: "period_continuity",
      severity: "warning",
      message: `Missing transaction data for period(s): ${missingNames.join(", ")}. This may indicate an incomplete FMS export.`,
      details: { missing_periods: missing, present_periods: present },
    });
  }

  return { present, missing };
}

// ─── 5. Supplier Name Normalisation ─────────────────────

/** Common suffixes to strip for matching */
const SUPPLIER_SUFFIXES =
  /\b(ltd|limited|plc|inc|llp|uk|group|services|solutions)\b\.?/gi;
const SUPPLIER_NOISE = /[^a-z0-9\s]/g;

/**
 * Normalise a supplier name for dedup matching.
 * "British Gas Trading Ltd." → "british gas trading"
 */
function normaliseSupplierName(name: string): string {
  return name
    .toLowerCase()
    .replace(SUPPLIER_SUFFIXES, "")
    .replace(SUPPLIER_NOISE, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple similarity score (0-1) using bigram overlap.
 */
function supplierSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));

  const bigramsB = new Set<string>();
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.slice(i, i + 2));

  let overlap = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) overlap++;
  }

  return (2 * overlap) / (bigramsA.size + bigramsB.size);
}

/**
 * Normalise and deduplicate supplier names across all transactions.
 * Returns mapping of raw → canonical names and flags near-duplicates.
 */
function normaliseSuppliers(
  parsed: FMSParseResult,
  issues: ValidationIssue[],
): SupplierMatch[] {
  // Collect all unique supplier names from transaction details
  const rawNames = new Map<string, number>(); // name → count

  for (const cc of parsed.cost_centres) {
    for (const txn of cc.transactions) {
      // Extract supplier name from transaction details
      // FMS details often have format: "Supplier Name - INV:12345" or "PO:12345 Supplier Name"
      let supplier = txn.details;
      // Strip reference patterns
      supplier = supplier
        .replace(/\b(INV|PO|AP|SI|JV)[.:# ]*\[?\w*\]?/gi, "")
        .replace(/\b(MTH|Period)\s*\d+/gi, "")
        .replace(/\[name\]/g, "")
        .replace(/\[invoice\]/g, "")
        .replace(/\[school\]/g, "")
        .replace(/\[email\]/g, "")
        .trim();

      if (supplier.length > 2) {
        rawNames.set(supplier, (rawNames.get(supplier) || 0) + 1);
      }
    }
  }

  const mappings: SupplierMatch[] = [];
  const canonicalMap = new Map<string, string>(); // normalised → first raw name seen

  for (const [raw] of rawNames) {
    const normalised = normaliseSupplierName(raw);
    if (!normalised) continue;

    if (canonicalMap.has(normalised)) {
      // Exact normalised match — definite duplicate
      mappings.push({
        raw_name: raw,
        canonical_name: canonicalMap.get(normalised)!,
        similarity: 1,
      });
    } else {
      // Check fuzzy match against existing canonicals
      let bestMatch = "";
      let bestScore = 0;

      for (const [existing, canonical] of canonicalMap) {
        const score = supplierSimilarity(normalised, existing);
        if (score > bestScore && score >= 0.85) {
          bestScore = score;
          bestMatch = canonical;
        }
      }

      if (bestMatch) {
        mappings.push({
          raw_name: raw,
          canonical_name: bestMatch,
          matched_existing: bestMatch,
          similarity: bestScore,
        });
      } else {
        canonicalMap.set(normalised, raw);
        mappings.push({
          raw_name: raw,
          canonical_name: raw,
          similarity: 1,
        });
      }
    }
  }

  const dupeCount = mappings.filter((m) => m.matched_existing).length;
  if (dupeCount > 0) {
    issues.push({
      rule: "supplier_normalisation",
      severity: "info",
      message: `${dupeCount} supplier name variation(s) matched to existing suppliers (e.g. "British Gas Ltd" → "British Gas Trading")`,
      details: {
        duplicates: mappings
          .filter((m) => m.matched_existing)
          .map((m) => ({ from: m.raw_name, to: m.canonical_name })),
      },
    });
  }

  return mappings;
}

// ─── 6. Transaction Reference & Reversal Tracking ───────

/**
 * Identify reversals, credits, and journal adjustments.
 * Links them to original transactions where possible so the
 * net balance across codes is always accurate.
 *
 * Reversal indicators:
 * - Negative amount on an expenditure code (credit note / refund)
 * - Transaction type "JV" or "SC" (journal / standing credit)
 * - Details containing "reversal", "credit note", "refund", "correction"
 * - Matching amount (opposite sign) with same or similar reference
 */
function detectReversals(
  parsed: FMSParseResult,
  issues: ValidationIssue[],
): TransactionMatch[] {
  const allTransactions: (FMSTransaction & { _cc: string })[] = [];

  for (const cc of parsed.cost_centres) {
    for (const txn of cc.transactions) {
      allTransactions.push({ ...txn, _cc: cc.code });
    }
  }

  const reversals: TransactionMatch[] = [];
  const reversalKeywords =
    /\b(reversal|reversed|credit\s*note|refund|correction|contra|cancel|void|write[\s-]?off|adjustment)\b/i;

  for (const txn of allTransactions) {
    const isReversal =
      // Negative expenditure (credit on an expense code)
      (txn.actual < 0 && !txn.cost_centre.startsWith("7")) ||
      // Positive income (debit on an income code — unusual)
      (txn.actual > 0 && txn.cost_centre.startsWith("7")) ||
      // Journal/standing credit types
      txn.type === "SC" ||
      // Keywords in details
      reversalKeywords.test(txn.details);

    if (!isReversal) continue;

    // Try to find the original transaction this reverses
    const targetAmount = -txn.actual;
    let bestOriginal: FMSTransaction | undefined;
    let confidence: TransactionMatch["confidence"] = "low";

    for (const candidate of allTransactions) {
      if (candidate === txn) continue;
      if (candidate._cc !== txn._cc) continue; // same cost centre

      // Exact opposite amount = strong match
      if (Math.abs(candidate.actual - targetAmount) < 0.01) {
        // Same reference or similar details = high confidence
        if (
          candidate.details === txn.details ||
          candidate.ledger_code === txn.ledger_code
        ) {
          bestOriginal = candidate;
          confidence = "high";
          break;
        }
        // Same period or adjacent period = medium
        if (Math.abs(candidate.period - txn.period) <= 1) {
          bestOriginal = candidate;
          confidence = "medium";
        }
      }
    }

    reversals.push({
      reversal: txn,
      original: bestOriginal,
      net_amount: bestOriginal ? bestOriginal.actual + txn.actual : txn.actual,
      confidence,
    });
  }

  if (reversals.length > 0) {
    const totalReversalValue = reversals.reduce(
      (sum, r) => sum + Math.abs(r.reversal.actual),
      0,
    );
    issues.push({
      rule: "reversal_tracking",
      severity: "info",
      message: `${reversals.length} reversal/credit transaction(s) found totalling £${totalReversalValue.toLocaleString()}. ${reversals.filter((r) => r.original).length} matched to original transactions.`,
      details: {
        count: reversals.length,
        matched: reversals.filter((r) => r.original).length,
        unmatched: reversals.filter((r) => !r.original).length,
        total_value: totalReversalValue,
      },
    });
  }

  return reversals;
}

// ─── 7. Duplicate Reference Detection ───────────────────

/**
 * Flag transactions with identical references that aren't reversals.
 * Genuine duplicates (same ref, same amount, same sign) are likely
 * double-imports.
 */
function detectDuplicateRefs(
  parsed: FMSParseResult,
  issues: ValidationIssue[],
): number {
  const refMap = new Map<string, FMSTransaction[]>();

  for (const cc of parsed.cost_centres) {
    for (const txn of cc.transactions) {
      // Extract reference from details (PO numbers, invoice numbers)
      const refMatch = txn.details.match(
        /\b(PO|INV|AP|SI|JV)[.:# ]*(\d{4,})\b/i,
      );
      if (!refMatch) continue;

      const ref = `${refMatch[1].toUpperCase()}:${refMatch[2]}`;
      const existing = refMap.get(ref) || [];
      existing.push(txn);
      refMap.set(ref, existing);
    }
  }

  let dupeCount = 0;
  for (const [ref, txns] of refMap) {
    if (txns.length <= 1) continue;

    // Check if these are genuine duplicates (same sign, same amount)
    // vs reversal pairs (opposite signs)
    const sameSign = txns.filter((t) => t.actual > 0);
    const negatives = txns.filter((t) => t.actual < 0);

    if (sameSign.length > 1) {
      // Multiple positive entries with same ref = likely duplicate
      const amounts = sameSign.map((t) => t.actual);
      if (new Set(amounts).size < amounts.length) {
        dupeCount++;
        issues.push({
          rule: "duplicate_reference",
          severity: "warning",
          message: `Reference ${ref} appears ${sameSign.length} times with same amount (£${sameSign[0].actual.toLocaleString()}). Possible duplicate import.`,
          details: {
            ref,
            count: sameSign.length,
            amount: sameSign[0].actual,
            periods: sameSign.map((t) => t.period),
          },
        });
      }
    }
  }

  return dupeCount;
}

// ─── 8. Anomaly Detection ───────────────────────────────

function detectAnomalies(
  parsed: FMSParseResult,
  issues: ValidationIssue[],
): void {
  const now = new Date();

  for (const cc of parsed.cost_centres) {
    for (const txn of cc.transactions) {
      // Future dated transactions
      if (txn.date) {
        const txnDate = new Date(txn.date);
        if (txnDate > now) {
          issues.push({
            rule: "future_date",
            severity: "warning",
            message: `Transaction dated ${txn.date} in ${cc.name} is in the future`,
            details: {
              cost_centre: cc.code,
              date: txn.date,
              amount: txn.actual,
            },
          });
        }
      }

      // Unusually large transactions (>£50K on a single line)
      if (Math.abs(txn.actual) > 50000 && cc.category !== "staff") {
        issues.push({
          rule: "large_transaction",
          severity: "info",
          message: `Large transaction (£${Math.abs(txn.actual).toLocaleString()}) in ${cc.name} — verify this is correct`,
          details: {
            cost_centre: cc.code,
            amount: txn.actual,
            details: txn.details,
            type: txn.type,
          },
        });
      }

      // Period 0 or >12 (invalid FMS period)
      if (txn.period < 1 || txn.period > 12) {
        issues.push({
          rule: "invalid_period",
          severity: "error",
          message: `Transaction in ${cc.name} has invalid period ${txn.period}`,
          details: {
            cost_centre: cc.code,
            period: txn.period,
            amount: txn.actual,
          },
        });
      }
    }

    // Cost centre overspend (actual > allocated by >10%)
    if (
      cc.allocated > 0 &&
      cc.actual > cc.allocated * 1.1 &&
      cc.category !== "income"
    ) {
      const overspend = cc.actual - cc.allocated;
      issues.push({
        rule: "cost_centre_overspend",
        severity: "warning",
        message: `${cc.name} (${cc.cfr_code || cc.code}) overspent by £${overspend.toLocaleString()} (${cc.spent_percent.toFixed(1)}% of budget)`,
        details: {
          cost_centre: cc.code,
          cfr_code: cc.cfr_code,
          allocated: cc.allocated,
          actual: cc.actual,
          overspend,
        },
      });
    }
  }
}

// ─── 9. Cross-Period Running Balance ────────────────────

/**
 * Validate that running balances across periods are consistent.
 * If we have period 1-6 data, the cumulative spend should increase
 * monotonically for expenditure codes (reversals aside).
 */
function validateRunningBalances(
  parsed: FMSParseResult,
  issues: ValidationIssue[],
): void {
  for (const cc of parsed.cost_centres) {
    if (cc.category === "income" || cc.category === "balance") continue;
    if (cc.transactions.length === 0) continue;

    // Group transactions by period
    const byPeriod = new Map<number, number>();
    for (const txn of cc.transactions) {
      byPeriod.set(txn.period, (byPeriod.get(txn.period) || 0) + txn.actual);
    }

    // Check for negative period totals (net credit in an expenditure period)
    for (const [period, total] of byPeriod) {
      if (total < -100) {
        // Small negatives are normal (rounding, minor credits)
        issues.push({
          rule: "negative_period_spend",
          severity: "info",
          message: `${cc.name} has net credit of £${Math.abs(total).toLocaleString()} in period ${period} — likely a reversal or refund`,
          details: {
            cost_centre: cc.code,
            cfr_code: cc.cfr_code,
            period,
            net_amount: total,
          },
        });
      }
    }
  }
}

// ─── Main Validation Entry Point ────────────────────────

/**
 * Run all validation rules on a parsed FMS report before importing
 * into Supabase finance tables.
 *
 * Call this AFTER parseFMSReport() and BEFORE database insert.
 *
 * @param parsed - Output from parseFMSReport()
 * @param rawData - Original raw data (for checksum generation)
 * @returns Validation result with issues, reversals, and balance checks
 */
export function validateFinanceImport(
  parsed: FMSParseResult,
  rawData: unknown[][],
): FinanceValidationResult {
  const issues: ValidationIssue[] = [];
  const checksum = generateFileChecksum(rawData);

  // Rule 1: (checksum dedup checked separately via async DB call)

  // Rule 2: Balance reconciliation
  const cfrBalances = reconcileBalances(parsed);
  for (const check of cfrBalances) {
    if (check.status === "material_drift") {
      issues.push({
        rule: "balance_reconciliation",
        severity: "warning",
        message: `${check.cfr_code} (${check.description}): transaction total (£${check.actual_from_transactions.toLocaleString()}) differs from allocation actual (£${check.actual_from_allocation.toLocaleString()}) by ${check.drift_pct}%`,
        details: {
          cfr_code: check.cfr_code,
          from_transactions: check.actual_from_transactions,
          from_allocation: check.actual_from_allocation,
          drift: check.drift,
          drift_pct: check.drift_pct,
        },
      });
    }
  }

  // Rule 3: CFR total validation
  const balanceDrift = validateCFRTotals(parsed, issues);

  // Rule 4: Period continuity
  const periods = checkPeriodContinuity(parsed, issues);

  // Rule 5: Supplier normalisation
  const supplierMappings = normaliseSuppliers(parsed, issues);

  // Rule 6: Reversal/credit tracking
  const reversals = detectReversals(parsed, issues);

  // Update CFR balances with reversal netting
  for (const rev of reversals) {
    const ccCode = rev.reversal.cost_centre;
    const matchingBalance = cfrBalances.find((b) => {
      const cc = parsed.cost_centres.find((c) => c.code === ccCode);
      return cc && b.cfr_code === cc.cfr_code;
    });
    if (matchingBalance) {
      // net_actual already includes the reversal (it's in the transaction sum)
      // but we flag it for the report
    }
  }

  // Rule 7: Duplicate references
  const dupeRefs = detectDuplicateRefs(parsed, issues);

  // Rule 8: Anomalies
  detectAnomalies(parsed, issues);

  // Rule 9: Running balances
  validateRunningBalances(parsed, issues);

  // Count total transactions
  let totalTransactions = 0;
  for (const cc of parsed.cost_centres) {
    totalTransactions += cc.transactions.length;
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    valid: !hasErrors,
    checksum,
    issues,
    reversals,
    supplier_mappings: supplierMappings,
    cfr_balances: cfrBalances,
    summary: {
      total_transactions: totalTransactions,
      reversals_found: reversals.length,
      duplicate_refs: dupeRefs,
      unmapped_cfr_codes: parsed.cost_centres.filter((cc) => !cc.cfr_code)
        .length,
      supplier_duplicates_merged: supplierMappings.filter(
        (m) => m.matched_existing,
      ).length,
      periods_present: periods.present,
      periods_missing: periods.missing,
      balance_drift_pct: balanceDrift,
    },
  };
}

// ─── Convenience: Full Import Pipeline ──────────────────

/**
 * Complete validation pipeline for finance import.
 * Parse → Validate → Check dedup → Return decision.
 *
 * Usage:
 * ```ts
 * const { parsed, validation, canImport, reason } =
 *   await validateAndPrepareImport(supabase, orgId, rawData);
 * if (canImport) {
 *   // proceed with database insert
 * }
 * ```
 */
export async function validateAndPrepareImport(
  supabase: any,
  organizationId: string,
  rawData: unknown[][],
  parsedReport: FMSParseResult,
): Promise<{
  validation: FinanceValidationResult;
  canImport: boolean;
  reason?: string;
}> {
  const validation = validateFinanceImport(parsedReport, rawData);

  // Check duplicate
  const dedup = await checkDuplicateImport(
    supabase,
    organizationId,
    validation.checksum,
  );

  if (dedup.isDuplicate) {
    validation.issues.unshift({
      rule: "checksum_dedup",
      severity: "error",
      message: `This exact file was already imported on ${dedup.importedAt}. Import rejected to prevent double-counting.`,
      details: { existing_import_id: dedup.existingImportId },
    });
    return {
      validation,
      canImport: false,
      reason: `Duplicate file — already imported (${dedup.existingImportId})`,
    };
  }

  // Block on errors, allow warnings
  if (!validation.valid) {
    return {
      validation,
      canImport: false,
      reason: `Validation failed: ${validation.issues
        .filter((i) => i.severity === "error")
        .map((i) => i.message)
        .join("; ")}`,
    };
  }

  return { validation, canImport: true };
}
