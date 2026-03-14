# Staff Connectors & Responsibility Engine

**Date:** 2026-03-14
**Status:** Design Specification
**Priority:** Core Platform Feature — underpins all modules

---

## 1. Concept

A **Staff Connector** is a named responsibility, role, qualification, or duty attached to a staff member that:

1. **Lives on their profile** — visible in HR/Staff Directory
2. **Surfaces in every relevant module** — Estates sees fire marshals, SEND sees the SENCO, Compliance sees the DSL
3. **Carries active requirements** — recurring tasks, calendar events, training renewals, ratio monitoring
4. **Triggers change management** — when staff leave, every affected connector is flagged with impact analysis and handover workflow

Connectors are the **glue between HR and every other module**. They answer: "Who is responsible for what, and what happens when that changes?"

---

## 2. Connector Types

### 2.1 Statutory Connectors (Platform-Defined)

These are built into the platform. Schools cannot delete them. They must always have at least one person assigned (the system flags non-compliance if unassigned).

#### Safeguarding & Child Protection

| Connector | Statutory Basis | Ratio/Requirement | Training Renewal | Modules |
|-----------|----------------|-------------------|------------------|---------|
| Designated Safeguarding Lead (DSL) | KCSIE 2025 | Min 1, always available | Every 2 years | Compliance, Safeguarding, Governance |
| Deputy DSL | KCSIE 2025 | Recommended 1+ | Every 2 years | Compliance, Safeguarding |
| Prevent Lead | Prevent Duty Guidance | Min 1 | Annual refresher | Compliance, Safeguarding |
| Online Safety Lead | KCSIE 2025 | Min 1 | Annual | Compliance, IT |
| Looked After Children Designated Teacher | Children Act 2004 s.20 | Exactly 1 | Annual | SEND, Compliance |

#### SEND

| Connector | Statutory Basis | Ratio/Requirement | Training Renewal | Modules |
|-----------|----------------|-------------------|------------------|---------|
| SENCO | SEND Code of Practice 2015 | Exactly 1 (must hold/be working towards NASENCo) | NASENCo qualification + ongoing CPD | SEND, Compliance, Meetings, Finance |
| Deputy SENCO | Good practice | Recommended 1 | Annual SEND update | SEND |
| Mental Health Lead | DfE Senior Mental Health Lead training | Min 1 | Every 2 years | SEND, Compliance, HR |

#### Health & Safety

| Connector | Statutory Basis | Ratio/Requirement | Training Renewal | Modules |
|-----------|----------------|-------------------|------------------|---------|
| First Aider | Health & Safety (First Aid) Regs 1981 | Risk-assessed ratio (typically 1:100) | Every 3 years | Compliance, Estates, HR |
| Paediatric First Aider | EYFS Statutory Framework | Min 1 per EYFS setting, always on site | Every 3 years | Compliance, Estates, HR |
| Fire Marshal | Regulatory Reform (Fire Safety) Order 2005 | 1 per floor/zone (risk-assessed) | Annual | Estates, Compliance |
| Health & Safety Lead | H&S at Work Act 1974 | Min 1 | Ongoing CPD | Estates, Compliance |
| Educational Visits Coordinator (EVC) | DfE H&S advice | Min 1 | Every 3 years (LOtC accreditation) | Compliance, HR |
| Radiation Protection Supervisor | IRR 2017 (secondary schools with sources) | 1 if applicable | Per regulations | Estates, Compliance |

#### Data & Governance

| Connector | Statutory Basis | Ratio/Requirement | Training Renewal | Modules |
|-----------|----------------|-------------------|------------------|---------|
| Data Protection Officer (DPO) | UK GDPR Art. 37 | Exactly 1 (can be external) | Annual GDPR training | Compliance, Governance, IT |
| Exam Officer | JCQ regulations | Min 1 | Annual JCQ update | Compliance |

#### Curriculum & Standards

| Connector | Statutory Basis | Ratio/Requirement | Training Renewal | Modules |
|-----------|----------------|-------------------|------------------|---------|
| EYFS Lead | EYFS Statutory Framework | Min 1 (if school has EYFS) | Annual EYFS update | Compliance, Teaching & Learning |
| Careers Leader | Baker Clause / Gatsby Benchmarks | Min 1 (secondary) | Ongoing CPD | Compliance |
| ECT Mentor | ECF 2021 | 1 per ECT | Per ECF programme | HR, Teaching & Learning |
| ECT Induction Tutor | ECF 2021 | Min 1 | Per ECF programme | HR, Teaching & Learning |

### 2.2 Custom Connectors (School-Defined)

Schools create these for anything they want to track. Examples:

