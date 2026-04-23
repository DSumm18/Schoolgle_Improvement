import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Bulk user provisioning for new customers
 * Creates 3 default users: headteacher, assistant head, office manager
 */
export const POST = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();
    const { organizationId, users } = body;

    if (!organizationId || !Array.isArray(users) || users.length === 0) {
      return apiError("organizationId and users array required", 400);
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

    // Check subscription limits
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("user_limit")
      .eq("organization_id", organizationId)
      .single();

    const userLimit = subscription?.user_limit || 3;

    // Count existing users
    const { count: existingCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    if ((existingCount || 0) + users.length > userLimit) {
      return apiError(
        `User limit exceeded. ${userLimit - (existingCount || 0)} slots remaining.`,
        400,
        "USER_LIMIT_EXCEEDED"
      );
    }

    const results = [];
    const errors = [];

    for (const user of users) {
      const { email, password, displayName, role } = user;

      try {
        // Check if user already exists
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const found = existingUser.users.find((u) => u.email === email);

        let userId;

        if (found) {
          // User exists, add to organization
          userId = found.id;

          const { error: memberError } = await supabase
            .from("organization_members")
            .insert({
              organization_id: organizationId,
              user_id: userId,
              auth_id: userId,
              role: role || "member",
            });

          if (memberError) throw memberError;

          results.push({
            email,
            status: "added_to_org",
            userId,
          });
        } else {
          // Create new user
          const { data: authData, error: authError } =
            await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                display_name: displayName,
                full_name: displayName,
              },
            });

          if (authError) throw authError;
          userId = authData.user.id;

          // Add to users table
          await supabase.from("users").upsert({
            id: userId,
            auth_id: userId,
            email,
            display_name: displayName,
          });

          // Add to organization
          const { error: memberError } = await supabase
            .from("organization_members")
            .insert({
              organization_id: organizationId,
              user_id: userId,
              auth_id: userId,
              role: role || "member",
            });

          if (memberError) throw memberError;

          results.push({
            email,
            status: "created",
            userId,
          });
        }
      } catch (error: any) {
        errors.push({
          email,
          error: error.message,
        });
      }
    }

    return apiSuccess({
      created: results.length,
      failed: errors.length,
      results,
      errors,
    });
  },
  { requiredRole: "admin" }
);

// Get organization users and remaining slots
export const GET = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return apiError("organizationId required", 400);
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

    // Get subscription with user limit
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("user_limit")
      .eq("organization_id", organizationId)
      .single();

    const userLimit = subscription?.user_limit || 3;

    // Get current users
    const { data: members, error } = await supabase
      .from("organization_members")
      .select(
        `
        user_id,
        role,
        created_at,
        users(email, display_name)
      `
      )
      .eq("organization_id", organizationId);

    if (error) throw error;

    return apiSuccess({
      userLimit,
      used: members?.length || 0,
      remaining: userLimit - (members?.length || 0),
      users: members || [],
    });
  },
  { requiredRole: "admin" }
);

// Remove user from organization
export const DELETE = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();
    const { organizationId, userId } = body;

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (error) throw error;

    return apiSuccess({ removed: true });
  },
  { requiredRole: "admin" }
);
