# Payment Provider Setup (To Do Later)

## Current Status

✅ **Working Now:**
- Invoice/Bank Transfer payments (no external provider needed)
- Subscription management
- Trial system
- Account portal
- Super admin dashboard

⏳ **Pending Setup:**
- Stripe (card payments)
- GoCardless (direct debit)
- Email delivery (for invoices)

## Development Mode

The system is designed to work **without payment providers** for now:

- Users can request invoices (creates invoice record in database)
- Super admins can manually mark invoices as paid
- Subscription status can be updated manually
- All core functionality works

## When Ready: Stripe Setup

### 1. Create Stripe Account
1. Go to https://stripe.com
2. Sign up for business account
3. Connect your business bank account
4. Complete business verification

### 2. Get API Keys
1. Dashboard > Developers > API keys
2. Copy:
   - **Secret key** → `STRIPE_SECRET_KEY`
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 3. Set Up Webhook
1. Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/subscription/webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copy webhook secret → `STRIPE_WEBHOOK_SECRET`

### 4. Update Environment
```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ENABLED=true
```

## When Ready: GoCardless Setup

### 1. Create GoCardless Account
1. Go to https://gocardless.com
2. Sign up for business account
3. Connect your business bank account
4. Complete business verification

### 2. Get API Credentials
1. Dashboard > Developers > API access
2. Create API key
3. Copy access token → `GOCARDLESS_ACCESS_TOKEN`
4. Set environment → `GOCARDLESS_ENVIRONMENT` ('sandbox' or 'live')

### 3. Set Up Webhook
1. Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/subscription/gocardless/webhook`
3. Select events:
   - `mandates.created`
   - `payments.confirmed`
   - `payments.failed`
   - `subscriptions.cancelled`
4. Copy webhook secret → `GOCARDLESS_WEBHOOK_SECRET`

### 4. Update Environment
```bash
GOCARDLESS_ACCESS_TOKEN=your-access-token
GOCARDLESS_ENVIRONMENT=live
GOCARDLESS_WEBHOOK_SECRET=your-webhook-secret
GOCARDLESS_ENABLED=true
```

## Implementation Checklist

### Stripe Integration
- [x] Checkout route (`/api/subscription/checkout`)
- [x] Webhook handler (`/api/subscription/webhook`)
- [ ] Test checkout flow end-to-end
- [ ] Test webhook events
- [ ] Handle payment failures gracefully
- [ ] Add retry logic for failed payments

### GoCardless Integration
- [x] Placeholder mandate route (`/api/subscription/gocardless/mandate`)
- [x] Placeholder webhook route (`/api/subscription/gocardless/webhook`)
- [ ] Implement redirect flow
- [ ] Create mandate creation
- [ ] Handle payment confirmations
- [ ] Handle payment failures
- [ ] Add retry logic

### Email Integration
- [ ] Set up email provider (Resend/SendGrid)
- [ ] Create invoice email template
- [ ] Send invoice on creation
- [ ] Send payment reminders
- [ ] Send payment confirmations

## Testing Without Payment Providers

### Manual Invoice Flow
1. User requests invoice via `/dashboard/account/upgrade`
2. Invoice created in database with status 'sent'
3. Super admin views invoice in `/admin/super`
4. Super admin manually marks as paid (SQL or UI)
5. Subscription status updates to 'active'

### SQL Commands for Testing

```sql
-- Mark invoice as paid
UPDATE invoices 
SET status = 'paid', paid_date = NOW() 
WHERE invoice_number = 'INV-2024-00123';

-- Activate subscription
UPDATE subscriptions 
SET status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 year'
WHERE organization_id = 'your-org-id';
```

## Notes

- All payment provider routes return helpful errors if not configured
- Invoice-only mode works completely offline
- You can develop and test everything except actual card/DD payments
- When ready, just add the API keys and enable the providers

