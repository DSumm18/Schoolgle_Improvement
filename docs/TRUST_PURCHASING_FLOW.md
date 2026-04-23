# Trust-Level Purchasing Flow with Cascading to Schools

**Date:** 23 March 2026
**Goal:** Enable Multi-Academy Trusts (MATs) to purchase Schoolgle once and cascade to all schools, while allowing individual schools to purchase additional modules locally.

---

## Executive Summary

Multi-Academy Trusts want centralized purchasing with local flexibility. This design enables:

1. **Trust-level organization** - A parent organization representing the MAT
2. **Cascading subscriptions** - Modules enabled at trust level flow to all schools
3. **Local add-ons** - Individual schools can purchase additional modules
4. **Unified billing** - Single invoice to trust with breakdown by school
5. **Role-based access** - Trust admins see all schools; school admins see only theirs

---

## 1. Trust Signup Flow

### 1.1 Public Trust Signup Page

```
/signup/trust
```

**Form Fields:**

| Field | Type | Source | Required |
|-------|------|--------|----------|
| Trust Name | Text | Manual input | Yes |
| Companies House Number | Text | Manual input / lookup | Yes |
| Trust Email Domain | Text | Manual input | Yes |
| Primary Contact | Name, Email, Phone | Manual input | Yes |
| Number of Schools | Number | Manual input | Yes |
| Interested Modules | Multi-select | Module catalog | No |

**Trust Discovery (GBIS Integration):**

```typescript
// API: GET /api/trust/lookup?companiesHouseNumber=12345678
// Returns trust details from Get Information about Schools
interface TrustLookup {
  trustName: string;
  companiesHouseNumber: string;
  trustType: "single_academy_trust" | "multi_academy_trust";
  region: string;
  establishedDate: string;
  schools: TrustSchool[];
}

interface TrustSchool {
  urn: string;
  name: string;
  laEstabCode: string;
  phase: "primary" | "secondary" | "all-through" | "special";
  address: string;
  postcode: string;
}
```

**Flow:**

```
1. Trust enters Companies House number
2. GBIS lookup returns trust details + list of schools
3. Trust confirms which schools to include (can add/remove)
4. Trust selects base plan + trust-level modules
5. Contact info collected
6. Creates trust organization + child school organizations
7. Lead created in onboarding_trust_leads table
```

### 1.2 Trust vs School Organization Types

**Database Extension to `organizations` table:**

```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS organization_type
  TEXT CHECK (organization_type IN ('school', 'trust', 'la', 'other'));

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_organization_id
  UUID REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS companies_house_number
  TEXT UNIQUE;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gbis_data
  JSONB DEFAULT '{}';

-- Index for trust queries
CREATE INDEX idx_organizations_type ON organizations(organization_type);
CREATE INDEX idx_organizations_parent ON organizations(parent_organization_id);
CREATE INDEX idx_organizations_companies_house ON organizations(companies_house_number);
```

**Organization Hierarchy:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRUST ORGANIZATION                               │
│  Type: 'trust'                                                             │
│  parent_organization_id: NULL                                              │
│  companies_house_number: 12345678                                          │
│                                                                             │
│  Subscription: Trust-wide plan (Professional/Enterprise)                    │
│  Modules: Trust-level enabled modules cascade to all schools               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   SCHOOL 1       │  │   SCHOOL 2       │  │   SCHOOL 3       │         │
│  │   Type: 'school' │  │   Type: 'school' │  │   Type: 'school' │         │
│  │   Parent: Trust  │  │   Parent: Trust  │  │   Parent: Trust  │         │
│  │   URN: 107242    │  │   URN: 107243    │  │   URN: 107244    │         │
│  │                  │  │                  │  │                  │         │
│  │  Inherited:      │  │  Inherited:      │  │  Inherited:      │         │
│  │  - Ofsted Ready  │  │  - Ofsted Ready  │  │  - Ofsted Ready  │         │
│  │  - Actions Hub   │  │  - Actions Hub   │  │  - Actions Hub   │         │
│  │                  │  │                  │  │                  │         │
│  │  Local Add-on:   │  │  Local Add-on:   │  │  Local Add-on:   │         │
│  │  - Ed Voice      │  │  (none)          │  │  - Canvas Data   │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pricing Models

### 2.1 Trust-Wide Pricing Options

**Option A: Per-School Pricing (Default)**

| Plan | Price/School/Year | Min Schools | Discount Tier |
|------|-------------------|-------------|---------------|
| Core Trust | £799 | 3+ schools | 20% off individual |
| Professional Trust | £1,599 | 3+ schools | 20% off individual |
| Enterprise Trust | £2,799 | 5+ schools | 20% off individual |

**Volume Discounts:**

| Schools | Discount |
|---------|----------|
| 1-2 | 0% (standard school pricing) |
| 3-5 | 20% |
| 6-10 | 30% |
| 11-20 | 40% |
| 21+ | Custom quote |

**Option B: Flat Fee (Large Trusts)**

