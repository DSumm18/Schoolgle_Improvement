# Statutory vs Good Practice Framework

**Critical Differentiator for Schoolgle Estates Compliance**

---

## The Problem

### What Schools Face Today

When a contractor completes an inspection, they typically provide a report with findings and recommendations. The problem:

1. **Everything looks the same** - No distinction between legal requirements and suggestions
2. **Contractor bias** - Some contractors use "good practice" recommendations to generate additional work
3. **Budget pressure** - Schools spend money on things that aren't legally required
4. **Uncertainty** - Site managers and SBMs aren't experts in regulations

### Example Scenario

```
Contractor Report for Legionella Monthly Inspection:

Findings:
1. High temperature at outlet 3 - 25°C (limit is 20°C) - ACTION REQUIRED
2. Cold water tank showing signs of age - RECOMMEND REPLACEMENT
3. Consider installing sentinel outlets on all risers - GOOD PRACTICE
4. Annual risk assessment due in 2 months - PLAN AHEAD
5. Shower head in staff room has minor scale build-up - CLEAN REGULARLY

Which of these MUST the school do? Which are nice-to-haves?
Most schools can't tell the difference.
```

---

## Our Solution: Three-Tier Classification

Every finding, recommendation, and requirement is classified into one of three tiers:

### Tier 1: Statutory Required

**Definition:** Must be done. It's a legal requirement.

**Consequences of non-compliance:**
- Legal prosecution
- Insurance invalidation
- HSE enforcement notices
- Inability to defend negligence claims

**Examples:**
- Weekly flushing of outlets unused for 7+ days (HSE L8)
- Annual fire risk assessment (RRO 2005)
- Gas safety checks by Gas Safe engineer (GFPA)
- Asbestos register maintenance (CAR 2012)

**UI Indication:** 🔴 RED "STATUTORY REQUIRED"

---

### Tier 2: Good Practice

**Definition:** Should be done. Recommended by industry bodies or HSE guidance, but not legally required.

**Consequences of non-compliance:**
- Potential increased risk
- May be cited in incidents
- Not prosecutable by itself

**Examples:**
- Flushing outlets more frequently than required (e.g., daily instead of weekly)
- Additional temperature monitoring points
- Enhanced record-keeping beyond minimum requirements
- Earlier replacement than strictly necessary

**UI Indication:** 🟡 AMBER "GOOD PRACTICE - RECOMMENDED"

---

### Tier 3: Contractor Recommendation

**Definition:** Nice to have. Suggested by the contractor, but not required by regulation or guidance.

**Consequences of non-compliance:**
- None
- May be beneficial but optional

**Examples:**
- Installing additional sentinel outlets
- Upgrading equipment before end of life
- Additional servicing visits
- System enhancements

**UI Indication:** 🔵 BLUE "CONTRACTOR SUGGESTION - OPTIONAL"

---

## How We Determine Classification

### 1. Source-Based Classification

Every requirement is traced to its source:

| Source Type | Examples | Default Classification |
|-------------|----------|----------------------|
| **Primary Legislation** | RRO 2005, CAR 2012, EAWR 1989 | Statutory Required |
| **HSE Approved Codes of Practice** | ACoP L8, HSG274 | Statutory Required |
| **HSE Guidance** | HSE L8, HSG series | Good Practice (unless explicitly stated as legal requirement) |
| **British Standards** | BS5839, BS7671 | Good Practice (unless referenced in legislation) |
| **Industry Guidance** | Water UK, CIBSE | Good Practice |
| **Contractor Suggestions** | Report recommendations | Contractor Recommendation |

### 2. AI-Enhanced Classification

When a contractor report is uploaded:

```
Step 1: Extract all findings and recommendations
Step 2: Cross-reference with regulatory database
Step 3: Classify based on source
Step 4: Flag any uncertain items for human review
Step 5: Present with clear tier labels
```

**Example AI Processing:**

