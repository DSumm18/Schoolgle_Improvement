-- Class Builder
-- Collects pupil friendship/work-preference choices and stores deterministic
-- draft class group outputs for staff review.

CREATE TABLE IF NOT EXISTS pupils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_id TEXT NOT NULL,
  pupil_ref TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  year_group TEXT NOT NULL,
  class_name TEXT,
  gender TEXT,
  is_pupil_premium BOOLEAN DEFAULT false,
  is_eal BOOLEAN DEFAULT false,
  is_looked_after BOOLEAN DEFAULT false,
  has_send_support BOOLEAN DEFAULT false,
  sen_status TEXT,
  primary_need TEXT,
  fsm_eligible BOOLEAN DEFAULT false,
  ethnicity TEXT,
  is_active BOOLEAN DEFAULT true,
  import_source TEXT,
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, pupil_id)
);

ALTER TABLE pupils ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS current_class TEXT;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS send_status TEXT;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS ehcp BOOLEAN DEFAULT false;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS pupil_access_token_hash TEXT;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS pupil_access_token_encrypted TEXT;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS pass_colour TEXT;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS pass_animal TEXT;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS pass_badge TEXT;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS pass_codename TEXT;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS pass_revoked_at TIMESTAMPTZ;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS pass_last_used_at TIMESTAMPTZ;

UPDATE pupils
SET current_class = COALESCE(current_class, class_name),
    send_status = COALESCE(send_status, sen_status),
    ehcp = COALESCE(ehcp, sen_status = 'E')
WHERE current_class IS NULL OR send_status IS NULL OR ehcp IS NULL;

CREATE TABLE IF NOT EXISTS class_builder_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  school_id UUID,
  year_group TEXT NOT NULL,
  current_class TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  target_class_count INTEGER NOT NULL DEFAULT 2 CHECK (target_class_count IN (2, 3)),
  survey_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closes_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS class_builder_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES class_builder_sessions(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES pupils(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, pupil_id)
);

CREATE TABLE IF NOT EXISTS class_builder_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES class_builder_responses(id) ON DELETE CASCADE,
  chooser_pupil_id UUID NOT NULL REFERENCES pupils(id) ON DELETE CASCADE,
  chosen_pupil_id UUID NOT NULL REFERENCES pupils(id) ON DELETE CASCADE,
  choice_type TEXT NOT NULL CHECK (choice_type IN ('friendship', 'work_well')),
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  CHECK (chooser_pupil_id <> chosen_pupil_id),
  UNIQUE(response_id, choice_type, rank),
  UNIQUE(response_id, choice_type, chosen_pupil_id)
);

CREATE TABLE IF NOT EXISTS generated_class_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES class_builder_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pupil_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE class_builder_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_builder_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_builder_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pupils ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on pupils" ON pupils;
CREATE POLICY "Service role full access on pupils" ON pupils
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on class builder sessions" ON class_builder_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on class builder responses" ON class_builder_responses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on class builder choices" ON class_builder_choices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on generated class groups" ON generated_class_groups
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_class_builder_sessions_org ON class_builder_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_class_builder_sessions_code ON class_builder_sessions(survey_code);
CREATE INDEX IF NOT EXISTS idx_class_builder_responses_session ON class_builder_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_class_builder_choices_response ON class_builder_choices(response_id);
CREATE INDEX IF NOT EXISTS idx_generated_class_groups_session ON generated_class_groups(session_id);
CREATE INDEX IF NOT EXISTS idx_pupils_class_builder_cohort ON pupils(organization_id, year_group, current_class);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pupils_access_token_hash ON pupils(pupil_access_token_hash)
  WHERE pupil_access_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pupils_pass_class ON pupils(organization_id, current_class, pass_codename);
