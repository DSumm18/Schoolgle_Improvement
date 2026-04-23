/**
 * Get all pupils for an organization (not filtered by class)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const { organizationId } = auth;

  // Simple query without join first
  const { data, error } = await supabase
    .from("ls_pupils")
    .select("*")
    .eq("organization_id", organizationId)
    .order("year_group")
    .order("display_name_encrypted");

  if (error) {
    console.error("[all-pupils API] Error:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data || []);
});
