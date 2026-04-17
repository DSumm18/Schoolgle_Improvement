import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { IntelligenceBrainRouteKey } from "@/lib/intelligence-brain/orchestrator";

const ROUTE_KEYS: IntelligenceBrainRouteKey[] = [
  "ofsted-readiness",
  "school-intelligence",
  "trust-analysis",
];

interface RawShadowDiffRow {
  id: string;
  route_key: string;
  mode: string;
  candidate_version: string;
  summary: Record<string, unknown> | null;
  metrics: Array<Record<string, unknown>> | null;
  compared_at: string;
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function parseRouteKey(value: string | null): IntelligenceBrainRouteKey | null {
  if (!value) return null;
  return ROUTE_KEYS.includes(value as IntelligenceBrainRouteKey)
    ? (value as IntelligenceBrainRouteKey)
    : null;
}

function buildIssuePreview(metrics: Array<Record<string, unknown>>): string[] {
  return metrics
    .filter((metric) => metric.status !== "match")
    .slice(0, 5)
    .map((metric) => {
      const key = typeof metric.key === "string" ? metric.key : "unknown";
      const status =
        typeof metric.status === "string" ? metric.status : "mismatch";
      const delta =
        typeof metric.delta === "number" && Number.isFinite(metric.delta)
          ? ` (${metric.delta > 0 ? "+" : ""}${metric.delta})`
          : "";
      return `${key}: ${status}${delta}`;
    });
}

export const GET = protectedRoute(
  async (auth, request) => {
    const searchParams = request.nextUrl.searchParams;
    const routeKey = parseRouteKey(searchParams.get("route"));

    if (searchParams.get("route") && !routeKey) {
      return apiError(
        "Invalid route. Use one of: ofsted-readiness, school-intelligence, trust-analysis",
        400,
      );
    }

    const requestedLimit = Number(searchParams.get("limit") ?? 50);
    const requestedHours = Number(searchParams.get("hours") ?? 168);
    const includeMetrics = searchParams.get("include_metrics") === "true";

    const limit = clamp(requestedLimit, 1, 200);
    const hours = clamp(requestedHours, 1, 24 * 90);
    const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const supabase = createServiceRoleClient();
    const selectFields = includeMetrics
      ? "id, route_key, mode, candidate_version, summary, metrics, compared_at"
      : "id, route_key, mode, candidate_version, summary, compared_at";

    let query = supabase
      .from("intelligence_shadow_diffs")
      .select(selectFields)
      .eq("organization_id", auth.organizationId)
      .gte("compared_at", sinceIso)
      .order("compared_at", { ascending: false })
      .limit(limit);

    if (routeKey) {
      query = query.eq("route_key", routeKey);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[ShadowDiffs API] Fetch error:", error);
      return apiError("Failed to fetch shadow diffs", 500);
    }

    const rows = (data ?? []) as RawShadowDiffRow[];
    const byRoute = new Map<
      IntelligenceBrainRouteKey,
      {
        comparisons: number;
        totalMetrics: number;
        divergenceCount: number;
        latestComparedAt: string | null;
      }
    >();

    const runSummaries = rows.map((row) => {
      const summary = row.summary ?? {};
      const totalMetrics = toNumber(summary.totalMetrics);
      const matchCount = toNumber(summary.matchCount);
      const deltaCount = toNumber(summary.deltaCount);
      const mismatchCount = toNumber(summary.mismatchCount);
      const missingCount = toNumber(summary.missingCount);
      const divergenceCount = deltaCount + mismatchCount + missingCount;
      const divergenceRate =
        totalMetrics > 0
          ? Math.round((divergenceCount / totalMetrics) * 1000) / 1000
          : 0;

      const route = row.route_key as IntelligenceBrainRouteKey;
      const routeTotals = byRoute.get(route) ?? {
        comparisons: 0,
        totalMetrics: 0,
        divergenceCount: 0,
        latestComparedAt: null,
      };
      routeTotals.comparisons += 1;
      routeTotals.totalMetrics += totalMetrics;
      routeTotals.divergenceCount += divergenceCount;
      routeTotals.latestComparedAt =
        !routeTotals.latestComparedAt || row.compared_at > routeTotals.latestComparedAt
          ? row.compared_at
          : routeTotals.latestComparedAt;
      byRoute.set(route, routeTotals);

      return {
        id: row.id,
        routeKey: route,
        mode: row.mode,
        candidateVersion: row.candidate_version,
        comparedAt: row.compared_at,
        totals: {
          totalMetrics,
          matchCount,
          deltaCount,
          mismatchCount,
          missingCount,
          divergenceCount,
          divergenceRate,
        },
        issues:
          includeMetrics && Array.isArray(row.metrics)
            ? buildIssuePreview(row.metrics)
            : undefined,
      };
    });

    const routeSummary = Array.from(byRoute.entries()).map(([route, totals]) => {
      const divergenceRate =
        totals.totalMetrics > 0
          ? Math.round((totals.divergenceCount / totals.totalMetrics) * 1000) /
            1000
          : 0;
      return {
        route,
        comparisons: totals.comparisons,
        divergenceRate,
        latestComparedAt: totals.latestComparedAt,
      };
    });

    return apiSuccess({
      filters: {
        organizationId: auth.organizationId,
        route: routeKey,
        hours,
        limit,
        includeMetrics,
      },
      summary: {
        comparisons: runSummaries.length,
        generatedAt: new Date().toISOString(),
        byRoute: routeSummary,
      },
      runs: runSummaries,
    });
  },
  { requiredRole: "slt" },
);

