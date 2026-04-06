/**
 * Dynamic Risk Scoring Engine
 *
 * Schoolgle's KILLER DIFFERENTIATOR — 5×5 Likelihood × Impact matrix (max 25)
 * with automatic escalation when checks are missed and de-escalation when
 * mitigations are confirmed.
 *
 * Pure logic module — no database calls. API routes and cron jobs supply data
 * and persist results.
 *
 * @see risk-engine.ts for residual score calculation with mitigations
 * @see risk-integration.ts for daily sync and cross-module wiring
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type EscalationEventType =
  | "check_overdue"
  | "repeat_failure"
  | "contractor_visit_cancelled"
  | "critical_no_action_24hrs";

export type DeEscalationEventType =
  | "mitigation_confirmed"
  | "monitoring_check_completed"
  | "permanent_fix_verified"
  | "professional_inspection_safe"
  | "staff_notification_confirmed";

export type MitigationActionType = "minor" | "moderate" | "major";

export interface EscalationEvent {
  type: EscalationEventType;
  /** Days overdue — required for check_overdue events */
  overdue_days?: number;
  /** Number of failures on this asset in the last 12 months — for repeat_failure */
  failure_count_12_months?: number;
}

export interface DeEscalationEvent {
  type: DeEscalationEventType;
  /** Action type determines the point reduction for mitigation_confirmed */
  action_type?: MitigationActionType;
  /** Target residual score for permanent_fix_verified and professional_inspection_safe */
  residual_score?: number;
}

export interface ScoreChangeResult {
  previous_score: number;
  new_score: number;
  change: number;
  reason: string;
  risk_level: RiskLevel;
  triggered_by: string;
}

// ---------------------------------------------------------------------------
// Escalation Trigger Constants (point adjustments)
// ---------------------------------------------------------------------------

export const ESCALATION_TRIGGERS = {
  /** Compliance check overdue 1 day: +2 points */
  check_overdue_1_day: 2,
  /** Compliance check overdue 7 days: +5 points (replaces the +2) */
  check_overdue_7_days: 5,
  /** Compliance check overdue 30 days: +8 points (replaces previous) */
  check_overdue_30_days: 8,
  /** Repeat failure on same asset (3+ in 12 months): +3 points */
  repeat_failure_3_in_12_months: 3,
  /** Contractor visit cancelled: +2 points */
  contractor_visit_cancelled: 2,
  /** Ticket priority = critical and no action in 24hrs: +3 points */
  critical_no_action_24hrs: 3,
} as const;

// ---------------------------------------------------------------------------
// De-Escalation Trigger Constants (point reductions)
// ---------------------------------------------------------------------------

export const DE_ESCALATION_TRIGGERS = {
  /** Minor mitigation action confirmed: -2 points */
  mitigation_confirmed_minor: 2,
  /** Moderate mitigation action confirmed: -3 points */
  mitigation_confirmed_moderate: 3,
  /** Major mitigation action confirmed: -5 points */
  mitigation_confirmed_major: 5,
  /** Staff notification confirmed: -1 point */
  staff_notification_confirmed: 1,
} as const;

/** Default residual score when a permanent fix or professional inspection
 *  does not specify a target (typically 2-4). */
const DEFAULT_RESIDUAL_SCORE = 3;

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Calculate risk score from likelihood (1-5) and impact (1-5).
 * Returns a score from 1 to 25.
 */
export function calculateRiskScore(likelihood: number, impact: number): number {
  const l = clamp(likelihood, 1, 5);
  const i = clamp(impact, 1, 5);
  return l * i;
}

/**
 * Map a raw risk score to a named risk level.
 *
 * | Range | Level    | Colour |
 * |-------|----------|--------|
 * | 1-4   | low      | green  |
 * | 5-9   | medium   | amber  |
 * | 10-16 | high     | orange |
 * | 17-25 | critical | red    |
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 17) return "critical";
  if (score >= 10) return "high";
  if (score >= 5) return "medium";
  return "low";
}

/**
 * Return the colour token for a risk level (for UI rendering).
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "#22c55e"; // green-500
    case "medium":
      return "#f59e0b"; // amber-500
    case "high":
      return "#f97316"; // orange-500
    case "critical":
      return "#ef4444"; // red-500
  }
}

/**
 * Apply an escalation event to a current risk score.
 *
 * Escalation rules (from spec):
 * - Check overdue 1 day:  +2 points
 * - Check overdue 7 days: +5 points (replaces the +2)
 * - Check overdue 30 days: +8 points (replaces previous)
 * - Repeat failure (3+ in 12 months): +3 points
 * - Contractor visit cancelled: +2 points
 * - Critical ticket no action 24hrs: +3 points
 *
 * Score is capped at 25.
 */
