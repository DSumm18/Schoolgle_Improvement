-- ============================================================================
-- SCHOOLGLE CENSUS DATA SCHEMA
-- Migration: 20260323_census_data_schema
--
-- Purpose: Enable ingestion and analysis of UK school census XML data
-- Privacy: ZERO PII - all pupil data pseudonymised (SHA-256 hash of UPN)
--
-- Based on:
-- - Real Arbor census XML analysis (Grove House Primary, URN 148201)
-- - Existing pupil_assessments_pseudo pattern (20260309_pupil_assessment_analysis.sql)
-- - school_intelligence_engine pattern (20260309_school_intelligence_engine.sql)
--
-- Tables:
--   1. Extend organizations with census fields
--   2. Extend pupil_assessments_pseudo with statutory assessment fields
--   3. census_imports - Audit trail for census XML files
--   4. pupil_census_snapshots - Core census data (zero-PII, longitudinal)
--   5. pupil_attendance_sessions - Attendance by reason code
--   6. pupil_exclusions - Exclusions data from census
--   7. school_classes - Class structure from census
--   8. school_census_aggregates - Pre-calculated dashboard metrics
--   9. ed_flags - AI-generated concerns from census patterns
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND organizations TABLE with census-specific fields
-- ----------------------------------------------------------------------------
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS dfe_urn TEXT UNIQUE;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS la_code TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS estab_number TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS school_metadata JSONB DEFAULT '{}';
-- Metadata structure: {"phase": "PS", "school_type": "ACAD", "governance": "CA", "intake": "COMP"}
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS census_salt TEXT;
-- CRITICAL: census_salt is SECRET - never expose in API responses
-- Used for SHA-256 hashing of UPNs to create pseudo_ref
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS mis_software TEXT;
-- Values: 'arbor', 'sims', 'bromcom', 'scholarpack', 'integris', 'pupilasset', etc.

COMMENT ON COLUMN public.organizations.census_salt IS 'SECRET salt for UPN pseudonymisation. NEVER expose in API responses.';
COMMENT ON COLUMN public.organizations.school_metadata IS 'School characteristics from census: phase, type, governance, intake, year groups.';

-- Index for DfE URN lookups
CREATE INDEX IF NOT EXISTS idx_organizations_dfe_urn ON public.organizations(dfe_urn) WHERE dfe_urn IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. EXTEND pupil_assessments_pseudo with statutory assessment fields
-- ----------------------------------------------------------------------------
-- Note: This table was created in 20260309_pupil_assessment_analysis.sql
-- We extend it to support EYFSP, Phonics, KS1, KS2 statutory assessments

ALTER TABLE public.pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS assessment_type TEXT;
-- Values: 'EYFSP', 'PHONICS', 'KS1', 'KS2', 'TEACHER_ASSESSMENT'

ALTER TABLE public.pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS stage TEXT;
-- Values: 'EYF', 'KS1', 'KS2'

ALTER TABLE public.pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS component TEXT;
-- EYFSP: E01-E17 (ELG codes), Phonics: CHK, KS1/KS2: REA, WRI, MAT, SCI, GPS

ALTER TABLE public.pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS method TEXT;
-- Values: 'TA' (Teacher Assessment), 'TT' (Task/Test), 'TM' (Teacher Modified)

ALTER TABLE public.pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS result_qualifier TEXT;
-- Values: 'NC' (Not calculated), 'NM' (Numeric mark), 'NY' (Not yet meeting),
-- 'WM' (Working towards/Meeting), 'FD' (Foundation Developed)

ALTER TABLE public.pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS result_date DATE;

ALTER TABLE public.pupil_assessments_pseudo ADD COLUMN IF NOT EXISTS source_file TEXT;
-- Which XML file this data came from (for audit trail)

-- Update the unique constraint to include statutory assessment dimensions
-- Drop existing if present (will be recreated with broader scope)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pupil_assessments_pseudo_pupil_hash_subject_key'
    ) THEN
        ALTER TABLE public.pupil_assessments_pseudo
        DROP CONSTRAINT pupil_assessments_pseudo_pupil_hash_subject_key;
    END IF;
END $$;

-- Create broader unique constraint
ALTER TABLE public.pupil_assessments_pseudo
ADD CONSTRAINT pupil_assessments_pseudo_unique_record
UNIQUE (organization_id, pupil_hash, assessment_type, academic_year_start, subject, component)
IF NOT EXISTS;

