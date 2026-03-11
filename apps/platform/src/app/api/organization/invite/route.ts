import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { inviteUserSchema, validateRequest } from "@/lib/validations";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  // Parse and validate request body
  const body = await req.json();
  const validation = validateRequest(inviteUserSchema, body);

  if (!validation.success) {
    return apiError(validation.error, 400);
  }

  const { email, role, organizationId, invitedBy } = validation.data;
  const orgId = organizationId || auth.organizationId;

  // Create invitation
  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      email,
      role,
      organization_id: orgId,
      invited_by: invitedBy,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invitation:", error);
    return apiError("Failed to create invitation", 500);
  }

  return apiSuccess({ invitation });
});
