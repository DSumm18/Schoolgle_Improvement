import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/low-level-concerns
 * List low-level concerns for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("compliance_low_level_concerns")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching low-level concerns:", error);
    return apiError("Failed to fetch low-level concerns", 500);
  }

  return apiSuccess({ concerns: data || [] });
});

/**
 * POST /api/compliance/low-level-concerns
 * Create a new low-level concern
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      subject_name,
      subject_role,
      reported_by,
      date_of_concern,
      date_reported,
      description,
      context,
      category,
      children_involved,
      witnesses,
      immediate_action_taken,
      dsl_name,
      dsl_review_date,
      dsl_review_notes,
      risk_level,
      pattern_identified,
      escalated_to_lado,
      escalated_date,
      outcome,
      status,
      notes,
    } = body;

    if (!subject_name || !description) {
      return apiError(
        "Missing required fields: subject_name, description",
        400,
      );
    }

    const supabase = createServiceRoleClient();

    const { data: concern, error } = await supabase
      .from("compliance_low_level_concerns")
      .insert({
        organization_id: organizationId,
        subject_name,
        subject_role,
        reported_by,
        date_of_concern:
          date_of_concern || new Date().toISOString().split("T")[0],
        date_reported: date_reported || new Date().toISOString().split("T")[0],
        description,
        context,
        category,
        children_involved: children_involved || [],
        witnesses: witnesses || [],
        immediate_action_taken,
        dsl_name,
        dsl_review_date,
        dsl_review_notes,
        risk_level: risk_level || "low",
        pattern_identified: pattern_identified || false,
        escalated_to_lado: escalated_to_lado || false,
        escalated_date,
        outcome,
        status: status || "open",
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating low-level concern:", error);
      return apiError("Failed to create low-level concern", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "low_level_concern",
      entity_id: concern.id,
      action: "created",
      actor_user_id: userId,
      metadata: { subject_name, category, risk_level: risk_level || "low" },
    });

    return apiSuccess({ concern }, 201);
  },
  { requiredRole: "slt" },
);
