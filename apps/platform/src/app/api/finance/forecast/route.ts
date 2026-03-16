/**
 * Budget Forecast Calculator API
 *
 * GET  /api/finance/forecast — Generate next-year budget forecast with seasonal profiling
 * POST /api/finance/forecast — Generate forecast with custom assumptions
 *
 * Takes current year's budget data and applies configurable percentage changes
 * per CFR category to project next year's budget. Includes ICFP staff cost
 * ratio analysis and seasonal monthly profiling.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  generateForecast,
  DEFAULT_ASSUMPTIONS,
  type BudgetForecast,
} from "@/lib/budget-engine/seasonal-profiles";

// Aurora Primary current year data (would come from FMS import in production)
const CURRENT_YEAR_DATA = {
  financial_year: "2025-26",
  budget_cycle: "la" as const,
  total_income: 2098500,
  lines: [
    {
      cfr_code: "E01",
      description: "Teaching Staff",
      budget: 980000,
      actual: 498000,
    },
    {
      cfr_code: "E02",
      description: "Supply Teaching Staff",
      budget: 35000,
      actual: 22500,
    },
    {
      cfr_code: "E03",
      description: "Education Support Staff (TAs)",
      budget: 365000,
      actual: 188000,
    },
    {
      cfr_code: "E04",
      description: "Premises Staff",
      budget: 42000,
      actual: 21200,
    },
    {
      cfr_code: "E05",
      description: "Admin & Clerical Staff",
      budget: 85000,
      actual: 43500,
    },
    {
      cfr_code: "E07",
      description: "Midday Supervisors & Other Staff",
      budget: 28000,
      actual: 15400,
    },
    {
      cfr_code: "E08",
      description: "Indirect Employee Expenses",
      budget: 2500,
      actual: 1400,
    },
    {
      cfr_code: "E09",
      description: "Staff Training & Development",
      budget: 15000,
      actual: 9800,
    },
    {
      cfr_code: "E11",
      description: "Staff Insurance",
      budget: 22000,
      actual: 22000,
    },
    {
      cfr_code: "E12",
      description: "Building Maintenance & Repairs",
      budget: 25000,
      actual: 8200,
    },
    {
      cfr_code: "E13",
      description: "Grounds Maintenance",
      budget: 8000,
      actual: 2100,
    },
    {
      cfr_code: "E14",
      description: "Cleaning (Staff + Materials)",
      budget: 24500,
      actual: 12800,
    },
    {
      cfr_code: "E15",
      description: "Water & Sewerage",
      budget: 5500,
      actual: 2800,
    },
    { cfr_code: "E16", description: "Gas", budget: 28000, actual: 18200 },
    {
      cfr_code: "E16",
      description: "Electricity",
      budget: 22000,
      actual: 12100,
    },
    {
      cfr_code: "E18",
      description: "Security & Other Occupation",
      budget: 3200,
      actual: 1600,
    },
    {
      cfr_code: "E19",
      description: "Learning Resources & Curriculum",
      budget: 26000,
      actual: 14800,
    },
    {
      cfr_code: "E20",
      description: "ICT (Hardware, Software, Support)",
      budget: 18000,
      actual: 9200,
    },
    { cfr_code: "E21", description: "Exam Fees", budget: 1200, actual: 0 },
    {
      cfr_code: "E22",
      description: "Admin Supplies & Communications",
      budget: 7500,
      actual: 4100,
    },
    {
      cfr_code: "E23",
      description: "Insurance Premiums",
      budget: 12000,
      actual: 12000,
    },
    {
      cfr_code: "E24",
      description: "Educational Visits",
      budget: 4500,
      actual: 1800,
    },
    {
      cfr_code: "E25",
      description: "Contract Catering",
      budget: 45000,
      actual: 24200,
    },
    {
      cfr_code: "E28a",
      description: "Bought-in Professional Services",
      budget: 95000,
      actual: 52000,
    },
  ],
};

export const GET = protectedRoute(async (auth, request) => {
  const forecast = generateForecast(CURRENT_YEAR_DATA);

  return apiSuccess({
    forecast,
    default_assumptions: DEFAULT_ASSUMPTIONS,
    current_year: {
      financial_year: CURRENT_YEAR_DATA.financial_year,
      total_budget: CURRENT_YEAR_DATA.lines.reduce((s, l) => s + l.budget, 0),
      total_income: CURRENT_YEAR_DATA.total_income,
    },
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();

  // Body should contain: { assumptions: Record<string, number> }
  // e.g. { assumptions: { E01: 3.5, E16: 10, E03: 2.5 } }
  const customAssumptions = body?.assumptions as
    | Record<string, number>
    | undefined;

  if (customAssumptions) {
    // Validate: all values must be numbers between -50 and +100
    for (const [key, val] of Object.entries(customAssumptions)) {
      if (typeof val !== "number" || val < -50 || val > 100) {
        return apiError(
          `Invalid assumption for ${key}: must be a number between -50 and 100`,
          400,
        );
      }
    }
  }

  const forecast = generateForecast(CURRENT_YEAR_DATA, customAssumptions);

  return apiSuccess({
    forecast,
    custom_assumptions_applied: customAssumptions || {},
  });
});
