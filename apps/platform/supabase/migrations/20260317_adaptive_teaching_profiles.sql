-- ═══════════════════════════════════════════════════════════════════════
-- Adaptive Teaching Engine — Profiles, Quest, & Activity Tracking
--
-- Adds pupil adaptation profiles (teacher/SENCO enrichment + pupil voice),
-- quest sessions (gamified plenary), and in-lesson activity tracking.
--
-- Supports the "Every Child Achieving and Thriving" white paper (Feb 2026):
--   - Universal tier adaptive teaching for ALL pupils
--   - ISP evidence trail (Assess → Plan → Do → Review)
--   - Belonging and engagement monitoring
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Pupil Adaptation Profiles ───────────────────────────────────
-- The enrichment layer: what teachers/SENCOs add beyond MIS data.
-- One per pupil per organization. Updated incrementally over time.

CREATE TABLE IF NOT EXISTS ls_pupil_adaptation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  pupil_ref TEXT NOT NULL,  -- Links to MIS student_id (ARB-100001 etc.)

  -- Rendering preferences (how worksheets/resources should look for this pupil)
  rendering_prefs JSONB DEFAULT '{}',
  -- Example: {"font":"OpenDyslexic","font_size":14,"background":"#FFF8E7","line_spacing":1.8,"text_alignment":"left","max_words_per_line":12}

  -- Learning style & instruction preferences
  instruction_style TEXT CHECK (instruction_style IN ('standard', 'numbered_steps', 'visual_steps', 'audio_first', 'chunked')),
  max_instructions_at_once SMALLINT DEFAULT 3,
  questions_per_page SMALLINT DEFAULT 6,
  vocabulary_scaffolding TEXT CHECK (vocabulary_scaffolding IN ('none', 'word_bank', 'pre_teach_with_visuals', 'bilingual', 'simplified_language')),

  -- Writing support
  writing_support JSONB DEFAULT '[]',
  -- Example: ["sentence_starters","word_bank","scribe_available","voice_to_text"]

  -- Focus & sensory
  focus_duration_mins SMALLINT,  -- NULL = no concern, otherwise minutes before break needed
  sensory_needs JSONB DEFAULT '[]',
  -- Example: ["fidget_tool","quiet_space","ear_defenders","now_next_board","sensory_breaks"]

  -- Assessment adjustments
  extra_time_pct SMALLINT DEFAULT 0,  -- 0, 10, 25, 50
  reduced_questions BOOLEAN DEFAULT false,
  oral_response_option BOOLEAN DEFAULT false,

  -- Social preferences (from teacher observation + pupil voice)
  preferred_partner_ref TEXT,  -- pupil_ref of preferred partner
  max_group_size SMALLINT DEFAULT 4,
  social_notes TEXT,  -- e.g. "Avoid unstructured group discussion"

  -- What works / what doesn't (teacher-reported, growing list)
  effective_strategies JSONB DEFAULT '[]',
  -- Example: ["Concrete before abstract","Visual models","Partner with STU-018"]
  ineffective_strategies JSONB DEFAULT '[]',
  -- Example: ["Open-ended explore tasks","Groups of 4+","Timed pressure"]

  -- Pupil preferences (from pupil voice / quest feedback)
  preferred_contexts JSONB DEFAULT '[]',
  -- Example: ["football","animals","space"]
  preferred_resource_format TEXT CHECK (preferred_resource_format IN ('standard', 'visual_heavy', 'minimal_text', 'interactive', 'audio')),

  -- Topic mastery map (auto-updated from quest data)
  topic_mastery JSONB DEFAULT '{}',
  -- Example: {"Y4-F1":0.95,"Y4-F2":0.80,"Y4-F3":0.45} — accuracy 0-1 per NC code

  -- Misconception log (auto-detected from quest/activity data)
  misconceptions JSONB DEFAULT '[]',
  -- Example: [{"nc_code":"Y4-F3","description":"Subtracts denominators when adding fractions","detected":"2026-03-15","resolved":false}]

  -- Engagement trend (computed from quest self-ratings over time)
  engagement_trend TEXT CHECK (engagement_trend IN ('improving', 'stable', 'declining')),
  avg_self_rating NUMERIC(3,2),  -- 1.0-5.0 average from quest emoji ratings

  -- Current AI-recommended differentiation group (teacher can override)
  recommended_group TEXT CHECK (recommended_group IN ('deeper', 'core', 'scaffold', 'guided')),
  teacher_override_group TEXT CHECK (teacher_override_group IN ('deeper', 'core', 'scaffold', 'guided')),

  -- Current ceiling level (from quest adaptive difficulty)
  current_ceiling_level SMALLINT DEFAULT 3,  -- 1-5, calibrated by quest performance

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, pupil_ref)
);

