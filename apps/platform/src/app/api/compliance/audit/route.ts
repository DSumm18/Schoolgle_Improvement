import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/audit
 * List audit log entries for an organization (paginated)
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");

  const supabase = createServiceRoleClient();

  const offset = (page - 1) * limit;

  let query = supabase
    .from("compliance_audit_log")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }
  if (action) {
    query = query.eq("action", action);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching audit log:", error);
    return apiError("Failed to fetch audit log", 500);
  }

  return apiSuccess({
    entries: data || [],
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  });
});
