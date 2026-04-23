# Schoolgle Pricing System Design

## Standard Pricing Model

### Module Pricing
- **Each Module**: £500/year
- **Ed Chatbot**: £1,000/year

### Complete Platform Cost
- **All 7 Modules**: £3,500/year (7 × £500)
- **Plus Ed**: £1,000/year
- **Total**: £4,500/year

---

## Pricing Strategy

### Tiers
1. **Individual Module**: £500/year
2. **Module Bundles**: £450/module (10% discount for 3+ modules)
3. **Complete Platform**: £3,500 (all 7 modules) + £1,000 (Ed) = £4,500
4. **Ed Only**: £1,000/year (add-on to any module)

### Discount Opportunities
- **Referral Scheme**: 10% off for both referrer and referee
- **Multi-school Trust**: 15% off for 3+ schools
- **Early Adopter**: 20% off first year
- **Trial Conversions**: 10% off if convert within trial period
- **Non-Profit/Small Schools**: Means-tested discounts
- **Bespoke Deals**: Custom pricing for large MATs

---

## Database Schema

### 1. Module Pricing Table
```sql
-- Standard pricing for each module
CREATE TABLE module_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL, -- 'improvement', 'governance', etc.
  module_name TEXT NOT NULL,
  standard_price INTEGER NOT NULL, -- in pence (50000 = £500.00)
  currency TEXT DEFAULT 'GBP',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE, -- NULL means currently effective
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, effective_from)
);

-- Seed data
INSERT INTO module_pricing (module_id, module_name, standard_price) VALUES
  ('improvement', 'School Improvement', 50000),
  ('governance', 'Governance', 50000),
  ('estates', 'Business Operations', 50000),
  ('compliance', 'Compliance & Safeguarding', 50000),
  ('communications', 'Communications', 50000),
  ('intelligence', 'Schoolgle Intelligence', 50000),
  ('teaching-learning', 'Teaching & Learning', 50000);

-- Ed pricing
INSERT INTO module_pricing (module_id, module_name, standard_price) VALUES
  ('ed-chatbot', 'Ed Chatbot', 100000);
```

### 2. Organization Pricing Overrides (Bespoke Deals)
```sql
-- Custom pricing for specific organizations
CREATE TABLE organization_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  module_id TEXT NOT NULL,
  custom_price INTEGER, -- NULL = use standard, or custom price in pence
  pricing_type TEXT DEFAULT 'standard', -- 'standard', 'discount', 'bespoke', 'trial'
  discount_percent INTEGER, -- e.g., 10 for 10% off
  discount_fixed INTEGER, -- e.g., 5000 for £50 off
  trial_end_date DATE, -- if trial, when it ends
  trial_converted BOOLEAN DEFAULT FALSE,
  reason TEXT, -- Why this pricing was given
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE, -- NULL = indefinite
  UNIQUE(organization_id, module_id, valid_from)
);
```

### 3. Discount Codes
```sql
-- Promotional and referral codes
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed', 'free_months'
  discount_value INTEGER NOT NULL, -- % or pence or months
  max_uses INTEGER, -- NULL = unlimited
  uses_count INTEGER DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  applicable_to TEXT, -- 'all', 'specific_modules', 'new_customers', 'trials'
  applicable_modules TEXT[], -- e.g., '{improvement,governance}'
  min_purchase INTEGER, -- minimum order value in pence
  referral_bonus INTEGER, -- if referral, bonus for referrer (in pence)
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Example discount codes
INSERT INTO discount_codes (code, description, discount_type, discount_value, applicable_to, valid_until) VALUES
  ('WELCOME10', 'Welcome offer - 10% off first year', 'percentage', 10, 'new_customers', '2026-12-31'),
  ('TRIAL10', 'Trial conversion - 10% off if convert within 30 days', 'percentage', 10, 'trials', '2027-12-31'),
  ('REFERRAL10', 'Refer a friend - 10% off for both', 'percentage', 10, 'all', '2027-12-31'),
  ('TRUST15', 'Multi-school trust - 15% off', 'percentage', 15, 'all', '2027-12-31'),
  ('EARLY20', 'Early adopter - 20% off first year', 'percentage', 20, 'new_customers', '2026-06-30'),
  ('NONPROFIT25', 'Non-profit discount - 25% off', 'percentage', 25, 'all', '2027-12-31');
```

