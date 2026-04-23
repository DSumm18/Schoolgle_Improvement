-- Discount / Promo Code System
-- Allows admins to create promotional codes for discounts on subscriptions

CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Code details
    code TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Discount configuration
    discount_type TEXT DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed', 'trial')),
    discount_value INTEGER NOT NULL DEFAULT 0, -- Percent (0-100) or fixed amount in pence
    max_discount_amount INTEGER, -- Max amount for fixed discounts (in pence)

    -- Applicability
    applies_to TEXT[] DEFAULT ARRAY['core', 'professional', 'enterprise'], -- Which plans
    min_plan_value INTEGER, -- Minimum plan value (in pence) for discount to apply

    -- Usage limits
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
    uses_count INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1, -- How many times one customer can use

    -- Validity period
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ DEFAULT NULL,

    -- Status
    active BOOLEAN DEFAULT TRUE,
    archived BOOLEAN DEFAULT FALSE,

    -- Tracking
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active, archived) WHERE active = TRUE AND archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_discount_codes_validity ON discount_codes(valid_from, valid_until);

-- Discount usage tracking
CREATE TABLE IF NOT EXISTS discount_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,

    -- Which subscription/user used it
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- What was applied
    discount_amount INTEGER NOT NULL, -- Amount discounted (in pence)

    -- Timestamp
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_usage_discount ON discount_usage(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_org ON discount_usage(organization_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS discount_codes_updated_at ON discount_codes;
CREATE TRIGGER discount_codes_updated_at
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_discount_codes_updated_at();

-- Helper function to validate and apply discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
    p_code TEXT,
    p_plan TEXT,
    p_org_id UUID DEFAULT NULL
) RETURNS TABLE (
    valid BOOLEAN,
    discount_id UUID,
    discount_type TEXT,
    discount_value INTEGER,
    discount_percent INTEGER,
    error_message TEXT
) AS $$
DECLARE
    v_discount RECORD;
    v_times_used INTEGER;
BEGIN
    -- Find the discount code
    SELECT * INTO v_discount
    FROM discount_codes
    WHERE code = UPPER(p_code)
        AND active = TRUE
        AND archived = FALSE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until > NOW());

    -- Check if code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 0, 0::INTEGER, 'Invalid discount code'::TEXT;
        RETURN;
    END IF;

    -- Check if plan is applicable
    IF NOT (p_plan = ANY(v_discount.applies_to)) THEN
        RETURN QUERY SELECT FALSE, v_discount.id, v_discount.discount_type, 0, 0::INTEGER, 'Discount not applicable to this plan'::TEXT;
        RETURN;
    END IF;

    -- Check usage limit
    IF v_discount.max_uses IS NOT NULL AND v_discount.uses_count >= v_discount.max_uses THEN
        RETURN QUERY SELECT FALSE, v_discount.id, v_discount.discount_type, 0, 0::INTEGER, 'Discount code has reached maximum uses'::TEXT;
        RETURN;
    END IF;

    -- Check per-user limit if organization provided
    IF p_org_id IS NOT NULL AND v_discount.max_uses_per_user IS NOT NULL THEN
        SELECT COUNT(*) INTO v_times_used
        FROM discount_usage
        WHERE discount_id = v_discount.id
            AND organization_id = p_org_id;

        IF v_times_used >= v_discount.max_uses_per_user THEN
            RETURN QUERY SELECT FALSE, v_discount.id, v_discount.discount_type, 0, 0::INTEGER, 'You have already used this discount code'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Valid! Return discount details
    RETURN QUERY SELECT
        TRUE,
        v_discount.id,
        v_discount.discount_type,
        v_discount.discount_value,
        CASE WHEN v_discount.discount_type = 'percent' THEN v_discount.discount_value ELSE 0 END,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to apply discount and increment usage
CREATE OR REPLACE FUNCTION apply_discount_code(
    p_discount_id UUID,
    p_subscription_id UUID,
    p_organization_id UUID,
    p_discount_amount INTEGER
) RETURNS UUID AS $$
DECLARE
    v_usage_id UUID;
BEGIN
    -- Create usage record
    INSERT INTO discount_usage (discount_id, subscription_id, organization_id, discount_amount)
    VALUES (p_discount_id, p_subscription_id, p_organization_id, p_discount_amount)
    RETURNING id INTO v_usage_id;

    -- Increment usage count
    UPDATE discount_codes
    SET uses_count = uses_count + 1
    WHERE id = p_discount_id;

    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage discount codes
CREATE POLICY "Super admins can view discount codes"
    ON discount_codes FOR SELECT
    USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can insert discount codes"
    ON discount_codes FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can update discount codes"
    ON discount_codes FOR UPDATE
    USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can delete discount codes"
    ON discount_codes FOR DELETE
    USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Discount usage is readable by super admins and org members
CREATE POLICY "Super admins can view discount usage"
    ON discount_usage FOR SELECT
    USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Comments
COMMENT ON TABLE discount_codes IS 'Promotional/discount codes for subscriptions';
COMMENT ON TABLE discount_usage IS 'Tracking of discount code usage';

-- Insert some default discount codes (for testing)
INSERT INTO discount_codes (code, description, discount_type, discount_value, applies_to, max_uses, valid_until) VALUES
    ('WELCOME10', 'Welcome discount for new customers', 'percent', 10, ARRAY['core', 'professional', 'enterprise'], 100, NOW() + INTERVAL '6 months'),
    ('EARLYADOPT', 'Early adopter discount', 'percent', 20, ARRAY['core', 'professional', 'enterprise'], 50, NOW() + INTERVAL '3 months'),
    ('TRIAL30', 'Extended 30-day trial', 'trial', 30, ARRAY['core', 'professional', 'enterprise'], NULL, NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;
