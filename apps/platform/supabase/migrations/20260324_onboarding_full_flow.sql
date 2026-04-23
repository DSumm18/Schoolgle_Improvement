-- ============================================================================
-- SCHOOLGLE ONBOARDING FULL FLOW
-- Migration: 20260324_onboarding_full_flow
--
-- Purpose: Complete onboarding pipeline from interest → quote → contract → payment
-- Flow:
--   1. Interest form (public/signup) → creates lead
--   2. Email sent with link to complete details
--   3. Admin fetches DfE data, generates quote
--   4. DocuSign contract signature
--   5. Invoice generated → payment
--   6. System activated (subscription created)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND onboarding_leads WITH ADDITIONAL FIELDS
-- ----------------------------------------------------------------------------

-- DfE enrichment fields
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS trust_name TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS pupil_count INTEGER;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS headteacher_name TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS headteacher_email TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS school_phone TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS phase_code TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS establishment_type_code TEXT;

-- Billing/Finance contacts
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS billing_contact_name TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS billing_contact_email TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS billing_contact_phone TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS finance_email TEXT;

-- Contract/Governance
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS approver_name TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS approver_role TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS approver_email TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS company_number TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS dpo_name TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS dpo_email TEXT;

-- Payment details
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS bank_sort_code TEXT;

-- Quote/Contract/Invoice tracking
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS quote_amount NUMERIC(10,2);
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2);
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS final_amount NUMERIC(10,2);
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS plan_selected TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS billing_period TEXT; -- 'monthly', 'annual'
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS quote_generated_at TIMESTAMPTZ;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS contract_sent_at TIMESTAMPTZ;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS docusign_envelope_id TEXT;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMPTZ;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS invoice_paid_at TIMESTAMPTZ;

-- Form completion tracking
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS details_completed_at TIMESTAMPTZ;
ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS completion_token TEXT UNIQUE;
-- Token used in emailed link: /onboarding/complete?token=xxx

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_completion_token ON onboarding_leads(completion_token) WHERE completion_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_docusign ON onboarding_leads(docusign_envelope_id) WHERE docusign_envelope_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_invoice ON onboarding_leads(invoice_id) WHERE invoice_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. INVOICES TABLE (if not exists)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    onboarding_lead_id UUID REFERENCES onboarding_leads(id) ON DELETE SET NULL,

    -- Invoice details
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,

    -- Amounts (in pence / cents)
    subtotal INTEGER NOT NULL, -- Before discount
    discount_amount INTEGER DEFAULT 0,
    vat_amount INTEGER DEFAULT 0,
    total INTEGER NOT NULL, -- Final amount to pay

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'
    )),

    -- Billing info
    billing_name TEXT NOT NULL,
    billing_email TEXT NOT NULL,
    billing_address JSONB,

    -- Payment info
    payment_method TEXT,
    payment_reference TEXT,

    -- Line items (JSONB for flexibility)
    line_items JSONB DEFAULT '[]',
    -- [{"description": "Ofsted Readiness Module", "quantity": 1, "unit_price": 50000, "total": 50000}]

    -- PDF
    pdf_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.invoices IS 'Invoices for subscriptions and one-time purchases';

CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_lead ON public.invoices(onboarding_lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- Updated at trigger for invoices
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 3. QUOTES TABLE (for tracking quotes before conversion)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    onboarding_lead_id UUID REFERENCES onboarding_leads(id) ON DELETE CASCADE,

    quote_number TEXT UNIQUE NOT NULL,
    valid_until DATE NOT NULL,

    -- Pricing
    subtotal INTEGER NOT NULL,
    discount_amount INTEGER DEFAULT 0,
    discount_code TEXT,
    vat_amount INTEGER DEFAULT 0,
    total INTEGER NOT NULL,

    -- Details
    plan_type TEXT NOT NULL, -- 'core', 'professional', 'enterprise'
    billing_period TEXT NOT NULL, -- 'monthly', 'annual'
    selected_modules TEXT[] DEFAULT '{}',
    user_limit INTEGER,

    -- School info snapshot
    school_name TEXT NOT NULL,
    school_urn TEXT,
    school_address JSONB,

    -- Contact info
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'accepted', 'rejected', 'expired'
    )),

    -- PDF
    pdf_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.quotes IS 'Quotes generated for onboarding leads';

