-- ============================================================
-- Approval Requests & Audit Log
-- ATH 2025 delegation controls and spending authority
-- ============================================================

-- ─── Approval Requests ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Request details
  type            text NOT NULL CHECK (type IN ('spend','contract','policy','risk_decision','recruitment','disposal')),
  title           text NOT NULL,
  description     text NOT NULL DEFAULT '',
  amount          numeric(12,2),

  -- Requester
  requested_by      uuid NOT NULL,
  requested_by_name text NOT NULL DEFAULT 'Unknown',

  -- Approval routing
  required_tier     text NOT NULL CHECK (required_tier IN ('headteacher','slt','cfo','ceo','board','members')),
  current_status    text NOT NULL DEFAULT 'pending' CHECK (current_status IN ('pending','approved','rejected','escalated','expired')),
  requires_minute   boolean NOT NULL DEFAULT false,

  -- Resolution
  approved_by       uuid,
  approved_by_name  text,
  approved_at       timestamptz,
  rejected_reason   text,

  -- Escalation
  escalated_to      text CHECK (escalated_to IS NULL OR escalated_to IN ('headteacher','slt','cfo','ceo','board','members')),
  escalated_at      timestamptz,

  -- SLA
  expires_at        timestamptz,

  -- Links to other entities
  linked_risk_id    uuid,
  linked_task_id    uuid,

  -- Flexible metadata
  metadata          jsonb,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_approval_requests_org
  ON approval_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status
  ON approval_requests(organization_id, current_status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type
  ON approval_requests(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by
  ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_expires
  ON approval_requests(expires_at)
  WHERE current_status = 'pending';

-- RLS
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view approval requests" ON approval_requests;
CREATE POLICY "Org members can view approval requests"
  ON approval_requests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members can insert approval requests" ON approval_requests;
CREATE POLICY "Org members can insert approval requests"
  ON approval_requests FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "SLT+ can update approval requests" ON approval_requests;
CREATE POLICY "SLT+ can update approval requests"
  ON approval_requests FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('slt','headteacher','admin')
    )
  );

-- ─── Approval Audit Log ────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id     uuid NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  action          text NOT NULL, -- approve, reject, escalate, expire, create
  actor_user_id   uuid,
  actor_name      text,
  actor_role      text,
  reason          text,

  previous_status text,
  new_status      text,

  metadata        jsonb,

  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_audit_log_approval
  ON approval_audit_log(approval_id);
CREATE INDEX IF NOT EXISTS idx_approval_audit_log_org
  ON approval_audit_log(organization_id);

-- RLS
ALTER TABLE approval_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view audit log" ON approval_audit_log;
CREATE POLICY "Org members can view audit log"
  ON approval_audit_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert audit log" ON approval_audit_log;
CREATE POLICY "Service role can insert audit log"
  ON approval_audit_log FOR INSERT
  WITH CHECK (true);
