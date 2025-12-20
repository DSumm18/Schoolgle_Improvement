-- Diagnostic: Find where these tables are
-- Run this in Supabase SQL Editor

-- 1. Check all schemas for these tables
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

-- 2. Check if they exist at all (any schema)
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

-- 3. List all tables in public schema to see what exists
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

