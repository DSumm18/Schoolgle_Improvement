import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import {
  normaliseClassName,
  normaliseGender,
  normalisePupilName,
  normaliseSendStatus,
  normaliseYearGroup,
} from "./pupil-data-normalise";
import { buildStyledTemplateExcelHtml } from "./upload-template-excel";

export const PASS_COLOURS = [
  "Blue",
  "Green",
  "Purple",
  "Yellow",
  "Red",
  "Orange",
  "Pink",
  "Teal",
];

export const PASS_ANIMALS = [
  "Fox",
  "Panda",
  "Owl",
  "Turtle",
  "Bee",
  "Lion",
  "Otter",
  "Robin",
];

export const PASS_BADGES = ["Star", "Moon", "Rocket", "Leaf", "Bolt", "Heart"];

export type PupilPassIdentity = {
  colour: string;
  animal: string;
  badge: string | null;
  codename: string;
};

export type PupilUploadRow = {
  pupil_id: string;
  source_pupil_ref: string;
  first_name: string;
  last_name: string;
  year_group: string;
  current_class: string;
  gender: string | null;
  send_status: string | null;
  ehcp: boolean;
  primary_need: string | null;
  fsm_eligible: boolean;
  pupil_premium: boolean;
  eal: boolean;
  is_active: boolean;
  pass_colour: string | null;
  pass_animal: string | null;
  pass_badge: string | null;
};

export function createPupilAccessToken() {
  return randomBytes(24).toString("base64url");
}

export function hashPupilAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function encryptPupilAccessToken(token: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptPupilAccessToken(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error("Invalid encrypted token");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function buildPassIdentity(
  row: Pick<PupilUploadRow, "pupil_id" | "pass_colour" | "pass_animal" | "pass_badge">,
  usedCodenames = new Set<string>(),
): PupilPassIdentity {
  const seed = stableNumber(row.pupil_id);
  const colour = normaliseChoice(row.pass_colour, PASS_COLOURS) ?? PASS_COLOURS[seed % PASS_COLOURS.length];
  const animal =
    normaliseChoice(row.pass_animal, PASS_ANIMALS) ??
    PASS_ANIMALS[Math.floor(seed / PASS_COLOURS.length) % PASS_ANIMALS.length];
  let badge = normaliseChoice(row.pass_badge, PASS_BADGES);
  let codename = [colour, animal, badge].filter(Boolean).join(" ");

  if (!badge && usedCodenames.has(codename)) {
    badge = PASS_BADGES[Math.floor(seed / 17) % PASS_BADGES.length];
    codename = [colour, animal, badge].join(" ");
  }

  let suffix = 2;
  let uniqueCodename = codename;
  while (usedCodenames.has(uniqueCodename)) {
    uniqueCodename = `${codename} ${suffix}`;
    suffix += 1;
  }
  usedCodenames.add(uniqueCodename);

  return { colour, animal, badge, codename: uniqueCodename };
}

export function parsePupilUploadCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (lines.length < 2) return { pupils: [] as PupilUploadRow[], errors: ["CSV needs a header row and at least one pupil row."] };

  const required = ["pupil_id", "source_pupil_ref", "first_name", "last_name", "year_group", "current_class"];
  const { headers, headerIndex, missing } = findHeader(lines, required);

  if (missing.length > 0) return { pupils: [] as PupilUploadRow[], errors: [`Missing required columns: ${missing.join(", ")}`] };

  const pupils: PupilUploadRow[] = [];
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
    if (errors.some((error) => error.startsWith(`Row ${rowNumber}:`))) return;

    pupils.push({
      pupil_id: raw.pupil_id,
      source_pupil_ref: normaliseSourcePupilRef(raw.source_pupil_ref),
      first_name: normalisePupilName(raw.first_name),
      last_name: normalisePupilName(raw.last_name),
      year_group: normaliseYearGroup(raw.year_group),
      current_class: normaliseClassName(raw.current_class),
      gender: normaliseGender(raw.gender),
      send_status: normaliseSendStatus(raw.send_status || raw.sen_status),
      ehcp: toBool(raw.ehcp),
      primary_need: raw.primary_need || null,
      fsm_eligible: toBool(raw.fsm_eligible),
      pupil_premium: toBool(raw.pupil_premium),
      eal: toBool(raw.eal),
      is_active: raw.is_active ? toBool(raw.is_active) : true,
      pass_colour: raw.pass_colour || null,
      pass_animal: raw.pass_animal || null,
      pass_badge: raw.pass_badge || null,
    });
  });

  return { pupils, errors };
}

export function pupilUploadTemplate() {
  return buildPupilUploadTemplateCsv();
}

