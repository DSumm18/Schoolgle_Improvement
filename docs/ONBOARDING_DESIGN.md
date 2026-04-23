# Schoolgle Self-Service Onboarding Design

**Date:** 23 March 2026
**Goal:** Friction-free school signup that automates 90% of setup

---

## The Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC WEBSITE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. "Interested in Schoolgle?" CTA → signup page                           │
│                                                                             │
│  2. School enters URN (107242 for Grove House)                            │
│     → Auto-lookup from DfE database                                       │
│     → Pre-fill: name, address, LA, phase, type, website                     │
│                                                                             │
│  3. School confirms details + selects interested modules                    │
│     → Ofsted Readiness ☑                                                   │
│     → Estates Compliance ☑                                                │
│     → HR & People ☐                                                         │
│     → Governance ☐                                                         │
│     → Actions Hub ☑                                                         │
│     → School Intelligence ☐                                                │
│     → Ed AI Chat ☐                                                          │
│                                                                             │
│  4. Enter contact info (name, email, phone)                               │
│                                                                             │
│  5. Submit → Creates LEAD in system                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTOMATED BACKEND                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  6. Lead created in onboarding_leads table                              │
│                                                                             │
│  7. Background jobs trigger:                                               │
│     → Website scanner fetches school website, scans for Ofsted keywords    │
│     → Ofsted readiness check runs (if they selected it)                   │
│     → DfE data enrichment (pupils on roll, KS2 results, etc.)            │
│                                                                             │
│  8. Email sent to school: "Thanks for your interest!"                   │
│     + Email sent to admin@schoolgle.co.uk: "New lead from Grove House"    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN DASHBOARD                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  9. New lead appears in "Onboarding Pipeline" view:                     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Grove House Primary School • URN 107242 • East Sussex                 │  │
│  │                                                                          │  │
│  │ Status: NEW LEAD • Submitted: 2 hours ago                           │  │
│  │                                                                          │  │
│  │ Interested: Ofsted Readiness, Estates, Actions Hub                    │  │
│  │ Website: grovehouse-sussex.sch.uk • Scanned: ✓                         │  │
│  │ Ofsted Rating: Good • Last Inspection: 2022                          │  │
│  │ Pupils: 210 • KS2: Expected+ 72%                                    │  │
│  │                                                                          │  │
│  │ Contact: Sarah Jenkins (head@grovehouse-sussex.sch.uk)              │  │
│  │                                                                          │  │
│  │ [Start Trial]  [Send Quote]  [Email]  [Dismiss]                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Quick Actions:                                                            │
│  • "Start Trial" → Creates organization, enables selected modules,        │
│  •                   sends welcome email with login details                │
│  • "Send Quote" → Generates quote PDF, emails to school                  │
│  • "Convert to Customer" → Move to paid subscription                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Additions

### New Table: `onboarding_leads`

```sql
CREATE TABLE onboarding_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- School details (from DfE lookup or manual entry)
    urn TEXT UNIQUE,  -- DfE URN
    name TEXT NOT NULL,
    la_name TEXT,
    la_code TEXT,
    phase TEXT,  -- Primary, Secondary, All-through
    school_type TEXT,
    address TEXT,
    postcode TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,

    -- Submission details
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    contact_role TEXT,  -- Headteacher, Business Manager, etc.

    -- Product interest
    interested_modules TEXT[] DEFAULT '{}',
    -- ['ofsted-readiness', 'estates-compliance', 'hr-people', ...]

    plan_interest TEXT,  -- 'core', 'professional', 'enterprise', 'not_sure'
    budget_text TEXT,  -- Free text budget indication
    timeline TEXT,  -- 'immediate', 'this_term', 'next_term', 'next_year'

    -- Automated enrichment
    dfe_data_fetched BOOLEAN DEFAULT false,
    dfe_data JSONB DEFAULT '{}',  -- Pupils, KS2 results, etc.
    website_scanned BOOLEAN DEFAULT false,
    website_scan_results JSONB DEFAULT '{}',
    ofsted_rating TEXT,
    ofsted_last_inspection DATE,

    -- Pipeline status
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'trial_started', 'trial_active',
        'quote_sent', 'negotiating', 'converted', 'not_interested', 'unresponsive'
    )),

    -- Trial details (if started)
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    trial_organization_id UUID REFERENCES organizations(id),

    -- Conversion details
    converted_to_subscription_id UUID REFERENCES subscriptions(id),
    converted_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Page Structure

### Public Pages (no auth required)

```
/interest
  └── page.tsx          -- Main signup form

/api/interest
  └── route.ts           -- POST: Create lead, trigger enrichment jobs
```

### Admin Pages (super admin only)

```
/admin/onboarding
  └── page.tsx          -- Pipeline view of all leads

/api/admin/onboarding
  ├── route.ts           -- GET: List all leads
  ├── [id]/route.ts      -- GET/PATCH: Lead details, update status
  └── [id]/start-trial/route.ts  -- POST: Convert lead to trial org
```

---

## Module Catalog Structure

The user mentioned modules need organizing. Current modules from the customer page:

| Category | Modules |
|----------|---------|
| Compliance | Ofsted Readiness, Safeguarding |
| Operations | Estates Compliance, HR & People, Attendance, Behaviour, Cover, Admissions, School Meals |
| Leadership | Governance |
| Improvement | Actions Hub |
| Data | School Intelligence, Canvas Data |
| Engagement | Communications, Calendar, Surveys |
| AI | Ed AI Chat, Ed Voice, Ed Website Chat, Form Helper |

---

## Priority Build Order

### Phase 1: Lead Capture (MVP - 1 day)
1. `onboarding_leads` table migration
2. Public `/interest` page with URN lookup
3. `POST /api/interest` endpoint
4. Super admin `/admin/onboarding` list view

### Phase 2: Enrichment (2 days)
5. DfE data fetch on lead creation (pupils, results, etc.)
6. Website scanner integration
7. Ofsted rating lookup

### Phase 3: Trial Activation (1 day)
8. "Start Trial" button → creates organization
9. Welcome email with login link
10. Enable selected modules

### Phase 4: Pipeline Management (1 day)
11. Lead status transitions
12. Notes/timeline per lead
13. Email templates

---

## Quick Start: MVP Implementation

**Minimum for Grove House to sign up today:**

1. Migration: `onboarding_leads` table
2. Page: `/app/interest/page.tsx` (public, no auth)
3. API: `/app/api/interest/route.ts` (create lead)
4. Admin: `/app/api/admin/onboarding/route.ts` (list leads)

**Flow:**
- Grove House visits schoolgle.co.uk
- Clicks "Get Started" → enters URN 107242
- DfE lookup auto-fills school details
- Selects modules, enters contact info
- Submits → appears in your admin dashboard
- You click "Start Trial" → they get email with login

---

## Questions for You

1. **URM for Grove House** - Confirm it's 107242?
2. **Trial length** - 14 days? 30 days?
3. **Trial limitations** - User limit? Module limits?
4. **Public signup page design** - Keep it minimal or make it marketing-heavy?
5. **Should I build the MVP now** or do you want to review the design first?