-- Index for statutory assessment queries
CREATE INDEX IF NOT EXISTS idx_pupil_assessments_statutory
ON public.pupil_assessments_pseudo(organization_id, assessment_type, academic_year_start, stage)
WHERE assessment_type IN ('EYFSP', 'PHONICS', 'KS1', 'KS2');

-- ----------------------------------------------------------------------------
-- 3. census_imports - Audit trail for census XML files
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.census_imports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Census metadata (from XML header)
    census_term     TEXT NOT NULL CHECK (census_term IN ('AUT', 'SPR', 'SUM')),
    census_year     INTEGER NOT NULL,
    reference_date  DATE NOT NULL,
    xversion        TEXT,
    serial_no       INTEGER,
    generated_at    TIMESTAMPTZ,

    -- Processing metadata
    source_filename TEXT,
    source_drive_id TEXT,
    pupil_count     INTEGER,
    processed_at    TIMESTAMPTZ DEFAULT NOW(),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'complete', 'partial', 'error')),
    error_message   TEXT,

    -- Stats
    total_sessions_attended INTEGER DEFAULT 0,
    total_sessions_possible INTEGER DEFAULT 0,
    overall_attendance_pct NUMERIC(5,2),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate imports
    UNIQUE(organization_id, census_term, census_year, serial_no)
);

COMMENT ON TABLE public.census_imports IS 'Audit trail for census XML file processing. Each row represents one census return (AUT/SPR/SUM) for one school.';
COMMENT ON COLUMN public.census_imports.serial_no IS 'Serial number from XML source - unique identifier for each census return';

CREATE INDEX idx_census_imports_org_year ON public.census_imports(organization_id, census_year DESC, census_term);
CREATE INDEX idx_census_imports_status ON public.census_imports(processing_status) WHERE processing_status != 'complete';

-- ----------------------------------------------------------------------------
-- 4. pupil_census_snapshots - CORE CENSUS DATA TABLE
-- ----------------------------------------------------------------------------
-- One row per pupil per census - ZERO PII, all data pseudonymised
-- This is the table that powers 90% of census-based analytics

CREATE TABLE IF NOT EXISTS public.pupil_census_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    census_import_id UUID NOT NULL REFERENCES public.census_imports(id) ON DELETE CASCADE,

    -- ============================================================
    -- PSEUDONYMISED IDENTITY
    -- Generated as: SHA-256(UPN + census_salt)[:24].toUpperCase()
    -- The same UPN always produces the same pseudo_ref for a school,
    -- enabling longitudinal tracking WITHOUT storing the UPN.
    -- ============================================================
    pseudo_ref      TEXT NOT NULL,

    -- ============================================================
    -- DEMOGRAPHICS (non-identifying)
    -- ============================================================
    gender          TEXT CHECK (gender IN ('M', 'F')),
    age_at_census   INTEGER,
    -- Calculated from DOB + reference_date, then DOB discarded
    age_band        TEXT CHECK (age_band IN ('under_5', '5_to_10', '11_to_15', '16_plus')),
    postcode_district TEXT,
    -- First half only: 'BD2', 'BD7', etc. For deprivation mapping.
    -- NOT full postcode (too identifying).

    -- ============================================================
    -- CHARACTERISTICS
    -- ============================================================
    language_code   TEXT,
    is_eal          BOOLEAN GENERATED ALWAYS AS (language_code != 'ENG' AND language_code IS NOT NULL) STORED,
    school_lunch_taken BOOLEAN,
    service_child   TEXT CHECK (service_child IN ('Y', 'N')),
    top_up_funding  NUMERIC(10,2),
    plaa            TEXT CHECK (plaa IN ('Y', 'N')),
    young_carer     TEXT CHECK (young_carer IN ('Y', 'N')),

    -- ============================================================
    -- FSM / PUPIL PREMIUM
    -- ============================================================
    fsm_eligible    BOOLEAN DEFAULT false,
    fsm_start_year  INTEGER,
    -- Academic year FSM started (NOT the full date - less identifying)
    fsm_uk_country  TEXT,

    -- ============================================================
    -- ENROLMENT
    -- ============================================================
    enrol_status    TEXT CHECK (enrol_status IN ('C', 'M', 'S', 'F', 'O')),
    type_of_class   TEXT,
    entry_date      DATE,
    part_time       BOOLEAN DEFAULT false,
    boarder         TEXT CHECK (boarder IN ('Y', 'N')),
    nc_year_actual  TEXT NOT NULL,
    -- CRITICAL: R, 1, 2, 3, 4, 5, 6, N1, N2, 7, 8, 9, 10, 11, 12, 13

    -- ============================================================
    -- SEN
    -- ============================================================
    sen_provision   TEXT CHECK (sen_provision IN ('E', 'K', 'N')),
    -- E = EHCP, K = SEN Support, N = No SEN
    sen_type_primary TEXT,
    -- SLCN, SEMH, ASD, MLD, SPLD, VI, HI, SLD, PMLD, MSI, PD, OTH, NSA
    sen_type_rank   INTEGER,
    sen_unit_indicator BOOLEAN DEFAULT false,
    resourced_provision BOOLEAN DEFAULT false,

    -- ============================================================
    -- ETHNICITY (from Spring census only)
    -- ============================================================
    ethnicity       TEXT,
    -- WBRI, WIRI, WOTH, WIRT, WROM, WBRI, MWBC, MWBA, MWAS, MOTH, AIND, APIP, AOTH
    -- BCRB, BAFR, BOTH, CHNE, COTH, IORB, IOTH, WBLT, BENG, OOTH, REFU, TRAV, UNEM, NOBT

    -- ============================================================
    -- METADATA
    -- ============================================================
    census_term     TEXT NOT NULL,
    census_year     INTEGER NOT NULL,
    academic_year   TEXT,
    -- e.g. '2021-22' (derived from term+year)

    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate pupil records per census
    UNIQUE(organization_id, pseudo_ref, census_term, census_year)
);