- Subject Lead (Maths, English, Science, etc.)
- Key Stage Lead
- Year Group Lead
- Minibus Coordinator
- Swimming Pool Key Holder
- Breakfast Club Lead
- After-School Club Coordinator
- Catering Contract Manager
- IT Lead
- Music Coordinator
- PE Coordinator
- PSHE Lead
- Phonics Lead
- Pupil Premium Champion
- Attendance Lead
- Timetabler
- Cover Coordinator
- Staff Wellbeing Lead
- Eco-Schools Coordinator
- School Council Lead
- Library Coordinator

Custom connectors can optionally carry:
- Training requirements (with renewal dates)
- Recurring tasks
- Ratio requirements
- Module associations

---

## 3. Data Model

### 3.1 Core Tables

```sql
-- ============================================
-- Connector Type Definitions
-- ============================================
CREATE TABLE connector_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),  -- NULL = platform-wide statutory

  -- Identity
  name text NOT NULL,                        -- e.g. "Fire Marshal", "SENCO"
  slug text NOT NULL,                        -- e.g. "fire-marshal", "senco"
  description text,                          -- What this role entails
  category text NOT NULL,                    -- 'safeguarding', 'send', 'health_safety',
                                             -- 'data_governance', 'curriculum', 'estates', 'custom'

  -- Statutory status
  is_statutory boolean DEFAULT false,        -- Platform-defined, cannot delete
  statutory_basis text,                      -- e.g. "KCSIE 2025", "SEND Code of Practice 2015"
  statutory_reference text,                  -- e.g. "Section 20, Children Act 2004"

  -- Requirements
  min_count integer DEFAULT 1,               -- Minimum number of staff required
  max_count integer,                         -- NULL = unlimited
  ratio_numerator integer,                   -- e.g. 1 (in 1:100)
  ratio_denominator integer,                 -- e.g. 100 (in 1:100)
  ratio_against text,                        -- 'pupils', 'staff', 'floors', 'eyfs_pupils'
  must_be_available boolean DEFAULT false,   -- Must always be on site (e.g. DSL, paediatric first aider)

  -- Training
  requires_training boolean DEFAULT false,
  training_name text,                        -- e.g. "Level 3 First Aid at Work"
  training_renewal_months integer,           -- e.g. 36 for 3-year first aid
  training_provider text,                    -- Optional default provider

  -- Module surfacing
  modules text[] DEFAULT '{}',              -- Which modules show this connector
                                             -- e.g. ['estates', 'compliance', 'send']

  -- SOP / responsibilities
  responsibilities text[],                   -- List of what this role must do
  sop_document_id uuid,                      -- Link to a policy/SOP document

  -- Recurring tasks auto-generated when assigned
  auto_tasks jsonb DEFAULT '[]',             -- Array of task definitions
  -- Example: [
  --   {"name": "Weekly fire alarm test", "frequency": "weekly", "day": "friday"},
  --   {"name": "Annual fire risk assessment", "frequency": "yearly", "month": 9},
  --   {"name": "Termly fire drill", "frequency": "termly"}
  -- ]

  -- Display
  icon text,                                 -- Lucide icon name
  color text,                                -- Accent color for badges
  sort_order integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(organization_id, slug)
);

-- ============================================
-- Staff Connector Assignments
-- ============================================
CREATE TABLE staff_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  staff_id uuid NOT NULL REFERENCES staff_directory(id),
  connector_type_id uuid NOT NULL REFERENCES connector_types(id),

  -- Assignment details
  is_primary boolean DEFAULT true,           -- Primary vs deputy/backup
  scope text,                                -- e.g. "Block B", "KS2", "Year 3", "whole school"
  scope_type text,                           -- 'whole_school', 'key_stage', 'year_group',
                                             -- 'building', 'department', 'custom'

  -- Training status for this assignment
  training_completed boolean DEFAULT false,
  training_completed_date date,
  training_expiry_date date,
  training_certificate_url text,             -- Link to uploaded certificate
  training_provider text,

  -- Assignment period
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,                             -- NULL = current/ongoing
  assigned_by uuid,                          -- Who made the assignment

  -- Status
  status text DEFAULT 'active',             -- 'active', 'pending_training', 'expired_training', 'ended'

  -- Notes
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- A person can hold the same connector in different scopes
  -- but not duplicate in the same scope
  UNIQUE(organization_id, staff_id, connector_type_id, scope)
);

-- ============================================
-- Connector Task Instances (auto-generated)
-- ============================================
CREATE TABLE connector_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  staff_connector_id uuid NOT NULL REFERENCES staff_connectors(id),
  connector_type_id uuid NOT NULL REFERENCES connector_types(id),

  -- Task details (from auto_tasks template)
  title text NOT NULL,
  description text,
  frequency text NOT NULL,                   -- 'daily', 'weekly', 'monthly', 'termly', 'yearly', 'once'

  -- Schedule
  next_due_date date,
  last_completed_date date,
  recurrence_config jsonb,                   -- Day of week, month, term dates, etc.

  -- Compliance link
  compliance_task_id uuid,                   -- Links to estates/compliance task if applicable
  module text,                               -- Which module owns this task

  -- Status
  status text DEFAULT 'pending',             -- 'pending', 'due', 'overdue', 'completed', 'skipped'
  completed_by uuid,
  completed_at timestamptz,
  completion_notes text,
  completion_evidence_url text,              -- Photo, document, etc.

  -- Calendar
  calendar_event_id text,                    -- External calendar event ID
  reminder_sent boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- Connector Change Log (audit trail)
-- ============================================
CREATE TABLE connector_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  staff_connector_id uuid REFERENCES staff_connectors(id),
  connector_type_id uuid NOT NULL REFERENCES connector_types(id),

  -- What changed
  change_type text NOT NULL,                 -- 'assigned', 'unassigned', 'transferred',
                                             -- 'training_updated', 'training_expired', 'scope_changed'

  -- Who was involved
  from_staff_id uuid,                        -- Previous holder (for transfers)
  to_staff_id uuid,                          -- New holder (for transfers)
  changed_by uuid,                           -- Who made the change

  -- Details
  details jsonb,                             -- Additional context
  reason text,                               -- Why the change was made

  created_at timestamptz DEFAULT now()
);

-- ============================================
-- Views
-- ============================================

-- Compliance overview: which statutory connectors are covered?
CREATE VIEW connector_compliance_status AS
SELECT
  ct.id AS connector_type_id,
  ct.name,
  ct.category,
  ct.is_statutory,
  ct.min_count,
  ct.ratio_numerator,
  ct.ratio_denominator,
  ct.ratio_against,
  sc.organization_id,
  COUNT(CASE WHEN sc.status = 'active' THEN 1 END) AS active_count,
  COUNT(CASE WHEN sc.status = 'active' AND sc.training_expiry_date < CURRENT_DATE THEN 1 END) AS expired_training_count,
  COUNT(CASE WHEN sc.status = 'active' AND sc.training_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' THEN 1 END) AS expiring_soon_count,
  CASE
    WHEN ct.min_count IS NOT NULL AND COUNT(CASE WHEN sc.status = 'active' THEN 1 END) < ct.min_count THEN 'non_compliant'
    WHEN COUNT(CASE WHEN sc.status = 'active' AND sc.training_expiry_date < CURRENT_DATE THEN 1 END) > 0 THEN 'at_risk'
    WHEN COUNT(CASE WHEN sc.status = 'active' AND sc.training_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' THEN 1 END) > 0 THEN 'expiring_soon'
    ELSE 'compliant'
  END AS compliance_status
FROM connector_types ct
LEFT JOIN staff_connectors sc ON sc.connector_type_id = ct.id AND sc.status = 'active'
WHERE ct.is_statutory = true
GROUP BY ct.id, ct.name, ct.category, ct.is_statutory, ct.min_count,
         ct.ratio_numerator, ct.ratio_denominator, ct.ratio_against, sc.organization_id;

-- Staff workload: what does each person hold?
CREATE VIEW staff_connector_summary AS
SELECT
  sc.staff_id,
  sc.organization_id,
  COUNT(*) AS total_connectors,
  COUNT(CASE WHEN ct.is_statutory THEN 1 END) AS statutory_connectors,
  COUNT(CASE WHEN sc.training_expiry_date < CURRENT_DATE THEN 1 END) AS expired_training,
  jsonb_agg(jsonb_build_object(
    'connector_id', sc.id,
    'name', ct.name,
    'category', ct.category,
    'scope', sc.scope,
    'is_primary', sc.is_primary,
    'is_statutory', ct.is_statutory,
    'training_expiry', sc.training_expiry_date,
    'status', sc.status
  ) ORDER BY ct.is_statutory DESC, ct.category, ct.name) AS connectors
FROM staff_connectors sc
JOIN connector_types ct ON ct.id = sc.connector_type_id
WHERE sc.status = 'active'
GROUP BY sc.staff_id, sc.organization_id;
```

