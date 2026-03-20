/**
 * Canvas Reconciliation Engine — GDPR Article 5(1)(d) Compliance
 *
 * Cross-references data from multiple systems (MIS, Payroll, HR)
 * to find discrepancies, recommend the source of truth, and
 * produce an auditable reconciliation report.
 *
 * Key principle: payroll data is most trusted because staff verify
 * it monthly via their payslip. MIS is next. HR systems and
 * spreadsheets are least trusted.
 */

import {
  DEFAULT_TRUST_RANKINGS,
  type EntityType,
  type ReconciliationConflict,
  type ReconciliationResult,
  type HealthAlert,
  type BusinessArea,
} from "./types";

// ─── Types ─────────────────────────────────────────────────

interface DatasetRecord {
  /** Unique identifier for matching across systems (e.g., NI number, employee ID, or composite key) */
  matchKey: string;
  /** Human-readable label (e.g., "Jane Smith") — for display only, not stored */
  label: string;
  /** All fields and values for this record */
  fields: Record<string, string | null>;
}

interface Dataset {
  sourceName: string;
  trustRanking: number;
  entityType: EntityType;
  records: DatasetRecord[];
}

// ─── Match Key Detection ───────────────────────────────────

/** Fields to use as match keys, in priority order */
const MATCH_KEY_FIELDS: Record<EntityType, string[][]> = {
  staff: [
    ["ni_number"], // Best: NI number is unique per person
    ["payroll_ref"], // Good: payroll reference
    ["email"], // Good: email is usually unique
    ["first_name", "last_name", "date_of_birth"], // Fallback: name + DOB
    ["first_name", "last_name"], // Last resort: name only (risky with duplicates)
  ],
  pupil: [
    ["upn"], // Best: Unique Pupil Number
    ["student_id"], // Good: MIS student ID
    ["first_name", "last_name", "date_of_birth"],
  ],
  transaction: [
    ["reference", "transaction_date", "amount"],
    ["nominal_code", "transaction_date", "amount"],
  ],
  supplier: [["supplier_name"]],
  attendance: [["student_id", "date"]],
  asset: [["asset_tag"]],
  contact: [["email"], ["first_name", "last_name"]],
  address: [["postcode", "address_line_1"]],
};

/** Fields to compare for reconciliation (skip IDs and technical fields) */
const RECONCILABLE_FIELDS: Record<
  EntityType,
  Array<{ field: string; label: string; sensitive: boolean }>
> = {
  staff: [
    { field: "first_name", label: "First Name", sensitive: false },
    { field: "last_name", label: "Last Name", sensitive: false },
    { field: "email", label: "Email", sensitive: false },
    { field: "phone", label: "Phone", sensitive: true },
    { field: "address_line_1", label: "Home Address", sensitive: true },
    { field: "postcode", label: "Postcode", sensitive: true },
    { field: "date_of_birth", label: "Date of Birth", sensitive: true },
    { field: "job_title", label: "Job Title", sensitive: false },
    { field: "department", label: "Department", sensitive: false },
    { field: "pay_scale", label: "Pay Scale", sensitive: true },
    { field: "salary", label: "Salary", sensitive: true },
    { field: "fte", label: "FTE", sensitive: false },
    { field: "contract_type", label: "Contract Type", sensitive: false },
    { field: "start_date", label: "Start Date", sensitive: false },
    { field: "end_date", label: "End Date/Leaving Date", sensitive: false },
    { field: "ni_number", label: "NI Number", sensitive: true },
    { field: "payroll_ref", label: "Payroll Reference", sensitive: true },
  ],
  pupil: [
    { field: "first_name", label: "First Name", sensitive: false },
    { field: "last_name", label: "Last Name", sensitive: false },
    { field: "date_of_birth", label: "Date of Birth", sensitive: true },
    { field: "year_group", label: "Year Group", sensitive: false },
    { field: "class", label: "Class", sensitive: false },
    { field: "sen_status", label: "SEN Status", sensitive: false },
    { field: "fsm_eligible", label: "FSM Eligible", sensitive: false },
    { field: "pupil_premium", label: "Pupil Premium", sensitive: false },
    { field: "gender", label: "Gender", sensitive: false },
    { field: "ethnicity", label: "Ethnicity", sensitive: false },
    { field: "eal", label: "EAL", sensitive: false },
  ],
  transaction: [],
  supplier: [],
  attendance: [],
  asset: [],
  contact: [],
  address: [],
};

// ─── Core Reconciliation ───────────────────────────────────

/**
 * Build a match key for a record using the best available fields
 */
function buildMatchKey(
  record: DatasetRecord,
  entityType: EntityType,
): string | null {
  const strategies = MATCH_KEY_FIELDS[entityType] || [];

  for (const fields of strategies) {
    const values = fields.map((f) => normalise(record.fields[f]));
    if (values.every((v) => v !== null && v.length > 0)) {
      return values.join("|").toLowerCase();
    }
  }

  return null;
}

