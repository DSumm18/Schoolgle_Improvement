-- Schoolgle Improvement - Complete Database Schema
-- Updated for Ofsted November 2025 Framework
-- Run this in Supabase SQL Editor

-- Enable the pgvector extension for embeddings
create extension if not exists vector;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (maps Firebase users)
drop table if exists users cascade;
create table users (
  id text primary key, -- Firebase UID
  auth_id uuid unique, -- Canonical Supabase Auth ID
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index users_auth_id_idx on users (auth_id);

-- Organizations (Schools)
drop table if exists organizations cascade;
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  urn text, -- Unique Reference Number (DfE)
  school_type text, -- 'primary', 'secondary', 'special', 'nursery', 'all-through'
  is_church_school boolean default false, -- If true, SIAMS applies
  diocese text, -- For church schools
  local_authority text,
  address jsonb,
  settings jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organization Members
drop table if exists organization_members cascade;
create table organization_members (
  organization_id uuid references organizations(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  auth_id uuid, -- Canonical Supabase Auth ID
  role text not null check (role in ('admin', 'slt', 'teacher', 'governor', 'viewer')),
  job_title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (organization_id, user_id)
);

create index org_members_auth_id_idx on organization_members (organization_id, auth_id);

-- Invitations
drop table if exists invitations cascade;
create table invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  organization_id uuid references organizations(id) on delete cascade,
  role text not null check (role in ('admin', 'slt', 'teacher', 'governor', 'viewer')),
  token uuid default gen_random_uuid(),
  invited_by text references users(id),
  status text default 'pending' check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '7 days') not null
);

-- ============================================================================
-- OFSTED FRAMEWORK (November 2025)
-- ============================================================================