### 3.2 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_staff_connectors_org ON staff_connectors(organization_id);
CREATE INDEX idx_staff_connectors_staff ON staff_connectors(staff_id);
CREATE INDEX idx_staff_connectors_type ON staff_connectors(connector_type_id);
CREATE INDEX idx_staff_connectors_status ON staff_connectors(status);
CREATE INDEX idx_staff_connectors_training_expiry ON staff_connectors(training_expiry_date) WHERE status = 'active';
CREATE INDEX idx_connector_tasks_due ON connector_tasks(next_due_date) WHERE status IN ('pending', 'due', 'overdue');
CREATE INDEX idx_connector_tasks_staff ON connector_tasks(staff_connector_id);
CREATE INDEX idx_connector_types_org ON connector_types(organization_id);
CREATE INDEX idx_connector_types_statutory ON connector_types(is_statutory) WHERE is_statutory = true;
```

---

## 4. Staff Homepage — "Your Responsibilities"

When a staff member logs in, their homepage shows a **responsibility dashboard** built from their connectors.

### 4.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Welcome back, Mrs Jones                                        │
│                                                                 │
│  YOUR ROLES                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ 🛡️ DSL       │ │ 💙 SENCO     │ │ 🧠 Mental    │            │
│  │ (Primary)    │ │ (Primary)    │ │ Health Lead  │            │
│  │ Training:    │ │ NASENCo: ✓   │ │ Training:    │            │
│  │ expires 14d  │ │              │ │ current ✓    │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  YOUR TASKS (from responsibilities)                   View All  │
│                                                                 │
│  ⚠️  OVERDUE                                                    │
│  ├─ Fire drill — due 3 days ago                    [Schedule]   │
│  │  → Fire Marshal (Lead) · Whole School                        │
│  │                                                              │
│  📅 THIS WEEK                                                   │
│  ├─ Weekly fire alarm test — due Friday            [Complete]   │
│  │  → Fire Marshal (Lead) · Whole School                        │
│  ├─ EHCP Annual Review: Pupil A — Wednesday 10am   [Prepare]   │
│  │  → SENCO · Whole School                                      │
│  ├─ Safeguarding concern follow-up — by Thursday   [Update]    │
│  │  → DSL · Whole School                                        │
│  │                                                              │
│  📅 COMING UP                                                   │
│  ├─ Quarterly catering review — due in 2 weeks     [Schedule]  │
│  │  → Catering Contract Manager                                 │
│  ├─ DSL training renewal — expires in 14 days       [Book]     │
│  │  → DSL · Whole School                                        │
│  ├─ Allergen audit — due end of term               [Start]     │
│  │  → Catering Contract Manager                                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  TRAINING STATUS                                                │
│  ┌─────────────────┬───────────┬──────────────┐                │
│  │ Training        │ Status    │ Expires      │                │
│  ├─────────────────┼───────────┼──────────────┤                │
│  │ DSL Level 3     │ ⚠️ Expiring│ 28 Mar 2026 │                │
│  │ NASENCo Award   │ ✅ Current │ N/A          │                │
│  │ Mental Health   │ ✅ Current │ 15 Sep 2026  │                │
│  │ Fire Marshal    │ ✅ Current │ 01 Dec 2026  │                │
│  └─────────────────┴───────────┴──────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Task Sources

Tasks on the homepage come from three places:

1. **Auto-generated from connector definitions** — When "Fire Marshal" is assigned, the system creates recurring tasks from the `auto_tasks` template (weekly alarm test, termly drill, annual risk assessment)
2. **Module-specific tasks** — EHCP reviews from SEND Hub, compliance checks from Estates, policy reviews from Compliance — routed to the person who holds the relevant connector
3. **Manual tasks** — Actions from meetings, ad-hoc assignments from line managers

All three appear in a single unified view on the homepage.

### 4.3 Ed AI Integration

Ed can answer:
- "What are my responsibilities?" → reads `staff_connector_summary`
- "What's overdue?" → reads `connector_tasks` where status = 'overdue'
- "Schedule the fire drill for Thursday" → creates calendar event, updates `connector_tasks`
- "Who's our DSL?" → looks up connector type 'dsl' for the org
- "What happens if I leave?" → runs the impact analysis (see section 6)

---

## 5. Module Surfacing

### 5.1 How Connectors Appear in Each Module

#### Estates Module

```
ESTATES COMPLIANCE DASHBOARD
─────────────────────────────

