-- ============================================================================
-- SIM STUDIO & ASSESSMENT-AS-PLAY: CORE TABLES
-- Migration: 20260220_sim_studio_core.sql
-- ============================================================================

-- ============================================================================
-- BLUEPRINT SYSTEM
-- ============================================================================

-- Master blueprint definitions (controlled, seeded)
create table if not exists sim_blueprints (
  id text primary key,
  name text not null,
  subject text not null check (subject in ('maths', 'science', 'english', 'geography', 'history')),
  topic text not null,
  key_stage text check (key_stage in ('EYFS', 'KS1', 'KS2')),
  description text,
  render_config jsonb not null default '{}', -- Canvas rendering configuration
  interaction_config jsonb not null default '{}', -- Interaction handlers
  default_accessibility jsonb not null default '{}', -- Default accessibility settings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true
);

-- Published/draft simulation instances
create table if not exists sim_packages (
  id uuid primary key default gen_random_uuid(),
  blueprint_id text not null references sim_blueprints(id) on delete restrict,
  title text not null,
  description text,
  parameters jsonb not null default '{}', -- Blueprint-specific parameters
  scheme_pack_id text, -- Optional scheme alignment
  teacher_guide jsonb not null default '{}', -- {script, misconceptions, questions}
  evidence_pack jsonb, -- Optional embedded assessment
  accessibility_defaults jsonb not null default '{}',
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  published_at timestamp with time zone
);

-- Version history for sim packages
create table if not exists sim_versions (
  id uuid primary key default gen_random_uuid(),
  sim_package_id uuid not null references sim_packages(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null, -- Full package snapshot
  change_notes text,
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sim_package_id, version)
);

-- ============================================================================
-- SCHEME PACKS (Maths-first for MVP)
-- ============================================================================

create table if not exists scheme_packs (
  id text primary key,
  name text not null, -- 'White Rose Education', 'Power Maths', 'Maths - No Problem!'
  subject text not null default 'maths',
  vocabulary_map jsonb not null default '{}', -- {preferred_terms, avoid_terms}
  representation_order text[] not null default '{}', -- ['bar_model', 'number_line', 'abstract']
  step_conventions jsonb not null default '{}',
  common_misconceptions jsonb not null default '[]',
  small_steps_tags jsonb not null default '{}', -- Optional year/term mapping
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- QUEST ENGINE
-- ============================================================================

-- Quest definitions (templates)
create table if not exists quest_defs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text not null,
  topic text not null,
  key_stage text not null,
  estimated_minutes integer not null check (estimated_minutes between 1 and 15),
  items jsonb not null, -- Array of quest items (sim_package_id, prompts, criteria)
  reward_coins integer not null default 10,
  scaffold_presets text[] not null default '{standard}', -- Available scaffold options
  difficulty_level text check (difficulty_level in ('emerging', 'developing', 'secure', 'stretch')),
  language_load text check (language_load in ('low', 'high', 'mixed')) default 'mixed',
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by text references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quest runs (per pupil attempt)
create table if not exists quest_runs (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quest_defs(id) on delete cascade,
  pupil_id uuid not null references pupil_profiles(id) on delete cascade,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  item_results jsonb not null default '[]', -- Array of item results
  total_score numeric(5,2) check (total_score between 0 and 100),
  coins_earned integer default 0,
  scaffold_used text not null default 'standard',
  device_info jsonb, -- User agent, screen size for analytics
  completion_rate numeric(5,2) check (completion_rate between 0 and 100),
  unique(quest_id, pupil_id, started_at)
);

-- ============================================================================
-- PUPIL PROFILES (pseudonymous, privacy-first)
-- ============================================================================

create table if not exists pupil_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  class_name text, -- "Year 4 Hawthorn"
  display_name text, -- Optional teacher-set display name (not stored centrally)
  date_of_birth date, -- Optional for age-based content
  send_status text check (send_status in ('none', 'support', 'ehcp')),
  eal_status boolean default false,
  home_language text, -- ISO 639-1 code
  scaffold_preset text default 'standard',
  accessibility_settings jsonb not null default '{}', -- Per-pupil overrides
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb not null default '{}'
);

