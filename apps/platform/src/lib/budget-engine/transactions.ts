/**
 * Transaction Intelligence Layer
 *
 * Parses granular transaction data (bank exports, purchase ledger, card statements)
 * and flags anomalies that a head teacher / SBM should challenge:
 *
 * - Duplicate purchases (3 kettles? Really?)
 * - Non-essential spend (luxury items, unnecessary subscriptions)
 * - Repeat transactions for similar items at short intervals
 * - Split transactions (dodging approval thresholds)
 * - Unusual timing (weekends, holidays, end of budget year rush)
 * - Supplier concentration (one supplier getting too much without tender)
 * - Round numbers (estimates not actuals?)
 * - Subscriptions that auto-renew with no review
 */

import { CFR_EXPENDITURE, type CFRCode } from "./types";

// =====================================================
// TRANSACTION TYPES
// =====================================================

export interface Transaction {
  id: string;
  date: string;
  supplier: string;
  description: string;
  amount: number;
  cfr_code?: CFRCode;
  department?: string;
  payment_method?: string;
  reference?: string;
  approved_by?: string;
  /** Computed fields */
  category?: string;
  flags: TransactionFlag[];
}

export interface TransactionFlag {
  type: FlagType;
  severity: "info" | "warning" | "critical";
  message: string;
  detail: string;
  /** Related transaction IDs */
  related_ids?: string[];
  /** Potential saving if addressed */
  potential_saving?: number;
}

export type FlagType =
  | "duplicate_purchase"
  | "repeat_similar"
  | "non_essential"
  | "split_transaction"
  | "unusual_timing"
  | "supplier_concentration"
  | "round_number"
  | "auto_renewal"
  | "quantity_anomaly"
  | "price_anomaly"
  | "budget_year_rush"
  | "no_approval"
  | "exceeds_threshold";

export interface TransactionAnalysis {
  transactions: Transaction[];
  flags: TransactionFlag[];
  summary: {
    total_transactions: number;
    total_spend: number;
    flagged_count: number;
    flagged_spend: number;
    potential_savings: number;
    by_severity: Record<string, number>;
    top_suppliers: { name: string; total: number; count: number }[];
    non_essential_total: number;
  };
  /** Grouped duplicates for easy review */
  duplicate_groups: DuplicateGroup[];
  /** Subscription/recurring detection */
  recurring: RecurringSpend[];
}

export interface DuplicateGroup {
  item_description: string;
  transactions: Transaction[];
  total_spend: number;
  /** AI explanation of why this looks wrong */
  challenge: string;
}

export interface RecurringSpend {
  supplier: string;
  description: string;
  frequency: "weekly" | "monthly" | "quarterly" | "annual";
  average_amount: number;
  total_ytd: number;
  transaction_count: number;
  /** Is this essential or should it be reviewed? */
  essential: boolean;
  review_reason?: string;
}

// =====================================================
// TRANSACTION PARSER
// =====================================================

export function parseTransactionCSV(csv: string): Transaction[] {
  const lines = parseCSVLines(csv);
  if (lines.length < 2) return [];

  const headers = lines[0].map((h) => h.trim().toLowerCase());
  const mapping = detectTransactionColumns(headers);

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && row[0].trim() === ""))
      continue;

    const amount = parseAmount(
      mapping.amount !== null ? row[mapping.amount] : "",
    );
    if (amount === 0) continue;

    const description = (
      mapping.description !== null ? row[mapping.description] : ""
    ).trim();
    const supplier = (
      mapping.supplier !== null ? row[mapping.supplier] : ""
    ).trim();
    const date = (mapping.date !== null ? row[mapping.date] : "").trim();
    const reference = (
      mapping.reference !== null ? row[mapping.reference] : ""
    ).trim();
    const department = (
      mapping.department !== null ? row[mapping.department] : ""
    ).trim();
    const code = (mapping.code !== null ? row[mapping.code] : "").trim();

    const cfrCode = matchCFRFromDescription(description, supplier, code);

    transactions.push({
      id: `txn-${i}`,
      date: normaliseDate(date),
      supplier: supplier || extractSupplier(description),
      description,
      amount: Math.abs(amount),
      cfr_code: cfrCode || undefined,
      department: department || undefined,
      payment_method:
        mapping.payment !== null
          ? (row[mapping.payment] || "").trim()
          : undefined,
      reference: reference || undefined,
      approved_by:
        mapping.approved_by !== null
          ? (row[mapping.approved_by] || "").trim()
          : undefined,
      category: cfrCode ? CFR_EXPENDITURE[cfrCode] : undefined,
      flags: [],
    });
  }

  return transactions;
}