### 4. Subscription Module Lines
```sql
-- Add pricing fields to existing subscriptions or create junction table
CREATE TABLE subscription_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  module_id TEXT NOT NULL,
  base_price INTEGER NOT NULL, -- Standard price at time of purchase
  actual_price INTEGER NOT NULL, -- Price after discounts
  discount_code_id UUID REFERENCES discount_codes(id),
  discount_amount INTEGER DEFAULT 0, -- How much was discounted (in pence)
  is_trial BOOLEAN DEFAULT FALSE,
  trial_end_date DATE,
  auto_convert_after_trial BOOLEAN DEFAULT FALSE, -- Auto-charge after trial
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, module_id)
);
```

### 5. Discount Usage Tracking
```sql
-- Track which discount codes were used and where
CREATE TABLE discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  subscription_id UUID REFERENCES subscriptions(id),
  discount_amount INTEGER NOT NULL, -- Amount saved (in pence)
  used_at TIMESTAMPTZ DEFAULT NOW(),
  used_by UUID REFERENCES users(id),
  referral_source_organization_id UUID REFERENCES organizations(id), -- If referral code
  INDEX(discount_code_id),
  INDEX(organization_id)
);
```

---

## Pricing Calculation Flow

### Step 1: Get Standard Pricing
```sql
-- Get current standard price for a module
SELECT standard_price
FROM module_pricing
WHERE module_id = 'improvement'
  AND effective_from <= CURRENT_DATE
  AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
ORDER BY effective_from DESC
LIMIT 1;
```

### Step 2: Check for Organization Override
```sql
-- Check if organization has custom pricing
SELECT custom_price, pricing_type, discount_percent, discount_fixed, trial_end_date
FROM organization_pricing
WHERE organization_id = $1
  AND module_id = $2
  AND valid_from <= CURRENT_DATE
  AND (valid_until IS NULL OR valid_until > CURRENT_DATE)
ORDER BY valid_from DESC
LIMIT 1;
```

### Step 3: Apply Discount Code
```sql
-- Validate and apply discount code
SELECT
  dc.discount_type,
  dc.discount_value,
  dc.max_uses,
  dc.uses_count,
  dc.applicable_to,
  dc.applicable_modules,
  dc.min_purchase
FROM discount_codes dc
WHERE dc.code = $1
  AND dc.is_active = TRUE
  AND dc.valid_from <= CURRENT_DATE
  AND (dc.valid_until IS NULL OR dc.valid_until > CURRENT_DATE)
  AND (dc.max_uses IS NULL OR dc.uses_count < dc.max_uses);
```

### Step 4: Calculate Final Price
```typescript
function calculatePrice(
  moduleId: string,
  organizationId: string,
  discountCode?: string
): { basePrice: number, finalPrice: number, discount: number, applied: string[] } {

  // 1. Get standard price
  let price = getStandardPrice(moduleId); // e.g., £500
  const applied = [`Standard price: £${price}`];

  // 2. Check for organization override
  const override = getOrganizationOverride(organizationId, moduleId);
  if (override) {
    if (override.custom_price) {
      price = override.customPrice;
      applied.push(`Bespoke price: £${price}`);
    } else if (override.discountPercent) {
      price = price * (1 - override.discountPercent / 100);
      applied.push(`Custom discount: ${override.discountPercent}% off`);
    } else if (override.trialEndDate && override.trialEndDate > new Date()) {
      applied.push(`Free trial until ${override.trialEndDate.toISOString().split('T')[0]}`);
      return { basePrice: price, finalPrice: 0, discount: price, applied };
    }
  }

  const basePrice = price;

  // 3. Apply discount code
  if (discountCode) {
    const discount = validateDiscountCode(discountCode, organizationId, moduleId);
    if (discount) {
      let discountedPrice = price;

      if (discount.discountType === 'percentage') {
        discountedPrice = price * (1 - discount.discountValue / 100);
        applied.push(`Discount code ${discountCode}: ${discount.discountValue}% off`);
      } else if (discount.discountType === 'fixed') {
        discountedPrice = Math.max(0, price - discount.discountValue);
        applied.push(`Discount code ${discountCode}: £${discount.discountValue / 100} off`);
      }

      price = discountedPrice;

      // Track usage
      trackDiscountUsage(discount.id, organizationId, price - discountedPrice);
    }
  }

  return {
    basePrice,
    finalPrice: price,
    discount: basePrice - price,
    applied
  };
}
```

