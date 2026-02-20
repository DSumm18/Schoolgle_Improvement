-- Ed Form Knowledge Layer
-- Field-level guidance, explanations, and suggested wording

CREATE TABLE IF NOT EXISTS ed_form_field_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,  -- References ed_form_templates.form_key
  field_key TEXT NOT NULL,  -- e.g., 'parental_concerns', 'child_views'
  field_label TEXT NOT NULL,

  -- Plain English explanation
  explanation TEXT NOT NULL,
  explanation_level TEXT DEFAULT 'layperson',  -- 'layperson', 'professional', 'legal'

  -- What NOT to say (red flags)
  red_flags JSONB DEFAULT '[]'::jsonb,
  -- Example: ["Don't blame teachers", "Avoid emotional language"]

  -- Suggested wording templates
  suggested_wordings JSONB,
  -- {
  --   "formal": "My child has difficulty with...",
  --   "simple": "My child struggles with...",
  --   "legal": "I am concerned that..."
  -- }

  -- Professional/Legal context
  legal_context TEXT,
  relevant_laws TEXT[],  -- ['Education Act 1996', 'SEND Code 2015']
  case_law_examples JSONB,

  -- Local authority specifics
  la_guidance JSONB,
  -- {
  --   "Bradford": "Include pupil reference number",
  --   "Leeds": "Must include SENCO name",
  --   "default": "Follow national guidance"
  -- }

  -- Examples from real cases
  good_examples JSONB,
  bad_examples JSONB,

  -- Video/visual guides (optional)
  explanation_video_url TEXT,
  field_screenshot_url TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(template_id, field_key)
);

-- Enable RLS
ALTER TABLE ed_form_field_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public knowledge visible to all"
ON ed_form_field_knowledge FOR SELECT
USING (true);

CREATE POLICY "Users can create knowledge"
ON ed_form_field_knowledge FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update knowledge"
ON ed_form_field_knowledge FOR UPDATE
USING (true);

-- ============================================================
-- COMMON MISTAKES DATABASE
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_form_mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  field_key TEXT NOT NULL,

  -- The mistake
  bad_example TEXT NOT NULL,
  bad_example_category TEXT,  -- 'too_emotional', 'too_vague', 'aggressive', 'inaccurate'

  -- Why it's a problem
  explanation TEXT NOT NULL,
  consequences TEXT,  -- What could go wrong

  -- The fix
  good_example TEXT NOT NULL,
  why_better TEXT,

  -- Real cases where this mattered
  case_reference TEXT,  -- Anonymised real case
  outcome TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORDING IMPROVEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS ed_wording_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  input_text TEXT NOT NULL,

  -- Analysis
  tone_score INTEGER,  -- 0-100, how professional is it?
  clarity_score INTEGER,  -- 0-100, how clear is it?
  risk_level TEXT,  -- 'low', 'medium', 'high', 'critical'

  -- Suggested improvements
  improved_text TEXT NOT NULL,
  explanation TEXT NOT NULL,

  -- Alternative options
  alternatives JSONB,  -- [{ text: "Option 1", style: "formal" }]

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAMPLE KNOWLEDGE: SEND SECTION A
-- ============================================================

-- Parental Concerns field guidance
INSERT INTO ed_form_field_knowledge (template_id, field_key, field_label, explanation, red_flags, suggested_wordings, legal_context) VALUES
(
  'send_section_a',
  'parental_concerns',
  'Parental Concerns',
  'This is where you describe your concerns about your child''s special educational needs. The local authority will use this information to decide whether to assess your child for an Education, Health and Care Plan (EHCP).',
  '[
    {
      "type": "aggressive_language",
      "examples": ["The school is failing my child", "Teachers don''t care", "I''ve had enough of this"],
      "explanation": "Aggressive language puts local authorities on the defensive and may harm your case.",
      "consequence": "Your complaint may be treated as a dispute rather than an SEN referral"
    },
    {
      "type": "too_vague",
      "examples": ["He struggles at school", "She finds things hard"],
      "explanation": "Without specific examples, the LA cannot understand the nature or severity of needs.",
      "consequence": "May be rejected for lack of evidence"
    },
    {
      "type": "teacher_focus",
      "examples": ["His teacher is rubbish", "The SENCO doesn''t help"],
      "explanation": "Focus should be on your child''s needs, not staff performance.",
      "consequence": "May be referred to a complaints procedure instead of SEN assessment"
    }
  ]'::jsonb,
  '{
    "formal": "I am concerned that my child is not making expected progress in literacy despite additional support. His reading age is approximately 7 years while his chronological age is 9 years, representing a 2-year gap in attainment.",
    "simple": "My child struggles with reading. He is 9 but reads at a 7-year-old level. Despite extra help, he hasn''t caught up over the past year.",
    "with_evidence": "I am concerned that my child is not making expected progress. Examples include: difficulty reading age-appropriate texts, struggling with homework that takes peers 10 minutes but takes him 30 minutes, and teacher reports showing working at expected standard in writing despite reading at level 2A."
  }'::jsonb,
  'Under the Children and Families Act 2014, local authorities must consider parental concerns when deciding whether to assess. The SEND Code of Practice (2015) states that concerns should be specific and supported by evidence where possible.'
);

