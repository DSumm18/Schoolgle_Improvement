-- ============================================================================
-- SIM STUDIO: THEME/SKIN SYSTEM
-- Migration: 20260220_sim_studio_themes.sql
-- Lightweight theming for future-proof game layer (no 3D/sandbox yet)
-- ============================================================================

-- ============================================================================
-- THEME PACKS TABLE
-- ============================================================================

create table if not exists theme_packs (
  id text primary key,
  name text not null,
  description text,
  asset_pack_key text not null default 'classic', -- References asset bundle
  copy_pack jsonb not null default '{}', -- {ui_strings, quest_prompts, feedback_messages, character_names}
  reward_catalog jsonb not null default '{}', -- {avatar_items, badges, coins_multiplier}
  ui_palette jsonb not null default '{}', -- {colors, fonts, icons}
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add theme_id columns to existing tables
alter table quest_defs
  add column if not exists theme_id text references theme_packs(id) on delete set null;

alter table quest_defs
  alter column theme_id set default 'classic';

alter table sim_packages
  add column if not exists theme_id text references theme_packs(id) on delete set null;

alter table sim_packages
  alter column theme_id set default 'classic';

-- ============================================================================
-- SEED THEME PACKS
-- ============================================================================

-- Classic Theme (default, school-friendly)
insert into theme_packs (id, name, description, asset_pack_key, copy_pack, reward_catalog, ui_palette)
values (
  'classic',
  'Classic School',
  'Clean, professional school theme',
  'classic',
  '{
    "ui_strings": {
      "quest_start": "Start your adventure!",
      "quest_complete": "Quest Complete!",
      "quest_failed": "Try Again!",
      "correct": "Well done!",
      "incorrect": "Not quite, try again",
      "hint": "Need a hint?",
      "coins_earned": "coins earned"
    },
    "quest_prompts": {
      "generic": "Can you solve this challenge?",
      "maths": "Let''s explore numbers together!",
      "place_value": "Build the number using blocks"
    },
    "feedback_messages": {
      "encouragement": ["You can do it!", "Keep going!", "Almost there!"],
      "success": ["Excellent!", "Wonderful!", "Great work!"],
      "partial": ["Good start!", "Nearly there!", "On the right track!"]
    },
    "character_names": {
      "teacher": "Teacher",
      "guide": "Guide"
    }
  }'::jsonb,
  '{
    "avatar_items": ["star", "trophy", "medal", "ribbon"],
    "badges": ["explorer", "mathematician", "problem_solver", "team_player"],
    "coins_multiplier": 1.0
  }'::jsonb,
  '{
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#10b981",
      "accent": "#f59e0b",
      "success": "#22c55e",
      "error": "#ef4444",
      "background": "#f8fafc",
      "surface": "#ffffff"
    },
    "fonts": {
      "heading": "system-ui",
      "body": "system-ui",
      "mono": "monospace"
    },
    "icons": {
      "quest": "⚔️",
      "coins": "🪙",
      "star": "⭐",
      "trophy": "🏆"
    }
  }'::jsonb
) on conflict (id) do nothing;

-- Space Explorer Theme (engaging, popular with pupils)
insert into theme_packs (id, name, description, asset_pack_key, copy_pack, reward_catalog, ui_palette)
values (
  'space_explorer',
  'Space Explorer',
  'Journey through the cosmos solving mathematical challenges',
  'space',
  '{
    "ui_strings": {
      "quest_start": "Launch mission!",
      "quest_complete": "Mission Accomplished!",
      "quest_failed": "Mission Failed - Retry",
      "correct": "Systems nominal!",
      "incorrect": "Calculations needed",
      "hint": "Request guidance from Mission Control",
      "coins_earned": "star crystals collected"
    },
    "quest_prompts": {
      "generic": "Prepare for launch sequence",
      "maths": "Calculate trajectory for hyperspace jump",
      "place_value": "Configure the hyperdrive with the correct coordinates"
    },
    "feedback_messages": {
      "encouragement": ["Boosters ready!", "Staying on course!", "Approaching target!"],
      "success": ["Orbit achieved!", "Transmission received!", "Mission success!"],
      "partial": ["Adjusting trajectory", "Sensors locked on", "Course correction needed"]
    },
    "character_names": {
      "teacher": "Commander",
      "guide": "Navigator AI"
    }
  }'::jsonb,
  '{
    "avatar_items": ["helmet", "rocket", "planet", "star_cluster"],
    "badges": ["space_cadet", "pilot", "commander", "explorer"],
    "coins_multiplier": 1.2
  }'::jsonb,
  '{
    "colors": {
      "primary": "#8b5cf6",
      "secondary": "#06b6d4",
      "accent": "#f59e0b",
      "success": "#10b981",
      "error": "#ef4444",
      "background": "#0f172a",
      "surface": "#1e293b"
    },
    "fonts": {
      "heading": "system-ui",
      "body": "system-ui",
      "mono": "monospace"
    },
    "icons": {
      "quest": "🚀",
      "coins": "💎",
      "star": "⭐",
      "trophy": "🏆"
    }
  }'::jsonb
) on conflict (id) do nothing;

