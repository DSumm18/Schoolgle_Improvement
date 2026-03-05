-- Migration: Ed Knowledge Base
-- Description: Creates the ed_knowledge_base table for storing verified Q&A with freshness tracking
-- Date: 2025-01-24

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For trigram similarity search

-- ============================================================================
-- TABLE: ed_knowledge_base
-- ============================================================================
-- Stores verified Q&A for Ed chatbot with confidence levels and freshness tracking

CREATE TABLE IF NOT EXISTS ed_knowledge_base (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  domain TEXT NOT NULL CHECK (domain IN (
    'estates', 'hr', 'send', 'data', 'curriculum',
    'it-tech', 'procurement', 'governance', 'communications', 'general'
  )),
  topic TEXT NOT NULL,
  question TEXT,
  answer TEXT NOT NULL,

  -- Source tracking
  source_url TEXT,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,  -- 'HSE', 'DfE', 'ACAS', 'Gov.uk', etc.

  -- Confidence and freshness
  confidence TEXT NOT NULL CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  last_verified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_review_due TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Full-text search vector (automatically generated)
  tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(question, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(topic, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(answer, '')), 'B')
  ) STORED,

  -- Trigram vector for fuzzy matching
  tgv tsvector GENERATED ALWAYS AS (
    question || ' ' || topic || ' ' || answer
  ) STORED
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Domain index for filtering
CREATE INDEX idx_ed_knowledge_domain ON ed_knowledge_base(domain);

-- Topic index for browsing
CREATE INDEX idx_ed_knowledge_topic ON ed_knowledge_base(topic);

-- Confidence index for filtering high-confidence answers
CREATE INDEX idx_ed_knowledge_confidence ON ed_knowledge_base(confidence);

-- Freshness indexes
CREATE INDEX idx_ed_knowledge_last_verified ON ed_knowledge_base(last_verified DESC);
CREATE INDEX idx_ed_knowledge_next_review ON ed_knowledge_base(next_review_due) WHERE next_review_due IS NOT NULL;

-- GIN index for full-text search
CREATE INDEX idx_ed_knowledge_tsv ON ed_knowledge_base USING GIN(tsv);

-- GIN index for trigram search
CREATE INDEX idx_ed_knowledge_tgv ON ed_knowledge_base USING GIN(tgv gin_trgm_ops);

-- Composite index for domain + confidence (common query pattern)
CREATE INDEX idx_ed_knowledge_domain_confidence ON ed_knowledge_base(domain, confidence);

-- Source type index
CREATE INDEX idx_ed_knowledge_source_type ON ed_knowledge_base(source_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ed_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Anyone can read HIGH and MEDIUM confidence knowledge
CREATE POLICY "Anyone can read active knowledge"
  ON ed_knowledge_base
  FOR SELECT
  USING (confidence IN ('HIGH', 'MEDIUM'));

-- Only authenticated users can insert (via API)
CREATE POLICY "Authenticated users can insert knowledge"
  ON ed_knowledge_base
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only knowledge creators or admins can update
CREATE POLICY "Knowledge creators can update own entries"
  ON ed_knowledge_base
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR jwt_claim_text('role') = 'admin');

-- Only admins can delete
CREATE POLICY "Admins can delete knowledge"
  ON ed_knowledge_base
  FOR DELETE
  TO authenticated
  USING (jwt_claim_text('role') = 'admin');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Search function with ranking
