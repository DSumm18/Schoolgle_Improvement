/**
 * Helpdesk Ticket Detail API
 *
 * GET  /api/estates/helpdesk/[id] - Get ticket with comments and activity
 * PATCH /api/estates/helpdesk/[id] - Update ticket fields
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { handleStatusChangeRisk } from "@/lib/estates-compliance/services/helpdesk-risk-service";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const id = request.nextUrl.pathname.split("/").pop()!;

  const supabase = createServiceRoleClient();

  // Fetch ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("estates_helpdesk_tickets")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (ticketError || !ticket) {
    return apiError("Ticket not found", 404);
  }

  // Fetch comments and activity in parallel
  const [commentsResult, activityResult] = await Promise.all([
    supabase
      .from("estates_helpdesk_comments")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("estates_helpdesk_activity")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return apiSuccess({
    ticket,
    comments: commentsResult.data || [],
    activity: activityResult.data || [],
  });
});

export const PATCH = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const id = request.nextUrl.pathname.split("/").pop()!;

  const supabase = createServiceRoleClient();
  const body = await request.json();

  // Fetch current ticket to track changes
  const { data: current, error: fetchError } = await supabase
    .from("estates_helpdesk_tickets")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !current) {
    return apiError("Ticket not found", 404);
  }

  // Build update payload from allowed fields
  const allowedFields = [
    "status",
    "priority",
    "assigned_to",
    "assigned_contractor_id",
    "resolution",
    "category",
    "attachment_urls",
  ];
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  // Handle resolution
  if (body.status === "resolved" && current.status !== "resolved") {
    updates.resolved_at = new Date().toISOString();
    updates.resolved_by = userId;
    if (body.resolution) {
      updates.resolution = body.resolution;
    }
  }

  // Update ticket
  const { data: updated, error: updateError } = await supabase
    .from("estates_helpdesk_tickets")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (updateError) {
    return apiError("Failed to update ticket", 500);
  }

  // Log status change activity
  if (body.status && body.status !== current.status) {
    await supabase.from("estates_helpdesk_activity").insert({
      ticket_id: id,
      activity_type: "status_changed",
      from_value: current.status,
      to_value: body.status,
      description: `Status changed from ${current.status} to ${body.status}`,
      actor_id: userId,
    });
  }

  // Log priority change activity
  if (body.priority && body.priority !== current.priority) {
    await supabase.from("estates_helpdesk_activity").insert({
      ticket_id: id,
      activity_type: "priority_changed",
      from_value: current.priority,
      to_value: body.priority,
      description: `Priority changed from ${current.priority} to ${body.priority}`,
      actor_id: userId,
    });
  }

  // Log contractor assignment
  if (
    body.assigned_contractor_id &&
    body.assigned_contractor_id !== current.assigned_contractor_id
  ) {
    const { data: contractor } = await supabase
      .from("estates_contractors")
      .select("company_name")
      .eq("id", body.assigned_contractor_id)
      .maybeSingle();

    await supabase.from("estates_helpdesk_activity").insert({
      ticket_id: id,
      activity_type: "contractor_assigned",
      to_value: contractor?.company_name || body.assigned_contractor_id,
      description: `Contractor assigned: ${contractor?.company_name || "Unknown"}`,
      actor_id: userId,
    });
  }

  // Wire status changes to risk mitigations (async, don't block response)
  if (body.status && body.status !== current.status) {
    handleStatusChangeRisk(
      id,
      organizationId,
      current.status,
      body.status,
    ).catch((err) => {
      console.error("[Helpdesk] Risk mitigation update failed:", err);
    });
  }

  return apiSuccess({ ticket: updated });
});
