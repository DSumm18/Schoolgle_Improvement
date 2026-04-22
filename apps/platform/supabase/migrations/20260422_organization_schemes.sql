-- School-wide scheme adoption.
-- Primary schools adopt ONE scheme per subject across the whole school
-- (e.g. White Rose Maths for maths in every class). This table is the source of
-- truth for "what scheme does this school use for this subject". Classes read
-- from here, not from per-class scheme mappings.
--
-- Existing ls_scheme_mappings remain as an audit trail of per-class connection
-- events and local overrides. Backfill below seeds organization_schemes with
-- the most recent per-(org, subject) entry so existing schools work immediately.

CREATE TABLE IF NOT EXISTS organization_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  scheme_name TEXT NOT NULL,
  notes TEXT,
  adopted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  adopted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, subject)
);

CREATE INDEX IF NOT EXISTS idx_organization_schemes_org
  ON organization_schemes(organization_id);

ALTER TABLE organization_schemes ENABLE ROW LEVEL SECURITY;

-- Members of the org can read
CREATE POLICY organization_schemes_select ON organization_schemes
  FOR SELECT USING (organization_id IN (SELECT ls_user_org_ids()));

-- Writes restricted to org members via RLS; admin gating happens at API layer
-- for now (a Settings > Schemes page in a later slice will surface role checks).
CREATE POLICY organization_schemes_insert ON organization_schemes
  FOR INSERT WITH CHECK (organization_id IN (SELECT ls_user_org_ids()));

CREATE POLICY organization_schemes_update ON organization_schemes
  FOR UPDATE USING (organization_id IN (SELECT ls_user_org_ids()));

CREATE POLICY organization_schemes_delete ON organization_schemes
  FOR DELETE USING (organization_id IN (SELECT ls_user_org_ids()));

CREATE POLICY organization_schemes_service ON organization_schemes
  FOR ALL USING (auth.role() = 'service_role');

-- Backfill: for every (organization_id, subject) that already has a per-class
-- scheme mapping, seed organization_schemes with the most recent scheme_name.
-- Ambiguous cases (different schemes for the same subject across classes)
-- resolve to the most recently connected one, which matches what schools
-- have implicitly treated as current. Admin can change it in Settings > Schemes.
INSERT INTO organization_schemes (organization_id, subject, scheme_name, notes, adopted_at)
SELECT DISTINCT ON (organization_id, subject)
  organization_id,
  subject,
  scheme_name,
  'Backfilled from class-level scheme mappings on 2026-04-22',
  created_at
FROM ls_scheme_mappings
ORDER BY organization_id, subject, created_at DESC
ON CONFLICT (organization_id, subject) DO NOTHING;
