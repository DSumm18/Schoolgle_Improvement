/**
 * FMS Detailed Cost Centre Transaction Report Parser
 *
 * Parses the specific format exported from SIMS FMS, Bromcom, or Access Finance.
 * This is the "Detailed Cost Centre Transaction Report" which includes:
 * - Header section with school name, financial year, selection criteria
 * - Per cost-centre blocks with allocation, commitment, and transaction detail
 * - Ledger-Fund Code sub-blocks with individual GL/PO/AP transactions
 *
 * Income cost centres (7xxx) have negative actuals.
 * Cost centre numbering: 1xxx=Staff, 2xxx=Premises, 3xxx=Utilities,
 * 4xxx=Resources, 5xxx=Services, 6xxx=Capital revenue, 7xxx=Income,
 * 8xxx=Balance b/f, GTxxx=Capital grants.
 */

// =====================================================
// TYPES
// =====================================================

export type FMSCostCategory =
  | "staff"
  | "premises"
  | "utilities"
  | "resources"
  | "services"
  | "capital_revenue"
  | "income"
  | "balance"
  | "capital";

export interface FMSTransaction {
  type: "GL" | "PO" | "AP" | "SI" | "SC" | "OB" | string;
  period: number;
  date: string;
  details: string;
  narrative: string;
  commitment: number;
  centrally_invoiced: number;
  actual: number;
  status: string;
  year_status: string;
  ledger_code: string;
  cost_centre: string;
}

export interface FMSLedgerCode {
  code: string;
  fund: string;
  description: string;
  total: number;
}

export interface FMSCostCentre {
  code: string;
  name: string;
  category: FMSCostCategory;
  allocated: number;
  committed: number;
  centrally_invoiced: number;
  actual: number;
  balance: number;
  spent_percent: number;
  threshold_percent: number;
  ledger_codes: FMSLedgerCode[];
  transactions: FMSTransaction[];
  cfr_code?: string;
}

export interface FMSBudgetSummary {
  total_income_allocated: number;
  total_income_actual: number;
  total_expenditure_allocated: number;
  total_expenditure_actual: number;
  total_committed: number;
  net_position: number;
  balance_brought_forward: number;
  staff_costs_actual: number;
  staff_costs_percent_of_income: number;
  monthly_expenditure: Record<number, number>;
  monthly_income: Record<number, number>;
}

export interface FMSParseResult {
  success: boolean;
  school_name: string;
  financial_year: string;
  cost_centres: FMSCostCentre[];
  summary: FMSBudgetSummary;
  warnings: string[];
  errors: string[];
}

// =====================================================
// EXCEL SERIAL DATE CONVERTER
// =====================================================

/**
 * Convert an Excel serial date number to an ISO date string.
 *
 * Excel dates are the number of days since 1900-01-00 (a fictitious date).
 * Excel incorrectly treats 1900 as a leap year (the Lotus 1-2-3 bug),
 * so serial 60 = 1900-02-29 which never existed. For dates after
 * 1900-02-28 we subtract 2 from the serial; for earlier dates we
 * subtract 1.
 *
 * Example: 43572 -> 2019-04-18
 */
