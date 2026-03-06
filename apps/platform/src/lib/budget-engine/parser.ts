/**
 * Budget Report Parser
 *
 * Parses CSV/Excel budget reports from UK school finance systems
 * and converts them into BudgetPlan objects for the decision engine.
 *
 * Supports:
 * - CFR-coded budget reports (universal DfE standard)
 * - PS Financials / IRIS exports
 * - Sage 200/Intacct exports
 * - Generic ledger exports with account code mapping
 *
 * The parser is smart about:
 * - Detecting which columns contain what (fuzzy header matching)
 * - Recognising CFR codes in various formats (E01, E-01, E.01, e01)
 * - Handling both budget vs actual in same file or separate files
 * - Detecting income vs expenditure rows
 * - Extracting financial year from data
 */

import { CFR_EXPENDITURE, type CFRCode } from "./types";
import type { BudgetPlan, BudgetLine, MonthlySpend } from "./types";

// =====================================================
// PUBLIC API
// =====================================================

export interface ParseResult {
  success: boolean;
  plan: BudgetPlan | null;
  warnings: string[];
  errors: string[];
  /** How many rows were parsed successfully */
  rows_parsed: number;
  /** How many rows were skipped (unrecognised) */
  rows_skipped: number;
  /** Detected format */
  detected_format: string;
  /** Unmapped account codes found */
  unmapped_codes: string[];
}

/**
 * Parse a CSV string into a BudgetPlan.
 * Auto-detects format, column mapping, and CFR codes.
 */