KEY PERSONNEL
┌──────────────────────────────────────────────────┐
│ Fire Marshal (Lead)     Mrs Jones    Block A+B   │
│ Fire Marshal (Deputy)   Mr Smith     Block C     │
│ H&S Lead               Mr Williams  Whole School │
│ Caretaker Lead         Mr Brown     Whole School │
└──────────────────────────────────────────────────┘

⚠️ No fire marshal assigned for Block D (new building)
```

The "who is your fire marshal?" question is answered instantly. Click a name → goes to their staff profile. Click "+ Assign" → picks from staff list → creates the connector.

#### SEND Hub

```
SEND HUB
────────

SENCO: Mrs Jones (NASENCo: ✓)
Deputy SENCO: Miss Williams
Designated Teacher (LAC): Mr Harris
Mental Health Lead: Mrs Jones

[EHCP pupils linked to SENCO: 14]
[Active SEN Support reviews due: 8]
```

#### Compliance Module

```
STATUTORY ROLES COMPLIANCE
──────────────────────────

✅ DSL: Mrs Jones (training current — expires 28 Mar 2026)
⚠️ Deputy DSL: Mr Smith (training EXPIRED 15 Jan 2026)
✅ SENCO: Mrs Jones (NASENCo qualified)
✅ Prevent Lead: Mrs Jones
⚠️ First Aiders: 3 active / minimum 3 required (AT THRESHOLD)
   → Mrs Jones cert expires 28 Mar — drops to 2 after that
