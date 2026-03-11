/**
 * Pupil Data Pseudonymiser — RUNS CLIENT-SIDE ONLY
 *
 * Zero-Knowledge Architecture:
 * ┌─────────────────────────────────────────────────────────┐
 * │  BROWSER (School's Device)                              │
 * │                                                         │
 * │  1. School uploads CSV from Arbor/SIMS/Bromcom         │
 * │  2. THIS CODE runs in browser — parses CSV             │
 * │  3. Generates school-specific salt (or uses existing)   │
 * │  4. HMAC-SHA256 hashes UPN/name → pupil_hash           │
 * │  5. Strips names, DOBs, addresses, UPNs                │
 * │  6. Sends ONLY: hash + year group + demographics +     │
 * │     assessment levels to server                         │
 * │  7. Salt stays in browser localStorage — NEVER sent    │
 * │                                                         │
 * │  ┌─────────────────────────────────┐                   │
 * │  │ LOCAL LOOKUP TABLE              │                   │
 * │  │ pupil_hash → "Emily Jones Y4"  │ ← Only school     │
 * │  │ pupil_hash → "Amir Khan Y4"    │   can see this    │
 * │  └─────────────────────────────────┘                   │
 * └─────────────────────────────────────────────────────────┘
 *                    │ (pseudonymised data only)
 *                    ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │  SERVER (Schoolgle)                                     │
 * │                                                         │
 * │  Receives: pupil_hash, year_group, is_fsm, is_send,   │
 * │  subject, attainment_level, scaled_score, progress     │
 * │                                                         │
 * │  CANNOT identify any child. Ever.                       │
 * │  Even if database is breached — hashes without salt    │
 * │  are meaningless.                                       │
 * └─────────────────────────────────────────────────────────┘
 *
 * GDPR Compliance:
 * - Article 5(1)(c): Data minimisation — we only process what's needed
 * - Article 25: Data protection by design and default
 * - Article 32: Pseudonymisation as a security measure
 * - Recital 26: Pseudonymised data with separately-held key
 * - ICO Guidance: School retains the key, processor cannot re-identify
 */

// --- Types ---

export interface RawPupilRow {
  // These fields may vary by MIS system — we detect and map them
  [key: string]: string;
}

export interface PseudonymisedPupil {
  pupil_hash: string;
  year_group: number;
  is_fsm: boolean | null;
  is_send: boolean | null;
  send_type: string | null; // 'K' or 'E'
  is_eal: boolean | null;
  is_pp: boolean | null;
  gender: string | null;
  subject: string;
  assessment_period: string;
  academic_year_start: number;
  attainment_level: string | null; // WTS, EXS, GDS
  scaled_score: number | null;
  raw_score: number | null;
  teacher_assessment: string | null;
  progress_score: number | null;
  prior_attainment_band: string | null;
}

export interface LookupEntry {
  pupil_hash: string;
  display_name: string; // "First L." (abbreviated for privacy)
  year_group: number;
}

export interface PseudonymisationResult {
  pupils: PseudonymisedPupil[];
  lookup: LookupEntry[];
  stats: {
    totalRows: number;
    totalPupils: number;
    subjectsFound: string[];
    yearGroupsFound: number[];
    fieldsDetected: string[];
    warnings: string[];
  };
}

// --- Column Detection ---

