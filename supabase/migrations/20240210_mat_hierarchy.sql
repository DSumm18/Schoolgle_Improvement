-- Migration: Phase 3 - MAT Hierarchy (Multi-Academy Trusts & Local Authorities)
-- Date: 2025-02-10
-- Purpose: Add parent/child hierarchy to organizations table for Trusts and LAs
-- Risk Level: LOW (database is empty, no existing data to migrate)

-- ============================================================================
-- SCHEMA CHANGES: ORGANIZATIONS TABLE
-- ============================================================================

-- Add organization_type column (defaults to 'school' for existing rows)
alter table organizations 
add column if not exists organization_type text 
check (organization_type in ('school', 'trust', 'local_authority')) 
default 'school' not null;

-- Add parent_organization_id column (NULL initially for all existing rows)
alter table organizations 
add column if not exists parent_organization_id uuid 
references organizations(id) on delete restrict;

-- Add la_code column (DfE Local Authority code)
alter table organizations 
add column if not exists la_code text;

-- Add data_sharing_agreement column (for LA data sharing)
alter table organizations 
add column if not exists data_sharing_agreement boolean default false;

-- Add index for performance on parent lookups
create index if not exists organizations_parent_idx 
on organizations(parent_organization_id) 
where parent_organization_id is not null;

-- Add index for organization_type filtering
create index if not exists organizations_type_idx 
on organizations(organization_type);

-- Add constraint to prevent self-reference
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'no_self_reference' 
    and conrelid = 'organizations'::regclass
  ) then
    alter table organizations 
    add constraint no_self_reference 
    check (id != parent_organization_id);
  end if;
end $$;

-- Add constraint: Only schools can have parents (Trusts/LAs cannot be children)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'only_schools_have_parents' 
    and conrelid = 'organizations'::regclass
  ) then
    alter table organizations 
    add constraint only_schools_have_parents 
    check (
      parent_organization_id is null 
      OR 
      organization_type = 'school'
    );
  end if;
end $$;

-- ============================================================================
-- RECURSIVE SECURITY FUNCTION: get_accessible_orgs
-- ============================================================================

-- Function to get all organization IDs a user can access
-- Handles recursive hierarchy: Trust users see child schools, LA users see schools with data sharing
create or replace function get_accessible_orgs(
  user_id_param uuid
) returns uuid[]
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
declare
  user_org_ids uuid[];
  org_type text;
  child_org_ids uuid[];
begin
  -- Get all organizations the user is a member of
  select array_agg(organization_id)
  into user_org_ids
  from organization_members
  where user_id = user_id_param::text;
  
  -- If user has no memberships, return empty array
  if user_org_ids is null or array_length(user_org_ids, 1) is null then
    return array[]::uuid[];
  end if;
  
  -- Check each organization the user belongs to
  foreach org_type in array (
    select array_agg(distinct o.organization_type)
    from organizations o
    where o.id = any(user_org_ids)
  )
  loop
    -- If user belongs to a School: Return only [school_id]
    -- (No change needed - school_id already in user_org_ids)
    
    -- If user belongs to a Trust: Return [trust_id] AND all child_organization_ids
    if org_type = 'trust' then
      select array_agg(id)
      into child_org_ids
      from organizations
      where parent_organization_id = any(
        select id from organizations 
        where id = any(user_org_ids) 
        and organization_type = 'trust'
      );
      
      if child_org_ids is not null then
        user_org_ids := user_org_ids || child_org_ids;
      end if;
    end if;
    
    -- If user belongs to an LA: Return [la_id] AND all child_organization_ids WHERE data_sharing_agreement = true
    if org_type = 'local_authority' then
      select array_agg(id)
      into child_org_ids
      from organizations
      where parent_organization_id = any(
        select id from organizations 
        where id = any(user_org_ids) 
        and organization_type = 'local_authority'
      )
      and data_sharing_agreement = true;
      
      if child_org_ids is not null then
        user_org_ids := user_org_ids || child_org_ids;
      end if;
    end if;
  end loop;
  
  -- Remove duplicates and return
  return array(select distinct unnest(user_org_ids));
end;
$$;

-- ============================================================================
-- HELPER FUNCTION: get_user_accessible_orgs (wrapper for auth.uid())
-- ============================================================================

-- Wrapper function that uses auth.uid() for RLS policies
create or replace function get_user_accessible_orgs() returns uuid[]
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
begin
  return get_accessible_orgs(auth.uid());
end;
$$;

-- ============================================================================
-- UPDATE RLS POLICIES: ORGANIZATIONS
-- ============================================================================

-- Drop existing policy
drop policy if exists "Users can view their organizations" on organizations;

-- Create new recursive policy
create policy "Users can view their organizations and child organizations"
  on organizations
  for select
  using (
    id = any(get_user_accessible_orgs())
  );

-- ============================================================================
-- UPDATE RLS POLICIES: STUDENTS
-- ============================================================================

-- Drop existing policy
drop policy if exists "Users can access students in their organizations" on students;

