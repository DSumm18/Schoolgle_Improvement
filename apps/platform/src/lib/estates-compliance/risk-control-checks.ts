export type RiskControlDomain =
  | "fire"
  | "legionella"
  | "electrical"
  | "asbestos"
  | "security"
  | "water"
  | "general";

export type RiskControlFrequency = "daily" | "weekly" | "custom";
export type RiskControlDecisionStatus = "accepted" | "declined";
export type RiskControlCheckStatus = "active" | "paused" | "completed";
export type RiskControlCompletionResult = "ok" | "not_ok" | "missed";

export interface RiskControlSuggestionInput {
  organizationId: string;
  ticketId: string;
  riskId?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  riskScore?: number | null;
}

export interface RiskControlRecommendation {
  id: string;
  title: string;
  description: string;
  domain: RiskControlDomain;
  frequency: RiskControlFrequency;
  requiresPhoto: boolean;
  requiresNotes: boolean;
  escalationIfFailed: string;
  evidencePrompt: string;
  riskScoreIfMissed: number;
}

export interface RiskControlSuggestions {
  organizationId: string;
  ticketId: string;
  riskId?: string | null;
  domain: RiskControlDomain;
  riskScore: number;
  recommendations: RiskControlRecommendation[];
}

export interface RiskControlDecisionInput {
  organizationId: string;
  ticketId: string;
  riskId?: string | null;
  actorId: string;
  acceptedRecommendationIds: string[];
  declinedRecommendationIds: string[];
  declinedReason?: string;
  suggestions: RiskControlSuggestions;
  decidedAt?: string;
}

export interface RiskControlDecisionRow {
  organization_id: string;
  ticket_id: string;
  risk_id?: string | null;
  recommendation_id: string;
  title: string;
  description: string;
  domain: RiskControlDomain;
  frequency_required: RiskControlFrequency;
  requires_photo: boolean;
  requires_notes: boolean;
  evidence_prompt: string;
  escalation_if_failed: string;
  risk_score_if_missed: number;
  status: RiskControlDecisionStatus;
  accepted_by?: string | null;
  accepted_at?: string | null;
  declined_by?: string | null;
  declined_at?: string | null;
  declined_reason?: string | null;
}

export interface RiskControlCheckRow {
  organization_id: string;
  ticket_id: string;
  risk_id?: string | null;
  recommendation_id: string;
  title: string;
  description: string;
  domain: RiskControlDomain;
  frequency_required: RiskControlFrequency;
  requires_photo: boolean;
  requires_notes: boolean;
  evidence_prompt: string;
  escalation_if_failed: string;
  risk_score_if_missed: number;
  status: RiskControlCheckStatus;
  next_due_date: string;
}

export interface RiskControlAuditBuildResult {
  accepted: RiskControlDecisionRow[];
  declined: RiskControlDecisionRow[];
  checksToCreate: RiskControlCheckRow[];
}

export interface RiskControlCompletionInput {
  currentRiskScore: number;
  result: RiskControlCompletionResult;
  dueDate: string;
  completedAt: string;
}

export interface RiskControlCompletionOutcome {
  newRiskScore: number;
  riskDirection: "improving" | "stable" | "worsening";
  escalationRequired: boolean;
  reason: string;
}

const DOMAIN_KEYWORDS: Array<[RiskControlDomain, RegExp]> = [
  ["legionella", /legionella|flush|outlet|shower|calorifier|water temperature/i],
  ["fire", /fire|combustible|flammable|alarm|extinguisher|evacuation|boiler room/i],
  ["electrical", /electrical|socket|shock|cable|consumer unit|portable appliance/i],
  ["asbestos", /asbestos|acm|lagging|survey/i],
  ["security", /security|gate|fence|perimeter|intruder|cctv|door entry/i],
  ["water", /leak|tap|pipe|drain|flood|toilet|water/i],
];

function clampRiskScore(score: number): number {
  return Math.max(1, Math.min(25, Math.round(score)));
}

function toIsoDate(isoTimestamp: string): string {
  return isoTimestamp.split("T")[0];
}

export function classifyRiskControlDomain(input: {
  title: string;
  description?: string | null;
  category?: string | null;
}): RiskControlDomain {
  const text = `${input.category || ""} ${input.title} ${input.description || ""}`;
  return DOMAIN_KEYWORDS.find(([, pattern]) => pattern.test(text))?.[0] || "general";
}

