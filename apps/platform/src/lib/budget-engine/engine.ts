/**
 * Budget Decision Engine
 *
 * Connects all modules, analyses budget position, generates decision cards,
 * staff comms, department strategies, and climate actions.
 *
 * Flow:
 * 1. Gather data from all modules (finance, estates, vision, HR, etc.)
 * 2. Calculate budget position with ICFP benchmarks
 * 3. Detect issues (overspend, emergencies, stock alerts, benchmark flags)
 * 4. Generate decision cards with AI (options for head to approve/reject)
 * 5. On decision: auto-update SEF, SIP, risk register, climate plan, etc.
 * 6. Generate staff comms and department strategies
 */

import type {
  BudgetPlan,
  BudgetPosition,
  BudgetLine,
  BudgetAlert,
  BudgetIssue,
  DecisionCard,
  DecisionOption,
  DecisionAction,
  AutoUpdate,
  StaffCommunication,
  DepartmentStrategy,
  SavingInitiative,
  StockLevel,
  StockAlert,
  RiskEscalation,
  ICFPMetrics,
  ICFPBenchmark,
  CrossModuleImpact,
  CFRCode,
  MATOverview,
  MonthlySpend,
  StructuralViabilityResult,
} from "./types";
import { CFR_EXPENDITURE } from "./types";

// =====================================================
// SEASONAL PATTERNS (for spend projection)
// =====================================================

/** Monthly weight factors for energy spend (1.0 = average month) */
const ENERGY_SEASONALITY: Record<string, number> = {
  "01": 1.6, // January - peak heating
  "02": 1.5,
  "03": 1.2,
  "04": 0.9,
  "05": 0.7,
  "06": 0.5, // June - minimal heating
  "07": 0.3, // July - school holidays
  "08": 0.3, // August - school holidays
  "09": 0.7,
  "10": 1.0,
  "11": 1.3,
  "12": 1.5,
};

/** Months where supply staff spend is typically higher */
const SUPPLY_SEASONALITY: Record<string, number> = {
  "01": 1.3, // January - winter illness
  "02": 1.2,
  "03": 1.1,
  "04": 0.9,
  "05": 1.0,
  "06": 0.8,
  "07": 0.0,
  "08": 0.0,
  "09": 0.9,
  "10": 1.0,
  "11": 1.3,
  "12": 1.2,
};

// =====================================================
// BUDGET POSITION CALCULATOR
// =====================================================

export function calculateBudgetPosition(
  plan: BudgetPlan,
  asAtDate: Date = new Date(),
): BudgetPosition {
  const fyStart = new Date(plan.fy_start);
  const fyEnd = new Date(plan.fy_end);
  const totalMonths = monthsBetween(fyStart, fyEnd);
  const monthsElapsed = Math.min(monthsBetween(fyStart, asAtDate), totalMonths);
  const monthsRemaining = totalMonths - monthsElapsed;
  const yearProgress = monthsElapsed / totalMonths;

  let totalExpYtd = 0;
  let totalCommitted = 0;
  const alerts: BudgetAlert[] = [];

  for (const line of plan.lines) {
    totalExpYtd += line.actual_ytd;
    totalCommitted += line.committed;

    // Check spend rate against time elapsed
    const spendRate =
      line.planned_amount > 0
        ? (line.actual_ytd + line.committed) / line.planned_amount
        : 0;

    if (spendRate > yearProgress + 0.15 && line.planned_amount > 1000) {
      alerts.push({
        id: `alert-${line.cfr_code}`,
        cfr_code: line.cfr_code,
        category: line.category,
        severity: spendRate > yearProgress + 0.3 ? "critical" : "warning",
        message: `${line.category} overspending`,
        detail: `${Math.round(spendRate * 100)}% spent/committed with ${Math.round((1 - yearProgress) * 100)}% of year remaining`,
        suggested_action:
          spendRate > yearProgress + 0.3
            ? `Freeze spending on ${line.category} and investigate`
            : `Review ${line.category} commitments and consider reducing`,
      });
    }

    if (
      spendRate < yearProgress - 0.25 &&
      line.planned_amount > 5000 &&
      monthsElapsed > 3
    ) {
      alerts.push({
        id: `alert-under-${line.cfr_code}`,
        cfr_code: line.cfr_code,
        category: line.category,
        severity: "info",
        message: `${line.category} underspending`,
        detail: `Only ${Math.round(spendRate * 100)}% spent at ${Math.round(yearProgress * 100)}% through year — potential reallocation opportunity`,
      });
    }
  }

  const availableBudget =
    plan.total_expenditure_planned - totalExpYtd - totalCommitted;
  const burnRate =
    yearProgress > 0
      ? totalExpYtd / plan.total_expenditure_planned / yearProgress
      : 1;

  return {
    school_id: plan.school_id,
    as_at_date: asAtDate.toISOString().split("T")[0],
    months_elapsed: monthsElapsed,
    months_remaining: monthsRemaining,
    year_progress: yearProgress,
    total_income_received: plan.total_income * yearProgress,
    total_expenditure_ytd: totalExpYtd,
    total_committed: totalCommitted,
    available_budget: availableBudget,
    projected_year_end_position: availableBudget,
    projected_surplus_deficit:
      plan.total_income -
      (totalExpYtd +
        totalCommitted +
        projectRemainingSpend(plan.lines, monthsRemaining)),
    burn_rate: burnRate > 1.1 ? "over" : burnRate < 0.9 ? "under" : "on_track",
    burn_rate_percent: Math.round(burnRate * 100),
    icfp: calculateICFP(plan),
    icfp_benchmarks: [],
    alerts,
    active_issues: [],
  };
}

