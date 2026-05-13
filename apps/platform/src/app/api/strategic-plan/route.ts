/**
 * Strategic Plan API
 *
 * GET  /api/strategic-plan - List strategic plans for an organization
 * POST /api/strategic-plan - Create a new strategic plan with year budgets
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  buildStrategicPlanInsert,
  mapStrategicPlanForUi,
  type StrategicPlanDbRow,
  type StrategicPlanItemCostRow,
  type StrategicPlanType,
} from "@/lib/estate-strategy";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface StrategicPlanListItem extends StrategicPlanItemCostRow {
  strategic_plan_id: string | null;
}

interface CreateStrategicPlanBody {
  title?: string;
  description?: string | null;
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
}

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const status = searchParams.get("status");
  const planType = searchParams.get("plan_type") || searchParams.get("type");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("strategic_plans")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (planType) {
    query = query.eq("plan_type", planType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching strategic plans:", error);
    return apiError("Failed to fetch strategic plans", 500);
  }

  const plans = (data || []) as StrategicPlanDbRow[];
  const { data: planItems } = await supabase
    .from("strategic_plan_items")
    .select("strategic_plan_id, estimated_cost")
    .eq("organization_id", organizationId);

  const itemsByPlan = new Map<string, StrategicPlanItemCostRow[]>();
  for (const item of (planItems || []) as StrategicPlanListItem[]) {
    if (!item.strategic_plan_id) continue;
    const items = itemsByPlan.get(item.strategic_plan_id) ?? [];
    items.push(item);
    itemsByPlan.set(item.strategic_plan_id, items);
  }

  return apiSuccess({
    plans: plans.map((plan) =>
      mapStrategicPlanForUi(plan, itemsByPlan.get(plan.id) ?? []),
    ),
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = (await request.json()) as CreateStrategicPlanBody;
  const { title } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId) {
    return apiError("organization_id is required", 400);
  }
  if (!title) {
    return apiError("title is required", 400);
  }

  const supabase = createServiceRoleClient();

  const insertData = buildStrategicPlanInsert({
    organizationId: orgId,
    title,
    description: body.description,
    planType: body.plan_type ?? body.type ?? "estates",
    academicYearStart: body.academic_year_start,
    startYear: body.start_year,
    endYear: body.end_year,
    durationYears: body.duration_years,
    totalBudget: body.total_budget,
    year1Budget: body.year_1_budget,
    year2Budget: body.year_2_budget,
    year3Budget: body.year_3_budget,
  });

  const { data, error } = await supabase
    .from("strategic_plans")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating strategic plan:", error);
    return apiError("Failed to create strategic plan", 500);
  }

  return apiSuccess(
    { plan: mapStrategicPlanForUi(data as StrategicPlanDbRow, []) },
    201,
  );
});
