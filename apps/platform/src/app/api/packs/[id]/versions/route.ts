import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("packs") + 1];

  const { data, error } = await supabase
    .from("pack_versions")
    .select("*")
    .eq("pack_id", id)
    .order("version_number", { ascending: false });

  if (error) throw error;

  return apiSuccess({ versions: data });
});
