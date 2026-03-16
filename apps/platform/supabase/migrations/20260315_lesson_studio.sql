-- ═══════════════════════════════════════════════════════════════════════════
-- Lesson Studio — AI-Powered Connected Lesson Planning
-- Migration: 20260315_lesson_studio.sql
--
-- Tables: ls_classes, ls_pupils, ls_timetable_slots, ls_scheme_mappings,
--   ls_scheme_progressions, ls_lesson_plans, ls_resources, ls_quizzes,
--   ls_quiz_responses, ls_assessments, ls_behaviour_points, ls_curriculum_coverage
--
-- Design: Uses organization_id from existing organizations table.
--   Staff references organization_members. No duplicate school/staff tables.
--   Pupil PII uses encrypted display names (GDPR safe).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Classes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year_group TEXT NOT NULL,
  class_name TEXT NOT NULL,
  key_stage TEXT NOT NULL CHECK (key_stage IN ('EYFS', 'KS1', 'KS2')),
  teacher_user_id UUID,
  ta_user_id UUID,
  room TEXT,
  pupil_count INTEGER DEFAULT 0,
  academic_year TEXT NOT NULL DEFAULT '2025-26',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, class_name, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_ls_classes_org ON ls_classes(organization_id);
CREATE INDEX IF NOT EXISTS idx_ls_classes_teacher ON ls_classes(teacher_user_id);

-- ─── Pupils ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_pupils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id UUID REFERENCES ls_classes(id) ON DELETE SET NULL,
  pupil_ref TEXT NOT NULL,
  display_name_encrypted TEXT,
  year_group TEXT,
  gender TEXT CHECK (gender IS NULL OR gender IN ('M', 'F', 'O')),
  has_ehcp BOOLEAN DEFAULT false,
  has_send_support BOOLEAN DEFAULT false,
  send_primary_need TEXT,
  is_pupil_premium BOOLEAN DEFAULT false,
  is_eal BOOLEAN DEFAULT false,
  eal_stage TEXT CHECK (eal_stage IS NULL OR eal_stage IN ('A', 'B', 'C', 'D', 'E')),
  is_looked_after BOOLEAN DEFAULT false,
  accessibility_needs JSONB DEFAULT '[]',
  attainment_reading TEXT CHECK (attainment_reading IS NULL OR attainment_reading IN ('PKF', 'PKE', 'WTS', 'EXS', 'GDS')),
  attainment_writing TEXT CHECK (attainment_writing IS NULL OR attainment_writing IN ('PKF', 'PKE', 'WTS', 'EXS', 'GDS')),
  attainment_maths TEXT CHECK (attainment_maths IS NULL OR attainment_maths IN ('PKF', 'PKE', 'WTS', 'EXS', 'GDS')),
  attainment_science TEXT CHECK (attainment_science IS NULL OR attainment_science IN ('PKF', 'PKE', 'WTS', 'EXS', 'GDS')),
  lesson_attainment JSONB DEFAULT '{}',
  resource_overrides JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, pupil_ref)
);

CREATE INDEX IF NOT EXISTS idx_ls_pupils_org ON ls_pupils(organization_id);
CREATE INDEX IF NOT EXISTS idx_ls_pupils_class ON ls_pupils(class_id);
CREATE INDEX IF NOT EXISTS idx_ls_pupils_send ON ls_pupils(has_ehcp) WHERE has_ehcp = true;
CREATE INDEX IF NOT EXISTS idx_ls_pupils_pp ON ls_pupils(is_pupil_premium) WHERE is_pupil_premium = true;

-- ─── Timetable ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES ls_classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(class_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_ls_timetable_class ON ls_timetable_slots(class_id);

-- ─── Scheme Mappings ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_scheme_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES ls_classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  scheme_name TEXT NOT NULL,
  scheme_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(class_id, subject)
);

-- ─── Scheme Progressions (shared reference data) ─────────────────────────