export function parseBudgetCSV(
  csv: string,
  options?: {
    school_id?: string;
    organization_id?: string;
    budget_cycle?: "la" | "academy";
    financial_year?: string;
  },
): ParseResult {
  const result: ParseResult = {
    success: false,
    plan: null,
    warnings: [],
    errors: [],
    rows_parsed: 0,
    rows_skipped: 0,
    detected_format: "unknown",
    unmapped_codes: [],
  };

  const lines = parseCSVLines(csv);
  if (lines.length < 2) {
    result.errors.push("File appears empty or has no data rows");
    return result;
  }

  // Detect headers and column mapping
  const headers = lines[0].map((h) => h.trim().toLowerCase());
  const mapping = detectColumnMapping(headers);
  result.detected_format = mapping.format;

  if (!mapping.budget_col && !mapping.amount_col) {
    result.errors.push(
      "Could not find a budget/amount column. Expected headers like: Budget, Planned, Amount, Total, Value",
    );
    return result;
  }

  if (!mapping.code_col && !mapping.description_col) {
    result.errors.push(
      "Could not find an account code or description column. Expected headers like: Code, Account, CFR, Ledger, Description",
    );
    return result;
  }

  // Parse data rows
  const budgetLines: Map<CFRCode, BudgetLine> = new Map();
  let totalIncome = 0;
  const unmappedSet = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && row[0].trim() === ""))
      continue;

    // Extract values from row
    const rawCode =
      mapping.code_col !== null ? (row[mapping.code_col] || "").trim() : "";
    const description =
      mapping.description_col !== null
        ? (row[mapping.description_col] || "").trim()
        : "";
    const budgetAmount = parseAmount(
      mapping.budget_col !== null ? row[mapping.budget_col] : "",
    );
    const actualAmount = parseAmount(
      mapping.actual_col !== null ? row[mapping.actual_col] : "",
    );
    const committedAmount = parseAmount(
      mapping.committed_col !== null ? row[mapping.committed_col] : "",
    );
    const amountValue = parseAmount(
      mapping.amount_col !== null ? row[mapping.amount_col] : "",
    );

    // Determine if this is an income or expenditure line
    const typeHint =
      mapping.type_col !== null
        ? (row[mapping.type_col] || "").trim().toLowerCase()
        : "";
    const isIncome =
      typeHint.includes("income") ||
      rawCode.toUpperCase().startsWith("I") ||
      description.toLowerCase().includes("income") ||
      description.toLowerCase().includes("grant") ||
      description.toLowerCase().includes("funding");

    if (isIncome) {
      totalIncome += budgetAmount || amountValue || 0;
      result.rows_parsed++;
      continue;
    }

    // Try to match to a CFR code
    const cfrCode = matchCFRCode(rawCode, description);

    if (!cfrCode) {
      if (rawCode || description) {
        unmappedSet.add(rawCode || description);
        result.rows_skipped++;
      }
      continue;
    }

    // Get or create the budget line
    const existing = budgetLines.get(cfrCode);
    const planned = budgetAmount || amountValue || 0;
    const actual = actualAmount || 0;
    const committed = committedAmount || 0;

    if (existing) {
      // Aggregate into existing line
      existing.planned_amount += planned;
      existing.actual_ytd += actual;
      existing.committed += committed;
      existing.available =
        existing.planned_amount - existing.actual_ytd - existing.committed;
    } else {
      budgetLines.set(cfrCode, {
        cfr_code: cfrCode,
        category: CFR_EXPENDITURE[cfrCode],
        planned_amount: planned,
        actual_ytd: actual,
        committed,
        available: planned - actual - committed,
        projected_outturn: 0,
        variance_percent: 0,
        rag: "green",
        monthly_profile: [],
        frozen: false,
      });
    }

    result.rows_parsed++;
  }

  if (budgetLines.size === 0) {
    result.errors.push(
      "No expenditure lines could be matched to CFR codes. Check the file contains budget data with recognisable account codes.",
    );
    return result;
  }

  // Calculate projected outturn and RAG for each line
  const now = new Date();
  const cycle = options?.budget_cycle || detectBudgetCycle(csv);
  const fyDates = getFYDates(cycle, options?.financial_year);
  const totalMonths = 12;
  const monthsElapsed = Math.max(1, monthsBetween(fyDates.start, now));
  const yearProgress = Math.min(monthsElapsed / totalMonths, 1);

  let totalExpenditure = 0;

  for (const line of budgetLines.values()) {
    if (line.planned_amount > 0 && line.actual_ytd > 0) {
      const monthlyRate = line.actual_ytd / monthsElapsed;
      line.projected_outturn = monthlyRate * totalMonths;
      line.variance_percent =
        ((line.projected_outturn - line.planned_amount) / line.planned_amount) *
        100;
      const spendRate =
        (line.actual_ytd + line.committed) / line.planned_amount;
      line.rag =
        spendRate > yearProgress + 0.15
          ? "red"
          : spendRate > yearProgress + 0.05
            ? "amber"
            : "green";
    }
    totalExpenditure += line.planned_amount;
  }

  // If no income detected, estimate from expenditure
  if (totalIncome === 0) {
    totalIncome = totalExpenditure * 1.02; // Assume small surplus
    result.warnings.push(
      "No income lines detected — estimated income as expenditure + 2%. Upload income data for accurate analysis.",
    );
  }

  // Build the plan
  result.plan = {
    id: `upload-${Date.now()}`,
    organization_id: options?.organization_id || "",
    school_id: options?.school_id || "",
    financial_year:
      options?.financial_year || detectFinancialYear(fyDates.start),
    budget_cycle: cycle,
    fy_start: fyDates.start.toISOString().split("T")[0],
    fy_end: fyDates.end.toISOString().split("T")[0],
    total_income: totalIncome,
    total_expenditure_planned: totalExpenditure,
    planned_surplus_deficit: totalIncome - totalExpenditure,
    status: "approved",
    lines: Array.from(budgetLines.values()).sort((a, b) =>
      a.cfr_code.localeCompare(b.cfr_code),
    ),
    strategic_priorities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  result.success = true;
  result.unmapped_codes = Array.from(unmappedSet);

  if (result.unmapped_codes.length > 0) {
    result.warnings.push(
      `${result.unmapped_codes.length} account codes could not be mapped to CFR codes: ${result.unmapped_codes.slice(0, 5).join(", ")}${result.unmapped_codes.length > 5 ? "..." : ""}`,
    );
  }

  if (result.rows_skipped > 0) {
    result.warnings.push(
      `${result.rows_skipped} rows skipped (unrecognised codes or empty rows)`,
    );
  }

  return result;
}

