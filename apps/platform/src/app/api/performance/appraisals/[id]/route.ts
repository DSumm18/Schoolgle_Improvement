import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

/**
 * GET /api/performance/appraisals/[id]
 * Return a single appraisal by ID
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const id = request.nextUrl.pathname.split("/").pop();

  if (!id) {
    return apiError("Appraisal ID is required", 400);
  }

  // Demo data check
  if (id.startsWith("demo-")) {
    return apiError(
      "Demo appraisals are read-only. Create real data to use this endpoint.",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("staff_appraisals")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return apiError("Appraisal not found", 404);
  }

  return apiSuccess(data);
});

/**
 * PUT /api/performance/appraisals/[id]
 * Update an appraisal — objectives, mid-year, end-year, pay recommendation, etc.
 */
export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const id = request.nextUrl.pathname.split("/").pop();
  const body = await request.json();

  if (!id) {
    return apiError("Appraisal ID is required", 400);
  }

  if (id.startsWith("demo-")) {
    return apiError("Demo appraisals cannot be updated", 400);
  }

  const supabase = createServiceRoleClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("staff_appraisals")
    .select("id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!existing) {
    return apiError("Appraisal not found", 404);
  }

  // Build update payload — only include fields that are present in the body
  const allowedFields = [
    "staff_name",
    "staff_email",
    "role",
    "role_type",
    "pay_scale",
    "appraiser_name",
    "status",
    "objectives",
    "mid_year_review",
    "end_year_review",
    "cpd_completed",
    "cpd_planned",
    "observations",
    "pay_recommendation",
    "is_ect",
    "ect_term",
    "ect_mentor",
    "ect_assessments",
    "ect_teachers_standards",
  ];

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  for (const field of allowedFields) {
    if (field in body) {
      updatePayload[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("staff_appraisals")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Performance Appraisal] Update error:", error);
    return apiError("Failed to update appraisal", 500);
  }

  return apiSuccess(data);
});