CREATE TABLE IF NOT EXISTS ls_scheme_progressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  year_group TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('autumn', 'spring', 'summer')),
  unit_name TEXT NOT NULL,
  unit_order INTEGER NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  nc_objective_codes TEXT[] DEFAULT '{}',
  methodology_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(scheme_name, subject, year_group, term, unit_name)
);

-- ─── Lesson Plans ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  timetable_slot_id UUID REFERENCES ls_timetable_slots(id),
  class_id UUID NOT NULL REFERENCES ls_classes(id) ON DELETE CASCADE,
  teacher_user_id UUID,
  week_commencing DATE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  subject TEXT NOT NULL,
  unit_name TEXT,
  scheme_name TEXT,
  scheme_step TEXT,
  title TEXT NOT NULL,
  learning_objective TEXT NOT NULL,
  success_criteria JSONB DEFAULT '[]',
  key_vocabulary JSONB DEFAULT '[]',
  prior_learning_summary TEXT,
  plan_sections JSONB NOT NULL DEFAULT '[]',
  differentiation_groups JSONB DEFAULT '[]',
  send_adaptations JSONB DEFAULT '[]',
  nc_objective_codes TEXT[] DEFAULT '{}',
  pedagogical_framework TEXT,
  teacher_notes TEXT,
  teacher_edits JSONB DEFAULT '{}',
  supply_brief TEXT,
  generated_resources_json JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('empty', 'draft', 'planned', 'taught', 'cancelled')),
  ai_model TEXT,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  taught_at TIMESTAMPTZ,
  UNIQUE(class_id, week_commencing, day_of_week, subject)
);

CREATE INDEX IF NOT EXISTS idx_ls_plans_org ON ls_lesson_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_ls_plans_class ON ls_lesson_plans(class_id);
CREATE INDEX IF NOT EXISTS idx_ls_plans_teacher ON ls_lesson_plans(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_ls_plans_week ON ls_lesson_plans(week_commencing);
CREATE INDEX IF NOT EXISTS idx_ls_plans_status ON ls_lesson_plans(status);

-- ─── Resources ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lesson_plan_id UUID NOT NULL REFERENCES ls_lesson_plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('worksheet', 'slides', 'starter', 'exit_ticket', 'quiz', 'uploaded', 'other')),
  title TEXT NOT NULL,
  source TEXT DEFAULT 'ai_generated' CHECK (source IN ('ai_generated', 'uploaded', 'scheme_link')),
  file_url TEXT,
  file_type TEXT,
  external_url TEXT,
  target_group TEXT CHECK (target_group IS NULL OR target_group IN ('all', 'deeper', 'core', 'scaffold', 'guided')),
  nc_objective_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ls_resources_plan ON ls_resources(lesson_plan_id);

-- ─── Quizzes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lesson_plan_id UUID REFERENCES ls_lesson_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  theme TEXT DEFAULT 'farm' CHECK (theme IN ('farm', 'space', 'ocean', 'forest')),
  questions JSONB NOT NULL DEFAULT '[]',
  total_questions INTEGER NOT NULL,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ls_quizzes_plan ON ls_quizzes(lesson_plan_id);

