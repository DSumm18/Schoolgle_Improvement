"use client";

import React, { useState, useEffect } from "react";
import {
  PoundSterling,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Upload,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// =====================================================
// TYPES
// =====================================================

interface MonthlyPoint {
  month: string;
  planned_cumulative: number;
  actual_cumulative: number;
}

interface CFRLine {
  cfr_code: string;
  description: string;
  group: string;
  budget: number;
  actual: number;
  committed: number;
  variance: number;
  variance_percent: number;
  rag: "red" | "amber" | "green";
  monthly_profile: MonthlyPoint[];
}

interface MonitorData {
  financial_year: string;
  school_name: string;
  pupil_count: number;
  budget_cycle: "la" | "academy";
  fy_start: string;
  fy_end: string;
  as_at_date: string;
  months_elapsed: number;
  months_total: number;
  total_income: number;
  total_budget: number;
  total_spend: number;
  total_committed: number;
  remaining: number;
  percent_spent: number;
  projected_year_end: number;
  projected_surplus_deficit: number;
  staffing_spend: number;
  staffing_percent_of_income: number;
  staffing_target: number;
  lines: CFRLine[];
}

// =====================================================
// HELPERS
// =====================================================

function fmtFull(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ragColor(rag: string) {
  switch (rag) {
    case "red":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        dot: "bg-red-500",
        badge: "bg-red-100 text-red-700",
      };
    case "amber":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
        badge: "bg-amber-100 text-amber-700",
      };
    default:
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        badge: "bg-emerald-100 text-emerald-700",
      };
  }
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div
          className={`rounded-lg p-2.5 ${color === "text-red-700" ? "bg-red-50" : color === "text-amber-700" ? "bg-amber-50" : "bg-gray-50"}`}
        >
          <Icon
            className={`h-5 w-5 ${color === "text-red-700" ? "text-red-500" : color === "text-amber-700" ? "text-amber-500" : "text-gray-400"}`}
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SPEND PROFILE CHART (CSS bars)
// =====================================================