export function pupilUploadExcelTemplate() {
  const { descriptions, fields, examples } = getPupilUploadTemplateRows();
  return buildStyledTemplateExcelHtml({
    title: "Schoolgle Pupil Upload Template",
    guidance: "Rows 1-3 are guidance, row 4 explains the columns, row 5 is the exact import header. Start real pupil data on row 6.",
    tip: "Tip: keep source_pupil_ref aligned with the MIS/UPN used in CTF/results files so assessment history can link.",
    descriptions,
    headers: fields,
    rows: examples,
  });
}

export function buildPupilUploadTemplateCsv() {
  const { descriptions, fields, examples } = getPupilUploadTemplateRows();
  return [descriptions, fields, ...examples].map(toCsvRow).join("\n");
}

function getPupilUploadTemplateRows() {
  const descriptions = [
    "Schoolgle pupil ID. Required. Keep stable for passes and Class Builder; may be school-made if source_pupil_ref is the MIS/UPN.",
    "Stable MIS/UPN pupil reference used in CTF/results files. Required for assessment history linking.",
    "Pupil first name. Required.",
    "Pupil last name. Required.",
    "Year group, e.g. R, 1, 2, 3, 4, 5, 6. Required.",
    "Current class or registration group, e.g. 4A or Oak. Required.",
    "Optional: M, F or O.",
    "Optional: K for SEN Support, E for EHCP, or blank.",
    "Optional: true/false or yes/no.",
    "Optional SEND primary need, e.g. ASD, SLCN, SEMH.",
    "Optional: true/false or yes/no.",
    "Optional pupil premium: true/false or yes/no.",
    "Optional EAL: true/false or yes/no.",
    "Optional: true unless the pupil is inactive/leaver.",
    "Optional Pupil Pass colour, e.g. Purple, Blue. Leave blank to auto-create.",
    "Optional Pupil Pass animal, e.g. Panda, Fox. Leave blank to auto-create.",
    "Optional extra badge, e.g. Star, Rocket. Leave blank unless needed.",
  ];
  const fields = [
    "pupil_id",
    "source_pupil_ref",
    "first_name",
    "last_name",
    "year_group",
    "current_class",
    "gender",
    "send_status",
    "ehcp",
    "primary_need",
    "fsm_eligible",
    "pupil_premium",
    "eal",
    "is_active",
    "pass_colour",
    "pass_animal",
    "pass_badge",
  ];
  const examples = [
    ["SG001", "A802200106001", "Ava", "Adams", "4", "4A", "F", "K", "false", "SLCN", "no", "yes", "no", "true", "Purple", "Panda", "Star"],
    ["SG002", "A802200106002", "Dan", "Dunn", "4", "4A", "M", "E", "true", "ASD", "yes", "yes", "no", "true", "Blue", "Fox", ""],
    ["SG003", "A802200106003", "Sam", "Smith", "4", "4A", "", "", "false", "", "no", "no", "yes", "true", "", "", ""],
  ];
  return { descriptions, fields, examples };
}

function toCsvRow(values: string[]) {
  return values
    .map((value) => {
      if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
      return value;
    })
    .join(",");
}

function getEncryptionKey() {
  const source =
    process.env.PUPIL_PASS_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.PUPIL_HASH_SALT ||
    "schoolgle-local-pupil-pass-development-key";
  return createHash("sha256").update(source).digest();
}

function stableNumber(value: string) {
  return parseInt(createHash("sha256").update(value).digest("hex").slice(0, 8), 16);
}

function normaliseChoice(value: string | null | undefined, allowed: string[]) {
  if (!value) return null;
  const found = allowed.find((item) => item.toLowerCase() === value.trim().toLowerCase());
  return found ?? null;
}

function normaliseHeader(header: string) {
  const normalised = header.toLowerCase().trim().replace(/[\s-]+/g, "_");
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
    ].includes(normalised)
  ) {
    return "source_pupil_ref";
  }
  return normalised;
}

function normaliseSourcePupilRef(value: string) {
  return value.trim().toUpperCase();
}

function findHeader(lines: string[], required: string[]) {
  for (let index = 0; index < Math.min(lines.length, 8); index += 1) {
    const headers = splitCsvLine(lines[index]).map((header) => normaliseHeader(header));
    const missing = required.filter((field) => !headers.includes(field));
    if (missing.length === 0) return { headers, headerIndex: index, missing };
  }

  const headers = splitCsvLine(lines[0]).map((header) => normaliseHeader(header));
  return { headers, headerIndex: 0, missing: required.filter((field) => !headers.includes(field)) };
}

function toBool(value: string | boolean | undefined) {
  if (typeof value === "boolean") return value;
  if (!value) return false;
  return ["true", "yes", "y", "1", "ehcp", "e"].includes(value.trim().toLowerCase());
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
