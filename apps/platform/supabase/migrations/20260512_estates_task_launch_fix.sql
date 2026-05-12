-- Estates launch readiness fixes
-- Keep task creation aligned with the application task UI/API.

ALTER TABLE public.estates_compliance_tasks
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('critical', 'high', 'medium', 'low'));

UPDATE public.estates_compliance_tasks
SET priority = 'medium'
WHERE priority IS NULL;

CREATE INDEX IF NOT EXISTS idx_estates_tasks_priority
  ON public.estates_compliance_tasks(priority);
