-- PART 2: ASSESSMENTS, ACTIONS & EVIDENCE
-- Run after Part 1

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================

-- Ofsted Assessments
drop table if exists ofsted_assessments cascade;
create table ofsted_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  subcategory_id text references ofsted_subcategories(id) on delete cascade,
  school_rating text check (school_rating in ('exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement', 'not_assessed')),
  school_rationale text,
  ai_rating text check (ai_rating in ('exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement', 'not_assessed')),
  ai_rationale text,
  ai_confidence decimal(3,2),
  evidence_count integer default 0,
  evidence_quality_score decimal(3,2),
  assessed_by text references users(id),
  assessed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, subcategory_id)
);

-- Safeguarding Assessment
drop table if exists safeguarding_assessments cascade;
create table safeguarding_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  status text check (status in ('met', 'not_met', 'not_assessed')) default 'not_assessed',
  rationale text,
  scr_compliant boolean,
  dsl_trained boolean,
  staff_trained boolean,
  policy_current boolean,
  procedures_followed boolean,
  assessed_by text references users(id),
  assessed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id)
);

-- SIAMS Assessments
drop table if exists siams_assessments cascade;
create table siams_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  question_id text references siams_questions(id) on delete cascade,
  rating text check (rating in ('excellent', 'good', 'requires_improvement', 'ineffective', 'not_assessed')),
  rationale text,
  evidence_count integer default 0,
  assessed_by text references users(id),
  assessed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, question_id)
);

-- ============================================================================
-- ACTIONS
-- ============================================================================

drop table if exists actions cascade;
create table actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  framework_type text not null check (framework_type in ('ofsted', 'siams')),
  category_id text,
  subcategory_id text,
  title text not null,
  description text,
  success_criteria text,
  eef_strategy text,
  eef_impact_months decimal(3,1),
  priority text check (priority in ('critical', 'high', 'medium', 'low')) default 'medium',
  status text check (status in ('draft', 'approved', 'in_progress', 'completed', 'cancelled')) default 'draft',
  owner_id text references users(id),
  owner_name text,
  due_date date,
  completed_date date,
  approved_by text references users(id),
  approved_at timestamp with time zone,
  source text check (source in ('manual', 'ed_recommendation', 'scan_gap', 'observation')),
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index actions_organization_idx on actions (organization_id);
create index actions_category_idx on actions (framework_type, category_id);
create index actions_status_idx on actions (status);

-- ============================================================================
-- EVIDENCE & DOCUMENTS
-- ============================================================================

drop table if exists documents cascade;
create table documents (
  id bigserial primary key,
  organization_id uuid references organizations(id) on delete cascade,
  user_id text references users(id),
  name text not null,
  file_path text,
  file_type text,
  file_size bigint,
  provider text check (provider in ('local', 'google_drive', 'onedrive')),
  external_id text,
  web_view_link text,
  content text,
  content_hash text,
  embedding vector(1536),
  folder_path text,
  scanned_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index documents_organization_idx on documents (organization_id);

drop table if exists evidence_matches cascade;
create table evidence_matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  document_id bigint references documents(id) on delete cascade,
  framework_type text not null check (framework_type in ('ofsted', 'siams')),
  category_id text not null,
  subcategory_id text not null,
  confidence decimal(3,2) not null check (confidence >= 0 and confidence <= 1),
  matched_keywords text[],
  relevance_explanation text,
  key_quotes text[],
  strengths text[],
  gaps text[],
  suggestions text[],
  document_link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index evidence_matches_organization_idx on evidence_matches (organization_id);
create index evidence_matches_category_idx on evidence_matches (framework_type, category_id, subcategory_id);

-- Lesson Observations
drop table if exists lesson_observations cascade;
create table lesson_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  date date not null,
  teacher_name text not null,
  subject text,
  year_group text,
  focus_area text,
  duration_minutes integer,
  rating_subject_knowledge integer check (rating_subject_knowledge between 1 and 4),
  rating_pedagogical_skills integer check (rating_pedagogical_skills between 1 and 4),
  rating_adaptive_teaching integer check (rating_adaptive_teaching between 1 and 4),
  rating_assessment integer check (rating_assessment between 1 and 4),
  rating_behaviour integer check (rating_behaviour between 1 and 4),
  rating_engagement integer check (rating_engagement between 1 and 4),
  overall_judgement text check (overall_judgement in ('exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement')),
  strengths text,
  areas_for_development text,
  next_steps text,
  is_scheme_followed boolean default true,
  is_cpd_needed boolean default false,
  is_support_plan_needed boolean default false,
  linked_framework_area text,
  observer_id text references users(id),
  observer_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index observations_organization_idx on lesson_observations (organization_id);

-- Scan Jobs
drop table if exists scan_jobs cascade;
create table scan_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id text references users(id),
  source_type text check (source_type in ('local', 'google_drive', 'onedrive')),
  folder_path text,
  status text check (status in ('pending', 'scanning', 'analyzing', 'complete', 'error')) default 'pending',
  total_files integer default 0,
  processed_files integer default 0,
  evidence_matches_found integer default 0,
  results jsonb,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

SELECT 'Part 2 Complete - Assessments and Evidence tables created' as status;

