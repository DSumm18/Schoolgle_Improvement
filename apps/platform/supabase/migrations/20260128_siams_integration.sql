-- =====================================================
-- SIAMS Framework Database Schema
-- Phase 1.2: SIAMS Full Integration
-- =====================================================
-- This migration creates the database structure for SIAMS
-- (Statutory Inspection of Anglican and Methodist Schools)
-- including assessments, evidence matching, and church school detection.
-- =====================================================

-- =====================================================
-- 1. SIAMS ASSESSMENTS TABLE
-- =====================================================

-- Separate table for SIAMS assessments (parallel to ofsted_assessments)
CREATE TABLE IF NOT EXISTS siams_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Framework Reference
    strand_id TEXT NOT NULL, -- vision, wisdom, character, community, dignity, worship, re
    question_id TEXT NOT NULL,

    -- Assessments
    school_rating TEXT, -- excellent, good, requires_improvement, ineffective
    school_rationale TEXT,
    ai_rating TEXT,
    ai_rationale TEXT,

    -- Evidence
    evidence_count INTEGER DEFAULT 0,
    evidence_items JSONB DEFAULT '[]'::jsonb, -- [{documentId, documentName, matchedAt}]

    -- Meta
    assessed_by TEXT, -- Firebase user ID (no FK since users table uses text IDs)
    assessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, question_id)
);

-- =====================================================
-- 2. SIAMS EVIDENCE MATCHES TABLE
-- =====================================================

-- Links documents to SIAMS framework requirements
CREATE TABLE IF NOT EXISTS siams_evidence_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Document Reference
    document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,

    -- Framework Reference
    strand_id TEXT NOT NULL,
    question_id TEXT NOT NULL,

    -- Match Details
    confidence TEXT, -- HIGH, MEDIUM, LOW
    matched_keywords TEXT[],
    relevance_explanation TEXT,
    key_quotes TEXT[],

    -- Links
    document_link TEXT,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, document_id, question_id)
);

-- =====================================================
-- 3. SCHOOL CHURCH STATUS TABLE
-- =====================================================

-- Stores church school information detected from DFE database
CREATE TABLE IF NOT EXISTS school_church_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- School Details
    urn TEXT UNIQUE, -- UK Provider Reference Number
    school_name TEXT,
    la_code TEXT,
    establishment_number TEXT,

    -- Church Status
    is_church_school BOOLEAN DEFAULT false,
    church_denomination TEXT, -- church_of_england, roman_catholic, methodist, other_christian, other
    diocese TEXT,
    parish TEXT,

    -- SIAMS Details
    last_siams_date DATE,
    last_siams_rating TEXT, -- excellent, good, requires_improvement, ineffective
    next_siams_date DATE,

    -- DFE Data
    dfe_data JSONB DEFAULT '{}'::jsonb,

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id)
);

