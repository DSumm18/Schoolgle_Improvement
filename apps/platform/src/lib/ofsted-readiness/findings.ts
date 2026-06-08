import type { ActionForm, TaskPriority } from "@/lib/tasks/types";

export type OfstedFindingSourceType =
  | "website_scan"
  | "drive_scan"
  | "document_inspection"
  | "manual_review"
  | "rules_update"
  | "dfe_public_data"
  | "school_assessment_capture"
  | "ctf_pupil_layer"
  | "assessment_creator"
  | "school_improvement_signal";

export type OfstedFindingType =
  | "missing"
  | "outdated"
  | "red_flag"
  | "quality_gap"
  | "improvement";

export type OfstedFindingSeverity = "critical" | "high" | "medium" | "low";

export type OfstedFindingActionLevel =
  | "required_action"
  | "recommended_action"
  | "suggested_improvement"
  | "information_only";

export type OfstedFindingStatus =
  | "identified"
  | "acknowledged"
  | "assigned"
  | "in_progress"
  | "completed"
  | "verification_required"
  | "verified"
  | "recurring"
  | "dismissed";

export interface WebsiteFindingAssessmentInput {
  requirement_key: string;
  requirement_name: string;
  category: string;
  status: "compliant" | "partial" | "not_found" | "outdated";
  compliance_score: number;
  quality_score: number;
  clarity_score: number;
  evidence_urls: string[];
  evidence_quotes: string[];
  gaps: string[];
  recommendations: string[];
  red_flags: string[];
  confidence: number;
}

export interface WebsiteFindingRequirementInput {
  key: string;
  name: string;
  severity: "statutory" | "recommended" | "good_practice";
  category: string;
  legislation: string[];
  updateFrequency: string;
  ofstedCategory?: string;
  ofstedSubcategory?: string;
}

export interface WebsiteFindingDraft {
  source_key: string;
  source_type: OfstedFindingSourceType;
  source_scan_id: string | null;
  framework_type: "ofsted";
  category_id: string | null;
  subcategory_id: string | null;
  rule_key: string;
  rule_version: string;
  rule_source: string[];
  title: string;
  summary: string;
  finding_type: OfstedFindingType;
  severity: OfstedFindingSeverity;
  action_level: OfstedFindingActionLevel;
  status: OfstedFindingStatus;
  score: number;
  confidence: number;
  evidence_url: string | null;
  evidence_quotes: string[];
  gaps: string[];
  recommendations: string[];
  red_flags: string[];
  checklist: string[];
  recommended_task_title: string;
  recommended_task_description: string;
  metadata: Record<string, unknown>;
}

export interface DocumentInspectionDetail {
  rating?:
    | "exceptional"
    | "strong_standard"
    | "expected_standard"
    | "needs_attention"
    | "urgent_improvement";
  verdict?:
    | "meets_requirements"
    | "partially_meets"
    | "does_not_meet"
    | "cannot_assess";
  confidence?: "high" | "medium" | "low";
  summary?: string;
  date_check?: {
    review_date_found?: boolean;
    is_current?: boolean;
    date_found?: string | null;
    note?: string;
  };
  legislation_check?: {
    references_current?: boolean;
    legislation_found?: string[];
    missing_references?: string[];
  };
  checkpoint_results?: Array<{
    checkpoint: string;
    met: boolean;
    evidence?: string;
    severity?: "critical" | "important" | "minor";
  }>;
  content_checks?: Array<{
    requirement: string;
    met: boolean;
    evidence?: string;
  }>;
  red_flags?: string[];
  strengths?: string[];
  actions_required?: Array<{
    action: string;
    priority: "urgent" | "high" | "medium" | "low";
    rationale?: string;
    sef_impact?: string;
  }>;
  actions?: string[];
  sef_contribution?: string;
  extraction?: Record<string, unknown>;
}

export interface DocumentInspectionFindingInput {
  checkId: string;
  driveFileId: string;
  fileName: string;
  evaluationArea: string;
  expectedDocument: string;
  foundModifiedAt?: string | null;
  inspection: DocumentInspectionDetail;
}

export interface OfstedFindingTaskInput {
  id: string;
  title: string;
  recommended_task_title?: string | null;
  recommended_task_description?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  severity: OfstedFindingSeverity;
  checklist?: string[] | null;
  evidence_url?: string | null;
}

const CURRENT_RULE_VERSION = "2026.04";

