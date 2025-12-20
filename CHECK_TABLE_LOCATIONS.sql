-- Check where these tables actually are
-- Run this in Supabase SQL Editor

-- Check all schemas for these tables
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name IN (
  'ofsted_categories',
  'ofsted_subcategories',
  'evidence_requirements',
  'siams_strands',
  'siams_questions',
  'framework_updates'
)
ORDER BY table_schema, table_name;

-- Also check if RLS is enabled on any tables with these names
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN (
  'ofsted_categories',
  'ofsted_subcategories',
  'evidence_requirements',
  'siams_strands',
  'siams_questions',
  'framework_updates'
)
ORDER BY schemaname, tablename;

