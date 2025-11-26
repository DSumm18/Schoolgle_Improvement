-- PART 4: OPERATIONS & MODULES
-- Run after Part 3

-- ============================================================================
-- NOTES & ACTIVITY
-- ============================================================================

drop table if exists notes cascade;
create table notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('action', 'assessment', 'observation', 'document', 'priority', 'milestone', 'meeting', 'general')),
  entity_id text not null,
  content text not null,
  is_private boolean default false,
  author_id text references users(id),
  author_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index notes_entity_idx on notes (entity_type, entity_id);

drop table if exists activity_log cascade;
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  action_type text not null check (action_type in ('create', 'update', 'delete', 'approve', 'complete', 'assign', 'comment', 'upload', 'scan', 'generate')),
  entity_type text not null,
  entity_id text,
  entity_name text,
  description text,
  changes jsonb,
  user_id text references users(id),
  user_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index activity_log_organization_idx on activity_log (organization_id);
create index activity_log_date_idx on activity_log (created_at desc);

-- ============================================================================
-- MEETINGS
-- ============================================================================

drop table if exists meetings cascade;
create table meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  title text not null,
  meeting_type text check (meeting_type in ('governors', 'slt', 'staff', 'department', 'phase', 'other')),
  date date not null,
  start_time time,
  end_time time,
  location text,
  attendees text[],
  apologies text[],
  agenda text,
  minutes text,
  transcript text,
  ai_summary text,
  status text check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')) default 'scheduled',
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop table if exists meeting_actions cascade;
create table meeting_actions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  action_id uuid references actions(id) on delete cascade,
  minute_reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- MONITORING & CPD
-- ============================================================================

drop table if exists monitoring_visits cascade;
create table monitoring_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  visit_type text not null check (visit_type in ('learning_walk', 'book_look', 'pupil_voice', 'deep_dive', 'environment_walk', 'other')),
  title text not null,
  date date not null,
  focus_area text,
  framework_link text,
  subject text,
  year_groups text[],
  strengths text[],
  areas_for_development text[],
  key_observations text,
  follow_up_actions text[],
  follow_up_date date,
  conducted_by text[],
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop table if exists cpd_records cascade;
create table cpd_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  title text not null,
  provider text,
  cpd_type text check (cpd_type in ('course', 'webinar', 'inset', 'coaching', 'reading', 'peer_observation', 'other')),
  date date,
  duration_hours decimal(4,1),
  attendee_ids text[],
  attendee_names text[],
  cost decimal(10,2),
  funded_by text,
  framework_link text,
  eef_strategy text,
  sdp_priority_id uuid references sdp_priorities(id),
  intended_impact text,
  actual_impact text,
  impact_rating text check (impact_rating in ('high', 'medium', 'low', 'not_measured')),
  certificate_url text,
  notes text,
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- POLICIES, SURVEYS, RISKS
-- ============================================================================

drop table if exists reminders cascade;
create table reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  title text not null,
  description text,
  entity_type text,
  entity_id text,
  due_date date not null,
  reminder_date date,
  assigned_to text references users(id),
  assigned_to_name text,
  is_recurring boolean default false,
  recurrence_pattern text,
  status text check (status in ('pending', 'sent', 'acknowledged', 'completed', 'snoozed')) default 'pending',
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop table if exists policies cascade;
create table policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  category text check (category in ('safeguarding', 'curriculum', 'behaviour', 'hr', 'health_safety', 'governance', 'finance', 'admissions', 'send', 'other')),
  version text,
  document_url text,
  last_reviewed date,
  next_review date,
  review_frequency_months integer default 12,
  approved_by text,
  approved_date date,
  is_statutory boolean default false,
  statutory_reference text,
  status text check (status in ('current', 'under_review', 'expired', 'archived')) default 'current',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop table if exists surveys cascade;
create table surveys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  title text not null,
  survey_type text check (survey_type in ('pupil_voice', 'parent_survey', 'staff_survey', 'governor_survey', 'other')),
  start_date date,
  end_date date,
  questions jsonb,
  response_count integer default 0,
  ai_summary text,
  sentiment_score decimal(3,2),
  key_themes text[],
  framework_links text[],
  status text check (status in ('draft', 'active', 'closed', 'analyzed')) default 'draft',
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop table if exists survey_responses cascade;
create table survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references surveys(id) on delete cascade,
  responses jsonb not null,
  respondent_type text,
  year_group text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop table if exists external_visits cascade;
create table external_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  visitor_type text check (visitor_type in ('la_advisor', 'diocese', 'mat_visit', 'consultant', 'ofsted', 'siams', 'peer_review', 'other')),
  visitor_name text,
  visitor_organization text,
  date date not null,
  focus_areas text[],
  framework_links text[],
  report_summary text,
  strengths text[],
  areas_for_development text[],
  recommendations text[],
  report_url text,
  follow_up_required boolean default false,
  follow_up_date date,
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop table if exists risks cascade;
create table risks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  title text not null,
  description text,
  category text check (category in ('safeguarding', 'financial', 'operational', 'reputational', 'compliance', 'staffing', 'educational', 'health_safety', 'other')),
  likelihood integer check (likelihood between 1 and 5),
  impact integer check (impact between 1 and 5),
  risk_score integer generated always as (likelihood * impact) stored,
  current_controls text,
  additional_actions text,
  risk_owner text,
  risk_owner_id text references users(id),
  status text check (status in ('open', 'mitigated', 'closed', 'accepted')) default 'open',
  last_reviewed date,
  next_review date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

SELECT 'Part 4 Complete - Operations tables created' as status;

