/**
 * Strategic Plan Items API
 *
 * GET  /api/strategic-plan/[id]/items - List items for a plan (with filters)
 * POST /api/strategic-plan/[id]/items - Add an item to the plan
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  buildStrategicPlanItemInsert,
  mapStrategicPlanItemForUi,
  type MoscowBand,
  type StrategicPlanItemDbRow,
} from "@/lib/estate-strategy";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface CreateStrategicPlanItemBody {
  title?: string;
  description?: string | null;
  category?: string | null;
  year?: number | null;
  cost?: number | null;
  estimated_cost?: number | null;
  statutory?: boolean | null;
  is_statutory?: boolean | null;
  risk_register_id?: string | null;
  linked_risk_id?: string | null;
  risk_score?: number | null;
  school_id?: string | null;
  sdp_priority_id?: string | null;
  linked_sdp_priority_id?: string | null;
  sef_area_id?: string | null;
  cfr_code?: string | null;
  funding_source?: string | null;
  priority_band?: MoscowBand | null;
  moscow_band?: MoscowBand | null;
  source_module?: string | null;
  source_entity_id?: string | null;
  consequence_if_unfunded?: string | null;
}

function extractPlanId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // /api/strategic-plan/[id]/items => id is segments[length - 2]
  return segments[segments.length - 2];
}

export const GET = protectedRoute(async (auth, request) => {
  const planId = extractPlanId(request);
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const category = searchParams.get("category");
  const priorityBand = searchParams.get("priority_band");
  const schoolId = searchParams.get("school_id");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("strategic_plan_items")
    .select("*")
    .eq("strategic_plan_id", planId)
    .eq("organization_id", auth.organizationId)
    .order("priority_rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (year) {
    query = query.eq("year", parseInt(year, 10));
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (priorityBand) {
    query = query.eq("priority_band", priorityBand);
  }
  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching plan items:", error);
    return apiError("Failed to fetch plan items", 500);
  }

  return apiSuccess({
    items: ((data || []) as StrategicPlanItemDbRow[]).map(
      mapStrategicPlanItemForUi,
    ),
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const planId = extractPlanId(request);
  const body = (await request.json()) as CreateStrategicPlanItemBody;
  const { title } = body;

  if (!title) {
    return apiError("title is required", 400);
  }

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

  const insertData = buildStrategicPlanItemInsert({
    organizationId: auth.organizationId,
    planId,
    title,
    description: body.description,
    category: body.category ?? "estates",
    year: body.year ?? 1,
    estimatedCost: body.estimated_cost ?? body.cost ?? 0,
    priorityBand: body.priority_band ?? body.moscow_band ?? "could",
    riskScore: body.risk_score ?? 0,
    isStatutory: body.is_statutory ?? body.statutory ?? false,
    riskRegisterId: body.risk_register_id ?? body.linked_risk_id,
    schoolId: body.school_id,
    sdpPriorityId: body.sdp_priority_id ?? body.linked_sdp_priority_id,
    sefAreaId: body.sef_area_id,
    cfrCode: body.cfr_code,
    fundingSource: body.funding_source,
    sourceModule: body.source_module,
    sourceEntityId: body.source_entity_id,
    consequenceIfUnfunded: body.consequence_if_unfunded,
  });

  const { data, error } = await supabase
    .from("strategic_plan_items")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating plan item:", error);
    return apiError("Failed to create plan item", 500);
  }

  return apiSuccess(
    { item: mapStrategicPlanItemForUi(data as StrategicPlanItemDbRow) },
    201,
  );
});