-- Child''s Views field guidance
INSERT INTO ed_form_field_knowledge (template_id, field_key, field_label, explanation, suggested_wordings, la_guidance) VALUES
(
  'send_section_a',
  'child_views',
  'Child''s Views',
  'If your child is old enough to express views, these MUST be included. The law says children should be involved in decisions affecting them. There is no strict age rule, but generally children aged 7+ should contribute.',
  '{
    "for_age_under_7": {
      "guidance": "You can still include your child''s views by observing and reporting what they say to you.",
      "example": "When asked about school, he says ''I hate reading, it''s too hard'' and ''I want to run away during phonics''."
    },
    "for_age_7_to_11": {
      "guidance": "Ask your child open-ended questions about school. Include their exact words where possible.",
      "questions": ["What do you enjoy at school?", "What subjects do you find tricky?", "What would help you learn better?"]
    },
    "for_age_12_plus": {
      "guidance": "Your teenager should write their own views in their own words. They can be present at the meeting too.",
      "example": "Your child may write: ''I feel embarrassed when I have to read aloud in class. I avoid subjects with lots of writing.''"
    }
  }'::jsonb,
  '{
    "Bradford": "Include specific examples and child''s direct quotes where possible.",
    "Leeds": "Child should sign/date their section if they''re old enough.",
    "default": "Follow national guidance from SEND Code of Practice 2015"
  }'::jsonb
);

-- ============================================================
-- HELPER FUNCTION: Get field knowledge
-- ============================================================

CREATE OR REPLACE FUNCTION get_field_knowledge(
  p_template_id TEXT,
  p_field_key TEXT
)
RETURNS TABLE (
  explanation TEXT,
  explanation_level TEXT,
  red_flags JSONB,
  suggested_wordings JSONB,
  legal_context TEXT,
  la_guidance JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.explanation,
    k.explanation_level,
    k.red_flags,
    k.suggested_wordings,
    k.legal_context,
    k.la_guidance
  FROM ed_form_field_knowledge k
  WHERE k.template_id = p_template_id
    AND k.field_key = p_field_key;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_field_knowledge TO authenticated;

-- ============================================================
-- HELPER FUNCTION: Check for red flags in text
-- ============================================================

CREATE OR REPLACE FUNCTION check_form_text_red_flags(
  p_template_id TEXT,
  p_field_key TEXT,
  p_user_text TEXT
)
RETURNS TABLE (
  has_red_flags BOOLEAN,
  matched_flags JSONB,
  suggestions JSONB
) AS $$
DECLARE
  v_red_flags JSONB;
  v_matched JSONB := '[]'::jsonb;
  v_count INT := 0;
BEGIN
  -- Get red flags for this field
  SELECT k.red_flags INTO v_red_flags
  FROM ed_form_field_knowledge k
  WHERE k.template_id = p_template_id
    AND k.field_key = p_field_key;

  IF v_red_flags IS NULL THEN
    v_red_flags := '[]'::jsonb;
  END IF;

  -- Check each red flag pattern
  FOR i IN 0..jsonb_array_length(v_red_flags) - 1 LOOP
    DECLARE
      v_flag JSONB;
      v_pattern TEXT;
      v_examples TEXT[];
    BEGIN
      v_flag := v_red_flags->i;
      v_examples := v_flag->'examples';

      -- Check if any example appears in user text
      FOR j IN 0..jsonb_array_length(v_examples::jsonb) - 1 LOOP
        IF LOWER(p_user_text) LIKE '%' || LOWER(v_examples->j->>'text') || '%' THEN
          v_matched := v_matched || jsonb_build_object(
            'type', v_flag->>'type',
            'matched_example', v_examples->j->>'text',
            'explanation', v_flag->>'explanation',
            'consequence', v_flag->>'consequence'
          );
          v_count := v_count + 1;
        END IF;
      END LOOP;
    END;
  END LOOP;

  RETURN QUERY
  SELECT
    v_count > 0 AS has_red_flags,
    v_matched AS matched_flags,
    v_red_flags AS suggestions;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION check_form_text_red_flags TO authenticated;
