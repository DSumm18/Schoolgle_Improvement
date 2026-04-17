import type { SupabaseClient } from "@supabase/supabase-js";

export type IntelligenceBrainMode = "off" | "shadow" | "primary";

export type IntelligenceBrainRouteKey =
  | "ofsted-readiness"
  | "school-intelligence"
  | "trust-analysis";

type PrimitiveMetric = number | string | boolean | null | undefined;

export interface ShadowMetricDiff {
  key: string;
  baseline: PrimitiveMetric;
  candidate: PrimitiveMetric;
  status: "match" | "delta" | "mismatch" | "missing";
  delta?: number | null;
}

export interface ShadowComparisonSummary {
  route: IntelligenceBrainRouteKey;
  mode: IntelligenceBrainMode;
  organizationId: string;
  totalMetrics: number;
  matchCount: number;
  deltaCount: number;
  mismatchCount: number;
  missingCount: number;
  candidateVersion: string;
  comparedAt: string;
}

export interface ShadowComparisonResult {
  summary: ShadowComparisonSummary;
  metrics: ShadowMetricDiff[];
}

const GLOBAL_MODE_ENV = "INTELLIGENCE_BRAIN_MODE";

const ROUTE_MODE_ENV: Record<IntelligenceBrainRouteKey, string> = {
  "ofsted-readiness": "INTELLIGENCE_BRAIN_OFSTED_READINESS_MODE",
  "school-intelligence": "INTELLIGENCE_BRAIN_SCHOOL_INTELLIGENCE_MODE",
  "trust-analysis": "INTELLIGENCE_BRAIN_TRUST_ANALYSIS_MODE",
};

function normaliseMode(value?: string | null): IntelligenceBrainMode | null {
  if (!value) return null;
  const normalised = value.trim().toLowerCase();
  if (normalised === "off") return "off";
  if (normalised === "shadow") return "shadow";
  if (normalised === "primary") return "primary";
  return null;
}

export function getIntelligenceBrainMode(
  route: IntelligenceBrainRouteKey,
): IntelligenceBrainMode {
  const routeMode = normaliseMode(process.env[ROUTE_MODE_ENV[route]]);
  if (routeMode) return routeMode;

  const globalMode = normaliseMode(process.env[GLOBAL_MODE_ENV]);
  if (globalMode) return globalMode;

  return "off";
}

export function isDebugBrainRequest(debugFlag?: string | null): boolean {
  return debugFlag === "1" || debugFlag === "true";
}

function numericDelta(
  baseline: PrimitiveMetric,
  candidate: PrimitiveMetric,
): number | null {
  if (typeof baseline !== "number" || typeof candidate !== "number") {
    return null;
  }
  const delta = candidate - baseline;
  return Number.isFinite(delta) ? Math.round(delta * 100) / 100 : null;
}

function compareMetric(
  key: string,
  baseline: PrimitiveMetric,
  candidate: PrimitiveMetric,
): ShadowMetricDiff {
  if (
    (baseline === null || baseline === undefined) &&
    (candidate === null || candidate === undefined)
  ) {
    return { key, baseline, candidate, status: "missing", delta: null };
  }

  if (baseline === null || baseline === undefined) {
    return { key, baseline, candidate, status: "missing", delta: null };
  }

  if (candidate === null || candidate === undefined) {
    return { key, baseline, candidate, status: "missing", delta: null };
  }

  if (
    typeof baseline === "number" &&
    typeof candidate === "number" &&
    Number.isFinite(baseline) &&
    Number.isFinite(candidate)
  ) {
    const delta = numericDelta(baseline, candidate);
    if (delta === null || Math.abs(delta) < 0.01) {
      return { key, baseline, candidate, status: "match", delta: 0 };
    }
    return { key, baseline, candidate, status: "delta", delta };
  }

  if (baseline === candidate) {
    return { key, baseline, candidate, status: "match" };
  }

  return { key, baseline, candidate, status: "mismatch" };
}

export function buildShadowComparison(params: {
  route: IntelligenceBrainRouteKey;
  mode: IntelligenceBrainMode;
  organizationId: string;
  candidateVersion: string;
  baseline: Record<string, PrimitiveMetric>;
  candidate: Record<string, PrimitiveMetric>;
}): ShadowComparisonResult {
  const keys = Array.from(
    new Set([...Object.keys(params.baseline), ...Object.keys(params.candidate)]),
  );

  const metrics = keys.map((key) =>
    compareMetric(key, params.baseline[key], params.candidate[key]),
  );

  const summary: ShadowComparisonSummary = {
    route: params.route,
    mode: params.mode,
    organizationId: params.organizationId,
    totalMetrics: metrics.length,
    matchCount: metrics.filter((m) => m.status === "match").length,
    deltaCount: metrics.filter((m) => m.status === "delta").length,
    mismatchCount: metrics.filter((m) => m.status === "mismatch").length,
    missingCount: metrics.filter((m) => m.status === "missing").length,
    candidateVersion: params.candidateVersion,
    comparedAt: new Date().toISOString(),
  };

  return { summary, metrics };
}

/**
 * Best-effort persistence. This must never break user-facing routes.
 * If the table does not exist yet, we log and continue.
 */
export async function persistShadowComparison(
  supabase: SupabaseClient,
  comparison: ShadowComparisonResult,
): Promise<void> {
  try {
    const { error } = await supabase.from("intelligence_shadow_diffs").insert({
      organization_id: comparison.summary.organizationId,
      route_key: comparison.summary.route,
      mode: comparison.summary.mode,
      candidate_version: comparison.summary.candidateVersion,
      summary: comparison.summary,
      metrics: comparison.metrics,
      compared_at: comparison.summary.comparedAt,
    });

    if (error) {
      console.warn(
        "[IntelligenceBrain] Shadow comparison persistence skipped:",
        error.message,
      );
    }
  } catch (error) {
    console.warn(
      "[IntelligenceBrain] Shadow comparison persistence failed:",
      error,
    );
  }
}
