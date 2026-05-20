-- Class Builder pupil data contract
-- Reintroduces explicit, product-scoped pupil fields after the earlier generic PII
-- remediation. Class Builder and pupil passes require identifiable pupil records
-- so staff can create, review and explain draft class groupings.

ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS pupil_ref TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS year_group TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS current_class TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS is_pupil_premium BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS is_eal BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS is_looked_after BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS has_send_support BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS sen_status TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS send_status TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS primary_need TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS ehcp BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS fsm_eligible BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS import_source TEXT;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS pupils ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE pupils IS
  'Product-scoped pupil foundation table used by Class Builder, pupil passes and agreed school workflows. Contains identifiable pupil data only where required by subscribed products.';

COMMENT ON COLUMN pupils.first_name IS
  'Identifiable pupil data used for Class Builder staff review and pupil-facing tools; minimise and process under the customer DPA/product schedule.';

COMMENT ON COLUMN pupils.last_name IS
  'Identifiable pupil data used for Class Builder staff review and pupil-facing tools; minimise and process under the customer DPA/product schedule.';

COMMENT ON COLUMN pupils.ethnicity IS
  'Special category data where supplied by the school; only collect when necessary for the agreed educational purpose and product schedule.';

COMMENT ON COLUMN pupils.primary_need IS
  'SEND/primary need may reveal disability or health information; treat as higher-risk children''s data and minimise access.';

CREATE INDEX IF NOT EXISTS idx_pupils_class_builder_data_contract
  ON pupils(organization_id, year_group, current_class)
  WHERE is_active IS TRUE;