// =====================================================
// ANOMALY DETECTION ENGINE
// =====================================================

export function analyseTransactions(
  transactions: Transaction[],
): TransactionAnalysis {
  const flags: TransactionFlag[] = [];
  const duplicateGroups: DuplicateGroup[] = [];
  const recurring: RecurringSpend[] = [];

  // Run all detectors
  detectDuplicatePurchases(transactions, flags, duplicateGroups);
  detectNonEssentials(transactions, flags);
  detectSplitTransactions(transactions, flags);
  detectUnusualTiming(transactions, flags);
  detectSupplierConcentration(transactions, flags);
  detectRoundNumbers(transactions, flags);
  detectRecurringSpend(transactions, flags, recurring);
  detectBudgetYearRush(transactions, flags);
  detectMissingApprovals(transactions, flags);

  // Assign flags to transactions
  for (const flag of flags) {
    if (flag.related_ids) {
      for (const id of flag.related_ids) {
        const txn = transactions.find((t) => t.id === id);
        if (txn) txn.flags.push(flag);
      }
    }
  }

  // Summary
  const flaggedTxns = transactions.filter((t) => t.flags.length > 0);
  const topSuppliers = getTopSuppliers(transactions);
  const nonEssentialTotal = transactions
    .filter((t) => t.flags.some((f) => f.type === "non_essential"))
    .reduce((s, t) => s + t.amount, 0);

  return {
    transactions,
    flags,
    summary: {
      total_transactions: transactions.length,
      total_spend: transactions.reduce((s, t) => s + t.amount, 0),
      flagged_count: flaggedTxns.length,
      flagged_spend: flaggedTxns.reduce((s, t) => s + t.amount, 0),
      potential_savings: flags.reduce(
        (s, f) => s + (f.potential_saving || 0),
        0,
      ),
      by_severity: {
        critical: flags.filter((f) => f.severity === "critical").length,
        warning: flags.filter((f) => f.severity === "warning").length,
        info: flags.filter((f) => f.severity === "info").length,
      },
      top_suppliers: topSuppliers,
      non_essential_total: nonEssentialTotal,
    },
    duplicate_groups: duplicateGroups,
    recurring,
  };
}

// =====================================================
// DETECTOR: DUPLICATE PURCHASES
// =====================================================

function detectDuplicatePurchases(
  transactions: Transaction[],
  flags: TransactionFlag[],
  groups: DuplicateGroup[],
) {
  // Group by normalised description keywords
  const byItem = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    const key = normaliseItemKey(txn.description);
    if (!key) continue;
    const existing = byItem.get(key) || [];
    existing.push(txn);
    byItem.set(key, existing);
  }

  for (const [key, txns] of byItem) {
    if (txns.length < 2) continue;

    // Check if purchases are suspiciously close together
    const sorted = txns.sort((a, b) => a.date.localeCompare(b.date));
    const totalSpend = txns.reduce((s, t) => s + t.amount, 0);

    // Same item bought multiple times within 30 days
    for (let i = 1; i < sorted.length; i++) {
      const daysBetween = dateDiff(sorted[i - 1].date, sorted[i].date);
      if (daysBetween < 30) {
        const challenge = generateDuplicateChallenge(
          key,
          txns.length,
          totalSpend,
          daysBetween,
        );
        flags.push({
          type: "duplicate_purchase",
          severity: txns.length >= 3 ? "critical" : "warning",
          message: `${txns.length}x purchases of "${humanise(key)}" in ${daysBetween} days`,
          detail: challenge,
          related_ids: txns.map((t) => t.id),
          potential_saving: totalSpend * 0.5, // Assume half could be avoided
        });

        groups.push({
          item_description: humanise(key),
          transactions: txns,
          total_spend: totalSpend,
          challenge,
        });
        break; // One flag per group
      }
    }

    // Same item from different suppliers (price comparison opportunity)
    const suppliers = new Set(txns.map((t) => t.supplier.toLowerCase()));
    if (suppliers.size > 1 && txns.length >= 2) {
      const amounts = txns.map((t) => t.amount);
      const maxDiff = Math.max(...amounts) - Math.min(...amounts);
      if (maxDiff > 5) {
        flags.push({
          type: "price_anomaly",
          severity: "info",
          message: `"${humanise(key)}" bought from ${suppliers.size} suppliers at different prices`,
          detail: `Price range: £${Math.min(...amounts).toFixed(2)} to £${Math.max(...amounts).toFixed(2)}. Consider consolidating to the cheapest supplier or using Deal Finder.`,
          related_ids: txns.map((t) => t.id),
          potential_saving: maxDiff * (txns.length - 1),
        });
      }
    }
  }
}

