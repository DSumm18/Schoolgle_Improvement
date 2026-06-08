import {
  normaliseClassName,
  normaliseSendStatus,
  normaliseYearGroup,
} from "./pupil-data-normalise";

export type SendImportIntent = "live_register" | "historic_snapshot";

export type SendStatusImportRow = {
  pupil_id: string;
  display_name: string;
  date_of_birth: string | null;
  year_group: string | null;
  class_name: string | null;
  sen_status: "K" | "E" | "monitoring" | "removed";
  primary_need: string;
  secondary_need: string | null;
  additional_needs: string[];
  date_identified: string;
  funded_hours: number | null;
  import_intent: SendImportIntent;
  raw_needs: Array<{ need: string; code: string; ranking: number }>;
};

export type SendStatusImportResult = {
  rows: SendStatusImportRow[];
  excludedRows: Array<{ pupil_id: string; reason: "missing_year_group_for_live_register" | "not_current_sen" }>;
  errors: string[];
};

type RawSendNeedRow = {
  pupil_id: string;
  display_name: string;
  date_of_birth: string | null;
  year_group: string | null;
  class_name: string | null;
  sen_status: "K" | "E" | "monitoring" | "removed" | null;
  need: string;
  need_code: string;
  ranking: number;
  start_date: string | null;
  funded_hours: number | null;
};

export function parseSendStatusAssignmentsCsv(
  csvText: string,
  options: { intent?: SendImportIntent } = {},
): SendStatusImportResult {
  const intent = options.intent ?? "live_register";
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return { rows: [], excludedRows: [], errors: ["CSV needs a header row and at least one SEND row."] };

  const headers = splitCsvLine(lines[0]).map(normaliseHeader);
  const required = ["pupil_id", "display_name", "sen_status_text", "sen_need"];
  const missing = required.filter((field) => !headers.includes(field));
  if (missing.length > 0) return { rows: [], excludedRows: [], errors: [`Missing required columns: ${missing.join(", ")}`] };

  const rawRows: RawSendNeedRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, index) => {
    const values = splitCsvLine(line);
    const raw: Record<string, string> = {};
    headers.forEach((header, valueIndex) => {
      raw[header] = values[valueIndex]?.trim() ?? "";
    });
    const rowNumber = index + 2;
    const pupilId = raw.pupil_id || raw.upn;
    if (!pupilId) {
      errors.push(`Row ${rowNumber}: pupil_id is required.`);
      return;
    }
    const senStatus = normaliseImportedSenStatus(raw.sen_status_code || raw.sen_status_text);
    const needCode = normaliseNeed(raw.sen_need);
    if (!needCode) {
      errors.push(`Row ${rowNumber}: SEN need "${raw.sen_need}" could not be mapped.`);
      return;
    }

    rawRows.push({
      pupil_id: pupilId,
      display_name: raw.display_name,
      date_of_birth: normaliseDate(raw.date_of_birth),
      year_group: raw.year_group ? normaliseYearGroup(raw.year_group) : null,
      class_name: raw.class_name ? normaliseClassName(raw.class_name) : null,
      sen_status: senStatus,
      need: raw.sen_need,
      need_code: needCode,
      ranking: Number(raw.sen_need_ranking || 999),
      start_date: normaliseDate(raw.start_date),
      funded_hours: parseFundedHours(raw.funded_hours),
    });
  });

  const grouped = new Map<string, RawSendNeedRow[]>();
  rawRows.forEach((row) => {
    const rows = grouped.get(row.pupil_id) ?? [];
    rows.push(row);
    grouped.set(row.pupil_id, rows);
  });

  const rows: SendStatusImportRow[] = [];
  const excludedRows: SendStatusImportResult["excludedRows"] = [];

  for (const [pupilId, pupilRows] of grouped) {
    const sortedRows = [...pupilRows].sort((a, b) => a.ranking - b.ranking);
    const first = sortedRows[0];
    if (!first.sen_status || first.sen_status === "removed") {
      excludedRows.push({ pupil_id: pupilId, reason: "not_current_sen" });
      continue;
    }
    if (intent === "live_register" && !first.year_group) {
      excludedRows.push({ pupil_id: pupilId, reason: "missing_year_group_for_live_register" });
      continue;
    }

    rows.push({
      pupil_id: pupilId,
      display_name: first.display_name,
      date_of_birth: first.date_of_birth,
      year_group: first.year_group,
      class_name: first.class_name,
      sen_status: first.sen_status,
      primary_need: sortedRows[0].need_code,
      secondary_need: sortedRows[1]?.need_code ?? null,
      additional_needs: sortedRows.slice(1).map((row) => row.need_code),
      date_identified: first.start_date ?? new Date().toISOString().slice(0, 10),
      funded_hours: first.funded_hours,
      import_intent: intent,
      raw_needs: sortedRows.map((row) => ({ need: row.need, code: row.need_code, ranking: row.ranking })),
    });
  }

  return { rows, excludedRows, errors };
}

