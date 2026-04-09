/**
 * GET /api/morning-brief/latest
 *
 * Returns the most recent morning brief for the authenticated user's organisation.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, _req: NextRequest) => {
  const orgId = auth.organizationId;
  if (!orgId) {
    return apiError("No organization context", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: brief, error } = await supabase
    .from("morning_briefs")
    .select("id, headline, sections, script_text, audio_url, generated_at")
    .eq("organization_id", orgId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !brief) {
    return apiError("No briefing found", 404);
  }

  return apiSuccess(brief);
});