function generateDuplicateChallenge(
  item: string,
  count: number,
  total: number,
  daysBetween: number,
): string {
  const name = humanise(item);

  // Common-sense challenges
  if (APPLIANCE_KEYWORDS.some((k) => item.includes(k))) {
    return `${count} "${name}" purchased for £${total.toFixed(2)} within ${daysBetween} days. Appliances like this should last years. Was one faulty and returned? If not, why does the school need ${count}?`;
  }
  if (
    item.includes("toner") ||
    item.includes("ink") ||
    item.includes("cartridge")
  ) {
    return `${count} toner/ink purchases (£${total.toFixed(2)}) in ${daysBetween} days. Check if the printer is consuming ink excessively — it may need servicing. Also check if a managed print contract would be cheaper.`;
  }
  if (
    item.includes("chair") ||
    item.includes("desk") ||
    item.includes("furniture")
  ) {
    return `${count} furniture purchases (£${total.toFixed(2)}) in ${daysBetween} days. Were these part of a planned refurbishment? If ad-hoc, bulk ordering would save money.`;
  }
  return `${count} purchases of "${name}" totalling £${total.toFixed(2)} within ${daysBetween} days. Is this intentional or accidental duplication? Consider consolidating into a single bulk order.`;
}

const APPLIANCE_KEYWORDS = [
  "kettle",
  "microwave",
  "toaster",
  "fridge",
  "heater",
  "fan",
  "hoover",
  "vacuum",
  "shredder",
  "laminator",
];

// =====================================================
// DETECTOR: NON-ESSENTIAL SPEND
// =====================================================

const NON_ESSENTIAL_PATTERNS = [
  {
    pattern: /\b(biscuit|cake|treat|sweet|chocolate|confection)\b/i,
    label: "Staff treats/biscuits",
  },
  {
    pattern: /\b(flower|bouquet|wreath|gift|present|hamper)\b/i,
    label: "Gifts/flowers",
  },
  { pattern: /\b(taxi|uber|private hire)\b/i, label: "Taxi/private hire" },
  {
    pattern: /\b(restaurant|dining|meal out|eat out)\b/i,
    label: "Restaurant meals",
  },
  {
    pattern: /\b(premium|pro plan|enterprise|upgrade)\b/i,
    label: "Premium subscription tier",
  },
  {
    pattern: /\b(decoration|ornament|display stand)\b/i,
    label: "Decorative items",
  },
  {
    pattern: /\b(bottled water|water cooler)\b/i,
    label: "Bottled water/cooler",
  },
  {
    pattern: /\b(air freshener|reed diffuser|candle)\b/i,
    label: "Air fresheners/candles",
  },
  {
    pattern: /\b(coffee machine|coffee pod|nespresso|dolce gusto)\b/i,
    label: "Coffee machine/pods",
  },
];