export function buildWebsiteFindingSourceKey(
  sessionId: string,
  requirementKey: string,
): string {
  return `website_scan:${sessionId}:${requirementKey}`;
}

export function buildWebsiteFindingDraft(input: {
  sessionId: string;
  assessment: WebsiteFindingAssessmentInput;
  requirement: WebsiteFindingRequirementInput;
}): WebsiteFindingDraft | null {
  const { sessionId, assessment, requirement } = input;
  const findingType = classifyFindingType(assessment);

  if (!findingType) return null;

  const actionLevel = classifyActionLevel(assessment, requirement, findingType);
  const severity = classifySeverity(assessment, requirement, findingType);
  const title = buildTitle(assessment.requirement_name, findingType);
  const recommendedTaskTitle = buildRecommendedTaskTitle(
    assessment.requirement_name,
    findingType,
  );
  const checklist = [
    ...assessment.recommendations,
    ...assessment.gaps.map((gap) => `Resolve: ${gap}`),
    ...assessment.red_flags.map((flag) => `Address red flag: ${flag}`),
  ];

  return {
    source_key: buildWebsiteFindingSourceKey(
      sessionId,
      assessment.requirement_key,
    ),
    source_type: "website_scan",
    source_scan_id: sessionId,
    framework_type: "ofsted",
    category_id: requirement.ofstedCategory || null,
    subcategory_id: requirement.ofstedSubcategory || null,
    rule_key: requirement.key,
    rule_version: CURRENT_RULE_VERSION,
    rule_source: requirement.legislation,
    title,
    summary: buildSummary(assessment),
    finding_type: findingType,
    severity,
    action_level: actionLevel,
    status: "identified",
    score: assessment.compliance_score,
    confidence: assessment.confidence,
    evidence_url: assessment.evidence_urls[0] || null,
    evidence_quotes: assessment.evidence_quotes,
    gaps: assessment.gaps,
    recommendations: assessment.recommendations,
    red_flags: assessment.red_flags,
    checklist: checklist.length > 0 ? checklist : [recommendedTaskTitle],
    recommended_task_title: recommendedTaskTitle,
    recommended_task_description: buildRecommendedTaskDescription(
      assessment,
      requirement,
    ),
    metadata: {
      websiteRequirementCategory: assessment.category,
      websiteRequirementStatus: assessment.status,
      qualityScore: assessment.quality_score,
      clarityScore: assessment.clarity_score,
      updateFrequency: requirement.updateFrequency,
    },
  };
}

export function buildActionFormFromFinding(
  finding: OfstedFindingTaskInput,
): ActionForm {
  return {
    title: finding.recommended_task_title || finding.title,
    description:
      finding.recommended_task_description ||
      "Review this Ofsted readiness finding and update the evidence record.",
    category_id: finding.category_id || undefined,
    subcategory_id: finding.subcategory_id || undefined,
    module: "ofsted-readiness",
    task_type: "ofsted",
    priority: mapFindingSeverityToTaskPriority(finding.severity),
    status: "not_started",
    checklist: (finding.checklist || []).map((title) => ({ title })),
    linked_evidence: finding.evidence_url
      ? [
          {
            type: "url",
            title: "Source evidence",
            url: finding.evidence_url,
          },
        ]
      : [],
    framework_type: "ofsted",
    source: "ofsted_finding",
    route_path: `/dashboard/ofsted-readiness?findingId=${finding.id}`,
    source_record_id: finding.id,
    source_table_name: "ofsted_findings",
    created_from_finding_id: finding.id,
  };
}

export function buildDocumentInspectionFindingSourceKey(checkId: string): string {
  return `document_inspection:${checkId}`;
}

