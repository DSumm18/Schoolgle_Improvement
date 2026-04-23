/**
 * Pupil Data Connector
 *
 * DOMAIN: Pupil Data
 *
 * This connector handles ALL pupil-related data sources:
 * - School Census XMLs (demographics, SEN, EAL, FSM, attendance)
 * - Assessment CTFs/XMLs (EYFSP, Phonics, KS1, KS2)
 * - Class demographic CSVs
 * - SEN register reports
 *
 * The connector automatically detects, parses, and merges ALL pupil data sources.
 * It determines the BEST available source for each data type and tracks source of truth.
 *
 * No other pupil data connectors needed - this is the single source of truth.
 */

import type { FileMetadataExtended } from "@/lib/cloud-service";

// ─── Pupil Data Types ─────────────────────────────────────────

export enum PupilDataSourceType {
  CENSUS_XML = "census_xml",              // School census XML
  ASSESSMENT_EYFSP = "assessment_eyfsp",  // EYFSP results
  ASSESSMENT_PHONICS = "assessment_phonics", // Phonics screening
  ASSESSMENT_KS1 = "assessment_ks1",      // KS1 teacher assessment
  ASSESSMENT_KS2 = "assessment_ks2",      // KS2 results
  DEMOGRAPHICS_CSV = "demographics_csv",  // Class demographic CSV
  SEN_REPORT = "sen_report",              // SEN register report
}

export interface PupilDataFile {
  type: PupilDataSourceType;
  fileId: string;
  fileName: string;
  modifiedTime: string;
  size: number;
  source: "google_drive" | "onedrive" | "local";
  parsed: boolean;
  recordCount?: number;
  dataSummary?: any;
  parseError?: string;
}

export interface PupilDataConnection {
  connectorId: string;
  organizationId: string;
  domain: "PUPIL_DATA";

  // Connection status
  provider: "google_drive" | "onedrive" | "local";
  folderId?: string;
  folderName?: string;
  connected: boolean;
  connectedAt?: string;
  lastScanned?: string;

  // Detected files
  files: PupilDataFile[];

  // Data availability (computed from detected files)
  dataAvailable: {
    demographics: boolean;    // From census or CSV
    assessments: {
      eyfsp: boolean;
      phonics: boolean;
      ks1: boolean;
      ks2: boolean;
    };
    sen: boolean;              // From census or SEN report
    attendance: boolean;       // From census
  };

  // Source of truth tracking
  sourceOfTruth: {
    demographics: string;      // Which file is the source
    assessments: {
      eyfsp?: string;
      phonics?: string;
      ks1?: string;
      ks2?: string;
    };
    sen: string;
    attendance: string;
  };

  // Aggregated stats
  stats: {
    totalPupils: number;
    currentCensusDate?: string;
    assessmentYears: string[];  // ["2021-22", "2022-23", etc.]
  };
}

// ─── File Detection ────────────────────────────────────────────

/**
 * Detect if a file is a pupil data file
 */
export function detectPupilDataFile(file: FileMetadataExtended): PupilDataSourceType | null {
  const name = file.name.toLowerCase();

  // Census XML files
  if (name.includes("census") && name.endsWith(".xml")) {
    return PupilDataSourceType.CENSUS_XML;
  }

  // SPR files (School Pupil Return = census)
  if (name.match(/spr.*\.xml$/) || name.match(/school.*census.*\.xml$/)) {
    return PupilDataSourceType.CENSUS_XML;
  }

  // EYFSP assessment files
  if (name.includes("eyfsp") || (name.includes("fsp") && name.endsWith(".xml"))) {
    return PupilDataSourceType.ASSESSMENT_EYFSP;
  }

  // Phonics files
  if (name.includes("phonics") && (name.endsWith(".xml") || name.endsWith(".ctf"))) {
    return PupilDataSourceType.ASSESSMENT_PHONICS;
  }

  // KS1 files
  if (name.includes("ks1") && (name.endsWith(".xml") || name.endsWith(".ctf"))) {
    return PupilDataSourceType.ASSESSMENT_KS1;
  }

  // KS2 files
  if (name.includes("ks2") && (name.endsWith(".xml") || name.endsWith(".ctf"))) {
    return PupilDataSourceType.ASSESSMENT_KS2;
  }

  // Demographic CSVs
  if (name.match(/class.*demographic/i) || name.match(/pupil.*roll/i)) {
    if (name.endsWith(".csv") || name.endsWith(".xlsx")) {
      return PupilDataSourceType.DEMOGRAPHICS_CSV;
    }
  }

  // SEN reports
  if (name.includes("sen") && (name.endsWith(".csv") || name.endsWith(".xlsx"))) {
    return PupilDataSourceType.SEN_REPORT;
  }

  return null;
}

