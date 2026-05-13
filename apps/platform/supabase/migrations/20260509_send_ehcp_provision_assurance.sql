-- ============================================================
-- SEND Copilot: EHCP provision assurance
-- Date: 2026-05-09
-- Purpose: Track whether Section F provision is being delivered,
--          evidenced, reviewed and escalated.
-- ============================================================

CREATE TABLE IF NOT EXISTS send_ehcp_provision_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  ehcp_section text NOT NULL DEFAULT 'F',
  provision_text text NOT NULL,
  quantified_expectation text NOT NULL,
  delivery_owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  delivery_owner_name text,
  delivery_frequency text,
  delivery_location text,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'ended', 'disputed')),
  source_evidence_file_id uuid REFERENCES sen_evidence_files(id) ON DELETE SET NULL,
  source_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_ehcp_provision_lines_org ON send_ehcp_provision_lines(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_ehcp_provision_lines_pupil ON send_ehcp_provision_lines(send_register_id);
CREATE INDEX IF NOT EXISTS idx_send_ehcp_provision_lines_status ON send_ehcp_provision_lines(status);

CREATE TABLE IF NOT EXISTS send_ehcp_provision_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provision_line_id uuid NOT NULL REFERENCES send_ehcp_provision_lines(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  delivered_on date NOT NULL,
  delivered_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  delivered_by_name text,
  delivery_status text NOT NULL DEFAULT 'delivered'
    CHECK (delivery_status IN ('delivered', 'part_delivered', 'missed', 'cancelled', 'rearranged')),
  duration_minutes int,
  delivery_note text,
  impact_note text,
  linked_case_note_id uuid REFERENCES send_case_notes(id) ON DELETE SET NULL,
  linked_evidence_file_id uuid REFERENCES sen_evidence_files(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_ehcp_delivery_logs_org ON send_ehcp_provision_delivery_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_ehcp_delivery_logs_line ON send_ehcp_provision_delivery_logs(provision_line_id, delivered_on DESC);
CREATE INDEX IF NOT EXISTS idx_send_ehcp_delivery_logs_pupil ON send_ehcp_provision_delivery_logs(send_register_id, delivered_on DESC);
CREATE INDEX IF NOT EXISTS idx_send_ehcp_delivery_logs_status ON send_ehcp_provision_delivery_logs(delivery_status);

CREATE TABLE IF NOT EXISTS send_statutory_review_runway_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,
  annual_review_id uuid REFERENCES sen_annual_reviews(id) ON DELETE CASCADE,

  task_offset_weeks int NOT NULL,
  task_title text NOT NULL,
  task_description text NOT NULL,
  due_date date NOT NULL,
  owner_name text,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'waiting', 'completed', 'overdue', 'cancelled')),
  generated_action_id uuid REFERENCES send_pupil_actions(id) ON DELETE SET NULL,
  email_template_key text,
  document_template_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_review_runway_org ON send_statutory_review_runway_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_review_runway_pupil ON send_statutory_review_runway_tasks(send_register_id, due_date);
CREATE INDEX IF NOT EXISTS idx_send_review_runway_due ON send_statutory_review_runway_tasks(due_date)
  WHERE status NOT IN ('completed', 'cancelled');

ALTER TABLE send_ehcp_provision_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_ehcp_provision_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_statutory_review_runway_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "send_ehcp_provision_lines_select" ON send_ehcp_provision_lines
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_ehcp_provision_lines_insert" ON send_ehcp_provision_lines
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_ehcp_provision_lines_update" ON send_ehcp_provision_lines
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_ehcp_delivery_logs_select" ON send_ehcp_provision_delivery_logs
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_ehcp_delivery_logs_insert" ON send_ehcp_provision_delivery_logs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_review_runway_tasks_select" ON send_statutory_review_runway_tasks
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_review_runway_tasks_insert" ON send_statutory_review_runway_tasks
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "send_review_runway_tasks_update" ON send_statutory_review_runway_tasks
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE OR REPLACE VIEW send_ehcp_provision_assurance_summary
WITH (security_invoker = true) AS
SELECT
  epl.organization_id,
  epl.send_register_id,
  sr.pupil_id,
  sr.pupil_name_encrypted,
  sr.ehcp_annual_review_due,
  COUNT(DISTINCT epl.id) AS provision_line_count,
  COUNT(edl.id) FILTER (WHERE edl.delivery_status IN ('delivered', 'part_delivered')) AS logged_delivery_count,
  COUNT(edl.id) FILTER (WHERE edl.delivery_status IN ('missed', 'cancelled')) AS missed_delivery_count,
  MAX(edl.delivered_on) AS latest_delivery_log_date
FROM send_ehcp_provision_lines epl
JOIN send_register sr ON sr.id = epl.send_register_id
LEFT JOIN send_ehcp_provision_delivery_logs edl ON edl.provision_line_id = epl.id
GROUP BY epl.organization_id, epl.send_register_id, sr.pupil_id, sr.pupil_name_encrypted, sr.ehcp_annual_review_due;

-- ============================================================
-- Done. Adds the legal-provision assurance layer for EHCP pupils.
-- ============================================================
