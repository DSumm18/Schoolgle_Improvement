import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/dpo-service
 * Fetch DPO service record for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data: dpoService, error } = await supabase
    .from("compliance_dpo_service")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    console.error("DPO service fetch error:", error);
    return apiError("Failed to fetch DPO service record", 500);
  }

  return apiSuccess({ dpoService: dpoService || null });
});

/**
 * POST /api/compliance/dpo-service
 * Create or update DPO service record for an organization
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      service_tier,
      consultant_name,
      consultant_email,
      consultant_phone,
      contract_start,
      contract_end,
      annual_fee_pence,
      service_includes,
      sla_response_hours,
      ico_registration_number,
    } = body;

    const supabase = createServiceRoleClient();

    // Check if a record already exists for this organization
    const { data: existing } = await supabase
      .from("compliance_dpo_service")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const isUpdate = !!existing;

    const record = {
      organization_id: organizationId,
      service_tier,
      consultant_name,
      consultant_email,
      consultant_phone,
      contract_start,
      contract_end,
      annual_fee_pence,
      service_includes,
      sla_response_hours,
      ico_registration_number,
    };

    let dpoService;
    let error;

    if (isUpdate) {
      const result = await supabase
        .from("compliance_dpo_service")
        .update(record)
        .eq("organization_id", organizationId)
        .select()
        .single();
      dpoService = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("compliance_dpo_service")
        .insert(record)
        .select()
        .single();
      dpoService = result.data;
      error = result.error;
    }

    if (error) {
      console.error("DPO service upsert error:", error);
      return apiError("Failed to save DPO service record", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "dpo_service",
      entity_id: dpoService.id,
      action: isUpdate ? "updated" : "created",
      actor_user_id: userId,
      metadata: {
        service_tier,
        consultant_name,
        ico_registration_number,
      },
    });

    return apiSuccess({ dpoService }, isUpdate ? 200 : 201);
  },
  { requiredRole: "slt" },
);
