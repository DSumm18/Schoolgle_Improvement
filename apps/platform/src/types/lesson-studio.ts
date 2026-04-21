// ─── Lesson Studio — Type Definitions ────────────────────────────────────

export type KeyStage = "EYFS" | "KS1" | "KS2";
export type AttainmentLevel = "PKF" | "PKE" | "WTS" | "EXS" | "GDS";
export type EALStage = "A" | "B" | "C" | "D" | "E";
export type LessonStatus = "empty" | "draft" | "planned" | "taught" | "cancelled";
export type ResourceType = "worksheet" | "slides" | "starter" | "exit_ticket" | "quiz" | "uploaded" | "other";
export type ResourceSource = "ai_generated" | "uploaded" | "scheme_link";
export type DiffGroup = "all" | "deeper" | "core" | "scaffold" | "guided";
export type BehaviourCategory = "perseverance" | "collaboration" | "curiosity" | "kindness" | "focus" | "bravery";
export type QuizTheme = "farm" | "space" | "ocean" | "forest";
export type SENDNeed = "SPLD" | "MLD" | "SLD" | "PMLD" | "SEMH" | "SLCN" | "HI" | "VI" | "MSI" | "PD" | "ASD" | "OTH" | "NSA";
export type AccessibilityNeed = "dyslexia" | "visual_impairment" | "asd" | "adhd" | "sensory_processing" | "hearing_impairment" | "physical_disability";

// ─── Database Row Types ──────────────────────────────────────────────────

