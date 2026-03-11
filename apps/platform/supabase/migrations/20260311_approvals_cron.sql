-- Approval Routing & Cron Infrastructure
-- Creates tables for:
--   1. Approval requests and decisions
--   2. Approval rules (org-specific overrides)
--   3. Cron run log for audit trail

-- ═══════════════════════════════════════════════════════════════════════
-- 1. approval_requests — stopping controls for spend and decisions
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL CHECK (approval_type IN (
    'spend', 'contract', 'policy', 'risk_decision', 'recruitment', 'disposal'
  )),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'GBP',

  -- Requester
  requested_by UUID NOT NULL,
  requested_by_name TEXT,
  requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Approval routing
  required_tier TEXT NOT NULL CHECK (required_tier IN (
    'headteacher', 'slt', 'cfo', 'ceo', 'board', 'members'
  )),
  current_status TEXT NOT NULL DEFAULT 'pending' CHECK (current_status IN (
    'pending', 'approved', 'rejected', 'escalated', 'expired', 'withdrawn'
  )),

  -- Decision
  decided_by UUID,
  decided_by_name TEXT,
  decided_at TIMESTAMPTZ,
  rejected_reason TEXT,

  -- Escalation
  escalated_to TEXT CHECK (escalated_to IS NULL OR escalated_to IN (
    'headteacher', 'slt', 'cfo', 'ceo', 'board', 'members'
  )),
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,

  -- SLA
  sla_hours INT DEFAULT 48,
  sla_breached BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,

  -- Links
  linked_risk_id UUID,
  linked_task_id UUID,
  linked_strategic_plan_item_id UUID,
  linked_purchase_order TEXT,

  -- Supporting info
  supporting_documents JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_org_status
  ON approval_requests(organization_id, current_status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by
  ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type
  ON approval_requests(approval_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_sla
  ON approval_requests(sla_breached) WHERE sla_breached = true;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. approval_decisions_log — append-only audit trail
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS approval_decisions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'approved', 'rejected', 'escalated', 'expired',
    'withdrawn', 'sla_breached', 'reminder_sent'
  )),
  performed_by UUID,
  performed_by_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_approval_log_request
  ON approval_decisions_log(approval_request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_approval_log_org
  ON approval_decisions_log(organization_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. approval_rules — org-specific overrides of default thresholds
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL CHECK (approval_type IN (
    'spend', 'contract', 'policy', 'risk_decision', 'recruitment', 'disposal'
  )),
  min_amount NUMERIC(12,2),
  max_amount NUMERIC(12,2),
  required_tier TEXT NOT NULL CHECK (required_tier IN (
    'headteacher', 'slt', 'cfo', 'ceo', 'board', 'members'
  )),
  requires_minute BOOLEAN DEFAULT false,
  sla_hours INT DEFAULT 48,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, approval_type, min_amount, max_amount)
);

CREATE INDEX IF NOT EXISTS idx_approval_rules_org
  ON approval_rules(organization_id, active) WHERE active = true;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. cron_run_log — tracks daily cron execution
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cron_run_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN (
    'running', 'completed', 'failed', 'partial'
  )),
  summary JSONB DEFAULT '{}',
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cron_log_job_date
  ON cron_run_log(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_log_org
  ON cron_run_log(organization_id) WHERE organization_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. RLS Policies
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_decisions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_run_log ENABLE ROW LEVEL SECURITY;

-- Approval requests: org members can view, requesters and approvers can modify
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'approval_requests_select') THEN
  CREATE POLICY approval_requests_select ON approval_requests FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'approval_requests_insert') THEN
  CREATE POLICY approval_requests_insert ON approval_requests FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'approval_requests_update') THEN
  CREATE POLICY approval_requests_update ON approval_requests FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Approval decisions log: org members can view, insert only
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'approval_log_select') THEN
  CREATE POLICY approval_log_select ON approval_decisions_log FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'approval_log_insert') THEN
  CREATE POLICY approval_log_insert ON approval_decisions_log FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

-- Approval rules: org members can view, admins can modify
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'approval_rules_select') THEN
  CREATE POLICY approval_rules_select ON approval_rules FOR SELECT
    USING (organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'approval_rules_insert') THEN
  CREATE POLICY approval_rules_insert ON approval_rules FOR INSERT
    WITH CHECK (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher')
    ));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'approval_rules_update') THEN
  CREATE POLICY approval_rules_update ON approval_rules FOR UPDATE
    USING (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher')
    ));
END IF;
END $$;

-- Cron run log: service role only (no user access needed, but admins can view)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cron_log_select') THEN
  CREATE POLICY cron_log_select ON cron_run_log FOR SELECT
    USING (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher')
      )
    );
END IF;
END $$;

-- Service role bypass for cron operations
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cron_log_service_insert') THEN
  CREATE POLICY cron_log_service_insert ON cron_run_log FOR INSERT
    WITH CHECK (true);
END IF;
END $$;
