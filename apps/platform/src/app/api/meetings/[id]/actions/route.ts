import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/meetings/[id]/actions
 * List actions linked to this meeting via meeting_actions junction table.
 * Returns the full action data by joining through to the actions table.
 */
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  // Extract meeting ID from URL: /api/meetings/[id]/actions
  const segments = request.nextUrl.pathname.split("/");
  const actionsIdx = segments.lastIndexOf("actions");
  const meetingId = actionsIdx > 0 ? segments[actionsIdx - 1] : null;

  if (!meetingId) {
    return apiError("Missing meeting ID", 400);
  }

  const supabase = createServiceRoleClient();

  // Verify meeting belongs to this organization
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("id")
    .eq("id", meetingId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (meetingError || !meeting) {
    return apiError("Meeting not found", 404);
  }

  // Fetch actions linked to this meeting via junction table
  // Join meeting_actions -> actions to get the full action data
  const { data: links, error } = await supabase
    .from("meeting_actions")
    .select("meeting_id, action_id, created_at, actions(*)")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching meeting actions:", error);
    return apiError("Failed to fetch actions", 500);
  }

  // Flatten: extract the action data from the join
  const actions = (links || []).map((link: any) => ({
    ...link.actions,
    linked_at: link.created_at,
  }));

  return apiSuccess({ actions });
});

/**
 * POST /api/meetings/[id]/actions
 * Create a new action and link it to this meeting.
 *
 * Body: { title, description?, assigneeId?, dueDate?, priority?, status? }
 *
 * This creates a row in the `actions` table first, then links it
 * to the meeting via the `meeting_actions` junction table.
 */
export const POST = protectedRoute(async (auth, request: NextRequest) => {
  // Extract meeting ID from URL: /api/meetings/[id]/actions
  const segments = request.nextUrl.pathname.split("/");
  const actionsIdx = segments.lastIndexOf("actions");
  const meetingId = actionsIdx > 0 ? segments[actionsIdx - 1] : null;

  if (!meetingId) {
    return apiError("Missing meeting ID", 400);
  }

  const body = await request.json();
  const { title, description, assigneeId, dueDate, priority, status } = body;

  if (!title) {
    return apiError("Missing required field: title", 400);
  }

  const supabase = createServiceRoleClient();

  // Verify meeting belongs to this organization
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("id")
    .eq("id", meetingId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (meetingError || !meeting) {
    return apiError("Meeting not found", 404);
  }

  // 1. Create the action in the actions table
  const { data: action, error: actionError } = await supabase
    .from("actions")
    .insert({
      organization_id: auth.organizationId,
      title,
      description: description || null,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      priority: priority || "medium",
      status: status || "not_started",
      created_by: auth.userId,
    })
    .select()
    .single();

  if (actionError || !action) {
    console.error("Error creating action:", actionError);
    return apiError("Failed to create action", 500);
  }

  // 2. Link the action to the meeting via the junction table
  const { error: linkError } = await supabase.from("meeting_actions").insert({
    meeting_id: meetingId,
    action_id: action.id,
  });

  if (linkError) {
    console.error("Error linking action to meeting:", linkError);
    // Clean up the orphaned action
    await supabase.from("actions").delete().eq("id", action.id);
    return apiError("Failed to link action to meeting", 500);
  }

  return apiSuccess({ action }, 201);
});
