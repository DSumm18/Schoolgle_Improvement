-- Estates Risk Control Checks
-- Ticket-linked temporary controls suggested by AI/staff and completed by site teams.

CREATE TABLE IF NOT EXISTS public.estates_risk_control_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.estates_helpdesk_tickets(id) ON DELETE CASCADE,
  risk_id UUID REFERENCES public.risk_register(id) ON DELETE SET NULL,
  recommendation_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  frequency_required TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency_required IN ('daily', 'weekly', 'custom')),
  requires_photo BOOLEAN NOT NULL DEFAULT true,
  requires_notes BOOLEAN NOT NULL DEFAULT true,
  evidence_prompt TEXT,
  escalation_if_failed TEXT,
  risk_score_if_missed INTEGER CHECK (risk_score_if_missed BETWEEN 1 AND 25),
  status TEXT NOT NULL CHECK (status IN ('accepted', 'declined')),
  accepted_by UUID,
  accepted_at TIMESTAMPTZ,
  declined_by UUID,
  declined_at TIMESTAMPTZ,
  declined_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, ticket_id, recommendation_id)
);

ALTER TABLE public.estates_helpdesk_activity
  DROP CONSTRAINT IF EXISTS estates_helpdesk_activity_activity_type_check;

ALTER TABLE public.estates_helpdesk_activity
  ADD CONSTRAINT estates_helpdesk_activity_activity_type_check
  CHECK (activity_type IN (
    'created', 'assigned', 'status_changed', 'priority_changed',
    'comment_added', 'resolved', 'closed', 'reopened', 'sla_breached',
    'risk_assessed', 'risk_control_reviewed', 'risk_control_completed',
    'risk_control_escalated'
  ));

CREATE TABLE IF NOT EXISTS public.estates_risk_control_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.estates_helpdesk_tickets(id) ON DELETE CASCADE,
  risk_id UUID REFERENCES public.risk_register(id) ON DELETE SET NULL,
  recommendation_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  frequency_required TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency_required IN ('daily', 'weekly', 'custom')),
  requires_photo BOOLEAN NOT NULL DEFAULT true,
  requires_notes BOOLEAN NOT NULL DEFAULT true,
  evidence_prompt TEXT,
  escalation_if_failed TEXT,
  risk_score_if_missed INTEGER CHECK (risk_score_if_missed BETWEEN 1 AND 25),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed')),
  next_due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_completed_at TIMESTAMPTZ,
  missed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, ticket_id, recommendation_id)
);

CREATE TABLE IF NOT EXISTS public.estates_risk_control_check_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES public.estates_risk_control_checks(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.estates_helpdesk_tickets(id) ON DELETE CASCADE,
  risk_id UUID REFERENCES public.risk_register(id) ON DELETE SET NULL,
  result TEXT NOT NULL CHECK (result IN ('ok', 'not_ok', 'missed')),
  notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  completed_by UUID,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  risk_score_before INTEGER,
  risk_score_after INTEGER,
  escalation_required BOOLEAN NOT NULL DEFAULT false,
  escalation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_control_recs_ticket
  ON public.estates_risk_control_recommendations(organization_id, ticket_id);

CREATE INDEX IF NOT EXISTS idx_risk_control_checks_due
  ON public.estates_risk_control_checks(organization_id, status, next_due_date);

CREATE INDEX IF NOT EXISTS idx_risk_control_checks_ticket
  ON public.estates_risk_control_checks(organization_id, ticket_id);

CREATE INDEX IF NOT EXISTS idx_risk_control_logs_check
  ON public.estates_risk_control_check_logs(check_id, completed_at DESC);

ALTER TABLE public.estates_risk_control_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_risk_control_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates_risk_control_check_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_control_recommendations_org_read"
  ON public.estates_risk_control_recommendations
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "risk_control_checks_org_read"
  ON public.estates_risk_control_checks
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "risk_control_logs_org_read"
  ON public.estates_risk_control_check_logs
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "risk_control_recommendations_service_all"
  ON public.estates_risk_control_recommendations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "risk_control_checks_service_all"
  ON public.estates_risk_control_checks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "risk_control_logs_service_all"
  ON public.estates_risk_control_check_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_estates_risk_control_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS estates_risk_control_recs_updated_at
  ON public.estates_risk_control_recommendations;
CREATE TRIGGER estates_risk_control_recs_updated_at
  BEFORE UPDATE ON public.estates_risk_control_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_estates_risk_control_updated_at();

DROP TRIGGER IF EXISTS estates_risk_control_checks_updated_at
  ON public.estates_risk_control_checks;
CREATE TRIGGER estates_risk_control_checks_updated_at
  BEFORE UPDATE ON public.estates_risk_control_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_estates_risk_control_updated_at();

COMMENT ON TABLE public.estates_risk_control_recommendations IS
'Audit trail of AI/staff risk-control recommendations accepted or declined from helpdesk tickets.';

COMMENT ON TABLE public.estates_risk_control_checks IS
'Active ticket-linked Risk Control Checks that appear in the site team daily list.';

COMMENT ON TABLE public.estates_risk_control_check_logs IS
'Evidence log for Risk Control Check completions, misses and failed checks.';