function detectNonEssentials(
  transactions: Transaction[],
  flags: TransactionFlag[],
) {
  for (const txn of transactions) {
    const desc = txn.description.toLowerCase();
    for (const { pattern, label } of NON_ESSENTIAL_PATTERNS) {
      if (pattern.test(desc)) {
        flags.push({
          type: "non_essential",
          severity: txn.amount > 50 ? "warning" : "info",
          message: `Non-essential spend: ${label}`,
          detail: `£${txn.amount.toFixed(2)} on "${txn.description}" from ${txn.supplier || "unknown supplier"}. Consider whether this is appropriate use of school funds.`,
          related_ids: [txn.id],
          potential_saving: txn.amount,
        });
        break;
      }
    }
  }
}

// =====================================================
// DETECTOR: SPLIT TRANSACTIONS
// =====================================================

function detectSplitTransactions(
  transactions: Transaction[],
  flags: TransactionFlag[],
) {
  // Common approval thresholds in schools
  const THRESHOLDS = [250, 500, 1000, 2500, 5000];

  // Group by supplier + date
  const bySupplierDate = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const key = `${txn.supplier.toLowerCase()}_${txn.date}`;
    const existing = bySupplierDate.get(key) || [];
    existing.push(txn);
    bySupplierDate.set(key, existing);
  }

  for (const [, txns] of bySupplierDate) {
    if (txns.length < 2) continue;
    const total = txns.reduce((s, t) => s + t.amount, 0);
    const max = Math.max(...txns.map((t) => t.amount));

    for (const threshold of THRESHOLDS) {
      // Each transaction is just under a threshold but combined they exceed it
      if (
        max < threshold &&
        total > threshold &&
        txns.every((t) => t.amount > threshold * 0.3)
      ) {
        flags.push({
          type: "split_transaction",
          severity: "critical",
          message: `Possible split transaction to avoid £${threshold} approval threshold`,
          detail: `${txns.length} transactions to ${txns[0].supplier} on ${txns[0].date} totalling £${total.toFixed(2)}. Each is under £${threshold} but combined they exceed it. This may indicate an attempt to bypass approval controls.`,
          related_ids: txns.map((t) => t.id),
        });
        break;
      }
    }
  }
}

// =====================================================
// DETECTOR: UNUSUAL TIMING
// =====================================================

function detectUnusualTiming(
  transactions: Transaction[],
  flags: TransactionFlag[],
) {
  // School holidays (approximate UK dates)
  const HOLIDAY_RANGES = [
    { start: "07-20", end: "09-01", label: "summer holiday" },
    { start: "12-20", end: "01-05", label: "Christmas holiday" },
  ];

  for (const txn of transactions) {
    if (!txn.date) continue;

    const monthDay = txn.date.slice(5); // MM-DD

    // Weekend check (if we have day info)
    const d = new Date(txn.date);
    if (!isNaN(d.getTime())) {
      const day = d.getDay();
      if (day === 0 || day === 6) {
        flags.push({
          type: "unusual_timing",
          severity: "info",
          message: "Weekend transaction",
          detail: `£${txn.amount.toFixed(2)} to ${txn.supplier} on a ${day === 0 ? "Sunday" : "Saturday"} (${txn.date}). Who authorised a purchase outside working hours?`,
          related_ids: [txn.id],
        });
      }
    }

    // Holiday check
    for (const hol of HOLIDAY_RANGES) {
      if (
        (monthDay >= hol.start && monthDay <= hol.end) ||
        (hol.start > hol.end && (monthDay >= hol.start || monthDay <= hol.end))
      ) {
        if (txn.amount > 100) {
          flags.push({
            type: "unusual_timing",
            severity: "warning",
            message: `Purchase during ${hol.label}`,
            detail: `£${txn.amount.toFixed(2)} to ${txn.supplier} during ${hol.label}. Is this a necessary spend while school is closed?`,
            related_ids: [txn.id],
          });
        }
        break;
      }
    }
  }
}

// =====================================================
// DETECTOR: SUPPLIER CONCENTRATION
// =====================================================

