# Trust Onboarding & Module Organization Specification

## Part 1: Module Structure Reorganization

### Current Problem
- 50+ apps in a flat dropdown
- "Shed loads of stuff" with no clear hierarchy
- Mix of core features, standalone tools, and admin pages

### Proposed Module Structure

#### 🎯 SCHOOL IMPROVEMENT
**Purpose**: Teaching, learning, and inspection readiness

| App | Purpose |
|-----|---------|
| Ofsted Readiness | SEF, evidence tracking, inspection prep |
| Improvement (SDP) | School Development Plan |
| Actions Hub | AI-powered improvement tasks |
| Teaching & Learning | Lesson observations, feedback |
| Curriculum | Curriculum planning, mapping |
| SIAMS | Faith school inspection |
| Risk | Risk registers, ICFP |

#### 💼 BUSINESS MANAGEMENT
**Purpose**: Operations, compliance, resources

| App | Purpose |
|-----|---------|
| Estates & Compliance | Premises, health & safety, asset register |
| HR & People | Staff directory, sickness, performance |
| Governance | Board meetings, policies, training |
| Safeguarding | Concern logging, DSL triage |
| Finance | Budget management, CFR |
| Documents | Policy generator, document production |
| Calendar | Meeting scheduling, events |
| Tasks | General task management |
| Workflows | Automated business processes |
| SOPS | Standard operating procedures |

#### 🧠 SCHOOL INTELLIGENCE
**Purpose**: Data analysis, census, assessment tracking

| App | Purpose |
|-----|---------|
| Intelligence | DfE census, pupil demographics |
| Pupils | Pupil-level data, tracking |
| SEND | SEND register, funding |
| Attendance | Attendance data, patterns |
| Behaviour | Behaviour logs, analysis |
| Interventions | Pupil intervention tracking |
| Data Validation | Data quality checks |
| Connectors | MIS/Drive integrations |

#### 📊 ADDITIONAL MODULES (Standalone/Add-ons)

| Module | Apps | Pricing |
|--------|------|---------|
| **Communications** | Comms, Notices, Emergency Broadcast | +£200 |
| **Surveys** | Surveys, Parent/Staff/Pupil feedback | +£150 |
| **Admissions** | Admissions management | +£100 |
| **School Meals** | Universal Infant Free School Meals | +£50 |
| **Cover** | Staff cover management | +£150 |
| **Sports Premium** | PE & Sport Premium tracking | +£50 |
| **Pupil Premium** | Pupil Premium strategy & tracking | +£50 |
| **Canvas** | Advanced data platform | +£500 |

### Color Coding (Keep Existing)
- School Improvement: Blue/Purple gradient
- Business Management: Green/Teal gradient
- School Intelligence: Orange/Amber gradient
- Add-ons: Gray/Slate

---

## Part 2: Trust Onboarding User Journey

### Page: `/onboarding/trust`

**Design Principles:**
- Multi-step wizard with progress bar
- Lottie animations between steps
- Smooth transitions (Framer Motion)
- Mobile responsive
- Save progress (can resume later)

---

### STEP 1: Trust Identification

**UI Components:**
- Input field: "Enter your Trust name or Companies House number"
- Autocomplete dropdown (searches DfE database)
- Preview card showing: Trust name, number of schools, region

**Lottie Animation:**
- Search icon → magnifying glass scanning → dots appearing (schools found)

**API Calls:**
```typescript
GET /api/onboarding/search-trust?query=Pennine
→ Returns: { trustName, trustCode, schoolCount, region, schools[] }
```

**Validation:**
- If 0 schools found: "Trust not found. Contact us for manual setup."
- If schools found: Show preview card, "Continue" button

---

### STEP 2: School Selection

**UI Components:**
- List of all schools in trust (from DfE data)
- Each school: checkbox, name, URN, phase (primary/secondary), pupil count
- Filter buttons: "Show Primary", "Show Secondary", "Select All"
- Sticky summary: "X of Y schools selected"

**Example Display:**
```
┌─────────────────────────────────────────┐
│ Grove House Primary School              │
│ URN: 148201 | 417 pupils | Bradford     │
│ ☑️ Primary                               │
├─────────────────────────────────────────┤
│ Leeds Primary Academy                   │
│ URN: 123456 | 320 pupils | Leeds        │
│ ☐ Primary                               │
└─────────────────────────────────────────┘

Selected: 1 of 7 schools
Total pupils: 417
```

**Lottie Animation:**
- School building icons appearing → being checked → counter incrementing

**Confirmation Dialog:**
"You've selected 1 of 7 schools in Pennine Academies Yorkshire.
You can always add more schools later. Continue?"

