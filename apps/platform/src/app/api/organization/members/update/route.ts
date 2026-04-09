import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const PUT = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  const { userId, newRole } = await req.json();
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!userId || !newRole) {
    return apiError("Missing required fields", 400);
  }

  // Validate role
  if (!["admin", "teacher", "slt"].includes(newRole)) {
    return apiError("Invalid role", 400);
  }

  // Check if requester is admin
  const { data: requesterMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", auth.userId)
    .single();

  if (!requesterMember || requesterMember.role !== "admin") {
    return apiError("Only admins can update roles", 403);
  }

  // Prevent removing the last admin
  if (newRole !== "admin") {
    const { data: admins } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", orgId)
      .eq("role", "admin");

    if (admins && admins.length === 1 && admins[0].user_id === userId) {
      return apiError("Cannot remove the last admin", 400);
    }
  }

  // Update role
  const { error } = await supabase
    .from("organization_members")
    .update({ role: newRole })
    .eq("organization_id", orgId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating role:", error);
    return apiError("Failed to update role", 500);
  }

  return apiSuccess({ success: true });
});

export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const userId = searchParams.get("userId");

  if (!userId) {
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
    return apiError("Only admins can remove members", 403);
  }

  // Prevent removing the last admin
  const { data: targetMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .single();

  if (targetMember?.role === "admin") {
    const { data: admins } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("role", "admin");

    if (admins && admins.length === 1) {
      return apiError("Cannot remove the last admin", 400);
    }
  }

  // Remove member
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing member:", error);
    return apiError("Failed to remove member", 500);
  }

  return apiSuccess({ success: true });
});