export interface LSClass {
  id: string;
  organization_id: string;
  year_group: string;
  class_name: string;
  key_stage: KeyStage;
  teacher_user_id: string | null;
  ta_user_id: string | null;
  room: string | null;
  pupil_count: number;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

export interface LSPupil {
  id: string;
  organization_id: string;
  class_id: string | null;
  pupil_ref: string;
  display_name_encrypted: string | null;
  year_group: string | null;
  gender: "M" | "F" | "O" | null;
  has_ehcp: boolean;
  has_send_support: boolean;
  send_primary_need: SENDNeed | null;
  is_pupil_premium: boolean;
  is_eal: boolean;
  eal_stage: EALStage | null;
  is_looked_after: boolean;
  accessibility_needs: AccessibilityNeed[];
  attainment_reading: AttainmentLevel | null;
  attainment_writing: AttainmentLevel | null;
  attainment_maths: AttainmentLevel | null;
  attainment_science: AttainmentLevel | null;
  lesson_attainment: Record<string, unknown>;
  resource_overrides: unknown[];
  created_at: string;
  updated_at: string;
}

export interface LSTimetableSlot {
  id: string;
  organization_id: string;
  class_id: string;
  day_of_week: number; // 1=Mon, 5=Fri
  start_time: string; // HH:MM
  end_time: string;
  subject: string;
  room: string | null;
  created_at: string;
}

export interface LSSchemeMapping {
  id: string;
  organization_id: string;
  class_id: string;
  subject: string;
  scheme_name: string;
  scheme_config: {
    current_unit?: string;
    current_step?: number;
  };
  created_at: string;
}

export interface LSSchemeStep {
  step: number;
  title: string;
  nc_codes: string[];
}

export interface LSSchemeProgression {
  id: string;
  scheme_name: string;
  subject: string;
  year_group: string;
  term: string;
  unit_name: string;
  unit_order: number;
  steps: LSSchemeStep[];
  nc_objective_codes: string[];
  methodology_notes: string | null;
  created_at: string;
}

// ─── Lesson Plan ─────────────────────────────────────────────────────────

export interface SecondarySubject {
  subject: string;
  ncCodes: string[];
  supportingFocus: string;
}

export interface PlanSection {
  phase: string;
  time: string;
  description: string;
  icon: string;
}

export interface DifferentiationGroup {
  name: string;
  pupils: string;
  description: string;
  resourceNotes: string;
}

export interface SENDAdaptation {
  pupilName: string;
  adaptation: string;
}

export interface WorksheetQuestion {
  q: string;
  type: "open" | "fill" | "yesno" | "multiple_choice";
  parts?: string[];
  hint?: string;
  marks: number;
}

export interface ExitTicketQuestion {
  q: string;
  type: string;
  marks: number;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  topic: string;
  nc: string;
}

export interface StarterQuestion {
  q: string;
  age: string;
  interval: string;
  nc: string;
}

export interface VocabularyItem {
  word: string;
  definition: string;
}

export interface GeneratedResourcesJSON {
  worksheetQuestions?: {
    deeper: WorksheetQuestion[];
    core: WorksheetQuestion[];
    scaffold: WorksheetQuestion[];
    guided: WorksheetQuestion[];
  };
  exitTicket?: ExitTicketQuestion[];
  quiz?: QuizQuestion[];
  starterQuestions?: StarterQuestion[];
  boardSections?: PlanSection[];
}

export interface LSLessonPlan {
  id: string;
  organization_id: string;
  timetable_slot_id: string | null;
  class_id: string;
  teacher_user_id: string | null;
  week_commencing: string;
  day_of_week: number;
  subject: string;
  unit_name: string | null;
  scheme_name: string | null;
  scheme_step: string | null;
  title: string;
  learning_objective: string;
  success_criteria: string[];
  key_vocabulary: VocabularyItem[];
  prior_learning_summary: string | null;
  plan_sections: PlanSection[];
  differentiation_groups: DifferentiationGroup[];
  send_adaptations: SENDAdaptation[];
  nc_objective_codes: string[];
  pedagogical_framework: string | null;
  teacher_notes: string | null;
  teacher_edits: Record<string, unknown>;
  supply_brief: string | null;
  generated_resources_json: GeneratedResourcesJSON;
  secondary_subjects?: SecondarySubject[];
  status: LessonStatus;
  ai_model: string | null;
  generation_time_ms: number | null;
  created_at: string;
  updated_at: string;
  taught_at: string | null;
}

export interface LSResource {
  id: string;
  organization_id: string;
  lesson_plan_id: string;
  type: ResourceType;
  title: string;
  source: ResourceSource;
  file_url: string | null;
  file_type: string | null;
  external_url: string | null;
  target_group: DiffGroup | null;
  nc_objective_codes: string[];
  created_at: string;
}

export interface LSQuiz {
  id: string;
  organization_id: string;
  lesson_plan_id: string | null;
  title: string;
  subject: string;
  theme: QuizTheme;
  questions: QuizQuestion[];
  total_questions: number;
  is_live: boolean;
  created_at: string;
}

export interface LSQuizResponse {
  id: string;
  quiz_id: string;
  pupil_id: string;
  question_index: number;
  selected_answer: number;
  is_correct: boolean;
  response_time_ms: number;
  nc_objective_code: string | null;
  created_at: string;
}

export interface LSAssessment {
  id: string;
  organization_id: string;
  lesson_plan_id: string | null;
  pupil_id: string;
  subject: string;
  nc_objective_codes: string[];
  ai_suggested_grade: AttainmentLevel | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  teacher_grade: AttainmentLevel | null;
  teacher_agreed: boolean | null;
  teacher_override_reason: string | null;
  teacher_notes: string | null;
  assessment_date: string;
  created_at: string;
}

export interface LSBehaviourPoint {
  id: string;
  organization_id: string;
  pupil_id: string;
  awarded_by: string | null;
  category: BehaviourCategory;
  points: number;
  note: string | null;
  is_positive: boolean;
  created_at: string;
}

export interface LSCurriculumCoverage {
  id: string;
  organization_id: string;
  class_id: string;
  nc_objective_code: string;
  subject: string;
  objective_text: string | null;
  first_taught_date: string | null;
  times_taught: number;
  times_assessed: number;
  created_at: string;
}

/* ── Assessment Pipeline v2 types ────────────────────────────── */

export type TriangulationStatus = 'pending' | 'aligned' | 'majority' | 'disputed' | 'resolved';

export type WorkSubmissionStatus = 'uploaded' | 'processing' | 'graded' | 'reviewed' | 'error';

export interface LSWorkSubmission {
  id: string;
  organization_id: string;
  lesson_plan_id: string;
  pupil_id: string;
  storage_path: string;
  file_type: string;
  file_size_bytes: number | null;
  ocr_text: string | null;
  ocr_confidence: number | null;
  ocr_model: string | null;
  grading_result: GradingResult | null;
  grading_model: string | null;
  grading_confidence: number | null;
  status: WorkSubmissionStatus;
  error_message: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GradingResult {
  grade: AttainmentLevel;
  score: number;
  total: number;
  misconceptions: Misconception[];
  feedback: string;
  next_steps: string;
  confidence: number;
}

export interface Misconception {
  description: string;
  severity: 'minor' | 'significant' | 'fundamental';
  curriculum_code: string | null;
}

export interface LSModerationItem {
  id: string;
  organization_id: string;
  assessment_id: string;
  flagged_by: string;
  flagged_reason: string | null;
  teacher_grade: string;
  ai_grade: string | null;
  status: 'pending' | 'in_review' | 'resolved';
  resolved_by: string | null;
  resolved_grade: string | null;
  resolved_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface LSCalendarEvent {
  id: string;
  organization_id: string;
  class_id: string;
  teacher_user_id: string | null;
  title: string;
  subject: string;
  event_date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  lesson_plan_id: string | null;
  recurrence_rule: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarEventWithPlan = LSCalendarEvent & {
  lesson_plan?: LSLessonPlan | null;
};

export type AssessmentWithSubmission = LSAssessment & {
  work_submission?: LSWorkSubmission | null;
  pupil?: LSPupil | null;
  moderator_grade?: string | null;
  moderator_notes?: string | null;
  triangulation_status?: TriangulationStatus;
  misconceptions?: Misconception[];
  next_steps?: string | null;
  feedback_text?: string | null;
};

// ─── UI / Composite Types ────────────────────────────────────────────────

export interface TimetableSlotWithPlan extends LSTimetableSlot {
  lesson_plan?: LSLessonPlan | null;
}

export interface ClassWithPupils extends LSClass {
  pupils: LSPupil[];
}

export interface PupilDisplayName {
  id: string;
  pupil_ref: string;
  name: string; // Decrypted/resolved display name
}

// ─── Subject Colours ─────────────────────────────────────────────────────

export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Maths:     { bg: "bg-blue-50 dark:bg-blue-900/20",   text: "text-blue-700 dark:text-blue-300",   border: "border-blue-200 dark:border-blue-800" },
  English:   { bg: "bg-red-50 dark:bg-red-900/20",     text: "text-red-700 dark:text-red-300",     border: "border-red-200 dark:border-red-800" },
  Reading:   { bg: "bg-rose-50 dark:bg-rose-900/20",   text: "text-rose-700 dark:text-rose-300",   border: "border-rose-200 dark:border-rose-800" },
  Science:   { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
  History:   { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  Geography: { bg: "bg-teal-50 dark:bg-teal-900/20",   text: "text-teal-700 dark:text-teal-300",   border: "border-teal-200 dark:border-teal-800" },
  PE:        { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  Art:       { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  Music:     { bg: "bg-pink-50 dark:bg-pink-900/20",   text: "text-pink-700 dark:text-pink-300",   border: "border-pink-200 dark:border-pink-800" },
  Computing: { bg: "bg-cyan-50 dark:bg-cyan-900/20",   text: "text-cyan-700 dark:text-cyan-300",   border: "border-cyan-200 dark:border-cyan-800" },
  RE:        { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
  French:    { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  DT:        { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800" },
  PSHE:      { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
};

export const STATUS_CONFIG: Record<LessonStatus, { label: string; color: string; bg: string }> = {
  empty:     { label: "Empty",     color: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
  draft:     { label: "Draft",     color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
  planned:   { label: "Planned",   color: "text-blue-600",  bg: "bg-blue-50 dark:bg-blue-900/20" },
  taught:    { label: "Taught",    color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  cancelled: { label: "Cancelled", color: "text-red-600",   bg: "bg-red-50 dark:bg-red-900/20" },
};

export const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

/* ── Intervention types ──────────────────────────────────────── */

export type InterventionFormat = 'one_to_one' | 'small_group' | 'in_class' | 'catch_up' | 'homework';
export type InterventionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CPAStage = 'concrete' | 'pictorial' | 'abstract' | 'fluency' | 'application';

export interface LSIntervention {
  id: string;
  organization_id: string;
  pupil_id: string;
  class_id: string | null;
  title: string;
  target: string;
  subject: string;
  format: InterventionFormat;
  frequency: string | null;
  duration_weeks: number | null;
  delivered_by: string | null;
  eef_strategy_id: string | null;
  eef_strategy_name: string | null;
  eef_impact_months: number | null;
  success_criteria: string | null;
  lesson_adaptations: string | null;
  resources: string | null;
  status: InterventionStatus;
  started_at: string | null;
  target_end_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LSInterventionSession {
  id: string;
  intervention_id: string;
  session_number: number;
  session_date: string;
  duration_minutes: number | null;
  delivered_by: string | null;
  focus: string;
  observation: string | null;
  next_session_plan: string | null;
  progress_note: string | null;
  stage: CPAStage | null;
  created_at: string;
}

export type InterventionWithSessions = LSIntervention & {
  sessions?: LSInterventionSession[];
  pupil?: LSPupil | null;
};
