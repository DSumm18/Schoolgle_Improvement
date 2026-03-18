/**
 * Risk Scoring Engine
 *
 * Pure logic module for calculating residual risk scores, determining risk bands,
 * checking mitigation effectiveness, and prioritising competing demands.
 * No database calls — API routes supply data and persist results.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskCategory =
  | "safeguarding"
  | "h_and_s"
  | "financial"
  | "reputational"
  | "legal"
  | "operational"
  | "educational"
  | "staffing"
  | "cyber"
  | "governance"
  | "strategic"
  | "equality";

export type RiskStatus =
  | "identified"
  | "assessing"
  | "treating"
  | "tolerated"
  | "accepted"
  | "closed";

export type RiskTier = "strategic" | "operational" | "school";

export type MitigationEffectiveness =
  | "effective"
  | "partially_effective"
  | "ineffective"
  | "not_tested";

export type DirectionOfTravel = "improving" | "stable" | "worsening";

export type RiskBand = "low" | "medium" | "high" | "critical";

export type RiskAppetiteStance = "averse" | "cautious" | "open" | "seeking";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LIKELIHOOD_SCALE = [
  {
    score: 1,
    label: "Rare",
    definition: "Less than 5% chance; may occur in exceptional circumstances",
  },
  {
    score: 2,
    label: "Unlikely",
    definition: "5-25% chance; could occur but not expected",
  },
  {
    score: 3,
    label: "Possible",
    definition: "25-50% chance; might occur at some time",
  },
  {
    score: 4,
    label: "Likely",
    definition: "50-75% chance; will probably occur",
  },
  {
    score: 5,
    label: "Almost Certain",
    definition: ">75% chance; expected to occur",
  },
] as const;

export const IMPACT_SCALE = [
  {
    score: 1,
    label: "Negligible",
    definition: "Minimal impact on operations, finances or reputation",
  },
  {
    score: 2,
    label: "Minor",
    definition: "Some disruption; manageable within normal processes",
  },
  {
    score: 3,
    label: "Moderate",
    definition: "Significant disruption; requires management attention",
  },
  {
    score: 4,
    label: "Major",
    definition: "Severe impact on operations, finances, or reputation",
  },
  {
    score: 5,
    label: "Catastrophic",
    definition:
      "Existential threat; potential trust failure, serious injury/death, regulatory intervention",
  },
] as const;

export const DEFAULT_RISK_APPETITES: Record<
  RiskCategory,
  { threshold: number; stance: RiskAppetiteStance }
> = {
  safeguarding: { threshold: 4, stance: "averse" },
  h_and_s: { threshold: 8, stance: "averse" },
  legal: { threshold: 8, stance: "averse" },
  governance: { threshold: 8, stance: "averse" },
  financial: { threshold: 12, stance: "cautious" },
  reputational: { threshold: 12, stance: "cautious" },
  staffing: { threshold: 12, stance: "cautious" },
  cyber: { threshold: 10, stance: "cautious" },
  operational: { threshold: 12, stance: "cautious" },
  equality: { threshold: 10, stance: "cautious" },
  educational: { threshold: 15, stance: "open" },
  strategic: { threshold: 15, stance: "open" },
};

const CATEGORY_CODES: Record<RiskCategory, string> = {
  safeguarding: "SAF",
  h_and_s: "HAS",
  financial: "FIN",
  reputational: "REP",
  legal: "LEG",
  operational: "OPS",
  educational: "EDU",
  staffing: "STF",
  cyber: "CYB",
  governance: "GOV",
  strategic: "STR",
  equality: "EQU",
};

/** Overdue thresholds in milliseconds, keyed by frequency label. */
const FREQUENCY_OVERDUE_MS: Record<string, number> = {
  daily: 36 * 60 * 60 * 1000,
  weekly: 9 * 24 * 60 * 60 * 1000,
  monthly: 35 * 24 * 60 * 60 * 1000,
  quarterly: 100 * 24 * 60 * 60 * 1000,
  termly: 140 * 24 * 60 * 60 * 1000,
  annual: 380 * 24 * 60 * 60 * 1000,
};

