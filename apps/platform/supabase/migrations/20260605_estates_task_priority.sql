-- Store task priority selected in the Estates task UI.
-- Helpdesk tickets already have priority; compliance follow-up tasks need the
-- same backend persistence so asset/contractor-linked remedial work can be
-- triaged consistently.

ALTER TABLE public.estates_compliance_tasks
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
CHECK (priority IN ('critical', 'high', 'medium', 'low'));

COMMENT ON COLUMN public.estates_compliance_tasks.priority IS
'Task urgency selected in the Estates task UI. Used for compliance follow-up and contractor work triage.';

CREATE INDEX IF NOT EXISTS idx_estates_tasks_priority
  ON public.estates_compliance_tasks(priority);
