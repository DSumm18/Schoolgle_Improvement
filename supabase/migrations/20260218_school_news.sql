-- Migration: Create school_news table
-- Date: 20260218
-- Purpose: School-wide announcements for dashboard news ticker

CREATE TABLE IF NOT EXISTS public.school_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'alert', 'event', 'success')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    icon TEXT,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.school_news ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view news for their organization"
ON public.school_news FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
    AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
);

CREATE POLICY "Admins can create news"
ON public.school_news FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'headteacher', 'slt')
    )
);

CREATE POLICY "Admins can update news"
ON public.school_news FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'headteacher', 'slt')
    )
);

CREATE POLICY "Admins can delete news"
ON public.school_news FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'headteacher')
    )
);

-- Index for efficient queries
CREATE INDEX idx_school_news_org_created ON public.school_news(organization_id, created_at DESC);
CREATE INDEX idx_school_news_priority ON public.school_news(priority) WHERE is_pinned = true;

-- Insert sample news for all organizations (examples)
-- These will be overridden by school-specific news
INSERT INTO public.school_news (organization_id, title, message, type, priority, is_pinned)
SELECT
    id,
    'Welcome to Schoolgle',
    'Your school improvement platform is ready. Start by exploring the dashboard and setting up your team.',
    'info',
    'medium',
    true
FROM public.organizations
ON CONFLICT DO NOTHING;

-- Trigger to auto-expire old news (optional cleanup)
CREATE OR REPLACE FUNCTION clean_expired_news()
RETURNS void AS $$
BEGIN
    DELETE FROM public.school_news
    WHERE expires_at IS NOT NULL
    AND expires_at < timezone('utc'::text, now()) - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Uncomment to enable automatic cleanup (run weekly)
-- SELECT cron.schedule('clean-expired-news', '0 2 * * 0', 'SELECT clean_expired_news();');