export function excelSerialToDate(serial: number): string {
  if (typeof serial !== "number" || isNaN(serial) || serial < 1) {
    return "";
  }

  // Excel epoch: 1900-01-01 is serial 1
  // But Excel thinks 1900-02-29 exists (serial 60), so for serials > 59
  // we need to subtract an extra day.
  const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // 1899-12-30
  const msPerDay = 86400000;

  // For serials <= 59, the date is correct relative to 1900-01-01=1
  // For serials > 59, subtract 1 day to account for the phantom leap day
  const adjustedSerial = serial > 59 ? serial - 1 : serial;
  const date = new Date(excelEpoch.getTime() + adjustedSerial * msPerDay);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// =====================================================
// NAME / PII SANITISATION
// =====================================================

/**
 * Common UK first names used to detect "FirstName LastName" patterns.
 * This is intentionally a small set — we combine it with structural
 * detection (after JV.: prefix, Ref: prefix, etc.) for higher recall.
 */
const COMMON_FIRST_NAMES = new Set([
  "james",
  "john",
  "robert",
  "michael",
  "david",
  "richard",
  "thomas",
  "mark",
  "paul",
  "andrew",
  "daniel",
  "matthew",
  "christopher",
  "peter",
  "stephen",
  "ian",
  "simon",
  "william",
  "gary",
  "stuart",
  "martin",
  "alan",
  "kevin",
  "graham",
  "colin",
  "neil",
  "barry",
  "phillip",
  "tony",
  "anthony",
  "brian",
  "sarah",
  "emma",
  "laura",
  "claire",
  "helen",
  "michelle",
  "karen",
  "lisa",
  "susan",
  "amanda",
  "sharon",
  "donna",
  "julie",
  "jane",
  "rachel",
  "rebecca",
  "nicola",
  "tracy",
  "louise",
  "catherine",
  "samantha",
  "deborah",
  "jessica",
  "kate",
  "charlotte",
  "victoria",
  "jennifer",
  "andrea",
  "caroline",
  "joanne",
  "mary",
  "margaret",
  "anne",
  "elizabeth",
  "patricia",
  "barbara",
  "ann",
  "george",
  "edward",
  "philip",
  "adam",
  "alex",
  "alexander",
  "benjamin",
  "caroline",
  "chloe",
  "emily",
  "hannah",
  "jack",
  "jake",
  "joseph",
  "joshua",
  "lewis",
  "luke",
  "nathan",
  "oliver",
  "ryan",
  "samuel",
  "sophie",
  "tom",
]);

/**
 * Sanitise FMS transaction details to remove personally identifiable information.
 *
 * Removes:
 * - Names after JV.: prefix (e.g. "JV.:022791 G Hosford" -> "JV.:022791 [name]")
 * - Names after Ref: patterns
 * - Invoice numbers (retain structure but mask digits)
 * - School-specific names
 * - Any "FirstName LastName" pattern where FirstName is in our common names list
 *
 * Keeps:
 * - Transaction type codes (JV, PO, AP, SI)
 * - Reference numbers structure
 * - Period references (MTH xx)
 * - Generic descriptions (e.g. "Salary", "Rates", "Electricity")
 */
export function sanitiseDetails(details: string): string {
  if (!details || typeof details !== "string") return "";

  let sanitised = details;

  // Pattern 1: "JV.:XXXXXX FirstInitial LastName" or "JV.:XXXXXX FirstName LastName"
  // e.g. "JV.:022791 G Hosford" -> "JV.:022791 [name]"
  sanitised = sanitised.replace(
    /\b(JV\.?:?\s*\d+)\s+[A-Z][\w]*\s+[A-Z][a-z]+/g,
    "$1 [name]",
  );

  // Pattern 2: Names after common prefixes
  // e.g. "Mrs J Smith", "Mr A Jones", "Dr K Patel"
  sanitised = sanitised.replace(
    /\b(Mrs?|Ms|Miss|Dr|Prof)\s+[A-Z]\.?\s*[A-Z][a-z]{1,20}\b/g,
    "[name]",
  );

  // Pattern 3: Initial + Surname pattern (common in FMS)
  // e.g. "G Hosford", "J Smith" — only when preceded by a reference number
  sanitised = sanitised.replace(
    /(\d{4,})\s+[A-Z]\s+[A-Z][a-z]{2,15}/g,
    "$1 [name]",
  );

  // Pattern 4: Known first names followed by a capitalised surname
  const namePattern = new RegExp(
    "\\b(" +
      Array.from(COMMON_FIRST_NAMES).join("|") +
      ")\\s+[A-Z][a-z]{1,20}\\b",
    "gi",
  );
  sanitised = sanitised.replace(namePattern, "[name]");

  // Pattern 5: Invoice numbers — keep "INV" prefix, mask the number
  sanitised = sanitised.replace(
    /\b(INV|PINV|SINV)[.:# ]*(\d{4,})\b/gi,
    "$1:[invoice]",
  );

  // Pattern 6: Specific school names — replace anything that looks like
  // "XXXX Primary School", "XXXX Academy", "XXXX School", etc.
  sanitised = sanitised.replace(
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Primary|Secondary|Academy|School|College|Infant|Junior|High)\b/g,
    "[school]",
  );

  // Pattern 7: Email addresses
  sanitised = sanitised.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    "[email]",
  );

  // Clean up multiple spaces
  sanitised = sanitised.replace(/\s{2,}/g, " ").trim();

  return sanitised;
}

// =====================================================
// CFR CODE MAPPING
// =====================================================

/**
 * Map an FMS cost centre code and name to the DfE CFR (Consistent Financial
 * Reporting) code. Uses the cost centre name for fuzzy matching since FMS
 * cost centre codes are school-specific, not standardised.
 *
 * Returns undefined if no confident mapping can be made.
 */