```javascript
// Finding from contractor report
"Hot water temperature at calorifier is 58°C. Consider reducing to 55°C or installing
 thermostatic mixing valve to prevent scalding risk."

// AI Processing
1. Extract: Temperature 58°C, recommendation to reduce or install TMV
2. Check sources:
   - HSE L8: Hot water should be stored at ≥60°C to prevent legionella
   - HSE guidance on scalding: Hot water distributed at ≥50°C but ≤55°C to prevent scalding
3. Classification:
   - Storing at 58°C: GOOD PRACTICE (within HSE L8 range, but could be lower)
   - Installing TMV: GOOD PRACTICE (recommended for scalding prevention, not statutory)
   - Reducing to 55°C: CONTRACTOR SUGGESTION (may conflict with legionella guidance)

// Note: This shows how recommendations can conflict - Ed would explain the trade-off
```

---

## Real-World Examples

### Example 1: Legionella Temperature

| Finding | Source | Classification | Why |
|---------|--------|----------------|-----|
| Cold water 25°C (exceeds 20°C limit) | HSE L8 para 157 | 🔴 Statutory Required | Exceeds legal limit |
| Flush all outlets weekly | HSE L8 | 🔴 Statutory Required | Legal requirement for unused outlets |
| Flush all outlets daily | - | 🔵 Contractor Suggestion | Not required by law |
| Install sentinel outlets on all risers | HSE HSG274 (good practice example) | 🟡 Good Practice | HSE example, not requirement |
| Replace cold water tank (15 years old) | - | 🔵 Contractor Suggestion | No age limit in regulations |

### Example 2: Fire Safety

| Finding | Source | Classification | Why |
|---------|--------|----------------|-----|
| Weekly fire alarm test | RRO 2005 | 🔴 Statutory Required | Legal requirement |
| Monthly extinguisher check | BS5306 (referenced in RRO) | 🔴 Statutory Required | Expected by RRO |
| Annual extinguisher servicing | BS5306 | 🟡 Good Practice | Industry standard, not explicit in RRO |
| Replace extinguishers 5 years early | - | 🔵 Contractor Suggestion | Optional |
| Install additional extinguishers | - | 🔵 Contractor Suggestion | Optional |

### Example 3: Asbestos

| Finding | Source | Classification | Why |
|---------|--------|----------------|-----|
| Annual register review | CAR 2012 | 🔴 Statutory Required | Legal duty |
| 3-yearly re-inspection by UKAS surveyor | CAR 2012 | 🔴 Statutory Required | Legal requirement |
| Annual visual inspection | CAR 2012 | 🟡 Good Practice | Implied by regulation, not explicit |
| Remove all asbestos (low risk, intact) | - | 🔵 Contractor Suggestion | Removal not required if managed |

---

## User Interface Design

### Findings Display

```
┌─────────────────────────────────────────────────────────────┐
│  FINDINGS REPORT - Legionella Monthly Inspection            │
│  Aqua-Trust - 15 January 2026                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔴 STATUTORY REQUIRED (2)                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ High temperature - Classroom 3 cold water tap          │ │
│  │ Reading: 25°C  |  Limit: 20°C (HSE L8 para 157)       │ │
│  │ Action: Investigate cause, increase flushing           │ │
│  │ Source: HSE L8 Legionnaires' Disease: The control     │ │
│  │        of legionella bacteria in water systems         │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Weekly flush not completed - Science lab outlets      │ │
│  │ Last flushed: 12 days ago (required within 7 days)    │ │
│  │ Source: HSE L8 para 155                               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  🟡 GOOD PRACTICE - RECOMMENDED (1)                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Consider annual flush of calorifier                   │ │
│  │ While not required, HSE HSG274 recommends this        │ │
│  │ for high-risk systems.                                 │ │
│  │ Source: HSE HSG274 Part 2, Section 2.1                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  🔵 CONTRACTOR SUGGESTION - OPTIONAL (1)                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Install sentinel outlets on all risers                │ │
│  │ Estimated cost: £850                                   │ │
│  │ This would improve monitoring but is not required.    │ │
│  │ Note: Not mentioned in HSE guidance.                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [View Report]  [Approve]  [Discuss with Governor]         │
└─────────────────────────────────────────────────────────────┘
```