-- Ofsted Framework Categories (6 main areas + Safeguarding)
drop table if exists ofsted_categories cascade;
create table ofsted_categories (
  id text primary key,
  name text not null,
  description text,
  color text,
  guidance_summary text,
  guidance_link text,
  display_order integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed Ofsted Categories (November 2025 Framework)
insert into ofsted_categories (id, name, description, color, display_order) values
  ('inclusion', 'Inclusion', 'How well the school ensures all pupils receive the support they need', 'teal', 1),
  ('curriculum-teaching', 'Curriculum and Teaching', 'The quality, breadth and ambition of the curriculum and how effectively it is taught', 'rose', 2),
  ('achievement', 'Achievement', 'The outcomes pupils achieve and the progress they make', 'blue', 3),
  ('attendance-behaviour', 'Attendance and Behaviour', 'Pupils attendance, behaviour, attitudes to learning and conduct', 'orange', 4),
  ('personal-development', 'Personal Development and Well-being', 'The broader development of pupils as individuals and citizens', 'violet', 5),
  ('leadership-governance', 'Leadership and Governance', 'The effectiveness of leadership at all levels including governance', 'gray', 6),
  ('safeguarding', 'Safeguarding', 'The effectiveness of safeguarding arrangements (assessed separately)', 'red', 7)
on conflict (id) do nothing;

-- Ofsted Subcategories
drop table if exists ofsted_subcategories cascade;
create table ofsted_subcategories (
  id text primary key,
  category_id text references ofsted_categories(id) on delete cascade,
  name text not null,
  description text,
  display_order integer,
  key_indicators text[],
  inspection_focus text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed Ofsted Subcategories
insert into ofsted_subcategories (id, category_id, name, description, display_order, key_indicators) values
  -- Inclusion
  ('inclusion-send', 'inclusion', 'SEND Provision', 'Support for pupils with special educational needs and disabilities', 1, 
   ARRAY['Pupils with SEND achieve well', 'Early identification is effective', 'High-quality targeted support', 'Staff trained for SEND']),
  ('inclusion-disadvantaged', 'inclusion', 'Disadvantaged Pupils', 'Support and outcomes for disadvantaged pupils', 2,
   ARRAY['Disadvantaged achieve as well as others nationally', 'Gaps are closing', 'PP strategy is evidence-based', 'Barriers addressed effectively']),
  ('inclusion-mental-health', 'inclusion', 'Mental Health & Wellbeing Support', 'Support for pupils with mental health needs', 3,
   ARRAY['Mental health needs identified early', 'Effective support systems', 'Staff trained to recognise signs', 'Pupils know how to access support']),
  
  -- Curriculum and Teaching
  ('curriculum-intent', 'curriculum-teaching', 'Curriculum Intent', 'The design and ambition of the curriculum', 1,
   ARRAY['Curriculum is ambitious for all', 'Clear progression of knowledge', 'National Curriculum coverage secure', 'Local context reflected']),
  ('curriculum-implementation', 'curriculum-teaching', 'Teaching Quality', 'How effectively the curriculum is taught', 2,
   ARRAY['Strong subject knowledge', 'Effective pedagogy', 'Assessment used to adapt teaching', 'Teaching adapted for learners']),
  ('curriculum-reading', 'curriculum-teaching', 'Reading and Literacy', 'The teaching of reading including phonics', 3,
   ARRAY['Validated SSP implemented with fidelity', 'Books matched to phonics knowledge', 'Rapid intervention', 'Strong phonics outcomes']),
  
  -- Achievement
  ('achievement-outcomes', 'achievement', 'Academic Outcomes', 'Attainment and progress in national assessments', 1,
   ARRAY['Outcomes at least in line with national', 'Strong progress from starting points', 'All groups achieve well', 'Improving over time']),
  ('achievement-progress', 'achievement', 'Progress from Starting Points', 'How well pupils progress relative to their starting points', 2,
   ARRAY['Strong progress from starting points', 'Consistent across curriculum', 'Lower attainers catch up', 'Higher attainers stretched']),
  ('achievement-destinations', 'achievement', 'Preparation for Next Stage', 'How well pupils are prepared for next stage of education', 3,
   ARRAY['Well-prepared for next stage', 'Effective transition', 'Academic and personal readiness']),
  
  -- Attendance and Behaviour
  ('attendance-overall', 'attendance-behaviour', 'Attendance', 'Overall attendance and persistent absence rates', 1,
   ARRAY['Attendance at least 96%', 'Persistent absence reducing', 'Same-day response', 'Gaps closing for disadvantaged']),
  ('behaviour-conduct', 'attendance-behaviour', 'Behaviour and Conduct', 'Behaviour in lessons and around school', 2,
   ARRAY['High expectations consistently applied', 'Behaviour at least good', 'Low-level disruption rare', 'Exclusions low']),
  ('behaviour-attitudes', 'attendance-behaviour', 'Attitudes to Learning', 'Pupils engagement and attitudes in lessons', 3,
   ARRAY['Pupils engaged and focused', 'Positive attitudes', 'Pride in work', 'Resilience when challenged']),
  
  -- Personal Development
  ('pd-character', 'personal-development', 'Character and Resilience', 'Development of character, confidence and resilience', 1,
   ARRAY['Character explicitly developed', 'Pupils show resilience', 'Confidence built', 'Self-regulation']),
  ('pd-citizenship', 'personal-development', 'Citizenship and British Values', 'Preparation for life in modern Britain', 2,
   ARRAY['British Values embedded', 'Understand democracy', 'Respect diversity', 'Prepared for modern Britain']),
  ('pd-enrichment', 'personal-development', 'Enrichment and Wider Opportunities', 'Extra-curricular and enrichment provision', 3,
   ARRAY['Rich enrichment offer', 'All can access', 'Builds cultural capital', 'Develops talents']),
  ('pd-rse', 'personal-development', 'RSE and Health Education', 'Relationships, sex and health education', 4,
   ARRAY['Statutory RSE delivered', 'Age-appropriate', 'Parents consulted', 'Healthy relationships understood']),
  
  -- Leadership and Governance
  ('leadership-vision', 'leadership-governance', 'Vision and Strategy', 'Clarity and ambition of school vision', 1,
   ARRAY['Clear ambitious vision', 'Staff share vision', 'Accurate self-evaluation', 'Right priorities']),
  ('leadership-governance', 'leadership-governance', 'Governance', 'Effectiveness of governance and oversight', 2,
   ARRAY['Governors know school well', 'Effective challenge', 'Hold leaders to account', 'Statutory duties fulfilled']),
  ('leadership-staff', 'leadership-governance', 'Staff Development and Wellbeing', 'How leaders develop staff and manage workload', 3,
   ARRAY['Effective CPD', 'Workload manageable', 'Wellbeing prioritised', 'High morale']),
  ('leadership-engagement', 'leadership-governance', 'Parent and Community Engagement', 'Relationships with parents and community', 4,
   ARRAY['Strong parent partnerships', 'Effective communication', 'Parents engaged in learning', 'Complaints handled well']),
  
  -- Safeguarding (assessed separately)
  ('safeguarding-culture', 'safeguarding', 'Safeguarding Culture', 'Embedded culture of safeguarding', 1,
   ARRAY['Culture embedded', 'All staff know how to report', 'DSL arrangements robust', 'Pupils feel safe']),
  ('safeguarding-systems', 'safeguarding', 'Safeguarding Systems', 'Policies, procedures and record keeping', 2,
   ARRAY['SCR compliant', 'Referrals timely', 'Effective recording', 'Clear procedures'])
on conflict (id) do nothing;

-- Evidence Requirements for each subcategory
drop table if exists evidence_requirements cascade;
create table evidence_requirements (
  id uuid primary key default gen_random_uuid(),
  subcategory_id text references ofsted_subcategories(id) on delete cascade,
  name text not null,
  description text,
  importance text check (importance in ('critical', 'important', 'recommended')),
  eef_link text, -- Link to EEF strategy if applicable
  display_order integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- SIAMS FRAMEWORK (for Church Schools)
-- ============================================================================

drop table if exists siams_strands cascade;
create table siams_strands (
  id text primary key,
  name text not null,
  short_name text,
  description text,
  color text,
  display_order integer,
  key_indicators text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed SIAMS Strands
insert into siams_strands (id, name, short_name, description, color, display_order, key_indicators) values
  ('vision', 'Vision and Leadership', 'Vision', 'How the school''s Christian vision drives its work', 'purple', 1,
   ARRAY['Vision is theologically rooted', 'Vision drives all policies', 'All can articulate vision', 'Foundation governors effective']),
  ('wisdom', 'Wisdom, Knowledge and Skills', 'Curriculum', 'Curriculum and spiritual development', 'blue', 2,
   ARRAY['Curriculum reflects vision', 'Spiritual development planned', 'All make good progress', 'Prepares for modern Britain']),
  ('character', 'Character Development', 'Character', 'Hope, aspiration and courageous advocacy', 'orange', 3,
   ARRAY['Character education linked to vision', 'Pupils demonstrate hope', 'Active social action', 'Ethical reasoning articulated']),
  ('community', 'Community and Living Well Together', 'Community', 'Relationships and mental health', 'teal', 4,
   ARRAY['Relationships exemplify Christian values', 'Wellbeing prioritised', 'Strong church partnership', 'Genuinely inclusive']),
  ('dignity', 'Dignity and Respect', 'Dignity', 'Valuing all God''s children', 'rose', 5,
   ARRAY['All treated with dignity', 'Prejudice actively challenged', 'Diversity celebrated', 'Protected characteristics taught']),
  ('worship', 'Impact of Collective Worship', 'Worship', 'Inclusive and inspiring worship', 'violet', 6,
   ARRAY['Worship is central', 'Distinctively Christian', 'Inclusive and invitational', 'Pupils lead worship']),
  ('re', 'Effectiveness of Religious Education', 'RE', 'High quality RE teaching', 'emerald', 7,
   ARRAY['Meets Statement of Entitlement', 'High-quality teaching', 'Strong outcomes', 'Engages with big questions'])
on conflict (id) do nothing;

-- SIAMS Inspection Questions
drop table if exists siams_questions cascade;
create table siams_questions (
  id text primary key,
  strand_id text references siams_strands(id) on delete cascade,
  question text not null,
  guidance text,
  display_order integer,
  evidence_required text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- ASSESSMENTS (School self-evaluation)
-- ============================================================================

-- Ofsted Assessments
drop table if exists ofsted_assessments cascade;
create table ofsted_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  subcategory_id text references ofsted_subcategories(id) on delete cascade,
  
  -- School's self-assessment (NEW 5-point scale)
  school_rating text check (school_rating in ('exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement', 'not_assessed')),
  school_rationale text,
  
  -- AI-generated assessment
  ai_rating text check (ai_rating in ('exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement', 'not_assessed')),
  ai_rationale text,
  ai_confidence decimal(3,2),
  
  -- Evidence counts
  evidence_count integer default 0,
  evidence_quality_score decimal(3,2),
  
  -- Metadata
  assessed_by text references users(id),
  assessed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(organization_id, subcategory_id)
);

-- Safeguarding Assessment (separate binary Met/Not Met)
drop table if exists safeguarding_assessments cascade;
create table safeguarding_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  status text check (status in ('met', 'not_met', 'not_assessed')) default 'not_assessed',
  rationale text,
  
  -- Checklist items
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
  
  -- SIAMS uses: Excellent, Good, Requires Improvement, Ineffective
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
-- ACTIONS (linked to framework areas)
-- ============================================================================

drop table if exists actions cascade;
create table actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- What framework area is this action for?
  framework_type text not null check (framework_type in ('ofsted', 'siams')),
  category_id text, -- ofsted_categories.id or siams_strands.id
  subcategory_id text, -- ofsted_subcategories.id or siams_questions.id
  
  -- Action details
  title text not null,
  description text,
  success_criteria text,
  
  -- EEF Research backing
  eef_strategy text,
  eef_impact_months decimal(3,1),
  
  -- Priority and status
  priority text check (priority in ('critical', 'high', 'medium', 'low')) default 'medium',
  status text check (status in ('draft', 'approved', 'in_progress', 'completed', 'cancelled')) default 'draft',
  
  -- Assignment
  owner_id text references users(id),
  owner_name text,
  
  -- Dates
  due_date date,
  completed_date date,
  
  -- Approval workflow
  approved_by text references users(id),
  approved_at timestamp with time zone,
  
  -- Source (who/what created this action)
  source text check (source in ('manual', 'ed_recommendation', 'scan_gap', 'observation')),
  
  created_by text references users(id),
  auth_id uuid, -- Canonical Supabase Auth ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index actions_organization_idx on actions (organization_id);
create index actions_category_idx on actions (framework_type, category_id);
create index actions_status_idx on actions (status);
create index actions_owner_idx on actions (owner_id);
create index actions_auth_id_idx on actions (auth_id);

-- ============================================================================
-- EVIDENCE (Documents and matches)
-- ============================================================================

-- Documents stored/scanned
drop table if exists documents cascade;
create table documents (
  id bigserial primary key,
  organization_id uuid references organizations(id) on delete cascade,
  user_id text references users(id),
  
  -- File info
  name text not null,
  file_path text, -- Local path or cloud path
  file_type text, -- mime type
  file_size bigint,
  
  -- For cloud files
  provider text check (provider in ('local', 'google_drive', 'onedrive')),
  external_id text, -- Google/OneDrive file ID
  web_view_link text,
  
  -- Content (for search/matching)
  content text,
  content_hash text, -- To detect changes
  embedding vector(1536),
  
  -- Metadata
  folder_path text,
  scanned_at timestamp with time zone,
  auth_id uuid, -- Canonical Supabase Auth ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index documents_organization_idx on documents (organization_id);
create index documents_provider_idx on documents (provider);
create index documents_content_hash_idx on documents (content_hash);
create index documents_auth_id_idx on documents (auth_id);

-- Evidence matches (AI-identified evidence linked to framework)
drop table if exists evidence_matches cascade;
create table evidence_matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  document_id bigint references documents(id) on delete cascade,
  
  -- What framework area does this evidence support?
  framework_type text not null check (framework_type in ('ofsted', 'siams')),
  category_id text not null,
  subcategory_id text not null,
  
  -- Match details
  confidence decimal(3,2) not null check (confidence >= 0 and confidence <= 1),
  matched_keywords text[],
  relevance_explanation text,
  key_quotes text[],
  
  -- What's good and what's missing
  strengths text[],
  gaps text[],
  suggestions text[],
  
  -- Document link for easy access
  document_link text,
  auth_id uuid, -- Canonical Supabase Auth ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index evidence_matches_organization_idx on evidence_matches (organization_id);
create index evidence_matches_document_idx on evidence_matches (document_id);
create index evidence_matches_category_idx on evidence_matches (framework_type, category_id, subcategory_id);
create index evidence_matches_confidence_idx on evidence_matches (confidence desc);
create index evidence_matches_auth_id_idx on evidence_matches (auth_id);

-- ============================================================================
-- LESSON OBSERVATIONS
-- ============================================================================

drop table if exists lesson_observations cascade;
create table lesson_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- Observation details
  date date not null,
  teacher_name text not null,
  subject text,
  year_group text,
  focus_area text,
  duration_minutes integer,
  
  -- Ratings (1-4 scale matching old Ofsted)
  rating_subject_knowledge integer check (rating_subject_knowledge between 1 and 4),
  rating_pedagogical_skills integer check (rating_pedagogical_skills between 1 and 4),
  rating_adaptive_teaching integer check (rating_adaptive_teaching between 1 and 4),
  rating_assessment integer check (rating_assessment between 1 and 4),
  rating_behaviour integer check (rating_behaviour between 1 and 4),
  rating_engagement integer check (rating_engagement between 1 and 4),
  
  -- Overall (NEW 5-point scale)
  overall_judgement text check (overall_judgement in ('exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement')),
  
  -- Notes
  strengths text,
  areas_for_development text,
  next_steps text,
  
  -- Flags
  is_scheme_followed boolean default true,
  is_cpd_needed boolean default false,
  is_support_plan_needed boolean default false,
  
  -- Links
  linked_framework_area text, -- ofsted subcategory_id
  
  -- Who observed
  observer_id text references users(id),
  observer_name text,
  auth_id uuid, -- Canonical Supabase Auth ID
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index observations_organization_idx on lesson_observations (organization_id);
create index observations_teacher_idx on lesson_observations (teacher_name);
create index observations_date_idx on lesson_observations (date desc);
create index observations_auth_id_idx on lesson_observations (auth_id);

-- ============================================================================
-- STATUTORY DOCUMENTS (SEF, SDP, PP Strategy, Sports Premium, etc.)
-- ============================================================================

drop table if exists statutory_documents cascade;
create table statutory_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- Document type
  document_type text not null check (document_type in (
    'sef',              -- Self-Evaluation Form (Ofsted)
    'siams_sef',        -- SIAMS Self-Evaluation
    'sdp',              -- School Development Plan
    'pp_strategy',      -- Pupil Premium Strategy Statement
    'sports_premium',   -- PE and Sport Premium Report
    'accessibility',    -- Accessibility Plan
    'behaviour_policy', -- Behaviour Policy
    'other'
  )),
  
  title text not null,
  academic_year text, -- e.g., '2024-25'
  
  -- Content (structured JSON for each document type)
  content jsonb not null default '{}',
  
  -- Version control
  version integer default 1,
  is_current boolean default true,
  previous_version_id uuid references statutory_documents(id),
  
  -- Status workflow
  status text check (status in ('draft', 'review', 'approved', 'published', 'archived')) default 'draft',
  
  -- Publishing (some docs must be on website)
  is_published_to_website boolean default false,
  website_publish_date timestamp with time zone,
  
  -- Approval workflow
  created_by text references users(id),
  reviewed_by text references users(id),
  reviewed_at timestamp with time zone,
  approved_by text references users(id),
  approved_at timestamp with time zone,
  auth_id uuid, -- Canonical Supabase Auth ID
  
  -- Deadline tracking
  deadline_date date,
  reminder_sent boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index statutory_docs_organization_idx on statutory_documents (organization_id);
create index statutory_docs_type_idx on statutory_documents (document_type);
create index statutory_docs_current_idx on statutory_documents (organization_id, document_type, is_current) where is_current = true;
create index statutory_docs_deadline_idx on statutory_documents (deadline_date) where status != 'archived';
create index statutory_docs_auth_id_idx on statutory_documents (auth_id);

-- ============================================================================
-- PUPIL PREMIUM DATA (for PP Strategy generation)
-- ============================================================================

drop table if exists pupil_premium_data cascade;
create table pupil_premium_data (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null, -- e.g., '2024-25'
  
  -- Pupil numbers
  total_pupils integer,
  pp_pupils integer,
  pp_percentage decimal(5,2),
  
  -- Funding
  pp_allocation decimal(12,2),
  recovery_premium decimal(12,2),
  total_funding decimal(12,2),
  
  -- Barriers identified
  barriers jsonb, -- Array of {id, description, category: 'academic'|'social'|'attendance'}
  
  -- Outcomes data
  outcomes jsonb, -- {reading: {pp: 65, non_pp: 78, national: 72}, ...}
  
  -- Attendance data
  pp_attendance decimal(5,2),
  non_pp_attendance decimal(5,2),
  pp_persistent_absence decimal(5,2),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(organization_id, academic_year)
);

create index pp_data_organization_idx on pupil_premium_data (organization_id);

-- ============================================================================
-- PUPIL PREMIUM SPENDING (Tier 1, 2, 3)
-- ============================================================================

drop table if exists pp_spending cascade;
create table pp_spending (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null,
  
  -- Tier (EEF tiered approach)
  tier integer not null check (tier in (1, 2, 3)),
  -- 1 = Quality of Teaching (for all)
  -- 2 = Targeted Academic Support
  -- 3 = Wider Strategies
  
  -- Activity details
  activity_name text not null,
  description text,
  
  -- EEF evidence
  eef_strategy_id text, -- Links to EEF toolkit
  eef_impact_months decimal(3,1),
  
  -- Cost
  allocated_amount decimal(10,2),
  actual_spent decimal(10,2),
  
  -- Barriers addressed
  barrier_ids text[], -- Which barriers this addresses
  
  -- Impact measurement
  intended_outcomes text,
  success_criteria text,
  actual_impact text,
  impact_rating text check (impact_rating in ('high', 'moderate', 'low', 'not_measured')),
  
  -- Staff/resources
  staff_lead text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index pp_spending_organization_idx on pp_spending (organization_id);
create index pp_spending_year_idx on pp_spending (academic_year);
create index pp_spending_tier_idx on pp_spending (tier);

-- ============================================================================
-- SPORTS PREMIUM DATA
-- ============================================================================

drop table if exists sports_premium_data cascade;
create table sports_premium_data (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null,
  
  -- Funding
  allocation decimal(10,2),
  carried_forward decimal(10,2),
  total_available decimal(10,2),
  
  -- Swimming data (Year 6)
  swimming_25m_percentage decimal(5,2),
  swimming_strokes_percentage decimal(5,2),
  swimming_rescue_percentage decimal(5,2),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(organization_id, academic_year)
);

-- ============================================================================
-- SPORTS PREMIUM SPENDING (5 Key Indicators)
-- ============================================================================

drop table if exists sports_premium_spending cascade;
create table sports_premium_spending (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null,
  
  -- Key indicator (1-5)
  key_indicator integer not null check (key_indicator in (1, 2, 3, 4, 5)),
  -- 1 = Engagement of all pupils in regular physical activity
  -- 2 = Profile of PESSPA raised across school
  -- 3 = Increased confidence, knowledge and skills of staff
  -- 4 = Broader experience of sports and activities
  -- 5 = Increased participation in competitive sport
  
  -- Activity
  activity_name text not null,
  description text,
  
  -- Cost
  allocated_amount decimal(10,2),
  actual_spent decimal(10,2),
  
  -- Impact
  intended_impact text,
  actual_impact text,
  
  -- Sustainability
  is_sustainable boolean default false,
  sustainability_plan text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index sports_spending_organization_idx on sports_premium_spending (organization_id);
create index sports_spending_year_idx on sports_premium_spending (academic_year);

-- ============================================================================
-- SCHOOL DEVELOPMENT PLAN
-- ============================================================================

drop table if exists sdp_priorities cascade;
create table sdp_priorities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  academic_year text not null,
  
  -- Priority details
  priority_number integer not null,
  title text not null,
  description text,
  rationale text,
  
  -- Links to frameworks
  ofsted_category_id text,
  siams_strand_id text,
  
  -- Lead
  lead_person text,
  lead_user_id text references users(id),
  
  -- Success criteria
  success_criteria text[],
  
  -- Budget
  allocated_budget decimal(10,2),
  
  -- Status
  status text check (status in ('not_started', 'in_progress', 'on_track', 'at_risk', 'completed')) default 'not_started',
  progress_percentage integer default 0 check (progress_percentage between 0 and 100),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index sdp_priorities_organization_idx on sdp_priorities (organization_id);
create index sdp_priorities_year_idx on sdp_priorities (academic_year);

-- ============================================================================
-- SDP MILESTONES (linked to priorities)
-- ============================================================================

drop table if exists sdp_milestones cascade;
create table sdp_milestones (
  id uuid primary key default gen_random_uuid(),
  priority_id uuid references sdp_priorities(id) on delete cascade,
  
  -- Milestone details
  title text not null,
  description text,
  
  -- Timing
  target_term text check (target_term in ('autumn1', 'autumn2', 'spring1', 'spring2', 'summer1', 'summer2')),
  target_date date,
  
  -- Status
  status text check (status in ('pending', 'in_progress', 'completed', 'missed')) default 'pending',
  completion_date date,
  completion_evidence text,
  
  -- RAG rating
  rag_status text check (rag_status in ('green', 'amber', 'red')) default 'green',
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index sdp_milestones_priority_idx on sdp_milestones (priority_id);

-- ============================================================================
-- NOTES & COMMENTS (attach to any item)
-- ============================================================================

drop table if exists notes cascade;
create table notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- What is this note attached to?
  entity_type text not null check (entity_type in (
    'action', 'assessment', 'observation', 'document', 'priority', 'milestone', 'meeting', 'general'
  )),
  entity_id text not null, -- UUID of the related item
  
  -- Note content
  content text not null,
  is_private boolean default false, -- Only visible to author
  
  -- Author
  author_id text references users(id),
  author_name text,
  auth_id uuid, -- Canonical Supabase Auth ID
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index notes_entity_idx on notes (entity_type, entity_id);
create index notes_organization_idx on notes (organization_id);
create index notes_auth_id_idx on notes (auth_id);

-- ============================================================================
-- ACTIVITY LOG (audit trail)
-- ============================================================================

drop table if exists activity_log cascade;
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- What happened?
  action_type text not null check (action_type in (
    'create', 'update', 'delete', 'approve', 'complete', 'assign', 'comment', 'upload', 'scan', 'generate'
  )),
  
  -- What was affected?
  entity_type text not null,
  entity_id text,
  entity_name text,
  
  -- Details
  description text,
  changes jsonb, -- Before/after for updates
  
  -- Who did it?
  user_id text references users(id),
  user_name text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index activity_log_organization_idx on activity_log (organization_id);
create index activity_log_date_idx on activity_log (created_at desc);
create index activity_log_user_idx on activity_log (user_id);

-- ============================================================================
-- MEETINGS & MINUTES
-- ============================================================================

drop table if exists meetings cascade;
create table meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- Meeting details
  title text not null,
  meeting_type text check (meeting_type in ('governors', 'slt', 'staff', 'department', 'phase', 'other')),
  date date not null,
  start_time time,
  end_time time,
  location text,
  
  -- Attendees
  attendees text[], -- Array of names
  apologies text[],
  
  -- Agenda and minutes
  agenda text,
  minutes text, -- Full minutes (can be AI-generated from transcript)
  
  -- AI Features
  transcript text, -- Voice recording transcript
  ai_summary text, -- AI-generated summary
  
  -- Status
  status text check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')) default 'scheduled',
  
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index meetings_organization_idx on meetings (organization_id);
create index meetings_date_idx on meetings (date desc);

-- Meeting Action Points (linked to main actions table)
drop table if exists meeting_actions cascade;
create table meeting_actions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  action_id uuid references actions(id) on delete cascade,
  
  -- From minutes
  minute_reference text, -- e.g., "Item 5.2"
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- MONITORING VISITS (Learning walks, book looks, etc.)
-- ============================================================================

drop table if exists monitoring_visits cascade;
create table monitoring_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- Visit details
  visit_type text not null check (visit_type in (
    'learning_walk', 'book_look', 'pupil_voice', 'deep_dive', 'environment_walk', 'other'
  )),
  title text not null,
  date date not null,
  
  -- Focus
  focus_area text, -- What was being monitored
  framework_link text, -- ofsted subcategory or siams strand
  subject text,
  year_groups text[],
  
  -- Findings
  strengths text[],
  areas_for_development text[],
  key_observations text,
  
  -- Follow-up
  follow_up_actions text[],
  follow_up_date date,
  
  -- Who conducted
  conducted_by text[],
  
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index monitoring_visits_organization_idx on monitoring_visits (organization_id);
create index monitoring_visits_date_idx on monitoring_visits (date desc);
create index monitoring_visits_type_idx on monitoring_visits (visit_type);

-- ============================================================================
-- CPD RECORDS (Staff training linked to improvement)
-- ============================================================================

drop table if exists cpd_records cascade;
create table cpd_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- What training?
  title text not null,
  provider text,
  cpd_type text check (cpd_type in ('course', 'webinar', 'inset', 'coaching', 'reading', 'peer_observation', 'other')),
  date date,
  duration_hours decimal(4,1),
  
  -- Who attended?
  attendee_ids text[],
  attendee_names text[],
  
  -- Cost
  cost decimal(10,2),
  funded_by text, -- e.g., 'school', 'pp', 'sports_premium', 'external'
  
  -- Link to improvement
  framework_link text, -- Which Ofsted/SIAMS area this supports
  eef_strategy text, -- Which EEF strategy this relates to
  sdp_priority_id uuid references sdp_priorities(id),
  
  -- Impact
  intended_impact text,
  actual_impact text,
  impact_rating text check (impact_rating in ('high', 'medium', 'low', 'not_measured')),
  
  -- Evidence
  certificate_url text,
  notes text,
  
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index cpd_records_organization_idx on cpd_records (organization_id);
create index cpd_records_date_idx on cpd_records (date desc);

-- ============================================================================
-- REMINDERS & CALENDAR
-- ============================================================================

drop table if exists reminders cascade;
create table reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- What's the reminder for?
  title text not null,
  description text,
  
  -- Link to entity
  entity_type text, -- 'action', 'document', 'meeting', 'policy', etc.
  entity_id text,
  
  -- When?
  due_date date not null,
  reminder_date date, -- When to send reminder
  
  -- Who?
  assigned_to text references users(id),
  assigned_to_name text,
  
  -- Status
  is_recurring boolean default false,
  recurrence_pattern text, -- 'daily', 'weekly', 'monthly', 'annually'
  
  status text check (status in ('pending', 'sent', 'acknowledged', 'completed', 'snoozed')) default 'pending',
  
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index reminders_organization_idx on reminders (organization_id);
create index reminders_due_date_idx on reminders (due_date);
create index reminders_status_idx on reminders (status);

-- ============================================================================
-- POLICY TRACKING
-- ============================================================================

drop table if exists policies cascade;
create table policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- Policy details
  name text not null,
  category text check (category in (
    'safeguarding', 'curriculum', 'behaviour', 'hr', 'health_safety', 
    'governance', 'finance', 'admissions', 'send', 'other'
  )),
  
  -- Version control
  version text,
  document_url text,
  
  -- Review cycle
  last_reviewed date,
  next_review date,
  review_frequency_months integer default 12,
  
  -- Approval
  approved_by text,
  approved_date date,
  
  -- Statutory requirement
  is_statutory boolean default false,
  statutory_reference text,
  
  -- Status
  status text check (status in ('current', 'under_review', 'expired', 'archived')) default 'current',
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index policies_organization_idx on policies (organization_id);
create index policies_review_idx on policies (next_review);

-- ============================================================================
-- PUPIL & PARENT VOICE
-- ============================================================================

drop table if exists surveys cascade;
create table surveys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- Survey details
  title text not null,
  survey_type text check (survey_type in ('pupil_voice', 'parent_survey', 'staff_survey', 'governor_survey', 'other')),
  
  -- Dates
  start_date date,
  end_date date,
  
  -- Questions (stored as JSON)
  questions jsonb,
  
  -- Response summary (AI-analyzed)
  response_count integer default 0,
  ai_summary text,
  sentiment_score decimal(3,2), -- -1 to +1
  key_themes text[],
  
  -- Framework links
  framework_links text[], -- Which Ofsted/SIAMS areas this relates to
  
  status text check (status in ('draft', 'active', 'closed', 'analyzed')) default 'draft',
  
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index surveys_organization_idx on surveys (organization_id);

-- Survey responses (anonymized)
drop table if exists survey_responses cascade;
create table survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references surveys(id) on delete cascade,
  
  -- Response data (anonymized)
  responses jsonb not null,
  
  -- Metadata
  respondent_type text, -- 'pupil', 'parent', 'staff'
  year_group text, -- For pupil surveys
  
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index survey_responses_survey_idx on survey_responses (survey_id);

-- ============================================================================
-- EXTERNAL VALIDATION
-- ============================================================================

drop table if exists external_visits cascade;
create table external_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- Visit details
  visitor_type text check (visitor_type in (
    'la_advisor', 'diocese', 'mat_visit', 'consultant', 'ofsted', 'siams', 'peer_review', 'other'
  )),
  visitor_name text,
  visitor_organization text,
  date date not null,
  
  -- Focus
  focus_areas text[],
  framework_links text[],
  
  -- Findings
  report_summary text,
  strengths text[],
  areas_for_development text[],
  recommendations text[],
  
  -- Document
  report_url text,
  
  -- Follow-up
  follow_up_required boolean default false,
  follow_up_date date,
  
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index external_visits_organization_idx on external_visits (organization_id);
create index external_visits_date_idx on external_visits (date desc);

-- ============================================================================
-- RISK REGISTER
-- ============================================================================

drop table if exists risks cascade;
create table risks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- Risk details
  title text not null,
  description text,
  category text check (category in (
    'safeguarding', 'financial', 'operational', 'reputational', 
    'compliance', 'staffing', 'educational', 'health_safety', 'other'
  )),
  
  -- Assessment
  likelihood integer check (likelihood between 1 and 5), -- 1=rare, 5=almost certain
  impact integer check (impact between 1 and 5), -- 1=negligible, 5=catastrophic
  risk_score integer generated always as (likelihood * impact) stored,
  
  -- Mitigation
  current_controls text,
  additional_actions text,
  
  -- Ownership
  risk_owner text,
  risk_owner_id text references users(id),
  
  -- Status
  status text check (status in ('open', 'mitigated', 'closed', 'accepted')) default 'open',
  
  -- Review
  last_reviewed date,
  next_review date,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index risks_organization_idx on risks (organization_id);
create index risks_score_idx on risks (risk_score desc);

-- ============================================================================
-- MODULAR SUBSCRIPTION SYSTEM
-- ============================================================================

-- Available modules/add-ons
drop table if exists modules cascade;
create table modules (
  id text primary key,
  name text not null,
  short_name text,
  description text,
  category text check (category in ('core', 'inspection', 'voice', 'insights', 'operations', 'stakeholder', 'mobile')),
  
  -- Pricing
  price_monthly decimal(8,2),
  price_annual decimal(8,2),
  
  -- Features included
  features jsonb,
  
  -- Limits for this module
  default_limits jsonb, -- e.g., {"ed_queries": 100, "doc_scans": 50}
  
  is_active boolean default true,
  display_order integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed modules
insert into modules (id, name, short_name, category, price_monthly, price_annual, features, default_limits, display_order) values
  ('core', 'Core Platform', 'Core', 'core', 0, 0, 
   '["Framework self-assessment", "Basic action tracking", "10 Ed queries/month"]',
   '{"ed_queries": 10, "doc_scans": 0, "reports": 0}', 1),
  ('inspection_ready', 'Inspection Ready Bundle', 'Inspection', 'inspection', 49, 499,
   '["Evidence scanner", "SEF generator", "Statutory documents", "Inspection predictor", "100 Ed queries"]',
   '{"ed_queries": 100, "doc_scans": 50, "reports": 10}', 2),
  ('voice_suite', 'Voice Suite', 'Voice', 'voice', 29, 299,
   '["Voice-to-observation", "Meeting transcription", "AI meeting minutes", "Voice notes"]',
   '{"voice_minutes": 120, "meetings": 10}', 3),
  ('insights_pro', 'Insights Pro', 'Insights', 'insights', 39, 399,
   '["Advanced dashboard", "Similar schools comparison", "Trend analysis", "Custom reports"]',
   '{"custom_reports": 20}', 4),
  ('ai_coach', 'AI Coach', 'Coach', 'operations', 19, 199,
   '["Mock inspector sessions", "Staff practice", "Question bank", "Answer coaching"]',
   '{"mock_sessions": 20, "practice_minutes": 60}', 5),
  ('quick_capture', 'Quick Capture Mobile', 'Mobile', 'mobile', 15, 149,
   '["Photo evidence", "Voice notes", "Quick observation", "Push notifications"]',
   '{"mobile_uploads": 100}', 6),
  ('operations_suite', 'Operations Suite', 'Ops', 'operations', 35, 359,
   '["Policy tracker", "CPD management", "Risk register", "Compliance calendar"]',
   '{}', 7),
  ('stakeholder_voice', 'Stakeholder Voice', 'Surveys', 'stakeholder', 25, 259,
   '["Parent surveys", "Pupil voice", "Staff wellbeing", "AI sentiment analysis"]',
   '{"surveys": 10, "responses": 500}', 8),
  ('everything_bundle', 'Everything Bundle', 'All', 'core', 149, 1499,
   '["All modules included", "Priority support", "Unlimited usage"]',
   '{"ed_queries": -1, "doc_scans": -1, "reports": -1}', 9)
on conflict (id) do nothing;

-- Organization module subscriptions
drop table if exists organization_modules cascade;
create table organization_modules (
  organization_id uuid references organizations(id) on delete cascade,
  module_id text references modules(id) on delete cascade,
  
  enabled boolean default true,
  enabled_at timestamp with time zone default timezone('utc'::text, now()),
  expires_at timestamp with time zone,
  
  -- Custom limits (overrides default)
  custom_limits jsonb,
  
  -- Current period usage
  usage_current jsonb default '{}',
  usage_reset_at timestamp with time zone,
  
  primary key (organization_id, module_id)
);

create index org_modules_org_idx on organization_modules (organization_id);

-- Subscription plans
drop table if exists subscriptions cascade;
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  
  -- Plan level
  plan text check (plan in ('free', 'essential', 'professional', 'enterprise', 'custom')),
  
  -- Status
  status text check (status in ('active', 'cancelled', 'past_due', 'trialing', 'paused')) default 'active',
  
  -- Stripe integration
  stripe_subscription_id text,
  stripe_customer_id text,
  
  -- Billing period
  billing_cycle text check (billing_cycle in ('monthly', 'annual')) default 'monthly',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  
  -- Trial
  trial_end timestamp with time zone,
  
  -- Cancellation
  cancel_at_period_end boolean default false,
  cancelled_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(organization_id)
);

create index subscriptions_org_idx on subscriptions (organization_id);
create index subscriptions_status_idx on subscriptions (status);

-- Usage tracking (for billing and limits)
drop table if exists usage_logs cascade;
create table usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id text references users(id),
  
  -- What action?
  action_type text not null check (action_type in (
    'ed_query',           -- Chat with Ed
    'doc_scan',           -- AI document scanning
    'report_generate',    -- One-click report
    'voice_transcribe',   -- Voice transcription
    'mock_session',       -- Mock inspector
    'survey_create',      -- Create survey
    'survey_analyze',     -- AI analyze responses
    'mobile_upload'       -- Quick capture upload
  )),
  
  -- Which module?
  module_id text references modules(id),
  
  -- AI costs
  model_used text,
  tokens_input integer,
  tokens_output integer,
  cost_estimate decimal(10,6),
  
  -- Duration (for voice/meetings)
  duration_seconds integer,
  
  -- Additional context
  metadata jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index usage_logs_org_idx on usage_logs (organization_id);
create index usage_logs_date_idx on usage_logs (created_at desc);
create index usage_logs_action_idx on usage_logs (action_type);

-- AI Model configuration (for OpenRouter)
drop table if exists ai_models cascade;
create table ai_models (
  id text primary key,
  provider text not null, -- 'openrouter', 'openai', 'anthropic'
  model_name text not null,
  display_name text,
  
  -- Pricing per million tokens
  cost_per_m_input decimal(10,4),
  cost_per_m_output decimal(10,4),
  
  -- For audio (per minute)
  cost_per_minute decimal(10,4),
  
  -- Capabilities
  capabilities text[], -- 'chat', 'vision', 'embedding', 'transcription'
  
  -- Recommended uses
  recommended_for text[], -- 'simple_chat', 'document_analysis', 'report_generation', 'mock_inspector'
  
  -- Limits
  max_tokens integer,
  
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed AI models with current pricing
insert into ai_models (id, provider, model_name, display_name, cost_per_m_input, cost_per_m_output, capabilities, recommended_for, max_tokens) values
  ('gemini-flash', 'openrouter', 'google/gemini-flash-1.5', 'Gemini 1.5 Flash', 0.075, 0.30, 
   ARRAY['chat'], ARRAY['simple_chat', 'quick_classification'], 1000000),
  ('gemini-pro', 'openrouter', 'google/gemini-pro-1.5', 'Gemini 1.5 Pro', 1.25, 5.00,
   ARRAY['chat', 'vision'], ARRAY['complex_analysis'], 2000000),
  ('claude-haiku', 'openrouter', 'anthropic/claude-3.5-haiku', 'Claude 3.5 Haiku', 0.25, 1.25,
   ARRAY['chat'], ARRAY['document_analysis', 'evidence_matching'], 200000),
  ('claude-sonnet', 'openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 3.00, 15.00,
   ARRAY['chat', 'vision'], ARRAY['report_generation', 'sef_writing'], 200000),
  ('gpt-4o', 'openrouter', 'openai/gpt-4o', 'GPT-4o', 2.50, 10.00,
   ARRAY['chat', 'vision'], ARRAY['mock_inspector', 'roleplay'], 128000),
  ('gpt-4o-mini', 'openrouter', 'openai/gpt-4o-mini', 'GPT-4o Mini', 0.15, 0.60,
   ARRAY['chat'], ARRAY['simple_chat', 'quick_tasks'], 128000),
  ('whisper', 'openai', 'whisper-1', 'Whisper', 0, 0,
   ARRAY['transcription'], ARRAY['voice_transcription'], null),
  ('embedding-small', 'openai', 'text-embedding-3-small', 'Embedding Small', 0.02, 0,
   ARRAY['embedding'], ARRAY['document_search'], 8191)
on conflict (id) do nothing;

-- Update whisper with per-minute cost
update ai_models set cost_per_minute = 0.006 where id = 'whisper';

-- ============================================================================
-- FRAMEWORK UPDATE TRACKING (for Ed's knowledge)
-- ============================================================================

drop table if exists framework_updates cascade;
create table framework_updates (
  id text primary key,
  framework text not null check (framework in ('ofsted', 'siams', 'eef', 'dfe', 'other')),
  title text not null,
  effective_date date,
  summary text,
  impact_areas text[],
  source_url text,
  is_acknowledged boolean default false, -- Has user reviewed this update?
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed initial framework updates
insert into framework_updates (id, framework, title, effective_date, summary, impact_areas, source_url) values
  ('ofsted-nov-2025', 'ofsted', 'New Education Inspection Framework', '2025-11-10',
   'Major overhaul introducing 6 evaluation areas, 5-point grading scale, report card format.',
   ARRAY['All inspection areas renamed', '5-point grading scale', 'Safeguarding separate', 'Report card format'],
   'https://www.gov.uk/government/publications/education-inspection-framework'),
  ('siams-2023', 'siams', 'SIAMS Evaluation Schedule 2023', '2023-09-01',
   'Updated SIAMS framework with 7 strands focusing on Christian vision.',
   ARRAY['7 strands', 'Vision-focused', 'Flourishing emphasis'],
   'https://www.churchofengland.org/about/education-and-schools/church-schools-and-academies/siams-inspections'),
  ('eef-toolkit-2024', 'eef', 'EEF Toolkit Update 2024', '2024-01-01',
   'Revised impact estimates and new strategies based on latest research.',
   ARRAY['Updated effect sizes', 'New tutoring evidence', 'Revised metacognition guidance'],
   'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit')
on conflict (id) do nothing;

-- ============================================================================
-- SCAN JOBS (for tracking document scans)
-- ============================================================================

drop table if exists scan_jobs cascade;
create table scan_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id text references users(id),
  
  -- Source
  source_type text check (source_type in ('local', 'google_drive', 'onedrive')),
  folder_path text,
  
  -- Progress
  status text check (status in ('pending', 'scanning', 'analyzing', 'complete', 'error')) default 'pending',
  total_files integer default 0,
  processed_files integer default 0,
  evidence_matches_found integer default 0,
  
  -- Results
  results jsonb,
  error_message text,
  
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index scan_jobs_organization_idx on scan_jobs (organization_id);
create index scan_jobs_status_idx on scan_jobs (status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table users enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table invitations enable row level security;
alter table ofsted_assessments enable row level security;
alter table safeguarding_assessments enable row level security;
alter table siams_assessments enable row level security;
alter table actions enable row level security;
alter table documents enable row level security;
alter table evidence_matches enable row level security;
alter table lesson_observations enable row level security;
alter table statutory_documents enable row level security;
alter table pupil_premium_data enable row level security;
alter table pp_spending enable row level security;
alter table sports_premium_data enable row level security;
alter table sports_premium_spending enable row level security;
alter table sdp_priorities enable row level security;
alter table sdp_milestones enable row level security;
alter table notes enable row level security;
alter table activity_log enable row level security;
alter table meetings enable row level security;
alter table meeting_actions enable row level security;
alter table monitoring_visits enable row level security;
alter table cpd_records enable row level security;
alter table reminders enable row level security;
alter table policies enable row level security;
alter table surveys enable row level security;
alter table survey_responses enable row level security;
alter table external_visits enable row level security;
alter table risks enable row level security;
alter table modules enable row level security;
alter table organization_modules enable row level security;
alter table subscriptions enable row level security;
alter table usage_logs enable row level security;
alter table ai_models enable row level security;
alter table scan_jobs enable row level security;

-- Service role has full access to all tables
create policy "Service role full access" on users for all using (true);
create policy "Service role full access" on organizations for all using (true);
create policy "Service role full access" on organization_members for all using (true);
create policy "Service role full access" on invitations for all using (true);
create policy "Service role full access" on ofsted_assessments for all using (true);
create policy "Service role full access" on safeguarding_assessments for all using (true);
create policy "Service role full access" on siams_assessments for all using (true);
create policy "Service role full access" on actions for all using (true);
create policy "Service role full access" on documents for all using (true);
create policy "Service role full access" on evidence_matches for all using (true);
create policy "Service role full access" on lesson_observations for all using (true);
create policy "Service role full access" on statutory_documents for all using (true);
create policy "Service role full access" on pupil_premium_data for all using (true);
create policy "Service role full access" on pp_spending for all using (true);
create policy "Service role full access" on sports_premium_data for all using (true);
create policy "Service role full access" on sports_premium_spending for all using (true);
create policy "Service role full access" on sdp_priorities for all using (true);
create policy "Service role full access" on sdp_milestones for all using (true);
create policy "Service role full access" on notes for all using (true);
create policy "Service role full access" on activity_log for all using (true);
create policy "Service role full access" on meetings for all using (true);
create policy "Service role full access" on meeting_actions for all using (true);
create policy "Service role full access" on monitoring_visits for all using (true);
create policy "Service role full access" on cpd_records for all using (true);
create policy "Service role full access" on reminders for all using (true);
create policy "Service role full access" on policies for all using (true);
create policy "Service role full access" on surveys for all using (true);
create policy "Service role full access" on survey_responses for all using (true);
create policy "Service role full access" on external_visits for all using (true);
create policy "Service role full access" on risks for all using (true);
create policy "Service role full access" on modules for all using (true);
create policy "Service role full access" on organization_modules for all using (true);
create policy "Service role full access" on subscriptions for all using (true);
create policy "Service role full access" on usage_logs for all using (true);
create policy "Service role full access" on ai_models for all using (true);
create policy "Service role full access" on scan_jobs for all using (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's organizations
create or replace function get_user_organizations(user_id_param text)
returns table (
  organization_id uuid,
  organization_name text,
  role text
)
language sql
security definer
as $$
  select o.id, o.name, om.role
  from organizations o
  join organization_members om on om.organization_id = o.id
  where om.user_id = user_id_param;
$$;

-- Calculate category readiness score
create or replace function calculate_category_readiness(
  org_id uuid,
  category_id_param text
)
returns decimal
language plpgsql
as $$
declare
  avg_score decimal;
begin
  select avg(
    case school_rating
      when 'exceptional' then 100
      when 'strong_standard' then 80
      when 'expected_standard' then 60
      when 'needs_attention' then 40
      when 'urgent_improvement' then 20
      else 0
    end
  )
  into avg_score
  from ofsted_assessments oa
  join ofsted_subcategories os on os.id = oa.subcategory_id
  where oa.organization_id = org_id
    and os.category_id = category_id_param
    and oa.school_rating != 'not_assessed';
  
  return coalesce(avg_score, 0);
end;
$$;

-- Get evidence summary for a subcategory
create or replace function get_evidence_for_subcategory(
  org_id uuid,
  subcategory_id_param text
)
returns table (
  document_name text,
  document_link text,
  confidence decimal,
  matched_keywords text[],
  strengths text[],
  gaps text[]
)
language sql
as $$
  select
    d.name,
    coalesce(em.document_link, d.web_view_link, d.file_path),
    em.confidence,
    em.matched_keywords,
    em.strengths,
    em.gaps
  from evidence_matches em
  join documents d on d.id = em.document_id
  where em.organization_id = org_id
    and em.subcategory_id = subcategory_id_param
  order by em.confidence desc;
$$;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Run this entire script in Supabase SQL Editor
-- It will drop and recreate all tables with the new structure
