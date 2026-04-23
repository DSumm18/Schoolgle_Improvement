/**
 * Census XML Parser
 *
 * Parses DfE-standard school census XML files.
 * Extracts pupil demographics, SEN status, attendance, EAL, etc.
 *
 * DfE census schema: https://www.gov.uk/government/collections/school-census
 */

import type {
  CensusPupil,
  CensusTerm,
  CensusHistory,
  DataSourceConnection,
  DataSourceStatus,
  DataSourceType,
} from "../types";
import type { FileMetadataExtended } from "@/lib/cloud-service";

// ─── XML Parser Utilities ─────────────────────────────────────

function parseBoolean(value: string): boolean {
  return value?.toUpperCase() === "TRUE" || value === "1" || value?.toUpperCase() === "Y";
}

function parseDfECode(value: string): string {
  // DfE ethnicity codes: WHITE, WIRT, WIRTR, WOTH, etc.
  return value?.trim() || "";
}

function calculateAge(dob: string, censusDate: string): number {
  const birth = new Date(dob);
  const census = new Date(censusDate);
  let age = census.getFullYear() - birth.getFullYear();
  const monthDiff = census.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && census.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function isSummerBorn(dob: string): boolean {
  const month = new Date(dob).getMonth() + 1; // 1-12
  return month >= 4 && month <= 8; // Apr-Aug
}

function getYearGroupFromAge(age: number, ncYear: boolean): number {
  if (!ncYear) return age; // Nursery years

  // Reception = age 4-5, Year 1 = age 5-6, etc.
  const yearGroup = age - 4;
  return Math.max(0, Math.min(14, yearGroup)); // Clamp to valid range
}

function extractPostcodeDistrict(postcode?: string): string | undefined {
  if (!postcode) return undefined;

  // Extract outward code: BD2, LS1, SW1A, etc.
  const match = postcode.match(/^([A-Z]{1,2}\d[A-Z\d]?)[\s\d]/i);
  return match ? match[1].toUpperCase() : undefined;
}

// ─── Census XML Parser ────────────────────────────────────────

interface CensusXMLData {
  school?: {
    name?: string;
    urn?: string;
    laCode?: number;
    estab?: number;
  };
  pupils: Array<{
    upn?: string;
    surname?: string;
    forename?: string;
    gender?: string;
    dob?: string;
    homePostcode?: string;
    ncYearActual?: string; // "Y" or "N"
    yearGroup?: string; // "R", "1", "2", etc.
    senProvision?: string; // "E", "K", "N"
    senUnitIndicator?: string; // "Y" or "N"
    fsmEligible?: string;
    pupilPremiumEver?: string; // Ever 6 FSM
    eal?: string; // "Y" or "N"
    ethnicity?: string;
    homeLanguage?: string;
    admissionDate?: string;
    enrolmentStatus?: string; // "C" = current, "L" = leaver
    sessionsPossible?: string;
    sessionsAttended?: string;
    authorisedAbsence?: string;
    unauthorisedAbsence?: string;
  }>;
  census?: {
    term?: string; // "Spring", "Summer", "Autumn"
    year?: string;
    date?: string;
  };
}

function parseCensusXML(xmlContent: string): CensusXMLData {
  // Simple XML parser for DfE census schema
  // In production, use a proper XML parser library

  const data: CensusXMLData = { pupils: [] };

  // Extract school details
  const schoolMatch = xmlContent.match(/<School[^>]*>([\s\S]*?)<\/School>/i);
  if (schoolMatch) {
    const schoolContent = schoolMatch[1];
    data.school = {
      name: extractField(schoolContent, "EstabName"),
      urn: extractField(schoolContent, "URN"),
      laCode: parseInt(extractField(schoolContent, "LEA") || "0"),
      estab: parseInt(extractField(schoolContent, "Estab") || "0"),
    };
  }

  // Extract census metadata
  const censusMetaMatch = xmlContent.match(/<Census[^>]*>([\s\S]*?)<\/Census>/i);
  if (censusMetaMatch) {
    const censusContent = censusMetaMatch[1];
    data.census = {
      term: extractField(censusContent, "Term"),
      year: extractField(censusContent, "Year"),
      date: extractField(censusContent, "CensusDate"),
    };
  }

  // Extract pupil records
  const pupilMatches = xmlContent.matchAll(/<Pupil[^>]*>([\s\S]*?)<\/Pupil>/gi);
  for (const match of pupilMatches) {
    const pupilContent = match[1];

    data.pupils.push({
      upn: extractField(pupilContent, "UPN"),
      surname: extractField(pupilContent, "Surname"),
      forename: extractField(pupilContent, "Forename"),
      gender: extractField(pupilContent, "Gender"),
      dob: extractField(pupilContent, "DOB"),
      homePostcode: extractField(pupilContent, "HomePostcode"),
      ncYearActual: extractField(pupilContent, "NCYearActual"),
      yearGroup: extractField(pupilContent, "YearGroup"),
      senProvision: extractField(pupilContent, "SENProvision"),
      senUnitIndicator: extractField(pupilContent, "SENUnitIndicator"),
      fsmEligible: extractField(pupilContent, "FSMEligible"),
      pupilPremiumEver: extractField(pupilContent, "PupilPremiumEver6"),
      eal: extractField(pupilContent, "EAL"),
      ethnicity: extractField(pupilContent, "Ethnicity"),
      homeLanguage: extractField(pupilContent, "HomeLanguage"),
      admissionDate: extractField(pupilContent, "AdmissionDate"),
      enrolmentStatus: extractField(pupilContent, "EnrolmentStatus"),
      sessionsPossible: extractField(pupilContent, "SessionsPossible"),
      sessionsAttended: extractField(pupilContent, "SessionsAttended"),
      authorisedAbsence: extractField(pupilContent, "AuthAbsence"),
      unauthorisedAbsence: extractField(pupilContent, "UnauthAbsence"),
    });
  }

  return data;
}

function extractField(content: string, fieldName: string): string {
  const regex = new RegExp(`<${fieldName}[^>]*>([^<]*)</${fieldName}>`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

// ─── Transform to Canonical Format ───────────────────────────

function transformCensusPupil(raw: CensusXMLData["pupils"][0], censusDate: string): CensusPupil | null {
  if (!raw.upn || raw.enrolmentStatus === "L") {
    return null; // Skip leavers or missing UPN
  }

  const dob = raw.dob ? raw.dob.split("/").reverse().join("-") : ""; // Convert DD/MM/YYYY to ISO
  const admissionDate = raw.admissionDate ? raw.admissionDate.split("/").reverse().join("-") : "";
  const ncYear = parseBoolean(raw.ncYearActual);
  const age = calculateAge(dob, censusDate);
  const yearGroup = raw.yearGroup === "R" ? 0 : parseInt(raw.yearGroup || "0");

  // Calculate attendance percentage
  const sessionsPossible = parseInt(raw.sessionsPossible || "0");
  const sessionsAttended = parseInt(raw.sessionsAttended || "0");
  const attendancePercentage = sessionsPossible > 0 ? (sessionsAttended / sessionsPossible) * 100 : undefined;
  const persistentAbsentee = attendancePercentage !== undefined && attendancePercentage < 90;

  return {
    upn: raw.upn,
    fullName: `${raw.surname}, ${raw.forename}`,
    firstName: raw.forename || "",
    lastName: raw.surname || "",
    gender: raw.gender === "M" ? "M" : "F",
    dob,
    yearGroup,
    ncYear,
    senProvision: raw.senProvision || "N",
    senUnitIndicator: parseBoolean(raw.senUnitIndicator),
    fsmEligible: parseBoolean(raw.fsmEligible),
    pupilPremium: parseBoolean(raw.pupilPremiumEver),
    eal: parseBoolean(raw.eal),
    ethnicity: parseDfECode(raw.ethnicity),
    homeLanguage: raw.homeLanguage,
    admissionDate,
    isSummerBorn: isSummerBorn(dob),
    postcode: raw.homePostcode,
    postcodeDistrict: extractPostcodeDistrict(raw.homePostcode),
    persistentAbsentee,
    attendancePercentage,
  };
}

function transformCensusTerm(xmlData: CensusXMLData): CensusTerm {
  const pupils = xmlData.pupils
    .map(p => transformCensusPupil(p, xmlData.census?.date || new Date().toISOString()))
    .filter((p): p is CensusPupil => p !== null);

  const senCount = pupils.filter(p => p.senProvision === "E" || p.senProvision === "K").length;
  const fsmCount = pupils.filter(p => p.fsmEligible).length;
  const ealCount = pupils.filter(p => p.eal).length;

  return {
    term: xmlData.census?.term || "Unknown",
    year: parseInt(xmlData.census?.year || new Date().getFullYear().toString()),
    censusDate: xmlData.census?.date || new Date().toISOString(),
    pupils,
    totalOnRoll: pupils.length,
    senCount,
    senPercentage: (senCount / pupils.length) * 100,
    fsmCount,
    fsmPercentage: (fsmCount / pupils.length) * 100,
    ealCount,
    ealPercentage: (ealCount / pupils.length) * 100,
  };
}

// ─── Main Parser Function ──────────────────────────────────────

export interface CensusParseResult {
  success: boolean;
  term?: CensusTerm;
  schoolName?: string;
  schoolURN?: string;
  pupilCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Parse a DfE census XML file
 */
export async function parseCensusXML(
  xmlContent: string,
  sourceFile: FileMetadataExtended
): Promise<CensusParseResult> {
  const result: CensusParseResult = {
    success: false,
    pupilCount: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Parse XML
    const xmlData = parseCensusXML(xmlContent);

    if (!xmlData.pupils.length) {
      result.errors.push("No pupil records found in XML file");
      return result;
    }

    // Transform to canonical format
    const term = transformCensusTerm(xmlData);

    result.success = true;
    result.term = term;
    result.schoolName = xmlData.school?.name;
    result.schoolURN = xmlData.school?.urn;
    result.pupilCount = term.totalOnRoll;

    // Add warnings for data quality issues
    const missingUPNs = xmlData.pupils.filter(p => !p.upn).length;
    if (missingUPNs > 0) {
      result.warnings.push(`${missingUPNs} pupils missing UPN - excluded from analysis`);
    }

    const leavers = xmlData.pupils.filter(p => p.enrolmentStatus === "L").length;
    if (leavers > 0) {
      result.warnings.push(`${leavers} leavers excluded from current roll`);
    }

  } catch (error) {
    result.errors.push(`Failed to parse census XML: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return result;
}

/**
 * Parse multiple census XMLs and build history
 */
export async function parseCensusHistory(
  files: Array<{ content: string; metadata: FileMetadataExtended }>
): Promise<CensusHistory> {
  const terms: CensusTerm[] = [];

  for (const file of files) {
    const result = await parseCensusXML(file.content, file.metadata);
    if (result.success && result.term) {
      terms.push(result.term);
    }
  }

  // Sort by date
  terms.sort((a, b) => new Date(a.censusDate).getTime() - new Date(b.censusDate).getTime());

  const mostRecent = terms[terms.length - 1];

  return {
    schoolName: mostRecent?.pupils[0]?.fullName ? undefined : files[0]?.metadata.folderPath?.split(">")[0],
    terms,
    currentTerm: mostRecent,
  };
}

/**
 * Detect if a file is a census XML by name
 */
export function isCensusFile(fileName: string): boolean {
  const patterns = [
    /census.*\.xml$/i,
    /school_census.*\.xml$/i,
    /spr.*\.xml$/i, // School Pupil Return
    /summer.*census.*\.xml$/i,
    /spring.*census.*\.xml$/i,
    /autumn.*census.*\.xml$/i,
  ];

  return patterns.some(pattern => pattern.test(fileName));
}