| Trust Size | Annual Fee | Includes |
|------------|------------|----------|
| Small (3-5 schools) | £7,999 | Core plan for all schools |
| Medium (6-10 schools) | £14,999 | Professional plan for all schools |
| Large (11-20 schools) | £24,999 | Enterprise plan for all schools |
| Very Large (21+ schools) | Custom | Full suite + dedicated support |

### 2.2 What's Included at Trust Level

| Category | Trust-Level Modules | Local-Only Modules |
|----------|---------------------|-------------------|
| **Compliance** | Ofsted Readiness, Safeguarding | (none) |
| **Operations** | Estates Compliance, HR & People, Attendance, Behaviour | Cover, Admissions, School Meals |
| **Leadership** | Governance, Actions Hub | (none) |
| **Data** | School Intelligence | Canvas Data |
| **Engagement** | Communications, Calendar, Surveys | (none) |
| **AI** | Ed AI Chat (limited), Ed Website Chat | Ed Voice, Form Helper |

**Rationale:**
- Core compliance and operations modules cascaded for consistency
- Niche operational modules (cover, meals) left to local choice
- Premium AI features (voice) left to local budget

### 2.3 Module Inheritance Rules

```sql
-- New table: trust_module_allocation
CREATE TABLE trust_module_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Module allocation
    module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
    allocation_type TEXT CHECK (allocation_type IN ('trust_cascading', 'local_only', 'not_available')),

    -- Pricing
    included_in_trust_plan BOOLEAN DEFAULT false,
    local_add_on_price_monthly DECIMAL(8,2),
    local_add_on_price_annual DECIMAL(8,2),

    -- School-specific overrides
    school_exclusions UUID[] DEFAULT '{}',  -- Schools opted out
    school_inclusions UUID[] DEFAULT '{}',  -- Schools opted in (for local-only)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trust_id, module_id)
);
```

**Inheritance Logic:**

```typescript
function getAvailableModules(schoolId: string) {
  const school = await getOrganization(schoolId);
  const trustId = school.parent_organization_id;

  if (!trustId) {
    // Standalone school - use standard modules
    return getStandardModules();
  }

  // Trust school - combine trust-level + local add-ons
  const trustModules = await getTrustModules(trustId);
  const localAddOns = await getLocalAddOns(schoolId);

  return {
    inherited: trustModules.filter(m => !m.school_exclusions.includes(schoolId)),
    localAddOns: localAddOns,
    availableForPurchase: getTrustCatalogue(trustId).filter(m => m.allocation_type === 'local_only')
  };
}
```

---

## 3. Module Allocation

### 3.1 Trust Enables Modules (Default ON)

**UX Flow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRUST ADMIN: MODULE ALLOCATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Configure which modules are enabled across your trust:                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Module                    │ Trust-Level │ Status    │ Schools       │   │
│  ├───────────────────────────┼─────────────┼───────────┼───────────────┤   │
│  │ Ofsted Readiness          │ [x]         │ ON        │ All (12)      │   │
│  │ Estates Compliance        │ [x]         │ ON        │ All (12)      │   │
│  │ HR & People               │ [x]         │ ON        │ All (12)      │   │
│  │ Governance                │ [x]         │ ON        │ All (12)      │   │
│  │ Actions Hub               │ [x]         │ ON        │ All (12)      │   │
│  │ School Intelligence       │ [x]         │ ON        │ All (12)      │   │
│  │ Ed AI Chat                │ [x]         │ ON        │ All (12)      │   │
│  │ ├─── Ed Voice             │ [ ]         │ OFF       │ 3 opted in    │   │
│  │ ├─── Form Helper          │ [ ]         │ OFF       │ 1 opted in    │   │
│  │ ├─── Canvas Data          │ [ ]         │ OFF       │ 2 opted in    │   │
│  │ └─── Cover Management     │ [ ]         │ N/A       │ Local only    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Enable Selected]  [Disable Selected]  [View School Breakdown]            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Schools Cannot Disable Trust-Level Modules

**Rule:** If a module is marked `trust_cascading`, schools inherit it automatically. They can only:
1. Add local-only modules (at their own cost)
2. Request exclusion (requires trust admin approval)

**Database Enforcement:**

```sql
-- Function to get effective modules for a school
CREATE OR REPLACE FUNCTION get_school_modules(school_id UUID)
RETURNS TABLE(module_id TEXT, source TEXT, enabled BOOLEAN) AS $$
DECLARE
  trust_id UUID;
BEGIN
  -- Get parent trust
  SELECT parent_organization_id INTO trust_id
  FROM organizations
  WHERE id = school_id AND organization_type = 'school';

  -- If no trust, return school's own modules
  IF trust_id IS NULL THEN
    RETURN QUERY
    SELECT om.module_id, 'local'::TEXT, om.enabled
    FROM organization_modules om
    WHERE om.organization_id = school_id;
    RETURN;
  END IF;

  -- Return trust-level cascading modules
  RETURN QUERY
  SELECT DISTINCT
    tma.module_id,
    'trust'::TEXT,
    NOT (school_id = ANY(tma.school_exclusions))
  FROM trust_module_allocation tma
  WHERE tma.trust_id = trust_id
    AND tma.allocation_type = 'trust_cascading'

  UNION ALL

  -- Return local add-ons
  SELECT
    om.module_id,
    'local'::TEXT,
    om.enabled
  FROM organization_modules om
  WHERE om.organization_id = school_id
    AND EXISTS (
      SELECT 1 FROM trust_module_allocation tma
      WHERE tma.trust_id = trust_id
        AND tma.module_id = om.module_id
        AND tma.allocation_type = 'local_only'
    );
END;
$$ LANGUAGE plpgsql;
```

