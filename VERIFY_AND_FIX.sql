-- Verify data exists and fix the view
-- Run this to check row counts and fix the view if needed

-- 1. Check row count in dfe_data.schools directly
SELECT 
    'Row count in dfe_data.schools:' as check_type,
    COUNT(*) as row_count
FROM dfe_data.schools;

-- 2. Check row count in other tables
SELECT 
    'Row count in dfe_data.school_profiles:' as check_type,
    COUNT(*) as row_count
FROM dfe_data.school_profiles;

SELECT 
    'Row count in dfe_data.school_history:' as check_type,
    COUNT(*) as row_count
FROM dfe_data.school_history;

-- 3. Sample data from dfe_data.schools
SELECT 
    'Sample from dfe_data.schools:' as check_type,
    urn,
    name,
    type_name,
    phase_name
FROM dfe_data.schools
LIMIT 5;

-- 4. Check the current view definition
SELECT 
    'Current view definition:' as check_type,
    definition
FROM pg_views
WHERE schemaname = 'public' 
AND viewname = 'schools';

-- 5. Recreate the view (run this AFTER confirming dfe_data.schools has data)
-- Uncomment the lines below once you confirm dfe_data.schools has rows:

-- DROP VIEW IF EXISTS public.schools;
-- CREATE VIEW public.schools AS SELECT * FROM dfe_data.schools;
-- GRANT SELECT ON public.schools TO service_role;
-- GRANT SELECT ON public.schools TO anon;

-- 6. Verify the view after recreation
-- SELECT COUNT(*) as view_row_count FROM public.schools;