-- Forest Adventure Theme (nature, calming)
insert into theme_packs (id, name, description, asset_pack_key, copy_pack, reward_catalog, ui_palette)
values (
  'forest_adventure',
  'Forest Adventure',
  'Explore enchanted woodlands and solve nature puzzles',
  'forest',
  '{
    "ui_strings": {
      "quest_start": "Begin your journey!",
      "quest_complete": "Trail completed!",
      "quest_failed": "Path blocked - try again",
      "correct": "Right path!",
      "incorrect": "Look carefully",
      "hint": "Ask the forest spirits",
      "coins_earned": "acorns collected"
    },
    "quest_prompts": {
      "generic": "The forest awaits",
      "maths": "Count the ancient trees",
      "place_value": "Arrange the stones by the stream"
    },
    "feedback_messages": {
      "encouragement": ["Keep exploring!", "You''re on the right path!", "The way is clear!"],
      "success": ["Brilliant!", "Wonderful discovery!", "Quest complete!"],
      "partial": ["Almost there!", "Getting warmer!", "Good progress!"]
    },
    "character_names": {
      "teacher": "Forest Guide",
      "guide": "Wisps"
    }
  }'::jsonb,
  '{
    "avatar_items": ["leaf", "acorn", "mushroom", "flower"],
    "badges": ["explorer", "guardian", "ranger", "naturalist"],
    "coins_multiplier": 1.1
  }'::jsonb,
  '{
    "colors": {
      "primary": "#22c55e",
      "secondary": "#84cc16",
      "accent": "#f59e0b",
      "success": "#10b981",
      "error": "#ef4444",
      "background": "#f0fdf4",
      "surface": "#ffffff"
    },
    "fonts": {
      "heading": "system-ui",
      "body": "system-ui",
      "mono": "monospace"
    },
    "icons": {
      "quest": "🌲",
      "coins": "🌰",
      "star": "✨",
      "trophy": "🏅"
    }
  }'::jsonb
) on conflict (id) do nothing;

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_theme_packs_active on theme_packs(is_active);
create index if not exists idx_quest_defs_theme on quest_defs(theme_id) where theme_id is not null;
create index if not exists idx_sim_packages_theme on sim_packages(theme_id) where theme_id is not null;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table theme_packs enable row level security;

-- Everyone can read active themes
create policy "Active theme packs are readable by all authenticated users"
  on theme_packs for select
  to authenticated
  using (is_active = true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update theme pack timestamp
create trigger update_theme_packs_updated_at before update on theme_packs
  for each row execute function update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table theme_packs is 'Theme/skin packs for game layer - affects copy and visuals, not gameplay';
comment on column quest_defs.theme_id is 'Theme override for this quest (default: classic)';
comment on column sim_packages.theme_id is 'Theme override for this simulation (default: classic)';

-- ============================================================================
-- THEME APPLICATION NOTES
-- ============================================================================

-- Theme system principles:
-- 1. Assessment logic MUST be identical across themes (fair comparability)
-- 2. Only change: copy strings, visual assets, reward multipliers
-- 3. NEVER change: difficulty, scoring, success criteria, time limits
-- 4. Theme application happens at render time, not in database
-- 5. Default theme 'classic' for all existing content

-- Future phases will add:
-- - Asset pack storage (Supabase Storage or CDN)
-- - Per-pupil theme preferences in pupil_profiles
-- - Theme selection in quest assignment
-- - Theme-specific analytics (engagement by theme)
