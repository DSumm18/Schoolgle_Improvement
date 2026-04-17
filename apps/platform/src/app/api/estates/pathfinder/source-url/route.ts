import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const BUCKET = "pathfinder-sources";
const DEFAULT_EXPIRES_IN = 60 * 60; // 1 hour

export const GET = protectedRoute(async (auth, request) => {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) return apiError("path is required", 400);

  // Tenant isolation: every object path starts with the organization id.
  if (!path.startsWith(`${auth.organizationId}/`)) {
    return apiError("Path is outside your organisation", 403);
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, DEFAULT_EXPIRES_IN);

  if (error || !data?.signedUrl) {
    console.error("Pathfinder source-url error:", error);
    return apiError("Failed to issue signed URL", 500);
  }

  return apiSuccess({ signedUrl: data.signedUrl, expiresIn: DEFAULT_EXPIRES_IN });
});
