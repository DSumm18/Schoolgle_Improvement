-- Ed Form Helper - Standard Forms Allowlist
-- Pre-configured forms that Ed knows how to fill

-- Create the allowlist table
CREATE TABLE IF NOT EXISTS ed_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Form identification
  form_key TEXT NOT NULL,  -- e.g., "hse_riddor_injury"
  form_name TEXT NOT NULL,  -- e.g., "RIDDOR Injury Reporting"
  form_category TEXT NOT NULL,  -- e.g., "compliance", "hse", "safeguarding"

  -- URL matching (can be exact or pattern)
  url_pattern TEXT NOT NULL,  -- e.g., "https://notifications.hse.gov.uk/riddorforms/*"
  url_pattern_type TEXT NOT NULL DEFAULT 'exact',  -- 'exact' or 'wildcard' or 'contains'

  -- Form structure (cached)
  form_structure JSONB NOT NULL,  -- Fields, selectors, order

  -- AI prompt template for this form type
  conversation_template JSONB,  -- Questions to ask, language mappings

  -- Metadata
  description TEXT,
  help_text TEXT,
  estimated_time_minutes INTEGER DEFAULT 5,

  -- Security & Access
  is_public BOOLEAN DEFAULT false,  -- Available to all schools?
  requires_role TEXT[],  -- null = all, or ['admin', 'slt']
  min_confidence INTEGER DEFAULT 0,  -- User must have this confidence level

  -- Status
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(organization_id, form_key)
);

-- Enable RLS
ALTER TABLE ed_form_templates ENABLE ROW LEVEL SECURITY;

