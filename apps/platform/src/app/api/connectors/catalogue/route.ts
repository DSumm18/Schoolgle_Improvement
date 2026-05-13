import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  let query = supabase
    .from("connector_types")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${auth.organizationId}`)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching connector catalogue:", error);
    return apiError("Failed to fetch connector catalogue", 500);
  }

  return apiSuccess({ connector_types: data || [] });
});
