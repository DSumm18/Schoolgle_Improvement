-- Incident Logs Table
CREATE TABLE IF NOT EXISTS public.incident_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'lockdown', 'medical', 'security', 'fire'
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_alarm'
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incident logs for their organization"
ON public.incident_logs FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create incident logs for their organization"
ON public.incident_logs FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can update incident logs for their organization"
ON public.incident_logs FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'headteacher', 'site_manager')
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_incident_logs_updated_at
    BEFORE UPDATE ON public.incident_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
