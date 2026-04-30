import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildCandidateReasons,
  normalizePostcode,
  schoolNameSimilarity,
  validateOrganizationUrn,
  type DfeSchoolIdentity,
  type OrganizationIdentity,
  type UrnValidationCandidate,
} from "@/lib/dfe-urn-validation";

function toDfeSchool(row: any): DfeSchoolIdentity {
  return {
    urn: Number(row.urn),
    name: row.name ?? null,
    postcode: row.postcode ?? null,
    la_name: row.la_name ?? null,
    street: row.street ?? null,
    town: row.town ?? null,
    phase_name: row.phase_name ?? null,
    type_name: row.type_name ?? null,
    status_name: row.status_name ?? null,
    number_of_pupils: row.number_of_pupils ?? null,
    percentage_fsm: row.percentage_fsm ?? null,
    last_changed_date: row.last_changed_date ?? null,
    updated_at: row.updated_at ?? null,
  };
}

async function findCandidates(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organization: OrganizationIdentity,
  storedUrn?: number,
): Promise<UrnValidationCandidate[]> {
  const orgPostcode = normalizePostcode(organization.address?.postcode);
  const candidates = new Map<number, UrnValidationCandidate>();

  if (orgPostcode) {
    const { data } = await supabase
      .from("schools")
      .select("urn,name,postcode,la_name,street,town,phase_name,type_name,status_name,number_of_pupils,percentage_fsm,last_changed_date,updated_at")
      .eq("postcode", organization.address?.postcode)
      .limit(10);

    for (const row of data ?? []) {
      const school = toDfeSchool(row);
      if (school.urn === storedUrn) continue;
      const reasons = buildCandidateReasons(organization, school);
      if (reasons.length > 0) candidates.set(school.urn, { ...school, match_reasons: reasons });
    }
  }

  const nameTerms = (organization.name ?? "")
    .split(/\s+/)
    .map((term) => term.replace(/[^A-Za-z0-9']/g, ""))
    .filter((term) => term.length >= 5)
    .slice(0, 3);

  for (const term of nameTerms) {
    const { data } = await supabase
      .from("schools")
      .select("urn,name,postcode,la_name,street,town,phase_name,type_name,status_name,number_of_pupils,percentage_fsm,last_changed_date,updated_at")
      .ilike("name", `%${term}%`)
      .limit(20);

    for (const row of data ?? []) {
      const school = toDfeSchool(row);
      if (school.urn === storedUrn) continue;
      const reasons = buildCandidateReasons(organization, school);
      if (schoolNameSimilarity(organization.name, school.name) >= 0.45 && reasons.length > 0) {
        candidates.set(school.urn, { ...school, match_reasons: reasons });
      }
    }
  }

  return [...candidates.values()].slice(0, 5);
}

/**
 * GET /api/intelligence/urn-validation?organizationId={id}
 *
 * Free, local belt-and-braces validation against the DfE/GIAS warehouse:
 * - Does the stored org URN exist?
 * - Does that URN resolve to the same school name/postcode/LA?
 * - If not, are there stronger candidate URNs for the stored org identity?
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") || auth.organizationId;
  if (!organizationId) return apiError("Missing required parameter: organizationId", 400);

  const supabase = createServiceRoleClient();

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id,name,urn,address,local_authority")
    .eq("id", organizationId)
    .single();

  if (orgError || !organization) {
    return apiError(orgError?.message || "Organization not found", 404);
  }

  const orgIdentity: OrganizationIdentity = {
    id: organization.id,
    name: organization.name,
    urn: organization.urn,
    address: organization.address,
    local_authority: organization.local_authority,
  };

  const storedUrn = organization.urn ? Number(organization.urn) : undefined;
  let dfeSchool: DfeSchoolIdentity | null = null;

  if (storedUrn && !Number.isNaN(storedUrn)) {
    const { data } = await supabase
      .from("schools")
      .select("urn,name,postcode,la_name,street,town,phase_name,type_name,status_name,number_of_pupils,percentage_fsm,last_changed_date,updated_at")
      .eq("urn", storedUrn)
      .maybeSingle();

    dfeSchool = data ? toDfeSchool(data) : null;
  }

  const candidates = await findCandidates(supabase, orgIdentity, storedUrn);
  return apiSuccess(validateOrganizationUrn(orgIdentity, dfeSchool, candidates));
});
