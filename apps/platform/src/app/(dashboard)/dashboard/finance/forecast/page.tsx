"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Download,
  PoundSterling,
  Percent,
  Target,
  ArrowLeft,
  Sliders,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

// =====================================================
// TYPES
// =====================================================

interface ForecastAssumption {
  cfr_code: string;
  description: string;
  current_budget: number;
  current_actual: number;
  change_percent: number;
  change_reason: string;
  projected_budget: number;
}

interface ICFPMetrics {
  projected_staff_cost: number;
  projected_income: number;
  staff_cost_ratio: number;
  icfp_band: "green" | "amber" | "red";
  benchmark_primary_avg: number;
}

interface BudgetForecast {
  financial_year: string;
  assumptions: ForecastAssumption[];
  total_current_budget: number;
  total_projected_budget: number;
  total_change: number;
  total_change_percent: number;
  icfp_metrics: ICFPMetrics;
}

interface ForecastResponse {
  forecast: BudgetForecast;
  default_assumptions: Record<string, { percent: number; reason: string }>;
  current_year: {
    financial_year: string;
    total_budget: number;
    total_income: number;
  };
}

// =====================================================
// HELPERS
// =====================================================

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function bandColor(band: "green" | "amber" | "red") {
  switch (band) {
    case "green":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        badge: "bg-emerald-100 text-emerald-700",
      };
    case "amber":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        badge: "bg-amber-100 text-amber-700",
      };
    case "red":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        badge: "bg-red-100 text-red-700",
      };
  }
}

// CFR category grouping for the UI
const CFR_GROUPS: Record<string, string> = {
  E01: "Staffing",
  E02: "Staffing",
  E03: "Staffing",
  E04: "Staffing",
  E05: "Staffing",
  E06: "Staffing",
  E07: "Staffing",
  E08: "Staffing",
  E09: "Staffing",
  E10: "Staffing",
  E11: "Staffing",
  E26: "Staffing",
  E12: "Premises",
  E13: "Premises",
  E14: "Premises",
  E15: "Energy",
  E16: "Energy",
  E17: "Energy",
  E18: "Energy",
  E19: "Supplies",
  E20: "Supplies",
  E21: "Supplies",
  E22: "Supplies",
  E23: "Supplies",
  E24: "Supplies",
  E25: "Supplies",
  E27: "Other",
  E28a: "Other",
  E28b: "Other",
  E29: "Other",
};

// =====================================================
// COMPONENTS
// =====================================================

