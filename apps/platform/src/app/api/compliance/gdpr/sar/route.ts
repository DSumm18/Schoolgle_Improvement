import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/gdpr/sar
 * List Subject Access Requests for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data: items } = await supabase
    .from("compliance_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("type", "sar")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (!items || items.length === 0) {
    return apiSuccess({ sars: [] });
  }

  const { data: sarRecords } = await supabase
    .from("compliance_sar_records")
    .select("*")
    .in(
      "compliance_item_id",
      items.map((i) => i.id),
    );

  const sars = items.map((item) => ({
    ...item,
    sar: sarRecords?.find((s) => s.compliance_item_id === item.id) || null,
  }));

  return apiSuccess({ sars });
});

/**
 * POST /api/compliance/gdpr/sar
 * Create a new Subject Access Request
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      title,
      owner_user_id,
      requester_name,
      requester_relationship,
      date_received,
      identity_verified,
      identity_verified_date,
      deadline_date,
      notes,
    } = body;

    if (!requester_name) {
      return apiError("Missing required field: requester_name", 400);
    }

    const supabase = createServiceRoleClient();

    const received = date_received || new Date().toISOString().split("T")[0];
    const deadline =
      deadline_date ||
      (() => {
        const d = new Date(received);
        d.setDate(d.getDate() + 30); // ICO: one calendar month
        return d.toISOString().split("T")[0];
      })();

    // Create compliance item
    const { data: item, error: itemError } = await supabase
      .from("compliance_items")
      .insert({
        organization_id: organizationId,
        type: "sar",
        title: title || `SAR - ${requester_name}`,
        status: "draft",
        owner_user_id,
        tags: [],
        confidentiality_level: "highly_restricted",
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error creating SAR item:", itemError);
      return apiError("Failed to create SAR", 500);
    }

    // Create SAR record
    const { data: sar, error: sarError } = await supabase
      .from("compliance_sar_records")
      .insert({
        compliance_item_id: item.id,
        requester_name,
        requester_relationship,
        date_received: received,
        identity_verified: identity_verified || false,
        identity_verified_date,
        deadline_date: deadline,
        extension_applied: false,
        individuals_notified: false,
        notes,
      })
      .select()
      .single();

    if (sarError) {
      console.error("Error creating SAR record:", sarError);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "sar",
      entity_id: item.id,
      action: "created",
      actor_user_id: userId,
      metadata: { requester_name, deadline_date: deadline },
    });

    return apiSuccess({ item, sar }, 201);
  },
  { requiredRole: "slt" },
);
