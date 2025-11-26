-- PART 1: CORE TABLES
-- Run this first, then part 2, then part 3

-- Enable extensions
create extension if not exists vector;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (maps Firebase users)
drop table if exists users cascade;
create table users (
  id text primary key,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organizations (Schools)
drop table if exists organizations cascade;
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  urn text,
  school_type text,
  is_church_school boolean default false,
  diocese text,
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
  role text not null check (role in ('admin', 'slt', 'teacher', 'governor', 'viewer')),
  job_title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (organization_id, user_id)
);

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
-- FRAMEWORK TABLES
-- ============================================================================

-- Ofsted Categories
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

-- Seed Ofsted Categories
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
  ('inclusion-send', 'inclusion', 'SEND Provision', 'Support for pupils with special educational needs and disabilities', 1, 
   ARRAY['Pupils with SEND achieve well', 'Early identification is effective', 'High-quality targeted support', 'Staff trained for SEND']),
  ('inclusion-disadvantaged', 'inclusion', 'Disadvantaged Pupils', 'Support and outcomes for disadvantaged pupils', 2,
   ARRAY['Disadvantaged achieve as well as others nationally', 'Gaps are closing', 'PP strategy is evidence-based', 'Barriers addressed effectively']),
  ('inclusion-mental-health', 'inclusion', 'Mental Health & Wellbeing Support', 'Support for pupils with mental health needs', 3,
   ARRAY['Mental health needs identified early', 'Effective support systems', 'Staff trained to recognise signs', 'Pupils know how to access support']),
  ('curriculum-intent', 'curriculum-teaching', 'Curriculum Intent', 'The design and ambition of the curriculum', 1,
   ARRAY['Curriculum is ambitious for all', 'Clear progression of knowledge', 'National Curriculum coverage secure', 'Local context reflected']),
  ('curriculum-implementation', 'curriculum-teaching', 'Teaching Quality', 'How effectively the curriculum is taught', 2,
   ARRAY['Strong subject knowledge', 'Effective pedagogy', 'Assessment used to adapt teaching', 'Teaching adapted for learners']),
  ('curriculum-reading', 'curriculum-teaching', 'Reading and Literacy', 'The teaching of reading including phonics', 3,
   ARRAY['Validated SSP implemented with fidelity', 'Books matched to phonics knowledge', 'Rapid intervention', 'Strong phonics outcomes']),
  ('achievement-outcomes', 'achievement', 'Academic Outcomes', 'Attainment and progress in national assessments', 1,
   ARRAY['Outcomes at least in line with national', 'Strong progress from starting points', 'All groups achieve well', 'Improving over time']),
  ('achievement-progress', 'achievement', 'Progress from Starting Points', 'How well pupils progress relative to their starting points', 2,
   ARRAY['Strong progress from starting points', 'Consistent across curriculum', 'Lower attainers catch up', 'Higher attainers stretched']),
  ('attendance-overall', 'attendance-behaviour', 'Attendance', 'Overall attendance and persistent absence rates', 1,
   ARRAY['Attendance at least 96%', 'Persistent absence reducing', 'Same-day response', 'Gaps closing for disadvantaged']),
  ('behaviour-conduct', 'attendance-behaviour', 'Behaviour and Conduct', 'Behaviour in lessons and around school', 2,
   ARRAY['High expectations consistently applied', 'Behaviour at least good', 'Low-level disruption rare', 'Exclusions low']),
  ('pd-character', 'personal-development', 'Character and Resilience', 'Development of character, confidence and resilience', 1,
   ARRAY['Character explicitly developed', 'Pupils show resilience', 'Confidence built', 'Self-regulation']),
  ('pd-citizenship', 'personal-development', 'Citizenship and British Values', 'Preparation for life in modern Britain', 2,
   ARRAY['British Values embedded', 'Understand democracy', 'Respect diversity', 'Prepared for modern Britain']),
  ('leadership-vision', 'leadership-governance', 'Vision and Strategy', 'Clarity and ambition of school vision', 1,
   ARRAY['Clear ambitious vision', 'Staff share vision', 'Accurate self-evaluation', 'Right priorities']),
  ('leadership-governance', 'leadership-governance', 'Governance', 'Effectiveness of governance and oversight', 2,
   ARRAY['Governors know school well', 'Effective challenge', 'Hold leaders to account', 'Statutory duties fulfilled']),
  ('safeguarding-culture', 'safeguarding', 'Safeguarding Culture', 'Embedded culture of safeguarding', 1,
   ARRAY['Culture embedded', 'All staff know how to report', 'DSL arrangements robust', 'Pupils feel safe']),
  ('safeguarding-systems', 'safeguarding', 'Safeguarding Systems', 'Policies, procedures and record keeping', 2,
   ARRAY['SCR compliant', 'Referrals timely', 'Effective recording', 'Clear procedures'])
on conflict (id) do nothing;

-- Evidence Requirements
drop table if exists evidence_requirements cascade;
create table evidence_requirements (
  id uuid primary key default gen_random_uuid(),
  subcategory_id text references ofsted_subcategories(id) on delete cascade,
  name text not null,
  description text,
  importance text check (importance in ('critical', 'important', 'recommended')),
  eef_link text,
  display_order integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SIAMS Strands
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

-- SIAMS Questions
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

SELECT 'Part 1 Complete - Core and Framework tables created' as status;

