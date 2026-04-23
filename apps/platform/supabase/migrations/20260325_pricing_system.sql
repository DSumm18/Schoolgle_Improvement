-- ============================================================================
-- Schoolgle Pricing System Migration
-- ============================================================================
-- Creates tables for:
-- - Module pricing (£500/module, £1,000/Ed)
-- - Organization pricing overrides (bespoke deals)
-- - Discount codes (referrals, promotions, trials)
-- - Subscription module lines (track pricing per module)
-- - Discount usage tracking
-- ============================================================================

-- ============================================================================
-- 1. Module Pricing Table
-- ============================================================================
-- Standard pricing for each module (can change over time)
CREATE TABLE IF NOT EXISTS module_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  standard_price INTEGER NOT NULL, -- in pence (50000 = £500.00)
  currency TEXT DEFAULT 'GBP',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE, -- NULL means currently effective
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);

-- Allow looking up current price efficiently
CREATE INDEX idx_module_pricing_current ON module_pricing(module_id, effective_from)
WHERE effective_to IS NULL;

-- Unique constraint: one price per module per effective date
CREATE UNIQUE INDEX idx_module_pricing_unique ON module_pricing(module_id, effective_from);

-- ============================================================================
-- 2. Organization Pricing Overrides (Bespoke Deals)
-- ============================================================================
-- Custom pricing for specific organizations
CREATE TABLE IF NOT EXISTS organization_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  custom_price INTEGER, -- NULL = use standard, or custom price in pence
  pricing_type TEXT DEFAULT 'standard' CHECK (pricing_type IN ('standard', 'discount', 'bespoke', 'trial')),
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_fixed INTEGER, -- Fixed amount off in pence
  trial_end_date DATE,
  trial_converted BOOLEAN DEFAULT FALSE,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE, -- NULL = indefinite
  CONSTRAINT valid_date_range_override CHECK (
    valid_until IS NULL OR valid_until >= valid_from
  ),
  CONSTRAINT trial_requires_end_date CHECK (
    pricing_type != 'trial' OR trial_end_date IS NOT NULL
  )
);

-- Efficient lookup of active overrides for an org
CREATE INDEX idx_org_pricing_lookup ON organization_pricing(organization_id, module_id, valid_from)
WHERE valid_until IS NULL OR valid_until > CURRENT_DATE;

-- ============================================================================
-- 3. Discount Codes
-- ============================================================================
-- Promotional and referral codes
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_months')),
  discount_value INTEGER NOT NULL, -- % or pence or months
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  applicable_to TEXT DEFAULT 'all' CHECK (applicable_to IN ('all', 'specific_modules', 'new_customers', 'trials', 'referrals')),
  applicable_modules TEXT[], -- e.g., ARRAY['improvement', 'governance']
  min_purchase INTEGER, -- minimum order value in pence
  referral_bonus INTEGER, -- if referral, bonus for referrer (in pence)
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT valid_discount_range CHECK (
    valid_until IS NULL OR valid_until >= valid_from
  ),
  CONSTRAINT uses_not_exceeded CHECK (
    max_uses IS NULL OR uses_count <= max_uses
  )
);

-- Look up active codes efficiently
CREATE INDEX idx_discount_codes_active ON discount_codes(code, is_active, valid_from)
WHERE is_active = TRUE AND (valid_until IS NULL OR valid_until > CURRENT_DATE);

-- ============================================================================
-- 4. Subscription Module Lines
-- ============================================================================
-- Track pricing per module within a subscription
CREATE TABLE IF NOT EXISTS subscription_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  base_price INTEGER NOT NULL, -- Standard price at time of purchase (pence)
  actual_price INTEGER NOT NULL, -- Price after discounts (pence)
  discount_code_id UUID REFERENCES discount_codes(id),
  discount_amount INTEGER DEFAULT 0, -- How much was discounted (in pence)
  is_trial BOOLEAN DEFAULT FALSE,
  trial_end_date DATE,
  auto_convert_after_trial BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT trial_requires_end CHECK (
    is_trial = FALSE OR trial_end_date IS NOT NULL
  ),
  CONSTRAINT trial_not_negative CHECK (
    is_trial = FALSE OR actual_price = 0
  )
);

