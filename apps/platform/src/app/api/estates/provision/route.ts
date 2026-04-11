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

    // Activate required modules for estates + compliance operations
    const modulesToActivate = ["estates_management", "compliance_tracker"];
    const moduleActivations: Record<string, boolean> = {};
    for (const moduleId of modulesToActivate) {
      const { error: moduleError } = await supabase
        .from("organization_modules")
        .upsert(
          {
            organization_id: organizationId,
            module_id: moduleId,
            enabled: true,
            enabled_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,module_id" },
        );
      moduleActivations[moduleId] = !moduleError;
      if (moduleError) {
        console.warn(`[provision] Could not activate ${moduleId}:`, moduleError.message);
      }
    }

    await supabase
      .from("organizations")
      .update({
        compliance_last_review: new Date().toISOString().split("T")[0],
      })
      .eq("id", organizationId);

    return apiSuccess({
      success: true,
      organization: org.name,
      modulesActivated: moduleActivations,
      ...result,
    });
  },
  { requiredRole: "admin" },
);