### 3.3 Schools Can Purchase Additional Modules

**Flow:**

```
1. School admin visits /dashboard/settings/modules
2. Sees:
   - Inherited modules (grayed out, "provided by trust")
   - Available local add-ons (can purchase)
3. Clicks "Purchase" on Ed Voice
4. Shown price: "£299/year - billed to school"
5. Generates invoice to school (separate from trust invoice)
6. Module enabled immediately
```

---

## 4. Billing & Invoicing

### 4.1 Billing Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BILLING STRUCTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRUST BILLING                                                              │
│  ├─ Trust-wide subscription (single invoice)                                │
│  ├─ Includes all trust-level modules                                       │
│  └─ Billed to trust finance contact                                        │
│                                                                             │
│  SCHOOL BILLING (local add-ons)                                             │
│  ├─ Per-school invoices for local modules                                  │
│  ├─ Can be billed to trust (recharge) or school directly                   │
│  └─ Shows on trust dashboard as "School Local Spend"                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Invoice Types

**Type 1: Trust Master Invoice**

```
INVOICE #INV-2026-TRUST-001
Billing: Aurora Academies Trust (12345678)
Period: 1 April 2026 - 31 March 2027

┌───────────────────────────────────────────────────────────────────────────┐
│ DESCRIPTION                              | QTY   | UNIT   | TOTAL         │
├───────────────────────────────────────────────────────────────────────────┤
│ Professional Trust Plan (12 schools)     | 12    | £1,599 | £19,188.00    │
│ Volume discount (30%)                    |       |        | -£5,756.40    │
│                                                                           │
│ Net:                                     |       |        | £13,431.60    │
│ VAT (20%):                               |       |        | £2,686.32     │
│                                                                           │
│ TOTAL PAYABLE:                            |       |        | £16,117.92    │
└───────────────────────────────────────────────────────────────────────────┘

Payment Terms: 30 days
Due Date: 30 April 2026

Trust Finance Contact:
  Name: Jane Smith
  Email: finance@aurora-trust.org
  PO Number: PO-2026-001
```

**Type 2: School Add-On Invoice**

```
INVOICE #INV-2026-SCH-001
Billing: Grove House Primary School
Period: 1 April 2026 - 31 March 2027

┌───────────────────────────────────────────────────────────────────────────┐
│ DESCRIPTION                              | QTY   | UNIT   | TOTAL         │
├───────────────────────────────────────────────────────────────────────────┤
│ Ed Voice Module (add-on)                | 1     | £299   | £299.00       │
│                                                                           │
│ Net:                                     |       |        | £299.00       │
│ VAT (20%):                               |       |        | £59.80        │
│                                                                           │
│ TOTAL PAYABLE:                            |       |        | £358.80       │
└───────────────────────────────────────────────────────────────────────────┘

Billed to: Aurora Academies Trust (recharge)
Payment Terms: 30 days
```

### 4.3 Payment Terms & Workflows

**Trust-Specific Terms:**

| Term | Default | Notes |
|------|---------|-------|
| Payment Period | 30 days | Can extend to 60/90 for LAs |
| Billing Cycle | Annual | Trusts prefer annual (aligns with academic year) |
| Payment Method | BACS | Most trusts don't use cards |
| PO Required | Yes | All trust invoices need PO number |
| Approvals | Multi-tier | CFO + CEO approval for £10k+ |

**Credit Limits:**

