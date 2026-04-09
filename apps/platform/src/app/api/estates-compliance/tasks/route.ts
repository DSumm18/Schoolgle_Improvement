/**
 * API Route: Task Actions (Snooze, Mark N/A)
 *
 * POST /api/estates-compliance/tasks
 * Actions: snooze, mark_na
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  getLatestCompletion,
  updateCompletion,
  type StatutoryCompletion,
} from "@/lib/estates-compliance/database/statutory-completions";

export const runtime = "nodejs";
export const maxDuration = 30;

interface SnoozeRequest {
  action: "snooze";
  organization_id: string;
  check_id: string;
  new_due_date: string;
  reason?: string;
}

interface MarkNARequest {
  action: "mark_na";
  organization_id: string;
  check_id: string;
  reason: string;
  reason_category:
    | "not_applicable_site"
    | "service_outsourced"
    | "equipment_not_present"
    | "other";
}

type TaskActionRequest = SnoozeRequest | MarkNARequest;

interface AuditLogEntry {
  organization_id: string;
  user_id: string;
  action_type: "snoozed" | "marked_not_applicable";
  check_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

/**
 * POST: Handle task actions (snooze, mark N/A)
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = (await request.json()) as TaskActionRequest;
  const { action, check_id } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!check_id) {
    return apiError("check_id is required", 400);
  }

  if (!action || !["snooze", "mark_na"].includes(action)) {
    return apiError("Invalid action. Use: snooze, mark_na", 400);
  }

  // Get the latest completion record
  const completion = await getLatestCompletion(orgId, check_id);

  if (!completion) {
    return apiError("Check not found", 404);
  }

  let result: StatutoryCompletion;
  let auditLog: AuditLogEntry;

  switch (action) {
    case "snooze": {
      const snoozeBody = body as SnoozeRequest;
      const { new_due_date, reason } = snoozeBody;

      if (!new_due_date) {
        return apiError("new_due_date is required for snooze action", 400);
      }

      // Validate the new date is in the future
      const newDate = new Date(new_due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (newDate < today) {
        return apiError("New due date must be in the future", 400);
      }

      // Update the completion with new due date
      result = await updateCompletion(completion.id, {
        next_due_date: new_due_date,
        // Keep status as pending if it was pending or overdue
        status: completion.status === "overdue" ? "pending" : completion.status,
        rag_status: "amber",
      });

      // Create audit log entry
      auditLog = {
        organization_id: orgId,
        user_id: auth.userId,
        action_type: "snoozed",
        check_id,
        details: {
          previous_due_date: completion.next_due_date,
          new_due_date: new_due_date,
          reason: reason || "No reason provided",
        },
        created_at: new Date().toISOString(),
      };

      break;
    }

    case "mark_na": {
      const markNABody = body as MarkNARequest;
      const { reason, reason_category } = markNABody;

      if (!reason) {
        return apiError("reason is required for mark_na action", 400);
      }

      // Update the completion to not_applicable
      result = await updateCompletion(completion.id, {
        status: "not_applicable",
        rag_status: "green",
        completion_notes: `Marked N/A: ${reason} (${reason_category})`,
      });

      // Create audit log entry
      auditLog = {
        organization_id: orgId,
        user_id: auth.userId,
        action_type: "marked_not_applicable",
        check_id,
        details: {
          previous_status: completion.status,
          reason,
          reason_category,
        },
        created_at: new Date().toISOString(),
      };

      break;
    }

    default:
      return apiError("Invalid action", 400);
  }

  // Add audit log entry to estates_audit_log table
  const supabase = createServiceRoleClient();
  const { error: logError } = await supabase
    .from("estates_audit_log")
    .insert(auditLog);

  if (logError) {
    // Log the error but don't fail the request
    console.error("[Task Actions] Failed to create audit log:", logError);
  }

  return apiSuccess({
    success: true,
    completion: result,
    audit_logged: !logError,
  });
});

/**
 * GET: Fetch task details for a check
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const checkId = searchParams.get("check_id");

  if (!checkId) {
    return apiError("check_id is required", 400);
  }

  const completion = await getLatestCompletion(organizationId, checkId);

  if (!completion) {
    return apiError("Check not found", 404);
  }

  return apiSuccess({
    success: true,
    completion,
  });
});