**API Calls:**
```typescript
GET /api/onboarding/search-trust?query=Pennine
→ Returns schools array

POST /api/onboarding/select-schools
Body: { trustCode, selectedSchoolUrns: [148201, ...] }
→ Saves selection to session
```

---

### STEP 3: Module Selection (Per School)

**UI Components:**
- Left column: List of selected schools
- Right column: Module checkboxes with pricing
- Per-school selection (mix & match)

**Display Layout:**
```
┌──────────────────┬──────────────────────────────┐
│ Schools          │ Select Modules               │
├──────────────────┤                              │
│ Grove House      │ ☑️ School Improvement  £500  │
│                  │   ├─ Ofsted Readiness        │
│                  │   ├─ SEF                     │
│                  │   └─ Actions Hub             │
│                  │                              │
│                  │ ☑️ Business Management  £400  │
│                  │   ├─ Estates                 │
│                  │   ├─ HR                      │
│                  │   └─ Governance              │
│                  │                              │
│                  │ ☐ School Intelligence  £300  │
└──────────────────┴──────────────────────────────┘

Grove House: £900/year
```

**Features:**
- Click school → Expand/collapse module sub-items
- "Apply to all schools" button (for trusts wanting same modules everywhere)
- Per-school totals
- Trust total (sum of all schools)

**Lottie Animation:**
- Puzzle pieces coming together → price tag appearing → calculator animating

**API Calls:**
```typescript
POST /api/onboarding/select-modules
Body: {
  schools: [
    {
      urn: 148201,
      modules: ["school-improvement", "business-management"]
    }
  ]
}
→ Returns pricing breakdown
```

---

### STEP 4: Pricing Breakdown

**UI Components:**
- Table view of all schools with selected modules
- Per-school subtotal
- Trust total
- Volume discount (if applicable)

**Display:**
```
┌─────────────────────────────────────────────────────┐
│ PRICING SUMMARY                                     │
├─────────────────────────────────────────────────────┤
│ Grove House Primary School                          │
│   School Improvement     £500                       │
│   Business Management      £400                     │
│   ─────────────────────────                        │
│   Subtotal                 £900                     │
├─────────────────────────────────────────────────────┤
│ TRUST TOTAL (1 school)           £900/year          │
│                                                      │
│ Volume discount (5+ schools):        -10%            │
│ ─────────────────────────────────                    │
│ Final total                         £810/year        │
└─────────────────────────────────────────────────────┘
```

**Lottie Animation:**
- Coins stacking → discount badge appearing → total animating

**API Calls:**
```typescript
POST /api/onboarding/calculate-pricing
Body: { schools: [...] }
→ Returns: { subtotal, discount, total, breakdown[] }
```

---

### STEP 5: Contract & Invoicing Options

**UI Components:**
- Radio buttons for invoicing:
  - 🏢 Single invoice to Trust
  - 🏫 Individual invoices per school
  - 🔀 Split (some separate)
- Contract preview button
- Start date / End date pickers

**Display:**
```
┌─────────────────────────────────────────┐
│ INVOICING                                │
├─────────────────────────────────────────┤
│ ◉ Single invoice to Trust               │
│   Pennine Academies Yorkshire            │
│   Total: £810/year                       │
│                                          │
│ ○ Individual invoices (1 school)        │
│   Grove House: £900                     │
│                                          │
│ ○ Split invoicing                       │
│   Specify per-school billing            │
├─────────────────────────────────────────┤
│ CONTRACT DATES                          │
│ Start: [01/09/2026]                     │
│ End:   [31/08/2027]                     │
│                                          │
│ Duration: 1 year (auto-renew)           │
└─────────────────────────────────────────┘
```

**Lottie Animation:**
- Document appearing → pen signing → envelope (invoice)

**API Calls:**
```typescript
POST /api/onboarding/set-invoicing
Body: {
  invoicingOption: "trust" | "individual" | "split",
  startDate: "2026-09-01",
  endDate: "2027-08-31"
}
```

---

### STEP 6: Contract Review & Generation

**UI Components:**
- Contract preview (PDF embed)
- Key terms summary:
  - Modules included
  - Pricing
  - Contract dates
  - Payment terms
  - Auto-renewal settings
- "Download Contract" button
- "Accept & Continue" button

**Lottie Animation:**
- Document scrolling → checkmark appearing → celebratory confetti

**API Calls:**
```typescript
POST /api/onboarding/generate-contract
→ Returns: { contractPdfUrl, contractId, paymentReference }

GET /api/onboarding/contract/{contractId}/preview
→ Returns PDF stream
```

---

### STEP 7: Payment Instructions

**UI Components:**
- Payment reference: "SG-PENNINE-148201"
- Bank details:
  - Account number
  - Sort code
  - Amount: £810
