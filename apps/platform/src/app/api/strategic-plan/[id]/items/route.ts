/**
 * Strategic Plan Items API
 *
 * GET  /api/strategic-plan/[id]/items - List items for a plan (with filters)
 * POST /api/strategic-plan/[id]/items - Add an item to the plan
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

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
    .eq("plan_id", planId)
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

  return apiSuccess({ items: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const planId = extractPlanId(request);
  const body = await request.json();
  const {
    title,
    description,
    category,
    year,
    cost,
    is_statutory,
    risk_register_id,
    risk_score,
    school_id,
    school_name,
    owner_name,
    owner_id,
    sdp_priority_id,
    sef_area_id,
    cfr_code,
    success_criteria,
    notes,
  } = body;

  if (!title) {
    return apiError("title is required", 400);
  }

  const supabase = createServiceRoleClient();

  // Verify plan exists
  const { data: plan, error: planError } = await supabase
    .from("strategic_plans")
    .select("id")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    return apiError("Strategic plan not found", 404);
  }

  const insertData: Record<string, any> = {
    plan_id: planId,
    title,
    description,
    category,
    year,
    cost: cost ?? 0,
    is_statutory: is_statutory ?? false,
    risk_register_id,
    risk_score: risk_score ?? 0,
    school_id,
    school_name,
    owner_name,
    owner_id,
    sdp_priority_id,
    sef_area_id,
    cfr_code,
    success_criteria,
    notes,
  };

  // Remove undefined values
  Object.keys(insertData).forEach((key) => {
    if (insertData[key] === undefined) delete insertData[key];
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

  return apiSuccess({ item: data }, 201);
});
