-- =====================================================
-- Ofsted Framework Integration
-- Based on Ofsted Education Inspection Framework (EIF) 2025
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ofsted_assessments table
-- Stores school self-assessments against Ofsted criteria
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ofsted_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Framework Reference
    category_id TEXT NOT NULL CHECK (category_id IN ('quality-of-education', 'behaviour-attitudes', 'personal-development', 'leadership-management')),
    subcategory_id TEXT NOT NULL CHECK (subcategory_id IN (
        'education-curriculum', 'education-teaching', 'education-reading', 'education-achievement',
        'behaviour-attendance', 'behaviour-conduct', 'behaviour-attitudes',
        'development-character', 'development-citizenship', 'development-enrichment', 'development-rse',
        'leadership-vision', 'leadership-governance', 'leadership-staff', 'leadership-engagement'
    )),

    -- School Self-Assessment
    school_rating TEXT CHECK (school_rating IN ('exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement')),
    school_rationale TEXT,

    -- AI Assessment (from evidence scanning)
    ai_rating TEXT CHECK (ai_rating IN ('exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement')),
    ai_rationale TEXT,

    -- Evidence
    evidence_count INTEGER DEFAULT 0,
    evidence_items JSONB DEFAULT '[]'::jsonb,

    -- Meta
    assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one assessment per subcategory per organization
    UNIQUE(organization_id, subcategory_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ofsted_assessments_org ON public.ofsted_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_assessments_category ON public.ofsted_assessments(category_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_assessments_subcategory ON public.ofsted_assessments(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_assessments_school_rating ON public.ofsted_assessments(school_rating);
CREATE INDEX IF NOT EXISTS idx_ofsted_assessments_ai_rating ON public.ofsted_assessments(ai_rating);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_ofsted_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ofsted_assessments_updated_at ON public.ofsted_assessments;
CREATE TRIGGER trigger_update_ofsted_assessments_updated_at
    BEFORE UPDATE ON public.ofsted_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_ofsted_assessments_updated_at();

-- =====================================================
-- ofsted_evidence_matches table
-- Stores AI-matched evidence links to Ofsted criteria
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ofsted_evidence_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Document Reference
    document_id TEXT NOT NULL,

    -- Framework Reference
    category_id TEXT NOT NULL,
    subcategory_id TEXT NOT NULL,

    -- Match Details
    confidence TEXT CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
    matched_keywords TEXT[] DEFAULT '{}',
    relevance_explanation TEXT,
    key_quotes TEXT[] DEFAULT '{}',

    -- Links
    document_link TEXT,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ofsted_evidence_org ON public.ofsted_evidence_matches(organization_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_evidence_document ON public.ofsted_evidence_matches(document_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_evidence_category ON public.ofsted_evidence_matches(category_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_evidence_subcategory ON public.ofsted_evidence_matches(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_evidence_confidence ON public.ofsted_evidence_matches(confidence);

-- =====================================================
-- ofsted_readiness_snapshots table
-- Stores historical readiness snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ofsted_readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Overall Readiness
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    overall_rating TEXT CHECK (overall_rating IN ('exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement')),

    -- Category Scores
    category_scores JSONB DEFAULT '{}'::jsonb,

    -- Evidence Counts
    total_evidence INTEGER DEFAULT 0,
    evidence_by_category JSONB DEFAULT '{}'::jsonb,

    -- Gaps
    critical_gaps INTEGER DEFAULT 0,
    gap_details JSONB DEFAULT '[]'::jsonb,

    -- Safeguarding (separate assessment)
    safeguarding_met BOOLEAN,
    safeguarding_notes TEXT,

    -- Snapshot Date
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- documents table - Stores scanned documents from cloud drives
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    auth_id TEXT,

    -- Document content
    content TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- File info
    name TEXT,
    file_type TEXT,
    file_size BIGINT,
    provider TEXT, -- 'google_drive' | 'onedrive'
    external_id TEXT UNIQUE,
    web_view_link TEXT,
    folder_path TEXT,

    -- Embedding for semantic search
    embedding vector(1536),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_provider ON public.documents(provider);
CREATE INDEX IF NOT EXISTS idx_documents_external_id ON public.documents(external_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON public.documents USING ivfflat(embedding vector_cosine_ops);

-- Enable RLS for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization documents"
    ON public.documents FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own organization documents"
    ON public.documents FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own organization documents"
    ON public.documents FOR UPDATE
    USING (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ofsted_readiness_org ON public.ofsted_readiness_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_ofsted_readiness_date ON public.ofsted_readiness_snapshots(snapshot_date DESC);

-- =====================================================
-- evidence_matches table (general purpose for all frameworks)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.evidence_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    auth_id TEXT,

    -- Document reference
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,

    -- Framework identification
    framework_type TEXT NOT NULL, -- 'ofsted' | 'siams'
    category_id TEXT NOT NULL,
    category_name TEXT,
    subcategory_id TEXT NOT NULL,
    subcategory_name TEXT,

    -- Match details
    confidence DECIMAL(3,2), -- 0.00 to 1.00
    matched_keywords TEXT[] DEFAULT '{}',
    relevance_explanation TEXT,
    key_quotes TEXT[],

    -- Document link
    document_link TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint to prevent duplicate matches
    UNIQUE(organization_id, document_id, framework_type, subcategory_id)
);

-- Indexes for evidence_matches
CREATE INDEX IF NOT EXISTS idx_evidence_org ON public.evidence_matches(organization_id);
CREATE INDEX IF NOT EXISTS idx_evidence_document ON public.evidence_matches(document_id);
CREATE INDEX IF NOT EXISTS idx_evidence_framework ON public.evidence_matches(framework_type, category_id);
CREATE INDEX IF NOT EXISTS idx_evidence_subcategory ON public.evidence_matches(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_evidence_confidence ON public.evidence_matches(confidence DESC);

-- Enable RLS for evidence_matches
ALTER TABLE public.evidence_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization evidence"
    ON public.evidence_matches FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own organization evidence"
    ON public.evidence_matches FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.ofsted_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofsted_evidence_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofsted_readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ofsted_assessments
CREATE POLICY "Users can view own organization assessments"
    ON public.ofsted_assessments FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own organization assessments"
    ON public.ofsted_assessments FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own organization assessments"
    ON public.ofsted_assessments FOR UPDATE
    USING (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

-- RLS Policies for ofsted_evidence_matches
CREATE POLICY "Users can view own organization evidence"
    ON public.ofsted_evidence_matches FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own organization evidence"
    ON public.ofsted_evidence_matches FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

-- RLS Policies for ofsted_readiness_snapshots
CREATE POLICY "Users can view own organization snapshots"
    ON public.ofsted_readiness_snapshots FOR SELECT
    USING (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own organization snapshots"
    ON public.ofsted_readiness_snapshots FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM user_org_roles WHERE user_id = auth.uid())
    );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate readiness score
CREATE OR REPLACE FUNCTION calculate_ofsted_readiness(p_org_id UUID)
RETURNS TABLE (
    overall_score INTEGER,
    overall_rating TEXT,
    category_scores JSONB,
    total_evidence INTEGER,
    critical_gaps INTEGER
) AS $$
DECLARE
    v_total_subcategories INTEGER := 16; -- Total subcategories
    v_assessed INTEGER := 0;
    v_total_score INTEGER := 0;
    v_rating TEXT := 'not_assessed';
    v_cat_scores JSONB := '{}'::jsonb;
    v_total_ev INTEGER := 0;
    v_critical INTEGER := 0;
BEGIN
    -- Count assessed subcategories
    SELECT COUNT(DISTINCT subcategory_id) INTO v_assessed
    FROM public.ofsted_assessments
    WHERE organization_id = p_org_id
    AND school_rating IS NOT NULL;

    -- Calculate total score (ratings: exceptional=5, strong_standard=4, expected_standard=3, needs_attention=2, urgent_improvement=1)
    SELECT COALESCE(SUM(
        CASE school_rating
            WHEN 'exceptional' THEN 100
            WHEN 'strong_standard' THEN 80
            WHEN 'expected_standard' THEN 60
            WHEN 'needs_attention' THEN 40
            WHEN 'urgent_improvement' THEN 20
            ELSE 0
        END
    ), 0) INTO v_total_score
    FROM public.ofsted_assessments
    WHERE organization_id = p_org_id
    AND school_rating IS NOT NULL;

    -- Calculate overall score
    IF v_assessed > 0 THEN
        v_total_score := v_total_score / v_assessed;
    END IF;

    -- Determine rating
    IF v_total_score >= 90 THEN
        v_rating := 'exceptional';
    ELSIF v_total_score >= 70 THEN
        v_rating := 'strong_standard';
    ELSIF v_total_score >= 50 THEN
        v_rating := 'expected_standard';
    ELSIF v_total_score >= 30 THEN
        v_rating := 'needs_attention';
    ELSE
        v_rating := 'urgent_improvement';
    END IF;

    -- Calculate category scores
    SELECT jsonb_object_agg(category_id, score) INTO v_cat_scores
    FROM (
        SELECT
            category_id,
            COALESCE(AVG(
                CASE school_rating
                    WHEN 'exceptional' THEN 100
                    WHEN 'strong_standard' THEN 80
                    WHEN 'expected_standard' THEN 60
                    WHEN 'needs_attention' THEN 40
                    WHEN 'urgent_improvement' THEN 20
                    ELSE 0
                END
            ), 0)::INTEGER AS score
        FROM public.ofsted_assessments
        WHERE organization_id = p_org_id
        AND school_rating IS NOT NULL
        GROUP BY category_id
    ) cat_scores;

    -- Count total evidence
    SELECT COALESCE(SUM(evidence_count), 0) INTO v_total_ev
    FROM public.ofsted_assessments
    WHERE organization_id = p_org_id;

    -- Count critical gaps (rating below expected_standard with no evidence)
    SELECT COUNT(*) INTO v_critical
    FROM public.ofsted_assessments
    WHERE organization_id = p_org_id
    AND (school_rating IN ('needs_attention', 'urgent_improvement') OR school_rating IS NULL)
    AND evidence_count = 0;

    RETURN QUERY SELECT v_total_score, v_rating, v_cat_scores, v_total_ev, v_critical;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE public.ofsted_assessments IS 'School self-assessments against Ofsted Education Inspection Framework criteria';
COMMENT ON TABLE public.ofsted_evidence_matches IS 'AI-matched evidence links to Ofsted criteria from scanned documents';
COMMENT ON TABLE public.ofsted_readiness_snapshots IS 'Historical readiness snapshots for tracking improvement over time';
