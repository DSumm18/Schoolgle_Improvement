-- Connect Current User to Aurora Primary School
-- Run this in Supabase SQL Editor after signing in
-- This will find your user ID and add you to Aurora Primary

-- Step 1: Find your user ID from auth.users (most recent)
DO $$
DECLARE
  v_user_id uuid;
  v_aurora_school_id uuid;
BEGIN
  -- Get the most recent user (you, if you just signed in)
  SELECT id INTO v_user_id
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Find Aurora Primary School
  SELECT id INTO v_aurora_school_id
  FROM organizations
  WHERE name = 'Aurora Primary'
    AND organization_type = 'school'
  LIMIT 1;
  
  -- If Aurora Primary doesn't exist, create it (and the trust)
  IF v_aurora_school_id IS NULL THEN
    -- Create Trust first
    INSERT INTO organizations (name, organization_type, parent_organization_id, data_sharing_agreement)
    VALUES ('Aurora Multi-Academy Trust', 'trust', NULL, false)
    RETURNING id INTO v_aurora_school_id;
    
    -- Create School linked to Trust
    INSERT INTO organizations (name, organization_type, parent_organization_id, data_sharing_agreement)
    VALUES ('Aurora Primary', 'school', v_aurora_school_id, false)
    RETURNING id INTO v_aurora_school_id;
  END IF;
  
  -- Add user to Aurora Primary as admin
  INSERT INTO organization_members (
    user_id,
    organization_id,
    role,
    created_at
  ) VALUES (
    v_user_id,
    v_aurora_school_id,
    'admin',
    NOW()
  )
  ON CONFLICT (user_id, organization_id) 
  DO UPDATE SET role = 'admin';
  
  -- Show result
  RAISE NOTICE '✅ User % added to Aurora Primary (ID: %)', v_user_id, v_aurora_school_id;
END $$;

-- Verification: Show your current memberships
SELECT 
  '📊 YOUR ORGANIZATIONS' as report,
  o.id,
  o.name,
  o.organization_type,
  om.role,
  CASE 
    WHEN o.parent_organization_id IS NOT NULL 
    THEN (SELECT name FROM organizations WHERE id = o.parent_organization_id)
    ELSE NULL
  END as parent_organization
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
JOIN auth.users u ON om.user_id = u.id
WHERE u.id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
ORDER BY om.created_at DESC;

