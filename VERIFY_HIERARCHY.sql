-- Verification queries for Phase 3 MAT Hierarchy migration
-- Run these in Supabase SQL Editor to confirm everything is set up correctly

-- 1. Check new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('parent_organization_id', 'organization_type', 'la_code', 'data_sharing_agreement')
ORDER BY column_name;

-- 2. Check constraints exist
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'organizations'::regclass
  AND conname IN ('no_self_reference', 'only_schools_have_parents');

-- 3. Check function exists
SELECT 
  proname as function_name,
  proargtypes::regtype[] as argument_types,
  prorettype::regtype as return_type
FROM pg_proc
WHERE proname IN ('get_accessible_orgs', 'get_user_accessible_orgs');

-- 4. Check tool definitions registered
SELECT 
  tool_key,
  tool_name,
  module_key,
  risk_level,
  requires_approval
FROM tool_definitions
WHERE tool_key IN ('create_organization', 'link_school_to_parent');

-- 5. Check RLS policies updated (sample)
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('organizations', 'students', 'actions', 'evidence_matches')
  AND policyname LIKE '%child organizations%'
ORDER BY tablename, policyname;