✅ Paediatric First Aider: Miss Williams (EYFS)
✅ DPO: External — DataGuard Ltd
✅ EVC: Mr Harris
❌ Online Safety Lead: UNASSIGNED
```

#### Governance Module

```
GOVERNOR LINK ROLES
───────────────────

Safeguarding Governor: Rev. Thompson → linked to DSL: Mrs Jones
SEND Governor: Mrs Patel → linked to SENCO: Mrs Jones
H&S Governor: Mr Davis → linked to H&S Lead: Mr Williams
Finance Governor: Mrs Chen → linked to Bursar: Mr Ahmed
```

### 5.2 Assigning From Within a Module

Any module can assign connectors contextually:

```typescript
// In Estates, when setting up a building zone:
<ConnectorAssignmentWidget
  connectorType="fire-marshal"
  scope="Block B"
  scopeType="building"
  module="estates"
  onAssign={(staffId) => createStaffConnector(staffId, 'fire-marshal', 'Block B')}
/>

// In SEND Hub, the SENCO field:
<ConnectorAssignmentWidget
  connectorType="senco"
  scope="whole school"
  scopeType="whole_school"
  module="send"
  onAssign={(staffId) => createStaffConnector(staffId, 'senco', 'whole school')}
/>
```

The widget is shared across modules — same component, same data, different context.

---

## 6. Change Management — The Leaving Staff Flow

### 6.1 Trigger

When HR marks a staff member as leaving (end date set in Staff Directory):

```
HR sets end_date on staff record
    ↓
System queries: SELECT * FROM staff_connectors WHERE staff_id = ? AND status = 'active'
    ↓
If connectors found → generate impact report
    ↓
Notify: headteacher, line manager, and module leads
```

### 6.2 Impact Report

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  STAFF CHANGE IMPACT REPORT                                │
│                                                                 │
│  Mrs Jones is leaving on 31 July 2026                          │
│                                                                 │
│  She holds 5 active connectors:                                │
│                                                                 │
│  ❌ CRITICAL — Must be reassigned before leaving date           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ DSL (Primary)                                           │   │
│  │ Statutory requirement: KCSIE 2025                       │   │
│  │ Impact: School cannot operate without a DSL              │   │
│  │ Current deputy: Mr Smith (trained, cert current)         │   │
│  │ Suggestion: Promote Mr Smith to Primary DSL              │   │
│  │                                         [Reassign Now]   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ SENCO (Primary)                                         │   │
│  │ Statutory requirement: SEND Code of Practice 2015       │   │
│  │ Impact: 14 EHCP pupils, 8 SEN Support reviews due      │   │
│  │         3 annual reviews scheduled before end date       │   │
│  │         Finance: £43,200 SEND income managed by SENCO   │   │
│  │ Current deputy: Miss Williams (not NASENCo qualified)    │   │
│  │ Suggestion: Miss Williams can act as interim but needs   │   │
│  │             NASENCo enrolment within 3 years             │   │
│  │                                         [Reassign Now]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ IMPORTANT — Should be reassigned                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Mental Health Lead                                      │   │
│  │ Impact: Statutory since 2025, DfE-funded training       │   │
│  │ No current deputy                                        │   │
│  │ Suggestion: Identify and train a replacement             │   │
│  │                                         [Reassign Now]   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Fire Marshal (Lead) — Block A+B                         │   │
│  │ Impact: Fire marshal coverage drops below ratio          │   │
│  │ Deputy: Mr Brown (Block C) — could cover temporarily    │   │
│  │                                         [Reassign Now]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ℹ️ OTHER — Nice to reassign                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Catering Contract Manager                               │   │
│  │ Impact: Quarterly review meeting due in 6 weeks          │   │
│  │         Contractor contact: Sodexo (Jane Smith)          │   │
│  │                                         [Reassign Now]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TASKS THAT WILL BECOME UNOWNED (23 tasks)                     │
│  - 12 recurring compliance tasks                                │
│  - 6 SEND-related tasks (EHCP reviews, referrals)              │
│  - 3 meeting follow-up actions                                  │
│  - 2 contract management tasks                                  │
│                                                                 │
│  [View All Tasks]  [Bulk Reassign]  [Generate Handover Report]  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 One-Click Transfer

When "Reassign Now" is clicked:

1. The connector transfers to the new person
2. All associated recurring tasks transfer
3. Calendar events transfer
4. Module references update (Estates now shows Mr Smith as fire marshal)
5. Change is logged in `connector_change_log`
6. Both staff members are notified
7. A handover checklist is generated (what the old holder needs to brief the new one on)

### 6.4 Bulk Reassign

For staff holding many connectors:

```
BULK REASSIGN: Mrs Jones's Connectors
──────────────────────────────────────

