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
    guidance: "Row 1 explains the columns. Row 2 is the exact import header. Start real class data on row 3.",
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
  let headerIndex = 0;
  let headers = splitCsvLine(lines[headerIndex]).map(normaliseHeader);
  let missing = required.filter((field) => !headers.includes(field));

  if (missing.length > 0 && lines.length > 2) {
    const secondRowHeaders = splitCsvLine(lines[1]).map(normaliseHeader);
    const secondRowMissing = required.filter((field) => !secondRowHeaders.includes(field));
    if (secondRowMissing.length === 0) {
      headerIndex = 1;
      headers = secondRowHeaders;
      missing = [];
    }
  }

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

    const parsedYearGroupNumber = yearGroupLabelToNumber(raw.year_group);
    if (parsedYearGroupNumber === null) {
      errors.push(`Row ${rowNumber}: year_group must be Nursery, Reception, Y1-Y13 or 1-13.`);
      return;
    }
    if (errors.some((error) => error.startsWith(`Row ${rowNumber}:`))) return;

    classes.push({
      year_group: normaliseYearGroupLabel(raw.year_group),
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
  const yearGroupNumber = yearGroupLabelToNumber(yearGroup);
  if (yearGroupNumber === null || yearGroupNumber <= 0) return "EYFS";
  if (yearGroupNumber <= 2) return "KS1";
  return "KS2";
}

function normaliseEmail(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

function normaliseHeader(header: string) {
  return header.toLowerCase().trim().replace(/\*/g, "").replace(/[\s-]+/g, "_");
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
