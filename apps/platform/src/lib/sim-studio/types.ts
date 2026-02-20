// ============================================================================
// SIM STUDIO TYPES
// TypeScript types for Sim Studio database schema
// ============================================================================

export type Subject = 'maths' | 'science' | 'english' | 'geography' | 'history';
export type KeyStage = 'EYFS' | 'KS1' | 'KS2';
export type SimStatus = 'draft' | 'published' | 'archived';
export type DifficultyLevel = 'emerging' | 'developing' | 'secure' | 'stretch';
export type LanguageLoad = 'low' | 'high' | 'mixed';
export type Confidence = 'low' | 'medium' | 'high' | 'insufficient_data';
export type Trend = 'improving' | 'stable' | 'declining' | 'unknown';
export type Judgement = 'emerging' | 'developing' | 'secure' | 'stretch';
export type SendStatus = 'none' | 'support' | 'ehcp';
export type ScaffoldPreset =
  | 'standard'
  | 'step_by_step'
  | 'language_lite'
  | 'visual_first'
  | 'reduced_motion'
  | 'motor_friendly'
  | 'stretch';
export type TimelineEventType =
  | 'mismatch_detected'
  | 'scheme_change'
  | 'intervention_started'
  | 'intervention_ended'
  | 'cpd_completed'
  | 'staffing_change'
  | 'cohort_shift'
  | 'calibration_check';

// ============================================================================
// BLUEPRINT SYSTEM
// ============================================================================