DSL (Primary)           → [Mr Smith ▼]      (Deputy DSL, trained)
SENCO (Primary)         → [Miss Williams ▼]  (Deputy SENCO)
Mental Health Lead      → [Select staff ▼]   (needs training)
Fire Marshal (Block A+B)→ [Mr Brown ▼]       (existing Fire Marshal Block C)
Catering Contract Mgr   → [Select staff ▼]

                    [Transfer All]  [Cancel]
```

---

## 7. Ratio Monitoring

### 7.1 Real-Time Ratio Checks

For ratio-based connectors, the system continuously monitors:

```typescript
interface RatioCheck {
  connectorType: string;
  required: number;          // Calculated from ratio + denominator count
  current: number;           // Active holders
  status: 'compliant' | 'at_threshold' | 'non_compliant';
  denominator_count: number; // e.g. pupil count, staff count
  detail: string;            // Human-readable explanation
}

// Example output:
{
  connectorType: "First Aider",
  required: 3,               // 312 pupils ÷ 100 = 3.12, rounded up
  current: 3,
  status: "at_threshold",
  denominator_count: 312,
  detail: "3 first aiders for 312 pupils (1:104). At minimum threshold. " +
          "Mrs Jones's certificate expires 28 March — will drop to 2 (1:156, NON-COMPLIANT)."
}
```

### 7.2 Predictive Alerts

The system looks ahead:
- Training expiry within 90 days → amber alert
- Staff leaving within 60 days with ratio-affecting connector → red alert
- Pupil count increase (from census data) pushing ratio threshold → amber alert

---

## 8. Task Auto-Generation

### 8.1 How Connector Tasks Are Created

When a connector is assigned, the system reads the `auto_tasks` from the connector type definition and creates task instances:

```typescript
// Connector type definition includes:
{
  name: "Fire Marshal (Lead)",
  auto_tasks: [
    {
      name: "Weekly fire alarm test",
      description: "Test the fire alarm system and record the result in the fire log book",
      frequency: "weekly",
      day: "friday",
      module: "estates",
      compliance_link: "fire-safety"
    },
    {
      name: "Termly fire drill",
      description: "Conduct a fire drill, record evacuation time, identify issues, " +
        "brief staff on findings. Must cover different scenarios across the year.",
      frequency: "termly",
      module: "estates",
      compliance_link: "fire-safety"
    },
    {
      name: "Annual fire risk assessment review",
      description: "Review and update the fire risk assessment. Consider changes to " +
        "building layout, occupancy, processes, and findings from drills.",
      frequency: "yearly",
      month: 9,  // September — start of academic year
      module: "estates",
      compliance_link: "fire-safety"
    },
    {
      name: "Fire extinguisher check coordination",
      description: "Coordinate the annual fire extinguisher service with the contractor. " +
        "Ensure all extinguishers are tested and certificates received.",
      frequency: "yearly",
      module: "estates",
      compliance_link: "fire-safety"
    }
  ]
}
```

### 8.2 Task Lifecycle

```
Connector assigned
    ↓
Auto-tasks created with first due dates calculated
    ↓
7 days before due → reminder notification
    ↓
Due date → task appears as "due" on homepage
    ↓
Completed → evidence/notes captured → next occurrence auto-scheduled
    ↓
Not completed by due date → status = "overdue" → escalation notification
    ↓
Still overdue after 7 days → line manager notified
    ↓
