/**
 * Strategic Plan Detail API
 *
 * GET    /api/strategic-plan/[id] - Get a plan with all items, grouped by year, with budget summaries
 * PUT    /api/strategic-plan/[id] - Update plan details
 * DELETE /api/strategic-plan/[id] - Delete a plan
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function extractPlanId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // /api/strategic-plan/[id] => id is the last segment
  return segments[segments.length - 1];
}

export const GET = protectedRoute(async (auth, request) => {
  const id = extractPlanId(request);
  const supabase = createServiceRoleClient();

  // Fetch plan
  const { data: plan, error: planError } = await supabase
    .from("strategic_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (planError || !plan) {
    return apiError("Strategic plan not found", 404);
  }

  // Fetch all items for this plan
  const { data: items, error: itemsError } = await supabase
    .from("strategic_plan_items")
    .select("*")
    .eq("plan_id", id)
    .order("priority_rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Error fetching plan items:", itemsError);
    return apiError("Failed to fetch plan items", 500);
  }

  // Group items by year
  const itemsByYear: Record<number, any[]> = {};
  for (const item of items || []) {
    const year = item.year ?? 0;
    if (!itemsByYear[year]) itemsByYear[year] = [];
    itemsByYear[year].push(item);
  }

  // Calculate budget summaries per year
  const budgetSummaries: Record<
    number,
    { total: number; by_band: Record<string, number>; item_count: number }
  > = {};
  for (const [yearStr, yearItems] of Object.entries(itemsByYear)) {
    const year = Number(yearStr);
    const byBand: Record<string, number> = {
      must: 0,
      should: 0,
      could: 0,
      wont: 0,
      unassigned: 0,
    };
    let total = 0;

    for (const item of yearItems) {
      const cost = item.cost ?? 0;
      total += cost;
      const band = item.priority_band || "unassigned";
      byBand[band] = (byBand[band] || 0) + cost;
    }

    budgetSummaries[year] = {
      total,
      by_band: byBand,
      item_count: yearItems.length,
    };
  }

  return apiSuccess({
    plan,
    items: items || [],
    items_by_year: itemsByYear,
    budget_summaries: budgetSummaries,
  });
});

export const PUT = protectedRoute(async (auth, request) => {
  const id = extractPlanId(request);
  const body = await request.json();
  const {
    title,
    description,
    status,
    start_year,
    end_year,
    year_budgets,
    approved_by,
    approved_at,
  } = body;

  const supabase = createServiceRoleClient();

  const updateData: Record<string, any> = {
    title,
    description,
    status,
    start_year,
    end_year,
    year_budgets,
    approved_by,
    approved_at,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined values
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) delete updateData[key];
  });

  const { data, error } = await supabase
    .from("strategic_plans")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating strategic plan:", error);
    return apiError("Failed to update strategic plan", 500);
  }

  if (!data) {
    return apiError("Strategic plan not found", 404);
  }

  return apiSuccess({ plan: data });
});

export const DELETE = protectedRoute(async (auth, request) => {
  const id = extractPlanId(request);
  const supabase = createServiceRoleClient();

  // Delete items first (cascade might handle this, but be explicit)
  await supabase.from("strategic_plan_items").delete().eq("plan_id", id);

  const { error } = await supabase
    .from("strategic_plans")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting strategic plan:", error);
    return apiError("Failed to delete strategic plan", 500);
  }

  return apiSuccess({ success: true });
});
