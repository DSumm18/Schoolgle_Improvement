/**
 * Quick Messages API
 *
 * GET  /api/notices/quick - List quick message templates
 * POST /api/notices/quick - Send a quick message (creates a notice)
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("quick_messages")
    .select("*")
    .eq("organization_id", organizationId)
    .order("sort_order");

  if (error) return apiError("Failed to fetch quick messages", 500);

  return apiSuccess({ messages: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId, email } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const { quick_message_id, custom_message, target_zones } = body;

  if (!quick_message_id && !custom_message) {
    return apiError("quick_message_id or custom_message required", 400);
  }

  let title = "Quick Message";
  let message = custom_message || "";
  let displayStyle = "banner";
  let durationMinutes = 30;
  let playChime = false;

  // If using a template, load it
  if (quick_message_id) {
    const { data: qm } = await supabase
      .from("quick_messages")
      .select("*")
      .eq("id", quick_message_id)
      .single();

    if (qm) {
      title = qm.label;
      message = custom_message || qm.message;
      displayStyle = qm.display_style || "banner";
      durationMinutes = qm.display_duration_minutes || 30;
      playChime = qm.play_chime || false;

      // Update usage tracking
      await supabase
        .from("quick_messages")
        .update({
          use_count: (qm.use_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", quick_message_id);
    }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

  // Create as a notice
  const { data: notice, error } = await supabase
    .from("school_notices")
    .insert({
      organization_id: organizationId,
      title,
      body: message,
      notice_type: "announcement",
      priority: "high",
      show_on_display: true,
      show_on_dashboard: true,
      audience: "all",
      target_zone_ids: target_zones || [],
      publish_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      display_style: displayStyle,
      display_duration_seconds: 10,
      created_by: userId,
      created_by_name: userData?.full_name || email,
    })
    .select()
    .single();

  if (error) {
    console.error("[Quick Message] POST error:", error);
    return apiError("Failed to send quick message", 500);
  }

  return apiSuccess({ notice, playChime });
});
