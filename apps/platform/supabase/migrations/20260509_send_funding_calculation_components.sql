-- ============================================================
-- SEND Copilot: Transparent funding calculation components
-- Date: 2026-05-09
-- Purpose: Maintain LA funding band tables, pupil-level component
--          calculations, agreed changes and forecast payment schedule.
-- ============================================================

CREATE TABLE IF NOT EXISTS send_la_funding_band_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  la_code text NOT NULL,
  la_name text NOT NULL,
  academic_year text NOT NULL,
  band_code text NOT NULL,
  band_name text NOT NULL,
  placement_type text NOT NULL DEFAULT 'mainstream'
    CHECK (placement_type IN ('mainstream', 'special', 'arp', 'post16', 'other')),
  element_2_notional_amount numeric(10,2) NOT NULL DEFAULT 6000,
  element_3_base_amount numeric(10,2) NOT NULL DEFAULT 0,
  annual_band_total numeric(10,2) NOT NULL DEFAULT 0,
  calculation_method text NOT NULL DEFAULT 'table'
    CHECK (calculation_method IN ('table', 'points', 'hours', 'bespoke')),
  descriptors text,
  effective_from date NOT NULL,
  effective_to date,
  source_reference text,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, la_code, academic_year, band_code, placement_type, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_send_la_band_rules_org ON send_la_funding_band_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_la_band_rules_current ON send_la_funding_band_rules(organization_id, la_code, academic_year)
  WHERE is_current = true;

CREATE TABLE IF NOT EXISTS send_funding_component_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  band_rule_id uuid REFERENCES send_la_funding_band_rules(id) ON DELETE CASCADE,

  component_code text NOT NULL,
  component_name text NOT NULL,
  component_type text NOT NULL
    CHECK (component_type IN ('base', 'addon', 'deduction', 'agreed_change', 'exceptional')),
  default_annual_amount numeric(10,2) NOT NULL DEFAULT 0,
  default_monthly_amount numeric(10,2),
  eligibility_basis text,
  evidence_required text[] NOT NULL DEFAULT '{}',
  effective_from date NOT NULL,
  effective_to date,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, band_rule_id, component_code, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_send_component_rules_org ON send_funding_component_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_component_rules_band ON send_funding_component_rules(band_rule_id);

CREATE TABLE IF NOT EXISTS send_pupil_funding_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,
  funding_allocation_id uuid REFERENCES sen_funding_allocations(id) ON DELETE CASCADE,
  band_rule_id uuid REFERENCES send_la_funding_band_rules(id) ON DELETE SET NULL,
  component_rule_id uuid REFERENCES send_funding_component_rules(id) ON DELETE SET NULL,

  label text NOT NULL,
  component_type text NOT NULL
    CHECK (component_type IN ('base', 'addon', 'deduction', 'agreed_change', 'exceptional')),
  calculation_basis text NOT NULL,
  annual_amount numeric(10,2) NOT NULL,
  monthly_amount numeric(10,2) NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  status text NOT NULL DEFAULT 'current'
    CHECK (status IN ('current', 'forecast', 'superseded', 'disputed')),
  agreed_by text,
  agreement_date date,
  source_evidence_file_id uuid REFERENCES sen_evidence_files(id) ON DELETE SET NULL,
  source_note_id uuid REFERENCES send_case_notes(id) ON DELETE SET NULL,
  source_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_pupil_funding_components_org ON send_pupil_funding_components(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_pupil_funding_components_pupil ON send_pupil_funding_components(send_register_id, effective_from);
CREATE INDEX IF NOT EXISTS idx_send_pupil_funding_components_status ON send_pupil_funding_components(status);

CREATE TABLE IF NOT EXISTS send_funding_forecast_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,
  funding_allocation_id uuid REFERENCES sen_funding_allocations(id) ON DELETE CASCADE,

  period_start date NOT NULL,
  period_end date NOT NULL,
  due_date date NOT NULL,
  expected_amount numeric(10,2) NOT NULL,
  received_amount numeric(10,2) NOT NULL DEFAULT 0,
  variance_amount numeric(10,2) GENERATED ALWAYS AS (received_amount - expected_amount) STORED,
  forecast_status text NOT NULL DEFAULT 'forecast'
    CHECK (forecast_status IN ('forecast', 'received', 'shortfall', 'overpaid', 'disputed', 'cancelled')),
  forecast_basis text NOT NULL,
  generated_from_component_ids uuid[] NOT NULL DEFAULT '{}',
  receipt_reference text,
  source_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, send_register_id, period_start, period_end, due_date)
);

CREATE INDEX IF NOT EXISTS idx_send_funding_forecast_org ON send_funding_forecast_lines(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_funding_forecast_pupil ON send_funding_forecast_lines(send_register_id, due_date);
CREATE INDEX IF NOT EXISTS idx_send_funding_forecast_status ON send_funding_forecast_lines(forecast_status);

ALTER TABLE send_la_funding_band_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_funding_component_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_pupil_funding_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_funding_forecast_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "send_la_funding_band_rules_select" ON send_la_funding_band_rules
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_la_funding_band_rules_insert" ON send_la_funding_band_rules
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_la_funding_band_rules_update" ON send_la_funding_band_rules
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_funding_component_rules_select" ON send_funding_component_rules
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_funding_component_rules_insert" ON send_funding_component_rules
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_funding_component_rules_update" ON send_funding_component_rules
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_pupil_funding_components_select" ON send_pupil_funding_components
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_pupil_funding_components_insert" ON send_pupil_funding_components
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_pupil_funding_components_update" ON send_pupil_funding_components
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_funding_forecast_lines_select" ON send_funding_forecast_lines
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_funding_forecast_lines_insert" ON send_funding_forecast_lines
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_funding_forecast_lines_update" ON send_funding_forecast_lines
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE OR REPLACE VIEW send_pupil_funding_calculation_summary
WITH (security_invoker = true) AS
SELECT
  pfc.organization_id,
  pfc.send_register_id,
  sr.pupil_id,
  sr.pupil_name_encrypted,
  sr.year_group,
  sr.class_name,
  sr.ehcp_funding_band,
  SUM(CASE WHEN pfc.status IN ('current', 'forecast') THEN pfc.annual_amount ELSE 0 END) AS calculated_annual_amount,
  SUM(CASE WHEN pfc.status IN ('current', 'forecast') THEN pfc.monthly_amount ELSE 0 END) AS calculated_monthly_amount,
  SUM(CASE WHEN ffl.forecast_status IN ('forecast', 'shortfall', 'disputed') THEN ffl.expected_amount ELSE 0 END) AS expected_forecast_amount,
  SUM(CASE WHEN ffl.forecast_status IN ('received', 'shortfall', 'overpaid') THEN ffl.received_amount ELSE 0 END) AS received_amount,
  SUM(CASE WHEN ffl.forecast_status IN ('forecast', 'shortfall', 'disputed') THEN ffl.expected_amount - ffl.received_amount ELSE 0 END) AS outstanding_or_forecast_amount
FROM send_pupil_funding_components pfc
JOIN send_register sr ON sr.id = pfc.send_register_id
LEFT JOIN send_funding_forecast_lines ffl
  ON ffl.organization_id = pfc.organization_id
  AND ffl.send_register_id = pfc.send_register_id
GROUP BY
  pfc.organization_id,
  pfc.send_register_id,
  sr.pupil_id,
  sr.pupil_name_encrypted,
  sr.year_group,
  sr.class_name,
  sr.ehcp_funding_band;

-- ============================================================
-- Done. Adds maintainable funding tables and auditable forecast lines.
-- ============================================================
