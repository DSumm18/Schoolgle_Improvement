/**
 * Budget Confidence Engine
 *
 * The core problem: LA-maintained schools see expenditure leaving in real-time
 * but income arriving in delayed lumps. FMS shows a scary deficit picture that
 * doesn't reflect reality.
 *
 * This engine combines:
 * 1. FMS actual position (from Detailed Cost Centre Transaction Report)
 * 2. Expected income not yet in FMS (from ExpectedIncomeTracker)
 * 3. Historical patterns (seasonal spend, grant timing)
 * 4. Forward projection (3 years)
 *
 * Output: A "true position" with confidence scoring that gives heads/governors
 * the clarity to make spending decisions.
 */

import type { BudgetPlan, BudgetLine } from "./types";
import { CFR_EXPENDITURE, type CFRCode } from "./types";
import type {
  ExpectedIncomeEntry,
  IncomeConfidence,
  ExpectedIncomeCategory,
} from "./expected-income";
import {
  calculateExpectedIncome,
  INCOME_CATEGORY_LABELS,
  CONFIDENCE_META,
} from "./expected-income";

// =====================================================
// FMS DATA TYPES (from parsed Detailed Cost Centre Report)
// =====================================================

export interface FMSBudgetSummary {
  financial_year: string;
  as_at_date: string;
  budget_cycle: "la" | "academy";
  total_income_budget: number;
  total_income_actual: number;
  total_expenditure_budget: number;
  total_expenditure_actual: number;
  total_committed: number;
  balance_brought_forward: number;
  cost_centres: FMSCostCentre[];
}

export interface FMSCostCentre {
  code: string;
  name: string;
  cfr_code?: CFRCode;
  budget: number;
  actual: number;
  committed: number;
  available: number;
  /** Monthly actuals for trend analysis */
  monthly_actuals?: MonthlyActual[];
}

export interface MonthlyActual {
  month: number; // 1-12
  amount: number;
}

// =====================================================
// RESULT TYPES
// =====================================================

export interface BudgetConfidenceResult {
  as_at_date: string;
  financial_year: string;
  months_elapsed: number;
  months_remaining: number;
  year_progress_percent: number;

  // FMS Position (what FMS shows)
  fms_position: {
    total_income: number;
    total_expenditure: number;
    committed: number;
    net_position: number;
    balance_brought_forward: number;
  };

  // Expected Income (what we know is coming)
  expected_income: {
    confirmed: number;
    highly_likely: number;
    likely: number;
    uncertain: number;
    total: number;
  };

  // True Position (FMS + Expected)
  true_position: {
    /** FMS net + confirmed expected income */
    conservative: number;
    /** FMS net + confirmed + highly_likely */
    realistic: number;
    /** FMS net + all expected income */
    optimistic: number;
    confidence_label: string; // "Strong", "Moderate", "Cautious", "Concerning"
    confidence_score: number; // 0-100
  };

  // Year-end Projection
  projected_year_end: {
    conservative: number;
    realistic: number;
    optimistic: number;
    surplus_or_deficit: "surplus" | "deficit" | "balanced";
  };

  // Monthly Tracking
  monthly_tracking: MonthlyBudgetTrack[];

  // Alerts
  alerts: BudgetConfidenceAlert[];

  // Narrative for Head/Governors
  narrative: {
    headline: string; // e.g. "Budget on track with £45K projected surplus"
    fms_story: string; // What FMS shows (the scary number)
    reality_story: string; // What's really happening
    action_items: string[]; // What needs attention
    governor_summary: string; // 2-3 sentences for governors report
  };
}

export interface MonthlyBudgetTrack {
  month: number; // 1-12 (April=1 for LA, September=1 for academy)
  month_name: string;
  planned_expenditure: number;
  actual_expenditure: number;
  planned_income: number;
  actual_income: number;
  expected_income: number; // Not yet in FMS
  cumulative_planned: number;
  cumulative_actual: number;
  cumulative_with_expected: number;
  variance: number;
  variance_percent: number;
  on_track: boolean;
}

export interface BudgetConfidenceAlert {
  severity: "info" | "warning" | "critical";
  category: string;
  message: string;
  action: string;
}

// =====================================================
// MONTH NAME HELPERS
// =====================================================

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Monthly weight factors for energy spend (1.0 = average month) */
const ENERGY_SEASONALITY: Record<number, number> = {
  1: 1.6,
  2: 1.5,
  3: 1.2,
  4: 0.9,
  5: 0.7,
  6: 0.5,
  7: 0.3,
  8: 0.3,
  9: 0.7,
  10: 1.0,
  11: 1.3,
  12: 1.5,
};

/** Typical monthly expenditure profile (fraction of annual spend per month) */
const DEFAULT_MONTHLY_SPEND_PROFILE: Record<number, number> = {
  // Heavier in autumn/spring terms, lighter in summer/holidays
  1: 0.09, // Jan
  2: 0.09, // Feb
  3: 0.085, // Mar
  4: 0.085, // Apr
  5: 0.085, // May
  6: 0.075, // Jun
  7: 0.05, // Jul (holidays start)
  8: 0.04, // Aug (holidays)
  9: 0.085, // Sep
  10: 0.09, // Oct
  11: 0.09, // Nov
  12: 0.085, // Dec
};

