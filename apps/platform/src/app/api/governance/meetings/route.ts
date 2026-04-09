import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  GovernorMeeting,
  GovernorMeetingForm,
  MeetingStatus,
  CommitteeType,
} from "@/lib/governance";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/governance/meetings
 * Get list of governor meetings for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const status = searchParams.get("status") as MeetingStatus | null;
  const meetingType = searchParams.get("meetingType") as CommitteeType | null;
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("governor_meetings")
    .select("*")
    .eq("organization_id", organizationId)
    .order("scheduled_date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (meetingType) {
    query = query.eq("meeting_type", meetingType);
  }
  if (fromDate) {
    query = query.gte("scheduled_date", fromDate);
  }
  if (toDate) {
    query = query.lte("scheduled_date", toDate);
  }

  // Get total count before pagination
  // Create a separate query for count since we'll apply pagination after
  const { count, error: countError } = await supabase
    .from("governance_meetings")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("scheduled_date", fromDate)
    .lte("scheduled_date", toDate);

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: meetings, error } = await query;

  if (error) {
    console.error("Error fetching meetings:", error);
    return apiError("Failed to fetch meetings", 500);
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming =
    meetings?.filter((m: GovernorMeeting) => m.scheduled_date >= today)
      .length || 0;
  const past = (meetings?.length || 0) - upcoming;

  // Get board info for governor names
  const governorIds =
    meetings?.flatMap((m: GovernorMeeting) => [
      ...m.invited_governors,
      ...m.attended_governors,
    ]) || [];

  let governorsMap: Record<string, { name: string; email: string | null }> = {};
  if (governorIds.length > 0) {
    const { data: governors } = await supabase
      .from("governors")
      .select("id, full_name, email")
      .eq("organization_id", organizationId)
      .in("id", governorIds.slice(0, 100)); // Limit to 100

    governorsMap = (governors || []).reduce((acc: any, g: any) => {
      acc[g.id] = { name: g.full_name, email: g.email };
      return acc;
    }, {});
  }

  // Enrich meetings with governor names
  const enrichedMeetings =
    meetings?.map((m: any) => ({
      ...m,
      invited_governors_details:
        m.invited_governors?.map((id: string) => governorsMap[id]) || [],
      attended_governors_details:
        m.attended_governors?.map((id: string) => governorsMap[id]) || [],
    })) || [];

  return apiSuccess({
    meetings: enrichedMeetings,
    total: count || 0,
    upcoming,
    past,
    limit,
    offset,
  });
});

/**
 * POST /api/governance/meetings
 * Create a new governor meeting
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const {
    organizationId,
    boardId,
    title,
    meeting_type,
    committee,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    location,
    meeting_link,
    invited_governors,
    agenda_items,
  } = body as {
    organizationId: string;
    boardId?: string;
    title: string;
    meeting_type: CommitteeType;
    committee?: string;
    scheduled_date: string;
    scheduled_time?: string;
    duration_minutes?: number;
    location?: string;
    meeting_link?: string;
    invited_governors?: string[];
    agenda_items?: Array<{
      title: string;
      description?: string;
      owner?: string;
      duration?: number;
      attachments?: string[];
    }>;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !title || !meeting_type || !scheduled_date) {
    return apiError(
      "Missing required fields: organizationId, title, meeting_type, scheduled_date",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Get board if not provided
  let finalBoardId = boardId;
  if (!finalBoardId) {
    const { data: board } = await supabase
      .from("governance_boards")
      .select("id")
      .eq("organization_id", orgId)
      .single();
    finalBoardId = board?.id;
  }

  // Prepare agenda items
  const preparedAgendaItems = (agenda_items || []).map((item, index) => ({
    id: uuidv4(),
    title: item.title,
    description: item.description || "",
    owner: item.owner || "",
    duration: item.duration || 0,
    attachments: item.attachments || [],
  }));

  // Create meeting
  const { data: meeting, error } = await supabase
    .from("governor_meetings")
    .insert({
      id: uuidv4(),
      organization_id: orgId,
      board_id: finalBoardId || null,
      title,
      meeting_type,
      committee: committee || null,
      scheduled_date,
      scheduled_time: scheduled_time || null,
      duration_minutes: duration_minutes || 60,
      location: location || null,
      meeting_link: meeting_link || null,
      invited_governors: invited_governors || [],
      attended_governors: [],
      apologies_governors: [],
      agenda_items: preparedAgendaItems,
      status: "scheduled",
      decisions_made: [],
      action_items: [],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating meeting:", error);
    return apiError("Failed to create meeting", 500);
  }

  return apiSuccess({ meeting }, 201);
});

/**
 * PATCH /api/governance/meetings
 * Bulk update meetings
 */
export const PATCH = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { organizationId, updates } = body as {
    organizationId: string;
    updates: Array<{
      id: string;
      changes: Partial<GovernorMeetingForm> & { status?: MeetingStatus };
    }>;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !updates || !Array.isArray(updates)) {
    return apiError(
      "Missing required fields: organizationId, updates (array)",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const results = await Promise.all(
    updates.map(async ({ id, changes }) => {
      // Prepare agenda items if provided
      let updateData: any = { ...changes };
      if (changes.agenda_items) {
        updateData.agenda_items = changes.agenda_items.map(
          (item: any, index: number) => ({
            id: item.id || uuidv4(),
            title: item.title,
            description: item.description || "",
            owner: item.owner || "",
            duration: item.duration || 0,
            attachments: item.attachments || [],
          }),
        );
      }

      const { data, error } = await supabase
        .from("governor_meetings")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", orgId)
        .select()
        .single();

      return { meeting: data, error };
    }),
  );

  const successCount = results.filter((r) => !r.error).length;
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return apiSuccess({
    updated: successCount,
    failed: results.length - successCount,
    errors: errors.length > 0 ? errors : undefined,
  });
});
