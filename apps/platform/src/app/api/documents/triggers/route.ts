import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { TRIGGER_EVENTS } from "@/lib/document-engine";

/**
 * GET /api/documents/triggers
 * List trigger rules for the organization.
 */
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const { data: rules, error } = await supabase
    .from("document_trigger_rules")
    .select("*, document_templates(id, name, module, category, document_type)")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching trigger rules:", error);
    return apiError("Failed to fetch trigger rules", 500);
  }

  // Include available event types for the UI
  return apiSuccess({
    rules: rules || [],
    available_events: Object.entries(TRIGGER_EVENTS).map(([key, value]) => ({
      key,
      event: value,
      module: value.split(".")[0],
      label: key
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    })),
  });
});

/**
 * POST /api/documents/triggers
 * Create a new trigger rule.
 *
 * Body: { templateId, triggerEvent, triggerConditions?, autoGenerate?, autoSend?, notifyUsers? }
 */
export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const body = await request.json();
    const {
      templateId,
      triggerEvent,
      triggerConditions,
      autoGenerate,
      autoSend,
      notifyUsers,
    } = body;

    if (!templateId || !triggerEvent) {
      return apiError("Missing required fields: templateId, triggerEvent", 400);
    }

    // Validate trigger event
    const validEvents = Object.values(TRIGGER_EVENTS);
    if (!validEvents.includes(triggerEvent as any)) {
      return apiError(
        `Invalid trigger event. Valid events: ${validEvents.join(", ")}`,
        400,
      );
    }

    const supabase = createServiceRoleClient();

    // Verify template exists
    const { data: template } = await supabase
      .from("document_templates")
      .select("id")
      .eq("id", templateId)
      .single();

    if (!template) {
      return apiError("Template not found", 404);
    }

    const { data: rule, error } = await supabase
      .from("document_trigger_rules")
      .insert({
        organization_id: auth.organizationId,
        template_id: templateId,
        trigger_event: triggerEvent,
        trigger_conditions: triggerConditions || {},
        auto_generate: autoGenerate ?? true,
        auto_send: autoSend ?? false,
        notify_users: notifyUsers || [],
        is_active: true,
      })
      .select("*, document_templates(id, name, module, category)")
      .single();

    if (error) {
      console.error("Error creating trigger rule:", error);
      return apiError("Failed to create trigger rule", 500);
    }

    return apiSuccess(rule, 201);
  },
  { requiredRole: "slt" },
);