// =====================================================
// MAIN CALCULATION
// =====================================================

/**
 * Calculate the full budget confidence picture
 */
export function calculateBudgetConfidence(
  fms: FMSBudgetSummary,
  costCentres: FMSCostCentre[],
  expectedIncome: ExpectedIncomeEntry[],
  asAtDate: string,
  budgetCycle: "la" | "academy",
): BudgetConfidenceResult {
  // 1. Calculate time position
  const fyStartMonth = budgetCycle === "la" ? 4 : 9; // April or September
  const fyYear = parseInt(fms.financial_year.split("/")[0]);
  const fyStart = new Date(fyYear, fyStartMonth - 1, 1);
  const fyEnd = new Date(
    fyStartMonth === 4 ? fyYear + 1 : fyYear + 1,
    fyStartMonth === 4 ? 2 : 7,
    fyStartMonth === 4 ? 31 : 31,
  );
  const currentDate = new Date(asAtDate);
  const totalMonths = 12;
  const monthsElapsed = Math.max(
    1,
    Math.min(
      totalMonths,
      (currentDate.getFullYear() - fyStart.getFullYear()) * 12 +
        (currentDate.getMonth() - fyStart.getMonth()),
    ),
  );
  const monthsRemaining = totalMonths - monthsElapsed;
  const yearProgressPercent = Math.round((monthsElapsed / totalMonths) * 100);

  // 2. FMS position
  const fmsNetPosition =
    fms.total_income_actual -
    fms.total_expenditure_actual -
    fms.total_committed +
    fms.balance_brought_forward;

  // 3. Expected income by confidence tier
  const incomeCalc = calculateExpectedIncome(expectedIncome, asAtDate);

  // 4. True position at three confidence levels
  const confirmed = incomeCalc.by_confidence.confirmed;
  const highlyLikely = incomeCalc.by_confidence.highly_likely;
  const likely = incomeCalc.by_confidence.likely;
  const uncertain = incomeCalc.by_confidence.uncertain;
  const totalExpectedOutstanding = incomeCalc.total_outstanding;

  const conservative = fmsNetPosition + confirmed;
  const realistic = fmsNetPosition + confirmed + highlyLikely;
  const optimistic =
    fmsNetPosition + confirmed + highlyLikely + likely + uncertain;

  // 5. Confidence scoring
  const confidenceScore = calculateConfidenceScore(
    fms,
    incomeCalc,
    monthsElapsed,
    costCentres,
  );
  const confidenceLabel = getConfidenceLabel(confidenceScore);

  // 6. Year-end projection
  const projectedYearEnd = projectYearEnd(
    fms,
    costCentres,
    incomeCalc,
    monthsElapsed,
    monthsRemaining,
    budgetCycle,
  );

  // 7. Monthly tracking
  const monthlyTracking = buildMonthlyTracking(
    fms,
    costCentres,
    expectedIncome,
    budgetCycle,
    fyYear,
    fyStartMonth,
  );

  // 8. Alerts
  const alerts = generateAlerts(
    fms,
    costCentres,
    incomeCalc,
    expectedIncome,
    monthsElapsed,
    monthsRemaining,
    yearProgressPercent,
    conservative,
    realistic,
    budgetCycle,
  );

  // 9. Narrative
  const narrative = generateNarrative(
    fms,
    costCentres,
    incomeCalc,
    expectedIncome,
    conservative,
    realistic,
    optimistic,
    projectedYearEnd,
    alerts,
    asAtDate,
    monthsElapsed,
    monthsRemaining,
    yearProgressPercent,
  );

  return {
    as_at_date: asAtDate,
    financial_year: fms.financial_year,
    months_elapsed: monthsElapsed,
    months_remaining: monthsRemaining,
    year_progress_percent: yearProgressPercent,
    fms_position: {
      total_income: fms.total_income_actual,
      total_expenditure: fms.total_expenditure_actual,
      committed: fms.total_committed,
      net_position: fmsNetPosition,
      balance_brought_forward: fms.balance_brought_forward,
    },
    expected_income: {
      confirmed,
      highly_likely: highlyLikely,
      likely,
      uncertain,
      total: totalExpectedOutstanding,
    },
    true_position: {
      conservative,
      realistic,
      optimistic,
      confidence_label: confidenceLabel,
      confidence_score: confidenceScore,
    },
    projected_year_end: projectedYearEnd,
    monthly_tracking: monthlyTracking,
    alerts,
    narrative,
  };
}

// =====================================================
// CONFIDENCE SCORING
// =====================================================

