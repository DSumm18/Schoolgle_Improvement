import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  // Fetch members with user details
  const { data: members, error } = await supabase
    .from("organization_members")
    .select(
      `
            role,
            created_at,
            user:users (
                id,
                email,
                display_name
            )
        `,
    )
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error fetching members:", error);
    return apiError("Failed to fetch members", 500);
  }

  return apiSuccess({ members });
});