-- =====================================================
-- 4. SIAMS READINESS SNAPSHOT (for timeline tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS siams_readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Overall Readiness
    overall_score INTEGER, -- 0-100
    overall_rating TEXT, -- excellent, good, requires_improvement, ineffective

    -- Strand Scores
    strand_scores JSONB, -- {vision: 85, wisdom: 70, character: 90, ...}

    -- Evidence Counts
    total_evidence INTEGER,
    evidence_by_strand JSONB, -- {vision: 15, wisdom: 10, ...}

    -- Gaps
    critical_gaps INTEGER,
    gap_details JSONB, -- [{strand, question, missing_evidence}]

    -- Snapshot Date
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- SIAMS assessments indexes
CREATE INDEX IF NOT EXISTS idx_siams_assessments_org ON siams_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_siams_assessments_strand ON siams_assessments(strand_id);
CREATE INDEX IF NOT EXISTS idx_siams_assessments_question ON siams_assessments(question_id);
CREATE INDEX IF NOT EXISTS idx_siams_assessments_rating ON siams_assessments(school_rating);
CREATE INDEX IF NOT EXISTS idx_siams_assessments_updated ON siams_assessments(updated_at DESC);

-- SIAMS evidence matches indexes
CREATE INDEX IF NOT EXISTS idx_siams_evidence_org ON siams_evidence_matches(organization_id);
CREATE INDEX IF NOT EXISTS idx_siams_evidence_document ON siams_evidence_matches(document_id);
CREATE INDEX IF NOT EXISTS idx_siams_evidence_strand ON siams_evidence_matches(strand_id);
CREATE INDEX IF NOT EXISTS idx_siams_evidence_question ON siams_evidence_matches(question_id);
CREATE INDEX IF NOT EXISTS idx_siams_evidence_confidence ON siams_evidence_matches(confidence);

-- School church status indexes
CREATE INDEX IF NOT EXISTS idx_school_church_status_org ON school_church_status(organization_id);
CREATE INDEX IF NOT EXISTS idx_school_church_status_urn ON school_church_status(urn);
CREATE INDEX IF NOT EXISTS idx_school_church_status_is_church ON school_church_status(is_church_school);

-- SIAMS readiness snapshots indexes
CREATE INDEX IF NOT EXISTS idx_siams_snapshots_org ON siams_readiness_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_siams_snapshots_date ON siams_readiness_snapshots(snapshot_date DESC);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE siams_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE siams_evidence_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_church_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE siams_readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Organizations can only access their own data
CREATE POLICY "Org can access own siams_assessments" ON siams_assessments
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can insert own siams_assessments" ON siams_assessments
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can access own siams_evidence_matches" ON siams_evidence_matches
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can insert own siams_evidence_matches" ON siams_evidence_matches
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can access own school_church_status" ON school_church_status
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can insert own school_church_status" ON school_church_status
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can access own siams_readiness_snapshots" ON siams_readiness_snapshots
    FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

CREATE POLICY "Org can insert own siams_readiness_snapshots" ON siams_readiness_snapshots
    FOR INSERT WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE id = organization_id));

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to check if organization is a church school
CREATE OR REPLACE FUNCTION is_church_school(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM school_church_status
        WHERE organization_id = org_id AND is_church_school = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get SIAMS readiness score
CREATE OR REPLACE FUNCTION get_siams_readiness(org_id UUID)
RETURNS TABLE (
    strand_id TEXT,
    strand_name TEXT,
    question_id TEXT,
    question_text TEXT,
    evidence_count INTEGER,
    school_rating TEXT,
    ai_rating TEXT,
    readiness_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH question_definitions AS (
        -- SIAMS strand and question definitions
        SELECT 'vision' as strand_id, 'Vision and Leadership' as strand_name, 'vision-1' as question_id,
               'How clearly is the school''s Christian vision articulated and understood by all?' as question_text
        UNION ALL SELECT 'vision', 'Vision and Leadership', 'vision-2',
               'How effectively does the vision shape the strategic direction of the school?'
        UNION ALL SELECT 'vision', 'Vision and Leadership', 'vision-3',
               'How well do leaders at all levels model and promote the vision?'
        UNION ALL SELECT 'vision', 'Vision and Leadership', 'vision-4',
               'How effectively does governance support and challenge the school''s Christian foundation?'
        UNION ALL SELECT 'wisdom', 'Wisdom, Knowledge and Skills', 'wisdom-1',
               'How does the curriculum reflect the school''s Christian vision?'
        UNION ALL SELECT 'wisdom', 'Wisdom, Knowledge and Skills', 'wisdom-2',
               'How well does the curriculum enable pupils to develop spiritually?'
        UNION ALL SELECT 'wisdom', 'Wisdom, Knowledge and Skills', 'wisdom-3',
               'How effectively does the curriculum prepare pupils for life in modern Britain?'
        UNION ALL SELECT 'wisdom', 'Wisdom, Knowledge and Skills', 'wisdom-4',
               'How well do all pupils achieve academically, especially the vulnerable?'
        UNION ALL SELECT 'character', 'Character Development', 'character-1',
               'How well does the school develop pupils'' character?'
        UNION ALL SELECT 'character', 'Character Development', 'character-2',
               'How effectively does the school instil hope and aspiration in all pupils?'
        UNION ALL SELECT 'character', 'Character Development', 'character-3',
               'How well do pupils engage in social action and courageous advocacy?'
        UNION ALL SELECT 'character', 'Character Development', 'character-4',
               'How well do pupils understand ethical concepts and make ethical choices?'
        UNION ALL SELECT 'community', 'Community and Living Well Together', 'community-1',
               'How well do relationships across the school community reflect the Christian vision?'
        UNION ALL SELECT 'community', 'Community and Living Well Together', 'community-2',
               'How effectively does the school support mental health and wellbeing?'
        UNION ALL SELECT 'community', 'Community and Living Well Together', 'community-3',
               'How strong are partnerships with parents, church, and community?'
        UNION ALL SELECT 'community', 'Community and Living Well Together', 'community-4',
               'How inclusive is the school community?'
        UNION ALL SELECT 'dignity', 'Dignity and Respect', 'dignity-1',
               'How well does the school ensure all are treated with dignity?'
        UNION ALL SELECT 'dignity', 'Dignity and Respect', 'dignity-2',
               'How effectively does the school tackle prejudice and discrimination?'
        UNION ALL SELECT 'dignity', 'Dignity and Respect', 'dignity-3',
               'How well do pupils understand and respect difference and diversity?'
        UNION ALL SELECT 'dignity', 'Dignity and Respect', 'dignity-4',
               'How well are protected characteristics respected and understood?'
        UNION ALL SELECT 'worship', 'Impact of Collective Worship', 'worship-1',
               'How central is collective worship to the life of the school?'
        UNION ALL SELECT 'worship', 'Impact of Collective Worship', 'worship-2',
               'How well does worship reflect the school''s Christian vision and Anglican/Methodist tradition?'
        UNION ALL SELECT 'worship', 'Impact of Collective Worship', 'worship-3',
               'How inclusive and invitational is collective worship?'
        UNION ALL SELECT 'worship', 'Impact of Collective Worship', 'worship-4',
               'How well do pupils engage with and respond to worship?'
        UNION ALL SELECT 'worship', 'Impact of Collective Worship', 'worship-5',
               'How effectively does worship contribute to spiritual development?'
        UNION ALL SELECT 're', 'Effectiveness of Religious Education', 're-1',
               'How well does RE reflect the Church of England Statement of Entitlement?'
        UNION ALL SELECT 're', 'Effectiveness of Religious Education', 're-2',
               'How high quality is RE teaching?'
        UNION ALL SELECT 're', 'Effectiveness of Religious Education', 're-3',
               'How well do pupils achieve in RE?'
        UNION ALL SELECT 're', 'Effectiveness of Religious Education', 're-4',
               'How well does RE prepare pupils to live in diverse society?'
        UNION ALL SELECT 're', 'Effectiveness of Religious Education', 're-5',
               'How effectively does RE enable pupils to engage with big questions?'
    )
    SELECT
        qd.strand_id,
        qd.strand_name,
        qd.question_id,
        qd.question_text,
        COALESCE(sa.evidence_count, 0) as evidence_count,
        sa.school_rating,
        sa.ai_rating,
        CASE
            WHEN sa.school_rating = 'excellent' THEN 100
            WHEN sa.school_rating = 'good' THEN 75
            WHEN sa.school_rating = 'requires_improvement' THEN 50
            WHEN sa.school_rating = 'ineffective' THEN 25
            WHEN sa.evidence_count > 0 THEN (LEAST(sa.evidence_count, 4) * 20)
            ELSE 0
        END as readiness_score
    FROM question_definitions qd
    LEFT JOIN siams_assessments sa ON sa.question_id = qd.question_id AND sa.organization_id = org_id
    ORDER BY qd.strand_id, qd.question_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overall SIAMS readiness
CREATE OR REPLACE FUNCTION calculate_siams_overall_readiness(org_id UUID)
RETURNS TABLE (
    overall_score INTEGER,
    overall_rating TEXT,
    strand_scores JSONB,
    total_evidence INTEGER,
    critical_gaps INTEGER
) AS $$
DECLARE
    total_score INTEGER;
    strand_data JSONB;
    evidence_total INTEGER;
    gaps_count INTEGER;
BEGIN
    -- Calculate strand scores
    SELECT jsonb_object_agg(
        strand_id,
        AVG(readiness_score)::INTEGER
    )
    INTO strand_data
    FROM get_siams_readiness(org_id);

    -- Calculate overall score
    SELECT AVG(value)::INTEGER
    INTO total_score
    FROM jsonb_each_text(strand_data);

    -- Count total evidence
    SELECT COALESCE(SUM(evidence_count), 0)
    INTO evidence_total
    FROM siams_assessments
    WHERE organization_id = org_id;

    -- Count critical gaps (no evidence and rating not excellent/good)
    SELECT COUNT(*)
    INTO gaps_count
    FROM get_siams_readiness(org_id)
    WHERE evidence_count = 0;

    RETURN QUERY SELECT
        COALESCE(total_score, 0),
        CASE
            WHEN COALESCE(total_score, 0) >= 85 THEN 'excellent'
            WHEN COALESCE(total_score, 0) >= 70 THEN 'good'
            WHEN COALESCE(total_score, 0) >= 50 THEN 'requires_improvement'
            ELSE 'ineffective'
        END,
        COALESCE(strand_data, '{}'::jsonb),
        evidence_total,
        gaps_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create SIAMS readiness snapshot
CREATE OR REPLACE FUNCTION create_siams_readiness_snapshot(org_id UUID)
RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
    readiness_data RECORD;
BEGIN
    -- Get readiness data
    SELECT * INTO readiness_data
    FROM calculate_siams_overall_readiness(org_id);

    -- Create snapshot
    INSERT INTO siams_readiness_snapshots (
        organization_id,
        overall_score,
        overall_rating,
        strand_scores,
        total_evidence,
        critical_gaps
    )
    VALUES (
        org_id,
        readiness_data.overall_score,
        readiness_data.overall_rating,
        readiness_data.strand_scores,
        readiness_data.total_evidence,
        readiness_data.critical_gaps
    )
    RETURNING id INTO snapshot_id;

    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get church school type for UI display
CREATE OR REPLACE FUNCTION get_church_school_display(org_id UUID)
RETURNS TABLE (
    is_church BOOLEAN,
    denomination TEXT,
    display_name TEXT,
    icon_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(scs.is_church_school, false) as is_church,
        scs.church_denomination,
        CASE scs.church_denomination
            WHEN 'church_of_england' THEN 'Church of England'
            WHEN 'roman_catholic' THEN 'Roman Catholic'
            WHEN 'methodist' THEN 'Methodist'
            WHEN 'other_christian' THEN 'Christian (Other)'
            ELSE 'Church School'
        END,
        CASE scs.church_denomination
            WHEN 'church_of_england' THEN 'church'
            WHEN 'roman_catholic' THEN 'cross'
            WHEN 'methodist' THEN 'church'
            ELSE 'place-of-worship'
        END
    FROM school_church_status scs
    WHERE scs.organization_id = org_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Ensure the update function exists (defined in governance_portal.sql but recreated here for independence)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for siams_assessments
CREATE TRIGGER update_siams_assessments_updated_at
    BEFORE UPDATE ON siams_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for school_church_status
CREATE TRIGGER update_school_church_status_updated_at
    BEFORE UPDATE ON school_church_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ACTIONS TABLE INTEGRATION
-- =====================================================

-- Add SIAMS framework type to actions if not exists
-- This allows actions to be linked to SIAMS strands/questions
DO $$
BEGIN
    -- Check if framework_type column has a check constraint, if so we need to modify it
    -- For now, assuming it's a text column
    ALTER TABLE actions
    ADD COLUMN IF NOT EXISTS siams_strand_id TEXT;
    ALTER TABLE actions
    ADD COLUMN IF NOT EXISTS siams_question_id TEXT;

    -- Add comment to document the new columns
    COMMENT ON COLUMN actions.siams_strand_id IS 'SIAMS strand reference (vision, wisdom, character, community, dignity, worship, re)';
    COMMENT ON COLUMN actions.siams_question_id IS 'SIAMS question reference (e.g., vision-1, wisdom-2)';
END $$;

-- =====================================================
-- 10. VIEWS FOR SIAMS REPORTING
-- =====================================================

-- View for SIAMS evidence summary by strand
CREATE OR REPLACE VIEW siams_strand_summary AS
SELECT
    sa.organization_id,
    sa.strand_id,
    COUNT(DISTINCT sa.question_id) as total_questions,
    COUNT(DISTINCT CASE WHEN sa.evidence_count > 0 THEN sa.question_id END) as questions_with_evidence,
    SUM(sa.evidence_count) as total_evidence,
    AVG(CASE
        WHEN sa.school_rating = 'excellent' THEN 100
        WHEN sa.school_rating = 'good' THEN 75
        WHEN sa.school_rating = 'requires_improvement' THEN 50
        WHEN sa.school_rating = 'ineffective' THEN 25
        ELSE 0
    END)::INTEGER as average_score,
    MAX(sa.updated_at) as last_updated
FROM siams_assessments sa
GROUP BY sa.organization_id, sa.strand_id;

-- View for SIAMS gaps analysis
CREATE OR REPLACE VIEW siams_gaps_analysis AS
SELECT
    sa.organization_id,
    sa.strand_id,
    sa.question_id,
    sa.evidence_count,
    sa.school_rating,
    sa.ai_rating,
    CASE
        WHEN sa.evidence_count = 0 THEN 'critical'
        WHEN sa.evidence_count < 3 THEN 'moderate'
        ELSE 'none'
    END as gap_level,
    CASE
        WHEN sa.school_rating IN ('ineffective', 'requires_improvement') THEN true
        ELSE false
    END as needs_attention
FROM siams_assessments sa
WHERE sa.evidence_count < 3 OR sa.school_rating IN ('ineffective', 'requires_improvement');

-- Grant necessary permissions (if needed for your Supabase setup)
-- These may need adjustment based on your auth setup
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated;
