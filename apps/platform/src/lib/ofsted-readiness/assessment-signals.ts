import type { AssessmentSourceKind } from "@/lib/assessment-intelligence/types";
import type {
  OfstedFindingSeverity,
  OfstedFindingSourceType,
  WebsiteFindingDraft,
} from "./findings";

export interface AssessmentSignalSnapshot {
  batchId: string;
  sourceKind: AssessmentSourceKind;
  sourceLabel: string;
  assessmentPeriod: string;
  academicYearStart: number;
  subject: string | null;
  eventCount: number;
  atExpectedPct: number | null;
  needsModerationCount: number;
  isDemo?: boolean;
}

export function buildAssessmentSnapshotFindingDrafts(input: {
  organizationId: string;
  snapshots: AssessmentSignalSnapshot[];
}): WebsiteFindingDraft[] {
  return input.snapshots.flatMap((snapshot) => {
    const findings: WebsiteFindingDraft[] = [];

    if (snapshot.atExpectedPct !== null && snapshot.atExpectedPct < 60) {
      findings.push(buildAttainmentFinding(input.organizationId, snapshot));
    }

    if (snapshot.needsModerationCount > 0) {
      findings.push(buildModerationFinding(input.organizationId, snapshot));
    }

    return findings;
  });
}

function buildAttainmentFinding(
  organizationId: string,
  snapshot: AssessmentSignalSnapshot,
): WebsiteFindingDraft {
  const subjectLabel = snapshot.subject ?? "assessment";
  const severity = snapshot.atExpectedPct !== null && snapshot.atExpectedPct < 50 ? "high" : "medium";

  return {
    source_key: `assessment_signal:${organizationId}:${snapshot.batchId}:attainment`,
    source_type: mapSourceKindToFindingSourceType(snapshot.sourceKind),
    source_scan_id: null,
    framework_type: "ofsted",
    category_id: "achievement",
    subcategory_id: null,
    rule_key: "assessment-intelligence.low-attainment-signal",
    rule_version: "2026.05",
    rule_source: [
      "Schoolgle Assessment Intelligence Spine",
      "Ofsted readiness evidence conversation rule",
    ],
    title: `Review ${subjectLabel} assessment signal before Ofsted readiness review`,
    summary:
      `${snapshot.sourceLabel} shows ${snapshot.atExpectedPct}% at expected+ across ${snapshot.eventCount} pupil assessment event${snapshot.eventCount === 1 ? "" : "s"}. ` +
      "This is school assessment evidence, not DfE validated public outcomes, so leaders should triangulate it with books, curriculum evidence, intervention records and pupil voice.",
    finding_type: "quality_gap",
    severity,
    action_level: "recommended_action",
    status: "identified",
    score: snapshot.atExpectedPct ?? 0,
    confidence: 0.75,
    evidence_url: `/dashboard/school-improvement/trust-assessor?assessmentBatchId=${snapshot.batchId}`,
    evidence_quotes: [snapshot.sourceLabel],
    gaps: [
      `${subjectLabel} snapshot is below the 60% expected+ review threshold used for Ofsted readiness triage.`,
    ],
    recommendations: [
      "Check whether the cohort pattern is already explained in the SEF, school improvement plan or intervention records.",
      "Attach book scrutiny, pupil voice, curriculum monitoring and provision evidence where leaders can evidence the response.",
    ],
    red_flags: [],
    checklist: [
      "Confirm the assessment source and date with the assessment lead.",
      "Triangulate the signal with curriculum and teaching evidence.",
      "Record the leadership response and next review point in Ofsted Readiness.",
    ],
    recommended_task_title: `Review ${subjectLabel} assessment evidence for Ofsted readiness`,
    recommended_task_description:
      `Use ${snapshot.sourceLabel} as the starting point. Confirm whether the signal is understood, evidenced and followed up through the school improvement cycle.`,
    metadata: buildSignalMetadata(snapshot),
  };
}

