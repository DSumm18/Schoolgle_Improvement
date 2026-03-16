/**
 * Incident Cross-Module Touchpoint Map
 *
 * Defines every integration point between the H&S Incident module and the
 * wider Schoolgle platform.  Used at runtime by Ed to explain the incident
 * ecosystem and by the workflow engine to orchestrate automations.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IncidentPhase =
  | "initial_report"
  | "triage"
  | "investigation"
  | "remediation"
  | "reporting"
  | "review"
  | "closure";

export type DataFlowDirection = "in" | "out" | "bidirectional";

export interface IncidentTouchpoint {
  /** Lifecycle phase where this touchpoint fires */
  phase: IncidentPhase;
  /** Platform module that is touched */
  module: string;
  /** Specific action or event */
  action: string;
  /** Direction of data relative to the incident record */
  dataFlow: DataFlowDirection;
  /** Whether this step is triggered automatically (true) or requires user action */
  automated: boolean;
  /** Optional SOP template ID that governs the step */
  sopTemplateId?: string;
  /** Human-readable description for Ed and audit logs */
  description: string;
}

// ---------------------------------------------------------------------------
// Touchpoints
// ---------------------------------------------------------------------------

export const INCIDENT_TOUCHPOINTS: IncidentTouchpoint[] = [
  // ── Initial Report ──────────────────────────────────────────────────
  {
    phase: "initial_report",
    module: "hs_incident",
    action: "create_incident_form",
    dataFlow: "in",
    automated: false,
    description:
      "Staff member completes the H&S incident form capturing who, what, where, when, and immediate actions taken.",
  },
  {
    phase: "initial_report",
    module: "hs_incident",
    action: "riddor_auto_detect",
    dataFlow: "out",
    automated: true,
    sopTemplateId: "sop_riddor_notification",
    description:
      "System evaluates injury type, absence duration, and incident category against RIDDOR 2013 criteria to flag reportable incidents.",
  },
  {
    phase: "initial_report",
    module: "safeguarding",
    action: "pupil_involvement_flag",
    dataFlow: "out",
    automated: true,
    description:
      "If a pupil is involved, the safeguarding module is automatically notified so the DSL can review for child protection concerns.",
  },
  {
    phase: "initial_report",
    module: "notifications",
    action: "alert_headteacher",
    dataFlow: "out",
    automated: true,
    description:
      "Immediate notification sent to the headteacher on incident creation.",
  },
  {
    phase: "initial_report",
    module: "notifications",
    action: "alert_site_manager",
    dataFlow: "out",
    automated: true,
    description:
      "Immediate notification sent to the site manager when the incident involves premises or equipment.",
  },
  {
    phase: "initial_report",
    module: "notifications",
    action: "alert_business_manager",
    dataFlow: "out",
    automated: true,
    description:
      "Immediate notification sent to the business manager for insurance and financial tracking.",
  },

  // ── Triage ──────────────────────────────────────────────────────────
  {
    phase: "triage",
    module: "sop_engine",
    action: "trigger_incident_response_sop",
    dataFlow: "in",
    automated: true,
    sopTemplateId: "sop_incident_response",
    description:
      "The SOP engine selects and activates the correct incident response template based on incident type and severity.",
  },
  {
    phase: "triage",
    module: "risk_register",
    action: "auto_create_risk",
    dataFlow: "out",
    automated: true,
    description:
      "A new risk entry is created (or an existing one escalated) in the risk register with initial likelihood and impact scores derived from the incident.",
  },
  {
    phase: "triage",
    module: "estates_helpdesk",
    action: "link_or_create_ticket",
    dataFlow: "bidirectional",
    automated: true,
    description:
      "If the incident relates to a premises issue, an estates helpdesk ticket is auto-created or an existing ticket linked.",
  },
  {
    phase: "triage",
    module: "workflow_engine",
    action: "initiate_equipment_failure_lifecycle",
    dataFlow: "out",
    automated: true,
    sopTemplateId: "sop_equipment_failure",
    description:
      "For equipment-related incidents, the workflow engine starts the equipment failure lifecycle (isolate, inspect, repair/replace, recommission).",
  },

  // ── Investigation ───────────────────────────────────────────────────
  {
    phase: "investigation",
    module: "document_engine",
    action: "generate_witness_statement_template",
    dataFlow: "out",
    automated: true,
    sopTemplateId: "sop_witness_statement",
    description:
      "The document engine generates blank witness statement forms pre-populated with incident reference, date, and location.",
  },
  {
    phase: "investigation",
    module: "document_engine",
    action: "collect_witness_statements",
    dataFlow: "in",
    automated: false,
    description:
      "Witness statements are completed and uploaded back into the incident record.",
  },
  {
    phase: "investigation",
    module: "estates_helpdesk",
    action: "pull_maintenance_history",
    dataFlow: "in",
    automated: true,
    description:
      "Maintenance history for the affected location or asset is pulled from the estates module to support root cause analysis.",
  },
  {
    phase: "investigation",
    module: "intelligence",
    action: "pattern_detection",
    dataFlow: "in",
    automated: true,
    description:
      "The intelligence engine checks for recurring patterns: same location, same equipment, same time of day, same activity.",
  },
  {
    phase: "investigation",
    module: "intelligence",
    action: "trend_analysis",
    dataFlow: "in",
    automated: true,
    description:
      "Historical incident data is analysed for trends (frequency, severity trajectory, seasonal patterns) and surfaced to the investigator.",
  },

  // ── Remediation ─────────────────────────────────────────────────────
  {
    phase: "remediation",
    module: "risk_register",
    action: "update_risk_controls",
    dataFlow: "out",
    automated: false,
    description:
      "Investigation findings are used to update risk controls, residual scores, and add new mitigations to the risk register.",
  },
  {
    phase: "remediation",
    module: "estates_helpdesk",
    action: "create_remediation_ticket",
    dataFlow: "out",
    automated: true,
    description:
      "Remedial works identified during investigation are raised as estates helpdesk tickets with priority and deadline.",
  },
  {
    phase: "remediation",
    module: "workflow_engine",
    action: "track_equipment_recommission",
    dataFlow: "bidirectional",
    automated: true,
    sopTemplateId: "sop_equipment_failure",
    description:
      "The workflow engine tracks equipment through inspection, repair, testing, and formal recommissioning sign-off.",
  },
  {
    phase: "remediation",
    module: "sop_engine",
    action: "update_sop_if_needed",
    dataFlow: "out",
    automated: false,
    description:
      "If the investigation reveals a gap in procedures, the relevant SOP is flagged for review and update.",
  },

  // ── Reporting ───────────────────────────────────────────────────────
  {
    phase: "reporting",
    module: "document_engine",
    action: "generate_f2508",
    dataFlow: "out",
    automated: true,
    sopTemplateId: "sop_riddor_notification",
    description:
      "For RIDDOR-reportable incidents, the document engine generates the F2508 report pre-populated from the incident record.",
  },
  {
    phase: "reporting",
    module: "compliance",
    action: "track_hse_deadline",
    dataFlow: "bidirectional",
    automated: true,
    description:
      "The compliance module tracks the HSE reporting deadline (10 days for F2508, 15 days for occupational disease) and escalates if at risk of breach.",
  },
  {
    phase: "reporting",
    module: "notifications",
    action: "deadline_reminder",
    dataFlow: "out",
    automated: true,
    description:
      "Automated reminders sent at 7-day, 3-day, and 1-day marks before the HSE reporting deadline.",
  },
  {
    phase: "reporting",
    module: "document_engine",
    action: "generate_investigation_report",
    dataFlow: "out",
    automated: false,
    description:
      "The investigation report is generated from collected evidence, witness statements, and root cause analysis.",
  },

  // ── Review ──────────────────────────────────────────────────────────
  {
    phase: "review",
    module: "intelligence",
    action: "update_school_intelligence",
    dataFlow: "out",
    automated: true,
    description:
      "Closed incident data feeds into the school intelligence engine for ongoing trend monitoring and cross-module correlation.",
  },
  {
    phase: "review",
    module: "risk_register",
    action: "reassess_risk_score",
    dataFlow: "bidirectional",
    automated: false,
    description:
      "Post-remediation, the linked risk is formally reassessed with updated likelihood and impact scores.",
  },
  {
    phase: "review",
    module: "compliance",
    action: "governor_report_flag",
    dataFlow: "out",
    automated: true,
    description:
      "Serious incidents are flagged for inclusion in the next governors' H&S report.",
  },
  {
    phase: "review",
    module: "sop_engine",
    action: "lessons_learned_sop_review",
    dataFlow: "out",
    automated: false,
    sopTemplateId: "sop_incident_review",
    description:
      "Lessons learned trigger a review cycle for all SOPs related to the incident type.",
  },

  // ── Closure ─────────────────────────────────────────────────────────
  {
    phase: "closure",
    module: "hs_incident",
    action: "close_incident",
    dataFlow: "in",
    automated: false,
    description:
      "The responsible person formally closes the incident once all actions are complete and sign-offs obtained.",
  },
  {
    phase: "closure",
    module: "workflow_engine",
    action: "close_linked_workflows",
    dataFlow: "out",
    automated: true,
    description:
      "All linked workflow items (equipment lifecycle, helpdesk tickets) are verified complete or escalated if outstanding.",
  },
  {
    phase: "closure",
    module: "intelligence",
    action: "archive_for_benchmarking",
    dataFlow: "out",
    automated: true,
    description:
      "Anonymised incident metrics are archived for year-on-year benchmarking and trust-level aggregation.",
  },
  {
    phase: "closure",
    module: "notifications",
    action: "closure_confirmation",
    dataFlow: "out",
    automated: true,
    description:
      "Closure confirmation sent to all stakeholders (reporter, HT, site manager, BM) with summary of actions taken.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return all touchpoints for a given phase */
export function getTouchpointsByPhase(
  phase: IncidentPhase,
): IncidentTouchpoint[] {
  return INCIDENT_TOUCHPOINTS.filter((tp) => tp.phase === phase);
}

/** Return all touchpoints that interact with a given module */
export function getTouchpointsByModule(module: string): IncidentTouchpoint[] {
  return INCIDENT_TOUCHPOINTS.filter((tp) => tp.module === module);
}

/** Return only automated touchpoints (useful for workflow engine orchestration) */
export function getAutomatedTouchpoints(): IncidentTouchpoint[] {
  return INCIDENT_TOUCHPOINTS.filter((tp) => tp.automated);
}

/** Return touchpoints that reference a specific SOP template */
export function getTouchpointsBySop(
  sopTemplateId: string,
): IncidentTouchpoint[] {
  return INCIDENT_TOUCHPOINTS.filter(
    (tp) => tp.sopTemplateId === sopTemplateId,
  );
}
