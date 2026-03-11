import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/scr
 * List Single Central Record entries for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("compliance_scr_entries")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching SCR entries:", error);
    return apiError("Failed to fetch SCR entries", 500);
  }

  return apiSuccess({ entries: data || [] });
});

/**
 * POST /api/compliance/scr
 * Create a new Single Central Record entry
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      staff_name,
      role,
      start_date,
      dbs_certificate_number,
      dbs_date,
      dbs_type,
      dbs_update_service,
      dbs_update_checked_date,
      identity_verified,
      identity_verified_date,
      qualifications_verified,
      qualifications_date,
      right_to_work_verified,
      right_to_work_date,
      prohibition_check,
      prohibition_check_date,
      section_128_check,
      section_128_date,
      overseas_check,
      overseas_check_date,
      references_obtained,
      references_date,
      medical_fitness,
      medical_fitness_date,
      safer_recruitment_trained,
      disqualification_declaration,
      notes,
      status,
    } = body;

    if (!staff_name || !role) {
      return apiError("Missing required fields: staff_name, role", 400);
    }

    const supabase = createServiceRoleClient();

    const { data: entry, error } = await supabase
      .from("compliance_scr_entries")
      .insert({
        organization_id: organizationId,
        staff_name,
        role,
        start_date,
        dbs_certificate_number,
        dbs_date,
        dbs_type,
        dbs_update_service: dbs_update_service || false,
        dbs_update_checked_date,
        identity_verified: identity_verified || false,
        identity_verified_date,
        qualifications_verified: qualifications_verified || false,
        qualifications_date,
        right_to_work_verified: right_to_work_verified || false,
        right_to_work_date,
        prohibition_check: prohibition_check || false,
        prohibition_check_date,
        section_128_check: section_128_check || false,
        section_128_date,
        overseas_check: overseas_check || false,
        overseas_check_date,
        references_obtained: references_obtained || false,
        references_date,
        medical_fitness: medical_fitness || false,
        medical_fitness_date,
        safer_recruitment_trained: safer_recruitment_trained || false,
        disqualification_declaration: disqualification_declaration || false,
        notes,
        status: status || "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating SCR entry:", error);
      return apiError("Failed to create SCR entry", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "scr_entry",
      entity_id: entry.id,
      action: "created",
      actor_user_id: userId,
      metadata: { staff_name, role, dbs_type },
    });

    return apiSuccess({ entry }, 201);
  },
  { requiredRole: "slt" },
);
