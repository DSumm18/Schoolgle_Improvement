import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Extract meeting ID from the URL pathname.
 * URL pattern: /api/meetings/[id] or /api/meetings/[id]/...
 */
function getMeetingId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // ["", "api", "meetings", "<id>", ...]
  return segments[3];
}

/**
 * GET /api/meetings/[id]
 * Get a single meeting with template, checklist, and minutes
 */
export const GET = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Fetch meeting
  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !meeting) {
    return apiError("Meeting not found", 404);
  }

  // Fetch template, checklist, minutes, and attendees in parallel
  const [templateRes, checklistRes, minutesRes, attendeesRes] =
    await Promise.all([
      supabase
        .from("meeting_templates")
        .select("*")
        .eq("id", meeting.template_id)
        .single(),
      supabase
        .from("meeting_checklist_items")
        .select("*")
        .eq("meeting_id", id)
        .order("order_index"),
      supabase
        .from("meeting_minutes")
        .select("*")
        .eq("meeting_id", id)
        .maybeSingle(),
      supabase.from("meeting_attendees").select("*").eq("meeting_id", id),
    ]);

  return apiSuccess({
    meeting,
    template: templateRes.data,
    checklist_items: checklistRes.data || [],
    attendees: attendeesRes.data || [],
    minutes: minutesRes.data,
  });
});

/**
 * PATCH /api/meetings/[id]
 * Update meeting details
 */
export const PATCH = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const body = (await request.json()) as Record<string, unknown>;
  const { ...updates } = body;

  // orgId MUST come from authenticated session — never from caller
  const resolvedOrgId = auth.organizationId;

  if (!resolvedOrgId) {
    return apiError("Missing organizationId", 400);
  }

  // Only allow safe fields to be updated
  const allowedFields = [
    "attendee_name",
    "attendee_role",
    "purpose",
    "scheduled_at",
    "location",
    "status",
    "notes",
    "recording_consent",
    "recording_consent_at",
  ];
  const safeUpdates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) safeUpdates[key] = updates[key];
  }
  safeUpdates.updated_at = new Date().toISOString();

  const supabase = createServiceRoleClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .update(safeUpdates)
    .eq("id", id)
    .eq("organization_id", resolvedOrgId)
    .select()
    .single();

  if (error) {
    console.error("Error updating meeting:", error);
    return apiError("Failed to update meeting", 500);
  }

  return apiSuccess({ meeting });
});

/**
 * DELETE /api/meetings/[id]
 * Delete a meeting (only if scheduled or cancelled)
 */
export const DELETE = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Only delete if not completed
  const { data: meeting } = await supabase
    .from("meetings")
    .select("status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!meeting) {
    return apiError("Meeting not found", 404);
  }

  if (meeting.status === "completed") {
    return apiError(
      "Cannot delete a completed meeting. Cancel it instead.",
      400,
    );
  }

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error deleting meeting:", error);
    return apiError("Failed to delete meeting", 500);
  }

  return apiSuccess({ success: true });
});
