-- ─── School Events: Unified timeline table ───────────────────────────────────
-- Unifies Trust Assessor / Ofsted Readiness / Lesson Studio event streams
-- into a single queryable timeline per organisation.

create table if not exists public.school_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  -- Event identity
  event_type text not null,
  event_category text not null check (event_category in (
    'leadership','curriculum','pupil_support','safeguarding',
    'finance','intervention','assessment','data_quality',
    'staffing','governance'
  )),
  severity text not null default 'info' check (severity in (
    'info','low','medium','high','critical'
  )),

  -- Timing
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),

  -- Content
  title text not null,
  description text,
  impact_summary text,

  -- Source & causality
  source_app text not null check (source_app in (
    'trust-assessor','ofsted-readiness','lesson-studio',
    'school-intelligence','governance','system','manual'
  )),
  source_entity_type text,
  source_entity_id uuid,
  triggered_by_event_id uuid references public.school_timeline_events(id) on delete set null,
  related_action_id uuid,

  -- Attribution
  actor_id text,
  actor_name text,

  -- Evidence & extensible metadata
  evidence jsonb,
  metadata jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',

  created_at timestamptz not null default now()
);

-- Performance indexes
create index if not exists school_tl_org_time
  on public.school_timeline_events (organization_id, occurred_at desc);

create index if not exists school_tl_category
  on public.school_timeline_events (event_category);

create index if not exists school_tl_severity
  on public.school_timeline_events (severity);

create index if not exists school_tl_source
  on public.school_timeline_events (source_app);

create index if not exists school_tl_related_action
  on public.school_timeline_events (related_action_id)
  where related_action_id is not null;

-- Partial index for fast per-school queries via metadata->>'school_urn'
create index if not exists school_tl_school_urn
  on public.school_timeline_events ((metadata->>'school_urn'), organization_id, occurred_at desc);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.school_timeline_events enable row level security;

-- Members of the organisation can read its events
-- Note: organization_members.auth_id is uuid; user_id is text (Firebase UID)
create policy school_tl_org_select on public.school_timeline_events
  for select using (
    organization_id in (
      select organization_id
      from public.organization_members
      where auth_id = auth.uid()
    )
  );

-- Members of the organisation can insert events
create policy school_tl_org_insert on public.school_timeline_events
  for insert with check (
    organization_id in (
      select organization_id
      from public.organization_members
      where auth_id = auth.uid()
    )
  );

-- Service role bypasses RLS automatically (no additional policy needed)