function projectRemainingSpend(
  lines: BudgetLine[],
  monthsRemaining: number,
): number {
  let total = 0;
  for (const line of lines) {
    if (line.frozen) continue;
    const monthlyRate =
      line.monthly_profile.length > 0
        ? line.monthly_profile.reduce((s, m) => s + m.actual, 0) /
          line.monthly_profile.length
        : line.actual_ytd / Math.max(1, line.monthly_profile.length || 1);
    total += monthlyRate * monthsRemaining;
  }
  return total;
}

function calculateICFP(plan: BudgetPlan): ICFPMetrics {
  const staffCodes: CFRCode[] = [
    "E01",
    "E02",
    "E03",
    "E04",
    "E05",
    "E06",
    "E07",
    "E26",
  ];
  const teachingCodes: CFRCode[] = ["E01", "E02", "E26"];

  let totalStaff = 0;
  let totalTeaching = 0;

  for (const line of plan.lines) {
    if (staffCodes.includes(line.cfr_code)) totalStaff += line.planned_amount;
    if (teachingCodes.includes(line.cfr_code))
      totalTeaching += line.planned_amount;
  }

  const income = plan.total_income || 1;

  // 1. Staffing % = total staff costs / total income × 100
  const staffing_percent = (totalStaff / income) * 100;

  // 2. Pupil:teacher ratio = NOR / teacher FTE
  const pupil_teacher_ratio =
    plan.number_on_roll && plan.teacher_fte && plan.teacher_fte > 0
      ? plan.number_on_roll / plan.teacher_fte
      : 0;

  // 3. Average class size = NOR / number of classes
  const average_class_size =
    plan.number_on_roll && plan.number_of_classes && plan.number_of_classes > 0
      ? plan.number_on_roll / plan.number_of_classes
      : 0;

  // 4. Average teacher cost = total teaching cost / teacher FTE
  const average_teacher_cost =
    plan.teacher_fte && plan.teacher_fte > 0
      ? totalTeaching / plan.teacher_fte
      : 0;

  // 5. Teacher contact ratio = teaching periods / total available periods
  const teacher_contact_ratio =
    plan.teaching_periods &&
    plan.total_available_periods &&
    plan.total_available_periods > 0
      ? plan.teaching_periods / plan.total_available_periods
      : 0;

  // 6. Leadership % = leadership cost / total staff costs × 100
  const leadership_percent =
    plan.leadership_cost && totalStaff > 0
      ? (plan.leadership_cost / totalStaff) * 100
      : 0;

  // 7. Leadership FTE % = leadership FTE / total staff FTE × 100
  const leadership_fte_percent =
    plan.leadership_fte && plan.total_staff_fte && plan.total_staff_fte > 0
      ? (plan.leadership_fte / plan.total_staff_fte) * 100
      : 0;

  return {
    staffing_percent,
    pupil_teacher_ratio,
    average_class_size,
    average_teacher_cost,
    teacher_contact_ratio,
    leadership_percent,
    leadership_fte_percent,
  };
}

// =====================================================
// STRUCTURAL VIABILITY ASSESSMENT
// =====================================================

/**
 * Assess the structural viability of a school's staffing and financial model.
 * Uses ICFP metrics and number on roll to detect structural risks that
 * threaten long-term sustainability — particularly relevant for small schools,
 * half-form entry schools, and those with expensive leadership structures.
 */
