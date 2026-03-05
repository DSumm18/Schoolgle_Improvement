# Ed RPA - Robotic Process Automation for Schools

## The Vision

> "Schools have lots of admin bureaucracy. Sickness absences, payroll notifications, local authority forms. Ed could automate this - pull data from HR system, fill the form, human reviews and sends."

---

## Architecture: Human-in-the-Loop Automation

```
┌─────────────────────────────────────────────────────────────────┐
│                    ED RPA - AUTOMATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SCHEDULED TASK                              │
│     "Every Friday at 4pm: Submit sickness absence report"       │
│              │                                                  │
│              ▼                                                  │
│  2. DATA EXTRACTION                              │
│     Pull from HR/payroll system (Arbor, etc.)                  │
│              │                                                  │
│              ▼                                                  │
│  3. FORM DETECTION & FILLING                                    │
│     Navigate to LA portal, fill fields                         │
│              │                                                  │
│              ▼                                                  │
│  4. HUMAN REVIEW (CRITICAL!)                                    │
│     Ed: "I've filled the form. Please check:"                  │
│     - Show side-by-side comparison                              │
│     - Highlight what changed                                   │
│     - Wait for approval                                        │
│              │                                                  │
│              ▼                                                  │
│  5. SUBMISSION                                                │
│     User clicks "Approve & Submit"                             │
│              │                                                  │
│              ▼                                                  │
│  6. CONFIRMATION & AUDIT                                      │
│     "Submitted successfully. Logged."                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### 1. Sickness Absence Reporting
```
Source: Arbor HR system
Target: Local Authority sickness reporting portal

Every Friday at 4pm:
1. Extract all sickness absences for the week
2. Navigate to LA portal
3. Fill form with employee details, dates, reasons
4. Show to School Business Manager for review
5. Submit on approval
```

### 2. Payroll Notifications
```
Source: Bradford Council payroll system
Target: LA payroll notification form

Monthly:
1. Extract payroll changes
2. Fill notification form
3. SBM reviews and submits
```

### 3. CPOMS/MyConcern Logging
```
Source: Email from parent
Target: CPOMS safeguarding system

When safeguarding email received:
1. Extract relevant details
2. Navigate to CPOMS
3. Fill incident log
4. DSL reviews and submits
```

---

## The "Train Once, Reuse Everywhere" Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    SKILL SHARING MARKETPLACE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCHOOL A (Bradford) creates skill:                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Skill: bradford_la_sickness_report                        │   │
│  │  Target: bradford.gov.uk/sickness-report                  │   │
│  │  Fields: [14 fields mapped]                               │   │
│  │  Source: Arbor HR export                                 │   │
│  │  Created: Jan 2025                                       │   │
│  │  Used by: 23 Bradford schools                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│              │                                                  │
│              ▼                                                  │
│  SCHOOL B (Leeds) wants same skill:                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Same form, different LA portal                          │   │
│  │  Ed adapts: "I know this form type!"                     │   │
│  │  Just maps to Leeds portal URLs                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PUBLIC SKILL LIBRARY:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎓 Bradford LA Sickness Report    (23 schools using)     │   │
│  │ 🎓 Leeds Admissions Form           (45 schools using)     │   │
│  │ 🎓 Birmingham Free School Meals    (12 schools using)    │   │
│  │ 🎓 RIDDOR Injury Reporting         (156 schools using)   │   │
│  │ 🎓 CPOMS Incident Logging          (89 schools using)    │   │
│  │ 🎓 DBS Check Application           (schools using)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Safeguards: The Human-in-the-Loop is NON-NEGOTIABLE

```typescript
interface AutomationSafetyConfig {
  // NEVER auto-submit without human review
  requireHumanReview: true;

  // What form types need extra approval?
  highRiskFormTypes: [
    'safeguarding',
    'child_protection',
    'financial',
    'legal',
    'medical'
  ];

  // Who can approve automated submissions?
  approvalRoles: ['school_business_manager', 'headteacher', 'slt'];

  // Require TWO approvals for high-stakes forms
  dualApprovalRequired: true;