// =====================================================
// CSV PARSING
// =====================================================

function parseCSVLines(csv: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"' && csv[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\n" || (ch === "\r" && csv[i + 1] === "\n")) {
        current.push(field);
        field = "";
        if (current.some((c) => c.trim() !== "")) rows.push(current);
        current = [];
        if (ch === "\r") i++;
      } else {
        field += ch;
      }
    }
  }

  // Last field/row
  current.push(field);
  if (current.some((c) => c.trim() !== "")) rows.push(current);

  return rows;
}

// =====================================================
// COLUMN DETECTION
// =====================================================

interface ColumnMapping {
  format: string;
  code_col: number | null;
  description_col: number | null;
  budget_col: number | null;
  actual_col: number | null;
  committed_col: number | null;
  amount_col: number | null;
  type_col: number | null;
}

const CODE_HEADERS = [
  "cfr",
  "cfr code",
  "cfr_code",
  "code",
  "account code",
  "account_code",
  "account",
  "ledger code",
  "ledger_code",
  "gl code",
  "gl_code",
  "nominal code",
  "nominal",
  "cost centre",
  "accountno",
  "accountnumber",
];

const DESC_HEADERS = [
  "description",
  "category",
  "name",
  "account name",
  "account_name",
  "narrative",
  "detail",
  "line description",
  "item",
];

const BUDGET_HEADERS = [
  "budget",
  "planned",
  "original budget",
  "revised budget",
  "annual budget",
  "total budget",
  "budget amount",
  "budgeted",
  "plan",
  "estimate",
];

const ACTUAL_HEADERS = [
  "actual",
  "actual ytd",
  "actual_ytd",
  "spent",
  "expenditure",
  "ytd actual",
  "ytd_actual",
  "year to date",
  "actual spend",
  "actuals",
  "spend to date",
];

const COMMITTED_HEADERS = [
  "committed",
  "commitments",
  "purchase orders",
  "po value",
  "outstanding orders",
  "encumbered",
];

const AMOUNT_HEADERS = ["amount", "value", "total", "net", "gross", "sum"];

const TYPE_HEADERS = ["type", "income/expenditure", "i/e", "category type"];

function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    format: "generic",
    code_col: null,
    description_col: null,
    budget_col: null,
    actual_col: null,
    committed_col: null,
    amount_col: null,
    type_col: null,
  };

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].replace(/[^a-z0-9 _/]/g, "").trim();

    if (!mapping.code_col && CODE_HEADERS.some((c) => h === c || h.includes(c)))
      mapping.code_col = i;
    else if (
      !mapping.description_col &&
      DESC_HEADERS.some((d) => h === d || h.includes(d))
    )
      mapping.description_col = i;
    else if (
      !mapping.budget_col &&
      BUDGET_HEADERS.some((b) => h === b || h.includes(b))
    )
      mapping.budget_col = i;
    else if (
      !mapping.actual_col &&
      ACTUAL_HEADERS.some((a) => h === a || h.includes(a))
    )
      mapping.actual_col = i;
    else if (
      !mapping.committed_col &&
      COMMITTED_HEADERS.some((c) => h === c || h.includes(c))
    )
      mapping.committed_col = i;
    else if (
      !mapping.amount_col &&
      AMOUNT_HEADERS.some((a) => h === a || h.includes(a))
    )
      mapping.amount_col = i;
    else if (
      !mapping.type_col &&
      TYPE_HEADERS.some((t) => h === t || h.includes(t))
    )
      mapping.type_col = i;
  }

  // Detect format from header patterns
  if (headers.some((h) => h.includes("cfr"))) {
    mapping.format = "CFR Standard";
  } else if (headers.some((h) => h.includes("nominal") || h.includes("sage"))) {
    mapping.format = "Sage";
  } else if (
    headers.some((h) => h.includes("ledger") && h.includes("account"))
  ) {
    mapping.format = "PS Financials / IRIS";
  } else if (headers.some((h) => h.includes("accountno"))) {
    mapping.format = "Sage Intacct";
  } else if (mapping.code_col !== null || mapping.description_col !== null) {
    mapping.format = "Generic Ledger";
  }

  return mapping;
}

