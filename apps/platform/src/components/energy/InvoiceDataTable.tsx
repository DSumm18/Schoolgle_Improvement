"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Flame,
  FileText,
  Loader2,
  Receipt,
  ArrowUpDown,
  AlertOctagon,
  Info,
  DollarSign,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────

interface InvoiceDataTableProps {
  organizationId: string;
  selectedMeterRef?: string | null;
  onClearSelectedMeter?: () => void;
}

interface OtherChargeBreakdown {
  label: string;
  amount: number;
}

interface RawExtracted {
  source: string;
  confidence: number;
  file: string;
}

interface Invoice {
  id: string;
  invoice_date: string;
  period: string;
  invoice_number: string;
  fuel_type: "electricity" | "gas";
  meter_ref: string;
  prev_reading: number;
  curr_reading: number;
  reading_type: "actual" | "estimated" | "customer" | "smart";
  kwh_used: number;
  unit_rate_pence: number;
  standing_charge: number;
  ccl: number;
  other_charges: number;
  other_charges_breakdown: OtherChargeBreakdown[];
  net: number;
  vat: number;
  total: number;
  raw_extracted?: RawExtracted;
}

interface FinanceMatch {
  invoice_number: string;
  transaction_ref: string;
  transaction_amount: number;
  transaction_date: string;
  variance: number;
  status: "matched" | "variance";
}

interface InvoiceSummary {
  total_invoices: number;
  total_kwh_electricity: number;
  total_kwh_gas: number;
  total_cost: number;
  estimated_count: number;
  actual_count: number;
  matched_count: number;
  variance_count: number;
  unmatched_count: number;
  total_variance: number;
}

type SortKey =
  | "invoice_date"
  | "period"
  | "kwh_used"
  | "total"
  | "reading_type"
  | "meter_ref";
type SortDir = "asc" | "desc";

// ─── Helpers ─────────────────────────────────────────────────────────

function fmtGBP(n: number, decimals = 2) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat("en-GB").format(Math.round(n));
}

