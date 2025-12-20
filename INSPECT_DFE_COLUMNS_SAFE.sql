-- Safe DfE Schema Inspection (No Column Errors)
-- Run this to see column names without trying to select non-existent columns

-- ============================================================================
-- 1. Inspect school_history table columns
-- ============================================================================
SELECT 
    'school_history columns:' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'dfe_data'
  AND table_name = 'school_history'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. Inspect school_profiles table columns
-- ============================================================================
SELECT 
    'school_profiles columns:' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'dfe_data'
  AND table_name = 'school_profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. Inspect schools table columns (inspection/headteacher related)
-- ============================================================================
SELECT 
    'schools table columns (inspection/headteacher related):' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'dfe_data'
  AND table_name = 'schools'
  AND (
    column_name ILIKE '%inspection%'
    OR column_name ILIKE '%headteacher%'
    OR column_name ILIKE '%head%'
    OR column_name ILIKE '%principal%'
  )
ORDER BY ordinal_position;

-- ============================================================================
-- 4. Check if ofsted_inspections table exists
-- ============================================================================
SELECT 
    'ofsted_inspections table exists:' as check_type,
    EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'dfe_data'
          AND table_name = 'ofsted_inspections'
    ) as exists;

-- If it exists, show columns
SELECT 
    'ofsted_inspections columns:' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'dfe_data'
  AND table_name = 'ofsted_inspections'
ORDER BY ordinal_position;

-- ============================================================================
-- 5. Check for performance/KS results tables
-- ============================================================================
SELECT 
    'Performance tables in dfe_data:' as info,
    table_name
FROM information_schema.tables
WHERE table_schema = 'dfe_data'
  AND (
    table_name ILIKE '%performance%'
    OR table_name ILIKE '%ks2%'
    OR table_name ILIKE '%ks4%'
    OR table_name ILIKE '%results%'
  )
ORDER BY table_name;

-- ============================================================================
-- 6. Get a sample row from school_history (all columns)
-- ============================================================================
-- This will show you what columns actually have data
SELECT 
    'school_history sample (first row):' as info,
    *
FROM dfe_data.school_history
LIMIT 1;

-- ============================================================================
-- 7. Get a sample row from school_profiles (all columns)
-- ============================================================================
SELECT 
    'school_profiles sample (first row):' as info,
    *
FROM dfe_data.school_profiles
LIMIT 1;

