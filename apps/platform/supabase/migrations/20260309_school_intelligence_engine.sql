-- School Intelligence Engine
-- Applied via Supabase MCP on 2026-03-09
-- Tables: school_cohorts, school_contextual_factors, school_cohort_outcomes, school_intelligence_analyses
-- See: apps/platform/src/lib/school-intelligence-engine.ts

-- This migration was applied directly to production via Supabase MCP.
-- The full SQL is tracked here for reference.

-- Tables created:
-- 1. school_cohorts - Track year groups through their school journey
-- 2. school_contextual_factors - Events that impact outcomes (staff absence, curriculum changes, interventions, etc.)
-- 3. school_cohort_outcomes - Assessment data snapshots per cohort per term
-- 4. school_intelligence_analyses - AI-generated cross-module intelligence analyses

-- All tables have RLS enabled with service_role and org-based authenticated policies.
-- See the apply_migration call in session transcript for full DDL.