const DOMAIN_TO_CATEGORIES: Record<string, RiskCategory[]> = {
  estates: ["h_and_s", "operational"],
  compliance: ["legal", "governance"],
  safeguarding: ["safeguarding"],
  hr: ["staffing"],
  finance: ["financial"],
  governance: ["governance"],
  cyber: ["cyber"],
  it: ["cyber", "operational"],
  teaching: ["educational"],
  send: ["educational", "equality"],
  strategic: ["strategic"],
};

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface Risk {
  id: string;
  risk_ref: string;
  title: string;
  description?: string;
  tier: RiskTier;
  status: RiskStatus;
  risk_categories: RiskCategory[];
  source_module?: string;
  inherent_likelihood: number;
  inherent_impact: number;
  impact_by_category: Record<string, number>;
  system_residual_likelihood: number;
  system_residual_impact: number;
  override_residual_likelihood?: number;
  override_residual_impact?: number;
  override_expires_at?: string;
  target_score?: number;
  risk_appetite_threshold?: number;
}

export interface Mitigation {
  id: string;
  risk_id: string;
  title: string;
  mitigation_type: "preventive" | "detective" | "corrective";
  effectiveness: MitigationEffectiveness;
  is_operating: boolean;
  last_operated_at?: string;
  frequency_required?: string;
  overdue: boolean;
  likelihood_reduction: number;
  impact_reduction: number;
}