function calculateConfidenceScore(
  fms: FMSBudgetSummary,
  incomeCalc: ReturnType<typeof calculateExpectedIncome>,
  monthsElapsed: number,
  costCentres: FMSCostCentre[],
): number {
  let score = 50; // Start at neutral

  // More time elapsed = more data = higher base confidence
  score += Math.min(monthsElapsed * 2, 15);

  // Higher proportion of confirmed income = higher confidence
  const totalOutstanding = incomeCalc.total_outstanding;
  if (totalOutstanding > 0) {
    const confirmedRatio =
      incomeCalc.by_confidence.confirmed / totalOutstanding;
    score += confirmedRatio * 15;

    const confirmedPlusHighlyLikelyRatio =
      (incomeCalc.by_confidence.confirmed +
        incomeCalc.by_confidence.highly_likely) /
      totalOutstanding;
    score += confirmedPlusHighlyLikelyRatio * 10;
  } else {
    // All income received — maximum confidence on income side
    score += 25;
  }

  // Overdue items reduce confidence
  score -= incomeCalc.overdue_items.length * 5;

  // Large uncertain amounts reduce confidence
  if (totalOutstanding > 0) {
    const uncertainRatio =
      incomeCalc.by_confidence.uncertain / totalOutstanding;
    score -= uncertainRatio * 15;
  }

  // Overspend lines reduce confidence
  const overspentLines = costCentres.filter((cc) => {
    if (cc.budget <= 0) return false;
    const spentRatio = (cc.actual + cc.committed) / cc.budget;
    return spentRatio > 1.0;
  });
  score -= overspentLines.length * 3;

  // Income tracking: actual vs budget
  if (fms.total_income_budget > 0) {
    const incomeRatio = fms.total_income_actual / fms.total_income_budget;
    const expectedRatio = monthsElapsed / 12;
    // If income is significantly behind where it should be, reduce confidence
    if (incomeRatio < expectedRatio * 0.5 && monthsElapsed > 3) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getConfidenceLabel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 55) return "Moderate";
  if (score >= 35) return "Cautious";
  return "Concerning";
}

// =====================================================
// YEAR-END PROJECTION
// =====================================================

function projectYearEnd(
  fms: FMSBudgetSummary,
  costCentres: FMSCostCentre[],
  incomeCalc: ReturnType<typeof calculateExpectedIncome>,
  monthsElapsed: number,
  monthsRemaining: number,
  budgetCycle: "la" | "academy",
): {
  conservative: number;
  realistic: number;
  optimistic: number;
  surplus_or_deficit: "surplus" | "deficit" | "balanced";
} {
  // Project remaining expenditure using seasonal patterns
  const projectedRemainingExp = projectRemainingExpenditure(
    costCentres,
    monthsElapsed,
    monthsRemaining,
    budgetCycle,
  );

  // Total projected expenditure = actual + committed + projected remaining
  const totalProjectedExp =
    fms.total_expenditure_actual + fms.total_committed + projectedRemainingExp;

  // Income: FMS actual + expected at various confidence levels
  const confirmedIncome =
    fms.total_income_actual + incomeCalc.by_confidence.confirmed;
  const realisticIncome =
    confirmedIncome + incomeCalc.by_confidence.highly_likely;
  const optimisticIncome =
    realisticIncome +
    incomeCalc.by_confidence.likely +
    incomeCalc.by_confidence.uncertain;

  // Add brought-forward balance
  const bfwd = fms.balance_brought_forward;

  const conservativeEnd = bfwd + confirmedIncome - totalProjectedExp;
  const realisticEnd = bfwd + realisticIncome - totalProjectedExp;
  const optimisticEnd = bfwd + optimisticIncome - totalProjectedExp;

  // Surplus/deficit based on realistic projection
  let surplusOrDeficit: "surplus" | "deficit" | "balanced";
  if (realisticEnd > 1000) {
    surplusOrDeficit = "surplus";
  } else if (realisticEnd < -1000) {
    surplusOrDeficit = "deficit";
  } else {
    surplusOrDeficit = "balanced";
  }

  return {
    conservative: Math.round(conservativeEnd),
    realistic: Math.round(realisticEnd),
    optimistic: Math.round(optimisticEnd),
    surplus_or_deficit: surplusOrDeficit,
  };
}

function projectRemainingExpenditure(
  costCentres: FMSCostCentre[],
  monthsElapsed: number,
  monthsRemaining: number,
  budgetCycle: "la" | "academy",
): number {
  let totalProjected = 0;

  for (const cc of costCentres) {
    if (cc.budget <= 0) continue;

    // If we have monthly actuals, use the trend
    if (cc.monthly_actuals && cc.monthly_actuals.length >= 3) {
      const recentMonths = cc.monthly_actuals.slice(-3);
      const avgRecent =
        recentMonths.reduce((s, m) => s + m.amount, 0) / recentMonths.length;

      // For energy, apply seasonal weighting
      if (
        cc.cfr_code === "E16" ||
        cc.name.toLowerCase().includes("energy") ||
        cc.name.toLowerCase().includes("electricity") ||
        cc.name.toLowerCase().includes("gas")
      ) {
        totalProjected += projectWithSeasonality(
          avgRecent,
          monthsElapsed,
          monthsRemaining,
          budgetCycle,
        );
      } else {
        totalProjected += avgRecent * monthsRemaining;
      }
    } else {
      // Simple linear projection from actual spend rate
      if (monthsElapsed > 0) {
        const monthlyRate = cc.actual / monthsElapsed;
        totalProjected += monthlyRate * monthsRemaining;
      } else {
        // No actual data — use budget profile
        totalProjected += (cc.budget / 12) * monthsRemaining;
      }
    }
  }

  return totalProjected;
}

