/**
 * School Notices API
 *
 * GET  /api/notices - List notices (with filtering)
 * POST /api/notices - Create a new notice
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);

  const type = url.searchParams.get("type");
  const audience = url.searchParams.get("audience");
  const display = url.searchParams.get("display"); // 'true' = only display-ready
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const upcoming = url.searchParams.get("upcoming"); // 'true' = future events only

  let query = supabase
    .from("school_notices")
    .select("*, notice_acknowledgements(count)")
    .eq("organization_id", organizationId)
    .eq("is_published", true)
    .lte("publish_at", new Date().toISOString())
    .order("pin_to_top", { ascending: false })
    .order("priority", { ascending: true }) // urgent first
    .order("publish_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("notice_type", type);
  }

  if (audience) {
    query = query.or(`audience.eq.all,audience.eq.${audience}`);
  }

  if (display === "true") {
    query = query.eq("show_on_display", true);
  }

  if (upcoming === "true") {
    query = query
      .not("event_date", "is", null)
      .gte("event_date", new Date().toISOString().split("T")[0]);
  }

  // Filter out expired notices
  query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  const { data, error } = await query;

  if (error) {
    console.error("[Notices] GET error:", error);
    return apiError("Failed to fetch notices", 500);
  }

  return apiSuccess({ notices: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId, email } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    title,
    body: noticeBody,
    image_url,
    attachment_urls,
    notice_type = "announcement",
    priority = "normal",
    pin_to_top = false,
    show_on_display = true,
    show_on_dashboard = true,
    show_on_parent_app = false,
    audience = "all_staff",
    target_year_groups,
    target_roles,
    target_zone_ids,
    publish_at,
    expires_at,
    event_date,
    event_time,
    event_end_time,
    event_location,
    event_recurring,
    display_duration_seconds = 15,
    display_style = "card",
    acknowledgement_required = false,
  } = body;

  if (!title) {
    return apiError("title is required", 400);
  }

  // Get creator name
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  const { data, error } = await supabase
    .from("school_notices")
    .insert({
      organization_id: organizationId,
      title,
      body: noticeBody,
      image_url,
      attachment_urls: attachment_urls || [],
      notice_type,
      priority,
      pin_to_top,
      show_on_display,
      show_on_dashboard,
      show_on_parent_app,
      audience,
      target_year_groups: target_year_groups || [],
      target_roles: target_roles || [],
      target_zone_ids: target_zone_ids || [],
      publish_at: publish_at || new Date().toISOString(),
      expires_at,
      is_published: true,
      event_date,
      event_time,
      event_end_time,
      event_location,
      event_recurring,
      display_duration_seconds,
      display_style,
      acknowledgement_required,
      created_by: userId,
      created_by_name: userData?.full_name || email,
    })
    .select()
    .single();

  if (error) {
    console.error("[Notices] POST error:", error);
    return apiError("Failed to create notice", 500);
  }

  return apiSuccess(data, 201);
});