-- ============================================================================
-- TEACHER JUDGEMENTS & CALIBRATION
-- ============================================================================

-- Imported teacher assessments for calibration
create table if not exists teacher_judgements (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references pupil_profiles(id) on delete cascade,
  teacher_id text not null references users(id),
  subject text not null,
  topic text not null,
  skill text not null, -- "place_value", "fraction_equivalence", etc.
  judgement text not null check (judgement in ('emerging', 'developing', 'secure', 'stretch')),
  confidence text check (confidence in ('low', 'medium', 'high')),
  assessed_at date not null,
  import_batch_id uuid, -- For batch imports
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Moderation samples (optional MVP-lite)
create table if not exists moderation_samples (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references pupil_profiles(id) on delete cascade,
  quest_run_id uuid references quest_runs(id),
  moderator_id text references users(id),
  teacher_judgement_id uuid references teacher_judgements(id),
  moderation_outcome text check (moderation_outcome in ('agrees_teacher', 'agrees_schoolgle', 'differs', 'inconclusive')),
  notes text,
  sampled_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- TIMELINE INTEGRATION (Ofsted Readiness)
-- ============================================================================

-- Extend timeline pins to include Sim Studio events
-- Note: This references existing timeline_pins table if it exists
-- If not, we'll create a lightweight version

create table if not exists sim_studio_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  event_type text not null check (event_type in (
    'mismatch_detected',
    'scheme_change',
    'intervention_started',
    'intervention_ended',
    'cpd_completed',
    'staffing_change',
    'cohort_shift',
    'calibration_check'
  )),
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  trigger text, -- What was noticed
  hypothesis text, -- Why we think it happened
  action text, -- What was changed
  review_date date,
  evidence_before jsonb, -- Snapshot before
  evidence_after jsonb, -- Snapshot after (when available)
  impact_summary text,
  confidence_level text check (confidence_level in ('low', 'medium', 'high')),
  metadata jsonb not null default '{}',
  created_by text references users(id)
);

-- ============================================================================
-- ANALYTICS & EVIDENCE
-- ============================================================================

-- Aggregate skill snapshots (for performance)
create table if not exists skill_snapshots (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references pupil_profiles(id) on delete cascade,
  skill text not null, -- "place_value_partitioning", "fraction_equivalence"
  concept_score numeric(5,2), -- Scaffolded performance
  transfer_score numeric(5,2), -- Unsupported performance
  confidence text check (confidence in ('low', 'medium', 'high', 'insufficient_data')),
  trend text check (trend in ('improving', 'stable', 'declining', 'unknown')),
  misconceptions jsonb not null default '[]',
  last_quest_at timestamp with time zone,
  evidence_coverage numeric(5,2) check (evidence_coverage between 0 and 100),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(pupil_id, skill)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Sim packages lookups
create index if not exists idx_sim_packages_blueprint on sim_packages(blueprint_id);
create index if not exists idx_sim_packages_status on sim_packages(status);
create index if not exists idx_sim_packages_scheme on sim_packages(scheme_pack_id);

-- Quest lookups
create index if not exists idx_quest_runs_pupil on quest_runs(pupil_id);
create index if not exists idx_quest_runs_quest on quest_runs(quest_id);
create index if not exists idx_quest_runs_dates on quest_runs(started_at desc);

-- Pupil lookups
create index if not exists idx_pupil_profiles_org on pupil_profiles(organization_id);
create index if not exists idx_pupil_profiles_class on pupil_profiles(class_name);

-- Teacher judgements
create index if not exists idx_teacher_judgements_pupil on teacher_judgements(pupil_id);
create index if not exists idx_teacher_judgements_teacher on teacher_judgements(teacher_id);

-- Timeline events
create index if not exists idx_timeline_events_org on sim_studio_timeline_events(organization_id);
create index if not exists idx_timeline_events_type on sim_studio_timeline_events(event_type);
create index if not exists idx_timeline_events_date on sim_studio_timeline_events(timestamp desc);

-- Skill snapshots
create index if not exists idx_skill_snapshots_pupil on skill_snapshots(pupil_id);
create index if not exists idx_skill_snapshots_skill on skill_snapshots(skill);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table sim_blueprints enable row level security;
alter table sim_packages enable row level security;
alter table sim_versions enable row level security;
alter table scheme_packs enable row level security;
alter table quest_defs enable row level security;
alter table quest_runs enable row level security;
alter table pupil_profiles enable row level security;
alter table teacher_judgements enable row level security;
alter table moderation_samples enable row level security;
alter table sim_studio_timeline_events enable row level security;
alter table skill_snapshots enable row level security;

-- Blueprints: Everyone can read active, only admins can write
create policy "Active blueprints are readable by all authenticated users"
  on sim_blueprints for select
  to authenticated
  using (is_active = true);

create policy "Only admins can insert blueprints"
  on sim_blueprints for insert
  to authenticated
  with check (
    exists (
      select 1 from organization_members
      where organization_members.user_id = auth.uid()
      and organization_members.role in ('admin', 'slt')
    )
  );

-- Sim packages: Read published, org can read their own drafts
create policy "Published sim packages are readable by all authenticated users"
  on sim_packages for select
  to authenticated
  using (status = 'published');

create policy "Organizations can read their own draft sim packages"
  on sim_packages for select
  to authenticated
  using (
    status = 'draft' and
    exists (
      select 1 from organization_members om
      where om.user_id = auth.uid()
      and om.organization_id in (
        select organization_id from users where id = auth.uid()
      )
    )
  );

-- Quest runs: Complex permissions
create policy "Pupils can read their own quest runs"
  on quest_runs for select
  to authenticated
  using (
    exists (
      select 1 from pupil_profiles pp
      join organization_members om on pp.organization_id = om.organization_id
      where pp.id = quest_runs.pupil_id
      and om.user_id = auth.uid()
    )
  );

-- Pupil profiles: Organization-level access
create policy "Organizations can read their pupils"
  on pupil_profiles for select
  to authenticated
  using (
    exists (
      select 1 from organization_members om
      where om.organization_id = pupil_profiles.organization_id
      and om.user_id = auth.uid()
    )
  );

-- Teacher judgements: Teacher can read their own, SLT can read all in org
create policy "Teachers can read their own judgements"
  on teacher_judgements for select
  to authenticated
  using (teacher_id = auth.uid());

create policy "SLT can read all judgements in their organization"
  on teacher_judgements for select
  to authenticated
  using (
    exists (
      select 1 from organization_members om
      join pupil_profiles pp on pp.organization_id = om.organization_id
      where om.user_id = auth.uid()
      and om.role in ('slt', 'admin')
      and pp.id = teacher_judgements.pupil_id
    )
  );

-- Timeline events: Organization-level access
create policy "Organizations can read their timeline events"
  on sim_studio_timeline_events for select
  to authenticated
  using (
    exists (
      select 1 from organization_members om
      where om.organization_id = sim_studio_timeline_events.organization_id
      and om.user_id = auth.uid()
    )
  );

-- Skill snapshots: Organization-level access
create policy "Organizations can read their skill snapshots"
  on skill_snapshots for select
  to authenticated
  using (
    exists (
      select 1 from pupil_profiles pp
      join organization_members om on pp.organization_id = om.organization_id
      where pp.id = skill_snapshots.pupil_id
      and om.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply to tables with updated_at
create trigger update_sim_blueprints_updated_at before update on sim_blueprints
  for each row execute function update_updated_at_column();

create trigger update_sim_packages_updated_at before update on sim_packages
  for each row execute function update_updated_at_column();

create trigger update_scheme_packs_updated_at before update on scheme_packs
  for each row execute function update_updated_at_column();

create trigger update_quest_defs_updated_at before update on quest_defs
  for each row execute function update_updated_at_column();

create trigger update_pupil_profiles_last_active before update on pupil_profiles
  for each row execute function update_updated_at_column();

create trigger update_skill_snapshots_updated_at before update on skill_snapshots
  for each row execute function update_updated_at_column();

-- ============================================================================
-- SEED DATA (Initial Scheme Packs)
-- ============================================================================

-- White Rose Education
insert into scheme_packs (id, name, subject, vocabulary_map, representation_order, step_conventions, common_misconceptions)
values (
  'whiterose_maths',
  'White Rose Education',
  'maths',
  '{
    "preferred_terms": ["partition", "exchange", "regroup", "part-whole model", "bar model", "array"],
    "avoid_terms": ["borrow", "carry", "reduce", "cancel"]
  }'::jsonb,
  '{"concrete", "pictorial", "abstract"}'::text[],
  '{
    "small_steps": true,
    "fluency_first": true,
    "reasoning_embedded": true
  }'::jsonb,
  '[
    {"misconception": "Confusing partitioning with splitting", "indicator": "pupil splits digit by digit without value context"},
    {"misconception": "Zero as placeholder", "indicator": "pupil ignores zeros in calculations"},
    {"misconception": "Equivalence confusion", "indicator": "pupil treats 1/2 as different size from 2/4"}
  ]'::jsonb
) on conflict (id) do nothing;

-- Power Maths
insert into scheme_packs (id, name, subject, vocabulary_map, representation_order, step_conventions, common_misconceptions)
values (
  'power_maths',
  'Power Maths',
  'maths',
  '{
    "preferred_terms": ["partition", "regroup", "part-whole model", "bar model"],
    "avoid_terms": ["borrow", "carry", "cancel"]
  }'::jsonb,
  '{"concrete", "pictorial", "abstract"}'::text[],
  '{
    "characters": ["Max", "Ravi", "Flo", "Moe"],
    "discover_share_think": true,
    "practice_threads": true
  }'::jsonb,
  '[
    {"misconception": "Place value erosion", "indicator": "pupil loses place value in multi-digit calculations"},
    {"misconception": "Fraction as number", "indicator": "pupil treats fractions as labels not numbers"}
  ]'::jsonb
) on conflict (id) do nothing;

