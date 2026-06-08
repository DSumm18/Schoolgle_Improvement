-- SEND Status Assignments imports from Arbor/MIS.
-- Live imports update send_register. Historic imports preserve cohort context
-- for MI/Ofsted analysis without putting leavers back into live SENCO workflows.

CREATE TABLE IF NOT EXISTS send_status_import_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_intent TEXT NOT NULL CHECK (import_intent IN ('live_register', 'historic_snapshot')),
  source_label TEXT,
  source_filename TEXT,
  academic_year TEXT,
  is_current_live BOOLEAN NOT NULL DEFAULT false,
  total_source_rows INTEGER NOT NULL DEFAULT 0,
  imported_pupils INTEGER NOT NULL DEFAULT 0,
  excluded_rows INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE send_status_import_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on send_status_import_datasets" ON send_status_import_datasets
  FOR ALL USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_send_status_import_one_current_live
  ON send_status_import_datasets(organization_id)
  WHERE is_current_live IS TRUE;

CREATE INDEX IF NOT EXISTS idx_send_status_import_org_created
  ON send_status_import_datasets(organization_id, created_at DESC);

ALTER TABLE IF EXISTS send_register ADD COLUMN IF NOT EXISTS send_import_dataset_id UUID REFERENCES send_status_import_datasets(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS send_register ADD COLUMN IF NOT EXISTS source_pupil_ref TEXT;
ALTER TABLE IF EXISTS send_register ADD COLUMN IF NOT EXISTS funded_hours NUMERIC(5,2);
ALTER TABLE IF EXISTS send_register ADD COLUMN IF NOT EXISTS raw_send_needs JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS send_register ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS send_historic_cohort_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES send_status_import_datasets(id) ON DELETE CASCADE,
  pupil_id TEXT NOT NULL,
  display_label TEXT,
  year_group TEXT,
  class_name TEXT,
  sen_status TEXT NOT NULL,
  primary_need TEXT NOT NULL,
  secondary_need TEXT,
  additional_needs JSONB NOT NULL DEFAULT '[]'::jsonb,
  date_identified DATE,
  funded_hours NUMERIC(5,2),
  raw_send_needs JSONB NOT NULL DEFAULT '[]'::jsonb,
  match_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, dataset_id, pupil_id)
);

ALTER TABLE send_historic_cohort_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on send_historic_cohort_snapshots" ON send_historic_cohort_snapshots
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_send_historic_snapshots_org_dataset
  ON send_historic_cohort_snapshots(organization_id, dataset_id);

CREATE INDEX IF NOT EXISTS idx_send_historic_snapshots_org_year
  ON send_historic_cohort_snapshots(organization_id, year_group);

COMMENT ON TABLE send_historic_cohort_snapshots IS
  'Historic SEND/EHCP cohort context retained only where the school chooses to import/retain it for MI, inspection analysis or statutory reporting.';
