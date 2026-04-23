-- ═══════════════════════════════════════════════════════════════════════════
-- School Census Data Import Schema
-- Migration: 20260327_census_data_schema.sql
--
-- Purpose: Store imported DfE census data with privacy-protected pupil references
-- Tables: census_imports, pupil_census_snapshots, pupil_attendance_sessions,
--   school_census_aggregates, pupil_assessments_pseudo
--
-- Privacy: UPNs are SHA-256 hashed with per-school salt before storage
--   Pupil names are NOT stored in these tables (resolved live from source)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Census Import Headers ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS census_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  census_term TEXT NOT NULL CHECK (census_term IN ('AUT', 'SPR', 'SUM')),
  census_year INTEGER NOT NULL,
  reference_date DATE NOT NULL,
  serial_no INTEGER,
  source_filename TEXT,
  source_drive_id TEXT,
  processing_status TEXT NOT NULL DEFAULT 'processing' CHECK (processing_status IN ('processing', 'complete', 'error')),
  pupil_count INTEGER DEFAULT 0,
  total_sessions_attended INTEGER DEFAULT 0,
  error_message TEXT,
  imported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, census_term, census_year)
);

CREATE INDEX IF NOT EXISTS idx_census_imports_org ON census_imports(organization_id);
CREATE INDEX IF NOT EXISTS idx_census_imports_term_year ON census_imports(census_term, census_year);

-- ─── Pupil Census Snapshots (Privacy-Protected) ─────────────────────────────

CREATE TABLE IF NOT EXISTS pupil_census_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  census_import_id UUID REFERENCES census_imports(id) ON DELETE SET NULL,

  -- Pseudonymised reference (SHA-256(UPN + salt)[:24].toUpperCase())
  pseudo_ref TEXT NOT NULL,

  -- Basic demographics (safe)
  gender TEXT CHECK (gender IS NULL OR gender IN ('M', 'F')),
  age_at_census INTEGER,
  age_band TEXT CHECK (age_band IS NULL OR age_band IN ('under_5', '5_to_10', '11_to_15', '16_plus')),
  postcode_district TEXT,  -- First half only: "BD2", "SW1"
  language_code TEXT,
  is_eal BOOLEAN DEFAULT false,

  -- Free school meals
  school_lunch_taken BOOLEAN,
  service_child BOOLEAN,
  fsm_eligible BOOLEAN,
  fsm_start_year INTEGER,

  -- SEN data
  sen_provision TEXT CHECK (sen_provision IS NULL OR sen_provision IN ('E', 'K', 'N')),
  sen_type_primary TEXT,
  sen_unit_indicator BOOLEAN DEFAULT false,

  -- Enrolment
  enrol_status TEXT CHECK (enrol_status IS NULL OR enrol_status IN ('C', 'M', 'S', 'F', 'O')),
  nc_year_actual TEXT,  -- R, N, 1-13

  -- Ethnicity (Spring census only)
  ethnicity TEXT,

  -- Census metadata
  census_term TEXT NOT NULL,
  census_year INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, pseudo_ref, census_term, census_year)
);

CREATE INDEX IF NOT EXISTS idx_pupil_census_org ON pupil_census_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_pupil_census_import ON pupil_census_snapshots(census_import_id);
CREATE INDEX IF NOT EXISTS idx_pupil_census_pseudo ON pupil_census_snapshots(pseudo_ref);
CREATE INDEX IF NOT EXISTS idx_pupil_census_nc_year ON pupil_census_snapshots(nc_year_actual);
CREATE INDEX IF NOT EXISTS idx_pupil_census_sen ON pupil_census_snapshots(sen_provision) WHERE sen_provision IN ('E', 'K');

-- ─── Pupil Attendance Sessions (from Census) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS pupil_attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES pupil_census_snapshots(id) ON DELETE SET NULL,

  -- Pseudonymised pupil reference
  pseudo_ref TEXT NOT NULL,

  -- Attendance data
  period_type TEXT NOT NULL CHECK (period_type IN ('termly', 'summer_ht2')),
  sessions_possible INTEGER NOT NULL DEFAULT 0,
  reason_code TEXT NOT NULL,  -- / (present), B/I (authorised), N/O (unauthorised)
  session_count INTEGER NOT NULL DEFAULT 0,

  -- Census metadata
  census_year INTEGER NOT NULL,
  census_term TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_org ON pupil_attendance_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_snapshot ON pupil_attendance_sessions(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_attendance_pseudo ON pupil_attendance_sessions(pseudo_ref);
CREATE INDEX IF NOT EXISTS idx_attendance_census ON pupil_attendance_sessions(census_year, census_term);

-- ─── School Census Aggregates ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school_census_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  census_import_id UUID REFERENCES census_imports(id) ON DELETE SET NULL,

  census_term TEXT NOT NULL,
  census_year INTEGER NOT NULL,

  -- Pupil counts
  total_pupils INTEGER DEFAULT 0,
  total_male INTEGER DEFAULT 0,
  total_female INTEGER DEFAULT 0,

  -- SEN
  total_sen_ehcp INTEGER DEFAULT 0,
  total_sen_support INTEGER DEFAULT 0,
  sen_percentage NUMERIC(5,2) DEFAULT 0,

  -- FSM
  total_fsm_eligible INTEGER DEFAULT 0,
  fsm_percentage NUMERIC(5,2) DEFAULT 0,

  -- EAL
  total_eal INTEGER DEFAULT 0,
  eal_percentage NUMERIC(5,2) DEFAULT 0,

  -- Attendance
  total_sessions_possible INTEGER DEFAULT 0,
  total_present INTEGER DEFAULT 0,
  overall_absence_rate NUMERIC(5,2) DEFAULT 0,
  authorised_absence_rate NUMERIC(5,2) DEFAULT 0,
  unauthorised_absence_rate NUMERIC(5,2) DEFAULT 0,

  -- Year group breakdown
  pupils_by_year_group JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, census_term, census_year)
);