export function suggestRiskControlChecks(
  input: RiskControlSuggestionInput,
): RiskControlSuggestions {
  const domain = classifyRiskControlDomain(input);
  const riskScore = clampRiskScore(input.riskScore ?? 9);

  return {
    organizationId: input.organizationId,
    ticketId: input.ticketId,
    riskId: input.riskId,
    domain,
    riskScore,
    recommendations: getDomainRecommendations(domain, riskScore),
  };
}

export function buildRiskControlDecisionAudit(
  input: RiskControlDecisionInput,
): RiskControlAuditBuildResult {
  const decidedAt = input.decidedAt || new Date().toISOString();
  const nextDueDate = toIsoDate(decidedAt);
  const acceptedIds = new Set(input.acceptedRecommendationIds);
  const declinedIds = new Set(input.declinedRecommendationIds);

  const accepted: RiskControlDecisionRow[] = [];
  const declined: RiskControlDecisionRow[] = [];
  const checksToCreate: RiskControlCheckRow[] = [];

  for (const recommendation of input.suggestions.recommendations) {
    if (!acceptedIds.has(recommendation.id) && !declinedIds.has(recommendation.id)) {
      continue;
    }

    const base = {
      organization_id: input.organizationId,
      ticket_id: input.ticketId,
      risk_id: input.riskId,
      recommendation_id: recommendation.id,
      title: recommendation.title,
      description: recommendation.description,
      domain: recommendation.domain,
      frequency_required: recommendation.frequency,
      requires_photo: recommendation.requiresPhoto,
      requires_notes: recommendation.requiresNotes,
      evidence_prompt: recommendation.evidencePrompt,
      escalation_if_failed: recommendation.escalationIfFailed,
      risk_score_if_missed: recommendation.riskScoreIfMissed,
    };

    if (acceptedIds.has(recommendation.id)) {
      accepted.push({
        ...base,
        status: "accepted",
        accepted_by: input.actorId,
        accepted_at: decidedAt,
        declined_by: null,
        declined_at: null,
        declined_reason: null,
      });
      checksToCreate.push({
        ...base,
        status: "active",
        next_due_date: nextDueDate,
      });
    }

    if (declinedIds.has(recommendation.id)) {
      declined.push({
        ...base,
        status: "declined",
        accepted_by: null,
        accepted_at: null,
        declined_by: input.actorId,
        declined_at: decidedAt,
        declined_reason: input.declinedReason || null,
      });
    }
  }

  return { accepted, declined, checksToCreate };
}

export function applyRiskControlCompletion(
  input: RiskControlCompletionInput,
): RiskControlCompletionOutcome {
  const currentRiskScore = clampRiskScore(input.currentRiskScore);

  if (input.result === "ok") {
    return {
      newRiskScore: currentRiskScore,
      riskDirection: "stable",
      escalationRequired: false,
      reason: "Risk Control Check completed OK; current assurance remains in place.",
    };
  }

  if (input.result === "not_ok") {
    return {
      newRiskScore: clampRiskScore(currentRiskScore + 5),
      riskDirection: "worsening",
      escalationRequired: true,
      reason: "Risk Control Check failed; the parent ticket/risk needs immediate review.",
    };
  }

  const dueDate = new Date(input.dueDate);
  const completedAt = new Date(input.completedAt);
  const overdueDays = Math.max(
    1,
    Math.ceil((completedAt.getTime() - dueDate.getTime()) / 86_400_000),
  );
  const increase = overdueDays >= 7 ? 5 : 2;

  return {
    newRiskScore: clampRiskScore(currentRiskScore + increase),
    riskDirection: "worsening",
    escalationRequired: true,
    reason: `Risk Control Check missed; assurance is stale by ${overdueDays} day(s).`,
  };
}