-- Create new recursive policy
create policy "Users can access students in their organizations and child organizations"
  on students
  for all
  using (
    organization_id = any(get_user_accessible_orgs())
  );

-- ============================================================================
-- UPDATE RLS POLICIES: FINANCIAL DATA
-- ============================================================================

-- Pupil Premium Data
drop policy if exists "Users can view pupil premium data for their organizations" on pupil_premium_data;
create policy "Users can view pupil premium data for their organizations and child organizations"
  on pupil_premium_data
  for select
  using (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can create PP data for their organizations" on pupil_premium_data;
create policy "Users can create PP data for their organizations and child organizations"
  on pupil_premium_data
  for insert
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can update PP data for their organizations" on pupil_premium_data;
create policy "Users can update PP data for their organizations and child organizations"
  on pupil_premium_data
  for update
  using (organization_id = any(get_user_accessible_orgs()))
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can delete PP data for their organizations" on pupil_premium_data;
create policy "Users can delete PP data for their organizations and child organizations"
  on pupil_premium_data
  for delete
  using (organization_id = any(get_user_accessible_orgs()));

-- PP Spending
drop policy if exists "Users can view PP spending for their organizations" on pp_spending;
create policy "Users can view PP spending for their organizations and child organizations"
  on pp_spending
  for select
  using (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can create PP spending for their organizations" on pp_spending;
create policy "Users can create PP spending for their organizations and child organizations"
  on pp_spending
  for insert
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can update PP spending for their organizations" on pp_spending;
create policy "Users can update PP spending for their organizations and child organizations"
  on pp_spending
  for update
  using (organization_id = any(get_user_accessible_orgs()))
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can delete PP spending for their organizations" on pp_spending;
create policy "Users can delete PP spending for their organizations and child organizations"
  on pp_spending
  for delete
  using (organization_id = any(get_user_accessible_orgs()));

-- Sports Premium Data
drop policy if exists "Users can view sports premium data for their organizations" on sports_premium_data;
create policy "Users can view sports premium data for their organizations and child organizations"
  on sports_premium_data
  for select
  using (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can create sports premium data for their organizations" on sports_premium_data;
create policy "Users can create sports premium data for their organizations and child organizations"
  on sports_premium_data
  for insert
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can update sports premium data for their organizations" on sports_premium_data;
create policy "Users can update sports premium data for their organizations and child organizations"
  on sports_premium_data
  for update
  using (organization_id = any(get_user_accessible_orgs()))
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can delete sports premium data for their organizations" on sports_premium_data;
create policy "Users can delete sports premium data for their organizations and child organizations"
  on sports_premium_data
  for delete
  using (organization_id = any(get_user_accessible_orgs()));

-- Sports Premium Spending
drop policy if exists "Users can view sports premium spending for their organizations" on sports_premium_spending;
create policy "Users can view sports premium spending for their organizations and child organizations"
  on sports_premium_spending
  for select
  using (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can create sports premium spending for their organizations" on sports_premium_spending;
create policy "Users can create sports premium spending for their organizations and child organizations"
  on sports_premium_spending
  for insert
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can update sports premium spending for their organizations" on sports_premium_spending;
create policy "Users can update sports premium spending for their organizations and child organizations"
  on sports_premium_spending
  for update
  using (organization_id = any(get_user_accessible_orgs()))
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can delete sports premium spending for their organizations" on sports_premium_spending;
create policy "Users can delete sports premium spending for their organizations and child organizations"
  on sports_premium_spending
  for delete
  using (organization_id = any(get_user_accessible_orgs()));

-- ============================================================================
-- UPDATE RLS POLICIES: ACTIONS
-- ============================================================================

drop policy if exists "Users can view actions for their organizations" on actions;
create policy "Users can view actions for their organizations and child organizations"
  on actions
  for select
  using (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can create actions for their organizations" on actions;
create policy "Users can create actions for their organizations and child organizations"
  on actions
  for insert
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can update actions for their organizations" on actions;
create policy "Users can update actions for their organizations and child organizations"
  on actions
  for update
  using (organization_id = any(get_user_accessible_orgs()))
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can delete actions for their organizations" on actions;
create policy "Users can delete actions for their organizations and child organizations"
  on actions
  for delete
  using (organization_id = any(get_user_accessible_orgs()));

-- ============================================================================
-- UPDATE RLS POLICIES: ASSESSMENTS
-- ============================================================================

-- Ofsted Assessments
drop policy if exists "Users can view ofsted assessments for their organizations" on ofsted_assessments;
create policy "Users can view ofsted assessments for their organizations and child organizations"
  on ofsted_assessments
  for select
  using (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can create ofsted assessments for their organizations" on ofsted_assessments;
create policy "Users can create ofsted assessments for their organizations and child organizations"
  on ofsted_assessments
  for insert
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can update ofsted assessments for their organizations" on ofsted_assessments;
create policy "Users can update ofsted assessments for their organizations and child organizations"
  on ofsted_assessments
  for update
  using (organization_id = any(get_user_accessible_orgs()))
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can delete ofsted assessments for their organizations" on ofsted_assessments;
create policy "Users can delete ofsted assessments for their organizations and child organizations"
  on ofsted_assessments
  for delete
  using (organization_id = any(get_user_accessible_orgs()));

-- Safeguarding Assessments
drop policy if exists "Users can view safeguarding assessments for their organizations" on safeguarding_assessments;
create policy "Users can view safeguarding assessments for their organizations and child organizations"
  on safeguarding_assessments
  for select
  using (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can create safeguarding assessments for their organizations" on safeguarding_assessments;
create policy "Users can create safeguarding assessments for their organizations and child organizations"
  on safeguarding_assessments
  for insert
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can update safeguarding assessments for their organizations" on safeguarding_assessments;
create policy "Users can update safeguarding assessments for their organizations and child organizations"
  on safeguarding_assessments
  for update
  using (organization_id = any(get_user_accessible_orgs()))
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can delete safeguarding assessments for their organizations" on safeguarding_assessments;
create policy "Users can delete safeguarding assessments for their organizations and child organizations"
  on safeguarding_assessments
  for delete
  using (organization_id = any(get_user_accessible_orgs()));

-- SIAMS Assessments
drop policy if exists "Users can view siams assessments for their organizations" on siams_assessments;
create policy "Users can view siams assessments for their organizations and child organizations"
  on siams_assessments
  for select
  using (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can create siams assessments for their organizations" on siams_assessments;
create policy "Users can create siams assessments for their organizations and child organizations"
  on siams_assessments
  for insert
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can update siams assessments for their organizations" on siams_assessments;
create policy "Users can update siams assessments for their organizations and child organizations"
  on siams_assessments
  for update
  using (organization_id = any(get_user_accessible_orgs()))
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can delete siams assessments for their organizations" on siams_assessments;
create policy "Users can delete siams assessments for their organizations and child organizations"
  on siams_assessments
  for delete
  using (organization_id = any(get_user_accessible_orgs()));

-- ============================================================================
-- UPDATE RLS POLICIES: EVIDENCE MATCHES
-- ============================================================================

drop policy if exists "Users can view evidence matches for their organizations" on evidence_matches;
create policy "Users can view evidence matches for their organizations and child organizations"
  on evidence_matches
  for select
  using (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can create evidence matches for their organizations" on evidence_matches;
create policy "Users can create evidence matches for their organizations and child organizations"
  on evidence_matches
  for insert
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can update evidence matches for their organizations" on evidence_matches;
create policy "Users can update evidence matches for their organizations and child organizations"
  on evidence_matches
  for update
  using (organization_id = any(get_user_accessible_orgs()))
  with check (organization_id = any(get_user_accessible_orgs()));

drop policy if exists "Users can delete evidence matches for their organizations" on evidence_matches;
create policy "Users can delete evidence matches for their organizations and child organizations"
  on evidence_matches
  for delete
  using (organization_id = any(get_user_accessible_orgs()));

-- ============================================================================
-- UPDATE RLS POLICIES: OTHER KEY TABLES
-- ============================================================================

-- Documents
drop policy if exists "Users can view documents for their organizations" on documents;
create policy "Users can view documents for their organizations and child organizations"
  on documents
  for select
  using (organization_id = any(get_user_accessible_orgs()));

-- Cohorts (from Phase 2)
drop policy if exists "Users can access cohorts in their organizations" on cohorts;
create policy "Users can access cohorts in their organizations and child organizations"
  on cohorts
  for all
  using (organization_id = any(get_user_accessible_orgs()));

-- School Interventions (from Phase 2)
drop policy if exists "Users can access interventions in their organizations" on school_interventions;
create policy "Users can access interventions in their organizations and child organizations"
  on school_interventions
  for all
  using (organization_id = any(get_user_accessible_orgs()));

-- ============================================================================
-- UPDATE HELPER FUNCTIONS
-- ============================================================================

-- Update get_user_organization_ids to use new recursive function
-- Note: This maintains backward compatibility but now includes child orgs
create or replace function get_user_organization_ids() returns uuid[]
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
begin
  -- Use the new recursive function
  return get_user_accessible_orgs();
end;
$$;

-- ============================================================================
-- REGISTER NEW ADMIN TOOLS
-- ============================================================================

insert into tool_definitions (tool_key, tool_name, description, module_key, risk_level, requires_approval) values
  ('create_organization', 'Create Organization', 'Creates a new organization (School, Trust, or Local Authority). Allows building the hierarchy structure.', 'core', 'medium', false),
  ('link_school_to_parent', 'Link School to Parent', 'Moves a school under a Trust or Local Authority by setting parent_organization_id. Updates hierarchy relationships.', 'core', 'medium', false)
on conflict (tool_key) do update set
  tool_name = excluded.tool_name,
  description = excluded.description,
  module_key = excluded.module_key,
  risk_level = excluded.risk_level,
  requires_approval = excluded.requires_approval;

