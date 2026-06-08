import {
  normaliseClassName,
  normalisePupilName,
  normaliseSendStatus,
  normaliseYearGroup,
} from "./pupil-data-normalise";

export type PupilUploadReviewRow = {
  rowNumber: number;
  pupil_id: string;
  source_pupil_ref: string;
  first_name: string;
  last_name: string;
  year_group: string;
  current_class: string;
  gender: string;
  send_status: string;
  ehcp: string;
  primary_need: string;
  fsm_eligible: string;
  eal: string;
  pupil_premium: string;
  is_active: string;
  pass_colour: string;
  pass_animal: string;
  pass_badge: string;
  class_source: "imported_class" | "year_group_fallback";
  class_assignment_status: "ready" | "needs_review";
};

export type PupilUploadReview = {
  filename: string;
  csvText: string;
  headerRow: number;
  totalRows: number;
  validRows: number;
  errors: string[];
  warnings: string[];
  rows: PupilUploadReviewRow[];
  sampleRows: PupilUploadReviewRow[];
  stats: {
    yearGroups: Array<{ value: string; count: number }>;
    classes: Array<{ value: string; count: number }>;
    sendCount: number;
    ehcpCount: number;
    ealCount: number;
    pupilPremiumCount: number;
    missingClassCount: number;
  };
};

const REQUIRED_FIELDS = ["pupil_id", "source_pupil_ref", "first_name", "last_name", "year_group"];

