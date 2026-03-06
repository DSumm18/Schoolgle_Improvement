-- Ed Knowledge Patterns - Self-improving knowledge base
-- Stores HOW-TO patterns, system knowledge, and school config
-- NEVER stores personal data, conversation content, or screenshots

-- Global + school-level knowledge patterns
CREATE TABLE IF NOT EXISTS ed_knowledge_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope: NULL = global (all schools), org_id = school-specific
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- What this knowledge is about
  domain TEXT NOT NULL CHECK (domain IN (
    'estates', 'hr', 'send', 'data', 'curriculum',
    'it-tech', 'procurement', 'governance', 'compliance',
    'communications', 'general', 'system-help'
  )),

  -- The system/tool this relates to (nullable for general knowledge)
  system_name TEXT, -- e.g. 'sims', 'arbor', 'bromcom', 'every', 'cpoms', 'parentpay'

  -- The pattern
  trigger_phrases TEXT[] NOT NULL, -- phrases that should match this pattern
  question_pattern TEXT NOT NULL, -- canonical form of the question
  answer TEXT NOT NULL, -- the answer/how-to

  -- Quality signals
  confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  verified_by UUID REFERENCES auth.users(id), -- admin who verified
  verified_at TIMESTAMPTZ,

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('ai_learned', 'user_taught', 'admin_verified', 'web_search', 'imported')),
  source_url TEXT, -- where the knowledge came from

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1
);

-- Indexes for fast lookup
CREATE INDEX idx_ed_knowledge_patterns_domain ON ed_knowledge_patterns(domain) WHERE is_active = TRUE;
CREATE INDEX idx_ed_knowledge_patterns_org ON ed_knowledge_patterns(organization_id) WHERE is_active = TRUE;
CREATE INDEX idx_ed_knowledge_patterns_system ON ed_knowledge_patterns(system_name) WHERE is_active = TRUE AND system_name IS NOT NULL;
CREATE INDEX idx_ed_knowledge_patterns_confidence ON ed_knowledge_patterns(confidence DESC) WHERE is_active = TRUE;

-- Full text search on trigger phrases and answers
CREATE INDEX idx_ed_knowledge_patterns_search ON ed_knowledge_patterns
  USING GIN (to_tsvector('english', question_pattern || ' ' || answer));

-- Trigger phrases array search
CREATE INDEX idx_ed_knowledge_patterns_triggers ON ed_knowledge_patterns USING GIN (trigger_phrases);

-- RLS policies
ALTER TABLE ed_knowledge_patterns ENABLE ROW LEVEL SECURITY;

-- Anyone can read global patterns
CREATE POLICY "read_global_knowledge" ON ed_knowledge_patterns
  FOR SELECT USING (organization_id IS NULL AND is_active = TRUE);

-- Org members can read their school's patterns
CREATE POLICY "read_org_knowledge" ON ed_knowledge_patterns
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all
CREATE POLICY "service_manage_knowledge" ON ed_knowledge_patterns
  FOR ALL USING (auth.role() = 'service_role');

-- Ed skill audit log (WHO did WHAT action, WHEN - but not the content)
CREATE TABLE IF NOT EXISTS ed_skill_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- What was done
  skill_name TEXT NOT NULL, -- e.g. 'create_helpdesk_ticket'
  action_summary TEXT NOT NULL, -- e.g. 'Created helpdesk ticket' (no PII)

  -- Result
  success BOOLEAN NOT NULL,
  record_id TEXT, -- ID of created record (e.g. ticket ID)

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER
);

CREATE INDEX idx_ed_audit_org ON ed_skill_audit_log(organization_id, created_at DESC);
CREATE INDEX idx_ed_audit_user ON ed_skill_audit_log(user_id, created_at DESC);

ALTER TABLE ed_skill_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_audit" ON ed_skill_audit_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "read_org_audit" ON ed_skill_audit_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_manage_audit" ON ed_skill_audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- Function to search knowledge patterns
CREATE OR REPLACE FUNCTION search_ed_knowledge(
  p_query TEXT,
  p_org_id UUID DEFAULT NULL,
  p_domain TEXT DEFAULT NULL,
  p_system TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  domain TEXT,
  system_name TEXT,
  question_pattern TEXT,
  answer TEXT,
  confidence NUMERIC,
  helpful_count INTEGER,
  source TEXT,
  rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.domain,
    k.system_name,
    k.question_pattern,
    k.answer,
    k.confidence,
    k.helpful_count,
    k.source,
    ts_rank(
      to_tsvector('english', k.question_pattern || ' ' || k.answer),
      plainto_tsquery('english', p_query)
    ) AS rank
  FROM ed_knowledge_patterns k
  WHERE k.is_active = TRUE
    AND (k.organization_id IS NULL OR k.organization_id = p_org_id)
    AND (p_domain IS NULL OR k.domain = p_domain)
    AND (p_system IS NULL OR k.system_name = p_system)
    AND (
      to_tsvector('english', k.question_pattern || ' ' || k.answer) @@ plainto_tsquery('english', p_query)
      OR p_query = ANY(k.trigger_phrases)
    )
  ORDER BY
    -- Prefer verified, then high confidence, then rank
    (k.verified_at IS NOT NULL) DESC,
    k.confidence DESC,
    rank DESC
  LIMIT p_limit;
END;
$$;

-- Function to record feedback (upvote/downvote)
CREATE OR REPLACE FUNCTION ed_knowledge_feedback(
  p_knowledge_id UUID,
  p_helpful BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_helpful THEN
    UPDATE ed_knowledge_patterns
    SET helpful_count = helpful_count + 1,
        confidence = LEAST(1.0, confidence + 0.02),
        updated_at = NOW()
    WHERE id = p_knowledge_id;
  ELSE
    UPDATE ed_knowledge_patterns
    SET not_helpful_count = not_helpful_count + 1,
        confidence = GREATEST(0.0, confidence - 0.05),
        updated_at = NOW()
    WHERE id = p_knowledge_id;
  END IF;

  -- Auto-deactivate if too many downvotes
  UPDATE ed_knowledge_patterns
  SET is_active = FALSE
  WHERE id = p_knowledge_id
    AND not_helpful_count > 5
    AND not_helpful_count > helpful_count * 2;
END;
$$;