Still overdue after 14 days → headteacher notified
```

### 8.3 Calendar Integration

Tasks with specific dates create calendar events:
- Fire drill → calendar event with all-staff notification
- Contractor visit → calendar event with contractor contact
- EHCP review → calendar event with parent + professional invitations
- Contract review meeting → calendar event with supplier contact

Ed AI can manage this: "Schedule the fire drill for Thursday 2pm" → creates the calendar event, updates the task, sends notifications.

---

## 9. Contract Manager Connector

A special connector type for managing external contracts:

```sql
-- When a contract is created in the system, it can have a connector
-- linking a staff member as the contract manager

CREATE TABLE contract_connector_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  staff_connector_id uuid NOT NULL REFERENCES staff_connectors(id),

  -- Contract details
  contract_name text NOT NULL,              -- e.g. "Catering — Sodexo"
  contractor_name text,
  contractor_contact_name text,
  contractor_contact_email text,
  contractor_contact_phone text,

  -- Review schedule
  review_frequency text,                     -- 'monthly', 'quarterly', 'biannual', 'annual'
  next_review_date date,
  contract_end_date date,
  auto_renewal boolean DEFAULT false,
  notice_period_days integer,

  -- Financial
  annual_value numeric(12,2),
  budget_code text,                          -- CFR code

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

When a contract manager connector is assigned:
- Review meetings auto-schedule at the defined frequency
- Renewal/notice period deadlines create alerts
- Financial value links to the budget engine
- Ed can prompt: "Your quarterly catering review is due in 2 weeks. The last review noted concerns about portion sizes. Shall I schedule the meeting?"

---

## 10. Trust/MAT Level View

For multi-academy trusts, connectors aggregate upward:

```
TRUST OVERVIEW — Statutory Connector Compliance
────────────────────────────────────────────────

                    DSL  SENCO  First Aid  Fire Marshal  DPO  Prevent  EVC
School A            ✅    ✅     ✅ 3/3     ✅ 2/2        ✅    ✅       ✅
School B            ✅    ⚠️*    ✅ 4/4     ✅ 3/3        ✅    ✅       ✅
School C            ✅    ✅     ⚠️ 2/3**   ✅ 2/2        ✅    ✅       ❌***
School D            ✅    ✅     ✅ 3/3     ❌ 1/2****    ✅    ✅       ✅

* SENCO training expired 3 months ago — renewal not booked
** First aider cert expires next week — replacement not trained
*** EVC resigned, not yet replaced
**** Fire marshal for new building wing not assigned
```

One click on any cell drills into the school's connector detail.

---

## 11. API Structure

```
GET    /api/connectors/types                    # List all connector types (statutory + org custom)
POST   /api/connectors/types                    # Create custom connector type
PATCH  /api/connectors/types/:id                # Update connector type
DELETE /api/connectors/types/:id                # Delete custom connector (not statutory)

GET    /api/connectors/staff/:staffId           # All connectors for a staff member
GET    /api/connectors/type/:typeSlug           # All staff holding a connector type
POST   /api/connectors/assign                   # Assign connector to staff
PATCH  /api/connectors/:id                      # Update assignment (training, scope, etc.)
DELETE /api/connectors/:id                      # Remove connector from staff

POST   /api/connectors/transfer                 # Transfer connector between staff
POST   /api/connectors/bulk-transfer            # Bulk transfer (leaving staff)

GET    /api/connectors/compliance               # Compliance overview (all statutory connectors)
GET    /api/connectors/ratios                   # Ratio monitoring dashboard
GET    /api/connectors/impact/:staffId          # Impact analysis for staff leaving

GET    /api/connectors/tasks                    # All tasks from connectors for current user
GET    /api/connectors/tasks/overdue            # Overdue tasks across organisation
POST   /api/connectors/tasks/:id/complete       # Mark task complete with evidence
POST   /api/connectors/tasks/:id/schedule       # Schedule/reschedule task

GET    /api/connectors/contracts                # Contract-linked connectors
```

### Ed AI Skills (6 functions)

```typescript
const CONNECTOR_SKILLS = {
  list_my_connectors: {
    description: "List all connectors/responsibilities for the current user or a named staff member",
    parameters: { staff_name: "optional" }
  },
  get_connector_holder: {
    description: "Find who holds a specific connector (e.g. 'Who is the DSL?', 'Who manages catering?')",
    parameters: { connector_name: "string" }
  },
  check_compliance: {
    description: "Check statutory connector compliance — ratios, training expiry, vacancies",
    parameters: { category: "optional — safeguarding, health_safety, send, all" }
  },
  get_leaving_impact: {
    description: "Analyse impact of a staff member leaving — connectors, tasks, ratios affected",
    parameters: { staff_name: "string" }
  },
  get_overdue_tasks: {
    description: "List overdue tasks from connector responsibilities",
    parameters: { staff_name: "optional", module: "optional" }
  },
  schedule_task: {
    description: "Schedule or reschedule a connector task (fire drill, review meeting, etc.)",
    parameters: { task_description: "string", date: "string", time: "optional" }
  }
};
```

