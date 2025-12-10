-- Migration: Secure RLS Policies for Multi-Tenant MCP
-- Date: 2025-01-26
-- Purpose: Implement Row Level Security policies that enforce organization_id isolation
--          for MCP tool access. Uses security definer functions to check organization_members.

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user is a member of an organization
-- This is used by RLS policies to validate access
create or replace function is_organization_member(
  user_id_param text,
  org_id uuid
) returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from organization_members
    where user_id = user_id_param
      and organization_id = org_id
  );
$$;

-- Function to get user_id from connection context
-- For MCP connections, this will be set via set_config() per connection
-- Falls back to checking if user_id is in request context
create or replace function get_connection_user_id() returns text
language plpgsql
stable
as $$
declare
  user_id_val text;
begin
  -- Try to get from connection-local setting (set by MCP server)
  user_id_val := current_setting('app.user_id', true);
  
  -- If not set, try to get from JWT claims (for future Firebase integration)
  if user_id_val is null then
    begin
      user_id_val := current_setting('request.jwt.claims', true)::json->>'user_id';
    exception
      when others then
        user_id_val := null;
    end;
  end if;
  
  return user_id_val;
end;
$$;

-- Function to get organization_id from connection context
-- For MCP connections, this will be set via set_config() per connection
create or replace function get_connection_organization_id() returns uuid
language plpgsql
stable
as $$
declare
  org_id_val text;
begin
  -- Try to get from connection-local setting (set by MCP server)
  org_id_val := current_setting('app.organization_id', true);
  
  if org_id_val is null then
    return null;
  end if;
  
  return org_id_val::uuid;
exception
  when others then
    return null;
end;
$$;

-- ============================================================================
-- RLS POLICIES FOR EVIDENCE_MATCHES
-- ============================================================================

-- Drop existing service role policy (we'll keep it but add user policies)
-- Note: Service role policies remain for admin operations

-- Policy: Users can SELECT evidence_matches for their organization
create policy "Users can view evidence matches for their organization"
  on evidence_matches
  for select
  using (
    -- Check if user is member of the organization
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

-- Policy: Users can INSERT evidence_matches for their organization
create policy "Users can create evidence matches for their organization"
  on evidence_matches
  for insert
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

-- Policy: Users can UPDATE evidence_matches for their organization
create policy "Users can update evidence matches for their organization"
  on evidence_matches
  for update
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  )
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

-- Policy: Users can DELETE evidence_matches for their organization
create policy "Users can delete evidence matches for their organization"
  on evidence_matches
  for delete
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR PUPIL_PREMIUM_DATA
-- ============================================================================

create policy "Users can view pupil premium data for their organization"
  on pupil_premium_data
  for select
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can create pupil premium data for their organization"
  on pupil_premium_data
  for insert
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can update pupil premium data for their organization"
  on pupil_premium_data
  for update
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  )
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can delete pupil premium data for their organization"
  on pupil_premium_data
  for delete
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR PP_SPENDING
-- ============================================================================

create policy "Users can view PP spending for their organization"
  on pp_spending
  for select
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can create PP spending for their organization"
  on pp_spending
  for insert
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can update PP spending for their organization"
  on pp_spending
  for update
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  )
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can delete PP spending for their organization"
  on pp_spending
  for delete
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR SPORTS_PREMIUM_DATA
-- ============================================================================

create policy "Users can view sports premium data for their organization"
  on sports_premium_data
  for select
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can create sports premium data for their organization"
  on sports_premium_data
  for insert
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can update sports premium data for their organization"
  on sports_premium_data
  for update
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  )
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can delete sports premium data for their organization"
  on sports_premium_data
  for delete
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR SPORTS_PREMIUM_SPENDING
-- ============================================================================

create policy "Users can view sports premium spending for their organization"
  on sports_premium_spending
  for select
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can create sports premium spending for their organization"
  on sports_premium_spending
  for insert
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can update sports premium spending for their organization"
  on sports_premium_spending
  for update
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  )
  with check (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

create policy "Users can delete sports premium spending for their organization"
  on sports_premium_spending
  for delete
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR DOCUMENTS (needed for evidence_matches joins)
-- ============================================================================

create policy "Users can view documents for their organization"
  on documents
  for select
  using (
    is_organization_member(
      get_connection_user_id(),
      organization_id
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================

-- IMPORTANT: For MCP connections to work with these RLS policies:
-- 
-- 1. MCP server must set connection context before executing queries:
--    SELECT set_config('app.user_id', 'firebase-uid-here', false);
--    SELECT set_config('app.organization_id', 'uuid-here', false);
--
-- 2. These settings are connection-local and will persist for the duration
--    of the database connection session.
--
-- 3. Service role policies remain in place for admin operations, but MCP
--    tools should NEVER use service role - always use anon key with user context.
--
-- 4. The get_connection_user_id() and get_connection_organization_id() functions
--    read from these connection-local settings, providing the tenant context
--    needed for RLS policies.

-- ============================================================================
-- VERIFICATION QUERIES (run these to test)
-- ============================================================================

-- Test: Verify policies are created
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('evidence_matches', 'pupil_premium_data', 'pp_spending', 
--                     'sports_premium_data', 'sports_premium_spending', 'documents')
-- ORDER BY tablename, policyname;

-- Test: Verify functions exist
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
--   AND routine_name IN ('is_organization_member', 'get_connection_user_id', 'get_connection_organization_id');


