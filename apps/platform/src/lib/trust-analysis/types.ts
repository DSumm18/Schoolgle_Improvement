// ─── School Constants ────────────────────────────────────────────────

export interface PennineSchool {
  abbrev: string;
  name: string;
  urn: number;
  nor: number;
  fsmPct: number;
  ealPct: number;
}

export const PENNINE_SCHOOLS: PennineSchool[] = [
  { abbrev: 'CVPS', name: 'Clayton Village Primary School', urn: 148869, nor: 193, fsmPct: 15.0, ealPct: 12.4 },
  { abbrev: 'CHPS', name: 'Crossley Hall Primary School', urn: 146581, nor: 676, fsmPct: 29.6, ealPct: 76.2 },
  { abbrev: 'FPS',  name: 'Farnham Primary School', urn: 144862, nor: 449, fsmPct: 25.8, ealPct: 85.1 },
  { abbrev: 'GHPS', name: 'Grove House Primary School', urn: 148201, nor: 417, fsmPct: 27.3, ealPct: 39.8 },
  { abbrev: 'HPS',  name: 'Hollingwood Primary School', urn: 144860, nor: 482, fsmPct: 25.9, ealPct: 55.8 },
  { abbrev: 'LPS',  name: 'Laycock Primary School', urn: 144861, nor: 88, fsmPct: 47.7, ealPct: 5.7 },
  { abbrev: 'LGPS', name: 'Lidget Green Primary School', urn: 150016, nor: 516, fsmPct: 34.9, ealPct: 73.3 },
];

export const PENNINE_URNS = PENNINE_SCHOOLS.map(s => s.urn);

export function getSchoolByUrn(urn: number): PennineSchool | undefined {
  return PENNINE_SCHOOLS.find(s => s.urn === urn);
}

export function getSchoolByAbbrev(abbrev: string): PennineSchool | undefined {
  return PENNINE_SCHOOLS.find(s => s.abbrev === abbrev);
}

// ─── Year Groups ─────────────────────────────────────────────────────

export type YearGroup = 'EYFS' | 'Y1' | 'Y2' | 'Y3' | 'Y4' | 'Y5' | 'Y6';
export const YEAR_GROUPS: YearGroup[] = ['EYFS', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'];

export type Subject = 'Reading' | 'Writing' | 'Maths' | 'Combined' | 'Phonics' | 'MTC' | 'GLD';
export const CORE_SUBJECTS: Subject[] = ['Reading', 'Writing', 'Maths', 'Combined'];

// ─── Self-Reported Data (Layer 1) ────────────────────────────────────

export interface YearGroupData {
  yearGroup: YearGroup;
  cohortSize: number;
  allPupils: SubjectScores;
  fsm6: SubjectScores;
  nonFsm: SubjectScores;
  gd: SubjectScores;
  phonics?: number;
  mtc?: number;
  gld?: number;
}

export interface SubjectScores {
  reading: number | null;
  writing: number | null;
  maths: number | null;
  combined: number | null;
}

export interface SchoolSelfReport {
  school: string;
  yearGroups: YearGroupData[];
}

// ─── DfE Data (Layer 2) ─────────────────────────────────────────────

export interface KS2Result {
  urn: number;
  academicYearEnd: number;
  subject: string;
  breakdownTopic: string;
  breakdown: string;
  expectedStandardPct: number | null;
  higherStandardPct: number | null;
  averageScaledScore: number | null;
  progressMeasureScore: number | null;
}

export interface CensusRecord {
  urn: number;
  academicYearEnd: number;
  numberOnRoll: number;
  fsmPct: number | null;
  ealPct: number | null;
  senPct: number | null;
}

export interface DfEData {
  ks2Results: KS2Result[];
  census: CensusRecord[];
}

// ─── Analysis Types ──────────────────────────────────────────────────

export type RAGStatus = 'red' | 'amber' | 'green';

export interface DivergenceFlag {
  school: string;
  subject: string;
  selfReportedPct: number;
  validatedPct: number;
  divergencePp: number;
  rag: RAGStatus;
  narrative: string;
}

export interface DataQualityFlag {
  school: string;
  yearGroup: YearGroup;
  issue: string;
  severity: 'warning' | 'error';
}

export interface DisadvantageGap {
  school: string;
  subject: string;
  fsmPct: number | null;
  nonFsmPct: number | null;
  gapPp: number | null;
}

export interface SchoolNarrative {
  school: string;
  strengths: string[];
  concerns: string[];
  ofstedQuestions: string[];
  overallAssessment: string;
}

// ─── Cohort-Based Analysis Types ─────────────────────────────────────

/** Pipeline analysis: tracks a subject across year groups within a single school */
export interface PipelineTrajectory {
  school: string;
  subject: string;
  /** Year group data points ordered Y1→Y6 */
  points: { yearGroup: YearGroup; pct: number }[];
  /** Overall trend: positive = improving pipeline, negative = declining */
  trendPp: number;
  /** Year-on-year jumps that look implausible (>15pp in one year) */
  implausibleJumps: { from: YearGroup; to: YearGroup; jumpPp: number }[];
  rag: RAGStatus;
  narrative: string;
}

/** Track record: compares current Y6 self-report against school's KS2 history */
export interface TrackRecordFlag {
  school: string;
  subject: string;
  /** Current Y6 mid-year self-report */
  currentY6Pct: number;
  /** Best-ever KS2 result for this subject at this school */
  bestHistoricalPct: number;
  bestHistoricalYear: number;
  /** All historical KS2 results */
  history: { year: number; pct: number }[];
  /** How far above/below best-ever result */
  vsHistoryPp: number;
  rag: RAGStatus;
  narrative: string;
}

/** KS2 progress measures — genuine cohort-based school quality indicator */
export interface ProgressMeasure {
  school: string;
  subject: string;
  year: number;
  score: number;
  /** Positive = school adds value, negative = school loses value */
  interpretation: string;
}

/** Predicted KS2 outcome based on current pipeline */
export interface PipelinePrediction {
  school: string;
  /** Current Y5 data predicts next year's Y6 */
  currentY5Combined: number | null;
  /** Current Y6 mid-year predicts this year's KS2 */
  currentY6Combined: number | null;
  /** Last validated KS2 combined */
  lastKs2Combined: number | null;
  lastKs2Year: number | null;
  narrative: string;
}
