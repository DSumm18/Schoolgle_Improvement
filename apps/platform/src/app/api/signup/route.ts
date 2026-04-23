import { NextRequest } from "next/server";
import { withErrorHandling, apiError, apiSuccess } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";
import { createOrganizationSchema, validateRequest } from "@/lib/validations";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * PUBLIC signup endpoint - creates user + organization together
 * This is intentionally NOT protected by auth middleware
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  // Check env vars
  if (!supabaseUrl || !supabaseServiceKey) {
    return apiError("Server configuration error", 500, "ENV_MISSING");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Parse request body
  const body = await req.json();

  // Validate required fields
  const { email, password, firstName, lastName, organisationName, urn } = body;

  if (!email || !password || !organisationName) {
    return apiError("Missing required fields: email, password, organisationName", 400);
  }

  // 1. Check if user already exists
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const userExists = existingUser.users.find(u => u.email === email);

  if (userExists) {
    return apiError("An account with this email already exists. Please sign in instead.", 409, "USER_EXISTS");
  }

  // 2. Create Supabase user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email for signup
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
    },
  });

  if (authError || !authData.user) {
    console.error("[Signup] Auth error:", authError);
    return apiError("Failed to create user account", 500, "AUTH_FAILED");
  }

  const userId = authData.user.id;

  // 3. DfE Data Enrichment (if URN provided)
  let enrichedName = organisationName;
  let schoolType = null;
  let localAuthority = null;

  if (urn) {
    const { data: dfeSchool } = await supabase
      .schema("dfe_data")
      .from("schools")
      .select("*")
      .eq("urn", parseInt(urn))
      .maybeSingle();

    if (dfeSchool) {
      enrichedName = dfeSchool.school_name || dfeSchool.name || enrichedName;
      schoolType = dfeSchool.school_type || dfeSchool.type;
      localAuthority = dfeSchool.local_authority || dfeSchool.la_name;
      console.log("[Signup] DfE lookup found:", enrichedName);
    }
  }

  // 4. Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: enrichedName,
      urn,
      school_type: schoolType,
      local_authority: localAuthority,
    })
    .select()
    .single();

  if (orgError) {
    console.error("[Signup] Org error:", orgError);
    // Cleanup user if org creation fails
    await supabase.auth.admin.deleteUser(userId);
    return apiError("Failed to create organization", 500, "ORG_FAILED");
  }

  // 5. Add user to users table
  await supabase.from("users").upsert({
    id: userId,
    auth_id: userId,
    email,
    display_name: `${firstName} ${lastName}`,
  });

  // 6. Add user as admin of organization
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: userId,
      auth_id: userId,
      role: "admin",
    });

  if (memberError) {
    console.error("[Signup] Member error:", memberError);
    // Cleanup
    await supabase.auth.admin.deleteUser(userId);
    return apiError("Failed to add user to organization", 500, "MEMBER_FAILED");
  }

  console.log("[Signup] Success:", { userId, orgId: org.id, orgName: org.name });

  return apiSuccess({
    organization: org,
    user: {
      id: userId,
      email,
    },
  });
}, "Public Signup");