  // Audit EVERYTHING
  logAllAttempts: true;
  logAllSubmissions: true;
}
```

---

## The Approval UI: Side-by-Side Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Ed has filled this form. Please review before submitting.  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┬─────────────────────────────────────┐ │
│  │  DATA FROM SOURCE   │  FILLED IN FORM                      │ │
│  │  (Arbor HR Export)   │  (Bradford LA Portal)                │ │
│  ├─────────────────────┼─────────────────────────────────────┤ │
│  │ Name: John Smith    │ Name: John Smith       ✅ Match     │ │
│  │ Role: Teacher       │ Role: Teacher          ✅ Match     │ │
│  │ Dates: 3-7 Mar      │ Dates: 03/03/2025-      │ │
│  │                     │   07/03/2025          ✅ Match     │ │
│  │ Reason: Stress      │ Reason: Work-related    │ │
│  │                     │   stress              ✅ Match     │ │
│  │ Days: 5             │ Days: 5               ✅ Match     │ │
│  │                     │                                 │ │
│  │ NOTE: 2 incidents    │                                 │ │
│  │ this term           │                                 │ │
│  └─────────────────────┴─────────────────────────────────────┘ │
│                                                                 │
│  ⚠️  Items to review:                                            │
│  • "2 incidents this term" - not included in form               │
│  • Please confirm this is correct before submission              │
│                                                                 │
│  [ ○ ] I've reviewed and everything is correct                   │
│  [ ○ ] I need to make changes (will open form for editing)        │
│  [ ○ ] Cancel - I'll do this manually                            │ │
│                                                                 │
│  [ Approve & Submit ]  [ Edit Fields ]  [ Cancel ]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Can Websites Block Automation?

This is the key question. Let's break it down:

### What CAN'T Block Us

| Technique | Works? | Why |
|------------|---------|-----|
| **Simulated typing** | ✅ Yes | We type character-by-character like a human |
| **Browser extension** | ✅ Yes | User is logged in, we're just automating their inputs |
| **Standard HTML forms** | ✅ Yes | We fill visible input fields |
| **Navigation** | ✅ Yes | We click links and buttons like a user would |
| **Reading data** | ✅ Yes | We scrape visible text from the screen |

### What MIGHT Block Us

| Technique | Risk | Mitigation |
|------------|-------|------------|
| **CAPTCHA** | ⚠️ Medium | Pause and let user solve, then continue |
| **Bot detection headers** | ⚠️ Low | Use realistic user agent, timing |
| **Unexpected validation** | ⚠️ Low | Detect and pause for human help |
| **Two-factor auth** | ⚠️ High | User completes, then automation continues |
| **Session timeouts** | ⚠️ Low | Detect and pause for user to re-login |

### The Key: We're NOT a Server-Side Bot

```
Server-side bot (BLOCKED):
Remote server → Sends requests → Website blocks (different IP, no session)