export interface RiskScoreResult {
  residual_likelihood: number;
  residual_impact: number;
  residual_score: number;
  effective_score: number;
  risk_band: RiskBand;
  above_appetite: boolean;
  direction_of_travel: DirectionOfTravel;
  control_effectiveness_pct: number;
  operating_mitigations: number;
  total_mitigations: number;
  flags: string[];
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Map a raw risk score (1-25) to a named band.
 *
 * | Range | Band     |
 * |-------|----------|
 * | 1-4   | low      |
 * | 5-9   | medium   |
 * | 10-16 | high     |
 * | 17-25 | critical |
 */
export function getRiskBand(score: number): RiskBand {
  if (score >= 17) return "critical";
  if (score >= 10) return "high";
  if (score >= 5) return "medium";
  return "low";
}

/**
 * Return a Tailwind color token for the given risk band.
 */
export function getRiskBandColor(band: RiskBand): string {
  switch (band) {
    case "low":
      return "emerald";
    case "medium":
      return "yellow";
    case "high":
      return "orange";
    case "critical":
      return "rose";
  }
}

/** Clamp a value between min and max inclusive. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate the residual risk score for a risk given its current mitigations.
 *
 * The algorithm:
 * 1. Start from the inherent likelihood and impact.
 * 2. Apply mitigation reductions based on operating status and effectiveness.
 *    - `effective` + operating → full reduction
 *    - `partially_effective` + operating → 50 % reduction
 *    - everything else → 0 reduction
 * 3. Clamp residual values to [1, 5].
 * 4. Determine effective score (override if present and not expired, else system).
 * 5. Derive risk band, appetite breach, control effectiveness and flags.
 */
export function calculateResidualScore(
  risk: Risk,
  mitigations: Mitigation[],
  previousScore?: number,
): RiskScoreResult {
  // --- Mitigation reductions ---
  let likelihoodReduction = 0;
  let impactReduction = 0;
  let operatingAndEffective = 0;

  for (const m of mitigations) {
    if (!m.is_operating) continue;

    if (m.effectiveness === "effective") {
      likelihoodReduction += m.likelihood_reduction;
      impactReduction += m.impact_reduction;
      operatingAndEffective++;
    } else if (m.effectiveness === "partially_effective") {
      likelihoodReduction += m.likelihood_reduction * 0.5;
      impactReduction += m.impact_reduction * 0.5;
      operatingAndEffective += 0.5;
    }
    // 'ineffective' and 'not_tested' contribute nothing
  }

  const residualLikelihood = clamp(
    Math.round((risk.inherent_likelihood - likelihoodReduction) * 100) / 100,
    1,
    5,
  );
  const residualImpact = clamp(
    Math.round((risk.inherent_impact - impactReduction) * 100) / 100,
    1,
    5,
  );

  const residualScore = Math.round(residualLikelihood * residualImpact);

  // --- Override handling ---
  let effectiveScore = residualScore;

  const overrideActive =
    risk.override_residual_likelihood != null &&
    risk.override_residual_impact != null &&
    (!risk.override_expires_at ||
      new Date(risk.override_expires_at) > new Date());

  if (overrideActive) {
    effectiveScore =
      (risk.override_residual_likelihood ?? 0) *
      (risk.override_residual_impact ?? 0);
  }

  // --- Derived values ---
  const riskBand = getRiskBand(effectiveScore);

  const appetiteThreshold =
    risk.risk_appetite_threshold ??
    getLowestAppetiteThreshold(risk.risk_categories);

  const aboveAppetite = effectiveScore > appetiteThreshold;

  const totalMitigations = mitigations.length;
  const operatingMitigations = mitigations.filter((m) => m.is_operating).length;
  const controlEffectivenessPct =
    totalMitigations > 0
      ? Math.round((operatingAndEffective / totalMitigations) * 100)
      : 0;

  const directionOfTravel =
    previousScore != null
      ? calculateDirectionOfTravel(effectiveScore, previousScore)
      : ("stable" as DirectionOfTravel);

  // --- Flags ---
  const flags: string[] = [];

  const overdueCount = mitigations.filter((m) => m.overdue).length;
  if (overdueCount >= 3) flags.push("3_controls_overdue");

  if (totalMitigations > 0 && controlEffectivenessPct < 25) {
    flags.push("systemic_control_failure");
  }

  if (aboveAppetite) flags.push("above_appetite");

  if (risk.override_expires_at && overrideActive) {
    const daysUntilExpiry =
      (new Date(risk.override_expires_at).getTime() - Date.now()) /
      (24 * 60 * 60 * 1000);
    if (daysUntilExpiry <= 14) flags.push("override_expiring_soon");
  }

  if (risk.target_score != null && effectiveScore > risk.target_score) {
    flags.push("above_target");
  }

  if (riskBand === "critical" && risk.status === "identified") {
    flags.push("critical_unassessed");
  }

  if (risk.risk_categories.includes("safeguarding") && effectiveScore >= 10) {
    flags.push("safeguarding_high");
  }

  return {
    residual_likelihood: residualLikelihood,
    residual_impact: residualImpact,
    residual_score: residualScore,
    effective_score: effectiveScore,
    risk_band: riskBand,
    above_appetite: aboveAppetite,
    direction_of_travel: directionOfTravel,
    control_effectiveness_pct: controlEffectivenessPct,
    operating_mitigations: operatingMitigations,
    total_mitigations: totalMitigations,
    flags,
  };
}

/**
 * Check whether a mitigation is still operating and current based on its
 * `last_operated_at` timestamp and `frequency_required` schedule.
 *
 * If the mitigation is overdue it is automatically marked as not operating
 * and ineffective.
 */
export function checkMitigationStatus(mitigation: Mitigation): {
  is_operating: boolean;
  overdue: boolean;
  effectiveness: MitigationEffectiveness;
} {
  const { frequency_required, last_operated_at } = mitigation;

  // If no schedule defined, return current state as-is
  if (!frequency_required || !last_operated_at) {
    return {
      is_operating: mitigation.is_operating,
      overdue: mitigation.overdue,
      effectiveness: mitigation.effectiveness,
    };
  }

  const thresholdMs = FREQUENCY_OVERDUE_MS[frequency_required.toLowerCase()];
  if (thresholdMs == null) {
    // Unknown frequency — leave unchanged
    return {
      is_operating: mitigation.is_operating,
      overdue: mitigation.overdue,
      effectiveness: mitigation.effectiveness,
    };
  }

  const elapsed = Date.now() - new Date(last_operated_at).getTime();
  const isOverdue = elapsed > thresholdMs;

  if (isOverdue) {
    return { is_operating: false, overdue: true, effectiveness: "ineffective" };
  }

  return {
    is_operating: mitigation.is_operating,
    overdue: false,
    effectiveness: mitigation.effectiveness,
  };
}

/**
 * Determine direction of travel by comparing current and previous scores.
 */
export function calculateDirectionOfTravel(
  currentScore: number,
  previousScore: number,
): DirectionOfTravel {
  if (currentScore < previousScore) return "improving";
  if (currentScore > previousScore) return "worsening";
  return "stable";
}

/**
 * Determine whether a school-level risk should be escalated to the trust
 * risk register.
 *
 * Escalation criteria: the risk is at school tier, above appetite, and has
 * not already been accepted or closed.
 */
export function shouldEscalateToTrust(
  risk: Risk,
  result: RiskScoreResult,
): boolean {
  return (
    risk.tier === "school" &&
    result.above_appetite &&
    risk.status !== "accepted" &&
    risk.status !== "closed"
  );
}

/**
 * Generate a risk reference code in the format `CAT-NNN-S` where CAT is
 * a 3-letter category code, NNN is a zero-padded sequence, and S is the
 * school code.
 *
 * @example generateRiskRef('safeguarding', 'A', 1) → 'SAF-001-A'
 */
export function generateRiskRef(
  category: RiskCategory,
  schoolCode: string,
  sequence: number,
): string {
  const code = CATEGORY_CODES[category] ?? "UNK";
  const seq = String(sequence).padStart(3, "0");
  return `${code}-${seq}-${schoolCode}`;
}

/**
 * Auto-generate risk parameters from a task's properties.
 *
 * This is how overdue statutory tasks, safeguarding-related items, and
 * module tasks automatically populate draft risk entries.
 */
export function assessRiskFromTask(task: {
  domain?: string;
  is_statutory?: boolean;
  priority?: string;
  overdue_days?: number;
  has_safeguarding_impact?: boolean;
  title?: string;
  /** Severity of the underlying statutory check (from statutory-checks or findings-database) */
  check_severity?: "low" | "medium" | "high" | "critical";
}): {
  inherent_likelihood: number;
  inherent_impact: number;
  risk_categories: RiskCategory[];
  suggested_title: string;
} {
  let likelihood = 2;
  let impact = 2;
  const categories: Set<RiskCategory> = new Set();

  // Map domain to risk categories
  if (task.domain) {
    const mapped = DOMAIN_TO_CATEGORIES[task.domain.toLowerCase()];
    if (mapped) mapped.forEach((c) => categories.add(c));
  }

  // Critical statutory checks (e.g. fire risk assessment) must have minimum
  // high scores even before considering overdue escalation.
  if (task.check_severity === "critical") {
    likelihood = Math.max(likelihood, 4);
    impact = Math.max(impact, 4);
  } else if (task.check_severity === "high") {
    likelihood = Math.max(likelihood, 3);
    impact = Math.max(impact, 3);
  }

  // Safeguarding always high impact
  if (task.has_safeguarding_impact) {
    categories.add("safeguarding");
    impact = Math.max(impact, 4);
  }

  // Statutory + overdue → high likelihood
  if (task.is_statutory && (task.overdue_days ?? 0) > 14) {
    likelihood = Math.max(likelihood, 4);
    impact = Math.max(impact, domainImpact(task.domain));
    // Critical checks that are overdue >14 days → almost certain + catastrophic
    if (task.check_severity === "critical") {
      likelihood = 5;
      impact = 5;
    }
  } else if (task.is_statutory && (task.overdue_days ?? 0) > 0) {
    likelihood = Math.max(likelihood, 3);
    impact = Math.max(impact, domainImpact(task.domain) - 1);
    // Critical checks that are overdue at all → escalate further
    if (task.check_severity === "critical") {
      likelihood = Math.max(likelihood, 4);
      impact = Math.max(impact, 5);
    }
  }

  // Priority escalation
  if (task.priority === "urgent" || task.priority === "critical") {
    likelihood = Math.max(likelihood, 3);
    impact = Math.max(impact, 3);
  }

  // Overdue escalation independent of statutory flag
  if ((task.overdue_days ?? 0) > 30) {
    likelihood = Math.max(likelihood, 4);
  } else if ((task.overdue_days ?? 0) > 7) {
    likelihood = Math.max(likelihood, 3);
  }

  // Default category if none resolved
  if (categories.size === 0) {
    categories.add("operational");
  }

  likelihood = clamp(likelihood, 1, 5);
  impact = clamp(impact, 1, 5);

  const suggestedTitle = task.title
    ? `Risk: ${task.title}`
    : `Auto-generated risk from ${task.domain ?? "unknown"} task`;

  return {
    inherent_likelihood: likelihood,
    inherent_impact: impact,
    risk_categories: Array.from(categories),
    suggested_title: suggestedTitle,
  };
}

/**
 * Build a 5×5 heat-map matrix counting risks in each
 * likelihood (row) × impact (column) cell.
 *
 * Row 0 = likelihood 1 (Rare), Row 4 = likelihood 5 (Almost Certain).
 * Col 0 = impact 1 (Negligible), Col 4 = impact 5 (Catastrophic).
 *
 * Uses the effective score when an override is active, otherwise
 * system_residual values.
 */
export function getHeatMapData(risks: Risk[]): number[][] {
  const matrix: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));

  for (const r of risks) {
    const overrideActive =
      r.override_residual_likelihood != null &&
      r.override_residual_impact != null &&
      (!r.override_expires_at || new Date(r.override_expires_at) > new Date());

    const lk = clamp(
      Math.round(
        overrideActive
          ? r.override_residual_likelihood!
          : r.system_residual_likelihood,
      ),
      1,
      5,
    );
    const im = clamp(
      Math.round(
        overrideActive ? r.override_residual_impact! : r.system_residual_impact,
      ),
      1,
      5,
    );

    matrix[lk - 1][im - 1]++;
  }

  return matrix;
}