function fmtPence(n: number) {
  return `${n.toFixed(2)}p`;
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Reading type badge ──────────────────────────────────────────────

const READING_TYPE_STYLES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  actual: {
    label: "Actual",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
  estimated: {
    label: "Estimated",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  customer: {
    label: "Customer",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  smart: {
    label: "Smart",
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-400",
  },
};

function ReadingBadge({ type }: { type: string }) {
  const style = READING_TYPE_STYLES[type] ?? READING_TYPE_STYLES.actual;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

// ─── Finance match icon ──────────────────────────────────────────────

function FinanceMatchCell({
  invoice,
  matchMap,
}: {
  invoice: Invoice;
  matchMap: Map<string, FinanceMatch>;
}) {
  const match = matchMap.get(invoice.invoice_number);
  if (!match) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-xs">
        <XCircle className="h-4 w-4" />
        Unmatched
      </span>
    );
  }
  if (match.status === "matched") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium text-xs">
        <CheckCircle2 className="h-4 w-4" />
        Matched
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-xs">
      <AlertTriangle className="h-4 w-4" />
      Variance
    </span>
  );
}

function VarianceCell({
  invoice,
  matchMap,
}: {
  invoice: Invoice;
  matchMap: Map<string, FinanceMatch>;
}) {
  const match = matchMap.get(invoice.invoice_number);
  if (!match) {
    return (
      <span className="text-red-500 dark:text-red-400 text-xs font-medium">
        --
      </span>
    );
  }
  if (match.status === "matched") {
    return <span className="text-gray-400 dark:text-gray-500 text-xs">--</span>;
  }
  const v = match.variance;
  const colour =
    v > 0
      ? "text-red-600 dark:text-red-400"
      : "text-amber-600 dark:text-amber-400";
  return (
    <span className={`${colour} text-xs font-semibold`}>
      {v > 0 ? "+" : ""}
      {fmtGBP(v)}
    </span>
  );
}

// ─── Consecutive estimated streak detector ───────────────────────────

function detectConsecutiveEstimates(invoices: Invoice[]): Map<string, number> {
  const byMeter = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    const arr = byMeter.get(inv.meter_ref) ?? [];
    arr.push(inv);
    byMeter.set(inv.meter_ref, arr);
  }

  const result = new Map<string, number>();
  for (const [meter, invs] of byMeter) {
    const sorted = [...invs].sort(
      (a, b) =>
        new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime(),
    );
    let maxStreak = 0;
    let streak = 0;
    for (const inv of sorted) {
      if (inv.reading_type === "estimated") {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }
    if (maxStreak >= 3) {
      result.set(meter, maxStreak);
    }
  }
  return result;
}

// ─── Summary Card ────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        alert
          ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon
          className={`h-4 w-4 ${alert ? "text-amber-500" : "text-gray-400 dark:text-gray-500"}`}
        />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div
        className={`text-xl font-bold ${alert ? "text-amber-700 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Expanded row detail ─────────────────────────────────────────────

function InvoiceDetail({
  invoice,
  matchMap,
}: {
  invoice: Invoice;
  matchMap: Map<string, FinanceMatch>;
}) {
  const match = matchMap.get(invoice.invoice_number);
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Charges breakdown */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Charges Breakdown
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Energy ({fmtNumber(invoice.kwh_used)} kWh x{" "}
                  {fmtPence(invoice.unit_rate_pence)})
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {fmtGBP(invoice.kwh_used * (invoice.unit_rate_pence / 100))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Standing charge
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {fmtGBP(invoice.standing_charge)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Climate Change Levy
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {fmtGBP(invoice.ccl)}
                </span>
              </div>
              {invoice.other_charges_breakdown.length > 0 ? (
                invoice.other_charges_breakdown.map((ch, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      {ch.label}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {fmtGBP(ch.amount)}
                    </span>
                  </div>
                ))
              ) : invoice.other_charges > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Other charges
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {fmtGBP(invoice.other_charges)}
                  </span>
                </div>
              ) : null}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-1 flex justify-between font-semibold">
                <span className="text-gray-700 dark:text-gray-200">Net</span>
                <span className="text-gray-900 dark:text-white">
                  {fmtGBP(invoice.net)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  VAT (5%)
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {fmtGBP(invoice.vat)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-1 flex justify-between font-bold text-base">
                <span className="text-gray-700 dark:text-gray-200">Total</span>
                <span className="text-gray-900 dark:text-white">
                  {fmtGBP(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Finance reconciliation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Finance Reconciliation
            </h4>
            {match ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Invoice total
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {fmtGBP(invoice.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Finance system
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {fmtGBP(match.transaction_amount)}
                  </span>
                </div>
                {match.status === "variance" && (
                  <div className="flex justify-between border-t border-amber-200 dark:border-amber-700 pt-1">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">
                      Variance
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-bold">
                      {match.variance > 0 ? "+" : ""}
                      {fmtGBP(match.variance)}
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  Transaction ref: {match.transaction_ref}
                </div>
                <div className="text-xs text-gray-400">
                  Transaction date: {fmtDate(match.transaction_date)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    No matching finance transaction
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">
                    Invoice {invoice.invoice_number} has not been reconciled
                    against any payment record.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI extraction info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              AI Extraction
            </h4>
            {invoice.raw_extracted ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Source
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {invoice.raw_extracted.source}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Confidence
                  </span>
                  <span
                    className={`font-medium ${
                      invoice.raw_extracted.confidence >= 0.95
                        ? "text-green-600 dark:text-green-400"
                        : invoice.raw_extracted.confidence >= 0.85
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {(invoice.raw_extracted.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">File</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs truncate max-w-[200px]">
                    {invoice.raw_extracted.file}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No extraction data available
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function InvoiceDataTable({
  organizationId,
  selectedMeterRef,
  onClearSelectedMeter,
}: InvoiceDataTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [financeMatches, setFinanceMatches] = useState<FinanceMatch[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fuelFilter, setFuelFilter] = useState<"electricity" | "gas">("gas");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("invoice_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const hasInvoices = invoices.length > 0;

  // Authenticated fetch
  const authFetch = useCallback(async (url: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return fetch(url, { headers });
  }, []);

  // Fetch invoice data
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(
          `/api/estates/energy/invoice-data?organizationId=${organizationId}`,
        );
        if (!res.ok) throw new Error("Failed to load invoice data");
        const data = await res.json();
        if (cancelled) return;
        setInvoices(data.invoices ?? []);
        setFinanceMatches(data.finance_matches ?? []);
        setSummary(data.summary ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load invoices");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, authFetch]);

  // Finance match map
  const matchMap = useMemo(() => {
    const m = new Map<string, FinanceMatch>();
    for (const fm of financeMatches) {
      m.set(fm.invoice_number, fm);
    }
    return m;
  }, [financeMatches]);

  useEffect(() => {
    if (invoices.length === 0) return;
    if (selectedMeterRef) {
      const selectedInvoice = invoices.find(
        (inv) => inv.meter_ref === selectedMeterRef,
      );
      if (
        selectedInvoice?.fuel_type === "gas" ||
        selectedInvoice?.fuel_type === "electricity"
      ) {
        setFuelFilter(selectedInvoice.fuel_type);
        return;
      }
    }

    const hasCurrentFuel = invoices.some((inv) => inv.fuel_type === fuelFilter);
    const hasGas = invoices.some((inv) => inv.fuel_type === "gas");
    const hasElectricity = invoices.some((inv) => inv.fuel_type === "electricity");

    if (!hasCurrentFuel) {
      setFuelFilter(hasGas ? "gas" : hasElectricity ? "electricity" : fuelFilter);
    }
  }, [fuelFilter, invoices, selectedMeterRef]);

  // Filtered + sorted invoices
  const filtered = useMemo(() => {
    const arr = invoices.filter(
      (inv) =>
        inv.fuel_type === fuelFilter &&
        (!selectedMeterRef || inv.meter_ref === selectedMeterRef),
    );

    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "invoice_date":
          cmp =
            new Date(a.invoice_date).getTime() -
            new Date(b.invoice_date).getTime();
          break;
        case "period":
          cmp = a.period.localeCompare(b.period);
          break;
        case "kwh_used":
          cmp = a.kwh_used - b.kwh_used;
          break;
        case "total":
          cmp = a.total - b.total;
          break;
        case "reading_type":
          cmp = a.reading_type.localeCompare(b.reading_type);
          break;
        case "meter_ref":
          cmp = a.meter_ref.localeCompare(b.meter_ref);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [invoices, fuelFilter, selectedMeterRef, sortKey, sortDir]);

  // Estimated warnings
  const estimatedInvoices = useMemo(
    () => invoices.filter((inv) => inv.reading_type === "estimated"),
    [invoices],
  );

  const consecutiveEstimates = useMemo(
    () => detectConsecutiveEstimates(invoices),
    [invoices],
  );

  // Avg cost per kWh
  const avgCostPerKwh = useMemo(() => {
    if (!summary) return 0;
    const totalKwh = summary.total_kwh_electricity + summary.total_kwh_gas;
    return totalKwh > 0 ? summary.total_cost / totalKwh : 0;
  }, [summary]);

  // Sort handler
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortableHeader({
    label,
    sortKeyVal,
    className = "",
  }: {
    label: string;
    sortKeyVal: SortKey;
    className?: string;
  }) {
    const active = sortKey === sortKeyVal;
    return (
      <th
        className={`px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-gray-900 dark:hover:text-white transition-colors ${
          active
            ? "text-gray-900 dark:text-white"
            : "text-gray-500 dark:text-gray-400"
        } ${className}`}
        onClick={() => handleSort(sortKeyVal)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        </span>
      </th>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <span className="ml-3 text-gray-500 dark:text-gray-400">
          Loading invoice data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <span className="text-red-600 dark:text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 print:space-y-2">
      {!hasInvoices && (
        <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-teal-900 dark:text-teal-200">
                No energy invoices imported yet
              </h3>
              <p className="mt-1 text-sm text-teal-800 dark:text-teal-300">
                Energy becomes useful once invoices or meter readings are in the
                school record. The extraction route can process an uploaded PDF
                or a selected Google Drive file, then create the invoice, meter
                reference, kWh usage, cost and finance reconciliation data.
              </p>
              <p className="mt-2 text-xs text-teal-700 dark:text-teal-400">
                A full private Drive folder connection still needs an authorised
                Drive picker/sync step, so we should present this as import-first
                rather than automatic folder monitoring.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard
          icon={Receipt}
          label="Total Invoices"
          value={fmtNumber(summary?.total_invoices ?? 0)}
          sub={`${fmtNumber(filtered.length)} ${fuelFilter}`}
        />
        <SummaryCard
          icon={Zap}
          label="Total kWh"
          value={fmtNumber(
            (summary?.total_kwh_electricity ?? 0) +
              (summary?.total_kwh_gas ?? 0),
          )}
          sub={`E: ${fmtNumber(summary?.total_kwh_electricity ?? 0)} / G: ${fmtNumber(summary?.total_kwh_gas ?? 0)}`}
        />
        <SummaryCard
          icon={DollarSign}
          label="Total Cost"
          value={fmtGBP(summary?.total_cost ?? 0, 0)}
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Estimated Readings"
          value={String(summary?.estimated_count ?? 0)}
          sub={`of ${(summary?.estimated_count ?? 0) + (summary?.actual_count ?? 0)} readings`}
          alert={(summary?.estimated_count ?? 0) > 0}
        />
        <SummaryCard
          icon={FileText}
          label="Unreconciled"
          value={fmtGBP(summary?.total_variance ?? 0)}
          sub={`${summary?.variance_count ?? 0} variances, ${summary?.unmatched_count ?? 0} unmatched`}
          alert={(summary?.unmatched_count ?? 0) > 0}
        />
        <SummaryCard
          icon={Gauge}
          label="Avg Cost / kWh"
          value={`${(avgCostPerKwh * 100).toFixed(2)}p`}
        />
      </div>

      {/* ═══ Reconciliation Summary Bar ═══ */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 text-sm">
        <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {summary?.matched_count ?? 0} matched
        </span>
        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
          <AlertTriangle className="h-4 w-4" />
          {summary?.variance_count ?? 0} with variance (
          {fmtGBP(summary?.total_variance ?? 0)} total)
        </span>
        <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
          <XCircle className="h-4 w-4" />
          {summary?.unmatched_count ?? 0} unmatched
        </span>
      </div>

      {/* ═══ Estimated Reading Warnings ═══ */}
      {estimatedInvoices.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {estimatedInvoices.length} invoice
                {estimatedInvoices.length !== 1 ? "s" : ""} based on estimated
                meter readings — submit actual readings to improve accuracy
              </p>

              {consecutiveEstimates.size > 0 && (
                <div className="mt-3 space-y-2">
                  {Array.from(consecutiveEstimates.entries()).map(
                    ([meter, count]) => (
                      <div
                        key={meter}
                        className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700"
                      >
                        <AlertOctagon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-red-800 dark:text-red-300 text-sm">
                            RISK: {count} consecutive estimated readings on
                            meter {meter}
                          </p>
                          <p className="text-red-700 dark:text-red-400 text-xs mt-0.5">
                            Financial exposure may be significant. Your supplier
                            may issue a large back-bill when an actual reading
                            is taken.
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Fuel Type Toggle ═══ */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFuelFilter("electricity")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            fuelFilter === "electricity"
              ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/60"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          }`}
        >
          <Zap className="h-4 w-4" />
          Electricity
        </button>
        <button
          onClick={() => setFuelFilter("gas")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            fuelFilter === "gas"
              ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          }`}
        >
          <Flame className="h-4 w-4" />
          Gas
        </button>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {selectedMeterRef && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">
              Showing invoice data for meter {selectedMeterRef}
            </p>
            <p className="text-xs text-teal-700 dark:text-teal-300">
              Expand a row to review the extracted charges, reading values and
              source file.
            </p>
          </div>
          {onClearSelectedMeter && (
            <button
              onClick={onClearSelectedMeter}
              className="rounded-lg border border-teal-200 dark:border-teal-700 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-200 hover:bg-white dark:hover:bg-slate-800"
            >
              Show all meters
            </button>
          )}
        </div>
      )}

      {/* ═══ Data Table ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden print:border print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[1200px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
                <th className="w-8 px-3 py-3" />
                <SortableHeader label="Date" sortKeyVal="invoice_date" />
                <SortableHeader label="Period" sortKeyVal="period" />
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Invoice #
                </th>
                <SortableHeader label="Meter Ref" sortKeyVal="meter_ref" />
                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Prev
                </th>
                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Curr
                </th>
                <SortableHeader
                  label="Type"
                  sortKeyVal="reading_type"
                  className="text-center"
                />
                <SortableHeader
                  label="kWh"
                  sortKeyVal="kwh_used"
                  className="text-right"
                />
                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Rate
                </th>
                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Standing
                </th>
                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  CCL
                </th>
                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Other
                </th>
                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Net
                </th>
                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  VAT
                </th>
                <SortableHeader
                  label="Total"
                  sortKeyVal="total"
                  className="text-right"
                />
                <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Finance
                </th>
                <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Variance
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={18}
                    className="text-center py-12 text-gray-400 dark:text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <span>No {fuelFilter} invoices found</span>
                      <span className="max-w-md text-xs text-gray-400 dark:text-gray-500">
                        Import supplier PDFs or select invoices from Drive to
                        populate this table with real costs, meter references
                        and readings.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const isExpanded = expandedRow === inv.id;
                  const isEstimated = inv.reading_type === "estimated";
                  const match = matchMap.get(inv.invoice_number);
                  const isUnmatched = !match;

                  return (
                    <motion.tbody key={inv.id} layout>
                      <tr
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : inv.id)
                        }
                        className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                          isEstimated
                            ? "bg-amber-50/70 dark:bg-amber-900/10 hover:bg-amber-100/80 dark:hover:bg-amber-900/20"
                            : isUnmatched
                              ? "hover:bg-red-50/50 dark:hover:bg-red-900/10"
                              : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <td className="px-3 py-2.5 text-gray-400">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                          {fmtDate(inv.invoice_date)}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {inv.period}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 font-mono text-xs">
                          {inv.invoice_number}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 font-mono text-xs">
                          {inv.meter_ref}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-500 dark:text-gray-400 font-mono text-xs tabular-nums">
                          {fmtNumber(inv.prev_reading)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-500 dark:text-gray-400 font-mono text-xs tabular-nums">
                          {fmtNumber(inv.curr_reading)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <ReadingBadge type={inv.reading_type} />
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 dark:text-white tabular-nums">
                          {fmtNumber(inv.kwh_used)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300 tabular-nums text-xs">
                          {fmtPence(inv.unit_rate_pence)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300 tabular-nums text-xs">
                          {fmtGBP(inv.standing_charge)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300 tabular-nums text-xs">
                          {fmtGBP(inv.ccl)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300 tabular-nums text-xs">
                          {fmtGBP(inv.other_charges)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300 tabular-nums text-xs">
                          {fmtGBP(inv.net)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300 tabular-nums text-xs">
                          {fmtGBP(inv.vat)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                          {fmtGBP(inv.total)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <FinanceMatchCell invoice={inv} matchMap={matchMap} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <VarianceCell invoice={inv} matchMap={matchMap} />
                        </td>
                      </tr>
                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={18} className="p-0">
                              <InvoiceDetail
                                invoice={inv}
                                matchMap={matchMap}
                              />
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </motion.tbody>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Print footer ═══ */}
      <div className="hidden print:block text-xs text-gray-400 mt-4">
        Generated by Schoolgle Energy Module —{" "}
        {new Date().toLocaleDateString("en-GB")}
      </div>
    </div>
  );
}

export default InvoiceDataTable;