// =====================================================
// CFR CODE MATCHING
// =====================================================

/** Normalise a code string to match CFR format */
function normaliseCFRCode(raw: string): string {
  // Strip whitespace, dashes, dots
  let code = raw
    .trim()
    .toUpperCase()
    .replace(/[-.\s]/g, "");
  // E.g. "E01" is already right, "E1" -> "E01"
  const match = code.match(/^(E|I)(\d{1,2})([A-G]?)$/);
  if (match) {
    const num = match[2].padStart(2, "0");
    return `${match[1]}${num}${match[3] ? match[3] : ""}`;
  }
  // Handle E20A-G specifically
  const ictMatch = code.match(/^E20([A-G])$/);
  if (ictMatch) return `E20${ictMatch[1]}`;
  // Handle E28a/E28b
  const e28Match = code.match(/^E28([AB])$/i);
  if (e28Match) return `E28${e28Match[1].toLowerCase()}`;

  return code;
}

/** Try to match a raw code + description to a CFR code */
function matchCFRCode(rawCode: string, description: string): CFRCode | null {
  // 1. Direct code match
  if (rawCode) {
    const normalised = normaliseCFRCode(rawCode);
    if (normalised in CFR_EXPENDITURE) {
      return normalised as CFRCode;
    }
  }

  // 2. Description-based fuzzy matching
  const desc = (description || "").toLowerCase();
  if (!desc) return null;

  // Exact category matches
  for (const [code, label] of Object.entries(CFR_EXPENDITURE)) {
    if (desc === label.toLowerCase()) return code as CFRCode;
  }

  // Keyword matching (ordered by specificity)
  const KEYWORD_MAP: [string[], CFRCode][] = [
    [["supply teach", "supply staff cover", "supply cover"], "E02"],
    [["agency supply", "agency teach"], "E26"],
    [["teaching staff", "teacher pay", "teachers pay", "teaching pay"], "E01"],
    [["education support", "teaching assistant", "ta pay", "hlta"], "E03"],
    [["premises staff", "caretaker pay", "site manager", "site staff"], "E04"],
    [
      [
        "admin staff",
        "clerical",
        "office staff",
        "admin pay",
        "school business",
      ],
      "E05",
    ],
    [["catering staff", "cook pay", "kitchen staff"], "E06"],
    [["other staff", "midday", "lunchtime supervisor"], "E07"],
    [["indirect employee", "staff absence", "maternity", "paternity"], "E08"],
    [["staff development", "staff training", "cpd", "inset"], "E09"],
    [["supply teacher insurance", "supply insurance"], "E10"],
    [["staff insurance", "employer liability"], "E11"],
    [
      [
        "building maintenance",
        "building repair",
        "building improvement",
        "premises repair",
      ],
      "E12",
    ],
    [
      ["grounds maintenance", "grounds upkeep", "landscaping", "playground"],
      "E13",
    ],
    [["cleaning", "caretaking", "janitorial"], "E14"],
    [["water", "sewerage", "water rates"], "E15"],
    [["energy", "electricity", "gas", "heating", "fuel oil"], "E16"],
    [["rates", "business rates", "council tax"], "E17"],
    [
      ["other occupation", "rent", "lease", "security", "waste disposal"],
      "E18",
    ],
    [
      [
        "learning resource",
        "textbook",
        "book",
        "curriculum resource",
        "stationery",
      ],
      "E19",
    ],
    [["ict connect", "broadband", "internet", "wifi"], "E20A"],
    [["server", "network server"], "E20B"],
    [["ict learning", "educational software"], "E20C"],
    [["admin software", "mis software", "sims"], "E20D"],
    [["laptop", "desktop", "tablet", "chromebook", "ipad"], "E20E"],
    [
      ["ict hardware", "printer", "projector", "interactive whiteboard"],
      "E20F",
    ],
    [["it support", "ict support", "technical support"], "E20G"],
    [["exam", "examination"], "E21"],
    [
      ["admin supplies", "office supplies", "postage", "telephone", "printing"],
      "E22",
    ],
    [["insurance premium", "buildings insurance", "contents insurance"], "E23"],
    [["special facilities", "swimming", "sports facilities"], "E24"],
    [
      ["catering supplies", "food supplies", "kitchen supplies", "ingredients"],
      "E25",
    ],
    [["professional services curriculum", "education consultant"], "E27"],
    [
      ["professional services", "legal", "audit", "accountancy", "consultancy"],
      "E28a",
    ],
    [["pfi", "private finance"], "E28b"],
    [["loan interest", "bank charges"], "E29"],
    [["revenue financing", "capital from revenue"], "E30"],
    [["community staff"], "E31"],
    [["community cost", "community facilities"], "E32"],
  ];

  for (const [keywords, code] of KEYWORD_MAP) {
    if (keywords.some((kw) => desc.includes(kw))) {
      return code;
    }
  }

  return null;
}

