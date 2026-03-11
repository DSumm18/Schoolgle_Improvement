/**
 * AI Document Extraction Engine
 *
 * Extracts structured data from uploaded documents (energy bills, invoices,
 * contractor reports, DBS certificates, etc.) and feeds them into the
 * two-tier data validation pipeline (extracted_data -> validated_data).
 *
 * Two extraction strategies:
 * 1. Regex-based extraction for well-formatted documents (fast, free)
 * 2. AI prompt builder (OpenRouter) as fallback for messy documents
 */

// ============================================================================
// Types
// ============================================================================

export type DocumentType =
  | "energy_bill"
  | "payroll_report"
  | "invoice"
  | "contractor_report"
  | "fms_report"
  | "dbs_certificate"
  | "fire_ra"
  | "condition_survey"
  | "insurance_cert"
  | "gas_cert"
  | "eicr"
  | "other";

export interface ExtractionField {
  name: string;
  type: "string" | "number" | "date" | "boolean" | "currency";
  required: boolean;
  description: string;
  validationRegex?: string;
}

export interface CrossCheckDef {
  name: string;
  description: string;
  check: (fields: Record<string, any>) => { pass: boolean; message: string };
}

export interface ExtractionSchema {
  documentType: DocumentType;
  fields: ExtractionField[];
  crossChecks: CrossCheckDef[];
  targetModules: string[];
}

export interface ExtractionResult {
  fields: Record<string, any>;
  confidence: Record<string, number>;
  overallConfidence: number;
}

export interface CrossCheckResult {
  name: string;
  pass: boolean;
  message: string;
}

// ============================================================================
// Regex Helpers
// ============================================================================

