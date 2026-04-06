-- Ed Audit Log: Tracks AI proposals and user decisions
-- Required for PROPOSE → APPROVE governance model
-- Terry Taurus (Estate Specialist) is the first user of this table

CREATE TABLE IF NOT EXISTS ed_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  user_email TEXT,

  -- What the AI proposed
  action_type TEXT NOT NULL, -- e.g. 'terry_create_ticket', 'terry_assess_risk'
  ai_proposal JSONB NOT NULL, -- Full TerryProposal object
  ai_confidence FLOAT, -- 0-1 confidence score

  -- What the user decided
  user_decision TEXT NOT NULL CHECK (user_decision IN ('approved', 'rejected', 'modified')),
  user_modifications JSONB, -- Fields the user changed before approving
  rejection_reason TEXT, -- Why they rejected (if applicable)

  -- Execution result
  execution_result JSONB, -- Response from skill execution
  execution_success BOOLEAN,

  -- Metadata
  ed_model_version TEXT DEFAULT 'terry-taurus-v1',
  specialist_id TEXT, -- e.g. 'estates-specialist'
  session_id TEXT, -- Chat session ID for context

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by org
CREATE INDEX IF NOT EXISTS idx_ed_audit_log_org ON ed_audit_log(organization_id);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_ed_audit_log_user ON ed_audit_log(user_id);

-- Index for querying by action type
CREATE INDEX IF NOT EXISTS idx_ed_audit_log_action ON ed_audit_log(action_type);

-- Index for querying by decision
CREATE INDEX IF NOT EXISTS idx_ed_audit_log_decision ON ed_audit_log(user_decision);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_ed_audit_log_created ON ed_audit_log(created_at DESC);

-- RLS: Organizations can only see their own audit entries
ALTER TABLE ed_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view own audit log" ON ed_audit_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert audit log" ON ed_audit_log
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Comment
COMMENT ON TABLE ed_audit_log IS 'Audit trail for Ed AI proposals and user decisions. Supports PROPOSE → APPROVE governance.';
