-- Morning Brief Phase 1
-- 5 tables: morning_briefs, morning_brief_sections, morning_brief_deliveries,
--           morning_brief_preferences, morning_brief_audio

-- ─── 1. morning_briefs ─────────────────────────────────────────────
-- One row per generated brief per org per day.

CREATE TABLE IF NOT EXISTS morning_briefs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generated_at  timestamptz NOT NULL DEFAULT now(),
  headline      text NOT NULL,
  sections      jsonb NOT NULL DEFAULT '{}',
  script_text   text,
  audio_url     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_morning_briefs_org_date
  ON morning_briefs (organization_id, generated_at DESC);

-- ─── 2. morning_brief_sections ─────────────────────────────────────
-- Denormalised per-section rows for querying / trending individual domains.

CREATE TABLE IF NOT EXISTS morning_brief_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id      uuid NOT NULL REFERENCES morning_briefs(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  section_key   text NOT NULL,          -- compliance | tasks | risks | staffing | calendar
  rag           text NOT NULL CHECK (rag IN ('green','amber','red')),
  item_count    int NOT NULL DEFAULT 0,
  items         jsonb NOT NULL DEFAULT '[]',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_brief_sections_brief ON morning_brief_sections (brief_id);
CREATE INDEX idx_brief_sections_org   ON morning_brief_sections (organization_id, section_key);

-- ─── 3. morning_brief_deliveries ───────────────────────────────────
-- Tracks who received the brief and via which channel.

CREATE TABLE IF NOT EXISTS morning_brief_deliveries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id      uuid NOT NULL REFERENCES morning_briefs(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       text NOT NULL,
  channel       text NOT NULL CHECK (channel IN ('email','in_app','push','tts')),
  delivered_at  timestamptz NOT NULL DEFAULT now(),
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_brief_deliveries_brief ON morning_brief_deliveries (brief_id);
CREATE INDEX idx_brief_deliveries_user  ON morning_brief_deliveries (user_id, delivered_at DESC);

-- ─── 4. morning_brief_preferences ──────────────────────────────────
-- Per-user delivery preferences (time, channels, opt-out).

CREATE TABLE IF NOT EXISTS morning_brief_preferences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         text NOT NULL,
  enabled         boolean NOT NULL DEFAULT true,
  delivery_time   time NOT NULL DEFAULT '06:30',
  channels        text[] NOT NULL DEFAULT ARRAY['in_app'],
  include_audio   boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_brief_prefs_user ON morning_brief_preferences (user_id);

-- ─── 5. morning_brief_audio ────────────────────────────────────────
-- Stores generated audio metadata (actual files in Supabase Storage).

CREATE TABLE IF NOT EXISTS morning_brief_audio (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id        uuid NOT NULL REFERENCES morning_briefs(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  storage_path    text NOT NULL,
  duration_secs   int,
  voice_id        text NOT NULL DEFAULT '72e3a3135204461ba041df787dc5c834',
  file_size_bytes int,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_brief_audio_brief ON morning_brief_audio (brief_id);

-- ─── RLS Policies ──────────────────────────────────────────────────

ALTER TABLE morning_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_brief_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_brief_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_brief_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_brief_audio ENABLE ROW LEVEL SECURITY;

-- morning_briefs: org members can read their own org's briefs
CREATE POLICY "morning_briefs_select" ON morning_briefs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = morning_briefs.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "morning_briefs_insert" ON morning_briefs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = morning_briefs.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

-- morning_brief_sections: same org-scoped read
CREATE POLICY "brief_sections_select" ON morning_brief_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = morning_brief_sections.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "brief_sections_insert" ON morning_brief_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = morning_brief_sections.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

-- morning_brief_deliveries: users can read their own deliveries
CREATE POLICY "brief_deliveries_select" ON morning_brief_deliveries
  FOR SELECT USING (
    user_id = auth.jwt()->>'user_id'
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = morning_brief_deliveries.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
        AND role IN ('admin', 'headteacher')
    )
  );

CREATE POLICY "brief_deliveries_insert" ON morning_brief_deliveries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = morning_brief_deliveries.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

-- morning_brief_preferences: users manage their own prefs
CREATE POLICY "brief_prefs_select" ON morning_brief_preferences
  FOR SELECT USING (
    user_id = auth.jwt()->>'user_id'
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = morning_brief_preferences.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
        AND role IN ('admin', 'headteacher')
    )
  );

CREATE POLICY "brief_prefs_upsert" ON morning_brief_preferences
  FOR INSERT WITH CHECK (
    user_id = auth.jwt()->>'user_id'
  );

CREATE POLICY "brief_prefs_update" ON morning_brief_preferences
  FOR UPDATE USING (
    user_id = auth.jwt()->>'user_id'
  );

-- morning_brief_audio: org members can read
CREATE POLICY "brief_audio_select" ON morning_brief_audio
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = morning_brief_audio.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "brief_audio_insert" ON morning_brief_audio
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = morning_brief_audio.organization_id
        AND (user_id = auth.jwt()->>'user_id' OR auth_id::text = auth.uid()::text)
    )
  );
