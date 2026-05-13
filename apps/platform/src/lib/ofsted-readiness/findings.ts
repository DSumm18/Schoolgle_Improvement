import type { ActionForm, TaskPriority } from "@/lib/tasks/types";

export type OfstedFindingSourceType =
  | "website_scan"
  | "drive_scan"
  | "document_inspection"
  | "manual_review"
  | "rules_update";

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
  source_scan_id: string;
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
