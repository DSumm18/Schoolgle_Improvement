import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/gdpr/breach
 * List data breaches for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data: items } = await supabase
    .from("compliance_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("type", "breach")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (!items || items.length === 0) {
    return apiSuccess({ breaches: [] });
  }

  const { data: breachRecords } = await supabase
    .from("compliance_breach_records")
    .select("*")
    .in(
      "compliance_item_id",
      items.map((i) => i.id),
    );

  const breaches = items.map((item) => ({
    ...item,
    breach:
      breachRecords?.find((b) => b.compliance_item_id === item.id) || null,
  }));

  return apiSuccess({ breaches });
});

/**
 * POST /api/compliance/gdpr/breach
 * Create a new data breach record
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      title,
      owner_user_id,
      date_discovered,
      date_occurred,
      description,
      data_affected,
      individuals_affected,
      severity,
      ico_notified,
      ico_notification_date,
      ico_reference,
      individuals_notified,
      root_cause,
      actions_taken,
      preventive_measures,
      reported_by_user_id,
    } = body;

    if (!description) {
      return apiError("Missing required field: description", 400);
    }

    const supabase = createServiceRoleClient();

    // Create compliance item
    const { data: item, error: itemError } = await supabase
      .from("compliance_items")
      .insert({
        organization_id: organizationId,
        type: "breach",
        title:
          title || `Data Breach - ${new Date().toISOString().split("T")[0]}`,
        status: "draft",
        owner_user_id,
        tags: [],
        confidentiality_level: "highly_restricted",
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error creating breach item:", itemError);
      return apiError("Failed to create breach record", 500);
    }

    // Create breach record
    const { data: breach, error: breachError } = await supabase
      .from("compliance_breach_records")
      .insert({
        compliance_item_id: item.id,
        date_discovered:
          date_discovered || new Date().toISOString().split("T")[0],
        date_occurred,
        description,
        data_affected,
        individuals_affected,
        severity: severity || "medium",
        ico_notified: ico_notified || false,
        ico_notification_date,
        ico_reference,
        individuals_notified: individuals_notified || false,
        root_cause,
        actions_taken,
        preventive_measures,
        reported_by_user_id,
      })
      .select()
      .single();

    if (breachError) {
      console.error("Error creating breach record:", breachError);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "breach",
      entity_id: item.id,
      action: "created",
      actor_user_id: userId,
      metadata: {
        severity,
        date_discovered:
          date_discovered || new Date().toISOString().split("T")[0],
      },
    });

    return apiSuccess({ item, breach }, 201);
  },
  { requiredRole: "slt" },
);
