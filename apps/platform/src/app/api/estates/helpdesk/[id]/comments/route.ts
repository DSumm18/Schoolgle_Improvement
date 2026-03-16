/**
 * Helpdesk Ticket Comments API
 *
 * POST /api/estates/helpdesk/[id]/comments - Add a comment to a ticket
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;

  // Extract ticket ID: pathname = /api/estates/helpdesk/{id}/comments
  const segments = request.nextUrl.pathname.split("/");
  const ticketId = segments[segments.length - 2]; // second to last segment

  const supabase = createServiceRoleClient();
  const body = await request.json();

  if (
    !body.comment ||
    typeof body.comment !== "string" ||
    !body.comment.trim()
  ) {
    return apiError("Comment text is required", 400);
  }

  // Verify ticket exists and belongs to this org
  const { data: ticket, error: ticketError } = await supabase
    .from("estates_helpdesk_tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("organization_id", organizationId)
    .single();

  if (ticketError || !ticket) {
    return apiError("Ticket not found", 404);
  }

  // Insert comment
  const { data: comment, error: commentError } = await supabase
    .from("estates_helpdesk_comments")
    .insert({
      ticket_id: ticketId,
      comment: body.comment.trim(),
      is_internal: body.is_internal === true,
      author_id: userId,
      attachment_urls: body.attachment_urls || [],
    })
    .select()
    .single();

  if (commentError) {
    console.error("[Helpdesk Comments] Insert error:", commentError);
    return apiError("Failed to add comment", 500);
  }

  // Log activity
  await supabase.from("estates_helpdesk_activity").insert({
    ticket_id: ticketId,
    activity_type: "comment_added",
    description: body.is_internal ? "Internal note added" : "Comment added",
    actor_id: userId,
  });

  // Update ticket's updated_at timestamp
  await supabase
    .from("estates_helpdesk_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  return apiSuccess({ comment }, 201);
});