---

## Example Pricing Scenarios

### Scenario 1: Standard Purchase
**Organization**: Aurora Primary
**Modules**: Improvement (£500), Governance (£500)
**Total**: £1,000

### Scenario 2: With Referral Discount
**Organization**: Grove House Primary
**Modules**: All 7 + Ed
**Base**: £4,500
**Discount**: REFERRAL10 (10% off)
**Final**: £4,050
**Savings**: £450

### Scenario 3: Trial Conversion
**Organization**: New school
**Modules**: Compliance (trial 30 days)
**Trial Price**: £0
**After Trial**: £450 (10% off with TRIAL10)

### Scenario 4: Bespoke MAT Deal
**Organization**: Large trust (10 schools)
**Modules**: All modules for all schools
**Base**: £45,000 (10 schools × £4,500)
**Custom Override**: 20% discount
**Final**: £36,000

### Scenario 5: Non-Profit Discount
**Organization**: Small faith school
**Modules**: Improvement + Governance
**Base**: £1,000
**Discount**: NONPROFIT25 (25% off)
**Final**: £750

---

## Admin API Endpoints

### View Organization Pricing
```typescript
GET /api/admin/organizations/:id/pricing
Returns: All pricing overrides, discounts, trials for this org
```

### Set Custom Pricing
```typescript
POST /api/admin/organizations/:id/pricing
Body: {
  moduleId: string,
  customPrice?: number, // in pence
  pricingType: 'standard' | 'discount' | 'bespoke' | 'trial',
  discountPercent?: number,
  trialEndDate?: string,
  reason: string
}
```

### Create Discount Code
```typescript
POST /api/admin/discounts
Body: {
  code: string,
  description: string,
  discountType: 'percentage' | 'fixed' | 'free_months',
  discountValue: number,
  maxUses?: number,
  validUntil?: string,
  applicableTo: 'all' | 'specific_modules' | 'new_customers' | 'trials',
  applicableModules?: string[]
}
```

### View Discount Performance
```typescript
GET /api/admin/discounts/analytics
Returns: Usage stats, savings calculated, conversions per code
```

---

## Frontend Components

### Pricing Calculator
```typescript
// Show pricing with discounts applied
<PricingCalculator
  modules={['improvement', 'governance']}
  discountCode="REFERRAL10"
  onChange={(pricing) => setTotalPrice(pricing.finalPrice)}
/>
```

### Discount Code Input
```typescript
<DiscountCodeInput
  onApply={(code) => validateAndApplyDiscount(code)}
  error={discountError}
  appliedDiscount={appliedDiscount}
/>
```

### Trial Banner
```typescript
<TrialBanner
  moduleName="Compliance"
  trialEndDate="2026-04-25"
  daysRemaining={5}
  onConvert={() => handleTrialConversion()}
/>
```

---

## Reports & Analytics

### Pricing Dashboard
- **MRR**: Monthly Recurring Revenue
- **ARR**: Annual Recurring Revenue
- **Discount Usage**: Which codes used most
- **Trial Conversions**: % of trials that convert
- **Bespoke Deals**: Organizations with custom pricing
- **Churn by Pricing**: Do discounted customers churn more?

### Key Metrics
- **Standard vs Discounted Revenue**: Breakdown of full-price vs discounted
- **Trial Conversion Rate**: % of trials converting to paid
- **Referral Performance**: How many REFERRAL10 uses
- **Average Deal Size**: Mean revenue per organization
- **Price Sensitivity**: Which modules most price-sensitive

---

## Next Steps

1. ✅ Create database migration with pricing tables
2. ✅ Seed standard pricing (£500/module, £1,000/Ed)
3. ✅ Create initial discount codes (WELCOME10, TRIAL10, REFERRAL10, etc.)
4. ⏳ Build pricing calculator component
5. ⏳ Build discount code validation API
6. ⏳ Build admin pricing management UI
7. ⏳ Create pricing analytics dashboard

---

## Migration File to Create

`20260325_pricing_system.sql` will include:
- `module_pricing` table
- `organization_pricing` table
- `discount_codes` table
- `subscription_modules` table
- `discount_usage` table
- Seed data for standard pricing
- Seed data for initial discount codes
