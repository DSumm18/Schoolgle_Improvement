import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { createOrganizationSchema, validateRequest } from "@/lib/validations";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  // Parse and validate request body
  const body = await req.json();
  const validation = validateRequest(createOrganizationSchema, body);

  if (!validation.success) {
    return apiError(validation.error, 400);
  }

  const { name, userId, authId, urn } = validation.data;

  // --- DfE Data Enrichment ---
  let enrichedName = name;
  let schoolType = null;
  let localAuthority = null;

  if (urn) {
    console.log(`[CreateOrg] Looking up DfE data for URN: ${urn}`);
    const { data: dfeSchool, error: dfeError } = await supabase
      .schema("dfe_data")
      .from("schools")
      .select("*")
      .eq("urn", parseInt(urn))
      .single();

    if (dfeSchool) {
      console.log(
        `[CreateOrg] Found DfE school: ${dfeSchool.school_name || dfeSchool.name}`,
      );
      enrichedName = dfeSchool.school_name || dfeSchool.name || enrichedName;
      schoolType = dfeSchool.school_type || dfeSchool.type;
      localAuthority = dfeSchool.local_authority || dfeSchool.la_name;
    } else if (dfeError) {
      console.warn(
        `[CreateOrg] DfE lookup failed or no record found for URN ${urn}:`,
        dfeError.message,
      );
    }
  }

  // --- Identity Sync ---
  // First ensure the user exists in the users table
  const { error: userError } = await supabase.from("users").upsert(
    {
      id: userId,
      auth_id: authId || (userId && userId.includes("-") ? userId : null),
    },
    { onConflict: "id" },
  );

  if (userError) {
    console.error("Error ensuring user exists:", userError);
    return apiError(`User sync failed: ${userError.message}`, 500);
  }

  // 1. Create Organization (with enriched data)
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
    console.error("Error creating organization:", orgError);
    return apiError("Failed to create organization", 500);
  }

  // 2. Add User as Admin
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: userId,
      auth_id: authId || (userId && userId.includes("-") ? userId : null),
      role: "admin",
    });

  if (memberError) {
    console.error("Error adding member:", memberError);
    return apiError("Failed to add member to organization", 500);
  }

  return apiSuccess({ organization: org });
});
