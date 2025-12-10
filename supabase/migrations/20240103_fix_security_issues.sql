-- Migration: Fix Security Issues
-- Date: 2025-01-26
-- Purpose: Fix security warnings from Supabase dashboard
-- 
-- Issues to fix:
-- 1. Functions with mutable search_path
-- 2. Extension 'vector' in public schema (if applicable)

-- ============================================================================
-- FIX 1: Functions with mutable search_path
-- ============================================================================

-- The security warning occurs because functions don't have explicit search_path
-- We need to set search_path = '' (empty) to prevent search_path injection attacks

-- Fix is_organization_member function
create or replace function is_organization_member(
  org_id uuid
) returns boolean
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
declare
  user_id_val uuid;
  org_id_from_jwt text;
begin
  -- Get user ID from auth context
  user_id_val := auth.uid();
  
  -- Get organization_id from JWT claims
  begin
    org_id_from_jwt := current_setting('request.jwt.claims', true)::json->>'organization_id';
  exception
    when others then
      org_id_from_jwt := null;
  end;
  
  -- If organization_id in JWT matches, verify membership
  if org_id_from_jwt is not null and org_id_from_jwt::uuid = org_id then
    return exists (
      select 1
      from public.organization_members
      where user_id = user_id_val::text
        and organization_id = org_id
    );
  end if;
  
  -- Fallback: Check if user is member of this organization
  return exists (
    select 1
    from public.organization_members
    where user_id = user_id_val::text
      and organization_id = org_id
  );
end;
$$;

-- Fix get_user_organization_ids function
create or replace function get_user_organization_ids() returns uuid[]
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
declare
  user_id_val uuid;
begin
  user_id_val := auth.uid();
  
  return array(
    select organization_id
    from public.organization_members
    where user_id = user_id_val::text
  );
end;
$$;

-- Fix organization_has_module function (from entitlements migration)
-- Uses module_id directly (since modules.id is the identifier)
-- Only create if organization_modules table exists
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'organization_modules'
  ) then
    execute '
      create or replace function organization_has_module(
        org_id uuid,
        module_key_param text
      ) returns boolean
      language sql
      security definer
      stable
      set search_path = ''''
      as $func$
        select exists (
          select 1
          from public.organization_modules om
          where om.organization_id = org_id
            and om.module_id = module_key_param
            and om.enabled = true
            and (om.expires_at is null or om.expires_at > now())
        );
      $func$';
  end if;
end $$;

-- Fix get_available_tools function (from entitlements migration)
-- Uses module_id directly (since modules.id is the identifier)
-- Only create if tool_definitions table exists
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'tool_definitions'
  ) then
    execute '
      create or replace function get_available_tools(
        org_id uuid
      ) returns table (
        tool_key text,
        tool_name text,
        description text,
        module_key text,
        risk_level text,
        requires_approval boolean
      )
      language sql
      security definer
      stable
      set search_path = ''''
      as $func$
        select
          td.tool_key,
          td.tool_name,
          td.description,
          td.module_key,
          td.risk_level,
          td.requires_approval
        from public.tool_definitions td
        where td.is_active = true
          and (
            -- Core module is always available
            td.module_key = ''core''
            or
            -- Check if organization has purchased the module
            -- Use module_id directly since modules.id is the identifier
            exists (
              select 1
              from public.organization_modules om
              where om.organization_id = org_id
                and om.module_id = td.module_key
                and om.enabled = true
                and (om.expires_at is null or om.expires_at > now())
            )
          )
        order by td.tool_name;
      $func$';
  end if;
end $$;

-- ============================================================================
-- FIX 2: Check for other functions with mutable search_path
-- ============================================================================

-- If you have other functions (like match_documents), fix them too
-- Example pattern:
-- 
-- create or replace function your_function_name(...)
-- returns ...
-- language plpgsql
-- security definer
-- set search_path = ''  -- Add this line
-- as $$ ... $$;

-- ============================================================================
-- FIX 3: Extension 'vector' in public schema
-- ============================================================================

-- Note: Moving the vector extension requires careful consideration
-- If you're using pgvector for embeddings, you may need to keep it in public
-- However, Supabase recommends moving it to a separate schema

-- Option A: Move vector extension to extensions schema (if safe to do)
-- WARNING: This may break existing vector columns. Test first!
-- 
-- create schema if not exists extensions;
-- alter extension vector set schema extensions;

-- Option B: Keep vector in public but acknowledge the warning
-- This is acceptable if you're actively using vector columns
-- The warning is informational, not critical

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running this migration, check that functions are fixed:
-- SELECT 
--   routine_name,
--   routine_schema,
--   security_type,
--   (SELECT setting FROM pg_settings WHERE name = 'search_path') as current_search_path
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN (
--     'is_organization_member',
--     'get_user_organization_ids',
--     'organization_has_module',
--     'get_available_tools'
--   );

-- ============================================================================
-- NOTES
-- ============================================================================

-- The "mutable search_path" warning occurs when functions don't explicitly
-- set search_path. This can be a security risk because an attacker could
-- manipulate the search_path to execute malicious code.
--
-- By setting `set search_path = ''`, we force PostgreSQL to use fully
-- qualified names (schema.table) which prevents this attack vector.
--
-- We use `public.` prefix for all table references to ensure they work
-- with the empty search_path.

