/**
 * Canvas Field Matcher — Smart Semantic Field Matching Engine
 *
 * Matches columns from uploaded data to Schoolgle canonical fields using:
 * 1. Label-based matching (exact + fuzzy on column names)
 * 2. Data fingerprinting (regex + statistical patterns on actual data)
 * 3. Network-effect registry (learned mappings from other schools)
 * 4. AI inference (fallback for ambiguous columns)
 *
 * The key insight: we match on DATA CONTENT, not just column labels.
 * A column called "Col_7" full of UK postcodes is still a postcode field.
 */

import type {
  ColumnAnalysis,
  DetectionMethod,
  EntityType,
  FieldMapping,
  FingerprintMatch,
  IngestResult,
  IngestWarning,
} from "./types";

// ─── Data Fingerprint Patterns ─────────────────────────────
// These are the built-in patterns. The DB table supplements these.

interface FingerprintPattern {
  name: string;
  regex?: RegExp;
  numericMin?: number;
  numericMax?: number;
  typicalCardinality: "low" | "medium" | "high";
  minMatchRatio: number;
  likelyEntity: EntityType;
  likelyField: string;
  baseConfidence: number;
}

const FINGERPRINT_PATTERNS: FingerprintPattern[] = [
  // Identity
  {
    name: "uk_postcode",
    regex: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
    typicalCardinality: "high",
    minMatchRatio: 0.6,
    likelyEntity: "staff",
    likelyField: "postcode",
    baseConfidence: 0.95,
  },
  {
    name: "email_address",
    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    typicalCardinality: "high",
    minMatchRatio: 0.7,
    likelyEntity: "staff",
    likelyField: "email",
    baseConfidence: 0.95,
  },
  {
    name: "uk_phone",
    regex: /^(\+44|0)\d{9,10}$/,
    typicalCardinality: "high",
    minMatchRatio: 0.5,
    likelyEntity: "staff",
    likelyField: "phone",
    baseConfidence: 0.85,
  },
  {
    name: "uk_national_insurance",
    regex: /^[A-Z]{2}\d{6}[A-D]$/i,
    typicalCardinality: "high",
    minMatchRatio: 0.7,
    likelyEntity: "staff",
    likelyField: "ni_number",
    baseConfidence: 0.98,
  },
  {
    name: "uk_dbs_number",
    regex: /^\d{12}$/,
    typicalCardinality: "high",
    minMatchRatio: 0.5,
    likelyEntity: "staff",
    likelyField: "dbs_number",
    baseConfidence: 0.75,
  },
  {
    name: "upn",
    regex: /^[A-Z]\d{12}$/i,
    typicalCardinality: "high",
    minMatchRatio: 0.7,
    likelyEntity: "pupil",
    likelyField: "upn",
    baseConfidence: 0.98,
  },

  // Pay & Finance
  {
    name: "pay_scale_point",
    regex: /^(M[1-6]|U[1-3]|L\d{1,2}|UQ[1-6]|MPS|UPS|TLR)$/i,
    typicalCardinality: "low",
    minMatchRatio: 0.5,
    likelyEntity: "staff",
    likelyField: "pay_scale",
    baseConfidence: 0.92,
  },
  {
    name: "salary_range",
    regex: undefined,
    numericMin: 15000,
    numericMax: 135000,
    typicalCardinality: "medium",
    minMatchRatio: 0.7,
    likelyEntity: "staff",
    likelyField: "salary",
    baseConfidence: 0.8,
  },
  {
    name: "cfr_code",
    regex: /^[IE]\d{2}$/,
    typicalCardinality: "low",
    minMatchRatio: 0.5,
    likelyEntity: "transaction",
    likelyField: "cfr_code",
    baseConfidence: 0.95,
  },
  {
    name: "money_gbp",
    regex: /^-?£?\d{1,3}(,\d{3})*(\.\d{2})?$/,
    typicalCardinality: "high",
    minMatchRatio: 0.6,
    likelyEntity: "transaction",
    likelyField: "amount",
    baseConfidence: 0.65,
  },

  // Education
  {
    name: "year_group",
    regex: /^(R|Reception|Nursery|N[12]?|[1-9]|1[0-3]|Year\s*\d{1,2})$/i,
    typicalCardinality: "low",
    minMatchRatio: 0.6,
    likelyEntity: "pupil",
    likelyField: "year_group",
    baseConfidence: 0.88,
  },
  {
    name: "sen_status",
    regex:
      /^(N|K|E|No SEN|SEN Support|EHCP|None|No Special Educational Need)$/i,
    typicalCardinality: "low",
    minMatchRatio: 0.6,
    likelyEntity: "pupil",
    likelyField: "sen_status",
    baseConfidence: 0.9,
  },
  {
    name: "gender",
    regex: /^(M|F|Male|Female|Boy|Girl|Other|Non-binary)$/i,
    typicalCardinality: "low",
    minMatchRatio: 0.8,
    likelyEntity: "pupil",
    likelyField: "gender",
    baseConfidence: 0.82,
  },
  {
    name: "boolean_yn",
    regex: /^(Y|N|Yes|No|TRUE|FALSE|1|0)$/i,
    typicalCardinality: "low",
    minMatchRatio: 0.8,
    likelyEntity: "staff",
    likelyField: "boolean_field",
    baseConfidence: 0.5,
  },

  // Dates
  {
    name: "date_dd_mm_yyyy",
    regex: /^\d{2}\/\d{2}\/\d{4}$/,
    typicalCardinality: "high",
    minMatchRatio: 0.6,
    likelyEntity: "staff",
    likelyField: "date_field",
    baseConfidence: 0.55,
  },
  {
    name: "date_yyyy_mm_dd",
    regex: /^\d{4}-\d{2}-\d{2}/,
    typicalCardinality: "high",
    minMatchRatio: 0.6,
    likelyEntity: "staff",
    likelyField: "date_field",
    baseConfidence: 0.55,
  },
];