### Decision Support

When user clicks on a finding:

```
┌─────────────────────────────────────────────────────────────┐
│  INSTALL SENTINEL OUTLETS - DECISION SUPPORT               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WHAT IS THIS?                                             │
│  Sentinel outlets are installed at the end of pipework     │
│  runs to allow easier monitoring of water quality.         │
│                                                             │
│  CONTRACTOR SAYS:                                          │
│  "This would improve monitoring and reduce flushing burden" │
│                                                             │
│  SCHOOLGLE SAYS:                                           │
│  This is NOT a statutory requirement. HSE L8 does not      │
│  require sentinel outlets. They are mentioned in HSG274    │
│  as an example of good practice in some situations.        │
│                                                             │
│  COST: £850 (approximately)                                │
│                                                             │
│  YOUR OPTIONS:                                             │
│  1. Decline - Not required, budget can be used elsewhere   │
│  2. Add to wishlist - Consider for next financial year     │
│  3. Approve - Proceed with installation                    │
│                                                             │
│  Ed's advice: Given this is optional and your current       │
│  monitoring is compliant, you might want to add this to    │
│  your 3-year plan rather than action immediately.          │
│                                                             │
│  [Decline]  [Add to Wishlist]  [Approve]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Budget Planning Integration

### From Finding to Budget Line Item

```
┌─────────────────────────────────────────────────────────────┐
│  ESTATES STRATEGY & BUDGET PLANNING                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FY 2026/27 - STATUTORY REQUIRED                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Q2: Cold water tank replacement                        │ │
│  │     Reason: End of life, failing inspection            │ │
│  │     Source: Statutory (water quality)                  │ │
│  │     Estimate: £2,500                                   │ │
│  │     Priority: HIGH                                     │ │
│  └───────────────────────────────────────────────────────┘ │
│  Total Statutory: £2,500                                   │
│                                                             │
│  FY 2026/27 - GOOD PRACTICE (if budget allows)             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Q3: Install sentinel outlets                           │ │
│  │     Reason: Improved monitoring                        │ │
│  │     Source: Good Practice (HSG274)                     │ │
│  │     Estimate: £850                                     │ │
│  │     Priority: MEDIUM                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│  Total Good Practice: £850                                 │
│                                                             │
│  FY 2027/28 - PLANNED                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Q1: Calorifier replacement (planned)                   │ │
│  │     Age-based replacement, 20 years old               │ │
│  │     Estimate: £4,200                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  FY 2028/29 - PLANNED                                      │
│  [Carry forward items not completed]                       │
│                                                             │
│  [Export to Excel]  [View by Category]  [View by Priority] │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Support

### Extended Findings Schema

```sql
ALTER TABLE estates_compliance_tasks
ADD COLUMN findings_classified JSONB DEFAULT '[]'::jsonb;

-- Structure:
-- [{
--   id: uuid,
--   description: text,
--   classification: 'statutory' | 'good_practice' | 'contractor_suggestion',
--   source: text,  -- e.g., "HSE L8 para 157"
--   source_url: text,
--   severity: 'critical' | 'high' | 'medium' | 'low',
--   estimated_cost: numeric,
--   suggested_action: text,
--   decision: 'pending' | 'approved' | 'declined' | 'deferred',
--   deferred_until: date,
--   added_to_budget_plan: boolean,
--   budget_year: integer
-- }]

CREATE TABLE estates_budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Item details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'replacement', 'upgrade', 'new_installation'

  -- Classification
  classification TEXT NOT NULL CHECK (classification IN (
    'statutory', 'good_practice', 'contractor_suggestion', 'planned_maintenance'
  )),

  -- Source
  source_finding_id UUID REFERENCES estates_compliance_tasks(id),
  source TEXT,
  source_url TEXT,

  -- Financials
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),

  -- Timing
  target_fiscal_year TEXT NOT NULL,  -- '2026/27'
  target_quarter TEXT CHECK (target_quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),

  -- Status
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'planned', 'approved', 'in_progress', 'completed', 'deferred', 'cancelled'
  )),

  -- Links
  asset_id UUID REFERENCES estates_assets(id),
  contractor_id UUID REFERENCES estates_contractors(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## AI Knowledge Pack Structure

### Regulatory Database

```typescript
// packages/skills-estates-compliance/shared-knowledge/regulatory-database.ts

