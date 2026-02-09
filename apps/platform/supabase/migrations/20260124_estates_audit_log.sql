-- ESTATES AUDIT LOG
-- Tracks all actions taken on statutory checks for compliance reporting

-- Create estates_audit_log table
CREATE TABLE IF NOT EXISTS public.estates_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'snoozed', 'marked_not_applicable', 'completed', 'status_changed',
    'due_date_changed', 'check_created', 'check_deleted', 'evidence_added'
  )),
  check_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.estates_audit_log IS
'Audit trail for all Estates Compliance actions';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_estates_audit_log_org ON public.estates_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_audit_log_user ON public.estates_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_estates_audit_log_check ON public.estates_audit_log(check_id);
CREATE INDEX IF NOT EXISTS idx_estates_audit_log_action ON public.estates_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_estates_audit_log_created ON public.estates_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.estates_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "estates_audit_log_read" ON public.estates_audit_log
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "estates_audit_log_write" ON public.estates_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
  ));

-- Service role policy
CREATE POLICY "service_estates_audit_log" ON public.estates_audit_log
  FOR ALL TO service_role USING (true);
