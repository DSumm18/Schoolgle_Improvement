-- Migration: Security Core - Native Supabase Auth RLS
-- Date: 2025-01-26
-- Purpose: Enable RLS on all tables with native auth.uid() and auth.jwt() claims
-- GDPR Compliant: Uses native Supabase Auth, no middleware injection

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is member of organization
-- Uses native auth.uid() and organization_id from JWT claims
create or replace function is_organization_member(
  org_id uuid
) returns boolean
language plpgsql
security definer
stable
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
      from organization_members
      where user_id = user_id_val::text
        and organization_id = org_id
    );
  end if;
  
  -- Fallback: Check if user is member of this organization
  return exists (
    select 1
    from organization_members
    where user_id = user_id_val::text
      and organization_id = org_id
  );
end;
$$;

-- Function to get user's organization IDs
-- Returns array of organization UUIDs the user belongs to
create or replace function get_user_organization_ids() returns uuid[]
language plpgsql
security definer
stable
as $$
declare
  user_id_val uuid;
begin
  user_id_val := auth.uid();
  
  return array(
    select organization_id
    from organization_members
    where user_id = user_id_val::text
  );
end;
$$;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

alter table users enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table invitations enable row level security;
alter table ofsted_assessments enable row level security;
alter table safeguarding_assessments enable row level security;
alter table siams_assessments enable row level security;
alter table actions enable row level security;
alter table documents enable row level security;
alter table evidence_matches enable row level security;
alter table lesson_observations enable row level security;
alter table statutory_documents enable row level security;
alter table pupil_premium_data enable row level security;
alter table pp_spending enable row level security;
alter table sports_premium_data enable row level security;
alter table sports_premium_spending enable row level security;
alter table sdp_priorities enable row level security;
alter table sdp_milestones enable row level security;
alter table notes enable row level security;
alter table activity_log enable row level security;
alter table meetings enable row level security;
alter table meeting_actions enable row level security;
alter table monitoring_visits enable row level security;
alter table cpd_records enable row level security;
alter table reminders enable row level security;
alter table policies enable row level security;
alter table surveys enable row level security;
alter table survey_responses enable row level security;
alter table external_visits enable row level security;
alter table risks enable row level security;
alter table modules enable row level security;
alter table organization_modules enable row level security;
alter table subscriptions enable row level security;
alter table usage_logs enable row level security;
alter table ai_models enable row level security;
alter table scan_jobs enable row level security;

-- ============================================================================
-- RLS POLICIES: EVIDENCE_MATCHES
-- ============================================================================

-- Users can SELECT evidence_matches for their organizations
create policy "Users can view evidence matches for their organizations"
  on evidence_matches
  for select
  using (
    is_organization_member(organization_id)
  );

-- Users can INSERT evidence_matches for their organizations
create policy "Users can create evidence matches for their organizations"
  on evidence_matches
  for insert
  with check (
    is_organization_member(organization_id)
  );

-- Users can UPDATE evidence_matches for their organizations
create policy "Users can update evidence matches for their organizations"
  on evidence_matches
  for update
  using (
    is_organization_member(organization_id)
  )
  with check (
    is_organization_member(organization_id)
  );

-- Users can DELETE evidence_matches for their organizations
create policy "Users can delete evidence matches for their organizations"
  on evidence_matches
  for delete
  using (
    is_organization_member(organization_id)
  );

-- ============================================================================
-- RLS POLICIES: PUPIL_PREMIUM_DATA
-- ============================================================================

create policy "Users can view pupil premium data for their organizations"
  on pupil_premium_data
  for select
  using (
    is_organization_member(organization_id)
  );

create policy "Users can create pupil premium data for their organizations"
  on pupil_premium_data
  for insert
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can update pupil premium data for their organizations"
  on pupil_premium_data
  for update
  using (
    is_organization_member(organization_id)
  )
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can delete pupil premium data for their organizations"
  on pupil_premium_data
  for delete
  using (
    is_organization_member(organization_id)
  );

