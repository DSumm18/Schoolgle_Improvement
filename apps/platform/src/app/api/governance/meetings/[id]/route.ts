import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { GovernorMeeting } from "@/lib/governance";

/**
 * GET /api/governance/meetings/[id]
 * Get a specific meeting by ID
 */
export const GET = protectedRoute(async (auth, req) => {
  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: meeting, error } = await supabase
    .from("governor_meetings")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !meeting) {
    return apiError("Meeting not found", 404);
  }

  // Get governor details
  const governorIds = [
    ...meeting.invited_governors,
    ...meeting.attended_governors,
    ...meeting.apologies_governors,
  ];

  let governorsMap: Record<
    string,
    { name: string; email: string | null; photo: string | null }
  > = {};
  if (governorIds.length > 0) {
    const { data: governors } = await supabase
      .from("governors")
      .select("id, full_name, email, photo_url")
      .in("id", governorIds.slice(0, 100));

    governorsMap = (governors || []).reduce((acc: any, g: any) => {
      acc[g.id] = { name: g.full_name, email: g.email, photo: g.photo_url };
      return acc;
    }, {});
  }

  // Enrich with governor details
  const enrichedMeeting = {
    ...meeting,
    invited_governors_details:
      meeting.invited_governors?.map((id: string) => governorsMap[id]) || [],
    attended_governors_details:
      meeting.attended_governors?.map((id: string) => governorsMap[id]) || [],
    apologies_governors_details:
      meeting.apologies_governors?.map((id: string) => governorsMap[id]) || [],
  };

  return apiSuccess({ meeting: enrichedMeeting });
});

/**
 * PATCH /api/governance/meetings/[id]
 * Update a specific meeting
 */
export const PATCH = protectedRoute(async (auth, req) => {
  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];
  const body = await req.json();
  const { organizationId, ...changes } = body as {
    organizationId: string;
  } & Partial<GovernorMeeting>;

  const orgId = organizationId || auth.organizationId;

  if (!orgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Prepare agenda items if provided
  let updateData: any = { ...changes };
  if (changes.agenda_items) {
    updateData.agenda_items = changes.agenda_items;
  }

  const { data: meeting, error } = await supabase
    .from("governor_meetings")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error || !meeting) {
    return apiError("Meeting not found or update failed", 404);
  }

  return apiSuccess({ meeting });
});

/**
 * DELETE /api/governance/meetings/[id]
 * Delete a meeting
 */
export const DELETE = protectedRoute(async (auth, req) => {
  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("governor_meetings")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error deleting meeting:", error);
    return apiError("Failed to delete meeting", 500);
  }

  return apiSuccess({ success: true });
});

/**
 * POST /api/governance/meetings/[id]/attendance
 * Update meeting attendance
 */
export const POST = protectedRoute(async (auth, req) => {
  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];
  const body = await req.json();
  const { organizationId, attended_governors, apologies_governors } = body as {
    organizationId: string;
    attended_governors: string[];
    apologies_governors: string[];
  };

  const orgId = organizationId || auth.organizationId;

  if (!orgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Update attendance
  const { data: meeting, error } = await supabase
    .from("governor_meetings")
    .update({
      attended_governors,
      apologies_governors,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error || !meeting) {
    return apiError("Meeting not found or update failed", 404);
  }

  // Update individual governor attendance counts
  if (attended_governors.length > 0) {
    // Increment attended count for all attending governors
    await supabase.rpc("calculate_governor_attendance", {
      governor_id: attended_governors[0], // Function will calculate for all
    });
  }

  return apiSuccess({ meeting });
});
