/**
 * Risk Module — Public API
 *
 * Re-exports from the scoring engine and auto-escalation service.
 */

export {
  calculateRiskScore,
  getRiskLevel,
  getRiskLevelColor,
  applyEscalation,
  applyDeEscalation,
  getOverdueEscalationPoints,
  buildScoreHistoryEntry,
  ESCALATION_TRIGGERS,
  DE_ESCALATION_TRIGGERS,
  type RiskLevel,
  type EscalationEvent,
  type DeEscalationEvent,
  type ScoreChangeResult,
  type EscalationEventType,
  type DeEscalationEventType,
  type MitigationActionType,
} from "./scoring-engine";

export { runAutoEscalation, type AutoEscalationSummary } from "./auto-escalation";