// ─── Label Synonyms (fuzzy matching) ───────────────────────
// Maps common column name variations to canonical field names

const LABEL_SYNONYMS: Record<string, { entity: EntityType; field: string }> = {
  // Names
  first_name: { entity: "staff", field: "first_name" },
  firstname: { entity: "staff", field: "first_name" },
  "first name": { entity: "staff", field: "first_name" },
  forename: { entity: "staff", field: "first_name" },
  "given name": { entity: "staff", field: "first_name" },
  "legal first name": { entity: "staff", field: "first_name" },
  "employee first name": { entity: "staff", field: "first_name" },

  last_name: { entity: "staff", field: "last_name" },
  lastname: { entity: "staff", field: "last_name" },
  "last name": { entity: "staff", field: "last_name" },
  surname: { entity: "staff", field: "last_name" },
  "family name": { entity: "staff", field: "last_name" },
  "legal last name": { entity: "staff", field: "last_name" },

  // Contact
  email: { entity: "staff", field: "email" },
  "email address": { entity: "staff", field: "email" },
  emailaddress: { entity: "staff", field: "email" },
  "work email": { entity: "staff", field: "email" },
  work_email: { entity: "staff", field: "email" },

  phone: { entity: "staff", field: "phone" },
  telephone: { entity: "staff", field: "phone" },
  "phone number": { entity: "staff", field: "phone" },
  mobile: { entity: "staff", field: "phone" },

  // Address
  address: { entity: "staff", field: "address_line_1" },
  "address line 1": { entity: "staff", field: "address_line_1" },
  "home address": { entity: "staff", field: "address_line_1" },
  home_address_1: { entity: "staff", field: "address_line_1" },
  postcode: { entity: "staff", field: "postcode" },
  "post code": { entity: "staff", field: "postcode" },
  home_postcode: { entity: "staff", field: "postcode" },
  zip: { entity: "staff", field: "postcode" },

  // Employment
  "job title": { entity: "staff", field: "job_title" },
  job_title: { entity: "staff", field: "job_title" },
  post: { entity: "staff", field: "job_title" },
  position: { entity: "staff", field: "job_title" },
  role: { entity: "staff", field: "job_title" },

  "start date": { entity: "staff", field: "start_date" },
  start_date: { entity: "staff", field: "start_date" },
  "date joined": { entity: "staff", field: "start_date" },
  employ_start: { entity: "staff", field: "start_date" },
  "joining date": { entity: "staff", field: "start_date" },

  "end date": { entity: "staff", field: "end_date" },
  end_date: { entity: "staff", field: "end_date" },
  "date left": { entity: "staff", field: "end_date" },
  "leaving date": { entity: "staff", field: "end_date" },
  leavingdate: { entity: "staff", field: "end_date" },

  "date of birth": { entity: "staff", field: "date_of_birth" },
  dob: { entity: "staff", field: "date_of_birth" },
  dateofbirth: { entity: "staff", field: "date_of_birth" },
  "d.o.b.": { entity: "staff", field: "date_of_birth" },
  "d.o.b": { entity: "staff", field: "date_of_birth" },

  // Identifiers
  "employee id": { entity: "staff", field: "employee_id" },
  employee_id: { entity: "staff", field: "employee_id" },
  "employee number": { entity: "staff", field: "employee_id" },
  employee_no: { entity: "staff", field: "employee_id" },
  personid: { entity: "staff", field: "employee_id" },
  "staff code": { entity: "staff", field: "staff_code" },
  "staff id": { entity: "staff", field: "staff_code" },

  "ni number": { entity: "staff", field: "ni_number" },
  ni_number: { entity: "staff", field: "ni_number" },
  "national insurance": { entity: "staff", field: "ni_number" },
  ni_no: { entity: "staff", field: "ni_number" },
  ninumber: { entity: "staff", field: "ni_number" },

  "payroll ref": { entity: "staff", field: "payroll_ref" },
  payroll_ref: { entity: "staff", field: "payroll_ref" },
  "payroll number": { entity: "staff", field: "payroll_ref" },
  "payroll reference": { entity: "staff", field: "payroll_ref" },

  // Pay
  salary: { entity: "staff", field: "salary" },
  annual_salary: { entity: "staff", field: "salary" },
  "annual salary": { entity: "staff", field: "salary" },
  pay: { entity: "staff", field: "salary" },

  "pay scale": { entity: "staff", field: "pay_scale" },
  pay_scale: { entity: "staff", field: "pay_scale" },
  grade: { entity: "staff", field: "pay_scale" },
  paypoint: { entity: "staff", field: "pay_scale" },
  "pay point": { entity: "staff", field: "pay_scale" },

  fte: { entity: "staff", field: "fte" },
  "full time equivalent": { entity: "staff", field: "fte" },

  department: { entity: "staff", field: "department" },
  dept: { entity: "staff", field: "department" },

  "contract type": { entity: "staff", field: "contract_type" },
  contract: { entity: "staff", field: "contract_type" },
  fullparttime: { entity: "staff", field: "contract_type" },

  // Pupil-specific
  upn: { entity: "pupil", field: "upn" },
  "unique pupil number": { entity: "pupil", field: "upn" },
  "student id": { entity: "pupil", field: "student_id" },
  "year group": { entity: "pupil", field: "year_group" },
  yeargroup: { entity: "pupil", field: "year_group" },
  "registration group": { entity: "pupil", field: "class" },
  class: { entity: "pupil", field: "class" },
  form: { entity: "pupil", field: "class" },
  "fsm eligible": { entity: "pupil", field: "fsm_eligible" },
  fsm: { entity: "pupil", field: "fsm_eligible" },
  "pupil premium": { entity: "pupil", field: "pupil_premium" },
  pp: { entity: "pupil", field: "pupil_premium" },
  "sen status": { entity: "pupil", field: "sen_status" },
  sen: { entity: "pupil", field: "sen_status" },
  gender: { entity: "pupil", field: "gender" },
  ethnicity: { entity: "pupil", field: "ethnicity" },
  eal: { entity: "pupil", field: "eal" },

  // Finance
  "nominal code": { entity: "transaction", field: "nominal_code" },
  reference: { entity: "transaction", field: "reference" },
  amount: { entity: "transaction", field: "amount" },
  "net amount": { entity: "transaction", field: "net_amount" },
  "vat amount": { entity: "transaction", field: "vat_amount" },
  "tax code": { entity: "transaction", field: "vat_code" },
};

