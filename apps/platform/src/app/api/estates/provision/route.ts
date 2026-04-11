/**
 * API Route: Estates Provision
 *
 * POST /api/estates/provision
 *
 * Seeds all statutory compliance checks for an organization.
 * Typically called once when a school first activates the Estates module.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { initializeAllStatutoryCompletions } from "@/lib/estates-compliance/database/statutory-completions";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(
  async (auth) => {
    const { organizationId } = auth;

    const supabase = createServiceRoleClient();

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return apiError("Organization not found", 404);
    }

    const result = await initializeAllStatutoryCompletions(organizationId);

    await supabase
      .from("organizations")
      .update({
        compliance_last_review: new Date().toISOString().split("T")[0],
      })
      .eq("id", organizationId);

    return apiSuccess({
      success: true,
      organization: org.name,
      ...result,
    });
  },
  { requiredRole: "admin" },
);
