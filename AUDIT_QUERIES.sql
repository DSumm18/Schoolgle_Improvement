-- ============================================================================
-- PRE-MIGRATION AUDIT QUERIES
-- Phase 3 Hierarchy: Parent/Child Organizations
-- ============================================================================
-- Run these queries in Supabase SQL Editor BEFORE migration
-- Document the results in your migration plan

-- ============================================================================
-- AUDIT 1: Total Row Count
-- ============================================================================
SELECT COUNT(*) as total_organizations
FROM organizations;

-- Expected: If 0 = No risk, if >0 = Need backfilling strategy

-- ============================================================================
-- AUDIT 2: URN Data Population
-- ============================================================================
SELECT 
  COUNT(*) as total,
  COUNT(urn) as with_urn,
  COUNT(*) - COUNT(urn) as without_urn,
  ROUND(COUNT(urn)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as urn_population_percent
FROM organizations;

-- Expected: High URN population (>80%) = Good for MAT/LA identification
-- Low URN population (<50%) = May need manual mapping

-- ============================================================================
-- AUDIT 3: Duplicate URN Check
-- ============================================================================
SELECT urn, COUNT(*) as count
FROM organizations
WHERE urn IS NOT NULL
GROUP BY urn
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Expected: If duplicates found = HIGH RISK (need deduplication)
-- If no rows returned = LOW RISK (safe to proceed)

-- ============================================================================
-- AUDIT 4: Local Authority Data Population
-- ============================================================================
SELECT 
  COUNT(*) as total,
  COUNT(local_authority) as with_la,
  COUNT(DISTINCT local_authority) as unique_las
FROM organizations;

-- Top 10 LAs by organization count
SELECT 
  local_authority,
  COUNT(*) as orgs_per_la
FROM organizations
WHERE local_authority IS NOT NULL
GROUP BY local_authority
ORDER BY orgs_per_la DESC
LIMIT 10;

-- Expected: High LA population = Can use for initial MAT/LA grouping
-- Low LA population = May need external data source

-- ============================================================================
-- AUDIT 5: Actions Table Dependency Check
-- ============================================================================
SELECT 
  COUNT(*) as total_actions,
  COUNT(DISTINCT organization_id) as unique_orgs_with_actions,
  MIN(created_at) as oldest_action,
  MAX(created_at) as newest_action
FROM actions;

-- Actions per organization (top 10)
SELECT 
  o.name,
  o.id,
  COUNT(a.id) as action_count
FROM organizations o
LEFT JOIN actions a ON a.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY action_count DESC
LIMIT 10;

-- Expected: High action count = CRITICAL (must ensure RLS maintains access)
-- Low action count = Lower risk, but still critical

-- ============================================================================
-- AUDIT 6: Organization Members Check
-- ============================================================================
SELECT 
  COUNT(DISTINCT organization_id) as orgs_with_members,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_memberships
FROM organization_members;

-- Organizations with most members
SELECT 
  o.name,
  o.id,
  COUNT(om.user_id) as member_count
FROM organizations o
LEFT JOIN organization_members om ON om.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY member_count DESC
LIMIT 10;

-- Expected: High membership = Critical to maintain access
-- Multi-org users = Need to test recursive policies carefully

-- ============================================================================
-- AUDIT 7: Data Quality Check
-- ============================================================================
-- Check for organizations with missing critical data
SELECT 
  'Missing URN' as issue,
  COUNT(*) as count
FROM organizations
WHERE urn IS NULL

UNION ALL

SELECT 
  'Missing Local Authority' as issue,
  COUNT(*) as count
FROM organizations
WHERE local_authority IS NULL

UNION ALL

SELECT 
  'Missing School Type' as issue,
  COUNT(*) as count
FROM organizations
WHERE school_type IS NULL;

-- ============================================================================
-- SUMMARY REPORT (Run this last - Single Query)
-- ============================================================================
-- This query combines all summary metrics into one result set
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