```sql
-- Add to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credit_limit
  DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS current_balance
  DECIMAL(10,2) DEFAULT 0.00;

-- Credit limit by organization type
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credit_tier
  TEXT CHECK (credit_tier IN ('none', 'standard', 'enhanced', 'unlimited'));

-- Trust approval workflow
CREATE TABLE trust_purchase_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Request details
    requesting_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requesting_school_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    purchase_type TEXT CHECK (purchase_type IN ('new_module', 'user_increase', 'storage_increase')),

    -- What they're buying
    module_id TEXT REFERENCES modules(id),
    quantity INTEGER DEFAULT 1,
    total_cost DECIMAL(10,2),

    -- Approval workflow
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'declined', 'cancelled'
    )),

    -- Approvers
    cfo_approved BOOLEAN DEFAULT false,
    cfo_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cfo_approved_at TIMESTAMPTZ,

    ceo_approved BOOLEAN DEFAULT false,
    ceo_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ceo_approved_at TIMESTAMPTZ,

    -- Reasons
    decline_reason TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Approval Triggers:**

| Scenario | Approval Required |
|----------|-------------------|
| New trust subscription (£0 - £5k) | Auto-approved |
| New trust subscription (£5k - £25k) | CFO approval |
| New trust subscription (£25k+) | CFO + CEO approval |
| School add-on (£0 - £500) | Auto-approved |
| School add-on (£500+) | Trust admin approval |

### 4.4 Recharge to Schools

Many trusts want to recharge school-level spend back to schools:

```sql
-- Track recharges
CREATE TABLE trust_school_recharges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- What triggered the recharge
    source_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    source_type TEXT CHECK (source_type IN ('local_module', 'overage', 'custom')),

    -- Recharge amount
    amount DECIMAL(10,2),
    vat DECIMAL(10,2),
    total DECIMAL(10,2),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recharged', 'written_off')),

    -- Recharge details
    recharge_method TEXT CHECK (recharge_method IN ('internal_transfer', 'school_budget', 'invoice')),
    recharge_reference TEXT,

    -- Period
    recharge_period_start DATE,
    recharge_period_end DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    recharged_at TIMESTAMPTZ
);
```

---

## 5. User Management

### 5.1 Trust vs School Roles

**Organization-Level Roles:**

| Role | Trust Scope | School Scope | Permissions |
|------|-------------|--------------|-------------|
| `trust_admin` | All schools | All schools | Full trust-wide access, billing, user management |
| `trust_viewer` | Read-only | Read-only | View all schools, no edit |
| `school_admin` | None | Own school | Full access to own school only |
| `school_slt` | None | Own school | Edit permissions, no billing |
| `school_teacher` | None | Own school | Standard user access |
| `school_viewer` | None | Own school | Read-only |

**Role Matrix:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROLE PERMISSIONS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Feature                  │ Trust │ Trust │ School│ School│ School│School│
│  │ Admin │Viewer│ Admin │  SLT  │Teacher│Viewer│
│  ├─────────────────────────┼───────┼──────┼───────┼───────┼───────┼───────┤
│  View all schools         │   ✓   │  ✓   │   ✗   │   ✗   │   ✗   │   ✗   │
│  Edit own school          │   ✓   │  ✓   │   ✓   │   ✓   │   ✗   │   ✗   │
│  Edit other schools       │   ✓   │  ✗   │   ✗   │   ✗   │   ✗   │   ✗   │
│  Manage trust modules     │   ✓   │  ✗   │   ✗   │   ✗   │   ✗   │   ✗   │
│  View trust invoices      │   ✓   │  ✓   │   ✗   │   ✗   │   ✗   │   ✗   │
│  Manage school users      │   ✓   │  ✗   │   ✓   │   ✗   │   ✗   │   ✗   │
│  Purchase local modules   │   ✓   │  ✗   │   ✓   │   ✗   │   ✗   │   ✗   │
│  View school invoices     │   ✓   │  ✓   │   ✓   │   ✗   │   ✗   │   ✗   │
│  Trust-wide reports       │   ✓   │  ✓   │   ✗   │   ✗   │   ✗   │   ✗   │
│  School reports           │   ✓   │  ✓   │   ✓   │   ✓   │   ✓   │   ✓   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Trust Admin Can Access All Schools

**Implementation:**

```typescript
// Context: SupabaseAuthContext
interface AuthUser {
  id: string;
  email: string;
  role: 'trust_admin' | 'trust_viewer' | 'school_admin' | 'school_slt' | 'school_teacher' | 'school_viewer';
  organizationId: string;
  organizationType: 'school' | 'trust';
  parentOrganizationId: string | null;  // For school users, points to trust
  accessibleSchools: string[];  // For trust users
}

// Trust admin: can switch between schools
function switchSchool(schoolId: string) {
  if (user.role !== 'trust_admin' && user.role !== 'trust_viewer') return;
  if (!user.accessibleSchools.includes(schoolId)) return;

  // Set active school context
  setActiveSchool(schoolId);
}

// API: Get accessible schools
// GET /api/user/schools
async function getAccessibleSchools(userId: string) {
  const user = await getUser(userId);

  if (user.organizationType === 'trust') {
    // Return all child schools
    return db.organizations.findMany({
      where: { parent_organization_id: user.organizationId }
    });
  }

  // School user - return only own school
  return [await getOrganization(user.organizationId)];
}
```

**UI: School Switcher (for trust users)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Aurora Academies Trust ▼]                                               │
│  ├─ All Schools (Trust View)                                              │
│  ├─ ───────────────────────────────────                                    │
│  ├─ Grove House Primary School                                            │
│  ├─ Aurora Secondary School                                               │
│  ├─ St. Mary's C of E Academy                                             │
│  └─ ... (9 more)                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 School Admin Limited to Their School

**RLS Policy Updates:**

```sql
-- Function to get accessible organization IDs for user
CREATE OR REPLACE FUNCTION get_user_accessible_orgs(user_uuid UUID)
RETURNS UUID[] AS $$
DECLARE
  user_role TEXT;
  user_org_id UUID;
  user_org_type TEXT;
  parent_org_id UUID;
  accessible_orgs UUID[] := '{}';
