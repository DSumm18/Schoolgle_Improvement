import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import {
  profileBudget,
  profiledVariance,
  expectedSpendToDate,
  getSeasonalProfile,
} from "@/lib/budget-engine/seasonal-profiles";

export interface MonitorCFRLine {
  cfr_code: string;
  description: string;
  group: string;
  budget: number;
  actual: number;
  committed: number;
  variance: number;
  variance_percent: number;
  rag: "red" | "amber" | "green";
  profile_name: string;
  monthly_profile: {
    month: string;
    planned_cumulative: number;
    actual_cumulative: number;
  }[];
}

export interface MonitorData {
  financial_year: string;
  school_name: string;
  pupil_count: number;
  budget_cycle: "la" | "academy";
  fy_start: string;
  fy_end: string;
  as_at_date: string;
  months_elapsed: number;
  months_total: number;

  total_income: number;
  total_budget: number;
  total_spend: number;
  total_committed: number;
  remaining: number;
  percent_spent: number;
  projected_year_end: number;
  projected_surplus_deficit: number;

  staffing_spend: number;
  staffing_percent_of_income: number;
  staffing_target: number;

  lines: MonitorCFRLine[];
}

// LA financial year: April to March
const MONTH_LABELS = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

const BUDGET_CYCLE: "la" | "academy" = "la"; // Aurora is LA-maintained

function makeSeasonalProfile(
  budget: number,
  actual: number,
  cfrCode: string,
  monthsElapsed: number,
  costCentreName?: string,
): MonitorCFRLine["monthly_profile"] {
  const monthly = profileBudget(
    Math.abs(budget),
    cfrCode,
    BUDGET_CYCLE,
    costCentreName,
  );

  // Distribute actual spend across elapsed months using seasonal weights
  const elapsedWeights = monthly.slice(0, monthsElapsed);
  const totalWeight = elapsedWeights.reduce((s, m) => s + m.planned, 0);

  let actualCum = 0;
  return monthly.map((m, i) => {
    if (i < monthsElapsed && totalWeight > 0) {
      // Distribute actual proportionally to the seasonal profile
      const monthActual = Math.round(actual * (m.planned / totalWeight));
      actualCum += monthActual;
    }
    return {
      month: MONTH_LABELS[i],
      planned_cumulative: m.planned_cumulative,
      actual_cumulative: i < monthsElapsed ? actualCum : 0,
    };
  });
}

function makeLine(
  cfr_code: string,
  description: string,
  group: string,
  budget: number,
  actual: number,
  committed: number,
  monthsElapsed: number,
  costCentreName?: string,
): MonitorCFRLine {
  const isIncome = budget < 0;

  // Use seasonal profiling for variance calculation
  const { variance, variance_percent, rag } = isIncome
    ? { variance: 0, variance_percent: 0, rag: "green" as const }
    : profiledVariance(
        budget,
        actual,
        cfr_code,
        BUDGET_CYCLE,
        monthsElapsed,
        costCentreName,
      );

  // Get the profile name for display
  const profile = getSeasonalProfile(cfr_code, costCentreName);

  return {
    cfr_code,
    description,
    group,
    budget,
    actual,
    committed,
    variance,
    variance_percent,
    rag,
    profile_name: profile.name,
    monthly_profile: makeSeasonalProfile(
      budget,
      actual,
      cfr_code,
      monthsElapsed,
      costCentreName,
    ),
  };
}

/**
 * Aurora Primary FMS data — matches the generated test harness data
 * but with seasonal profiling applied.
 */
