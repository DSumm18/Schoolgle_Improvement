export const AI_ADVISORY_ONLY_COPY =
  "AI output is advisory only. Authorised school staff remain responsible for review, approval and action.";

export const HUMAN_REVIEW_REQUIRED_COPY =
  "Human review is required before this output is used, shared, submitted or recorded as final.";

export const SENSITIVE_DATA_WARNING_COPY =
  "Use the minimum necessary data. Do not send pupil names, staff personal data, safeguarding details or health information to AI unless the workflow is approved for it.";

export const AUDIT_TRAIL_COPY =
  "Keep an audit trail of source evidence, AI assistance, user edits, approvals and overrides.";

export const AI_TRANSPARENCY_COPY =
  "Schoolgle uses AI to assist with drafts, summaries and suggestions. It does not replace professional judgement.";

export const RESTRICTED_DECISION_AREAS = [
  "safeguarding",
  "send",
  "ehcp",
  "hr",
  "disciplinary",
  "employment",
  "admissions",
  "exclusions",
  "attendance-intervention",
  "assessment-outcome",
  "inspection-grade",
  "compliance-status",
] as const;

export const APPROVED_AI_USE_CASES = [
  "summarise-source-material",
  "draft-editable-content",
  "extract-structured-data",
  "map-evidence-to-framework",
  "suggest-next-steps",
  "identify-missing-evidence",
  "translate-or-rephrase",
  "generate-review-questions",
  "route-user-request",
] as const;

export const SENSITIVE_AI_DATA_CATEGORIES = [
  "pupil-identifiable-data",
  "staff-personal-data",
  "safeguarding-records",
  "send-records",
  "health-or-medical-data",
  "hr-casework",
  "assessment-records",
  "admissions-records",
  "exclusion-records",
  "financial-or-payroll-data",
] as const;

export const PROHIBITED_AI_CLAIMS = [
  "AI decides final outcomes",
  "AI predicts Ofsted grades or inspection outcomes",
  "AI certifies legal or compliance status",
  "AI replaces DSL, SENCO, headteacher, governor or HR judgement",
  "AI automatically approves, rejects, submits, sends, moves or deletes school records",
] as const;

const PROHIBITED_COPY_PATTERNS = [
  /\b(ai|ed|schoolgle)\s+(decides|approves|rejects|determines|certifies|guarantees)\b/i,
  /\bpredict(s|ed|ing)?\s+(the\s+)?(ofsted|siams|inspection)\s+(grade|outcome|judgement)\b/i,
  /\b(ofsted|siams|inspection)\s+(grade|outcome|judgement)\s+(is|will be|predicted)\b/i,
  /\bcertified\s+compliant\b/i,
  /\bguaranteed\s+(compliance|inspection|ofsted|siams)\b/i,
  /\bautomatically\s+(approve|reject|submit|send|exclude|admit|discipline|grade|certify)\b/i,
] as const;

export type RestrictedDecisionArea =
  (typeof RESTRICTED_DECISION_AREAS)[number];

export type ApprovedAiUseCase = (typeof APPROVED_AI_USE_CASES)[number];

export type SensitiveAiDataCategory =
  (typeof SENSITIVE_AI_DATA_CATEGORIES)[number];

export interface AiGovernanceCopyViolation {
  pattern: string;
  matchedText: string;
}

export function isRestrictedDecisionArea(
  area: string,
): area is RestrictedDecisionArea {
  return RESTRICTED_DECISION_AREAS.includes(
    area.toLowerCase() as RestrictedDecisionArea,
  );
}

export function isApprovedAiUseCase(
  useCase: string,
): useCase is ApprovedAiUseCase {
  return APPROVED_AI_USE_CASES.includes(
    useCase.toLowerCase() as ApprovedAiUseCase,
  );
}

export function validateAiGovernanceCopy(
  copy: string,
): AiGovernanceCopyViolation[] {
  return PROHIBITED_COPY_PATTERNS.flatMap((pattern) => {
    const match = copy.match(pattern);
    if (!match) return [];

    return [
      {
        pattern: pattern.source,
        matchedText: match[0],
      },
    ];
  });
}

export function hasProhibitedAiClaim(copy: string): boolean {
  return validateAiGovernanceCopy(copy).length > 0;
}