-- Policies: Schools can see their templates + public templates
CREATE POLICY "Schools can view their templates"
ON ed_form_templates FOR SELECT
USING (
  organization_id IS NULL OR  -- Public templates
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

CREATE POLICY "Schools can create templates"
ON ed_form_templates FOR INSERT
WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

CREATE POLICY "Schools can update their templates"
ON ed_form_templates FOR UPDATE
USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete templates"
ON ed_form_templates FOR DELETE
USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_ed_form_templates_key ON ed_form_templates(form_key);
CREATE INDEX idx_ed_form_templates_category ON ed_form_templates(form_category);
CREATE INDEX idx_ed_form_templates_public ON ed_form_templates(is_active, is_public);

-- ============================================================
-- STANDARD FORM TEMPLATES (Available to all schools)
-- ============================================================

-- HSE RIDDOR Injury Reporting
INSERT INTO ed_form_templates (form_key, form_name, form_category, url_pattern, url_pattern_type, form_structure, conversation_template, description, help_text, estimated_time_minutes, is_public, requires_role) VALUES
(
  'hse_riddor_injury',
  'RIDDOR Injury Reporting',
  'hse',
  'notifications.hse.gov.uk/riddorforms/Injury',
  'contains',
  '{
    "fields": [
      {
        "index": 0,
        "label": "Date and time of incident",
        "type": "datetime",
        "selector": "[name*=\"date\"], [id*=\"date\"]",
        "required": true,
        "question": "When did the incident happen?",
        "example": "This morning at 10:30"
      },
      {
        "index": 1,
        "label": "Type of incident",
        "type": "select",
        "selector": "[name*=\"incident\"], [id*=\"incident\"]",
        "required": true,
        "options": ["Injury", "Death", "Dangerous occurrence", "Disease"],
        "question": "What type of incident are you reporting?",
        "example": "An injury to a pupil"
      },
      {
        "index": 2,
        "label": "Person involved",
        "type": "text",
        "selector": "[name*=\"person\"], [name*=\"involved\"]",
        "required": true,
        "question": "Who was involved? Please give their name and role.",
        "example": "John Smith, Year 5 pupil"
      },
      {
        "index": 3,
        "label": "Nature of injury",
        "type": "textarea",
        "selector": "[name*=\"injury\"], [name*=\"nature\"]",
        "required": true,
        "question": "What happened? Please describe the injury.",
        "example": "Fractured arm after falling from playground equipment"
      },
      {
        "index": 4,
        "label": "Location of incident",
        "type": "text",
        "selector": "[name*=\"location\"]",
        "required": true,
        "question": "Where exactly did this happen?",
        "example": "In the main playground, near the climbing frame"
      },
      {
        "index": 5,
        "label": "Your name",
        "type": "text",
        "selector": "[name*=\"reporter\"], [name*=\"your\"]",
        "required": true,
        "question": "What is your name for the report?",
        "example": "Ahmed Ali"
      },
      {
        "index": 6,
        "label": "Your role",
        "type": "select",
        "selector": "[name*=\"role\"]",
        "required": true,
        "options": ["Headteacher", "Deputy Headteacher", "School Business Manager", "Site Manager", "Teacher", "Other"],
        "question": "What is your role at the school?",
        "example": "School Business Manager"
      },
      {
        "index": 7,
        "label": "School name",
        "type": "text",
        "selector": "[name*=\"school\"], [name*=\"employer\"]",
        "required": true,
        "question": "What is the full name of your school?",
        "example": "Rawdon St Peter\'s C of E Primary School"
      },
      {
        "index": 8,
        "label": "School address",
        "type": "textarea",
        "selector": "[name*=\"address\"]",
        "required": true,
        "question": "What is the school address?",
        "example": "School Lane, Rawdon, Leeds, LS19 6HW"
      },
      {
        "index": 9,
        "label": "Contact phone",
        "type": "tel",
        "selector": "[name*=\"phone\"], [name*=\"contact\"]",
        "required": true,
        "question": "What phone number can HSE contact you on?",
        "example": "0113 123 4567"
      }
    ]
  }'::jsonb,
  '{
    "intro": {
      "en": "I can help you fill in this RIDDOR report for the Health and Safety Executive. This is for reporting work-related injuries. I will ask you some questions and then fill in the form for you.",
      "ur": "Mein apki HSE report madad kar sakta hoon."
    },
    "questions": [
      {
        "fieldIndex": 0,
        "question": {
          "en": "When did the incident happen? Please give the date and time if you know it.",
          "ur": "Incident kab hua?"
        },
        "helpText": {
          "en": "You can say \"today at 10am\" or \"last Monday morning\""
        }
      },
      {
        "fieldIndex": 1,
        "question": {
          "en": "What type of incident is this? Is it an injury, a death, a dangerous occurrence, or a work-related disease?",
          "ur": "Kis tarah ka incident hai?"
        }
      },
      {
        "fieldIndex": 2,
        "question": {
          "en": "Who was involved? Please tell me their name and whether they are a pupil, member of staff, or visitor.",
          "ur": "Ka involved hai? Naam aur role bataiye."
        }
      },
      {
        "fieldIndex": 3,
        "question": {
          "en": "Can you describe what happened and what injury occurred? Take your time to give me the details.",
          "ur": "Kya hua? injury ke bare mein batayein."
        },
        "helpText": {
          "en": "Include what part of the body was injured and how it happened"
        }
      },
      {
        "fieldIndex": 4,
        "question": {
          "en": "Where exactly did this happen? Please be specific about the location.",
          "ur": "Yeh kahan hua? Location bataiye."
        }
      }
    ],
    "outro": {
      "en": "I have filled in the RIDDOR form. Please check all the details carefully before submitting, as this is a legal report to the Health and Safety Executive.",
      "ur": "Form bhara gaya hai. Submit karne se pehle check kar lijiye."
    }
  }'::jsonb,
  'Report workplace injuries to the Health and Safety Executive (HSE). This is a legal requirement for certain injuries.',
  'RIDDOR reporting is required for: deaths, specified injuries, over-7-day incapacitations, injuries to non-workers requiring hospital treatment, and certain dangerous occurrences.',
  10,
  true,
  ARRAY['admin', 'slt', 'school_business_manager', 'site_manager']::TEXT[]
) ON CONFLICT (organization_id, form_key) DO NOTHING;