export function applyEscalation(
  currentScore: number,
  event: EscalationEvent,
): ScoreChangeResult {
  let change = 0;
  let reason = "";
  const triggeredBy = event.type;

  switch (event.type) {
    case "check_overdue": {
      const days = event.overdue_days ?? 0;
      if (days >= 30) {
        change = ESCALATION_TRIGGERS.check_overdue_30_days;
        reason = `Compliance check overdue ${days} days (+${change} points, replacing lower escalation)`;
      } else if (days >= 7) {
        change = ESCALATION_TRIGGERS.check_overdue_7_days;
        reason = `Compliance check overdue ${days} days (+${change} points, replacing +2 escalation)`;
      } else if (days >= 1) {
        change = ESCALATION_TRIGGERS.check_overdue_1_day;
        reason = `Compliance check overdue ${days} day(s) (+${change} points)`;
      } else {
        reason = "Check not yet overdue — no escalation";
      }
      break;
    }

    case "repeat_failure": {
      const count = event.failure_count_12_months ?? 0;
      if (count >= 3) {
        change = ESCALATION_TRIGGERS.repeat_failure_3_in_12_months;
        reason = `Repeat failure on same asset (${count} failures in 12 months, +${change} points)`;
      } else {
        reason = `Only ${count} failure(s) in 12 months — threshold is 3`;
      }
      break;
    }

    case "contractor_visit_cancelled":
      change = ESCALATION_TRIGGERS.contractor_visit_cancelled;
      reason = `Contractor visit cancelled (+${change} points)`;
      break;

    case "critical_no_action_24hrs":
      change = ESCALATION_TRIGGERS.critical_no_action_24hrs;
      reason = `Critical ticket with no action in 24 hours (+${change} points)`;
      break;
  }

  const newScore = clamp(currentScore + change, 1, 25);

  return {
    previous_score: currentScore,
    new_score: newScore,
    change: newScore - currentScore,
    reason,
    risk_level: getRiskLevel(newScore),
    triggered_by: triggeredBy,
  };
}

/**
 * Apply a de-escalation event to a current risk score.
 *
 * De-escalation rules (from spec):
 * - Mitigation confirmed (minor): -2 points
 * - Mitigation confirmed (moderate): -3 points
 * - Mitigation confirmed (major): -5 points
 * - Monitoring check completed on time: maintains current level (0 change)
 * - Permanent fix verified: reduce to residual level (typically 2-4)
 * - Professional inspection confirms safety: reduce to residual level
 * - Staff notification confirmed: -1 point
 *
 * Score floor is 0 (closed/archived).
 */
export function applyDeEscalation(
  currentScore: number,
  event: DeEscalationEvent,
): ScoreChangeResult {
  let newScore = currentScore;
  let reason = "";
  const triggeredBy = event.type;

  switch (event.type) {
    case "mitigation_confirmed": {
      const actionType = event.action_type ?? "minor";
      let reduction: number;
      switch (actionType) {
        case "major":
          reduction = DE_ESCALATION_TRIGGERS.mitigation_confirmed_major;
          break;
        case "moderate":
          reduction = DE_ESCALATION_TRIGGERS.mitigation_confirmed_moderate;
          break;
        case "minor":
        default:
          reduction = DE_ESCALATION_TRIGGERS.mitigation_confirmed_minor;
          break;
      }
      newScore = Math.max(0, currentScore - reduction);
      reason = `Mitigation action confirmed (${actionType}): -${reduction} points`;
      break;
    }

    case "monitoring_check_completed":
      // Maintains current level — prevents escalation but doesn't reduce
      newScore = currentScore;
      reason =
        "Monitoring check completed on time — maintains current risk level";
      break;

    case "permanent_fix_verified": {
      const residual = event.residual_score ?? DEFAULT_RESIDUAL_SCORE;
      newScore = Math.max(0, Math.min(currentScore, residual));
      reason = `Permanent fix completed and verified — reduced to residual level (${residual})`;
      break;
    }

    case "professional_inspection_safe": {
      const residual = event.residual_score ?? DEFAULT_RESIDUAL_SCORE;
      newScore = Math.max(0, Math.min(currentScore, residual));
      reason = `Professional inspection confirms safety — reduced to residual level (${residual})`;
      break;
    }

    case "staff_notification_confirmed": {
      const reduction = DE_ESCALATION_TRIGGERS.staff_notification_confirmed;
      newScore = Math.max(0, currentScore - reduction);
      reason = `Staff notification confirmed: -${reduction} point`;
      break;
    }
  }

  return {
    previous_score: currentScore,
    new_score: newScore,
    change: newScore - currentScore,
    reason,
    risk_level: getRiskLevel(newScore),
    triggered_by: triggeredBy,
  };
}

/**
 * Determine the appropriate overdue escalation tier for a number of overdue days.
 * Returns the single applicable tier (higher tiers replace lower ones).
 */
export function getOverdueEscalationPoints(overdueDays: number): number {
  if (overdueDays >= 30) return ESCALATION_TRIGGERS.check_overdue_30_days;
  if (overdueDays >= 7) return ESCALATION_TRIGGERS.check_overdue_7_days;
  if (overdueDays >= 1) return ESCALATION_TRIGGERS.check_overdue_1_day;
  return 0;
}

/**
 * Build a score history entry from a ScoreChangeResult.
 * Use this to create records for the risk_score_history table.
 */
export function buildScoreHistoryEntry(
  riskId: string,
  organizationId: string,
  result: ScoreChangeResult,
  userId?: string,
): {
  risk_id: string;
  organization_id: string;
  score_type: string;
  system_score: number;
  recorded_score: number;
  trigger_type: string;
  trigger_source_id?: string;
  change_reason: string;
  previous_score: number;
  recorded_likelihood?: number;
  recorded_impact?: number;
} {
  const isAuto = !userId;
  return {
    risk_id: riskId,
    organization_id: organizationId,
    score_type: "system_calculated",
    system_score: result.new_score,
    recorded_score: result.new_score,
    trigger_type: isAuto ? "system_auto" : "user_action",
    change_reason: result.reason,
    previous_score: result.previous_score,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
