/**
 * Risk Register API
 *
 * GET  /api/risk - List risks for an organization (with filters)
 * POST /api/risk - Create a new risk entry
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { generateRiskRef } from "@/lib/risk-engine";
import type { RiskCategory, RiskTier, RiskStatus } from "@/lib/risk-engine";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const status = searchParams.get("status");
  const tier = searchParams.get("tier");
  const category = searchParams.get("category");
  const band = searchParams.get("band");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("risk_register_with_mitigations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (tier) {
    query = query.eq("tier", tier);
  }
  if (category) {
    query = query.contains("risk_categories", [category]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching risks:", error);
    return apiError("Failed to fetch risks", 500);
  }

  let risks = data || [];

  // Filter by risk band client-side (computed from scores)
  if (band) {
    risks = risks.filter((r: any) => {
      const score =
        r.effective_residual_score ??
        r.system_residual_score ??
        r.inherent_score ??
        0;
      if (band === "critical") return score >= 17;
      if (band === "high") return score >= 10 && score < 17;
      if (band === "medium") return score >= 5 && score < 10;
      if (band === "low") return score < 5;
      return true;
    });
  }

  return apiSuccess({ risks });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    organization_id,
    title,
    description,
    tier = "school",
    risk_categories = [],
    source_module,
    source_task_id,
    source_table,
    inherent_likelihood,
    inherent_impact,
    impact_by_category,
    target_score,
    risk_appetite_threshold,
    risk_owner_id,
    risk_owner_name,
    sef_area_id,
    sdp_priority_id,
    budget_line_cfr,
    legislation_refs,
    review_frequency,
  } = body;

  const orgId = organization_id || auth.organizationId;

  if (!orgId) {
    return apiError("organization_id is required", 400);
  }
  if (!title) {
    return apiError("title is required", 400);
  }
  if (!inherent_likelihood || !inherent_impact) {
    return apiError(
      "inherent_likelihood and inherent_impact are required",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Generate risk_ref: count existing risks in this org for the primary category
  const primaryCategory: RiskCategory = risk_categories[0] || "operational";
  const { count } = await supabase
    .from("risk_register")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .contains("risk_categories", [primaryCategory]);

  const sequence = (count ?? 0) + 1;

  // Get school code from org (use first 3 chars of org id as fallback)
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const schoolCode = org?.name
    ? org.name
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "X")
    : orgId.substring(0, 3).toUpperCase();

  const risk_ref = generateRiskRef(primaryCategory, schoolCode, sequence);

  const insertData: Record<string, any> = {
    organization_id: orgId,
    risk_ref,
    title,
    description,
    tier,
    status: "identified",
    risk_categories,
    source_module,
    source_task_id,
    source_table,
    inherent_likelihood,
    inherent_impact,
    impact_by_category: impact_by_category || {},
    system_residual_likelihood: inherent_likelihood,
    system_residual_impact: inherent_impact,
    effective_residual_score: inherent_likelihood * inherent_impact,
    target_score,
    risk_appetite_threshold,
    risk_owner_id,
    risk_owner_name,
    sef_area_id,
    sdp_priority_id,
    budget_line_cfr,
    legislation_refs,
    review_frequency,
  };

  // Remove undefined values
  Object.keys(insertData).forEach((key) => {
    if (insertData[key] === undefined) delete insertData[key];
  });

  const { data, error } = await supabase
    .from("risk_register")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating risk:", error);
    return apiError("Failed to create risk", 500);
  }

  // Insert initial score history record
  await supabase.from("risk_score_history").insert({
    risk_id: data.id,
    organization_id: orgId,
    score_type: "system_calculated",
    system_likelihood: inherent_likelihood,
    system_impact: inherent_impact,
    system_score: inherent_likelihood * inherent_impact,
    recorded_likelihood: inherent_likelihood,
    recorded_impact: inherent_impact,
    recorded_score: inherent_likelihood * inherent_impact,
    trigger_type: "mitigation_added",
  });

  return apiSuccess({ risk: data }, 201);
});