export function buildDocumentInspectionFindingDraft(
  input: DocumentInspectionFindingInput,
): WebsiteFindingDraft | null {
  const inspection = input.inspection;
  const rating = normaliseInspectionRating(inspection);
  const actions = normaliseInspectionActions(inspection);
  const redFlags = inspection.red_flags || [];
  const gaps = buildDocumentInspectionGaps(inspection);
  const findingType = classifyDocumentFindingType(inspection, rating, gaps);

  if (!findingType) return null;

  const severity = classifyDocumentSeverity(rating, findingType, actions, redFlags);
  const actionLevel = classifyDocumentActionLevel(
    input.evaluationArea,
    findingType,
    severity,
  );
  const evidenceUrl = buildDriveEvidenceUrl(input.driveFileId);
  const primaryAction =
    actions[0]?.action ||
    gaps[0] ||
    `Review ${input.fileName} against the ${input.evaluationArea} evidence expectation.`;
  const checklist = [
    ...actions.map((action) => action.action),
    ...gaps.map((gap) => `Check: ${gap}`),
    ...redFlags.map((flag) => `Resolve: ${flag}`),
  ];

  return {
    source_key: buildDocumentInspectionFindingSourceKey(input.checkId),
    source_type: "document_inspection",
    source_scan_id: null,
    framework_type: "ofsted",
    category_id: mapEvaluationAreaToCategory(input.evaluationArea),
    subcategory_id: null,
    rule_key: buildDocumentRuleKey(input.evaluationArea, input.expectedDocument),
    rule_version: CURRENT_RULE_VERSION,
    rule_source: [
      "Schoolgle Ofsted document inspection rubric",
      "Ofsted Education Inspection Framework 2025",
    ],
    title: buildDocumentFindingTitle(input.fileName, findingType),
    summary:
      inspection.summary ||
      `${input.fileName} needs review before it is used as Ofsted readiness evidence.`,
    finding_type: findingType,
    severity,
    action_level: actionLevel,
    status: "identified",
    score: ratingToScore(rating),
    confidence: confidenceToNumber(inspection.confidence),
    evidence_url: evidenceUrl,
    evidence_quotes: extractEvidenceQuotes(inspection),
    gaps,
    recommendations: actions.map((action) => action.action),
    red_flags: redFlags,
    checklist: checklist.length > 0 ? checklist : [primaryAction],
    recommended_task_title: buildDocumentRecommendedTaskTitle(
      input.fileName,
      primaryAction,
      findingType,
    ),
    recommended_task_description: buildDocumentRecommendedTaskDescription({
      fileName: input.fileName,
      evaluationArea: input.evaluationArea,
      expectedDocument: input.expectedDocument,
      summary: inspection.summary,
      evidenceUrl,
      actions,
      gaps,
      redFlags,
    }),
    metadata: {
      driveFileId: input.driveFileId,
      fileName: input.fileName,
      evaluationArea: input.evaluationArea,
      expectedDocument: input.expectedDocument,
      foundModifiedAt: input.foundModifiedAt || null,
      inspectionRating: rating,
      extraction: inspection.extraction || null,
      dateCheck: inspection.date_check || null,
      legislationCheck: inspection.legislation_check || null,
      sefContribution: inspection.sef_contribution || null,
    },
  };
}

function classifyFindingType(
  assessment: WebsiteFindingAssessmentInput,
): OfstedFindingType | null {
  if (assessment.status === "not_found") return "missing";
  if (assessment.status === "outdated") return "outdated";
  if (assessment.red_flags.length > 0) return "red_flag";
  if (
    assessment.status === "partial" ||
    assessment.compliance_score < 70 ||
    assessment.quality_score > 0 && assessment.quality_score < 3
  ) {
    return "quality_gap";
  }
  if (assessment.recommendations.length > 0 && assessment.compliance_score < 95) {
    return "improvement";
  }
  return null;
}

function normaliseInspectionRating(
  inspection: DocumentInspectionDetail,
): NonNullable<DocumentInspectionDetail["rating"]> {
  if (inspection.rating) return inspection.rating;
  const verdictMap: Record<string, NonNullable<DocumentInspectionDetail["rating"]>> = {
    meets_requirements: "strong_standard",
    partially_meets: "expected_standard",
    does_not_meet: "needs_attention",
    cannot_assess: "needs_attention",
  };
  return verdictMap[inspection.verdict || ""] || "needs_attention";
}

function normaliseInspectionActions(
  inspection: DocumentInspectionDetail,
): NonNullable<DocumentInspectionDetail["actions_required"]> {
  if (inspection.actions_required?.length) return inspection.actions_required;
  return (inspection.actions || []).map((action) => ({
    action,
    priority: "medium" as const,
    rationale: "Identified during document inspection",
    sef_impact: "Should be addressed in the Ofsted readiness evidence trail",
  }));
}

