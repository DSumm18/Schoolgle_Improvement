import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { buildSchoolKpiDataFromDfETrends } from "@/lib/kpi-dashboard-data";
import { getIntelligenceEngine } from "@/lib/school-intelligence-engine";
import { createServiceRoleClient } from "@/lib/supabase-server";

function roundPct(value: number) {
  return Math.round(value * 10) / 10;
}

async function getSchoolDisadvantagedGap(urn: number) {
  const supabase = createServiceRoleClient();
  const minYear = new Date().getFullYear() - 6;
  const { data, error } = await supabase
    .from("ks2_results")
    .select("academic_year_start, breakdown_topic, breakdown, expected_standard_pct")
    .eq("urn", urn)
    .gte("academic_year_start", minYear)
    .eq("subject", "Reading, writing and maths")
    .in("breakdown_topic", ["All pupils", "Disadvantaged status"]);

  if (error) {
    console.warn("[KPI Dashboard API] Could not fetch disadvantaged gap:", error.message);
    return [];
  }

  const byYear = new Map<number, { all?: number; disadvantaged?: number }>();

  for (const row of data || []) {
    const year = row.academic_year_start;
    const value = row.expected_standard_pct;
    if (value === null || value === undefined || Number.isNaN(value)) continue;

    const existing = byYear.get(year) || {};
    const breakdown = String(row.breakdown || "").toLowerCase();
    if (row.breakdown_topic === "All pupils") {
      existing.all = value;
    } else if (breakdown === "disadvantaged") {
      existing.disadvantaged = value;
    }
    byYear.set(year, existing);
  }

  return Array.from(byYear.entries())
    .filter(([, values]) => values.all !== undefined && values.disadvantaged !== undefined)
    .map(([year, values]) => ({
      year,
      all_pupils_pct: roundPct(values.all!),
      disadvantaged_pct: roundPct(values.disadvantaged!),
      gap_pp: roundPct(values.all! - values.disadvantaged!),
    }))
    .sort((a, b) => a.year - b.year);
}

/**
 * GET /api/intelligence/kpi-dashboard?urn={urn}
 *
 * Returns school-level KPI data from DfE warehouse trends. This is independent
 * of uploaded trust assessment spreadsheets, so every school with a URN and DfE
 * records can render the KPI dashboard.
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const urnParam = searchParams.get("urn");

  if (!urnParam) {
    return apiError("Missing required parameter: urn", 400);
  }

  const urn = parseInt(urnParam, 10);
  if (isNaN(urn)) {
    return apiError("Invalid URN format", 400);
  }

  try {
    const engine = getIntelligenceEngine();
    const trends = await engine.getDfETrends(urn, 5);
    const schoolData = buildSchoolKpiDataFromDfETrends(trends);
    const disadvantagedGap = await getSchoolDisadvantagedGap(urn);
    if (disadvantagedGap.length > 0) {
      schoolData.disadvantaged_gap = disadvantagedGap;
    }
    const hasData = Object.values(schoolData).some(
      (value) => Array.isArray(value) && value.length > 0,
    );

    if (!hasData) {
      return apiError("No DfE KPI data available for this school", 404);
    }

    return apiSuccess(schoolData);
  } catch (error) {
    console.error("[KPI Dashboard API] Error:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch KPI dashboard data",
      500,
    );
  }
}, { orgOptional: true });
