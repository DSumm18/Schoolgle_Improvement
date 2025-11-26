-- PART 3: STATUTORY DOCUMENTS & OPERATIONS
-- Run after Part 2

-- ============================================================================
-- STATUTORY DOCUMENTS
-- ============================================================================

drop table if exists statutory_documents cascade;
create table statutory_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  document_type text not null check (document_type in ('sef', 'siams_sef', 'sdp', 'pp_strategy', 'sports_premium', 'accessibility', 'behaviour_policy', 'other')),
  title text not null,
  academic_year text,
  content jsonb not null default '{}',
  version integer default 1,
  is_current boolean default true,
  previous_version_id uuid references statutory_documents(id),
  status text check (status in ('draft', 'review', 'approved', 'published', 'archived')) default 'draft',
  is_published_to_website boolean default false,
  website_publish_date timestamp with time zone,
  created_by text references users(id),
  reviewed_by text references users(id),
  reviewed_at timestamp with time zone,
  approved_by text references users(id),
  approved_at timestamp with time zone,
  deadline_date date,
  reminder_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index statutory_docs_organization_idx on statutory_documents (organization_id);

-- Pupil Premium Data
drop table if exists pupil_premium_data cascade;
create table pupil_premium_data (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null,
  total_pupils integer,
  pp_pupils integer,
  pp_percentage decimal(5,2),
  pp_allocation decimal(12,2),
  recovery_premium decimal(12,2),
  total_funding decimal(12,2),
  barriers jsonb,
  outcomes jsonb,
  pp_attendance decimal(5,2),
  non_pp_attendance decimal(5,2),
  pp_persistent_absence decimal(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, academic_year)
);

-- PP Spending
drop table if exists pp_spending cascade;
create table pp_spending (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null,
  tier integer not null check (tier in (1, 2, 3)),
  activity_name text not null,
  description text,
  eef_strategy_id text,
  eef_impact_months decimal(3,1),
  allocated_amount decimal(10,2),
  actual_spent decimal(10,2),
  barrier_ids text[],
  intended_outcomes text,
  success_criteria text,
  actual_impact text,
  impact_rating text check (impact_rating in ('high', 'moderate', 'low', 'not_measured')),
  staff_lead text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sports Premium
drop table if exists sports_premium_data cascade;
create table sports_premium_data (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null,
  allocation decimal(10,2),
  carried_forward decimal(10,2),
  total_available decimal(10,2),
  swimming_25m_percentage decimal(5,2),
  swimming_strokes_percentage decimal(5,2),
  swimming_rescue_percentage decimal(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, academic_year)
);

drop table if exists sports_premium_spending cascade;
create table sports_premium_spending (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null,
  key_indicator integer not null check (key_indicator in (1, 2, 3, 4, 5)),
  activity_name text not null,
  description text,
  allocated_amount decimal(10,2),
  actual_spent decimal(10,2),
  intended_impact text,
  actual_impact text,
  is_sustainable boolean default false,
  sustainability_plan text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SDP
drop table if exists sdp_priorities cascade;
create table sdp_priorities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null,
  priority_number integer not null,
  title text not null,
  description text,
  rationale text,
  ofsted_category_id text,
  siams_strand_id text,
  lead_person text,
  lead_user_id text references users(id),
  success_criteria text[],
  allocated_budget decimal(10,2),
  status text check (status in ('not_started', 'in_progress', 'on_track', 'at_risk', 'completed')) default 'not_started',
  progress_percentage integer default 0 check (progress_percentage between 0 and 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop table if exists sdp_milestones cascade;
create table sdp_milestones (
  id uuid primary key default gen_random_uuid(),
  priority_id uuid references sdp_priorities(id) on delete cascade,
  title text not null,
  description text,
  target_term text check (target_term in ('autumn1', 'autumn2', 'spring1', 'spring2', 'summer1', 'summer2')),
  target_date date,
  status text check (status in ('pending', 'in_progress', 'completed', 'missed')) default 'pending',
  completion_date date,
  completion_evidence text,
  rag_status text check (rag_status in ('green', 'amber', 'red')) default 'green',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

SELECT 'Part 3 Complete - Statutory Documents tables created' as status;

