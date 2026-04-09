/**
 * Risk Heat Map API
 *
 * GET /api/risk/heatmap - Returns the 5x5 heat map matrix for an organization
 *
 * Query params:
 *   - organizationId (optional, falls back to auth)
 *   - includeTrust (optional, bool) - include trust-level risks
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { getHeatMapData } from "@/lib/risk-engine";
import type { Risk } from "@/lib/risk-engine";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const includeTrust = searchParams.get("includeTrust") === "true";

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  // Build query for open risks
  let query = supabase
    .from("risk_register")
    .select(
      "id, risk_ref, title, tier, risk_categories, inherent_likelihood, inherent_impact, system_residual_likelihood, system_residual_impact, override_residual_likelihood, override_residual_impact, override_expires_at, effective_residual_score, above_appetite, target_score, risk_appetite_threshold, impact_by_category, status, source_module, description",
    )
    .neq("status", "closed");

  if (includeTrust) {
    // Include risks owned by this org OR escalated to this org as a trust
    query = query.or(
      `organization_id.eq.${organizationId},trust_organization_id.eq.${organizationId}`,
    );
  } else {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching risks for heatmap:", error);
    return apiError("Failed to fetch risks", 500);
  }

  const risks: Risk[] = (data || []).map((r: any) => ({
    id: r.id,
    risk_ref: r.risk_ref,
    title: r.title,
    tier: r.tier,
    status: r.status,
    risk_categories: r.risk_categories || [],
    source_module: r.source_module,
    inherent_likelihood: r.inherent_likelihood,
    inherent_impact: r.inherent_impact,
    impact_by_category: r.impact_by_category || {},
    system_residual_likelihood: r.system_residual_likelihood,
    system_residual_impact: r.system_residual_impact,
    override_residual_likelihood: r.override_residual_likelihood,
    override_residual_impact: r.override_residual_impact,
    override_expires_at: r.override_expires_at,
    target_score: r.target_score,
    risk_appetite_threshold: r.risk_appetite_threshold,
    description: r.description,
  }));

  const matrix = getHeatMapData(risks);

  // Also return summary counts per band
  const totalRisks = risks.length;
  const bandCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  for (let lk = 0; lk < 5; lk++) {
    for (let im = 0; im < 5; im++) {
      const count = matrix[lk][im];
      if (count === 0) continue;
      const score = (lk + 1) * (im + 1);
      if (score >= 17) bandCounts.critical += count;
      else if (score >= 10) bandCounts.high += count;
      else if (score >= 5) bandCounts.medium += count;
      else bandCounts.low += count;
    }
  }

  return apiSuccess({
    matrix,
    total_risks: totalRisks,
    band_counts: bandCounts,
  });
});
