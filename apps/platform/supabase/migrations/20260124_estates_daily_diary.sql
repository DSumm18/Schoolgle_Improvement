-- ESTATES DAILY DIARY MIGRATION
-- Site Manager's Daily Diary feature for logging notes, photos, and tags

-- Create estates_daily_diary table
CREATE TABLE IF NOT EXISTS public.estates_daily_diary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  location TEXT,
  weather JSONB DEFAULT '{}'::jsonb,
  mood TEXT CHECK (mood IN ('positive', 'neutral', 'negative')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'organization')),
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.estates_daily_diary IS 'Site Manager''s Daily Diary for logging compliance-related notes and observations';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_estates_diary_org ON public.estates_daily_diary(organization_id);
CREATE INDEX IF NOT EXISTS idx_estates_diary_user ON public.estates_daily_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_estates_diary_created ON public.estates_daily_diary(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_estates_diary_tags ON public.estates_daily_diary USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_estates_diary_location ON public.estates_daily_diary(location);

-- Enable RLS
ALTER TABLE public.estates_daily_diary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view entries from their organization based on visibility
CREATE POLICY "estates_diary_read_policy" ON public.estates_daily_diary
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
    AND (
      -- Own entries
      user_id = auth.uid()::text
      OR
      -- Team/organization visible entries
      visibility IN ('team', 'organization')
    )
  );

-- Users can create entries for their organization
CREATE POLICY "estates_diary_create_policy" ON public.estates_daily_diary
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
    AND user_id = auth.uid()::text
  );

-- Users can update their own entries
CREATE POLICY "estates_diary_update_policy" ON public.estates_daily_diary
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()::text
    AND organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    user_id = auth.uid()::text
  );

-- Users can delete their own entries (within 24 hours)
CREATE POLICY "estates_diary_delete_policy" ON public.estates_daily_diary
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()::text
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Service role full access
CREATE POLICY "service_estates_diary" ON public.estates_daily_diary
  FOR ALL TO service_role USING (true);

-- Trigger for updated_at
CREATE TRIGGER estates_diary_updated_at
  BEFORE UPDATE ON public.estates_daily_diary
  FOR EACH ROW
  EXECUTE FUNCTION update_estates_updated_at();

-- Helper function to search diary entries by text and tags
CREATE OR REPLACE FUNCTION search_diary_entries(
  p_organization_id UUID,
  p_search_text TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  user_id UUID,
  entry TEXT,
  photos TEXT[],
  tags TEXT[],
  location TEXT,
  weather JSONB,
  mood TEXT,
  visibility TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.organization_id,
    d.user_id,
    d.entry,
    d.photos,
    d.tags,
    d.location,
    d.weather,
    d.mood,
    d.visibility,
    d.attachments,
    d.created_at,
    d.updated_at
  FROM public.estates_daily_diary d
  WHERE d.organization_id = p_organization_id
    AND (p_search_text IS NULL OR d.entry ILIKE '%' || p_search_text || '%')
    AND (p_tags IS NULL OR d.tags && p_tags)
    AND (p_date_from IS NULL OR d.created_at >= p_date_from)
    AND (p_date_to IS NULL OR d.created_at <= p_date_to)
    AND (p_user_id IS NULL OR d.user_id = p_user_id)
    AND (
      d.user_id = auth.uid()::text
      OR d.visibility IN ('team', 'organization')
    )
  ORDER BY d.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on search function
GRANT EXECUTE ON FUNCTION search_diary_entries TO authenticated;

-- Insert common diary tags as a comment for reference
COMMENT ON COLUMN public.estates_daily_diary.tags IS 'Common tags: heating, security, vandalism, contractor, maintenance, inspection, asbestos, fire, legionella, electrical, plumbing, roofing, flooring, cleaning, waste, parking, playground, equipment, vehicle, safety, accident, near-miss, weather, visitor, delivery, alarm-test, emergency-drill';
