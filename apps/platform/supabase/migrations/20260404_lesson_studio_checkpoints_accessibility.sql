-- ═══════════════════════════════════════════════════════════════════════════
-- Lesson Studio — Curriculum Checkpoints + Pupil Accessibility Profiles
-- Migration: 20260404_lesson_studio_checkpoints_accessibility.sql
--
-- Part 1: Curriculum checkpoint system with framework versioning
--   - ls_curriculum_frameworks: NC versions (current vs 2027 proposed)
--   - ls_curriculum_objectives: Individual objectives by subject/year/code
--   - ls_lesson_objectives: Many-to-many lesson-to-objective mapping
--   - ls_pupil_objective_progress: Per-pupil engagement evidence per objective
--
-- Part 2: Pupil accessibility profile → visualisation parameter bridge
--   - ls_pupil_accessibility_profiles: SEND/accessibility flags + adaptation params
--
-- Design: pupil_hash (SHA-256 of UPN+salt) — NO PII stored.
--   RLS active on all tables. Schools see only their own data.
--   Framework version field supports 2027 curriculum transition.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: Curriculum Checkpoint System
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Curriculum Frameworks (versioned) ──────────────────────────────────
-- Tracks which curriculum framework objectives belong to.
-- When the 2027 curriculum drops, add a new framework row — no data loss.

CREATE TABLE IF NOT EXISTS ls_curriculum_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,            -- e.g. 'NC2014', 'NC2027', 'EYFS2024'
  name TEXT NOT NULL,                   -- e.g. 'National Curriculum 2014'
  status TEXT NOT NULL DEFAULT 'current'
    CHECK (status IN ('current', 'proposed', 'archived')),
  effective_from DATE,                  -- When this framework starts being taught
  effective_until DATE,                 -- When replaced (NULL = still active)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed current frameworks
INSERT INTO ls_curriculum_frameworks (code, name, status, effective_from) VALUES
  ('NC2014', 'National Curriculum 2014', 'current', '2014-09-01'),
  ('EYFS2024', 'Early Years Foundation Stage 2024', 'current', '2024-09-01')
ON CONFLICT (code) DO NOTHING;

-- ─── Curriculum Objectives ──────────────────────────────────────────────
-- Every NC objective, tagged with subject, year group, and framework version.

CREATE TABLE IF NOT EXISTS ls_curriculum_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES ls_curriculum_frameworks(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,                -- 'Science', 'Maths', 'English', etc.
  key_stage TEXT NOT NULL CHECK (key_stage IN ('EYFS', 'KS1', 'KS2', 'KS3')),
  year_group TEXT NOT NULL,             -- 'Year 1', 'Year 2', ..., 'Year 6', 'Reception'
  objective_code TEXT NOT NULL,         -- 'Y6.SC.AH.1' — unique within framework
  objective_text TEXT NOT NULL,         -- Full text of the objective
  strand TEXT,                          -- e.g. 'Animals including humans', 'Number - fractions'
  sub_strand TEXT,                      -- More granular grouping if needed
  is_statutory BOOLEAN DEFAULT true,    -- Statutory vs non-statutory guidance
  display_order INTEGER DEFAULT 0,      -- For UI ordering
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(framework_id, objective_code)
);

CREATE INDEX IF NOT EXISTS idx_ls_obj_framework ON ls_curriculum_objectives(framework_id);
CREATE INDEX IF NOT EXISTS idx_ls_obj_subject_year ON ls_curriculum_objectives(subject, year_group);
CREATE INDEX IF NOT EXISTS idx_ls_obj_code ON ls_curriculum_objectives(objective_code);

-- ─── Lesson-to-Objective Mapping (many-to-many) ────────────────────────
-- Links lesson plans to specific curriculum objectives they address.

