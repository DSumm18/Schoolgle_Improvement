/**
 * Sports Premium Spend Items API
 *
 * GET  /api/sports-premium/spend — List spend items, optionally filter by indicator
 * POST /api/sports-premium/spend — Create a new spend item
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const url = new URL(request.url);
  const strategyId = url.searchParams.get("strategy_id");
  const indicator = url.searchParams.get("indicator");

  if (!strategyId) {
    return apiError("strategy_id is required", 400);
  }

  const supabase = createServiceRoleClient();

  // Verify the strategy belongs to this org
  const { data: strategy } = await supabase
    .from("sports_premium_strategies")
    .select("id")
    .eq("id", strategyId)
    .eq("organization_id", organizationId)
    .single();

  if (!strategy) {
    return apiError("Strategy not found", 404);
  }

  let query = supabase
    .from("sports_premium_spend")
    .select("*")
    .eq("strategy_id", strategyId)
    .order("indicator", { ascending: true })
    .order("created_at", { ascending: true });

  if (indicator) {
    query = query.eq("indicator", parseInt(indicator, 10));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Sports Premium] Spend fetch error:", error);
    return apiError("Failed to fetch spend items", 500);
  }

  return apiSuccess(data || []);
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const body = await request.json();

  if (!body.strategy_id) {
    return apiError("strategy_id is required", 400);
  }

  if (!body.indicator || body.indicator < 1 || body.indicator > 5) {
    return apiError("indicator must be between 1 and 5", 400);
  }

  if (!body.activity) {
    return apiError("activity name is required", 400);
  }

  const supabase = createServiceRoleClient();

  // Verify the strategy belongs to this org
  const { data: strategy } = await supabase
    .from("sports_premium_strategies")
    .select("id")
    .eq("id", body.strategy_id)
    .eq("organization_id", organizationId)
    .single();

  if (!strategy) {
    return apiError("Strategy not found", 404);
  }

  const spendItem = {
    strategy_id: body.strategy_id,
    indicator: body.indicator,
    activity: body.activity,
    description: body.description || "",
    budgeted_cost: body.budgeted_cost || 0,
    actual_cost: body.actual_cost || 0,
    impact_notes: body.impact_notes || "",
    sustainability: body.sustainability || "",
    evidence: body.evidence || "",
    status: body.status || "planned",
  };

  const { data, error } = await supabase
    .from("sports_premium_spend")
    .insert(spendItem)
    .select()
    .single();

  if (error) {
    console.error("[Sports Premium] Spend create error:", error);
    return apiError("Failed to create spend item: " + error.message, 500);
  }

  return apiSuccess(data, 201);
});