- "Upload Remittance" button
- Progress tracker:
  - 📄 Contract generated
  - ⏳ Awaiting payment
  - ✅ Payment received → Activation

**Display:**
```
┌─────────────────────────────────────────┐
│ PAYMENT REQUIRED                        │
├─────────────────────────────────────────┤
│ Reference: SG-PENNINE-148201            │
│ Amount: £810.00                         │
│                                          │
│ Bank Account:                            │
│ Schoolgle Ltd                            │
│ Sort: 12-34-56                           │
│ Acct: 12345678                           │
├─────────────────────────────────────────┤
│ Upload Remittance Advice                │
│ [Browse files...]                       │
│                                          │
│ We'll confirm payment within 24 hours.   │
│ Your access activates on contract start  │
│ date regardless of payment timing.       │
└─────────────────────────────────────────┘
```

**Lottie Animation:**
- Bank transfer → money flying → phone notification (payment confirmed)

**API Calls:**
```typescript
POST /api/onboarding/upload-remittance
FormData: { file, contractId }

POST /api/admin/confirm-payment
Body: { contractId, amount }
→ Updates subscription status to "active"
```

---

### STEP 8: User Provisioning

**UI Components:**
- Two CSV upload sections:
  1. Trust Central Team
  2. Per-School Staff
- Template download buttons
- Column requirements:
  - First Name, Last Name, Email, Role
- Preview table after upload
- "Create Users & Send Invites" button

**Display:**
```
┌─────────────────────────────────────────┐
│ USER SETUP                               │
├─────────────────────────────────────────┤
│ 1. Trust Central Team                    │
│    [Download Template] [Upload CSV]      │
│    These users get access to ALL schools │
│                                          │
│ 2. School Staff                          │
│    Grove House Primary School            │
│    [Download Template] [Upload CSV]      │
│    These users get access to this school │
├─────────────────────────────────────────┤
│ PREVIEW (3 users)                        │
│ ┌─────────────────────────────────────┐ │
│ │ Sarah Johnson | CEO | sarah@...     │ │
│ │ Mike Smith    | SBM | mike@...      │ │
│ │ Emma Brown    | Admin | emma@...    │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ [Create Users & Send Password Emails]   │
└─────────────────────────────────────────┘
```

**Lottie Animation:**
- CSV file → users appearing → email flying → phones buzzing (login)

**API Calls:**
```typescript
POST /api/onboarding/provision-users
Body: {
  trustUsers: [{ firstName, lastName, email, role }],
  schoolUsers: [
    {
      urn: 148201,
      users: [{ firstName, lastName, email, role }]
    }
  ]
}
→ Creates Supabase auth users, sends invites
```

---

### STEP 9: Complete & Dashboard

**UI Components:**
- Success message
- Next steps:
  - Check email for login details
  - Access activates on [start date]
  - Explore help center
- "Go to Dashboard" button
- Progress tracker: All steps ✅

**Lottie Animation:**
- Celebratory animation → ribbon cutting → dashboard opening

**API Calls:**
```typescript
POST /api/onboarding/complete
→ Marks onboarding_lead.status = "completed"
→ Redirects to dashboard
```

---

## Part 3: Database Schema Changes Needed

### New Tables

```sql
-- Trust organizations (already exists as organizations with type='trust')
-- Just need to ensure parent_organization_id is populated

-- Pricing table
CREATE TABLE pricing_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  tier TEXT -- 'core', 'professional', 'enterprise'
);

CREATE TABLE pricing_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,
  module_id TEXT REFERENCES pricing_modules(module_id),
  included_in_tiers TEXT[],
  add_on_price_monthly DECIMAL(10,2),
  add_on_price_yearly DECIMAL(10,2)
);

-- Discounts
CREATE TABLE pricing_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'volume', 'multi_school', 'trust'
  condition JSONB, -- { minSchools: 5 }
  discount_percentage INTEGER,
  active BOOLEAN DEFAULT true
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  subscription_id UUID REFERENCES subscriptions(id),
  contract_pdf_url TEXT,
  payment_reference TEXT UNIQUE,
  invoicing_option TEXT, -- 'trust', 'individual', 'split'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT, -- 'draft', 'signed', 'active', 'expired'
  created_at TIMESTAMP DEFAULT NOW(),
  signed_at TIMESTAMP
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  remittance_file_url TEXT,
  status TEXT, -- 'pending', 'received', 'overdue'
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMP,
  notes TEXT
);
```

---

## Part 4: Super Admin Pipeline Dashboard

### Page: `/admin/pipeline`

**UI Components:**
- Pipeline stages: Lead → Quote → Contract → Payment → Active
- Kanban board or table view (toggle)
- Revenue forecasting
- Trust vs individual school filtering