function detectSupplierConcentration(
  transactions: Transaction[],
  flags: TransactionFlag[],
) {
  const bySupplier = new Map<
    string,
    { total: number; count: number; ids: string[] }
  >();

  for (const txn of transactions) {
    const key = txn.supplier.toLowerCase().trim();
    if (!key) continue;
    const existing = bySupplier.get(key) || { total: 0, count: 0, ids: [] };
    existing.total += txn.amount;
    existing.count++;
    existing.ids.push(txn.id);
    bySupplier.set(key, existing);
  }

  const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);

  for (const [supplier, data] of bySupplier) {
    const pct = (data.total / totalSpend) * 100;

    // Single supplier > 20% of total spend and > £5000
    if (pct > 20 && data.total > 5000) {
      flags.push({
        type: "supplier_concentration",
        severity: "warning",
        message: `${supplier} accounts for ${pct.toFixed(0)}% of total spend`,
        detail: `£${data.total.toFixed(2)} across ${data.count} transactions. High supplier concentration increases risk. Consider whether competitive quotes have been obtained (required for orders > £5,000 in most school financial regulations).`,
        related_ids: data.ids.slice(0, 5),
      });
    }
  }
}

// =====================================================
// DETECTOR: ROUND NUMBERS
// =====================================================

function detectRoundNumbers(
  transactions: Transaction[],
  flags: TransactionFlag[],
) {
  for (const txn of transactions) {
    if (txn.amount >= 100 && txn.amount % 100 === 0) {
      flags.push({
        type: "round_number",
        severity: "info",
        message: "Suspiciously round amount",
        detail: `£${txn.amount.toFixed(2)} is an exact round number. Real invoices rarely land on exact hundreds. Is this an estimate, prepayment, or accrual rather than an actual invoice?`,
        related_ids: [txn.id],
      });
    }
  }
}

// =====================================================
// DETECTOR: RECURRING / SUBSCRIPTIONS
// =====================================================

function detectRecurringSpend(
  transactions: Transaction[],
  flags: TransactionFlag[],
  recurring: RecurringSpend[],
) {
  // Group by supplier + similar description
  const bySupplierDesc = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    const key = `${txn.supplier.toLowerCase()}_${normaliseItemKey(txn.description)}`;
    const existing = bySupplierDesc.get(key) || [];
    existing.push(txn);
    bySupplierDesc.set(key, existing);
  }

  for (const [key, txns] of bySupplierDesc) {
    if (txns.length < 3) continue;

    const sorted = txns.sort((a, b) => a.date.localeCompare(b.date));
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(dateDiff(sorted[i - 1].date, sorted[i].date));
    }

    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    let frequency: RecurringSpend["frequency"] | null = null;
    if (avgGap < 10) frequency = "weekly";
    else if (avgGap >= 25 && avgGap <= 35) frequency = "monthly";
    else if (avgGap >= 80 && avgGap <= 100) frequency = "quarterly";
    else if (avgGap >= 340 && avgGap <= 390) frequency = "annual";

    if (!frequency) continue;

    const avgAmount = txns.reduce((s, t) => s + t.amount, 0) / txns.length;
    const totalYtd = txns.reduce((s, t) => s + t.amount, 0);
    const supplier = txns[0].supplier;
    const desc = txns[0].description;

    // Is this essential?
    const isEssential = ESSENTIAL_RECURRING.some(
      (p) =>
        desc.toLowerCase().includes(p) || supplier.toLowerCase().includes(p),
    );

    const entry: RecurringSpend = {
      supplier,
      description: desc,
      frequency,
      average_amount: avgAmount,
      total_ytd: totalYtd,
      transaction_count: txns.length,
      essential: isEssential,
    };

    if (!isEssential) {
      entry.review_reason = `This ${frequency} payment of ~£${avgAmount.toFixed(2)} to ${supplier} may be an auto-renewing subscription. Is it still needed? Has it been reviewed this year?`;
      flags.push({
        type: "auto_renewal",
        severity: totalYtd > 500 ? "warning" : "info",
        message: `Recurring ${frequency} payment: ${supplier}`,
        detail: entry.review_reason,
        related_ids: txns.map((t) => t.id),
        potential_saving: totalYtd,
      });
    }

    recurring.push(entry);
  }
}

const ESSENTIAL_RECURRING = [
  "energy",
  "electricity",
  "gas",
  "water",
  "rates",
  "insurance",
  "broadband",
  "internet",
  "telephone",
  "phone",
  "payroll",
  "pension",
  "hmrc",
  "teacher pension",
  "catering contract",
  "cleaning contract",
  "waste collection",
  "refuse",
];

