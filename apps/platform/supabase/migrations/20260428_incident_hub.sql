-- Incident Hub core schema
-- Cross-module register for school/trust incidents, audit trail, tasks, documents and meetings.

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  school_id uuid null references public.organizations(id) on delete set null,
  reference text not null,
  title text not null,
  summary text,
  type text not null,
  status text not null default 'new',
  risk_level text not null default 'medium' check (risk_level in ('low', 'medium', 'high', 'critical')),
  risk_score integer not null default 2,
  owner_label text,
  owner_user_id uuid null,
  reported_by_user_id uuid not null,
  reported_by_name text,
  occurred_at timestamptz,
  logged_at timestamptz not null default now(),
  due_at timestamptz,
  waiting_for text,
  next_action text,
  escalation_level text not null default 'school' check (escalation_level in ('school', 'trust_visible', 'trust_led', 'external_reportable')),
  recommended_document_slug text,
  recommended_document_name text,
  metadata jsonb not null default '{}'::jsonb,
  closed_at timestamptz,
  closed_by_user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference)
);

create index if not exists idx_incidents_org_created
  on public.incidents (organization_id, created_at desc);

create index if not exists idx_incidents_org_status
  on public.incidents (organization_id, status);

create index if not exists idx_incidents_org_risk
  on public.incidents (organization_id, risk_level);

create table if not exists public.incident_chronology (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid null,
  actor_name text,
  action text not null,
  detail text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_incident_chronology_incident_created
  on public.incident_chronology (incident_id, created_at desc);

create table if not exists public.incident_notes (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_user_id uuid not null,
  author_name text,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_incident_notes_incident_created
  on public.incident_notes (incident_id, created_at desc);

create table if not exists public.incident_tasks (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid null,
  title text not null,
  status text not null default 'open',
  owner_label text,
  owner_user_id uuid null,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.incident_documents (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid null,
  template_slug text,
  template_name text,
  status text not null default 'recommended',
  created_at timestamptz not null default now()
);

create table if not exists public.incident_meetings (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  meeting_id uuid null,
  meeting_template_id text,
  meeting_title text,
  status text not null default 'recommended',
  created_at timestamptz not null default now()
);

create table if not exists public.incident_people (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  person_type text not null,
  display_name text,
  role_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_risk_assessments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  severity integer not null default 1,
  likelihood integer not null default 1,
  vulnerability integer not null default 1,
  compliance_exposure integer not null default 1,
  reputational_impact integer not null default 1,
  risk_score integer not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  explanation text,
  assessed_by_user_id uuid null,
  created_at timestamptz not null default now()
);

alter table public.incidents enable row level security;
alter table public.incident_chronology enable row level security;
alter table public.incident_notes enable row level security;
alter table public.incident_tasks enable row level security;
alter table public.incident_documents enable row level security;
alter table public.incident_meetings enable row level security;
alter table public.incident_people enable row level security;
alter table public.incident_risk_assessments enable row level security;