**Table Columns:**
```
┌───────┬─────────────┬──────────┬─────────┬─────────┬──────────┬─────────┐
│ Stage │ Trust/School│ Schools  │ Modules │ Revenue │ Contract │ Payment │
├───────┼─────────────┼──────────┼─────────┼─────────┼──────────┼─────────┤
│ Lead  │ Pennine     │ 1 of 7   │ -       │ -       │ -        │ -       │
│ Quote │ Aurora     │ 3 of 3   │ SI, BM  │ £2,400  │ -        │ -       │
│ Contract│Rawdon    │ 1        │ HR      │ £400    | Draft    │ -       │
│ Payment│Grove House│ 1        │ All     │ £900    │ Signed   │ Pending │
│ Active │ Aurora    │ 3        │ SI      │ £1,500  │ Active   │ Paid    │
└───────┴─────────────┴──────────┴─────────┴─────────┴──────────┴─────────┘

**Revenue Forecasting:**
- Pipeline value: £X (leads + quotes)
- Committed revenue: £Y (contracts signed)
- Active revenue: £Z (payments received)
- Churn risk: [list of contracts expiring]
```

**Lottie Animations (Dashboard):**
- Loading: Bar charts rising
- Empty state: Funnel with coins dropping
- Success: Trophy or celebration

---

## Part 5: Lottie Animation Briefs for Designer

### Overall Style
- Clean, minimal, 2D flat design
- Schoolgle brand colors: Blue, Green, Orange
- Smooth transitions (0.5-1.5s each)
- Loop for loading states, single-play for success

### Animation List

| Step | Lottie JSON Name | Description | Duration |
|------|------------------|-------------|----------|
| 1. Search | `trust-search.json` | Magnifying glass scans, school buildings appear | 2s |
| 2. Selection | `school-selection.json` | Checkboxes fill, counter increments | 1.5s |
| 3. Modules | `module-selection.json` | Puzzle pieces assemble, price tag appears | 2s |
| 4. Pricing | `pricing-calculator.json` | Calculator animates, discount badge pops | 2s |
| 5. Contract | `contract-generation.json` | Document forms, pen signs, checkmark | 2.5s |
| 6. Payment | `payment-processing.json` | Bank transfer, coins fly, success tick | 3s |
| 7. Users | `user-provisioning.json` | CSV uploads, user icons multiply, emails fly | 2.5s |
| 8. Complete | `onboarding-complete.json` | Confetti, ribbon cutting, dashboard opens | 3s |

### File Delivery
- Export as Lottie JSON files
- Size: <500KB each
- Canvas: 512x512 or 800x600
- Frame rate: 60fps

---

## Part 6: Priority Implementation Order

### Phase 1: Foundation (Week 1-2)
1. ✅ Module structure mapping
2. ✅ Database schema (pricing, contracts, payments)
3. ✅ DfE trust lookup API
4. ✅ Pricing engine

### Phase 2: Core Flow (Week 3-4)
5. ✅ Steps 1-3 (Trust → Schools → Modules)
6. ✅ Pricing calculation
7. ✅ Contract generation (PDF)

### Phase 3: Business Logic (Week 5-6)
8. ✅ Payment workflow
9. ✅ User provisioning CSV
10. ✅ Email automation (SendGrid/Resend)

### Phase 4: Admin Dashboard (Week 7-8)
11. ✅ Pipeline dashboard
12. ✅ Revenue forecasting
13. ✅ Payment confirmation interface

### Phase 5: Polish (Week 9-10)
14. ✅ Lottie animations integration
15. ✅ Mobile responsiveness
16. ✅ Error handling & edge cases
17. ✅ Help center integration

---

## Part 7: Technical Considerations

### Session Management
- Store onboarding progress in `onboarding_leads` table
- Allow resume via email link
- 7-day expiry for incomplete onboarding
- Auto-followup emails (day 1, 3, 7)

### Security
- All routes protected with `protectedRoute`
- Contract PDFs watermarked with email/URN
- Payment references non-guessable (UUID)
- Rate limiting on pricing API

### Performance
- DfE lookups cached (24h)
- Pricing calculations memoized
- PDF generation async (queue)
- Email sending async (queue)

### Scalability
- Support 100+ school trusts
- Batch user creation (bulk API)
- Parallel PDF generation
- Database indexing on URN, trust_code

---

## Next Steps

1. **Review this spec** - Any changes to the flow?
2. **Designer brief** - Send Lottie requirements to designer
3. **Database setup** - Run migrations for pricing/contracts/payments
4. **API development** - Build onboarding endpoints
5. **Frontend build** - React components for each step

Ready to proceed? 🚀
