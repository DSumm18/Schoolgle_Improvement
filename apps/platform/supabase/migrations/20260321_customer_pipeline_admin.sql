-- Customer Pipeline Management System
-- Complete schema for internal admin management of subscriptions, invoices, and access control

-- ============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Plan details
    plan TEXT NOT NULL CHECK (plan IN ('core', 'professional', 'enterprise', 'ed_in_school', 'ed_website', 'trial')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'expired')),

    -- Pricing
    base_price_annual INTEGER NOT NULL DEFAULT 0, -- in pence
    discount_percent INTEGER DEFAULT 0,
    final_price_annual INTEGER NOT NULL DEFAULT 0, -- in pence
    school_count INTEGER DEFAULT 1,

    -- Payment method
    payment_method TEXT CHECK (payment_method IN ('card', 'invoice', 'bacs')),

    -- Subscription period
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,

    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT TRUE,

    -- Contract details
    contract_signed_at TIMESTAMPTZ,
    contract_signed_by TEXT,

    -- Stripe integration (optional)
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,

    -- Module access (JSON array of enabled modules)
    enabled_modules TEXT[] DEFAULT ARRAY[
        'ofsted-readiness',
        'estates-compliance',
        'hr-people',
        'governance',
        'actions-hub',
        'intelligence'
    ],

    -- User limits
    user_limit INTEGER DEFAULT 3,
    storage_limit_gb INTEGER DEFAULT 50,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);

-- ============================================================================
-- 2. SUBSCRIPTION HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,

    change_type TEXT NOT NULL CHECK (change_type IN (
        'created', 'upgraded', 'downgraded', 'cancelled', 'reactivated',
        'payment_failed', 'payment_received', 'renewed', 'trial_extended',
        'modules_changed', 'user_limit_changed'
    )),

    -- Change details
    previous_plan TEXT,
    new_plan TEXT,
    previous_price INTEGER,
    new_price INTEGER,
    reason TEXT,

    -- Metadata
    changed_by TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON public.subscription_history(subscription_id);

-- ============================================================================
-- 3. INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,

    -- Invoice details
    invoice_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

    -- Amounts (in pence)
    subtotal INTEGER NOT NULL DEFAULT 0,
    tax INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    amount_due INTEGER NOT NULL DEFAULT 0,
    amount_paid INTEGER DEFAULT 0,

    -- Description
    description TEXT,
    line_items JSONB DEFAULT '[]'::jsonb, -- Array of {description, quantity, unit_price, total}

    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    reminder_count INTEGER DEFAULT 0,

    -- Payment details
    payment_method TEXT CHECK (payment_method IN ('card', 'invoice', 'bacs')),
    payment_reference TEXT,

    -- PDF storage
    pdf_url TEXT,

    -- Internal notes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_organization ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- ============================================================================
-- 4. CUSTOMER HEALTH TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Health metrics
    health_score INTEGER DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
    health_status TEXT DEFAULT 'neutral' CHECK (health_status IN ('healthy', 'neutral', 'at_risk', 'critical')),

    -- Activity tracking
    days_since_last_login INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    login_count_30_days INTEGER DEFAULT 0,
    active_users_30_days INTEGER DEFAULT 0,

    -- Feature usage
    ai_spend_last_30_days DECIMAL(10,2) DEFAULT 0,
    ai_queries_last_30_days INTEGER DEFAULT 0,
    documents_uploaded_30_days INTEGER DEFAULT 0,
    actions_created_30_days INTEGER DEFAULT 0,

    -- Risk indicators
    low_usage_alert BOOLEAN DEFAULT FALSE,
    payment_overdue BOOLEAN DEFAULT FALSE,
    support_tickets_open INTEGER DEFAULT 0,

    -- Last updated
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_health_organization ON public.customer_health(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_health_status ON public.customer_health(health_status);
CREATE INDEX IF NOT EXISTS idx_customer_health_score ON public.customer_health(health_score);

-- ============================================================================
-- 5. SUPER ADMINS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,

    -- Access level
    access_level TEXT DEFAULT 'admin' CHECK (access_level IN ('viewer', 'admin', 'super')),
    permissions TEXT[] DEFAULT ARRAY[
        'view_customers',
        'manage_subscriptions',
        'send_invoices',
        'provision_users',
        'block_access'
    ],

    -- Activity tracking
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_super_admins_user ON public.super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON public.super_admins(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_super_admins_user_unique ON public.super_admins(user_id);

-- ============================================================================
-- 6. ONBOARDING QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.onboarding_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'awaiting_info', 'ready', 'completed', 'blocked'
    )),

    -- Onboarding stage
    stage TEXT DEFAULT 'initial' CHECK (stage IN (
        'initial', 'branding', 'structure', 'integration', 'data_import', 'training', 'complete'
    )),

    -- Assigned to
    assigned_to TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,

    -- Checklist
    checklist JSONB DEFAULT '{
        "logo_uploaded": false,
        "colors_set": false,
        "classes_imported": false,
        "rooms_imported": false,
        "drive_connected": false,
        "data_imported": false,
        "users_provisioned": false,
        "training_scheduled": false
    }'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_queue_org ON public.onboarding_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_queue_status ON public.onboarding_queue(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_queue_assigned ON public.onboarding_queue(assigned_to);

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Generate sequential invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'INV-';
    sequence_num INTEGER;
    result TEXT;