// =====================================================
// DETECTOR: BUDGET YEAR RUSH
// =====================================================

function detectBudgetYearRush(
  transactions: Transaction[],
  flags: TransactionFlag[],
) {
  // Group by month
  const byMonth = new Map<string, number>();
  for (const txn of transactions) {
    const month = txn.date.slice(0, 7); // YYYY-MM
    byMonth.set(month, (byMonth.get(month) || 0) + txn.amount);
  }

  const months = Array.from(byMonth.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  if (months.length < 3) return;

  const avgMonthly = months.reduce((s, [, v]) => s + v, 0) / months.length;

  // Check last 2 months for spikes (March for LA, August for Academy)
  for (const [month, total] of months.slice(-2)) {
    if (total > avgMonthly * 2 && total > 5000) {
      const txnsInMonth = transactions.filter((t) => t.date.startsWith(month));
      flags.push({
        type: "budget_year_rush",
        severity: "warning",
        message: `Spending spike in ${month}: £${total.toFixed(0)} (${((total / avgMonthly) * 100).toFixed(0)}% of average)`,
        detail: `${txnsInMonth.length} transactions in ${month} totalling £${total.toFixed(2)} — more than double the monthly average of £${avgMonthly.toFixed(2)}. End-of-year spending rushes waste money. Are these genuine needs or "use it or lose it" purchases?`,
        related_ids: txnsInMonth.slice(0, 10).map((t) => t.id),
        potential_saving: total - avgMonthly,
      });
    }
  }
}

// =====================================================
// DETECTOR: MISSING APPROVALS
// =====================================================

function detectMissingApprovals(
  transactions: Transaction[],
  flags: TransactionFlag[],
) {
  // Only flag if some transactions have approvers (meaning the data includes this field)
  const hasApprovalData = transactions.some((t) => t.approved_by);
  if (!hasApprovalData) return;

  for (const txn of transactions) {
    if (!txn.approved_by && txn.amount > 250) {
      flags.push({
        type: "no_approval",
        severity: txn.amount > 1000 ? "critical" : "warning",
        message: `No approval recorded for £${txn.amount.toFixed(2)} transaction`,
        detail: `Payment to ${txn.supplier} for "${txn.description}" has no approver logged. School financial regulations typically require approval for orders over £250.`,
        related_ids: [txn.id],
      });
    }
  }
}

// =====================================================
// HELPERS
// =====================================================

function normaliseItemKey(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\b(x\d+|\d+\s*(pack|box|set|pcs|units?))\b/g, "")
    .replace(/\b(a4|a3|a5)\b/g, "paper")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .sort()
    .join(" ");
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "per",
  "each",
  "qty",
  "item",
  "order",
  "ref",
  "inv",
  "invoice",
  "payment",
]);

