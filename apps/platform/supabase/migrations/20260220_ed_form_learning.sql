-- Ed Form Learning Mode
-- Ed learns form structure by observing users, without storing personal data

-- ============================================================
-- LEARNED FORMS - Form structure discovered through observation
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_learned_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  form_name TEXT NOT NULL,
  learned_from_count INTEGER DEFAULT 1,

  -- The learned structure (NO personal data)
  form_structure JSONB NOT NULL,
  -- {
  --   fields: [{
  --     selector: string,
  --     type: string,
  --     label: string,
  --     required: boolean,
  --     options?: string[],
  --     semantic_meaning?: string,  // Learned from users
  --     data_source?: string,
  --     help_text?: string,
  --     validation?: { pattern, message }
  --   }],
  --   sections: [{ title, fields: [] }],
  --   navigation: [{ action, target, condition }],
  --   submission: { method, target }
  -- }

  -- Metadata
  confidence_score NUMERIC DEFAULT 0,  -- 0-100, based on observation count
  last_observed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(url, form_name)
);

-- Enable RLS
ALTER TABLE ed_learned_forms ENABLE ROW LEVEL SECURITY;

-- Public can view learned forms (for sharing knowledge)
CREATE POLICY "Public can view learned forms"
ON ed_learned_forms FOR SELECT
USING (confidence_score >= 50);

-- Authenticated users can create learned forms
CREATE POLICY "Users can create learned forms"
ON ed_learned_forms FOR INSERT
WITH CHECK (true);

-- ============================================================
-- FIELD ANNOTATIONS - User-provided explanations for fields
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_field_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES ed_learned_forms(id) ON DELETE CASCADE,
  field_selector TEXT NOT NULL,

  -- What users told us about this field
  semantic_meaning TEXT,        -- "Date the incident occurred"
  data_source_suggestions TEXT[], -- ["HR system", "User input"]
  common_issues TEXT[],          -- ["Users often put wrong date format"]
  help_text TEXT,                -- Explanation to show future users

  -- Validation learned from errors
  validation_rules JSONB,
  -- { pattern: "^\d{4}-\d{2}-\d{2}$", message: "Use YYYY-MM-DD format" }

  -- Agreement tracking (consensus on meaning)
  agreed_count INTEGER DEFAULT 0,
  disagreed_count INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(form_id, field_selector)
);

-- ============================================================
-- LEARNING SESSIONS - Track individual learning observations
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES ed_learned_forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Session details
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- What was observed (NO personal values)
  fields_observed INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,

  -- Quality metrics
  session_quality NUMERIC,  -- 0-100, how complete the learning was
  completeness_score NUMERIC DEFAULT 0,  -- % of form covered

  -- Browser context (for detecting changes)
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIELD VALUE PATTERNS - Learned value types (no actual values)
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_field_value_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES ed_learned_forms(id) ON DELETE CASCADE,
  field_selector TEXT NOT NULL,

  -- What type of value goes here (learned, not the actual values)
  value_type TEXT NOT NULL,  -- 'date', 'email', 'phone', 'number', 'text', 'long_text'
  example_format TEXT,       -- "YYYY-MM-DD", not an actual date

  -- Statistics about observed values (NO actual values)
  observation_count INTEGER DEFAULT 1,
  avg_length NUMERIC,        -- Average length of values seen
  common_patterns TEXT[],    -- Common patterns observed

  -- Validation derived from observations
  inferred_validation JSONB,

  UNIQUE(form_id, field_selector, value_type)
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Create or update a learned form
CREATE OR REPLACE FUNCTION upsert_learned_form(
  p_url TEXT,
  p_form_name TEXT,
  p_form_structure JSONB,
  p_session_quality NUMERIC DEFAULT 50
)
RETURNS UUID AS $$
DECLARE
  v_form_id UUID;
  v_new_form BOOLEAN := FALSE;
