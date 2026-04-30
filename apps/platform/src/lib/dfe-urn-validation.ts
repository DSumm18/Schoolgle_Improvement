export type UrnValidationStatus = "valid" | "warning" | "mismatch" | "missing_urn" | "not_found";

export interface OrganizationIdentity {
  id: string;
  name: string | null;
  urn: string | number | null;
  address?: {
    postcode?: string | null;
    street?: string | null;
    town?: string | null;
    city?: string | null;
  } | null;
  local_authority?: string | null;
}

export interface DfeSchoolIdentity {
  urn: number;
  name: string | null;
  postcode: string | null;
  la_name: string | null;
  street?: string | null;
  town?: string | null;
  phase_name?: string | null;
  type_name?: string | null;
  status_name?: string | null;
  number_of_pupils?: number | null;
  percentage_fsm?: number | null;
  last_changed_date?: string | null;
  updated_at?: string | null;
}

export interface UrnValidationCandidate extends DfeSchoolIdentity {
  match_reasons: string[];
}

export interface UrnValidationResult {
  status: UrnValidationStatus;
  confidence: "high" | "medium" | "low";
  message: string;
  organization: {
    id: string;
    name: string | null;
    urn: string | number | null;
    postcode: string | null;
    local_authority: string | null;
  };
  dfeSchool: DfeSchoolIdentity | null;
  candidates: UrnValidationCandidate[];
  checks: {
    urnExists: boolean;
    nameMatch: boolean;
    postcodeMatch: boolean;
    localAuthorityMatch: boolean;
  };
}

const STOP_WORDS = new Set([
  "school",
  "primary",
  "academy",
  "the",
  "and",
  "of",
  "co",
  "c",
  "e",
  "ce",
  "church",
  "england",
  "voluntary",
  "controlled",
  "aided",
  "community",
]);

export function normalizePostcode(value?: string | null) {
  return (value ?? "").toUpperCase().replace(/\s+/g, "");
}

export function normalizeSchoolName(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token))
    .join(" ");
}

function tokenSet(value?: string | null) {
  return new Set(normalizeSchoolName(value).split(" ").filter(Boolean));
}

export function schoolNameSimilarity(left?: string | null, right?: string | null) {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }

  return intersection / Math.max(leftTokens.size, rightTokens.size);
}

export function validateOrganizationUrn(
  organization: OrganizationIdentity,
  dfeSchool: DfeSchoolIdentity | null,
  candidates: UrnValidationCandidate[] = [],
): UrnValidationResult {
  const orgPostcode = normalizePostcode(organization.address?.postcode);
  const orgLa = (organization.local_authority ?? "").trim().toLowerCase();

  if (!organization.urn) {
    return {
      status: "missing_urn",
      confidence: "high",
      message: "No URN is stored for this organization, so DfE data cannot be safely matched.",
      organization: {
        id: organization.id,
        name: organization.name,
        urn: organization.urn,
        postcode: organization.address?.postcode ?? null,
        local_authority: organization.local_authority ?? null,
      },
      dfeSchool: null,
      candidates,
      checks: {
        urnExists: false,
        nameMatch: false,
        postcodeMatch: false,
        localAuthorityMatch: false,
      },
    };
  }

  if (!dfeSchool) {
    if (candidates.length > 0) {
      return {
        status: "warning",
        confidence: "medium",
        message: `URN ${organization.urn} was not found in the local GIAS snapshot, but a school at the same identity was found. DfE performance rows can still be used while the GIAS snapshot is refreshed.`,
        organization: {
          id: organization.id,
          name: organization.name,
          urn: organization.urn,
          postcode: organization.address?.postcode ?? null,
          local_authority: organization.local_authority ?? null,
        },
        dfeSchool: null,
        candidates,
        checks: {
          urnExists: false,
          nameMatch: false,
          postcodeMatch: false,
          localAuthorityMatch: false,
        },
      };
    }

    return {
      status: "not_found",
      confidence: "high",
      message: `URN ${organization.urn} was not found in the DfE/GIAS warehouse.`,
      organization: {
        id: organization.id,
        name: organization.name,
        urn: organization.urn,
        postcode: organization.address?.postcode ?? null,
        local_authority: organization.local_authority ?? null,
      },
      dfeSchool: null,
      candidates,
      checks: {
        urnExists: false,
        nameMatch: false,
        postcodeMatch: false,
        localAuthorityMatch: false,
      },
    };
  }

  const nameScore = schoolNameSimilarity(organization.name, dfeSchool.name);
  const nameMatch = nameScore >= 0.45;
  const postcodeMatch =
    !!orgPostcode && !!normalizePostcode(dfeSchool.postcode) && orgPostcode === normalizePostcode(dfeSchool.postcode);
  const localAuthorityMatch =
    !orgLa || !dfeSchool.la_name || orgLa === dfeSchool.la_name.trim().toLowerCase();

  const checks = {
    urnExists: true,
    nameMatch,
    postcodeMatch,
    localAuthorityMatch,
  };

  const organizationSummary = {
    id: organization.id,
    name: organization.name,
    urn: organization.urn,
    postcode: organization.address?.postcode ?? null,
    local_authority: organization.local_authority ?? null,
  };

  if (!nameMatch && !postcodeMatch) {
    return {
      status: "mismatch",
      confidence: "high",
      message: `Stored URN ${organization.urn} points to ${dfeSchool.name}, not ${organization.name}. Do not use DfE KPIs until this is corrected.`,
      organization: organizationSummary,
      dfeSchool,
      candidates,
      checks,
    };
  }

  if (!postcodeMatch || !nameMatch || !localAuthorityMatch) {
    return {
      status: "warning",
      confidence: postcodeMatch || nameMatch ? "medium" : "low",
      message: `URN ${organization.urn} resolves to ${dfeSchool.name}, but one or more identity checks need review.`,
      organization: organizationSummary,
      dfeSchool,
      candidates,
      checks,
    };
  }

  return {
    status: "valid",
    confidence: "high",
    message: `URN ${organization.urn} matches ${dfeSchool.name} in the DfE/GIAS warehouse.`,
    organization: organizationSummary,
    dfeSchool,
    candidates,
    checks,
  };
}

export function buildCandidateReasons(
  organization: OrganizationIdentity,
  school: DfeSchoolIdentity,
) {
  const reasons: string[] = [];
  if (normalizePostcode(organization.address?.postcode) === normalizePostcode(school.postcode)) {
    reasons.push("same postcode");
  }
  const score = schoolNameSimilarity(organization.name, school.name);
  if (score >= 0.45) reasons.push("similar school name");
  if (
    organization.local_authority &&
    school.la_name &&
    organization.local_authority.trim().toLowerCase() === school.la_name.trim().toLowerCase()
  ) {
    reasons.push("same local authority");
  }
  return reasons;
}