export function assessStructuralViability(
  icfp: ICFPMetrics,
  number_on_roll: number,
): StructuralViabilityResult {
  const risks: string[] = [];
  const suggestions: string[] = [];

  // --- Half-form entry / small school risk ---
  if (number_on_roll < 120) {
    risks.push(
      `Half-form entry school (NOR ${number_on_roll}): fixed leadership costs are spread across very few pupils, making it difficult to achieve sustainable staffing ratios.`,
    );
    suggestions.push(
      "Consider federation or executive headship to share leadership costs across schools.",
    );
    suggestions.push(
      "Explore mixed-age class teaching to reduce the number of required class teachers.",
    );
  }

  // --- Staffing > 85% of income (financial risk) ---
  if (icfp.staffing_percent > 85) {
    risks.push(
      `Staffing costs at ${icfp.staffing_percent.toFixed(1)}% of income — critically above the 78% ICFP threshold. Very limited budget for non-staff expenditure (resources, premises, professional development).`,
    );
    suggestions.push(
      "Conduct a full staffing structure review: identify posts that can be restructured at next natural vacancy.",
    );
    suggestions.push(
      "Review supply/agency spend (E02, E26) — consider investing in cover supervisor posts instead.",
    );
  } else if (icfp.staffing_percent > 80) {
    risks.push(
      `Staffing costs at ${icfp.staffing_percent.toFixed(1)}% of income — above the 78% ICFP recommended maximum. Non-staff budgets are under pressure.`,
    );
    suggestions.push(
      "Plan for natural attrition: when a post becomes vacant, review whether it needs replacing like-for-like.",
    );
  }

  // --- Low pupil:teacher ratio (expensive structure) ---
  if (icfp.pupil_teacher_ratio > 0 && icfp.pupil_teacher_ratio < 15) {
    risks.push(
      `Pupil:teacher ratio of ${icfp.pupil_teacher_ratio.toFixed(1)} is below 15 — the school is buying more teaching capacity than comparable schools. This drives high per-pupil staffing costs.`,
    );
    suggestions.push(
      "Review class organisation: could any year groups be combined or classes reorganised to increase average class size?",
    );
    suggestions.push(
      "Audit non-class-based teacher roles (e.g. TLR holders with significant non-teaching time) for cost-effectiveness.",
    );
  }

  // --- Teacher contact ratio too low (teachers not teaching enough) ---
  if (icfp.teacher_contact_ratio > 0 && icfp.teacher_contact_ratio < 0.7) {
    risks.push(
      `Teacher contact ratio of ${icfp.teacher_contact_ratio.toFixed(2)} is well below the 0.78 target — teachers are spending too little time in front of classes relative to their cost.`,
    );
    suggestions.push(
      "Review PPA and leadership time allocations to ensure they align with STPCD minimums rather than exceeding them.",
    );
  }

  // --- Leadership costs disproportionately high ---
  if (icfp.leadership_percent > 20) {
    risks.push(
      `Leadership costs at ${icfp.leadership_percent.toFixed(1)}% of total staff spend — significantly above the typical 10-15% range.`,
    );
    suggestions.push(
      "Consider whether all leadership posts are essential at current grades, or if responsibilities could be redistributed.",
    );
  }

  // --- Average teacher cost very high ---
  if (icfp.average_teacher_cost > 55000) {
    risks.push(
      `Average teacher cost of £${Math.round(icfp.average_teacher_cost).toLocaleString()} suggests a top-heavy pay profile. Limited room for future pay progression increases.`,
    );
    suggestions.push(
      "As experienced staff retire, consider replacing with ECTs or less experienced teachers to rebalance the pay profile.",
    );
  }

  // --- Combined risk: small school + high staffing ---
  if (number_on_roll < 120 && icfp.staffing_percent > 80) {
    risks.push(
      "Combined structural risk: small school with high staffing ratio. This model is unlikely to be sustainable without external support or structural change.",
    );
    suggestions.push(
      "Urgently explore MAT membership, hard federation, or shared services arrangements to achieve economies of scale.",
    );
  }

  const viable = risks.length === 0;

  return { viable, risks, suggestions };
}

// =====================================================
// DECISION CARD GENERATOR
// =====================================================