// ─── Core Analysis Functions ───────────────────────────────

/**
 * Analyse a single column of data, detecting type and fingerprint matches
 */
export function analyseColumn(
  columnName: string,
  values: (string | number | null | undefined)[],
  columnIndex: number,
): ColumnAnalysis {
  const stringValues = values.map((v) =>
    v === null || v === undefined ? "" : String(v).trim(),
  );
  const nonNullValues = stringValues.filter((v) => v.length > 0);
  const uniqueValues = new Set(nonNullValues);

  // Sample values (first 5 unique, anonymised-ish)
  const sampleValues = Array.from(uniqueValues).slice(0, 5);

  // Detect data type
  const detectedType = detectColumnType(nonNullValues);

  // Run fingerprint matching
  const fingerprints = matchFingerprints(nonNullValues);

  // Try label-based mapping
  const labelMapping = matchByLabel(columnName);

  // Best suggested mapping: label match > highest confidence fingerprint > null
  let suggestedMapping: FieldMapping | undefined;

  if (labelMapping) {
    suggestedMapping = {
      sourceColumn: columnName,
      targetEntity: labelMapping.entity,
      targetField: labelMapping.field,
      confidence: labelMapping.exact ? 0.95 : 0.8,
      detectionMethod: labelMapping.exact ? "label_exact" : "label_fuzzy",
    };
  }

  // If fingerprint is more specific, prefer it (unless label was exact)
  if (fingerprints.length > 0) {
    const bestFingerprint = fingerprints[0];
    if (
      !suggestedMapping ||
      (suggestedMapping.detectionMethod !== "label_exact" &&
        bestFingerprint.confidence > suggestedMapping.confidence)
    ) {
      suggestedMapping = {
        sourceColumn: columnName,
        targetEntity: bestFingerprint.likelyEntity,
        targetField: bestFingerprint.likelyField,
        confidence: bestFingerprint.confidence,
        detectionMethod: "data_fingerprint",
        dataPatternDescription: bestFingerprint.fingerprintName,
      };
    }

    // If label and fingerprint agree, boost confidence
    if (
      suggestedMapping &&
      labelMapping &&
      bestFingerprint.likelyField === labelMapping.field
    ) {
      suggestedMapping.confidence = Math.min(
        0.99,
        suggestedMapping.confidence + 0.1,
      );
    }
  }

  return {
    name: columnName,
    index: columnIndex,
    nonNullCount: nonNullValues.length,
    uniqueCount: uniqueValues.size,
    totalCount: values.length,
    sampleValues,
    detectedType,
    fingerprints,
    suggestedMapping,
  };
}

