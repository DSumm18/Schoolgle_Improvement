export type SmartArborImportType =
  | "pupil_roll"
  | "send_status"
  | "daily_attendance_class_seed"
  | "unknown";

export type SmartArborImportAnalysis = {
  filename: string;
  detectedType: SmartArborImportType;
  confidence: number;
  canImport: boolean;
  recommendedIntent:
    | "pupil_roll_current"
    | "send_live_register"
    | "send_historic_snapshot"
    | "class_staff_seed"
    | "manual_review";
  availableFields: string[];
  missingRecommendedFields: string[];
  dataQualityGaps: Array<{ field: string; reason: string; severity: "info" | "warning" | "blocker" }>;
  warnings: string[];
  nextBestActions: string[];
  rowCount: number;
  sampleRows: Array<Record<string, string>>;
};

export function analyseSmartArborImport(csvText: string, filename = "arbor-export.csv"): SmartArborImportAnalysis {
  const parsed = parseCsv(csvText);
  const headers = parsed.headers.map(normaliseHeader);
  const rows = parsed.rows;
  const headerSet = new Set(headers);
  const availableFieldSet = new Set(mapAvailableFields(headers));

  if (looksLikeSendStatus(headerSet)) {
    return buildSendStatusAnalysis(filename, headers, rows);
  }
  if (looksLikeDailyAttendance(headerSet)) {
    return buildDailyAttendanceAnalysis(filename, headers, rows);
  }
  if (looksLikePupilRoll(availableFieldSet)) {
    return buildPupilRollAnalysis(filename, headers, rows);
  }

  return {
    filename,
    detectedType: "unknown",
    confidence: 0.2,
    canImport: false,
    recommendedIntent: "manual_review",
    availableFields: mapAvailableFields(headers),
    missingRecommendedFields: [],
    dataQualityGaps: [],
    warnings: ["Schoolgle could not confidently identify this Arbor export."],
    nextBestActions: [
      "Upload this as a preview only and ask Schoolgle to map the columns.",
      "Try adding stable identifiers such as UPN, Arbor Student ID, class, date of birth or SEN status.",
    ],
    rowCount: rows.length,
    sampleRows: rows.slice(0, 5),
  };
}

function buildPupilRollAnalysis(filename: string, headers: string[], rows: Array<Record<string, string>>): SmartArborImportAnalysis {
  const availableFields = mapAvailableFields(headers);
  const missingRecommendedFields = ["pupil_id", "source_pupil_ref", "date_of_birth", "current_class"].filter(
    (field) => !availableFields.includes(field),
  );
  return {
    filename,
    detectedType: "pupil_roll",
    confidence: missingRecommendedFields.includes("pupil_id") ? 0.76 : 0.9,
    canImport: availableFields.includes("first_name") && availableFields.includes("last_name") && availableFields.includes("year_group"),
    recommendedIntent: "pupil_roll_current",
    availableFields,
    missingRecommendedFields,
    dataQualityGaps: missingRecommendedFields.map((field) => ({
      field,
      reason: `${field} is recommended for safer pupil matching and future re-imports.`,
      severity: field === "pupil_id" ? "warning" : "info",
    })),
    warnings: [],
    nextBestActions: [
      "Preview the import and let Schoolgle use the populated fields.",
      "If Arbor allows it, include Arbor Student ID and UPN so re-import matching is safer.",
    ],
    rowCount: rows.length,
    sampleRows: rows.slice(0, 5),
  };
}

function buildSendStatusAnalysis(filename: string, headers: string[], rows: Array<Record<string, string>>): SmartArborImportAnalysis {
  const availableFields = mapAvailableFields(headers);
  const missingRecommendedFields = ["date_of_birth", "year_group", "current_class", "funding_amount"].filter(
    (field) => !availableFields.includes(field),
  );
  const hasBlankYearGroups = rows.some((row) => !valueFor(row, headers, "year_group"));
  return {
    filename,
    detectedType: "send_status",
    confidence: 0.92,
    canImport: availableFields.includes("source_pupil_ref") && availableFields.includes("sen_status") && availableFields.includes("primary_need"),
    recommendedIntent: hasBlankYearGroups ? "send_historic_snapshot" : "send_live_register",
    availableFields,
    missingRecommendedFields,
    dataQualityGaps: [
      ...missingRecommendedFields.map((field) => ({
        field,
        reason: field === "funding_amount"
          ? "Funded hours may be present, but funding amount/band normally needs a separate LA funding schedule."
          : `${field} improves matching and SEND register review.`,
        severity: field === "funding_amount" ? "warning" as const : "info" as const,
      })),
    ],
    warnings: hasBlankYearGroups
      ? ["Some rows have blank year group values, so this may include historic/off-roll pupils. Import as a historic snapshot or filter to current pupils."]
      : [],
    nextBestActions: [
      "Choose Live SEND Register for current pupils only, or Historic Cohort Snapshot for MI/Ofsted analysis.",
      "Import the pupil roll first so SEND rows can match to current pupils.",
    ],
    rowCount: rows.length,
    sampleRows: rows.slice(0, 5),
  };
}