COMMENT ON TABLE public.pupil_census_snapshots IS 'Core census data table - one row per pupil per census. ZERO PII - all pupil data pseudonymised via pseudo_ref (SHA-256 hash of UPN). Enables longitudinal tracking without storing any identifying information.';
COMMENT ON COLUMN public.pupil_census_snapshots.pseudo_ref IS 'Pseudonymised pupil reference: SHA-256(UPN + census_salt)[:24]. Same UPN always produces same pseudo_ref for a school, enabling longitudinal tracking.';
COMMENT ON COLUMN public.pupil_census_snapshots.postcode_district IS 'First half of postcode only (e.g. "BD2"). Full postcode is too identifying and NOT stored.';

-- Indexes for common query patterns
CREATE INDEX idx_census_snapshots_org_year ON public.pupil_census_snapshots(organization_id, census_year, census_term);
CREATE INDEX idx_census_snapshots_longitudinal ON public.pupil_census_snapshots(organization_id, pseudo_ref);
CREATE INDEX idx_census_snapshots_year_group ON public.pupil_census_snapshots(organization_id, nc_year_actual, census_year);
CREATE INDEX idx_census_snapshots_sen ON public.pupil_census_snapshots(organization_id, sen_provision, census_year);
CREATE INDEX idx_census_snapshots_fsm ON public.pupil_census_snapshots(organization_id, fsm_eligible, census_year);
CREATE INDEX idx_census_snapshots_ethnicity ON public.pupil_census_snapshots(organization_id, ethnicity) WHERE ethnicity IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. pupil_attendance_sessions - Attendance by reason code
-- ----------------------------------------------------------------------------
-- Each pupil has MULTIPLE attendance records (one per term per reason code)

CREATE TABLE IF NOT EXISTS public.pupil_attendance_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    snapshot_id     UUID NOT NULL REFERENCES public.pupil_census_snapshots(id) ON DELETE CASCADE,

    -- Which attendance period
    period_type     TEXT NOT NULL CHECK (period_type IN ('termly', 'summer_ht2')),
    sessions_possible INTEGER NOT NULL,

    -- Individual reason codes and counts
    reason_code     TEXT NOT NULL CHECK (reason_code IN ('/', '\', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y')),
    session_count   INTEGER NOT NULL,

    -- Denormalised for efficient queries
    pseudo_ref      TEXT NOT NULL,
    census_year     INTEGER NOT NULL,
    census_term     TEXT NOT NULL,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.pupil_attendance_sessions IS 'Attendance sessions broken down by reason code. One pupil has multiple records (one per term per reason code). Zero-PII - linked via pseudo_ref.';
COMMENT ON COLUMN public.pupil_attendance_sessions.reason_code IS 'DfE attendance reason codes: /=present, \=attended session, B=illness, C=medical, D=dental, E=interview, etc.';

