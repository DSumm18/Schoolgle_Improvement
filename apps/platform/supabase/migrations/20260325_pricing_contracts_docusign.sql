-- =====================================================
-- Pricing, Contracts, Payments, DocuSign Schema
-- Supports trust onboarding flow
-- =====================================================

-- ============================================
-- 1. PRICING MODULES
-- Core subscription modules (School Improvement, Business Management, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('core', 'professional', 'enterprise')),
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  color TEXT, -- For UI: 'blue', 'green', 'orange'
  icon TEXT, -- Icon name for UI
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. PRICING APPS
-- Maps individual apps to modules (e.g., "estates" → "Business Management")
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL UNIQUE, -- e.g., 'estates', 'hr', 'ofsted-readiness'
  name TEXT NOT NULL,
  module_id TEXT REFERENCES pricing_modules(module_id),
  description TEXT,
  included_in_tiers TEXT[], -- e.g., '{core,professional,enterprise}'
  add_on_price_monthly DECIMAL(10,2),
  add_on_price_yearly DECIMAL(10,2),
  url_path TEXT, -- e.g., '/dashboard/estates'
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PRICING DISCOUNTS
-- Volume discounts, multi-school rules, trust pricing
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('volume', 'multi_school', 'trust', 'promotional')),
  condition JSONB NOT NULL,
  -- Examples:
  -- Volume: {"minSchools": 5, "discountPercent": 10}
  -- Multi-school: {"minModules": 2, "discountPercent": 15}
  -- Trust: {"requiresContract": "trust_level", "discountPercent": 20}
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage BETWEEN 0 AND 100),
  active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. CONTRACTS
-- Legal agreements for subscriptions with DocuSign integration
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Contract details
  contract_number TEXT UNIQUE, -- e.g., "SG-2026-001234"
  contract_type TEXT NOT NULL CHECK (contract_type IN ('trust', 'individual', 'split')),

  -- Parties
  trust_name TEXT,
  signed_by_name TEXT,
  signed_by_email TEXT,
  signed_by_role TEXT, -- e.g., 'CEO', 'Finance Director', 'School Business Manager'

  -- Financials
  total_value DECIMAL(10,2) NOT NULL, -- Total contract value
  currency TEXT DEFAULT 'GBP',

  -- Terms
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  notice_period_days INTEGER DEFAULT 30,

  -- Module breakdown
  selected_modules JSONB, -- {schools: [{urn, modules: [], price: 0}]}

  -- Invoicing
  invoicing_option TEXT NOT NULL CHECK (invoicing_option IN ('trust', 'individual', 'split')),
  payment_terms TEXT DEFAULT 'Payment due within 30 days of invoice date',

  -- Documents
  contract_pdf_url TEXT, -- Generated contract PDF
  invoice_pdf_url TEXT, -- Generated invoice PDF

  -- DocuSign integration
  docusign_envelope_id TEXT UNIQUE,
  docusign_status TEXT, -- e.g., 'created', 'sent', 'delivered', 'signed', 'completed'
  docusign_url TEXT, -- Signing URL for user

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('draft', 'awaiting_signature', 'signed', 'active', 'expired', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_for_signature_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. PAYMENTS
-- Track payments, remittances, confirmation
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Payment details
  payment_reference TEXT UNIQUE NOT NULL, -- e.g., "SG-PENNINE-148201"
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,

  -- Payment method
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'direct_debit', 'card', 'cheque')),
  payment_terms TEXT,

  -- Remittance (evidence)
  remittance_file_url TEXT,
  remittance_uploaded_at TIMESTAMP WITH TIME ZONE,
  remittance_notes TEXT,

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'received', 'overdue', 'cancelled')),

  -- Confirmation
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmation_notes TEXT,

  -- Timestamps
  due_date DATE NOT NULL,
  received_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. DOCUSIGN SIGNERS
-- Track all signers on a contract (CEO, Finance, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS docusign_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  -- Signer details
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- e.g., 'CEO', 'Finance Director'
  routing_order INTEGER DEFAULT 1, -- Signing order (1 signs first, then 2, etc.)

  -- DocuSign details
  docusign_signer_id TEXT,
  status TEXT, -- e.g., 'created', 'sent', 'delivered', 'signed', 'declined'

  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. ONBOARDING LEADS (Update existing table)
-- Add fields for trust onboarding flow
-- ============================================

-- Check if column exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onboarding_leads'
    AND column_name = 'selected_schools'
  ) THEN
    ALTER TABLE onboarding_leads
      ADD COLUMN selected_schools JSONB,
      ADD COLUMN selected_modules JSONB,
      ADD COLUMN pricing_breakdown JSONB,
      ADD COLUMN contract_id UUID REFERENCES contracts(id),
      ADD COLUMN invoicing_option TEXT,
      ADD COLUMN current_step INTEGER DEFAULT 1;
  END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