function getDomainRecommendations(
  domain: RiskControlDomain,
  riskScore: number,
): RiskControlRecommendation[] {
  const missedScore = clampRiskScore(riskScore + 2);

  const templates: Record<RiskControlDomain, RiskControlRecommendation[]> = {
    fire: [
      {
        id: "fire-clear-combustibles-daily",
        title: "Keep combustible materials clear of the boiler room and fire exit",
        description:
          "Check the area remains clear and photograph the route until the finding is permanently resolved.",
        domain: "fire",
        frequency: "daily",
        requiresPhoto: true,
        requiresNotes: true,
        escalationIfFailed: "Escalate to SLT immediately and raise priority to critical.",
        evidencePrompt: "Take a photo showing the boiler room/fire exit area is clear.",
        riskScoreIfMissed: missedScore,
      },
      {
        id: "fire-restrict-access-and-signage",
        title: "Restrict access and add temporary warning signage",
        description:
          "Keep pupils and unauthorised staff away from the affected area until the remedial action is complete.",
        domain: "fire",
        frequency: "daily",
        requiresPhoto: true,
        requiresNotes: true,
        escalationIfFailed: "Notify the headteacher if access cannot be restricted.",
        evidencePrompt: "Photograph signage/barriers and note any access concerns.",
        riskScoreIfMissed: missedScore,
      },
    ],
    legionella: [
      {
        id: "legionella-flush-outlet-daily",
        title: "Flush and record the affected outlet",
        description:
          "Flush the little-used outlet and record evidence while the issue remains open.",
        domain: "legionella",
        frequency: "daily",
        requiresPhoto: true,
        requiresNotes: true,
        escalationIfFailed: "Escalate to the responsible person for water safety.",
        evidencePrompt: "Photograph the outlet and note whether flushing was completed.",
        riskScoreIfMissed: missedScore,
      },
      {
        id: "legionella-restrict-outlet-use",
        title: "Restrict use of the outlet until verified safe",
        description:
          "Add a temporary out-of-use note or control if the outlet may present a water hygiene risk.",
        domain: "legionella",
        frequency: "daily",
        requiresPhoto: true,
        requiresNotes: true,
        escalationIfFailed: "Escalate if the outlet is used before verification.",
        evidencePrompt: "Photograph the temporary control/signage.",
        riskScoreIfMissed: missedScore,
      },
    ],
    electrical: [
      {
        id: "electrical-isolate-area-daily",
        title: "Confirm the electrical hazard remains isolated",
        description:
          "Check that the affected socket/cable/equipment remains isolated and inaccessible.",
        domain: "electrical",
        frequency: "daily",
        requiresPhoto: true,
        requiresNotes: true,
        escalationIfFailed: "Escalate immediately if the hazard is accessible.",
        evidencePrompt: "Photograph the isolation/signage.",
        riskScoreIfMissed: missedScore,
      },
    ],
    asbestos: [
      {
        id: "asbestos-avoid-disturbance-daily",
        title: "Confirm suspected asbestos material remains undisturbed",
        description:
          "Check the area has not been disturbed and remains isolated until competent advice is received.",
        domain: "asbestos",
        frequency: "daily",
        requiresPhoto: true,
        requiresNotes: true,
        escalationIfFailed: "Escalate immediately if material is disturbed or damaged.",
        evidencePrompt: "Photograph the area from a safe distance.",
        riskScoreIfMissed: missedScore,
      },
    ],
    security: [
      {
        id: "security-check-temporary-control-daily",
        title: "Check the temporary security control remains effective",
        description:
          "Confirm the gate/fence/door control is still secure while repair is pending.",
        domain: "security",
        frequency: "daily",
        requiresPhoto: true,
        requiresNotes: true,
        escalationIfFailed: "Escalate to SLT if safeguarding/security is weakened.",
        evidencePrompt: "Photograph the gate/fence/door control.",
        riskScoreIfMissed: missedScore,
      },
    ],
    water: [
      {
        id: "water-check-leak-daily",
        title: "Check the leak has not worsened",
        description:
          "Confirm the affected area remains safe, dry where needed, and has not caused additional damage.",
        domain: "water",
        frequency: "daily",
        requiresPhoto: true,
        requiresNotes: true,
        escalationIfFailed: "Escalate if water spread, slips, or service disruption increase.",
        evidencePrompt: "Take a photo of the leak/affected area.",
        riskScoreIfMissed: missedScore,
      },
    ],
    general: [
      {
        id: "general-check-control-daily",
        title: "Check the temporary control is still working",
        description:
          "Confirm the issue has not worsened and the temporary control remains in place.",
        domain: "general",
        frequency: "daily",
        requiresPhoto: true,
        requiresNotes: true,
        escalationIfFailed: "Escalate if the issue has worsened or the control is not working.",
        evidencePrompt: "Take a photo and add a short note.",
        riskScoreIfMissed: missedScore,
      },
    ],
  };

  return templates[domain];
}