-- Unique: one line per module per subscription
CREATE UNIQUE INDEX idx_subscription_modules_unique ON subscription_modules(subscription_id, module_id);

-- Lookup modules in a subscription
CREATE INDEX idx_subscription_modules_lookup ON subscription_modules(subscription_id);

-- ============================================================================
-- 5. Discount Usage Tracking
-- ============================================================================
-- Track which discount codes were used and where
CREATE TABLE IF NOT EXISTS discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  discount_amount INTEGER NOT NULL, -- Amount saved (in pence)
  used_at TIMESTAMPTZ DEFAULT NOW(),
  used_by UUID REFERENCES users(id),
  referral_source_organization_id UUID REFERENCES organizations(id), -- If referral code
  metadata JSONB DEFAULT '{}' -- Store additional context
);

-- Analytics: usage per code
CREATE INDEX idx_discount_usage_code ON discount_usage(discount_code_id);

-- Analytics: usage per organization
CREATE INDEX idx_discount_usage_org ON discount_usage(organization_id);

-- ============================================================================
-- SEED DATA: Standard Module Pricing
-- ============================================================================

INSERT INTO module_pricing (module_id, module_name, standard_price) VALUES
  ('improvement', 'School Improvement', 50000),
  ('governance', 'Governance', 50000),
  ('estates', 'Business Operations', 50000),
  ('compliance', 'Compliance & Safeguarding', 50000),
  ('communications', 'Communications', 50000),
  ('intelligence', 'Schoolgle Intelligence', 50000),
  ('teaching-learning', 'Teaching & Learning', 50000)
ON CONFLICT (module_id, effective_from) DO NOTHING;

-- Ed pricing
INSERT INTO module_pricing (module_id, module_name, standard_price) VALUES
  ('ed-chatbot', 'Ed Chatbot', 100000)
ON CONFLICT (module_id, effective_from) DO NOTHING;

-- ============================================================================
-- SEED DATA: Initial Discount Codes
-- ============================================================================

-- Welcome offer for new customers
INSERT INTO discount_codes (code, description, discount_type, discount_value, applicable_to, valid_until) VALUES
  ('WELCOME10', 'Welcome offer - 10% off first year', 'percentage', 10, 'new_customers', '2026-12-31'),
  ('WELCOME20', 'Special welcome - 20% off first year', 'percentage', 20, 'new_customers', '2026-06-30');

-- Trial conversion incentives
INSERT INTO discount_codes (code, description, discount_type, discount_value, applicable_to, valid_until) VALUES
  ('TRIAL10', 'Trial conversion - 10% off if convert within 30 days', 'percentage', 10, 'trials', '2027-12-31'),
  ('TRIAL15', 'Trial conversion - 15% off if convert within 14 days', 'percentage', 15, 'trials', '2027-12-31');

-- Referral scheme
INSERT INTO discount_codes (code, description, discount_type, discount_value, applicable_to, valid_until, referral_bonus) VALUES
  ('REFERRAL10', 'Refer a friend - 10% off for both', 'percentage', 10, 'referrals', '2027-12-31', 10000);

-- Trust/multi-school discount
INSERT INTO discount_codes (code, description, discount_type, discount_value, applicable_to, valid_until) VALUES
  ('TRUST15', 'Multi-school trust - 15% off', 'percentage', 15, 'all', '2027-12-31'),
  ('TRUST20', 'Large trust (10+ schools) - 20% off', 'percentage', 20, 'all', '2027-12-31');

-- Non-profit/small school support
INSERT INTO discount_codes (code, description, discount_type, discount_value, applicable_to, valid_until, min_purchase) VALUES
  ('NONPROFIT25', 'Non-profit discount - 25% off', 'percentage', 25, 'all', '2027-12-31', 50000);