/**
 * Prioritise a set of competing demand items using a MoSCoW-style model
 * driven by statutory obligations and risk scores.
 *
 * | Band  | Criteria                          |
 * |-------|-----------------------------------|
 * | must  | Statutory OR risk_score >= 17      |
 * | should| risk_score >= 10                   |
 * | could | risk_score >= 5                    |
 * | wont  | risk_score < 5                     |
 *
 * Items are sorted by band (must first) then by descending risk score
 * within each band.
 */
export function prioritiseCompetingDemands<
  T extends {
    title: string;
    cost: number;
    risk_score: number;
    is_statutory: boolean;
    school_id?: string;
  },
>(
  items: T[],
): Array<
  T & { priority_band: "must" | "should" | "could" | "wont"; rank: number }
> {
  const bandOrder = { must: 0, should: 1, could: 2, wont: 3 };

  const withBand = items.map((item) => {
    let priority_band: "must" | "should" | "could" | "wont";

    if (item.is_statutory || item.risk_score >= 17) {
      priority_band = "must";
    } else if (item.risk_score >= 10) {
      priority_band = "should";
    } else if (item.risk_score >= 5) {
      priority_band = "could";
    } else {
      priority_band = "wont";
    }

    return { ...item, priority_band, rank: 0 };
  });

  // Sort: band order asc, then risk_score desc within band
  withBand.sort((a, b) => {
    const bandDiff = bandOrder[a.priority_band] - bandOrder[b.priority_band];
    if (bandDiff !== 0) return bandDiff;
    return b.risk_score - a.risk_score;
  });

  // Assign sequential ranks
  for (let i = 0; i < withBand.length; i++) {
    withBand[i].rank = i + 1;
  }

  return withBand;
}

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

/** Return the lowest appetite threshold across a set of categories. */
function getLowestAppetiteThreshold(categories: RiskCategory[]): number {
  if (categories.length === 0) return 12; // default moderate threshold

  let min = Infinity;
  for (const cat of categories) {
    const appetite = DEFAULT_RISK_APPETITES[cat];
    if (appetite && appetite.threshold < min) {
      min = appetite.threshold;
    }
  }
  return min === Infinity ? 12 : min;
}

/** Estimate inherent impact for a domain when a statutory task is overdue. */
function domainImpact(domain?: string): number {
  switch (domain?.toLowerCase()) {
    case "safeguarding":
      return 5;
    case "estates":
    case "h_and_s":
      return 4;
    case "compliance":
    case "legal":
    case "governance":
      return 4;
    case "finance":
    case "financial":
      return 3;
    case "hr":
    case "staffing":
      return 3;
    case "cyber":
    case "it":
      return 3;
    default:
      return 3;
  }
}