export interface SimBlueprint {
  id: string;
  name: string;
  subject: Subject;
  topic: string;
  key_stage: KeyStage;
  description?: string;
  render_config: Record<string, any>;
  interaction_config: Record<string, any>;
  default_accessibility: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface SimPackage {
  id: string;
  blueprint_id: string;
  title: string;
  description?: string;
  parameters: Record<string, any>;
  scheme_pack_id?: string;
  theme_id?: string;
  teacher_guide: TeacherGuide;
  evidence_pack?: EvidencePack;
  accessibility_defaults: Record<string, any>;
  status: SimStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

export interface SimVersion {
  id: string;
  sim_package_id: string;
  version: number;
  snapshot: SimPackage; // Full package snapshot
  change_notes?: string;
  created_by: string;
  created_at: Date;
}

export interface TeacherGuide {
  script?: string[];
  misconceptions?: Misconception[];
  questions?: string[];
  vocabulary?: string[];
  variations?: Record<string, any>;
}

export interface EvidencePack {
  micro_tasks: MicroTask[];
  success_criteria: string[];
  language_load: LanguageLoad;
  accessibility_variants?: Record<string, any>;
}

export interface MicroTask {
  id: string;
  sim_package_id: string;
  task_prompt: string;
  success_criteria: string[];
  evidence_type: 'concept' | 'transfer';
  language_load: LanguageLoad;
  accessibility_variants?: Record<string, any>;
  hints: string[];
  max_attempts?: number;
  misconceptions_observed?: string[];
}

export interface Misconception {
  name: string;
  indicator: string;
  intervention?: string;
}

// ============================================================================
// THEME PACKS
// ============================================================================

export interface ThemePack {
  id: string;
  name: string;
  description?: string;
  asset_pack_key: string;
  copy_pack: ThemeCopy;
  reward_catalog: ThemeRewards;
  ui_palette: ThemePalette;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ThemeCopy {
  ui_strings: {
    quest_start: string;
    quest_complete: string;
    quest_failed: string;
    correct: string;
    incorrect: string;
    hint: string;
    coins_earned: string;
  };
  quest_prompts: {
    generic: string;
    maths?: string;
    place_value?: string;
    fractions?: string;
  };
  feedback_messages: {
    encouragement: string[];
    success: string[];
    partial: string[];
  };
  character_names: {
    teacher: string;
    guide: string;
  };
}

export interface ThemeRewards {
  avatar_items: string[];
  badges: string[];
  coins_multiplier: number;
}

export interface ThemePalette {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    error: string;
    background: string;
    surface: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  icons: {
    quest: string;
    coins: string;
    star: string;
    trophy: string;
  };
}

// ============================================================================
// SCHEME PACKS
// ============================================================================

export interface SchemePack {
  id: string;
  name: string;
  subject: string;
  vocabulary_map: VocabularyMap;
  representation_order: string[];
  step_conventions: Record<string, any>;
  common_misconceptions: Misconception[];
  small_steps_tags: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VocabularyMap {
  preferred_terms: string[];
  avoid_terms: string[];
}

// ============================================================================
// QUEST ENGINE
// ============================================================================

export interface QuestDef {
  id: string;
  title: string;
  description?: string;
  subject: string;
  topic: string;
  key_stage: string;
  estimated_minutes: number;
  items: QuestItem[];
  reward_coins: number;
  scaffold_presets: ScaffoldPreset[];
  difficulty_level: DifficultyLevel;
  language_load: LanguageLoad;
  theme_id: string;
  status: SimStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface QuestItem {
  id: string;
  sim_package_id: string;
  task_prompt: string;
  success_criteria: string[];
  evidence_type: 'concept' | 'transfer';
  language_load: LanguageLoad;
  accessibility_variants?: Record<string, any>;
  hints: string[];
  max_attempts?: number;
}

export interface QuestRun {
  id: string;
  quest_id: string;
  pupil_id: string;
  started_at: Date;
  completed_at?: Date;
  item_results: ItemResult[];
  total_score: number;
  coins_earned: number;
  scaffold_used: ScaffoldPreset;
  device_info?: Record<string, any>;
  completion_rate: number;
}

export interface ItemResult {
  score: number;
  confidence: Confidence;
  attempts: number;
  hints_used: number;
  time_seconds: number;
  stuck_events: number;
  misconceptions: string[];
  transfer_gap?: boolean;
}

// ============================================================================
// PUPIL PROFILES
// ============================================================================

export interface PupilProfile {
  id: string;
  organization_id: string;
  class_name?: string;
  display_name?: string;
  date_of_birth?: Date;
  send_status: SendStatus;
  eal_status: boolean;
  home_language?: string;
  scaffold_preset: ScaffoldPreset;
  accessibility_settings: Record<string, any>;
  enrolled_at: Date;
  last_active: Date;
  metadata: Record<string, any>;
}

// ============================================================================
// TEACHER JUDGEMENTS & CALIBRATION
// ============================================================================

export interface TeacherJudgement {
  id: string;
  pupil_id: string;
  teacher_id: string;
  subject: string;
  topic: string;
  skill: string;
  judgement: Judgement;
  confidence: Confidence;
  assessed_at: Date;
  import_batch_id?: string;
  notes?: string;
  created_at: Date;
}

export interface ModerationSample {
  id: string;
  pupil_id: string;
  quest_run_id?: string;
  moderator_id?: string;
  teacher_judgement_id?: string;
  moderation_outcome: 'agrees_teacher' | 'agrees_schoolgle' | 'differs' | 'inconclusive';
  notes?: string;
  sampled_at: Date;
}

// ============================================================================
// TIMELINE INTEGRATION
// ============================================================================

export interface SimStudioTimelineEvent {
  id: string;
  organization_id: string;
  event_type: TimelineEventType;
  timestamp: Date;
  title: string;
  description?: string;
  trigger?: string;
  hypothesis?: string;
  action?: string;
  review_date?: Date;
  evidence_before?: Record<string, any>;
  evidence_after?: Record<string, any>;
  impact_summary?: string;
  confidence_level: Confidence;
  metadata: Record<string, any>;
  created_by?: string;
}

// ============================================================================
// ANALYTICS & EVIDENCE
// ============================================================================

export interface SkillSnapshot {
  id: string;
  pupil_id: string;
  skill: string;
  concept_score?: number;
  transfer_score?: number;
  confidence: Confidence;
  trend: Trend;
  misconceptions: string[];
  last_quest_at?: Date;
  evidence_coverage: number;
  updated_at: Date;
}

// ============================================================================
// UI HELPER TYPES
// ============================================================================

export interface SimCard {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  topic: string;
  key_stage: KeyStage;
  duration: string;
  quest_enabled: boolean;
  send_friendly: boolean;
  thumbnail?: string;
}

export interface QuestCard {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  key_stage: string;
  duration: string;
  difficulty: DifficultyLevel;
  reward: number;
  items_count: number;
}

export interface PupilProgress {
  pupil_id: string;
  pupil_name?: string;
  skills: Record<string, SkillSnapshot>;
  last_quest?: Date;
  total_quests_completed: number;
  average_score: number;
}

export interface ClassHeatmap {
  pupils: PupilProgress[];
  skills: string[];
  data: Record<string, number>; // pupilId_skill -> score
}

export interface CalibrationEntry {
  pupil_id: string;
  pupil_name?: string;
  teacher_judgement: Judgement;
  schoolgle_assessment: Judgement;
  moderation?: Judgement;
  status: 'agreement' | 'calibration_required' | 'moderated';
}
