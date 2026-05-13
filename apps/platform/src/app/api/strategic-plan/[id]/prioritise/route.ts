/**
 * Strategic Plan Prioritise API
 *
 * POST /api/strategic-plan/[id]/prioritise - Run competing demands prioritisation
 *   on all items in the plan. Links to risk_register for live risk scores,
 *   calls prioritiseCompetingDemands(), and updates each item's priority_band
 *   and priority_rank in the database.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  mapStrategicPlanItemForUi,
  type StrategicPlanItemDbRow,
} from "@/lib/estate-strategy";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { prioritiseCompetingDemands } from "@/lib/risk-engine";

function extractPlanId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // /api/strategic-plan/[id]/prioritise => id is segments[length - 2]
  return segments[segments.length - 2];
}

export const POST = protectedRoute(async (auth, request) => {
  const planId = extractPlanId(request);
  const supabase = createServiceRoleClient();

  // Verify plan exists
  const { data: plan, error: planError } = await supabase
    .from("strategic_plans")
    .select("id, organization_id")
    .eq("id", planId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (planError || !plan) {
    return apiError("Strategic plan not found", 404);
  }

  // Fetch all items for this plan
  const { data: items, error: itemsError } = await supabase
    .from("strategic_plan_items")
    .select("*")
    .eq("strategic_plan_id", planId)
    .eq("organization_id", auth.organizationId);

  if (itemsError) {
    console.error("Error fetching plan items:", itemsError);
    return apiError("Failed to fetch plan items", 500);
  }

  if (!items || items.length === 0) {
    return apiSuccess({
      items: [],
      budget_by_band: { must: 0, should: 0, could: 0, wont: 0 },
      total_budget: 0,
    });
  }

  // For items linked to the risk register, fetch their live risk scores
  const typedItems = (items || []) as StrategicPlanItemDbRow[];
  const riskLinkedIds = typedItems
    .filter((item) => item.risk_register_id)
    .map((item) => item.risk_register_id as string);

  const riskScores: Record<string, number> = {};

  if (riskLinkedIds.length > 0) {
    const { data: risks } = await supabase
      .from("risk_register")
      .select(
        "id, effective_residual_score, system_residual_score, inherent_score",
      )
      .in("id", riskLinkedIds);

    if (risks) {
      for (const risk of risks) {
        riskScores[risk.id] =
          risk.effective_residual_score ??
          risk.system_residual_score ??
          risk.inherent_score ??
          0;
      }
    }
  }

  // Build input for prioritisation engine
  const demandItems = typedItems.map((item) => ({
    ...item,
    // Use live risk score from risk_register if linked, otherwise use stored score
    risk_score: item.risk_register_id
      ? (riskScores[item.risk_register_id] ?? item.risk_score ?? 0)
      : (item.risk_score ?? 0),
    cost: item.estimated_cost ?? 0,
    is_statutory: item.is_statutory ?? false,
  }));

  // Run prioritisation
  const prioritised = prioritiseCompetingDemands(demandItems);

  // Update each item in the database with its new priority_band and priority_rank
  const updatePromises = prioritised.map((item) =>
    supabase
      .from("strategic_plan_items")
      .update({
        priority_band: item.priority_band,
        priority_rank: item.rank,
        risk_score: item.risk_score, // persist the live score used
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id),
  );

  await Promise.all(updatePromises);

  // Calculate budget totals per band
  const budgetByBand: Record<string, number> = {
    must: 0,
    should: 0,
    could: 0,
    wont: 0,
  };
  let totalBudget = 0;

  for (const item of prioritised) {
    const cost = item.estimated_cost ?? 0;
    totalBudget += cost;
    budgetByBand[item.priority_band] =
      (budgetByBand[item.priority_band] || 0) + cost;
  }

  const uiItems = prioritised.map((item) =>
    mapStrategicPlanItemForUi({ ...item, priority_rank: item.rank }),
  );

  return apiSuccess({
    items: uiItems,
    summary: {
      must_total: budgetByBand.must,
      should_total: budgetByBand.should,
      could_total: budgetByBand.could,
      wont_total: budgetByBand.wont,
      total_cost: totalBudget,
    },
    budget_by_band: budgetByBand,
    total_budget: totalBudget,
  });
});
