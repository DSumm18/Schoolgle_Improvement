// ─── GIAS (Get Information About Schools) Types ─────────────────────
// Data source: https://dfe-digital.github.io/gias-data/schools/{URN}.json

export interface GIASSchool {
  urn: number;
  ukprn: number | null;
  name: string;
  local_authority_code: string;
  local_authority: string;
  administritive_district_code: string; // Note: DfE typo in source data
  administritive_district: string;
  phase_of_education_code: number;
  phase_of_education: string;
  gender: string;
  type_code: number;
  type: string;
  status_code: number;
  status: string;
  rsc_region: string | null;
  section_41_approved: string;
  open_date: string | null;
  close_date: string | null;
  address_1: string;
  address_2: string;
  address_3: string;
  county: string;
  postcode: string;
  school_website: string;
  phone: string;
  latitude: number;
  longitude: number;
}

export interface GIASSchoolSummary {
  urn: number;
  name: string;
  phase: string;
  type: string;
  status: string;
  localAuthority: string;
  postcode: string;
  isOpen: boolean;
  isAcademy: boolean;
}

export interface GIASSearchResult {
  schools: GIASSchoolSummary[];
  total: number;
  query: string;
}

export interface GIASConnectorError {
  code: "NOT_FOUND" | "NETWORK_ERROR" | "INVALID_URN" | "PARSE_ERROR";
  message: string;
  urn?: number;
}

/** Phase codes used by GIAS */
export const GIAS_PHASE_CODES = {
  1: "Nursery",
  2: "Primary",
  4: "Secondary",
  5: "Middle deemed primary",
  6: "Middle deemed secondary",
  7: "All-through",
  0: "Not applicable",
} as const;

/** School type codes that indicate academy status */
export const ACADEMY_TYPE_CODES = new Set([
  34, // Academy converter
  35, // Free school
  36, // Academy sponsor led
  38, // Academy special converter
  39, // Academy special sponsor led
  40, // Academy alternative provision converter
  41, // Academy alternative provision sponsor led
  42, // Free school special
  43, // Free school alternative provision
  44, // Free school 16-19
  45, // University technical college
  46, // Studio school
]);
