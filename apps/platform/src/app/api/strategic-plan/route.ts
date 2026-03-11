/**
 * Strategic Plan API
 *
 * GET  /api/strategic-plan - List strategic plans for an organization
 * POST /api/strategic-plan - Create a new strategic plan with year budgets
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const status = searchParams.get("status");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("strategic_plans")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching strategic plans:", error);
    return apiError("Failed to fetch strategic plans", 500);
  }

  return apiSuccess({ plans: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    organization_id,
    title,
    description,
    start_year,
    end_year,
    year_budgets,
    created_by,
  } = body;

  const orgId = organization_id || auth.organizationId;

  if (!orgId) {
    return apiError("organization_id is required", 400);
  }
  if (!title) {
    return apiError("title is required", 400);
  }
  if (!start_year || !end_year) {
    return apiError("start_year and end_year are required", 400);
  }
  if (end_year < start_year) {
    return apiError("end_year must be >= start_year", 400);
  }

  const supabase = createServiceRoleClient();

  const insertData: Record<string, any> = {
    organization_id: orgId,
    title,
    description,
    start_year,
    end_year,
    year_budgets: year_budgets || {},
    status: "draft",
    created_by,
  };

  // Remove undefined values
  Object.keys(insertData).forEach((key) => {
    if (insertData[key] === undefined) delete insertData[key];
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

  return apiSuccess({ plan: data }, 201);
});
