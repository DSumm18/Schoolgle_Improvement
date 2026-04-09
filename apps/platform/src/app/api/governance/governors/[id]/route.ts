import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { Governor, GovernorForm } from "@/lib/governance";

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/governance/governors/[id]
 * Get a specific governor by ID
 */
export const GET = protectedRoute(async (auth, req) => {
  const id = req.nextUrl.pathname.split("/").pop()!;
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: governor, error } = await supabase
    .from("governors")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !governor) {
    return apiError("Governor not found", 404);
  }

  // Get governor's training records
  const { data: training } = await supabase
    .from("governor_training")
    .select("*")
    .eq("governor_id", id)
    .order("completed_date", { ascending: false });

  // Get governor's attendance at meetings
  const today = new Date();
  const pastYear = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate(),
  );

  const { data: meetings } = await supabase
    .from("governor_meetings")
    .select("id, title, scheduled_date, status, attended_governors")
    .eq("organization_id", organizationId)
    .gte("scheduled_date", pastYear.toISOString())
    .contains("attended_governors", [id])
    .order("scheduled_date", { ascending: false });

  const attendedMeetings =
    meetings?.filter((m) => m.attended_governors?.includes(id)).length || 0;

  return apiSuccess({
    governor: {
      ...governor,
      training_records: training || [],
      meetings_attended_this_year: attendedMeetings,
    },
  });
});

/**
 * PATCH /api/governance/governors/[id]
 * Update a specific governor
 */
export const PATCH = protectedRoute(async (auth, req) => {
  const id = req.nextUrl.pathname.split("/").pop()!;
  const body = await req.json();
  const { organizationId: _orgIdFromBody, ...changes } = body as {
    organizationId: string;
  } & Partial<Governor>;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: governor, error } = await supabase
    .from("governors")
    .update({
      ...changes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error || !governor) {
    return apiError("Governor not found or update failed", 404);
  }

  return apiSuccess({ governor });
});

/**
 * DELETE /api/governance/governors/[id]
 * Delete a governor (soft delete by setting status to inactive)
 */
export const DELETE = protectedRoute(async (auth, req) => {
  const id = req.nextUrl.pathname.split("/").pop()!;
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const hard = searchParams.get("hard") === "true";

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  if (hard) {
    // Permanent delete
    const { error } = await supabase
      .from("governors")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deleting governor:", error);
      return apiError("Failed to delete governor", 500);
    }
  } else {
    // Soft delete - set to inactive
    const { error } = await supabase
      .from("governors")
      .update({
        status: "inactive",
        end_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deactivating governor:", error);
      return apiError("Failed to deactivate governor", 500);
    }
  }

  return apiSuccess({ success: true });
});