/**
 * Detect the data type of a column based on its values
 */
function detectColumnType(values: string[]): ColumnAnalysis["detectedType"] {
  if (values.length === 0) return "unknown";

  const sample = values.slice(0, 100);
  let emailCount = 0;
  let postcodeCount = 0;
  let phoneCount = 0;
  let numberCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  let currencyCount = 0;

  for (const v of sample) {
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v))
      emailCount++;
    else if (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(v)) postcodeCount++;
    else if (/^(\+44|0)\d{9,10}$/.test(v.replace(/\s/g, ""))) phoneCount++;
    else if (/^-?£\d/.test(v) || /^-?\d{1,3}(,\d{3})+\.\d{2}$/.test(v))
      currencyCount++;
    else if (/^-?\d+(\.\d+)?$/.test(v.replace(/,/g, ""))) numberCount++;
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}/.test(v))
      dateCount++;
    else if (/^(Y|N|Yes|No|TRUE|FALSE|1|0)$/i.test(v)) boolCount++;
  }

  const threshold = sample.length * 0.6;
  if (emailCount >= threshold) return "email";
  if (postcodeCount >= threshold) return "postcode";
  if (phoneCount >= threshold) return "phone";
  if (currencyCount >= threshold) return "currency";
  if (dateCount >= threshold) return "date";
  if (boolCount >= threshold) return "boolean";
  if (numberCount >= threshold) return "number";
  return "text";
}

/**
 * Match column data against fingerprint patterns
 */