CREATE INDEX IF NOT EXISTS idx_census_aggregates_org ON school_census_aggregates(organization_id);
CREATE INDEX IF NOT EXISTS idx_census_aggregates_census ON school_census_aggregates(census_year, census_term);

-- ─── Pupil Assessments (Pseudonymised) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pupil_assessments_pseudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Pseudonymised pupil reference (SHA-256(UPN + salt)[:24].toUpperCase())
  pupil_hash TEXT NOT NULL,

  -- Assessment metadata
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('EYFSP', 'PHONICS', 'KS1', 'KS2', 'MTC')),
  stage TEXT NOT NULL,  -- EYF, KS1, KS2
  component TEXT NOT NULL,  -- REA, WRI, MAT, SCI, GPS, Phonics, MTC, ELG_CL, etc.
  subject TEXT,  -- Derived from component for backwards compat
  result_qualifier TEXT,
  attainment_level INTEGER,
  academic_year_start INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, pupil_hash, assessment_type, component, academic_year_start)
);

CREATE INDEX IF NOT EXISTS idx_assessments_pseudo_org ON pupil_assessments_pseudo(organization_id);
CREATE INDEX IF NOT EXISTS idx_assessments_pseudo_pupil ON pupil_assessments_pseudo(pupil_hash);
CREATE INDEX IF NOT EXISTS idx_assessments_pseudo_type ON pupil_assessments_pseudo(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessments_pseudo_year ON pupil_assessments_pseudo(academic_year_start);

-- ─── Census Salt for Pseudonymisation ───────────────────────────────────────────

-- Add census_salt column to organizations table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'census_salt'
  ) THEN
    ALTER TABLE organizations ADD COLUMN census_salt TEXT;
  END IF;
END $$;

-- ─── RLS Policies ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE census_imports ENABLE ROW LEVEL SECURITY;
  ALTER TABLE pupil_census_snapshots ENABLE ROW LEVEL SECURITY;
  ALTER TABLE pupil_attendance_sessions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE school_census_aggregates ENABLE ROW LEVEL SECURITY;
  ALTER TABLE pupil_assessments_pseudo ENABLE ROW LEVEL SECURITY;
END $$;

-- Helper function (reuse existing if exists)
CREATE OR REPLACE FUNCTION census_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- census_imports
CREATE POLICY census_imports_select ON census_imports FOR SELECT USING (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY census_imports_insert ON census_imports FOR INSERT WITH CHECK (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY census_imports_update ON census_imports FOR UPDATE USING (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY census_imports_service ON census_imports FOR ALL USING (auth.role() = 'service_role');

-- pupil_census_snapshots
CREATE POLICY pupil_census_select ON pupil_census_snapshots FOR SELECT USING (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY pupil_census_insert ON pupil_census_snapshots FOR INSERT WITH CHECK (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY pupil_census_update ON pupil_census_snapshots FOR UPDATE USING (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY pupil_census_service ON pupil_census_snapshots FOR ALL USING (auth.role() = 'service_role');

-- pupil_attendance_sessions
CREATE POLICY attendance_sessions_select ON pupil_attendance_sessions FOR SELECT USING (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY attendance_sessions_insert ON pupil_attendance_sessions FOR INSERT WITH CHECK (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY attendance_sessions_service ON pupil_attendance_sessions FOR ALL USING (auth.role() = 'service_role');

-- school_census_aggregates
CREATE POLICY census_aggregates_select ON school_census_aggregates FOR SELECT USING (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY census_aggregates_insert ON school_census_aggregates FOR INSERT WITH CHECK (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY census_aggregates_update ON school_census_aggregates FOR UPDATE USING (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY census_aggregates_service ON school_census_aggregates FOR ALL USING (auth.role() = 'service_role');

-- pupil_assessments_pseudo
CREATE POLICY assessments_pseudo_select ON pupil_assessments_pseudo FOR SELECT USING (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY assessments_pseudo_insert ON pupil_assessments_pseudo FOR INSERT WITH CHECK (organization_id IN (SELECT census_user_org_ids()));
CREATE POLICY assessments_pseudo_service ON pupil_assessments_pseudo FOR ALL USING (auth.role() = 'service_role');

-- ─── Updated At Trigger ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_census_aggregates_updated_at ON school_census_aggregates;
CREATE TRIGGER update_census_aggregates_updated_at
  BEFORE UPDATE ON school_census_aggregates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