function buildDailyAttendanceAnalysis(filename: string, headers: string[], rows: Array<Record<string, string>>): SmartArborImportAnalysis {
  return {
    filename,
    detectedType: "daily_attendance_class_seed",
    confidence: 0.86,
    canImport: true,
    recommendedIntent: "class_staff_seed",
    availableFields: mapAvailableFields(headers),
    missingRecommendedFields: ["staff_email", "staff_employee_id"],
    dataQualityGaps: [
      {
        field: "staff_email",
        reason: "Teacher names can suggest class assignments, but email/employee ID is safer for automatic staff matching.",
        severity: "warning",
      },
      {
        field: "weekly_pattern",
        reason: "A daily register export is a snapshot. It cannot prove a full weekly timetable pattern by itself.",
        severity: "warning",
      },
    ],
    warnings: ["This can seed classes and staff links, but it is not a full weekly timetable."],
    nextBestActions: [
      "Use this to create class rows and suggested staff-class assignments.",
      "Ask Arbor for timetable/course enrolment exports if a full timetable is needed.",
    ],
    rowCount: rows.length,
    sampleRows: rows.slice(0, 5),
  };
}

function looksLikePupilRoll(availableFields: Set<string>) {
  return availableFields.has("first_name") && availableFields.has("last_name") && (availableFields.has("year_group") || availableFields.has("current_class"));
}

function looksLikeSendStatus(headers: Set<string>) {
  return headers.has("sen_status") && (headers.has("sen_need") || headers.has("primary_need"));
}

function looksLikeDailyAttendance(headers: Set<string>) {
  return headers.has("time") && headers.has("lesson_event") && headers.has("teacher") && headers.has("marks");
}

function mapAvailableFields(headers: string[]) {
  const mapped = new Set<string>();
  headers.forEach((header) => {
    const field = FIELD_MAP[header] ?? header;
    if (field) mapped.add(field);
  });
  return [...mapped].sort();
}

const FIELD_MAP: Record<string, string> = {
  arbor_student_id: "pupil_id",
  student_id: "pupil_id",
  upn: "source_pupil_ref",
  globally_unique_student_id: "source_pupil_ref",
  legal_first_name: "first_name",
  legal_last_name: "last_name",
  sex: "gender",
  gender: "gender",
  date_of_birth: "date_of_birth",
  year_group: "year_group",
  courses_classes: "current_class",
  registration_forms_this_academic_year: "current_class",
  sen_status: "sen_status",
  sen_need: "primary_need",
  sen_need_ranking: "need_ranking",
  funded_hours: "funded_hours",
  time: "session_time",
  lesson_event: "class_or_event",
  teacher: "teacher_names",
  marks: "attendance_summary",
};

function valueFor(row: Record<string, string>, headers: string[], field: string) {
  const header = headers.find((candidate) => (FIELD_MAP[candidate] ?? candidate) === field);
  return header ? row[header] : "";
}

function parseCsv(csvText: string) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  const rawHeaders = splitCsvLine(lines[0] || "");
  const headers = rawHeaders.map(normaliseHeader);
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });
    return row;
  });
  return { headers, rows };
}

function normaliseHeader(header: string) {
  const normalised = header
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/&/g, "and")
    .replace(/[\s()./-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (normalised.startsWith("year_group")) return "year_group";
  if (normalised.startsWith("registration_form")) return "registration_forms_this_academic_year";
  if (normalised === "lesson_event") return "lesson_event";
  return normalised;
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"' && inQuotes) {
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
