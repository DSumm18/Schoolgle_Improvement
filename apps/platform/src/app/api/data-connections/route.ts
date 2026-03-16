import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/data-connections?organizationId=xxx
 * List active data connections for the organization
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const orgId =
    req.nextUrl.searchParams.get("organizationId") || auth.organizationId;
  if (!orgId) return apiError("Missing organizationId", 400);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("school_data_connections")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  if (error) return apiError("Failed to fetch connections", 500);
  return apiSuccess({ connections: data || [] });
});

/**
 * DELETE /api/data-connections?id=xxx&organizationId=xxx
 * Soft-delete (deactivate) a connection
 */
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  const orgId =
    req.nextUrl.searchParams.get("organizationId") || auth.organizationId;
  if (!id || !orgId) return apiError("Missing id or organizationId", 400);

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("school_data_connections")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) return apiError("Failed to disconnect", 500);
  return apiSuccess({ disconnected: true });
});