-- ─── Quiz Responses ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES ls_quizzes(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES ls_pupils(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL,
  nc_objective_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ls_quiz_resp_quiz ON ls_quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_ls_quiz_resp_pupil ON ls_quiz_responses(pupil_id);

-- ─── Assessments (Human-in-the-Loop) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lesson_plan_id UUID REFERENCES ls_lesson_plans(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES ls_pupils(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  nc_objective_codes TEXT[] DEFAULT '{}',
  ai_suggested_grade TEXT CHECK (ai_suggested_grade IS NULL OR ai_suggested_grade IN ('PKF', 'PKE', 'WTS', 'EXS', 'GDS')),
  ai_confidence INTEGER CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 100)),
  ai_reasoning TEXT,
  teacher_grade TEXT CHECK (teacher_grade IS NULL OR teacher_grade IN ('PKF', 'PKE', 'WTS', 'EXS', 'GDS')),
  teacher_agreed BOOLEAN,
  teacher_override_reason TEXT,
  teacher_notes TEXT,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ls_assess_plan ON ls_assessments(lesson_plan_id);
CREATE INDEX IF NOT EXISTS idx_ls_assess_pupil ON ls_assessments(pupil_id);
CREATE INDEX IF NOT EXISTS idx_ls_assess_org ON ls_assessments(organization_id);

-- ─── Behaviour Points ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_behaviour_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES ls_pupils(id) ON DELETE CASCADE,
  awarded_by UUID,
  category TEXT NOT NULL CHECK (category IN (
    'perseverance', 'collaboration', 'curiosity', 'kindness', 'focus', 'bravery'
  )),
  points INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  is_positive BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ls_behaviour_pupil ON ls_behaviour_points(pupil_id);
CREATE INDEX IF NOT EXISTS idx_ls_behaviour_org ON ls_behaviour_points(organization_id);

-- ─── Curriculum Coverage (auto-tracked) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS ls_curriculum_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES ls_classes(id) ON DELETE CASCADE,
  nc_objective_code TEXT NOT NULL,
  subject TEXT NOT NULL,
  objective_text TEXT,
  first_taught_date DATE,
  times_taught INTEGER DEFAULT 0,
  times_assessed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(class_id, nc_objective_code)
);

CREATE INDEX IF NOT EXISTS idx_ls_coverage_class ON ls_curriculum_coverage(class_id);

-- ─── Trigger: Auto-update curriculum coverage when lesson marked taught ──

CREATE OR REPLACE FUNCTION ls_update_curriculum_coverage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'taught' AND (OLD.status IS NULL OR OLD.status != 'taught') THEN
    INSERT INTO ls_curriculum_coverage (organization_id, class_id, nc_objective_code, subject, first_taught_date, times_taught)
    SELECT NEW.organization_id, NEW.class_id, unnest(NEW.nc_objective_codes), NEW.subject, CURRENT_DATE, 1
    ON CONFLICT (class_id, nc_objective_code) DO UPDATE SET
      times_taught = ls_curriculum_coverage.times_taught + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ls_curriculum_coverage ON ls_lesson_plans;
CREATE TRIGGER trigger_ls_curriculum_coverage
AFTER UPDATE ON ls_lesson_plans
FOR EACH ROW EXECUTE FUNCTION ls_update_curriculum_coverage();


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies — organization-scoped access
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  -- Enable RLS on all ls_ tables
  ALTER TABLE ls_classes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_pupils ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_timetable_slots ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_scheme_mappings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_lesson_plans ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_resources ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_quizzes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_quiz_responses ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_assessments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_behaviour_points ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ls_curriculum_coverage ENABLE ROW LEVEL SECURITY;
  -- scheme_progressions is shared reference data (no RLS needed)
END $$;

-- Helper: check org membership
CREATE OR REPLACE FUNCTION ls_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ls_classes
CREATE POLICY ls_classes_select ON ls_classes FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_classes_insert ON ls_classes FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_classes_update ON ls_classes FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_classes_delete ON ls_classes FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_classes_service ON ls_classes FOR ALL USING (auth.role() = 'service_role');

-- ls_pupils
CREATE POLICY ls_pupils_select ON ls_pupils FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pupils_insert ON ls_pupils FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pupils_update ON ls_pupils FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pupils_delete ON ls_pupils FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_pupils_service ON ls_pupils FOR ALL USING (auth.role() = 'service_role');

-- ls_timetable_slots
CREATE POLICY ls_timetable_select ON ls_timetable_slots FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_timetable_insert ON ls_timetable_slots FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_timetable_update ON ls_timetable_slots FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_timetable_delete ON ls_timetable_slots FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_timetable_service ON ls_timetable_slots FOR ALL USING (auth.role() = 'service_role');

-- ls_scheme_mappings
CREATE POLICY ls_scheme_map_select ON ls_scheme_mappings FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_scheme_map_insert ON ls_scheme_mappings FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_scheme_map_update ON ls_scheme_mappings FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_scheme_map_delete ON ls_scheme_mappings FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_scheme_map_service ON ls_scheme_mappings FOR ALL USING (auth.role() = 'service_role');

-- ls_lesson_plans
CREATE POLICY ls_plans_select ON ls_lesson_plans FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_plans_insert ON ls_lesson_plans FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_plans_update ON ls_lesson_plans FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_plans_delete ON ls_lesson_plans FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_plans_service ON ls_lesson_plans FOR ALL USING (auth.role() = 'service_role');

-- ls_resources
CREATE POLICY ls_resources_select ON ls_resources FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_resources_insert ON ls_resources FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_resources_update ON ls_resources FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_resources_delete ON ls_resources FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_resources_service ON ls_resources FOR ALL USING (auth.role() = 'service_role');

-- ls_quizzes
CREATE POLICY ls_quizzes_select ON ls_quizzes FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_quizzes_insert ON ls_quizzes FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_quizzes_update ON ls_quizzes FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_quizzes_delete ON ls_quizzes FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_quizzes_service ON ls_quizzes FOR ALL USING (auth.role() = 'service_role');

-- ls_quiz_responses (no org_id — secured via quiz → org chain)
CREATE POLICY ls_quiz_resp_select ON ls_quiz_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM ls_quizzes q WHERE q.id = quiz_id AND q.organization_id IN (SELECT ls_user_org_ids()))
);
CREATE POLICY ls_quiz_resp_insert ON ls_quiz_responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM ls_quizzes q WHERE q.id = quiz_id AND q.organization_id IN (SELECT ls_user_org_ids()))
);
CREATE POLICY ls_quiz_resp_delete ON ls_quiz_responses FOR DELETE USING (
  EXISTS (SELECT 1 FROM ls_quizzes q WHERE q.id = quiz_id AND q.organization_id IN (SELECT ls_user_org_ids()))
);
CREATE POLICY ls_quiz_resp_service ON ls_quiz_responses FOR ALL USING (auth.role() = 'service_role');

