# Testing the Subscription System

## 1. Test Super Admin Dashboard

1. Add yourself as super admin (see `20241215_add_super_admin.sql`)
2. Navigate to `/admin/super`
3. Search for a school by name or URN
4. Verify you can see subscription details, extend trials, etc.

## 2. Test Trial Start Flow

1. Log in as a regular user (not super admin)
2. Navigate to `/dashboard/account/trial`
3. Click "Start Free Trial"
4. Verify:
   - Trial is created in database
   - Status shows "trialing"
   - Days remaining = 7
   - Ed widget is accessible

## 3. Test Account Portal

1. Navigate to `/dashboard/account`
2. Verify:
   - Current plan displays correctly
   - Days remaining shows
   - Features list is visible
   - "Upgrade" button works

## 4. Test Upgrade Flow

1. Navigate to `/dashboard/account/upgrade`
2. Select a plan
3. Choose payment method (card or invoice)
4. For card: Should redirect to Stripe (test mode)
5. For invoice: Should create invoice record

## 5. Test Subscription Check API

```bash
# Check subscription status
curl http://localhost:3000/api/subscription/check?userId=YOUR_USER_ID

# Should return:
# {
#   "hasAccess": true,
#   "status": "trialing",
#   "subscriptions": [...],
#   "activeProducts": ["ed_pro"]
# }
```

## 6. Test Browser Extension Auth

1. Build extension: `cd packages/ed-extension && npm run build`
2. Load unpacked extension in Chrome
3. Extension should check auth on startup
4. If logged in, Ed should be accessible
5. If not logged in, should prompt to log in

## 7. Test Stripe Webhook (when ready)

1. Set up Stripe webhook endpoint: `https://your-domain.com/api/subscription/webhook`
2. Test events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
3. Verify subscription status updates in database

## Common Issues

- **"No subscription found"**: Check `organization_members` table - user must be linked to an organization
- **"Super admin not found"**: Run the super admin SQL script
- **Stripe errors**: Check API keys are set correctly
- **Extension auth fails**: Verify `/api/auth/verify` route works

