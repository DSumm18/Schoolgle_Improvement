# Pricing Admin Guide — Quick Reference

## How to Set Up Pricing for a School

### Scenario 1: Standard Purchase (No Discount)
**School**: Aurora Primary
**Wants**: Improvement + Governance modules
**Action**: Just let them purchase through the app — standard pricing applies automatically
**Price**: £1,000/year (£500 + £500)

---

### Scenario 2: Apply Welcome Discount
**School**: New school signing up
**Wants**: All modules
**Action**: Give them code `WELCOME10` or `EARLY20`
**Price**: £4,050 or £3,600 (instead of £4,500)

**How**:
```sql
-- No SQL needed — just give them the code
-- They enter it at checkout, discount applied automatically
```

---

### Scenario 3: Set Up Free Trial
**School**: Wants to try Compliance module
**Action**: Set up trial in database

**SQL**:
```sql
INSERT INTO organization_pricing (
  organization_id,
  module_id,
  pricing_type,
  trial_end_date,
  reason,
  created_by
) VALUES (
  'org-uuid-here',
  'compliance',
  'trial',
  CURRENT_DATE + INTERVAL '30 days',
  '30-day trial of Compliance module',
  'admin-user-id'
);
```

**What happens**:
- School gets free access for 30 days
- System shows "Trial — expires [date]"
- Before trial ends: send TRIAL10 code
- If they convert: Apply 10% discount

---

### Scenario 4: Bespoke Pricing for Large Trust
**School**: MAT with 15 schools wants complete platform
**Action**: Set custom pricing override

**SQL**:
```sql
INSERT INTO organization_pricing (
  organization_id,
  module_id,
  pricing_type,
  discount_percent,
  reason,
  created_by,
  valid_from
) VALUES (
  'trust-org-uuid',
  'teaching-learning', -- Apply to all 7 modules + ed-chatbot
  'bespoke',
  25, -- 25% off
  'Large MAT bespoke deal — 15 schools',
  'admin-user-id',
  CURRENT_DATE
);
```

**Price**: £4,500 → £3,375/year (25% off)

---

### Scenario 5: Give Referral Discount
**School A**: Existing customer, refers School B
**Action**: Both schools get 10% off

**For School B (new customer)**:
```sql
-- Just give them REFERRAL10 code
-- They enter at checkout
```

**For School A (referrer)**:
```sql
-- Give them credit or discount on next renewal
INSERT INTO organization_pricing (
  organization_id,
  module_id,
  pricing_type,
  discount_fixed,
  reason,
  created_by
) VALUES (
  'school-a-org-id',
  'all', -- Apply to all their modules
  'discount',
  10000, -- £100 credit (in pence)
  'Referral bonus for referring School B',
  'admin-user-id'
);
```

---

## Creating New Discount Codes

### Example: Summer Promotion
**Offer**: 15% off all modules during summer
**Valid**: June-August 2026
**Limit**: First 100 schools

**SQL**:
```sql
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  max_uses,
  valid_from,
  valid_until,
  applicable_to
) VALUES (
  'SUMMER15',
  'Summer promotion — 15% off',
  'percentage',
  15,
  100,
  '2026-06-01',
  '2026-08-31',
  'all'
);
```

---

### Example: Targeted Module Promotion
**Offer**: 20% off Intelligence module
**Target**: Schools that don't have Intelligence yet
**Valid**: Until end of year

**SQL**:
```sql
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  valid_until,
  applicable_to,
  applicable_modules
) VALUES (
  'TRY-INTELLIGENCE',
  'Try Intelligence module — 20% off',
  'percentage',
  20,
  '2026-12-31',
  'specific_modules',
  ARRAY['intelligence']
);
```

---

## Viewing Pricing for a School

### Check what they're paying
**SQL**:
```sql
-- Get their subscription with pricing breakdown
SELECT
  o.name AS school,
  sm.module_id,
  sm.base_price,
  sm.actual_price,
  sm.discount_amount,
  sm.is_trial,
  sm.trial_end_date,
  dc.code AS discount_code_used
FROM subscriptions s
JOIN organizations o ON o.id = s.organization_id
LEFT JOIN subscription_modules sm ON sm.subscription_id = s.id
LEFT JOIN discount_codes dc ON dc.id = sm.discount_code_id
WHERE o.id = 'org-uuid-here'
ORDER BY sm.module_id;
```

---

### Check for custom pricing overrides
**SQL**:
```sql
SELECT
  module_id,
  pricing_type,
  custom_price,
  discount_percent,
  discount_fixed,
  trial_end_date,
  valid_from,
  valid_until,
  reason
FROM organization_pricing
WHERE organization_id = 'org-uuid-here'
  AND (valid_until IS NULL OR valid_until > CURRENT_DATE)
ORDER BY valid_from DESC;
```

---

## Tracking Discount Usage

### See which codes are used most
**SQL**:
```sql
SELECT
  dc.code,
  dc.description,
  COUNT(du.id) AS total_uses,
  SUM(du.discount_amount) / 100.0 AS total_savings_gbp,
  COUNT(DISTINCT du.organization_id) AS unique_orgs
FROM discount_usage du
JOIN discount_codes dc ON dc.id = du.discount_code_id
GROUP BY dc.code, dc.description
ORDER BY total_uses DESC;
```

---

### See trial conversions
**SQL**:
```sql
SELECT
  o.name AS school,
  op.module_id,
  op.trial_end_date,
  op.trial_converted,
  sm.actual_price,
  sm.converted_at
FROM organization_pricing op
JOIN organizations o ON o.id = op.organization_id
LEFT JOIN subscription_modules sm ON sm.module_id = op.module_id
WHERE op.pricing_type = 'trial'
  AND op.trial_end_date > CURRENT_DATE - INTERVAL '6 months'
ORDER BY op.trial_end_date DESC;
```

