-- Inspect DfE Schema Column Names
-- Run this BEFORE running 20240220_dfe_rpc_functions.sql
-- This will show you the actual column names so you can adjust the migration if needed

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

-- Sample data from school_history (only select columns that exist)
-- Run this separately if the above column inspection shows which columns exist
DO $$
BEGIN
    -- Try to get sample data, but handle missing columns gracefully
    RAISE NOTICE 'To see sample data, run a SELECT query manually after checking which columns exist above.';
END $$;

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

-- Sample data from school_profiles (headteacher info)
-- Only select columns that exist (check column list above first)
-- Example query (adjust based on actual columns):
-- SELECT urn, headteacher_name, headteacher_start_date
-- FROM dfe_data.school_profiles
-- WHERE headteacher_name IS NOT NULL
-- LIMIT 3;

-- Sample data from school_profiles (performance data)
-- Only select columns that exist (check column list above first)
-- Example query (adjust based on actual columns):
-- SELECT urn, academic_year, ks2_progress_score, ks4_progress_8_score
-- FROM dfe_data.school_profiles
-- WHERE urn IS NOT NULL
-- LIMIT 3;

-- ============================================================================
-- 3. Inspect schools table columns (if it has inspection/headteacher data)
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