function buildDocumentInspectionGaps(
  inspection: DocumentInspectionDetail,
): string[] {
  const gaps: string[] = [];

  for (const checkpoint of inspection.checkpoint_results || []) {
    if (checkpoint.met) continue;
    gaps.push(
      checkpoint.evidence
        ? `${checkpoint.checkpoint}: ${checkpoint.evidence}`
        : checkpoint.checkpoint,
    );
  }

  for (const check of inspection.content_checks || []) {
    if (check.met) continue;
    gaps.push(
      check.evidence
        ? `${check.requirement}: ${check.evidence}`
        : check.requirement,
    );
  }

  if (inspection.date_check?.is_current === false) {
    gaps.push(inspection.date_check.note || "Review date appears to be out of date");
  }

  for (const missingReference of
    inspection.legislation_check?.missing_references || []) {
    gaps.push(`Missing current guidance reference: ${missingReference}`);
  }

  return Array.from(new Set(gaps.filter(Boolean)));
}

function classifyDocumentFindingType(
  inspection: DocumentInspectionDetail,
  rating: NonNullable<DocumentInspectionDetail["rating"]>,
  gaps: string[],
): OfstedFindingType | null {
  if (rating === "urgent_improvement" || (inspection.red_flags || []).length > 0) {
    return "red_flag";
  }
  if (inspection.date_check?.is_current === false) return "outdated";
  if (rating === "needs_attention" || gaps.length > 0) return "quality_gap";
  if ((inspection.actions_required || inspection.actions || []).length > 0) {
    return "improvement";
  }
  return null;
}

function classifyDocumentSeverity(
  rating: NonNullable<DocumentInspectionDetail["rating"]>,
  findingType: OfstedFindingType,
  actions: NonNullable<DocumentInspectionDetail["actions_required"]>,
  redFlags: string[],
): OfstedFindingSeverity {
  if (rating === "urgent_improvement") return "critical";
  if (redFlags.length > 0) return "high";
  if (findingType === "outdated") return "high";
  if (actions.some((action) => action.priority === "urgent")) return "critical";
  if (actions.some((action) => action.priority === "high")) return "high";
  if (findingType === "quality_gap") return "medium";
  return "low";
}

function classifyDocumentActionLevel(
  evaluationArea: string,
  findingType: OfstedFindingType,
  severity: OfstedFindingSeverity,
): OfstedFindingActionLevel {
  if (
    severity === "critical" ||
    (findingType === "red_flag" && evaluationArea.toLowerCase() === "safeguarding")
  ) {
    return "required_action";
  }
  if (findingType === "red_flag" || findingType === "outdated") {
    return "recommended_action";
  }
  if (findingType === "quality_gap") return "recommended_action";
  return "suggested_improvement";
}

function buildDriveEvidenceUrl(driveFileId: string): string {
  return `https://drive.google.com/open?id=${encodeURIComponent(driveFileId)}`;
}

function mapEvaluationAreaToCategory(evaluationArea: string): string | null {
  const map: Record<string, string> = {
    Inclusion: "inclusion",
    "Curriculum and Teaching": "curriculum-teaching",
    Achievement: "achievement",
    "Attendance and Behaviour": "attendance-behaviour",
    "Personal Development and Well-being": "personal-development",
    "Leadership and Governance": "leadership-governance",
    Safeguarding: "safeguarding",
  };
  return map[evaluationArea] || null;
}

