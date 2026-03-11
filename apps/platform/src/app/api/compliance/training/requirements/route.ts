import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/training/requirements
 * List training requirements for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("compliance_training_requirements")
    .select("*, course:compliance_training_courses(*)")
    .eq("organization_id", organizationId)
    .order("role_key", { ascending: true });

  if (error) {
    console.error("Error fetching requirements:", error);
    return apiError("Failed to fetch requirements", 500);
  }

  return apiSuccess({ requirements: data || [] });
});

/**
 * POST /api/compliance/training/requirements
 * Set a training requirement for an organization
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const { trust_id, role_key, course_id, required, renewal_days } = body;

    if (!role_key || !course_id) {
      return apiError("Missing required fields: role_key, course_id", 400);
    }

    const supabase = createServiceRoleClient();

    // Upsert: if same org+role+course exists, update
    const { data: existing } = await supabase
      .from("compliance_training_requirements")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("role_key", role_key)
      .eq("course_id", course_id)
      .maybeSingle();

    let requirement;
    let error;

    if (existing) {
      const result = await supabase
        .from("compliance_training_requirements")
        .update({ required: required ?? true, renewal_days, trust_id })
        .eq("id", existing.id)
        .select("*, course:compliance_training_courses(*)")
        .single();
      requirement = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("compliance_training_requirements")
        .insert({
          organization_id: organizationId,
          trust_id,
          role_key,
          course_id,
          required: required ?? true,
          renewal_days,
        })
        .select("*, course:compliance_training_courses(*)")
        .single();
      requirement = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error setting requirement:", error);
      return apiError("Failed to set requirement", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "training_requirement",
      entity_id: requirement.id,
      action: existing ? "updated" : "created",
      actor_user_id: userId,
      metadata: { role_key, course_id, required },
    });

    return apiSuccess({ requirement }, existing ? 200 : 201);
  },
  { requiredRole: "teacher" },
);
