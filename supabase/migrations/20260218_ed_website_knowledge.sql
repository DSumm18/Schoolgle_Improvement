-- Ed Website Knowledge Base
-- Stores scanned website content for Ed to use when answering visitor questions

CREATE TABLE IF NOT EXISTS ed_website_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,

  -- Page information
  page_url TEXT NOT NULL,
  page_title TEXT,
  content TEXT,
  meta_description TEXT,

  -- Extracted structured data
  headings TEXT[],
  links JSONB DEFAULT '[]'::jsonb,

  -- Content classification
  content_type TEXT CHECK (content_type IN ('page', 'news', 'event', 'policy', 'other')),

  -- Change detection
  content_hash TEXT,
  last_scanned TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT ed_website_knowledge_unique UNIQUE (organization_id, page_url)
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS ed_website_knowledge_org_idx ON ed_website_knowledge(organization_id);
CREATE INDEX IF NOT EXISTS ed_website_knowledge_domain_idx ON ed_website_knowledge(domain);
CREATE INDEX IF NOT EXISTS ed_website_knowledge_type_idx ON ed_website_knowledge(content_type);
CREATE INDEX IF NOT EXISTS ed_website_knowledge_scanned_idx ON ed_website_knowledge(last_scanned DESC);

-- Enable full-text search on content
CREATE INDEX IF NOT EXISTS ed_website_knowledge_content_fts ON ed_website_knowledge
  USING gin(to_tsvector('english', page_title || ' ' || COALESCE(content, '')));

-- Comment
COMMENT ON TABLE ed_website_knowledge IS 'Ed Website Knowledge Base - scanned website content for answering visitor questions';
COMMENT ON COLUMN ed_website_knowledge.content_hash IS 'Hash of page content for change detection';
COMMENT ON COLUMN ed_website_knowledge.content_type IS 'Type of page: page, news, event, policy, other';
COMMENT ON COLUMN ed_website_knowledge.headings IS 'Extracted H1-H6 headings from the page';

-- Row Level Security
ALTER TABLE ed_website_knowledge ENABLE ROW LEVEL SECURITY;

-- Policies: Organizations can only access their own knowledge
CREATE POLICY "Organizations can view own website knowledge"
  ON ed_website_knowledge FOR SELECT
  USING (organization_id = (
    SELECT id FROM organizations WHERE id = organization_id
  ));

CREATE POLICY "Organizations can insert own website knowledge"
  ON ed_website_knowledge FOR INSERT
  WITH CHECK (organization_id = (
    SELECT id FROM organizations WHERE id = organization_id
  ));

CREATE POLICY "Organizations can update own website knowledge"
  ON ed_website_knowledge FOR UPDATE
  USING (organization_id = (
    SELECT id FROM organizations WHERE id = organization_id
  ));

CREATE POLICY "Organizations can delete own website knowledge"
  ON ed_website_knowledge FOR DELETE
  USING (organization_id = (
    SELECT id FROM organizations WHERE id = organization_id
  ));

-- Service role can do everything
CREATE POLICY "Service role has full access to ed_website_knowledge"
  ON ed_website_knowledge FOR ALL
  TO service_role
  USING (true);

-- Function for full-text search with relevance ranking
CREATE OR REPLACE FUNCTION match_website_knowledge(
  search_query TEXT,
  org_id UUID
)
RETURNS TABLE (
  page_url TEXT,
  page_title TEXT,
  content TEXT,
  headings TEXT[],
  content_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.page_url,
    kb.page_title,
    kb.content,
    kb.headings,
    kb.content_type
  FROM ed_website_knowledge kb
  WHERE kb.organization_id = match_website_knowledge.org_id
    AND (
      kb.page_title % search_query
      OR kb.content % search_query
      OR kb.headings % search_query
    )
  ORDER BY
    CASE
      WHEN kb.page_title % search_query THEN 1
      WHEN kb.headings % search_query THEN 2
      WHEN kb.content % search_query THEN 3
      ELSE 4
    END,
    kb.last_scanned DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_website_knowledge TO service_role, authenticated, anon;
