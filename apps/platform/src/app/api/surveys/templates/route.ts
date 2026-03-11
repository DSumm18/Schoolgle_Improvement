import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("survey_templates")
    .select("*")
    .eq("is_system", true)
    .order("usage_count", { ascending: false });

  if (error) throw error;

  return apiSuccess(data ?? []);
});
