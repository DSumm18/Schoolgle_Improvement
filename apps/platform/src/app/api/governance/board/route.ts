import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  GovernanceBoard,
  GovernanceStatistics,
  GetBoardRequest,
  GetBoardResponse,
} from "@/lib/governance";

/**
 * GET /api/governance/board
 * Get governance board details and statistics for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  // Get or create board
  let { data: board, error: boardError } = await supabase
    .from("governance_boards")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (boardError) {
    console.error("Error fetching board:", boardError);
    return apiError("Failed to fetch board details", 500);
  }

  // Create board if it doesn't exist
  if (!board) {
    const { data: newBoard, error: createError } = await supabase
      .from("governance_boards")
      .insert({
        organization_id: organizationId,
        name: "Governing Body",
        type: "maintained",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating board:", createError);
      return apiError("Failed to create board", 500);
    }
    board = newBoard;
  }

  // Get governors count by status
  const { data: governorsData } = await supabase
    .from("governors")
    .select("status, governor_type")
    .eq("organization_id", organizationId);

  const totalGovernors = governorsData?.length || 0;
  const activeGovernors =
    governorsData?.filter((g: any) => g.status === "active").length || 0;
  const governorTypes =
    governorsData?.reduce((acc: any, g: any) => {
      acc[g.governor_type] = (acc[g.governor_type] || 0) + 1;
      return acc;
    }, {}) || {};

  // Get upcoming meetings
  const today = new Date().toISOString().split("T")[0];
  const { data: upcomingMeetings } = await supabase
    .from("governor_meetings")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .limit(3);

  // Get recent meetings
  const { data: recentMeetings } = await supabase
    .from("governor_meetings")
    .select("*")
    .eq("organization_id", organizationId)
    .lt("scheduled_date", today)
    .order("scheduled_date", { ascending: false })
    .limit(5);

  // Calculate statistics
  const statistics: GovernanceStatistics = {
    total_governors: totalGovernors,
    active_governors: activeGovernors,
    vacant_positions: 0, // Will be calculated based on target positions
    governor_types: governorTypes,
    upcoming_meetings: upcomingMeetings?.length || 0,
    past_meetings_this_year: recentMeetings?.length || 0,
    average_attendance_rate: 0, // Will be calculated from governor attendance
    training_completion_rate: 0,
    expired_training_count: 0,
    statutory_policies: 0,
    policies_current: 0,
    policies_need_review: 0,
    policies_overdue: 0,
    visits_this_term: 0,
    visits_completed: 0,
    visits_scheduled: 0,
  };

  const response: GetBoardResponse = {
    board,
    statistics,
    recent_meetings: recentMeetings || [],
    upcoming_meetings: upcomingMeetings || [],
  };

  return apiSuccess(response);
});

/**
 * POST /api/governance/board
 * Update board details
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { organizationId, name, type } = body as {
    organizationId: string;
    name?: string;
    type?: "maintained" | "academy" | "church";
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;

  const { data, error } = await supabase
    .from("governance_boards")
    .update(updateData)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) {
    console.error("Error updating board:", error);
    return apiError("Failed to update board", 500);
  }

  return apiSuccess({ board: data });
});
