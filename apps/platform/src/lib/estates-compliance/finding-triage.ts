export type EstateFindingClassification =
  | "compliance_defect"
  | "operational_repair"
  | "lifecycle_concern"
  | "capital_pressure"
  | "watchlist";

export type EstateFindingRoute =
  | "create_task"
  | "create_risk"
  | "add_to_strategy"
  | "add_to_watchlist"
  | "update_asset_only";

export type EstateFindingUrgency =
  | "emergency"
  | "urgent"
  | "routine"
  | "monitor";

export interface EstateFindingTriageInput {
  assetName?: string | null;
  title?: string | null;
  description?: string | null;
  findings?: string | null;
  remedialActions?: string[] | null;
  estimatedCost?: number | null;
  result?: string | null;
  urgency?: string | null;
  priority?: string | null;
  conditionGrade?: string | null;
  complianceDomain?: string | null;
  isStatutory?: boolean | null;
}

export interface EstateFindingTriage {
  classification: EstateFindingClassification;
  recommendedRoutes: EstateFindingRoute[];
  riskScore: 1 | 2 | 3 | 4 | 5;
  urgency: EstateFindingUrgency;
  strategyYear: 1 | 2 | 3 | null;
  confidence: number;
  rationale: string[];
  reportLine: string;
}

export interface EstateFindingTriageSummary {
  tasks: number;
  risks: number;
  strategyItems: number;
  watchlistItems: number;
  assetOnlyUpdates: number;
  highestRiskScore: 1 | 2 | 3 | 4 | 5;
  byClassification: Record<EstateFindingClassification, number>;
}

const HIGH_COST_THRESHOLD = 15_000;

const DEFECT_TERMS = [
  "fail",
  "failed",
  "unsafe",
  "immediate closure",
  "closure or repair",
  "critical fall height not met",
  "risk to h&s",
  "risk to health",
  "carbon monoxide",
  "co readings",
  "exposed wiring",
  "blocked fire",
  "no hot water",
  "legionella",
  "asbestos damage",
  "emergency lighting test",
];

const CAPITAL_TERMS = [
  "replacement",
  "replace",
  "full overlay",
  "strip-and-recover",
  "life-expired",
  "end of life",
  "major repair",
  "major works",
  "corroding",
  "failed seals",
  "distribution board",
  "boiler",
  "roof",
  "windows",
];

const WATCHLIST_TERMS = [
  "serviceable",
  "monitor",
  "minor",
  "within 12 months",
  "2-3 more years",
  "2 to 3 more years",
  "3 years",
  "5 years",
];

export function triageEstateFinding(
  input: EstateFindingTriageInput,
): EstateFindingTriage {
  const text = normaliseText(input);
  const estimatedCost = input.estimatedCost ?? 0;
  const result = input.result?.toLowerCase() ?? "";
  const priority = input.priority?.toLowerCase() ?? "";
  const conditionGrade = input.conditionGrade?.toUpperCase() ?? "";
  const statedUrgency = input.urgency?.toLowerCase() ?? "";

  const hasDefectTerm = includesAny(text, DEFECT_TERMS);
  const hasCapitalTerm = includesAny(text, CAPITAL_TERMS);
  const hasWatchlistTerm = includesAny(text, WATCHLIST_TERMS);
  const isHighCost = estimatedCost >= HIGH_COST_THRESHOLD;
  const isFail = result === "fail" || text.includes(" failed ");
  const isEmergency =
    statedUrgency === "emergency" ||
    priority === "urgent" ||
    text.includes("immediate") ||
    text.includes("critical");

  if (isFail || hasDefectTerm || (conditionGrade === "D" && isEmergency)) {
    return buildTriage({
      classification: "compliance_defect",
      recommendedRoutes: ["create_task", "create_risk"],
      riskScore: 5,
      urgency: isEmergency ? "emergency" : "urgent",
      strategyYear: null,
      confidence: 0.9,
      rationale: [
        "Immediate safety, statutory, or failed-inspection language was identified.",
        "This should become operational work now, with a linked risk where impact is material.",
      ],
      input,
    });
  }

  if (hasCapitalTerm && (isHighCost || conditionGrade === "C" || conditionGrade === "D")) {
    const riskScore: 3 | 4 = isHighCost || conditionGrade === "D" ? 4 : 3;

    return buildTriage({
      classification: "capital_pressure",
      recommendedRoutes:
        riskScore >= 4 ? ["add_to_strategy", "create_risk"] : ["add_to_strategy"],
      riskScore,
      urgency: priority === "urgent" ? "urgent" : "routine",
      strategyYear: inferStrategyYear(text, priority, conditionGrade),
      confidence: 0.86,
      rationale: [
        "The finding points to lifecycle replacement or major capital spend.",
        "It should inform the estate strategy rather than automatically creating day-to-day noise.",
      ],
      input,
    });
  }

  if (priority === "essential" || conditionGrade === "C") {
    return buildTriage({
      classification: "operational_repair",
      recommendedRoutes: ["create_task"],
      riskScore: 3,
      urgency: "routine",
      strategyYear: null,
      confidence: 0.8,
      rationale: [
        "The issue needs planned operational repair, but it is not presenting as capital replacement.",
      ],
      input,
    });
  }

  if (hasWatchlistTerm || priority === "desirable" || conditionGrade === "B") {
    return buildTriage({
      classification: "watchlist",
      recommendedRoutes: ["add_to_watchlist"],
      riskScore: hasWatchlistTerm ? 2 : 1,
      urgency: "monitor",
      strategyYear: null,
      confidence: 0.78,
      rationale: [
        "The finding is serviceable, minor, or time-bounded for monitoring.",
      ],
      input,
    });
  }

  return buildTriage({
    classification: "lifecycle_concern",
    recommendedRoutes: ["update_asset_only"],
    riskScore: 2,
    urgency: "monitor",
    strategyYear: null,
    confidence: 0.65,
    rationale: [
      "The finding should be recorded against the asset, but does not yet justify task or strategy escalation.",
    ],
    input,
  });
}