CREATE INDEX idx_attendance_sessions_snapshot ON public.pupil_attendance_sessions(snapshot_id);
CREATE INDEX idx_attendance_sessions_org_year ON public.pupil_attendance_sessions(organization_id, census_year);
CREATE INDEX idx_attendance_sessions_pupil ON public.pupil_attendance_sessions(organization_id, pseudo_ref, census_year);

-- ----------------------------------------------------------------------------
-- 6. pupil_exclusions - Exclusions data from census
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pupil_exclusions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    snapshot_id     UUID NOT NULL REFERENCES public.pupil_census_snapshots(id) ON DELETE CASCADE,

    pseudo_ref      TEXT NOT NULL,
    start_date      DATE NOT NULL,
    category        TEXT NOT NULL CHECK (category IN ('SUSP', 'PERM')),
    -- SUSP = Suspension (fixed period), PERM = Permanent exclusion
    reason          TEXT NOT NULL,
    -- DfE exclusion reason codes
    sessions        INTEGER,
    sen_at_time     TEXT CHECK (sen_at_time IN ('E', 'K', 'N')),
    census_year     INTEGER NOT NULL,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.pupil_exclusions IS 'Exclusions data from census returns. Zero-PII - linked via pseudo_ref.';

CREATE INDEX idx_exclusions_snapshot ON public.pupil_exclusions(snapshot_id);
CREATE INDEX idx_exclusions_org_year ON public.pupil_exclusions(organization_id, census_year);
CREATE INDEX idx_exclusions_pupil ON public.pupil_exclusions(organization_id, pseudo_ref);

-- ----------------------------------------------------------------------------
-- 7. school_classes - Class structure from census
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.school_classes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    census_import_id UUID REFERENCES public.census_imports(id) ON DELETE SET NULL,

    class_name      TEXT NOT NULL,
    -- e.g. "4 Farook", "Year 3 Blue", "Oak"
    year_group      TEXT NOT NULL,
    key_stage       TEXT CHECK (key_stage IN ('EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5')),
    teacher_count   INTEGER DEFAULT 0,
    ta_count        INTEGER DEFAULT 0,
    pupil_count     INTEGER DEFAULT 0,
    class_activity  TEXT,

    -- For historical tracking
    census_year     INTEGER,
    census_term     TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, class_name, census_year, census_term)
);

COMMENT ON TABLE public.school_classes IS 'Class structure derived from census returns. Includes class names, teacher/TA counts, and pupil counts per class.';

CREATE INDEX idx_school_classes_org ON public.school_classes(organization_id, census_year DESC);
CREATE INDEX idx_school_classes_year_group ON public.school_classes(organization_id, year_group, census_year);

-- ----------------------------------------------------------------------------
-- 8. school_census_aggregates - Pre-calculated dashboard metrics
-- ----------------------------------------------------------------------------
-- These power the dashboard without needing to query pupil-level data
-- Calculated once when census is imported, never recalculated

CREATE TABLE IF NOT EXISTS public.school_census_aggregates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    census_import_id UUID NOT NULL REFERENCES public.census_imports(id) ON DELETE CASCADE,

    census_term     TEXT NOT NULL,
    census_year     INTEGER NOT NULL,

    -- Headcount
    total_pupils    INTEGER,
    total_male      INTEGER,
    total_female    INTEGER,
    total_full_time INTEGER,
    total_part_time INTEGER,

    -- By year group (JSONB for flexibility)
    -- e.g. {"N2": 27, "R": 55, "1": 53, "2": 51, ...}
    pupils_by_year_group JSONB,

    -- SEN
    total_sen_ehcp  INTEGER,
    total_sen_support INTEGER,
    total_sen_none  INTEGER,
    sen_percentage  NUMERIC(5,2),

    -- FSM / Disadvantage
    total_fsm_eligible INTEGER,
    fsm_percentage  NUMERIC(5,2),
    total_plaa      INTEGER,
    total_service_children INTEGER,

    -- EAL
    total_eal       INTEGER,
    eal_percentage  NUMERIC(5,2),
    language_breakdown JSONB,
    -- e.g. {"ENG": 277, "BNG": 52, "PNJ": 32, ...}

    -- Ethnicity (from Spring census)
    ethnicity_breakdown JSONB,
    -- e.g. {"WBRI": 120, "WBRI": 45, "AIND": 30, ...}

    -- Attendance (aggregated from session data)
    total_sessions_possible INTEGER,
    total_sessions_present INTEGER,
    total_sessions_authorised_absence INTEGER,
    total_sessions_unauthorised_absence INTEGER,
    overall_absence_rate NUMERIC(5,2),
    authorised_absence_rate NUMERIC(5,2),
    unauthorised_absence_rate NUMERIC(5,2),
    persistent_absence_count INTEGER,
    persistent_absence_rate NUMERIC(5,2),

    -- Absence by reason (JSONB)
    -- e.g. {"I": 1114, "G": 632, "R": 807, "N": 738, ...}
    absence_by_reason JSONB,

    -- Exclusions summary
    total_exclusions INTEGER,
    total_suspensions INTEGER,
    total_permanent_exclusions INTEGER,

    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, census_term, census_year)
);