CREATE INDEX IF NOT EXISTS idx_quotes_lead ON public.quotes(onboarding_lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON public.quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

-- Updated at trigger for quotes
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. HELPER FUNCTION: Generate invoice number
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'INV-';
    year_part TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
    month_part TEXT := TO_CHAR(CURRENT_DATE, 'MM');
    sequence_num INTEGER;
BEGIN
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 12 FOR 5) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE invoice_number LIKE prefix || year_part || '-' || month_part || '-%';

    RETURN prefix || year_part || '-' || month_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 5. HELPER FUNCTION: Generate quote number
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'QT-';
    year_part TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
    month_part TEXT := TO_CHAR(CURRENT_DATE, 'MM');
    sequence_num INTEGER;
BEGIN
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 9 FOR 5) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.quotes
    WHERE quote_number LIKE prefix || year_part || '-' || month_part || '-%';

    RETURN prefix || year_part || '-' || month_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. RLS POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Invoices: service role full access
CREATE POLICY "Service role full access on invoices"
    ON public.invoices FOR ALL USING (true);

-- Invoices: org members can view their own invoices
CREATE POLICY "Organization members can view invoices"
    ON public.invoices FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

-- Quotes: service role full access
CREATE POLICY "Service role full access on quotes"
    ON public.quotes FOR ALL USING (true);

-- Quotes: public can view quote with valid token (completion_token links to quote)
CREATE POLICY "Public can view quote by token"
    ON public.onboarding_leads FOR SELECT
    USING (
        completion_token IS NOT NULL
    );

-- ----------------------------------------------------------------------------
-- 7. STATUS UPDATE TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_lead_status_workflow()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update status based on progress
    IF NEW.details_completed_at IS NOT NULL AND OLD.details_completed_at IS NULL THEN
        IF NEW.status = 'new' THEN
            NEW.status := 'contacted';
        END IF;
    END IF;

    IF NEW.quote_generated_at IS NOT NULL AND OLD.quote_generated_at IS NULL THEN
        IF NEW.status IN ('new', 'contacted') THEN
            NEW.status := 'quote_sent';
        END IF;
    END IF;

    IF NEW.contract_signed_at IS NOT NULL AND OLD.contract_signed_at IS NULL THEN
        IF NEW.status IN ('new', 'contacted', 'quote_sent', 'negotiating') THEN
            NEW.status := 'negotiating';
        END IF;
    END IF;

    IF NEW.invoice_paid_at IS NOT NULL AND OLD.invoice_paid_at IS NULL THEN
        NEW.status := 'converted';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS onboarding_leads_status_trigger ON onboarding_leads;
CREATE TRIGGER onboarding_leads_status_trigger
    BEFORE UPDATE ON onboarding_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_lead_status_workflow();

-- ----------------------------------------------------------------------------
-- 8. VIEW: Onboarding Pipeline Summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.onboarding_pipeline_summary AS
SELECT
    status,
    COUNT(*) AS count,
    SUM(COALESCE(final_amount, 0)) AS total_value
FROM public.onboarding_leads
WHERE status != 'not_interested'
GROUP BY status
ORDER BY
    CASE status
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'trial_started' THEN 3
        WHEN 'trial_active' THEN 4
        WHEN 'quote_sent' THEN 5
        WHEN 'negotiating' THEN 6
        WHEN 'converted' THEN 7
        ELSE 8
    END;

COMMENT ON VIEW public.onboarding_pipeline_summary IS 'Summary of onboarding pipeline by status with value';

-- ----------------------------------------------------------------------------
-- COMPLETION NOTES
-- ----------------------------------------------------------------------------
-- This migration enables the full onboarding flow:
--
-- 1. Interest form → creates lead with completion_token
-- 2. Email: /onboarding/complete?token=xxx → collects full details
-- 3. Admin: DfE fetch → quote generation → contract via DocuSign
-- 4. Invoice generated → payment tracking
-- 5. On payment → subscription created, lead converted
--
-- Next steps:
-- - Build /onboarding/complete/[token] page
-- - Build /admin/onboarding/[id] detail page with all actions
-- - Create quote generation API
-- - Create invoice generation API
-- - Integrate DocuSign for contracts
-- ============================================================================
