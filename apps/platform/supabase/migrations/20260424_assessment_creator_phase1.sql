create table if not exists assessment_creator_blueprints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  school_id text not null,
  class_id text not null,
  subject text not null check (subject in ('reading', 'writing', 'maths', 'science', 'spag')),
  year_group text not null check (year_group in ('EYFS', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6')),
  term text not null check (term in ('Autumn 1', 'Autumn 2', 'Spring 1', 'Spring 2', 'Summer 1', 'Summer 2')),
  mode text not null,
  status text not null default 'blueprint_review',
  duration_minutes integer not null,
  blend jsonb not null,
  objectives jsonb not null,
  pressure_rating integer not null,
  workload_rating integer not null,
  warnings jsonb not null default '[]'::jsonb,
  created_by text,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assessment_scan_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  assessment_id uuid not null references assessment_creator_blueprints(id) on delete cascade,
  status text not null default 'uploaded',
  storage_path text,
  page_count integer not null default 0,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists assessment_scan_pages (
  id uuid primary key default gen_random_uuid(),
  scan_batch_id uuid not null references assessment_scan_batches(id) on delete cascade,
  assessment_id uuid references assessment_creator_blueprints(id) on delete cascade,
  pupil_hash text,
  page_number integer,
  storage_path text,
  match_confidence numeric not null default 0,
  status text not null default 'unmatched',
  created_at timestamptz not null default now()
);

create table if not exists assessment_marking_proposals (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessment_creator_blueprints(id) on delete cascade,
  question_id text not null,
  pupil_hash text not null,
  proposed_marks numeric not null,
  max_marks numeric not null,
  confidence numeric not null,
  rationale text not null,
  misconception_tag text,
  teacher_decision text not null default 'pending',
  teacher_marks numeric,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists assessment_evidence_passports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  school_id text not null,
  class_id text not null,
  assessment_id uuid not null references assessment_creator_blueprints(id) on delete cascade,
  subject text not null,
  year_group text not null,
  evidence_confidence text not null,
  confidence_reasons jsonb not null default '[]'::jsonb,
  objective_coverage numeric not null default 0,
  marking_review_completion numeric not null default 0,
  unresolved_uncertainty numeric not null default 0,
  next_teaching_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assessment_blueprints_org on assessment_creator_blueprints(organization_id);
create index if not exists idx_assessment_scan_batches_assessment on assessment_scan_batches(assessment_id);
create index if not exists idx_assessment_scan_pages_batch on assessment_scan_pages(scan_batch_id);
create index if not exists idx_assessment_marking_assessment on assessment_marking_proposals(assessment_id);
create index if not exists idx_assessment_passports_assessment on assessment_evidence_passports(assessment_id);