function matchFingerprints(values: string[]): FingerprintMatch[] {
  if (values.length === 0) return [];

  const matches: FingerprintMatch[] = [];
  const sample = values.slice(0, 200);

  for (const pattern of FINGERPRINT_PATTERNS) {
    let matchCount = 0;

    for (const v of sample) {
      if (pattern.regex && pattern.regex.test(v.replace(/\s/g, ""))) {
        matchCount++;
      } else if (
        pattern.numericMin !== undefined &&
        pattern.numericMax !== undefined
      ) {
        const num = parseFloat(v.replace(/[£,]/g, ""));
        if (
          !isNaN(num) &&
          num >= pattern.numericMin &&
          num <= pattern.numericMax
        ) {
          matchCount++;
        }
      }
    }

    const matchRatio = matchCount / sample.length;

    if (matchRatio >= pattern.minMatchRatio) {
      // Adjust confidence based on actual match ratio
      const confidence = Math.min(
        0.99,
        pattern.baseConfidence * (0.7 + 0.3 * matchRatio),
      );

      matches.push({
        fingerprintName: pattern.name,
        matchRatio,
        likelyEntity: pattern.likelyEntity,
        likelyField: pattern.likelyField,
        confidence,
      });
    }
  }

  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Match a column name against known label synonyms
 */
function matchByLabel(
  columnName: string,
): { entity: EntityType; field: string; exact: boolean } | null {
  const normalised = columnName.toLowerCase().trim();

  // Exact match
  if (LABEL_SYNONYMS[normalised]) {
    return { ...LABEL_SYNONYMS[normalised], exact: true };
  }

  // Remove common prefixes/suffixes and try again
  const cleaned = normalised
    .replace(/^(employee|staff|student|pupil|member)\s+/i, "")
    .replace(/\s+(field|column|value|data)$/i, "")
    .trim();

  if (cleaned !== normalised && LABEL_SYNONYMS[cleaned]) {
    return { ...LABEL_SYNONYMS[cleaned], exact: false };
  }

  // Fuzzy: check if any synonym is contained in or contains the column name
  for (const [synonym, mapping] of Object.entries(LABEL_SYNONYMS)) {
    if (
      normalised.includes(synonym) ||
      (synonym.length > 3 && synonym.includes(normalised))
    ) {
      return { ...mapping, exact: false };
    }
  }

  return null;
}

// ─── Full Dataset Analysis ─────────────────────────────────

/**
 * Analyse an entire dataset: detect source system, map all fields,
 * identify entity type, flag warnings.
 */
export function analyseDataset(
  headers: string[],
  rows: Record<string, string | number | null | undefined>[],
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
  // 1. Analyse each column
  const columns: ColumnAnalysis[] = headers.map((header, i) => {
    const columnValues = rows.map((row) => row[header]);
    return analyseColumn(header, columnValues, i);
  });

  // 2. Detect source system
  const sourceDetection = detectSourceSystem(headers, knownSignatures);

  // 3. If source detected, apply its default mappings (higher confidence)
  if (sourceDetection) {
    for (const col of columns) {
      const defaultMapping = sourceDetection.defaultMappings[col.name];
      if (defaultMapping) {
        const sigConfidence =
          defaultMapping.confidence * sourceDetection.confidence;
        if (
          !col.suggestedMapping ||
          sigConfidence > col.suggestedMapping.confidence
        ) {
          col.suggestedMapping = {
            sourceColumn: col.name,
            targetEntity: defaultMapping.target_entity as EntityType,
            targetField: defaultMapping.target_field,
            confidence: sigConfidence,
            detectionMethod: "label_exact",
          };
        }
      }
    }
  }

  // 4. Apply network-effect mappings from registry
  if (knownMappings && sourceDetection) {
    for (const col of columns) {
      const registryMatch = knownMappings.find(
        (m) =>
          m.source_system === sourceDetection.detectedSystem &&
          m.source_column === col.name,
      );
      if (registryMatch && registryMatch.confidence > 0.7) {
        if (
          !col.suggestedMapping ||
          registryMatch.confidence > col.suggestedMapping.confidence
        ) {
          col.suggestedMapping = {
            sourceColumn: col.name,
            targetEntity: registryMatch.target_entity as EntityType,
            targetField: registryMatch.target_field,
            confidence: registryMatch.confidence,
            detectionMethod: "user_confirmed",
          };
        }
      }
    }
  }

  // 5. Determine entity type from column mappings
  const entityVotes: Record<string, number> = {};
  for (const col of columns) {
    if (col.suggestedMapping) {
      const entity = col.suggestedMapping.targetEntity;
      entityVotes[entity] =
        (entityVotes[entity] || 0) + col.suggestedMapping.confidence;
    }
  }
  const entityType = (Object.entries(entityVotes).sort(
    ([, a], [, b]) => b - a,
  )[0]?.[0] || "staff") as EntityType;

  // 6. Collect all suggested mappings
  const suggestedMappings = columns
    .filter((c) => c.suggestedMapping)
    .map((c) => c.suggestedMapping!);

  // 7. Generate warnings
  const warnings = generateWarnings(columns, rows);

  // 8. Sample rows (first 5, for preview)
  const sampleRows = rows.slice(0, 5).map((row) => {
    const clean: Record<string, string> = {};
    for (const h of headers) {
      clean[h] = row[h] === null || row[h] === undefined ? "" : String(row[h]);
    }
    return clean;
  });

  return {
    sourceDetection,
    columns,
    suggestedMappings,
    entityType,
    totalRows: rows.length,
    warnings,
    rawHeaders: headers,
    sampleRows,
  };
}

// ─── Source System Detection ───────────────────────────────

function detectSourceSystem(
  headers: string[],
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
): IngestResult["sourceDetection"] {
  if (!knownSignatures || knownSignatures.length === 0) return null;

  const headerSet = new Set(headers.map((h) => h.trim()));
  let bestMatch: IngestResult["sourceDetection"] = null;
  let bestScore = 0;

  for (const sig of knownSignatures) {
    const matched = sig.signature_columns.filter((c) => headerSet.has(c));
    const missing = sig.signature_columns.filter((c) => !headerSet.has(c));

    // Must match at least 60% of signature columns
    const matchRatio = matched.length / sig.signature_columns.length;
    if (matchRatio < 0.6) continue;

    // Bonus for optional columns
    const optionalMatched = (sig.optional_columns || []).filter((c) =>
      headerSet.has(c),
    );
    const optionalBonus =
      sig.optional_columns && sig.optional_columns.length > 0
        ? optionalMatched.length / sig.optional_columns.length
        : 0;

    const score = matchRatio * sig.match_confidence + optionalBonus * 0.1;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        detectedSystem:
          sig.system_name as IngestResult["sourceDetection"] extends null
            ? never
            : NonNullable<IngestResult["sourceDetection"]>["detectedSystem"],
        exportType: sig.export_type,
        confidence: Math.min(0.99, score),
        matchedColumns: matched,
        missingColumns: missing,
        defaultMappings: sig.default_mappings,
      };
    }
  }

  return bestMatch;
}