function generateDemoData(): MonitorData {
  const monthsElapsed = 6; // March = 6 months into Apr-Mar year (LA cycle)

  const lines: MonitorCFRLine[] = [
    // ── STAFFING ──
    makeLine(
      "E01",
      "Teaching Staff",
      "Staffing",
      980000,
      498000,
      12000,
      monthsElapsed,
    ),
    makeLine(
      "E02",
      "Supply Teaching Staff",
      "Staffing",
      35000,
      22500,
      3000,
      monthsElapsed,
    ),
    makeLine(
      "E03",
      "Education Support Staff (TAs)",
      "Staffing",
      365000,
      188000,
      5000,
      monthsElapsed,
    ),
    makeLine(
      "E04",
      "Premises Staff",
      "Staffing",
      42000,
      21200,
      0,
      monthsElapsed,
    ),
    makeLine(
      "E05",
      "Admin & Clerical Staff",
      "Staffing",
      85000,
      43500,
      1500,
      monthsElapsed,
    ),
    makeLine("E06", "Catering Staff", "Staffing", 0, 0, 0, monthsElapsed), // Contract catering, no direct staff
    makeLine(
      "E07",
      "Midday Supervisors & Other Staff",
      "Staffing",
      28000,
      15400,
      500,
      monthsElapsed,
    ),
    makeLine(
      "E08",
      "Indirect Employee Expenses",
      "Staffing",
      2500,
      1400,
      0,
      monthsElapsed,
    ),
    makeLine(
      "E09",
      "Staff Training & Development",
      "Staffing",
      15000,
      9800,
      1200,
      monthsElapsed,
    ),
    makeLine(
      "E10",
      "Supply Teacher Insurance",
      "Staffing",
      0,
      0,
      0,
      monthsElapsed,
    ),
    makeLine(
      "E11",
      "Staff Insurance",
      "Staffing",
      22000,
      22000,
      0,
      monthsElapsed,
    ), // Paid upfront
    makeLine(
      "E26",
      "Agency Supply Staff",
      "Staffing",
      0,
      2800,
      0,
      monthsElapsed,
    ), // Unbudgeted agency

    // ── PREMISES ──
    makeLine(
      "E12",
      "Building Maintenance & Repairs",
      "Premises",
      25000,
      8200,
      4500,
      monthsElapsed,
    ),
    makeLine(
      "E13",
      "Grounds Maintenance",
      "Premises",
      8000,
      2100,
      800,
      monthsElapsed,
    ),
    makeLine(
      "E14",
      "Cleaning (Staff + Materials)",
      "Premises",
      24500,
      12800,
      0,
      monthsElapsed,
    ),

    // ── ENERGY & UTILITIES ──
    makeLine("E15", "Water & Sewerage", "Energy", 5500, 2800, 0, monthsElapsed),
    makeLine("E16", "Gas", "Energy", 28000, 18200, 9000, monthsElapsed, "Gas"), // Seasonal!
    makeLine(
      "E16",
      "Electricity",
      "Energy",
      22000,
      12100,
      0,
      monthsElapsed,
      "Electricity",
    ), // Seasonal!
    makeLine("E17", "Business Rates", "Energy", 0, 0, 0, monthsElapsed), // LA pays centrally
    makeLine(
      "E18",
      "Security & Other Occupation",
      "Energy",
      3200,
      1600,
      0,
      monthsElapsed,
    ),

    // ── SUPPLIES & SERVICES ──
    makeLine(
      "E19",
      "Learning Resources & Curriculum",
      "Supplies",
      26000,
      14800,
      2200,
      monthsElapsed,
    ),
    makeLine(
      "E20",
      "ICT (Hardware, Software, Support)",
      "Supplies",
      18000,
      9200,
      3500,
      monthsElapsed,
    ),
    makeLine("E21", "Exam Fees", "Supplies", 1200, 0, 1200, monthsElapsed), // SATs not yet
    makeLine(
      "E22",
      "Admin Supplies & Communications",
      "Supplies",
      7500,
      4100,
      400,
      monthsElapsed,
    ),
    makeLine(
      "E23",
      "Insurance Premiums",
      "Supplies",
      12000,
      12000,
      0,
      monthsElapsed,
    ), // Annual
    makeLine(
      "E24",
      "Educational Visits",
      "Supplies",
      4500,
      1800,
      1200,
      monthsElapsed,
    ),
    makeLine(
      "E25",
      "Contract Catering",
      "Supplies",
      45000,
      24200,
      0,
      monthsElapsed,
    ),

    // ── OTHER ──
    makeLine(
      "E28a",
      "Bought-in Professional Services",
      "Other",
      95000,
      52000,
      8000,
      monthsElapsed,
    ),
    makeLine(
      "E29",
      "Loan Interest / Bank Charges",
      "Other",
      0,
      0,
      0,
      monthsElapsed,
    ),

    // ── INCOME ──
    makeLine(
      "I01",
      "School Budget Share (DSG)",
      "Income",
      -1850000,
      -1110000,
      0,
      monthsElapsed,
    ),
    makeLine(
      "I03",
      "SEN Top-Up Funding",
      "Income",
      -45000,
      -22500,
      0,
      monthsElapsed,
    ),
    makeLine(
      "I05",
      "Pupil Premium",
      "Income",
      -82000,
      -41000,
      0,
      monthsElapsed,
    ),
    makeLine(
      "I06",
      "Government Grants (Sports, etc.)",
      "Income",
      -35000,
      -17500,
      0,
      monthsElapsed,
    ),
    makeLine(
      "I07",
      "Other Grants & Training Income",
      "Income",
      -11500,
      -4200,
      0,
      monthsElapsed,
    ),
    makeLine(
      "I08a",
      "Lettings Income",
      "Income",
      -18000,
      -10800,
      0,
      monthsElapsed,
    ),
    makeLine(
      "I09",
      "Catering Income",
      "Income",
      -42000,
      -22000,
      0,
      monthsElapsed,
    ),
    makeLine(
      "I10",
      "Insurance Claims",
      "Income",
      -15000,
      -8000,
      0,
      monthsElapsed,
    ),
  ];

  const expenditureLines = lines.filter((l) => l.budget > 0);
  const incomeLines = lines.filter((l) => l.budget < 0);

  const totalBudget = expenditureLines.reduce((s, l) => s + l.budget, 0);
  const totalSpend = expenditureLines.reduce((s, l) => s + l.actual, 0);
  const totalCommitted = expenditureLines.reduce((s, l) => s + l.committed, 0);
  const totalIncome = Math.abs(incomeLines.reduce((s, l) => s + l.budget, 0));
  const remaining = totalBudget - totalSpend - totalCommitted;
  const percentSpent = Math.round((totalSpend / totalBudget) * 1000) / 10;

  // Projected year-end: use seasonal projection (remaining months weighted)
  let projectedRemainingSpend = 0;
  for (const line of expenditureLines) {
    if (line.budget <= 0) continue;
    const expectedTotal = expectedSpendToDate(
      line.budget,
      line.cfr_code,
      BUDGET_CYCLE,
      12,
    );
    const expectedSoFar = expectedSpendToDate(
      line.budget,
      line.cfr_code,
      BUDGET_CYCLE,
      monthsElapsed,
    );
    const remainingBudgeted = expectedTotal - expectedSoFar;
    // Scale remaining by actual burn rate vs profiled
    const burnRate = expectedSoFar > 0 ? line.actual / expectedSoFar : 1;
    projectedRemainingSpend += Math.round(remainingBudgeted * burnRate);
  }
  const projectedYearEnd =
    totalSpend + totalCommitted + projectedRemainingSpend;
  const projectedSurplus = totalIncome - projectedYearEnd;

  // Staffing calc
  const staffingCodes = [
    "E01",
    "E02",
    "E03",
    "E04",
    "E05",
    "E06",
    "E07",
    "E08",
    "E09",
    "E11",
    "E26",
  ];
  const staffingSpend = expenditureLines
    .filter((l) => staffingCodes.includes(l.cfr_code))
    .reduce((s, l) => s + l.actual, 0);
  const staffingProjectedAnnual = Math.round(
    staffingSpend * (12 / monthsElapsed),
  );
  const staffingPercent =
    Math.round((staffingProjectedAnnual / totalIncome) * 1000) / 10;

  return {
    financial_year: "2025-26",
    school_name: "Aurora Primary School",
    pupil_count: 420,
    budget_cycle: "la",
    fy_start: "2025-04-01",
    fy_end: "2026-03-31",
    as_at_date: "2026-03-12",
    months_elapsed: monthsElapsed,
    months_total: 12,

    total_income: totalIncome,
    total_budget: totalBudget,
    total_spend: totalSpend,
    total_committed: totalCommitted,
    remaining,
    percent_spent: percentSpent,
    projected_year_end: projectedYearEnd,
    projected_surplus_deficit: projectedSurplus,

    staffing_spend: staffingSpend,
    staffing_percent_of_income: staffingPercent,
    staffing_target: 78,

    lines,
  };
}

