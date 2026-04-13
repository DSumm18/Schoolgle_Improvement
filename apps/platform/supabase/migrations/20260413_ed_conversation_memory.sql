-- Ed Conversation Memory — Database-First + Short-Term Chat Cache
-- Board decision: 13 April 2026
-- Tables use organization_id (not school_id) to match existing codebase conventions.
-- All PII is scrubbed by SchoolDataGuardian.scrub() BEFORE write. No personal data stored.

-- 1. Conversation metadata (kept as long as org account exists)
CREATE TABLE IF NOT EXISTS ed_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  domain TEXT DEFAULT 'general',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Scrubbed chat cache (retention managed by school settings)
CREATE TABLE IF NOT EXISTS ed_chat_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ed_conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  scrubbed_content TEXT NOT NULL,
  domain TEXT,
  guardian_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. School settings for chat memory
CREATE TABLE IF NOT EXISTS ed_memory_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  chat_cache_retention_days INTEGER NOT NULL DEFAULT 7
    CHECK (chat_cache_retention_days IN (0, 7, 14, 30)),
  exclude_safeguarding BOOLEAN NOT NULL DEFAULT true,
  exclude_hr BOOLEAN NOT NULL DEFAULT false,
  trust_metadata_sharing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ed_conversations_user
  ON ed_conversations(organization_id, user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_ed_chat_cache_created
  ON ed_chat_cache(organization_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ed_chat_cache_conversation
  ON ed_chat_cache(conversation_id, created_at);

-- RLS
ALTER TABLE ed_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_chat_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_memory_settings ENABLE ROW LEVEL SECURITY;

-- Users see own conversations
DROP POLICY IF EXISTS ed_conversations_user_policy ON ed_conversations;
CREATE POLICY ed_conversations_user_policy ON ed_conversations
  FOR SELECT USING (user_id = auth.uid()::text);

-- Service role for API writes
DROP POLICY IF EXISTS ed_conversations_service_policy ON ed_conversations;
CREATE POLICY ed_conversations_service_policy ON ed_conversations
  FOR ALL USING (auth.role() = 'service_role');

-- Users see own cache
DROP POLICY IF EXISTS ed_chat_cache_user_policy ON ed_chat_cache;
CREATE POLICY ed_chat_cache_user_policy ON ed_chat_cache
  FOR SELECT USING (user_id = auth.uid()::text);

-- Service role for API writes
DROP POLICY IF EXISTS ed_chat_cache_service_policy ON ed_chat_cache;
CREATE POLICY ed_chat_cache_service_policy ON ed_chat_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Admins see school conversations (metadata only)
DROP POLICY IF EXISTS ed_conversations_admin_policy ON ed_conversations;
CREATE POLICY ed_conversations_admin_policy ON ed_conversations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE organization_members.user_id = auth.uid()::text
        AND organization_members.role IN ('admin', 'headteacher', 'slt')
    )
  );

-- Settings managed by admins
DROP POLICY IF EXISTS ed_memory_settings_admin_policy ON ed_memory_settings;
CREATE POLICY ed_memory_settings_admin_policy ON ed_memory_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE organization_members.user_id = auth.uid()::text
        AND organization_members.role IN ('admin', 'headteacher', 'slt')
    )
  );

-- Service role bypass for settings
DROP POLICY IF EXISTS ed_memory_settings_service_policy ON ed_memory_settings;
CREATE POLICY ed_memory_settings_service_policy ON ed_memory_settings
  FOR ALL USING (auth.role() = 'service_role');
