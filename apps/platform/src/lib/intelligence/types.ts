/**
 * Intelligence Module Types
 *
 * Assessment Intelligence data types and templates.
 * Works with DfE-standard census XML and assessment CTF/XML files.
 */

// ─── Data Source Types ────────────────────────────────────────

export enum DataSourceType {
  CENSUS_SCHOOL = "census_school", // School census XML
  CENSUS_WORKFORCE = "census_workforce", // Workforce census XML
  ASSESSMENT_EYFSP = "assessment_eyfsp", // EYFSP results
  ASSESSMENT_PHONICS = "assessment_phonics", // Phonics screening check
  ASSESSMENT_KS1 = "assessment_ks1", // KS1 teacher assessment
  ASSESSMENT_KS2 = "assessment_ks2", // KS2 results
  ASSESSMENT_MTC = "assessment_mtc", // Multiplication tables check
  DEMOGRAPHICS_CSV = "demographics_csv", // Class demographic CSVs
  SEN_REPORT = "sen_report", // SEN register report
}

export enum DataSourceStatus {
  CONNECTED = "connected", // File found and parsed successfully
  PARTIAL = "partial", // File found but some data missing/incomplete
  MISSING = "missing", // File not found
  ERROR = "error", // File found but parsing failed
}

export interface DataSourceConnection {
  type: DataSourceType;
  status: DataSourceStatus;
  fileName?: string;
  lastModified?: string; // ISO date
  recordCount?: number;
  fileMetadata?: {
    fileId: string;
    source: "google_drive" | "onedrive" | "local";
    webViewLink?: string;
  };
  error?: string;
  unlocks?: string[]; // Features this data source enables
}

// ─── Census Data Types ─────────────────────────────────────────

export interface CensusPupil {
  upn: string;
  fullName: string; // "Surname, Forename"
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  dob: string; // ISO date
  yearGroup: number; // 0-14 (R-Y14)
  ncYear: boolean; // National Curriculum year
  senProvision?: string; // "E", "K", "N" (EHCP, SEN Support, None)
  senUnitIndicator?: boolean; // Resourced provision
  fsmEligible: boolean;
  pupilPremium: boolean;
  eal: boolean;
  ethnicity: string; // DfE codes
  homeLanguage?: string;
  admissionDate: string; // ISO date
  isSummerBorn: boolean;
  postcode?: string;
  postcodeDistrict?: string; // BD2, LS1, etc.
  persistentAbsentee?: boolean; // <90% attendance
  attendancePercentage?: number;
}

export interface CensusTerm {
  term: string; // "Spring", "Summer", "Autumn"
  year: number; // 2021, 2022, etc.
  censusDate: string; // ISO date
  pupils: CensusPupil[];
  totalOnRoll: number;
  senCount: number;
  senPercentage: number;
  fsmCount: number;
  fsmPercentage: number;
  ealCount: number;
  ealPercentage: number;
}

export interface CensusHistory {
  schoolName?: string;
  schoolURN?: string;
  laCode?: number;
  establishmentNumber?: number;
  terms: CensusTerm[];
  currentTerm?: CensusTerm;
}

// ─── Assessment Data Types ─────────────────────────────────────

export type AttainmentLevel = "PKF" | "WTS" | "EXS" | "GDS" | "EMG" | "EXP" | "HNM";

export interface EYFSPResult {
  upn: string;
  firstName: string;
  lastName: string;
  yearGroup: number;
  academicYear: string; // "2021-22"
  gld: boolean; // Good Level of Development
  elgs: Record<string, "EMG" | "EXP">; // 17 early learning goals
  totalPoints?: number;
}

export interface PhonicsResult {
  upn: string;
  firstName: string;
  lastName: string;
  yearGroup: number;
  academicYear: string;
  mark: number; // 0-40
  metThreshold: boolean; // 32+ = pass
  retake?: boolean;
}

export interface KS1Result {
  upn: string;
  firstName: string;
  lastName: string;
  yearGroup: number;
  academicYear: string;
  reading: AttainmentLevel;
  writing: AttainmentLevel;
  maths: AttainmentLevel;
  science: AttainmentLevel;
  combined?: "EXS+" | "not_met"; // Working at expected standard in R/W/M
}

export interface KS2Result {
  upn: string;
  firstName: string;
  lastName: string;
  yearGroup: number;
  academicYear: string;
  readingScaled: number; // 80-120
  readingMet: boolean; // 100+
  mathsScaled: number;
  mathsMet: boolean;
  gpsScaled: number; // Grammar, punctuation, spelling
  gpsMet: boolean;
  writingTA: AttainmentLevel;
  scienceTA: "Met" | "Not Met";
  combinedRWMMet: boolean; // Met expected in reading, writing & maths
  progressScore?: {
    reading: number;
    writing: number;
    maths: number;
  };
}

// ─── School Context & Analytics ────────────────────────────────

export interface SchoolContext {
  name: string;
  urn: string;
  laCode?: number;
  phase: "Primary" | "Secondary" | "All-through";
  ofstedRating?: string;
  nor: number; // Number on roll
  fsmPercentage: number;
  senPercentage: number;
  ealPercentage: number;
  ppPercentage: number;
  resourcedProvisions?: string[]; // ["VI", "ASD", "HI"] - auto-detected from census
  postcodeDistrict?: string;
  imdDecile?: number; // Indices of Multiple Deprivation
}

export interface CohortDNA {
  yearGroup: number;
  academicYear: string;
  cohortSize: number;
  senPercentage: number;
  fsmPercentage: number;
  ealPercentage: number;
  summerBornPercentage: number;
  ehcpCount: number;
  senSupportCount: number;
  resourcedProvisionCount: number;
}

export interface AssessmentTrend {
  year: number;
  gldPercentage?: number;
  phonicsPassPercentage?: number;
  ks1CombinedPercentage?: number;
  ks2CombinedPercentage?: number;
  cohortSize?: number;
  senPercentage?: number;
}

export interface PupilJourney {
  upn: string;
  name: string;
  currentYearGroup?: number;
  onRoll: boolean; // Still at school
  censusAppearances: number;
  firstSeen: string; // ISO date
  lastSeen: string; // ISO date
  senStatusHistory: Array<{
    term: string;
    provision: string;
  }>;
  attendanceHistory?: Array<{
    term: string;
    percentage: number;
    persistentAbsentee: boolean;
  }>;
  assessmentResults?: {
    eyfsp?: EYFSPResult;
    phonics?: PhonicsResult[];
    ks1?: KS1Result;
    ks2?: KS2Result;
  };
}

// ─── Intelligence Dashboard State ─────────────────────────────

export interface IntelligenceState {
  dataSources: Record<DataSourceType, DataSourceConnection>;
  censusHistory?: CensusHistory;
  schoolContext?: SchoolContext;
  assessments: {
    eyfsp?: EYFSPResult[];
    phonics?: PhonicsResult[];
    ks1?: KS1Result[];
    ks2?: KS2Result[];
  };
  lastRefreshed?: string; // ISO datetime
}

// ─── Template Types ───────────────────────────────────────────

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  requiredDataSources: DataSourceType[];
  optionalDataSources: DataSourceType[];
  features: string[];
}
