-- PART 5: MODULES, SUBSCRIPTIONS & RLS
-- Run after Part 4 (FINAL PART)

-- ============================================================================
-- MODULE SYSTEM
-- ============================================================================

drop table if exists modules cascade;
create table modules (
  id text primary key,
  name text not null,
  short_name text,
  description text,
  category text check (category in ('core', 'inspection', 'voice', 'insights', 'operations', 'stakeholder', 'mobile')),
  price_monthly decimal(8,2),
  price_annual decimal(8,2),
  features jsonb,
  default_limits jsonb,
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

drop table if exists organization_modules cascade;
create table organization_modules (
  organization_id uuid references organizations(id) on delete cascade,
  module_id text references modules(id) on delete cascade,
  enabled boolean default true,
  enabled_at timestamp with time zone default timezone('utc'::text, now()),
  expires_at timestamp with time zone,
  custom_limits jsonb,
  usage_current jsonb default '{}',
  usage_reset_at timestamp with time zone,
  primary key (organization_id, module_id)
);

drop table if exists subscriptions cascade;
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  plan text check (plan in ('free', 'essential', 'professional', 'enterprise', 'custom')),
  status text check (status in ('active', 'cancelled', 'past_due', 'trialing', 'paused')) default 'active',
  stripe_subscription_id text,
  stripe_customer_id text,
  billing_cycle text check (billing_cycle in ('monthly', 'annual')) default 'monthly',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  trial_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id)
);

drop table if exists usage_logs cascade;
create table usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id text references users(id),
  action_type text not null check (action_type in ('ed_query', 'doc_scan', 'report_generate', 'voice_transcribe', 'mock_session', 'survey_create', 'survey_analyze', 'mobile_upload')),
  module_id text references modules(id),
  model_used text,
  tokens_input integer,
  tokens_output integer,
  cost_estimate decimal(10,6),
  duration_seconds integer,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index usage_logs_org_idx on usage_logs (organization_id);
create index usage_logs_date_idx on usage_logs (created_at desc);

drop table if exists ai_models cascade;
create table ai_models (
  id text primary key,
  provider text not null,
  model_name text not null,
  display_name text,
  cost_per_m_input decimal(10,4),
  cost_per_m_output decimal(10,4),
  cost_per_minute decimal(10,4),
  capabilities text[],
  recommended_for text[],
  max_tokens integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed AI models
insert into ai_models (id, provider, model_name, display_name, cost_per_m_input, cost_per_m_output, capabilities, recommended_for, max_tokens) values
  ('gemini-flash', 'openrouter', 'google/gemini-flash-1.5', 'Gemini 1.5 Flash', 0.075, 0.30, ARRAY['chat'], ARRAY['simple_chat'], 1000000),
  ('claude-haiku', 'openrouter', 'anthropic/claude-3.5-haiku', 'Claude 3.5 Haiku', 0.25, 1.25, ARRAY['chat'], ARRAY['document_analysis'], 200000),
  ('claude-sonnet', 'openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 3.00, 15.00, ARRAY['chat', 'vision'], ARRAY['report_generation'], 200000),
  ('gpt-4o', 'openrouter', 'openai/gpt-4o', 'GPT-4o', 2.50, 10.00, ARRAY['chat', 'vision'], ARRAY['mock_inspector'], 128000),
  ('whisper', 'openai', 'whisper-1', 'Whisper', 0, 0, ARRAY['transcription'], ARRAY['voice_transcription'], null)
on conflict (id) do nothing;

update ai_models set cost_per_minute = 0.006 where id = 'whisper';

-- Framework Updates
drop table if exists framework_updates cascade;
create table framework_updates (
  id text primary key,
  framework text not null check (framework in ('ofsted', 'siams', 'eef', 'dfe', 'other')),
  title text not null,
  effective_date date,
  summary text,
  impact_areas text[],
  source_url text,
  is_acknowledged boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
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

-- Service role policies (full access)
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

create or replace function get_user_organizations(user_id_param text)
returns table (organization_id uuid, organization_name text, role text)
language sql security definer
as $$
  select o.id, o.name, om.role
  from organizations o
  join organization_members om on om.organization_id = o.id
  where om.user_id = user_id_param;
$$;

create or replace function calculate_category_readiness(org_id uuid, category_id_param text)
returns decimal
language plpgsql
as $$
declare avg_score decimal;
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

create or replace function get_evidence_for_subcategory(org_id uuid, subcategory_id_param text)
returns table (document_name text, document_link text, confidence decimal, matched_keywords text[], strengths text[], gaps text[])
language sql
as $$
  select d.name, coalesce(em.document_link, d.web_view_link, d.file_path), em.confidence, em.matched_keywords, em.strengths, em.gaps
  from evidence_matches em
  join documents d on d.id = em.document_id
  where em.organization_id = org_id and em.subcategory_id = subcategory_id_param
  order by em.confidence desc;
$$;

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Part 5 Complete - ALL TABLES CREATED SUCCESSFULLY!' as status;
SELECT 'Total tables created: 52+' as info;