BEGIN
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5 FOR 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '%';

    -- Format: INV-YYYYMM-#### (e.g., INV-202503-0001)
    result := prefix || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(sequence_num::TEXT, 4, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update subscription status based on period end
CREATE OR REPLACE FUNCTION public.check_subscription_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- If subscription period has ended and not already cancelled
    IF NEW.current_period_end < NOW() AND NEW.status IN ('active', 'trialing') THEN
        IF NEW.cancel_at_period_end = TRUE THEN
            NEW.status := 'cancelled';
        ELSE
            NEW.status := 'past_due';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update customer health score
CREATE OR REPLACE FUNCTION public.update_customer_health(org_id UUID)
RETURNS VOID AS $$
DECLARE
    health RECORD;
    last_login TIMESTAMPTZ;
    days_since_login INTEGER;
    login_count INTEGER;
    ai_spend DECIMAL(10,2);
    ai_queries INTEGER;
    docs_uploaded INTEGER;
    actions_created INTEGER;
    active_users INTEGER;
    overdue_count INTEGER;
    score INTEGER;
    status TEXT;
BEGIN
    -- Get last login info
    SELECT MAX(last_sign_in_at) INTO last_login
    FROM auth.users
    INNER JOIN public.organization_members ON auth.users.id = public.organization_members.user_id
    WHERE public.organization_members.organization_id = org_id;

    -- Calculate days since last login
    days_since_login := EXTRACT(DAY FROM (NOW() - COALESCE(last_login, NOW() - INTERVAL '100 days')));

    -- Count logins in last 30 days
    SELECT COUNT(DISTINCT user_id) INTO login_count
    FROM public.organization_members
    WHERE organization_id = org_id
    AND created_at > NOW() - INTERVAL '30 days';

    -- Get AI usage (placeholder - integrate with actual usage tracking)
    ai_spend := 0;
    ai_queries := 0;

    -- Get document upload count
    SELECT COUNT(*) INTO docs_uploaded
    FROM public.documents
    WHERE organization_id = org_id
    AND created_at > NOW() - INTERVAL '30 days';

    -- Get actions created
    SELECT COUNT(*) INTO actions_created
    FROM public.actions
    WHERE organization_id = org_id
    AND created_at > NOW() - INTERVAL '30 days';

    -- Get active users
    SELECT COUNT(DISTINCT om.user_id) INTO active_users
    FROM public.organization_members om
    INNER JOIN auth.users ON auth.users.id = om.user_id
    WHERE om.organization_id = org_id
    AND auth.users.last_sign_in_at > NOW() - INTERVAL '30 days';

    -- Get overdue invoices
    SELECT COUNT(*) INTO overdue_count
    FROM public.invoices
    WHERE organization_id = org_id
    AND status IN ('overdue', 'past_due');

    -- Calculate health score
    score := 50; -- Base score
    IF days_since_login < 7 THEN score := score + 20;
    ELSIF days_since_login < 30 THEN score := score + 10;
    ELSIF days_since_login > 60 THEN score := score - 20;
    END IF;

    IF login_count > 3 THEN score := score + 10;
    ELSIF login_count = 0 THEN score := score - 10;
    END IF;

    IF docs_uploaded > 10 THEN score := score + 10;
    END IF;

    IF actions_created > 5 THEN score := score + 10;
    END IF;

    IF overdue_count > 0 THEN score := score - 30;
    END IF;

    -- Clamp score
    score := GREATEST(0, LEAST(100, score));

    -- Determine status
    IF score >= 70 THEN
        status := 'healthy';
    ELSIF score >= 50 THEN
        status := 'neutral';
    ELSIF score >= 30 THEN
        status := 'at_risk';
    ELSE
        status := 'critical';
    END IF;

    -- Update or insert health record
    INSERT INTO public.customer_health (
        organization_id,
        health_score,
        health_status,
        days_since_last_login,
        last_login_at,
        login_count_30_days,
        active_users_30_days,
        ai_spend_last_30_days,
        ai_queries_last_30_days,
        documents_uploaded_30_days,
        actions_created_30_days,
        payment_overdue
    ) VALUES (
        org_id,
        score,
        status,
        days_since_login,
        last_login,
        login_count,
        active_users,
        ai_spend,
        ai_queries,
        docs_uploaded,
        actions_created,
        overdue_count > 0
    )
    ON CONFLICT (organization_id) DO UPDATE SET
        health_score = EXCLUDED.health_score,
        health_status = EXCLUDED.health_status,
        days_since_last_login = EXCLUDED.days_since_last_login,
        last_login_at = EXCLUDED.last_login_at,
        login_count_30_days = EXCLUDED.login_count_30_days,
        active_users_30_days = EXCLUDED.active_users_30_days,
        ai_spend_last_30_days = EXCLUDED.ai_spend_last_30_days,
        ai_queries_last_30_days = EXCLUDED.ai_queries_last_30_days,
        documents_uploaded_30_days = EXCLUDED.documents_uploaded_30_days,
        actions_created_30_days = EXCLUDED.actions_created_30_days,
        payment_overdue = EXCLUDED.payment_overdue,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Trigger to check subscription expiration on update
CREATE TRIGGER check_subscription_expiration_trigger
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_subscription_expiration();

-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

-- Super admins can access all tables
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all super admins"
    ON public.super_admins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.super_admins
            WHERE user_id = auth.uid()
        )
    );

