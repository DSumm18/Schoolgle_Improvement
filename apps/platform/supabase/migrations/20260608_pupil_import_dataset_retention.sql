-- Pupil import dataset versioning and GDPR retention controls.
-- Schools remain the data controller; Schoolgle provides processor-side
-- tools to review, archive, anonymise, export or delete retained datasets.

CREATE TABLE IF NOT EXISTS pupil_import_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL DEFAULT 'pupil_roll',
  source_label TEXT,
  source_filename TEXT,
  academic_year TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'completed',
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  matched_rows INTEGER NOT NULL DEFAULT 0,
  changed_rows INTEGER NOT NULL DEFAULT 0,
  new_rows INTEGER NOT NULL DEFAULT 0,
  archive_candidate_rows INTEGER NOT NULL DEFAULT 0,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

ALTER TABLE pupil_import_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on pupil_import_datasets" ON pupil_import_datasets
  FOR ALL USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pupil_import_datasets_one_current
  ON pupil_import_datasets(organization_id, import_type)
  WHERE is_current IS TRUE;

CREATE INDEX IF NOT EXISTS idx_pupil_import_datasets_org_created
  ON pupil_import_datasets(organization_id, created_at DESC);

ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS current_import_dataset_id UUID REFERENCES pupil_import_datasets(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS first_seen_import_dataset_id UUID REFERENCES pupil_import_datasets(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS last_seen_import_dataset_id UUID REFERENCES pupil_import_datasets(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS pupil_record_status TEXT NOT NULL DEFAULT 'current';
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS not_in_latest_import BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS archive_candidate BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS archive_candidate_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS archived_by UUID;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS archive_reason TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS deleted_from_schoolgle_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pupils_import_dataset
  ON pupils(organization_id, current_import_dataset_id);

CREATE INDEX IF NOT EXISTS idx_pupils_archive_candidates
  ON pupils(organization_id, archive_candidate, pupil_record_status)
  WHERE archive_candidate IS TRUE;

CREATE TABLE IF NOT EXISTS pupil_data_retention_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  scope_value TEXT,
  dataset_id UUID REFERENCES pupil_import_datasets(id) ON DELETE SET NULL,
  affected_rows INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  impact_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pupil_data_retention_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on pupil_data_retention_actions" ON pupil_data_retention_actions
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pupil_data_retention_actions_org_created
  ON pupil_data_retention_actions(organization_id, created_at DESC);

COMMENT ON TABLE pupil_import_datasets IS
  'Versioned pupil import datasets. Latest approved import can become current; previous versions support review, archive and historic MI where retained by the school.';

COMMENT ON COLUMN pupils.archive_candidate IS
  'True when a pupil appeared in an earlier current import but not the latest import. This is a review flag, not deletion.';

COMMENT ON TABLE pupil_data_retention_actions IS
  'Audit log for school-controlled pupil retention actions such as export, archive, anonymise and delete. Avoid storing unnecessary pupil-identifiable content here.';
