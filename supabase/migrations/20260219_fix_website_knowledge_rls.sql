-- Fix RLS policies for ed_website_knowledge
-- Drop existing policies
DROP POLICY IF EXISTS "Organizations can view own website knowledge" ON ed_website_knowledge;
DROP POLICY IF EXISTS "Organizations can insert own website knowledge" ON ed_website_knowledge;
DROP POLICY IF EXISTS "Organizations can update own website knowledge" ON ed_website_knowledge;
DROP POLICY IF EXISTS "Organizations can delete own website knowledge" ON ed_website_knowledge;
DROP POLICY IF EXISTS "Service role has full access to ed_website_knowledge" ON ed_website_knowledge;

-- Create simpler policies for public access (for Ed website chatbot)
-- In production, this would be restricted to authenticated users
CREATE POLICY "Public can view website knowledge"
  ON ed_website_knowledge FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage website knowledge"
  ON ed_website_knowledge FOR ALL
  USING (true);