-- Only super admins can insert/update super admins
CREATE POLICY "Super admins can insert super admins"
    ON public.super_admins FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.super_admins
            WHERE user_id = auth.uid()
            AND access_level IN ('admin', 'super')
        )
    );

CREATE POLICY "Super admins can update super admins"
    ON public.super_admins FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.super_admins
            WHERE user_id = auth.uid()
            AND access_level IN ('admin', 'super')
        )
    );

-- ============================================================================
-- 10. INITIAL DATA
-- ============================================================================

-- Insert default super admin (replace with actual admin user ID)
-- This is a placeholder - should be updated with actual user IDs
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Try to find an existing admin user by email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email IN ('admin@schoolgle.co.uk', 'david@schoolgle.co.uk')
    LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.super_admins (user_id, email, access_level)
        VALUES (admin_user_id, (SELECT email FROM auth.users WHERE id = admin_user_id), 'super')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- 11. HELPER VIEWS
-- ============================================================================

-- Subscription summary view
CREATE OR REPLACE VIEW public.subscription_summary AS
SELECT
    s.id,
    s.organization_id,
    o.name AS organization_name,
    o.urn,
    s.plan,
    s.status,
    s.final_price_annual,
    s.current_period_end,
    s.payment_method,
    s.enabled_modules,
    s.user_limit,
    ch.health_score,
    ch.health_status,
    ch.days_since_last_login,
    COUNT(DISTINCT om.user_id) AS active_users,
    COUNT(i.id) FILTER (WHERE i.status IN ('sent', 'overdue')) AS outstanding_invoices,
    COALESCE(SUM(i.amount_due) FILTER (WHERE i.status IN ('sent', 'overdue')), 0) AS outstanding_amount
FROM public.subscriptions s
JOIN public.organizations o ON o.id = s.organization_id
LEFT JOIN public.customer_health ch ON ch.organization_id = o.id
LEFT JOIN public.organization_members om ON om.organization_id = o.id
LEFT JOIN public.invoices i ON i.subscription_id = s.id
GROUP BY s.id, o.name, o.urn, ch.health_score, ch.health_status, ch.days_since_last_login;

-- ============================================================================
-- 12. GRANTS
-- ============================================================================

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant service role full access (needed for API endpoints)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.subscriptions IS 'Customer subscription records with plan, pricing, and access control';
COMMENT ON TABLE public.invoices IS 'Invoice records for customer billing';
COMMENT ON TABLE public.customer_health IS 'Customer health metrics for churn prediction';
COMMENT ON TABLE public.super_admins IS 'Internal admin users with elevated permissions';
COMMENT ON TABLE public.onboarding_queue IS 'Customer onboarding pipeline tracking';