export function reviewPupilUploadCsv(csvText: string, filename = "pupil-upload.csv"): PupilUploadReview {
  const lines = csvText
    .split(/\r?\n/)
    .map((line, index) => ({ raw: line, rowNumber: index + 1 }))
    .filter((line) => line.raw.trim() && !line.raw.trim().startsWith("#"));

  const emptyReview = {
    filename,
    csvText,
    headerRow: 0,
    totalRows: 0,
    validRows: 0,
    errors: ["CSV needs a header row and at least one pupil row."],
    warnings: [] as string[],
    rows: [] as PupilUploadReviewRow[],
    sampleRows: [] as PupilUploadReviewRow[],
    stats: {
      yearGroups: [],
      classes: [],
      sendCount: 0,
      ehcpCount: 0,
      ealCount: 0,
      pupilPremiumCount: 0,
      missingClassCount: 0,
    },
  };

  if (lines.length < 2) return emptyReview;

  const headerMatch = findHeaderLine(lines);
  const headerLineIndex = headerMatch.headerLineIndex;
  const headers = headerMatch.headers;
  const missing = headerMatch.missing;

  if (missing.length > 0) {
    return {
      ...emptyReview,
      headerRow: lines[headerLineIndex]?.rowNumber ?? 0,
      errors: [`Missing required columns: ${missing.join(", ")}`],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: PupilUploadReviewRow[] = [];
  const seenIds = new Map<string, number>();

  lines.slice(headerLineIndex + 1).forEach((line) => {
    const values = splitCsvLine(line.raw);
    const raw: Record<string, string> = {};
    headers.forEach((header, index) => {
      raw[header] = values[index]?.trim() ?? "";
    });

    for (const field of REQUIRED_FIELDS) {
      if (!raw[field]) errors.push(`Row ${line.rowNumber}: ${field} is required.`);
    }

    if (raw.pupil_id) {
      const earlierRow = seenIds.get(raw.pupil_id);
      if (earlierRow) errors.push(`Row ${line.rowNumber}: duplicate pupil_id also used on row ${earlierRow}.`);
      else seenIds.set(raw.pupil_id, line.rowNumber);
    }

    const usesYearGroupFallback = !raw.current_class && Boolean(raw.year_group);
    if (usesYearGroupFallback) {
      warnings.push(
        `Row ${line.rowNumber}: current_class is blank, so Schoolgle will use year_group as the class fallback and mark this pupil for class review.`,
      );
    }
    if (values.length > headers.length) warnings.push(`Row ${line.rowNumber}: has extra columns that will be ignored.`);

    rows.push({
      rowNumber: line.rowNumber,
      pupil_id: raw.pupil_id || "",
      source_pupil_ref: raw.source_pupil_ref ? normaliseSourcePupilRef(raw.source_pupil_ref) : "",
      first_name: raw.first_name ? normalisePupilName(raw.first_name) : "",
      last_name: raw.last_name ? normalisePupilName(raw.last_name) : "",
      year_group: raw.year_group ? normaliseYearGroup(raw.year_group) : "",
      current_class: raw.current_class ? normaliseClassName(raw.current_class) : normaliseYearGroup(raw.year_group),
      gender: raw.gender || "",
      send_status: normaliseSendStatus(raw.send_status || raw.sen_status) || "",
      ehcp: raw.ehcp || "",
      primary_need: raw.primary_need || "",
      fsm_eligible: raw.fsm_eligible || "",
      eal: raw.eal || "",
      pupil_premium: raw.pupil_premium || "",
      is_active: raw.is_active || "",
      pass_colour: raw.pass_colour || "",
      pass_animal: raw.pass_animal || "",
      pass_badge: raw.pass_badge || "",
      class_source: usesYearGroupFallback ? "year_group_fallback" : "imported_class",
      class_assignment_status: usesYearGroupFallback ? "needs_review" : "ready",
    });
  });

  return {
    filename,
    csvText,
    headerRow: lines[headerLineIndex].rowNumber,
    totalRows: rows.length,
    validRows: Math.max(0, rows.length - rowsWithErrors(errors).size),
    errors,
    warnings,
    rows,
    sampleRows: pickSampleRows(rows),
    stats: {
      yearGroups: countValues(rows.map((row) => row.year_group)),
      classes: countValues(rows.map((row) => row.current_class)),
      sendCount: rows.filter((row) => row.send_status).length,
      ehcpCount: rows.filter((row) => truthy(row.ehcp)).length,
      ealCount: rows.filter((row) => truthy(row.eal)).length,
      pupilPremiumCount: rows.filter((row) => truthy(row.pupil_premium)).length,
      missingClassCount: rows.filter((row) => row.class_assignment_status === "needs_review").length,
    },
  };
}

function rowsWithErrors(errors: string[]) {
  const rows = new Set<number>();
  errors.forEach((error) => {
    const match = error.match(/^Row\s+(\d+):/);
    if (match) rows.add(Number(match[1]));
  });
  return rows;
}

function pickSampleRows(rows: PupilUploadReviewRow[]) {
  if (rows.length <= 5) return rows;
  if (rows.length <= 10) return rows.slice(0, 5);
  const rowFiveIndex = rows.findIndex((row) => row.rowNumber === 5);
  const indexes = [
    0,
    rowFiveIndex >= 0 ? rowFiveIndex : 4,
    Math.floor(rows.length * 0.25),
    Math.floor(rows.length * 0.5),
    rows.length - 1,
  ];
  return [...new Set(indexes)].map((index) => rows[index]).filter(Boolean);
}

function countValues(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function truthy(value: string) {
  return ["true", "yes", "y", "1", "ehcp", "e"].includes(value.trim().toLowerCase());
}

function findHeaderLine(lines: Array<{ raw: string; rowNumber: number }>) {
  for (let index = 0; index < Math.min(lines.length, 8); index += 1) {
    const headers = splitCsvLine(lines[index].raw).map(normaliseHeader);
    const missing = REQUIRED_FIELDS.filter((field) => !headers.includes(field));
    if (missing.length === 0) return { headerLineIndex: index, headers, missing };
  }

  const headers = splitCsvLine(lines[0].raw).map(normaliseHeader);
  return {
    headerLineIndex: 0,
    headers,
    missing: REQUIRED_FIELDS.filter((field) => !headers.includes(field)),
  };
}

function normaliseHeader(header: string) {
  const normalised = header
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[\s()./-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (
    [
      "upn",
      "unique_pupil_number",
      "pupil_upn",
      "pupil_ref",
      "source_pupil_reference",
      "mis_pupil_ref",
      "mis_pupil_reference",
      "student_id",
      "globally_unique_student_id",
    ].includes(normalised)
  ) {
    return "source_pupil_ref";
  }
  if (normalised === "arbor_student_id") return "pupil_id";
  if (normalised === "legal_first_name") return "first_name";
  if (normalised === "legal_last_name") return "last_name";
  if (normalised.startsWith("year_group")) return "year_group";
  if (["courses_classes", "course_classes", "classes", "registration_form"].includes(normalised)) {
    return "current_class";
  }
  if (normalised === "sex") return "gender";
  return normalised;
}

function normaliseSourcePupilRef(value: string) {
  return value.trim().toUpperCase();
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
