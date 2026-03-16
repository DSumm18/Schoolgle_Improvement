# SEND Hub: Cross-Module Integration Specification

**Date:** 2026-03-14
**Purpose:** Define how SEND Hub integrates with Finance, Meetings, HR, and other modules — ensuring data flows automatically between systems using shared codes, tables, and workflows.

---

## 1. SEND-to-Finance Integration

### The Problem

SEND funding is the most complex income stream in a school's budget. Schools receive:
- **Element 1**: Age-Weighted Pupil Unit (AWPU) — part of GAG, no separate tracking
- **Element 2**: Notional SEND budget (~£6,000 per pupil from school's delegated budget)
- **Element 3**: Top-up funding — per-pupil LA funding based on banding, paid termly/monthly

Currently, Finance and SEND exist as separate systems. A SENCO knows the funding bands; a bursar sees income lines. Neither sees the full picture. SEND Hub must make these the **same data**.

### CFR Code Mapping

The finance system uses DfE Consistent Financial Reporting codes. SEND income and expenditure maps to specific CFR lines:

| CFR Code | Description | SEND Relevance |
|----------|------------|----------------|
| **I01** | Funds delegated by the LA | Includes notional SEND budget (Element 2) |
| **I02** | Funding for 6th form students | Post-16 EHCP funding where applicable |
| **I03** | SEN funding | **Primary SEND income line** — Element 3 top-up funding |
| **I04** | Funding for minority ethnic pupils | May overlap where EAL + SEN |
| **I05** | Pupil Premium | PP pupils with SEN (cross-reference) |
| **I13** | Additional grants from LA | Exceptional Needs Funding, SEND transport grants |
| **E01** | Teaching staff | Staff costs allocated to SEND provision |
| **E02** | Supply teaching staff | Cover for SENCO release time, training |
| **E03** | Education support staff | TAs, 1:1 support — **largest SEND expenditure** |
| **E04** | Premises staff | Only if SEND-specific (e.g., sensory room maintenance) |
| **E19** | Learning resources | SEND-specific resources, equipment |
| **E25** | Agency supply teaching | External SEND specialist teaching |
| **E26** | Bought-in professional services | EP, SALT, OT bought privately |
| **E27** | Catering | Only if SEND-related dietary provision |

### Database Integration: Shared Tables

The key principle: **SEND funding data lives in the finance schema, not a separate SEND schema.** The SEND Hub reads and writes to finance tables.

```sql
-- ============================================
-- SEND Funding Lines (extends budget engine)
-- ============================================

-- Each pupil with an EHCP has a funding record
CREATE TABLE send_funding_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  pupil_id uuid NOT NULL REFERENCES send_register(id),

  -- Funding components
  element_1_awpu numeric(10,2) DEFAULT 0,          -- Part of GAG (for reference)
  element_2_notional numeric(10,2) DEFAULT 6000,    -- School's contribution from delegated budget
  element_3_topup numeric(10,2) DEFAULT 0,          -- LA top-up (the variable bit)

  -- LA banding
  la_band text,                                      -- e.g., 'Band 3', 'Band D', 'Exceptional'
  la_band_amount numeric(10,2),                      -- What the LA says this band is worth
  la_band_effective_from date,
  la_band_effective_to date,

  -- Payment tracking
  payment_frequency text DEFAULT 'termly',           -- 'termly', 'monthly', 'annual'
  payments_received numeric(10,2) DEFAULT 0,         -- Running total received this year
  payments_expected numeric(10,2),                   -- What should have been received by now
  last_payment_date date,
  last_payment_amount numeric(10,2),

  -- CFR mapping (links to finance)
  cfr_income_code text DEFAULT 'I03',                -- CFR code for income line
  cfr_expenditure_codes text[] DEFAULT ARRAY['E03'], -- CFR codes where this pupil's provision costs sit
  cost_centre text DEFAULT 'Pupil Support',          -- Maps to finance cost centre

  -- Budget year
  academic_year text NOT NULL,                       -- e.g., '2025-26'
  financial_year text NOT NULL,                      -- e.g., '2025-26' (may differ for academies)

  -- Reconciliation
  reconciliation_status text DEFAULT 'pending',      -- 'pending', 'matched', 'variance', 'disputed'
  variance_amount numeric(10,2) DEFAULT 0,
  variance_reason text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(organization_id, pupil_id, academic_year)
);

-- Expenditure tracking per pupil (provision costing)
CREATE TABLE send_provision_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  pupil_id uuid NOT NULL REFERENCES send_register(id),
  funding_allocation_id uuid REFERENCES send_funding_allocations(id),

  -- What the provision is
  provision_type text NOT NULL,                      -- 'staff_time', 'resource', 'external_service', 'equipment'
  provision_description text NOT NULL,               -- e.g., '1:1 TA support - 15 hours/week'

  -- Staff costing (if staff_time)
  staff_id uuid REFERENCES staff_directory(id),      -- Links to HR/Staff Directory
  hours_per_week numeric(5,2),
  weeks_per_year numeric(4,1) DEFAULT 38,
  hourly_rate numeric(8,2),                          -- From payroll data
  on_costs_rate numeric(4,2) DEFAULT 0.2868,         -- Employer NI + Pension

  -- Calculated cost
  annual_cost numeric(10,2) NOT NULL,
  cfr_code text NOT NULL,                            -- E03, E26, E19, etc.
  cost_centre text DEFAULT 'Pupil Support',

  -- Period
  academic_year text NOT NULL,
  effective_from date,
  effective_to date,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- View: SEND Budget Position (consumed by finance dashboard)
CREATE VIEW send_budget_position AS
SELECT
  sfa.organization_id,
  sfa.academic_year,
  COUNT(DISTINCT sfa.pupil_id) AS total_ehcp_pupils,
  SUM(sfa.element_3_topup) AS total_topup_expected,
  SUM(sfa.payments_received) AS total_topup_received,
  SUM(sfa.element_3_topup) - SUM(sfa.payments_received) AS topup_outstanding,
  SUM(sfa.element_2_notional) AS total_notional_commitment,
  COALESCE(costs.total_provision_cost, 0) AS total_provision_expenditure,
  SUM(sfa.element_2_notional) + SUM(sfa.element_3_topup) - COALESCE(costs.total_provision_cost, 0) AS net_send_position,
  SUM(CASE WHEN sfa.reconciliation_status = 'variance' THEN 1 ELSE 0 END) AS variance_count,
  SUM(sfa.variance_amount) AS total_variance
FROM send_funding_allocations sfa
LEFT JOIN (
  SELECT organization_id, academic_year, SUM(annual_cost) AS total_provision_cost
  FROM send_provision_costs
  GROUP BY organization_id, academic_year
) costs ON costs.organization_id = sfa.organization_id
       AND costs.academic_year = sfa.academic_year
GROUP BY sfa.organization_id, sfa.academic_year;
```

### How Finance Picks Up SEND Data Automatically

The budget engine (`apps/platform/src/lib/budget-engine/engine.ts`) already has the concept of `FinanceFundingStream` with a `High Needs` type. The integration works by:

1. **SEND Hub writes** → `send_funding_allocations` (per-pupil income) and `send_provision_costs` (per-pupil expenditure)
2. **Budget Engine reads** → `send_budget_position` view for the SEND summary
3. **Finance Dashboard shows** → SEND as a dedicated section within the budget position, using CFR code I03
4. **Reconciliation** → When the LA pays, the bursar marks payments received; the system compares expected vs received and flags variances

```
SEND Hub (SENCO)                     Finance Module (Bursar)
┌─────────────────┐                  ┌─────────────────────┐
│ Add pupil to     │                  │                     │
│ SEN register     │──────────────────▶│ New income line     │
│                  │  auto-creates     │ appears under I03   │
│ Set LA band      │  funding record   │                     │
│                  │                  │ Expected income:     │
│ Log provision    │──────────────────▶│ £8,400/year         │
│ (TA 15hrs/wk)   │  auto-costs via   │                     │
│                  │  payroll rates    │ Provision cost:      │
│                  │                  │ £12,800 under E03   │
│ Band escalation  │──────────────────▶│                     │
│ approved by LA   │  updates income   │ Net SEND position:  │
│                  │  projection       │ -£4,400 (school     │
│                  │                  │  contributes £6K    │
│                  │                  │  from Element 2)    │
└─────────────────┘                  └─────────────────────┘
```

### Auto-Reconciliation Workflow

```
1. SENCO adds/updates pupil band → send_funding_allocations.element_3_topup updated
2. LA sends termly schedule (CSV/spreadsheet) → compared against our records
3. System generates reconciliation report:
   - Matched: LA schedule matches our records ✓
   - Variance: LA paying more/less than expected ⚠️
   - Missing: Pupil on our register but not on LA schedule ✗
   - Extra: LA paying for pupil not on our register ❓
4. Bursar reviews variances, either:
   - Accepts (updates our records to match LA)
   - Disputes (flags for SENCO to follow up with LA)
5. Finance dashboard automatically reflects updated SEND position
```

### API Integration

```
Existing Finance API                   New SEND-Finance Bridge
─────────────────────                  ──────────────────────
GET /api/finance/monitor               GET /api/send/funding-summary
  → now includes SEND section            → returns send_budget_position
  → pulls from send_budget_position      → feeds into finance monitor

POST /api/send/funding/reconcile
  → upload LA schedule CSV
  → auto-match against send_funding_allocations
  → return matched/variance/missing report

GET /api/send/funding/forecast
  → projects income for next 1-3 years
  → accounts for pupils leaving/joining
  → factors in known band changes
  → feeds into strategic-plan ICFP scenarios
```

---

## 2. Cross-Module Meeting App

### The Problem You Described

The meeting app was built for HR (back-to-work, sickness, capability). But EHCP annual reviews, TAC/TAF meetings, transition planning, and SEN support reviews all need the same infrastructure:
- Structured agendas with compliance checklists
- Prompt sheets so the right things get said
- AI-assisted minutes from transcription
- Digital signatures
- Action tracking
- Document attachment

The solution is **not** to rebuild — it's to extend the existing meeting app with SEND-specific templates and make the template system cross-module.

### Existing Meeting Architecture (What We Have)

The meeting app already has:
- 11 template categories including `send` (already defined in `TemplateCategory` enum!)
- Compliance checklist items with critical/non-critical flagging
- Opening/closing scripts
- Preparation guides with key phrases and policy references
- AI minute generation from Deepgram transcription
- Digital signatures (leader + attendee + witness)
- Post-meeting action creation
- Multi-attendee support

The `TemplateCategory` enum already includes: `hr`, `governance`, `slt_leadership`, `department`, `safeguarding`, `teaching_learning`, **`send`**, `parents`, `operational`, `general`, `custom`.

**We literally just need to add SEND meeting templates.**

### SEND Meeting Templates to Create

#### Template 1: EHCP Annual Review

```typescript
{
  name: "EHCP Annual Review",
  category: "send",
  description: "Statutory annual review of an Education, Health and Care Plan. " +
    "Covers all sections A-K with legally required discussion points. " +
    "Produces a review report that meets Regulation 20 requirements.",

  opening_script: [
    "Welcome to [child's name]'s annual review of their Education, Health and Care Plan.",
    "The purpose of this meeting is to review whether the EHC plan continues to meet [child's name]'s needs, " +
      "to assess progress towards the outcomes in Section E, and to make a recommendation to the local authority " +
      "about whether the plan should be maintained, amended, or ceased.",
    "I'd like to confirm who is present and note any apologies or written advice received from those unable to attend.",
    "[Child/young person]'s views are central to this review. We will begin by hearing their views " +
      "before considering each section of the plan."
  ],

  closing_script: [
    "To summarise, the recommendation of this review is to [maintain / amend / cease] the EHC plan.",
    "The school will send the review report to the local authority and all attendees within 2 weeks.",
    "The local authority must respond with their decision within 4 weeks of today's date.",
    "If you disagree with any aspect of this review or the LA's subsequent decision, " +
      "you have the right to request mediation or appeal to the First-tier Tribunal (SEND).",
    "The next annual review must take place by [date — 12 months from today].",
    "Thank you all for attending and for your contributions."
  ],

  compliance_items: [
    // Section A: Views
    { phrase: "Child/young person's views, wishes and feelings have been captured", category: "Views (Section A)", is_critical: true },
    { phrase: "Parent/carer views have been captured", category: "Views (Section A)", is_critical: true },
    { phrase: "Aspirations and goals discussed and updated if needed", category: "Views (Section A)", is_critical: false },

    // Section B: SEN
    { phrase: "Special educational needs reviewed — any changes identified", category: "SEN (Section B)", is_critical: true },
    { phrase: "New assessments or professional reports discussed", category: "SEN (Section B)", is_critical: false },

    // Section C/D: Health and Social Care
    { phrase: "Health needs related to SEN reviewed (Section C)", category: "Health & Social Care", is_critical: true },
    { phrase: "Social care needs reviewed (Section D)", category: "Health & Social Care", is_critical: false },

    // Section E: Outcomes
    { phrase: "Progress towards EACH outcome in Section E reviewed with evidence", category: "Outcomes (Section E)", is_critical: true },
    { phrase: "Each outcome assessed: on track / partially met / achieved", category: "Outcomes (Section E)", is_critical: true },
    { phrase: "New or amended outcomes agreed where needed", category: "Outcomes (Section E)", is_critical: false },

    // Section F: Provision
    { phrase: "Special educational provision (Section F) — is it being delivered in full?", category: "Provision (Section F)", is_critical: true },
    { phrase: "Provision effectiveness reviewed with evidence", category: "Provision (Section F)", is_critical: true },
    { phrase: "Any gaps between specified and actual provision identified", category: "Provision (Section F)", is_critical: true },
    { phrase: "Changes to provision discussed and agreed", category: "Provision (Section F)", is_critical: false },

    // Section G/H: Health and Social Care Provision
    { phrase: "Health provision (Section G) delivery confirmed", category: "Health Provision", is_critical: false },
    { phrase: "Social care provision (Section H) delivery confirmed", category: "Social Care Provision", is_critical: false },

    // Section I: Placement
    { phrase: "Current educational placement reviewed — remains appropriate?", category: "Placement (Section I)", is_critical: true },

    // Transition (Year 9+)
    { phrase: "Transition planning discussed (mandatory from Year 9)", category: "Transition", is_critical: false },
    { phrase: "Preparing for Adulthood outcomes considered: employment, independent living, community, health", category: "Transition", is_critical: false },

    // Recommendation
    { phrase: "Clear recommendation made: maintain / amend / cease the plan", category: "Recommendation", is_critical: true },
    { phrase: "If amend: specific sections and reasons for amendment recorded", category: "Recommendation", is_critical: false },
    { phrase: "Parent/young person agreement or disagreement with recommendation recorded", category: "Recommendation", is_critical: true },
    { phrase: "Right to mediation and appeal to First-tier Tribunal (SEND) communicated", category: "Legal Rights", is_critical: true },
    { phrase: "Date of next annual review confirmed (within 12 months)", category: "Next Steps", is_critical: true },
    { phrase: "All agreed actions recorded with responsible person and deadline", category: "Next Steps", is_critical: true }
  ],

  preparation_guide: {
    context_prompts: [
      "Gather the child's current EHC plan — all sections A-K",
      "Request written advice from all professionals at least 4 weeks before the meeting",
      "Collect the child/young person's views using one-page profile, talking mats, or age-appropriate methods",
      "Collect parent/carer views using the LA's parent views form or a written statement",
      "Prepare progress data for each outcome in Section E",
      "Update the provision map showing what has been delivered and at what cost",
      "Note any changes to the child's needs since the last review"
    ],
    documents_needed: [
      "Current EHC plan (all sections)",
      "Previous annual review report",
      "Progress data / assessment data",
      "Provision map with costing",
      "Any new professional reports (EP, SALT, OT, medical)",
      "Child/young person's views document",
      "Parent/carer views document",
      "Written advice from any invited professionals who cannot attend"
    ],
    key_phrases: [
      "The provision specified in Section F is / is not being delivered as specified",
      "Progress towards Outcome [X] is on track / behind / achieved",
      "The recommendation of this review is to maintain / amend / cease the plan",
      "The parent expressed concern that...",
      "It was agreed that...",
      "[Professional] advised that [child] requires...",
      "The parent was informed of their right to request mediation or appeal"
    ],
    policy_refs: [
      "SEND Code of Practice 2015, Chapter 9 (paragraphs 9.166-9.199)",
      "Children and Families Act 2014, Section 44",
      "SEND Regulations 2014, Regulation 20",
      "School's SEN Policy",
      "School's Local Offer"
    ]
  }
}
```

#### Template 2: SEN Support Review (APDR Cycle)

```typescript
{
  name: "SEN Support Review (Assess-Plan-Do-Review)",
  category: "send",
  description: "Termly review meeting for pupils at SEN Support level. " +
    "Documents the graduated approach cycle — critical evidence for any future EHCP application.",

  compliance_items: [
    { phrase: "Current SEN Support plan/targets reviewed", category: "Assess", is_critical: true },
    { phrase: "Progress against each target assessed with data/evidence", category: "Assess", is_critical: true },
    { phrase: "Assessment data presented (standardised scores, teacher assessments)", category: "Assess", is_critical: true },
    { phrase: "Rate of progress discussed (not just attainment)", category: "Assess", is_critical: true },
    { phrase: "Current provision reviewed — what has been delivered?", category: "Do", is_critical: true },
    { phrase: "Intervention impact assessed — did it work?", category: "Do", is_critical: true },
    { phrase: "New SMART targets set for next cycle", category: "Plan", is_critical: true },
    { phrase: "Provision for next cycle agreed (type, frequency, duration)", category: "Plan", is_critical: true },
    { phrase: "Parent/carer views captured", category: "Views", is_critical: true },
    { phrase: "Child's views captured", category: "Views", is_critical: true },
    { phrase: "Decision: continue SEN Support / request EHC assessment / remove from register", category: "Outcome", is_critical: true },
    { phrase: "If requesting EHC assessment: evidence of insufficient progress despite intervention documented", category: "Escalation", is_critical: false },
    { phrase: "Next review date agreed", category: "Next Steps", is_critical: true }
  ],

  preparation_guide: {
    key_phrases: [
      "Despite [intervention] delivered for [duration], [child] has made [X months/points] progress against an expected [Y]",
      "The gap between [child] and age-related expectations is widening / stable / closing",
      "The provision map shows [cost] of additional support this term",
      "We recommend continuing at SEN Support / escalating to EHC needs assessment"
    ]
  }
}
```

#### Template 3: TAC/TAF Meeting

```typescript
{
  name: "Team Around the Child (TAC/TAF)",
  category: "send",
  description: "Multi-agency coordination meeting for children with emerging or complex needs. " +
    "Records multi-agency involvement — evidence for graduated approach.",

  compliance_items: [
    { phrase: "Review of actions from previous TAC/TAF meeting", category: "Review", is_critical: true },
    { phrase: "Each agency reports on current involvement and progress", category: "Agency Updates", is_critical: true },
    { phrase: "Updated assessment of child's needs", category: "Assessment", is_critical: true },
    { phrase: "Family/parent views captured", category: "Views", is_critical: true },
    { phrase: "Child's views captured (age-appropriate)", category: "Views", is_critical: true },
    { phrase: "Whether current level of support is sufficient", category: "Decision", is_critical: true },
    { phrase: "Whether EHC needs assessment should be considered", category: "Escalation", is_critical: false },
    { phrase: "Whether safeguarding step-up is needed", category: "Safeguarding", is_critical: true },
    { phrase: "New actions agreed with named leads and timescales", category: "Actions", is_critical: true },
    { phrase: "Lead professional confirmed / changed", category: "Coordination", is_critical: false },
    { phrase: "Next meeting date set (typically 6-8 weeks)", category: "Next Steps", is_critical: true }
  ]
}
```

#### Template 4: Transition Planning Meeting (Year 9+)

```typescript
{
  name: "EHCP Transition Planning (Year 9+)",
  category: "send",
  description: "Mandatory transition review for pupils with EHCPs from Year 9. " +
    "Must address the four Preparing for Adulthood outcomes.",

  compliance_items: [
    { phrase: "Employment / further education aspirations and pathway discussed", category: "PfA: Employment", is_critical: true },
    { phrase: "Independent living goals and preparation discussed", category: "PfA: Independent Living", is_critical: true },
    { phrase: "Community participation and social relationships discussed", category: "PfA: Community", is_critical: true },
    { phrase: "Health management and being healthy discussed", category: "PfA: Health", is_critical: true },
    { phrase: "Young person's views on their future captured", category: "Views", is_critical: true },
    { phrase: "Post-16 provision options explored", category: "Transition", is_critical: false },
    { phrase: "Careers advice input confirmed (Gatsby Benchmarks)", category: "Transition", is_critical: false },
    { phrase: "EHCP outcomes amended to include PfA outcomes", category: "EHCP Update", is_critical: true },
    { phrase: "Transition support services identified and referred", category: "Transition", is_critical: false },
    { phrase: "Adult social care transition assessment considered (Year 12+)", category: "Social Care", is_critical: false },
    { phrase: "Named placement for post-16 confirmed or process initiated", category: "Placement", is_critical: false },
    { phrase: "Amendment deadline noted (31 March in year of transfer)", category: "Timescales", is_critical: true }
  ]
}
```

#### Template 5: EHCP Application Planning Meeting

```typescript
{
  name: "EHCP Application Planning (Pre-Request)",
  category: "send",
  description: "Internal meeting to assess whether the school has sufficient evidence " +
    "to request an EHC needs assessment. Ensures the strongest possible application.",

  compliance_items: [
    { phrase: "At least 2-3 complete APDR cycles documented", category: "Graduated Approach", is_critical: true },
    { phrase: "Provision map shows costs exceeding £6,000 notional threshold", category: "Funding", is_critical: true },
    { phrase: "Progress data shows insufficient progress DESPITE targeted intervention", category: "Evidence", is_critical: true },
    { phrase: "Standardised assessment scores available (percentiles, standard scores)", category: "Evidence", is_critical: true },
    { phrase: "Professional reports gathered (EP, SALT, OT, medical — whichever relevant)", category: "Evidence", is_critical: true },
    { phrase: "School has acted on recommendations from existing professional reports", category: "Evidence", is_critical: true },
    { phrase: "Parent/carer views captured and supportive of request", category: "Views", is_critical: true },
    { phrase: "Child's views captured", category: "Views", is_critical: true },
    { phrase: "Attendance and exclusion data compiled", category: "Data", is_critical: false },
    { phrase: "Behaviour logs compiled (if SEMH primary need)", category: "Data", is_critical: false },
    { phrase: "Headteacher/SENCO statement drafted", category: "Application", is_critical: true },
    { phrase: "LA request form completed", category: "Application", is_critical: true },
    { phrase: "Evidence pack completeness score from Ed AI reviewed", category: "Quality Check", is_critical: false },
    { phrase: "Decision: submit request / gather more evidence / delay", category: "Decision", is_critical: true }
  ]
}
```

### Cross-Module Meeting Access Control

The meeting app currently lives under `/dashboard/hr/meetings/`. For cross-module access:

```
Current:     /dashboard/hr/meetings/
Proposed:    /dashboard/meetings/              (shared landing page)
             /dashboard/meetings/hr/           (HR meetings — back-to-work, sickness, etc.)
             /dashboard/meetings/send/         (SEND meetings — annual reviews, APDR, TAC/TAF)
             /dashboard/meetings/governance/   (Board meetings, governor visits)
             /dashboard/meetings/safeguarding/ (Safeguarding meetings)
             /dashboard/meetings/estates/      (Estates meetings — contractor reviews, fire safety)
```

### Module-Based Template Filtering

```typescript
// When user navigates to meetings from the SEND module,
// they only see SEND templates
const getTemplatesForModule = (module: string, userModules: string[]) => {
  // User can only see templates for modules they have access to
  const allowedCategories = userModules.map(mod => moduleToCategory[mod]);

  // Filter templates by category
  return templates.filter(t =>
    t.category === moduleToCategory[module] ||
    t.category === 'general' ||
    t.category === 'custom'
  );
};

const moduleToCategory: Record<string, TemplateCategory> = {
  'hr': 'hr',
  'send': 'send',
  'governance': 'governance',
  'estates': 'operational',
  'safeguarding': 'safeguarding',
  'teaching-learning': 'teaching_learning',
  'slt': 'slt_leadership',
};
```

### Subscription-Based Access

| Plan | Meeting Templates Available |
|------|---------------------------|
| Free | General only |
| Schools (Basic) | HR, General |
| Schools (Standard) | HR, SEND, Safeguarding, General |
| Schools (Premium) | All categories |
| Trusts | All categories + cross-school templates |

If a school only buys the HR module, they see HR meeting templates. If they add SEND Hub, SEND templates appear automatically. The meeting **infrastructure** is shared; the **templates** are module-gated.

---

## 3. SEND Meetings ↔ SEND Hub Data Flow

### Annual Review → Evidence Pack

When an EHCP Annual Review meeting is completed:

```
Meeting completed
    ↓
1. Minutes generated (AI from transcript or template-based)
    ↓
2. Minutes auto-filed to send_evidence_files for this pupil
   - evidence_type: 'annual_review_report'
   - source_module: 'meetings'
   - linked_review_id: meeting.id
    ↓
3. Checklist compliance score saved to send_review_history
   - Which items were covered / missed
   - AI flags if critical items were not discussed
    ↓
4. Actions created from the meeting auto-link to:
   - Actions Hub (school-wide action tracking)
   - SEND Hub pupil timeline (pupil-specific actions)
    ↓
5. If recommendation = "amend":
   - Auto-create SEND Hub workflow: "Awaiting LA amendment decision"
   - Set deadline: 4 weeks from meeting date
   - Alert SENCO if LA doesn't respond in time
    ↓
6. Finance auto-updated if band change recommended:
   - send_funding_allocations.la_band updated (pending LA confirmation)
   - Budget forecast adjusts projected income
    ↓
7. Next review auto-scheduled in meetings calendar (12 months / 6 months for under-5s)
```

### Meeting Minutes → Tribunal-Ready Documents

The existing minute generation already produces HTML with:
- Header table (date, location, attendees)
- Sections grouped by compliance category
- Compliance coverage score
- Signatures

For SEND, we enhance this with:
- **Section-by-section EHCP mapping** in the minutes structure (A through K)
- **Statutory language checking** — AI flags if legally required phrases are missing
- **"The provision in Section F is/is not being delivered"** — explicitly prompted
- **Parent agreement/disagreement** — explicitly recorded
- **Right to appeal** — included in closing

### The Prompt Sheet Experience

When a SENCO starts a live EHCP Annual Review meeting:

1. **Before the meeting**: The preparation guide appears with:
   - Checklist of documents needed (all pulled from SEND Hub if available)
   - List of invitees (auto-populated from EHCP contacts)
   - Written advice received / outstanding
   - Key phrases card (printable/on-screen reference)

2. **During the meeting**: The live checklist shows:
   - Each compliance item as a prompt to discuss
   - Grouped by EHCP section (A → K)
   - Critical items highlighted in red until ticked
   - Script prompts: "Now let's review progress towards each outcome in Section E..."
   - Key phrases displayed alongside each item
   - If recording: AI listens for coverage in real-time

3. **After the meeting**: The system:
   - Calculates compliance score
   - Flags any critical items not covered
   - Generates minutes from transcript or template
   - Presents minutes for review and signature
   - Files everything in the pupil's evidence pack
   - Creates actions and deadlines
   - Notifies the LA (if email integration is active)

---

## 4. SEND ↔ HR Staff Integration

### Staff Allocation to SEND Pupils

When a TA is assigned to support a pupil in the SEND Hub:

```
SEND Hub                          HR / Staff Directory
┌───────────────────┐             ┌──────────────────────┐
│ Assign TA to pupil │             │                      │
│ - 15 hrs/week      │────────────▶│ Staff workload view  │
│ - mornings only    │  staff_id   │ shows SEND commitment│
│                    │  link       │                      │
│ Provision cost:    │◀────────────│ Hourly rate from     │
│ auto-calculated    │  payroll    │ payroll data         │
│ from payroll rate  │  rate       │                      │
│                    │             │ If staff leaves:     │
│ If staff changes:  │◀────────────│ alert SENCO to       │
│ provision cost     │  staff      │ reassign SEND pupils │
│ auto-recalculates  │  event     │                      │
└───────────────────┘             └──────────────────────┘
```

### Staff Leaving / Absence Impact on SEND

When HR records a staff absence or leaver:
1. System checks `send_provision_costs` for any pupils assigned to that staff member
2. SENCO receives alert: "TA [name] is absent/leaving — 3 EHCP pupils affected"
3. Provision gap flagged — compliance risk if Section F provision is not being delivered
4. This becomes evidence at annual review: "Provision was disrupted for [X weeks] due to staff absence"

---

## 5. SEND ↔ Governance Integration

### Governor SEND Report

When the SEND Hub has data, the governance module can auto-generate:
- Number of pupils on SEN register (SEN Support + EHCP)
- EHCP compliance status (are all annual reviews up to date?)
- Funding position (income vs expenditure)
- Key concerns (unfilled provision, overdue reviews, LA disputes)
- Anonymised progress data (cohort-level, not individual)

This feeds into the governor meeting template (already exists in the governance module).

---

## 6. SEND ↔ Estates Integration

Minor but important:
- **Sensory rooms, specialist facilities** — tracked in estates asset register, linked to SEND provision
- **Accessibility audits** — estates compliance tasks that relate to SEND pupils' physical needs
- **Equipment** — specialist SEND equipment (standing frames, hearing loops) in estates asset register

---

## 7. Database Relationship Map

```
                    ┌──────────────┐
                    │  SEND Hub    │
                    │  (Register)  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────────┐
              │            │                │
    ┌─────────▼──────┐  ┌──▼──────────┐  ┌──▼──────────────┐
    │ send_funding_   │  │ send_       │  │ send_evidence_  │
    │ allocations     │  │ provision_  │  │ files           │
    │                 │  │ costs       │  │                 │
    │ cfr_code: I03   │  │ cfr: E03   │  │ source_module:  │
    │ cost_centre:    │  │ staff_id ──▶│  │ 'meetings'      │
    │ 'Pupil Support' │  │ Staff Dir  │  │ linked_review_id│
    └────────┬────────┘  └─────┬──────┘  └────────┬────────┘
             │                 │                   │
             ▼                 ▼                   ▼
    ┌────────────────────────────────┐    ┌────────────────┐
    │     Finance / Budget Engine    │    │   Meetings     │
    │                                │    │   (Annual      │
    │  send_budget_position (VIEW)   │    │    Reviews)    │
    │  → feeds into budget dashboard │    │                │
    │  → CFR I03 income line         │    │  compliance_   │
    │  → CFR E03 expenditure line    │    │  items from    │
    │  → ICFP staffing calculations  │    │  SEND template │
    │  → variance/reconciliation     │    │                │
    └────────────────────────────────┘    │  minutes →     │
                                          │  evidence file │
    ┌────────────────────────────────┐    │                │
    │     HR / Staff Directory       │    │  actions →     │
    │                                │    │  Actions Hub   │
    │  staff_directory.id            │    └────────────────┘
    │  ← referenced by provision     │
    │  ← payroll rates for costing   │
    │  ← absence alerts for SENCO    │
    └────────────────────────────────┘

    ┌────────────────────────────────┐
    │     Governance                 │
    │                                │
    │  Auto SEND governor report     │
    │  ← SEN register stats         │
    │  ← funding position           │
    │  ← review compliance          │
    └────────────────────────────────┘
```

---

## 8. Key Design Principles

### 1. Single Source of Truth
- Funding data lives in **one place** (`send_funding_allocations`) and is read by both SEND and Finance modules
- Staff data lives in **Staff Directory** and is referenced by SEND provision costs
- Meeting data lives in the **Meetings** system with templates that are module-specific

### 2. CFR Codes Are the Common Language
- Every SEND financial transaction maps to a CFR code
- Finance sees CFR I03 income; it doesn't need to know it's SEND — but it can drill down
- SEND sees "Band 3 top-up for [pupil]"; it doesn't need to know the CFR code — but it's tagged

### 3. Module Gating, Not Separate Systems
- One meeting app, many templates
- One finance system, many funding streams
- One staff directory, many assignment contexts
- Subscription controls which templates/features are visible

### 4. Automatic, Not Manual
- Adding a pupil to SEND register → finance record created automatically
- Completing an annual review → evidence filed automatically
- Staff leaving → SEND provision gap flagged automatically
- LA payment received → reconciliation runs automatically

### 5. Tribunal-Ready by Default
- Meeting minutes use statutory language
- Evidence is timestamped and version-controlled
- Parent agreement/disagreement is explicitly recorded
- All documents are exportable as a single indexed bundle

---

## 9. Post-Meeting Timescale Automation

The meeting system should automatically track these statutory deadlines:

| Trigger | Deadline | Auto-Action |
|---------|----------|-------------|
| Annual review meeting date | +2 weeks | Alert SENCO if review report not sent to LA |
| Annual review meeting date | +4 weeks | Alert SENCO if LA hasn't responded with decision |
| LA decision to amend | +8 weeks | Alert SENCO if amended plan not received |
| Proposed amended plan sent to parents | +15 days | Alert if parent response not recorded |
| Post-16 transfer year | 31 March | Alert if plan not amended for transition |
| Previous annual review date | +12 months | Auto-schedule next review (6 months for under-5s) |
| EHC needs assessment request | +6 weeks | Alert if LA hasn't responded to assess/not-assess decision |
| EHC needs assessment started | +20 weeks | Alert if final plan not issued |

These feed into the SEND Hub dashboard as a deadline tracker and into the Actions Hub as time-bound actions.

---

## Sources

- SEND Code of Practice 2015, Chapter 9 (paragraphs 9.166-9.199) — Annual review statutory requirements
- Children and Families Act 2014, Section 42 (duty to secure provision), Section 44 (review of EHC plan)
- SEND Regulations 2014, Regulation 20 — Review procedure and timescales
- DfE Consistent Financial Reporting Framework — CFR codes for SEND income/expenditure
- Existing Schoolgle codebase: `apps/platform/src/lib/budget-engine/types.ts` (CFR codes), `apps/platform/src/lib/meetings/types.ts` (TemplateCategory), `apps/platform/src/lib/meetings/seed-templates.ts` (template structure)
