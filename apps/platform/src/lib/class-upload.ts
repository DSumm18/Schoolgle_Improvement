import {
  normaliseClassName,
  normalisePupilName,
  normaliseYearGroupLabel,
  yearGroupLabelToNumber,
} from "./pupil-data-normalise";
import { buildStyledTemplateExcelHtml } from "./upload-template-excel";

export type ClassUploadRow = {
  year_group: string;
  year_group_number: number;
  class_name: string;
  room: string | null;
  location_code: string | null;
  academic_year: string;
  teacher_email: string | null;
  teacher_employee_id: string | null;
  ta_email: string | null;
  ta_employee_id: string | null;
};

export function classUploadTemplate() {
  const { descriptions, fields, examples } = getClassUploadTemplateRows();
  return [descriptions, fields, ...examples].map(toCsvRow).join("\n");
}

export function classUploadExcelTemplate() {
  const { descriptions, fields, examples } = getClassUploadTemplateRows();
  return buildStyledTemplateExcelHtml({
    title: "Schoolgle Classes Upload Template",
    guidance: "Rows 1-3 are guidance, row 4 explains the columns, row 5 is the exact import header. Start real class data on row 6.",
    tip: "Tip: upload staff first so teacher_email, teacher_employee_id, ta_email and ta_employee_id can link staff to classes.",
    descriptions,
    headers: fields,
    rows: examples,
  });
}

function getClassUploadTemplateRows() {
  const descriptions = [
    "Year group, e.g. Reception, Year 4, Y4 or 4. Required.",
    "Class or registration group, e.g. 4A, Oak, Maple. Required.",
    "Optional classroom/room name.",
    "Optional location_code from the Locations template, e.g. R022.",
    "Academic year, e.g. 2025-26. Defaults to 2025-26.",
    "Optional teacher email. Must match an uploaded staff record.",
    "Optional teacher employee ID. Used if email is blank.",
    "Optional teaching assistant email. Must match an uploaded staff record.",
    "Optional teaching assistant employee ID. Used if email is blank.",
  ];
  const fields = [
    "year_group",
    "class_name",
    "room",
    "location_code",
    "academic_year",
    "teacher_email",
    "teacher_employee_id",
    "ta_email",
    "ta_employee_id",
  ];
  const examples = [
    ["Year 4", "4A", "Room 22", "R022", "2025-26", "teacher.4a@school.co.uk", "STF004", "ta.4a@school.co.uk", "STF010"],
    ["Y4", "4B", "Room 23", "R023", "2025-26", "teacher.4b@school.co.uk", "STF005", "", ""],
  ];

  return { descriptions, fields, examples };
}

export function parseClassUploadCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (lines.length < 2) return { classes: [] as ClassUploadRow[], errors: ["CSV needs a header row and at least one class row."] };

  const required = ["year_group", "class_name"];
  const { headers, headerIndex, missing } = findHeader(lines, required);

  if (missing.length > 0) return { classes: [] as ClassUploadRow[], errors: [`Missing required columns: ${missing.join(", ")}`] };

  const classes: ClassUploadRow[] = [];
  const errors: string[] = [];

  lines.slice(headerIndex + 1).forEach((line, index) => {
    const rowNumber = index + headerIndex + 2;
    const values = splitCsvLine(line);
    const raw: Record<string, string> = {};
    headers.forEach((header, valueIndex) => {
      raw[header] = values[valueIndex]?.trim() ?? "";
    });

    for (const field of required) {
      if (!raw[field]) errors.push(`Row ${rowNumber}: ${field} is required.`);
    }

    const parsedYearGroupNumber = classYearGroupLabelToNumber(raw.year_group);
    if (parsedYearGroupNumber === null) {
      errors.push(`Row ${rowNumber}: year_group must be Nursery, Reception, Y1-Y13, 1-13, or a split class such as Year 1/2.`);
      return;
    }
    if (errors.some((error) => error.startsWith(`Row ${rowNumber}:`))) return;

    classes.push({
      year_group: normaliseClassYearGroupLabel(raw.year_group),
      year_group_number: parsedYearGroupNumber,
      class_name: normaliseClassName(raw.class_name),
      room: raw.room ? normalisePupilName(raw.room) : null,
      location_code: raw.location_code ? raw.location_code.trim().toUpperCase() : null,
      academic_year: raw.academic_year || "2025-26",
      teacher_email: normaliseEmail(raw.teacher_email),
      teacher_employee_id: raw.teacher_employee_id || null,
      ta_email: normaliseEmail(raw.ta_email),
      ta_employee_id: raw.ta_employee_id || null,
    });
  });

  return { classes, errors };
}

export function inferKeyStage(yearGroup: string) {
  const yearGroupNumber = classYearGroupLabelToNumber(yearGroup);
  if (yearGroupNumber === null || yearGroupNumber <= 0) return "EYFS";
  if (yearGroupNumber <= 2) return "KS1";
  return "KS2";
}

export function classYearGroupNumberForAssignment(yearGroup: string) {
  return classYearGroupLabelToNumber(yearGroup);
}

export function uniqueClassesForRegisterUpsert(classes: ClassUploadRow[]) {
  const byClassKey = new Map<string, ClassUploadRow>();

  for (const classRow of classes) {
    const key = `${classRow.class_name.toLowerCase()}|${classRow.academic_year}`;
    const existing = byClassKey.get(key);
    if (!existing) {
      byClassKey.set(key, classRow);
      continue;
    }

    byClassKey.set(key, {
      ...existing,
      room: existing.room || classRow.room,
      location_code: existing.location_code || classRow.location_code,
    });
  }

  return [...byClassKey.values()];
}

function normaliseClassYearGroupLabel(value: string) {
  const splitYearGroup = parseSplitYearGroup(value);
  if (splitYearGroup) return `Year ${splitYearGroup.start}/${splitYearGroup.end}`;
  return normaliseYearGroupLabel(value);
}

function classYearGroupLabelToNumber(value: string) {
  const splitYearGroup = parseSplitYearGroup(value);
  if (splitYearGroup) return splitYearGroup.start;
  return yearGroupLabelToNumber(value);
}

function parseSplitYearGroup(value: string) {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/^(?:year\s*|y)?(\d{1,2})\s*[/&-]\s*(?:year\s*|y)?(\d{1,2})$/);
  if (!match) return null;

  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start < 1 || end > 13 || start >= end) return null;
  if (end - start > 1) return null;
  return { start, end };
}

function normaliseEmail(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

function normaliseHeader(header: string) {
  return header.toLowerCase().trim().replace(/\*/g, "").replace(/[\s-]+/g, "_");
}

function findHeader(lines: string[], required: string[]) {
  for (let index = 0; index < Math.min(lines.length, 8); index += 1) {
    const headers = splitCsvLine(lines[index]).map(normaliseHeader);
    const missing = required.filter((field) => !headers.includes(field));
    if (missing.length === 0) return { headers, headerIndex: index, missing };
  }

  const headers = splitCsvLine(lines[0]).map(normaliseHeader);
  return { headers, headerIndex: 0, missing: required.filter((field) => !headers.includes(field)) };
}

function toCsvRow(values: string[]) {
  return values
    .map((value) => {
      if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
      return value;
    })
    .join(",");
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
