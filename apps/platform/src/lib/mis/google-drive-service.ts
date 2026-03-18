/**
 * Google Drive MIS Data Service
 *
 * Reads school MIS data from a connected Google Drive folder.
 * Uses the school_data_connections table to find the right folder,
 * then downloads and parses Excel files in memory.
 *
 * GDPR: Data is processed in memory only — never stored in Supabase.
 * Schools retain full data sovereignty. Revoking Drive access = instant removal.
 */

import * as XLSX from "xlsx";
import type {
  IMISDataService,
  MISDataType,
  MISDataSource,
  MISReadResult,
} from "./types";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Map data types to expected folder paths (case-insensitive matching)
const CATEGORY_TO_FOLDER: Record<MISDataType, string[]> = {
  pupils: ["pupil data", "pupil roll", "pupils"],
  attendance: ["attendance"],
  statutory_results: ["assessments", "statutory", "results"],
  termly_assessments: ["assessments", "tracker"],
  behaviour: ["behaviour", "behavior"],
  staff: ["staff", "hr", "staff & hr"],
  teacher_class_history: ["staff", "hr", "staff & hr"],
  sen_register: ["pupil data", "sen", "send"],
  historical_ks2: ["dfe", "external", "dfe & external data"],
};

// File name patterns to identify data types
const FILE_PATTERNS: Record<MISDataType, RegExp[]> = {
  pupils: [/pupil.?roll/i, /pupil.?data/i, /student.?list/i],
  attendance: [/attendance/i],
  statutory_results: [/statutory/i, /ks[12]/i, /eyfs/i, /phonics/i],
  termly_assessments: [
    /tracker/i,
    /insight/i,
    /otrak/i,
    /target/i,
    /assessment/i,
  ],
  behaviour: [/behaviour/i, /behavior/i, /incident/i],
  staff: [/staff/i, /employee/i, /personnel/i],
  teacher_class_history: [
    /teacher.?class/i,
    /class.?history/i,
    /teaching.?history/i,
  ],
  sen_register: [/sen.?register/i, /send/i, /sen_register/i],
  historical_ks2: [/ks2/i, /historical/i, /dfe/i],
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

export class GoogleDriveMISDataService implements IMISDataService {
  private connectionCache: Map<
    string,
    {
      folderId: string;
      detectedFolders: Record<
        string,
        { category: string; files: number; folderId: string }
      >;
    }
  > = new Map();

  /**
   * Get the connection details for an organization.
   * Caches the result to avoid repeated DB queries within a request.
   */
  private async getConnection(organizationId: string) {
    if (this.connectionCache.has(organizationId)) {
      return this.connectionCache.get(organizationId)!;
    }

    // Dynamic import to avoid circular deps
    const { createServiceRoleClient } = await import("@/lib/supabase-server");
    const supabase = createServiceRoleClient();

    const { data } = await supabase
      .from("school_data_connections")
      .select("folder_id, detected_folders")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .eq("provider", "google")
      .single();

    if (!data) {
      throw new Error(
        "No Google Drive connection found. Please connect your Drive in Settings → Data Connections.",
      );
    }

    const conn = {
      folderId: data.folder_id,
      detectedFolders: (data.detected_folders || {}) as Record<
        string,
        { category: string; files: number; folderId: string }
      >,
    };

    this.connectionCache.set(organizationId, conn);
    return conn;
  }

  /**
   * Find the Drive folder ID for a given data category
   */
  private findFolderForCategory(
    detectedFolders: Record<
      string,
      { category: string; files: number; folderId: string }
    >,
    dataType: MISDataType,
  ): string | null {
    // Map MIS data types to scan categories
    const categoryMap: Record<MISDataType, string[]> = {
      pupils: ["pupils"],
      attendance: ["attendance"],
      statutory_results: ["assessments"],
      termly_assessments: ["assessments"],
      behaviour: ["behaviour"],
      staff: ["staff"],
      teacher_class_history: ["staff"],
      sen_register: ["pupils"],
      historical_ks2: ["dfe"],
    };

    const targetCategories = categoryMap[dataType] || [];

    for (const [_, info] of Object.entries(detectedFolders)) {
      if (targetCategories.includes(info.category)) {
        return info.folderId;
      }
    }

    return null;
  }

  /**
   * Find the best matching file in a Drive folder for a data type
   */
  private async findFileInFolder(
    folderId: string,
    dataType: MISDataType,
  ): Promise<DriveFile | null> {
    if (!GOOGLE_API_KEY) return null;

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
        new URLSearchParams({
          key: GOOGLE_API_KEY,
          q: `'${folderId}' in parents and trashed = false and (mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'text/csv' or mimeType = 'application/vnd.ms-excel')`,
          fields: "files(id,name,mimeType,modifiedTime)",
          orderBy: "modifiedTime desc",
          pageSize: "20",
          supportsAllDrives: "true",
          includeItemsFromAllDrives: "true",
        }),
    );

    if (!res.ok) return null;

    const data = await res.json();
    const files: DriveFile[] = data.files || [];

    // Match by file name pattern
    const patterns = FILE_PATTERNS[dataType] || [];
    for (const file of files) {
      for (const pattern of patterns) {
        if (pattern.test(file.name)) return file;
      }
    }

    // If only one file in folder, use it
    if (files.length === 1) return files[0];

    // Return most recently modified spreadsheet
    return files[0] || null;
  }

  /**
   * Download and parse a file from Google Drive
   */
  private async downloadFile(fileId: string): Promise<XLSX.WorkBook> {
    if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`,
    );

    if (!res.ok) {
      throw new Error(
        `Failed to download file: ${res.status} ${res.statusText}`,
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return XLSX.read(buffer, { type: "buffer" });
  }

  async read<T>(
    organizationId: string,
    dataType: MISDataType,
  ): Promise<MISReadResult<T>> {
    const conn = await this.getConnection(organizationId);
    const folderId = this.findFolderForCategory(conn.detectedFolders, dataType);

    if (!folderId) {
      return {
        data: [],
        source: { type: "google_drive", lastUpdated: new Date().toISOString() },
        recordCount: 0,
        warnings: [
          `No folder found for ${dataType}. Please check your Google Drive folder structure.`,
        ],
      };
    }

    const file = await this.findFileInFolder(folderId, dataType);

    if (!file) {
      return {
        data: [],
        source: { type: "google_drive", lastUpdated: new Date().toISOString() },
        recordCount: 0,
        warnings: [
          `No matching file found for ${dataType} in connected Drive folder.`,
        ],
      };
    }

    const workbook = await this.downloadFile(file.id);

    // Import the transform functions from data-service (they're the same regardless of source)
    const { transformData } = await import("./data-transforms");

    let rawData: Record<string, unknown>[] = [];

    if (dataType === "statutory_results") {
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as Record<
          string,
          unknown
        >[];
        rawData = rawData.concat(rows);
      }
    } else {
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      rawData = XLSX.utils.sheet_to_json(firstSheet) as Record<
        string,
        unknown
      >[];
    }

    const allData = transformData<T>(dataType, rawData);

    return {
      data: allData,
      source: {
        type: "google_drive",
        lastUpdated: file.modifiedTime,
        fileName: file.name,
        driveFileId: file.id,
      },
      recordCount: allData.length,
      warnings: [],
    };
  }

  async getAvailableSources(
    organizationId: string,
  ): Promise<Record<MISDataType, MISDataSource | null>> {
    const result = {} as Record<MISDataType, MISDataSource | null>;
    const allTypes: MISDataType[] = [
      "pupils",
      "attendance",
      "statutory_results",
      "termly_assessments",
      "behaviour",
      "staff",
      "teacher_class_history",
      "sen_register",
      "historical_ks2",
    ];

    try {
      const conn = await this.getConnection(organizationId);

      for (const dataType of allTypes) {
        const folderId = this.findFolderForCategory(
          conn.detectedFolders,
          dataType,
        );
        if (folderId) {
          const file = await this.findFileInFolder(folderId, dataType);
          result[dataType] = file
            ? {
                type: "google_drive",
                lastUpdated: file.modifiedTime,
                fileName: file.name,
                driveFileId: file.id,
              }
            : null;
        } else {
          result[dataType] = null;
        }
      }
    } catch {
      for (const dataType of allTypes) {
        result[dataType] = null;
      }
    }

    return result;
  }

  async hasData(
    organizationId: string,
    dataType: MISDataType,
  ): Promise<boolean> {
    try {
      const conn = await this.getConnection(organizationId);
      const folderId = this.findFolderForCategory(
        conn.detectedFolders,
        dataType,
      );
      if (!folderId) return false;
      const file = await this.findFileInFolder(folderId, dataType);
      return !!file;
    } catch {
      return false;
    }
  }
}
