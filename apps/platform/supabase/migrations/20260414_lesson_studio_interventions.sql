-- Lesson Studio: Intervention Engine
-- Phase 3: EEF strategy matching, session logging, impact tracking, Ofsted narratives

-- Intervention plans per pupil
CREATE TABLE IF NOT EXISTS ls_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  pupil_id UUID NOT NULL REFERENCES ls_pupils(id) ON DELETE CASCADE,
  class_id UUID REFERENCES ls_classes(id),
  title TEXT NOT NULL,
  target TEXT NOT NULL,
  subject TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('one_to_one', 'small_group', 'in_class', 'catch_up', 'homework')),
  frequency TEXT,
  duration_weeks INTEGER,
  delivered_by TEXT,
  eef_strategy_id TEXT,
  eef_strategy_name TEXT,
  eef_impact_months NUMERIC(3,1),
  success_criteria TEXT,
  lesson_adaptations TEXT,
  resources TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  started_at DATE,
  target_end_date DATE,
  completed_at DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ls_interventions_pupil ON ls_interventions(pupil_id, status);
CREATE INDEX idx_ls_interventions_org ON ls_interventions(organization_id, status);

-- Session log entries
CREATE TABLE IF NOT EXISTS ls_intervention_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID NOT NULL REFERENCES ls_interventions(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  session_date DATE NOT NULL,
  duration_minutes INTEGER,
  delivered_by TEXT,
  focus TEXT NOT NULL,
  observation TEXT,
  next_session_plan TEXT,
  progress_note TEXT,
  stage TEXT CHECK (stage IN ('concrete', 'pictorial', 'abstract', 'fluency', 'application')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ls_intervention_sessions ON ls_intervention_sessions(intervention_id);

-- RLS
ALTER TABLE ls_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_intervention_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_interventions" ON ls_interventions
  USING (organization_id = current_setting('app.current_org_id', true)::UUID);
