/**
 * Risk Mitigations API
 *
 * GET  /api/risk/mitigations - List mitigations for a risk
 * POST /api/risk/mitigations - Add a mitigation to a risk
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const riskId = searchParams.get("riskId");

  if (!riskId) {
    return apiError("riskId is required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("risk_mitigations")
    .select("*")
    .eq("risk_id", riskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching mitigations:", error);
    return apiError("Failed to fetch mitigations", 500);
  }

  return apiSuccess({ mitigations: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    risk_id,
    organization_id,
    title,
    mitigation_type,
    source_module,
    source_task_id,
    source_table,
    effectiveness,
    is_operating,
    last_operated_at,
    frequency_required,
    likelihood_reduction,
    impact_reduction,
  } = body;

  if (!risk_id) {
    return apiError("risk_id is required", 400);
  }
  if (!title) {
    return apiError("title is required", 400);
  }
  if (!mitigation_type) {
    return apiError("mitigation_type is required", 400);
  }

  const supabase = createServiceRoleClient();

  // If organization_id not provided, look it up from the risk
  let orgId = organization_id || auth.organizationId;
  if (!orgId) {
    const { data: risk } = await supabase
      .from("risk_register")
      .select("organization_id")
      .eq("id", risk_id)
      .single();

    if (!risk) {
      return apiError("Risk not found", 404);
    }
    orgId = risk.organization_id;
  }

  const insertData: Record<string, any> = {
    risk_id,
    organization_id: orgId,
    title,
    mitigation_type,
    source_module: source_module || "manual",
    source_task_id,
    source_table,
    effectiveness: effectiveness || "not_tested",
    is_operating: is_operating ?? false,
    last_operated_at,
    frequency_required,
    likelihood_reduction: likelihood_reduction ?? 0,
    impact_reduction: impact_reduction ?? 0,
    overdue: false,
  };

  // Remove undefined values
  Object.keys(insertData).forEach((key) => {
    if (insertData[key] === undefined) delete insertData[key];
  });

  const { data, error } = await supabase
    .from("risk_mitigations")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating mitigation:", error);
    return apiError("Failed to create mitigation", 500);
  }

  return apiSuccess({ mitigation: data }, 201);
});