BEGIN
  -- Get user details
  SELECT om.role, om.organization_id, o.organization_type, o.parent_organization_id
  INTO user_role, user_org_id, user_org_type, parent_org_id
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = user_uuid::TEXT
  LIMIT 1;

  -- School users: only their own school
  IF user_org_type = 'school' THEN
    accessible_orgs := array_append(accessible_orgs, user_org_id);
  -- Trust admins: all child schools
  ELSEIF user_role = 'trust_admin' OR user_role = 'trust_viewer' THEN
    SELECT array_agg(id) INTO accessible_orgs
    FROM organizations
    WHERE parent_organization_id = user_org_id OR id = user_org_id;
  END IF;

  RETURN accessible_orgs;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to use accessible orgs
CREATE POLICY "Users can view their accessible organizations"
  ON organizations
  FOR SELECT
  USING (
    id = ANY(get_user_accessible_orgs(auth.uid()))
  );
```

---

## 6. Database Schema Extensions

### 6.1 Extended Organizations Table

```sql
-- Already defined in section 1.2, repeated for completeness:
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS organization_type
  TEXT CHECK (organization_type IN ('school', 'trust', 'la', 'other'));

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_organization_id
  UUID REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS companies_house_number
  TEXT UNIQUE;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gbis_data
  JSONB DEFAULT '{}';

-- Additional fields for billing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credit_limit
  DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS current_balance
  DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credit_tier
  TEXT CHECK (credit_tier IN ('none', 'standard', 'enhanced', 'unlimited'));

-- Finance contact
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS finance_contact_name
  TEXT;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS finance_contact_email
  TEXT;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS payment_terms
  INTEGER DEFAULT 30;  -- Days

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_preference
  TEXT CHECK (billing_preference IN ('trust', 'school', 'mixed'));
```

### 6.2 New Tables

**Table: `trust_relationships`**

```sql
CREATE TABLE trust_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Trust and school
    trust_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Linkage details
    linked_via TEXT CHECK (linked_via IN ('companies_house', 'manual_urn', 'la_estab', 'manual')),
    urn TEXT,  -- School URN
    la_estab_code TEXT,  -- LA establishment code

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),

    -- Billing
    recharge_to_school BOOLEAN DEFAULT false,

    -- Metadata
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    linked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    UNIQUE(trust_id, school_id)
);

CREATE INDEX idx_trust_relationships_trust ON trust_relationships(trust_id);
CREATE INDEX idx_trust_relationships_school ON trust_relationships(school_id);
CREATE INDEX idx_trust_relationships_urn ON trust_relationships(urn);
```

**Table: `trust_subscriptions`**

```sql
CREATE TABLE trust_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Trust organization
    trust_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Plan details
    plan TEXT CHECK (plan IN ('core_trust', 'professional_trust', 'enterprise_trust', 'custom')),

    -- Pricing model
    pricing_model TEXT CHECK (pricing_model IN ('per_school', 'flat_fee', 'custom')),
    price_per_school DECIMAL(10,2),
    flat_fee DECIMAL(10,2),

    -- Volume discount
    school_count INTEGER DEFAULT 0,
    volume_discount_tier TEXT,
    volume_discount_percent DECIMAL(5,2),

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    auto_renew BOOLEAN DEFAULT true,

    -- Stripe
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,

    -- Billing period
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')) DEFAULT 'annual',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    -- Trial
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,

    -- Approval
    po_number TEXT,
    cfo_approved BOOLEAN DEFAULT false,
    ceo_approved BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(trust_id)
);

CREATE INDEX idx_trust_subscriptions_trust ON trust_subscriptions(trust_id);
CREATE INDEX idx_trust_subscriptions_status ON trust_subscriptions(status);
```

**Table: `trust_module_allocation`** (from section 3.3)

```sql
CREATE TABLE trust_module_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Module allocation
    module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
    allocation_type TEXT CHECK (allocation_type IN ('trust_cascading', 'local_only', 'not_available')),

    -- Pricing
    included_in_trust_plan BOOLEAN DEFAULT false,
    local_add_on_price_monthly DECIMAL(8,2),
    local_add_on_price_annual DECIMAL(8,2),

    -- School-specific overrides
    school_exclusions UUID[] DEFAULT '{}',
    school_inclusions UUID[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(trust_id, module_id)
);
```

**Table: `trust_purchase_approvals`** (from section 4.3)

```sql
CREATE TABLE trust_purchase_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    requesting_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    requesting_school_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    purchase_type TEXT CHECK (purchase_type IN ('new_module', 'user_increase', 'storage_increase')),

    module_id TEXT REFERENCES modules(id),
    quantity INTEGER DEFAULT 1,
    total_cost DECIMAL(10,2),

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),

    cfo_approved BOOLEAN DEFAULT false,
    cfo_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cfo_approved_at TIMESTAMPTZ,

    ceo_approved BOOLEAN DEFAULT false,
    ceo_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ceo_approved_at TIMESTAMPTZ,

    decline_reason TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Table: `trust_school_recharges`** (from section 4.4)

