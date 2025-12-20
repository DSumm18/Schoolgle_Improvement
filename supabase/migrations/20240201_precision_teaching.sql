-- Migration: Precision Teaching & Interventions
-- Date: 2025-02-01
-- Purpose: Privacy-first schema for cohort-level tracking without PII
-- Phase 2: Moving from school-level to cohort-level data

-- ============================================================================
-- STUDENTS TABLE (The Anonymous Record)
-- ============================================================================

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  
  -- Privacy-first: We store a hash, not the UPN/Name
  upn_hash text not null, -- SHA-256 hash of UPN (Unique Pupil Number)
  
  -- Demographics (non-PII)
  year_group integer not null check (year_group between 1 and 13),
  
  -- Characteristics (tags for filtering into cohorts)
  characteristics jsonb default '[]'::jsonb, -- Array of strings: ['pp', 'send', 'eal', 'high_prior', 'low_prior', 'lac', 'adopted']
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Unique constraint: One student per organization (by UPN hash)
  unique(organization_id, upn_hash)
);

create index students_organization_idx on students (organization_id);
create index students_year_group_idx on students (organization_id, year_group);
create index students_characteristics_idx on students using gin (characteristics);

-- Enable RLS
alter table students enable row level security;

-- RLS: Users can access students in their organizations
create policy "Users can access students in their organizations"
  on students
  for all
  using (
    organization_id = any(get_user_organization_ids())
    OR
    organization_id::text = current_setting('request.jwt.claims', true)::json->>'organization_id'
  );

-- ============================================================================
-- COHORTS TABLE (Dynamic Groups)
-- ============================================================================

create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  
  -- Cohort identification
  name text not null, -- e.g., "Year 5 High Prior Attainers", "PP Pupils in KS2"
  description text,
  
  -- Dynamic filter rules (JSON structure for flexible querying)
  filter_rules jsonb not null default '{}'::jsonb,
  -- Example: {"year_group": 5, "characteristics": ["high_prior"], "min_year": 3, "max_year": 6}
  -- Example: {"characteristics": ["pp"], "year_groups": [3, 4, 5, 6]}
  
  -- Metadata
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Status
  is_active boolean default true
);

create index cohorts_organization_idx on cohorts (organization_id);
create index cohorts_active_idx on cohorts (organization_id, is_active) where is_active = true;
create index cohorts_filter_rules_idx on cohorts using gin (filter_rules);

-- Enable RLS
alter table cohorts enable row level security;

-- RLS: Users can access cohorts in their organizations
create policy "Users can access cohorts in their organizations"
  on cohorts
  for all
  using (
    organization_id = any(get_user_organization_ids())
    OR
    organization_id::text = current_setting('request.jwt.claims', true)::json->>'organization_id'
  );

-- ============================================================================
-- RESEARCH_STRATEGIES TABLE (The EEF Vault)
-- ============================================================================

