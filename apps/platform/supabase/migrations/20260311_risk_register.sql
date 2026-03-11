-- ============================================================================
-- Risk Register Module - Complete Schema
-- Provides enterprise risk management for schools and trusts with:
--   - Multi-tier risk tracking (strategic, operational, school)
--   - Dual scoring (system-calculated + manual override with audit trail)
--   - Cross-module integration (estates, compliance, HR, governance, etc.)
--   - Risk appetite framework per category
--   - Append-only score history for governance audit
--   - 4T decision tracking (treat, tolerate, transfer, terminate)
-- ============================================================================

-- ─── Extend organizations table with trust hierarchy & risk appetite ────────

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'school';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES organizations(id);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS delegation_limit NUMERIC(12,2) DEFAULT 5000;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS risk_appetite JSONB DEFAULT '{}';

-- ============================================================================
-- 1. risk_register - Core risk entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trust_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Identification
  risk_ref TEXT,
  title TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL DEFAULT 'school',
  status TEXT NOT NULL DEFAULT 'identified',
  risk_categories TEXT[] NOT NULL DEFAULT '{}',

  -- Source cross-reference
  source_module TEXT,
  source_task_id UUID,
  source_table TEXT,

  -- Inherent scoring (before any mitigations)
  inherent_likelihood INT CHECK (inherent_likelihood BETWEEN 1 AND 5),
  inherent_impact INT CHECK (inherent_impact BETWEEN 1 AND 5),
  inherent_score INT GENERATED ALWAYS AS (inherent_likelihood * inherent_impact) STORED,

  -- Multi-dimensional impact
  impact_by_category JSONB DEFAULT '{}',

  -- System-calculated residual (auto-updated by application when mitigations change)
  system_residual_likelihood INT CHECK (system_residual_likelihood BETWEEN 1 AND 5),
  system_residual_impact INT CHECK (system_residual_impact BETWEEN 1 AND 5),
  system_residual_score INT GENERATED ALWAYS AS (system_residual_likelihood * system_residual_impact) STORED,

  -- Manual override residual (headteacher/board can override system score)
  override_residual_likelihood INT CHECK (override_residual_likelihood BETWEEN 1 AND 5),
  override_residual_impact INT CHECK (override_residual_impact BETWEEN 1 AND 5),
  override_residual_score INT GENERATED ALWAYS AS (override_residual_likelihood * override_residual_impact) STORED,
  override_reason TEXT,
  override_by UUID,
  override_at TIMESTAMPTZ,
  override_expires_at TIMESTAMPTZ,

  -- Effective residual score and above-appetite flag are computed by the
  -- application layer (or via the view below) because Postgres GENERATED
  -- columns cannot reference now() or other volatile functions.
  effective_residual_score INT,
  above_appetite BOOLEAN DEFAULT false,

  -- Target and appetite
  target_score INT,
  risk_appetite_threshold INT,

  -- Ownership and links
  risk_owner_id UUID,
  risk_owner_name TEXT,
  sef_area_id TEXT,
  sdp_priority_id UUID,
  budget_line_cfr TEXT,
  legislation_refs TEXT[],

  -- Tracking
  direction_of_travel TEXT DEFAULT 'stable',
  review_frequency TEXT DEFAULT 'termly',
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  board_decision_ref TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT risk_tier_check CHECK (tier IN ('strategic', 'operational', 'school')),
  CONSTRAINT risk_status_check CHECK (status IN ('identified', 'assessing', 'treating', 'tolerated', 'accepted', 'closed')),
  CONSTRAINT risk_direction_check CHECK (direction_of_travel IN ('improving', 'stable', 'worsening')),
  CONSTRAINT risk_review_freq_check CHECK (review_frequency IN ('monthly', 'half_termly', 'termly', 'annual'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_register_org ON risk_register(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_register_trust ON risk_register(trust_organization_id) WHERE trust_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_register_status ON risk_register(status);
CREATE INDEX IF NOT EXISTS idx_risk_register_above_appetite ON risk_register(organization_id) WHERE above_appetite = true;
CREATE INDEX IF NOT EXISTS idx_risk_register_source ON risk_register(source_module, source_task_id) WHERE source_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_register_ref ON risk_register(organization_id, risk_ref) WHERE risk_ref IS NOT NULL;

-- ============================================================================
-- 2. risk_mitigations - Links risks to controls/tasks from any module
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_mitigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risk_register(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  mitigation_type TEXT NOT NULL,
  source_module TEXT NOT NULL,
  source_task_id UUID,
  source_table TEXT,

  -- Effectiveness tracking
  effectiveness TEXT DEFAULT 'not_tested',
  effectiveness_updated_at TIMESTAMPTZ,
  is_operating BOOLEAN DEFAULT false,
  last_operated_at TIMESTAMPTZ,
  frequency_required TEXT,
  overdue BOOLEAN DEFAULT false,

  -- Impact on scoring
  likelihood_reduction INT DEFAULT 0,
  impact_reduction INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT mitigation_type_check CHECK (mitigation_type IN ('preventive', 'detective', 'corrective')),
  CONSTRAINT mitigation_effectiveness_check CHECK (effectiveness IN ('effective', 'partially_effective', 'ineffective', 'not_tested')),
  CONSTRAINT mitigation_frequency_check CHECK (frequency_required IS NULL OR frequency_required IN ('daily', 'weekly', 'monthly', 'quarterly', 'termly', 'annual'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_mitigations_risk ON risk_mitigations(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_mitigations_org ON risk_mitigations(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_mitigations_source ON risk_mitigations(source_task_id) WHERE source_task_id IS NOT NULL;

-- ============================================================================
-- 3. risk_score_history - Append-only audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risk_register(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  score_type TEXT NOT NULL,

  -- System-calculated scores at time of recording
  system_likelihood INT,
  system_impact INT,
  system_score INT,

  -- Recorded (effective) scores
  recorded_likelihood INT,
  recorded_impact INT,
  recorded_score INT,

  -- Override details
  override_reason TEXT,
  override_by_user_id UUID,
  override_by_name TEXT,
  override_role TEXT,

  -- Variance
  variance_from_system NUMERIC(5,2),
  flagged_for_review BOOLEAN DEFAULT false,
  review_acknowledged_by UUID,
  review_acknowledged_at TIMESTAMPTZ,

  -- Trigger info
  trigger_type TEXT,
  trigger_source_id UUID,
  trigger_source_table TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT score_type_check CHECK (score_type IN ('system_calculated', 'manual_override', 'revert_to_system')),
  CONSTRAINT trigger_type_check CHECK (trigger_type IS NULL OR trigger_type IN (
    'task_completed', 'task_overdue', 'incident_logged', 'mitigation_added',
    'manual_override', 'scheduled_review', 'evidence_uploaded', 'override_expired'
  ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_score_history_risk ON risk_score_history(risk_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_score_history_org ON risk_score_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_score_history_flagged ON risk_score_history(risk_id) WHERE flagged_for_review = true AND review_acknowledged_at IS NULL;

-- ============================================================================
-- 4. risk_decisions - 4T decision tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risk_register(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  decision TEXT NOT NULL,
  decision_date TIMESTAMPTZ DEFAULT now(),
  decided_by UUID,
  decided_by_name TEXT,

  -- Governance links
  board_meeting_id UUID,
  minute_reference TEXT,
  rationale TEXT,
  conditions TEXT,

  -- Budget
  budget_allocated NUMERIC(12,2),
  budget_source TEXT,
  year_allocated TEXT,

  -- Review
  review_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT decision_type_check CHECK (decision IN ('treat', 'tolerate', 'transfer', 'terminate')),
  CONSTRAINT budget_source_check CHECK (budget_source IS NULL OR budget_source IN ('capital', 'revenue', 'grant', 'reserves', 'cif')),
  CONSTRAINT year_allocated_check CHECK (year_allocated IS NULL OR year_allocated IN ('year_1', 'year_2', 'year_3'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_decisions_risk ON risk_decisions(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_decisions_org ON risk_decisions(organization_id);

-- ============================================================================
-- 5. risk_events - Incidents, near misses, findings
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risk_register(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  severity TEXT,
  source_ticket_id UUID,
  impact_on_scoring JSONB,
  reported_by UUID,
  reported_by_name TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT event_type_check CHECK (event_type IN ('incident', 'near_miss', 'audit_finding', 'inspection_finding', 'complaint')),
  CONSTRAINT event_severity_check CHECK (severity IS NULL OR severity IN ('minor', 'moderate', 'major', 'critical'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_events_risk ON risk_events(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_events_org ON risk_events(organization_id);

-- ============================================================================
-- 6. risk_appetite_settings - Per-organization appetite configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_appetite_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  settings JSONB NOT NULL DEFAULT '{}',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  board_meeting_id UUID,
  review_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT risk_appetite_org_unique UNIQUE (organization_id)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- risk_register
ALTER TABLE risk_register ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_register' AND policyname = 'org_risk_register_select') THEN
    CREATE POLICY "org_risk_register_select" ON risk_register
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_register' AND policyname = 'service_risk_register') THEN
    CREATE POLICY "service_risk_register" ON risk_register
      FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- risk_mitigations
ALTER TABLE risk_mitigations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_mitigations' AND policyname = 'org_risk_mitigations_select') THEN
    CREATE POLICY "org_risk_mitigations_select" ON risk_mitigations
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_mitigations' AND policyname = 'service_risk_mitigations') THEN
    CREATE POLICY "service_risk_mitigations" ON risk_mitigations
      FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- risk_score_history (append-only: SELECT only for users, no UPDATE/DELETE)
ALTER TABLE risk_score_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_score_history' AND policyname = 'org_risk_score_history_select') THEN
    CREATE POLICY "org_risk_score_history_select" ON risk_score_history
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_score_history' AND policyname = 'service_risk_score_history') THEN
    CREATE POLICY "service_risk_score_history" ON risk_score_history
      FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- risk_decisions
ALTER TABLE risk_decisions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_decisions' AND policyname = 'org_risk_decisions_select') THEN
    CREATE POLICY "org_risk_decisions_select" ON risk_decisions
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_decisions' AND policyname = 'service_risk_decisions') THEN
    CREATE POLICY "service_risk_decisions" ON risk_decisions
      FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- risk_events
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_events' AND policyname = 'org_risk_events_select') THEN
    CREATE POLICY "org_risk_events_select" ON risk_events
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_events' AND policyname = 'service_risk_events') THEN
    CREATE POLICY "service_risk_events" ON risk_events
      FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- risk_appetite_settings
ALTER TABLE risk_appetite_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_appetite_settings' AND policyname = 'org_risk_appetite_select') THEN
    CREATE POLICY "org_risk_appetite_select" ON risk_appetite_settings
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_appetite_settings' AND policyname = 'service_risk_appetite') THEN
    CREATE POLICY "service_risk_appetite" ON risk_appetite_settings
      FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================================================
-- Views
-- ============================================================================

CREATE OR REPLACE VIEW risk_register_with_mitigations AS
SELECT
  r.*,
  COALESCE(m.mitigation_count, 0) AS mitigation_count,
  COALESCE(m.effective_mitigation_count, 0) AS effective_mitigation_count,
  COALESCE(m.operating_mitigation_count, 0) AS operating_mitigation_count,
  COALESCE(m.overdue_mitigation_count, 0) AS overdue_mitigation_count,
  COALESCE(m.total_likelihood_reduction, 0) AS total_likelihood_reduction,
  COALESCE(m.total_impact_reduction, 0) AS total_impact_reduction,
  d.latest_decision,
  d.latest_decision_date,
  d.latest_decided_by_name,
  e.event_count,
  e.latest_event_date
FROM risk_register r
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS mitigation_count,
    COUNT(*) FILTER (WHERE effectiveness = 'effective') AS effective_mitigation_count,
    COUNT(*) FILTER (WHERE is_operating = true) AS operating_mitigation_count,
    COUNT(*) FILTER (WHERE overdue = true) AS overdue_mitigation_count,
    COALESCE(SUM(likelihood_reduction), 0) AS total_likelihood_reduction,
    COALESCE(SUM(impact_reduction), 0) AS total_impact_reduction
  FROM risk_mitigations
  WHERE risk_id = r.id
) m ON true
LEFT JOIN LATERAL (
  SELECT
    decision AS latest_decision,
    decision_date AS latest_decision_date,
    decided_by_name AS latest_decided_by_name
  FROM risk_decisions
  WHERE risk_id = r.id
  ORDER BY decision_date DESC
  LIMIT 1
) d ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS event_count,
    MAX(event_date) AS latest_event_date
  FROM risk_events
  WHERE risk_id = r.id
) e ON true;

-- ============================================================================
-- Updated_at trigger function (reuse if exists, create if not)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_risk_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_risk_register_updated_at') THEN
    CREATE TRIGGER trg_risk_register_updated_at
      BEFORE UPDATE ON risk_register
      FOR EACH ROW EXECUTE FUNCTION update_risk_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_risk_mitigations_updated_at') THEN
    CREATE TRIGGER trg_risk_mitigations_updated_at
      BEFORE UPDATE ON risk_mitigations
      FOR EACH ROW EXECUTE FUNCTION update_risk_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_risk_appetite_updated_at') THEN
    CREATE TRIGGER trg_risk_appetite_updated_at
      BEFORE UPDATE ON risk_appetite_settings
      FOR EACH ROW EXECUTE FUNCTION update_risk_updated_at();
  END IF;
END $$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE risk_register IS 'Core risk entries with dual scoring (system + override) and cross-module source tracking';
COMMENT ON TABLE risk_mitigations IS 'Controls and tasks linked to risks, sourced from any Schoolgle module';
COMMENT ON TABLE risk_score_history IS 'Append-only audit trail of all risk score changes for governance reporting';
COMMENT ON TABLE risk_decisions IS '4T decision records (treat/tolerate/transfer/terminate) with board meeting links';
COMMENT ON TABLE risk_events IS 'Incidents, near misses, and findings linked to risks';
COMMENT ON TABLE risk_appetite_settings IS 'Per-organization risk appetite thresholds and stances by category';
COMMENT ON COLUMN risk_register.effective_residual_score IS 'Computed by application: uses override score if override exists and has not expired, otherwise uses system score';
COMMENT ON COLUMN risk_register.above_appetite IS 'Computed by application: true when effective_residual_score exceeds risk_appetite_threshold';
COMMENT ON VIEW risk_register_with_mitigations IS 'Enriched risk view with mitigation counts, latest decision, and event summary';
