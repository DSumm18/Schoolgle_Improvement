-- ============================================================================
-- Dynamic Risk Scoring Engine — Schema Additions
-- Task 024: Adds escalation/de-escalation tracking, score change history,
-- and auto-escalation support for the dynamic risk scoring engine.
-- ============================================================================

-- ─── 1. Add missing columns to risk_register ─────────────────────────────────

ALTER TABLE risk_register
  ADD COLUMN IF NOT EXISTS auto_escalation_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE risk_register
  ADD COLUMN IF NOT EXISTS control_effectiveness_pct INT DEFAULT 0;

ALTER TABLE risk_register
  ADD COLUMN IF NOT EXISTS created_by_ai BOOLEAN DEFAULT false;

ALTER TABLE risk_register
  ADD COLUMN IF NOT EXISTS approved_by UUID;

ALTER TABLE risk_register
  ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ;

-- ─── 2. Add change_reason and previous_score to risk_score_history ────────────

ALTER TABLE risk_score_history
  ADD COLUMN IF NOT EXISTS change_reason TEXT;

ALTER TABLE risk_score_history
  ADD COLUMN IF NOT EXISTS previous_score INT;

-- Drop the old trigger_type constraint and replace with expanded list
ALTER TABLE risk_score_history
  DROP CONSTRAINT IF EXISTS trigger_type_check;

ALTER TABLE risk_score_history
  ADD CONSTRAINT trigger_type_check CHECK (trigger_type IS NULL OR trigger_type IN (
    'task_completed', 'task_overdue', 'incident_logged', 'mitigation_added',
    'manual_override', 'scheduled_review', 'evidence_uploaded', 'override_expired',
    -- New dynamic scoring triggers
    'system_auto', 'user_action', 'check_completion', 'check_missed',
    'escalation_timer', 'daily_sync', 'incident',
    'check_overdue', 'repeat_failure', 'contractor_visit_cancelled',
    'critical_no_action_24hrs',
    'mitigation_confirmed', 'monitoring_check_completed',
    'permanent_fix_verified', 'professional_inspection_safe',
    'staff_notification_confirmed'
  ));

-- ─── 3. risk_score_events — Granular event log for escalation/de-escalation ──

CREATE TABLE IF NOT EXISTS risk_score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Can reference either a ticket, compliance check, or risk register entry
  ticket_id UUID,
  compliance_check_id UUID,
  risk_id UUID REFERENCES risk_register(id) ON DELETE SET NULL,

  -- Score tracking
  previous_score INT NOT NULL,
  new_score INT NOT NULL,
  change_amount INT NOT NULL,
  risk_level TEXT NOT NULL,
  change_reason TEXT NOT NULL,

  -- Trigger classification
  triggered_by TEXT NOT NULL,
  triggered_by_user_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps (append-only)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT risk_level_check CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT triggered_by_check CHECK (triggered_by IN (
    'system_auto', 'user_action', 'check_completion', 'check_missed',
    'escalation_timer',
    'check_overdue', 'repeat_failure', 'contractor_visit_cancelled',
    'critical_no_action_24hrs',
    'mitigation_confirmed', 'monitoring_check_completed',
    'permanent_fix_verified', 'professional_inspection_safe',
    'staff_notification_confirmed'
  ))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_risk_score_events_org
  ON risk_score_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_score_events_ticket
  ON risk_score_events(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_score_events_risk
  ON risk_score_events(risk_id) WHERE risk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_score_events_compliance
  ON risk_score_events(compliance_check_id) WHERE compliance_check_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_score_events_created
  ON risk_score_events(created_at DESC);

-- ─── 4. RLS Policies for risk_score_events ───────────────────────────────────

ALTER TABLE risk_score_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for cron jobs / background processing)
CREATE POLICY risk_score_events_service_all ON risk_score_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read events for their organization
CREATE POLICY risk_score_events_org_read ON risk_score_events
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ─── 5. Add risk_score column to estates_helpdesk_tickets if missing ─────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estates_helpdesk_tickets'
    AND column_name = 'risk_score'
  ) THEN
    ALTER TABLE estates_helpdesk_tickets ADD COLUMN risk_score INT;
  END IF;
END $$;

-- ─── 6. View: risk timeline for a ticket (joins events for timeline UI) ──────

CREATE OR REPLACE VIEW risk_score_timeline AS
SELECT
  rse.id,
  rse.organization_id,
  rse.ticket_id,
  rse.compliance_check_id,
  rse.risk_id,
  rse.previous_score,
  rse.new_score,
  rse.change_amount,
  rse.risk_level,
  rse.change_reason,
  rse.triggered_by,
  rse.triggered_by_user_id,
  u.email AS triggered_by_email,
  rse.metadata,
  rse.created_at
FROM risk_score_events rse
LEFT JOIN users u ON u.id = rse.triggered_by_user_id
ORDER BY rse.created_at ASC;
