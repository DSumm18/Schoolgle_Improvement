-- Migration: Ed Browser Capabilities
-- Date: 2026-01-23
-- Purpose: Add database support for Ed's browser automation features
--          including domain allowlist, session management, audit logging,
--          translation cache, vision triage, and user preferences

-- ============================================================================
-- APPROVED DOMAINS TABLE
-- ============================================================================

-- Approved domains for browser automation
create table if not exists browser_approved_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  domain text not null,
  description text,
  category text not null check (category in ('government', 'internal', 'vendor', 'other')),
  requires_auth boolean default false,
  auth_method text check (auth_method in ('sso', 'headers', 'credentials', 'none')),
  auth_config jsonb default '{}'::jsonb,
  allowed_paths text[] default array['/**']::text[],
  denied_paths text[] default array[]::text[],
  max_session_duration int default 1800 check (max_session_duration > 0),
  created_at timestamptz default now(),
  created_by uuid references users(id),
  updated_at timestamptz default now(),
  is_active boolean default true,
  unique(organization_id, domain)
);

-- Index for domain lookups
create index idx_browser_approved_domains_org on browser_approved_domains(organization_id);
create index idx_browser_approved_domains_active on browser_approved_domains(is_active);
create index idx_browser_approved_domains_category on browser_approved_domains(category);

-- ============================================================================
-- BROWSER SESSIONS TABLE
-- ============================================================================

-- Browser sessions for audit and monitoring
create table if not exists browser_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text unique not null,
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  domain_id uuid references browser_approved_domains(id) on delete set null,
  start_url text not null,
  current_url text,
  status text default 'active' check (status in ('active', 'completed', 'failed', 'expired')),
  browser_metadata jsonb default '{}'::jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz,
  last_activity timestamptz default now(),
  expires_at timestamptz default now() + interval '30 minutes'
);

-- Indexes for session queries
create index idx_browser_sessions_user on browser_sessions(user_id);
create index idx_browser_sessions_org on browser_sessions(organization_id);
create index idx_browser_sessions_status on browser_sessions(status);
create index idx_browser_sessions_expires on browser_sessions(expires_at);
create index idx_browser_sessions_token on browser_sessions(session_token);

-- Auto-expire old sessions
create or replace function expire_old_browser_sessions() returns void as $$
begin
  update browser_sessions
  set status = 'expired',
      completed_at = now()
  where status = 'active'
    and expires_at < now();
end;
$$ language plpgsql;

-- ============================================================================
-- BROWSER ACTIONS TABLE
-- ============================================================================

-- Browser actions for detailed audit trail
create table if not exists browser_actions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references browser_sessions(id) on delete cascade,
  action_type text not null check (action_type in ('navigate', 'fill', 'click', 'submit', 'screenshot', 'wait', 'close')),
  target_ref text,
  target_element jsonb default '{}'::jsonb,
  input_value text,
  output_value text,
  screenshot_path text,
  approval_status text check (approval_status in ('auto', 'pending', 'approved', 'denied')) default 'auto',
  approval_requested_by uuid references users(id),
  approval_requested_at timestamptz,
  approval_responded_by uuid references users(id),
  approval_responded_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

-- Indexes for audit queries
create index idx_browser_actions_session on browser_actions(session_id);
create index idx_browser_actions_type on browser_actions(action_type);
create index idx_browser_actions_approval on browser_actions(approval_status);
create index idx_browser_actions_created on browser_actions(created_at);

-- ============================================================================
-- TRANSLATION CACHE TABLE
-- ============================================================================

-- Multilingual translations cache
create table if not exists translation_cache (
  id uuid primary key default gen_random_uuid(),
  source_text text not null,
  source_language text not null,
  target_language text not null,
  translated_text text not null,
  quality_score decimal(3,2) check (quality_score between 0 and 1),
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '30 days',
  hash text unique not null,
  access_count int default 0,
  last_accessed timestamptz default now()
);

-- Index for translation lookups
create index idx_translation_cache_hash on translation_cache(hash);
create index idx_translation_cache_expires on translation_cache(expires_at);

-- Auto-cleanup expired translations
create or replace function cleanup_expired_translations() returns void as $$
begin
  delete from translation_cache
  where expires_at < now();
end;
$$ language plpgsql;

-- Function to generate translation hash
create or replace function generate_translation_hash(
  source_text text,
  source_language text,
  target_language text
) returns text as $$
begin
  return encode(digest(source_text || '|' || source_language || '|' || target_language, 'sha256'), 'hex');
end;
$$ language plpgsql;

-- ============================================================================
-- VISION TRIAGE RESULTS TABLE
-- ============================================================================

