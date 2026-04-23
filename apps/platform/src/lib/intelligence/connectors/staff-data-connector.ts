/**
 * Staff Data Connector
 *
 * DOMAIN: Staff Data
 *
 * This connector handles ALL staff-related data sources:
 * - Workforce Census XMLs
 * - HR exports (staff list, qualifications, training, absences)
 *
 * The connector automatically detects and merges ALL staff data sources.
 * Determines the BEST available source for each data type.
 */

import type { FileMetadataExtended } from "@/lib/cloud-service";

export enum StaffDataSourceType {
  WORKFORCE_CENSUS = "workforce_census",
  STAFF_EXPORT = "staff_export",
  ABSENCE_EXPORT = "absence_export",
  TRAINING_EXPORT = "training_export",
}

export interface StaffDataFile {
  type: StaffDataSourceType;
  fileId: string;
  fileName: string;
  modifiedTime: string;
  source: "google_drive" | "onedrive" | "local";
}

export interface StaffDataConnection {
  connectorId: string;
  organizationId: string;
  domain: "STAFF_DATA";
  provider: "google_drive" | "onedrive" | "local";
  connected: boolean;
  files: StaffDataFile[];
  dataAvailable: {
    staffList: boolean;
    qualifications: boolean;
    training: boolean;
    absences: boolean;
  };
}

/**
 * Detect if a file is a staff data file
 */
export function detectStaffDataFile(file: FileMetadataExtended): StaffDataSourceType | null {
  const name = file.name.toLowerCase();

  if (name.includes("workforce") && name.includes("census")) {
    return StaffDataSourceType.WORKFORCE_CENSUS;
  }

  if (name.includes("staff") && (name.endsWith(".csv") || name.endsWith(".xlsx"))) {
    return StaffDataSourceType.STAFF_EXPORT;
  }

  if (name.includes("absence") && (name.endsWith(".csv") || name.endsWith(".xlsx"))) {
    return StaffDataSourceType.ABSENCE_EXPORT;
  }

  if (name.includes("training") && (name.endsWith(".csv") || name.endsWith(".xlsx"))) {
    return StaffDataSourceType.TRAINING_EXPORT;
  }

  return null;
}
