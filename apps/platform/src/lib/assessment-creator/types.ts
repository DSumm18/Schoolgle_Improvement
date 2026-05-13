export type AssessmentMode = "quick_check" | "unit_check" | "retention_check" | "statutory_readiness";

export type AssessmentStatus =
  | "draft"
  | "blueprint_review"
  | "generated"
  | "changes_requested"
  | "approved"
  | "locked"
  | "scan_uploaded"
  | "marking_review"
  | "reviewed"
  | "archived";

export type EvidenceConfidence = "high" | "medium" | "low" | "mismatch";
export type AssessmentSubject = "reading" | "writing" | "maths" | "science" | "spag";
export type AssessmentYearGroup = "EYFS" | "Year 1" | "Year 2" | "Year 3" | "Year 4" | "Year 5" | "Year 6";
export type AssessmentTerm = "Autumn 1" | "Autumn 2" | "Spring 1" | "Spring 2" | "Summer 1" | "Summer 2";

export interface CurriculumSchemeRef {
  id: string;
  name: string;
  provider: string;
  source: "school_uploaded" | "public_framework" | "sample_pack";
  status: "active" | "sample" | "needs_mapping";
  coverageNote: string;
}

export interface AssessmentBlend {
  taughtCurriculum: number;
  nationalExpectation: number;
  retention: number;
  statutoryReadiness: number;
}

export interface CurriculumObjective {
  id: string;
  label: string;
  strand: string;
  source: "school_curriculum" | "national_curriculum" | "prior_learning" | "statutory_readiness";
  yearGroup: string;
}

export interface AssessmentBlueprint {
  id: string;
  organizationId: string;
  schoolId: string;
  classId: string;
  subject: AssessmentSubject;
  yearGroup: AssessmentYearGroup;
  term: AssessmentTerm;
  mode: AssessmentMode;
  curriculumScheme: CurriculumSchemeRef;
  status: AssessmentStatus;
  durationMinutes: number;
  blend: AssessmentBlend;
  objectives: CurriculumObjective[];
  pressureRating: 1 | 2 | 3 | 4 | 5;
  workloadRating: 1 | 2 | 3 | 4 | 5;
  warnings: string[];
  createdAt: string;
  approvedAt: string | null;
}

export interface StructuredMarkScheme {
  correctAnswer: string;
  acceptedAnswers: string[];
  partialCreditRules: Array<{ label: string; marks: number; pattern: string }>;
  commonMisconceptions: Array<{ tag: string; description: string; feedbackPrompt: string }>;
}

export interface PaperQuestion {
  id: string;
  assessmentId: string;
  number: number;
  prompt: string;
  marks: number;
  objectiveId: string;
  answerType: "multiple_choice" | "short_answer" | "working_out" | "extended_response";
  choices?: Array<{ label: string; text: string }>;
  misconceptionTags: string[];
  markScheme: StructuredMarkScheme;
}

export interface AssessmentPupilPass {
  pupilHash: string;
  displayLabel: string;
  passCodename: string;
  passRoute: string;
  pages: Array<{ pageNumber: number; qrPayload: string }>;
}

export interface ScanPageMatch {
  pageId: string;
  scanBatchId: string;
  assessmentId: string;
  pupilHash: string;
  pageNumber: number;
  matchConfidence: number;
  status: "matched" | "needs_review" | "unmatched";
}

export interface MarkingProposal {
  id: string;
  questionId: string;
  pupilHash: string;
  proposedMarks: number;
  maxMarks: number;
  confidence: number;
  rationale: string;
  misconceptionTag: string | null;
  teacherDecision: "pending" | "accepted" | "edited" | "rejected";
  teacherMarks: number | null;
}

export interface EvidencePassport {
  id: string;
  assessmentId: string;
  organizationId: string;
  schoolId: string;
  classId: string;
  subject: AssessmentSubject;
  yearGroup: AssessmentYearGroup;
  evidenceConfidence: EvidenceConfidence;
  confidenceReasons: string[];
  objectiveCoverage: number;
  markingReviewCompletion: number;
  unresolvedUncertainty: number;
  nextTeachingActions: string[];
}