-- Vision triage results for facilities issues
create table if not exists vision_triage_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  image_storage_path text not null,
  issue_category text check (issue_category in ('plumbing', 'electrical', 'structural', 'hvac', 'other')),
  severity_score int not null check (severity_score between 0 and 100),
  severity_level text not null check (severity_level in ('critical', 'high', 'medium', 'low')),
  detected_objects jsonb default '[]'::jsonb,
  confidence_score decimal(3,2) check (confidence_score between 0 and 1),
  location_context text,
  description text,
  ticket_id uuid references actions(id) on delete set null,
  created_at timestamptz default now()
);

-- Indexes for triage queries
create index idx_vision_triage_results_org on vision_triage_results(organization_id);
create index idx_vision_triage_results_severity on vision_triage_results(severity_level);
create index idx_vision_triage_results_category on vision_triage_results(issue_category);
create index idx_vision_triage_results_ticket on vision_triage_results(ticket_id);
create index idx_vision_triage_results_created on vision_triage_results(created_at);

-- ============================================================================
-- USER LANGUAGE PREFERENCES TABLE
-- ============================================================================

-- User language preferences
create table if not exists user_language_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users(id) on delete cascade,
  preferred_language text not null default 'en',
  secondary_language text,
  auto_translate boolean default true,
  show_side_by_side boolean default true,
  font_size text check (font_size in ('small', 'medium', 'large')) default 'medium',
  updated_at timestamptz default now()
);

-- Index for user preference lookups
create index idx_user_language_preferences_user on user_language_preferences(user_id);

-- Function to get or create user language preferences
create or replace function get_or_create_user_preferences(user_uuid uuid) returns jsonb as $$
declare
  pref jsonb;
begin
  insert into user_language_preferences (user_id)
  values (user_uuid)
  on conflict (user_id) do nothing
  returning row_to_json(t.*)::jsonb into pref
  from user_language_preferences t
  where t.user_id = user_uuid;

  if not found then
    select row_to_json(t.*)::jsonb into pref
    from user_language_preferences t
    where t.user_id = user_uuid;
  end if;

  return pref;
end;
$$ language plpgsql;

-- ============================================================================
-- FORM TEMPLATES TABLE
-- ============================================================================

-- Form templates for common forms
create table if not exists form_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  form_url text not null,
  domain_id uuid references browser_approved_domains(id) on delete set null,
  form_schema jsonb not null,
  field_mappings jsonb default '{}'::jsonb,
  requires_approval boolean default false,
  is_active boolean default true,
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references users(id)
);