CREATE TABLE IF NOT EXISTS ls_lesson_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id UUID NOT NULL REFERENCES ls_lesson_plans(id) ON DELETE CASCADE,
  objective_id UUID NOT NULL REFERENCES ls_curriculum_objectives(id) ON DELETE CASCADE,
  coverage_depth TEXT DEFAULT 'introduced'
    CHECK (coverage_depth IN ('introduced', 'practised', 'applied', 'assessed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(lesson_plan_id, objective_id)
);

CREATE INDEX IF NOT EXISTS idx_ls_lo_lesson ON ls_lesson_objectives(lesson_plan_id);
CREATE INDEX IF NOT EXISTS idx_ls_lo_objective ON ls_lesson_objectives(objective_id);

-- ─── Pupil-Level Objective Progress ─────────────────────────────────────
-- Per-pupil engagement evidence for each curriculum objective.
-- Builds over time as pupils interact with lessons covering each objective.

CREATE TABLE IF NOT EXISTS ls_pupil_objective_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_hash TEXT NOT NULL,             -- SHA-256(UPN+salt) — NO PII
  objective_id UUID NOT NULL REFERENCES ls_curriculum_objectives(id) ON DELETE CASCADE,

  -- Evidence of engagement
  times_encountered INTEGER DEFAULT 0,  -- How many lessons covered this objective
  last_encountered DATE,

  -- Confidence / attainment
  confidence_score DECIMAL(3,2)         -- 0.00-1.00 inferred from interactions
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  attainment_level TEXT                 -- 'emerging', 'expected', 'exceeding'
    CHECK (attainment_level IS NULL OR attainment_level IN ('emerging', 'expected', 'exceeding')),

  -- Teacher override (teacher can adjust the AI-inferred score)
  teacher_assessed BOOLEAN DEFAULT false,
  teacher_attainment TEXT
    CHECK (teacher_attainment IS NULL OR teacher_attainment IN ('emerging', 'expected', 'exceeding')),
  teacher_notes TEXT,
  teacher_assessed_at TIMESTAMPTZ,

  -- Interaction evidence (aggregated from lesson sessions)
  total_interaction_time_ms BIGINT DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, pupil_hash, objective_id)
);

CREATE INDEX IF NOT EXISTS idx_ls_pop_org ON ls_pupil_objective_progress(organization_id);
CREATE INDEX IF NOT EXISTS idx_ls_pop_pupil ON ls_pupil_objective_progress(pupil_hash);
CREATE INDEX IF NOT EXISTS idx_ls_pop_objective ON ls_pupil_objective_progress(objective_id);
CREATE INDEX IF NOT EXISTS idx_ls_pop_confidence ON ls_pupil_objective_progress(confidence_score);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: Pupil Accessibility Profile → Visualisation Parameter Bridge
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Pupil Accessibility Profiles ───────────────────────────────────────
-- Maps SEND/accessibility flags to visualisation adaptation parameters.
-- This is the bridge between pupil data and Ed's adaptive generation.
-- One per pupil per school. Links to ISP when ISPs become statutory (Sept 2029).

CREATE TABLE IF NOT EXISTS ls_pupil_accessibility_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_hash TEXT NOT NULL,             -- SHA-256(UPN+salt) — NO PII

  -- Accessibility flags (what the pupil needs)
  accessibility_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Expected structure:
  -- {
  --   "visual_impairment": "none" | "mild" | "moderate" | "severe",
  --   "hearing_impairment": "none" | "mild" | "moderate" | "severe",
  --   "eal_level": "none" | "new_to_english" | "early_acquisition" | "developing" | "competent" | "fluent",
  --   "dyslexia": false | true,
  --   "adhd": false | true,
  --   "send_ehcp": false | true,
  --   "motor_impairment": "none" | "mild" | "moderate" | "severe",
  --   "greater_depth": false | true
  -- }

  -- Visualisation adaptation parameters (how to adapt Ed's output)
  adaptation_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Expected structure:
  -- {
  --   "contrast": "standard" | "high" | "inverted",
  --   "font_size": 14,           -- px, range 12-32
  --   "label_complexity": "full" | "simplified" | "symbols_only",
  --   "vocabulary_level": "age_appropriate" | "simplified" | "pre_key_stage",
  --   "cognitive_load": "standard" | "reduced" | "minimal",
  --   "scaffolding": "none" | "light" | "moderate" | "heavy",
  --   "audio_description": false | true,
  --   "translated_labels": null | "pl" | "ur" | "ro" | "pa" etc.,
  --   "chunking": false | true,
  --   "challenge_level": "support" | "core" | "extend"
  -- }

  -- ISP reference (future — Individual Support Plans become statutory Sept 2029)
  isp_ref TEXT,                         -- External reference to ISP system
  isp_last_review_date DATE,

  -- Audit trail
  last_updated_by UUID,                 -- User who last modified
  source TEXT DEFAULT 'manual'          -- 'manual', 'mis_import', 'isp_sync'
    CHECK (source IN ('manual', 'mis_import', 'isp_sync')),

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, pupil_hash)
);

