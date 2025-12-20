-- Add current user to Aurora Primary School
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table
-- Or use this to find your user ID first:

-- Step 1: Find your user ID (run this first to get your ID)
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Find Aurora Primary's organization ID
SELECT 
  id,
  name,
  organization_type
FROM organizations
WHERE name ILIKE '%aurora%'
ORDER BY created_at DESC;

-- Step 3: Add yourself to Aurora Primary (replace USER_ID and ORG_ID)
-- Example (uncomment and fill in):
/*
INSERT INTO organization_members (
  user_id,
  organization_id,
  role,
  created_at
) VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with your user ID from Step 1
  'AURORA_ORG_ID_HERE', -- Replace with Aurora Primary's ID from Step 2
  'admin',              -- or 'slt', 'teacher', 'viewer'
  NOW()
)
ON CONFLICT (user_id, organization_id) DO NOTHING;
*/

