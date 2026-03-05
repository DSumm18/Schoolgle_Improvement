-- Add form structure caching to ed_website_knowledge
-- This allows Ed to remember form structure across visits

-- Add forms column to store form structure
ALTER TABLE ed_website_knowledge
ADD COLUMN IF NOT EXISTS forms JSONB DEFAULT '[]'::jsonb;

-- Add index for faster lookups by URL
CREATE INDEX IF NOT EXISTS idx_ed_website_knowledge_forms_url
ON ed_website_knowledge(page_url)
WHERE forms IS NOT NULL;

-- Add form type column for quick filtering
ALTER TABLE ed_website_knowledge
ADD COLUMN IF NOT EXISTS form_types TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Comment to document the new columns
COMMENT ON COLUMN ed_website_knowledge.forms IS 'Form structure cached for form filling: [{"id": "form-id", "fields": [...]}]';
COMMENT ON COLUMN ed_website_knowledge.form_types IS 'AI-classified form types: ["safeguarding", "job_application", etc.]';

-- Create a helper function to extract form type from cached data
CREATE OR REPLACE FUNCTION get_page_form_types(page_url TEXT)
RETURNS TEXT[] AS $$
BEGIN
  RETURN (
    SELECT COALESCE(form_types, ARRAY[]::TEXT[])
    FROM ed_website_knowledge
    WHERE ed_website_knowledge.page_url = page_url
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_page_form_types(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_page_form_types(TEXT) TO anon;