export function summarizeEstateFindingTriage(
  triageItems: EstateFindingTriage[],
): EstateFindingTriageSummary {
  const byClassification: Record<EstateFindingClassification, number> = {
    compliance_defect: 0,
    operational_repair: 0,
    lifecycle_concern: 0,
    capital_pressure: 0,
    watchlist: 0,
  };

  let highestRiskScore: 1 | 2 | 3 | 4 | 5 = 1;

  for (const triage of triageItems) {
    byClassification[triage.classification]++;
    if (triage.riskScore > highestRiskScore) {
      highestRiskScore = triage.riskScore;
    }
  }

  return {
    tasks: countRoute(triageItems, "create_task"),
    risks: countRoute(triageItems, "create_risk"),
    strategyItems: countRoute(triageItems, "add_to_strategy"),
    watchlistItems: countRoute(triageItems, "add_to_watchlist"),
    assetOnlyUpdates: countRoute(triageItems, "update_asset_only"),
    highestRiskScore,
    byClassification,
  };
}

function buildTriage({
  classification,
  recommendedRoutes,
  riskScore,
  urgency,
  strategyYear,
  confidence,
  rationale,
  input,
}: Omit<EstateFindingTriage, "reportLine"> & {
  input: EstateFindingTriageInput;
}): EstateFindingTriage {
  const assetLabel = input.assetName || input.title || "Estate finding";
  const routeLabel = recommendedRoutes
    .map((route) => route.replace(/_/g, " "))
    .join(", ");

  return {
    classification,
    recommendedRoutes,
    riskScore,
    urgency,
    strategyYear,
    confidence,
    rationale,
    reportLine: `${assetLabel}: ${classification.replace(/_/g, " ")}; route to ${routeLabel}; risk ${riskScore}/5.`,
  };
}

function normaliseText(input: EstateFindingTriageInput): string {
  return [
    input.assetName,
    input.title,
    input.description,
    input.findings,
    ...(input.remedialActions ?? []),
    input.complianceDomain,
    input.result,
    input.urgency,
    input.priority,
    input.conditionGrade,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function inferStrategyYear(
  text: string,
  priority: string,
  conditionGrade: string,
): 1 | 2 | 3 {
  if (
    text.includes("within 3 years") ||
    text.includes("3 years") ||
    text.includes("2-3")
  ) {
    return 3;
  }

  if (
    priority === "urgent" ||
    priority === "essential" ||
    conditionGrade === "D" ||
    text.includes("within 12 months") ||
    text.includes("within 1 year")
  ) {
    return 1;
  }

  if (
    conditionGrade === "C" &&
    (text.includes("within 2 years") || text.includes("2 years"))
  ) {
    return 2;
  }

  return 3;
}

function countRoute(
  triageItems: EstateFindingTriage[],
  route: EstateFindingRoute,
): number {
  return triageItems.filter((triage) =>
    triage.recommendedRoutes.includes(route),
  ).length;
}
