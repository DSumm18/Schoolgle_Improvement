/**
 * Emergency Plan Detail API
 *
 * GET /api/emergency/plans/[id] - Get single plan
 * PUT /api/emergency/plans/[id] - Update a plan
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").pop();

  if (!id) {
    return apiError("Plan ID is required", 400);
  }

  const { data, error } = await supabase
    .from("emergency_plans")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error) {
    console.error("[Emergency Plans] GET by ID error:", error);
    return apiError("Plan not found", 404);
  }

  return apiSuccess(data);
});

export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").pop();
  const body = await request.json();

  if (!id) {
    return apiError("Plan ID is required", 400);
  }

  // Verify plan belongs to org
  const { data: existing, error: fetchError } = await supabase
    .from("emergency_plans")
    .select("id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !existing) {
    return apiError("Plan not found", 404);
  }

  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  const allowedFields = [
    "title",
    "status",
    "description",
    "procedures",
    "assembly_points",
    "communication_tree",
    "post_incident_checklist",
    "key_contacts",
    "review_frequency_months",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  // If status changed to "active", update review dates
  if (body.status === "active" && body.mark_reviewed) {
    updateFields.last_reviewed_at = new Date().toISOString();
    const nextReview = new Date();
    nextReview.setMonth(
      nextReview.getMonth() + (body.review_frequency_months || 12),
    );
    updateFields.next_review_due = nextReview.toISOString();
  }

  const { data, error } = await supabase
    .from("emergency_plans")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Emergency Plans] PUT error:", error);
    return apiError("Failed to update plan", 500);
  }

  return apiSuccess(data);
});