/** Generate decision cards from current budget issues */
export function generateDecisionCards(
  position: BudgetPosition,
  issues: BudgetIssue[],
  stockAlerts: StockAlert[],
  plan: BudgetPlan,
): DecisionCard[] {
  const cards: DecisionCard[] = [];

  // 1. Emergency issues (boiler broke, roof leak, etc.)
  for (const issue of issues.filter(
    (i) => i.severity === "critical" && i.status === "new",
  )) {
    cards.push(generateEmergencyDecision(issue, position, plan));
  }

  // 2. Overspend alerts
  for (const alert of position.alerts.filter(
    (a) => a.severity === "critical",
  )) {
    cards.push(generateOverspendDecision(alert, position, plan));
  }

  // 3. ICFP benchmark flags
  if (position.icfp.staffing_percent > 80) {
    cards.push(generateStaffingDecision(position, plan));
  }

  // 4. Stock-based ordering decisions
  for (const stock of stockAlerts.filter(
    (s) => s.alert_type === "order_blocked",
  )) {
    cards.push(generateStockDecision(stock, position));
  }

  return cards;
}

function generateEmergencyDecision(
  issue: BudgetIssue,
  position: BudgetPosition,
  plan: BudgetPlan,
): DecisionCard {
  // Find budget lines that could absorb the cost
  const underspentLines = plan.lines
    .filter((l) => l.available > issue.financial_impact * 0.3 && !l.frozen)
    .sort((a, b) => b.available - a.available);

  // Find strategic priorities that could be paused
  const pausablePriorities = plan.strategic_priorities.filter(
    (p) => p.status === "on_track" && p.planned_spend > 0,
  );

  const options: DecisionOption[] = [];

  // Option 1: Absorb from underspent areas
  if (underspentLines.length > 0) {
    const sources = underspentLines.slice(0, 3);
    options.push({
      index: 0,
      title: "Reallocate from underspent budget lines",
      description: `Move funds from ${sources.map((s) => s.category).join(", ")} to cover the ${issue.title}. These areas are currently underspent.`,
      financial_impact: 0,
      risk_level: "low",
      risk_detail: "Minimal impact as these areas are tracking below budget",
      actions: sources.map((s) => ({
        type: "reallocate" as const,
        target_module: "finance",
        cfr_code: s.cfr_code,
        description: `Reallocate £${Math.round(issue.financial_impact / sources.length)} from ${s.category}`,
        amount: -Math.round(issue.financial_impact / sources.length),
        auto_updates: [
          {
            target: "budget_line" as const,
            update_type: "amount_change" as const,
            description: `Budget virement: ${s.category} reduced by £${Math.round(issue.financial_impact / sources.length)} for ${issue.title}`,
          },
        ],
      })),
      implementation: "Immediate — budget virement processed today",
    });
  }

  // Option 2: Pause a strategic priority
  if (pausablePriorities.length > 0) {
    const toPause = pausablePriorities[0];
    options.push({
      index: 1,
      title: `Pause "${toPause.title}" and redirect funds`,
      description: `Defer this planned initiative to next financial year. Releases £${toPause.planned_spend - toPause.actual_spend} to cover emergency costs.`,
      financial_impact: -(toPause.planned_spend - toPause.actual_spend),
      risk_level: "medium",
      risk_detail: `${toPause.title} will need to be included in next year's budget plan`,
      actions: [
        {
          type: "pause",
          target_module: toPause.source,
          target_id: toPause.id,
          description: `Pause "${toPause.title}" — defer to ${plan.financial_year} + 1`,
          amount: -(toPause.planned_spend - toPause.actual_spend),
          auto_updates: [
            {
              target: "sip",
              update_type: "status_change",
              description: `"${toPause.title}" paused due to ${issue.title}. Deferred to next year.`,
            },
            {
              target: "sef",
              update_type: "narrative_update",
              description: `SEF updated: ${toPause.title} deferred due to emergency ${issue.title}. Risk mitigated by [monitoring plan].`,
            },
            {
              target: "risk_register",
              update_type: "new_entry",
              description: `New risk: ${toPause.title} deferred — impact on [area] requires monitoring`,
            },
          ],
        },
      ],
      implementation: "Takes effect immediately. SIP and SEF auto-updated.",
    });
  }

  // Option 3: Freeze discretionary spending school-wide
  options.push({
    index: options.length,
    title: "Temporary spending freeze on non-essentials",
    description:
      "Block all discretionary purchases (learning resources, admin supplies, non-urgent premises) for the remainder of this term.",
    financial_impact: estimateDiscretionarySaving(plan),
    risk_level: "medium",
    risk_detail:
      "Staff will need to work with existing resources. Clear communication needed.",
    actions: [
      {
        type: "block_orders",
        target_module: "finance",
        cfr_code: "E19",
        description: "Block learning resources orders",
        auto_updates: [],
      },
      {
        type: "block_orders",
        target_module: "finance",
        cfr_code: "E22",
        description: "Block admin supplies orders",
        auto_updates: [],
      },
      {
        type: "monitor",
        target_module: "estates",
        description: "Non-urgent premises work paused",
        auto_updates: [
          {
            target: "staff_comms",
            update_type: "new_entry",
            description:
              "Generate all-staff communication about temporary spending review",
          },
          {
            target: "department_strategy",
            update_type: "new_entry",
            description: "Generate department-level saving suggestions",
          },
        ],
      },
    ],
    implementation: "Immediate. Staff notified within 24 hours.",
  });

  return {
    id: `decision-${issue.id}`,
    school_id: position.school_id,
    trigger_issue_id: issue.id,
    trigger_type: "emergency",
    title: `Emergency: ${issue.title}`,
    situation: `${issue.description}\n\nEstimated cost: £${issue.financial_impact.toLocaleString()}.\nCurrent budget position: £${position.available_budget.toLocaleString()} available.\n${position.months_remaining} months remaining in financial year.`,
    options,
    ai_recommendation: 0,
    ai_reasoning:
      "Reallocating from underspent areas is the lowest-risk option and avoids disruption to planned priorities.",
    cross_module_impacts: issue.cfr_codes_affected.map((code) => ({
      module: cfrToModule(code),
      impact_type: "negative" as const,
      description: `${CFR_EXPENDITURE[code]} budget affected`,
      affected_items: [issue.title],
    })),
    status: "pending",
    created_at: new Date().toISOString(),
  };
}

