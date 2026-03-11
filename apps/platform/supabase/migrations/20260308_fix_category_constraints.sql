-- =====================================================
-- Fix ofsted_assessments CHECK constraints
--
-- The original migration (20260128_ofsted_integration.sql) created
-- CHECK constraints using the LEGACY 4-category Ofsted framework IDs:
--   category_id: quality-of-education, behaviour-attitudes,
--                personal-development, leadership-management
--   subcategory_id: education-*, behaviour-*, development-*, leadership-*
--
-- The codebase actually uses the EIF 2025 framework with 6 categories:
--   inclusion, curriculum-teaching, achievement, attendance-behaviour,
--   personal-development, leadership-governance
-- and 20 subcategories defined in ofsted/types.ts.
--
-- This migration:
--   1. Maps any existing rows from old IDs to new IDs
--   2. Drops and recreates the CHECK constraints with correct values
--   3. Updates the readiness function for 20 subcategories
-- =====================================================

-- =====================================================
-- Step 1: Migrate existing data from old category IDs to new ones
-- =====================================================

-- Map old category_id values to new EIF 2025 values
UPDATE public.ofsted_assessments
SET category_id = 'curriculum-teaching'
WHERE category_id = 'quality-of-education';

UPDATE public.ofsted_assessments
SET category_id = 'attendance-behaviour'
WHERE category_id = 'behaviour-attitudes';

-- 'personal-development' stays the same (no change needed)

UPDATE public.ofsted_assessments
SET category_id = 'leadership-governance'
WHERE category_id = 'leadership-management';

-- Map old subcategory_id values to new EIF 2025 values
-- Old education-* subcategories -> new curriculum-teaching subcategories
UPDATE public.ofsted_assessments
SET subcategory_id = 'curriculum-intent'
WHERE subcategory_id = 'education-curriculum';

UPDATE public.ofsted_assessments
SET subcategory_id = 'curriculum-implementation'
WHERE subcategory_id = 'education-teaching';

UPDATE public.ofsted_assessments
SET subcategory_id = 'curriculum-reading'
WHERE subcategory_id = 'education-reading';

UPDATE public.ofsted_assessments
SET subcategory_id = 'achievement-outcomes'
WHERE subcategory_id = 'education-achievement';

-- Also update the category for achievement-outcomes (was under quality-of-education)
UPDATE public.ofsted_assessments
SET category_id = 'achievement'
WHERE subcategory_id = 'achievement-outcomes';

-- Old behaviour-* subcategories -> new attendance-behaviour subcategories
UPDATE public.ofsted_assessments
SET subcategory_id = 'attendance-overall'
WHERE subcategory_id = 'behaviour-attendance';

UPDATE public.ofsted_assessments
SET subcategory_id = 'behaviour-conduct'
WHERE subcategory_id = 'behaviour-conduct';
-- behaviour-conduct keeps the same ID

UPDATE public.ofsted_assessments
SET subcategory_id = 'behaviour-attitudes'
WHERE subcategory_id = 'behaviour-attitudes';
-- behaviour-attitudes keeps the same ID

-- Old development-* subcategories -> new pd-* subcategories
UPDATE public.ofsted_assessments
SET subcategory_id = 'pd-character'
WHERE subcategory_id = 'development-character';

UPDATE public.ofsted_assessments
SET subcategory_id = 'pd-citizenship'
WHERE subcategory_id = 'development-citizenship';

UPDATE public.ofsted_assessments
SET subcategory_id = 'pd-enrichment'
WHERE subcategory_id = 'development-enrichment';

UPDATE public.ofsted_assessments
SET subcategory_id = 'pd-rse'
WHERE subcategory_id = 'development-rse';

-- Old leadership-* subcategories stay mostly the same
-- leadership-vision, leadership-governance, leadership-staff already match
-- leadership-engagement already matches the new types.ts definition

-- =====================================================
-- Step 2: Also migrate ofsted_evidence_matches data (no CHECK but keep consistent)
-- =====================================================

UPDATE public.ofsted_evidence_matches
SET category_id = 'curriculum-teaching'
WHERE category_id = 'quality-of-education';