create table if not exists research_strategies (
  id uuid primary key default gen_random_uuid(),
  
  -- Strategy details
  title text not null,
  summary text,
  description text,
  
  -- EEF Evidence
  impact_months text, -- e.g., "+5 months", "+2 months", "0 months"
  impact_months_numeric decimal(3,1), -- For sorting/calculations
  evidence_strength integer check (evidence_strength between 1 and 5), -- 1=weak, 5=strong
  evidence_tier integer check (evidence_tier between 1 and 3), -- EEF tier system
  
  -- Categorization
  category text, -- e.g., 'literacy', 'numeracy', 'metacognition', 'feedback'
  subcategory text,
  tags text[], -- Array for flexible searching
  
  -- Links
  url text, -- Link to EEF toolkit or research paper
  eef_toolkit_id text, -- EEF toolkit identifier
  
  -- Cost/Effort
  cost_rating text check (cost_rating in ('very_low', 'low', 'moderate', 'high', 'very_high')),
  implementation_effort text check (implementation_effort in ('very_low', 'low', 'moderate', 'high', 'very_high')),
  
  -- Metadata
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index research_strategies_category_idx on research_strategies (category);
create index research_strategies_tags_idx on research_strategies using gin (tags);
create index research_strategies_evidence_idx on research_strategies (evidence_strength desc, impact_months_numeric desc);
create index research_strategies_active_idx on research_strategies (is_active) where is_active = true;

-- Enable RLS
alter table research_strategies enable row level security;

-- RLS: Public read (all authenticated users can read)
create policy "Everyone can read research strategies"
  on research_strategies
  for select
  using (is_active = true);

-- RLS: Only admins can write (would need to check organization admin role)
-- For now, allow service role only for seeding
-- Note: In production, you'd want a more sophisticated admin check

-- Seed some example EEF strategies
insert into research_strategies (title, summary, impact_months, impact_months_numeric, evidence_strength, evidence_tier, category, tags, url) values
  ('Metacognition and self-regulation', 'Teaching pupils metacognitive strategies can improve learning outcomes', '+7 months', 7.0, 5, 1, 'metacognition', ARRAY['metacognition', 'self-regulation', 'learning-strategies'], 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation'),
  ('Feedback', 'Providing effective feedback can improve learning outcomes', '+6 months', 6.0, 5, 1, 'feedback', ARRAY['feedback', 'assessment'], 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback'),
  ('Phonics', 'Systematic phonics instruction improves reading outcomes', '+4 months', 4.0, 5, 1, 'literacy', ARRAY['phonics', 'reading', 'early-years'], 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics'),
  ('One to one tuition', 'Targeted one-to-one support can accelerate learning', '+5 months', 5.0, 4, 2, 'targeted-support', ARRAY['tutoring', 'intervention', 'targeted'], 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/one-to-one-tuition'),
  ('Small group tuition', 'Small group interventions can be effective', '+4 months', 4.0, 4, 2, 'targeted-support', ARRAY['group-work', 'intervention', 'targeted'], 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/small-group-tuition'),
  ('Reading comprehension strategies', 'Teaching comprehension strategies improves reading outcomes', '+6 months', 6.0, 4, 1, 'literacy', ARRAY['reading', 'comprehension', 'strategies'], 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/reading-comprehension-strategies')
on conflict do nothing;

-- ============================================================================
-- SCHOOL_INTERVENTIONS TABLE (The Timeline)
-- ============================================================================

create table if not exists school_interventions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  
  -- Who is this for?
  cohort_id uuid references cohorts(id) on delete cascade not null,
  
  -- Based on what research?
  strategy_id uuid references research_strategies(id) on delete restrict not null,
  
  -- Timeline
  start_date date not null,
  planned_end_date date,
  actual_end_date date,
  
  -- Status
  status text not null check (status in ('planned', 'active', 'completed', 'paused', 'cancelled')) default 'planned',
  
  -- Implementation details
  implementation_notes text,
  staff_lead text, -- Staff member leading (name only, no PII)
  frequency text, -- e.g., 'daily', 'weekly', '3x per week'
  duration_minutes integer, -- Per session
  
  -- Expected outcomes
  intended_outcomes text,
  success_criteria text,
  
  -- Actual outcomes (filled in on completion)
  actual_outcomes text,
  impact_assessment text,
  
  -- Metadata
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index interventions_organization_idx on school_interventions (organization_id);
create index interventions_cohort_idx on school_interventions (cohort_id);
create index interventions_strategy_idx on school_interventions (strategy_id);
create index interventions_status_idx on school_interventions (organization_id, status);
create index interventions_dates_idx on school_interventions (start_date, planned_end_date);

-- Enable RLS
alter table school_interventions enable row level security;

-- RLS: Users can access interventions in their organizations
create policy "Users can access interventions in their organizations"
  on school_interventions
  for all
  using (
    organization_id = any(get_user_organization_ids())
    OR
    organization_id::text = current_setting('request.jwt.claims', true)::json->>'organization_id'
  );

-- ============================================================================
-- PULSE_CHECKS TABLE (The Micro-Assessment)
-- ============================================================================

create table if not exists pulse_checks (
  id uuid primary key default gen_random_uuid(),
  
  -- Which intervention?
  intervention_id uuid references school_interventions(id) on delete cascade not null,
  
  -- When?
  date date not null,
  
  -- What was assessed?
  topic text not null, -- e.g., "Phonics Phase 3", "Times Tables 2x", "Reading Comprehension"
  
  -- Results: Array of Anonymous Scores + Summary
  -- This structure allows tracking individual student progress (by anonymous student_id)
  -- while maintaining privacy (no names, just hashed identifiers)
  results jsonb not null default '{}'::jsonb,
  -- Required JSON structure:
  -- {
  --   "summary": {
  --     "average": 75.5,
  --     "participation": 100,
  --     "cohort_size": 12,
  --     "score_distribution": {"0-50": 1, "51-70": 2, "71-85": 5, "86-100": 4},
  --     "improvement_from_baseline": 12.5
  --   },
  --   "individual_scores": [
  --     {"student_id": "uuid-1", "score": 80, "characteristics": ["pp"]},
  --     {"student_id": "uuid-2", "score": 45, "characteristics": ["send", "pp"]},
  --     {"student_id": "uuid-3", "score": 92, "characteristics": ["high_prior"]}
  --   ]
  -- }
  -- 
  -- Privacy Note: student_id references students.id (which is linked to upn_hash, not PII)
  -- This allows:
  -- - Tracking individual progress over time (by anonymous ID)
  -- - Calculating cohort-level trends (e.g., "PP pupils improved by X%")
  -- - Maintaining GDPR compliance (no names, no UPNs stored)
  
  -- Notes
  notes text,
  
  -- Who assessed?
  assessed_by text references users(id),
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index pulse_checks_intervention_idx on pulse_checks (intervention_id);
create index pulse_checks_date_idx on pulse_checks (date desc);
create index pulse_checks_topic_idx on pulse_checks (topic);

-- Enable RLS
alter table pulse_checks enable row level security;

-- RLS: Users can access pulse checks for interventions in their organizations
-- We need to join through school_interventions to check organization_id
create policy "Users can access pulse checks for their organization's interventions"
  on pulse_checks
  for all
  using (
    exists (
      select 1
      from school_interventions si
      where si.id = pulse_checks.intervention_id
        and (
          si.organization_id = any(get_user_organization_ids())
          OR
          si.organization_id::text = current_setting('request.jwt.claims', true)::json->>'organization_id'
        )
    )
  );

-- ============================================================================
-- HELPER FUNCTION: Get students in a cohort
-- ============================================================================

create or replace function get_cohort_students(
  cohort_id_param uuid
) returns table (
  student_id uuid,
  year_group integer,
  characteristics jsonb
)
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
declare
  org_id uuid;
  filter_rules_json jsonb;
begin
  -- Get cohort details
  select organization_id, filter_rules
  into org_id, filter_rules_json
  from cohorts
  where id = cohort_id_param;
  
  if org_id is null then
    raise exception 'Cohort not found';
  end if;
  
  -- Check user has access to this organization
  if not (org_id = any(get_user_organization_ids()) or
          org_id::text = current_setting('request.jwt.claims', true)::json->>'organization_id') then
    raise exception 'Access denied';
  end if;
  
  -- Build dynamic query based on filter_rules
  -- This is a simplified version - in production, you'd want more sophisticated filtering
  return query
  select s.id, s.year_group, s.characteristics
  from students s
  where s.organization_id = org_id
    and (
      -- Year group filter
      (filter_rules_json->>'year_group')::integer is null
      or s.year_group = (filter_rules_json->>'year_group')::integer
    )
    and (
      -- Characteristics filter (if specified)
      filter_rules_json->'characteristics' is null
      or s.characteristics ?| (select array(select jsonb_array_elements_text(filter_rules_json->'characteristics')))
    );
end;
$$;

-- ============================================================================
-- HELPER FUNCTION: Calculate cohort impact trend
-- ============================================================================

create or replace function calculate_cohort_impact(
  cohort_id_param uuid
) returns jsonb
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
declare
  org_id uuid;
  result jsonb;
begin
  -- Get cohort organization
  select organization_id into org_id
  from cohorts
  where id = cohort_id_param;
  
  if org_id is null then
    raise exception 'Cohort not found';
  end if;
  
  -- Check user has access
  if not (org_id = any(get_user_organization_ids()) or
          org_id::text = current_setting('request.jwt.claims', true)::json->>'organization_id') then
    raise exception 'Access denied';
  end if;
  
  -- Calculate impact metrics
  -- Updated to use new results structure with individual_scores
  select jsonb_build_object(
    'total_interventions', count(distinct si.id),
    'active_interventions', count(distinct si.id) filter (where si.status = 'active'),
    'completed_interventions', count(distinct si.id) filter (where si.status = 'completed'),
    'total_pulse_checks', count(pc.id),
    'avg_score_trend', jsonb_agg(
      jsonb_build_object(
        'date', pc.date,
        'avg_score', (pc.results->'summary'->>'average')::numeric
      ) order by pc.date
    ) filter (where pc.results->'summary'->>'average' is not null),
    'participation_trend', jsonb_agg(
      jsonb_build_object(
        'date', pc.date,
        'participation', (pc.results->'summary'->>'participation')::numeric
      ) order by pc.date
    ) filter (where pc.results->'summary'->>'participation' is not null),
    'individual_scores_count', sum(
      jsonb_array_length(pc.results->'individual_scores')
    ) filter (where pc.results->'individual_scores' is not null)
  )
  into result
  from school_interventions si
  left join pulse_checks pc on pc.intervention_id = si.id
  where si.cohort_id = cohort_id_param;
  
  return result;
end;
$$;

-- ============================================================================
-- REGISTER MCP TOOLS IN TOOL_DEFINITIONS
-- ============================================================================

-- Register precision teaching tools
insert into tool_definitions (tool_key, tool_name, description, module_key, risk_level, requires_approval) values
  ('search_research_strategies', 'Search Research Strategies', 'Searches the EEF research strategies database for evidence-based interventions. Returns "Best Bets" for AI to suggest to school leaders.', 'core', 'low', false),
  ('create_intervention', 'Create Intervention', 'Creates a new intervention on the timeline, linking a cohort to a research strategy. Logs the action for tracking and impact analysis.', 'core', 'low', false),
  ('analyze_cohort_impact', 'Analyze Cohort Impact', 'Complex analysis tool that fetches all pulse_checks for a cohort and calculates trends over time. Provides impact analysis and recommendations.', 'core', 'low', false),
  ('import_students_batch', 'Import Students Batch', 'Bulk imports students with UPN hashing. Privacy-First: UPNs are hashed using SHA-256 before storage. Requires admin or SLT role.', 'core', 'medium', false),
  ('create_cohort', 'Create Cohort', 'Creates a new cohort with filter criteria. Immediately counts and reports how many existing students match the criteria.', 'core', 'low', false)
on conflict (tool_key) do update set
  tool_name = excluded.tool_name,
  description = excluded.description,
  module_key = excluded.module_key,
  risk_level = excluded.risk_level,
  requires_approval = excluded.requires_approval;