function generateOverspendDecision(
  alert: BudgetAlert,
  position: BudgetPosition,
  plan: BudgetPlan,
): DecisionCard {
  return {
    id: `decision-overspend-${alert.cfr_code}`,
    school_id: position.school_id,
    trigger_type: "overspend",
    title: `Overspend alert: ${alert.category}`,
    situation: alert.detail,
    options: [
      {
        index: 0,
        title: "Freeze remaining budget for this area",
        description: `Stop all new orders against ${alert.category}. Honour existing commitments only.`,
        financial_impact: 0,
        risk_level: "medium",
        risk_detail:
          "Department heads will need to manage with current resources",
        actions: [
          {
            type: "block_orders",
            target_module: "finance",
            cfr_code: alert.cfr_code,
            description: `Freeze ${alert.category}`,
            auto_updates: [],
          },
        ],
        implementation: "Immediate",
      },
      {
        index: 1,
        title: "Investigate and report",
        description:
          "Assign investigation to understand why spend is ahead of profile. Report back within 5 working days.",
        financial_impact: 0,
        risk_level: "low",
        risk_detail:
          "No immediate action taken — spend continues while investigating",
        actions: [
          {
            type: "monitor",
            target_module: "finance",
            cfr_code: alert.cfr_code,
            description: "Investigate overspend",
            auto_updates: [],
          },
        ],
        implementation: "5 working days",
      },
    ],
    ai_recommendation: 1,
    ai_reasoning:
      "Investigation recommended first to understand root cause before freezing, as the overspend may be due to timing differences or one-off costs.",
    cross_module_impacts: [],
    status: "pending",
    created_at: new Date().toISOString(),
  };
}