Browser extension (WORKS):
User's browser → User is logged in → User's session → We just automate typing
```

**We're not a bot accessing their API. We're the user's browser typing on their behalf.**

---

## Technical Implementation: The Skill Definition

```typescript
// Example: Bradford LA Sickness Report Skill
{
  skill_id: 'bradford_la_sickness_report',
  name: 'Bradford LA Sickness Report',
  description: 'Automatically submit weekly sickness absence reports to Bradford Council',

  // Which school can use this?
  eligibility: {
    local_authority: 'Bradford',
    systems: ['Arbor', 'SIMS', 'Bromcom'],
  },

  // Where to get data?
  data_source: {
    type: 'hr_system_export',
    system: 'Arbor',
    query: 'sickness_absences_last_7_days',
    fields: ['employee_name', 'role', 'absence_dates', 'reason', 'days_count']
  },

  // Where to submit?
  target: {
    url: 'bradford.gov.uk/sickness-report',
    login_required: true,
    form_mappings: [
      { source: 'employee_name', target: '#employeeName' },
      { source: 'role', target: '#jobTitle' },
      { source: 'absence_dates', target: '#dateRange', transform: 'formatDateRange' },
      { source: 'reason', target: '#absenceReason' },
      { source: 'days_count', target: '#totalDays' }
    ]
  },

  // Safety controls
  safety: {
    require_review: true,
    required_role: 'school_business_manager',
    dual_approval: false,  // Only for high-stakes
    audit_log: true,
    confirmation_message: 'Please review the sickness report before submitting to Bradford Council.'
  },

  // Schedule
  schedule: {
    frequency: 'weekly',
    day: 'friday',
    time: '16:00',
    timezone: 'Europe/London',
  }
}
```

---

## The Skill Library: Schools Contribute

```sql
-- Table for shared skills
CREATE TABLE ed_rpa_skills (
  id UUID PRIMARY KEY,
  skill_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Who created it?
  created_by_school UUID REFERENCES organizations(id),
  is_public BOOLEAN DEFAULT false,

  -- Which schools can use this?
  eligible_local_authorities TEXT[],
  eligible_systems TEXT[],  -- ['Arbor', 'SIMS', etc.]

  -- The skill definition
  skill_definition JSONB NOT NULL,

  -- Usage tracking
  used_by_schools INT[] DEFAULT ARRAY[]::INT[],
  success_rate NUMERIC,
  last_updated TIMESTAMPTZ,

  -- Safety verified?
  safety_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## How a School Creates a Skill

```
1. School logs into dashboard
   └──> Goes to "Ed Skills" → "Create RPA Skill"

2. Records the skill (training mode)
   └──> "Show me what to do"
   └──> Ed watches while user completes the form manually
   └──> Ed records: clicked field A, typed value B, clicked submit
   └──> Ed: "I've learned this workflow. Save as skill?"

3. User names and saves the skill
   └──> "Bradford LA Sickness Report"
   └──> Tags: Bradford, sickness, HR, Arbor

4. User tests the skill
   └──> Ed: "I'll run through it without submitting. Watch:"
   └──> Ed demonstrates the flow
   └──> User: "Looks good, save it!"

5. Other schools can now use this skill
   └──> Shows in skill library for Bradford schools
   └──> Each school can adapt for their specific systems
```

---

## The "Visual Debugging" Mode

When creating/testing a skill:

```
┌─────────────────────────────────────────────────────────────────┐
│  🎬 Ed is learning: Bradford LA Sickness Report                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1 of 12: Navigate to form                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Action: Click "Sickness Reporting" link                 │   │
│  │  Selector: a[href*="sickness"]                          │   │
│  │  Status: ✅ Found 2 matching elements                     │   │
│  │  [Replay] [Skip] [Edit]                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 2 of 12: Fill Employee Name                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Action: Type "John Smith" into #employeeName           │   │
│  │  Data source: Arbor → employee_name                     │   │
│  │  Value: "John Smith"                                    │   │
│  │  Status: ✅ Field found, will type                       │   │
│  │  [Test typing] [Skip] [Edit]                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Play all steps                                            │
│  ▼ Submit (dry run - won't actually submit)                   │
│  ▼ Save as skill                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Handling Systems Without APIs: Screen Scraping

```
┌─────────────────────────────────────────────────────────────────┐
│                SYSTEMS WITHOUT API - SCREEN SCRAPING            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ARBOR HR (no write API)                                       │
│  ├─> User logs in                                             │
│  ├─> Ed navigates to "Reports" → "Staff Absence"             │
│  ├─> Ed clicks "Export to CSV"                                │
│  ├─> Ed downloads the CSV                                     │
│  ├─> Ed parses the data                                       │
│  └─> Ed fills LA form with that data                          │
│                                                                 │
│  CPOMS (no write API)                                          │
│  ├─> User logs in                                             │
│  ├─> Ed navigates to "Add new log"                            │
│  ├─> Ed fills: student, date, concern, action                │
│  └─> Ed shows preview to DSL                                  │
│                                                                 │
│  PARENTPAY (no bulk API)                                        │
│  ├─> Ed parses CSV upload                                     │
│  ├─> Ed creates individual entries                             │
│  └─> User reviews batch                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Local Authority Detection

```sql
-- Automatically detect LA from school URN
CREATE TABLE school_la_mapping (
  urn TEXT PRIMARY KEY,
  school_name TEXT,
  local_authority TEXT,
  la_region TEXT,
  la_portal_url TEXT,
  supported_skills TEXT[]  -- Skills available for this LA
);

-- Auto-populate from DFE data
INSERT INTO school_la_mapping (urn, school_name, local_authority, la_region)
SELECT
  urn,
  name,
  CASE
    WHEN postcode LIKE 'BD%' THEN 'Bradford'
    WHEN postcode LIKE 'LS%' THEN 'Leeds'
    WHEN postcode LIKE 'B%' THEN 'Birmingham'
    ...
  END as local_authority,
  ...
FROM schools;
```

---

## Safety Controls Summary

| Control | Purpose |
|---------|---------|
| **Human Review** | Never submit without approval |
| **Side-by-Side Preview** | Show exactly what will be submitted |
| **Role-Based Access** | Only authorized users can approve |
| **Dual Approval** | Two people for high-stakes forms |
| **Audit Trail** | Log every attempt and submission |
| **Dry Run Mode** | Test without actually submitting |
| **Easy Cancel** | Stop automation at any point |
| **Change Detection** | Alert if data looks unusual |

---

## Example: Complete Automation Workflow

```
FRIDAY 4:00PM - Scheduled Task Triggers

1. Ed: "Time to prepare weekly sickness report."
   └──> Exports data from Arbor (3 absences this week)

2. Ed: "Opening Bradford LA portal..."
   └──> Navigates to sickness reporting form

3. Ed: "Filling form with 3 records..."
   └──> Types in each absence record

4. Ed: "Form ready. Opening for review..."
   └──> Shows side-by-side comparison to SBM

5. SBM reviews:
   - "Everything looks correct"
   - Clicks "Approve & Submit"

6. Ed: "Submitted successfully!"
   └──> Logs to audit trail
   └──> Archives confirmation email

7. Ed: "Done! Next run: Friday 4pm"
```

Time saved: ~30 minutes per week
Accuracy: 100% (human reviewed)
Risk: Near zero (human always approves)