/** Try multiple patterns, return first match or null */
function tryPatterns(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

function extractDate(text: string, patterns: RegExp[]): string | null {
  const raw = tryPatterns(text, patterns);
  if (!raw) return null;
  // Try to normalise to ISO date
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  // Try dd/mm/yyyy
  const dmy = raw.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  return raw;
}

function extractNumber(text: string, patterns: RegExp[]): number | null {
  const raw = tryPatterns(text, patterns);
  if (!raw) return null;
  const cleaned = raw.replace(/[,\s]/g, "").replace(/^[£$]/, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractCurrency(text: string, patterns: RegExp[]): number | null {
  return extractNumber(text, patterns);
}

// ============================================================================
// Extraction Schemas
// ============================================================================

export const EXTRACTION_SCHEMAS: Record<DocumentType, ExtractionSchema> = {
  energy_bill: {
    documentType: "energy_bill",
    fields: [
      {
        name: "meter_number",
        type: "string",
        required: true,
        description: "Meter serial number / MPAN / MPRN",
      },
      {
        name: "supplier",
        type: "string",
        required: true,
        description: "Energy supplier name",
      },
      {
        name: "reading_date",
        type: "date",
        required: true,
        description: "Date of meter reading",
      },
      {
        name: "reading_value",
        type: "number",
        required: false,
        description: "Meter reading value",
      },
      {
        name: "consumption_kwh",
        type: "number",
        required: true,
        description: "Energy consumed in kWh",
      },
      {
        name: "cost_total",
        type: "currency",
        required: true,
        description: "Total cost including VAT",
      },
      {
        name: "cost_rate",
        type: "number",
        required: false,
        description: "Unit rate in p/kWh",
      },
      {
        name: "standing_charge",
        type: "currency",
        required: false,
        description: "Standing charge amount",
      },
      {
        name: "period_start",
        type: "date",
        required: true,
        description: "Billing period start date",
      },
      {
        name: "period_end",
        type: "date",
        required: true,
        description: "Billing period end date",
      },
      {
        name: "meter_type",
        type: "string",
        required: false,
        description: "Electricity or Gas",
      },
    ],
    crossChecks: [
      {
        name: "cost_calculation",
        description:
          "Check that cost approximately equals consumption x rate + standing charge",
        check: (f) => {
          if (
            f.consumption_kwh == null ||
            f.cost_rate == null ||
            f.cost_total == null
          ) {
            return {
              pass: true,
              message: "Insufficient data for cost cross-check",
            };
          }
          const standing = f.standing_charge || 0;
          // Rate is in p/kWh, convert to pounds
          const expected = (f.consumption_kwh * f.cost_rate) / 100 + standing;
          const diff = Math.abs(expected - f.cost_total);
          const tolerance = f.cost_total * 0.15; // 15% tolerance for VAT, adjustments
          return {
            pass: diff <= tolerance,
            message:
              diff <= tolerance
                ? `Cost check passed (expected ~${expected.toFixed(2)}, actual ${f.cost_total})`
                : `Cost mismatch: expected ~${expected.toFixed(2)} but got ${f.cost_total} (diff: ${diff.toFixed(2)})`,
          };
        },
      },
    ],
    targetModules: ["estates", "finance"],
  },

  invoice: {
    documentType: "invoice",
    fields: [
      {
        name: "supplier",
        type: "string",
        required: true,
        description: "Supplier / vendor name",
      },
      {
        name: "invoice_number",
        type: "string",
        required: true,
        description: "Invoice reference number",
      },
      {
        name: "invoice_date",
        type: "date",
        required: true,
        description: "Invoice issue date",
      },
      {
        name: "due_date",
        type: "date",
        required: false,
        description: "Payment due date",
      },
      {
        name: "net_amount",
        type: "currency",
        required: true,
        description: "Net amount before VAT",
      },
      {
        name: "vat_amount",
        type: "currency",
        required: false,
        description: "VAT amount",
      },
      {
        name: "gross_amount",
        type: "currency",
        required: true,
        description: "Total amount including VAT",
      },
      {
        name: "cfr_code",
        type: "string",
        required: false,
        description: "CFR expenditure code (E01-E32)",
        validationRegex: "^E\\d{2}$",
      },
      {
        name: "description",
        type: "string",
        required: false,
        description: "Description of goods/services",
      },
    ],
    crossChecks: [
      {
        name: "vat_calculation",
        description: "Check that net + VAT = gross",
        check: (f) => {
          if (f.net_amount == null || f.gross_amount == null) {
            return {
              pass: true,
              message: "Insufficient data for VAT cross-check",
            };
          }
          const vat = f.vat_amount ?? 0;
          const expected = f.net_amount + vat;
          const diff = Math.abs(expected - f.gross_amount);
          return {
            pass: diff < 0.02, // penny tolerance
            message:
              diff < 0.02
                ? `VAT check passed: ${f.net_amount} + ${vat} = ${f.gross_amount}`
                : `VAT mismatch: ${f.net_amount} + ${vat} = ${expected.toFixed(2)}, but gross is ${f.gross_amount}`,
          };
        },
      },
    ],
    targetModules: ["finance", "procurement"],
  },

  dbs_certificate: {
    documentType: "dbs_certificate",
    fields: [
      {
        name: "certificate_number",
        type: "string",
        required: true,
        description: "DBS certificate number (12 digits)",
        validationRegex: "^\\d{12}$",
      },
      {
        name: "issue_date",
        type: "date",
        required: true,
        description: "Certificate issue date",
      },
      {
        name: "full_name",
        type: "string",
        required: true,
        description: "Full name on certificate",
      },
      {
        name: "dob",
        type: "date",
        required: false,
        description: "Date of birth",
      },
      {
        name: "level",
        type: "string",
        required: true,
        description: "DBS level: basic, standard, or enhanced",
      },
      {
        name: "status",
        type: "string",
        required: true,
        description: "Certificate status: clear or blemished",
      },
      {
        name: "children_barred_list",
        type: "boolean",
        required: false,
        description: "Whether children barred list was checked",
      },
    ],
    crossChecks: [
      {
        name: "expiry_check",
        description: "Check that DBS certificate is not older than 3 years",
        check: (f) => {
          if (!f.issue_date)
            return { pass: true, message: "No issue date to check" };
          const issued = new Date(f.issue_date);
          const threeYearsAgo = new Date();
          threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
          const expired = issued < threeYearsAgo;
          return {
            pass: !expired,
            message: expired
              ? `DBS certificate issued ${f.issue_date} is older than 3 years — renewal required`
              : `DBS certificate issued ${f.issue_date} is within 3-year validity`,
          };
        },
      },
    ],
    targetModules: ["compliance", "hr"],
  },

  gas_cert: {
    documentType: "gas_cert",
    fields: [
      {
        name: "certificate_number",
        type: "string",
        required: false,
        description: "Certificate or report number",
      },
      {
        name: "engineer_name",
        type: "string",
        required: true,
        description: "Gas Safe registered engineer name",
      },
      {
        name: "gas_safe_number",
        type: "string",
        required: true,
        description: "Gas Safe registration number",
      },
      {
        name: "property_address",
        type: "string",
        required: false,
        description: "Property address inspected",
      },
      {
        name: "inspection_date",
        type: "date",
        required: true,
        description: "Date of inspection",
      },
      {
        name: "next_due_date",
        type: "date",
        required: true,
        description: "Next inspection due date",
      },
      {
        name: "appliances_tested",
        type: "number",
        required: false,
        description: "Number of appliances tested",
      },
      {
        name: "result",
        type: "string",
        required: true,
        description: "Overall result: pass or fail",
      },
    ],
    crossChecks: [
      {
        name: "due_date_range",
        description:
          "Check that next due date is within 12 months of inspection",
        check: (f) => {
          if (!f.inspection_date || !f.next_due_date) {
            return {
              pass: true,
              message: "Insufficient dates for range check",
            };
          }
          const inspection = new Date(f.inspection_date);
          const nextDue = new Date(f.next_due_date);
          const diffMonths =
            (nextDue.getFullYear() - inspection.getFullYear()) * 12 +
            (nextDue.getMonth() - inspection.getMonth());
          return {
            pass: diffMonths > 0 && diffMonths <= 13,
            message:
              diffMonths > 0 && diffMonths <= 13
                ? `Due date is ${diffMonths} months after inspection (expected ~12)`
                : `Due date is ${diffMonths} months after inspection — expected within 12 months`,
          };
        },
      },
    ],
    targetModules: ["estates", "compliance"],
  },

  insurance_cert: {
    documentType: "insurance_cert",
    fields: [
      {
        name: "insurer",
        type: "string",
        required: true,
        description: "Insurance company name",
      },
      {
        name: "policy_number",
        type: "string",
        required: true,
        description: "Policy reference number",
      },
      {
        name: "cover_type",
        type: "string",
        required: true,
        description:
          "Type of cover (public liability, employer, building, etc.)",
      },
      {
        name: "cover_amount",
        type: "currency",
        required: false,
        description: "Amount of cover",
      },
      {
        name: "start_date",
        type: "date",
        required: true,
        description: "Policy start date",
      },
      {
        name: "end_date",
        type: "date",
        required: true,
        description: "Policy end / expiry date",
      },
      {
        name: "named_insured",
        type: "string",
        required: false,
        description: "Named insured party",
      },
    ],
    crossChecks: [
      {
        name: "expiry_check",
        description: "Check that insurance end date is in the future",
        check: (f) => {
          if (!f.end_date)
            return { pass: true, message: "No end date to check" };
          const end = new Date(f.end_date);
          const now = new Date();
          const valid = end > now;
          return {
            pass: valid,
            message: valid
              ? `Insurance valid until ${f.end_date}`
              : `Insurance expired on ${f.end_date}`,
          };
        },
      },
    ],
    targetModules: ["compliance", "estates"],
  },

  eicr: {
    documentType: "eicr",
    fields: [
      {
        name: "certificate_number",
        type: "string",
        required: false,
        description: "EICR certificate number",
      },
      {
        name: "inspector",
        type: "string",
        required: true,
        description: "Inspector / electrician name",
      },
      {
        name: "inspection_date",
        type: "date",
        required: true,
        description: "Date of inspection",
      },
      {
        name: "next_due_date",
        type: "date",
        required: true,
        description: "Next inspection due date",
      },
      {
        name: "circuits_tested",
        type: "number",
        required: false,
        description: "Number of circuits tested",
      },
      {
        name: "result",
        type: "string",
        required: true,
        description: "Overall result: satisfactory or unsatisfactory",
      },
      {
        name: "observations_c1",
        type: "number",
        required: false,
        description: "Count of C1 (danger present) observations",
      },
      {
        name: "observations_c2",
        type: "number",
        required: false,
        description: "Count of C2 (potentially dangerous) observations",
      },
      {
        name: "observations_c3",
        type: "number",
        required: false,
        description: "Count of C3 (improvement recommended) observations",
      },
    ],
    crossChecks: [
      {
        name: "due_date_range",
        description: "Check that next due date is within 5 years of inspection",
        check: (f) => {
          if (!f.inspection_date || !f.next_due_date) {
            return {
              pass: true,
              message: "Insufficient dates for range check",
            };
          }
          const inspection = new Date(f.inspection_date);
          const nextDue = new Date(f.next_due_date);
          const diffYears = nextDue.getFullYear() - inspection.getFullYear();
          return {
            pass: diffYears > 0 && diffYears <= 5,
            message:
              diffYears > 0 && diffYears <= 5
                ? `Due date is ${diffYears} years after inspection (expected max 5)`
                : `Due date is ${diffYears} years after inspection — expected within 5 years`,
          };
        },
      },
    ],
    targetModules: ["estates", "compliance"],
  },

  // Simpler schemas for remaining types
  payroll_report: {
    documentType: "payroll_report",
    fields: [
      {
        name: "period",
        type: "string",
        required: true,
        description: "Pay period (e.g. March 2026)",
      },
      {
        name: "total_gross",
        type: "currency",
        required: true,
        description: "Total gross pay",
      },
      {
        name: "total_deductions",
        type: "currency",
        required: false,
        description: "Total deductions",
      },
      {
        name: "total_net",
        type: "currency",
        required: true,
        description: "Total net pay",
      },
      {
        name: "headcount",
        type: "number",
        required: false,
        description: "Number of employees paid",
      },
      {
        name: "employer_ni",
        type: "currency",
        required: false,
        description: "Employer NI contributions",
      },
      {
        name: "employer_pension",
        type: "currency",
        required: false,
        description: "Employer pension contributions",
      },
    ],
    crossChecks: [
      {
        name: "gross_net_check",
        description: "Check gross - deductions = net",
        check: (f) => {
          if (f.total_gross == null || f.total_net == null) {
            return { pass: true, message: "Insufficient data" };
          }
          const deductions = f.total_deductions ?? 0;
          const expected = f.total_gross - deductions;
          const diff = Math.abs(expected - f.total_net);
          return {
            pass: diff < 1,
            message:
              diff < 1
                ? `Payroll check passed: gross ${f.total_gross} - deductions ${deductions} = net ${f.total_net}`
                : `Payroll mismatch: ${f.total_gross} - ${deductions} = ${expected.toFixed(2)}, but net is ${f.total_net}`,
          };
        },
      },
    ],
    targetModules: ["finance", "hr"],
  },

  contractor_report: {
    documentType: "contractor_report",
    fields: [
      {
        name: "contractor_name",
        type: "string",
        required: true,
        description: "Contractor / company name",
      },
      {
        name: "report_date",
        type: "date",
        required: true,
        description: "Report date",
      },
      {
        name: "work_description",
        type: "string",
        required: true,
        description: "Description of work carried out",
      },
      {
        name: "location",
        type: "string",
        required: false,
        description: "Location of work",
      },
      {
        name: "result",
        type: "string",
        required: false,
        description: "Overall result or outcome",
      },
      {
        name: "next_action",
        type: "string",
        required: false,
        description: "Recommended next action",
      },
      {
        name: "next_due_date",
        type: "date",
        required: false,
        description: "Next inspection/service due date",
      },
    ],
    crossChecks: [],
    targetModules: ["estates"],
  },

  fms_report: {
    documentType: "fms_report",
    fields: [
      {
        name: "report_period",
        type: "string",
        required: true,
        description: "Reporting period",
      },
      {
        name: "total_income",
        type: "currency",
        required: false,
        description: "Total income",
      },
      {
        name: "total_expenditure",
        type: "currency",
        required: false,
        description: "Total expenditure",
      },
      {
        name: "balance",
        type: "currency",
        required: false,
        description: "Balance (carry forward)",
      },
      {
        name: "report_type",
        type: "string",
        required: false,
        description: "Report type (budget monitoring, outturn, etc.)",
      },
    ],
    crossChecks: [
      {
        name: "balance_check",
        description: "Check income - expenditure = balance",
        check: (f) => {
          if (
            f.total_income == null ||
            f.total_expenditure == null ||
            f.balance == null
          ) {
            return { pass: true, message: "Insufficient data" };
          }
          const expected = f.total_income - f.total_expenditure;
          const diff = Math.abs(expected - f.balance);
          return {
            pass: diff < 1,
            message:
              diff < 1
                ? `Balance check passed`
                : `Balance mismatch: income ${f.total_income} - expenditure ${f.total_expenditure} = ${expected.toFixed(2)}, but balance is ${f.balance}`,
          };
        },
      },
    ],
    targetModules: ["finance"],
  },

  fire_ra: {
    documentType: "fire_ra",
    fields: [
      {
        name: "assessor_name",
        type: "string",
        required: true,
        description: "Fire risk assessor name",
      },
      {
        name: "assessment_date",
        type: "date",
        required: true,
        description: "Assessment date",
      },
      {
        name: "next_review_date",
        type: "date",
        required: false,
        description: "Next review date",
      },
      {
        name: "risk_rating",
        type: "string",
        required: true,
        description: "Overall risk rating (low, medium, high)",
      },
      {
        name: "property_address",
        type: "string",
        required: false,
        description: "Property assessed",
      },
      {
        name: "actions_required",
        type: "number",
        required: false,
        description: "Number of actions required",
      },
      {
        name: "priority_actions",
        type: "number",
        required: false,
        description: "Number of high-priority actions",
      },
    ],
    crossChecks: [],
    targetModules: ["estates", "compliance"],
  },

  condition_survey: {
    documentType: "condition_survey",
    fields: [
      {
        name: "surveyor",
        type: "string",
        required: true,
        description: "Surveyor name / company",
      },
      {
        name: "survey_date",
        type: "date",
        required: true,
        description: "Survey date",
      },
      {
        name: "property_address",
        type: "string",
        required: false,
        description: "Property surveyed",
      },
      {
        name: "overall_condition",
        type: "string",
        required: false,
        description: "Overall condition grade (A-D)",
      },
      {
        name: "total_backlog_cost",
        type: "currency",
        required: false,
        description: "Total backlog maintenance cost",
      },
      {
        name: "priority_items",
        type: "number",
        required: false,
        description: "Number of priority items",
      },
    ],
    crossChecks: [],
    targetModules: ["estates"],
  },

  other: {
    documentType: "other",
    fields: [
      {
        name: "document_title",
        type: "string",
        required: false,
        description: "Document title or heading",
      },
      {
        name: "date",
        type: "date",
        required: false,
        description: "Primary date on document",
      },
      {
        name: "author",
        type: "string",
        required: false,
        description: "Author or issuing party",
      },
      {
        name: "summary",
        type: "string",
        required: false,
        description: "Brief summary of contents",
      },
    ],
    crossChecks: [],
    targetModules: [],
  },
};

// ============================================================================
// Document Type Detection
// ============================================================================

const DOC_TYPE_KEYWORDS: Record<DocumentType, string[]> = {
  energy_bill: [
    "kwh",
    "electricity",
    "gas bill",
    "meter reading",
    "standing charge",
    "unit rate",
    "energy statement",
    "mpan",
    "mprn",
    "tariff",
    "consumption",
  ],
  invoice: [
    "invoice",
    "inv-",
    "payment due",
    "vat",
    "net amount",
    "gross amount",
    "subtotal",
    "purchase order",
    "remittance",
    "account number",
  ],
  dbs_certificate: [
    "disclosure and barring",
    "dbs",
    "certificate number",
    "barred list",
    "enhanced disclosure",
    "basic disclosure",
    "standard disclosure",
  ],
  gas_cert: [
    "gas safety",
    "gas safe",
    "landlord gas",
    "cp12",
    "gas appliance",
    "flue gas",
    "combustion",
    "gas safe register",
  ],
  insurance_cert: [
    "insurance certificate",
    "policy number",
    "public liability",
    "employer",
    "indemnity",
    "insured",
    "premium",
    "underwriter",
    "cover note",
    "certificate of insurance",
  ],
  eicr: [
    "electrical installation",
    "eicr",
    "condition report",
    "circuit",
    "satisfactory",
    "unsatisfactory",
    "observation",
    "c1",
    "c2",
    "c3",
    "bs 7671",
    "18th edition",
  ],
  payroll_report: [
    "payroll",
    "gross pay",
    "net pay",
    "paye",
    "national insurance",
    "salary",
    "deductions",
    "employer contribution",
    "payslip",
  ],
  contractor_report: [
    "contractor report",
    "works completed",
    "site visit",
    "maintenance report",
    "service report",
    "remedial",
    "defect",
  ],
  fms_report: [
    "budget monitoring",
    "financial management",
    "fms",
    "outturn",
    "carry forward",
    "revenue budget",
    "capital budget",
  ],
  fire_ra: [
    "fire risk assessment",
    "fire safety",
    "means of escape",
    "fire alarm",
    "fire door",
    "compartmentation",
    "fire risk",
  ],
  condition_survey: [
    "condition survey",
    "building survey",
    "condition grade",
    "backlog maintenance",
    "suitability",
    "sufficiency",
    "dilapidation",
  ],
  other: [],
};

/**
 * Auto-detect document type from extracted text using keyword matching.
 * Returns the type with the highest keyword match score.
 */
export function detectDocumentType(text: string): DocumentType {
  const lower = text.toLowerCase();
  let bestType: DocumentType = "other";
  let bestScore = 0;

  for (const [docType, keywords] of Object.entries(DOC_TYPE_KEYWORDS)) {
    if (docType === "other") continue;
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = docType as DocumentType;
    }
  }

  // Require at least 2 keyword matches to avoid false positives
  return bestScore >= 2 ? bestType : "other";
}

// ============================================================================
// Regex-Based Field Extraction
// ============================================================================

/** Regex extraction patterns per document type and field */
const FIELD_PATTERNS: Partial<Record<DocumentType, Record<string, RegExp[]>>> =
  {
    energy_bill: {
      meter_number: [
        /(?:meter|mpan|mprn)[:\s#]*(\S+)/i,
        /(?:supply|meter\s*(?:serial|ref))[:\s#]*(\S+)/i,
      ],
      supplier: [
        /(?:supplier|from|billed by)[:\s]+([A-Za-z][A-Za-z\s&]{2,30})/i,
      ],
      reading_date: [
        /(?:reading date|meter read)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:reading date|meter read)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      reading_value: [/(?:reading|meter reading)[:\s]*(\d{3,8})/i],
      consumption_kwh: [
        /(?:consumption|usage|used)[:\s]*([\d,]+(?:\.\d+)?)\s*kwh/i,
        /([\d,]+(?:\.\d+)?)\s*kwh/i,
      ],
      cost_total: [
        /(?:total|amount due|total charges|balance)[:\s]*[£]?([\d,]+\.\d{2})/i,
      ],
      cost_rate: [
        /(?:unit rate|rate)[:\s]*([\d.]+)\s*(?:p\/kwh|p per kwh|pence)/i,
      ],
      standing_charge: [/(?:standing charge)[:\s]*[£]?([\d.]+)/i],
      period_start: [
        /(?:period|from|billing period)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
      ],
      period_end: [
        /(?:to|period end|until)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
      ],
      meter_type: [/\b(electricity|electric|gas)\b/i],
    },

    invoice: {
      supplier: [
        /(?:from|supplier|vendor|company)[:\s]+([A-Za-z][A-Za-z\s&.,]{2,40})/i,
      ],
      invoice_number: [
        /(?:invoice\s*(?:no|number|#|ref))[:\s]*(\S+)/i,
        /(?:inv)[:\s-]*(\S+)/i,
      ],
      invoice_date: [
        /(?:invoice date|date of invoice|date)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:invoice date|date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      due_date: [
        /(?:due date|payment due|pay by)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:due date|payment due)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      net_amount: [
        /(?:net|subtotal|sub-total|ex(?:cl)?\.?\s*vat)[:\s]*[£]?([\d,]+\.\d{2})/i,
      ],
      vat_amount: [/(?:vat|tax)[:\s]*[£]?([\d,]+\.\d{2})/i],
      gross_amount: [
        /(?:total|gross|amount due|inc(?:l)?\.?\s*vat|balance due)[:\s]*[£]?([\d,]+\.\d{2})/i,
      ],
      description: [/(?:description|details|for)[:\s]+(.{10,100})/i],
    },

    dbs_certificate: {
      certificate_number: [
        /(?:certificate\s*(?:no|number))[:\s]*(\d{12})/i,
        /(\d{12})/,
      ],
      issue_date: [
        /(?:date\s*(?:of\s*)?issue|issued)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:date\s*(?:of\s*)?issue|issued)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      full_name: [/(?:name|applicant|subject)[:\s]+([A-Z][A-Za-z\s'-]{3,50})/],
      dob: [
        /(?:date of birth|dob|born)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
      ],
      level: [/\b(enhanced|standard|basic)\b/i],
      status: [/\b(clear|blemished|no\s*live\s*trace)\b/i],
      children_barred_list: [
        /children(?:'s)?\s*barred\s*list[:\s]*(yes|checked|included)/i,
      ],
    },

    gas_cert: {
      certificate_number: [
        /(?:certificate|report)\s*(?:no|number|#|ref)[:\s]*(\S+)/i,
      ],
      engineer_name: [
        /(?:engineer|technician|operative)[:\s]+([A-Z][A-Za-z\s'-]{3,40})/,
      ],
      gas_safe_number: [
        /(?:gas\s*safe\s*(?:reg|registration|id|no|number))[:\s]*(\d{4,10})/i,
      ],
      property_address: [/(?:address|property|premises)[:\s]+(.{10,100})/i],
      inspection_date: [
        /(?:inspection date|date of inspection|date)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:inspection date|date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      next_due_date: [
        /(?:next\s*(?:inspection|due|test))[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:next\s*(?:inspection|due|test))[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      appliances_tested: [/(\d+)\s*appliance/i],
      result: [
        /(?:result|overall)[:\s]*(pass|fail|satisfactory|unsatisfactory)/i,
      ],
    },

    insurance_cert: {
      insurer: [
        /(?:insurer|underwriter|insurance company)[:\s]+([A-Za-z][A-Za-z\s&.,]{2,50})/i,
      ],
      policy_number: [/(?:policy\s*(?:no|number|ref))[:\s]*(\S+)/i],
      cover_type: [
        /(?:type of cover|cover type|class of insurance)[:\s]+(.{5,60})/i,
        /\b(public liability|employer.?\s*liability|professional indemnity|building|contents)\b/i,
      ],
      cover_amount: [
        /(?:limit of indemnity|sum insured|cover amount)[:\s]*[£]?([\d,]+(?:\.\d{2})?)/i,
      ],
      start_date: [
        /(?:inception|start date|from|effective)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:inception|start date|from|effective)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      end_date: [
        /(?:expiry|end date|to|expires)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:expiry|end date|to|expires)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      named_insured: [
        /(?:insured|policyholder|named insured)[:\s]+([A-Za-z][A-Za-z\s&.,]{2,60})/i,
      ],
    },

    eicr: {
      certificate_number: [
        /(?:certificate|report)\s*(?:no|number|ref)[:\s]*(\S+)/i,
      ],
      inspector: [
        /(?:inspector|tested by|inspected by)[:\s]+([A-Z][A-Za-z\s'-]{3,40})/,
      ],
      inspection_date: [
        /(?:date of inspection|inspection date|date)[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:date of inspection|inspection date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      next_due_date: [
        /(?:next\s*(?:inspection|due|test|recommended))[:\s]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
        /(?:next\s*(?:inspection|due|test|recommended))[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i,
      ],
      circuits_tested: [/(\d+)\s*circuit/i],
      result: [
        /(?:overall\s*(?:result|assessment))[:\s]*(satisfactory|unsatisfactory)/i,
        /\b(satisfactory|unsatisfactory)\b/i,
      ],
      observations_c1: [/c1[:\s]*(\d+)/i, /(\d+)\s*(?:x\s*)?c1/i],
      observations_c2: [/c2[:\s]*(\d+)/i, /(\d+)\s*(?:x\s*)?c2/i],
      observations_c3: [/c3[:\s]*(\d+)/i, /(\d+)\s*(?:x\s*)?c3/i],
    },
  };

/**
 * Extract field values from document text using regex patterns.
 * Returns extracted fields, per-field confidence scores, and overall confidence.
 */
export function extractFields(
  text: string,
  schema: ExtractionSchema,
): ExtractionResult {
  const fields: Record<string, any> = {};
  const confidence: Record<string, number> = {};
  const patterns = FIELD_PATTERNS[schema.documentType] || {};

  let totalConfidence = 0;
  let fieldCount = 0;

  for (const fieldDef of schema.fields) {
    const fieldPatterns = patterns[fieldDef.name];
    let value: any = null;
    let conf = 0;

    if (fieldPatterns) {
      switch (fieldDef.type) {
        case "date":
          value = extractDate(text, fieldPatterns);
          break;
        case "number":
          value = extractNumber(text, fieldPatterns);
          break;
        case "currency":
          value = extractCurrency(text, fieldPatterns);
          break;
        case "boolean": {
          const raw = tryPatterns(text, fieldPatterns);
          value = raw ? true : null;
          break;
        }
        default:
          value = tryPatterns(text, fieldPatterns);
      }
    }

    if (value !== null && value !== undefined) {
      // Validate against regex if provided
      if (fieldDef.validationRegex && typeof value === "string") {
        const valid = new RegExp(fieldDef.validationRegex).test(value);
        conf = valid ? 85 : 50;
      } else {
        conf = 80;
      }
    } else {
      conf = 0;
    }

    fields[fieldDef.name] = value;
    confidence[fieldDef.name] = conf;

    if (fieldDef.required) {
      totalConfidence += conf;
      fieldCount++;
    }
  }

  const overallConfidence =
    fieldCount > 0 ? Math.round(totalConfidence / fieldCount) : 0;

  return { fields, confidence, overallConfidence };
}

// ============================================================================
// Cross-Check Runner
// ============================================================================

/**
 * Run all cross-checks defined in the schema against extracted fields.
 */
export function runCrossChecks(
  fields: Record<string, any>,
  schema: ExtractionSchema,
): CrossCheckResult[] {
  return schema.crossChecks.map((cc) => {
    try {
      const result = cc.check(fields);
      return { name: cc.name, ...result };
    } catch (err: any) {
      return {
        name: cc.name,
        pass: false,
        message: `Cross-check error: ${err.message}`,
      };
    }
  });
}

// ============================================================================
// AI Prompt Builder (Fallback)
// ============================================================================

/**
 * Build an AI prompt for OpenRouter to extract structured fields from document text.
 * Used when regex extraction yields low confidence (<60%).
 */
export function buildExtractionPrompt(
  text: string,
  schema: ExtractionSchema,
): string {
  const fieldDescriptions = schema.fields
    .map((f) => {
      let desc = `- "${f.name}" (${f.type}${f.required ? ", REQUIRED" : ""}): ${f.description}`;
      if (f.validationRegex) desc += ` [format: ${f.validationRegex}]`;
      return desc;
    })
    .join("\n");

  return `You are a UK school document data extraction specialist. Extract structured data from the following ${schema.documentType.replace(/_/g, " ")} document.

## Fields to extract:
${fieldDescriptions}

## Rules:
- Return ONLY valid JSON with the field names as keys.
- Use null for any field you cannot find in the text.
- Dates should be in ISO format (YYYY-MM-DD).
- Currency values should be plain numbers (no symbols), e.g. 1234.56
- For boolean fields, use true/false.
- Do NOT invent data. If a field is not present, return null.
- For the "result" field, normalise to: pass/fail, satisfactory/unsatisfactory, clear/blemished as appropriate.

## Document text:
---
${text.slice(0, 8000)}
---

Respond with ONLY the JSON object. No markdown, no explanation.`;
}

/**
 * Parse AI extraction response into fields and confidence scores.
 */
export function parseAIResponse(
  response: string,
  schema: ExtractionSchema,
): ExtractionResult {
  // Strip markdown code fences if present
  let json = response.trim();
  if (json.startsWith("```")) {
    json = json.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }

  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { fields: {}, confidence: {}, overallConfidence: 0 };
  }

  const fields: Record<string, any> = {};
  const confidence: Record<string, number> = {};
  let totalConf = 0;
  let reqCount = 0;

  for (const fieldDef of schema.fields) {
    const val = parsed[fieldDef.name] ?? null;
    fields[fieldDef.name] = val;

    let conf = 0;
    if (val !== null && val !== undefined && val !== "") {
      conf = 75; // AI-extracted baseline confidence
      if (fieldDef.validationRegex && typeof val === "string") {
        conf = new RegExp(fieldDef.validationRegex).test(val) ? 80 : 55;
      }
    }
    confidence[fieldDef.name] = conf;

    if (fieldDef.required) {
      totalConf += conf;
      reqCount++;
    }
  }

  return {
    fields,
    confidence,
    overallConfidence: reqCount > 0 ? Math.round(totalConf / reqCount) : 0,
  };
}
