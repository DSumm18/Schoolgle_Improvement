# Environment Variables Setup

## Required for Core Functionality

```bash
# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL (for redirects and webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://schoolgle.co.uk  # Production
```

## Payment Providers (Set up later)

### Stripe (Card Payments)

```bash
# Stripe API Keys (get from: https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...  # Test mode: sk_test_..., Live: sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Test mode: pk_test_..., Live: pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Public key for frontend

# Stripe Webhook Secret (get from: https://dashboard.stripe.com/webhooks)
# Add webhook endpoint: https://your-domain.com/api/subscription/webhook
# Events to listen for:
#   - checkout.session.completed
#   - invoice.paid
#   - invoice.payment_failed
#   - customer.subscription.deleted
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Configuration
STRIPE_CURRENCY=GBP
STRIPE_COUNTRY=GB
```

### GoCardless (Direct Debit)

```bash
# GoCardless API Keys (get from: https://manage.gocardless.com/developers/api-keys)
# You'll need a GoCardless account and connect your business bank account first
GOCARDLESS_ACCESS_TOKEN=your-access-token
GOCARDLESS_ENVIRONMENT=sandbox  # 'sandbox' for testing, 'live' for production

# GoCardless Webhook Secret (set up webhook in GoCardless dashboard)
# Webhook URL: https://your-domain.com/api/subscription/gocardless/webhook
GOCARDLESS_WEBHOOK_SECRET=your-webhook-secret

# GoCardless Configuration
GOCARDLESS_CURRENCY=GBP
GOCARDLESS_COUNTRY_CODE=GB
```

## Development Mode (No Payment Providers)

For development without Stripe/GoCardless, set:

```bash
# Disable payment providers (allows invoice-only mode)
PAYMENT_PROVIDERS_ENABLED=false
# Or enable only specific ones:
# STRIPE_ENABLED=false
# GOCARDLESS_ENABLED=false
```

## Email Configuration (For Invoices)

```bash
# Email service for sending invoices (e.g., Resend, SendGrid, AWS SES)
EMAIL_PROVIDER=resend  # or 'sendgrid', 'ses', 'smtp'
RESEND_API_KEY=re_...  # If using Resend
RESEND_FROM_EMAIL=noreply@schoolgle.co.uk

# Or SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@schoolgle.co.uk
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@schoolgle.co.uk
```

## Full Example (.env.local)

```bash
# ============================================
# CORE CONFIGURATION
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# PAYMENT PROVIDERS (Set up later)
# ============================================

# Stripe - Card Payments
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ENABLED=false  # Set to true when Stripe is configured

# GoCardless - Direct Debit
# GOCARDLESS_ACCESS_TOKEN=your-access-token
# GOCARDLESS_ENVIRONMENT=sandbox
# GOCARDLESS_WEBHOOK_SECRET=your-webhook-secret
GOCARDLESS_ENABLED=false  # Set to true when GoCardless is configured

# ============================================
# EMAIL (For Invoice Delivery)
# ============================================
# EMAIL_PROVIDER=resend
# RESEND_API_KEY=re_...
# RESEND_FROM_EMAIL=noreply@schoolgle.co.uk
EMAIL_ENABLED=false  # Set to true when email is configured

# ============================================
# FEATURE FLAGS
# ============================================
NEXT_PUBLIC_ENABLE_ED_WIDGET=true
```