-- Contracts
CREATE INDEX IF NOT EXISTS idx_contracts_organization ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_subscription ON contracts(subscription_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_docusign ON contracts(docusign_envelope_id);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts(start_date, end_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_organization ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- DocuSign signers
CREATE INDEX IF NOT EXISTS idx_docusign_signers_contract ON docusign_signers(contract_id);
CREATE INDEX IF NOT EXISTS idx_docusign_signers_email ON docusign_signers(email);

-- Pricing
CREATE INDEX IF NOT EXISTS idx_pricing_modules_tier ON pricing_modules(tier);
CREATE INDEX IF NOT EXISTS idx_pricing_apps_module ON pricing_apps(module_id);

-- Discounts
CREATE INDEX IF NOT EXISTS idx_pricing_discounts_active ON pricing_discounts(active) WHERE active = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE docusign_signers ENABLE ROW LEVEL SECURITY;

-- Contracts: Organization members can view their contracts
CREATE POLICY "Contracts: org members can view"
  ON contracts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Contracts: Super admins can view all
CREATE POLICY "Contracts: super admins can view all"
  ON contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Payments: Similar RLS
CREATE POLICY "Payments: org members can view"
  ON payments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Payments: super admins can view all"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- DocuSign signers: Org members + signers can view
CREATE POLICY "Signers: org members can view"
  ON docusign_signers FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Signers: signer can view own"
  ON docusign_signers FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  -- Get next sequence number for year
  SELECT COALESCE(MAX(CAST(substring(contract_number FROM '-\d+-\d+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM contracts
  WHERE contract_number LIKE 'SG-' || EXTRACT(YEAR FROM NOW())::TEXT || '-%';

  RETURN 'SG-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(seq_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate payment reference
CREATE OR REPLACE FUNCTION generate_payment_reference(org_name TEXT, school_urn TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Format: SG-TRUSTNAME-URN or SG-SCHOOL-URN
  -- Limit to 30 chars max
  RETURN 'SG-' || UPPER(SUBSTRING(regexp_replace(org_name, '[^A-Z0-9]', '', 'g'), 1, 10)) || '-' || school_urn;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_modules_updated_at BEFORE UPDATE ON pricing_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_apps_updated_at BEFORE UPDATE ON pricing_apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Initial pricing structure)
-- ============================================

-- Core modules
INSERT INTO pricing_modules (module_id, name, description, tier, price_monthly, price_yearly, color, icon, sort_order) VALUES
('school-improvement', 'School Improvement', 'Ofsted readiness, SEF, improvement planning', 'core', 50.00, 500.00, 'blue', 'target', 1),
('business-management', 'Business Management', 'Estates, HR, governance, compliance', 'core', 40.00, 400.00, 'green', 'briefcase', 2),
('school-intelligence', 'School Intelligence', 'DfE census, pupil data, assessment tracking', 'core', 30.00, 300.00, 'orange', 'chart-bar', 3)
ON CONFLICT (module_id) DO NOTHING;

-- Add-on modules
INSERT INTO pricing_modules (module_id, name, description, tier, price_monthly, price_yearly, color, icon, sort_order) VALUES
('communications', 'Communications', 'Comms feed, notices, emergency broadcasts', 'professional', 20.00, 200.00, 'purple', 'megaphone', 10),
('surveys', 'Surveys', 'Parent, staff, pupil surveys', 'professional', 15.00, 150.00, 'indigo', 'clipboard-list', 11),
('admissions', 'Admissions', 'Admissions management', 'professional', 10.00, 100.00, 'cyan', 'users', 12),
('school-meals', 'School Meals', 'Universal Infant Free School Meals', 'professional', 5.00, 50.00, 'yellow', 'utensils', 13),
('cover', 'Cover', 'Staff cover management', 'professional', 15.00, 150.00, 'pink', 'calendar', 14),
('sports-premium', 'Sports Premium', 'PE & Sport Premium tracking', 'professional', 5.00, 50.00, 'emerald', 'trophy', 15),
('pupil-premium', 'Pupil Premium', 'Pupil Premium strategy & tracking', 'professional', 5.00, 50.00, 'amber', 'pound-sign', 16),
('canvas', 'Canvas', 'Advanced data intelligence platform', 'enterprise', 50.00, 500.00, 'violet', 'database', 20)
ON CONFLICT (module_id) DO NOTHING;

-- Volume discounts
INSERT INTO pricing_discounts (name, description, type, condition, discount_percentage, active) VALUES
('Multi-school 5+', '5+ schools get 10% off', 'volume', '{"minSchools": 5}', 10, true),
('Multi-school 10+', '10+ schools get 15% off', 'volume', '{"minSchools": 10}', 15, true),
('Multi-school 20+', '20+ schools get 20% off', 'volume', '{"minSchools": 20}', 20, true),
('Trust Level', 'Trust-level contracts get 10% off', 'trust', '{"requiresContract": "trust_level"}', 10, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE pricing_modules IS 'Core subscription modules with pricing tiers';
COMMENT ON TABLE pricing_apps IS 'Individual apps mapped to modules (e.g., estates → Business Management)';
COMMENT ON TABLE pricing_discounts IS 'Volume, multi-school, and promotional discount rules';
COMMENT ON TABLE contracts IS 'Legal contracts with DocuSign integration and status tracking';
COMMENT ON TABLE payments IS 'Payment tracking with remittance uploads and confirmation workflow';
COMMENT ON TABLE docusign_signers IS 'Track all signers on contracts (CEO, Finance, etc.)';

COMMENT ON COLUMN contracts.docusign_envelope_id IS 'DocuSign envelope ID for signing workflow';
COMMENT ON COLUMN contracts.selected_modules IS 'JSONB breakdown of which modules each school selected';
COMMENT ON COLUMN contracts.invoicing_option IS 'trust = single invoice, individual = per school, split = mixed';
COMMENT ON COLUMN payments.remittance_file_url IS 'Uploaded evidence of bank transfer (PDF, screenshot)';
COMMENT ON COLUMN payments.payment_reference IS 'Unique reference for bank transfer: SG-TRUST-URN';