function generateStaffingDecision(
  position: BudgetPosition,
  plan: BudgetPlan,
): DecisionCard {
  return {
    id: `decision-staffing-${position.school_id}`,
    school_id: position.school_id,
    trigger_type: "benchmark_flag",
    title: `ICFP flag: Staffing at ${position.icfp.staffing_percent.toFixed(1)}% of income`,
    situation: `Your staffing costs are ${position.icfp.staffing_percent.toFixed(1)}% of income, above the recommended maximum of 78%. The DfE ICFP framework flags this as a concern. Similar schools average 75-78%.`,
    options: [
      {
        index: 0,
        title: "Review staffing structure with ICFP tool",
        description:
          "Use the ICFP analysis to identify where savings could be made through natural attrition, restructuring, or reducing agency spend.",
        financial_impact: 0,
        risk_level: "low",
        risk_detail: "Analysis only — no changes until approved",
        actions: [
          {
            type: "monitor",
            target_module: "hr",
            description: "ICFP staffing review",
            auto_updates: [
              {
                target: "sip",
                update_type: "new_entry",
                description:
                  "Strategic objective: review staffing structure against ICFP benchmarks",
              },
            ],
          },
        ],
        implementation: "Complete review within half term",
      },
      {
        index: 1,
        title: "Freeze agency/supply spend",
        description:
          "Reduce supply and agency teacher costs (E02, E26). Cover internally where possible.",
        financial_impact: estimateSupplySaving(plan),
        risk_level: "medium",
        risk_detail: "Staff workload may increase. Monitor wellbeing.",
        actions: [
          {
            type: "reduce",
            target_module: "finance",
            cfr_code: "E02",
            description: "Reduce supply teaching spend",
            auto_updates: [],
          },
          {
            type: "reduce",
            target_module: "finance",
            cfr_code: "E26",
            description: "Reduce agency supply spend",
            auto_updates: [],
          },
        ],
        implementation:
          "Immediate — review each supply booking before approval",
      },
    ],
    ai_recommendation: 0,
    ai_reasoning:
      "A structured ICFP review is the responsible approach. Knee-jerk cuts to staffing can harm outcomes. Understanding the data first leads to better decisions.",
    cross_module_impacts: [
      {
        module: "hr",
        impact_type: "neutral",
        description: "Staffing review may lead to restructuring discussions",
        affected_items: ["staffing structure", "agency contracts"],
      },
      {
        module: "teaching",
        impact_type: "neutral",
        description: "Teaching quality must be maintained during any changes",
        affected_items: ["curriculum delivery", "class sizes"],
      },
    ],
    status: "pending",
    created_at: new Date().toISOString(),
  };
}

function generateStockDecision(
  alert: StockAlert,
  position: BudgetPosition,
): DecisionCard {
  return {
    id: `decision-stock-${alert.stock_id}`,
    school_id: position.school_id,
    trigger_type: "stock_alert",
    title: alert.message,
    situation: `${alert.message}\n\n${alert.suggested_action}`,
    options: [
      {
        index: 0,
        title: "Maintain order block",
        description:
          "Current stock is sufficient. No new orders until next financial year.",
        financial_impact: 0,
        risk_level: "low",
        risk_detail: "Stock levels monitored weekly via vision scans",
        actions: [
          {
            type: "block_orders",
            target_module: "finance",
            description: "Order block maintained",
            auto_updates: [],
          },
        ],
        implementation: "No action needed — block remains",
      },
      {
        index: 1,
        title: "Override and allow order",
        description:
          "Allow a new order despite stock levels. Requires justification.",
        financial_impact: 0,
        risk_level: "low",
        risk_detail: "Budget impact tracked against the relevant CFR code",
        actions: [
          {
            type: "approve",
            target_module: "finance",
            description: "Order block overridden with justification",
            auto_updates: [],
          },
        ],
        implementation: "Immediate — staff can place order via Deal Finder",
      },
    ],
    ai_recommendation: 0,
    ai_reasoning:
      "Vision scan confirms sufficient stock. Maintaining the block saves money and reduces waste.",
    cross_module_impacts: [],
    status: "pending",
    created_at: new Date().toISOString(),
  };
}

// =====================================================
// DEPARTMENT STRATEGY GENERATOR
// =====================================================