UPDATE public.ofsted_evidence_matches
SET category_id = 'attendance-behaviour'
WHERE category_id = 'behaviour-attitudes';

UPDATE public.ofsted_evidence_matches
SET category_id = 'leadership-governance'
WHERE category_id = 'leadership-management';

-- Subcategory mappings for evidence_matches
UPDATE public.ofsted_evidence_matches
SET subcategory_id = 'curriculum-intent'
WHERE subcategory_id = 'education-curriculum';

UPDATE public.ofsted_evidence_matches
SET subcategory_id = 'curriculum-implementation'
WHERE subcategory_id = 'education-teaching';

UPDATE public.ofsted_evidence_matches
SET subcategory_id = 'curriculum-reading'
WHERE subcategory_id = 'education-reading';

UPDATE public.ofsted_evidence_matches
SET subcategory_id = 'achievement-outcomes',
    category_id = 'achievement'
WHERE subcategory_id = 'education-achievement';

UPDATE public.ofsted_evidence_matches
SET subcategory_id = 'attendance-overall'
WHERE subcategory_id = 'behaviour-attendance';

UPDATE public.ofsted_evidence_matches
SET subcategory_id = 'pd-character'
WHERE subcategory_id = 'development-character';

UPDATE public.ofsted_evidence_matches
SET subcategory_id = 'pd-citizenship'
WHERE subcategory_id = 'development-citizenship';

UPDATE public.ofsted_evidence_matches
SET subcategory_id = 'pd-enrichment'
WHERE subcategory_id = 'development-enrichment';

UPDATE public.ofsted_evidence_matches
SET subcategory_id = 'pd-rse'
WHERE subcategory_id = 'development-rse';

-- =====================================================
-- Step 3: Drop old CHECK constraints and add new ones
-- =====================================================

-- Drop the old category_id CHECK constraint
-- PostgreSQL auto-names inline CHECK constraints as {table}_{column}_check
ALTER TABLE public.ofsted_assessments
    DROP CONSTRAINT IF EXISTS ofsted_assessments_category_id_check;

-- Drop the old subcategory_id CHECK constraint
ALTER TABLE public.ofsted_assessments
    DROP CONSTRAINT IF EXISTS ofsted_assessments_subcategory_id_check;

-- Add new category_id CHECK with EIF 2025 categories (6 judgement areas)
ALTER TABLE public.ofsted_assessments
    ADD CONSTRAINT ofsted_assessments_category_id_check
    CHECK (category_id IN (
        'inclusion',
        'curriculum-teaching',
        'achievement',
        'attendance-behaviour',
        'personal-development',
        'leadership-governance'
    ));

-- Add new subcategory_id CHECK with EIF 2025 subcategories (20 subcategories)
ALTER TABLE public.ofsted_assessments
    ADD CONSTRAINT ofsted_assessments_subcategory_id_check
    CHECK (subcategory_id IN (
        -- Inclusion (3)
        'inclusion-send',
        'inclusion-disadvantaged',
        'inclusion-mental-health',
        -- Curriculum and Teaching (3)
        'curriculum-intent',
        'curriculum-implementation',
        'curriculum-reading',
        -- Achievement (3)
        'achievement-outcomes',
        'achievement-progress',
        'achievement-destinations',
        -- Attendance and Behaviour (3)
        'attendance-overall',
        'behaviour-conduct',
        'behaviour-attitudes',
        -- Personal Development (4)
        'pd-character',
        'pd-citizenship',
        'pd-enrichment',
        'pd-rse',
        -- Leadership and Governance (4)
        'leadership-vision',
        'leadership-governance',
        'leadership-staff',
        'leadership-engagement'
    ));

-- =====================================================
-- Step 4: Update the readiness function for 20 subcategories
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_ofsted_readiness(p_org_id UUID)
RETURNS TABLE (
    overall_score INTEGER,
    overall_rating TEXT,
    category_scores JSONB,
    total_evidence INTEGER,
    critical_gaps INTEGER
) AS $$
DECLARE
    v_total_subcategories INTEGER := 20; -- Updated: 20 subcategories in EIF 2025
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
