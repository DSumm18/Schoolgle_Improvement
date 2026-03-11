/**
 * Approvals API
 *
 * GET  /api/approvals - List approval requests for an organisation
 * POST /api/approvals - Create a new approval request (auto-determines tier)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  determineApprovalTier,
  getSLAHours,
  requiresMinuting,
  type ApprovalType,
} from "@/lib/approval-engine";

/**
 * GET /api/approvals?organizationId=xxx
 *
 * Query params:
 *   status       - filter by approval status
 *   type         - filter by approval type
 *   requestedBy  - filter by requesting user ID
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const requestedBy = searchParams.get("requestedBy");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("approval_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("current_status", status);
  }
  if (type) {
    query = query.eq("type", type);
  }
  if (requestedBy) {
    query = query.eq("requested_by", requestedBy);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Approvals GET] Error:", error);
    return apiError("Failed to fetch approval requests", 500);
  }

  return apiSuccess({ approvals: data || [] });
});

/**
 * POST /api/approvals
 *
 * Body:
 *   type            - ApprovalType (required)
 *   title           - string (required)
 *   description     - string (required)
 *   amount          - number (optional, in GBP)
 *   requestedByName - string (required)
 *   linkedRiskId    - string (optional)
 *   linkedTaskId    - string (optional)
 *   metadata        - object (optional)
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();

    const {
      type,
      title,
      description,
      amount,
      requestedByName,
      linkedRiskId,
      linkedTaskId,
      metadata,
    } = body;

    if (!type || !title || !description) {
      return apiError("Missing required fields: type, title, description", 400);
    }

    const validTypes: ApprovalType[] = [
      "spend",
      "contract",
      "policy",
      "risk_decision",
      "recruitment",
      "disposal",
    ];
    if (!validTypes.includes(type)) {
      return apiError(`Invalid approval type: ${type}`, 400);
    }

    // Auto-determine the approval tier and SLA
    const requiredTier = determineApprovalTier(type, amount, metadata);
    const slaHours = getSLAHours(type, amount);
    const needsMinuting = requiresMinuting(type, amount);

    const expiresAt = new Date(
      Date.now() + slaHours * 60 * 60 * 1000,
    ).toISOString();

    const supabase = createServiceRoleClient();

    const { data: approval, error } = await supabase
      .from("approval_requests")
      .insert({
        organization_id: organizationId,
        type,
        title,
        description,
        amount: amount ?? null,
        requested_by: userId,
        requested_by_name: requestedByName || "Unknown",
        required_tier: requiredTier,
        current_status: "pending",
        requires_minute: needsMinuting,
        expires_at: expiresAt,
        linked_risk_id: linkedRiskId ?? null,
        linked_task_id: linkedTaskId ?? null,
        metadata: metadata ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("[Approvals POST] Error:", error);
      return apiError("Failed to create approval request", 500);
    }

    return apiSuccess({ approval }, 201);
  },
  { requiredRole: "teacher" },
);
