import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/items/[id]/approve
 * Get approvals for a compliance item
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const approveIdx = segments.indexOf("approve");
  const id = approveIdx > 0 ? segments[approveIdx - 1] : null;

  if (!id) return apiError("Compliance item ID required", 400);

  const { data, error } = await supabase
    .from("compliance_approvals")
    .select("*")
    .eq("compliance_item_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching approvals:", error);
    return apiError("Failed to fetch approvals", 500);
  }

  return apiSuccess({ approvals: data || [] });
});

/**
 * POST /api/compliance/items/[id]/approve
 * Create or update an approval decision
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const approveIdx = segments.indexOf("approve");
  const id = approveIdx > 0 ? segments[approveIdx - 1] : null;

  if (!id) return apiError("Compliance item ID required", 400);

  const body = await req.json();
  const { version_id, stage, approver_role, decision, decision_notes } = body;

  if (!stage || !decision) {
    return apiError("Missing required fields: stage, decision", 400);
  }

  // Upsert: if same user+stage+item exists, update it
  const { data: existing } = await supabase
    .from("compliance_approvals")
    .select("id")
    .eq("compliance_item_id", id)
    .eq("stage", stage)
    .eq("approver_user_id", auth.userId)
    .maybeSingle();

  let approval;
  let error;

  if (existing) {
    const result = await supabase
      .from("compliance_approvals")
      .update({
        version_id,
        decision,
        decision_notes,
        decided_at: decision !== "pending" ? new Date().toISOString() : null,
      })
      .eq("id", existing.id)
      .select()
      .single();
    approval = result.data;
    error = result.error;
  } else {
    const result = await supabase
      .from("compliance_approvals")
      .insert({
        compliance_item_id: id,
        version_id,
        stage,
        approver_user_id: auth.userId,
        approver_role: approver_role || auth.role,
        decision,
        decision_notes,
        decided_at: decision !== "pending" ? new Date().toISOString() : null,
      })
      .select()
      .single();
    approval = result.data;
    error = result.error;
  }

  if (error) {
    console.error("Error saving approval:", error);
    return apiError("Failed to save approval", 500);
  }

  // Get org id for audit log
  const { data: item } = await supabase
    .from("compliance_items")
    .select("organization_id")
    .eq("id", id)
    .single();

  if (item) {
    await supabase.from("compliance_audit_log").insert({
      organization_id: item.organization_id,
      entity_type: "compliance_approval",
      entity_id: approval.id,
      action:
        decision === "approved"
          ? "approved"
          : decision === "rejected"
            ? "rejected"
            : "approval_pending",
      actor_user_id: auth.userId,
      metadata: { compliance_item_id: id, stage, decision },
    });
  }

  return apiSuccess({ approval }, 201);
});