-- ─── 2. Quest Sessions ─────────────────────────────────────────────
-- Each 5-minute quest plenary produces one session record per pupil.

CREATE TABLE IF NOT EXISTS ls_quest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  pupil_ref TEXT NOT NULL,
  lesson_plan_id UUID REFERENCES ls_lesson_plans(id) ON DELETE SET NULL,
  class_id TEXT NOT NULL,

  -- Session metadata
  subject TEXT NOT NULL,
  nc_objective_codes TEXT[] DEFAULT '{}',
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Adaptive difficulty
  starting_level SMALLINT NOT NULL DEFAULT 3,
  ending_level SMALLINT NOT NULL DEFAULT 3,
  max_level_reached SMALLINT NOT NULL DEFAULT 3,

  -- Performance
  questions_attempted SMALLINT DEFAULT 0,
  questions_correct SMALLINT DEFAULT 0,
  avg_response_time_ms INTEGER,
  hints_used SMALLINT DEFAULT 0,
  streak_max SMALLINT DEFAULT 0,

  -- Gamification
  gems_earned INTEGER DEFAULT 0,
  theme_chosen TEXT,  -- "castle", "space", "ocean", "forest"

  -- Misconceptions detected during quest
  misconceptions_json JSONB DEFAULT '[]',
  -- Example: [{"nc_code":"Y4-F3","error_type":"subtracted_denominators","question_index":5}]

  -- Pupil voice (captured during/after quest)
  self_rating SMALLINT CHECK (self_rating BETWEEN 1 AND 5),  -- 1=😕 to 5=😊
  free_text_feedback TEXT,
  preference_signals JSONB DEFAULT '{}',
  -- Example: {"liked":"the pictures","found_hard":"word problems","wants_more":"visual diagrams"}

  -- Outcome flags
  exceeded_objective BOOLEAN DEFAULT false,
  needs_support_flag BOOLEAN DEFAULT false,
  support_reason TEXT,  -- "denominator misconception", "guessing randomly", etc.

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. In-Lesson Activity Tracking ────────────────────────────────
-- Background tracking during worksheet/resource completion.
-- One row per question per pupil.

CREATE TABLE IF NOT EXISTS ls_activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  pupil_ref TEXT NOT NULL,
  lesson_plan_id UUID REFERENCES ls_lesson_plans(id) ON DELETE SET NULL,

  -- Question-level tracking
  question_index SMALLINT NOT NULL,
  diff_group TEXT,  -- "deeper", "core", "scaffold", "guided"
  nc_objective_code TEXT,

  -- Timing
  time_to_answer_ms INTEGER,  -- milliseconds from question display to answer submit
  time_to_first_action_ms INTEGER,  -- time before pupil starts interacting (hesitation)

  -- Behaviour signals
  hint_requested BOOLEAN DEFAULT false,
  answer_changed BOOLEAN DEFAULT false,  -- pupil changed their answer
  attempts SMALLINT DEFAULT 1,

  -- Outcome
  final_answer_correct BOOLEAN,
  misconception_detected TEXT,  -- short description if AI detects a pattern

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. Adaptation Log ─────────────────────────────────────────────
-- Audit trail: what adaptations were applied to each lesson for each pupil.
-- Evidence for ISP reviews, Ofsted, and the graduated approach.

