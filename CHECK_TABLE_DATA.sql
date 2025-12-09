-- Check if dfe_data.schools actually has data
-- This will tell us if the problem is the table or the view

-- 1. Direct count from dfe_data.schools table
SELECT 
    'Direct table count:' as check_type,
    COUNT(*) as row_count
FROM dfe_data.schools;

-- 2. Try to see what columns exist in dfe_data.schools
SELECT 
    'Columns in dfe_data.schools:' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'dfe_data'
AND table_name = 'schools'
ORDER BY ordinal_position
LIMIT 10;

-- 3. Try to get a sample row (if any exist)
SELECT 
    'Sample row (if exists):' as check_type,
    *
FROM dfe_data.schools
LIMIT 1;

-- 4. Check permissions on dfe_data.schools
SELECT 
    'Table permissions:' as check_type,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'dfe_data'
AND table_name = 'schools';

-- 5. Check if there are any RLS (Row Level Security) policies blocking access
SELECT 
    'RLS policies:' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'dfe_data'
AND tablename = 'schools';