function humanise(key: string): string {
  return key
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function dateDiff(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 999;
  return Math.abs(
    Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function getTopSuppliers(
  transactions: Transaction[],
): { name: string; total: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const txn of transactions) {
    const key = txn.supplier || "Unknown";
    const existing = map.get(key) || { total: 0, count: 0 };
    existing.total += txn.amount;
    existing.count++;
    map.set(key, existing);
  }
  return Array.from(map.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

function normaliseDate(raw: string): string {
  if (!raw) return "";
  // Try DD/MM/YYYY (UK format)
  const ukMatch = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (ukMatch) {
    return `${ukMatch[3]}-${ukMatch[2].padStart(2, "0")}-${ukMatch[1].padStart(2, "0")}`;
  }
  // Try YYYY-MM-DD (ISO)
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  return raw;
}

function extractSupplier(description: string): string {
  // Try to pull supplier name from common patterns
  const patterns = [
    /^(.*?)\s*[-–]\s/,
    /^(.*?)\s*:\s/,
    /paid to\s+(.*?)(?:\s|$)/i,
    /payment to\s+(.*?)(?:\s|$)/i,
  ];
  for (const pat of patterns) {
    const m = description.match(pat);
    if (m && m[1].length > 2 && m[1].length < 50) return m[1].trim();
  }
  return "";
}

function matchCFRFromDescription(
  desc: string,
  supplier: string,
  code: string,
): CFRCode | null {
  // Try direct code first
  if (code) {
    const normalised = code.toUpperCase().replace(/[-.\s]/g, "");
    if (normalised in CFR_EXPENDITURE) return normalised as CFRCode;
  }

  const text = `${desc} ${supplier}`.toLowerCase();

  const PATTERNS: [RegExp, CFRCode][] = [
    [/\b(electricity|gas|energy|heating|fuel)\b/, "E16"],
    [/\b(water|sewerage)\b/, "E15"],
    [/\b(cleaning|caretaking|janitorial)\b/, "E14"],
    [/\b(stationery|paper|pen|pencil|ruler|glue|scissor)\b/, "E19"],
    [/\b(book|textbook|workbook|reading scheme)\b/, "E19"],
    [/\b(laptop|tablet|chromebook|ipad|computer)\b/, "E20E"],
    [/\b(printer|toner|ink|cartridge)\b/, "E20F"],
    [/\b(broadband|internet|wifi|network)\b/, "E20A"],
    [/\b(software|licence|subscription|saas)\b/, "E20D"],
    [/\b(food|ingredients|catering supplies|kitchen)\b/, "E25"],
    [/\b(insurance)\b/, "E23"],
    [/\b(postage|stamp|telephone|phone)\b/, "E22"],
    [/\b(repair|maintenance|plumber|electrician|roofing)\b/, "E12"],
    [/\b(grounds|landscaping|grass|tree)\b/, "E13"],
    [/\b(training|cpd|course|conference|inset)\b/, "E09"],
    [/\b(furniture|desk|chair|table|shelving)\b/, "E19"],
    [/\b(kettle|microwave|fridge|appliance)\b/, "E18"],
    [/\b(exam|examination)\b/, "E21"],
    [/\b(agency|supply teacher|supply staff)\b/, "E26"],
  ];

  for (const [pattern, cfrCode] of PATTERNS) {
    if (pattern.test(text)) return cfrCode;
  }

  return null;
}

// =====================================================
// CSV PARSING (shared)
// =====================================================

function parseCSVLines(csv: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"' && csv[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\n" || (ch === "\r" && csv[i + 1] === "\n")) {
        current.push(field);
        field = "";
        if (current.some((c) => c.trim() !== "")) rows.push(current);
        current = [];
        if (ch === "\r") i++;
      } else field += ch;
    }
  }
  current.push(field);
  if (current.some((c) => c.trim() !== "")) rows.push(current);
  return rows;
}

function parseAmount(raw: string | undefined): number {
  if (!raw) return 0;
  let cleaned = raw.trim().replace(/[£$€\s,]/g, "");
  let negative = false;
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    cleaned = cleaned.slice(1, -1);
    negative = true;
  }
  if (cleaned.startsWith("-")) {
    cleaned = cleaned.slice(1);
    negative = true;
  }
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return negative ? -num : num;
}

interface TransactionColumnMapping {
  date: number | null;
  supplier: number | null;
  description: number | null;
  amount: number | null;
  code: number | null;
  department: number | null;
  reference: number | null;
  payment: number | null;
  approved_by: number | null;
}

