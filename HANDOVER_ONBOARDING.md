# Onboarding Pipeline - Session Handover

**Date**: 2026-03-24
**Status**: Ready for local testing

---

## What Was Built

Complete onboarding pipeline from interest → quote → contract → payment → activation.

### Flow Diagram
```
Interest Form → Admin Queue → Fetch DfE Data → Generate Quote → Send Contract → Generate Invoice → Payment → Activation
     ↓                ↓              ↓              ↓              ↓              ↓              ↓
  Public link    /admin/onboarding  URN lookup   QT-XXXXX     DocuSign     INV-XXXXX    Stripe
```

---

## Database Schema

Run this migration in Supabase:
`apps/platform/supabase/migrations/20260324_onboarding_full_flow.sql`

### Key Tables
| Table | Purpose |
|-------|---------|
| `onboarding_leads` | 30+ fields: school details, contacts, billing, contract, payment tracking |
| `quotes` | Auto-numbered (QT-YYYY-MM-XXXXX), plan pricing, discount codes |
| `invoices` | Auto-numbered (INV-YYYY-MM-XXXXX), 30-day terms, line items |
| `discount_codes` | Optional: percentage or fixed amount discounts |

---

## API Endpoints Created

### Admin Endpoints (Protected)
| Endpoint | Purpose |
|----------|---------|
| `POST /api/admin/onboarding/[id]/fetch-dfe` | Fetch DfE data by URN |
| `POST /api/admin/onboarding/[id]/quote` | Generate quote |
| `POST /api/admin/onboarding/[id]/contract` | Send DocuSign contract |
| `POST /api/admin/onboarding/[id]/invoice` | Generate invoice from quote |

### Public Endpoints (Token-based)
| Endpoint | Purpose |
|----------|---------|
| `GET /api/onboarding/load?token=xxx` | Load lead data for form |
| `POST /api/onboarding/details/complete?token=xxx` | Save completed form |

---

## Pages Created

| Path | Purpose | Access |
|------|---------|--------|
| `/admin/onboarding` | Admin queue, lead details, all actions | Super admin only |
| `/onboarding/complete?token=xxx` | 4-step public form for schools | Token-based |

---

## Local Testing URL

**Dev server is running on**: http://localhost:3000

**Test the flow**:
1. Go to http://localhost:3000/admin/onboarding
2. Log in as super admin (check `super_admins` table)
3. Create or view a lead
4. Test actions: Fetch DfE, Generate Quote, Send Contract, Generate Invoice

---

## Pending Work

### High Priority
1. **DfE Database Connection** - Currently returns mock data
   - File: `apps/platform/src/app/api/admin/onboarding/[id]/fetch-dfe/route.ts`
   - Need: Connection to DfE Supabase project (`DFE_SUPABASE_URL`)

2. **DocuSign Integration** - Currently mock envelope ID
   - File: `apps/platform/src/app/api/admin/onboarding/[id]/contract/route.ts`
   - Need: Real DocuSign API integration

3. **Email Notifications** - Completion email not implemented
   - File: `apps/platform/src/app/(dashboard)/admin/onboarding/[id]/page.tsx`
   - Function: `sendCompletionEmail()` needs Resend integration

### Medium Priority
4. **Interest Form** - Public "I'm interested" form to create leads
5. **Payment Flow** - Stripe checkout for invoice payment
6. **Subscription Activation** - Final step after payment

---

## Important Notes

- **Do NOT push to git/vercel/live** - This is local work only
- **URN vs DfE Number**: URN changes when schools convert to academies, but DfE number (la_code/establishment_number) persists
- **Pricing**: Core £1499, Professional £2499, Enterprise £3999
- **Discount Codes**: Create in `discount_codes` table with `percentage` or `fixed_amount`

---

## Super Admin Access

Check if your email is in `super_admins` table:
```sql
SELECT * FROM super_admins WHERE user_id = 'your-email@example.com';
```

If not, add:
```sql
INSERT INTO super_admins (user_id, added_by) VALUES ('your-email@example.com', 'system');
```

---

## Quick Test Checklist

- [ ] Dev server running (http://localhost:3000)
- [ ] Can access /admin/onboarding
- [ ] Can create new lead
- [ ] Fetch DfE data returns something (mock for now)
- [ ] Generate quote creates QT- number
- [ ] Generate invoice creates INV- number
- [ ] Completion form works (/onboarding/complete?token=xxx)

---

## Files to Reference

| File | Purpose |
|------|---------|
| `20260324_onboarding_full_flow.sql` | Full schema |
| `admin/onboarding/[id]/page.tsx` | Main admin UI |
| `api/admin/onboarding/[id]/fetch-dfe/route.ts` | DfE lookup |
| `api/admin/onboarding/[id]/quote/route.ts` | Quote generation |
| `api/admin/onboarding/[id]/invoice/route.ts` | Invoice generation |
| `onboarding/complete/page.tsx` | Public completion form |

---

## Next Session Priorities

1. Test the full flow in the browser
2. Connect real DfE database
3. Implement completion email (Resend)
4. Build interest form entry point
5. Payment/activation flow

---

**Generated**: 2026-03-24
**Session context**: Compacted twice, refer to this document for continuity