```sql
CREATE TABLE trust_school_recharges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    source_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    source_type TEXT CHECK (source_type IN ('local_module', 'overage', 'custom')),

    amount DECIMAL(10,2),
    vat DECIMAL(10,2),
    total DECIMAL(10,2),

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recharged', 'written_off')),

    recharge_method TEXT CHECK (recharge_method IN ('internal_transfer', 'school_budget', 'invoice')),
    recharge_reference TEXT,

    recharge_period_start DATE,
    recharge_period_end DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    recharged_at TIMESTAMPTZ
);
```

**Table: `onboarding_trust_leads`**

```sql
CREATE TABLE onboarding_trust_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Trust details (from GBIS lookup or manual entry)
    companies_house_number TEXT UNIQUE,
    trust_name TEXT NOT NULL,
    trust_type TEXT,  -- single_academy_trust, multi_academy_trust
    region TEXT,
    established_date DATE,

    -- Contact info
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    contact_role TEXT,

    -- Trust details
    school_count INTEGER,
    school_names TEXT[],  -- Array of school names
    school_urns TEXT[],  -- Array of school URNs

    -- Product interest
    interested_plan TEXT,  -- core_trust, professional_trust, enterprise_trust
    interested_modules TEXT[],  -- Trust-level modules
    local_modules_allowed BOOLEAN DEFAULT true,

    -- Budget & timeline
    budget_text TEXT,
    timeline TEXT,
    payment_terms INTEGER DEFAULT 30,

    -- Automated enrichment
    gbis_data_fetched BOOLEAN DEFAULT false,
    gbis_data JSONB DEFAULT '{}',

    -- Pipeline status
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'trial_started', 'trial_active',
        'quote_sent', 'negotiating', 'converted', 'not_interested', 'unresponsive'
    )),

    -- Trial details
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    trial_trust_id UUID REFERENCES organizations(id),

    -- Conversion details
    converted_to_subscription_id UUID REFERENCES trust_subscriptions(id),
    converted_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_trust_leads_status ON onboarding_trust_leads(status);
CREATE INDEX idx_onboarding_trust_leads_companies_house ON onboarding_trust_leads(companies_house_number);
```

### 6.3 View: Trust Overview

```sql
-- View for trust dashboard
CREATE OR REPLACE VIEW trust_overview AS
SELECT
    t.id AS trust_id,
    t.name AS trust_name,
    t.companies_house_number,
    ts.plan,
    ts.pricing_model,
    ts.school_count,
    ts.volume_discount_tier,
    ts.status AS subscription_status,
    COUNT(DISTINCT tr.school_id) AS linked_schools,
    SUM(CASE WHEN om.enabled THEN 1 ELSE 0 END) AS active_trust_modules,
    SUM(CASE WHEN om.enabled AND om.source = 'local' THEN 1 ELSE 0 END) AS local_add_ons,
    json_agg(
        json_build_object(
            'school_id', s.id,
            'school_name', s.name,
            'urn', s.urn,
            'local_modules', (SELECT array_agg(module_id) FROM organization_modules WHERE organization_id = s.id AND enabled)
        )
    ) AS schools
FROM organizations t
JOIN trust_subscriptions ts ON ts.trust_id = t.id
LEFT JOIN trust_relationships tr ON tr.trust_id = t.id
LEFT JOIN organizations s ON s.id = tr.school_id
LEFT JOIN LATERAL (
    SELECT module_id, enabled, 'trust'::TEXT AS source
    FROM trust_module_allocation
    WHERE trust_id = t.id AND allocation_type = 'trust_cascading' AND included_in_trust_plan
    UNION ALL
    SELECT module_id, enabled, 'local'::TEXT AS source
    FROM organization_modules om2
    WHERE om2.organization_id = s.id AND om2.enabled
) om ON true
WHERE t.organization_type = 'trust'
GROUP BY t.id, t.name, t.companies_house_number, ts.plan, ts.pricing_model, ts.school_count, ts.volume_discount_tier, ts.status;
```

---

## 7. Onboarding UX

### 7.1 Trust Signup Page

**Route:** `/signup/trust`

