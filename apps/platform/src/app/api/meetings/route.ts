import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/meetings
 * List meetings for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const status = searchParams.get("status");
  const templateId = searchParams.get("templateId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!organizationId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("meetings")
    .select("*, meeting_templates(id, name, category)")
    .eq("organization_id", organizationId)
    .order("scheduled_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (templateId) query = query.eq("template_id", templateId);

  const { data: meetings, error } = await query;

  if (error) {
    console.error("Error fetching meetings:", error);
    return apiError("Failed to fetch meetings", 500);
  }

  // Summary counts
  const all = meetings || [];
  const scheduled = all.filter((m) => m.status === "scheduled").length;
  const in_progress = all.filter((m) => m.status === "in_progress").length;
  const completed = all.filter((m) => m.status === "completed").length;

  return apiSuccess({
    meetings: all,
    counts: { total: all.length, scheduled, in_progress, completed },
    limit,
    offset,
  });
});

/**
 * POST /api/meetings
 * Create a new meeting from a template
 *
 * Accepts either:
 *   - `attendee_name` + `attendee_role` (legacy single-attendee format)
 *   - `attendees` array of { staff_id?, user_id?, attendee_name, attendee_role?, attendee_email?, is_primary? }
 *
 * `leader_id` is optional — falls back to the authenticated user's ID from the
 * `x-user-id` header when not provided in the body.
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    organizationId,
    leaderId,
    template_id,
    attendee_name,
    attendee_role,
    attendees,
    purpose,
    scheduled_at,
    location,
  } = body;

  const resolvedOrgId = organizationId || auth.organizationId;

  // Auto-set leader_id from authenticated user header if not provided
  const resolvedLeaderId = leaderId || auth.userId || null;

  // Determine the primary attendee name for backwards-compat on the meetings row
  const hasAttendeesArray = Array.isArray(attendees) && attendees.length > 0;
  const primaryAttendee = hasAttendeesArray
    ? attendees.find((a: any) => a.is_primary) || attendees[0]
    : null;
  const resolvedAttendeeName =
    attendee_name || (primaryAttendee ? primaryAttendee.attendee_name : null);
  const resolvedAttendeeRole =
    attendee_role || (primaryAttendee ? primaryAttendee.attendee_role : null);

  if (
    !resolvedOrgId ||
    !resolvedLeaderId ||
    !template_id ||
    !resolvedAttendeeName ||
    !scheduled_at
  ) {
    return apiError(
      "Missing required fields: organizationId, leaderId (or x-user-id header), template_id, attendee_name (or attendees array), scheduled_at",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Fetch template to copy compliance items
  const { data: template, error: templateError } = await supabase
    .from("meeting_templates")
    .select("*")
    .eq("id", template_id)
    .single();

  if (templateError || !template) {
    return apiError("Template not found", 404);
  }

  const meetingId = uuidv4();

  // Create meeting
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .insert({
      id: meetingId,
      template_id,
      organization_id: resolvedOrgId,
      leader_id: resolvedLeaderId,
      attendee_name: resolvedAttendeeName,
      attendee_role: resolvedAttendeeRole || null,
      purpose: purpose || null,
      scheduled_at,
      location: location || null,
      status: "scheduled",
      notes: [],
    })
    .select()
    .single();

  if (meetingError) {
    console.error("Error creating meeting:", meetingError);
    return apiError("Failed to create meeting", 500);
  }

  // Insert attendees into meeting_attendees table
  let insertedAttendees: any[] = [];

  if (hasAttendeesArray) {
    // New format: batch insert from attendees array
    const attendeeRows = attendees.map((a: any) => ({
      id: uuidv4(),
      meeting_id: meetingId,
      staff_id: a.staff_id || null,
      user_id: a.user_id || null,
      attendee_name: a.attendee_name,
      attendee_role: a.attendee_role || null,
      attendee_email: a.attendee_email || null,
      is_primary: a.is_primary ?? false,
    }));

    const { data: attendeesData, error: attendeesError } = await supabase
      .from("meeting_attendees")
      .insert(attendeeRows)
      .select();

    if (attendeesError) {
      console.error("Error creating meeting attendees:", attendeesError);
    } else {
      insertedAttendees = attendeesData || [];
    }
  } else if (resolvedAttendeeName) {
    // Legacy format: create a single primary attendee entry
    const { data: attendeeData, error: attendeeError } = await supabase
      .from("meeting_attendees")
      .insert({
        id: uuidv4(),
        meeting_id: meetingId,
        attendee_name: resolvedAttendeeName,
        attendee_role: resolvedAttendeeRole || null,
        is_primary: true,
      })
      .select()
      .single();

    if (attendeeError) {
      console.error("Error creating meeting attendee:", attendeeError);
    } else {
      insertedAttendees = attendeeData ? [attendeeData] : [];
    }
  }

  // Copy compliance items from template to checklist
  const complianceItems = (template.compliance_items || []) as Array<{
    phrase: string;
    category: string;
    is_critical: boolean;
    order_index: number;
  }>;

  if (complianceItems.length > 0) {
    const checklistRows = complianceItems.map((item) => ({
      id: uuidv4(),
      meeting_id: meetingId,
      phrase: item.phrase,
      category: item.category || null,
      is_critical: item.is_critical || false,
      status: "red",
      manually_ticked: false,
      order_index: item.order_index,
    }));

    const { error: checklistError } = await supabase
      .from("meeting_checklist_items")
      .insert(checklistRows);

    if (checklistError) {
      console.error("Error creating checklist items:", checklistError);
    }
  }

  return apiSuccess(
    { meeting, attendees: insertedAttendees, template_name: template.name },
    201,
  );
});