---

## 12. UI Design Requirements

### 12.1 Visual Language

Connectors should feel **lightweight but important**. Design cues:

- **Connector badges**: Small pill-shaped badges with category-coloured left border
  - Safeguarding: Red
  - Health & Safety: Amber
  - SEND: Blue
  - Data/Governance: Purple
  - Curriculum: Green
  - Custom: Gray

- **Staff profile connector section**: Horizontal card layout, each connector is a mini-card showing name, scope, training status, and task count

- **Module connector widget**: Compact list with avatars, shown at the top of relevant module pages

### 12.2 Animations (Framer Motion)

- **Connector assignment**: Card slides in from right with spring animation
- **Connector transfer**: Card animates from old person's profile to new person's (shared layout animation)
- **Task completion**: Checkbox + confetti micro-animation, card slides out
- **Compliance status change**: Number counters animate (count-up/count-down)
- **Impact report reveal**: Cascade animation — critical items first, then important, then other
- **Ratio gauge**: Animated circular gauge that fills/depletes smoothly
- **Training expiry countdown**: Animated progress bar that changes colour as expiry approaches

### 12.3 Dashboard Graphs (Recharts)

- **Connector coverage radar chart**: Shows coverage across all statutory categories
- **Training expiry timeline**: Gantt-style chart showing when each person's training expires
- **Task completion rate**: Area chart showing completed vs overdue tasks over time
- **Ratio monitoring gauges**: Circular gauges for each ratio-based connector
- **Trust heatmap**: Grid showing compliance status across all schools (for MATs)

### 12.4 Responsive Design

- **Desktop**: Full dashboard with side-by-side panels
- **Tablet**: Stacked cards with collapsible sections
- **Mobile**: Single-column, swipeable connector cards, quick-action buttons for task completion

---

## 13. Implementation Priority

### Phase 1 — Foundation
1. Database tables and migrations
2. Connector types seed data (all statutory connectors)
3. Staff connector CRUD API
4. Staff profile connector section (view + assign)
5. Basic compliance overview page

### Phase 2 — Active Engine
6. Auto-task generation from connector definitions
7. Homepage responsibility dashboard
8. Task completion workflow with evidence capture
9. Training expiry monitoring and alerts
10. Ratio monitoring

### Phase 3 — Change Management
11. Leaving staff impact analysis
12. One-click and bulk transfer workflows
13. Handover report generation
14. Change audit log

### Phase 4 — Cross-Module Integration
15. Estates module connector widget (fire marshals, H&S, key holders)
16. SEND Hub connector widget (SENCO, LAC teacher, mental health lead)
17. Compliance module statutory roles dashboard
18. Governance module governor link roles
19. Meetings module auto-attendee suggestions

### Phase 5 — Intelligence
20. Ed AI skill integration (6 skills)
21. Trust/MAT aggregate view
22. Contract manager connector type + review scheduling
23. Predictive alerts (expiry forecasting, ratio risk)
24. Calendar agent integration

---

## 14. Relationship to Other Specifications

| Document | Relationship |
|----------|-------------|
| `docs/modules/sen-funding/CROSS_MODULE_INTEGRATION.md` | SEND Hub references SENCO connector; staff allocation to pupils uses `staff_connectors` |
| `docs/modules/sen-funding/PRODUCT_SPEC.md` | SEN register links to staff via connectors for provision costing |
| `docs/COMMERCIAL_ARCHITECTURE.md` | Connector features gated by subscription tier |
| `docs/DESIGN_SYSTEM.md` | Connector badges follow origami design system; animations use framer-motion |
| Staff Directory (`/dashboard/hr/people`) | Connectors extend existing staff profiles — not a separate system |
| Estates Compliance | Fire marshal, H&S lead connectors surface in estates module |
| Compliance Module | All statutory connectors feed into compliance dashboard |
| Meetings Module | Connectors determine auto-invite lists for meetings |
| Governance Module | Governor link roles reference staff connectors |
| Finance Module | Contract manager connectors link to budget lines |

---

## 15. Key Design Principles

1. **One source of truth**: A connector is assigned once, surfaces everywhere
2. **Active, not passive**: Connectors carry tasks, not just labels
3. **Change-safe**: Leaving staff triggers automatic impact analysis
4. **Module-agnostic assignment**: Assign from staff profile OR from within any module
5. **Statutory by default**: Platform knows what's required; schools can add custom
6. **Progressive disclosure**: Homepage shows your tasks; drill down for details
7. **Audit-ready**: Every change is logged with who, what, when, why
