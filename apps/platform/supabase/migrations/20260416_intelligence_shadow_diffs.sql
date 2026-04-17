-- Intelligence Brain Shadow Diffs
-- Stores baseline-vs-candidate comparison outputs while routes run in shadow mode.

CREATE TABLE IF NOT EXISTS intelligence_shadow_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  route_key TEXT NOT NULL
    CHECK (route_key IN ('ofsted-readiness', 'school-intelligence', 'trust-analysis')),
  mode TEXT NOT NULL
    CHECK (mode IN ('off', 'shadow', 'primary')),
  candidate_version TEXT NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  compared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_shadow_diffs_org_time
  ON intelligence_shadow_diffs(organization_id, compared_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_shadow_diffs_route_time
  ON intelligence_shadow_diffs(route_key, compared_at DESC);

ALTER TABLE intelligence_shadow_diffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_shadow_diffs_org_read ON intelligence_shadow_diffs;
CREATE POLICY intelligence_shadow_diffs_org_read ON intelligence_shadow_diffs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_members.organization_id
      FROM organization_members
      WHERE organization_members.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS intelligence_shadow_diffs_service_all ON intelligence_shadow_diffs;
CREATE POLICY intelligence_shadow_diffs_service_all ON intelligence_shadow_diffs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

