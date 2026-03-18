/**
 * Procurement Requests API
 *
 * GET /api/procurement - List procurement requests for the org
 * POST /api/procurement - Create a procurement request
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const searchParams = request.nextUrl.searchParams;
  const workflowId = searchParams.get("workflow_id");
  const approvalStatus = searchParams.get("approval_status");
  const limit = parseInt(searchParams.get("limit") || "20");

  let query = supabase
    .from("procurement_requests")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (workflowId) {
    query = query.eq("workflow_id", workflowId);
  }
  if (approvalStatus) {
    query = query.eq("approval_status", approvalStatus);
  }

  const { data, error, count } = await query;

  if (error) {
    return apiError(
      `Failed to fetch procurement requests: ${error.message}`,
      500,
    );
  }

  return apiSuccess({ requests: data || [], total: count || 0 });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();

  const body = await request.json();
  const {
    workflow_id,
    workflow_step_id,
    title,
    description,
    category,
    estimated_amount,
    budget_line_cfr,
    quotes_required,
  } = body;

  if (!title) {
    return apiError("title is required", 400);
  }
  if (!category) {
    return apiError("category is required", 400);
  }
  if (estimated_amount === undefined || estimated_amount === null) {
    return apiError("estimated_amount is required", 400);
  }

  const { data: procurement, error } = await supabase
    .from("procurement_requests")
    .insert({
      organization_id: organizationId,
      workflow_id: workflow_id || null,
      workflow_step_id: workflow_step_id || null,
      title,
      description: description || null,
      category,
      estimated_amount,
      budget_line_cfr: budget_line_cfr || null,
      quotes_required: quotes_required ?? (estimated_amount >= 5000 ? 3 : 1),
      approval_status: "pending",
      requested_by: userId,
    })
    .select()
    .single();

  if (error) {
    return apiError(
      `Failed to create procurement request: ${error.message}`,
      500,
    );
  }

  return apiSuccess(procurement, 201);
});
