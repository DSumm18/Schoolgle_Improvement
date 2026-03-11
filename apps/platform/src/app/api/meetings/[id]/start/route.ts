import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Extract meeting ID from the URL pathname.
 * URL pattern: /api/meetings/[id]/start
 */
function getMeetingId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // ["", "api", "meetings", "<id>", "start"]
  return segments[3];
}

/**
 * POST /api/meetings/[id]/start
 * Transition meeting to in_progress
 */
export const POST = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const body = await request.json();
  const { organizationId } = body;

  const resolvedOrgId = organizationId || auth.organizationId;

  if (!resolvedOrgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", resolvedOrgId)
    .eq("status", "scheduled")
    .select()
    .single();

  if (error || !meeting) {
    return apiError(
      "Meeting not found or cannot be started (must be in scheduled status)",
      400,
    );
  }

  return apiSuccess({ meeting });
});