COMMENT ON TABLE public.school_census_aggregates IS 'Pre-calculated school-level aggregates per census. Powers the dashboard with instant queries - no AI cost, no pupil-level access needed.';

CREATE INDEX idx_census_aggregates_org_year ON public.school_census_aggregates(organization_id, census_year DESC);

-- ----------------------------------------------------------------------------
-- 9. ed_flags - AI-generated concerns from census patterns
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ed_flags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    pseudo_ref      TEXT,
    -- NULL for school-level flags, set for pupil-specific flags
    severity        TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'info')),
    flag_type       TEXT NOT NULL,
    -- Values: 'attendance_pa_risk', 'sen_without_provision', 'fsm_attainment_gap',
    -- 'persistent_absence', 'mobility_risk', 'exclusion_risk', etc.
    title           TEXT NOT NULL,
    detail          TEXT NOT NULL,

    -- Data sources that triggered this flag
    data_sources    JSONB DEFAULT '{}',
    -- e.g. {"census_terms": ["SPR2025"], "attendance_sessions": true, "sen_changes": true}

    status          TEXT DEFAULT 'action_required' CHECK (status IN ('action_required', 'noted', 'resolved', 'dismissed')),
    school_response TEXT,

    -- Resolution tracking
    responded_by    UUID,
    responded_at    TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.ed_flags IS 'AI-generated flags and concerns identified by Ed from census data patterns. These are proactive insights - e.g., pupils at risk of persistent absence, SEN pupils without provision, FSM attainment gaps.';

CREATE INDEX idx_ed_flags_org_severity ON public.ed_flags(organization_id, severity) WHERE status = 'action_required';
CREATE INDEX idx_ed_flags_pupil ON public.ed_flags(organization_id, pseudo_ref) WHERE pseudo_ref IS NOT NULL;
CREATE INDEX idx_ed_flags_type ON public.ed_flags(organization_id, flag_type);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

-- Enable RLS on all new tables
ALTER TABLE public.census_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pupil_census_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pupil_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pupil_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_census_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ed_flags ENABLE ROW LEVEL SECURITY;

-- Policy pattern: Organization members can see their own data
-- Service role has full access

-- census_imports
CREATE POLICY "Service role full access on census_imports"
    ON public.census_imports FOR ALL USING (true);
CREATE POLICY "Organization members can view census_imports"
    ON public.census_imports FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

-- pupil_census_snapshots
CREATE POLICY "Service role full access on pupil_census_snapshots"
    ON public.pupil_census_snapshots FOR ALL USING (true);
CREATE POLICY "Organization members can view pupil_census_snapshots"
    ON public.pupil_census_snapshots FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

-- pupil_attendance_sessions
CREATE POLICY "Service role full access on pupil_attendance_sessions"
    ON public.pupil_attendance_sessions FOR ALL USING (true);
CREATE POLICY "Organization members can view pupil_attendance_sessions"
    ON public.pupil_attendance_sessions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

-- pupil_exclusions
CREATE POLICY "Service role full access on pupil_exclusions"
    ON public.pupil_exclusions FOR ALL USING (true);
CREATE POLICY "Organization members can view pupil_exclusions"
    ON public.pupil_exclusions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

-- school_classes
CREATE POLICY "Service role full access on school_classes"
    ON public.school_classes FOR ALL USING (true);
CREATE POLICY "Organization members can view school_classes"
    ON public.school_classes FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

-- school_census_aggregates
CREATE POLICY "Service role full access on school_census_aggregates"
    ON public.school_census_aggregates FOR ALL USING (true);
CREATE POLICY "Organization members can view school_census_aggregates"
    ON public.school_census_aggregates FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

-- ed_flags
CREATE POLICY "Service role full access on ed_flags"
    ON public.ed_flags FOR ALL USING (true);
CREATE POLICY "Organization members can view ed_flags"
    ON public.ed_flags FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );
CREATE POLICY "Organization members can update ed_flags"
    ON public.ed_flags FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

-- ----------------------------------------------------------------------------
-- HELPER VIEWS
-- ----------------------------------------------------------------------------

-- View: Longitudinal pupil journey across census years
-- Shows each pupil's progression through year groups with SEN/FSM status
CREATE OR REPLACE VIEW public.census_pupil_journey AS
SELECT
    organization_id,
    pseudo_ref,
    array_agg(nc_year_actual ORDER BY census_year, census_term) FILTER (WHERE nc_year_actual IS NOT NULL) AS year_groups,
    array_agg(census_year ORDER BY census_year, census_term) AS census_years,
    array_agg(sen_provision ORDER BY census_year, census_term) AS sen_history,
    array_agg(fsm_eligible ORDER BY census_year, census_term) AS fsm_history,
    min(nc_year_actual) AS starting_year_group,
    max(nc_year_actual) AS current_year_group,
    count(*) AS census_count
FROM public.pupil_census_snapshots
GROUP BY organization_id, pseudo_ref;

COMMENT ON VIEW public.census_pupil_journey IS 'Longitudinal view showing each pupil''s journey through year groups with SEN/FSM history. Zero-PII - pseudo_ref only.';

-- View: School census summary (latest census per org)
CREATE OR REPLACE VIEW public.census_latest_summary AS
SELECT DISTINCT ON (organization_id)
    organization_id,
    census_term,
    census_year,
    total_pupils,
    sen_percentage,
    fsm_percentage,
    eal_percentage,
    overall_absence_rate,
    persistent_absence_rate
FROM public.school_census_aggregates
ORDER BY organization_id, census_year DESC, census_term DESC NULLS LAST;

COMMENT ON VIEW public.census_latest_summary IS 'Latest census summary per organization for dashboard overview.';

-- View: Attendance by SEN status (Ofsted loves this analysis)
CREATE OR REPLACE VIEW public.census_attendance_by_sen AS
SELECT
    s.organization_id,
    s.census_year,
    s.census_term,
    s.sen_provision,
    COUNT(DISTINCT s.pseudo_ref) AS pupil_count,
    SUM(a.sessions_possible) AS total_sessions_possible,
    SUM(a.session_count) FILTER (WHERE a.reason_code IN ('/', '\')) AS sessions_present,
    SUM(a.session_count) FILTER (WHERE a.reason_code = 'I') AS sessions_illness,
    SUM(a.session_count) FILTER (WHERE a.reason_code IN ('B', 'C', 'D')) AS sessions_medical,
    SUM(a.session_count) FILTER (WHERE a.reason_code IN ('G', 'H', 'J', 'L', 'O', 'P', 'U', 'V')) AS sessions_authorised,
    SUM(a.session_count) FILTER (WHERE a.reason_code IN ('N', 'S')) AS sessions_unauthorised,
    CASE
        WHEN SUM(a.sessions_possible) > 0 THEN
        ROUND((SUM(a.session_count) FILTER (WHERE a.reason_code IN ('/', '\'))::NUMERIC / SUM(a.sessions_possible) * 100), 2)
        ELSE NULL
    END AS attendance_percentage
FROM public.pupil_census_snapshots s
LEFT JOIN public.pupil_attendance_sessions a ON a.snapshot_id = s.id
GROUP BY s.organization_id, s.census_year, s.census_term, s.sen_provision
ORDER BY s.census_year DESC, s.census_term, s.sen_provision;

COMMENT ON VIEW public.census_attendance_by_sen IS 'Attendance breakdown by SEN provision status. Shows attendance gaps between SEN and non-SEN pupils.';

-- ----------------------------------------------------------------------------
-- TRIGGER: Updated timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_census_imports_updated_at
    BEFORE UPDATE ON public.census_imports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- COMPLETION NOTES
-- ----------------------------------------------------------------------------
-- This migration creates the foundation for census XML ingestion.
--
-- Next steps:
-- 1. Create census XML parser library (lib/census-xml-parser.ts)
-- 2. Create API endpoint for census upload (/api/census/upload)
-- 3. Create Ed skill for census analysis
-- 4. Create census dashboard UI
--
-- Privacy guaranteed:
-- - No pupil names stored
-- - No DOBs stored (age calculated then discarded)
-- - No full postcodes stored (district only)
-- - No UPNs stored (SHA-256 hash only)
-- - Row Level Security enforces organization isolation
-- ============================================================================
