-- Onboarding Leads Table
-- Schools can self-service signup through /interest page
-- Leads appear in admin pipeline for conversion to trial/paid

CREATE TABLE IF NOT EXISTS onboarding_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- School details (from DfE lookup or manual entry)
    urn TEXT UNIQUE,
    name TEXT NOT NULL,
    la_name TEXT,
    la_code TEXT,
    phase TEXT,  -- Primary, Secondary, All-through
    school_type TEXT,
    address TEXT,
    postcode TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,

    -- Submission details
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    contact_role TEXT,  -- Headteacher, Business Manager, etc.

    -- Product interest
    interested_modules TEXT[] DEFAULT '{}',
    -- ['ofsted-readiness', 'estates-compliance', 'hr-people', ...]

    plan_interest TEXT,  -- 'core', 'professional', 'enterprise', 'not_sure'
    budget_text TEXT,  -- Free text budget indication
    timeline TEXT,  -- 'immediate', 'this_term', 'next_term', 'next_year'

    -- Automated enrichment
    dfe_data_fetched BOOLEAN DEFAULT false,
    dfe_data JSONB DEFAULT '{}',  -- Pupils, KS2 results, etc.
    website_scanned BOOLEAN DEFAULT false,
    website_scan_results JSONB DEFAULT '{}',
    ofsted_rating TEXT,
    ofsted_last_inspection DATE,

    -- Pipeline status
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'trial_started', 'trial_active',
        'quote_sent', 'negotiating', 'converted', 'not_interested', 'unresponsive'
    )),

    -- Trial details (if started)
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    trial_organization_id UUID REFERENCES organizations(id),

    -- Conversion details
    converted_to_subscription_id UUID REFERENCES subscriptions(id),
    converted_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_status ON onboarding_leads(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_urn ON onboarding_leads(urn);
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_created_at ON onboarding_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_trial_org ON onboarding_leads(trial_organization_id) WHERE trial_organization_id IS NOT NULL;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_onboarding_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS onboarding_leads_updated_at ON onboarding_leads;
CREATE TRIGGER onboarding_leads_updated_at
    BEFORE UPDATE ON onboarding_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_leads_updated_at();

-- Enable RLS
ALTER TABLE onboarding_leads ENABLE ROW LEVEL SECURITY;

-- Public can insert leads (via signup form)
CREATE POLICY "Anyone can create a lead"
    ON onboarding_leads FOR INSERT
    WITH CHECK (true);

-- Admin can view all leads
CREATE POLICY "Admins can view all leads"
    ON onboarding_leads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE super_admins.user_id = auth.uid()
        )
    );

-- Admin can update leads
CREATE POLICY "Admins can update leads"
    ON onboarding_leads FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE super_admins.user_id = auth.uid()
        )
    );

-- Admin can delete leads
CREATE POLICY "Admins can delete leads"
    ON onboarding_leads FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE super_admins.user_id = auth.uid()
        )
    );

-- Add comment for documentation
COMMENT ON TABLE onboarding_leads IS 'Self-service onboarding leads from /interest signup page. Converted to trial organizations via admin pipeline.';