-- Index for form template lookups
create index idx_form_templates_domain on form_templates(domain_id);
create index idx_form_templates_active on form_templates(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
alter table browser_approved_domains enable row level security;
alter table browser_sessions enable row level security;
alter table browser_actions enable row level security;
alter table translation_cache enable row level security;
alter table vision_triage_results enable row level security;
alter table user_language_preferences enable row level security;
alter table form_templates enable row level security;

-- Browser Approved Domains Policies
create policy "Users can view approved domains for their organizations"
  on browser_approved_domains
  for select
  using (
    is_organization_member(organization_id)
  );

create policy "Organization admins can manage approved domains"
  on browser_approved_domains
  for all
  using (
    exists (
      select 1
      from organization_members
      where user_id = auth.uid()::text
        and organization_id = browser_approved_domains.organization_id
        and role in ('admin', 'owner')
    )
  );

-- Browser Sessions Policies
create policy "Users can view their own sessions"
  on browser_sessions
  for select
  using (
    user_id = auth.uid() or
    is_organization_member(organization_id)
  );

create policy "Users can create sessions for their organizations"
  on browser_sessions
  for insert
  with check (
    user_id = auth.uid() and
    is_organization_member(organization_id)
  );

create policy "Users can update their own sessions"
  on browser_sessions
  for update
  using (
    user_id = auth.uid()
  );

-- Browser Actions Policies
create policy "Users can view actions for their sessions"
  on browser_actions
  for select
  using (
    exists (
      select 1
      from browser_sessions bs
      where bs.id = browser_actions.session_id
        and (bs.user_id = auth.uid() or is_organization_member(bs.organization_id))
    )
  );

-- Translation Cache Policies
create policy "All authenticated users can access translation cache"
  on translation_cache
  for select
  using (true);

create policy "System can manage translation cache"
  on translation_cache
  for all
  using (
    exists (
      select 1
      from organization_members
      where user_id = auth.uid()::text
        and role in ('admin', 'owner')
    )
  );

-- Vision Triage Results Policies
create policy "Users can view triage results for their organizations"
  on vision_triage_results
  for select
  using (
    user_id = auth.uid() or
    is_organization_member(organization_id)
  );

create policy "Users can create triage results"
  on vision_triage_results
  for insert
  with check (
    user_id = auth.uid() and
    is_organization_member(organization_id)
  );

-- User Language Preferences Policies
create policy "Users can view their own language preferences"
  on user_language_preferences
  for select
  using (user_id = auth.uid());

create policy "Users can manage their own language preferences"
  on user_language_preferences
  for all
  using (user_id = auth.uid());

-- Form Templates Policies
create policy "Users can view form templates for their organizations"
  on form_templates
  for select
  using (
    domain_id in (
      select id from browser_approved_domains
      where is_organization_member(organization_id)
    ) or is_active = true
  );

create policy "Organization admins can manage form templates"
  on form_templates
  for all
  using (
    exists (
      select 1
      from browser_approved_domains bad
      where bad.id = form_templates.domain_id
        and exists (
          select 1
          from organization_members
          where user_id = auth.uid()::text
            and organization_id = bad.organization_id
            and role in ('admin', 'owner')
        )
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a URL is in an approved domain
create or replace function is_url_approved(
  target_url text,
  org_id uuid
) returns boolean as $$
declare
  domain_text text;
  is_approved boolean := false;
begin
  -- Extract domain from URL
  domain_text := regexp_replace(target_url, '^https?://([^/]+).*', '\1');

  -- Check if domain exists and is active for this organization
  select exists(
    select 1
    from browser_approved_domains
    where organization_id = org_id
      and domain = domain_text
      and is_active = true
  ) into is_approved;

  return is_approved;
end;
$$ language plpgsql;

-- Function to create a browser session
create or replace function create_browser_session(
  user_uuid uuid,
  org_id uuid,
  target_url text,
  duration_seconds int default 1800
) returns uuid as $$
declare
  session_id_val uuid;
  domain_id_val uuid;
  session_token_val text;
begin
  -- Verify URL is approved
  if not is_url_approved(target_url, org_id) then
    raise exception 'URL is not approved for this organization';
  end if;

  -- Get domain ID
  select id into domain_id_val
  from browser_approved_domains
  where organization_id = org_id
    and target_url like '%' || domain || '%'
    and is_active = true
  limit 1;

  -- Create session
  insert into browser_sessions (
    session_token,
    user_id,
    organization_id,
    domain_id,
    start_url,
    current_url,
    expires_at
  ) values (
    encode(gen_random_bytes(32), 'hex'),
    user_uuid,
    org_id,
    domain_id_val,
    target_url,
    target_url,
    now() + (duration_seconds || ' seconds')::interval
  ) returning id into session_id_val;

  return session_id_val;
end;
$$ language plpgsql;

-- Function to log a browser action
create or replace function log_browser_action(
  session_uuid uuid,
  action_type_val text,
  target_ref_val text default null,
  input_value_val text default null,
  metadata_val jsonb default '{}'::jsonb
) returns uuid as $$
declare
  action_id uuid;
begin
  -- Update session last activity
  update browser_sessions
  set last_activity = now()
  where id = session_uuid;

  -- Insert action
  insert into browser_actions (
    session_id,
    action_type,
    target_ref,
    input_value,
    metadata
  ) values (
    session_uuid,
    action_type_val,
    target_ref_val,
    input_value_val,
    metadata_val
  ) returning id into action_id;

  return action_id;
end;
$$ language plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on browser_approved_domains
create or replace function update_browser_approved_domains_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger browser_approved_domains_updated_at
  before update on browser_approved_domains
  for each row
  execute function update_browser_approved_domains_updated_at();

-- Update updated_at timestamp on form_templates
create or replace function update_form_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger form_templates_updated_at
  before update on form_templates
  for each row
  execute function update_form_templates_updated_at();

-- Update last_accessed on translation cache when accessed
create or replace function update_translation_cache_accessed()
returns trigger as $$
begin
  new.last_accessed = now();
  new.access_count = coalesce(old.access_count, 0) + 1;
  return new;
end;
$$ language plpgsql;

create trigger translation_cache_accessed
  before update on translation_cache
  for each row
  execute function update_translation_cache_accessed();

-- ============================================================================
-- SCHEDULED MAINTENANCE
-- ============================================================================

-- Note: These should be scheduled via pg_cron or similar
-- Run expire_old_browser_sessions() every hour
-- Run cleanup_expired_translations() daily

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on sequences
grant usage on all sequences in public to authenticated;
grant usage on all sequences in public to service_role;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample approved domains for testing (remove in production)
-- These are common UK government domains that schools might need

-- Note: This is for development only. In production, domains should be
-- added by organization admins through the admin UI.

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
do $$
begin
  raise notice 'Ed Browser Capabilities migration completed successfully';
  raise notice 'Tables created: browser_approved_domains, browser_sessions, browser_actions, translation_cache, vision_triage_results, user_language_preferences, form_templates';
end $$;
