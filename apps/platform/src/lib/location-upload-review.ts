import { LOCATION_TYPES, normaliseLocationType } from "./location-upload";

export type LocationUploadReviewRow = {
  rowNumber: number;
  location_code: string;
  location_name: string;
  location_type: string;
  parent_location_code: string;
  current_use: string;
  area_sqm: string;
  capacity: string;
};

export type LocationUploadReview = {
  filename: string;
  csvText: string;
  headerRow: number;
  totalRows: number;
  validRows: number;
  errors: string[];
  warnings: string[];
  sampleRows: LocationUploadReviewRow[];
  stats: {
    types: Array<{ value: string; count: number }>;
    tbcCount: number;
    parentLinks: number;
  };
};

const REQUIRED_FIELDS = ["location_code", "location_name"];

export function reviewLocationUploadCsv(csvText: string, filename = "locations-upload.csv"): LocationUploadReview {
  const lines = csvText
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, rowNumber: index + 1 }))
    .filter((line) => line.raw.trim() && !line.raw.trim().startsWith("#"));

  const emptyReview: LocationUploadReview = {
    filename,
    csvText,
    headerRow: 0,
    totalRows: 0,
    validRows: 0,
    errors: ["File needs a header row and at least one location row."],
    warnings: [],
    sampleRows: [],
    stats: { types: [], tbcCount: 0, parentLinks: 0 },
  };

  if (lines.length < 2) return emptyReview;

  const header = findHeader(lines);
  if (header.missing.length > 0) {
    return {
      ...emptyReview,
      headerRow: lines[header.headerLineIndex]?.rowNumber ?? 0,
      errors: [`Missing required columns: ${header.missing.join(", ")}`],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: LocationUploadReviewRow[] = [];
  const seenCodes = new Map<string, number>();

  lines.slice(header.headerLineIndex + 1).forEach((line) => {
    const values = splitCsvLine(line.raw);
    const raw: Record<string, string> = {};
    header.headers.forEach((field, index) => {
      raw[field] = values[index]?.trim() ?? "";
    });

    for (const field of REQUIRED_FIELDS) {
      if (!raw[field]) errors.push(`Row ${line.rowNumber}: ${field} is required.`);
    }

    const code = raw.location_code?.trim().toUpperCase() ?? "";
    if (code) {
      const earlierRow = seenCodes.get(code);
      if (earlierRow) errors.push(`Row ${line.rowNumber}: duplicate location_code also used on row ${earlierRow}.`);
      else seenCodes.set(code, line.rowNumber);
    }

    const normalisedType = normaliseLocationType(raw.location_type);
    if (raw.location_type && normalisedType === "TBC / Other" && raw.location_type.trim().toLowerCase() !== "tbc / other") {
      warnings.push(`Row ${line.rowNumber}: location_type "${raw.location_type}" is not in the controlled list and will import as TBC / Other.`);
    }
    if (!raw.location_type) warnings.push(`Row ${line.rowNumber}: location_type is blank and will import as TBC / Other.`);
    if (values.length > header.headers.length) warnings.push(`Row ${line.rowNumber}: has extra columns that will be ignored.`);

    rows.push({
      rowNumber: line.rowNumber,
      location_code: code,
      location_name: raw.location_name || "",
      location_type: normalisedType,
      parent_location_code: raw.parent_location_code?.trim().toUpperCase() || "",
      current_use: raw.current_use || "",
      area_sqm: raw.area_sqm || "",
      capacity: raw.capacity || "",
    });
  });

  return {
    filename,
    csvText,
    headerRow: lines[header.headerLineIndex].rowNumber,
    totalRows: rows.length,
    validRows: Math.max(0, rows.length - rowsWithErrors(errors).size),
    errors,
    warnings,
    sampleRows: pickSampleRows(rows),
    stats: {
      types: countValues(rows.map((row) => row.location_type)),
      tbcCount: rows.filter((row) => row.location_type === "TBC / Other").length,
      parentLinks: rows.filter((row) => row.parent_location_code).length,
    },
  };
}

function findHeader(lines: Array<{ raw: string; rowNumber: number }>) {
  for (let index = 0; index < Math.min(lines.length, 8); index += 1) {
    const headers = splitCsvLine(lines[index].raw).map(normaliseHeader);
    const missing = REQUIRED_FIELDS.filter((field) => !headers.includes(field));
    if (missing.length === 0) return { headers, headerLineIndex: index, missing };
  }
  const headers = splitCsvLine(lines[0].raw).map(normaliseHeader);
  return { headers, headerLineIndex: 0, missing: REQUIRED_FIELDS.filter((field) => !headers.includes(field)) };
}

function rowsWithErrors(errors: string[]) {
  const rows = new Set<number>();
  errors.forEach((error) => {
    const match = error.match(/^Row\s+(\d+):/);
    if (match) rows.add(Number(match[1]));
  });
  return rows;
}

function pickSampleRows(rows: LocationUploadReviewRow[]) {
  if (rows.length <= 5) return rows;
  if (rows.length <= 10) return rows.slice(0, 5);
  const rowFiveIndex = rows.findIndex((row) => row.rowNumber === 5);
  const indexes = [0, rowFiveIndex >= 0 ? rowFiveIndex : 4, Math.floor(rows.length * 0.25), Math.floor(rows.length * 0.5), rows.length - 1];
  return [...new Set(indexes)].map((index) => rows[index]).filter(Boolean);
}

function countValues(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function normaliseHeader(header: string) {
  return header.toLowerCase().trim().replace(/\*/g, "").replace(/[\s-]+/g, "_");
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

export function locationTypeOptionsForReview() {
  return LOCATION_TYPES;
}
