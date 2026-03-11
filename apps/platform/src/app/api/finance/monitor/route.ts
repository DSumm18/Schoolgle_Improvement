import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";

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

const MONTHS = [
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
];

function makeProfile(
  budget: number,
  actual: number,
  monthsElapsed: number,
): MonitorCFRLine["monthly_profile"] {
  const monthlyBudget = budget / 12;
  // Simulate slightly uneven spend with actuals known for elapsed months
  return MONTHS.map((month, i) => {
    const plannedCum = monthlyBudget * (i + 1);
    return {
      month,
      planned_cumulative: Math.round(plannedCum),
      actual_cumulative:
        i < monthsElapsed
          ? Math.round(
              MONTHS.slice(0, i + 1).reduce((sum, _, j) => {
                const n = 1 + Math.sin(j * 1.3) * 0.08;
                return sum + (actual / monthsElapsed) * n;
              }, 0),
            )
          : 0,
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
): MonitorCFRLine {
  const variance = actual - (budget * monthsElapsed) / 12;
  const variancePct =
    budget > 0 ? (variance / ((budget * monthsElapsed) / 12)) * 100 : 0;
  const rag: "red" | "amber" | "green" =
    variancePct > 10 ? "red" : variancePct > 5 ? "amber" : "green";

  return {
    cfr_code,
    description,
    group,
    budget,
    actual,
    committed,
    variance: Math.round(variance),
    variance_percent: Math.round(variancePct * 10) / 10,
    rag,
    monthly_profile: makeProfile(budget, actual, monthsElapsed),
  };
}

function generateDemoData(): MonitorData {
  const monthsElapsed = 6; // March = 6 months into Sept-Aug year

  const lines: MonitorCFRLine[] = [
    // Staffing
    makeLine(
      "E01",
      "Teaching Staff",
      "Staffing",
      650000,
      348000,
      12000,
      monthsElapsed,
    ),
    makeLine(
      "E02",
      "Supply Teaching",
      "Staffing",
      25000,
      18500,
      2000,
      monthsElapsed,
    ),
    makeLine(
      "E03",
      "Education Support Staff",
      "Staffing",
      145000,
      74000,
      3000,
      monthsElapsed,
    ),
    makeLine(
      "E04",
      "Premises Staff",
      "Staffing",
      52000,
      26500,
      0,
      monthsElapsed,
    ),
    makeLine(
      "E05",
      "Administrative & Clerical Staff",
      "Staffing",
      78000,
      39800,
      1500,
      monthsElapsed,
    ),
    makeLine(
      "E06",
      "Catering Staff",
      "Staffing",
      38000,
      19200,
      0,
      monthsElapsed,
    ),
    makeLine(
      "E07",
      "Other Staff Costs",
      "Staffing",
      12000,
      7800,
      500,
      monthsElapsed,
    ),
    makeLine(
      "E08",
      "Indirect Employee Expenses",
      "Staffing",
      18000,
      11200,
      800,
      monthsElapsed,
    ),
    // Premises
    makeLine(
      "E09-E12",
      "Premises Costs (Maintenance, Rates, Insurance)",
      "Premises",
      85000,
      52000,
      4500,
      monthsElapsed,
    ),
    // Supplies & Services
    makeLine(
      "E13-E18",
      "Supplies & Services (Resources, Energy, Cleaning)",
      "Supplies",
      95000,
      54000,
      6200,
      monthsElapsed,
    ),
    // Other costs
    makeLine(
      "E19-E25",
      "Other Costs (ICT, Exam Fees, Catering Supplies)",
      "Other",
      62000,
      35800,
      3800,
      monthsElapsed,
    ),
    // Agency
    makeLine(
      "E26",
      "Agency Supply Staff",
      "Staffing",
      15000,
      12400,
      1800,
      monthsElapsed,
    ),
    // Income lines (negative = income received)
    makeLine(
      "I01-I04",
      "Grant Income (GAG/DSG)",
      "Income",
      -1050000,
      -525000,
      0,
      monthsElapsed,
    ),
    makeLine(
      "I05-I08",
      "Self-Generated Income",
      "Income",
      -85000,
      -38000,
      0,
      monthsElapsed,
    ),
    makeLine(
      "I09-I13",
      "Other Income (LA, Insurance, Donations)",
      "Income",
      -65000,
      -28000,
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
  const projectedYearEnd = Math.round(totalSpend * (12 / monthsElapsed));
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
    "E26",
  ];
  const staffingSpend = expenditureLines
    .filter((l) => staffingCodes.includes(l.cfr_code))
    .reduce((s, l) => s + l.actual, 0);
  const staffingProjected = Math.round(staffingSpend * (12 / monthsElapsed));
  const staffingPercent =
    Math.round((staffingProjected / totalIncome) * 1000) / 10;

  return {
    financial_year: "2025-26",
    school_name: "Aurora Primary Academy",
    pupil_count: 210,
    budget_cycle: "academy",
    fy_start: "2025-09-01",
    fy_end: "2026-08-31",
    as_at_date: "2026-03-10",
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
  const data = generateDemoData();
  return apiSuccess(data);
});
