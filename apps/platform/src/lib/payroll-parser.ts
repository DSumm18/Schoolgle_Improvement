/**
 * Payroll CSV Parser
 *
 * Parses school payroll CSV exports and extracts staffing data for ICFP analysis.
 * Supports auto-detection of columns, pay scale classification, and role categorisation.
 *
 * UK Pay Scales (2024/25):
 *   MPS: M1 £30,000 - M6 £41,333
 *   UPS: U1 £43,266 - U3 £46,525
 *   Leadership: L1 £47,185 - L43 £131,056
 *   Unqualified: £22,924 - £33,560
 *
 * On-costs: NI (employer) + Teachers' Pension = ~28.68% of gross
 */

// ─── Types ────────────────────────────────────────────────────────────

export type PayScaleType =
  | "MPS"
  | "UPS"
  | "Leadership"
  | "Unqualified"
  | "Support"
  | "Unknown";

export type StaffCategory =
  | "teacher"
  | "leadership"
  | "teaching_assistant"
  | "support_staff"
  | "admin"
  | "caretaker"
  | "other";

export interface ParsedStaffMember {
  name?: string;
  role: string;
  category: StaffCategory;
  payScale: PayScaleType;
  payPoint?: string;
  fte: number;
  grossSalary: number;
  onCosts: number;
  totalCost: number;
  startDate?: string;
  contractType?: string;
}

export interface PayrollSummary {
  totalStaff: number;
  totalFTE: number;
  teacherFTE: number;
  leadershipFTE: number;
  supportFTE: number;
  totalStaffCost: number;
  totalTeachingCost: number;
  totalLeadershipCost: number;
  totalSupportCost: number;
  averageTeacherCost: number;
  staffingPercent?: number;
  onCostsRate: number;
}

export interface ParseOptions {
  hasHeaders?: boolean;
  delimiter?: string;
}

