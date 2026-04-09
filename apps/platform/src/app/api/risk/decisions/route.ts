/**
 * Risk Decisions API
 *
 * GET  /api/risk/decisions?riskId=<id> - List decisions for a specific risk
 * GET  /api/risk/decisions?organizationId=<id> - List ALL decisions for an organization (with optional filters)
 * POST /api/risk/decisions - Record a 4T decision (treat/tolerate/transfer/terminate)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const riskId = searchParams.get("riskId");
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const decisionType = searchParams.get("decision");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  if (!riskId && !organizationId) {
    return apiError("riskId or organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  // If organizationId is provided, fetch all decisions for that org with risk details
  if (organizationId && !riskId) {
    let query = supabase
      .from("risk_decisions")
      .select(
        "*, risk_register!inner(risk_ref, title, status, risk_categories, tier)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (decisionType) {
      query = query.eq("decision", decisionType);
    }
    if (fromDate) {
      query = query.gte("created_at", fromDate);
    }
    if (toDate) {
      query = query.lte("created_at", toDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching org decisions:", error);
      // Fallback: try without the join in case risk_register FK isn't set up
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("risk_decisions")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (fallbackError) {
        return apiError("Failed to fetch decisions", 500);
      }

      return apiSuccess({ decisions: fallbackData || [] });
    }

    return apiSuccess({ decisions: data || [] });
  }

  // Original behaviour: fetch decisions for a single risk
  const { data, error } = await supabase
    .from("risk_decisions")
    .select("*")
    .eq("risk_id", riskId!)
    .order("decision_date", { ascending: false });

  if (error) {
    console.error("Error fetching decisions:", error);
    return apiError("Failed to fetch decisions", 500);
  }

  return apiSuccess({ decisions: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    risk_id,
    decision,
    decided_by,
    decided_by_name,
    board_meeting_id,
    minute_reference,
    rationale,
    conditions,
    budget_allocated,
    budget_source,
    year_allocated,
    review_date,
  } = body;

  if (!risk_id) {
    return apiError("risk_id is required", 400);
  }
  if (!decision) {
    return apiError("decision is required", 400);
  }

  const validDecisions = ["treat", "tolerate", "transfer", "terminate"];
  if (!validDecisions.includes(decision)) {
    return apiError(
      `decision must be one of: ${validDecisions.join(", ")}`,
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;
  if (!orgId) {
    return apiError("organization_id is required", 400);
  }

  const insertData: Record<string, any> = {
    risk_id,
    organization_id: orgId,
    decision,
    decided_by,
    decided_by_name,
    board_meeting_id,
    minute_reference,
    rationale,
    conditions,
    budget_allocated,
    budget_source,
    year_allocated,
    review_date,
  };

  // Remove undefined values
  Object.keys(insertData).forEach((key) => {
    if (insertData[key] === undefined) delete insertData[key];
  });

  const { data, error } = await supabase
    .from("risk_decisions")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating decision:", error);
    return apiError("Failed to create decision", 500);
  }

  // Update risk status based on decision
  const statusMap: Record<string, string> = {
    treat: "treating",
    tolerate: "tolerated",
    transfer: "treating",
    terminate: "closed",
  };

  const newStatus = statusMap[decision];
  if (newStatus) {
    await supabase
      .from("risk_register")
      .update({
        status: newStatus,
        board_decision_ref: minute_reference || undefined,
      })
      .eq("id", risk_id);
  }

  return apiSuccess({ decision: data }, 201);
});
