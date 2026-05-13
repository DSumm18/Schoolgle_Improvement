-- ============================================================
-- SEND Copilot: Confidential case file records
-- Date: 2026-05-09
-- Purpose: Store pupil-scoped notes, actions, MIS sync metadata and access logs.
--          Original files remain in Drive/SharePoint; Schoolgle stores metadata,
--          summaries, workflow outputs, source references and audit trails.
-- Depends on: send_register from 20260311 and SEND Hub tables from 20260318.
-- ============================================================

CREATE TABLE IF NOT EXISTS send_case_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  note_date timestamptz NOT NULL DEFAULT now(),
  author_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name text,
  category text NOT NULL
    CHECK (category IN (
      'parent_contact',
      'pupil_voice',
      'professional_advice',
      'provision',
      'concern',
      'decision',
      'funding',
      'meeting',
      'general'
    )),
  sensitivity text NOT NULL DEFAULT 'senco'
    CHECK (sensitivity IN ('teacher_summary', 'senco', 'slt', 'finance', 'restricted')),
  body text NOT NULL,

  linked_action_id uuid,
  linked_annual_review_id uuid REFERENCES sen_annual_reviews(id) ON DELETE SET NULL,
  linked_ehcp_application_id uuid REFERENCES sen_ehcp_applications(id) ON DELETE SET NULL,
  linked_evidence_file_id uuid REFERENCES sen_evidence_files(id) ON DELETE SET NULL,
  source_type text NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'meeting_transcript', 'upload_summary', 'ed_suggestion', 'mis_import')),
  source_reference text,
  ai_summary text,
  audit_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_case_notes_org ON send_case_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_case_notes_pupil ON send_case_notes(send_register_id, note_date DESC);
CREATE INDEX IF NOT EXISTS idx_send_case_notes_category ON send_case_notes(category);
CREATE INDEX IF NOT EXISTS idx_send_case_notes_sensitivity ON send_case_notes(sensitivity);

CREATE TABLE IF NOT EXISTS send_pupil_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,
  source_workflow text NOT NULL
    CHECK (source_workflow IN (
      'annual_review',
      'apdr',
      'ehcp_application',
      'funding',
      'evidence',
      'transition',
      'teacher',
      'parent_contact',
      'governance'
    )),
  required_output text,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  owner_name text,
  due_date date,
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'waiting', 'completed', 'cancelled')),

  linked_note_id uuid REFERENCES send_case_notes(id) ON DELETE SET NULL,
  linked_annual_review_id uuid REFERENCES sen_annual_reviews(id) ON DELETE SET NULL,
  linked_ehcp_application_id uuid REFERENCES sen_ehcp_applications(id) ON DELETE SET NULL,
  linked_evidence_file_id uuid REFERENCES sen_evidence_files(id) ON DELETE SET NULL,
  linked_funding_allocation_id uuid REFERENCES sen_funding_allocations(id) ON DELETE SET NULL,
  completion_summary text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_send_pupil_actions_org ON send_pupil_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_send_pupil_actions_pupil ON send_pupil_actions(send_register_id);
CREATE INDEX IF NOT EXISTS idx_send_pupil_actions_due ON send_pupil_actions(due_date)
  WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_send_pupil_actions_status ON send_pupil_actions(status);
CREATE INDEX IF NOT EXISTS idx_send_pupil_actions_priority ON send_pupil_actions(priority);

CREATE TABLE IF NOT EXISTS send_mis_sync_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid REFERENCES send_register(id) ON DELETE CASCADE,

  provider text NOT NULL CHECK (provider IN ('arbor', 'wonde', 'groupcall', 'csv', 'other')),
  provider_pupil_id text,
  upn text,
  admission_number text,
  legal_name_hash text,
  preferred_name_hash text,
  year_group text,
  registration_group text,
  enrolment_status text,
  sen_status text,
  primary_need text,
  secondary_need text,
  ehcp_flag boolean,
  attendance_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  demographic_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_reference_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_field_inventory jsonb NOT NULL DEFAULT '{}'::jsonb,
  sync_mode text NOT NULL DEFAULT 'read_only'
    CHECK (sync_mode IN ('read_only', 'approved_writeback')),
  synced_at timestamptz NOT NULL DEFAULT now(),
  source_watermark text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_mis_sync_org ON send_mis_sync_snapshots(organization_id, provider, synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_send_mis_sync_pupil ON send_mis_sync_snapshots(send_register_id);
CREATE INDEX IF NOT EXISTS idx_send_mis_sync_provider_id ON send_mis_sync_snapshots(provider, provider_pupil_id);

CREATE TABLE IF NOT EXISTS send_case_file_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  send_register_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,

  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_name text,
  access_type text NOT NULL
    CHECK (access_type IN ('view', 'create_note', 'update_note', 'upload_metadata', 'generate_document', 'export', 'share', 'writeback_request')),
  target_table text,
  target_id uuid,
  reason text,
  access_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_access_log_org ON send_case_file_access_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_send_access_log_pupil ON send_case_file_access_log(send_register_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_send_access_log_user ON send_case_file_access_log(user_id, created_at DESC);

ALTER TABLE send_case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_pupil_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_mis_sync_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_case_file_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "send_case_notes_select" ON send_case_notes
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_case_notes_insert" ON send_case_notes
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_case_notes_update" ON send_case_notes
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_pupil_actions_select" ON send_pupil_actions
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_pupil_actions_insert" ON send_pupil_actions
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_pupil_actions_update" ON send_pupil_actions
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_mis_sync_snapshots_select" ON send_mis_sync_snapshots
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_mis_sync_snapshots_insert" ON send_mis_sync_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_case_file_access_log_select" ON send_case_file_access_log
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "send_case_file_access_log_insert" ON send_case_file_access_log
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE OR REPLACE VIEW send_senco_dashboard_queue
WITH (security_invoker = true) AS
SELECT
  spa.organization_id,
  spa.id AS action_id,
  spa.send_register_id,
  sr.pupil_id,
  sr.pupil_name_encrypted,
  sr.year_group,
  sr.class_name,
  sr.sen_status,
  sr.has_ehcp,
  sr.ehcp_annual_review_due,
  sr.primary_need,
  spa.title,
  spa.source_workflow,
  spa.required_output,
  spa.owner_name,
  spa.due_date,
  spa.priority,
  spa.status,
  CASE
    WHEN spa.due_date < current_date AND spa.status NOT IN ('completed', 'cancelled') THEN 'overdue'
    WHEN spa.due_date = current_date AND spa.status NOT IN ('completed', 'cancelled') THEN 'today'
    WHEN spa.due_date <= current_date + interval '7 days' AND spa.status NOT IN ('completed', 'cancelled') THEN 'this_week'
    ELSE 'later'
  END AS due_bucket
FROM send_pupil_actions spa
JOIN send_register sr ON sr.id = spa.send_register_id;

-- ============================================================
-- Done. Adds the pupil case-file layer required for a secure,
-- operational SENCO workflow.
-- ============================================================
