-- Complete inspection of dfe_data schema
-- Run this in Supabase SQL Editor to see everything

-- 1. List all tables in dfe_data schema
SELECT 
    'Tables in dfe_data schema:' as info,
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'dfe_data' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'dfe_data'
ORDER BY table_name;

-- 2. Check if schools table has data
SELECT 
    'Schools table row count:' as info,
    COUNT(*) as total_rows
FROM dfe_data.schools;

-- 3. Sample school data
SELECT 
    'Sample schools:' as info,
    urn,
    name,
    type_name,
    phase_name,
    la_name
FROM dfe_data.schools
LIMIT 5;

-- 4. Check what views exist in public schema
SELECT 
    'Views in public schema:' as info,
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

