import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/gdpr/dpia
 * List DPIAs for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  // Get DPIA items
  const { data: items } = await supabase
    .from("compliance_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("type", "dpia")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (!items || items.length === 0) {
    return apiSuccess({ dpias: [] });
  }

  // Get DPIA records
  const { data: dpiaRecords } = await supabase
    .from("compliance_dpia_records")
    .select("*")
    .in(
      "compliance_item_id",
      items.map((i) => i.id),
    );

  const dpias = items.map((item) => ({
    ...item,
    dpia: dpiaRecords?.find((d) => d.compliance_item_id === item.id) || null,
  }));

  return apiSuccess({ dpias });
});

/**
 * POST /api/compliance/gdpr/dpia
 * Create a new DPIA (creates compliance_item + dpia record)
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      title,
      owner_user_id,
      processing_description,
      purpose,
      lawful_basis,
      data_categories,
      special_category_data,
      recipients,
      transfers_outside_uk,
      necessity_assessment,
      proportionality_assessment,
      risks,
      mitigations,
      consultation_required,
      consultation_notes,
      review_date,
    } = body;

    if (!title) {
      return apiError("Missing required field: title", 400);
    }

    const supabase = createServiceRoleClient();

    // Create compliance item
    const { data: item, error: itemError } = await supabase
      .from("compliance_items")
      .insert({
        organization_id: organizationId,
        type: "dpia",
        title,
        status: "draft",
        owner_user_id,
        tags: [],
        confidentiality_level: "restricted",
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error creating DPIA item:", itemError);
      return apiError("Failed to create DPIA", 500);
    }

    // Create DPIA record
    const { data: dpia, error: dpiaError } = await supabase
      .from("compliance_dpia_records")
      .insert({
        compliance_item_id: item.id,
        processing_description,
        purpose,
        lawful_basis,
        data_categories: data_categories || [],
        special_category_data: special_category_data || false,
        recipients,
        transfers_outside_uk: transfers_outside_uk || false,
        necessity_assessment,
        proportionality_assessment,
        risks: risks || [],
        mitigations: mitigations || [],
        consultation_required: consultation_required || false,
        consultation_notes,
        review_date,
      })
      .select()
      .single();

    if (dpiaError) {
      console.error("Error creating DPIA record:", dpiaError);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "dpia",
      entity_id: item.id,
      action: "created",
      actor_user_id: userId,
      metadata: { title },
    });

    return apiSuccess({ item, dpia }, 201);
  },
  { requiredRole: "slt" },
);