-- Maths - No Problem!
insert into scheme_packs (id, name, subject, vocabulary_map, representation_order, step_conventions, common_misconceptions)
values (
  'mnp_maths',
  'Maths - No Problem!',
  'maths',
  '{
    "preferred_terms": ["partition", "regroup", "part-whole", "bar model"],
    "avoid_terms": ["borrow", "carry", "reduce"]
  }'::jsonb,
  '{"concrete", "pictorial", "abstract"}'::text[],
  '{
    "journaling": true,
    "guided_practice": true,
    "individual_practice": true
  }'::jsonb,
  '[
    {"misconception": "Algorithm without understanding", "indicator": "pupil follows steps without explaining"},
    {"misconception": "Fraction size", "indicator": "pupil thinks larger denominator = larger fraction"}
  ]'::jsonb
) on conflict (id) do nothing;

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table sim_blueprints is 'Master simulation blueprints - controlled, seeded definitions';
comment on table sim_packages is 'Published simulation instances - blueprint + parameters + content';
comment on table quest_defs is 'Quest templates - 3-6 micro-assessments with evidence packs';
comment on table quest_runs is 'Per-pupil quest attempts - captures all telemetry and outcomes';
comment on table pupil_profiles is 'Pseudonymous learner profiles - privacy-first pupil data';
comment on table teacher_judgements is 'Imported teacher assessments for calibration';
comment on table sim_studio_timeline_events is 'Timeline pins for Ofsted readiness narrative';
comment on table skill_snapshots is 'Aggregated skill mastery - concept vs transfer';
comment on table scheme_packs is 'Scheme-specific configurations (White Rose, Power Maths, MNP)';
