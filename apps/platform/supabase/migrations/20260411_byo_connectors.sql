-- Bring Your Own (BYO) connector tables for Phase 2 Connector Registry

CREATE TABLE IF NOT EXISTS byo_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'sheets', 'form', 'excel', 'webhook', 'airtable')),
  column_schema JSONB NOT NULL,
  join_keys TEXT[] NOT NULL DEFAULT '{}',
  row_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS byo_connector_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES byo_connectors(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  row_data JSONB NOT NULL,
  join_values JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_byo_rows_connector ON byo_connector_rows(connector_id);
CREATE INDEX IF NOT EXISTS idx_byo_rows_org ON byo_connector_rows(organization_id);
CREATE INDEX IF NOT EXISTS idx_byo_rows_join_values ON byo_connector_rows USING GIN(join_values);
CREATE INDEX IF NOT EXISTS idx_byo_connectors_org ON byo_connectors(organization_id);

ALTER TABLE byo_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE byo_connector_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "byo_connectors_select" ON byo_connectors FOR SELECT USING (true);
CREATE POLICY "byo_connectors_insert" ON byo_connectors FOR INSERT WITH CHECK (true);
CREATE POLICY "byo_connectors_update" ON byo_connectors FOR UPDATE USING (true);
CREATE POLICY "byo_connectors_delete" ON byo_connectors FOR DELETE USING (true);

CREATE POLICY "byo_rows_select" ON byo_connector_rows FOR SELECT USING (true);
CREATE POLICY "byo_rows_insert" ON byo_connector_rows FOR INSERT WITH CHECK (true);
CREATE POLICY "byo_rows_delete" ON byo_connector_rows FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION update_byo_connectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS byo_connectors_updated_at ON byo_connectors;
CREATE TRIGGER byo_connectors_updated_at
  BEFORE UPDATE ON byo_connectors
  FOR EACH ROW
  EXECUTE FUNCTION update_byo_connectors_updated_at();