/**
 * Normalise a value for comparison:
 * - Trim whitespace
 * - Lowercase
 * - Normalise dates (DD/MM/YYYY → YYYY-MM-DD)
 * - Strip £ and commas from money
 * - Strip spaces from NI numbers/postcodes
 */
function normalise(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  let v = String(value).trim();
  if (v.length === 0) return null;

  // Normalise dates
  const ddmmyyyy = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    v = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  }

  // Strip £ and commas
  v = v.replace(/^£/, "").replace(/,/g, "");

  return v.toLowerCase();
}

/**
 * Check if two normalised values are equivalent
 */
function valuesMatch(a: string | null, b: string | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return normalise(a) === normalise(b);
}

/**
 * Reconcile two datasets: find conflicts and recommend resolutions
 */
export function reconcileDatasets(
  datasetA: Dataset,
  datasetB: Dataset,
  customTrustRankings?: Record<string, number>,
): ReconciliationResult {
  const trustRankings = { ...DEFAULT_TRUST_RANKINGS, ...customTrustRankings };

  const trustA =
    customTrustRankings?.[datasetA.sourceName] ??
    trustRankings[datasetA.sourceName] ??
    5;
  const trustB =
    customTrustRankings?.[datasetB.sourceName] ??
    trustRankings[datasetB.sourceName] ??
    5;

  // Index dataset B by match key
  const bIndex = new Map<string, DatasetRecord>();
  for (const record of datasetB.records) {
    const key = buildMatchKey(record, datasetB.entityType);
    if (key) bIndex.set(key, record);
  }

  const conflicts: ReconciliationConflict[] = [];
  let matchedRecords = 0;

  const fieldsToCompare = RECONCILABLE_FIELDS[datasetA.entityType] || [];

  for (const recordA of datasetA.records) {
    const key = buildMatchKey(recordA, datasetA.entityType);
    if (!key) continue;

    const recordB = bIndex.get(key);
    if (!recordB) continue;

    matchedRecords++;

    // Compare each reconcilable field
    for (const { field, label } of fieldsToCompare) {
      const valueA = recordA.fields[field] ?? null;
      const valueB = recordB.fields[field] ?? null;

      // Skip if both null/empty
      if (
        (valueA === null || valueA === "") &&
        (valueB === null || valueB === "")
      )
        continue;

      // Skip if values match
      if (valuesMatch(valueA, valueB)) continue;

      // Conflict found
      const preferA = trustA < trustB; // lower number = more trusted
      const recommendation = preferA
        ? ("accept_a" as const)
        : ("accept_b" as const);
      const trustedSource = preferA ? datasetA.sourceName : datasetB.sourceName;
      const trustedRanking = preferA ? trustA : trustB;

      conflicts.push({
        entityType: datasetA.entityType,
        entityIdentifier: key,
        entityLabel: recordA.label,
        fieldName: field,
        fieldLabel: label,
        sourceA: datasetA.sourceName,
        sourceAValue: valueA,
        sourceATrustRanking: trustA,
        sourceB: datasetB.sourceName,
        sourceBValue: valueB,
        sourceBTrustRanking: trustB,
        recommendation,
        recommendationReason: `${trustedSource} is the more trusted source (trust level ${trustedRanking}). ${getReasonForTrust(trustedSource, field)}`,
      });
    }
  }

  return {
    conflicts,
    totalRecordsCompared: Math.min(
      datasetA.records.length,
      datasetB.records.length,
    ),
    matchedRecords,
    conflictCount: conflicts.length,
    sourceASummary: {
      system: datasetA.sourceName,
      records: datasetA.records.length,
      trustRanking: trustA,
    },
    sourceBSummary: {
      system: datasetB.sourceName,
      records: datasetB.records.length,
      trustRanking: trustB,
    },
  };
}

/**
 * Generate human-readable reason for trusting a particular source for a field
 */
function getReasonForTrust(source: string, field: string): string {
  const reasons: Record<string, Record<string, string>> = {
    la_payroll: {
      salary: "Payroll is verified monthly — staff would notice incorrect pay.",
      pay_scale: "Pay scale is set by the employer and reflected in payroll.",
      address_line_1: "Staff update their address with payroll when they move.",
      postcode: "Staff update their postcode with payroll when they move.",
      ni_number: "NI number is verified during payroll setup.",
      _default:
        "Payroll data is verified monthly by both employer and employee.",
    },
    payroll: {
      _default:
        "Payroll data is verified monthly by both employer and employee.",
    },
    arbor: {
      year_group: "The MIS is the primary system for pupil placement.",
      class: "The MIS manages class assignments.",
      _default:
        "The MIS is the primary admin system for day-to-day school management.",
    },
    bromcom: {
      _default:
        "The MIS is the primary admin system for day-to-day school management.",
    },
    sims: {
      _default:
        "The MIS is the primary admin system for day-to-day school management.",
    },
  };

  const sourceReasons = reasons[source];
  if (!sourceReasons) return "";
  return sourceReasons[field] || sourceReasons._default || "";
}