/** Standard saving initiatives by department — AI would enhance these */
export const DEPARTMENT_INITIATIVES: Record<string, SavingInitiative[]> = {
  Premises: [
    {
      id: "prem-1",
      title: "Switch off standby equipment",
      description:
        "Ensure all non-essential electrical equipment is switched off fully (not standby) at end of day. Standby power can cost 5-10% of a school's electricity bill.",
      department: "Premises",
      category: "energy",
      estimated_saving: 400,
      saving_period: "annual",
      effort: "low",
      implementation:
        "Caretaker to do end-of-day walkthrough. Create checklist in estates daily checks.",
      climate_action: true,
      climate_category: "energy_reduction",
      co2_saving_kg: 180,
      status: "suggested",
    },
    {
      id: "prem-2",
      title: "Reduce heating by 1 degree",
      description:
        "Lowering thermostat by 1°C typically saves 8-10% on heating costs with minimal comfort impact.",
      department: "Premises",
      category: "energy",
      estimated_saving: 800,
      saving_period: "annual",
      effort: "low",
      implementation:
        "Adjust BMS/thermostats. Monitor via half-termly energy readings.",
      climate_action: true,
      climate_category: "energy_reduction",
      co2_saving_kg: 350,
      status: "suggested",
    },
    {
      id: "prem-3",
      title: "LED lighting replacement programme",
      description:
        "Replace remaining fluorescent tubes with LED. Typical payback 18-24 months, then ongoing savings.",
      department: "Premises",
      category: "energy",
      estimated_saving: 600,
      saving_period: "annual",
      effort: "medium",
      implementation:
        "Phase by area. Start with highest-usage rooms (halls, corridors).",
      climate_action: true,
      climate_category: "energy_reduction",
      co2_saving_kg: 270,
      status: "suggested",
    },
    {
      id: "prem-4",
      title: "Consolidate cleaning contracts",
      description:
        "Review cleaning schedule and contracts. Consider reducing frequency of non-essential areas during holidays.",
      department: "Premises",
      category: "contracts",
      estimated_saving: 1200,
      saving_period: "annual",
      effort: "medium",
      implementation: "Review current contract terms. Renegotiate or retender.",
      climate_action: false,
      status: "suggested",
    },
  ],
  Teaching: [
    {
      id: "teach-1",
      title: "Consolidate photocopying/printing",
      description:
        "Set default to double-sided, mono printing. Reduce colour printing. Set print quotas per department.",
      department: "Teaching",
      category: "resources",
      estimated_saving: 500,
      saving_period: "annual",
      effort: "low",
      implementation: "Change printer defaults. Communicate to staff.",
      climate_action: true,
      climate_category: "waste_reduction",
      co2_saving_kg: 50,
      status: "suggested",
    },
    {
      id: "teach-2",
      title: "Share resources across year groups",
      description:
        "Create shared resource library to avoid duplicate purchases of the same workbooks/materials.",
      department: "Teaching",
      category: "procurement",
      estimated_saving: 300,
      saving_period: "annual",
      effort: "low",
      implementation:
        "Set up shared drive/cupboard. Department heads coordinate.",
      climate_action: true,
      climate_category: "waste_reduction",
      co2_saving_kg: 20,
      status: "suggested",
    },
  ],
  Office: [
    {
      id: "office-1",
      title: "Switch to digital forms",
      description:
        "Replace paper forms (permission slips, absence notes) with digital alternatives. Reduces paper, printing, and postage.",
      department: "Office",
      category: "process",
      estimated_saving: 400,
      saving_period: "annual",
      effort: "medium",
      implementation:
        "Use existing ParentMail/Arbor forms. Phase out paper over one term.",
      climate_action: true,
      climate_category: "waste_reduction",
      co2_saving_kg: 30,
      status: "suggested",
    },
  ],
  ICT: [
    {
      id: "ict-1",
      title: "Review software licences",
      description:
        "Audit all software subscriptions. Cancel unused licences. Check for education pricing on remaining.",
      department: "ICT",
      category: "contracts",
      estimated_saving: 800,
      saving_period: "annual",
      effort: "medium",
      implementation:
        "IT lead to audit within 2 weeks. Cancel before renewal dates.",
      climate_action: false,
      status: "suggested",
    },
  ],
  Catering: [
    {
      id: "cat-1",
      title: "Reduce food waste with menu planning",
      description:
        "Analyse meal uptake data to reduce over-ordering. Typical waste reduction: 15-20%.",
      department: "Catering",
      category: "waste",
      estimated_saving: 600,
      saving_period: "annual",
      effort: "medium",
      implementation: "Track waste for 2 weeks, adjust order quantities.",
      climate_action: true,
      climate_category: "waste_reduction",
      co2_saving_kg: 200,
      status: "suggested",
    },
  ],
};

// =====================================================
// STAFF COMMS GENERATOR
// =====================================================

export function generateStaffComms(
  decision: DecisionCard,
  chosenOption: DecisionOption,
): StaffCommunication[] {
  const comms: StaffCommunication[] = [];

  // All-staff high-level update
  comms.push({
    id: `comms-all-${decision.id}`,
    school_id: decision.school_id,
    decision_id: decision.id,
    audience: "all_staff",
    subject: `School update: ${simplifyTitle(decision.title)}`,
    body: generateAllStaffMessage(decision, chosenOption),
    tone: "reassuring",
    status: "draft",
    created_at: new Date().toISOString(),
  });

  // SLT detailed briefing
  comms.push({
    id: `comms-slt-${decision.id}`,
    school_id: decision.school_id,
    decision_id: decision.id,
    audience: "slt",
    subject: `SLT briefing: ${decision.title}`,
    body: generateSLTMessage(decision, chosenOption),
    tone: "informative",
    status: "draft",
    created_at: new Date().toISOString(),
  });

  return comms;
}