function projectWithSeasonality(
  recentMonthlyAvg: number,
  monthsElapsed: number,
  monthsRemaining: number,
  budgetCycle: "la" | "academy",
): number {
  const fyStartMonth = budgetCycle === "la" ? 4 : 9;
  let total = 0;

  // Work out which calendar months are remaining
  for (let i = 1; i <= monthsRemaining; i++) {
    const fyMonth = monthsElapsed + i;
    const calendarMonth = ((fyStartMonth - 1 + fyMonth - 1) % 12) + 1;
    const seasonalWeight = ENERGY_SEASONALITY[calendarMonth] || 1.0;
    // Scale the recent average by the seasonal weight
    total += recentMonthlyAvg * seasonalWeight;
  }

  return total;
}

// =====================================================
// MONTHLY TRACKING
// =====================================================

function buildMonthlyTracking(
  fms: FMSBudgetSummary,
  costCentres: FMSCostCentre[],
  expectedIncome: ExpectedIncomeEntry[],
  budgetCycle: "la" | "academy",
  fyYear: number,
  fyStartMonth: number,
): MonthlyBudgetTrack[] {
  const tracks: MonthlyBudgetTrack[] = [];
  let cumulativePlanned = 0;
  let cumulativeActual = 0;
  let cumulativeExpected = 0;

  const monthlyExpBudget = fms.total_expenditure_budget / 12;
  const monthlyIncBudget = fms.total_income_budget / 12;

  for (let m = 0; m < 12; m++) {
    const calendarMonth = ((fyStartMonth - 1 + m) % 12) + 1;
    const calendarYear = calendarMonth >= fyStartMonth ? fyYear : fyYear + 1;
    const monthStr = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}`;

    // Actual expenditure for this month from cost centres
    let monthActualExp = 0;
    for (const cc of costCentres) {
      if (cc.monthly_actuals) {
        const monthData = cc.monthly_actuals.find(
          (ma) => ma.month === calendarMonth,
        );
        if (monthData) monthActualExp += monthData.amount;
      }
    }

    // Actual income — approximate by dividing proportionally
    // In reality this would come from FMS income lines
    const monthActualIncome =
      m < Math.ceil(fms.total_income_actual / monthlyIncBudget)
        ? monthlyIncBudget
        : 0;

    // Expected income for this month
    let monthExpectedIncome = 0;
    for (const entry of expectedIncome) {
      if (entry.status === "received" || entry.status === "written_off")
        continue;
      for (const pd of entry.expected_dates) {
        if (pd.status === "pending" && pd.date.startsWith(monthStr)) {
          monthExpectedIncome += pd.amount;
        }
      }
    }

    // Use default spend profile for planned expenditure
    const spendWeight = DEFAULT_MONTHLY_SPEND_PROFILE[calendarMonth] || 1 / 12;
    const plannedExp = fms.total_expenditure_budget * spendWeight;
    const plannedInc = monthlyIncBudget;

    cumulativePlanned += plannedInc - plannedExp;
    cumulativeActual += monthActualIncome - monthActualExp;
    cumulativeExpected += monthExpectedIncome;

    const variance = cumulativeActual + cumulativeExpected - cumulativePlanned;
    const variancePct =
      Math.abs(cumulativePlanned) > 0
        ? (variance / Math.abs(cumulativePlanned)) * 100
        : 0;

    tracks.push({
      month: m + 1,
      month_name: MONTH_NAMES[calendarMonth - 1],
      planned_expenditure: Math.round(plannedExp),
      actual_expenditure: Math.round(monthActualExp),
      planned_income: Math.round(plannedInc),
      actual_income: Math.round(monthActualIncome),
      expected_income: Math.round(monthExpectedIncome),
      cumulative_planned: Math.round(cumulativePlanned),
      cumulative_actual: Math.round(cumulativeActual),
      cumulative_with_expected: Math.round(
        cumulativeActual + cumulativeExpected,
      ),
      variance: Math.round(variance),
      variance_percent: Math.round(variancePct * 10) / 10,
      on_track: variance >= -cumulativePlanned * 0.1, // Within 10% of plan
    });
  }

  return tracks;
}

// =====================================================
// ALERT GENERATION
// =====================================================

function generateAlerts(
  fms: FMSBudgetSummary,
  costCentres: FMSCostCentre[],
  incomeCalc: ReturnType<typeof calculateExpectedIncome>,
  expectedIncome: ExpectedIncomeEntry[],
  monthsElapsed: number,
  monthsRemaining: number,
  yearProgressPct: number,
  conservative: number,
  realistic: number,
  budgetCycle: "la" | "academy",
): BudgetConfidenceAlert[] {
  const alerts: BudgetConfidenceAlert[] = [];
  const yearProgress = yearProgressPct / 100;

  // --- Overdue income alerts ---
  for (const item of incomeCalc.overdue_items) {
    const overdueAmount = item.amount_outstanding;
    const categoryLabel =
      INCOME_CATEGORY_LABELS[
        item.category as keyof typeof INCOME_CATEGORY_LABELS
      ] || item.category;

    alerts.push({
      severity: overdueAmount > 10000 ? "critical" : "warning",
      category: "Income",
      message: `${item.description} expected £${formatMoney(item.total_expected)} but only £${formatMoney(item.amount_received)} received — £${formatMoney(overdueAmount)} overdue. Check with ${item.source}.`,
      action: `Contact ${item.source}${item.source_reference ? ` (ref: ${item.source_reference})` : ""} to chase the outstanding £${formatMoney(overdueAmount)} for ${categoryLabel}.`,
    });
  }

  // --- Expected income items with no receipts at all (if past first expected date) ---
  for (const entry of expectedIncome) {
    if (
      entry.status === "expected" &&
      entry.amount_received === 0 &&
      entry.expected_dates.length > 0
    ) {
      const firstDate = entry.expected_dates[0].date;
      if (firstDate < fms.as_at_date) {
        alerts.push({
          severity: entry.total_expected > 15000 ? "critical" : "warning",
          category: "Income",
          message: `${entry.description}: expected £${formatMoney(entry.total_expected)} with first payment due ${formatDateUK(firstDate)}, but nothing received yet.`,
          action: `Contact ${entry.source} to verify the ${entry.description} will still be paid. Consider reducing confidence level if no response.`,
        });
      }
    }
  }

  // --- Cost centre overspend alerts ---
  for (const cc of costCentres) {
    if (cc.budget <= 0) continue;

    const spentRatio = (cc.actual + cc.committed) / cc.budget;
    const cfrLabel = cc.cfr_code
      ? CFR_EXPENDITURE[cc.cfr_code] || cc.name
      : cc.name;

    // Already overspent
    if (spentRatio > 1.0) {
      const overspend = cc.actual + cc.committed - cc.budget;
      alerts.push({
        severity: "critical",
        category: "Expenditure",
        message: `${cfrLabel} (${cc.code}) has overspent by £${formatMoney(overspend)} (${Math.round(spentRatio * 100)}% of budget with ${monthsRemaining} months remaining).`,
        action: `Freeze spending on ${cfrLabel} immediately. Investigate cause and identify virement from underspent areas.`,
      });
    }
    // On track to overspend
    else if (spentRatio > yearProgress + 0.15 && cc.budget > 2000) {
      const monthlyRate = monthsElapsed > 0 ? cc.actual / monthsElapsed : 0;
      const projectedTotal =
        cc.actual + cc.committed + monthlyRate * monthsRemaining;
      const projectedOverspend = projectedTotal - cc.budget;

      if (projectedOverspend > 0) {
        alerts.push({
          severity:
            projectedOverspend > cc.budget * 0.15 ? "critical" : "warning",
          category: "Expenditure",
          message: `${cfrLabel} is tracking ${Math.round((spentRatio - yearProgress) * 100)}% above profile. At current burn rate, the ${cc.cfr_code || cc.code} line will overspend by £${formatMoney(projectedOverspend)} by year end.`,
          action: `Review ${cfrLabel} commitments. Consider whether spending can be deferred or reduced for the remaining ${monthsRemaining} months.`,
        });
      }
    }

    // Energy-specific alert
    if (cc.cfr_code === "E16" || cc.name.toLowerCase().includes("energy")) {
      if (spentRatio > yearProgress + 0.1 && cc.budget > 5000) {
        const abovePct = Math.round((spentRatio / yearProgress - 1) * 100);
        alerts.push({
          severity: "warning",
          category: "Energy",
          message: `Energy costs are tracking ${abovePct}% above budget YTD. At current burn rate, the E16 line will overspend by £${formatMoney(Math.round((cc.actual / yearProgress - cc.budget) * (1 - yearProgress)))} by year end.`,
          action:
            "Review energy consumption with site manager. Check BMS settings, heating schedules, and whether any equipment is running unnecessarily.",
        });
      }
    }
  }

  // --- Underspend opportunities ---
  const significantUnderspends = costCentres.filter((cc) => {
    if (cc.budget <= 5000) return false;
    const spentRatio =
      cc.budget > 0 ? (cc.actual + cc.committed) / cc.budget : 0;
    return spentRatio < yearProgress - 0.25 && monthsElapsed > 4;
  });

  if (significantUnderspends.length > 0) {
    const totalUnderspend = significantUnderspends.reduce((s, cc) => {
      const expected = cc.budget * yearProgress;
      return s + (expected - cc.actual - cc.committed);
    }, 0);
    const names = significantUnderspends
      .slice(0, 3)
      .map((cc) => cc.cfr_code || cc.code)
      .join(", ");
    alerts.push({
      severity: "info",
      category: "Opportunity",
      message: `${significantUnderspends.length} budget line${significantUnderspends.length > 1 ? "s" : ""} (${names}${significantUnderspends.length > 3 ? "..." : ""}) are significantly underspent — potential £${formatMoney(totalUnderspend)} available for reallocation.`,
      action:
        "Review whether these funds could be redirected to overspent areas or strategic priorities.",
    });
  }

  // --- Overall position alerts ---
  if (conservative < 0 && realistic < 0) {
    alerts.push({
      severity: "critical",
      category: "Overall Position",
      message: `The budget is projected to end the year in deficit even with confirmed expected income (conservative: -£${formatMoney(Math.abs(conservative))}, realistic: -£${formatMoney(Math.abs(realistic))}).`,
      action:
        "Urgent meeting with headteacher and governors required. Consider spending freeze, staffing review, and contact the LA for support.",
    });
  } else if (conservative < 0 && realistic >= 0) {
    alerts.push({
      severity: "warning",
      category: "Overall Position",
      message: `The conservative projection shows a deficit of £${formatMoney(Math.abs(conservative))}, but the realistic projection (including highly likely income) shows a surplus of £${formatMoney(realistic)}.`,
      action:
        "Chase outstanding expected income to convert from 'highly likely' to 'confirmed'. Ensure evidence is on file for all expected items.",
    });
  }

  // --- Large gap between FMS and true position ---
  const fmsNet =
    fms.total_income_actual -
    fms.total_expenditure_actual -
    fms.total_committed +
    fms.balance_brought_forward;
  const gap = realistic - fmsNet;
  if (Math.abs(gap) > 10000) {
    alerts.push({
      severity: "info",
      category: "Information",
      message: `The gap between FMS position (£${formatMoney(fmsNet)}) and realistic position (£${formatMoney(realistic)}) is £${formatMoney(gap)}. This is expected income that has not yet appeared in FMS.`,
      action:
        "No action required, but ensure expected income entries are kept up to date as grants are received.",
    });
  }

  // Sort by severity
  const severityOrder: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// =====================================================
// NARRATIVE GENERATION
// =====================================================

function generateNarrative(
  fms: FMSBudgetSummary,
  costCentres: FMSCostCentre[],
  incomeCalc: ReturnType<typeof calculateExpectedIncome>,
  expectedIncome: ExpectedIncomeEntry[],
  conservative: number,
  realistic: number,
  optimistic: number,
  projectedYearEnd: {
    conservative: number;
    realistic: number;
    optimistic: number;
    surplus_or_deficit: "surplus" | "deficit" | "balanced";
  },
  alerts: BudgetConfidenceAlert[],
  asAtDate: string,
  monthsElapsed: number,
  monthsRemaining: number,
  yearProgressPct: number,
): {
  headline: string;
  fms_story: string;
  reality_story: string;
  action_items: string[];
  governor_summary: string;
} {
  const fmsNet =
    fms.total_income_actual -
    fms.total_expenditure_actual -
    fms.total_committed +
    fms.balance_brought_forward;
  const dateStr = formatDateUK(asAtDate);

  // --- Headline ---
  let headline: string;
  if (projectedYearEnd.surplus_or_deficit === "surplus") {
    headline = `Budget on track with £${formatMoney(projectedYearEnd.realistic)} projected surplus`;
  } else if (projectedYearEnd.surplus_or_deficit === "deficit") {
    headline = `Budget pressure: £${formatMoney(Math.abs(projectedYearEnd.realistic))} projected deficit requires action`;
  } else {
    headline = `Budget broadly balanced — projected year-end position close to breakeven`;
  }

  // --- FMS Story (what FMS shows — often the scary number) ---
  let fmsStory: string;
  if (fmsNet < 0) {
    fmsStory = `FMS shows a net deficit of £${formatMoney(Math.abs(fmsNet))} as at ${dateStr}. This includes £${formatMoney(fms.total_income_actual)} income received, £${formatMoney(fms.total_expenditure_actual)} expenditure, and £${formatMoney(fms.total_committed)} committed.`;
    if (fms.balance_brought_forward > 0) {
      fmsStory += ` The balance brought forward is £${formatMoney(fms.balance_brought_forward)}.`;
    }
  } else {
    fmsStory = `FMS shows a net surplus of £${formatMoney(fmsNet)} as at ${dateStr}, with £${formatMoney(fms.total_income_actual)} income received against £${formatMoney(fms.total_expenditure_actual)} expenditure and £${formatMoney(fms.total_committed)} committed.`;
  }

  // --- Reality Story (what's really happening) ---
  const confirmedAmount = incomeCalc.by_confidence.confirmed;
  const highlyLikelyAmount = incomeCalc.by_confidence.highly_likely;
  const totalOutstanding = incomeCalc.total_outstanding;

  let realityStory: string;
  if (totalOutstanding > 0) {
    // Build a list of the biggest outstanding items
    const activeEntries = expectedIncome
      .filter(
        (e) =>
          e.status !== "received" &&
          e.status !== "written_off" &&
          e.amount_outstanding > 0,
      )
      .sort((a, b) => b.amount_outstanding - a.amount_outstanding);

    const topItems = activeEntries.slice(0, 4);
    const itemDescriptions = topItems
      .map(
        (e) =>
          `${shortCategoryName(e.category)} £${formatMoney(e.amount_outstanding)}`,
      )
      .join(", ");

    realityStory = `However, £${formatMoney(totalOutstanding)} of `;
    if (confirmedAmount > 0 && highlyLikelyAmount > 0) {
      realityStory += `confirmed and highly likely `;
    } else if (confirmedAmount > 0) {
      realityStory += `confirmed `;
    }
    realityStory += `income is expected but not yet posted`;
    if (topItems.length > 0) {
      realityStory += ` (${itemDescriptions})`;
    }
    realityStory += `. The realistic budget position is `;

    if (realistic >= 0) {
      realityStory += `a surplus of £${formatMoney(realistic)}.`;
    } else {
      realityStory += `a deficit of £${formatMoney(Math.abs(realistic))}.`;
    }
  } else {
    realityStory = `All expected income has been received. The FMS position accurately reflects the school's true budget position.`;
  }

  // --- Action Items ---
  const actionItems: string[] = [];

  // Overdue chasers
  const overdueEntries = incomeCalc.overdue_items;
  if (overdueEntries.length > 0) {
    for (const item of overdueEntries.slice(0, 3)) {
      actionItems.push(
        `Chase ${item.source} for ${item.description} — £${formatMoney(item.amount_outstanding)} overdue${item.source_reference ? ` (ref: ${item.source_reference})` : ""}.`,
      );
    }
  }

  // Overspend lines
  const criticalAlerts = alerts.filter(
    (a) => a.severity === "critical" && a.category === "Expenditure",
  );
  for (const alert of criticalAlerts.slice(0, 2)) {
    actionItems.push(alert.action);
  }

  // Energy warning
  const energyAlerts = alerts.filter((a) => a.category === "Energy");
  if (energyAlerts.length > 0) {
    actionItems.push(energyAlerts[0].action);
  }

  // Evidence gathering
  const likelyItems = expectedIncome.filter(
    (e) =>
      (e.confidence === "likely" || e.confidence === "uncertain") &&
      e.status !== "received" &&
      e.status !== "written_off" &&
      e.amount_outstanding > 5000,
  );
  if (likelyItems.length > 0) {
    actionItems.push(
      `Gather evidence to confirm ${likelyItems.length} income item${likelyItems.length > 1 ? "s" : ""} currently marked as '${likelyItems[0].confidence}' — totalling £${formatMoney(likelyItems.reduce((s, e) => s + e.amount_outstanding, 0))}.`,
    );
  }

  // If no actions, add a positive one
  if (actionItems.length === 0) {
    actionItems.push(
      "No urgent actions required. Continue to update expected income as grants are confirmed.",
    );
  }

  // --- Governor Summary ---
  let governorSummary: string;
  if (projectedYearEnd.surplus_or_deficit === "surplus") {
    governorSummary = `As at ${dateStr}, the school's budget is on track. While FMS shows `;
    if (fmsNet < 0) {
      governorSummary += `a deficit of £${formatMoney(Math.abs(fmsNet))} due to timing of income receipts, `;
    } else {
      governorSummary += `a surplus of £${formatMoney(fmsNet)}, `;
    }
    governorSummary += `the realistic position including expected income is a surplus of £${formatMoney(realistic)}. The projected year-end position is a surplus of £${formatMoney(projectedYearEnd.realistic)}.`;
  } else if (projectedYearEnd.surplus_or_deficit === "deficit") {
    governorSummary = `As at ${dateStr}, the budget is under pressure. The realistic position is `;
    if (realistic >= 0) {
      governorSummary += `a current surplus of £${formatMoney(realistic)}, but the projected year-end position is a deficit of £${formatMoney(Math.abs(projectedYearEnd.realistic))}. `;
    } else {
      governorSummary += `a deficit of £${formatMoney(Math.abs(realistic))}, and the projected year-end deficit is £${formatMoney(Math.abs(projectedYearEnd.realistic))}. `;
    }
    governorSummary += `Management action is being taken to address this.`;
  } else {
    governorSummary = `As at ${dateStr}, the budget is broadly balanced. The realistic projected year-end position is close to breakeven at £${formatMoney(projectedYearEnd.realistic)}.`;
    if (incomeCalc.overdue_items.length > 0) {
      governorSummary += ` ${incomeCalc.overdue_items.length} expected income item${incomeCalc.overdue_items.length > 1 ? "s are" : " is"} overdue and being chased.`;
    }
  }

  // Add critical alert count
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  if (criticalCount > 0) {
    governorSummary += ` There ${criticalCount === 1 ? "is" : "are"} ${criticalCount} critical alert${criticalCount > 1 ? "s" : ""} requiring attention.`;
  }

  return {
    headline,
    fms_story: fmsStory,
    reality_story: realityStory,
    action_items: actionItems,
    governor_summary: governorSummary,
  };
}