// ─── Warning Generation ────────────────────────────────────

function generateWarnings(
  columns: ColumnAnalysis[],
  rows: Record<string, string | number | null | undefined>[],
): IngestWarning[] {
  const warnings: IngestWarning[] = [];

  // Check for columns with high null rates
  for (const col of columns) {
    const nullRate = 1 - col.nonNullCount / col.totalCount;
    if (nullRate > 0.3 && col.totalCount > 0) {
      warnings.push({
        type: "missing_data",
        message: `${col.name}: ${Math.round(nullRate * 100)}% of values are empty`,
        column: col.name,
        severity: nullRate > 0.7 ? "warning" : "info",
        affectedRows: col.totalCount - col.nonNullCount,
      });
    }
  }

  // Check for duplicate rows (based on first 3 non-null columns)
  const keyColumns = columns
    .filter((c) => c.nonNullCount > 0 && c.uniqueCount > 1)
    .slice(0, 3);

  if (keyColumns.length > 0) {
    const seen = new Set<string>();
    let dupeCount = 0;
    for (const row of rows) {
      const key = keyColumns.map((c) => String(row[c.name] || "")).join("|");
      if (seen.has(key)) dupeCount++;
      else seen.add(key);
    }
    if (dupeCount > 0) {
      warnings.push({
        type: "duplicate_rows",
        message: `${dupeCount} potential duplicate rows detected`,
        severity: dupeCount > rows.length * 0.1 ? "warning" : "info",
        affectedRows: dupeCount,
      });
    }
  }

  // Check for unmapped columns
  const unmappedCount = columns.filter((c) => !c.suggestedMapping).length;
  if (unmappedCount > 0) {
    warnings.push({
      type: "column_mismatch",
      message: `${unmappedCount} column${unmappedCount > 1 ? "s" : ""} could not be automatically mapped`,
      severity: unmappedCount > columns.length * 0.5 ? "warning" : "info",
    });
  }

  return warnings;
}
