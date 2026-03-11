import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("pack_templates")
    .select("*")
    .order("name");

  if (error) throw error;

  return apiSuccess({ templates: data });
});
