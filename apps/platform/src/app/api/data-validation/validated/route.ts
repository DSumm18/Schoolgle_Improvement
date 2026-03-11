/**
 * Validated Data API
 *
 * GET /api/data-validation/validated - List validated_data for org
 * Returns the confirmed data that other modules consume.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/data-validation/validated
 * List validated (human-confirmed) data for the organization.
 * Query params: data_type, is_current, limit
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { searchParams } = new URL(request.url);
  const dataType = searchParams.get("data_type");
  const isCurrent = searchParams.get("is_current");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  let query = supabase
    .from("validated_data")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("confirmed_at", { ascending: false })
    .limit(limit);

  if (dataType) {
    query = query.eq("data_type", dataType);
  }

  if (isCurrent !== null && isCurrent !== undefined) {
    query = query.eq("is_current", isCurrent === "true");
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[data-validation/validated] GET error:", error);
    return apiError("Failed to fetch validated data", 500);
  }

  return apiSuccess({
    items: data || [],
    total: count || 0,
    limit,
  });
});
