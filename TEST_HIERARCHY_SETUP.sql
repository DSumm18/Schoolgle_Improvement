-- Test Script: Create Aurora Multi-Academy Trust Hierarchy
-- Run this in Supabase SQL Editor to test the Phase 3 implementation

-- ============================================================================
-- STEP 1: Create Aurora Multi-Academy Trust
-- ============================================================================

INSERT INTO organizations (
  name,
  organization_type,
  parent_organization_id,
  la_code,
  data_sharing_agreement
) VALUES (
  'Aurora Multi-Academy Trust',
  'trust',
  NULL,  -- Trusts don't have parents
  NULL,  -- No LA code for Trusts
  false
) RETURNING id, name, organization_type, parent_organization_id;

-- Save the Trust ID (you'll need to copy this for the next step)
-- Example: Let's assume it returns: 123e4567-e89b-12d3-a456-426614174000

-- ============================================================================
-- STEP 2: Create Aurora Primary School
-- ============================================================================

-- Replace '<TRUST_ID>' with the actual ID from Step 1
INSERT INTO organizations (
  name,
  organization_type,
  parent_organization_id,
  la_code,
  urn,
  data_sharing_agreement
) VALUES (
  'Aurora Primary',
  'school',
  (SELECT id FROM organizations WHERE name = 'Aurora Multi-Academy Trust' LIMIT 1),  -- Link to Trust
  NULL,  -- Optional: Add LA code if needed
  NULL,  -- Optional: Add URN if available
  false
) RETURNING id, name, organization_type, parent_organization_id;

-- ============================================================================
-- STEP 3: Verify the Hierarchy
-- ============================================================================

-- Show the complete hierarchy
SELECT 
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  p.name as parent_name,
  p.organization_type as parent_type,
  CASE 
    WHEN o.parent_organization_id IS NOT NULL THEN 'Child'
    ELSE 'Root'
  END as hierarchy_level
FROM organizations o
LEFT JOIN organizations p ON o.parent_organization_id = p.id
WHERE o.name IN ('Aurora Multi-Academy Trust', 'Aurora Primary')
ORDER BY 
  CASE WHEN o.parent_organization_id IS NULL THEN 0 ELSE 1 END,
  o.name;

-- ============================================================================
-- STEP 4: Verify Constraints Work
-- ============================================================================

-- This should FAIL (Trust cannot have a parent)
-- Uncomment to test:
/*
INSERT INTO organizations (
  name,
  organization_type,
  parent_organization_id
) VALUES (
  'Invalid Trust',
  'trust',
  (SELECT id FROM organizations WHERE name = 'Aurora Multi-Academy Trust' LIMIT 1)
);
*/

-- This should FAIL (Self-reference not allowed)
-- Uncomment to test:
/*
UPDATE organizations 
SET parent_organization_id = id 
WHERE name = 'Aurora Primary';
*/

-- ============================================================================
-- CLEANUP (Optional - uncomment to remove test data)
-- ============================================================================

/*
DELETE FROM organizations 
WHERE name IN ('Aurora Primary', 'Aurora Multi-Academy Trust');
*/