-- HSE RIDDOR Death Reporting (more serious)
INSERT INTO ed_form_templates (form_key, form_name, form_category, url_pattern, url_pattern_type, form_structure, description, help_text, estimated_time_minutes, is_public, requires_role) VALUES
(
  'hse_riddor_death',
  'RIDDOR Death Reporting',
  'hse',
  'notifications.hse.gov.uk/riddorforms/Death',
  'contains',
  '{
    "fields": [
      {"index": 0, "label": "Date of death", "type": "date", "selector": "[name*=\"date\"]", "required": true},
      {"index": 1, "label": "Name of deceased", "type": "text", "selector": "[name*=\"name\"]", "required": true},
      {"index": 2, "label": "Cause of death", "type": "textarea", "selector": "[name*=\"cause\"]", "required": true},
      {"index": 3, "label": "Place of death", "type": "text", "selector": "[name*=\"place\"]", "required": true},
      {"index": 4, "label": "Work activity being done", "type": "textarea", "selector": "[name*=\"activity\"]", "required": true}
    ],
    "urgent": true
  }'::jsonb,
  'Report a work-related death to the Health and Safety Executive. This is an urgent legal requirement.',
  'Deaths must be reported immediately by telephone (fatal incident enquiry line: 0845 300 9923). Follow up with written report within 10 days.',
  15,
  true,
  ARRAY['headteacher', 'slt']::TEXT[]
) ON CONFLICT (organization_id, form_key) DO NOTHING;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get form template by URL
CREATE OR REPLACE FUNCTION get_form_template_by_url(url TEXT, org_id UUID DEFAULT NULL)
RETURNS TABLE (
  form_key TEXT,
  form_name TEXT,
  form_category TEXT,
  form_structure JSONB,
  conversation_template JSONB,
  description TEXT,
  help_text TEXT
) AS $$
DECLARE
  matched_template ed_form_templates%ROWTYPE;
BEGIN
  -- Try exact match first
  SELECT * INTO matched_template
  FROM ed_form_templates
  WHERE url_pattern = url
    AND is_active = true
    AND (organization_id = org_id OR is_public = true)
  LIMIT 1;

  -- If no exact match, try pattern matching
  IF NOT FOUND THEN
    SELECT * INTO matched_template
    FROM ed_form_templates
    WHERE (
      url_pattern_type = 'contains' AND url LIKE '%' || url_pattern || '%'
      OR url_pattern_type = 'wildcard' AND url ~ replace(url_pattern, '*', '.*')
    )
    AND is_active = true
    AND (organization_id = org_id OR is_public = true)
    ORDER BY
      CASE WHEN url_pattern_type = 'exact' THEN 1 ELSE 2 END,
      LENGTH(url_pattern) DESC  -- Prefer longer, more specific patterns
    LIMIT 1;
  END IF;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      matched_template.form_key,
      matched_template.form_name,
      matched_template.form_category,
      matched_template.form_structure,
      matched_template.conversation_template,
      matched_template.description,
      matched_template.help_text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Get all public form templates
CREATE OR REPLACE FUNCTION get_public_form_templates()
RETURNS TABLE (
  form_key TEXT,
  form_name TEXT,
  form_category TEXT,
  description TEXT,
  url_pattern TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.form_key,
    t.form_name,
    t.form_category,
    t.description,
    t.url_pattern
  FROM ed_form_templates t
  WHERE t.is_public = true
    AND t.is_active = true
  ORDER BY t.form_category, t.form_name;
END;
$$ LANGUAGE plpgsql;

-- Get school's custom form templates
CREATE OR REPLACE FUNCTION get_school_form_templates(school_org_id UUID)
RETURNS TABLE (
  form_key TEXT,
  form_name TEXT,
  form_category TEXT,
  description TEXT,
  url_pattern TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.form_key,
    t.form_name,
    t.form_category,
    t.description,
    t.url_pattern
  FROM ed_form_templates t
  WHERE t.organization_id = school_org_id
    AND t.is_active = true
  ORDER BY t.form_category, t.form_name;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_form_template_by_url TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_form_templates TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_form_templates TO authenticated;
