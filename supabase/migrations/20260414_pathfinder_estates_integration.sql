-- Persist approved Pathfinder site models so Estates assets, locations, QR scans,
-- and helpdesk tickets can reference the same operational map.

create table if not exists public.estates_pathfinder_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null default 'Pathfinder site model',
  status text not null default 'draft'
    check (status in ('draft', 'school_review', 'approved', 'published')),
  source_document_url text,
  source_document_name text,
  extraction_result jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_estates_pathfinder_models_org_updated
  on public.estates_pathfinder_models (organization_id, updated_at desc);

create index if not exists idx_estates_pathfinder_models_org_status
  on public.estates_pathfinder_models (organization_id, status);

alter table public.estates_pathfinder_models enable row level security;

drop policy if exists "Pathfinder models are visible to organization members"
  on public.estates_pathfinder_models;
create policy "Pathfinder models are visible to organization members"
  on public.estates_pathfinder_models
  for select
  using (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = estates_pathfinder_models.organization_id
        and om.user_id = auth.uid()
    )
  );

drop policy if exists "Pathfinder models are editable by organization staff"
  on public.estates_pathfinder_models;
create policy "Pathfinder models are editable by organization staff"
  on public.estates_pathfinder_models
  for all
  using (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = estates_pathfinder_models.organization_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'headteacher', 'slt', 'teacher', 'caretaker')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = estates_pathfinder_models.organization_id
        and om.user_id = auth.uid()
        and om.role in ('admin', 'headteacher', 'slt', 'teacher', 'caretaker')
    )
  );

