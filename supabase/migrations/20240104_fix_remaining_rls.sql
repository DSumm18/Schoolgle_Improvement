-- Migration: Fix Remaining RLS Issues
-- Date: 2025-01-26
-- Purpose: Enable RLS on framework/reference tables that were missed
-- 
-- These are reference/lookup tables (not tenant-scoped), but still need RLS
-- for security best practices.

-- ============================================================================
-- ENABLE RLS ON REFERENCE TABLES
-- ============================================================================

-- These tables don't have organization_id (they're reference data)
-- But we still enable RLS for security best practices
-- Only enable RLS if tables exist

do $$
begin
  -- ofsted_categories
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ofsted_categories') then
    alter table ofsted_categories enable row level security;
  end if;
  
  -- ofsted_subcategories
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ofsted_subcategories') then
    alter table ofsted_subcategories enable row level security;
  end if;
  
  -- evidence_requirements
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'evidence_requirements') then
    alter table evidence_requirements enable row level security;
  end if;
  
  -- siams_strands
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'siams_strands') then
    alter table siams_strands enable row level security;
  end if;
  
  -- siams_questions
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'siams_questions') then
    alter table siams_questions enable row level security;
  end if;
  
  -- framework_updates
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'framework_updates') then
    alter table framework_updates enable row level security;
  end if;
end $$;

-- ============================================================================
-- RLS POLICIES FOR REFERENCE TABLES
-- ============================================================================

-- These are reference/lookup tables - everyone can read them
-- But only service role can modify them
-- Only create policies if tables exist

do $$
begin
  -- Ofsted Categories (reference data - read-only for users)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ofsted_categories') then
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ofsted_categories' and policyname = 'Everyone can view ofsted_categories') then
      execute 'create policy "Everyone can view ofsted_categories" on ofsted_categories for select using (true)';
    end if;
  end if;
  
  -- Ofsted Subcategories (reference data - read-only for users)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ofsted_subcategories') then
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ofsted_subcategories' and policyname = 'Everyone can view ofsted_subcategories') then
      execute 'create policy "Everyone can view ofsted_subcategories" on ofsted_subcategories for select using (true)';
    end if;
  end if;
  
  -- Evidence Requirements (reference data - read-only for users)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'evidence_requirements') then
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'evidence_requirements' and policyname = 'Everyone can view evidence_requirements') then
      execute 'create policy "Everyone can view evidence_requirements" on evidence_requirements for select using (true)';
    end if;
  end if;
  
  -- SIAMS Strands (reference data - read-only for users)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'siams_strands') then
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'siams_strands' and policyname = 'Everyone can view siams_strands') then
      execute 'create policy "Everyone can view siams_strands" on siams_strands for select using (true)';
    end if;
  end if;
  
  -- SIAMS Questions (reference data - read-only for users)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'siams_questions') then
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'siams_questions' and policyname = 'Everyone can view siams_questions') then
      execute 'create policy "Everyone can view siams_questions" on siams_questions for select using (true)';
    end if;
  end if;
  
  -- Framework Updates (reference data - read-only for users)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'framework_updates') then
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'framework_updates' and policyname = 'Everyone can view framework_updates') then
      execute 'create policy "Everyone can view framework_updates" on framework_updates for select using (true)';
    end if;
  end if;
end $$;

-- ============================================================================
-- SECURITY DEFINER VIEWS - DOCUMENTED AS ACCEPTABLE
-- ============================================================================

-- These views use SECURITY DEFINER:
-- - ks4_results, exclusions, ks2_results, schools, workforce, 
--   ks1_results, census, attendance
--
-- **STATUS: ACCEPTABLE** - These are DfE (Department for Education) public
-- reference data that has been imported to support the application.
--
-- Rationale:
-- 1. Public data - No sensitive/tenant-specific information
-- 2. Reference data - Used for trends, patterns, and school comparisons
-- 3. Read-only - Views are used for querying, not data modification
-- 4. Performance - SECURITY DEFINER may be needed for efficient access
--
-- These views are safe to keep as SECURITY DEFINER because:
-- - They don't expose tenant-specific data
-- - They're public reference data from DfE
-- - They support application features (monitoring, trends, patterns)
--
-- Optional future improvement: Move to separate schema (e.g., 'dfe_data')
-- for better organization, but not required for security.

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running this migration, verify RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN (
--     'ofsted_categories',
--     'ofsted_subcategories',
--     'evidence_requirements',
--     'siams_strands',
--     'siams_questions',
--     'framework_updates'
--   );
-- All should show rowsecurity = true

