-- Complete fix for schools view
-- Run this entire script to fix the view

-- STEP 1: Check if dfe_data.schools has data
SELECT 
    'Step 1: Row count in dfe_data.schools' as step,
    COUNT(*) as row_count
FROM dfe_data.schools;

-- STEP 2: Show sample data to confirm table structure
SELECT 
    'Step 2: Sample data from dfe_data.schools' as step,
    urn,
    name,
    type_name,
    phase_name
FROM dfe_data.schools
LIMIT 3;

-- STEP 3: Drop the existing view (if it exists)
DROP VIEW IF EXISTS public.schools;

-- STEP 4: Create the view correctly
CREATE VIEW public.schools AS 
SELECT * FROM dfe_data.schools;

-- STEP 5: Grant permissions
GRANT SELECT ON public.schools TO service_role;
GRANT SELECT ON public.schools TO anon;

-- STEP 6: Verify the view definition
SELECT 
    'Step 6: New view definition' as step,
    definition
FROM pg_views
WHERE schemaname = 'public' 
AND viewname = 'schools';

-- STEP 7: Verify the view has data
SELECT 
    'Step 7: Row count in public.schools view' as step,
    COUNT(*) as row_count
FROM public.schools;

-- STEP 8: Sample data from the view
SELECT 
    'Step 8: Sample from public.schools view' as step,
    urn,
    name,
    type_name,
    phase_name
FROM public.schools
LIMIT 3;

