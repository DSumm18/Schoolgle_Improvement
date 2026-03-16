import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const { data, error } = await supabase
    .from("ls_classes")
    .select("*")
    .eq("organization_id", orgId)
    .order("year_group");

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
