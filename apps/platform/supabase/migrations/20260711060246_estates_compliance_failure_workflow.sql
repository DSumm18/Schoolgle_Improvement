-- Complete the estates compliance -> helpdesk lifecycle.
ALTER TABLE public.estates_statutory_completions
  DROP CONSTRAINT IF EXISTS estates_statutory_completions_status_check;
ALTER TABLE public.estates_statutory_completions
  ADD CONSTRAINT estates_statutory_completions_status_check CHECK (status IN (
    'pending', 'completed', 'failed', 'overdue', 'not_applicable',
    'in_progress', 'awaiting_documentation'
  ));
ALTER TABLE public.estates_statutory_completions
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.estates_helpdesk_tickets
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS statutory_completion_id UUID REFERENCES public.estates_statutory_completions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_estates_statutory_completions_assignment
  ON public.estates_statutory_completions(organization_id, assigned_to, team_id);
CREATE INDEX IF NOT EXISTS idx_estates_helpdesk_tickets_team
  ON public.estates_helpdesk_tickets(organization_id, team_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_estates_helpdesk_completion_failure
  ON public.estates_helpdesk_tickets(statutory_completion_id)
  WHERE statutory_completion_id IS NOT NULL AND created_via = 'auto_generated';
ALTER TABLE public.estates_helpdesk_activity
  DROP CONSTRAINT IF EXISTS estates_helpdesk_activity_activity_type_check;
ALTER TABLE public.estates_helpdesk_activity
  ADD CONSTRAINT estates_helpdesk_activity_activity_type_check CHECK (activity_type IN (
    'created', 'assigned', 'team_assigned', 'contractor_assigned',
    'status_changed', 'priority_changed', 'comment_added', 'evidence_added',
    'resolved', 'closed', 'reopened', 'sla_breached'
  ));
