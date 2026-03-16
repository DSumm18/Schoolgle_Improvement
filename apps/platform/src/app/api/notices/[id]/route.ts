/**
 * Individual Notice Operations
 *
 * GET    /api/notices/[id] - Get notice details
 * PATCH  /api/notices/[id] - Update notice
 * DELETE /api/notices/[id] - Delete notice
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function extractId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  return segments[segments.length - 1];
}

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = extractId(request);

  const { data, error } = await supabase
    .from("school_notices")
    .select("*, notice_acknowledgements(*)")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) return apiError("Notice not found", 404);

  // Increment view count
  await supabase
    .from("school_notices")
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq("id", id);

  return apiSuccess(data);
});

export const PATCH = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const id = extractId(request);
  const body = await request.json();

  // Handle acknowledgement action
  if (body.action === "acknowledge") {
    const { data: userData } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .single();

    const { data, error } = await supabase
      .from("notice_acknowledgements")
      .upsert({
        notice_id: id,
        user_id: userId,
        user_name: userData?.full_name || auth.email,
      }, { onConflict: "notice_id,user_id" })
      .select()
      .single();

    if (error) return apiError("Failed to acknowledge", 500);
    return apiSuccess(data);
  }

  // Regular update
  const allowedFields = [
    "title", "body", "image_url", "attachment_urls",
    "notice_type", "priority", "pin_to_top",
    "show_on_display", "show_on_dashboard", "show_on_parent_app",
    "audience", "target_year_groups", "target_roles", "target_zone_ids",
    "publish_at", "expires_at", "is_published",
    "event_date", "event_time", "event_end_time", "event_location",
    "display_duration_seconds", "display_style",
  ];

  const updates: Record<string, any> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  const { data, error } = await supabase
    .from("school_notices")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) return apiError("Failed to update notice", 500);
  return apiSuccess(data);
});

export const DELETE = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = extractId(request);

  const { error } = await supabase
    .from("school_notices")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return apiError("Failed to delete notice", 500);
  return apiSuccess({ deleted: true });
});
