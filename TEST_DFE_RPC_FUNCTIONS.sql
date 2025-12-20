-- Test the DfE RPC Functions
-- Run this after 20240220_dfe_rpc_functions.sql to verify they work

-- ============================================================================
-- TEST 1: get_last_inspection
-- ============================================================================
-- Test with a known URN (use the URN from your sample data: 100000)
SELECT 
  'Test get_last_inspection:' as test_name,
  get_last_inspection('100000') as result;

-- ============================================================================
-- TEST 2: get_headteacher_info
-- ============================================================================
SELECT 
  'Test get_headteacher_info:' as test_name,
  get_headteacher_info('100000') as result;

-- ============================================================================
-- TEST 3: get_performance_trends
-- ============================================================================
SELECT 
  'Test get_performance_trends:' as test_name,
  get_performance_trends('100000') as result;

-- ============================================================================
-- TEST 4: Combined Test (what the risk tool will call)
-- ============================================================================
SELECT 
  'Combined test for URN 100000:' as test_name,
  json_build_object(
    'inspection', get_last_inspection('100000'),
    'headteacher', get_headteacher_info('100000'),
    'performance', get_performance_trends('100000')
  ) as combined_result;

-- ============================================================================
-- TEST 5: Test with non-existent URN (should return nulls gracefully)
-- ============================================================================
SELECT 
  'Test with invalid URN:' as test_name,
  json_build_object(
    'inspection', get_last_inspection('999999'),
    'headteacher', get_headteacher_info('999999'),
    'performance', get_performance_trends('999999')
  ) as result;

