import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Create a new school (organization + subscription + admin user)
 * POST /api/admin/create-school
 *
 * Body:
 * {
 *   "school": {
 *     "urn": string,
 *     "name": string,
 *     "type": string,
 *     "phase": string,
 *     "localAuthority": string,
 *     "address": object,
 *     "town": string,
 *     "postcode": string,
 *     "phone": string,
 *     "email": string,
 *     "website": string,
 *     "trustName": string,
 *     "religiousCharacter": string
 *   },
 *   "subscription": {
 *     "plan": "core" | "professional" | "enterprise",
 *     "userLimit": number,
 *     "enabledModules": string[],
 *     "paymentMethod": "card" | "direct_debit" | "invoice" | "manual",
 *     "startTrial": boolean
 *   },
 *   "admin": {
 *     "email": string,
 *     "password": string,
 *     "firstName": string,
 *     "lastName": string,
 *     "displayName": string
 *   }
 * }
 */
export const POST = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();
    const { school, subscription, admin } = body;

    // Validate required fields
    if (!school?.name || !school?.urn) {
      return apiError("School name and URN are required", 400);
    }
    if (!subscription?.plan) {
      return apiError("Subscription plan is required", 400);
    }
    if (!admin?.email || !admin?.password) {
      return apiError("Admin email and password are required", 400);
    }

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    try {
      // 1. Check if organization already exists by URN
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("urn", String(school.urn))
        .maybeSingle();

      if (existingOrg) {
        return apiError(
          `An organization with URN ${school.urn} already exists: ${existingOrg.name}`,
          409,
          "ORG_EXISTS"
        );
      }

      // 2. Determine school type from DFE data
      let schoolType = "unknown";
      const phaseLower = (school.phase || "").toLowerCase();
      const typeLower = (school.type || "").toLowerCase();

      if (phaseLower.includes("primary") || typeLower.includes("primary")) {
        schoolType = "primary";
      } else if (phaseLower.includes("secondary")) {
        schoolType = "secondary";
      } else if (phaseLower.includes("all-through")) {
        schoolType = "all-through";
      } else if (typeLower.includes("special")) {
        schoolType = "special";
      } else if (phaseLower.includes("nursery")) {
        schoolType = "nursery";
      }

      // 3. Create organization
      const addressObject = {
        line1: school.address_line1 || school.address?.line1 || "",
        line2: school.address_line2 || school.address?.line2 || "",
        line3: school.address_line3 || school.address?.line3 || "",
        town: school.town || "",
        postcode: school.postcode || "",
        phone: school.phone || "",
        email: school.email || "",
        website: school.website || "",
      };

      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: school.name,
          urn: String(school.urn),
          school_type: schoolType,
          local_authority: school.localAuthority || school.la_name || "",
          address: addressObject,
          settings: {
            phase: school.phase || "",
            type_name: school.type || "",
            trust_name: school.trustName || school.trust_name || "",
            religious_character: school.religiousCharacter || school.religious_character || "",
            phone: school.phone || "",
            email: school.email || "",
            website: school.website || "",
            created_via: "admin_create_school",
          },
          organization_type: school.trustName ? "school" : "school", // Could be "trust" if needed
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 4. Create admin user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          first_name: admin.firstName,
          last_name: admin.lastName,
          full_name: admin.displayName || `${admin.firstName} ${admin.lastName}`,
        },
      });

      if (authError) throw authError;

      // 5. Add user to users table
      await supabase.from("users").upsert({
        id: authData.user.id,
        auth_id: authData.user.id,
        email: admin.email,
        display_name: admin.displayName || `${admin.firstName} ${admin.lastName}`,
      });

      // 6. Add user to organization as admin
      await supabase.from("organization_members").insert({
        organization_id: organization.id,
        user_id: authData.user.id,
        auth_id: authData.user.id,
        role: "admin",
      });

      // 7. Create subscription
      const trialDurationDays = subscription.startTrial ? 7 : 0;
      const trialStart = subscription.startTrial ? new Date().toISOString() : null;
      const trialEnd = subscription.startTrial
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Get default modules for plan if not provided
      const planModules = getDefaultModulesForPlan(subscription.plan);
      const enabledModules = subscription.enabledModules?.length
        ? subscription.enabledModules
        : planModules;

      const { data: subscriptionData, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          organization_id: organization.id,
          plan_id: subscription.plan,
          product: "bundle", // Default to bundle for now
          status: subscription.startTrial ? "trialing" : "active",
          trial_start: trialStart,
          trial_end: trialEnd,
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method: subscription.paymentMethod || "manual",
          user_limit: subscription.userLimit || 3,
          enabled_modules: enabledModules,
          created_by: auth.userId,
          auto_renew: !subscription.startTrial, // Don't auto-renew trials
        })
        .select()
        .single();

      if (subError) throw subError;

      // 8. Log to subscription history
      await supabase.from("subscription_history").insert({
        subscription_id: subscriptionData.id,
        change_type: "created",
        new_plan: subscription.plan,
        previous_price: null,
        new_price: null,
        reason: `School created via admin dashboard by ${auth.email}`,
        changed_by: auth.userId,
      });

      return apiSuccess({
        organization: {
          id: organization.id,
          name: organization.name,
          urn: organization.urn,
        },
        subscription: {
          id: subscriptionData.id,
          plan: subscriptionData.plan_id,
          status: subscriptionData.status,
          trialEnd: subscriptionData.trial_end,
        },
        admin: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.full_name,
        },
        message: "School created successfully",
      });
    } catch (error: any) {
      console.error("Error creating school:", error);
      return apiError(
        error.message || "Failed to create school",
        500,
        "CREATE_FAILED"
      );
    }
  },
  { requiredRole: "admin" }
);

function getDefaultModulesForPlan(plan: string): string[] {
  switch (plan) {
    case "core":
      return [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
      ];
    case "professional":
      return [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
        "intelligence",
        "safeguarding",
        "attendance",
        "behaviour",
      ];
    case "enterprise":
      return [
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
      ];
    default:
      return [
        "ofsted-readiness",
        "estates-compliance",
        "hr-people",
        "governance",
        "actions-hub",
      ];
  }
}
