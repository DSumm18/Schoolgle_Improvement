-- Migration: Entitlements & Safety Layer
-- Date: 2025-01-26
-- Purpose: Module entitlements and tool audit logging for GDPR compliance

-- ============================================================================
-- API KEYS TABLE (for B2B partner authentication)
-- ============================================================================

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  
  -- Key details
  name text not null,
  key_hash text not null unique, -- SHA-256 hash of the actual key
  description text,
  
  -- Permissions
  permissions text[] default '{}', -- Array of permission strings
  
  -- Expiration
  expires_at timestamp with time zone,
  
  -- Status
  is_active boolean default true,
  
  -- Usage tracking
  last_used_at timestamp with time zone,
  usage_count integer default 0,
  
  -- Metadata
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index api_keys_organization_idx on api_keys (organization_id);
create index api_keys_key_hash_idx on api_keys (key_hash);
create index api_keys_active_idx on api_keys (is_active) where is_active = true;

-- Enable RLS
alter table api_keys enable row level security;

-- RLS: Users can view API keys for their organizations
create policy "Users can view API keys for their organizations"
  on api_keys
  for select
  using (
    organization_id = any(get_user_organization_ids())
  );

-- RLS: Only admins can create/update/delete API keys
create policy "Admins can manage API keys for their organizations"
  on api_keys
  for all
  using (
    organization_id = any(get_user_organization_ids())
    and exists (
      select 1
      from organization_members
      where organization_id = api_keys.organization_id
        and user_id = auth.uid()::text
        and role = 'admin'
    )
  );

-- ============================================================================
-- MODULES TABLE (App Store - available modules)
-- ============================================================================

-- Modules table already exists in schema, but ensure it has the right structure
-- First, add the 'key' column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'modules' 
    and column_name = 'key'
  ) then
    alter table modules add column key text;
    -- Make it unique after adding
    create unique index if not exists modules_key_unique on modules(key) where key is not null;
  end if;
end $$;

-- Update existing modules to set key = id (since id is the identifier)
update modules set key = id where key is null;

-- Now make key NOT NULL and ensure it's unique
alter table modules alter column key set not null;
create unique index if not exists modules_key_unique_idx on modules(key);

-- Seed core modules with keys (use id as key if key matches id)
insert into modules (id, key, name, short_name, category, price_monthly, price_annual, features, default_limits, display_order) values
  ('core', 'core', 'Core Platform', 'Core', 'core', 0, 0, 
   '["Framework self-assessment", "Basic action tracking", "10 Ed queries/month"]',
   '{"ed_queries": 10, "doc_scans": 0, "reports": 0}', 1),
  ('inspection_ready', 'ofsted_inspector', 'Ofsted Inspector', 'Inspection', 'inspection', 49, 499,
   '["Evidence scanner", "SEF generator", "Statutory documents", "Inspection predictor", "100 Ed queries"]',
   '{"ed_queries": 100, "doc_scans": 50, "reports": 10}', 2),
  ('finance_suite', 'finance_bot', 'Finance Bot', 'Finance', 'operations', 39, 399,
   '["Pupil Premium analysis", "Sports Premium tracking", "Financial reporting", "Spending analysis"]',
   '{"financial_reports": 20}', 3)
on conflict (id) do update set
  key = excluded.key,
  name = excluded.name;

-- ============================================================================
-- ORGANIZATION_MODULES (Entitlements - which modules org has purchased)
-- ============================================================================

-- Table already exists, but ensure it links to modules.key
create table if not exists organization_modules (
  organization_id uuid references organizations(id) on delete cascade,
  module_id text references modules(id) on delete cascade,
  module_key text, -- Denormalized for faster lookups
  
  enabled boolean default true,
  enabled_at timestamp with time zone default timezone('utc'::text, now()),
  expires_at timestamp with time zone,
  
  custom_limits jsonb,
  usage_current jsonb default '{}',
  usage_reset_at timestamp with time zone,
  
  primary key (organization_id, module_id)
);

-- Add module_key if column doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'organization_modules' 
    and column_name = 'module_key'
  ) then
    alter table organization_modules add column module_key text;
    
    -- Populate module_key from modules table
    update organization_modules om
    set module_key = m.key
    from modules m
    where om.module_id = m.id;
  end if;
end $$;

create index org_modules_key_idx on organization_modules (organization_id, module_key) where enabled = true;

-- Enable RLS
alter table organization_modules enable row level security;

-- RLS: Users can view modules for their organizations
create policy "Users can view modules for their organizations"
  on organization_modules
  for select
  using (
    organization_id = any(get_user_organization_ids())
  );

