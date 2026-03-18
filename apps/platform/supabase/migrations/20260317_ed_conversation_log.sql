-- Ed Conversation Log
-- Lightweight topic tracking for conversation continuity.
-- Stores ONLY domain + topic summary — NO chat content, NO PII.
-- Ed uses this to say "we were last looking at X" when greeting users.

CREATE TABLE IF NOT EXISTS ed_conversation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  topic_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup: recent topics per user per org
CREATE INDEX IF NOT EXISTS idx_ed_conversation_log_user
  ON ed_conversation_log (organization_id, user_id, created_at DESC);

-- Auto-cleanup: only keep last 30 days of topic logs
-- (lightweight data, but no reason to keep forever)
CREATE INDEX IF NOT EXISTS idx_ed_conversation_log_cleanup
  ON ed_conversation_log (created_at);

-- RLS: users can only see their own conversation topics within their org
ALTER TABLE ed_conversation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ed_conversation_log_user_policy ON ed_conversation_log;
CREATE POLICY ed_conversation_log_user_policy ON ed_conversation_log
  FOR ALL
  USING (
    user_id = auth.uid()::text
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );

-- Service role bypass for API logging
DROP POLICY IF EXISTS ed_conversation_log_service_policy ON ed_conversation_log;
CREATE POLICY ed_conversation_log_service_policy ON ed_conversation_log
  FOR ALL
  USING (auth.role() = 'service_role');