export const GET = protectedRoute(async (auth, request) => {
  // Try Supabase budget_lines first
  const { createServiceRoleClient } = await import("@/lib/supabase-server");
  const supabase = createServiceRoleClient();

  const { data: budgetLines, error } = await supabase
    .from("finance_budget_lines")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("cfr_code");

  if (error || !budgetLines || budgetLines.length === 0) {
    // Fall back to demo data if no imported finance data
    const data = generateDemoData();
    return apiSuccess({ ...data, data_source: "demo" });
  }

  // Build monitor response from real Supabase data
  const fy =
    budgetLines[0]?.financial_year ||
    `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(2)}`;

  // Calculate months elapsed (LA cycle: April=1)
  const now = new Date();
  const fyStartYear = parseInt(fy.split("-")[0]);
  const fyStart = new Date(fyStartYear, 3, 1); // April 1
  const monthsElapsed = Math.max(
    1,
    Math.min(
      12,
      (now.getFullYear() - fyStart.getFullYear()) * 12 +
        now.getMonth() -
        fyStart.getMonth(),
    ),
  );

  // Map CFR codes to display groups
  const cfrGroupMap: Record<string, string> = {
    E01: "Staffing",
    E02: "Staffing",
    E03: "Staffing",
    E04: "Staffing",
    E05: "Staffing",
    E06: "Staffing",
    E07: "Staffing",
    E08: "Staffing",
    E09: "Staffing",
    E10: "Staffing",
    E11: "Staffing",
    E26: "Staffing",
    E12: "Premises",
    E13: "Premises",
    E14: "Premises",
    E15: "Energy",
    E16: "Energy",
    E17: "Energy",
    E18: "Energy",
    E19: "Supplies",
    E20: "Supplies",
    E21: "Supplies",
    E22: "Supplies",
    E23: "Supplies",
    E24: "Supplies",
    E25: "Supplies",
    E28: "Other",
    E28a: "Other",
    E29: "Other",
    E30: "Other",
    E31: "Other",
    E32: "Other",
  };

  const lines: MonitorCFRLine[] = budgetLines.map((bl) => {
    const budget = bl.is_income
      ? -Math.abs(parseFloat(bl.budget_amount || "0"))
      : parseFloat(bl.budget_amount || "0");
    const actual = bl.is_income
      ? -Math.abs(parseFloat(bl.actual_amount || "0"))
      : parseFloat(bl.actual_amount || "0");
    const committed = parseFloat(bl.committed_amount || "0");
    const group = bl.is_income ? "Income" : cfrGroupMap[bl.cfr_code] || "Other";

    return makeLine(
      bl.cfr_code,
      bl.cfr_description || bl.cfr_code,
      group,
      budget,
      actual,
      committed,
      monthsElapsed,
      bl.cost_centre || undefined,
    );
  });

  const expenditureLines = lines.filter((l) => l.budget > 0);
  const incomeLines = lines.filter((l) => l.budget < 0);

  const totalBudget = expenditureLines.reduce((s, l) => s + l.budget, 0);
  const totalSpend = expenditureLines.reduce((s, l) => s + l.actual, 0);
  const totalCommitted = expenditureLines.reduce((s, l) => s + l.committed, 0);
  const totalIncome = Math.abs(incomeLines.reduce((s, l) => s + l.budget, 0));
  const remaining = totalBudget - totalSpend - totalCommitted;
  const percentSpent =
    totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 1000) / 10 : 0;

  // Projected year-end using seasonal profiles
  let projectedRemainingSpend = 0;
  for (const line of expenditureLines) {
    if (line.budget <= 0) continue;
    const expectedTotal = expectedSpendToDate(
      line.budget,
      line.cfr_code,
      BUDGET_CYCLE,
      12,
    );
    const expectedSoFar = expectedSpendToDate(
      line.budget,
      line.cfr_code,
      BUDGET_CYCLE,
      monthsElapsed,
    );
    const remainingBudgeted = expectedTotal - expectedSoFar;
    const burnRate = expectedSoFar > 0 ? line.actual / expectedSoFar : 1;
    projectedRemainingSpend += Math.round(remainingBudgeted * burnRate);
  }
  const projectedYearEnd =
    totalSpend + totalCommitted + projectedRemainingSpend;
  const projectedSurplus = totalIncome - projectedYearEnd;

  // Staffing calc
  const staffingCodes = [
    "E01",
    "E02",
    "E03",
    "E04",
    "E05",
    "E06",
    "E07",
    "E08",
    "E09",
    "E11",
    "E26",
  ];
  const staffingSpend = expenditureLines
    .filter((l) => staffingCodes.includes(l.cfr_code))
    .reduce((s, l) => s + l.actual, 0);
  const staffingProjectedAnnual = Math.round(
    staffingSpend * (12 / monthsElapsed),
  );
  const staffingPercent =
    totalIncome > 0
      ? Math.round((staffingProjectedAnnual / totalIncome) * 1000) / 10
      : 0;

  // Get school name from org
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", auth.organizationId)
    .single();

  return apiSuccess({
    financial_year: fy,
    school_name: org?.name || "School",
    pupil_count: 420,
    budget_cycle: BUDGET_CYCLE,
    fy_start: `${fyStartYear}-04-01`,
    fy_end: `${fyStartYear + 1}-03-31`,
    as_at_date: now.toISOString().split("T")[0],
    months_elapsed: monthsElapsed,
    months_total: 12,

    total_income: totalIncome,
    total_budget: totalBudget,
    total_spend: totalSpend,
    total_committed: totalCommitted,
    remaining,
    percent_spent: percentSpent,
    projected_year_end: projectedYearEnd,
    projected_surplus_deficit: projectedSurplus,

    staffing_spend: staffingSpend,
    staffing_percent_of_income: staffingPercent,
    staffing_target: 78,

    lines,
    data_source: "supabase",
  } as MonitorData & { data_source: string });
});