-- ============================================================================
-- TOOL AUDIT LOGS (GDPR & Safeguarding compliance)
-- ============================================================================

create table if not exists tool_audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  
  -- Tool details
  tool_name text not null,
  tool_module_key text, -- Which module this tool belongs to
  
  -- Request
  request_inputs jsonb not null, -- Sanitized inputs (no sensitive data)
  request_timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Response
  response_output jsonb, -- Sanitized output
  response_timestamp timestamp with time zone,
  response_status text check (response_status in ('success', 'error', 'blocked', 'pending_approval')),
  error_message text,
  
  -- Safety flags
  risk_level text check (risk_level in ('low', 'medium', 'high')) default 'low',
  requires_approval boolean default false,
  approved_by uuid references auth.users(id),
  approved_at timestamp with time zone,
  
  -- Metadata
  ip_address inet,
  user_agent text,
  session_id text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index tool_audit_org_idx on tool_audit_logs (organization_id);
create index tool_audit_user_idx on tool_audit_logs (user_id);
create index tool_audit_tool_idx on tool_audit_logs (tool_name);
create index tool_audit_timestamp_idx on tool_audit_logs (request_timestamp desc);
create index tool_audit_risk_idx on tool_audit_logs (risk_level, requires_approval) where risk_level = 'high';

-- Enable RLS
alter table tool_audit_logs enable row level security;

-- RLS: Users can view audit logs for their organizations
create policy "Users can view audit logs for their organizations"
  on tool_audit_logs
  for select
  using (
    organization_id = any(get_user_organization_ids())
  );

-- RLS: System can insert audit logs (via service role)
-- Note: Service role policies remain for admin operations

-- ============================================================================
-- TOOL DEFINITIONS (which tools belong to which modules)
-- ============================================================================

create table if not exists tool_definitions (
  id uuid primary key default gen_random_uuid(),
  tool_key text not null unique, -- e.g., 'get_financial_records', 'get_evidence_matches'
  tool_name text not null,
  description text,
  
  -- Module linkage
  module_key text references modules(key) on delete restrict,
  
  -- Safety settings
  risk_level text check (risk_level in ('low', 'medium', 'high')) default 'low',
  requires_approval boolean default false,
  approval_required_for text[], -- e.g., ['delete', 'export', 'email']
  
  -- Input sanitization rules
  sanitize_inputs boolean default true,
  sensitive_fields text[], -- Fields to redact in audit logs
  
  -- Metadata
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed tool definitions
insert into tool_definitions (tool_key, tool_name, description, module_key, risk_level, requires_approval) values
  ('get_financial_records', 'Get Financial Records', 'Retrieves Pupil Premium and Sports Premium financial data', 'finance_bot', 'low', false),
  ('get_evidence_matches', 'Get Evidence Matches', 'Retrieves evidence matches for Ofsted subcategories', 'ofsted_inspector', 'low', false),
  ('delete_data', 'Delete Data', 'Permanently deletes organization data', 'core', 'high', true),
  ('export_data', 'Export Data', 'Exports organization data for GDPR requests', 'core', 'high', true),
  ('email_parent', 'Email Parent', 'Sends email to parent/guardian', 'stakeholder_voice', 'high', true)
on conflict (tool_key) do update set
  tool_name = excluded.tool_name,
  description = excluded.description,
  module_key = excluded.module_key,
  risk_level = excluded.risk_level,
  requires_approval = excluded.requires_approval;

create index tool_definitions_module_idx on tool_definitions (module_key);
create index tool_definitions_risk_idx on tool_definitions (risk_level) where risk_level = 'high';

-- Enable RLS
alter table tool_definitions enable row level security;

-- RLS: Everyone can view active tool definitions
create policy "Everyone can view active tool definitions"
  on tool_definitions
  for select
  using (is_active = true);

-- ============================================================================
-- HELPER FUNCTION: Check if organization has module access
-- ============================================================================

create or replace function organization_has_module(
  org_id uuid,
  module_key_param text
) returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from organization_modules
    where organization_id = org_id
      and module_key = module_key_param
      and enabled = true
      and (expires_at is null or expires_at > now())
  );
$$;

-- ============================================================================
-- HELPER FUNCTION: Get tools available to organization
-- ============================================================================

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
as $$
  select
    td.tool_key,
    td.tool_name,
    td.description,
    td.module_key,
    td.risk_level,
    td.requires_approval
  from tool_definitions td
  where td.is_active = true
    and (
      -- Core module is always available
      td.module_key = 'core'
      or
      -- Check if organization has purchased the module
      organization_has_module(org_id, td.module_key)
    )
  order by td.tool_name;
$$;


