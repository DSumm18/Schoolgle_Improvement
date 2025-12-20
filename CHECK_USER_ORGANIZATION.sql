-- Check current user's organization membership
-- Run this in Supabase SQL Editor after signing in

-- First, let's see what organizations exist
SELECT 
  id,
  name,
  organization_type,
  parent_organization_id,
  created_at
FROM organizations
ORDER BY created_at DESC;

-- Check if there are any users
SELECT 
  id,
  email,
  display_name,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Check organization memberships
SELECT 
  om.id,
  om.user_id,
  u.email,
  om.organization_id,
  o.name as organization_name,
  om.role,
  om.created_at
FROM organization_members om
LEFT JOIN users u ON om.user_id = u.id
LEFT JOIN organizations o ON om.organization_id = o.id
ORDER BY om.created_at DESC;

