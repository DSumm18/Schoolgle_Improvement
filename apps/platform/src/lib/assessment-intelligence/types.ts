export type AssessmentSourceKind =
  | "manual_snapshot"
  | "assessment_creator"
  | "ctf_import"
  | "mis_import"
  | "spreadsheet_import"
  | "lesson_studio"
  | "dfe_validated";

export type AssessmentValidationTier =
  | "teacher_locked"
  | "teacher_reviewed_ai"
  | "imported_external"
  | "dfe_validated"
  | "draft";

export type AssessmentSubject = "reading" | "writing" | "maths" | "science" | "spag";

export type CanonicalAssessmentLevel =
  | "below_expected"
  | "working_towards"
  | "expected"
  | "greater_depth"
  | "unknown";

export type EvidenceConfidence = "high" | "medium" | "low" | "mismatch";

export type ModerationStatus =
  | "not_moderated"
  | "needs_moderation"
  | "moderated"
  | "challenged"
  | "confirmed";

export interface NormalisedAssessmentLevel {
  rawLevel: string;
  canonicalLevel: CanonicalAssessmentLevel;
  isAtExpected: boolean;
  isGreaterDepth: boolean;
}

export interface AssessmentSourceLabelInput {
  sourceKind: AssessmentSourceKind;
  assessmentPeriod: string;
  academicYearStart: number;
  validationTier: AssessmentValidationTier;
}

export interface ManualSnapshotRowInput {
  pupilHash: string;
  yearGroupAtAssessment: string;
  rawLevel: string;
  teacherComment?: string | null;
  voiceTranscript?: string | null;
  uncertaintyFlag?: boolean;
}

export interface ManualSnapshotInput {
  organizationId: string;
  schoolUrn: number | null;
  sourceBatchId: string;
  classId: string;
  className: string;
  subject: AssessmentSubject;
  assessmentPeriod: string;
  academicYearStart: number;
  assessmentDate: string;
  lockedBy: string;
  rows: ManualSnapshotRowInput[];
}

export interface PupilAssessmentEvent {
  organizationId: string;
  schoolUrn: number | null;
  sourceBatchId: string;
  sourceKind: AssessmentSourceKind;
  sourceLabel: string;
  validationTier: AssessmentValidationTier;
  pupilHash: string;
  classId: string;
  className: string;
  yearGroupAtAssessment: string;
  academicYearStart: number;
  assessmentPeriod: string;
  assessmentDate: string;
  subject: AssessmentSubject;
  rawLevel: string;
  canonicalLevel: CanonicalAssessmentLevel;
  isAtExpected: boolean;
  isGreaterDepth: boolean;
  teacherComment: string | null;
  voiceTranscript: string | null;
  uncertaintyFlag: boolean;
  moderationStatus: ModerationStatus;
  evidenceConfidence: EvidenceConfidence;
  lockedBy: string;
}

export interface CombinedRwmInput {
  pupilHash: string;
  subject: "reading" | "writing" | "maths";
  isAtExpected: boolean;
}

export interface CombinedRwmResult {
  denominator: number;
  combinedCount: number;
  combinedPct: number | null;
  excludedIncompletePupils: number;
}
