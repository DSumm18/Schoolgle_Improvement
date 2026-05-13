export type StrategyPriorityBand = "must" | "should" | "could" | "wont";

export interface EstateStrategySummaryItem {
  title: string;
  year?: number | null;
  estimated_cost?: number | null;
  risk_score?: number | null;
  priority_band?: StrategyPriorityBand | string | null;
  is_statutory?: boolean | null;
  statutory?: boolean | null;
  consequence_if_unfunded?: string | null;
}

export interface EstateStrategySummaryInput {
  planTitle: string;
  startYear: string;
  endYear: string;
  items: EstateStrategySummaryItem[];
}

export interface EstateStrategyYearSummary {
  year: number;
  itemCount: number;
  totalEstimatedCost: number;
  mustFundCount: number;
}

export interface EstateStrategySummary {
  planTitle: string;
  planWindow: string;
  totalEstimatedCost: number;
  itemCount: number;
  highRiskCount: number;
  statutoryCount: number;
  mustFundTotal: number;
  yearSummaries: EstateStrategyYearSummary[];
  unfundedConsequences: string[];
  reportLines: string[];
}

export function buildEstateStrategySummary(
  input: EstateStrategySummaryInput,
): EstateStrategySummary {
  const years = [1, 2, 3];
  const yearSummaries = years.map((year) => {
    const yearItems = input.items.filter((item) => (item.year ?? 1) === year);
    return {
      year,
      itemCount: yearItems.length,
      totalEstimatedCost: sumCost(yearItems),
      mustFundCount: yearItems.filter(isMustFund).length,
    };
  });

  const totalEstimatedCost = sumCost(input.items);
  const mustFundItems = input.items.filter(isMustFund);
  const highRiskCount = input.items.filter(
    (item) => (item.risk_score ?? 0) >= 5 || item.priority_band === "must",
  ).length;
  const statutoryCount = input.items.filter(
    (item) => Boolean(item.is_statutory) || Boolean(item.statutory),
  ).length;
  const unfundedConsequences = input.items
    .filter((item) => item.consequence_if_unfunded)
    .map((item) => `${item.title}: ${item.consequence_if_unfunded}`);

  const planWindow = `${input.startYear} to ${input.endYear}`;

  return {
    planTitle: input.planTitle,
    planWindow,
    totalEstimatedCost,
    itemCount: input.items.length,
    highRiskCount,
    statutoryCount,
    mustFundTotal: sumCost(mustFundItems),
    yearSummaries,
    unfundedConsequences,
    reportLines: [
      `${input.planTitle} covers ${planWindow} with ${input.items.length} planned estate item${input.items.length === 1 ? "" : "s"} totalling ${formatGBP(totalEstimatedCost)}.`,
      `${mustFundItems.length} item${mustFundItems.length === 1 ? "" : "s"} are currently must-fund or statutory, totalling ${formatGBP(sumCost(mustFundItems))}.`,
      `${highRiskCount} item${highRiskCount === 1 ? "" : "s"} carry elevated risk and should be reviewed by finance/SLT before budget lock.`,
    ],
  };
}

function isMustFund(item: EstateStrategySummaryItem): boolean {
  return (
    item.priority_band === "must" ||
    Boolean(item.is_statutory) ||
    Boolean(item.statutory)
  );
}

function sumCost(items: EstateStrategySummaryItem[]): number {
  return items.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0);
}

function formatGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}