CREATE INDEX IF NOT EXISTS idx_ls_pap_org ON ls_pupil_accessibility_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_ls_pap_pupil ON ls_pupil_accessibility_profiles(pupil_hash);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE ls_curriculum_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_curriculum_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_lesson_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_pupil_objective_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_pupil_accessibility_profiles ENABLE ROW LEVEL SECURITY;

-- Frameworks and objectives are global reference data — readable by all authenticated users
CREATE POLICY ls_frameworks_select ON ls_curriculum_frameworks
  FOR SELECT USING (true);
CREATE POLICY ls_frameworks_service ON ls_curriculum_frameworks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY ls_objectives_select ON ls_curriculum_objectives
  FOR SELECT USING (true);
CREATE POLICY ls_objectives_service ON ls_curriculum_objectives
  FOR ALL USING (auth.role() = 'service_role');

-- Lesson objectives: scoped via lesson plan's organization
CREATE POLICY ls_lesson_obj_select ON ls_lesson_objectives
  FOR SELECT USING (
    lesson_plan_id IN (
      SELECT id FROM ls_lesson_plans WHERE organization_id IN (SELECT ls_user_org_ids())
    )
  );
CREATE POLICY ls_lesson_obj_insert ON ls_lesson_objectives
  FOR INSERT WITH CHECK (
    lesson_plan_id IN (
      SELECT id FROM ls_lesson_plans WHERE organization_id IN (SELECT ls_user_org_ids())
    )
  );
CREATE POLICY ls_lesson_obj_update ON ls_lesson_objectives
  FOR UPDATE USING (
    lesson_plan_id IN (
      SELECT id FROM ls_lesson_plans WHERE organization_id IN (SELECT ls_user_org_ids())
    )
  );
CREATE POLICY ls_lesson_obj_delete ON ls_lesson_objectives
  FOR DELETE USING (
    lesson_plan_id IN (
      SELECT id FROM ls_lesson_plans WHERE organization_id IN (SELECT ls_user_org_ids())
    )
  );
CREATE POLICY ls_lesson_obj_service ON ls_lesson_objectives
  FOR ALL USING (auth.role() = 'service_role');

-- Pupil progress: org-scoped
CREATE POLICY ls_pop_select ON ls_pupil_objective_progress
  FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pop_insert ON ls_pupil_objective_progress
  FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pop_update ON ls_pupil_objective_progress
  FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pop_delete ON ls_pupil_objective_progress
  FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pop_service ON ls_pupil_objective_progress
  FOR ALL USING (auth.role() = 'service_role');

-- Accessibility profiles: org-scoped
CREATE POLICY ls_pap_select ON ls_pupil_accessibility_profiles
  FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pap_insert ON ls_pupil_accessibility_profiles
  FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pap_update ON ls_pupil_accessibility_profiles
  FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pap_delete ON ls_pupil_accessibility_profiles
  FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pap_service ON ls_pupil_accessibility_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION ls_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ls_pop_updated ON ls_pupil_objective_progress;
CREATE TRIGGER trigger_ls_pop_updated
  BEFORE UPDATE ON ls_pupil_objective_progress
  FOR EACH ROW EXECUTE FUNCTION ls_set_updated_at();

DROP TRIGGER IF EXISTS trigger_ls_pap_updated ON ls_pupil_accessibility_profiles;
CREATE TRIGGER trigger_ls_pap_updated
  BEFORE UPDATE ON ls_pupil_accessibility_profiles
  FOR EACH ROW EXECUTE FUNCTION ls_set_updated_at();