// =====================================================
// AMOUNT PARSING
// =====================================================

function parseAmount(raw: string | undefined): number {
  if (!raw) return 0;
  // Strip currency symbols, commas, spaces, parentheses (negative)
  let cleaned = raw.trim().replace(/[£$€\s,]/g, "");
  let negative = false;
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    cleaned = cleaned.slice(1, -1);
    negative = true;
  }
  if (cleaned.startsWith("-")) {
    cleaned = cleaned.slice(1);
    negative = true;
  }
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return negative ? -num : num;
}

// =====================================================
// DATE / YEAR DETECTION
// =====================================================

function detectBudgetCycle(csv: string): "la" | "academy" {
  const lower = csv.toLowerCase();
  if (
    lower.includes("academy") ||
    lower.includes("trust") ||
    lower.includes("september")
  )
    return "academy";
  return "la";
}

function getFYDates(
  cycle: "la" | "academy",
  yearStr?: string,
): { start: Date; end: Date } {
  const now = new Date();
  if (cycle === "academy") {
    const year = yearStr
      ? parseInt(yearStr.split("/")[0])
      : now.getMonth() >= 8
        ? now.getFullYear()
        : now.getFullYear() - 1;
    return {
      start: new Date(year, 8, 1), // September
      end: new Date(year + 1, 7, 31), // August
    };
  }
  // LA: April to March
  const year = yearStr
    ? parseInt(yearStr.split("/")[0])
    : now.getMonth() >= 3
      ? now.getFullYear()
      : now.getFullYear() - 1;
  return {
    start: new Date(year, 3, 1), // April
    end: new Date(year + 1, 2, 31), // March
  };
}

function detectFinancialYear(fyStart: Date): string {
  const startYear = fyStart.getFullYear();
  return `${startYear}/${(startYear + 1).toString().slice(2)}`;
}

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

// =====================================================
// SAMPLE CSV GENERATOR (for download template)
// =====================================================

export function generateSampleCSV(): string {
  const headers = [
    "CFR Code",
    "Description",
    "Budget",
    "Actual YTD",
    "Committed",
    "Type",
  ];

  const incomeRows = [
    ["I01", "Delegated budget share", "1200000", "", "", "Income"],
    ["I05", "Pupil Premium", "85000", "", "", "Income"],
    ["I06", "Other government grants", "45000", "", "", "Income"],
    ["I13", "Donations and voluntary funds", "12000", "", "", "Income"],
  ];

  const expenditureRows = Object.entries(CFR_EXPENDITURE).map(
    ([code, desc]) => [code, desc, "", "", "", "Expenditure"],
  );

  const allRows = [headers, ...incomeRows, ...expenditureRows];
  return allRows
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
}