function detectTransactionColumns(headers: string[]): TransactionColumnMapping {
  const m: TransactionColumnMapping = {
    date: null,
    supplier: null,
    description: null,
    amount: null,
    code: null,
    department: null,
    reference: null,
    payment: null,
    approved_by: null,
  };

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].replace(/[^a-z0-9 _/]/g, "").trim();

    if (!m.date && (h.includes("date") || h === "when")) m.date = i;
    else if (
      !m.supplier &&
      (h.includes("supplier") ||
        h.includes("vendor") ||
        h.includes("payee") ||
        h.includes("paid to") ||
        h.includes("contact"))
    )
      m.supplier = i;
    else if (
      !m.description &&
      (h.includes("description") ||
        h.includes("narrative") ||
        h.includes("detail") ||
        h.includes("memo") ||
        h.includes("item"))
    )
      m.description = i;
    else if (
      !m.amount &&
      (h.includes("amount") ||
        h.includes("value") ||
        h.includes("total") ||
        h.includes("net") ||
        h.includes("gross") ||
        h.includes("debit"))
    )
      m.amount = i;
    else if (
      !m.code &&
      (h.includes("code") ||
        h.includes("account") ||
        h.includes("nominal") ||
        h.includes("cfr") ||
        h.includes("ledger"))
    )
      m.code = i;
    else if (
      !m.department &&
      (h.includes("department") ||
        h.includes("cost centre") ||
        h.includes("dept"))
    )
      m.department = i;
    else if (
      !m.reference &&
      (h.includes("reference") ||
        h.includes("ref") ||
        h.includes("invoice") ||
        h.includes("po number"))
    )
      m.reference = i;
    else if (
      !m.payment &&
      (h.includes("payment") || h.includes("method") || h.includes("type"))
    )
      m.payment = i;
    else if (
      !m.approved_by &&
      (h.includes("approved") ||
        h.includes("authorised") ||
        h.includes("authorized"))
    )
      m.approved_by = i;
  }

  return m;
}

// =====================================================
// SAMPLE TRANSACTION CSV
// =====================================================

export function generateSampleTransactionCSV(): string {
  const headers = [
    "Date",
    "Supplier",
    "Description",
    "Amount",
    "Department",
    "Reference",
    "Approved By",
  ];
  const rows = [
    [
      "01/04/2025",
      "Amazon Business",
      "Kettle - Staff Room",
      "29.99",
      "Office",
      "PO-001",
      "J Smith",
    ],
    [
      "05/04/2025",
      "Amazon Business",
      "Kettle - Year 3 Area",
      "34.99",
      "Teaching",
      "PO-002",
      "J Smith",
    ],
    [
      "08/04/2025",
      "Amazon Business",
      "Kettle - Reception Kitchen",
      "27.50",
      "Office",
      "PO-003",
      "",
    ],
    [
      "10/04/2025",
      "YPO",
      "A4 Paper White 80gsm x10 reams",
      "32.50",
      "Office",
      "PO-004",
      "J Smith",
    ],
    [
      "12/04/2025",
      "Lyreco",
      "A4 Paper White 80gsm x5 reams",
      "19.99",
      "Teaching",
      "PO-005",
      "A Jones",
    ],
    [
      "15/04/2025",
      "Tesco",
      "Staff Biscuits Assorted",
      "8.50",
      "Office",
      "PO-006",
      "",
    ],
    [
      "22/04/2025",
      "Tesco",
      "Staff Biscuits Assorted",
      "8.50",
      "Office",
      "PO-007",
      "",
    ],
    [
      "29/04/2025",
      "Tesco",
      "Staff Biscuits Assorted",
      "8.50",
      "Office",
      "PO-008",
      "",
    ],
    [
      "01/05/2025",
      "British Gas",
      "Electricity April",
      "1200.00",
      "Premises",
      "DD-001",
      "J Smith",
    ],
    [
      "01/05/2025",
      "Twinkl",
      "Twinkl Ultimate Subscription",
      "129.00",
      "Teaching",
      "DD-002",
      "",
    ],
    [
      "01/06/2025",
      "Twinkl",
      "Twinkl Ultimate Subscription",
      "129.00",
      "Teaching",
      "DD-003",
      "",
    ],
    [
      "01/07/2025",
      "Twinkl",
      "Twinkl Ultimate Subscription",
      "129.00",
      "Teaching",
      "DD-004",
      "",
    ],
    [
      "15/05/2025",
      "Screwfix",
      "Paint Supplies",
      "245.00",
      "Premises",
      "PO-009",
      "B Brown",
    ],
    [
      "15/05/2025",
      "Screwfix",
      "Brushes and Rollers",
      "245.00",
      "Premises",
      "PO-010",
      "B Brown",
    ],
    [
      "25/07/2025",
      "Furniture Direct",
      "Teacher Desk Oak",
      "350.00",
      "Teaching",
      "PO-011",
      "J Smith",
    ],
    [
      "02/08/2025",
      "Furniture Direct",
      "Teacher Chair Ergonomic",
      "280.00",
      "Teaching",
      "PO-012",
      "J Smith",
    ],
  ];

  return [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
}
