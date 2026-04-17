"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

type RouteKey = "ofsted-readiness" | "school-intelligence" | "trust-analysis";

interface ShadowDiffSummaryByRoute {
  route: RouteKey;
  comparisons: number;
  divergenceRate: number;
  latestComparedAt: string | null;
}

interface ShadowDiffRun {
  id: string;
  routeKey: RouteKey;
  mode: "off" | "shadow" | "primary";
  candidateVersion: string;
  comparedAt: string;
  totals: {
    totalMetrics: number;
    matchCount: number;
    deltaCount: number;
    mismatchCount: number;
    missingCount: number;
    divergenceCount: number;
    divergenceRate: number;
  };
  issues?: string[];
}

interface ShadowDiffResponse {
  filters: {
    organizationId: string;
    route: RouteKey | null;
    hours: number;
    limit: number;
    includeMetrics: boolean;
  };
  summary: {
    comparisons: number;
    generatedAt: string;
    byRoute: ShadowDiffSummaryByRoute[];
  };
  runs: ShadowDiffRun[];
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export default function ShadowDiffsMonitorPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [data, setData] = useState<ShadowDiffResponse | null>(null);

  const fetchShadowDiffs = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/intelligence/shadow-diffs?organizationId=${organizationId}&hours=720&limit=30&include_metrics=true`,
        { headers },
      );

      const body = (await response.json()) as ShadowDiffResponse | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in body && body.error
            ? body.error
            : "Failed to load shadow diffs",
        );
      }

      setData(body as ShadowDiffResponse);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load shadow diffs",
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchShadowDiffs();
  }, [fetchShadowDiffs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(fetchShadowDiffs, 30000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, fetchShadowDiffs]);

  const totalDivergences = useMemo(() => {
    if (!data) return 0;
    return data.runs.reduce((sum, run) => sum + run.totals.divergenceCount, 0);
  }, [data]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Intelligence Shadow Monitor
            </h1>
            <p className="text-sm text-muted-foreground">
              Simple live view of baseline vs candidate differences.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/school-intelligence"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted/40"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={() => setAutoRefresh((current) => !current)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              autoRefresh
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : "border-border text-muted-foreground"
            }`}
          >
            Auto refresh: {autoRefresh ? "On" : "Off"}
          </button>
          <button
            onClick={fetchShadowDiffs}
            disabled={loading || !organizationId}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-foreground text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Organization
          </p>
          <p className="text-sm font-mono mt-1 break-all">
            {organizationId || "No org selected"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Comparisons
          </p>
          <p className="text-2xl font-bold mt-1">{data?.summary.comparisons ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Total divergences
          </p>
          <p className="text-2xl font-bold mt-1">{totalDivergences}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-semibold">By Route</h2>
        </div>
        <div className="space-y-2">
          {(data?.summary.byRoute ?? []).map((routeRow) => (
            <div
              key={routeRow.route}
              className="flex flex-wrap items-center justify-between rounded-lg border border-border/70 px-3 py-2"
            >
              <div className="text-sm font-mono">{routeRow.route}</div>
              <div className="text-sm text-muted-foreground">
                {routeRow.comparisons} runs · {formatPercent(routeRow.divergenceRate)}{" "}
                divergence
              </div>
            </div>
          ))}
          {!data?.summary.byRoute?.length && (
            <p className="text-sm text-muted-foreground">No route data yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold mb-3">Recent Runs</h2>
        <div className="space-y-3">
          {(data?.runs ?? []).map((run) => {
            const hasDivergence = run.totals.divergenceCount > 0;
            return (
              <div key={run.id} className="rounded-lg border border-border/80 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {hasDivergence ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-sm font-mono">{run.routeKey}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {run.mode}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(run.comparedAt).toLocaleString()}
                  </div>
                </div>

                <div className="text-sm mt-2 text-muted-foreground">
                  Candidate <span className="font-mono">{run.candidateVersion}</span> ·{" "}
                  {formatPercent(run.totals.divergenceRate)} divergence (
                  {run.totals.divergenceCount}/{run.totals.totalMetrics})
                </div>

                {run.issues?.length ? (
                  <ul className="mt-2 list-disc pl-5 text-sm text-amber-300 space-y-1">
                    {run.issues.map((issue, issueIndex) => (
                      <li key={`${run.id}-issue-${issueIndex}`}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-emerald-300">No issues in this run.</p>
                )}
              </div>
            );
          })}
          {!data?.runs?.length && (
            <p className="text-sm text-muted-foreground">
              No shadow comparisons logged yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
