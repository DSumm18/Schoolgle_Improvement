// ─── GIAS Connector Service ─────────────────────────────────────────
// Fetches school data from DfE GIAS open data API

import {
  GIASSchool,
  GIASSchoolSummary,
  GIASConnectorError,
  ACADEMY_TYPE_CODES,
} from "./types";

const GIAS_BASE_URL = "https://dfe-digital.github.io/gias-data/schools";

/**
 * Fetch a single school by URN from the GIAS open data API.
 */
export async function getSchoolByURN(urn: number): Promise<GIASSchool> {
  if (!Number.isInteger(urn) || urn < 100000 || urn > 999999) {
    const error: GIASConnectorError = {
      code: "INVALID_URN",
      message: `Invalid URN: ${urn}. URN must be a 6-digit integer.`,
      urn,
    };
    throw error;
  }

  const url = `${GIAS_BASE_URL}/${urn}.json`;

  let response: Response;
  try {
    response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
  } catch (err) {
    const error: GIASConnectorError = {
      code: "NETWORK_ERROR",
      message: `Failed to fetch school data from GIAS: ${err instanceof Error ? err.message : "Unknown error"}`,
      urn,
    };
    throw error;
  }

  if (response.status === 404) {
    const error: GIASConnectorError = {
      code: "NOT_FOUND",
      message: `School with URN ${urn} not found in GIAS.`,
      urn,
    };
    throw error;
  }

  if (!response.ok) {
    const error: GIASConnectorError = {
      code: "NETWORK_ERROR",
      message: `GIAS API returned status ${response.status}`,
      urn,
    };
    throw error;
  }

  let data: GIASSchool;
  try {
    data = await response.json();
  } catch {
    const error: GIASConnectorError = {
      code: "PARSE_ERROR",
      message: `Failed to parse GIAS response for URN ${urn}`,
      urn,
    };
    throw error;
  }

  return data;
}

/**
 * Search schools by name or postcode.
 * Note: GIAS open data doesn't have a search API, so this queries our
 * Supabase DfE warehouse. Falls back to single URN lookup if numeric.
 */
export async function searchSchools(
  query: string,
): Promise<GIASSchoolSummary[]> {
  // If query looks like a URN, do a direct lookup
  const maybeURN = parseInt(query, 10);
  if (!isNaN(maybeURN) && maybeURN >= 100000 && maybeURN <= 999999) {
    try {
      const school = await getSchoolByURN(maybeURN);
      return [toSummary(school)];
    } catch {
      return [];
    }
  }

  // For text search, we need the DfE Supabase warehouse
  const { getDfeClient } = await import("@/lib/supabase-dfe");
  const dfe = getDfeClient();

  const { data, error } = await dfe
    .from("schools")
    .select("urn, name, phase_name, type_name, status_name, la_name, postcode")
    .or(`name.ilike.%${query}%,postcode.ilike.%${query}%`)
    .eq("status_name", "Open")
    .order("name")
    .limit(20);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    urn: row.urn,
    name: row.name,
    phase: row.phase_name || "",
    type: row.type_name || "",
    status: row.status_name || "Unknown",
    localAuthority: row.la_name || "",
    postcode: row.postcode || "",
    isOpen: row.status_name === "Open",
    isAcademy: (row.type_name || "").toLowerCase().includes("academy"),
  }));
}

/**
 * Get a simplified summary of a school by URN.
 */
export async function getSchoolSummary(
  urn: number,
): Promise<GIASSchoolSummary> {
  const school = await getSchoolByURN(urn);
  return toSummary(school);
}

/**
 * Convert full GIAS record to summary.
 */
function toSummary(school: GIASSchool): GIASSchoolSummary {
  return {
    urn: school.urn,
    name: school.name,
    phase: school.phase_of_education,
    type: school.type,
    status: school.status,
    localAuthority: school.local_authority,
    postcode: school.postcode,
    isOpen: school.status_code === 1,
    isAcademy: ACADEMY_TYPE_CODES.has(school.type_code),
  };
}
