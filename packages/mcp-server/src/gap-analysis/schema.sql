-- Gap Analysis Engine - Schema Definitions
-- Framework-agnostic, update-ready, high-scale
-- Supabase-ready (PostgreSQL)

-- ============================================================================
-- FRAMEWORK EXPECTATIONS
-- ============================================================================
-- Defines what each framework expects in each area
-- Versioned and lifecycle-managed for updates without code changes

CREATE TABLE IF NOT EXISTS framework_expectations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Framework identification
  framework TEXT NOT NULL CHECK (framework IN ('ofsted', 'siams', 'csi', 'isi', 'section48', 'other')),
  
  -- Stable internal taxonomy (framework-agnostic)
  area_key TEXT NOT NULL, -- e.g., 'curriculum_intent', 'safeguarding_culture', 'pupil_voice'
  area_name TEXT NOT NULL, -- Display name (can be framework-specific)
  
  -- Description (plain English, advisory language)
  description TEXT NOT NULL,
  
  -- Risk weighting for gap prioritization
  risk_weight TEXT NOT NULL CHECK (risk_weight IN ('high', 'medium', 'low')) DEFAULT 'medium',
  
  -- Authority level (for language enforcement)
  authority_level TEXT NOT NULL CHECK (authority_level IN ('statutory', 'guidance', 'best_practice')) DEFAULT 'guidance',
  
  -- Versioning & lifecycle
  version TEXT NOT NULL DEFAULT '1.0', -- Semantic versioning
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_by_date DATE, -- When this version should be reviewed
  is_active BOOLEAN NOT NULL DEFAULT true,
  superseded_by UUID REFERENCES framework_expectations(id), -- If this version is superseded
  
  -- Source tracking
  source TEXT CHECK (source IN ('ofsted', 'siams', 'eef', 'dfe', 'inspection_learning', 'consultant', 'other')),
  source_url TEXT, -- Link to official guidance
  source_section TEXT, -- Section/page reference
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(framework, area_key, version) -- Same area can have multiple versions
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_framework_expectations_framework_active 
  ON framework_expectations(framework, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_framework_expectations_area_key 
  ON framework_expectations(area_key);

CREATE INDEX IF NOT EXISTS idx_framework_expectations_effective_date 
  ON framework_expectations(effective_date DESC);

-- ============================================================================
-- EVIDENCE REQUIREMENTS
-- ============================================================================
-- Defines what evidence is needed for each framework expectation
-- Updateable without code changes (add new rows, mark old inactive)

CREATE TABLE IF NOT EXISTS evidence_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to framework expectation
  framework_expectation_id UUID NOT NULL REFERENCES framework_expectations(id) ON DELETE CASCADE,
  
  -- Evidence type (taxonomy)
  evidence_type TEXT NOT NULL, -- e.g., 'lesson_plan', 'book_look', 'pupil_voice', 'policy', 'assessment_data', 'observation', 'meeting_minutes', 'cpd_record'
  
  -- Evidence characteristics
  mandatory BOOLEAN NOT NULL DEFAULT false, -- Is this evidence mandatory or optional?
  recency_months INTEGER, -- How recent must evidence be? (NULL = no recency requirement)
  min_quantity INTEGER DEFAULT 1, -- Minimum number of evidence items needed
  recommended_quantity INTEGER, -- Recommended number (for advisory guidance)
  
  -- Advisory notes (not authoritative)
  notes TEXT, -- e.g., "Consider including examples from different year groups"
  
  -- Versioning & lifecycle
  version TEXT NOT NULL DEFAULT '1.0',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  superseded_by UUID REFERENCES evidence_requirements(id),
  
  -- Source tracking
  source TEXT CHECK (source IN ('ofsted', 'siams', 'eef', 'dfe', 'inspection_learning', 'consultant', 'other')),
  source_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(framework_expectation_id, evidence_type, version) -- Same requirement can have multiple versions
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_requirements_expectation 
  ON evidence_requirements(framework_expectation_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_evidence_requirements_type 
  ON evidence_requirements(evidence_type);

-- ============================================================================
-- EVIDENCE GAP RESULTS
-- ============================================================================
-- Cached gap analysis results per school
-- Enables fast retrieval without re-running analysis

CREATE TABLE IF NOT EXISTS evidence_gap_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- School identification
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Framework & area
  framework TEXT NOT NULL CHECK (framework IN ('ofsted', 'siams', 'csi', 'isi', 'section48', 'other')),
  area_key TEXT NOT NULL,
  
  -- Gap status
  status TEXT NOT NULL CHECK (status IN ('present', 'missing', 'outdated', 'weak')) DEFAULT 'missing',
  
  -- Scoring
  gap_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- Risk-weighted gap score (0 = no gap, higher = more critical)
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- How confident is this assessment? (0 = uncertain, 1 = certain)
  
  -- Evidence assessment
  evidence_count INTEGER DEFAULT 0, -- Number of evidence items found
  required_evidence_count INTEGER, -- Number of evidence items required
  oldest_evidence_date DATE, -- Date of oldest evidence found
  newest_evidence_date DATE, -- Date of newest evidence found
  
  -- Assessment metadata
  last_scanned_at TIMESTAMPTZ, -- When evidence was last scanned
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When this gap analysis was run
  
  -- Advisory notes (factual, not judgemental)
  notes TEXT[], -- Array of advisory notes (e.g., "Evidence exists but is older than recommended")
  strengths TEXT[], -- Array of strengths identified (e.g., "Strong coverage of curriculum intent")
  gaps TEXT[], -- Array of gaps identified (e.g., "No recent pupil voice evidence")
  
  -- Evidence details (JSON for flexibility)
  evidence_details JSONB, -- Array of evidence items found: [{type, date, confidence, document_id}]
  required_evidence_details JSONB, -- Array of required evidence: [{type, mandatory, recency_months}]
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, framework, area_key) -- One gap result per school/area combination
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_gap_results_org 
  ON evidence_gap_results(organization_id, framework);

CREATE INDEX IF NOT EXISTS idx_evidence_gap_results_status 
  ON evidence_gap_results(status, gap_score DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_gap_results_analyzed 
  ON evidence_gap_results(analyzed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE framework_expectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_gap_results ENABLE ROW LEVEL SECURITY;

-- Framework expectations are read-only for all authenticated users (reference data)
CREATE POLICY "Framework expectations are readable by all authenticated users"
  ON framework_expectations FOR SELECT
  TO authenticated
  USING (true);

-- Evidence requirements are read-only for all authenticated users (reference data)
CREATE POLICY "Evidence requirements are readable by all authenticated users"
  ON evidence_requirements FOR SELECT
  TO authenticated
  USING (true);

-- Gap results are scoped to organization
CREATE POLICY "Users can view gap results for their organizations"
  ON evidence_gap_results FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create gap results for their organizations"
  ON evidence_gap_results FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update gap results for their organizations"
  ON evidence_gap_results FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()::text
    )
  );

-- Service role has full access (for MCP tools)
CREATE POLICY "Service role full access" ON framework_expectations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON evidence_requirements FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON evidence_gap_results FOR ALL TO service_role USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get active framework expectations for a framework
CREATE OR REPLACE FUNCTION get_active_framework_expectations(
  framework_param TEXT
)
RETURNS TABLE (
  id UUID,
  area_key TEXT,
  area_name TEXT,
  description TEXT,
  risk_weight TEXT,
  authority_level TEXT,
  version TEXT,
  effective_date DATE
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    fe.id,
    fe.area_key,
    fe.area_name,
    fe.description,
    fe.risk_weight,
    fe.authority_level,
    fe.version,
    fe.effective_date
  FROM framework_expectations fe
  WHERE fe.framework = framework_param
    AND fe.is_active = true
    AND fe.effective_date <= CURRENT_DATE
    AND (fe.review_by_date IS NULL OR fe.review_by_date >= CURRENT_DATE)
  ORDER BY fe.area_key, fe.effective_date DESC;
$$;

-- Get active evidence requirements for a framework expectation
CREATE OR REPLACE FUNCTION get_active_evidence_requirements(
  framework_expectation_id_param UUID
)
RETURNS TABLE (
  id UUID,
  evidence_type TEXT,
  mandatory BOOLEAN,
  recency_months INTEGER,
  min_quantity INTEGER,
  recommended_quantity INTEGER,
  notes TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    er.id,
    er.evidence_type,
    er.mandatory,
    er.recency_months,
    er.min_quantity,
    er.recommended_quantity,
    er.notes
  FROM evidence_requirements er
  WHERE er.framework_expectation_id = framework_expectation_id_param
    AND er.is_active = true
    AND er.effective_date <= CURRENT_DATE
  ORDER BY er.mandatory DESC, er.evidence_type;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE framework_expectations IS 
  'Framework-agnostic expectations for each inspection area. Versioned and lifecycle-managed for updates without code changes.';

COMMENT ON TABLE evidence_requirements IS 
  'Evidence requirements for each framework expectation. Updateable without code changes (add new rows, mark old inactive).';

COMMENT ON TABLE evidence_gap_results IS 
  'Cached gap analysis results per school. Enables fast retrieval without re-running analysis.';

COMMENT ON COLUMN framework_expectations.area_key IS 
  'Stable internal taxonomy (framework-agnostic). Maps to framework-specific names via area_name.';

COMMENT ON COLUMN framework_expectations.authority_level IS 
  'Used for language enforcement: statutory = "Statutory requirement", guidance = "Guidance suggests", best_practice = "Best practice indicates".';

COMMENT ON COLUMN evidence_gap_results.gap_score IS 
  'Risk-weighted gap score: missing=100, outdated=50, weak=25, present=0, multiplied by risk_weight (high=3.0, medium=1.5, low=1.0).';

COMMENT ON COLUMN evidence_gap_results.confidence_score IS 
  'Assessment confidence (0-1): Based on evidence match quality, recency, and coverage.';