BEGIN
  -- Try to find existing form
  SELECT id INTO v_form_id
  FROM ed_learned_forms
  WHERE url = p_url AND form_name = p_form_name;

  IF v_form_id IS NULL THEN
    -- Create new form
    INSERT INTO ed_learned_forms (url, form_name, form_structure, confidence_score)
    VALUES (p_url, p_form_name, p_form_structure, p_session_quality)
    RETURNING id INTO v_form_id;

    v_new_form := TRUE;
  ELSE
    -- Update existing form
    UPDATE ed_learned_forms
    SET
      form_structure = COALESCE(
        -- Merge structures (this is simplified - real implementation would deep merge)
        CASE
          WHEN jsonb_array_length(p_form_structure->'fields') > jsonb_array_length(ed_learned_forms.form_structure->'fields')
          THEN p_form_structure
          ELSE ed_learned_forms.form_structure
        END,
        ed_learned_forms.form_structure
      ),
      learned_from_count = learned_from_count + 1,
      confidence_score = LEAST(100, confidence_score + (p_session_quality / 5)),
      last_observed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_form_id;
  END IF;

  RETURN v_form_id;
END;
$$ LANGUAGE plpgsql;

-- Record a field annotation from user input
CREATE OR REPLACE FUNCTION record_field_annotation(
  p_form_id UUID,
  p_field_selector TEXT,
  p_semantic_meaning TEXT,
  p_data_source TEXT DEFAULT NULL,
  p_help_text TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_annotation_id UUID;
BEGIN
  -- Try to find existing annotation
  SELECT id INTO v_annotation_id
  FROM ed_field_annotations
  WHERE form_id = p_form_id AND field_selector = p_field_selector;

  IF v_annotation_id IS NULL THEN
    -- Create new annotation
    INSERT INTO ed_field_annotations (
      form_id, field_selector, semantic_meaning,
      data_source_suggestions, help_text, created_by
    )
    VALUES (
      p_form_id, p_field_selector, p_semantic_meaning,
      CASE WHEN p_data_source IS NOT NULL THEN ARRAY[p_data_source] ELSE NULL END,
      p_help_text, p_user_id
    )
    RETURNING id INTO v_annotation_id;
  ELSE
    -- Update existing annotation (if new meaning agrees)
    UPDATE ed_field_annotations
    SET
      semantic_meaning = COALESCE(p_semantic_meaning, semantic_meaning),
      data_source_suggestions = CASE
        WHEN p_data_source IS NOT NULL
        THEN array_append(
          COALESCE(data_source_suggestions, ARRAY[]::TEXT[]),
          p_data_source
        )
        ELSE data_source_suggestions
      END,
      help_text = COALESCE(p_help_text, help_text),
      agreed_count = agreed_count + 1
    WHERE id = v_annotation_id;
  END IF;

  RETURN v_annotation_id;
END;
$$ LANGUAGE plpgsql;

-- Get a learned form ready for skill generation
CREATE OR REPLACE FUNCTION get_learned_form_for_skill(
  p_form_id UUID
)
RETURNS TABLE (
  form_structure JSONB,
  confidence_score NUMERIC,
  is_ready_for_skill BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lf.form_structure,
    lf.confidence_score,
    lf.confidence_score >= 70 AS is_ready_for_skill
  FROM ed_learned_forms lf
  WHERE lf.id = p_form_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION upsert_learned_form TO authenticated;
GRANT EXECUTE ON FUNCTION record_field_annotation TO authenticated;
GRANT EXECUTE ON FUNCTION get_learned_form_for_skill TO authenticated;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ed_learned_forms_url ON ed_learned_forms(url);
CREATE INDEX IF NOT EXISTS idx_ed_learned_forms_confidence ON ed_learned_forms(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ed_field_annotations_form ON ed_field_annotations(form_id);
CREATE INDEX IF NOT EXISTS idx_ed_learning_sessions_form ON ed_learning_sessions(form_id);
CREATE INDEX IF NOT EXISTS idx_ed_learning_sessions_user ON ed_learning_sessions(user_id);
