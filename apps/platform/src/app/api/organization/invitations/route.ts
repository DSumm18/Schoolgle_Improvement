import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET - List pending invitations
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  const { data, error } = await supabase
    .from("invitations")
    .select(
      `
            id,
            email,
            role,
            status,
            created_at,
            expires_at,
            invited_by_user:users!invited_by (
                email,
                display_name
            )
        `,
    )
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invitations:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ invitations: data || [] });
});

// DELETE - Cancel/revoke invitation
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  const { searchParams } = new URL(req.url);
  const invitationId = searchParams.get("invitationId");
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  if (!invitationId) {
    return apiError("Missing required fields", 400);
  }

  // Check if requester is admin
  const { data: requesterMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", auth.userId)
    .single();

  if (!requesterMember || requesterMember.role !== "admin") {
    return apiError("Only admins can cancel invitations", 403);
  }

  // Delete invitation
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error canceling invitation:", error);
    return apiError("Failed to cancel invitation", 500);
  }

  return apiSuccess({ success: true });
});

// POST - Resend invitation (update expires_at)
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  const { invitationId, organizationId } = await req.json();
  const orgId = organizationId || auth.organizationId;

  if (!invitationId) {
    return apiError("Missing required fields", 400);
  }

  // Check if requester is admin
  const { data: requesterMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", auth.userId)
    .single();

  if (!requesterMember || requesterMember.role !== "admin") {
    return apiError("Only admins can resend invitations", 403);
  }

  // Update invitation expiry
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 7);

  const { error } = await supabase
    .from("invitations")
    .update({
      expires_at: newExpiry.toISOString(),
      status: "pending",
    })
    .eq("id", invitationId)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Error resending invitation:", error);
    return apiError("Failed to resend invitation", 500);
  }

  return apiSuccess({ success: true });
});