// =====================================================
// MULTI-YEAR PROJECTION
// =====================================================

export interface MultiYearProjection {
  years: YearProjection[];
  trend: "improving" | "stable" | "declining";
  risk_year?: string; // First year projected deficit
  assumptions: string[];
}

export interface YearProjection {
  financial_year: string;
  total_income: number;
  total_expenditure: number;
  surplus_deficit: number;
  cumulative_balance: number;
  assumptions: {
    pay_award_percent: number;
    energy_change_percent: number;
    nor_change: number;
    per_pupil_funding_change: number;
    new_costs: { description: string; amount: number }[];
    removed_costs: { description: string; amount: number }[];
  };
}

export function projectMultiYear(
  currentYear: BudgetConfidenceResult,
  historicalYears: FMSBudgetSummary[],
  assumptions: {
    pay_award_percent: number[]; // e.g. [3, 2.5, 2] for next 3 years
    energy_change_percent: number[];
    nor_changes: number[]; // e.g. [+5, -3, +2]
    per_pupil_change: number[]; // funding formula changes
    inflation_percent: number[]; // general non-staff inflation
  },
): MultiYearProjection {
  const years: YearProjection[] = [];
  const projectionYears = assumptions.pay_award_percent.length;

  // Parse current year data
  const currentFY = currentYear.financial_year;
  const currentFYStart = parseInt(currentFY.split("/")[0]);

  // Use realistic year-end as the starting balance
  let cumulativeBalance = currentYear.projected_year_end.realistic;
  let previousIncome =
    currentYear.fms_position.total_income + currentYear.expected_income.total;
  let previousExpenditure =
    currentYear.fms_position.total_expenditure +
    currentYear.fms_position.committed;

  // Estimate expenditure breakdown from current year
  // Assume ~75% is staffing, ~10% is energy, ~15% is other
  const estimatedStaffingPct = 0.75;
  const estimatedEnergyPct = 0.08;
  const estimatedOtherPct = 1 - estimatedStaffingPct - estimatedEnergyPct;

  // If we have historical data, use it to refine estimates
  let staffingBase = previousExpenditure * estimatedStaffingPct;
  let energyBase = previousExpenditure * estimatedEnergyPct;
  let otherBase = previousExpenditure * estimatedOtherPct;

  // Per-pupil income estimate (for NOR changes)
  // Rough: total income / assumed NOR (we don't have NOR here, so use income directly)
  let baseIncome = previousIncome;

  // Collect assumptions narrative
  const assumptionNotes: string[] = [];
  assumptionNotes.push(
    `Pay awards: ${assumptions.pay_award_percent.map((p) => `${p}%`).join(", ")} over ${projectionYears} years`,
  );
  assumptionNotes.push(
    `Energy changes: ${assumptions.energy_change_percent.map((p) => `${p > 0 ? "+" : ""}${p}%`).join(", ")}`,
  );
  assumptionNotes.push(
    `NOR changes: ${assumptions.nor_changes.map((n) => `${n > 0 ? "+" : ""}${n}`).join(", ")} pupils`,
  );
  assumptionNotes.push(
    `Per-pupil funding changes: ${assumptions.per_pupil_change.map((p) => `${p > 0 ? "+" : ""}${p}%`).join(", ")}`,
  );
  assumptionNotes.push(
    `General inflation: ${assumptions.inflation_percent.map((p) => `${p}%`).join(", ")}`,
  );

  let riskYear: string | undefined;

  for (let i = 0; i < projectionYears; i++) {
    const fy = `${currentFYStart + 1 + i}/${String(currentFYStart + 2 + i).slice(2)}`;

    const payAward = assumptions.pay_award_percent[i] || 2;
    const energyChange = assumptions.energy_change_percent[i] || 0;
    const norChange = assumptions.nor_changes[i] || 0;
    const perPupilChange = assumptions.per_pupil_change[i] || 0;
    const inflation = assumptions.inflation_percent[i] || 2;

    // Expenditure projection
    // Staffing: grows by pay award
    staffingBase *= 1 + payAward / 100;
    // Energy: grows by energy change
    energyBase *= 1 + energyChange / 100;
    // Other: grows by general inflation
    otherBase *= 1 + inflation / 100;

    const totalExpenditure = Math.round(staffingBase + energyBase + otherBase);

    // Income projection
    // Per-pupil funding change applied to base income
    baseIncome *= 1 + perPupilChange / 100;
    // NOR change: estimate per-pupil value from current data
    // Rough: if total income is ~£1.2M for 200 pupils, that's £6K per pupil
    const estimatedPerPupil = 6000; // Reasonable primary school estimate
    const norIncomeChange = norChange * estimatedPerPupil;
    const totalIncome = Math.round(baseIncome + norIncomeChange);

    const surplusDeficit = totalIncome - totalExpenditure;
    cumulativeBalance += surplusDeficit;

    if (cumulativeBalance < 0 && !riskYear) {
      riskYear = fy;
    }

    years.push({
      financial_year: fy,
      total_income: totalIncome,
      total_expenditure: totalExpenditure,
      surplus_deficit: surplusDeficit,
      cumulative_balance: Math.round(cumulativeBalance),
      assumptions: {
        pay_award_percent: payAward,
        energy_change_percent: energyChange,
        nor_change: norChange,
        per_pupil_funding_change: perPupilChange,
        new_costs: [],
        removed_costs: [],
      },
    });
  }

  // Determine trend
  let trend: "improving" | "stable" | "declining";
  if (years.length >= 2) {
    const firstSD = years[0].surplus_deficit;
    const lastSD = years[years.length - 1].surplus_deficit;
    if (lastSD > firstSD + 5000) {
      trend = "improving";
    } else if (lastSD < firstSD - 5000) {
      trend = "declining";
    } else {
      trend = "stable";
    }
  } else {
    trend = "stable";
  }

  return {
    years,
    trend,
    risk_year: riskYear,
    assumptions: assumptionNotes,
  };
}

// =====================================================
// HELPERS
// =====================================================

function formatMoney(amount: number): string {
  return Math.abs(amount).toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDateUK(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthIdx = parseInt(parts[1]) - 1;
  const monthName =
    monthIdx >= 0 && monthIdx < 12 ? months[monthIdx] : parts[1];
  return `${parseInt(parts[2])} ${monthName} ${parts[0]}`;
}

function shortCategoryName(category: string): string {
  const short: Record<string, string> = {
    pupil_premium: "PP",
    sen_top_up: "SEN top-ups",
    government_grant: "Gov't grant",
    staff_recharge: "staff recharge",
    insurance_claim: "insurance",
    lettings: "lettings",
    energy_recharge: "energy rebate",
    la_delegated: "delegated budget",
    other_grant: "other grant",
    catering: "catering",
    training_income: "training income",
    other: "other",
  };
  return short[category] || category;
}
