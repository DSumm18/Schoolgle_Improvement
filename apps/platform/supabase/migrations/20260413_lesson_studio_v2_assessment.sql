-- Lesson Studio v2: Assessment Pipeline
-- Adds work submissions, extends assessments with moderation, calendar events

-- 1. Work Submissions — uploaded worksheets/photos linked to assessments
CREATE TABLE IF NOT EXISTS ls_work_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  lesson_plan_id UUID REFERENCES ls_lesson_plans(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES ls_pupils(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image/jpeg', 'image/png', 'image/heic', 'application/pdf', 'text/plain')),
  file_size_bytes INTEGER,
  ocr_text TEXT,
  ocr_confidence NUMERIC(4,3),
  ocr_model TEXT,
  grading_result JSONB,
  grading_model TEXT,
  grading_confidence NUMERIC(4,3),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'graded', 'reviewed', 'error')),
  error_message TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ls_work_submissions_lesson ON ls_work_submissions(lesson_plan_id);
CREATE INDEX idx_ls_work_submissions_pupil ON ls_work_submissions(pupil_id);
CREATE INDEX idx_ls_work_submissions_status ON ls_work_submissions(status);

-- 2. Extend ls_assessments with moderator fields and triangulation
ALTER TABLE ls_assessments
  ADD COLUMN IF NOT EXISTS work_submission_id UUID REFERENCES ls_work_submissions(id),
  ADD COLUMN IF NOT EXISTS moderator_grade TEXT,
  ADD COLUMN IF NOT EXISTS moderator_user_id UUID,
  ADD COLUMN IF NOT EXISTS moderator_notes TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS triangulation_status TEXT DEFAULT 'pending'
    CHECK (triangulation_status IN ('pending', 'aligned', 'majority', 'disputed', 'resolved')),
  ADD COLUMN IF NOT EXISTS misconceptions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS next_steps TEXT,
  ADD COLUMN IF NOT EXISTS feedback_text TEXT;

-- 3. Moderation Queue — flagged assessments awaiting moderator review
CREATE TABLE IF NOT EXISTS ls_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  assessment_id UUID NOT NULL REFERENCES ls_assessments(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL,
  flagged_reason TEXT,
  teacher_grade TEXT NOT NULL,
  ai_grade TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved')),
  resolved_by UUID,
  resolved_grade TEXT,
  resolved_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ls_moderation_queue_org ON ls_moderation_queue(organization_id, status);

-- 4. Calendar Events — teacher-scheduled lessons (replaces hardcoded timetable)
CREATE TABLE IF NOT EXISTS ls_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES ls_classes(id) ON DELETE CASCADE,
  teacher_user_id UUID,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  lesson_plan_id UUID REFERENCES ls_lesson_plans(id),
  recurrence_rule TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, event_date, start_time)
);

CREATE INDEX idx_ls_calendar_events_date ON ls_calendar_events(organization_id, event_date);
CREATE INDEX idx_ls_calendar_events_class ON ls_calendar_events(class_id, event_date);

-- 5. RLS Policies
ALTER TABLE ls_work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_work_submissions" ON ls_work_submissions
  USING (organization_id = current_setting('app.current_org_id', true)::UUID);
CREATE POLICY "org_isolation_moderation_queue" ON ls_moderation_queue
  USING (organization_id = current_setting('app.current_org_id', true)::UUID);
CREATE POLICY "org_isolation_calendar_events" ON ls_calendar_events
  USING (organization_id = current_setting('app.current_org_id', true)::UUID);