// ─── Mapped Record Builder ─────────────────────────────────

/**
 * Convert raw imported data (with original column names) into
 * a Dataset with canonical field names, using the approved field mappings.
 */
export function buildDataset(
  sourceName: string,
  entityType: EntityType,
  rows: Record<string, string | number | null | undefined>[],
  fieldMappings: Array<{ sourceColumn: string; targetField: string }>,
  trustRanking?: number,
): Dataset {
  const trust = trustRanking ?? DEFAULT_TRUST_RANKINGS[sourceName] ?? 5;

  // Build mapping lookup: source column → target field
  const mappingLookup = new Map<string, string>();
  for (const m of fieldMappings) {
    mappingLookup.set(m.sourceColumn, m.targetField);
  }

  // Find the best label fields (for display)
  const nameFields = ["first_name", "last_name"];

  const records: DatasetRecord[] = rows.map((row) => {
    const fields: Record<string, string | null> = {};

    for (const [sourceCol, value] of Object.entries(row)) {
      const targetField = mappingLookup.get(sourceCol);
      if (targetField) {
        fields[targetField] =
          value === null || value === undefined ? null : String(value).trim();
      }
    }

    // Build display label
    const labelParts = nameFields.map((f) => fields[f]).filter(Boolean);
    const label = labelParts.length > 0 ? labelParts.join(" ") : "Unknown";

    // Build match key from mapped fields
    return { matchKey: "", label, fields };
  });

  return { sourceName, trustRanking: trust, entityType, records };
}

// ─── Proactive Health Alerts ───────────────────────────────

/**
 * Scan a single dataset for data quality issues
 * Returns health alerts that Canvas surfaces proactively
 */
export function generateHealthAlerts(
  dataset: Dataset,
  businessArea: BusinessArea,
): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  const { records, entityType, sourceName } = dataset;

  if (records.length === 0) return alerts;

  // Check for fields that should have values but don't
  const fieldsToCheck = RECONCILABLE_FIELDS[entityType] || [];

  for (const { field, label, sensitive } of fieldsToCheck) {
    const missingCount = records.filter(
      (r) => !r.fields[field] || r.fields[field]!.trim() === "",
    ).length;
    const missingRate = missingCount / records.length;

    if (missingRate > 0.1 && missingCount > 0) {
      const severity =
        sensitive && missingRate > 0.3
          ? ("critical" as const)
          : missingRate > 0.5
            ? ("warning" as const)
            : ("info" as const);

      alerts.push({
        id: `missing_${sourceName}_${field}`,
        severity,
        category: businessArea,
        title: `Missing ${label}`,
        description: `${missingCount} of ${records.length} records in ${sourceName} are missing ${label} (${Math.round(missingRate * 100)}%)`,
        recommendation: sensitive
          ? `This is personal data under GDPR Article 5(1)(d). Review and update these records.`
          : `Consider updating these records for completeness.`,
        gdprArticle: sensitive ? "Article 5(1)(d)" : undefined,
        affectedRecords: missingCount,
      });
    }
  }

  // Check for obvious data quality issues
  if (entityType === "staff") {
    // Staff with end dates in the past but still in the export
    const now = new Date().toISOString().split("T")[0];
    const pastLeavers = records.filter((r) => {
      const endDate = normalise(r.fields.end_date);
      return endDate && endDate < now;
    });

    if (pastLeavers.length > 0) {
      alerts.push({
        id: `past_leavers_${sourceName}`,
        severity: "info",
        category: businessArea,
        title: "Past Leavers Still in Dataset",
        description: `${pastLeavers.length} staff have leaving dates in the past but are still in the ${sourceName} export`,
        recommendation:
          "These may need removing or archiving in the source system.",
        affectedRecords: pastLeavers.length,
      });
    }

    // Staff with no email
    const noEmail = records.filter(
      (r) => !r.fields.email || r.fields.email.trim() === "",
    );
    if (noEmail.length > 3) {
      alerts.push({
        id: `no_email_${sourceName}`,
        severity: "warning",
        category: businessArea,
        title: "Staff Without Email Addresses",
        description: `${noEmail.length} staff in ${sourceName} have no email address`,
        recommendation:
          "Email is needed for system access and communication. Update these records.",
        affectedRecords: noEmail.length,
      });
    }
  }

  return alerts;
}
