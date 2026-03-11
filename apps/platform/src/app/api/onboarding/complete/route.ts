import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { lookupSchoolByURN } from "@/lib/supabase-dfe";

interface SchoolData {
  urn: number;
  name: string;
  localAuthority?: string;
  type?: string;
  phase?: string;
  town?: string;
  postcode?: string;
  address?: string;
}

export const POST = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();

  const body = await req.json();
  const school: SchoolData | null = body.school || null;
  const userId = body.userId || auth.userId;
  const authId = body.authId || userId;

  // Ensure user exists in users table
  const { error: userError } = await supabase.from("users").upsert(
    {
      id: userId,
      auth_id: authId,
    },
    { onConflict: "id" },
  );

  if (userError) {
    console.error("Error ensuring user exists:", userError);
    return apiError("Failed to sync user: " + userError.message, 500);
  }

  let organizationId: string | null = null;

  if (school && school.urn) {
    // Step 1: Check if organization already exists for this URN
    const { data: existingOrg, error: orgCheckError } = await supabase
      .from("organizations")
      .select("id")
      .eq("urn", school.urn.toString())
      .maybeSingle();

    if (orgCheckError && orgCheckError.code !== "PGRST116") {
      console.error("Error checking existing org:", orgCheckError);
      return apiError("Failed to check existing organization", 500);
    }

    if (existingOrg) {
      // Reuse existing organization
      organizationId = existingOrg.id;
      console.log(
        `[Onboarding] Reusing existing organization ${organizationId} for URN ${school.urn}`,
      );
    } else {
      // Create new organization
      // Enrich with DfE data
      const dfeSchool = await lookupSchoolByURN(school.urn);

      const orgData: any = {
        name: school.name,
        urn: school.urn.toString(),
      };

      if (dfeSchool) {
        orgData.name = dfeSchool.name || school.name;
        orgData.school_type =
          dfeSchool.phase_name || dfeSchool.type_name || school.phase;
        orgData.local_authority = dfeSchool.la_name || school.localAuthority;

        // Check if church school for SIAMS
        if (dfeSchool.religious_character || dfeSchool.religious_ethos) {
          const rc = (
            dfeSchool.religious_character ||
            dfeSchool.religious_ethos ||
            ""
          ).toLowerCase();
          if (
            rc.includes("church of england") ||
            rc.includes("methodist") ||
            rc.includes("catholic")
          ) {
            orgData.is_church_school = true;
            orgData.diocese =
              dfeSchool.religious_character || dfeSchool.religious_ethos;
          }
        }

        // Address
        if (dfeSchool.address_line1 || dfeSchool.town || dfeSchool.postcode) {
          orgData.address = {
            line1: dfeSchool.address_line1 || school.address,
            line2: dfeSchool.address_line2,
            line3: dfeSchool.address_line3,
            town: dfeSchool.town || school.town,
            postcode: dfeSchool.postcode || school.postcode,
          };
        }
      } else {
        // Fallback to provided data
        orgData.school_type = school.phase || school.type;
        orgData.local_authority = school.localAuthority;
        if (school.address || school.town || school.postcode) {
          orgData.address = {
            line1: school.address,
            town: school.town,
            postcode: school.postcode,
          };
        }
      }

      const { data: newOrg, error: createError } = await supabase
        .from("organizations")
        .insert(orgData)
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating organization:", createError);
        return apiError("Failed to create organization", 500);
      }

      organizationId = newOrg.id;
      console.log(
        `[Onboarding] Created new organization ${organizationId} for URN ${school.urn}`,
      );
    }
  }

  // Step 2: Create or confirm organization_members record
  if (organizationId) {
    // Check if membership already exists
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();

    // Ignore PGRST116 (no rows) - that's expected for new members
    if (memberCheckError && memberCheckError.code !== "PGRST116") {
      console.error("Error checking existing member:", memberCheckError);
      return apiError("Failed to check existing membership", 500);
    }

    if (!existingMember) {
      // Create membership with admin role (first user becomes admin)
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          auth_id: authId,
          role: "admin", // First user is admin
        });

      if (memberError) {
        console.error("Error creating organization member:", memberError);
        return apiError("Failed to link user to organization", 500);
      }

      console.log(
        `[Onboarding] Created organization_members record for user ${userId} and org ${organizationId}`,
      );
    } else {
      console.log(
        `[Onboarding] User ${userId} already member of org ${organizationId}`,
      );
    }
  }

  return apiSuccess({
    success: true,
    organizationId,
  });
});