function buildModerationFinding(
  organizationId: string,
  snapshot: AssessmentSignalSnapshot,
): WebsiteFindingDraft {
  const sourceType = mapSourceKindToFindingSourceType(snapshot.sourceKind);
  const isAssessmentCreator = sourceType === "assessment_creator";
  const subjectLabel = snapshot.subject ?? "assessment";
  const severity: OfstedFindingSeverity =
    snapshot.needsModerationCount >= 10 ? "high" : "medium";

  return {
    source_key: `assessment_signal:${organizationId}:${snapshot.batchId}:moderation`,
    source_type: sourceType,
    source_scan_id: null,
    framework_type: "ofsted",
    category_id: "curriculum-teaching",
    subcategory_id: null,
    rule_key: "assessment-intelligence.moderation-flags",
    rule_version: "2026.05",
    rule_source: [
      "Schoolgle Assessment Intelligence Spine",
      isAssessmentCreator ? "Assessment Creator teacher approval workflow" : "Teacher-locked assessment capture workflow",
    ],
    title: `Review ${subjectLabel} assessment moderation flags`,
    summary:
      `${snapshot.needsModerationCount} judgement${snapshot.needsModerationCount === 1 ? "" : "s"} in ${snapshot.sourceLabel} were flagged for moderation. ` +
      "This should be treated as a quality assurance prompt, not a compliance failure.",
    finding_type: "quality_gap",
    severity,
    action_level: "recommended_action",
    status: "identified",
    score: Math.max(0, 100 - snapshot.needsModerationCount * 5),
    confidence: 0.8,
    evidence_url: `/dashboard/school-improvement/trust-assessor?assessmentBatchId=${snapshot.batchId}`,
    evidence_quotes: [snapshot.sourceLabel],
    gaps: [
      `${snapshot.needsModerationCount} teacher judgement${snapshot.needsModerationCount === 1 ? "" : "s"} need moderation or confirmation.`,
    ],
    recommendations: [
      "Ask the subject lead to review the flagged judgements and capture the moderation outcome.",
      "Keep the final judgement trail visible so Ofsted can see how leaders assure assessment quality.",
    ],
    red_flags: [],
    checklist: [
      "Review every flagged judgement.",
      "Record moderation outcome and owner.",
      "Link final evidence back to Ofsted Readiness.",
    ],
    recommended_task_title: isAssessmentCreator
      ? "Review Assessment Creator moderation flags"
      : `Review ${subjectLabel} moderation flags`,
    recommended_task_description:
      `Use ${snapshot.sourceLabel} to confirm the flagged judgements and evidence the moderation response.`,
    metadata: buildSignalMetadata(snapshot),
  };
}

function buildSignalMetadata(snapshot: AssessmentSignalSnapshot): Record<string, unknown> {
  return {
    sourceKind: snapshot.sourceKind,
    sourceLayer: sourceKindToLayer(snapshot.sourceKind),
    assessmentBatchId: snapshot.batchId,
    assessmentPeriod: snapshot.assessmentPeriod,
    academicYearStart: snapshot.academicYearStart,
    subject: snapshot.subject,
    eventCount: snapshot.eventCount,
    atExpectedPct: snapshot.atExpectedPct,
    needsModerationCount: snapshot.needsModerationCount,
    isDemo: snapshot.isDemo === true,
  };
}

export function mapSourceKindToFindingSourceType(
  sourceKind: AssessmentSourceKind,
): OfstedFindingSourceType {
  if (sourceKind === "dfe_validated") return "dfe_public_data";
  if (sourceKind === "manual_snapshot" || sourceKind === "spreadsheet_import") {
    return "school_assessment_capture";
  }
  if (sourceKind === "assessment_creator") return "assessment_creator";
  if (sourceKind === "lesson_studio") return "school_improvement_signal";
  return "ctf_pupil_layer";
}

function sourceKindToLayer(sourceKind: AssessmentSourceKind): string {
  if (sourceKind === "dfe_validated") return "dfe_rear_view";
  if (sourceKind === "manual_snapshot" || sourceKind === "spreadsheet_import") return "school_capture";
  if (sourceKind === "assessment_creator" || sourceKind === "ctf_import" || sourceKind === "mis_import") {
    return "pupil_level";
  }
  return "ofsted_bridge";
}