function SpendProfileChart({
  lines,
  monthsElapsed,
}: {
  lines: CFRLine[];
  monthsElapsed: number;
}) {
  // Aggregate monthly profiles across all expenditure lines
  const months = [
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
  ];

  const aggregated = months.map((month, i) => {
    let planned = 0;
    let actual = 0;
    for (const line of lines.filter((l) => l.budget > 0)) {
      const mp = line.monthly_profile[i];
      if (mp) {
        planned += mp.planned_cumulative;
        actual += mp.actual_cumulative;
      }
    }
    return { month, planned, actual, hasActual: i < monthsElapsed };
  });

  const maxVal = Math.max(
    ...aggregated.map((a) => Math.max(a.planned, a.actual)),
    1,
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Spend Profile</h3>
          <p className="text-xs text-gray-500">
            Cumulative expenditure: budget vs actual
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-gray-200" />{" "}
            Budget
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#FFAA4C]" />{" "}
            Actual
          </span>
        </div>
      </div>

      <div className="flex items-end gap-1.5" style={{ height: 200 }}>
        {aggregated.map((m, i) => {
          const plannedH = (m.planned / maxVal) * 180;
          const actualH = (m.actual / maxVal) * 180;
          const isCurrent = i === monthsElapsed - 1;

          return (
            <div
              key={m.month}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="relative flex w-full items-end justify-center gap-0.5"
                style={{ height: 180 }}
              >
                {/* Budget bar */}
                <div
                  className="w-[40%] rounded-t bg-gray-200 transition-all"
                  style={{ height: plannedH }}
                />
                {/* Actual bar */}
                {m.hasActual && (
                  <div
                    className={`w-[40%] rounded-t transition-all ${
                      isCurrent
                        ? "bg-[#FFAA4C] ring-2 ring-[#FFAA4C]/30"
                        : "bg-[#FFAA4C]"
                    }`}
                    style={{ height: actualH }}
                  />
                )}
                {!m.hasActual && (
                  <div
                    className="w-[40%] rounded-t border border-dashed border-gray-300 bg-transparent"
                    style={{ height: 0 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] ${isCurrent ? "font-bold text-[#FFAA4C]" : "text-gray-400"}`}
              >
                {m.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================
// STAFFING % INDICATOR
// =====================================================

function StaffingIndicator({
  percent,
  target,
}: {
  percent: number;
  target: number;
}) {
  const isOver = percent > target;
  const diff = Math.abs(percent - target);
  const ringColor = isOver
    ? "text-red-500"
    : percent > target - 3
      ? "text-amber-500"
      : "text-emerald-500";
  const bgRing = isOver
    ? "text-red-100"
    : percent > target - 3
      ? "text-amber-100"
      : "text-emerald-100";

  // SVG ring
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(percent / 100, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Staffing % of Income
          </h3>
          <p className="text-xs text-gray-500">
            ICFP target: {target}% maximum
          </p>
        </div>
        <Link
          href="/dashboard/finance/icfp"
          className="flex items-center gap-1 text-xs font-medium text-[#FFAA4C] hover:underline"
        >
          View ICFP <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-32 w-32 flex-shrink-0">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              className={`stroke-current ${bgRing}`}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`stroke-current ${ringColor} transition-all duration-700`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${ringColor}`}>
              {percent}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              isOver
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isOver ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {isOver
              ? `${diff.toFixed(1)}% over target`
              : `${diff.toFixed(1)}% under target`}
          </div>
          <p className="text-xs text-gray-500">
            Projected annual staffing spend as a percentage of total income.
            {isOver &&
              " Consider reviewing staffing structure or income generation."}
          </p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// TOP VARIANCES
// =====================================================

function TopVariances({ lines }: { lines: CFRLine[] }) {
  const sorted = [...lines]
    .filter((l) => l.budget > 0)
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-gray-900">
        Top 5 Variances
      </h3>
      <p className="mb-4 text-xs text-gray-500">
        Biggest over/underspend against profiled budget
      </p>

      <div className="space-y-3">
        {sorted.map((line) => {
          const rc = ragColor(line.rag);
          const isOver = line.variance > 0;
          return (
            <div
              key={line.cfr_code}
              className={`flex items-center gap-3 rounded-lg border p-3 ${rc.border} ${rc.bg}`}
            >
              <div
                className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${rc.dot}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 truncate">
                    {line.cfr_code} {line.description}
                  </span>
                  <span
                    className={`text-xs font-bold ${isOver ? "text-red-700" : "text-emerald-700"}`}
                  >
                    {isOver ? "+" : ""}
                    {fmtFull(line.variance)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">
                    Budget: {fmtFull(line.budget)} | Actual:{" "}
                    {fmtFull(line.actual)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${rc.badge}`}
                  >
                    {line.variance_percent > 0 ? "+" : ""}
                    {line.variance_percent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================
// BUDGET VS ACTUAL TABLE
// =====================================================

function BudgetTable({
  lines,
  filter,
}: {
  lines: CFRLine[];
  filter: "all" | "expenditure" | "income";
}) {
  const filtered = lines.filter((l) => {
    if (filter === "expenditure") return l.budget > 0;
    if (filter === "income") return l.budget < 0;
    return true;
  });

  // Group by group name
  const groups = new Map<string, CFRLine[]>();
  for (const line of filtered) {
    const g = groups.get(line.group) || [];
    g.push(line);
    groups.set(line.group, g);
  }

  const groupOrder = ["Staffing", "Premises", "Supplies", "Other", "Income"];

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                CFR Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Budget
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actual YTD
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Committed
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Variance
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Var %
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                RAG
              </th>
            </tr>
          </thead>
          <tbody>
            {groupOrder
              .filter((g) => groups.has(g))
              .map((groupName) => {
                const groupLines = groups.get(groupName)!;
                const groupBudget = groupLines.reduce(
                  (s, l) => s + l.budget,
                  0,
                );
                const groupActual = groupLines.reduce(
                  (s, l) => s + l.actual,
                  0,
                );
                const groupCommitted = groupLines.reduce(
                  (s, l) => s + l.committed,
                  0,
                );
                const groupVariance = groupLines.reduce(
                  (s, l) => s + l.variance,
                  0,
                );

                return (
                  <React.Fragment key={groupName}>
                    {/* Group header */}
                    <tr className="bg-gray-50/50">
                      <td
                        colSpan={2}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600"
                      >
                        {groupName}
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-bold text-gray-600">
                        {fmtFull(groupBudget)}
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-bold text-gray-600">
                        {fmtFull(groupActual)}
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-bold text-gray-600">
                        {fmtFull(groupCommitted)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right text-xs font-bold ${groupVariance > 0 ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {groupVariance > 0 ? "+" : ""}
                        {fmtFull(groupVariance)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                    {/* Lines */}
                    {groupLines.map((line) => {
                      const rc = ragColor(line.rag);
                      return (
                        <tr
                          key={line.cfr_code}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700">
                              {line.cfr_code}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-700">
                            {line.description}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-medium text-gray-900 tabular-nums">
                            {fmtFull(line.budget)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-medium text-gray-900 tabular-nums">
                            {fmtFull(line.actual)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-gray-500 tabular-nums">
                            {fmtFull(line.committed)}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right text-xs font-medium tabular-nums ${line.variance > 0 ? "text-red-600" : "text-emerald-600"}`}
                          >
                            {line.variance > 0 ? "+" : ""}
                            {fmtFull(line.variance)}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right text-xs font-medium tabular-nums ${rc.text}`}
                          >
                            {line.variance_percent > 0 ? "+" : ""}
                            {line.variance_percent}%
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full ${rc.dot}`}
                              title={line.rag}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

type PeriodFilter = "ytd" | "q1" | "q2" | "q3" | "q4";
type TableFilter = "all" | "expenditure" | "income";

export default function BudgetMonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [period, setPeriod] = useState<PeriodFilter>("ytd");
  const [tableFilter, setTableFilter] = useState<TableFilter>("all");

  useEffect(() => {
    setLoading(true);
    fetch("/api/finance/monitor")
      .then((r) => r.json())
      .then((d: MonitorData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFAA4C] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading budget data...</p>
        </div>
      </div>
    );
  }

  const projectedColor =
    data.projected_surplus_deficit >= 0 ? "text-emerald-700" : "text-red-700";
  const projectedIcon =
    data.projected_surplus_deficit >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#FFAA4C]/10 p-2">
              <PoundSterling className="h-5 w-5 text-[#FFAA4C]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Budget Monitor</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {data.school_name} &mdash; {data.pupil_count} pupils &mdash; as at{" "}
            {new Date(data.as_at_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Academic year */}
          <div className="relative">
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-gray-700 shadow-sm focus:border-[#FFAA4C] focus:outline-none focus:ring-1 focus:ring-[#FFAA4C]"
            >
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Period */}
          <div className="flex rounded-lg border border-gray-200 bg-white shadow-sm">
            {(["ytd", "q1", "q2", "q3", "q4"] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  period === p
                    ? "bg-[#FFAA4C] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Import button */}
          <Link
            href="/dashboard/finance/import"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFAA4C] bg-[#FFAA4C]/5 px-3 py-2 text-xs font-medium text-[#FFAA4C] shadow-sm hover:bg-[#FFAA4C]/10 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Import Ledger Data
          </Link>
        </div>
      </div>

      {/* ── DEMO BANNER ── */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Demo Mode</span> &mdash; Showing
          sample data for a 210-pupil primary school. Import your FMS/Xero/Sage
          export to see real figures.
        </p>
      </div>

      {/* ── SUMMARY STRIP ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Budget"
          value={fmtFull(data.total_budget)}
          subtitle={`Income: ${fmtFull(data.total_income)}`}
          icon={PoundSterling}
          color="text-gray-900"
        />
        <SummaryCard
          label="Spend to Date"
          value={fmtFull(data.total_spend)}
          subtitle={`+ ${fmtFull(data.total_committed)} committed`}
          icon={BarChart3}
          color="text-gray-900"
        />
        <SummaryCard
          label="Remaining"
          value={fmtFull(data.remaining)}
          subtitle={`${data.percent_spent}% of budget spent`}
          icon={Clock}
          color={data.percent_spent > 55 ? "text-amber-700" : "text-gray-900"}
        />
        <SummaryCard
          label="Projected Year-End"
          value={fmtFull(data.projected_surplus_deficit)}
          subtitle={`Projected spend: ${fmtFull(data.projected_year_end)}`}
          icon={projectedIcon}
          color={projectedColor}
        />
      </div>

      {/* ── MIDDLE ROW: Chart + Staffing ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendProfileChart
            lines={data.lines}
            monthsElapsed={data.months_elapsed}
          />
        </div>
        <div>
          <StaffingIndicator
            percent={data.staffing_percent_of_income}
            target={data.staffing_target}
          />
        </div>
      </div>

      {/* ── BUDGET VS ACTUAL TABLE ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Budget vs Actual by CFR Code
            </h2>
            <p className="text-xs text-gray-500">
              RAG: <span className="text-emerald-600">Green</span> = within 5%,{" "}
              <span className="text-amber-600">Amber</span> = 5-10% over,{" "}
              <span className="text-red-600">Red</span> = &gt;10% over profiled
              budget
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
            {(["all", "expenditure", "income"] as TableFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setTableFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  tableFilter === f
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <BudgetTable lines={data.lines} filter={tableFilter} />
      </div>

      {/* ── TOP VARIANCES ── */}
      <TopVariances lines={data.lines} />

      {/* ── FOOTER LINKS ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/finance/icfp"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-[#FFAA4C]/40 hover:bg-[#FFAA4C]/5"
        >
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-[#FFAA4C]" />
            <div>
              <p className="text-sm font-medium text-gray-900">ICFP Analysis</p>
              <p className="text-xs text-gray-500">Workforce benchmarking</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href="/dashboard/finance/payroll"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-[#FFAA4C]/40 hover:bg-[#FFAA4C]/5"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[#FFAA4C]" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Payroll Analysis
              </p>
              <p className="text-xs text-gray-500">Staff cost breakdown</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href="/dashboard/finance"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-[#FFAA4C]/40 hover:bg-[#FFAA4C]/5"
        >
          <div className="flex items-center gap-3">
            <PoundSterling className="h-5 w-5 text-[#FFAA4C]" />
            <div>
              <p className="text-sm font-medium text-gray-900">Budget Engine</p>
              <p className="text-xs text-gray-500">Decisions & alerts</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}