export function mapToCFR(
  costCentreCode: string,
  costCentreName: string,
): string | undefined {
  const name = (costCentreName || "").toLowerCase().trim();
  const code = (costCentreCode || "").trim();

  // --- Expenditure mappings (E codes) ---

  // E02 Supply teaching staff (check BEFORE E01 — "supply teaching" must not match E01)
  if (
    /\b(?:supply\s*(?:staff|teach|cover)|supply\s+teaching)\b/.test(name) &&
    !/agency/.test(name)
  )
    return "E02";

  // E01 Teaching staff
  if (
    /\b(?:teacher(?:s|'s)?|teaching\s*staff)\b/.test(name) &&
    !/supply|agency|assist/.test(name)
  )
    return "E01";

  // E03 Education support staff (TAs, HLTAs, learning support, teaching assistants)
  if (
    /\b(?:teaching\s*assist\w*|learning\s*support|hlta|education\s*support)\b/.test(
      name,
    )
  )
    return "E03";

  // E04 Premises staff
  if (
    /\b(?:premises\s*staff|caretaker|site\s*(?:manager|staff|agent))\b/.test(
      name,
    )
  )
    return "E04";

  // E05 Administrative and clerical staff
  if (/\b(?:admin|clerical|office\s*staff|school\s*business)\b/.test(name))
    return "E05";

  // E06 Catering staff
  if (/\b(?:catering\s*staff|cook|kitchen\s*staff)\b/.test(name)) return "E06";

  // E07 Cost of other staff
  if (/\b(?:midday|lunchtime\s*supervisor|other\s*staff|welfare)\b/.test(name))
    return "E07";

  // E08 Indirect employee expenses
  if (
    /\b(?:indirect\s*employee|staff\s*(?:absence|travel)|maternity|paternity|pension|ni\b|national\s*insurance)\b/.test(
      name,
    )
  )
    return "E08";

  // E09 Staff development and training
  if (
    /\b(?:staff\s*(?:development|training)|cpd|inset|training\s*&?\s*recruit|recruitment)\b/.test(
      name,
    )
  )
    return "E09";

  // E10 Supply teacher insurance
  if (/\b(?:supply\s*(?:teacher\s*)?insurance)\b/.test(name)) return "E10";

  // E11 Staff-related insurance
  if (
    /\b(?:staff\s*(?:related\s*)?insurance|employer\s*liability)\b/.test(name)
  )
    return "E11";

  // E12 Building maintenance and improvement
  if (
    /\b(?:building\s*(?:maint|repair|improv)|premises\s*(?:maint|repair))/.test(
      name,
    )
  )
    return "E12";

  // E13 Grounds maintenance and improvement
  if (
    /\b(?:grounds?\s*(?:maint\w*|upkeep)|landscap|playground\s*maint)\b/.test(
      name,
    )
  )
    return "E13";

  // E14 Cleaning and caretaking
  if (
    /\b(?:clean(?:ing|ers?)|caretaking|contract\s*clean|janitorial)\b/.test(
      name,
    )
  )
    return "E14";

  // E15 Water and sewerage
  if (/\b(?:water|sewerage)\b/.test(name)) return "E15";

  // E16 Energy
  if (/\b(?:gas|electric(?:ity)?|energy|heating|fuel\s*oil)\b/.test(name))
    return "E16";

  // E17 Rates
  if (/\b(?:rates|business\s*rates|council\s*tax)\b/.test(name)) return "E17";

  // E18 Other occupation costs
  if (
    /\b(?:other\s*occupation|rent|lease|security|waste\s*disposal|refuse)\b/.test(
      name,
    )
  )
    return "E18";

  // E19 Learning resources (also curriculum, furniture & equipment)
  if (
    /\b(?:learning\s*resource|textbook|book|curriculum|stationery|furniture|equipment)/.test(
      name,
    ) &&
    !/ict|it\b|computer|digital/.test(name)
  )
    return "E19";

  // E20A-G ICT sub-categories
  if (
    /\b(?:ict|it)\b/.test(name) ||
    /\b(?:computer|technology|digital)\b/.test(name)
  ) {
    if (/\b(?:connect|broadband|internet|wifi|wan)\b/.test(name)) return "E20A";
    if (/\b(?:server)\b/.test(name)) return "E20B";
    if (/\b(?:learning|educational\s*software)\b/.test(name)) return "E20C";
    if (/\b(?:admin|mis|sims|management\s*information)\b/.test(name))
      return "E20D";
    if (/\b(?:laptop|desktop|tablet|chromebook|ipad|device)\b/.test(name))
      return "E20E";
    if (/\b(?:hardware|printer|projector|whiteboard)\b/.test(name))
      return "E20F";
    if (/\b(?:support|contract|maintenance)\b/.test(name)) return "E20G";
    // Generic ICT falls to E20C (learning resources is the most common school ICT spend)
    return "E20C";
  }

  // E21 Examination fees
  if (/\b(?:exam(?:ination)?\s*fee|exam\s*fees?)\b/.test(name)) return "E21";

  // E22 Administrative supplies (also photocopier, communications, reprographics)
  if (
    /\b(?:admin\s*suppli|office\s*suppli|postage|telephone|printing|photocopying|photocopier|reprographic|communication\w*)\b/.test(
      name,
    )
  )
    return "E22";

  // E23 Other insurance premiums
  if (
    /\b(?:insurance\s*premium|buildings?\s*insurance|contents?\s*insurance)/.test(
      name,
    )
  )
    return "E23";

  // E24 Special facilities (also educational visits)
  if (
    /\b(?:special\s*facilit|swimming|sports?\s*facilit|lettings?\s*cost|educational\s*visit|school\s*trip|excursion)/.test(
      name,
    )
  )
    return "E24";

  // E25 Catering supplies (also contract catering)
  if (
    /\b(?:catering\s*suppli|food\s*suppli|kitchen\s*suppli|ingredients?|free\s*school\s*meal|contract\s*catering)/.test(
      name,
    )
  )
    return "E25";

  // E26 Agency supply teaching staff
  if (/\b(?:agency\s*(?:supply|teach|staff))\b/.test(name)) return "E26";

  // E27 Bought-in professional services - curriculum
  if (
    /\b(?:professional\s*service.*curriculum|education\s*consultant|bought.*curriculum)\b/.test(
      name,
    )
  )
    return "E27";

  // E28a Bought-in professional services - other
  if (
    /\b(?:professional\s*service|legal|audit|accountancy|consultancy|bought.?in\s*service)/.test(
      name,
    )
  )
    return "E28a";

  // E28b PFI
  if (/\b(?:pfi|private\s*finance)\b/.test(name)) return "E28b";

  // E29 Loan interest
  if (/\b(?:loan\s*interest|bank\s*charge)\b/.test(name)) return "E29";

  // E30 Direct revenue financing (capital from revenue)
  if (
    /\b(?:revenue\s*financ|capital\s*from\s*revenue|revenue\s*contribution)\b/.test(
      name,
    )
  )
    return "E30";

  // --- Income mappings (I codes) ---

  if (
    /\b(?:dsg|delegated\s*(?:schools?\s*)?grant|school\s*budget\s*share|gag)\b/.test(
      name,
    )
  )
    return "I01";

  if (/\b(?:sen\s*(?:top.?up|funding)|high\s*needs)\b/.test(name)) return "I03";

  if (/\b(?:uifsm|universal\s*infant\s*free\s*school\s*meal)\b/.test(name))
    return "I04";

  if (/\b(?:pupil\s*premium)\b/.test(name)) return "I05";

  if (/\b(?:sports?\s*premium|pe\s*(?:and\s*)?sport)\b/.test(name))
    return "I06b";

  if (
    /\b(?:government\s*grant|specific\s*grant)/.test(name) &&
    !/pupil\s*premium|sen|uifsm/.test(name)
  )
    return "I06";

  if (
    /\b(?:other\s*(?:income|grant)|training\s*income|miscellaneous\s*income)/.test(
      name,
    )
  )
    return "I07";

  if (/\b(?:letting|hire|rental\s*income)/.test(name)) return "I08a";

  if (/\b(?:catering\s*income|dinner\s*money|meal\s*income)/.test(name))
    return "I09";

  if (/\b(?:insurance\s*claim|insurance\s*income)/.test(name)) return "I10";

  if (/\b(?:donation|voluntary\s*fund|gift)\b/.test(name)) return "I13";

  if (/\b(?:fund\s*rais|fete|fayre|pta)\b/.test(name)) return "I14";

  // --- Balance ---
  if (
    /\b(?:balance\s*(?:brought|b[./]?f)|opening\s*balance|carry\s*forward)/.test(
      name,
    )
  )
    return "B01";

  // Capital cost centres
  if (code.toUpperCase().startsWith("GT")) return "CI01";

  return undefined;
}

// =====================================================
// COST CENTRE CATEGORY DETECTION
// =====================================================

function detectCategory(code: string): FMSCostCategory {
  const upper = code.toUpperCase().trim();

  // Capital grants
  if (upper.startsWith("GT")) return "capital";

  // Extract leading digit(s)
  const leadingDigit = upper.charAt(0);

  switch (leadingDigit) {
    case "1":
      return "staff";
    case "2":
      return "premises";
    case "3":
      return "utilities";
    case "4":
      return "resources";
    case "5":
      return "services";
    case "6":
      return "capital_revenue";
    case "7":
      return "income";
    case "8":
      return "balance";
    default:
      return "services"; // fallback
  }
}

// =====================================================
// AMOUNT PARSING
// =====================================================

function parseAmount(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;

  const str = String(value).trim();
  if (str === "" || str === "-") return 0;

  // Strip currency symbols, commas, spaces
  let cleaned = str.replace(/[£$€\s,]/g, "");

  // Handle parenthesised negatives: (1234.56)
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
// DATE PARSING
// =====================================================

/**
 * Parse a date value that could be:
 * - An Excel serial number (e.g. 43572)
 * - A UK date string (e.g. "18/04/2019")
 * - An ISO date string (e.g. "2019-04-18")
 * Returns ISO date string YYYY-MM-DD or empty string.
 */
function parseDate(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  // Excel serial number
  if (typeof value === "number" && value > 1000) {
    return excelSerialToDate(value);
  }

  const str = String(value).trim();

  // Excel serial as string
  const asNum = Number(str);
  if (
    !isNaN(asNum) &&
    asNum > 1000 &&
    !str.includes("/") &&
    !str.includes("-")
  ) {
    return excelSerialToDate(asNum);
  }

  // UK format: DD/MM/YYYY
  const ukMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const day = ukMatch[1].padStart(2, "0");
    const month = ukMatch[2].padStart(2, "0");
    return `${ukMatch[3]}-${month}-${day}`;
  }

  // ISO format: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return "";
}

// =====================================================
// MAIN PARSER
// =====================================================

/**
 * Parse an FMS "Detailed Cost Centre Transaction Report".
 *
 * @param data - Array of arrays (rows x columns), as produced by the xlsx
 *   library's `sheet_to_json({ header: 1 })` or similar.
 * @returns Parsed result with cost centres, transactions, and summary.
 */
export function parseFMSReport(data: unknown[][]): FMSParseResult {
  const result: FMSParseResult = {
    success: false,
    school_name: "",
    financial_year: "",
    cost_centres: [],
    summary: {
      total_income_allocated: 0,
      total_income_actual: 0,
      total_expenditure_allocated: 0,
      total_expenditure_actual: 0,
      total_committed: 0,
      net_position: 0,
      balance_brought_forward: 0,
      staff_costs_actual: 0,
      staff_costs_percent_of_income: 0,
      monthly_expenditure: {},
      monthly_income: {},
    },
    warnings: [],
    errors: [],
  };

  if (!data || !Array.isArray(data) || data.length < 15) {
    result.errors.push(
      "Data appears too short to be an FMS Detailed Cost Centre Transaction Report",
    );
    return result;
  }

  // --- HEADER EXTRACTION ---
  extractHeader(data, result);

  // --- BODY PARSING ---
  parseCostCentreBlocks(data, result);

  if (result.cost_centres.length === 0) {
    result.errors.push("No cost centre blocks found in the report");
    return result;
  }

  // --- MAP CFR CODES ---
  for (const cc of result.cost_centres) {
    cc.cfr_code = mapToCFR(cc.code, cc.name);
  }

  // --- BUILD SUMMARY ---
  buildSummary(result);

  result.success = result.errors.length === 0;
  return result;
}

// =====================================================
// HEADER EXTRACTION
// =====================================================

function extractHeader(data: unknown[][], result: FMSParseResult): void {
  // Row 0 should be "Detailed Cost Centre Transaction Report" or similar
  const row0 = cellStr(data, 0, 0);
  if (
    !row0.toLowerCase().includes("cost centre") &&
    !row0.toLowerCase().includes("transaction report")
  ) {
    result.warnings.push(
      `Row 1 does not contain expected report title. Found: "${row0.substring(0, 60)}"`,
    );
  }

  // Financial year — scan first 15 rows for "Financial Year" or "20xx/xx"
  for (let r = 0; r < Math.min(15, data.length); r++) {
    const rowText = rowToString(data[r]);
    const fyMatch = rowText.match(
      /Financial\s+Year\s*[-:]\s*(\d{4}\/\d{2,4})/i,
    );
    if (fyMatch) {
      result.financial_year = fyMatch[1];
      break;
    }
    // Also try just a year pattern like "2019/20" or "2019/2020"
    const yearMatch = rowText.match(/\b(20\d{2}\/\d{2,4})\b/);
    if (yearMatch && !result.financial_year) {
      result.financial_year = yearMatch[1];
    }
  }

  if (!result.financial_year) {
    result.warnings.push("Could not detect financial year from report header");
  }

  // School name — look for "Establishment :" in first 15 rows
  for (let r = 0; r < Math.min(15, data.length); r++) {
    const rowText = rowToString(data[r]);
    const estMatch = rowText.match(/Establishment\s*:\s*(.+)/i);
    if (estMatch) {
      result.school_name = estMatch[1].trim();
      break;
    }
  }

  if (!result.school_name) {
    result.warnings.push("Could not detect school name from report header");
  }
}

// =====================================================
// COST CENTRE BLOCK PARSING
// =====================================================

function parseCostCentreBlocks(
  data: unknown[][],
  result: FMSParseResult,
): void {
  let currentCC: FMSCostCentre | null = null;
  let currentLedger: FMSLedgerCode | null = null;
  let expectingAllocationValues = false;
  let i = 0;

  while (i < data.length) {
    const row = data[i] || [];
    const cell0 = cellStr(data, i, 0);

    // --- Detect Cost Centre header ---
    // "Cost Centre : 1101001 Teachers"
    const ccMatch = cell0.match(/Cost\s+Centre\s*:\s*(\S+)\s+(.*)/i);
    if (ccMatch) {
      // Save previous cost centre
      if (currentCC) {
        finaliseCostCentre(currentCC);
        result.cost_centres.push(currentCC);
      }

      currentCC = {
        code: ccMatch[1].trim(),
        name: ccMatch[2].trim(),
        category: detectCategory(ccMatch[1].trim()),
        allocated: 0,
        committed: 0,
        centrally_invoiced: 0,
        actual: 0,
        balance: 0,
        spent_percent: 0,
        threshold_percent: 0,
        ledger_codes: [],
        transactions: [],
      };
      currentLedger = null;
      expectingAllocationValues = false;
      i++;
      continue;
    }

    // --- Detect allocation header row ---
    // "Allocated, Committed, ..., Cent. Inv'd, Actual, Balance, Spent %, Threshold %"
    if (currentCC && isAllocationHeader(row)) {
      expectingAllocationValues = true;
      i++;
      continue;
    }

    // --- Allocation values row (follows allocation header) ---
    if (currentCC && expectingAllocationValues) {
      parseAllocationValues(row, currentCC);
      expectingAllocationValues = false;
      i++;
      continue;
    }

    // --- Detect Ledger-Fund Code header ---
    // "Ledger-Fund Code : 00103-01" | "" | "" | "Teachers-School Budget Share"
    const ledgerMatch = cell0.match(/Ledger[-\s]*Fund\s+Code\s*:\s*(\S+)/i);
    if (ledgerMatch && currentCC) {
      // Extract description — usually in column 3 or combined in cell0
      let description = "";
      for (let c = 1; c < (row.length || 0); c++) {
        const val = cellStr(data, i, c);
        if (val && val.length > 2) {
          description = val;
          break;
        }
      }

      // Also check if description is part of cell0 after the code
      if (!description) {
        const descInCell = cell0.match(
          /Ledger[-\s]*Fund\s+Code\s*:\s*\S+\s+(.*)/i,
        );
        if (descInCell) description = descInCell[1].trim();
      }

      const codeStr = ledgerMatch[1].trim();
      const fundMatch = codeStr.match(/-(\d+)$/);

      currentLedger = {
        code: codeStr,
        fund: fundMatch ? fundMatch[1] : "",
        description: description,
        total: 0,
      };
      currentCC.ledger_codes.push(currentLedger);
      i++;
      continue;
    }

    // --- Detect Ledger-Fund Code Total ---
    if (cell0.match(/Ledger[-\s]*Fund\s+Code\s+Total/i) && currentLedger) {
      // The total row typically has the actual total in the "Actual" column position
      const totalRow = row as unknown[];
      // Find the largest absolute number in the row — that's likely the total
      let maxAbs = 0;
      let totalVal = 0;
      for (let c = 0; c < totalRow.length; c++) {
        const v = parseAmount(totalRow[c]);
        if (Math.abs(v) > maxAbs) {
          maxAbs = Math.abs(v);
          totalVal = v;
        }
      }
      currentLedger.total = totalVal;
      currentLedger = null;
      i++;
      continue;
    }

    // --- Detect Cost Centre Total ---
    if (cell0.match(/Cost\s+Centre\s+Total/i)) {
      // Skip — we already have values from allocation row
      i++;
      continue;
    }

    // --- Transaction rows ---
    if (currentCC && row.length >= 4) {
      const txn = tryParseTransaction(
        row,
        currentCC.code,
        currentLedger?.code || "",
      );
      if (txn) {
        currentCC.transactions.push(txn);
        i++;
        continue;
      }
    }

    i++;
  }

  // Push the last cost centre
  if (currentCC) {
    finaliseCostCentre(currentCC);
    result.cost_centres.push(currentCC);
  }
}

// =====================================================
// ALLOCATION PARSING
// =====================================================

function isAllocationHeader(row: unknown[]): boolean {
  const text = rowToString(row).toLowerCase();
  return (
    text.includes("allocated") &&
    (text.includes("actual") ||
      text.includes("balance") ||
      text.includes("spent"))
  );
}

/**
 * Parse allocation values row. The expected order is:
 * [Allocated, Committed, (blank), Cent. Inv'd, Actual, Balance, Spent %, Threshold %]
 * But column positions can vary, so we try to be flexible.
 */
function parseAllocationValues(row: unknown[], cc: FMSCostCentre): void {
  const nums: number[] = [];
  for (let c = 0; c < (row?.length || 0); c++) {
    const val = row[c];
    if (val === null || val === undefined || val === "") {
      nums.push(NaN);
    } else {
      nums.push(parseAmount(val));
    }
  }

  // Find valid numbers
  const validNums = nums.filter((n) => !isNaN(n) && n !== 0);

  if (validNums.length >= 5) {
    // Standard 8-column layout: Allocated, Committed, (blank), Cent. Inv'd, Actual, Balance, Spent%, Threshold%
    // Find columns with actual values
    let idx = 0;
    const ordered: number[] = [];
    for (const n of nums) {
      if (!isNaN(n)) {
        ordered.push(n);
      }
    }

    if (ordered.length >= 6) {
      cc.allocated = ordered[0];
      cc.committed = ordered[1];
      cc.centrally_invoiced = ordered[2];
      cc.actual = ordered[3];
      cc.balance = ordered[4];
      cc.spent_percent = ordered[5];
      cc.threshold_percent = ordered.length >= 7 ? ordered[6] : 100;
    } else {
      // Fewer columns — best effort
      cc.allocated = ordered[0] || 0;
      cc.actual = ordered.length > 1 ? ordered[ordered.length - 3] || 0 : 0;
      cc.balance = ordered.length > 2 ? ordered[ordered.length - 2] || 0 : 0;
    }
  } else if (validNums.length > 0) {
    // Very few values — take what we can
    cc.allocated = validNums[0] || 0;
    if (validNums.length > 1) cc.actual = validNums[1];
  }
}

// =====================================================
// TRANSACTION PARSING
// =====================================================

/** Known FMS transaction types */
const TRANSACTION_TYPES = new Set(["GL", "PO", "AP", "SI", "SC", "OB"]);

function tryParseTransaction(
  row: unknown[],
  costCentreCode: string,
  ledgerCode: string,
): FMSTransaction | null {
  if (!row || row.length < 4) return null;

  const type = String(row[0] || "")
    .trim()
    .toUpperCase();

  // Transaction rows start with a known type code
  if (!type || (!TRANSACTION_TYPES.has(type) && type.length > 3)) {
    // Could be a narrative continuation row (empty type but has details in col 3)
    if (type === "" && row.length >= 4) {
      const narrative = String(row[3] || "").trim();
      if (
        narrative &&
        narrative !== "Narrative not available" &&
        narrative.length > 2
      ) {
        // This is a narrative row — return null and let the caller handle backfill
        // Actually, we handle narrative rows by checking the previous transaction
        return null;
      }
    }
    return null;
  }

  const period = parseInt(String(row[1] || "0"));
  if (isNaN(period)) return null;

  const date = parseDate(row[2]);
  const rawDetails = String(row[3] || "");

  // Columns 4-6 are usually empty in standard layout
  // Column 7: Commitment
  // Column 8: Cent. Inv'd
  // Column 9: Actual
  // Column 10: Trans. Status
  // Column 11: Year Status

  // Find the numeric columns — they're typically at indices 7, 8, 9
  // But the number of blank columns between details and numbers varies
  let commitment = 0;
  let centInvd = 0;
  let actual = 0;
  let status = "";
  let yearStatus = "";

  // Strategy: scan from the end of the row backwards for status strings,
  // then the three numeric values
  const cells = Array.from(row);

  // Find status columns (last non-empty string cells)
  for (let c = cells.length - 1; c >= 4; c--) {
    const val = String(cells[c] || "").trim();
    if (
      val &&
      isNaN(Number(val.replace(/[,£$€\s()-]/g, ""))) &&
      val.length < 30
    ) {
      if (!yearStatus) {
        yearStatus = val;
      } else if (!status) {
        status = val;
        break;
      }
    }
  }

  // Find numeric columns for commitment, cent inv'd, actual
  // They appear before the status columns
  const numericValues: number[] = [];
  for (let c = 4; c < cells.length; c++) {
    const val = cells[c];
    if (val !== null && val !== undefined && val !== "") {
      const num = parseAmount(val);
      // Check if this looks like a number (not a status string)
      const str = String(val).trim();
      if (
        str &&
        !isNaN(Number(str.replace(/[,£$€\s()-]/g, ""))) &&
        str !== ""
      ) {
        numericValues.push(num);
      }
    }
  }

  // Standard layout has 3 numeric columns: commitment, cent inv'd, actual
  if (numericValues.length >= 3) {
    commitment = numericValues[numericValues.length - 3];
    centInvd = numericValues[numericValues.length - 2];
    actual = numericValues[numericValues.length - 1];
  } else if (numericValues.length === 2) {
    centInvd = numericValues[0];
    actual = numericValues[1];
  } else if (numericValues.length === 1) {
    actual = numericValues[0];
  }

  return {
    type: type as FMSTransaction["type"],
    period,
    date,
    details: sanitiseDetails(rawDetails),
    narrative: "",
    commitment,
    centrally_invoiced: centInvd,
    actual,
    status,
    year_status: yearStatus,
    ledger_code: ledgerCode,
    cost_centre: costCentreCode,
  };
}

// =====================================================
// POST-PROCESSING
// =====================================================

/**
 * Back-fill narrative rows into previous transactions and recalculate
 * cost centre totals from transactions if allocation row was missing.
 */
function finaliseCostCentre(cc: FMSCostCentre): void {
  // If no allocation values were parsed, sum from transactions
  if (cc.actual === 0 && cc.transactions.length > 0) {
    let totalActual = 0;
    let totalCommitment = 0;
    let totalCentInvd = 0;
    for (const txn of cc.transactions) {
      totalActual += txn.actual;
      totalCommitment += txn.commitment;
      totalCentInvd += txn.centrally_invoiced;
    }
    cc.actual = totalActual;
    cc.committed = totalCommitment;
    cc.centrally_invoiced = totalCentInvd;
    cc.balance = cc.allocated - cc.actual - cc.committed;
  }

  // Recalculate spent_percent if we have allocated
  if (cc.allocated !== 0) {
    cc.spent_percent =
      Math.round((Math.abs(cc.actual) / Math.abs(cc.allocated)) * 10000) / 100;
  }
}

// =====================================================
// SUMMARY BUILDER
// =====================================================

function buildSummary(result: FMSParseResult): void {
  const s = result.summary;

  for (const cc of result.cost_centres) {
    const isIncome = cc.category === "income";
    const isBalance = cc.category === "balance";

    if (isIncome) {
      // Income cost centres: allocated and actual are typically negative
      // We store absolute values for clarity
      s.total_income_allocated += Math.abs(cc.allocated);
      s.total_income_actual += Math.abs(cc.actual);
    } else if (isBalance) {
      s.balance_brought_forward += cc.actual;
    } else {
      s.total_expenditure_allocated += cc.allocated;
      s.total_expenditure_actual += cc.actual;
      s.total_committed += cc.committed;
    }

    if (cc.category === "staff") {
      s.staff_costs_actual += cc.actual;
    }

    // Monthly aggregation from transactions
    for (const txn of cc.transactions) {
      if (txn.period >= 1 && txn.period <= 12) {
        if (isIncome) {
          s.monthly_income[txn.period] =
            (s.monthly_income[txn.period] || 0) + Math.abs(txn.actual);
        } else if (!isBalance) {
          s.monthly_expenditure[txn.period] =
            (s.monthly_expenditure[txn.period] || 0) + txn.actual;
        }
      }
    }
  }

  // Net position: income - expenditure
  s.net_position = s.total_income_actual - s.total_expenditure_actual;

  // Staff costs as percentage of income
  if (s.total_income_actual > 0) {
    s.staff_costs_percent_of_income =
      Math.round((s.staff_costs_actual / s.total_income_actual) * 10000) / 100;
  }

  // Warnings based on summary
  if (s.staff_costs_percent_of_income > 80) {
    result.warnings.push(
      `Staff costs are ${s.staff_costs_percent_of_income}% of income (ICFP recommends 75-80%)`,
    );
  }

  if (s.net_position < 0) {
    result.warnings.push(
      `Net position is negative (deficit of ${formatCurrency(Math.abs(s.net_position))})`,
    );
  }

  if (
    s.total_income_actual === 0 &&
    result.cost_centres.some((cc) => cc.category === "income")
  ) {
    result.warnings.push(
      "Income cost centres found but all have zero actual values",
    );
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function cellStr(data: unknown[][], row: number, col: number): string {
  if (!data[row] || data[row][col] === null || data[row][col] === undefined)
    return "";
  return String(data[row][col]).trim();
}

function rowToString(row: unknown[] | undefined): string {
  if (!row) return "";
  return row
    .map((c) => (c === null || c === undefined ? "" : String(c)))
    .join(" ");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