-- ============================================================================
-- RLS POLICIES: PP_SPENDING
-- ============================================================================

create policy "Users can view PP spending for their organizations"
  on pp_spending
  for select
  using (
    is_organization_member(organization_id)
  );

create policy "Users can create PP spending for their organizations"
  on pp_spending
  for insert
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can update PP spending for their organizations"
  on pp_spending
  for update
  using (
    is_organization_member(organization_id)
  )
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can delete PP spending for their organizations"
  on pp_spending
  for delete
  using (
    is_organization_member(organization_id)
  );

-- ============================================================================
-- RLS POLICIES: SPORTS_PREMIUM_DATA
-- ============================================================================

create policy "Users can view sports premium data for their organizations"
  on sports_premium_data
  for select
  using (
    is_organization_member(organization_id)
  );

create policy "Users can create sports premium data for their organizations"
  on sports_premium_data
  for insert
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can update sports premium data for their organizations"
  on sports_premium_data
  for update
  using (
    is_organization_member(organization_id)
  )
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can delete sports premium data for their organizations"
  on sports_premium_data
  for delete
  using (
    is_organization_member(organization_id)
  );

-- ============================================================================
-- RLS POLICIES: SPORTS_PREMIUM_SPENDING
-- ============================================================================

create policy "Users can view sports premium spending for their organizations"
  on sports_premium_spending
  for select
  using (
    is_organization_member(organization_id)
  );

create policy "Users can create sports premium spending for their organizations"
  on sports_premium_spending
  for insert
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can update sports premium spending for their organizations"
  on sports_premium_spending
  for update
  using (
    is_organization_member(organization_id)
  )
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can delete sports premium spending for their organizations"
  on sports_premium_spending
  for delete
  using (
    is_organization_member(organization_id)
  );

-- ============================================================================
-- RLS POLICIES: DOCUMENTS (needed for evidence_matches joins)
-- ============================================================================

create policy "Users can view documents for their organizations"
  on documents
  for select
  using (
    is_organization_member(organization_id)
  );

create policy "Users can create documents for their organizations"
  on documents
  for insert
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can update documents for their organizations"
  on documents
  for update
  using (
    is_organization_member(organization_id)
  )
  with check (
    is_organization_member(organization_id)
  );

create policy "Users can delete documents for their organizations"
  on documents
  for delete
  using (
    is_organization_member(organization_id)
  );

-- ============================================================================
-- RLS POLICIES: ORGANIZATIONS
-- ============================================================================

-- Users can view organizations they are members of
create policy "Users can view their organizations"
  on organizations
  for select
  using (
    id = any(get_user_organization_ids())
  );

-- ============================================================================
-- RLS POLICIES: ORGANIZATION_MEMBERS
-- ============================================================================

-- Users can view members of their organizations
create policy "Users can view members of their organizations"
  on organization_members
  for select
  using (
    organization_id = any(get_user_organization_ids())
  );

-- ============================================================================
-- RLS POLICIES: ALL OTHER TABLES (generic pattern)
-- ============================================================================

-- Apply same pattern to all other tables with organization_id
-- This ensures consistent security across all tenant-scoped tables

-- ============================================================================
-- RLS POLICIES FOR TABLES WITH organization_id (Generic Pattern)
-- ============================================================================

-- Note: Only tables that directly have organization_id column
-- Child tables (like sdp_milestones) are handled separately below

do $$
declare
  table_name text;
  tables_with_org_id text[] := array[
    'ofsted_assessments',
    'safeguarding_assessments',
    'siams_assessments',
    'actions',
    'lesson_observations',
    'statutory_documents',
    'sdp_priorities',
    'notes',
    'activity_log',
    'meetings',
    'monitoring_visits',
    'cpd_records',
    'reminders',
    'policies',
    'surveys',
    'external_visits',
    'risks',
    'organization_modules',
    'subscriptions',
    'usage_logs',
    'scan_jobs'
  ];
