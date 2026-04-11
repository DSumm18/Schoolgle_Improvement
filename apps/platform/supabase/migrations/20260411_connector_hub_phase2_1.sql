-- Connector Hub Phase 2.1 — extend byo_connectors, add intelligence_reports, guardian_audit_log

ALTER TABLE byo_connectors
  ADD COLUMN IF NOT EXISTS connection_mode TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (connection_mode IN ('live', 'cached', 'uploaded')),
  ADD COLUMN IF NOT EXISTS source_config JSONB,
  ADD COLUMN IF NOT EXISTS refresh_interval TEXT,
  ADD COLUMN IF NOT EXISTS last_fetch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'department', 'slt', 'global')),
  ADD COLUMN IF NOT EXISTS shared_with_roles TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shared_with_users TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parent_type TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

CREATE INDEX IF NOT EXISTS idx_byo_connectors_category ON byo_connectors(category);
CREATE INDEX IF NOT EXISTS idx_byo_connectors_visibility ON byo_connectors(visibility);
CREATE INDEX IF NOT EXISTS idx_byo_connectors_parent_type ON byo_connectors(parent_type);

CREATE TABLE IF NOT EXISTS intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  urn INTEGER NOT NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  connector_sources TEXT[] NOT NULL,
  narrative TEXT NOT NULL,
  pdf_url TEXT,
  llm_model TEXT NOT NULL,
  llm_tokens_used INTEGER,
  generated_by UUID NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_reports_org ON intelligence_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_intel_reports_urn ON intelligence_reports(urn);
CREATE INDEX IF NOT EXISTS idx_intel_reports_template ON intelligence_reports(template_id);

CREATE TABLE IF NOT EXISTS guardian_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  called_by TEXT,
  categories_detected TEXT[] NOT NULL,
  category_counts JSONB NOT NULL,
  input_length INTEGER NOT NULL,
  output_length INTEGER NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_audit_org ON guardian_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_guardian_audit_caller ON guardian_audit_log(called_by);

ALTER TABLE intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intelligence_reports_all" ON intelligence_reports FOR ALL USING (true);
CREATE POLICY "guardian_audit_all" ON guardian_audit_log FOR ALL USING (true);