**Page Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SCHOOLGLE FOR TRUSTS                              │
│  [Logo]                                                                    │
│  Streamline school improvement across your academy trust                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1 of 3: Find Your Trust                                              │
│  ═══════════════════════════════════════                                     │
│                                                                             │
│  Enter your Companies House number:                                         │
│  ┌─────────────────────────────────────┐                                    │
│  │ 12345678            [Lookup Trust] │                                    │
│  └─────────────────────────────────────┘                                    │
│                                                                             │
│  ── OR ──                                                                  │
│                                                                             │
│  [Enter trust details manually]                                            │
│                                                                             │
│  [Previous]  [Next: Confirm Schools →]                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Step 2: Confirm Schools**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 2 of 3: Confirm Your Schools                                         │
│  ═════════════════════════════════════════════════                         │
│                                                                             │
│  We found 12 schools for Aurora Academies Trust:                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ ☑ Grove House Primary School    URN: 107242  East Sussex             │ │
│  │ ☑ Aurora Secondary School      URN: 107243  East Sussex             │ │
│  │ ☑ St. Mary's C of E Academy    URN: 107244  East Sussex             │ │
│  │ ☑ Riverside Academy            URN: 107245  East Sussex             │ │
│  │ ☑ Maple Grove Primary          URN: 107246  East Sussex             │ │
│  │ ☑ Oakfield Academy             URN: 107247  East Sussex             │
│  │ ☑ Willow Lane Primary          URN: 107248  East Sussex             │
│  │ ☑ Birchwood Secondary          URN: 107249  East Sussex             │ │
│  │ ☑ Cedar Park Academy           URN: 107250  East Sussex             │ │
│  │ ☑ Elm Grove Primary            URN: 107251  East Sussex             │ │
│  │ ☑ Fern Hill Academy            URN: 107252  East Sussex             │ │
│  │ ☑ Hazelwood School             URN: 107253  East Sussex             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Add Missing School]  [Remove Selected]                                   │
│                                                                             │
│  12 schools selected                                                       │
│                                                                             │
│  [← Previous]  [Next: Choose Plan →]                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Step 3: Choose Plan**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 3 of 3: Choose Your Plan                                             │
│  ═══════════════════════════════════════                                     │
│                                                                             │
│  Recommended for 12-school trust:                                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [SELECTED]  PROFESSIONAL TRUST                                     │   │
│  │                                                                  │   │
│  │  £1,599 per school annually                                      │   │
│  │  30% volume discount applied                                     │   │
│  │                                                                  │   │
│  │  12 schools x £1,599 = £19,188                                   │   │
│  │  Less 30% discount = -£5,756                                     │   │
│  │  ─────────────────────────────────────                           │   │
│  │  £13,432 + VAT per year                                          │   │
│  │                                                                  │   │
│  │  Includes:                                                       │   │
│  │  ✓ Ofsted Readiness (all schools)                                │   │
│  │  ✓ Estates Compliance (all schools)                              │   │
│  │  ✓ HR & People (all schools)                                     │   │
│  │  ✓ Governance (all schools)                                      │   │
│  │  ✓ Actions Hub (all schools)                                     │   │
│  │  ✓ School Intelligence (all schools)                             │   │
│  │  ✓ Ed AI Chat (all schools)                                      │   │
│  │                                                                  │   │
│  │  Schools can add: Ed Voice, Form Helper, Canvas Data            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Compare All Plans]                                                        │
│                                                                             │
│  [← Previous]  [Complete Signup →]                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 School Discovery/Addition Flow

**Route:** `/dashboard/trust/schools/add`

**When Trust Adds a School After Initial Signup:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADD SCHOOL TO TRUST                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  How would you like to add a school?                                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  [Find by URN]                                                         │ │
│  │  ┌─────────────────────────────────────┐                              │ │
│  │  │ Enter school URN:    [         ]    │                              │ │
│  │  └─────────────────────────────────────┘                              │ │
│  │                                                                       │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │                                                                       │ │
│  │  [Browse GBIS Database]                                              │ │
│  │  [Enter Details Manually]                                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Found school:                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Cherry Tree Academy                                                   │ │
│  │ URN: 107254 | East Sussex | Primary                                   │ │
│  │                                                                       │ │
│  │ This school will inherit:                                             │ │
│  │ ✓ Ofsted Readiness                                                    │ │
│  │ ✓ Estates Compliance                                                  │ │
│  │ ✓ HR & People                                                         │ │
│  │ ✓ Governance                                                          │ │
│  │ ✓ Actions Hub                                                         │ │
│  │ ✓ School Intelligence                                                 │ │
│  │                                                                       │ │
│  │ Available local add-ons:                                              │ │
│  │ ☐ Ed Voice (£299/yr)                                                  │ │
│  │ ☐ Form Helper (£199/yr)                                               │ │
│  │ ☐ Canvas Data (£399/yr)                                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Cancel]  [Add School →]                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Bulk Import of Schools via CSV

**Route:** `/dashboard/trust/schools/import`

**CSV Format:**

```csv
URN,Name,Phase,Address,Postcode,Website
107242,Grove House Primary School,Primary,"1 Grove Road, Eastbourne","BN21 1XX",https://grovehouse-sussex.sch.uk
107243,Aurora Secondary School,Secondary,"2 Aurora Way, Eastbourne","BN22 2XX",https://aurora-secondary.org.uk
...
```

**UI:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BULK IMPORT SCHOOLS                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Download template: [CSV Template]                                         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │        Drop CSV file here or click to upload                          │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ────                                                                      │
│                                                                             │
│  Preview:                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Status │ School                       │ URN      │ Action            │ │
│  ├────────┼──────────────────────────────┼──────────┼───────────────────┤ │
│  │  ✓     │ Grove House Primary          │ 107242   │ Will add          │ │
│  │  ✓     │ Aurora Secondary             │ 107243   │ Will add          │ │
│  │  ⚠     │ Invalid URN                  │ 999999   │ Not found in GBIS │ │
│  │  !     │ Already exists               │ 107244   │ Will skip         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Found: 12 | Errors: 1 | Skipped: 1                                         │
│                                                                             │
│  [Cancel]  [Import X Schools →]                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. API Endpoints