-- ls_assessments
CREATE POLICY ls_assess_select ON ls_assessments FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_assess_insert ON ls_assessments FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_assess_update ON ls_assessments FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_assess_delete ON ls_assessments FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_assess_service ON ls_assessments FOR ALL USING (auth.role() = 'service_role');

-- ls_behaviour_points
CREATE POLICY ls_behaviour_select ON ls_behaviour_points FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_behaviour_insert ON ls_behaviour_points FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_behaviour_update ON ls_behaviour_points FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_behaviour_delete ON ls_behaviour_points FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_behaviour_service ON ls_behaviour_points FOR ALL USING (auth.role() = 'service_role');

-- ls_curriculum_coverage
CREATE POLICY ls_coverage_select ON ls_curriculum_coverage FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_coverage_insert ON ls_curriculum_coverage FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_coverage_update ON ls_curriculum_coverage FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_coverage_delete ON ls_curriculum_coverage FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));
CREATE POLICY ls_coverage_service ON ls_curriculum_coverage FOR ALL USING (auth.role() = 'service_role');


-- ═══════════════════════════════════════════════════════════════════════════
-- Seed Data — Arrival Primary School (Test Environment)
-- ═══════════════════════════════════════════════════════════════════════════

-- NOTE: This seed data uses the first organization found as the test school.
-- In production, schools import their own data via CSV/MIS API.
-- Pupil names use "enc:" prefix to indicate encrypted format (test only).