export const REGULATORY_DATABASE = {
  legionella: {
    hse_l8: {
      name: "HSE L8 - Legionnaires' Disease: The control of legionella bacteria in water systems",
      url: "https://www.hse.gov.uk/pubns/books/l8.htm",
      type: "statutory",  // Approved Code of Practice = legal requirement
      requirements: [
        {
          id: "l8_155",
          paragraph: "155",
          requirement: "Weekly flushing of outlets unused for 7+ days",
          classification: "statutory",
          extracts: "Outlets that are not used on a regular basis should be flushed weekly",
        },
        {
          id: "l8_157",
          paragraph: "157",
          requirement: "Cold water temperature below 20°C at outlets",
          classification: "statutory",
          extracts: "Cold water should be at a temperature below 20°C after running for up to 2 minutes",
        },
        {
          id: "l8_158",
          paragraph: "158",
          requirement: "Hot water stored at 60°C+, distributed at 50°C+",
          classification: "statutory",
          extracts: "Hot water should be stored at at least 60°C and distributed at a minimum of 50°C",
        }
      ]
    },
    hsg274: {
      name: "HSE HSG274 - Legionnaires' disease Part 2: The control of legionella bacteria in hot and cold water systems",
      url: "https://www.hse.gov.uk/pubns/priced/hsg274part2.pdf",
      type: "guidance",  // Guidance, not statutory
      recommendations: [
        {
          id: "hsg274_2_1",
          section: "2.1",
          recommendation: "Consider sentinel outlets for monitoring",
          classification: "good_practice",
          extracts: "Sentinel outlets can be useful for monitoring purposes...",
          note: "This is an example, not a requirement"
        }
      ]
    }
  },

  fire: {
    rro_2005: {
      name: "Regulatory Reform (Fire Safety) Order 2005",
      url: "https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made",
      type: "statutory",
      requirements: [
        {
          id: "rro_art9",
          article: "9",
          requirement: "Fire risk assessment must be conducted",
          classification: "statutory",
        }
      ]
    },
    bs5839: {
      name: "BS5839-1: Fire detection and alarm systems",
      url: "https://www.bsi.group.com",
      type: "good_practice",  // British Standard, not law itself
      recommendations: [
        {
          id: "bs5839_weekly",
          recommendation: "Weekly alarm test",
          classification: "statutory",  // But referenced by RRO as expected practice
          note: "Not explicit in RRO but RRO expects 'suitable' maintenance"
        }
      ]
    }
  }
};

// AI uses this to classify findings
export function classifyFinding(
  domain: string,
  description: string
): {
  classification: 'statutory' | 'good_practice' | 'contractor_suggestion';
  source?: string;
  source_url?: string;
  explanation: string;
} {
  // Search through regulatory database
  // Return classification with source
  // If not found, default to 'contractor_suggestion'
  // and flag for human review
}
```

---

## Marketing Copy

### Headlines

- "Know What You MUST Do, Not What They Want You to Buy"
- "Statutory vs Good Practice: Finally, Clarity"
- "Stop Paying for Compliance Work You Don't Need"
- "The Only System That Distinguishes Law from Advice"

### Value Propositions

**For Business Managers:**
"Contractor reports mix requirements with upselling. We separate them. You'll see exactly what's legally required and what's optional. Make informed decisions about your budget."

**For Trust Directors:**
"Plan your estates strategy with confidence. Our statutory vs good practice classification means you prioritize what matters, defer what can wait, and plan for the future."

**For Site Teams:**
"Ed tells you what you need to do and why. No ambiguity. No guessing. Just clear guidance based on actual legislation."

---

**Document Status:** Draft - Ready for Implementation
**Last Updated:** 2026-01-23
