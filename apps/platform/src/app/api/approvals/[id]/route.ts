/**
 * Individual Approval API
 *
 * GET /api/approvals/[id] - Get a single approval with history
 * PUT /api/approvals/[id] - Approve, reject, or escalate
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  canUserApprove,
  getEscalationTarget,
  getSLAHours,
  type ApprovalTier,
} from "@/lib/approval-engine";

function extractId(request: NextRequest): string {
  const segments = new URL(request.url).pathname.split("/");
  // /api/approvals/[id] → id is the last segment
  return segments[segments.length - 1];
}

/**
 * GET /api/approvals/[id]?organizationId=xxx
 *
 * Returns the approval request and its audit history.
 */
export const GET = protectedRoute(async (auth, request) => {
  const id = extractId(request);
  const supabase = createServiceRoleClient();

  const { data: approval, error } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !approval) {
    return apiError("Approval request not found", 404);
  }

  // Fetch audit history
  const { data: history } = await supabase
    .from("approval_audit_log")
    .select("*")
    .eq("approval_id", id)
    .order("created_at", { ascending: true });

  return apiSuccess({ approval, history: history || [] });
});

/**
 * PUT /api/approvals/[id]
 *
 * Body:
 *   action  - "approve" | "reject" | "escalate" (required)
 *   reason  - string (required for reject, optional for others)
 *   actorName - string (display name of user taking action)
 */
export const PUT = protectedRoute(
  async (auth, request) => {
    const id = extractId(request);
    const body = await request.json();
    const { action, reason, actorName } = body;

    if (!action || !["approve", "reject", "escalate"].includes(action)) {
      return apiError(
        'Invalid action. Must be "approve", "reject", or "escalate".',
        400,
      );
    }

    if (action === "reject" && !reason) {
      return apiError("A reason is required when rejecting.", 400);
    }

    const supabase = createServiceRoleClient();

    // Fetch the current request
    const { data: approval, error: fetchError } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("id", id)
      .eq("organization_id", auth.organizationId)
      .single();

    if (fetchError || !approval) {
      return apiError("Approval request not found", 404);
    }

    if (approval.current_status !== "pending") {
      return apiError(
        `Cannot ${action} — request is already ${approval.current_status}.`,
        409,
      );
    }

    // ── Authority check ────────────────────────────────────────────
    if (action === "approve") {
      const hasAuthority = canUserApprove(
        auth.role,
        approval.required_tier as ApprovalTier,
      );
      if (!hasAuthority) {
        return apiError(
          `Your role (${auth.role}) does not have authority to approve at the ${approval.required_tier} tier.`,
          403,
        );
      }
    }

    // ── Build the update ───────────────────────────────────────────
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updated_at: now };

    if (action === "approve") {
      updateData.current_status = "approved";
      updateData.approved_by = auth.userId;
      updateData.approved_by_name = actorName || auth.email;
      updateData.approved_at = now;
    } else if (action === "reject") {
      updateData.current_status = "rejected";
      updateData.approved_by = auth.userId;
      updateData.approved_by_name = actorName || auth.email;
      updateData.rejected_reason = reason;
    } else if (action === "escalate") {
      const nextTier = getEscalationTarget(
        approval.required_tier as ApprovalTier,
      );
      const newSLA = getSLAHours(approval.type, approval.amount);
      updateData.current_status = "escalated";
      updateData.escalated_to = nextTier;
      updateData.escalated_at = now;
      updateData.required_tier = nextTier;
      // Reset expiry based on new SLA from escalation point
      updateData.expires_at = new Date(
        Date.now() + newSLA * 60 * 60 * 1000,
      ).toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from("approval_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Approvals PUT] Error:", updateError);
      return apiError("Failed to update approval request", 500);
    }

    // ── Audit log entry ────────────────────────────────────────────
    await supabase.from("approval_audit_log").insert({
      approval_id: id,
      organization_id: auth.organizationId,
      action,
      actor_user_id: auth.userId,
      actor_name: actorName || auth.email,
      actor_role: auth.role,
      reason: reason || null,
      previous_status: approval.current_status,
      new_status: updated.current_status,
      metadata:
        action === "escalate" ? { escalated_to: updated.escalated_to } : null,
    });

    return apiSuccess({ approval: updated });
  },
  { requiredRole: "slt" },
);
