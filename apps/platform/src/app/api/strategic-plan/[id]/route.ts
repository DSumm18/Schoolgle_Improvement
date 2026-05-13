/**
 * Strategic Plan Detail API
 *
 * GET    /api/strategic-plan/[id] - Get a plan with all items, grouped by year, with budget summaries
 * PUT    /api/strategic-plan/[id] - Update plan details
 * DELETE /api/strategic-plan/[id] - Delete a plan
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  buildStrategicPlanInsert,
  mapStrategicPlanForUi,
  mapStrategicPlanItemForUi,
  type StrategicPlanDbRow,
  type StrategicPlanItemDbRow,
  type StrategicPlanType,
} from "@/lib/estate-strategy";
import { buildEstateStrategySummary } from "@/lib/estate-strategy-summary";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface UpdateStrategicPlanBody {
  title?: string;
  description?: string | null;
  status?: string;
  type?: StrategicPlanType;
  plan_type?: StrategicPlanType;
  academic_year_start?: string;
  start_year?: string;
  end_year?: string;
  duration_years?: number;
  total_budget?: number | null;
  year_1_budget?: number | null;
  year_2_budget?: number | null;
  year_3_budget?: number | null;
  approved_by?: string | null;
  approved_at?: string | null;
}

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
    .eq("organization_id", auth.organizationId)
    .single();

  if (planError || !plan) {
    return apiError("Strategic plan not found", 404);
  }

  // Fetch all items for this plan
  const { data: items, error: itemsError } = await supabase
    .from("strategic_plan_items")
    .select("*")
    .eq("strategic_plan_id", id)
    .eq("organization_id", auth.organizationId)
    .order("priority_rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Error fetching plan items:", itemsError);
    return apiError("Failed to fetch plan items", 500);
  }

  // Group items by year
  const uiItems = ((items || []) as StrategicPlanItemDbRow[]).map(
    mapStrategicPlanItemForUi,
  );
  const itemsByYear: Record<number, typeof uiItems> = {};
  for (const item of uiItems) {
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
      const cost = item.estimated_cost ?? 0;
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
    plan: mapStrategicPlanForUi(
      plan as StrategicPlanDbRow,
      (items || []) as StrategicPlanItemDbRow[],
    ),
    items: uiItems,
    items_by_year: itemsByYear,
    budget_summaries: budgetSummaries,
    estate_strategy_summary:
      plan.plan_type === "estates"
        ? buildEstateStrategySummary({
            planTitle: plan.title,
            startYear: plan.start_year,
            endYear: plan.end_year,
            items: uiItems.map((item) => ({
              title: item.title,
              year: item.year,
              estimated_cost: item.estimated_cost,
              risk_score: item.risk_score,
              priority_band: item.priority_band,
              statutory: item.statutory,
            })),
          })
        : null,
  });
});

export const PUT = protectedRoute(async (auth, request) => {
  const id = extractPlanId(request);
  const body = (await request.json()) as UpdateStrategicPlanBody;

  const supabase = createServiceRoleClient();

  const computedPlan =
    body.academic_year_start || body.start_year || body.end_year || body.duration_years
      ? buildStrategicPlanInsert({
          organizationId: auth.organizationId,
          title: body.title ?? "Strategic plan",
          academicYearStart: body.academic_year_start,
          startYear: body.start_year,
          endYear: body.end_year,
          durationYears: body.duration_years,
        })
      : null;

  const updateData: Record<string, unknown> = {
    title: body.title,
    description: body.description,
    status: body.status,
    plan_type: body.plan_type ?? body.type,
    start_year: body.start_year ?? body.academic_year_start,
    end_year: body.end_year ?? computedPlan?.end_year,
    total_budget: body.total_budget,
    year_1_budget: body.year_1_budget,
    year_2_budget: body.year_2_budget,
    year_3_budget: body.year_3_budget,
    approved_by: body.approved_by,
    approved_at: body.approved_at,
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
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) {
    console.error("Error updating strategic plan:", error);
    return apiError("Failed to update strategic plan", 500);
  }

  if (!data) {
    return apiError("Strategic plan not found", 404);
  }

  return apiSuccess({
    plan: mapStrategicPlanForUi(data as StrategicPlanDbRow, []),
  });
});

export const DELETE = protectedRoute(async (auth, request) => {
  const id = extractPlanId(request);
  const supabase = createServiceRoleClient();

  // Delete items first (cascade might handle this, but be explicit)
  await supabase
    .from("strategic_plan_items")
    .delete()
    .eq("strategic_plan_id", id)
    .eq("organization_id", auth.organizationId);

  const { error } = await supabase
    .from("strategic_plans")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) {
    console.error("Error deleting strategic plan:", error);
    return apiError("Failed to delete strategic plan", 500);
  }

  return apiSuccess({ success: true });
});