function generateAllStaffMessage(
  decision: DecisionCard,
  option: DecisionOption,
): string {
  return `Dear colleagues,

I wanted to give you a brief update on our budget planning.

${simplifySituation(decision.situation)}

We have reviewed the options and decided to: ${option.title.toLowerCase()}.

${option.description}

What this means for you:
${option.actions.map((a) => `- ${a.description}`).join("\n")}

If you have any questions or suggestions for how your department can help, please speak to your line manager or the school business manager.

Thank you for your continued support.

Best wishes,
[Head Teacher]`;
}

function generateSLTMessage(
  decision: DecisionCard,
  option: DecisionOption,
): string {
  return `SLT Briefing — ${decision.title}

Situation:
${decision.situation}

Decision taken: ${option.title}
Financial impact: £${Math.abs(option.financial_impact).toLocaleString()}
Risk level: ${option.risk_level}

Actions required:
${option.actions.map((a) => `- [${a.type.toUpperCase()}] ${a.description}`).join("\n")}

Auto-updates triggered:
${
  option.actions
    .flatMap((a) => a.auto_updates)
    .map((u) => `- ${u.target}: ${u.description}`)
    .join("\n") || "None"
}

Cross-module impacts:
${decision.cross_module_impacts.map((i) => `- ${i.module}: ${i.description}`).join("\n") || "None"}

Please review and confirm any department-specific actions within 5 working days.

Generated by Schoolgle Budget Decision Engine`;
}

// =====================================================
// STOCK INTELLIGENCE
// =====================================================

export function assessStockLevel(
  stock: StockLevel,
  budgetRenewalDate: Date,
  currentDate: Date = new Date(),
): StockAlert | null {
  const weeksUntilRenewal = Math.ceil(
    (budgetRenewalDate.getTime() - currentDate.getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  );

  if (stock.weeks_remaining >= weeksUntilRenewal) {
    return {
      stock_id: stock.id,
      alert_type: "order_blocked",
      message: `${stock.item_name}: ${stock.current_qty} ${stock.unit} in stock (${stock.weeks_remaining} weeks supply). Enough until budget renewal on ${budgetRenewalDate.toLocaleDateString("en-GB")}.`,
      suggested_action: `No new orders needed. Budget renewal in ${weeksUntilRenewal} weeks. Current stock is sufficient.`,
    };
  }

  if (stock.current_qty <= stock.reorder_threshold) {
    return {
      stock_id: stock.id,
      alert_type: "reorder_suggested",
      message: `${stock.item_name}: Low stock — ${stock.current_qty} ${stock.unit} remaining (${stock.weeks_remaining} weeks). Below reorder threshold of ${stock.reorder_threshold}.`,
      suggested_action: `Order via Deal Finder to find best price. Need enough for ${weeksUntilRenewal - stock.weeks_remaining} additional weeks.`,
      deal_finder_url: `/toolbox/deal-finder`,
    };
  }

  return null;
}

// =====================================================
// HELPERS
// =====================================================

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

function estimateDiscretionarySaving(plan: BudgetPlan): number {
  const discretionary: CFRCode[] = ["E19", "E22", "E24"];
  return plan.lines
    .filter((l) => discretionary.includes(l.cfr_code))
    .reduce((sum, l) => sum + l.available, 0);
}

function estimateSupplySaving(plan: BudgetPlan): number {
  const supplyCodes: CFRCode[] = ["E02", "E26"];
  return (
    plan.lines
      .filter((l) => supplyCodes.includes(l.cfr_code))
      .reduce((sum, l) => sum + l.available, 0) * 0.3
  );
}

function cfrToModule(code: CFRCode): string {
  if (
    ["E01", "E02", "E03", "E05", "E06", "E07", "E08", "E09", "E26"].includes(
      code,
    )
  )
    return "hr";
  if (["E04", "E12", "E13", "E14", "E15", "E16", "E17", "E18"].includes(code))
    return "estates";
  if (
    [
      "E19",
      "E20A",
      "E20B",
      "E20C",
      "E20D",
      "E20E",
      "E20F",
      "E20G",
      "E21",
    ].includes(code)
  )
    return "teaching";
  if (["E25"].includes(code)) return "catering";
  return "finance";
}

function simplifyTitle(title: string): string {
  return title
    .replace(/^(Emergency|ICFP flag|Overspend alert): /, "")
    .replace(/at \d+\.\d+%.*$/, "")
    .trim();
}

function simplifySituation(situation: string): string {
  return situation.split("\n")[0];
}
