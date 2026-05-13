export type SendEdSkillRisk = "safe_auto" | "human_approval_required";

export type SendEdSkill = {
  name: string;
  description: string;
  risk: SendEdSkillRisk;
  produces: string[];
  requiresHumanApprovalFor?: string[];
};

export const SEND_ED_COPILOT_SKILLS: SendEdSkill[] = [
  {
    name: "send_list_open_actions",
    description: "List SEND actions by pupil, owner, priority, deadline and source workflow.",
    risk: "safe_auto",
    produces: ["action_queue", "deadline_summary"],
  },
  {
    name: "send_create_case_note",
    description: "Create a dated pupil case note with category, linked action and audit trail.",
    risk: "safe_auto",
    produces: ["case_note", "audit_entry"],
  },
  {
    name: "send_summarise_upload",
    description: "Summarise an uploaded report, tag the pupil and propose evidence/action links.",
    risk: "safe_auto",
    produces: ["upload_summary", "evidence_links", "suggested_actions"],
  },
  {
    name: "send_prepare_meeting",
    description: "Prepare a SEND meeting using an approved Schoolgle meeting template, agenda and pupil context.",
    risk: "safe_auto",
    produces: ["meeting_agenda", "invitee_checklist", "pre_meeting_brief"],
  },
  {
    name: "send_generate_minutes_outputs",
    description: "Convert approved meeting minutes into actions, evidence updates and draft documents.",
    risk: "human_approval_required",
    produces: ["meeting_minutes", "actions", "document_drafts"],
    requiresHumanApprovalFor: ["final_minutes", "document_release"],
  },
  {
    name: "send_check_ehcp_quality",
    description: "Check EHCP needs, outcomes and provision wording for specificity, quantification and evidence links.",
    risk: "safe_auto",
    produces: ["quality_flags", "missing_evidence", "draft_wording_suggestions"],
  },
  {
    name: "send_build_evidence_pack",
    description: "Build a pupil evidence pack from linked files, notes, views, professional reports and actions.",
    risk: "human_approval_required",
    produces: ["evidence_pack", "missing_items", "submission_checklist"],
    requiresHumanApprovalFor: ["pack_submission"],
  },
  {
    name: "send_reconcile_funding",
    description: "Compare expected top-up funding against receipts and produce variance actions.",
    risk: "safe_auto",
    produces: ["funding_reconciliation", "variance_actions"],
  },
  {
    name: "send_generate_la_query",
    description: "Draft a funding or EHCP local authority query pack from approved evidence.",
    risk: "human_approval_required",
    produces: ["la_query_draft", "evidence_references"],
    requiresHumanApprovalFor: ["external_send"],
  },
  {
    name: "send_generate_governor_report",
    description: "Aggregate SEND actions, evidence readiness, statutory deadlines and funding variances into leadership reporting.",
    risk: "human_approval_required",
    produces: ["slt_brief", "governor_report", "trust_summary"],
    requiresHumanApprovalFor: ["report_publication"],
  },
];

export function getSendEdSkillByName(name: string): SendEdSkill | undefined {
  return SEND_ED_COPILOT_SKILLS.find((skill) => skill.name === name);
}

export function listHumanApprovalSendSkills(): SendEdSkill[] {
  return SEND_ED_COPILOT_SKILLS.filter((skill) => skill.risk === "human_approval_required");
}

