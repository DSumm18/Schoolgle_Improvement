-- Single-Step Script: Create Aurora Trust Hierarchy
-- Run this in Supabase SQL Editor

-- Create Trust and School in one transaction
WITH trust_created AS (
  INSERT INTO organizations (
    name,
    organization_type,
    parent_organization_id,
    data_sharing_agreement
  ) VALUES (
    'Aurora Multi-Academy Trust',
    'trust',
    NULL,
    false
  ) RETURNING id as trust_id, name as trust_name
),
school_created AS (
  INSERT INTO organizations (
    name,
    organization_type,
    parent_organization_id,
    data_sharing_agreement
  ) 
  SELECT 
    'Aurora Primary',
    'school',
    trust_id,
    false
  FROM trust_created
  RETURNING id as school_id, name as school_name, parent_organization_id
)
SELECT 
  '✅ Trust Created' as status,
  trust_id as id,
  trust_name as name,
  'trust' as type,
  NULL::uuid as parent_id
FROM trust_created
UNION ALL
SELECT 
  '✅ School Created' as status,
  school_id,
  school_name,
  'school' as type,
  parent_organization_id
FROM school_created;

-- Verification: Show the complete hierarchy
SELECT 
  '📊 HIERARCHY VERIFICATION' as report,
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  p.name as parent_name,
  CASE 
    WHEN o.parent_organization_id IS NOT NULL THEN '✅ Linked to ' || p.name
    ELSE '✅ Root Organization'
  END as relationship
FROM organizations o
LEFT JOIN organizations p ON o.parent_organization_id = p.id
WHERE o.name IN ('Aurora Multi-Academy Trust', 'Aurora Primary')
ORDER BY 
  CASE WHEN o.parent_organization_id IS NULL THEN 0 ELSE 1 END,
  o.name;