// Map common MIS column names to our standardised fields
const COLUMN_MAPPINGS: Record<string, string[]> = {
  // Pupil identity (will be hashed)
  upn: ["upn", "unique pupil number", "pupil upn", "upn number"],
  first_name: [
    "first name",
    "firstname",
    "forename",
    "given name",
    "pupil first name",
  ],
  last_name: [
    "last name",
    "lastname",
    "surname",
    "family name",
    "pupil last name",
    "pupil surname",
  ],
  full_name: ["name", "pupil name", "student name", "full name", "pupil"],
  dob: ["dob", "date of birth", "birth date", "d.o.b", "d.o.b."],

  // Demographics (kept but non-identifying at school level)
  year_group: [
    "year group",
    "year",
    "yr",
    "year grp",
    "nc year",
    "yeargroup",
    "registration group year",
  ],
  class: ["class", "reg group", "registration group", "form", "class name"],
  gender: ["gender", "sex", "m/f"],
  fsm: [
    "fsm",
    "free school meals",
    "fsm eligible",
    "fsm ever",
    "ever fsm",
    "ever 6 fsm",
    "fsm6",
    "pp fsm",
  ],
  send: [
    "sen",
    "send",
    "sen status",
    "send status",
    "sen provision",
    "send provision",
    "sen stage",
  ],
  send_type: [
    "sen type",
    "send type",
    "sen primary need",
    "primary need",
    "send primary need",
  ],
  eal: ["eal", "english additional language", "first language", "eal status"],
  pp: ["pp", "pupil premium", "pupil premium eligible", "disadvantaged"],
  ethnicity: ["ethnicity", "ethnic group", "ethnic background"],

  // Assessment data
  subject: ["subject", "subject name", "area"],
  attainment: [
    "attainment",
    "level",
    "grade",
    "standard",
    "outcome",
    "result",
    "assessment outcome",
    "overall grade",
    "teacher assessment",
  ],
  scaled_score: ["scaled score", "score", "test score", "ss", "scaled"],
  raw_score: ["raw score", "raw mark", "marks", "raw"],
  progress: ["progress", "progress score", "progress measure", "value added"],
  prior_attainment: ["prior attainment", "prior band", "ks1 band", "baseline"],
  teacher_assessment: [
    "ta",
    "teacher assessment",
    "teacher judgement",
    "teacher judgment",
  ],
};

/**
 * Detect which MIS system the CSV came from based on column patterns
 */
export function detectMISSystem(headers: string[]): string {
  const headerStr = headers.join(" ").toLowerCase();

  if (headerStr.includes("arbor") || headerStr.includes("group_name"))
    return "arbor";
  if (headerStr.includes("sims") || headerStr.includes("registration group"))
    return "sims";
  if (headerStr.includes("bromcom")) return "bromcom";
  if (headerStr.includes("scholarpack")) return "scholarpack";
  if (headerStr.includes("target tracker") || headerStr.includes("tt_"))
    return "target_tracker";
  if (headerStr.includes("insight") || headerStr.includes("itrack"))
    return "insight_tracking";
  if (headerStr.includes("otrack")) return "otrack";
  if (headerStr.includes("pupil asset")) return "pupil_asset";
  if (headerStr.includes("fft") || headerStr.includes("aspire"))
    return "fft_aspire";

  return "manual_csv";
}

/**
 * Map CSV column headers to standardised field names
 */
export function mapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalised = headers.map((h) => h.toLowerCase().trim());

  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    for (let i = 0; i < normalised.length; i++) {
      if (
        aliases.some(
          (alias) => normalised[i] === alias || normalised[i].includes(alias),
        )
      ) {
        mapping[field] = headers[i]; // Map to original header name
        break;
      }
    }
  }

  return mapping;
}

// --- Pseudonymisation ---

/**
 * Generate a cryptographically secure salt for the school.
 * This runs in the BROWSER and the salt is stored in localStorage.
 * It NEVER leaves the device.
 */
