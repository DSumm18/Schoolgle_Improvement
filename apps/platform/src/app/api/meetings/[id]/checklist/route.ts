import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Extract meeting ID from the URL pathname.
 * URL pattern: /api/meetings/[id]/checklist
 */
function getMeetingId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // ["", "api", "meetings", "<id>", "checklist"]
  return segments[3];
}

/**
 * PATCH /api/meetings/[id]/checklist
 * Update checklist items (tick/untick)
 */
export const PATCH = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const body = await request.json();
  const { organizationId, items } = body as {
    organizationId: string;
    items: Array<{
      id: string;
      manually_ticked: boolean;
    }>;
  };

  const resolvedOrgId = organizationId || auth.organizationId;

  if (!resolvedOrgId || !items || !Array.isArray(items)) {
    return apiError(
      "Missing required fields: organizationId, items (array)",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Verify meeting belongs to org
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id")
    .eq("id", id)
    .eq("organization_id", resolvedOrgId)
    .single();

  if (!meeting) {
    return apiError("Meeting not found", 404);
  }

  // Update each item
  const results = await Promise.all(
    items.map(async (item) => {
      const status = item.manually_ticked ? "green" : "red";
      const { error } = await supabase
        .from("meeting_checklist_items")
        .update({
          manually_ticked: item.manually_ticked,
          status,
        })
        .eq("id", item.id)
        .eq("meeting_id", id);

      return { id: item.id, error };
    }),
  );

  const failed = results.filter((r) => r.error);

  return apiSuccess({
    updated: results.length - failed.length,
    failed: failed.length,
  });
});
