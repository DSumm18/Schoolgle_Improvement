export type GovernorReportConfidence =
  | "confirmed"
  | "highly_likely"
  | "likely"
  | "uncertain";

export interface GovernorReportLine {
  cfr_code: string;
  description: string;
  group: string;
  budget: number;
  actual: number;
  committed: number;
  variance: number;
  variance_percent: number;
  rag: "red" | "amber" | "green";
}

export interface GovernorReportMonitor {
  financial_year: string;
  school_name: string;
  pupil_count: number;
  as_at_date: string;
  months_elapsed: number;
  months_total: number;
  total_income: number;
  total_budget: number;
  total_spend: number;
  total_committed: number;
  remaining: number;
  projected_surplus_deficit: number;
  staffing_percent_of_income: number;
  staffing_target: number;
  lines: GovernorReportLine[];
}

export interface GovernorReportExpectedIncome {
  id: string;
  description: string;
  amount: number;
  confidence: GovernorReportConfidence;
  expected_date: string;
  source: string;
  cfr_code?: string;
  offset_cfr_code?: string;
  status?: string;
}

export interface GovernorReportSection {
  id: "overview" | "income" | "expenditure" | "true-position" | "actions";
  title: string;
  summary: string;
  bullets: string[];
}

export interface GovernorReportHoldingItem {
  id: string;
  description: string;
  amount: number;
  confidence: GovernorReportConfidence;
  expected_date: string;
  source: string;
  narrative: string;
}

export interface GovernorFinanceReport {
  title: string;
  subtitle: string;
  executiveSummary: string;
  reportingPoint: string;
  truePosition: number;
  cautiousPosition: number;
  keyVariances: GovernorReportLine[];
  holdingItems: GovernorReportHoldingItem[];
  sections: GovernorReportSection[];
  recommendedActions: string[];
}

interface BuildGovernorFinanceReportInput {
  monitor: GovernorReportMonitor;
  expectedIncome: GovernorReportExpectedIncome[];
  schoolName?: string;
}

const CONFIDENCE_WEIGHT: Record<GovernorReportConfidence, number> = {
  confirmed: 1,
  highly_likely: 0.85,
  likely: 0.6,
  uncertain: 0.25,
};

function money(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}£${Math.abs(Math.round(value)).toLocaleString("en-GB")}`;
}

function plainGroupName(group: string): string {
  return group || "Other";
}

function confidenceLabel(confidence: GovernorReportConfidence): string {
  return confidence.replace("_", " ");
}

function byAbsoluteVariance(lines: GovernorReportLine[]): GovernorReportLine[] {
  return [...lines]
    .filter((line) => line.group !== "Income")
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
}

export function buildGovernorFinanceReport({
  monitor,
  expectedIncome,
  schoolName,
}: BuildGovernorFinanceReportInput): GovernorFinanceReport {
  const displayName = schoolName || monitor.school_name;
  const truePosition =
    monitor.remaining +
    expectedIncome.reduce((sum, item) => sum + item.amount, 0);
  const cautiousPosition =
    monitor.remaining +
    expectedIncome.reduce(
      (sum, item) => sum + item.amount * CONFIDENCE_WEIGHT[item.confidence],
      0,
    );
  const projectedLabel =
    monitor.projected_surplus_deficit >= 0 ? "projected surplus" : "projected deficit";
  const keyVariances = byAbsoluteVariance(monitor.lines).slice(0, 5);
  const redGroups = Array.from(
    new Set(
      monitor.lines
        .filter((line) => line.rag === "red" && line.group !== "Income")
        .map((line) => plainGroupName(line.group)),
    ),
  );

  const holdingItems = expectedIncome.map((item) => ({
    ...item,
    narrative: `${item.description} is expected through ${item.cfr_code || "an income code"}${
      item.offset_cfr_code ? ` and offsets ${item.offset_cfr_code}` : ""
    }. Confidence is ${confidenceLabel(item.confidence)}; retain as a holding item until the LA/FMS posting is matched.`,
  }));

  const topVariance = keyVariances[0];
  const recommendedActions = [
    ...(redGroups.length > 0
      ? [
          `${redGroups.join(", ")} needs an immediate check: hold discretionary spend elsewhere until invoices, commitments and expected credits are confirmed.`,
        ]
      : ["No red budget sections require immediate corrective action; continue monthly checks against the locked profile."]),
    monitor.staffing_percent_of_income > monitor.staffing_target
      ? `Staffing is ${monitor.staffing_percent_of_income.toFixed(1)}% of income against a ${monitor.staffing_target}% target; review secondments, supply cover and vacancy assumptions.`
      : `Staffing is within the current target; keep expected reimbursements linked to the relevant staffing codes.`,
    holdingItems.length > 0
      ? `Track ${holdingItems.length} holding income item${holdingItems.length === 1 ? "" : "s"} until each is posted and matched.`
      : "Add holding income and notional invoice lines where timing delays could distort the ledger position.",
  ];

  return {
    title: `${displayName} Governor Finance Report`,
    subtitle: `${monitor.financial_year} budget monitoring report`,
    executiveSummary: `${displayName} is reporting ${money(monitor.remaining)} remaining on the FMS position and a ${projectedLabel} of ${money(monitor.projected_surplus_deficit)}. After expected income and holding items, the current true position is ${money(truePosition)}.`,
    reportingPoint: `Month ${monitor.months_elapsed} of ${monitor.months_total}, as at ${new Date(
      monitor.as_at_date,
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    truePosition,
    cautiousPosition,
    keyVariances,
    holdingItems,
    sections: [
      {
        id: "overview",
        title: "Overview",
        summary: `The report compares the school-owned budget against actual transactions, commitments and expected items at month ${monitor.months_elapsed}.`,
        bullets: [
          `Annual expenditure budget: ${money(monitor.total_budget)}.`,
          `Spend posted to date: ${money(monitor.total_spend)} plus ${money(monitor.total_committed)} committed.`,
          `Projected year-end movement: ${money(monitor.projected_surplus_deficit)}.`,
        ],
      },
      {
        id: "income",
        title: "Income",
        summary: `Income is monitored separately from expenditure, then linked back to offset lines where it explains a staffing or operational pressure.`,
        bullets: [
          `Annual income budget: ${money(monitor.total_income)}.`,
          `Expected income not yet posted: ${money(truePosition - monitor.remaining)}.`,
          holdingItems[0]?.narrative ||
            "No expected income has been added yet; schools should record LA recharges, grants and claims as soon as they are known.",
        ],
      },
      {
        id: "expenditure",
        title: "Expenditure",
        summary: topVariance
          ? `${topVariance.group} currently contains the largest variance, led by ${topVariance.cfr_code} ${topVariance.description}.`
          : "No material expenditure variance has been identified.",
        bullets: keyVariances.slice(0, 3).map(
          (line) =>
            `${line.cfr_code} ${line.description}: ${money(line.variance)} variance (${line.variance_percent.toFixed(1)}%).`,
        ),
      },
      {
        id: "true-position",
        title: "Overall Position",
        summary: `The true position combines the ledger position with confirmed and likely holding items so governors can see the budget risk before late LA postings arrive.`,
        bullets: [
          `FMS remaining position: ${money(monitor.remaining)}.`,
          `True position including all holding income: ${money(truePosition)}.`,
          `Cautious position using confidence weighting: ${money(cautiousPosition)}.`,
        ],
      },
      {
        id: "actions",
        title: "Actions and Assurance",
        summary: "The following actions keep the budget balanced and maintain a clean audit trail.",
        bullets: recommendedActions,
      },
    ],
    recommendedActions,
  };
}