### 8.1 Trust Lookup

```
GET /api/trust/lookup?companiesHouseNumber=12345678
```

**Response:**

```typescript
interface TrustLookupResponse {
  success: boolean;
  trust?: {
    name: string;
    companiesHouseNumber: string;
    trustType: "single_academy_trust" | "multi_academy_trust";
    region: string;
    establishedDate: string;
    schools: Array<{
      urn: string;
      name: string;
      laEstabCode: string;
      phase: string;
      address: string;
      postcode: string;
    }>;
  };
  error?: string;
}
```

### 8.2 Trust Signup

```
POST /api/signup/trust
```

**Request:**

```typescript
interface TrustSignupRequest {
  companiesHouseNumber: string;
  trustName: string;
  schoolUrns: string[];  // URNs to include
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  interestedPlan: "core_trust" | "professional_trust" | "enterprise_trust";
  interestedModules: string[];
  budgetText?: string;
  timeline?: string;
}
```

**Response:**

```typescript
interface TrustSignupResponse {
  success: boolean;
  leadId?: string;
  message?: string;
  error?: string;
}
```

### 8.3 Trust Dashboard

```
GET /api/trust/overview
```

**Response:**

```typescript
interface TrustOverviewResponse {
  trust: {
    id: string;
    name: string;
    companiesHouseNumber: string;
    plan: string;
    pricingModel: string;
    schoolCount: number;
    volumeDiscountTier: string;
    subscriptionStatus: string;
  };
  schools: Array<{
    id: string;
    name: string;
    urn: string;
    localModules: string[];
  }>;
  activeTrustModules: number;
  localAddOns: number;
  totalSpend: {
    trustSubscription: number;
    localAddOns: number;
    total: number;
  };
}
```

### 8.4 Add School to Trust

```
POST /api/trust/schools/add
```

**Request:**

```typescript
interface AddSchoolRequest {
  urn?: string;
  manualDetails?: {
    name: string;
    phase: string;
    address: string;
    postcode: string;
    website?: string;
  };
  localAddOns?: string[];  // Modules to enable immediately
}
```

### 8.5 Trust Module Allocation

```
POST /api/trust/modules/allocate
```

**Request:**

```typescript
interface ModuleAllocationRequest {
  moduleIds: string[];
  allocationType: "trust_cascading" | "local_only";
  schoolExclusions?: string[];  // School IDs to exclude
}
```

---

## 9. Implementation Priority

### Phase 1: Core Trust Structure (Week 1-2)

- [ ] Extend `organizations` table with trust fields
- [ ] Create `trust_relationships` table
- [ ] Create `trust_subscriptions` table
- [ ] Update RLS policies for trust access
- [ ] GBIS lookup integration
- [ ] Trust signup page (`/signup/trust`)

### Phase 2: Module Allocation (Week 2-3)

- [ ] Create `trust_module_allocation` table
- [ ] Implement module inheritance logic
- [ ] Trust module allocation UI
- [ ] School add-on purchase flow

### Phase 3: Billing & Invoicing (Week 3-4)

- [ ] Create `trust_purchase_approvals` table
- [ ] Create `trust_school_recharges` table
- [ ] Trust invoice generation
- [ ] School add-on invoicing
- [ ] Approval workflow UI

### Phase 4: User Management (Week 4)

- [ ] Trust role definitions
- [ ] School switcher UI
- [ ] Trust admin permissions
- [ ] Trust-wide reporting

### Phase 5: School Management (Week 4-5)

- [ ] Add school UI (URN lookup)
- [ ] Bulk CSV import
- [ ] School dashboard (trust view)

---

## 10. Open Questions

1. **What happens when a school leaves a trust?**
   - Option A: School subscription terminates (data archived)
   - Option B: School converts to standalone subscription (prorated)
   - Option C: School inherits trust subscription until renewal

2. **Can schools opt out of trust-level modules?**
   - Default: No (trust decision)
   - Exception: Yes, with trust approval (e.g., religious objections)

3. **How to handle trust mergers?**
   - Need migration workflow to combine trusts
   - Preserve historical billing data

4. **What about Local Authority (LA) purchasing?**
   - Similar structure to trusts
   - LA may have different approval workflows

5. **Can a trust have different plans for different schools?**
   - No - trust plan applies to all
   - Exception: Schools joining mid-year get prorated

---

## Summary

This design enables MATs to:

1. **Purchase once** - Single trust subscription covers all schools
2. **Cascade modules** - Trust-level modules automatically available to all schools
3. **Local flexibility** - Schools can add their own modules
4. **Unified billing** - Single invoice with optional recharge to schools
5. **Role-based access** - Trust admins see everything; school admins see theirs

**Key Files:**
- Database migration: `apps/platform/supabase/migrations/20260323_trust_purchasing.sql`
- API routes: `apps/platform/src/app/api/trust/*`
- UI pages: `apps/platform/src/app/(dashboard)/trust/*`, `apps/platform/src/app/signup/trust/page.tsx`
