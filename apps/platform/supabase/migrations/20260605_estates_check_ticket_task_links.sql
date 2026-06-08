-- Link helpdesk tickets and compliance tasks directly to statutory/custom checks.
-- This completes the Estates "asset <-> contractor <-> check <-> ticket/task" audit trail.

ALTER TABLE public.estates_helpdesk_tickets
  ADD COLUMN IF NOT EXISTS compliance_domain TEXT,
  ADD COLUMN IF NOT EXISTS statutory_check_id TEXT,
  ADD COLUMN IF NOT EXISTS custom_check_id UUID REFERENCES public.custom_checks(id) ON DELETE SET NULL;

ALTER TABLE public.estates_compliance_tasks
  ADD COLUMN IF NOT EXISTS statutory_check_id TEXT,
  ADD COLUMN IF NOT EXISTS custom_check_id UUID REFERENCES public.custom_checks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_tickets_check
  ON public.estates_helpdesk_tickets(organization_id, compliance_domain, statutory_check_id);

CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_tickets_custom_check
  ON public.estates_helpdesk_tickets(organization_id, custom_check_id);

CREATE INDEX IF NOT EXISTS idx_estates_compliance_tasks_check
  ON public.estates_compliance_tasks(organization_id, compliance_domain, statutory_check_id);

CREATE INDEX IF NOT EXISTS idx_estates_compliance_tasks_custom_check
  ON public.estates_compliance_tasks(organization_id, custom_check_id);

COMMENT ON COLUMN public.estates_helpdesk_tickets.statutory_check_id IS
  'Text ID of the statutory/good-practice compliance check that raised or relates to this ticket.';
COMMENT ON COLUMN public.estates_helpdesk_tickets.custom_check_id IS
  'Custom check UUID that raised or relates to this ticket.';
COMMENT ON COLUMN public.estates_compliance_tasks.statutory_check_id IS
  'Text ID of the statutory/good-practice compliance check that raised or relates to this task.';
COMMENT ON COLUMN public.estates_compliance_tasks.custom_check_id IS
  'Custom check UUID that raised or relates to this task.';
