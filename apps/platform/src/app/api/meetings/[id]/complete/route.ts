/* eslint-disable @typescript-eslint/no-explicit-any */
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { fireTrigger, TRIGGER_EVENTS } from "@/lib/document-engine";

/**
 * Extract meeting ID from the URL pathname.
 * URL pattern: /api/meetings/[id]/complete
 */
function getMeetingId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // ["", "api", "meetings", "<id>", "complete"]
  return segments[3];
}

/**
 * POST /api/meetings/[id]/complete
 * Transition meeting to completed, calculate compliance score
 */
export const POST = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  await request.json().catch(() => ({}));
  // orgId MUST come from authenticated session — never from caller
  const resolvedOrgId = auth.organizationId;

  if (!resolvedOrgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Calculate compliance score from checklist items
  const { data: items } = await supabase
    .from("meeting_checklist_items")
    .select("*")
    .eq("meeting_id", id);

  const total = items?.length || 0;
  const covered =
    items?.filter((i: any) => i.status === "green" || i.manually_ticked)
      .length || 0;
  const score = total > 0 ? Math.round((covered / total) * 100) : 0;

  const { data: meeting, error } = await supabase
    .from("meetings")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
      compliance_score: score,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", resolvedOrgId)
    .eq("status", "in_progress")
    .select()
    .single();

  if (error || !meeting) {
    const { data: existingMeeting } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("organization_id", resolvedOrgId)
      .maybeSingle();

    if (existingMeeting?.status === "completed") {
      return apiSuccess({
        meeting: existingMeeting,
        compliance_score: existingMeeting.compliance_score ?? score,
        already_completed: true,
      });
    }

    return apiError(
      "Meeting not found or cannot be completed (must be in_progress)",
      400,
    );
  }

  // Fire meeting.completed trigger for auto-document generation
  fireTrigger(supabase, TRIGGER_EVENTS.MEETING_COMPLETED, resolvedOrgId, {
    meetingId: id,
    staffId: meeting.attendee_name ? undefined : undefined,
    compliance_score: score,
    meeting_type: meeting.template_id,
    contextType: "meeting",
    contextId: id,
  }).catch(() => {}); // Fire-and-forget

  return apiSuccess({ meeting, compliance_score: score });
});
