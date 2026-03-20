/**
 * Canvas Ingest Service — Flexible Data Import
 *
 * Accepts CSV, Excel (xlsx/xls), and JSON data.
 * Parses into a uniform format, then hands off to the field matcher
 * for semantic analysis and source detection.
 *
 * All data is processed IN MEMORY — nothing is stored until
 * the user explicitly approves the field mappings.
 */

import * as XLSX from "xlsx";
import { analyseDataset } from "./field-matcher";
import type { IngestResult, SourceSystem } from "./types";

// ─── File Parsing ──────────────────────────────────────────

/**
 * Parse a file buffer into headers + rows.
 * Supports: CSV, XLSX, XLS, JSON
 */
export function parseFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string,
): { headers: string[]; rows: Record<string, string | number | null>[] } {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mime = mimeType?.toLowerCase() || "";

  if (ext === "csv" || mime.includes("csv") || mime.includes("text/plain")) {
    return parseCsv(buffer);
  }

  if (
    ext === "xlsx" ||
    ext === "xls" ||
    mime.includes("spreadsheet") ||
    mime.includes("excel")
  ) {
    return parseExcel(buffer);
  }

  if (ext === "json" || mime.includes("json")) {
    return parseJson(buffer);
  }

  // Try Excel first (most common), fall back to CSV
  try {
    return parseExcel(buffer);
  } catch {
    return parseCsv(buffer);
  }
}

/**
 * Parse CSV data
 */
function parseCsv(buffer: Buffer): {
  headers: string[];
  rows: Record<string, string | number | null>[];
} {
  const text = buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Detect delimiter (comma, tab, pipe, semicolon)
  const firstLine = lines[0];
  const delimiters = [",", "\t", "|", ";"];
  let delimiter = ",";
  let maxCount = 0;
  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${d}`, "g")) || []).length;
    if (count > maxCount) {
      maxCount = count;
      delimiter = d;
    }
  }

  const headers = splitCsvLine(firstLine, delimiter).map((h) =>
    h.replace(/^["']|["']$/g, "").trim(),
  );

  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    const row: Record<string, string | number | null> = {};
    headers.forEach((h, i) => {
      const val = (values[i] || "").replace(/^["']|["']$/g, "").trim();
      row[h] = val.length === 0 ? null : val;
    });
    return row;
  });

  return { headers, rows };
}

/**
 * Split a CSV line respecting quoted fields
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse Excel file
 */
function parseExcel(buffer: Buffer): {
  headers: string[];
  rows: Record<string, string | number | null>[];
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

  // Use first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };

  const sheet = workbook.Sheets[sheetName];
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: false,
  });

  if (rawData.length === 0) return { headers: [], rows: [] };

  const headers = Object.keys(rawData[0]);
  const rows = rawData.map((raw) => {
    const row: Record<string, string | number | null> = {};
    for (const h of headers) {
      const val = raw[h];
      row[h] =
        val === null || val === undefined
          ? null
          : typeof val === "number"
            ? val
            : String(val);
    }
    return row;
  });

  return { headers, rows };
}

/**
 * Parse JSON array
 */
function parseJson(buffer: Buffer): {
  headers: string[];
  rows: Record<string, string | number | null>[];
} {
  const text = buffer.toString("utf-8");
  const data = JSON.parse(text);

  if (!Array.isArray(data) || data.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((item: Record<string, unknown>) => {
    const row: Record<string, string | number | null> = {};
    for (const h of headers) {
      const val = item[h];
      row[h] =
        val === null || val === undefined
          ? null
          : typeof val === "number"
            ? val
            : String(val);
    }
    return row;
  });

  return { headers, rows };
}

// ─── Full Ingest Pipeline ──────────────────────────────────

/**
 * Full ingest pipeline: parse file → analyse → detect source → match fields
 *
 * @param buffer - Raw file data
 * @param fileName - Original file name (for format detection)
 * @param mimeType - MIME type (optional)
 * @param knownSignatures - Source system signatures from DB (optional)
 * @param knownMappings - Field mapping registry from DB (optional)
 */
export function ingestFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string,
  knownSignatures?: Array<{
    system_name: string;
    export_type: string;
    signature_columns: string[];
    optional_columns?: string[];
    default_mappings: Record<
      string,
      { target_entity: string; target_field: string; confidence: number }
    >;
    match_confidence: number;
  }>,
  knownMappings?: Array<{
    source_system: string;
    source_column: string;
    target_entity: string;
    target_field: string;
    confidence: number;
  }>,
): IngestResult {
  // 1. Parse the file
  const { headers, rows } = parseFile(buffer, fileName, mimeType);

  if (headers.length === 0 || rows.length === 0) {
    return {
      sourceDetection: null,
      columns: [],
      suggestedMappings: [],
      entityType: "staff",
      totalRows: 0,
      warnings: [
        {
          type: "missing_data",
          message: "The file appears to be empty or could not be parsed",
          severity: "error",
        },
      ],
      rawHeaders: [],
      sampleRows: [],
    };
  }

  // 2. Run the full analysis
  return analyseDataset(headers, rows, knownSignatures, knownMappings);
}

/**
 * Ingest from raw text (e.g., pasted CSV data)
 */
export function ingestText(
  text: string,
  knownSignatures?: Parameters<typeof ingestFile>[3],
  knownMappings?: Parameters<typeof ingestFile>[4],
): IngestResult {
  const buffer = Buffer.from(text, "utf-8");
  return ingestFile(
    buffer,
    "pasted_data.csv",
    "text/csv",
    knownSignatures,
    knownMappings,
  );
}
