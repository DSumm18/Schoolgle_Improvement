--
-- Query to check organizations and school setup
-- This helps debug the school selector dropdown issue

SELECT
  id,
  name,
  slug,
  type,
  created_at,
  (SELECT COUNT(*) FROM organization_members WHERE organization_id = organizations.id) as member_count
FROM organizations
ORDER BY created_at DESC
LIMIT 20;

-- Check for Grove House specifically
SELECT * FROM organizations WHERE name ILIKE '%grove%' OR name ILIKE '%house%';

-- Check onboarding leads
SELECT
  id,
  school_name,
  urn,
  status,
  created_at
FROM onboarding_leads
ORDER BY created_at DESC
LIMIT 10;

-- Check organization_members to see which orgs you're part of
SELECT
  om.id,
  om.organization_id,
  o.name as organization_name,
  om.user_id,
  om.role,
  om.is_primary
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = 'YOUR_USER_ID'  -- Replace with actual user ID from auth
ORDER BY om.is_primary DESC, o.name;
