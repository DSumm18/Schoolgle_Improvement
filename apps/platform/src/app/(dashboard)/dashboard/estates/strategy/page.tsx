"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  PoundSterling,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { supabase } from "@/lib/supabase";

type PriorityBand = "must" | "should" | "could" | "wont";

interface EstateStrategyPlan {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  start_year: string;
  end_year: string;
  duration_years: number;
  total_estimated_cost: number;
  item_count: number;
}

interface EstateStrategyItem {
  id: string;
  title: string;
  description?: string;
  year: number;
  estimated_cost: number;
  risk_score: number;
  priority_band: PriorityBand;
  status: string;
  statutory: boolean;
  linked_risk_id?: string;
}

interface PlanDetailResponse {
  plan: EstateStrategyPlan;
  items: EstateStrategyItem[];
  estate_strategy_summary?: {
    reportLines: string[];
    unfundedConsequences: string[];
    mustFundTotal: number;
    statutoryCount: number;
  } | null;
}

const BAND_LABELS: Record<PriorityBand, string> = {
  must: "Must Fund",
  should: "Should Fund",
  could: "Could Fund",
  wont: "Not This Cycle",
};

const BAND_CLASSES: Record<PriorityBand, string> = {
  must: "border-red-200 bg-red-50 text-red-800",
  should: "border-amber-200 bg-amber-50 text-amber-800",
  could: "border-blue-200 bg-blue-50 text-blue-800",
  wont: "border-slate-200 bg-slate-50 text-slate-700",
};

function formatGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function currentAcademicYear(): string {
  const now = new Date();
  const firstYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${firstYear}/${firstYear + 1}`;
}

export default function EstateStrategyPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: plansData,
    isLoading: plansLoading,
    mutate: mutatePlans,
  } = useSWR<{ plans: EstateStrategyPlan[] }>(
    organizationId
      ? `/api/strategic-plan?plan_type=estates&organizationId=${organizationId}`
      : null,
    fetcher,
  );

  const activePlan = plansData?.plans?.[0] ?? null;

  const {
    data: detailData,
    isLoading: detailLoading,
    mutate: mutateDetail,
  } = useSWR<PlanDetailResponse>(
    activePlan && organizationId
      ? `/api/strategic-plan/${activePlan.id}?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  const items = useMemo(() => detailData?.items ?? [], [detailData?.items]);
  const reportSummary = detailData?.estate_strategy_summary;
  const totals = useMemo(() => {
    const byYear = [1, 2, 3].map((year) => ({
      year,
      total: items
        .filter((item) => item.year === year)
        .reduce((sum, item) => sum + item.estimated_cost, 0),
      count: items.filter((item) => item.year === year).length,
    }));

    return {
      byYear,
      total: items.reduce((sum, item) => sum + item.estimated_cost, 0),
      highRisk: items.filter((item) => item.risk_score >= 15 || item.priority_band === "must").length,
      linkedRisks: items.filter((item) => item.linked_risk_id).length,
    };
  }, [items]);

  async function createStrategy() {
    setCreating(true);
    setCreateError(null);
    try {
      const startYear = currentAcademicYear();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/strategic-plan", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: "Three-Year Estate Strategy",
          description:
            "Finance-facing plan for estates risks, condition survey pressures, and capital works.",
          plan_type: "estates",
          academic_year_start: startYear,
          duration_years: 3,
          organizationId,
        }),
      });

      if (!response.ok) {
        const info = await response.json().catch(() => ({}));
        throw new Error(info.error || "Failed to create estate strategy");
      }

      await mutatePlans();
      await mutateDetail();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create estate strategy");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-950 to-sky-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-white/15">
                <TrendingUp className="h-3.5 w-3.5" />
                Finance-facing estates plan
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                Estate Strategy
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                A clean three-year view of estate risks, capital pressures,
                condition survey findings, and unfunded consequences — built for
                CFOs, SLT, governors, and trustees.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Strategy Value
              </p>
              <p className="mt-1 text-2xl font-black">
                {formatGBP(activePlan?.total_estimated_cost ?? totals.total)}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {items.length} item{items.length === 1 ? "" : "s"} currently in plan
              </p>
            </div>
          </div>
        </header>

        {plansLoading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white p-10 text-slate-500 shadow-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading estate strategy…
          </div>
        ) : !activePlan ? (
          <section className="rounded-3xl border border-dashed border-emerald-300 bg-white p-8 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-950">
                  Create the three-year estate strategy
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  This is deliberately separate from the caretaker compliance
                  workbench. It receives reviewed capital pressures, major
                  risks, and lifecycle concerns so finance can plan budgets
                  without turning every survey line into an urgent task.
                </p>
              </div>
              <button
                onClick={createStrategy}
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Estate Strategy
              </button>
              {createError ? (
                <p className="text-sm font-medium text-red-600">
                  {createError}
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard
                icon={PoundSterling}
                label="Planned Value"
                value={formatGBP(totals.total)}
                helper="Reviewed strategy items"
              />
              <MetricCard
                icon={ShieldAlert}
                label="High Risk"
                value={String(totals.highRisk)}
                helper="Must-fund or risk ≥ 15"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Risk Linked"
                value={String(totals.linkedRisks)}
                helper="Connected to risk register"
              />
              <MetricCard
                icon={CalendarClock}
                label="Strategy Window"
                value={`${activePlan.start_year}–${activePlan.end_year}`}
                helper={`${activePlan.duration_years || 3}-year plan`}
              />
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {activePlan.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Items should arrive here from reviewed risks, condition
                    findings, compliance reports, or Ed chat — not from noisy
                    automatic task creation.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                  <Bot className="mb-1 h-4 w-4 text-emerald-600" />
                  Try Ed: “Add the boiler replacement to estate strategy year 3
                  with a £100,000 estimate.”
                </div>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading strategy items…
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                  <h3 className="mt-3 font-bold text-slate-950">
                    No capital pressures approved yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    That is fine. The strategy should only contain reviewed
                    risks and budget pressures. Compliance checks and report
                    uploads can triage findings first, then Ed or finance can
                    promote the right items into this plan.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  {totals.byYear.map((yearSummary) => (
                    <YearColumn
                      key={yearSummary.year}
                      year={yearSummary.year}
                      total={yearSummary.total}
                      items={items.filter((item) => item.year === yearSummary.year)}
                    />
                  ))}
                </div>
              )}
            </section>

            {reportSummary && (
              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-950">
                    Trustee Summary
                  </h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-3">
                    {reportSummary.reportLines.map((line) => (
                      <p
                        key={line}
                        className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                    <h3 className="text-sm font-bold text-amber-950">
                      Consequences If Unfunded
                    </h3>
                    {reportSummary.unfundedConsequences.length === 0 ? (
                      <p className="mt-2 text-sm text-amber-800">
                        No consequences have been recorded yet. Add these before
                        trustee approval so deferrals are properly risk logged.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2 text-sm text-amber-900">
                        {reportSummary.unfundedConsequences.map((line) => (
                          <li key={line}>• {line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof PoundSterling;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function YearColumn({
  year,
  total,
  items,
}: {
  year: number;
  total: number;
  items: EstateStrategyItem[];
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-950">Year {year}</h3>
          <p className="text-xs text-slate-500">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="text-sm font-black text-slate-950">{formatGBP(total)}</p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">
            Nothing planned for this year yet.
          </div>
        ) : (
          items.map((item) => <StrategyItemCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

function StrategyItemCard({ item }: { item: EstateStrategyItem }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h4 className="text-sm font-bold leading-5 text-slate-950">
          {item.title}
        </h4>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${BAND_CLASSES[item.priority_band]}`}
        >
          {BAND_LABELS[item.priority_band]}
        </span>
      </div>
      {item.description && (
        <p className="line-clamp-3 text-xs leading-5 text-slate-600">
          {item.description}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="font-black text-slate-950">
          {formatGBP(item.estimated_cost)}
        </span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          Risk {item.risk_score || "n/a"}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </article>
  );
}