function buildDocumentRuleKey(
  evaluationArea: string,
  expectedDocument: string,
): string {
  const slug = `${evaluationArea}:${expectedDocument || "general"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `document_${slug || "inspection"}`;
}

function ratingToScore(
  rating: NonNullable<DocumentInspectionDetail["rating"]>,
): number {
  const scores: Record<NonNullable<DocumentInspectionDetail["rating"]>, number> = {
    exceptional: 100,
    strong_standard: 85,
    expected_standard: 72,
    needs_attention: 50,
    urgent_improvement: 20,
  };
  return scores[rating];
}

function confidenceToNumber(
  confidence: DocumentInspectionDetail["confidence"],
): number {
  if (confidence === "high") return 0.85;
  if (confidence === "low") return 0.4;
  return 0.65;
}

function extractEvidenceQuotes(inspection: DocumentInspectionDetail): string[] {
  return (inspection.checkpoint_results || [])
    .map((checkpoint) => checkpoint.evidence)
    .filter((evidence): evidence is string => Boolean(evidence))
    .slice(0, 5);
}

function buildDocumentFindingTitle(
  fileName: string,
  findingType: OfstedFindingType,
): string {
  switch (findingType) {
    case "red_flag":
      return `Resolve: ${fileName}`;
    case "outdated":
      return `Review date: ${fileName}`;
    case "quality_gap":
      return `Improve: ${fileName}`;
    case "improvement":
      return `Strengthen: ${fileName}`;
    case "missing":
      return `Missing: ${fileName}`;
  }
}

function buildDocumentRecommendedTaskTitle(
  fileName: string,
  primaryAction: string,
  findingType: OfstedFindingType,
): string {
  if (primaryAction.length <= 90) return primaryAction;
  if (findingType === "outdated") return `Review and update ${fileName}`;
  if (findingType === "red_flag") return `Resolve readiness concern in ${fileName}`;
  return `Improve ${fileName} for Ofsted readiness`;
}

function buildDocumentRecommendedTaskDescription(input: {
  fileName: string;
  evaluationArea: string;
  expectedDocument: string;
  summary?: string;
  evidenceUrl: string;
  actions: NonNullable<DocumentInspectionDetail["actions_required"]>;
  gaps: string[];
  redFlags: string[];
}): string {
  const issue =
    input.summary ||
    input.redFlags[0] ||
    input.gaps[0] ||
    "The document needs review before it is used as inspection evidence.";
  const action = input.actions[0]?.action || "Review and strengthen the document.";

  return [
    issue,
    `Area: ${input.evaluationArea}.`,
    input.expectedDocument
      ? `Matched evidence expectation: ${input.expectedDocument}.`
      : null,
    `Recommended next step: ${action}`,
    `Evidence link: ${input.evidenceUrl}`,
    "This was generated from a connected Drive document inspection and should be reviewed by a leader before assignment.",
  ]
    .filter(Boolean)
    .join(" ");
}

function mapFindingSeverityToTaskPriority(
  severity: OfstedFindingSeverity,
): TaskPriority {
  return severity;
}

function classifyActionLevel(
  assessment: WebsiteFindingAssessmentInput,
  requirement: WebsiteFindingRequirementInput,
  findingType: OfstedFindingType,
): OfstedFindingActionLevel {
  if (
    findingType === "missing" ||
    findingType === "outdated" ||
    findingType === "red_flag"
  ) {
    return requirement.severity === "statutory"
      ? "required_action"
      : "recommended_action";
  }

  if (findingType === "quality_gap") return "recommended_action";
  if (assessment.recommendations.length > 0) return "suggested_improvement";
  return "information_only";
}

function classifySeverity(
  assessment: WebsiteFindingAssessmentInput,
  requirement: WebsiteFindingRequirementInput,
  findingType: OfstedFindingType,
): OfstedFindingSeverity {
  if (requirement.severity === "statutory" && findingType === "missing") {
    return "critical";
  }
  if (findingType === "red_flag" || findingType === "outdated") return "high";
  if (findingType === "quality_gap") {
    if (requirement.severity === "statutory" && assessment.compliance_score < 70) {
      return "high";
    }
    return assessment.compliance_score < 50 ? "high" : "medium";
  }
  return "low";
}

function buildTitle(requirementName: string, findingType: OfstedFindingType) {
  switch (findingType) {
    case "missing":
      return `Missing: ${requirementName}`;
    case "outdated":
      return `Outdated: ${requirementName}`;
    case "red_flag":
      return `Red flag: ${requirementName}`;
    case "quality_gap":
      return `Improve: ${requirementName}`;
    case "improvement":
      return `Strengthen: ${requirementName}`;
  }
}

function buildRecommendedTaskTitle(
  requirementName: string,
  findingType: OfstedFindingType,
) {
  switch (findingType) {
    case "missing":
      return `Publish or link ${requirementName}`;
    case "outdated":
      return `Review and update ${requirementName}`;
    case "red_flag":
      return `Resolve red flags in ${requirementName}`;
    case "quality_gap":
      return `Improve ${requirementName} for Ofsted readiness`;
    case "improvement":
      return `Strengthen ${requirementName}`;
  }
}

function buildSummary(assessment: WebsiteFindingAssessmentInput): string {
  const primaryIssue =
    assessment.red_flags[0] || assessment.gaps[0] || assessment.recommendations[0];
  return primaryIssue || `${assessment.requirement_name} needs review.`;
}

function buildRecommendedTaskDescription(
  assessment: WebsiteFindingAssessmentInput,
  requirement: WebsiteFindingRequirementInput,
): string {
  const source = requirement.legislation.length
    ? `Source guidance: ${requirement.legislation.join("; ")}.`
    : "Source guidance is recorded in the Ofsted rules library.";
  const issue = buildSummary(assessment);
  return `${issue} ${source} This task was generated from an Ofsted readiness website scan and should be reviewed before assignment.`;
}