/**
 * Scan a folder for pupil data files
 */
export async function scanPupilDataFiles(
  files: FileMetadataExtended[]
): Promise<PupilDataFile[]> {
  const pupilDataFiles: PupilDataFile[] = [];

  for (const file of files) {
    const type = detectPupilDataFile(file);
    if (type) {
      pupilDataFiles.push({
        type,
        fileId: file.id,
        fileName: file.name,
        modifiedTime: file.modifiedTime || new Date().toISOString(),
        size: file.size || 0,
        source: file.webViewLink?.includes("drive.google") ? "google_drive" :
              file.webViewLink?.includes("onedrive") ? "onedrive" : "local",
        parsed: false,
      });
    }
  }

  // Sort by type, then by modified time (newest first)
  return pupilDataFiles.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
  });
}

/**
 * Determine source of truth for each data type
 * (Most recent file of each type wins)
 */
export function determineSourceOfTruth(files: PupilDataFile[]): PupilDataConnection["sourceOfTruth"] {
  const sourceOfTruth: PupilDataConnection["sourceOfTruth"] = {
    demographics: "",
    assessments: {},
    sen: "",
    attendance: "",
  };

  // For each data type, find the most recent file
  const filesByType = new Map<PupilDataSourceType, PupilDataFile>();

  for (const file of files) {
    const existing = filesByType.get(file.type);
    if (!existing || new Date(file.modifiedTime) > new Date(existing.modifiedTime)) {
      filesByType.set(file.type, file);
    }
  }

  // Map types to source categories
  const censusFile = filesByType.get(PupilDataSourceType.CENSUS_XML);
  if (censusFile) {
    sourceOfTruth.demographics = censusFile.fileName;
    sourceOfTruth.sen = censusFile.fileName;
    sourceOfTruth.attendance = censusFile.fileName;
  }

  const senFile = filesByType.get(PupilDataSourceType.SEN_REPORT);
  if (senFile && (!censusFile || new Date(senFile.modifiedTime) > new Date(censusFile.modifiedTime))) {
    sourceOfTruth.sen = senFile.fileName;
  }

  const eyfspFile = filesByType.get(PupilDataSourceType.ASSESSMENT_EYFSP);
  if (eyfspFile) {
    sourceOfTruth.assessments.eyfsp = eyfspFile.fileName;
  }

  const phonicsFile = filesByType.get(PupilDataSourceType.ASSESSMENT_PHONICS);
  if (phonicsFile) {
    sourceOfTruth.assessments.phonics = phonicsFile.fileName;
  }

  const ks1File = filesByType.get(PupilDataSourceType.ASSESSMENT_KS1);
  if (ks1File) {
    sourceOfTruth.assessments.ks1 = ks1File.fileName;
  }

  const ks2File = filesByType.get(PupilDataSourceType.ASSESSMENT_KS2);
  if (ks2File) {
    sourceOfTruth.assessments.ks2 = ks2File.fileName;
  }

  return sourceOfTruth;
}

/**
 * Compute data availability from detected files
 */
export function computeDataAvailability(files: PupilDataFile[]): PupilDataConnection["dataAvailable"] {
  const hasType = (type: PupilDataSourceType) => files.some(f => f.type === type);

  return {
    demographics: hasType(PupilDataSourceType.CENSUS_XML) ||
                  hasType(PupilDataSourceType.DEMOGRAPHICS_CSV),
    assessments: {
      eyfsp: hasType(PupilDataSourceType.ASSESSMENT_EYFSP),
      phonics: hasType(PupilDataSourceType.ASSESSMENT_PHONICS),
      ks1: hasType(PupilDataSourceType.ASSESSMENT_KS1),
      ks2: hasType(PupilDataSourceType.ASSESSMENT_KS2),
    },
    sen: hasType(PupilDataSourceType.CENSUS_XML) ||
          hasType(PupilDataSourceType.SEN_REPORT),
    attendance: hasType(PupilDataSourceType.CENSUS_XML),
  };
}