export interface PayScaleDetection {
  type: PayScaleType;
  point?: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const ON_COSTS_RATE = 0.2868;

// MPS pay points 2024/25
const MPS_POINTS: Record<string, number> = {
  M1: 30000,
  M2: 31737,
  M3: 33814,
  M4: 35949,
  M5: 38330,
  M6: 41333,
};

// UPS pay points 2024/25
const UPS_POINTS: Record<string, number> = {
  U1: 43266,
  U2: 44870,
  U3: 46525,
};

// Leadership pay range boundaries 2024/25
const LEADERSHIP_MIN = 47185;
const LEADERSHIP_MAX = 131056;

// Leadership spine points (selected key points)
const LEADERSHIP_POINTS: Record<string, number> = {
  L1: 47185,
  L2: 48344,
  L3: 49529,
  L4: 50741,
  L5: 51982,
  L6: 53252,
  L7: 54550,
  L8: 55883,
  L9: 57249,
  L10: 58650,
  L11: 60488,
  L12: 61510,
  L13: 62570,
  L14: 63665,
  L15: 64793,
  L16: 65950,
  L17: 67140,
  L18: 68400,
  L19: 69523,
  L20: 70733,
  L21: 72162,
  L22: 73508,
  L23: 74919,
  L24: 76367,
  L25: 77818,
  L26: 79318,
  L27: 80856,
  L28: 82421,
  L29: 84102,
  L30: 85817,
  L31: 87568,
  L32: 89414,
  L33: 91281,
  L34: 93175,
  L35: 95103,
  L36: 97069,
  L37: 99073,
  L38: 101117,
  L39: 103238,
  L40: 105389,
  L41: 107700,
  L42: 110042,
  L43: 131056,
};

// Unqualified teacher pay 2024/25
const UNQUALIFIED_MIN = 22924;
const UNQUALIFIED_MAX = 33560;

// ─── Column Detection Patterns ────────────────────────────────────────

const COLUMN_PATTERNS = {
  name: /^(name|employee[\s_]?name|staff[\s_]?name|full[\s_]?name|surname|last[\s_]?name|forename)/i,
  role: /^(role|job[\s_]?title|position|post|designation|grade[\s_]?description)/i,
  salary:
    /^(salary|gross[\s_]?salary|annual[\s_]?salary|pay|basic[\s_]?pay|gross[\s_]?pay|annual[\s_]?pay)/i,
  fte: /^(fte|full[\s_]?time|hours|contracted[\s_]?hours|fte[\s_]?ratio)/i,
  payScale:
    /^(pay[\s_]?scale|scale|grade|spinal[\s_]?point|pay[\s_]?point|pay[\s_]?range)/i,
  startDate:
    /^(start[\s_]?date|date[\s_]?started|join[\s_]?date|commencement|service[\s_]?date)/i,
  contractType:
    /^(contract[\s_]?type|contract|employment[\s_]?type|status|tenure)/i,
};

// ─── Role Classification Keywords ─────────────────────────────────────

const ROLE_KEYWORDS: Record<StaffCategory, RegExp[]> = {
  leadership: [
    /\bhead\s?teacher\b/i,
    /\bprincipal\b/i,
    /\bdeputy\s?head\b/i,
    /\bassistant\s?head\b/i,
    /\bvice\s?principal\b/i,
    /\bexecutive\s?head\b/i,
    /\bceo\b/i,
    /\bcoo\b/i,
    /\bcfo\b/i,
    /\bdirector\s?(of\s?)?(education|school|trust|teaching|learning)\b/i,
    /\bhead\s?of\s?school\b/i,
    /\bsenior\s?leader\b/i,
    /\bslt\b/i,
  ],
  teacher: [
    /\bclass\s?teacher\b/i,
    /\bteacher\b/i,
    /\bnqt\b/i,
    /\bect\b/i,
    /\bsubject\s?lead\b/i,
    /\bhead\s?of\s?(department|year|phase|ks[12]|key\s?stage)\b/i,
    /\btlr\b/i,
    /\bsenco\b/i,
    /\bmusic\s?teacher\b/i,
    /\bpe\s?teacher\b/i,
    /\bsupply\s?teacher\b/i,
    /\bppa\s?cover\b/i,
  ],
  teaching_assistant: [
    /\bteaching\s?assistant\b/i,
    /\b(^|\s)ta(\s|$)/i,
    /\bhlta\b/i,
    /\blsa\b/i,
    /\blearning\s?support\s?assistant\b/i,
    /\bhigher\s?level\s?ta\b/i,
    /\b1[:\-]1\s?(support|assistant)\b/i,
    /\bsend\s?(support|assistant)\b/i,
    /\bcover\s?supervisor\b/i,
    /\blearning\s?mentor\b/i,
  ],
  admin: [
    /\badmin\b/i,
    /\badministrat/i,
    /\boffice\s?(manager|assistant|admin)\b/i,
    /\breceptionist\b/i,
    /\bfinance\s?(officer|assistant|manager)\b/i,
    /\bclerk\b/i,
    /\bsecretary\b/i,
    /\bbusiness\s?manager\b/i,
    /\bsbm\b/i,
    /\bschool\s?business\b/i,
    /\bhr\s?(officer|manager|assistant)\b/i,
    /\bbursar\b/i,
    /\bdata\s?(manager|officer)\b/i,
    /\bexams?\s?officer\b/i,
    /\bict\s?(manager|technician|support)\b/i,
  ],
  caretaker: [
    /\bcaretaker\b/i,
    /\bsite\s?(manager|supervisor|officer|agent)\b/i,
    /\bpremises\b/i,
    /\bcleaner\b/i,
    /\bmaintenance\b/i,
    /\bgrounds/i,
    /\bjanitor\b/i,
    /\bfacilities\b/i,
  ],
  support_staff: [
    /\blunch\s?(time\s?)?(supervisor|assistant)\b/i,
    /\bmidday\s?(supervisor|assistant)\b/i,
    /\bwelfare\b/i,
    /\blibrarian\b/i,
    /\btechnician\b/i,
    /\blab\s?(technician|assistant)\b/i,
    /\bscience\s?technician\b/i,
    /\bfirst\s?aider\b/i,
    /\bnurse\b/i,
    /\bcook\b/i,
    /\bkitchen\b/i,
    /\bcatering\b/i,
    /\bbreakfast\s?club\b/i,
    /\bafter[\s-]?school\b/i,
    /\bwrap[\s-]?around\b/i,
    /\bplay\s?worker\b/i,
  ],
  other: [],
};

// ─── Core Functions ───────────────────────────────────────────────────

/**
 * Calculate employer on-costs (NI + pension) at 28.68% of gross.
 */
export function calculateOnCosts(grossSalary: number): number {
  return Math.round(grossSalary * ON_COSTS_RATE * 100) / 100;
}

/**
 * Detect pay scale type and point from role and salary.
 * Uses salary range matching with role context to disambiguate overlap zones.
 */
export function detectPayScale(
  role: string,
  salary: number,
): PayScaleDetection {
  const category = classifyRole(role);
  const isTeachingRole = category === "teacher" || category === "leadership";

  // Leadership range
  if (salary >= LEADERSHIP_MIN && salary <= LEADERSHIP_MAX) {
    if (category === "leadership" || salary >= 55000) {
      const point = findClosestPoint(salary, LEADERSHIP_POINTS);
      return { type: "Leadership", point };
    }
  }

  // Very high salary is almost certainly leadership even if role not matched
  if (salary > LEADERSHIP_MAX) {
    return { type: "Leadership", point: "L43+" };
  }

  // UPS range
  if (salary >= UPS_POINTS.U1 && salary <= UPS_POINTS.U3) {
    if (isTeachingRole || category === "other") {
      const point = findClosestPoint(salary, UPS_POINTS);
      return { type: "UPS", point };
    }
  }

  // MPS range
  if (salary >= MPS_POINTS.M1 && salary <= MPS_POINTS.M6) {
    if (isTeachingRole || category === "other") {
      const point = findClosestPoint(salary, MPS_POINTS);
      return { type: "MPS", point };
    }
  }

  // MPS/UPS overlap with leadership low end (£41k-£47k)
  if (salary > MPS_POINTS.M6 && salary < UPS_POINTS.U1) {
    if (isTeachingRole) {
      return { type: "UPS", point: "U1" };
    }
  }

  // Unqualified teacher range
  if (
    salary >= UNQUALIFIED_MIN &&
    salary <= UNQUALIFIED_MAX &&
    isTeachingRole
  ) {
    return { type: "Unqualified" };
  }

  // Support staff — typically under £30k FTE
  if (!isTeachingRole) {
    return { type: "Support" };
  }

  // Teaching role with salary below MPS — could be unqualified or part-time reported as actual
  if (isTeachingRole && salary < MPS_POINTS.M1) {
    if (salary >= UNQUALIFIED_MIN) {
      return { type: "Unqualified" };
    }
    return { type: "Support" };
  }

  return { type: "Unknown" };
}

/**
 * Classify a role title into a staff category using keyword matching.
 * Order matters: leadership checked before teacher to catch "Head of Department" correctly.
 */
export function classifyRole(roleTitle: string): StaffCategory {
  if (!roleTitle || !roleTitle.trim()) return "other";

  const normalised = roleTitle.trim();

  // Check categories in priority order
  const priorityOrder: StaffCategory[] = [
    "leadership",
    "teaching_assistant",
    "teacher",
    "admin",
    "caretaker",
    "support_staff",
  ];

  for (const category of priorityOrder) {
    const patterns = ROLE_KEYWORDS[category];
    for (const pattern of patterns) {
      if (pattern.test(normalised)) {
        return category;
      }
    }
  }

  return "other";
}

/**
 * Parse a payroll CSV string into structured staff data.
 * Auto-detects column mappings from headers.
 */
export function parsePayrollCSV(
  csvText: string,
  options?: ParseOptions,
): ParsedStaffMember[] {
  const hasHeaders = options?.hasHeaders !== false; // default true
  const delimiter = options?.delimiter || detectDelimiter(csvText);

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Parse all rows handling quoted fields
  const rows = lines.map((line) => parseCSVLine(line, delimiter));

  // Detect column indices
  let columnMap: ColumnMap;
  let dataRows: string[][];

  if (hasHeaders && rows.length > 1) {
    columnMap = detectColumns(rows[0]);
    dataRows = rows.slice(1);
  } else {
    columnMap = guessColumnsFromData(rows[0]);
    dataRows = rows;
  }

  // Parse each row
  const staff: ParsedStaffMember[] = [];

  for (const row of dataRows) {
    const parsed = parseRow(row, columnMap);
    if (parsed) {
      staff.push(parsed);
    }
  }

  return staff;
}

/**
 * Summarise parsed payroll data into ICFP-ready metrics.
 */
export function summarisePayroll(
  staff: ParsedStaffMember[],
  schoolIncome?: number,
): PayrollSummary {
  const teachers = staff.filter(
    (s) => s.category === "teacher" || s.category === "leadership",
  );
  const classroomTeachers = staff.filter((s) => s.category === "teacher");
  const leaders = staff.filter((s) => s.category === "leadership");
  const supportAll = staff.filter(
    (s) =>
      s.category === "teaching_assistant" ||
      s.category === "support_staff" ||
      s.category === "admin" ||
      s.category === "caretaker" ||
      s.category === "other",
  );

  const totalFTE = sum(staff.map((s) => s.fte));
  const teacherFTE = sum(teachers.map((s) => s.fte));
  const leadershipFTE = sum(leaders.map((s) => s.fte));
  const supportFTE = sum(supportAll.map((s) => s.fte));

  const totalStaffCost = sum(staff.map((s) => s.totalCost));
  const totalTeachingCost = sum(teachers.map((s) => s.totalCost));
  const totalLeadershipCost = sum(leaders.map((s) => s.totalCost));
  const totalSupportCost = sum(supportAll.map((s) => s.totalCost));

  // Average teacher cost includes on-costs, based on classroom teachers only
  const avgTeacherCost =
    classroomTeachers.length > 0
      ? totalTeachingCost / sum(classroomTeachers.map((s) => s.fte))
      : 0;

  const summary: PayrollSummary = {
    totalStaff: staff.length,
    totalFTE: round2(totalFTE),
    teacherFTE: round2(teacherFTE),
    leadershipFTE: round2(leadershipFTE),
    supportFTE: round2(supportFTE),
    totalStaffCost: round2(totalStaffCost),
    totalTeachingCost: round2(totalTeachingCost),
    totalLeadershipCost: round2(totalLeadershipCost),
    totalSupportCost: round2(totalSupportCost),
    averageTeacherCost: round2(avgTeacherCost),
    onCostsRate: ON_COSTS_RATE,
  };

  if (schoolIncome && schoolIncome > 0) {
    summary.staffingPercent = round2((totalStaffCost / schoolIncome) * 100);
  }

  return summary;
}

// ─── Sample Data ──────────────────────────────────────────────────────

export const SAMPLE_PAYROLL_CSV = `Name,Job Title,FTE,Annual Salary,Pay Scale,Contract Type,Start Date
Sarah Mitchell,Headteacher,1.0,95103,L35,Permanent,2018-09-01
James Thornton,Deputy Headteacher,1.0,68400,L18,Permanent,2020-01-06
Rachel Edwards,Assistant Headteacher,1.0,58650,L10,Permanent,2021-09-01
Emma Collins,Class Teacher (Year 6),1.0,41333,M6,Permanent,2017-09-01
David Patel,Class Teacher (Year 5),1.0,46525,U3,Permanent,2015-09-01
Sophie Turner,Class Teacher (Year 4),1.0,43266,U1,Permanent,2019-09-01
Oliver Briggs,Class Teacher (Year 3),0.8,35949,M4,Permanent,2022-09-01
Hannah Lee,Class Teacher (Year 2),1.0,33814,M3,Permanent,2023-09-01
Tom Robertson,Class Teacher (Year 1),1.0,31737,M2,Permanent,2024-09-01
Amy Stone,Class Teacher (Reception),1.0,38330,M5,Fixed-term,2024-09-01
Ben Clarke,ECT (Year 1),1.0,30000,M1,Fixed-term,2024-09-01
Lucy Adams,SENCO,1.0,44870,U2+TLR,Permanent,2016-09-01
Karen White,HLTA,1.0,28500,,Permanent,2019-01-07
Lisa Brown,Teaching Assistant,0.6,18200,,Permanent,2020-09-01
Maria Garcia,Teaching Assistant,0.8,19500,,Permanent,2021-09-01
Joanne Marsh,Teaching Assistant (1:1 SEND),1.0,22000,,Permanent,2022-01-10
Paul Green,School Business Manager,1.0,38000,,Permanent,2019-04-01
Claire Reed,Office Administrator,0.8,21600,,Permanent,2018-09-01
Derek Hall,Site Manager,1.0,27500,,Permanent,2017-03-15
Sandra Hughes,Midday Supervisor,0.3,7200,,Permanent,2020-09-01
Tracy Evans,Midday Supervisor,0.3,7200,,Permanent,2021-09-01
Mike Foster,Cleaner,0.5,11500,,Permanent,2023-01-09`;

// ─── Internal Helpers ─────────────────────────────────────────────────

interface ColumnMap {
  name: number;
  role: number;
  salary: number;
  fte: number;
  payScale: number;
  startDate: number;
  contractType: number;
}

function detectDelimiter(csv: string): string {
  const firstLine = csv.split(/\r?\n/)[0] || "";
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;

  if (tabs > commas && tabs > semicolons) return "\t";
  if (semicolons > commas) return ";";
  return ",";
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function detectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {
    name: -1,
    role: -1,
    salary: -1,
    fte: -1,
    payScale: -1,
    startDate: -1,
    contractType: -1,
  };

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].replace(/^["']|["']$/g, "").trim();

    for (const [key, pattern] of Object.entries(COLUMN_PATTERNS)) {
      if (pattern.test(header) && map[key as keyof ColumnMap] === -1) {
        map[key as keyof ColumnMap] = i;
      }
    }
  }

  // If salary not found, look for columns with currency symbols
  if (map.salary === -1) {
    for (let i = 0; i < headers.length; i++) {
      if (/[£$]|salary|pay|cost|annual/i.test(headers[i])) {
        map.salary = i;
        break;
      }
    }
  }

  return map;
}

function guessColumnsFromData(firstRow: string[]): ColumnMap {
  const map: ColumnMap = {
    name: -1,
    role: -1,
    salary: -1,
    fte: -1,
    payScale: -1,
    startDate: -1,
    contractType: -1,
  };

  for (let i = 0; i < firstRow.length; i++) {
    const val = firstRow[i];

    // Numeric value that looks like a salary (5 or 6 digits)
    if (/^[£$]?\d{4,6}(\.\d{2})?$/.test(val.replace(/,/g, ""))) {
      const num = parseFloat(val.replace(/[£$,]/g, ""));
      if (num >= 5000 && num <= 200000 && map.salary === -1) {
        map.salary = i;
      } else if (num >= 0 && num <= 1.1 && map.fte === -1) {
        map.fte = i;
      }
    }

    // FTE-like value (0.0 to 1.0)
    if (/^[01]\.\d+$/.test(val) && map.fte === -1) {
      map.fte = i;
    }

    // Date-like value
    if (/\d{2,4}[-/]\d{1,2}[-/]\d{1,4}/.test(val) && map.startDate === -1) {
      map.startDate = i;
    }
  }

  // Assume first text column is name, second is role
  for (let i = 0; i < firstRow.length; i++) {
    if (
      i !== map.salary &&
      i !== map.fte &&
      i !== map.startDate &&
      !/^\d/.test(firstRow[i])
    ) {
      if (map.name === -1) {
        map.name = i;
      } else if (map.role === -1) {
        map.role = i;
      }
    }
  }

  return map;
}

function parseRow(row: string[], columns: ColumnMap): ParsedStaffMember | null {
  const getCol = (idx: number) =>
    idx >= 0 && idx < row.length
      ? row[idx].replace(/^["']|["']$/g, "").trim()
      : "";

  const role = getCol(columns.role);
  const salaryRaw = getCol(columns.salary);

  // Must have at least a salary to be useful
  if (!salaryRaw) return null;

  const grossSalary = parseFloat(salaryRaw.replace(/[£$,\s]/g, ""));
  if (isNaN(grossSalary) || grossSalary <= 0) return null;

  // Parse FTE — default to 1.0 if missing
  let fte = 1.0;
  const fteRaw = getCol(columns.fte);
  if (fteRaw) {
    const parsed = parseFloat(fteRaw);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1.5) {
      fte = parsed;
    } else if (!isNaN(parsed) && parsed > 1.5 && parsed <= 40) {
      // Might be hours per week — convert assuming 32.5 hrs = 1.0 FTE (teachers)
      fte = round2(parsed / 32.5);
      if (fte > 1.0) fte = 1.0;
    }
  }

  // Calculate FTE-equivalent salary for pay scale detection
  const fteSalary = fte > 0 && fte < 1 ? grossSalary / fte : grossSalary;

  const name = getCol(columns.name) || undefined;
  const category = classifyRole(role);

  // Detect pay scale using FTE-adjusted salary
  const payScaleRaw = getCol(columns.payScale);
  let payScale: PayScaleDetection;

  if (payScaleRaw) {
    payScale = parsePayScaleString(payScaleRaw, category, fteSalary);
  } else {
    payScale = detectPayScale(role, fteSalary);
  }

  const onCosts = calculateOnCosts(grossSalary);

  return {
    name,
    role: role || "Unknown",
    category,
    payScale: payScale.type,
    payPoint: payScale.point,
    fte,
    grossSalary: round2(grossSalary),
    onCosts: round2(onCosts),
    totalCost: round2(grossSalary + onCosts),
    startDate: getCol(columns.startDate) || undefined,
    contractType: getCol(columns.contractType) || undefined,
  };
}

function parsePayScaleString(
  raw: string,
  category: StaffCategory,
  salary: number,
): PayScaleDetection {
  const normalised = raw.toUpperCase().replace(/\s/g, "");

  // Match explicit pay point: M1, M2, U1, U2, L14 etc.
  const mMatch = normalised.match(/^M(\d)$/);
  if (mMatch) {
    return { type: "MPS", point: `M${mMatch[1]}` };
  }

  const uMatch = normalised.match(/^U(\d)/);
  if (uMatch) {
    return { type: "UPS", point: `U${uMatch[1]}` };
  }

  const lMatch = normalised.match(/^L(\d{1,2})/);
  if (lMatch) {
    return { type: "Leadership", point: `L${lMatch[1]}` };
  }

  // Match range strings: "MPS", "UPS", "Leadership"
  if (/MPS|MAIN/i.test(normalised)) return { type: "MPS" };
  if (/UPS|UPPER/i.test(normalised)) return { type: "UPS" };
  if (/LEAD|HEAD|PRINCIPAL/i.test(normalised)) return { type: "Leadership" };
  if (/UNQ|UNQUALIFIED/i.test(normalised)) return { type: "Unqualified" };

  // Fall back to salary-based detection
  return detectPayScale("", salary);
}

function findClosestPoint(
  salary: number,
  points: Record<string, number>,
): string {
  let closest = "";
  let minDiff = Infinity;

  for (const [point, value] of Object.entries(points)) {
    const diff = Math.abs(salary - value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }

  return closest;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
