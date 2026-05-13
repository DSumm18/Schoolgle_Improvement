-- Assessment Intelligence Spine
-- Canonical source-labelled assessment batches and pupil-level assessment events.
-- Original files remain in Drive/SharePoint/MIS exports; this stores the validated
-- Schoolgle assessment intelligence layer.

create table if not exists assessment_source_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  school_id uuid,
  school_urn integer,
  source_kind text not null check (
    source_kind in (
      'manual_snapshot',
      'assessment_creator',
      'ctf_import',
      'mis_import',
      'spreadsheet_import',
      'lesson_studio',
      'dfe_validated'
    )
  ),
  source_label text not null,
  source_table text,
  source_id text,
  file_name text,
  assessment_period text not null,
  academic_year_start integer not null,
  assessment_date date,
  locked_at timestamptz,
  locked_by text,
  validation_tier text not null check (
    validation_tier in (
      'teacher_locked',
      'teacher_reviewed_ai',
      'imported_external',
      'dfe_validated',
      'draft'
    )
  ),
  notes text,
  raw_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pupil_assessment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  school_urn integer,
  source_batch_id uuid not null references assessment_source_batches(id) on delete cascade,
  source_kind text not null check (
    source_kind in (
      'manual_snapshot',
      'assessment_creator',
      'ctf_import',
      'mis_import',
      'spreadsheet_import',
      'lesson_studio',
      'dfe_validated'
    )
  ),
  source_label text not null,
  validation_tier text not null check (
    validation_tier in (
      'teacher_locked',
      'teacher_reviewed_ai',
      'imported_external',
      'dfe_validated',
      'draft'
    )
  ),
  pupil_hash text not null,
  pupil_ref_hash_method text not null default 'HMAC-SHA256(pupil_ref, organization_id)',
  current_pupil_profile_id uuid,
  class_id text,
  class_name text,
  year_group_at_assessment text not null,
  current_year_group text,
  academic_year_start integer not null,
  assessment_period text not null,
  assessment_date date not null,
  subject text not null check (subject in ('reading', 'writing', 'maths', 'science', 'spag')),
  framework text not null default 'teacher_judgement',
  raw_level text,
  canonical_level text not null check (
    canonical_level in (
      'below_expected',
      'working_towards',
      'expected',
      'greater_depth',
      'unknown'
    )
  ),
  is_at_expected boolean not null default false,
  is_greater_depth boolean not null default false,
  scaled_score numeric,
  raw_score numeric,
  max_score numeric,
  teacher_comment text,
  voice_transcript text,
  comment_summary text,
  uncertainty_flag boolean not null default false,
  moderation_status text not null default 'not_moderated' check (
    moderation_status in (
      'not_moderated',
      'needs_moderation',
      'moderated',
      'challenged',
      'confirmed'
    )
  ),
  evidence_confidence text not null default 'medium' check (
    evidence_confidence in ('high', 'medium', 'low', 'mismatch')
  ),
  teacher_decision text,
  teacher_marks numeric,
  locked_by text,
  locked_at timestamptz,
  raw_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_pupil_assessment_events_source_unique
  on pupil_assessment_events (
    organization_id,
    source_batch_id,
    pupil_hash,
    subject,
    assessment_period,
    academic_year_start
  );

create index if not exists idx_assessment_source_batches_org
  on assessment_source_batches (organization_id, academic_year_start, assessment_period);

create index if not exists idx_assessment_source_batches_school_urn
  on assessment_source_batches (school_urn);

create index if not exists idx_pupil_assessment_events_org_period
  on pupil_assessment_events (organization_id, academic_year_start, assessment_period);

create index if not exists idx_pupil_assessment_events_school_subject
  on pupil_assessment_events (school_urn, subject, academic_year_start);

create index if not exists idx_pupil_assessment_events_pupil
  on pupil_assessment_events (organization_id, pupil_hash, academic_year_start);

create index if not exists idx_pupil_assessment_events_class
  on pupil_assessment_events (organization_id, class_id, subject, academic_year_start);

alter table assessment_source_batches enable row level security;
alter table pupil_assessment_events enable row level security;

drop policy if exists "Service role manages assessment source batches" on assessment_source_batches;
create policy "Service role manages assessment source batches"
  on assessment_source_batches
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role manages pupil assessment events" on pupil_assessment_events;
create policy "Service role manages pupil assessment events"
  on pupil_assessment_events
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Authenticated users read assessment source batches" on assessment_source_batches;
create policy "Authenticated users read assessment source batches"
  on assessment_source_batches
  for select
  to authenticated
  using (
    exists (
      select 1
      from organization_members om
      where om.organization_id = assessment_source_batches.organization_id
        and om.auth_id = auth.uid()
    )
  );

drop policy if exists "Authenticated users read pupil assessment events" on pupil_assessment_events;
create policy "Authenticated users read pupil assessment events"
  on pupil_assessment_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from organization_members om
      where om.organization_id = pupil_assessment_events.organization_id
        and om.auth_id = auth.uid()
    )
  );

grant select on assessment_source_batches to authenticated;
grant select on pupil_assessment_events to authenticated;
grant all on assessment_source_batches to service_role;
grant all on pupil_assessment_events to service_role;
