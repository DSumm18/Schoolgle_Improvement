import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Switch context to view as another organization (for support)
 */
export const POST = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();
    const { organizationId } = body;

    // Check if user is a super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Admin access required.", 403);
    }

    // Get organization details
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (!org) {
      return apiError("Organization not found", 404);
    }

    // Log impersonation for audit trail
    await supabase.from("impersonation_log").insert({
      admin_id: auth.userId,
      admin_email: auth.email,
      organization_id: organizationId,
      organization_name: org.name,
      action: "impersonate",
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    });

    // Return organization data for client-side context switch
    return apiSuccess({
      organizationId: org.id,
      name: org.name,
      urn: org.urn,
    });
  },
  { requiredRole: "admin" }
);
