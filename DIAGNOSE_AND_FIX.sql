-- Diagnostic and fix SQL for dfe_data schema
-- Run this in Supabase SQL Editor to diagnose and fix issues

-- STEP 1: Check what tables actually exist in dfe_data
SELECT 
    'Tables in dfe_data:' as check_type,
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

-- STEP 2: Check if dfe_data.schools has data
SELECT 
    'Schools data check:' as check_type,
    COUNT(*) as row_count
FROM dfe_data.schools;

-- STEP 3: Check what the public.schools view is pointing to
SELECT 
    'View definition:' as check_type,
    definition
FROM pg_views
WHERE schemaname = 'public' 
AND viewname = 'schools';

-- STEP 4: Sample data from dfe_data.schools (if it exists)
SELECT 
    'Sample from dfe_data.schools:' as check_type,
    urn,
    name,
    type_name,
    phase_name
FROM dfe_data.schools
LIMIT 5;

-- STEP 5: Recreate the schools view (run this if dfe_data.schools has data)
-- Uncomment and run if dfe_data.schools has rows:

-- DROP VIEW IF EXISTS public.schools;
-- CREATE VIEW public.schools AS SELECT * FROM dfe_data.schools;
-- GRANT SELECT ON public.schools TO service_role;
-- GRANT SELECT ON public.schools TO anon;

-- STEP 6: Verify the view works
SELECT COUNT(*) as view_row_count FROM public.schools;