function normaliseHeader(header: string) {
  const normalised = header.toLowerCase().trim().replace(/[\s()./-]+/g, "_").replace(/^_+|_+$/g, "");
  if (normalised === "upn" || normalised === "unique_pupil_number") return "pupil_id";
  if (normalised === "name" || normalised.startsWith("name_in_format")) return "display_name";
  if (normalised.startsWith("year_group")) return "year_group";
  if (normalised.startsWith("registration_form")) return "class_name";
  if (normalised === "date_of_birth" || normalised === "dob") return "date_of_birth";
  if (normalised === "sen_need" || normalised === "sen_needs") return "sen_need";
  if (normalised === "sen_need_ranking") return "sen_need_ranking";
  if (normalised === "start_date") return "start_date";
  if (normalised === "funded_hours") return "funded_hours";
  if (normalised === "sen_status") return "sen_status_text";
  return normalised;
}

function normaliseImportedSenStatus(value: string) {
  const normalised = normaliseSendStatus(value);
  if (normalised === "K" || normalised === "E") return normalised;
  const lower = value.trim().toLowerCase();
  if (lower === "monitoring") return "monitoring";
  if (lower === "n" || lower.includes("no special")) return null;
  if (lower === "s" || lower.includes("statement")) return "E";
  return null;
}

const NEED_MAP: Array<[RegExp, string]> = [
  [/speech|language|communication|slcn/i, "SLCN"],
  [/social|emotional|mental|semh/i, "SEMH"],
  [/moderate learning|mld/i, "MLD"],
  [/severe learning|sld/i, "SLD"],
  [/profound|multiple|pmld/i, "PMLD"],
  [/specific learning|dyslexia|dysgraphia|spld/i, "SPLD"],
  [/vision|visual|vi/i, "VI"],
  [/hearing|hi/i, "HI"],
  [/multi sensory|msi/i, "MSI"],
  [/physical|cerebral palsy|pd/i, "PD"],
  [/autistic|autism|asd|spectrum/i, "ASD"],
  [/no specialist|nsa/i, "NSA"],
  [/other|difficulty|disability|developmental delay|attention deficit|adhd|cystic fibrosis/i, "OTH"],
];

function normaliseNeed(value: string) {
  const match = NEED_MAP.find(([pattern]) => pattern.test(value));
  return match?.[1] ?? null;
}

function normaliseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (!match) return trimmed;
  const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
  if (!month) return trimmed;
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
}

function parseFundedHours(value: string) {
  const trimmed = value.replace(/\u00a0/g, " ").trim();
  if (!trimmed) return null;
  const hours = trimmed.match(/(\d+(?:\.\d+)?)\s*h/i);
  const minutes = trimmed.match(/(\d+(?:\.\d+)?)\s*m/i);
  return (hours ? Number(hours[1]) : 0) + (minutes ? Number(minutes[1]) / 60 : 0);
}

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

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
