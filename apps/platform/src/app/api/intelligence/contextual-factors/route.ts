import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/intelligence/contextual-factors
 * List contextual factors for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const factorType = searchParams.get("type");
  const yearGroup = searchParams.get("yearGroup");

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("school_contextual_factors")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("start_date", { ascending: false });

  if (factorType) {
    query = query.eq("factor_type", factorType);
  }

  if (yearGroup) {
    query = query.contains("affected_year_groups", [parseInt(yearGroup)]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Contextual Factors] Fetch error:", error);
    return apiError("Failed to fetch contextual factors", 500);
  }

  return apiSuccess({
    factors: data || [],
    total: data?.length || 0,
  });
});

/**
 * POST /api/intelligence/contextual-factors
 * Create a new contextual factor
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    factor_type,
    title,
    description,
    rationale,
    start_date,
    end_date,
    academic_year_start,
    affected_year_groups,
    whole_school,
    expected_impact,
    impact_area,
    impact_direction,
    impact_severity,
    eef_strategy_id,
    eef_expected_months_progress,
    source_module,
    created_by,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !factor_type || !title || !start_date || !academic_year_start) {
    return apiError(
      "Missing required fields: factor_type, title, start_date, academic_year_start",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("school_contextual_factors")
    .insert({
      organization_id: orgId,
      factor_type,
      title,
      description: description || null,
      rationale: rationale || null,
      start_date,
      end_date: end_date || null,
      academic_year_start,
      affected_year_groups: affected_year_groups || [],
      whole_school: whole_school || false,
      expected_impact: expected_impact || null,
      impact_area: impact_area || null,
      impact_direction: impact_direction || null,
      impact_severity: impact_severity || null,
      eef_strategy_id: eef_strategy_id || null,
      eef_expected_months_progress: eef_expected_months_progress || null,
      source_module: source_module || "manual",
      created_by: created_by || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[Contextual Factors] Insert error:", error);
    return apiError("Failed to create contextual factor", 500);
  }

  return apiSuccess({ factor: data });
});

/**
 * PATCH /api/intelligence/contextual-factors
 * Update a contextual factor (e.g., add measured outcome)
 */
export const PATCH = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { id, ...updates } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!id || !orgId) {
    return apiError("Missing required fields: id", 400);
  }

  const supabase = createServiceRoleClient();

  // Only allow safe fields to be updated
  const allowedFields = [
    "title",
    "description",
    "rationale",
    "end_date",
    "affected_year_groups",
    "whole_school",
    "expected_impact",
    "impact_area",
    "impact_direction",
    "impact_severity",
    "eef_strategy_id",
    "eef_expected_months_progress",
    "measured_outcome",
    "measured_impact_score",
    "evidence_of_impact",
    "is_active",
  ];

  const safeUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  for (const key of allowedFields) {
    if (key in updates) {
      safeUpdates[key] = updates[key];
    }
  }

  const { data, error } = await supabase
    .from("school_contextual_factors")
    .update(safeUpdates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) {
    console.error("[Contextual Factors] Update error:", error);
    return apiError("Failed to update contextual factor", 500);
  }

  return apiSuccess({ factor: data });
});
