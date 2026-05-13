import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withErrorHandling, apiError, apiSuccess } from "@/lib/api-utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    // Check env vars
    if (!supabaseUrl || !supabaseServiceKey) {
      return apiError(
        "Server configuration error - missing Supabase credentials",
        500,
        "ENV_MISSING",
      );
    }

    // --- AUTHENTICATION CHECK ---
    // Verify the caller is authenticated and matches the userId being updated
    const authHeader = req.headers.get("authorization");
    const supabaseAuth = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } },
    );
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !authUser) {
      return apiError("Authentication required", 401, "UNAUTHENTICATED");
    }

    const { userId, email, displayName } = await req.json();

    if (!userId) {
      return apiError("Missing required fields", 400);
    }

    // Ensure the authenticated user can only update their OWN profile
    if (authUser.id !== userId) {
      return apiError("You can only update your own profile", 403, "FORBIDDEN");
    }

    // Use service-role client only for the verified user's own data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Sync User to Supabase (skip if no email — just fetching org)
    let storedDisplayName: string | null = null;
    if (email) {
      // Check if user already has a display_name set (e.g. linked to staff record)
      const { data: existingUser } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();

      storedDisplayName = existingUser?.display_name || null;

      const { error: userError } = await supabase.from("users").upsert(
        {
          id: userId,
          auth_id: userId,
          email: email,
          // Only set display_name if user doesn't already have one
          display_name: storedDisplayName || displayName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (!storedDisplayName) {
        storedDisplayName = displayName;
      }

      if (userError) {
        console.warn(
          "[Auth Profile] User upsert failed (non-fatal):",
          userError.message,
        );
      }
    }

    // 2. Fetch Organization (use .limit(1) instead of .maybeSingle() to handle multi-org users)
    const { data: memberRows, error: memberError } = await supabase
      .from("organization_members")
      .select(
        `
        role,
        organization:organizations (
          id,
          name,
          organization_type
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(500);

    if (memberError) {
      console.warn("Error fetching member during profile sync:", memberError);
    }

    // Check user metadata for preferred org
    let preferredOrgId: string | null = null;
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      preferredOrgId = authUser?.user?.user_metadata?.organization_id || null;
    } catch {
      // Non-fatal - just use first membership
    }

    // Find preferred or first membership
    const members = (memberRows || []) as any[];
    let member = preferredOrgId
      ? members.find((m: any) => {
          const org = Array.isArray(m.organization)
            ? m.organization[0]
            : m.organization;
          return org?.id === preferredOrgId;
        })
      : null;
    if (!member && members.length > 0) member = members[0];

    let orgData = member?.organization;
    if (Array.isArray(orgData)) {
      orgData = orgData[0];
    }

    const organization = orgData
      ? {
          id: orgData.id,
          name: orgData.name,
          role: member?.role,
          organization_type: orgData.organization_type,
        }
      : null;

    return apiSuccess({
      user: {
        id: userId,
        email,
        displayName: storedDisplayName || displayName,
      },
      organization,
    });
  }, "Auth Profile API");
}