/**
 * Build pupil data connection state
 */
export async function buildPupilDataConnection(
  organizationId: string,
  files: FileMetadataExtended[],
  provider: "google_drive" | "onedrive" | "local",
  folderId?: string,
  folderName?: string
): Promise<PupilDataConnection> {
  const pupilFiles = await scanPupilDataFiles(files);
  const sourceOfTruth = determineSourceOfTruth(pupilFiles);
  const dataAvailable = computeDataAvailability(pupilFiles);

  // Extract stats from parsed files
  const stats = {
    totalPupils: 0, // TODO: Sum from parsed census
    currentCensusDate: undefined as string | undefined,
    assessmentYears: [] as string[],
  };

  // Get census date from most recent census file
  const censusFile = pupilFiles.find(f => f.type === PupilDataSourceType.CENSUS_XML);
  if (censusFile?.dataSummary?.censusDate) {
    stats.currentCensusDate = censusFile.dataSummary.censusDate;
  }

  // Extract assessment years from file names
  const assessmentYears = new Set<string>();
  for (const file of pupilFiles) {
    if (file.type.startsWith("assessment_")) {
      const yearMatch = file.fileName.match(/\d{4}-\d{2}/); // 2021-22 format
      if (yearMatch) {
        assessmentYears.add(yearMatch[0]);
      }
    }
  }
  stats.assessmentYears = Array.from(assessmentYears).sort();

  return {
    connectorId: `pupil_data_${organizationId}`,
    organizationId,
    domain: "PUPIL_DATA",
    provider,
    folderId,
    folderName,
    connected: pupilFiles.length > 0,
    connectedAt: pupilFiles.length > 0 ? new Date().toISOString() : undefined,
    lastScanned: new Date().toISOString(),
    files: pupilFiles,
    dataAvailable,
    sourceOfTruth,
    stats,
  };
}

// ─── Dashboard Template Rendering ─────────────────────────────

/**
 * Determine which dashboard features are available based on data
 */
export function getAvailableDashboardFeatures(connection: PupilDataConnection): string[] {
  const features: string[] = [];

  if (connection.dataAvailable.demographics) {
    features.push("Pupil roll analysis", "SEN trends", "EAL breakdown", "FSM analysis");
  }

  if (connection.dataAvailable.assessments.eyfsp) {
    features.push("EYFSP results", "GLD trends", "Cohort comparison", "Reception baseline");
  }

  if (connection.dataAvailable.assessments.phonics) {
    features.push("Phonics screening", "Year 1 pass rates", "Retake analysis");
  }

  if (connection.dataAvailable.assessments.ks1) {
    features.push("KS1 attainment", "R/W/M breakdown", "Greater Depth", "Progress measures");
  }

  if (connection.dataAvailable.assessments.ks2) {
    features.push("KS2 SATs results", "Progress scores", "National comparison");
  }

  if (connection.dataAvailable.attendance) {
    features.push("Attendance trends", "Persistent absence", "Attendance by cohort");
  }

  if (connection.dataAvailable.sen) {
    features.push("SEN provision analysis", "EHCP tracking", "Need type breakdown");
  }

  // Cross-cutting features that need multiple data sources
  if (connection.dataAvailable.demographics && connection.dataAvailable.assessments.eyfsp) {
    features.push("Ofsted defence analysis", "Disaggregated results", "Impact of SEN on outcomes");
  }

  if (connection.dataAvailable.demographics && connection.dataAvailable.attendance) {
    features.push("Attendance vs attainment", "Vulnerable group analysis");
  }

  if (connection.dataAvailable.assessments.eyfsp && connection.dataAvailable.assessments.ks1) {
    features.push("Cohort tracking (EYFSP → KS1)", "Progress validation", "Assessment accuracy checks");
  }

  if (connection.dataAvailable.assessments.ks1 && connection.dataAvailable.assessments.ks2) {
    features.push("Cohort tracking (KS1 → KS2)", "Progress scores analysis");
  }

  return features;
}