-- Early adopter (limited time)
INSERT INTO discount_codes (code, description, discount_type, discount_value, applicable_to, valid_until, max_uses) VALUES
  ('EARLY20', 'Early adopter - 20% off first year', 'percentage', 20, 'new_customers', '2026-06-30', 50);

-- Module-specific discounts (if we want to push certain modules)
INSERT INTO discount_codes (code, description, discount_type, discount_value, applicable_to, applicable_modules, valid_until) VALUES
  ('TRY-INTELLIGENCE', 'Try Intelligence module - 20% off', 'percentage', 20, 'specific_modules', ARRAY['intelligence'], '2026-12-31'),
  ('TRY-COMPLIANCE', 'Try Compliance module - 20% off', 'percentage', 20, 'specific_modules', ARRAY['compliance'], '2026-12-31');

-- ============================================================================
-- HELPER FUNCTIONS (for future use)
-- ============================================================================

-- Function to get current price for a module
CREATE OR REPLACE FUNCTION get_module_price(p_module_id TEXT)
RETURNS INTEGER AS $$
  SELECT standard_price
  FROM module_pricing
  WHERE module_id = p_module_id
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
  ORDER BY effective_from DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to get organization-specific pricing (if any)
CREATE OR REPLACE FUNCTION get_org_price(p_organization_id UUID, p_module_id TEXT)
RETURNS TABLE (
  custom_price INTEGER,
  pricing_type TEXT,
  discount_percent INTEGER,
  discount_fixed INTEGER,
  trial_end_date DATE
) AS $$
  SELECT
    op.custom_price,
    op.pricing_type,
    op.discount_percent,
    op.discount_fixed,
    op.trial_end_date
  FROM organization_pricing op
  WHERE op.organization_id = p_organization_id
    AND op.module_id = p_module_id
    AND op.valid_from <= CURRENT_DATE
    AND (op.valid_until IS NULL OR op.valid_until > CURRENT_DATE)
  ORDER BY op.valid_from DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE module_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;

-- Module pricing: everyone can read, only service role can write
CREATE POLICY "Module pricing: Public read" ON module_pricing
  FOR SELECT USING (true);

-- Organization pricing: org members can read their own, service role all
CREATE POLICY "Org pricing: Read own" ON organization_pricing
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org pricing: Service role full access" ON organization_pricing
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Discount codes: active codes are public, inactive are admin-only
CREATE POLICY "Discount codes: Read active" ON discount_codes
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Discount codes: Service role full access" ON discount_codes
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscription modules: org members can read their own
CREATE POLICY "Subscription modules: Read own" ON subscription_modules
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Subscription modules: Service role full access" ON subscription_modules
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Discount usage: org members can read their own, service role all
CREATE POLICY "Discount usage: Read own" ON discount_usage
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Discount usage: Service role full access" ON discount_usage
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- NOTES
-- ============================================================================
-- Standard pricing:
--   - Each module: £500/year (50000 pence)
--   - Ed Chatbot: £1,000/year (100000 pence)
--   - All 7 modules + Ed: £4,500/year
--
-- Discount codes in this migration:
--   WELCOME10, WELCOME20 - New customer discounts
--   TRIAL10, TRIAL15 - Trial conversion incentives
--   REFERRAL10 - Referral scheme (10% off for both parties)
--   TRUST15, TRUST20 - Multi-school trust discounts
--   NONPROFIT25 - Non-profit/small school support
--   EARLY20 - Early adopter (limited to 50 uses)
--   TRY-INTELLIGENCE, TRY-COMPLIANCE - Module-specific promotions
--
-- Pricing calculation flow:
--   1. Get standard price from module_pricing
--   2. Check for org override in organization_pricing
--   3. Apply discount code if provided
--   4. Calculate final price
--
-- Example: All modules + Ed with REFERRAL10
--   Base: £4,500
--   Discount: 10% = £450
--   Final: £4,050