CREATE TABLE IF NOT EXISTS ls_adaptation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  pupil_ref TEXT NOT NULL,
  lesson_plan_id UUID REFERENCES ls_lesson_plans(id) ON DELETE SET NULL,
  lesson_date DATE NOT NULL,
  subject TEXT NOT NULL,

  -- What was adapted
  adaptations_applied JSONB NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"type":"rendering","detail":"OpenDyslexic 14pt cream background"},
  --   {"type":"content","detail":"3 questions per page, numbered steps"},
  --   {"type":"ehcp","detail":"Pre-teaching vocabulary (EHCP provision #3)"},
  --   {"type":"pupil_voice","detail":"Football-themed word problems (pupil preference)"}
  -- ]

  -- Source of adaptation
  adaptation_sources JSONB DEFAULT '{}',
  -- Example: {"mis":true,"teacher_profile":true,"pupil_voice":true,"ai_observed":true}

  -- Outcome (filled after lesson)
  outcome_rating TEXT CHECK (outcome_rating IN ('effective', 'partially_effective', 'ineffective', 'not_assessed')),
  teacher_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. Add new columns to ls_pupils for enriched MIS data ─────────
-- These columns store the adaptive teaching fields that come from the
-- enriched Arbor export, so they persist when not using MIS fallback.

DO $$ BEGIN
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS send_secondary_need TEXT;
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS standardised_score_reading SMALLINT;
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS standardised_score_maths SMALLINT;
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS reading_age TEXT;
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS spelling_age TEXT;
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS communication_method TEXT DEFAULT 'Verbal';
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS ehcp_provisions TEXT;
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS key_worker TEXT;
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS external_agencies TEXT;
  ALTER TABLE ls_pupils ADD COLUMN IF NOT EXISTS funding TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ─── 6. Indexes ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ls_adapt_profile_org_pupil
  ON ls_pupil_adaptation_profiles(organization_id, pupil_ref);

CREATE INDEX IF NOT EXISTS idx_ls_quest_org_pupil_date
  ON ls_quest_sessions(organization_id, pupil_ref, quest_date DESC);

CREATE INDEX IF NOT EXISTS idx_ls_quest_lesson
  ON ls_quest_sessions(lesson_plan_id);

CREATE INDEX IF NOT EXISTS idx_ls_activity_lesson_pupil
  ON ls_activity_tracking(lesson_plan_id, pupil_ref);

CREATE INDEX IF NOT EXISTS idx_ls_adapt_log_pupil_date
  ON ls_adaptation_log(organization_id, pupil_ref, lesson_date DESC);

CREATE INDEX IF NOT EXISTS idx_ls_adapt_log_lesson
  ON ls_adaptation_log(lesson_plan_id);

-- ─── 7. RLS Policies ──────────────────────────────────────────────

ALTER TABLE ls_pupil_adaptation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_quest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_activity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_adaptation_log ENABLE ROW LEVEL SECURITY;

-- Adaptation profiles
CREATE POLICY ls_adapt_profile_select ON ls_pupil_adaptation_profiles
  FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_adapt_profile_insert ON ls_pupil_adaptation_profiles
  FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_adapt_profile_update ON ls_pupil_adaptation_profiles
  FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_adapt_profile_delete ON ls_pupil_adaptation_profiles
  FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_adapt_profile_service ON ls_pupil_adaptation_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Quest sessions
CREATE POLICY ls_quest_select ON ls_quest_sessions
  FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_quest_insert ON ls_quest_sessions
  FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_quest_service ON ls_quest_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Activity tracking
CREATE POLICY ls_activity_select ON ls_activity_tracking
  FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_activity_insert ON ls_activity_tracking
  FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_activity_service ON ls_activity_tracking
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Adaptation log
CREATE POLICY ls_adapt_log_select ON ls_adaptation_log
  FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_adapt_log_insert ON ls_adaptation_log
  FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_adapt_log_service ON ls_adaptation_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 8. Updated timestamp trigger ─────────────────────────────────

CREATE OR REPLACE FUNCTION ls_update_adaptation_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ls_adapt_profile_updated
  BEFORE UPDATE ON ls_pupil_adaptation_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ls_update_adaptation_profile_timestamp();
