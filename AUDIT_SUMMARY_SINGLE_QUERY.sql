-- ============================================================================
-- SUMMARY REPORT - Single Query (Copy and Run This)
-- ============================================================================
-- This is a single, standalone query that combines all summary metrics
-- Copy the entire query below and run it in Supabase SQL Editor

SELECT 
  'Total Organizations' as metric,
  COUNT(*)::text as value
FROM organizations

UNION ALL

SELECT 
  'Organizations with URN' as metric,
  COUNT(urn)::text as value
FROM organizations

UNION ALL

SELECT 
  'Organizations with Local Authority' as metric,
  COUNT(local_authority)::text as value
FROM organizations

UNION ALL

SELECT 
  'Total Actions' as metric,
  COUNT(*)::text as value
FROM actions

UNION ALL

SELECT 
  'Organizations with Actions' as metric,
  COUNT(DISTINCT organization_id)::text as value
FROM actions

UNION ALL

SELECT 
  'Total Organization Members' as metric,
  COUNT(*)::text as value
FROM organization_members;

