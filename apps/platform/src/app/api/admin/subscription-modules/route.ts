import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Module access control based on subscription
 * GET - Check module access for an organization
 * PATCH - Update enabled modules for a subscription
 */
export const GET = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const module = searchParams.get("module");

    if (!organizationId) {
      return apiError("organizationId required", 400);
    }

    // Get subscription with enabled modules
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("enabled_modules, user_limit, storage_limit_gb, status")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;

    if (!subscription) {
      return apiError("No active subscription found", 404, "NO_SUBSCRIPTION");
    }

    // Check if module is enabled
    if (module) {
      const hasAccess = subscription.enabled_modules?.includes(module);
      return apiSuccess({
        hasAccess,
        modules: subscription.enabled_modules || [],
        userLimit: subscription.user_limit,
        storageLimit: subscription.storage_limit_gb,
      });
    }

    return apiSuccess({
      modules: subscription.enabled_modules || [],
      userLimit: subscription.user_limit,
      storageLimit: subscription.storage_limit_gb,
      status: subscription.status,
    });
  },
  { requiredRole: "admin" } // Use org admin role here, not super admin
);

export const PATCH = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();
    const { subscriptionId, modules, userLimit, action } = body;

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    let updateData: any = {};
    let historyEntry: any = { subscription_id: subscriptionId };

    switch (action) {
      case "update_modules":
        updateData.enabled_modules = modules;
        historyEntry.change_type = "modules_changed";
        break;

      case "update_user_limit":
        updateData.user_limit = userLimit;
        historyEntry.change_type = "user_limit_changed";
        break;

      case "block_access":
        // Disable all modules except billing
        updateData.enabled_modules = [];
        updateData.status = "cancelled";
        historyEntry.change_type = "cancelled";
        historyEntry.reason = "Access blocked by admin";
        break;

      case "restore_access":
        // Restore default modules
        updateData.enabled_modules = [
          "ofsted-readiness",
          "estates-compliance",
          "hr-people",
          "governance",
          "actions-hub",
          "intelligence",
        ];
        updateData.status = "active";
        historyEntry.change_type = "reactivated";
        historyEntry.reason = "Access restored by admin";
        break;
    }

    // Update subscription
    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", subscriptionId)
      .select()
      .single();

    if (error) throw error;

    // Log to history
    await supabase.from("subscription_history").insert(historyEntry);

    return apiSuccess({ data });
  },
  { requiredRole: "admin" }
);

// All available modules by plan
export const PUT = protectedRoute(
  async (auth, req) => {
    // Return module definitions for admin UI
    const moduleDefinitions = {
      core: [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
      ],
      professional: [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
        "intelligence",
        "safeguarding",
        "attendance",
        "behaviour",
      ],
      enterprise: [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
        "intelligence",
        "safeguarding",
        "attendance",
        "behaviour",
        "communications",
        "calendar",
        "surveys",
        "admissions",
        "school-meals",
        "cover",
        "canvas",
      ],
      ed_in_school: ["ed-chat", "ed-voice", "form-helper"],
      ed_website: ["ed-embed"],
    };

    const allModules = [
      { id: "ofsted-readiness", name: "Ofsted Readiness", category: "Compliance" },
      { id: "estates-compliance", name: "Estates Compliance", category: "Operations" },
      { id: "hr-people", name: "HR & People", category: "Operations" },
      { id: "governance", name: "Governance", category: "Leadership" },
      { id: "actions-hub", name: "Actions Hub", category: "Improvement" },
      { id: "intelligence", name: "School Intelligence", category: "Data" },
      { id: "safeguarding", name: "Safeguarding", category: "Compliance" },
      { id: "attendance", name: "Attendance", category: "Operations" },
      { id: "behaviour", name: "Behaviour", category: "Operations" },
      { id: "communications", name: "Communications", category: "Engagement" },
      { id: "calendar", name: "Calendar", category: "Operations" },
      { id: "surveys", name: "Surveys", category: "Engagement" },
      { id: "admissions", name: "Admissions", category: "Operations" },
      { id: "school-meals", name: "School Meals", category: "Operations" },
      { id: "cover", name: "Cover Management", category: "Operations" },
      { id: "canvas", name: "Canvas Data", category: "Data" },
      { id: "ed-chat", name: "Ed AI Chat", category: "AI" },
      { id: "ed-voice", name: "Ed Voice", category: "AI" },
      { id: "ed-embed", name: "Ed Website Chat", category: "AI" },
      { id: "form-helper", name: "Form Helper", category: "AI" },
    ];

    return apiSuccess({
      plans: moduleDefinitions,
      allModules,
    });
  },
  { requiredRole: "admin" }
);
