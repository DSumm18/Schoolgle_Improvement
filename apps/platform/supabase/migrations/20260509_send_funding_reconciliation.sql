-- ============================================================
-- SEND Funding Reconciliation
-- Date: 2026-05-09
-- Purpose: Track expected high-needs/top-up funding by pupil,
--          import actual LA receipts/remittances, reconcile
--          variances, and support human-approved LA queries.
-- Depends on: 20260318_send_hub_full_schema.sql
-- ============================================================

-- ============================================================
-- 1. Expected payment schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_funding_payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_id uuid NOT NULL REFERENCES send_register(id) ON DELETE CASCADE,
  funding_allocation_id uuid NOT NULL REFERENCES sen_funding_allocations(id) ON DELETE CASCADE,

  funding_year text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  due_date date NOT NULL,
  expected_amount numeric(10,2) NOT NULL DEFAULT 0,
  is_backdated boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'schoolgle_calculated'
    CHECK (source IN ('schoolgle_calculated', 'la_schedule', 'manual_override')),

  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(funding_allocation_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_sen_funding_sched_org_year
  ON sen_funding_payment_schedules(organization_id, funding_year);
CREATE INDEX IF NOT EXISTS idx_sen_funding_sched_pupil
  ON sen_funding_payment_schedules(pupil_id);
CREATE INDEX IF NOT EXISTS idx_sen_funding_sched_due
  ON sen_funding_payment_schedules(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_sen_funding_sched_backdated
  ON sen_funding_payment_schedules(organization_id, is_backdated)
  WHERE is_backdated = true;

-- ============================================================
-- 2. Funding source documents
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_funding_source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pupil_id uuid REFERENCES send_register(id) ON DELETE SET NULL,
  funding_allocation_id uuid REFERENCES sen_funding_allocations(id) ON DELETE SET NULL,
  evidence_file_id uuid REFERENCES sen_evidence_files(id) ON DELETE SET NULL,
  linked_review_id uuid REFERENCES sen_annual_reviews(id) ON DELETE SET NULL,
  linked_application_id uuid REFERENCES sen_ehcp_applications(id) ON DELETE SET NULL,

  document_type text NOT NULL
    CHECK (document_type IN ('funding_agreement', 'panel_decision', 'la_statement',
                             'remittance', 'finance_ledger_export', 'query_response',
                             'other')),
  file_name text NOT NULL,
  file_path text,
  source_provider text DEFAULT 'upload'
    CHECK (source_provider IN ('upload', 'drive', 'sharepoint', 'finance_export', 'manual')),

  la_code text,
  la_name text,
  document_date date,
  extracted_band text,
  extracted_points numeric(8,2),
  extracted_effective_from date,
  extracted_effective_to date,
  extracted_annual_amount numeric(10,2),
  extraction_confidence numeric(4,3),
  extraction_status text DEFAULT 'pending'
    CHECK (extraction_status IN ('pending', 'extracted', 'needs_review', 'approved', 'rejected')),

  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sen_funding_docs_org
  ON sen_funding_source_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_sen_funding_docs_pupil
  ON sen_funding_source_documents(pupil_id);
CREATE INDEX IF NOT EXISTS idx_sen_funding_docs_type
  ON sen_funding_source_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_sen_funding_docs_status
  ON sen_funding_source_documents(extraction_status)
  WHERE extraction_status IN ('pending', 'needs_review');

-- ============================================================
-- 3. Reconciliation runs
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_funding_reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_document_id uuid REFERENCES sen_funding_source_documents(id) ON DELETE SET NULL,

  funding_year text NOT NULL,
  run_name text NOT NULL,
  run_type text NOT NULL DEFAULT 'receipt_import'
    CHECK (run_type IN ('receipt_import', 'schedule_refresh', 'manual_review')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'processing', 'needs_review', 'approved', 'failed')),

  rows_imported int NOT NULL DEFAULT 0,
  rows_matched int NOT NULL DEFAULT 0,
  rows_unmatched int NOT NULL DEFAULT 0,
  variance_count int NOT NULL DEFAULT 0,
  expected_total numeric(12,2) NOT NULL DEFAULT 0,
  received_total numeric(12,2) NOT NULL DEFAULT 0,
  outstanding_total numeric(12,2) NOT NULL DEFAULT 0,
  backdated_outstanding_total numeric(12,2) NOT NULL DEFAULT 0,

  error_message text,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sen_funding_runs_org_year
  ON sen_funding_reconciliation_runs(organization_id, funding_year);
CREATE INDEX IF NOT EXISTS idx_sen_funding_runs_status
  ON sen_funding_reconciliation_runs(status)
  WHERE status IN ('draft', 'processing', 'needs_review', 'failed');

-- ============================================================
-- 4. Actual receipt/remittance lines
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_funding_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reconciliation_run_id uuid REFERENCES sen_funding_reconciliation_runs(id) ON DELETE CASCADE,
  source_document_id uuid REFERENCES sen_funding_source_documents(id) ON DELETE SET NULL,
  pupil_id uuid REFERENCES send_register(id) ON DELETE SET NULL,
  funding_allocation_id uuid REFERENCES sen_funding_allocations(id) ON DELETE SET NULL,

  funding_year text NOT NULL,
  period_start date,
  period_end date,
  received_date date NOT NULL,
  received_amount numeric(10,2) NOT NULL,
  payment_reference text,
  la_pupil_reference text,
  remittance_description text,
  finance_code text DEFAULT 'I03',
  match_confidence numeric(4,3),
  match_status text NOT NULL DEFAULT 'unmatched'
    CHECK (match_status IN ('matched', 'low_confidence', 'unmatched', 'ignored')),

  raw_row jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sen_funding_receipts_org_year
  ON sen_funding_receipts(organization_id, funding_year);
CREATE INDEX IF NOT EXISTS idx_sen_funding_receipts_pupil
  ON sen_funding_receipts(pupil_id);
CREATE INDEX IF NOT EXISTS idx_sen_funding_receipts_run
  ON sen_funding_receipts(reconciliation_run_id);
CREATE INDEX IF NOT EXISTS idx_sen_funding_receipts_match
  ON sen_funding_receipts(match_status)
  WHERE match_status IN ('low_confidence', 'unmatched');

-- ============================================================
-- 5. Reconciliation line items
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_funding_reconciliation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reconciliation_run_id uuid NOT NULL REFERENCES sen_funding_reconciliation_runs(id) ON DELETE CASCADE,
  payment_schedule_id uuid REFERENCES sen_funding_payment_schedules(id) ON DELETE SET NULL,
  receipt_id uuid REFERENCES sen_funding_receipts(id) ON DELETE SET NULL,
  pupil_id uuid REFERENCES send_register(id) ON DELETE SET NULL,
  funding_allocation_id uuid REFERENCES sen_funding_allocations(id) ON DELETE SET NULL,

  period_start date NOT NULL,
  period_end date NOT NULL,
  due_date date,
  expected_amount numeric(10,2) NOT NULL DEFAULT 0,
  received_amount numeric(10,2) NOT NULL DEFAULT 0,
  variance_amount numeric(10,2) NOT NULL DEFAULT 0,
  is_backdated boolean NOT NULL DEFAULT false,
  status text NOT NULL
    CHECK (status IN ('matched', 'underpaid', 'overpaid', 'overdue',
                      'expected_later', 'unmatched_receipt', 'disputed',
                      'resolved')),
  explanation text,

  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sen_funding_recon_items_run
  ON sen_funding_reconciliation_items(reconciliation_run_id);
CREATE INDEX IF NOT EXISTS idx_sen_funding_recon_items_pupil
  ON sen_funding_reconciliation_items(pupil_id);
CREATE INDEX IF NOT EXISTS idx_sen_funding_recon_items_status
  ON sen_funding_reconciliation_items(organization_id, status)
  WHERE status NOT IN ('matched', 'resolved');
CREATE INDEX IF NOT EXISTS idx_sen_funding_recon_items_backdated
  ON sen_funding_reconciliation_items(organization_id, is_backdated)
  WHERE is_backdated = true AND status NOT IN ('matched', 'resolved');

-- ============================================================
-- 6. Variance action/query tracker
-- ============================================================
CREATE TABLE IF NOT EXISTS sen_funding_variance_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reconciliation_item_id uuid REFERENCES sen_funding_reconciliation_items(id) ON DELETE CASCADE,
  pupil_id uuid REFERENCES send_register(id) ON DELETE SET NULL,
  funding_allocation_id uuid REFERENCES sen_funding_allocations(id) ON DELETE SET NULL,

  action_type text NOT NULL DEFAULT 'la_query'
    CHECK (action_type IN ('la_query', 'internal_review', 'write_off', 'resolved')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready_to_send', 'sent', 'responded', 'resolved', 'cancelled')),
  owner_name text,
  due_date date,
  sent_date date,
  resolved_date date,
  query_summary text NOT NULL,
  suggested_message text,
  response_summary text,
  audit_notes text,

  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sen_funding_var_actions_org_status
  ON sen_funding_variance_actions(organization_id, status)
  WHERE status NOT IN ('resolved', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_sen_funding_var_actions_pupil
  ON sen_funding_variance_actions(pupil_id);

-- ============================================================
-- 7. Row Level Security
-- ============================================================
ALTER TABLE sen_funding_payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_funding_source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_funding_reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_funding_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_funding_reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sen_funding_variance_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sen_funding_payment_schedules_select" ON sen_funding_payment_schedules
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_payment_schedules_insert" ON sen_funding_payment_schedules
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_payment_schedules_update" ON sen_funding_payment_schedules
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_source_documents_select" ON sen_funding_source_documents
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_source_documents_insert" ON sen_funding_source_documents
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_source_documents_update" ON sen_funding_source_documents
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_reconciliation_runs_select" ON sen_funding_reconciliation_runs
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_reconciliation_runs_insert" ON sen_funding_reconciliation_runs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_reconciliation_runs_update" ON sen_funding_reconciliation_runs
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_receipts_select" ON sen_funding_receipts
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_receipts_insert" ON sen_funding_receipts
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_receipts_update" ON sen_funding_receipts
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_reconciliation_items_select" ON sen_funding_reconciliation_items
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_reconciliation_items_insert" ON sen_funding_reconciliation_items
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_reconciliation_items_update" ON sen_funding_reconciliation_items
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_variance_actions_select" ON sen_funding_variance_actions
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_variance_actions_insert" ON sen_funding_variance_actions
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "sen_funding_variance_actions_update" ON sen_funding_variance_actions
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

