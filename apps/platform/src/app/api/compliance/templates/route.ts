import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/templates
 * List compliance templates, optionally filtered by type
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("compliance_templates")
    .select("*")
    .order("name", { ascending: true });

  if (type) {
    query = query.eq("template_type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching templates:", error);
    return apiError("Failed to fetch templates", 500);
  }

  return apiSuccess({ templates: data || [] });
});
