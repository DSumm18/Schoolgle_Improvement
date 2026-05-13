import { getSeasonalProfile } from "./seasonal-profiles";

export interface FinanceAssumptionLine {
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
  cost_centre?: string;
  monthly_profile: unknown[];
}

export interface FinanceAssumptionCard {
  cfr_code: string;
  title: string;
  profile_name: string;
  annual_budget: number;
  rationale: string;
  source_note: string;
}

const PRIORITY_BY_CODE: Record<string, number> = {
  E16: 1,
  E15: 2,
  E12: 3,
  E14: 4,
  E02: 5,
  E26: 6,
  E01: 7,
  E03: 8,
};

const TITLE_BY_CODE: Record<string, string> = {
  E16: "Energy",
  E15: "Water",
  E12: "Maintenance",
  E14: "Cleaning",
  E02: "Supply cover",
  E26: "Agency cover",
  E01: "Teaching staff",
  E03: "Support staff",
};

const SOURCE_BY_CODE: Record<string, string> = {
  E16: "DfE estate energy guidance: profile heating and technology costs by usage, occupancy and controls.",
  E15: "DfE estate guidance: monitor usage and separate variable use from standing charges.",
  E12: "School estate planning: profile major works into holiday periods where disruption is lowest.",
  E14: "School operations pattern: daily cleaning follows occupancy, deep cleans cluster in holidays.",
  E02: "ICFP/SFVS: monitor staffing assumptions and cover costs against forecast, not flat twelfths.",
  E26: "ICFP/SFVS: agency cover should be tracked as a volatile staffing pressure.",
  E01: "ICFP: staffing affordability is the central school resource management assumption.",
  E03: "ICFP: support staffing should be linked to curriculum and pupil needs.",
};

function shortRationale(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177).trim()}...`;
}

export function buildFinanceAssumptionCards(
  lines: FinanceAssumptionLine[],
  limit = 5,
): FinanceAssumptionCard[] {
  const candidates = lines
    .filter((line) => line.budget > 0)
    .map((line) => {
      const profile = getSeasonalProfile(
        line.cfr_code,
        line.cost_centre || line.description,
      );

      return {
        cfr_code: line.cfr_code,
        title: TITLE_BY_CODE[line.cfr_code] || line.group || line.description,
        profile_name: profile.name,
        annual_budget: line.budget,
        rationale: shortRationale(profile.rationale),
        source_note:
          SOURCE_BY_CODE[line.cfr_code] ||
          "CFR/SFVS monitoring: compare actuals to a profiled forecast rather than a flat monthly budget.",
        priority: PRIORITY_BY_CODE[line.cfr_code] || 50,
      };
    })
    .sort((a, b) => a.priority - b.priority || b.annual_budget - a.annual_budget);

  const seen = new Set<string>();
  const cards: FinanceAssumptionCard[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.cfr_code}:${candidate.profile_name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push({
      cfr_code: candidate.cfr_code,
      title: candidate.title,
      profile_name: candidate.profile_name,
      annual_budget: candidate.annual_budget,
      rationale: candidate.rationale,
      source_note: candidate.source_note,
    });
    if (cards.length >= limit) break;
  }

  return cards;
}