function ICFPGauge({ metrics }: { metrics: ICFPMetrics }) {
  const bc = bandColor(metrics.icfp_band);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(metrics.staff_cost_ratio / 100, 1);
  const offset = circumference * (1 - progress);

  const ringColor =
    metrics.icfp_band === "red"
      ? "text-red-500"
      : metrics.icfp_band === "amber"
        ? "text-amber-500"
        : "text-emerald-500";
  const bgRing =
    metrics.icfp_band === "red"
      ? "text-red-100"
      : metrics.icfp_band === "amber"
        ? "text-amber-100"
        : "text-emerald-100";

  return (
    <div className={`rounded-xl border ${bc.border} ${bc.bg} p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          ICFP Staff Cost Ratio
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${bc.badge}`}
        >
          {metrics.icfp_band === "green"
            ? "Within target"
            : metrics.icfp_band === "amber"
              ? "Approaching limit"
              : "Above target"}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative h-28 w-28 flex-shrink-0">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
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
              className={`stroke-current ${ringColor} transition-all duration-500`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${ringColor}`}>
              {metrics.staff_cost_ratio}%
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between gap-4">
            <span>Projected staff cost:</span>
            <span className="font-medium text-gray-900">
              {fmt(metrics.projected_staff_cost)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Projected income:</span>
            <span className="font-medium text-gray-900">
              {fmt(metrics.projected_income)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>DfE primary average:</span>
            <span className="font-medium text-gray-500">
              {metrics.benchmark_primary_avg}%
            </span>
          </div>
          <p className="text-[10px] text-gray-400 pt-1">
            ICFP recommends ≤78% of income for total staffing costs
          </p>
        </div>
      </div>
    </div>
  );
}

function AssumptionSlider({
  assumption,
  defaultPercent,
  onChange,
}: {
  assumption: ForecastAssumption;
  defaultPercent: number;
  onChange: (cfr: string, val: number) => void;
}) {
  const isCustom = assumption.change_percent !== defaultPercent;
  const change = assumption.projected_budget - assumption.current_budget;
  const isIncrease = change > 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 hover:border-gray-200 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-600">
            {assumption.cfr_code}
          </span>
          <span className="text-xs font-medium text-gray-800 truncate">
            {assumption.description}
          </span>
          {isCustom && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
              Custom
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-500">
          <span>Current: {fmt(assumption.current_budget)}</span>
          <span className="text-gray-300">→</span>
          <span
            className={`font-medium ${isIncrease ? "text-red-600" : "text-emerald-600"}`}
          >
            {fmt(assumption.projected_budget)} ({isIncrease ? "+" : ""}
            {fmt(change)})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="range"
          min={-10}
          max={20}
          step={0.5}
          value={assumption.change_percent}
          onChange={(e) =>
            onChange(assumption.cfr_code, parseFloat(e.target.value))
          }
          className="w-20 h-1.5 accent-[#FFAA4C] cursor-pointer"
        />
        <div className="w-14 text-right">
          <input
            type="number"
            min={-50}
            max={100}
            step={0.5}
            value={assumption.change_percent}
            onChange={(e) =>
              onChange(assumption.cfr_code, parseFloat(e.target.value) || 0)
            }
            className="w-14 rounded border border-gray-200 px-1.5 py-1 text-xs text-right font-medium text-gray-800 focus:border-[#FFAA4C] focus:outline-none focus:ring-1 focus:ring-[#FFAA4C]"
          />
        </div>
        <span className="text-[10px] text-gray-400 w-2">%</span>
      </div>
    </div>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function BudgetForecastPage() {
  const { organizationId } = useAuth();
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [customAssumptions, setCustomAssumptions] = useState<
    Record<string, number>
  >({});
  const [recalculating, setRecalculating] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Staffing");

  // Helper: get auth headers
  const getHeaders = async () => {
    const headers: Record<string, string> = {};
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  // Load default forecast
  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      try {
        const headers = await getHeaders();
        const r = await fetch(
          `/api/finance/forecast?organizationId=${organizationId}`,
          { headers },
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const resp = await r.json();
        setData(resp.data || resp);
      } catch (e) {
        console.error("[Forecast] Failed to load:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId]);

  // Recalculate with custom assumptions (debounced)
  const recalculate = useCallback(
    async (assumptions: Record<string, number>) => {
      if (!organizationId) return;
      setRecalculating(true);
      try {
        const headers = await getHeaders();
        const resp = await fetch(
          `/api/finance/forecast?organizationId=${organizationId}`,
          {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ assumptions }),
          },
        );
        const result = await resp.json();
        const d = result.data || result;
        setData((prev) => (prev ? { ...prev, forecast: d.forecast } : prev));
      } catch {
        // ignore
      }
      setRecalculating(false);
    },
    [organizationId],
  );

  const handleAssumptionChange = useCallback(
    (cfrCode: string, value: number) => {
      const newAssumptions = { ...customAssumptions, [cfrCode]: value };
      setCustomAssumptions(newAssumptions);

      // Debounce recalculation
      const timer = setTimeout(() => recalculate(newAssumptions), 300);
      return () => clearTimeout(timer);
    },
    [customAssumptions, recalculate],
  );

  const resetAssumptions = useCallback(async () => {
    if (!organizationId) return;
    setCustomAssumptions({});
    // Reload defaults
    const headers = await getHeaders();
    fetch(`/api/finance/forecast?organizationId=${organizationId}`, { headers })
      .then((r) => r.json())
      .then((resp) => setData(resp.data || resp));
  }, [organizationId]);

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFAA4C] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  const { forecast, current_year } = data;
  const isDeficit =
    forecast.total_projected_budget > current_year.total_income * 1.02;
  const projectedSurplus =
    Math.round(current_year.total_income * 1.02) -
    forecast.total_projected_budget;

  // Group assumptions by category
  const groups = new Map<string, ForecastAssumption[]>();
  for (const a of forecast.assumptions) {
    const group = CFR_GROUPS[a.cfr_code] || "Other";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(a);
  }

  const groupOrder = ["Staffing", "Premises", "Energy", "Supplies", "Other"];
  const hasCustom = Object.keys(customAssumptions).length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/finance/monitor"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="rounded-lg bg-[#FFAA4C]/10 p-2">
              <Calculator className="h-5 w-5 text-[#FFAA4C]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Budget Forecast Calculator
              </h1>
              <p className="text-xs text-gray-500">
                {current_year.financial_year} → {forecast.financial_year}{" "}
                &mdash; Adjust assumptions to model next year&apos;s budget
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasCustom && (
            <button
              onClick={resetAssumptions}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Defaults
            </button>
          )}
          {recalculating && (
            <span className="text-xs text-gray-400 animate-pulse">
              Recalculating...
            </span>
          )}
        </div>
      </div>

      {/* ── SUMMARY STRIP ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Current Year Budget
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {fmt(forecast.total_current_budget)}
          </p>
          <p className="text-xs text-gray-500">{current_year.financial_year}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Projected Next Year
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {fmt(forecast.total_projected_budget)}
          </p>
          <p className="text-xs text-gray-500">{forecast.financial_year}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Budget Change
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${forecast.total_change > 0 ? "text-red-700" : "text-emerald-700"}`}
          >
            {forecast.total_change > 0 ? "+" : ""}
            {fmt(forecast.total_change)}
          </p>
          <p
            className={`text-xs ${forecast.total_change > 0 ? "text-red-500" : "text-emerald-500"}`}
          >
            {forecast.total_change_percent > 0 ? "+" : ""}
            {forecast.total_change_percent}% increase in costs
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 shadow-sm ${isDeficit ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Projected Position
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${isDeficit ? "text-red-700" : "text-emerald-700"}`}
          >
            {fmt(projectedSurplus)}
          </p>
          <div
            className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${isDeficit ? "text-red-600" : "text-emerald-600"}`}
          >
            {isDeficit ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {isDeficit ? "Projected deficit" : "Projected surplus"}
          </div>
        </div>
      </div>

      {/* ── ICFP GAUGE ── */}
      <ICFPGauge metrics={forecast.icfp_metrics} />

      {/* ── ASSUMPTION SLIDERS ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#FFAA4C]" />
              <h2 className="text-sm font-semibold text-gray-900">
                Budget Assumptions
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              Drag sliders or type values to adjust each category&apos;s
              percentage change
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {groupOrder
            .filter((g) => groups.has(g))
            .map((groupName) => {
              const groupAssumptions = groups.get(groupName)!;
              const groupTotal = groupAssumptions.reduce(
                (s, a) => s + a.projected_budget,
                0,
              );
              const groupCurrentTotal = groupAssumptions.reduce(
                (s, a) => s + a.current_budget,
                0,
              );
              const groupChange = groupTotal - groupCurrentTotal;
              const isExpanded = expandedGroup === groupName;

              return (
                <div key={groupName}>
                  <button
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : groupName)
                    }
                    className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                        {groupName}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({groupAssumptions.length} lines)
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">
                        {fmt(groupCurrentTotal)}
                      </span>
                      <span className="text-xs text-gray-300">→</span>
                      <span className="text-xs font-medium text-gray-800">
                        {fmt(groupTotal)}
                      </span>
                      <span
                        className={`text-xs font-medium ${groupChange > 0 ? "text-red-600" : "text-emerald-600"}`}
                      >
                        ({groupChange > 0 ? "+" : ""}
                        {fmt(groupChange)})
                      </span>
                      <svg
                        className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4 space-y-2">
                      {groupAssumptions
                        .filter((a) => a.current_budget > 0)
                        .map((a) => (
                          <AssumptionSlider
                            key={a.cfr_code + a.description}
                            assumption={a}
                            defaultPercent={
                              data.default_assumptions[a.cfr_code]?.percent ?? 2
                            }
                            onChange={handleAssumptionChange}
                          />
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* ── QUICK SCENARIOS ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => {
            const optimistic: Record<string, number> = {};
            for (const a of forecast.assumptions) {
              const def = data.default_assumptions[a.cfr_code]?.percent ?? 2;
              optimistic[a.cfr_code] = Math.max(def - 1.5, 0);
            }
            setCustomAssumptions(optimistic);
            recalculate(optimistic);
          }}
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              Optimistic
            </span>
          </div>
          <p className="text-xs text-emerald-600">
            Lower inflation, controlled energy costs, no new posts
          </p>
        </button>

        <button
          onClick={resetAssumptions}
          className="rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-[#FFAA4C]/40 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-[#FFAA4C]" />
            <span className="text-sm font-medium text-gray-800">
              Realistic (DfE defaults)
            </span>
          </div>
          <p className="text-xs text-gray-500">
            STRB pay award, expected energy rises, standard inflation
          </p>
        </button>

        <button
          onClick={() => {
            const pessimistic: Record<string, number> = {};
            for (const a of forecast.assumptions) {
              const def = data.default_assumptions[a.cfr_code]?.percent ?? 2;
              pessimistic[a.cfr_code] = def + 2;
            }
            pessimistic["E16"] = 15; // Energy crisis scenario
            pessimistic["E02"] = 8; // Supply shortage
            pessimistic["E26"] = 10; // Agency premium
            setCustomAssumptions(pessimistic);
            recalculate(pessimistic);
          }}
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-left hover:border-red-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Pessimistic
            </span>
          </div>
          <p className="text-xs text-red-600">
            Higher pay awards, energy spike, supply staff shortages
          </p>
        </button>
      </div>

      {/* ── INFO PANEL ── */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 p-1.5 mt-0.5">
            <PoundSterling className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-blue-800">How this works</p>
            <p className="text-xs text-blue-600">
              Each CFR budget line is adjusted by a percentage increase/decrease
              for next year. Defaults are based on DfE STRB pay award
              recommendations, ESFA energy guidance, and general CPI. The ICFP
              staff cost ratio updates live as you change staffing assumptions —
              the DfE benchmark for LA-maintained primaries is{" "}
              {forecast.icfp_metrics.benchmark_primary_avg}%.
            </p>
            <p className="text-xs text-blue-600">
              Income is assumed to increase by 2% (NFF per-pupil funding
              uplift). Adjust staffing lines down or income assumptions up to
              bring the ratio within target.
            </p>
          </div>
        </div>
      </div>

      {/* ── BACK TO MONITOR ── */}
      <div className="flex justify-center">
        <Link
          href="/dashboard/finance/monitor"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:border-[#FFAA4C]/40 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Budget Monitor
        </Link>
      </div>
    </div>
  );
}