DO $$
DECLARE
  v_org_id UUID;
  v_rec_id UUID; v_y1_id UUID; v_y2_id UUID; v_y3_id UUID;
  v_y4_id UUID; v_y5_id UUID; v_y6_id UUID;
  -- Y4 pupil IDs (15 pupils for detailed testing)
  p1 UUID; p2 UUID; p3 UUID; p4 UUID; p5 UUID;
  p6 UUID; p7 UUID; p8 UUID; p9 UUID; p10 UUID;
  p11 UUID; p12 UUID; p13 UUID; p14 UUID; p15 UUID;
BEGIN
  -- Find first organization (Arrival Primary / test school)
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organization found — skipping seed data';
    RETURN;
  END IF;

  -- ─── Classes ───────────────────────────────────────────────────────
  INSERT INTO ls_classes (id, organization_id, year_group, class_name, key_stage, room, pupil_count)
  VALUES
    (gen_random_uuid(), v_org_id, 'Reception', 'Hedgehogs', 'EYFS', 'Room 1', 30),
    (gen_random_uuid(), v_org_id, 'Year 1', 'Rabbits', 'KS1', 'Room 2', 30),
    (gen_random_uuid(), v_org_id, 'Year 2', 'Badgers', 'KS1', 'Room 3', 30),
    (gen_random_uuid(), v_org_id, 'Year 3', 'Otters', 'KS2', 'Room 4', 31),
    (gen_random_uuid(), v_org_id, 'Year 4', 'Foxes', 'KS2', 'Room 5', 30),
    (gen_random_uuid(), v_org_id, 'Year 5', 'Hawks', 'KS2', 'Room 6', 30),
    (gen_random_uuid(), v_org_id, 'Year 6', 'Eagles', 'KS2', 'Room 7', 29)
  ON CONFLICT (organization_id, class_name, academic_year) DO NOTHING
  RETURNING id INTO v_rec_id; -- only gets last

  -- Retrieve class IDs
  SELECT id INTO v_rec_id FROM ls_classes WHERE organization_id = v_org_id AND class_name = 'Hedgehogs' AND academic_year = '2025-26';
  SELECT id INTO v_y1_id  FROM ls_classes WHERE organization_id = v_org_id AND class_name = 'Rabbits'   AND academic_year = '2025-26';
  SELECT id INTO v_y2_id  FROM ls_classes WHERE organization_id = v_org_id AND class_name = 'Badgers'   AND academic_year = '2025-26';
  SELECT id INTO v_y3_id  FROM ls_classes WHERE organization_id = v_org_id AND class_name = 'Otters'    AND academic_year = '2025-26';
  SELECT id INTO v_y4_id  FROM ls_classes WHERE organization_id = v_org_id AND class_name = 'Foxes'     AND academic_year = '2025-26';
  SELECT id INTO v_y5_id  FROM ls_classes WHERE organization_id = v_org_id AND class_name = 'Hawks'     AND academic_year = '2025-26';
  SELECT id INTO v_y6_id  FROM ls_classes WHERE organization_id = v_org_id AND class_name = 'Eagles'    AND academic_year = '2025-26';

  -- ─── Year 4 Foxes Pupils (15 detailed profiles) ───────────────────
  p1  := gen_random_uuid(); p2  := gen_random_uuid(); p3  := gen_random_uuid();
  p4  := gen_random_uuid(); p5  := gen_random_uuid(); p6  := gen_random_uuid();
  p7  := gen_random_uuid(); p8  := gen_random_uuid(); p9  := gen_random_uuid();
  p10 := gen_random_uuid(); p11 := gen_random_uuid(); p12 := gen_random_uuid();
  p13 := gen_random_uuid(); p14 := gen_random_uuid(); p15 := gen_random_uuid();

  INSERT INTO ls_pupils (id, organization_id, class_id, pupil_ref, display_name_encrypted, year_group, gender,
    has_ehcp, has_send_support, send_primary_need, is_pupil_premium, is_eal, eal_stage, is_looked_after,
    accessibility_needs, attainment_reading, attainment_writing, attainment_maths, attainment_science)
  VALUES
    -- GDS pupils
    (p1,  v_org_id, v_y4_id, 'AP-Y4-001', 'enc:Freya M',    'Year 4', 'F', false, false, NULL,   false, false, NULL, false, '[]', 'GDS', 'GDS', 'GDS', 'GDS'),
    (p2,  v_org_id, v_y4_id, 'AP-Y4-002', 'enc:Isla W',     'Year 4', 'F', false, false, NULL,   false, false, NULL, false, '[]', 'GDS', 'EXS', 'GDS', 'EXS'),
    (p3,  v_org_id, v_y4_id, 'AP-Y4-003', 'enc:Noah B',     'Year 4', 'M', false, false, NULL,   false, false, NULL, false, '[]', 'EXS', 'EXS', 'GDS', 'EXS'),
    -- EXS pupils
    (p4,  v_org_id, v_y4_id, 'AP-Y4-004', 'enc:Ethan C',    'Year 4', 'M', false, false, NULL,   false, false, NULL, false, '[]', 'EXS', 'EXS', 'EXS', 'EXS'),
    (p5,  v_org_id, v_y4_id, 'AP-Y4-005', 'enc:Mia D',      'Year 4', 'F', false, false, NULL,   false, false, NULL, false, '[]', 'EXS', 'EXS', 'EXS', 'EXS'),
    (p6,  v_org_id, v_y4_id, 'AP-Y4-006', 'enc:Oscar F',    'Year 4', 'M', false, false, NULL,   false, false, NULL, false, '[]', 'EXS', 'WTS', 'EXS', 'EXS'),
    (p7,  v_org_id, v_y4_id, 'AP-Y4-007', 'enc:Ava G',      'Year 4', 'F', false, false, NULL,   true,  false, NULL, false, '[]', 'EXS', 'EXS', 'EXS', 'WTS'),
    (p8,  v_org_id, v_y4_id, 'AP-Y4-008', 'enc:Henry H',    'Year 4', 'M', false, false, NULL,   false, false, NULL, false, '[]', 'EXS', 'EXS', 'EXS', 'EXS'),
    (p9,  v_org_id, v_y4_id, 'AP-Y4-009', 'enc:Emily J',    'Year 4', 'F', false, false, NULL,   false, false, NULL, false, '[]', 'EXS', 'EXS', 'EXS', 'EXS'),
    -- WTS pupils
    (p10, v_org_id, v_y4_id, 'AP-Y4-010', 'enc:Jake R',     'Year 4', 'M', false, false, NULL,   true,  false, NULL, false, '["dyslexia"]', 'WTS', 'WTS', 'WTS', 'WTS'),
    (p11, v_org_id, v_y4_id, 'AP-Y4-011', 'enc:Lily P',     'Year 4', 'F', false, true,  'SPLD', false, false, NULL, false, '["dyslexia","visual_impairment"]', 'WTS', 'WTS', 'EXS', 'WTS'),
    -- EHCP / SEND pupils
    (p12, v_org_id, v_y4_id, 'AP-Y4-012', 'enc:Oliver T',   'Year 4', 'M', true,  true,  'ASD',  true,  false, NULL, false, '["asd","sensory_processing"]', 'WTS', 'WTS', 'WTS', 'WTS'),
    (p13, v_org_id, v_y4_id, 'AP-Y4-013', 'enc:Sophie L',   'Year 4', 'F', false, true,  'SEMH', false, false, NULL, false, '["adhd"]', 'WTS', 'WTS', 'EXS', 'WTS'),
    -- EAL pupil
    (p14, v_org_id, v_y4_id, 'AP-Y4-014', 'enc:Amara K',    'Year 4', 'F', false, false, NULL,   false, true,  'B',  false, '[]', 'WTS', 'WTS', 'EXS', 'WTS'),
    -- Looked-after child
    (p15, v_org_id, v_y4_id, 'AP-Y4-015', 'enc:Tyler W',    'Year 4', 'M', false, false, NULL,   true,  false, NULL, true,  '[]', 'WTS', 'WTS', 'WTS', 'WTS')
  ON CONFLICT (organization_id, pupil_ref) DO NOTHING;

  -- ─── Year 4 Timetable (25 slots, Mon-Fri) ─────────────────────────

  INSERT INTO ls_timetable_slots (organization_id, class_id, day_of_week, start_time, end_time, subject, room)
  VALUES
    -- Monday
    (v_org_id, v_y4_id, 1, '09:00', '10:00', 'Maths',    'Room 5'),
    (v_org_id, v_y4_id, 1, '10:15', '11:00', 'English',   'Room 5'),
    (v_org_id, v_y4_id, 1, '11:00', '11:45', 'Reading',   'Room 5'),
    (v_org_id, v_y4_id, 1, '13:00', '13:45', 'Science',   'Room 5'),
    (v_org_id, v_y4_id, 1, '13:45', '14:30', 'PSHE',      'Room 5'),
    -- Tuesday
    (v_org_id, v_y4_id, 2, '09:00', '10:00', 'Maths',    'Room 5'),
    (v_org_id, v_y4_id, 2, '10:15', '11:00', 'English',   'Room 5'),
    (v_org_id, v_y4_id, 2, '11:00', '11:45', 'History',   'Room 5'),
    (v_org_id, v_y4_id, 2, '13:00', '14:00', 'PE',        'Hall'),
    (v_org_id, v_y4_id, 2, '14:00', '14:30', 'Music',     'Music Room'),
    -- Wednesday
    (v_org_id, v_y4_id, 3, '09:00', '10:00', 'Maths',    'Room 5'),
    (v_org_id, v_y4_id, 3, '10:15', '11:00', 'English',   'Room 5'),
    (v_org_id, v_y4_id, 3, '11:00', '11:45', 'Reading',   'Room 5'),
    (v_org_id, v_y4_id, 3, '13:00', '13:45', 'Geography', 'Room 5'),
    (v_org_id, v_y4_id, 3, '13:45', '14:30', 'Art',       'Art Room'),
    -- Thursday
    (v_org_id, v_y4_id, 4, '09:00', '10:00', 'Maths',    'Room 5'),
    (v_org_id, v_y4_id, 4, '10:15', '11:00', 'English',   'Room 5'),
    (v_org_id, v_y4_id, 4, '11:00', '11:45', 'Science',   'Room 5'),
    (v_org_id, v_y4_id, 4, '13:00', '14:00', 'PE',        'Field'),
    (v_org_id, v_y4_id, 4, '14:00', '14:30', 'Computing', 'ICT Suite'),
    -- Friday
    (v_org_id, v_y4_id, 5, '09:00', '10:00', 'Maths',    'Room 5'),
    (v_org_id, v_y4_id, 5, '10:15', '11:00', 'English',   'Room 5'),
    (v_org_id, v_y4_id, 5, '11:00', '11:45', 'RE',        'Room 5'),
    (v_org_id, v_y4_id, 5, '13:00', '13:45', 'DT',        'DT Room'),
    (v_org_id, v_y4_id, 5, '13:45', '14:30', 'French',    'Room 5')
  ON CONFLICT (class_id, day_of_week, start_time) DO NOTHING;

  -- ─── Scheme Mappings for Y4 ────────────────────────────────────────

  INSERT INTO ls_scheme_mappings (organization_id, class_id, subject, scheme_name, scheme_config)
  VALUES
    (v_org_id, v_y4_id, 'Maths',     'White Rose Maths', '{"current_unit": "Fractions", "current_step": 1}'),
    (v_org_id, v_y4_id, 'English',    'Talk for Writing',  '{"current_unit": "Persuasion", "current_step": 1}'),
    (v_org_id, v_y4_id, 'Science',    'Kapow',             '{"current_unit": "Sound", "current_step": 1}'),
    (v_org_id, v_y4_id, 'History',    'Kapow',             '{"current_unit": "Anglo-Saxons", "current_step": 1}'),
    (v_org_id, v_y4_id, 'Geography',  'Kapow',             '{"current_unit": "Rivers", "current_step": 1}'),
    (v_org_id, v_y4_id, 'Computing',  'Teach Computing',   '{"current_unit": "Repetition in games", "current_step": 1}'),
    (v_org_id, v_y4_id, 'Art',        'Kapow',             '{"current_unit": "Sculpture and 3D", "current_step": 1}'),
    (v_org_id, v_y4_id, 'DT',         'Kapow',             '{"current_unit": "Mechanical systems", "current_step": 1}'),
    (v_org_id, v_y4_id, 'Music',      'Charanga',          '{"current_unit": "Lean on Me", "current_step": 1}'),
    (v_org_id, v_y4_id, 'RE',         'Understanding Christianity', '{"current_unit": "Salvation", "current_step": 1}'),
    (v_org_id, v_y4_id, 'French',     'Language Angels',   '{"current_unit": "Les animaux", "current_step": 1}'),
    (v_org_id, v_y4_id, 'PSHE',       'Jigsaw',            '{"current_unit": "Healthy Me", "current_step": 1}'),
    (v_org_id, v_y4_id, 'PE',         'Real PE',           '{"current_unit": "Social Skills", "current_step": 1}')
  ON CONFLICT (class_id, subject) DO NOTHING;

  -- ─── White Rose Y4 Spring Fractions Progression ────────────────────

  INSERT INTO ls_scheme_progressions (scheme_name, subject, year_group, term, unit_name, unit_order, steps, nc_objective_codes, methodology_notes)
  VALUES
    ('White Rose Maths', 'Maths', 'Year 4', 'spring', 'Fractions', 1,
     '[
       {"step": 1, "title": "What is a fraction?", "nc_codes": ["Y4-F1"]},
       {"step": 2, "title": "Equivalent fractions (1)", "nc_codes": ["Y4-F2"]},
       {"step": 3, "title": "Equivalent fractions (2)", "nc_codes": ["Y4-F2"]},
       {"step": 4, "title": "Fractions greater than 1", "nc_codes": ["Y4-F3"]},
       {"step": 5, "title": "Count in fractions", "nc_codes": ["Y4-F4"]},
       {"step": 6, "title": "Add 2 or more fractions", "nc_codes": ["Y4-F5"]},
       {"step": 7, "title": "Subtract 2 fractions", "nc_codes": ["Y4-F6"]},
       {"step": 8, "title": "Subtract from whole amounts", "nc_codes": ["Y4-F6"]},
       {"step": 9, "title": "Fractions of a set of objects (1)", "nc_codes": ["Y4-F7"]},
       {"step": 10, "title": "Fractions of a set of objects (2)", "nc_codes": ["Y4-F7"]},
       {"step": 11, "title": "Calculate quantities", "nc_codes": ["Y4-F8"]},
       {"step": 12, "title": "Problem solving — fractions", "nc_codes": ["Y4-F1","Y4-F2","Y4-F5","Y4-F6","Y4-F7"]}
     ]',
     '{Y4-F1,Y4-F2,Y4-F3,Y4-F4,Y4-F5,Y4-F6,Y4-F7,Y4-F8}',
     'Concrete-Pictorial-Abstract approach. Small steps mastery. Pupils must demonstrate fluency before moving on. Use fraction strips, fraction walls, bar models. CPA progression: physical manipulatives → drawings/diagrams → abstract notation.')
  ON CONFLICT (scheme_name, subject, year_group, term, unit_name) DO NOTHING;

  RAISE NOTICE 'Lesson Studio seed data loaded for org %', v_org_id;
END $$;
