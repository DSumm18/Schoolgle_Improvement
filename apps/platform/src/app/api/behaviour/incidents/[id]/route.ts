/**
 * Single Behaviour Incident API
 *
 * GET /api/behaviour/incidents/[id] - Get single incident
 * PUT /api/behaviour/incidents/[id] - Update incident (add consequence, parent notification, notes)
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").pop();

  if (!id) return apiError("Missing incident ID", 400);

  const { data, error } = await supabase
    .from("behaviour_incidents")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return apiError("Incident not found", 404);
  }

  return apiSuccess(data);
});

export const PUT = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;
    const supabase = createServiceRoleClient();
    const id = request.nextUrl.pathname.split("/").pop();

    if (!id) return apiError("Missing incident ID", 400);

    const body = await request.json();

    // pupil_name is NOT allowed — names are NEVER stored in Supabase.
    // Pupil identity is tracked via pupil_hash (pseudonymised).
    const allowedFields = [
      "category",
      "description",
      "location",
      "lesson_period",
      "consequence",
      "parent_notified",
      "notes",
      "year_group",
      "type",
    ];

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from("behaviour_incidents")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("[behaviour/incidents/id] Update error:", error);
      return apiError("Failed to update incident", 500);
    }

    if (!data) {
      return apiError("Incident not found", 404);
    }

    return apiSuccess(data);
  },
  { requiredRole: "teacher" },
);
