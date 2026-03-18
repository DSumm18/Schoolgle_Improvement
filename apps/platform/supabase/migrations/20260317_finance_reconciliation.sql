-- Finance Reconciliation Log
-- Tracks ongoing reconciliation between source spreadsheet data and imported DB data
-- Ensures what the school provided in Google Drive always matches what's in Schoolgle

CREATE TABLE IF NOT EXISTS finance_reconciliation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  import_id UUID REFERENCES data_imports(id),

  -- Source fingerprint (from the spreadsheet at import time)
  source_checksum TEXT NOT NULL,                    -- SHA-256 of the raw file
  source_total_expenditure NUMERIC(14,2) NOT NULL DEFAULT 0,
  source_total_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  source_total_transactions INTEGER NOT NULL DEFAULT 0,
  source_cfr_snapshot JSONB NOT NULL DEFAULT '[]',  -- Array of {cfr_code, budget, actual, committed, txn_count}

  -- DB state at reconciliation time
  db_total_expenditure NUMERIC(14,2) NOT NULL DEFAULT 0,
  db_total_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  db_total_transactions INTEGER NOT NULL DEFAULT 0,
  db_cfr_snapshot JSONB NOT NULL DEFAULT '[]',

  -- Result
  status TEXT NOT NULL CHECK (status IN ('matched', 'minor_exceptions', 'major_exceptions', 'failed')),
  exceptions JSONB NOT NULL DEFAULT '[]',           -- Array of {cfr_code, field, source_value, db_value, drift_pct}
  exception_count INTEGER NOT NULL DEFAULT 0,
  max_drift_pct NUMERIC(8,4) NOT NULL DEFAULT 0,

  -- Metadata
  financial_year TEXT NOT NULL,
  triggered_by TEXT NOT NULL DEFAULT 'manual',      -- manual | scheduled | import | api
  duration_ms INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_finance_recon_org_date
  ON finance_reconciliation_log(organization_id, created_at DESC);

-- RLS
ALTER TABLE finance_reconciliation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recon_read" ON finance_reconciliation_log;
CREATE POLICY "recon_read" ON finance_reconciliation_log
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "recon_manage" ON finance_reconciliation_log;
CREATE POLICY "recon_manage" ON finance_reconciliation_log
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()::text
      AND om.role IN ('admin', 'headteacher', 'slt')
    )
  );

-- Add source_fingerprint column to data_imports for reconciliation tracking
ALTER TABLE data_imports ADD COLUMN IF NOT EXISTS source_cfr_snapshot JSONB;
