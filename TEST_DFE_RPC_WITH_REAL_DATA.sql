-- Test DfE RPC Functions with Real Data
-- Uses URN 100000 (The Aldgate School from your sample)

-- ============================================================================
-- TEST 1: get_last_inspection (should return real data)
-- ============================================================================
SELECT 
  'Last Inspection for URN 100000:' as test_name,
  get_last_inspection('100000') as result;

-- Expected: Should show date: 2024-07-11, rating: Outstanding

-- ============================================================================
-- TEST 2: get_headteacher_info
-- ============================================================================
SELECT 
  'Headteacher Info for URN 100000:' as test_name,
  get_headteacher_info('100000') as result;

-- ============================================================================
-- TEST 3: get_performance_trends
-- ============================================================================
SELECT 
  'Performance Trends for URN 100000:' as test_name,
  get_performance_trends('100000') as result;

-- Expected: Should show latest_p8_score and latest_att8_score if available

-- ============================================================================
-- TEST 4: Full Risk Profile Data (what the dashboard will use)
-- ============================================================================
SELECT 
  'Full Risk Profile Data:' as test_name,
  json_build_object(
    'urn', '100000',
    'schoolName', (SELECT name FROM dfe_data.school_profiles WHERE urn = 100000 LIMIT 1),
    'inspection', get_last_inspection('100000'),
    'headteacher', get_headteacher_info('100000'),
    'performance', get_performance_trends('100000')
  ) as risk_profile_data;

-- ============================================================================
-- VERIFY: Check what data actually exists for this URN
-- ============================================================================
-- Only select columns that exist (headteacher columns may not exist)
SELECT 
  'Raw data from school_profiles:' as info,
  urn,
  name,
  latest_ofsted_date,
  latest_ofsted_rating,
  latest_p8_score,
  latest_att8_score
FROM dfe_data.school_profiles
WHERE urn = 100000;

-- Check if headteacher columns exist in school_profiles
SELECT 
  'Headteacher columns in school_profiles:' as check_type,
  column_name
FROM information_schema.columns
WHERE table_schema = 'dfe_data'
  AND table_name = 'school_profiles'
  AND (
    column_name ILIKE '%headteacher%'
    OR column_name ILIKE '%head%'
    OR column_name ILIKE '%principal%'
  );