begin
  foreach table_name in array tables_with_org_id
  loop
    -- SELECT policy
    execute format('
      create policy "Users can view %I for their organizations"
        on %I
        for select
        using (is_organization_member(organization_id))
    ', table_name, table_name);
    
    -- INSERT policy
    execute format('
      create policy "Users can create %I for their organizations"
        on %I
        for insert
        with check (is_organization_member(organization_id))
    ', table_name, table_name);
    
    -- UPDATE policy
    execute format('
      create policy "Users can update %I for their organizations"
        on %I
        for update
        using (is_organization_member(organization_id))
        with check (is_organization_member(organization_id))
    ', table_name, table_name);
    
    -- DELETE policy
    execute format('
      create policy "Users can delete %I for their organizations"
        on %I
        for delete
        using (is_organization_member(organization_id))
    ', table_name, table_name);
  end loop;
end $$;

-- ============================================================================
-- RLS POLICIES FOR CHILD TABLES (no organization_id, but parent has it)
-- ============================================================================

-- sdp_milestones: organization_id is on parent table sdp_priorities
create policy "Users can view sdp_milestones for their organizations"
  on sdp_milestones
  for select
  using (
    exists (
      select 1
      from sdp_priorities sp
      where sp.id = sdp_milestones.priority_id
        and is_organization_member(sp.organization_id)
    )
  );

create policy "Users can create sdp_milestones for their organizations"
  on sdp_milestones
  for insert
  with check (
    exists (
      select 1
      from sdp_priorities sp
      where sp.id = sdp_milestones.priority_id
        and is_organization_member(sp.organization_id)
    )
  );

create policy "Users can update sdp_milestones for their organizations"
  on sdp_milestones
  for update
  using (
    exists (
      select 1
      from sdp_priorities sp
      where sp.id = sdp_milestones.priority_id
        and is_organization_member(sp.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from sdp_priorities sp
      where sp.id = sdp_milestones.priority_id
        and is_organization_member(sp.organization_id)
    )
  );

create policy "Users can delete sdp_milestones for their organizations"
  on sdp_milestones
  for delete
  using (
    exists (
      select 1
      from sdp_priorities sp
      where sp.id = sdp_milestones.priority_id
        and is_organization_member(sp.organization_id)
    )
  );

-- meeting_actions: organization_id is on parent table meetings
create policy "Users can view meeting_actions for their organizations"
  on meeting_actions
  for select
  using (
    exists (
      select 1
      from meetings m
      where m.id = meeting_actions.meeting_id
        and is_organization_member(m.organization_id)
    )
  );

create policy "Users can create meeting_actions for their organizations"
  on meeting_actions
  for insert
  with check (
    exists (
      select 1
      from meetings m
      where m.id = meeting_actions.meeting_id
        and is_organization_member(m.organization_id)
    )
  );

create policy "Users can update meeting_actions for their organizations"
  on meeting_actions
  for update
  using (
    exists (
      select 1
      from meetings m
      where m.id = meeting_actions.meeting_id
        and is_organization_member(m.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from meetings m
      where m.id = meeting_actions.meeting_id
        and is_organization_member(m.organization_id)
    )
  );

create policy "Users can delete meeting_actions for their organizations"
  on meeting_actions
  for delete
  using (
    exists (
      select 1
      from meetings m
      where m.id = meeting_actions.meeting_id
        and is_organization_member(m.organization_id)
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================

-- IMPORTANT: This migration uses NATIVE Supabase Auth:
-- 
-- 1. auth.uid() - Gets the authenticated user's UUID from Supabase Auth
-- 2. auth.jwt() ->> 'organization_id' - Gets organization_id from JWT claims
-- 
-- To set organization_id in JWT claims:
-- - Use Supabase Auth hooks (Database → Functions → Auth Hooks)
-- - Or set in user metadata during signup: 
--   supabase.auth.signUp({ email, password, options: { 
--     data: { organization_id: '...' } 
--   }})
--
-- 3. NO middleware injection - All security is at database level
-- 4. NO set_config() - Uses native auth context only
--
-- This ensures GDPR compliance and maximum security.


