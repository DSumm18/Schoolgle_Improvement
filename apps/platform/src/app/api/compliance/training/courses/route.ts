import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/training/courses
 * List training courses (global + org-specific)
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("compliance_training_courses")
    .select("*")
    .or(`is_global.eq.true,organization_id.eq.${organizationId}`)
    .order("title", { ascending: true });

  if (error) {
    console.error("Error fetching courses:", error);
    return apiError("Failed to fetch courses", 500);
  }

  return apiSuccess({ courses: data || [] });
});

/**
 * POST /api/compliance/training/courses
 * Create an org-specific training course
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      title,
      description,
      provider_name,
      course_code,
      accreditation,
      validity_days,
      category,
    } = body;

    if (!title) {
      return apiError("Missing required field: title", 400);
    }

    const supabase = createServiceRoleClient();

    const { data: course, error } = await supabase
      .from("compliance_training_courses")
      .insert({
        organization_id: organizationId,
        title,
        description,
        provider_name,
        course_code,
        accreditation,
        validity_days,
        category: category || "general",
        is_global: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating course:", error);
      return apiError("Failed to create course", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "training_course",
      entity_id: course.id,
      action: "created",
      actor_user_id: userId,
      metadata: { title },
    });

    return apiSuccess({ course }, 201);
  },
  { requiredRole: "teacher" },
);