---

## Common Pricing Tasks

### Update Standard Price for All Schools
**Scenario**: Inflation price increase from £500 to £550

**SQL**:
```sql
INSERT INTO module_pricing (module_id, module_name, standard_price, effective_from)
SELECT
  module_id,
  module_name,
  55000, -- £550
  '2026-09-01' -- New price starts September 1st
FROM module_pricing
WHERE effective_to IS NULL; -- Only currently active prices
```

**Result**: All existing subscriptions stay at old price until renewal. New signups get new price.

---

### End a Trial (Convert to Paid)
**Scenario**: School trialed Compliance, now wants to buy

**SQL**:
```sql
-- 1. Update the trial record
UPDATE organization_pricing
SET trial_converted = TRUE,
  pricing_type = 'standard' -- Remove trial status
WHERE organization_id = 'org-uuid'
  AND module_id = 'compliance'
  AND pricing_type = 'trial';

-- 2. Create subscription_modules record with TRIAL10 discount
INSERT INTO subscription_modules (
  subscription_id,
  module_id,
  base_price,
  actual_price,
  discount_code_id,
  discount_amount,
  is_trial
)
SELECT
  (SELECT id FROM subscriptions WHERE organization_id = 'org-uuid'),
  'compliance',
  50000, -- Base price £500
  50000 * 0.9, -- 10% off
  (SELECT id FROM discount_codes WHERE code = 'TRIAL10'),
  50000 * 0.1, -- £50 discount
  FALSE
;
```

---

### Revoke Access (Non-payment)
**Scenario**: School cancelled, revoke access

**SQL**:
```sql
-- Option 1: Cancel subscription
UPDATE subscriptions
SET status = 'cancelled',
  cancelled_at = NOW()
WHERE organization_id = 'org-uuid';

-- Option 2: End pricing override
UPDATE organization_pricing
SET valid_until = CURRENT_DATE
WHERE organization_id = 'org-uuid'
  AND (valid_until IS NULL OR valid_until > CURRENT_DATE);
```

---

## Pricing Analytics Queries

### Monthly Recurring Revenue (MRR)
```sql
SELECT
  SUM(actual_price) / 12.0 AS mrr_gbp
FROM subscription_modules sm
JOIN subscriptions s ON s.id = sm.subscription_id
WHERE s.status = 'active'
  AND (sm.is_trial = FALSE OR sm.trial_end_date > CURRENT_DATE);
```

### Annual Recurring Revenue (ARR)
```sql
SELECT
  SUM(actual_price) / 100.0 AS arr_gbp
FROM subscription_modules sm
JOIN subscriptions s ON s.id = sm.subscription_id
WHERE s.status = 'active'
  AND sm.is_trial = FALSE;
```

### Revenue by Module
```sql
SELECT
  module_id,
  COUNT(*) AS subscribers,
  SUM(actual_price) / 100.0 AS annual_revenue_gbp
FROM subscription_modules sm
JOIN subscriptions s ON s.id = sm.subscription_id
WHERE s.status = 'active'
  AND sm.is_trial = FALSE
GROUP BY module_id
ORDER BY annual_revenue_gbp DESC;
```

### Discount Usage This Month
```sql
SELECT
  dc.code,
  COUNT(*) AS uses_this_month,
  SUM(sm.discount_amount) / 100.0 AS savings_this_month_gbp
FROM subscription_modules sm
JOIN discount_codes dc ON dc.id = sm.discount_code_id
WHERE sm.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY dc.code
ORDER BY uses_this_month DESC;
```

---

## Quick Command Reference

| Task | Command | Notes |
|------|---------|-------|
| **Give discount code** | Just send code to school | No SQL needed |
| **Set up trial** | INSERT to organization_pricing | 30-day free access |
| **Custom pricing** | INSERT to organization_pricing | Bespoke deal |
| **Create discount code** | INSERT to discount_codes | New promotion |
| **View school pricing** | SELECT from subscription_modules | See what they pay |
| **Track discount usage** | SELECT from discount_usage | Analytics |
| **Update standard price** | INSERT to module_pricing | Price increase |
| **End trial** | UPDATE organization_pricing | Convert to paid |
| **Cancel subscription** | UPDATE subscriptions | Revoke access |

---

## Troubleshooting

### "Discount code not working"
**Check**:
1. Is code active? `SELECT * FROM discount_codes WHERE code = 'XXX'`
2. Has it expired? Check `valid_until`
3. Has it reached max uses? Check `uses_count >= max_uses`
4. Is it applicable to this org/module? Check `applicable_to`

### "School still has trial access"
**Check**:
1. `SELECT * FROM organization_pricing WHERE pricing_type = 'trial'`
2. Look at `trial_end_date` — has it passed?
3. If passed but still access: Check if subscription was created

### "Wrong price showing"
**Check**:
1. Is there an `organization_pricing` override? (Custom pricing takes precedence)
2. Is `discount_code` applied correctly?
3. Check `subscription_modules.actual_price` — what are they actually paying?

---

## Summary

**Standard Price**: £500/module, £1,000/Ed
**Most Common Discounts**: WELCOME10 (10%), REFERRAL10 (10%)
**Trial Flow**: 30 days free → TRIAL10/TRIAL15 (10-15% off)
**Flexibility**: Custom pricing for special cases
**Tracking**: All discounts tracked in `discount_usage`

**All pricing flows through these tables**:
- `module_pricing` — Standard prices
- `organization_pricing` — Custom deals/trials
- `discount_codes` — Promotional codes
- `subscription_modules` — What each org pays per module
- `discount_usage` — Track discount effectiveness
