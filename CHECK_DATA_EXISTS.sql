-- Check if dfe_data.schools actually has data
-- Run this to see what's in the database

-- 1. Check row count in dfe_data.schools directly
SELECT 
    'Direct table count:' as check_type,
    COUNT(*) as row_count
FROM dfe_data.schools;

-- 2. Check if ANY tables in dfe_data have data
SELECT 
    'All dfe_data tables:' as check_type,
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

-- 3. Try to get a sample row from dfe_data.schools
SELECT 
    'Sample data:' as check_type,
    urn,
    name,
    type_name,
    phase_name
FROM dfe_data.schools
LIMIT 5;

-- 4. Check the view definition to see what it's pointing to
SELECT 
    'View definition:' as check_type,
    definition
FROM pg_views
WHERE schemaname = 'public' 
AND viewname = 'schools';

-- 5. Check if there are any other schemas with school data
SELECT 
    'Other schemas with school tables:' as check_type,
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_name LIKE '%school%'
ORDER BY table_schema, table_name;

