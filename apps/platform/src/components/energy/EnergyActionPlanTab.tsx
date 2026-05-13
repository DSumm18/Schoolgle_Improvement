"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Leaf,
  Loader2,
  ShieldCheck,
  Target,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

interface EnergyActionPlanTabProps {
  organizationId: string;
}

interface CarbonSummary {
  scope1Tonnes: number;
  scope2Tonnes: number;
  scope3Tonnes: number;
  totalTonnes: number;
  intensityTonnesPerPupil: number | null;
  kgCo2ePerSqm: number | null;
  methodology: string;
}

interface SecrReadiness {
  status: "ready" | "needs_data" | "not_applicable";
  score: number;
  gaps: string[];
  requiredEvidence: string[];
}

interface ActionPlanItem {
  id: string;
  category: string;
  title: string;
  rationale: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  estimatedAnnualSavingGbp: number | null;
  estimatedCarbonSavingTonnes: number | null;
  ownerSuggestion: string;
  evidenceSource: string;
}

interface CarbonPlanResponse {
  summary: CarbonSummary;
  readiness: SecrReadiness;
  actions: ActionPlanItem[];
  data_quality: {
    invoice_count: number;
    active_anomalies: number;
    estimated_waste_cost: number;
    mileage_table_available: boolean;
    mileage_has_rows: boolean;
    prior_year_invoice_count: number;
  };
  scope: "school" | "trust";
  trust_rollup_ready: boolean;
}

const riskStyles: Record<ActionPlanItem["riskLevel"], string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

function fmtTonnes(value: number) {
  return `${value.toFixed(1)} tCO₂e`;
}

function fmtGBP(value: number | null) {
  if (value === null) return "To assess";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function EnergyActionPlanTab({
  organizationId,
}: EnergyActionPlanTabProps) {
  const [data, setData] = useState<CarbonPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authFetch = useCallback(async (url: string, init?: RequestInit) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string>),
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    return fetch(url, { ...init, headers });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch(
          `/api/estates/energy/carbon-plan?organizationId=${organizationId}`,
        );
        const payload = await response.json();
        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Failed to load action plan");
        }
        if (!cancelled) setData(payload);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load action plan",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlan();
    return () => {
      cancelled = true;
    };
  }, [authFetch, organizationId]);

  const readinessColour = useMemo(() => {
    if (!data) return "bg-slate-100 text-slate-700";
    if (data.readiness.status === "ready") return "bg-green-100 text-green-700";
    return "bg-amber-100 text-amber-700";
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-slate-900">
        <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
        Building energy and carbon action plan...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <AlertTriangle className="h-5 w-5" />
        {error || "No action plan data available."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Leaf className="h-4 w-4 text-emerald-500" />
            Total carbon
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {fmtTonnes(data.summary.totalTonnes)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Scope 1, 2 and mileage-based Scope 3
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            SECR readiness
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {data.readiness.score}%
          </p>
          <span
            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${readinessColour}`}
          >
            {data.readiness.status.replace("_", " ")}
          </span>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
            Evidence
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {data.data_quality.invoice_count}
          </p>
          <p className="mt-1 text-xs text-gray-500">Energy invoices in period</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Target className="h-4 w-4 text-rose-500" />
            Actions
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {data.actions.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">Risk-led priorities</p>
        </div>
      </div>

      {data.readiness.gaps.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <h3 className="font-semibold">Reporting gaps to close</h3>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {data.readiness.gaps.map((gap) => (
              <li key={gap} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-900">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Energy & carbon action plan
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            School-level actions now; trust roll-up can aggregate the same shape
            across all academies.
          </p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.actions.map((action) => (
            <div key={action.id} className="p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${riskStyles[action.riskLevel]}`}
                    >
                      {action.riskLevel}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {action.category}
                    </span>
                  </div>
                  <h4 className="mt-3 font-semibold text-gray-900 dark:text-white">
                    {action.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {action.rationale}
                  </p>
                </div>
                <div className="min-w-[180px] rounded-xl bg-gray-50 p-3 text-xs dark:bg-slate-800">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">
                    Suggested owner
                  </p>
                  <p className="mt-1 text-gray-500">{action.ownerSuggestion}</p>
                  <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">
                    Potential saving
                  </p>
                  <p className="mt-1 text-gray-500">
                    {fmtGBP(action.estimatedAnnualSavingGbp)}
                    {action.estimatedCarbonSavingTonnes !== null
                      ? ` / ${fmtTonnes(action.estimatedCarbonSavingTonnes)}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {data.actions.length === 0 && (
            <div className="flex items-center gap-2 p-5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              No action-plan gaps identified from the current data.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-xs text-gray-500 dark:border-gray-700 dark:bg-slate-900">
        <p className="font-semibold text-gray-700 dark:text-gray-200">
          Methodology
        </p>
        <p className="mt-1">{data.summary.methodology}</p>
      </div>
    </div>
  );
}
