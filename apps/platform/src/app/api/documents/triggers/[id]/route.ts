import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/documents/triggers/[id]
 */
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop();
  if (!id) return apiError("Missing trigger ID", 400);

  const supabase = createServiceRoleClient();

  const { data: rule, error } = await supabase
    .from("document_trigger_rules")
    .select("*, document_templates(*)")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !rule) {
    return apiError("Trigger rule not found", 404);
  }

  return apiSuccess(rule);
});

/**
 * PUT /api/documents/triggers/[id]
 * Update a trigger rule.
 */
export const PUT = protectedRoute(
  async (auth, request: NextRequest) => {
    const id = request.nextUrl.pathname.split("/").pop();
    if (!id) return apiError("Missing trigger ID", 400);

    const body = await request.json();
    const supabase = createServiceRoleClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("document_trigger_rules")
      .select("id")
      .eq("id", id)
      .eq("organization_id", auth.organizationId)
      .single();

    if (!existing) {
      return apiError("Trigger rule not found", 404);
    }

    const updates: Record<string, any> = {};
    if (body.triggerConditions !== undefined)
      updates.trigger_conditions = body.triggerConditions;
    if (body.autoGenerate !== undefined)
      updates.auto_generate = body.autoGenerate;
    if (body.autoSend !== undefined) updates.auto_send = body.autoSend;
    if (body.notifyUsers !== undefined) updates.notify_users = body.notifyUsers;
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.templateId !== undefined) updates.template_id = body.templateId;

    const { data: rule, error } = await supabase
      .from("document_trigger_rules")
      .update(updates)
      .eq("id", id)
      .select("*, document_templates(id, name, module, category)")
      .single();

    if (error) {
      console.error("Error updating trigger rule:", error);
      return apiError("Failed to update trigger rule", 500);
    }

    return apiSuccess(rule);
  },
  { requiredRole: "slt" },
);

/**
 * DELETE /api/documents/triggers/[id]
 */
export const DELETE = protectedRoute(
  async (auth, request: NextRequest) => {
    const id = request.nextUrl.pathname.split("/").pop();
    if (!id) return apiError("Missing trigger ID", 400);

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("document_trigger_rules")
      .delete()
      .eq("id", id)
      .eq("organization_id", auth.organizationId);

    if (error) {
      console.error("Error deleting trigger rule:", error);
      return apiError("Failed to delete trigger rule", 500);
    }

    return apiSuccess({ deleted: true });
  },
  { requiredRole: "slt" },
);