export function generateSchoolSalt(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get or create the school's salt from localStorage.
 * The salt is the KEY that allows re-identification — it stays local.
 */
export function getOrCreateSalt(organizationId: string): string {
  const storageKey = `schoolgle_pupil_salt_${organizationId}`;
  let salt = localStorage.getItem(storageKey);

  if (!salt) {
    salt = generateSchoolSalt();
    localStorage.setItem(storageKey, salt);
  }

  return salt;
}

/**
 * HMAC-SHA256 hash a pupil identifier using the school's salt.
 * Uses the Web Crypto API (available in all modern browsers).
 *
 * The result is a deterministic hash — same pupil always gets same hash,
 * allowing us to track progress over time without knowing who they are.
 */
export async function hashPupilId(
  identifier: string,
  salt: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(salt);
  const messageData = encoder.encode(identifier.toLowerCase().trim());

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Build a pupil identifier string from available fields.
 * Priority: UPN > (first_name + last_name + DOB) > (full_name + DOB)
 */
function buildPupilIdentifier(
  row: RawPupilRow,
  columns: Record<string, string>,
): string {
  // Best: UPN (unique per pupil nationally)
  if (columns.upn && row[columns.upn]) {
    return row[columns.upn];
  }

  // Good: Name + DOB
  let name = "";
  if (columns.first_name && columns.last_name) {
    name =
      `${row[columns.first_name] || ""} ${row[columns.last_name] || ""}`.trim();
  } else if (columns.full_name) {
    name = row[columns.full_name] || "";
  }

  const dob = columns.dob ? row[columns.dob] || "" : "";

  if (name && dob) return `${name}|${dob}`;
  if (name) return name;

  // Fallback: row index (not ideal but maintains consistency within import)
  return `unknown_row_${JSON.stringify(row).substring(0, 50)}`;
}

// --- Assessment Level Normalisation ---

/**
 * Normalise assessment levels from various MIS systems to standard codes
 */
function normaliseAttainment(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.toUpperCase().trim();

  // Standard codes
  if (
    ["WTS", "BLW", "PKF", "PKE", "WKT", "WORKING TOWARDS"].some((s) =>
      v.includes(s),
    )
  )
    return "WTS";
  if (["EXS", "EXP", "ARE", "EXPECTED", "MEETING"].some((s) => v.includes(s)))
    return "EXS";
  if (
    ["GDS", "GD", "GREATER DEPTH", "EXCEEDING", "ABOVE"].some((s) =>
      v.includes(s),
    )
  )
    return "GDS";

  // Numeric (e.g. 1-6 scale, or percentages)
  const num = parseFloat(v);
  if (!isNaN(num)) {
    if (num <= 2) return "WTS";
    if (num <= 4) return "EXS";
    if (num <= 6) return "GDS";
  }

  return v; // Return as-is if we can't normalise
}

function normaliseBoolean(value: string | undefined): boolean | null {
  if (!value) return null;
  const v = value.toLowerCase().trim();
  if (["yes", "y", "true", "1", "eligible", "ever"].includes(v)) return true;
  if (["no", "n", "false", "0", "not eligible", "never"].includes(v))
    return false;
  return null;
}

function normaliseGender(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.toUpperCase().trim();
  if (v === "M" || v === "MALE" || v === "BOY") return "M";
  if (v === "F" || v === "FEMALE" || v === "GIRL") return "F";
  return "O";
}

function normaliseSendType(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.toUpperCase().trim();
  if (v === "K" || v.includes("SUPPORT") || v === "SEN SUPPORT") return "K";
  if (v === "E" || v.includes("EHCP") || v.includes("STATEMENT")) return "E";
  if (v === "N" || v === "NONE" || v === "NO SEN" || v === "0") return null;
  return v;
}

function detectSubjectFromHeaders(headers: string[], row: RawPupilRow): string {
  // If there's an explicit subject column, use it
  // Otherwise try to detect from column names like "Reading Level", "Maths Score"
  const subjects = [
    "reading",
    "writing",
    "maths",
    "mathematics",
    "science",
    "phonics",
    "spag",
    "gps",
  ];
  for (const header of headers) {
    const h = header.toLowerCase();
    for (const s of subjects) {
      if (h.includes(s))
        return s === "mathematics" ? "maths" : s === "gps" ? "spag" : s;
    }
  }
  return "combined";
}

// --- Main Pseudonymisation Function ---

/**
 * Pseudonymise a CSV of pupil assessment data.
 *
 * THIS MUST RUN IN THE BROWSER. It:
 * 1. Detects columns and MIS system
 * 2. Hashes pupil identifiers with school salt
 * 3. Normalises assessment levels
 * 4. Strips ALL PII (names, DOBs, addresses, UPNs)
 * 5. Returns only pseudonymised data + local lookup table
 *
 * @param rows - Parsed CSV rows (from PapaParse)
 * @param headers - CSV column headers
 * @param salt - School-specific salt (from localStorage)
 * @param academicYear - e.g. 2025 for 2025/26
 * @param assessmentPeriod - 'autumn', 'spring', 'summer', 'baseline'
 */
export async function pseudonymisePupilData(
  rows: RawPupilRow[],
  headers: string[],
  salt: string,
  academicYear: number,
  assessmentPeriod: string,
): Promise<PseudonymisationResult> {
  const columns = mapColumns(headers);
  const warnings: string[] = [];

  // Check we have minimum required fields
  if (!columns.year_group) {
    warnings.push(
      "No year group column detected — will need manual assignment",
    );
  }
  if (!columns.upn && !columns.first_name && !columns.full_name) {
    warnings.push("No pupil identifier column detected — cannot pseudonymise");
    return {
      pupils: [],
      lookup: [],
      stats: {
        totalRows: rows.length,
        totalPupils: 0,
        subjectsFound: [],
        yearGroupsFound: [],
        fieldsDetected: Object.keys(columns),
        warnings,
      },
    };
  }

  const pupils: PseudonymisedPupil[] = [];
  const lookup: LookupEntry[] = [];
  const seenHashes = new Set<string>();
  const subjectsFound = new Set<string>();
  const yearGroupsFound = new Set<number>();

  for (const row of rows) {
    // Build identifier and hash it
    const identifier = buildPupilIdentifier(row, columns);
    const pupilHash = await hashPupilId(identifier, salt);

    // Year group
    const yearGroupStr = columns.year_group ? row[columns.year_group] : "";
    const yearGroup = parseInt(yearGroupStr?.replace(/\D/g, "") || "0");
    if (yearGroup > 0) yearGroupsFound.add(yearGroup);

    // Build display name for local lookup (abbreviated)
    let displayName = "";
    if (columns.first_name && columns.last_name) {
      const first = row[columns.first_name] || "";
      const last = row[columns.last_name] || "";
      displayName = `${first} ${last.charAt(0)}.`;
    } else if (columns.full_name) {
      const parts = (row[columns.full_name] || "").split(/\s+/);
      displayName =
        parts.length > 1
          ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
          : parts[0];
    }

    // Add to lookup table (local only, never sent to server)
    if (!seenHashes.has(pupilHash)) {
      lookup.push({
        pupil_hash: pupilHash,
        display_name: displayName || `Pupil ${seenHashes.size + 1}`,
        year_group: yearGroup,
      });
      seenHashes.add(pupilHash);
    }

    // Detect subject
    const subject = columns.subject
      ? (row[columns.subject] || "combined").toLowerCase().trim()
      : detectSubjectFromHeaders(headers, row);
    subjectsFound.add(subject);

    // Build pseudonymised record
    const scaledScoreVal = columns.scaled_score
      ? parseInt(row[columns.scaled_score])
      : NaN;
    const rawScoreVal = columns.raw_score
      ? parseInt(row[columns.raw_score])
      : NaN;
    const progressVal = columns.progress
      ? parseFloat(row[columns.progress])
      : NaN;

    pupils.push({
      pupil_hash: pupilHash,
      year_group: yearGroup,
      is_fsm: normaliseBoolean(columns.fsm ? row[columns.fsm] : undefined),
      is_send: columns.send
        ? (normaliseBoolean(row[columns.send]) ??
          normaliseSendType(row[columns.send]) !== null)
        : null,
      send_type: normaliseSendType(
        columns.send_type
          ? row[columns.send_type]
          : columns.send
            ? row[columns.send]
            : undefined,
      ),
      is_eal: normaliseBoolean(columns.eal ? row[columns.eal] : undefined),
      is_pp: normaliseBoolean(columns.pp ? row[columns.pp] : undefined),
      gender: normaliseGender(columns.gender ? row[columns.gender] : undefined),
      subject: subject === "mathematics" ? "maths" : subject,
      assessment_period: assessmentPeriod,
      academic_year_start: academicYear,
      attainment_level: normaliseAttainment(
        columns.attainment ? row[columns.attainment] : undefined,
      ),
      scaled_score: !isNaN(scaledScoreVal) ? scaledScoreVal : null,
      raw_score: !isNaN(rawScoreVal) ? rawScoreVal : null,
      teacher_assessment: normaliseAttainment(
        columns.teacher_assessment
          ? row[columns.teacher_assessment]
          : undefined,
      ),
      progress_score: !isNaN(progressVal) ? progressVal : null,
      prior_attainment_band: columns.prior_attainment
        ? row[columns.prior_attainment]?.toLowerCase() || null
        : null,
    });
  }

  return {
    pupils,
    lookup,
    stats: {
      totalRows: rows.length,
      totalPupils: seenHashes.size,
      subjectsFound: Array.from(subjectsFound),
      yearGroupsFound: Array.from(yearGroupsFound).sort(),
      fieldsDetected: Object.keys(columns),
      warnings,
    },
  };
}
