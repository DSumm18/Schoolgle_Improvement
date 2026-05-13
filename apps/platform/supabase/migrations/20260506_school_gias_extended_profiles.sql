create table if not exists public.school_gias_extended_profiles (
  urn integer primary key,
  school_name text,
  sen_provision_type text,
  resourced_provision_type text,
  resourced_provision_on_roll integer,
  resourced_provision_capacity integer,
  sen_unit_on_roll integer,
  sen_unit_capacity integer,
  gias_last_confirmed date,
  source_url text not null,
  source_method text not null check (source_method in ('bulk_export', 'gias_page_scrape', 'manual_verified')),
  source_fetched_at timestamptz not null default now(),
  confidence_status text not null check (confidence_status in ('verified', 'missing', 'conflicting', 'stale', 'manual_verified')),
  validation_notes jsonb not null default '[]'::jsonb,
  raw_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_school_gias_extended_profiles_confidence
  on public.school_gias_extended_profiles(confidence_status);

create index if not exists idx_school_gias_extended_profiles_source_method
  on public.school_gias_extended_profiles(source_method);

create index if not exists idx_school_gias_extended_profiles_source_fetched_at
  on public.school_gias_extended_profiles(source_fetched_at);

create index if not exists idx_school_gias_extended_profiles_gias_last_confirmed
  on public.school_gias_extended_profiles(gias_last_confirmed);

create index if not exists idx_school_gias_extended_profiles_provision_type
  on public.school_gias_extended_profiles(resourced_provision_type)
  where resourced_provision_type is not null;

alter table public.school_gias_extended_profiles enable row level security;

drop policy if exists "service role manages school gias extended profiles" on public.school_gias_extended_profiles;
create policy "service role manages school gias extended profiles"
  on public.school_gias_extended_profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select on public.school_gias_extended_profiles to authenticated;
grant all on public.school_gias_extended_profiles to service_role;