CREATE OR REPLACE FUNCTION search_knowledge_base(
  search_query TEXT,
  domain_filter TEXT DEFAULT NULL,
  confidence_filter TEXT DEFAULT 'HIGH',
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  domain TEXT,
  topic TEXT,
  question TEXT,
  answer TEXT,
  source_url TEXT,
  source_name TEXT,
  source_type TEXT,
  confidence TEXT,
  last_verified TIMESTAMPTZ,
  next_review_due TIMESTAMPTZ,
  version INT,
  rank REAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_tsvector tsvector;
BEGIN
  -- Convert query to tsvector for searching
  search_tsvector := to_tsvector('english', search_query);

  RETURN QUERY
  SELECT
    kb.id,
    kb.domain,
    kb.topic,
    kb.question,
    kb.answer,
    kb.source_url,
    kb.source_name,
    kb.source_type,
    kb.confidence,
    kb.last_verified,
    kb.next_review_due,
    kb.version,
    ts_rank(kb.tsv, search_tsvector) AS rank
  FROM ed_knowledge_base kb
  WHERE
    kb.tsv @@ search_tsvector
    AND (domain_filter IS NULL OR kb.domain = domain_filter)
    AND kb.confidence = confidence_filter
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$;

-- Fuzzy search function (for typos, partial matches)
CREATE OR REPLACE FUNCTION fuzzy_search_knowledge_base(
  search_query TEXT,
  domain_filter TEXT DEFAULT NULL,
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  domain TEXT,
  topic TEXT,
  question TEXT,
  answer TEXT,
  source_url TEXT,
  source_name TEXT,
  source_type TEXT,
  confidence TEXT,
  last_verified TIMESTAMPTZ,
  similarity_score REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.domain,
    kb.topic,
    kb.question,
    kb.answer,
    kb.source_url,
    kb.source_name,
    kb.source_type,
    kb.confidence,
    kb.last_verified,
    word_similarity(kb.question, search_query) AS similarity_score
  FROM ed_knowledge_base kb
  WHERE
    kb.question % search_query
    AND (domain_filter IS NULL OR kb.domain = domain_filter)
  ORDER BY similarity_score DESC
  LIMIT max_results;
END;
$$;

-- Function to set next review date based on confidence
CREATE OR REPLACE FUNCTION set_next_review_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set next review date based on confidence level
  IF NEW.next_review_due IS NULL THEN
    CASE NEW.confidence
      WHEN 'HIGH' THEN
        NEW.next_review_due := NEW.last_verified + INTERVAL '90 days';
      WHEN 'MEDIUM' THEN
        NEW.next_review_due := NEW.last_verified + INTERVAL '30 days';
      WHEN 'LOW' THEN
        NEW.next_review_due := NEW.last_verified + INTERVAL '7 days';
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment version on update
CREATE OR REPLACE FUNCTION increment_knowledge_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if content actually changed
  IF OLD IS DISTINCT FROM NEW THEN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-set next review date on insert
CREATE TRIGGER ed_knowledge_set_review_date
  BEFORE INSERT ON ed_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION set_next_review_date();

-- Auto-set next review date on confidence change
CREATE TRIGGER ed_knowledge_update_review_date
  BEFORE UPDATE OF confidence, last_verified ON ed_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION set_next_review_date();

-- Increment version on update
CREATE TRIGGER ed_knowledge_increment_version
  BEFORE UPDATE ON ed_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION increment_knowledge_version();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for entries due for review
CREATE OR REPLACE VIEW ed_knowledge_due_for_review AS
SELECT
  id,
  domain,
  topic,
  question,
  confidence,
  last_verified,
  next_review_due,
  EXTRACT(DAY FROM (NOW() - next_review_due)) AS days_overdue
FROM ed_knowledge_base
WHERE next_review_due <= NOW()
ORDER BY next_review_due ASC;

-- View for knowledge statistics by domain
CREATE OR REPLACE VIEW ed_knowledge_stats_by_domain AS
SELECT
  domain,
  COUNT(*) AS total_entries,
  COUNT(*) FILTER (WHERE confidence = 'HIGH') AS high_confidence,
  COUNT(*) FILTER (WHERE confidence = 'MEDIUM') AS medium_confidence,
  COUNT(*) FILTER (WHERE confidence = 'LOW') AS low_confidence,
  COUNT(*) FILTER (WHERE next_review_due <= NOW()) AS needs_review,
  MAX(last_verified) AS last_updated
FROM ed_knowledge_base
GROUP BY domain
ORDER BY domain;

-- ============================================================================
-- SEED DATA (High confidence common Q&A)
-- ============================================================================

-- Estates: Legionella water temperature
INSERT INTO ed_knowledge_base (domain, topic, question, answer, source_url, source_name, source_type, confidence) VALUES
('estates', 'legionella', 'What temperature should cold water outlets be?', 'Cold water outlets should be below 20°C at the outlet after running for 2 minutes. This is to prevent Legionella bacterial growth.', 'https://www.hse.gov.uk/legionionella/', 'HSE L8 Approved Code of Practice', 'HSE', 'HIGH'),
('estates', 'legionella', 'What temperature should hot water outlets be?', 'Hot water outlets should be at 50-60°C to prevent Legionella growth while avoiding scalding risk. Stored hot water must be kept at a minimum of 60°C.', 'https://www.hse.gov.uk/legionella/', 'HSE L8 Approved Code of Practice', 'HSE', 'HIGH'),
('estates', 'legionella', 'How often should I flush outlets not in regular use?', 'Outlets not used for 7 or more days must be flushed weekly for at least 5 minutes. The flushing should be recorded.', 'https://www.hse.gov.uk/legionella/', 'HSE L8 Approved Code of Practice', 'HSE', 'HIGH'),

-- Estates: RIDDOR
('estates', 'riddor', 'What incidents need to be reported under RIDDOR?', 'RIDDOR requires reporting of: deaths, specified injuries (fractures, amputations, etc.), injuries incapacitating for more than 7 days, occupational diseases, and dangerous occurrences (gas escapes, electrical explosions).', 'https://www.hse.gov.uk/riddor/', 'HSE RIDDOR Reporting', 'HSE', 'HIGH'),
('estates', 'riddor', 'What is the RIDDOR reporting deadline?', 'Deaths and specified injuries must be reported within 24 hours. Injuries incapacitating for more than 7 days must be reported within 15 days. Occupational diseases and dangerous occurrences should be reported as soon as possible.', 'https://www.hse.gov.uk/riddor/', 'HSE RIDDOR Reporting', 'HSE', 'HIGH'),

-- Estates: Fire safety
('estates', 'fire-safety', 'How often should fire drills be conducted?', 'Fire drills should be conducted at least once per term, ideally at different times to familiarize staff with various evacuation scenarios.', 'https://www.gov.uk/government/publications/fire-safety-risk-assessment-schools', 'DfE Fire Safety Guidance', 'DfE', 'HIGH'),
('estates', 'fire-safety', 'How often should fire alarms be tested?', 'Fire alarm systems should be tested weekly to ensure they are functioning correctly. A record of all tests must be maintained.', 'https://www.gov.uk/government/publications/fire-safety-risk-assessment-schools', 'DfE Fire Safety Guidance', 'DfE', 'HIGH'),

-- HR: Sickness absence
('hr', 'sickness', 'What is Statutory Sick Pay (SSP) entitlement?', 'SSP is payable for up to 28 weeks at a current rate of £109.40 per week (as of 2024/25). Employees must be off sick for 4 or more consecutive days to qualify, with the first 3 days being qualifying days (unpaid).', 'https://www.gov.uk/statutory-sick-pay', 'Gov.uk SSP Guidance', 'Gov.uk', 'HIGH'),
('hr', 'sickness', 'When do I need a fit note for sickness absence?', 'A fit note (formerly sick note) is required after 7 days of continuous sickness absence. For 7 days or less, employees can self-certify.', 'https://www.gov.uk/government/publications/fit-note-guidance-for-employers', 'Gov.uk Fit Note Guidance', 'Gov.uk', 'HIGH'),

-- HR: Maternity
('hr', 'maternity', 'What is the maternity leave entitlement?', 'Employees are entitled to up to 52 weeks of maternity leave: 26 weeks of ordinary leave and 26 weeks of additional leave. Statutory Maternity Pay (SMP) is payable for up to 39 weeks.', 'https://www.gov.uk/maternity-pay-leave', 'Gov.uk Maternity Guidance', 'Gov.uk', 'HIGH'),

-- Data: Census
('data', 'census', 'When is the spring school census deadline?', 'The spring school census typically takes place on the third Thursday in January, with returns due within 3 weeks. Please verify the exact date for the current academic year on the DfE website.', 'https://www.gov.uk/government/collections/school-census', 'DfE Census Guide', 'DfE', 'HIGH'),
('data', 'census', 'When is the autumn school census deadline?', 'The autumn school census takes place on the first Thursday in October, with returns due within 3 weeks. Please verify the exact date for the current academic year on the DfE website.', 'https://www.gov.uk/government/collections/school-census', 'DfE Census Guide', 'DfE', 'HIGH'),

-- Data: Attendance codes
('data', 'attendance', 'What is the attendance code for illness?', 'Code I (Illness) and Code V (Medical/Dental appointment) are authorised absence codes. Code I is used for general sickness, while Code V is used for scheduled medical appointments.', 'https://www.gov.uk/government/publications/school-attendance-codes', 'DfE Attendance Codes', 'DfE', 'HIGH'),

-- SEND: EHCP
('send', 'ehcp', 'What is the EHCP assessment timeline?', 'Once a request for an EHC needs assessment is made, the local authority has 6 weeks to decide whether to proceed. If agreed, the entire process from request to final EHCP should be completed within 20 weeks.', 'https://www.gov.uk/government/publications/send-code-of-practice-0-to-25', 'SEND Code of Practice', 'DfE', 'HIGH'),
('send', 'ehcp', 'How often should an EHCP be reviewed?', 'An EHCP must be reviewed within 12 months of it being issued, and then annually thereafter. The review meeting should involve the child/young person, parents, and relevant professionals.', 'https://www.gov.uk/government/publications/send-code-of-practice-0-to-25', 'SEND Code of Practice', 'DfE', 'HIGH');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ed_knowledge_base IS 'Knowledge base for Ed chatbot - stores verified Q&A with freshness tracking';

COMMENT ON FUNCTION search_knowledge_base IS 'Full-text search for knowledge base with ranking';

COMMENT ON FUNCTION fuzzy_search_knowledge_base IS 'Fuzzy search for typos and partial matches';

COMMENT ON VIEW ed_knowledge_due_for_review IS 'Knowledge entries that are due or overdue for review';

COMMENT ON VIEW ed_knowledge_stats_by_domain IS 'Statistics summary of knowledge base by domain';
