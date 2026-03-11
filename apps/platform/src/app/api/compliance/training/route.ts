import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/training
 * List courses, requirements, and completions for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  // Courses (global + org-specific)
  const { data: courses } = await supabase
    .from("compliance_training_courses")
    .select("*")
    .or(`is_global.eq.true,organization_id.eq.${organizationId}`)
    .order("title", { ascending: true });

  // Requirements for this org
  const { data: requirements } = await supabase
    .from("compliance_training_requirements")
    .select("*, course:compliance_training_courses(*)")
    .eq("organization_id", organizationId);

  // Completions for this org
  const { data: completions } = await supabase
    .from("compliance_training_completions")
    .select("*, course:compliance_training_courses(*)")
    .eq("organization_id", organizationId)
    .order("completed_at", { ascending: false });

  return apiSuccess({
    courses: courses || [],
    requirements: requirements || [],
    completions: completions || [],
  });
});

/**
 * POST /api/compliance/training
 * Record a training completion
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      user_id,
      course_id,
      completed_at,
      expires_at,
      evidence_file_id,
      source,
      notes,
    } = body;

    if (!course_id) {
      return apiError("Missing required field: course_id", 400);
    }

    const supabase = createServiceRoleClient();

    const { data: completion, error } = await supabase
      .from("compliance_training_completions")
      .insert({
        organization_id: organizationId,
        user_id: user_id || userId,
        course_id,
        completed_at: completed_at || new Date().toISOString(),
        expires_at,
        evidence_file_id,
        source: source || "manual",
        notes,
      })
      .select("*, course:compliance_training_courses(*)")
      .single();

    if (error) {
      console.error("Error recording training completion:", error);
      return apiError("Failed to record training completion", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "training_completion",
      entity_id: completion.id,
      action: "completed",
      actor_user_id: userId,
      metadata: { course_id, completed_at: completion.completed_at },
    });

    return apiSuccess({ completion }, 201);
  },
  { requiredRole: "teacher" },
);
