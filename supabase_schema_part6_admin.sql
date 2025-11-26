-- =====================================================
-- PART 6: ADMIN, SUBSCRIPTIONS & USAGE MONITORING
-- =====================================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'core', 'professional', 'enterprise'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'trialing'
    payment_method VARCHAR(50) NOT NULL, -- 'card', 'invoice'
    
    -- Pricing
    base_price_annual INTEGER NOT NULL, -- in pence
    discount_percent INTEGER DEFAULT 0,
    final_price_annual INTEGER NOT NULL, -- after discount
    
    -- For trusts - number of schools
    school_count INTEGER DEFAULT 1,
    
    -- Dates
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Contract
    contract_signed_at TIMESTAMPTZ,
    contract_signed_by VARCHAR(255),
    contract_version VARCHAR(50) DEFAULT '1.0',
    
    -- Stripe (if using card)
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    
    -- Amounts (in pence)
    subtotal INTEGER NOT NULL,
    tax INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    amount_paid INTEGER DEFAULT 0,
    amount_due INTEGER NOT NULL,
    
    -- Details
    description TEXT,
    purchase_order_number VARCHAR(100),
    
    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Billing details
    billing_email VARCHAR(255),
    billing_name VARCHAR(255),
    billing_address TEXT,
    
    -- PDF storage
    pdf_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    amount INTEGER NOT NULL, -- in pence
    currency VARCHAR(3) DEFAULT 'GBP',
    status VARCHAR(50) NOT NULL, -- 'pending', 'succeeded', 'failed', 'refunded'
    payment_method VARCHAR(50), -- 'card', 'bank_transfer', 'bacs'
    
    -- Stripe
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    
    -- Bank transfer
    reference VARCHAR(100),
    
    -- Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    
    -- Failure details
    failure_reason TEXT
);

-- Usage Events table - tracks every action
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'ai_chat', 'report_generated', 'action_created', etc.
    event_category VARCHAR(50), -- 'navigation', 'ai', 'documents', 'actions', etc.
    
    -- Event details
    metadata JSONB DEFAULT '{}',
    
    -- For AI events - cost tracking
    ai_model VARCHAR(100),
    ai_tokens_input INTEGER,
    ai_tokens_output INTEGER,
    ai_cost_usd DECIMAL(10, 6), -- cost in USD (for accuracy)
    
    -- Session tracking
    session_id VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily usage summary (aggregated for performance)
CREATE TABLE IF NOT EXISTS usage_daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Activity counts
    total_events INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    
    -- Feature usage
    ai_chats INTEGER DEFAULT 0,
    reports_generated INTEGER DEFAULT 0,
    actions_created INTEGER DEFAULT 0,
    actions_completed INTEGER DEFAULT 0,
    assessments_updated INTEGER DEFAULT 0,
    documents_uploaded INTEGER DEFAULT 0,
    voice_observations INTEGER DEFAULT 0,
    mock_inspections INTEGER DEFAULT 0,
    
    -- AI costs
    ai_total_tokens INTEGER DEFAULT 0,
    ai_total_cost_usd DECIMAL(10, 4) DEFAULT 0,
    
    -- Time spent (seconds)
    total_session_time INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, date)
);

-- Customer health score
CREATE TABLE IF NOT EXISTS customer_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    
    -- Health score (0-100)
    health_score INTEGER DEFAULT 50,
    health_status VARCHAR(20) DEFAULT 'neutral', -- 'healthy', 'neutral', 'at_risk', 'critical'
    
    -- Component scores (0-100)
    engagement_score INTEGER DEFAULT 50, -- how often they use it
    adoption_score INTEGER DEFAULT 50, -- how many features they use
    value_score INTEGER DEFAULT 50, -- are they getting value (actions completed, etc.)
    
    -- Key metrics
    days_since_last_login INTEGER,
    logins_last_30_days INTEGER DEFAULT 0,
    active_users_percent DECIMAL(5, 2) DEFAULT 0, -- % of users who logged in last 30 days
    features_used_count INTEGER DEFAULT 0,
    actions_completion_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- AI usage
    ai_spend_last_30_days DECIMAL(10, 4) DEFAULT 0,
    ai_queries_last_30_days INTEGER DEFAULT 0,
    
    -- Risk flags
    risk_flags JSONB DEFAULT '[]', -- array of risk indicators
    
    -- Engagement
    last_login_at TIMESTAMPTZ,
    last_engagement_email_at TIMESTAMPTZ,
    engagement_email_count INTEGER DEFAULT 0,
    
    -- NPS/Feedback
    last_nps_score INTEGER,
    last_nps_at TIMESTAMPTZ,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement emails sent
CREATE TABLE IF NOT EXISTS engagement_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    email_type VARCHAR(50) NOT NULL, -- 'welcome', 'inactive_7d', 'inactive_14d', 'feature_tip', 'renewal_reminder'
    subject VARCHAR(255),
    template_id VARCHAR(100),
    
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- Tracking
    email_provider_id VARCHAR(255) -- e.g. Resend message ID
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- 'subscription', 'organization', 'user', 'invoice'
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription changes history
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed', 'payment_failed'
    previous_plan VARCHAR(50),
    new_plan VARCHAR(50),
    previous_price INTEGER,
    new_price INTEGER,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_org ON usage_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_daily_org_date ON usage_daily_summary(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_customer_health_status ON customer_health(health_status);
CREATE INDEX IF NOT EXISTS idx_customer_health_score ON customer_health(health_score);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    year_part VARCHAR(4);
    seq_part INTEGER;
    new_number VARCHAR(50);
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
    INTO seq_part
    FROM invoices
    WHERE invoice_number LIKE year_part || '%';
    new_number := year_part || LPAD(seq_part::TEXT, 5, '0');
    RETURN 'INV-' || new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate customer health score
CREATE OR REPLACE FUNCTION calculate_customer_health(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
    engagement INTEGER;
    adoption INTEGER;
    value_s INTEGER;
    final_score INTEGER;
    days_inactive INTEGER;
    login_count INTEGER;
    features_used INTEGER;
    completion_rate DECIMAL;
BEGIN
    -- Get days since last login
    SELECT EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER
    INTO days_inactive
    FROM usage_events
    WHERE organization_id = org_id AND event_type = 'login';
    
    -- Get login count last 30 days
    SELECT COUNT(DISTINCT DATE(created_at))
    INTO login_count
    FROM usage_events
    WHERE organization_id = org_id 
    AND event_type = 'login'
    AND created_at > NOW() - INTERVAL '30 days';
    
    -- Get features used
    SELECT COUNT(DISTINCT event_type)
    INTO features_used
    FROM usage_events
    WHERE organization_id = org_id
    AND created_at > NOW() - INTERVAL '30 days';
    
    -- Calculate engagement score (0-100)
    engagement := LEAST(100, (login_count * 4) + (CASE WHEN days_inactive < 7 THEN 40 ELSE 0 END));
    
    -- Calculate adoption score (0-100)
    adoption := LEAST(100, features_used * 10);
    
    -- Calculate value score based on action completion
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        50
    )::INTEGER
    INTO value_s
    FROM actions
    WHERE organization_id = org_id;
    
    -- Weighted average
    final_score := (engagement * 0.4 + adoption * 0.3 + value_s * 0.3)::INTEGER;
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update health score daily
CREATE OR REPLACE FUNCTION update_customer_health_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO customer_health (organization_id, health_score, updated_at)
    VALUES (NEW.organization_id, calculate_customer_health(NEW.organization_id), NOW())
    ON CONFLICT (organization_id) DO UPDATE
    SET health_score = calculate_customer_health(NEW.organization_id),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

