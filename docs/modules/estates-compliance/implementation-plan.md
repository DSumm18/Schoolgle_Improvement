# Estates Compliance Module - Implementation Plan

**Module:** Estates Compliance
**Date:** 2026-01-23
**Purpose:** Practical implementation plan for building the Estates Compliance module on existing Schoolgle infrastructure

---

## Executive Summary

The Estates Compliance module will be built as a set of independent but linked modules, following the federated monorepo approach. It builds on existing Supabase infrastructure, authentication system, and organizational patterns.

**Key Principles:**
1. **Independent but Linked:** Each compliance domain is an independent module that links to shared infrastructure
2. **Build on What We Have:** Leverage existing patterns (organization_id, RLS, SOPs, evidence, actions)
3. **Mobile-First:** Native mobile app experience with offline mode
4. **AI-Expert Layer:** Ed provides guidance and validation throughout
5. **MVP Focus:** Legionella as pilot domain, then expand

---

## Architecture Overview

```
Schoolgle Platform
│
├── apps/
│   └── platform/          # Main Next.js app
│       ├── app/
│       │   ├── (dashboard)/
│       │   │   └── estates-compliance/    # NEW: Estates Compliance routes
│       │   │       ├── dashboard/         # RAG status overview
│       │   │       ├── tasks/             # My tasks list
│       │   │       ├── assets/            # Shared asset register
│       │   │       ├── contractors/       # Contractor register
│       │   │       ├── helpdesk/          # Unified ticket system
│       │   │       ├── legionella/        # Domain module
│       │   │       ├── fire/              # Domain module
│       │   │       ├── asbestos/          # Domain module
│       │   │       └── reports/           # Governor reporting
│       │   └── api/
│       │       └── estates/               # API routes
│       └── components/
│           └── estates-compliance/        # Domain components
│
├── packages/
│   ├── skills-estates-compliance/         # NEW: AI skill packages
│   │   ├── skill-legionella/
│   │   ├── skill-fire-safety/
│   │   ├── skill-asbestos/
│   │   └── shared-skills/
│   │       ├── skill-compliance-basics/
│   │       └── skill-contractor-management/
│   │
│   └── ed-backend/                        # Existing: Extend for estates
│       └── compliance/                    # NEW: Compliance logic
│
└── docs/
    └── modules/estates-compliance/        # Module docs
```

---

## Module Structure (Based on Every Compliance)

### Shared Modules (Used by All Compliance Domains)

| Module | Purpose | Links To | Status |
|--------|---------|----------|--------|
| **Assets** | Asset register (equipment, buildings, outlets) | All domains, Tasks, Helpdesk | NEW |
| **Contractors** | Contractor & contract register | Tasks, Documents, Helpdesk | NEW |
| **Helpdesk** | Unified ticket system | All modules, Assets, Contractors | NEW |
| **Calendar** | Task scheduling, reminders | All domains, Tasks | NEW |
| **Documents** | Certificate storage, evidence | All domains, Contractors | NEW |
| **Reports** | Governor reporting, exports | All domains | NEW |

### Domain-Specific Modules (Independent)

| Module | Purpose | MVP Phase | Status |
|--------|---------|-----------|--------|
| **Legionella** | Weekly flush, monthly inspection, temperature monitoring | Phase 1 | NEW |
| **Fire Safety** | Weekly alarm test, monthly checks, annual servicing | Phase 2 | TODO |
| **Asbestos** | Register, inspections, management plan | Phase 2 | TODO |
| **Electrical** | Visual inspection, fixed wire testing, PAT | Phase 3 | TODO |
| **Mechanical** | Gas safety, TM44, boiler service | Phase 3 | TODO |
| **Water Quality** | Drinking water testing, tank cleaning | Phase 3 | TODO |
| **Lift/LOLER** | Lift inspections, LOLER equipment | Phase 4 | TODO |
| **Playground** | Equipment inspections, surface testing | Phase 4 | TODO |
| **Accessibility** | PEEPs, access audits, equipment checks | Phase 4 | TODO |

---

## Database Schema (Building on Existing)

### New Tables Required

```sql
-- ============================================================
-- ASSETS (Shared)
-- ============================================================
CREATE TABLE estates_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Classification
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'building', 'room', 'outlet', 'equipment',
    'fire_extinguisher', 'emergency_light', 'lift',
    'playground_equipment', 'accessibility_equipment'
  )),
  category TEXT,  -- e.g., 'cold_water_tap', 'shower', 'calorifier'
  subcategory TEXT,

  -- Identification
  name TEXT NOT NULL,
  code TEXT,  -- Unique asset code
  qr_code TEXT,  -- URL for scanning
  barcode TEXT,

  -- Location
  building TEXT,
  floor TEXT,
  room TEXT,

  -- Links
  linked_asset_id UUID REFERENCES estates_assets(id),  -- Parent asset

  -- Metadata
  installation_date DATE,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  specifications JSONB,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'inactive', 'disposed', 'under_repair'
  )),

  -- Compliance domains using this asset
  compliance_domains TEXT[] DEFAULT '{}',  -- ['legionella', 'fire']

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTRACTORS (Shared)
-- ============================================================
CREATE TABLE estates_contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Company details
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,

  -- Services offered
  services JSONB DEFAULT '[]',  -- [{service_type, description}]

  -- Accreditations
  accreditations JSONB DEFAULT '[]',  -- [{type, number, expiry_date}]
  -- Types: 'gas_safe', 'niceic', 'legionella_control_association', etc.

  -- Insurance
  insurance_certificates JSONB DEFAULT '[]',  -- [{type, expiry_date, document_url}]

  -- Safeguarding
  safeguarding_docs JSONB DEFAULT '[]',  -- [{type, expiry_date, document_url}]
  -- Types: 'dbs_check', 'safeguarding_policy', 'insurance'

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'restricted')),
  preferred BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTRACTS (Shared)
-- ============================================================
CREATE TABLE estates_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES estates_contractors(id),

  -- Contract details
  title TEXT NOT NULL,
  description TEXT,
  contract_type TEXT NOT NULL,  -- 'maintenance', 'service', 'inspection'

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE,
  notice_period_days INTEGER DEFAULT 30,

  -- Service levels
  sla JSONB,  -- {response_time_hours, attendance_window: [], required_certifications: []}

  -- Financials
  annual_cost NUMERIC(10,2),
  billing_frequency TEXT,  -- 'monthly', 'quarterly', 'annually'

  -- Assets covered
  asset_ids UUID[] DEFAULT '{}',

  -- Compliance domains
  compliance_domains TEXT[] DEFAULT '{}',

  -- Documents
  contract_document_url TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'expired', 'terminated')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS (Shared - Extended from existing actions table)
-- ============================================================
-- Can extend existing 'actions' table or create separate
CREATE TABLE estates_compliance_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Task classification
  task_type TEXT NOT NULL,  -- 'weekly_flush', 'monthly_inspection', 'annual_review'
  compliance_domain TEXT NOT NULL,  -- 'legionella', 'fire', 'asbestos'

  -- Scheduling
  scheduled_for DATE NOT NULL,
  due_by DATE NOT NULL,
  frequency TEXT NOT NULL,  -- 'weekly', 'monthly', 'quarterly', 'annual'

  -- Assignment
  task_source TEXT NOT NULL CHECK (task_source IN ('internal', 'external')),
  assigned_to UUID REFERENCES auth.users(id),  -- Internal tasks
  assigned_contractor_id UUID REFERENCES estates_contractors(id),  -- External tasks

  -- Asset/task details
  asset_id UUID REFERENCES estates_assets(id),
  location_details JSONB,
  checklist JSONB DEFAULT '[]',  -- Steps to complete

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'awaiting_contractor',
    'completed', 'overdue', 'skipped'
  )),

  -- Authorization (for internal tasks)
  delegator_id UUID REFERENCES auth.users(id),  -- Who delegated this task
  qualification_required TEXT,  -- If specific qualification needed

  -- External task appointment (for contractor tasks)
  appointment_scheduled_for TIMESTAMPTZ,
  appointment_window_start TIMESTAMPTZ,
  appointment_window_end TIMESTAMPTZ,
  appointment_notes TEXT,

  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  completion_notes TEXT,

  -- Evidence
  evidence_ids UUID[] DEFAULT '{}',  -- Links to evidence_items table
  photo_urls TEXT[] DEFAULT '{}',

  -- Findings (for compliance checks)
  findings JSONB DEFAULT '[]',  -- [{severity, description, action_required}]
  overall_compliance_status TEXT,  -- 'compliant', 'non_compliant', 'action_required'

  -- AI processing
  ai_processed BOOLEAN DEFAULT false,
  ai_insights JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HELPDESK TICKETS (Shared - Unified across ALL modules)
-- ============================================================
CREATE TABLE estates_helpdesk_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Ticket identification
  ticket_number TEXT UNIQUE NOT NULL,  -- EST-00001

  -- Classification
  module TEXT NOT NULL CHECK (module IN (
    'estates', 'hr', 'finance', 'teaching_learning', 'safeguarding'
  )),
  category TEXT NOT NULL,  -- 'maintenance', 'repair', 'query'
  subcategory TEXT,

  -- Priority
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  -- Details
  title TEXT NOT NULL,
  description TEXT,

  -- Links
  asset_id UUID REFERENCES estates_assets(id),
  task_id UUID REFERENCES estates_compliance_tasks(id),
  contractor_id UUID REFERENCES estates_contractors(id),

  -- People
  raised_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_contractor_id UUID REFERENCES estates_contractors(id),

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'assigned', 'in_progress', 'awaiting_parts',
    'resolved', 'closed', 'reopened'
  )),

  -- SLA
  sla_target TIMESTAMPTZ,
  sla_met BOOLEAN,

  -- Email integration
  email_from TEXT,
  email_subject TEXT,
  email_body TEXT,

  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- Satisfaction
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEGIONELLA (Domain-Specific)
-- ============================================================
CREATE TABLE estates_legionella_outlets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES estates_assets(id),

  -- Outlet type
  outlet_type TEXT NOT NULL CHECK (outlet_type IN (
    'cold_water_tap', 'hot_water_tap', 'shower',
    'thermostatic_mixer_valve', 'cold_water_tank',
    'calorifier', 'other'
  )),

  -- Risk assessment
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),

  -- Monitoring requirements
  weekly_flush_required BOOLEAN DEFAULT true,
  monthly_inspection_required BOOLEAN DEFAULT true,
  temperature_monitoring BOOLEAN DEFAULT true,

  -- Last completed
  last_flushed_at TIMESTAMPTZ,
  last_inspected_at TIMESTAMPTZ,
  last_temperature_reading JSONB,  -- {cold: 18, hot: 55, unit: 'celsius', at: timestamp}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUALIFICATIONS (For authorization tracking)
-- ============================================================
CREATE TABLE estates_user_qualifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Qualification details
  qualification_type TEXT NOT NULL,  -- 'legionella_responsible_person', 'gas_safe', etc.
  qualification_name TEXT NOT NULL,

  -- Certificate
  certificate_number TEXT,
  issuing_body TEXT,
  issued_date DATE,
  expiry_date DATE,

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  evidence_id UUID REFERENCES evidence_items(id),  -- Certificate upload

  -- Scope
  scope JSONB,  -- Any limitations or specializations

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, qualification_type, certificate_number)
);

-- ============================================================
-- RESPONSIBILITIES (Delegation tracking)
-- ============================================================
CREATE TABLE estates_delegations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Delegation chain
  delegator_id UUID NOT NULL REFERENCES auth.users(id),
  delegate_id UUID NOT NULL REFERENCES auth.users(id),

  -- Scope
  compliance_domain TEXT,  -- 'legionella', null for all
  task_types TEXT[] DEFAULT '{}',  -- ['weekly_flush', 'temperature_recording']

  -- Constraints
  valid_from DATE NOT NULL,
  valid_until DATE,
  conditions TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(delegator_id, delegate_id, compliance_domain, valid_from)
);
```

---

## Integration with Existing Tables

### Extend Existing Tables

```sql
-- Add compliance role to organization_members
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS compliance_role TEXT;
-- Values: 'responsible_person', 'duty_holder', 'appointed_person', 'staff'

-- Add compliance stats to organizations
ALTER TABLE organizations ADD COLUMN COLUMN IF NOT EXISTS compliance_rag_status TEXT DEFAULT 'green';
ALTER TABLE organizations ADD COLUMN COLUMN IF NOT EXISTS compliance_last_review DATE;

-- Link existing actions table to compliance tasks
ALTER TABLE actions ADD COLUMN IF NOT EXISTS compliance_task_id UUID REFERENCES estates_compliance_tasks(id);
```

### Reuse Existing Patterns

| Existing Feature | Estates Compliance Usage |
|-----------------|--------------------------|
| `organization_members` | Role-based access, compliance roles |
| `evidence_items` | Certificate storage, photo evidence |
| `timeline_entries` | Compliance audit trail |
| `sop_templates` | Compliance procedure templates |
| `sop_runs` | Compliance check execution |
| `notifications` | Task reminders, deadline alerts |
| `audit_log` | Compliance audit trail |
| `storage.buckets` | Document storage for certificates |

---

## Development Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Core shared infrastructure

**Tasks:**
1. Database migrations
   - [ ] Create estates_assets table
   - [ ] Create estates_contractors table
   - [ ] Create estates_contracts table
   - [ ] Create estates_compliance_tasks table
   - [ ] Create estates_helpdesk_tickets table
   - [ ] Create estates_user_qualifications table
   - [ ] Create estates_delegations table
   - [ ] Extend organization_members with compliance_role
   - [ ] Create storage bucket for certificates

2. Shared UI components
   - [ ] Asset register component
   - [ ] Contractor register component
   - [ ] Task list component
   - [ ] Task creation modal
   - [ ] Helpdesk ticket form
   - [ ] Helpdesk ticket list
   - [ ] Calendar view
   - [ ] RAG status indicator

3. Backend services
   - [ ] Asset service (CRUD)
   - [ ] Contractor service (CRUD)
   - [ ] Task service (CRUD, scheduling)
   - [ ] Qualification service (authorization checks)
   - [ ] Delegation service
   - [ ] Helpdesk service
   - [ ] Notification service integration

4. Authentication & Authorization
   - [ ] Compliance role middleware
   - [ ] Qualification check middleware
   - [ ] Delegation validation

**Deliverables:**
- Shared infrastructure ready for domain modules
- Asset register functional
- Contractor register functional
- Helpdesk functional (unified)
- Task scheduling framework

---

### Phase 2: Legionella MVP (Week 3-4)

**Goal:** First working domain module with AI skills

**Tasks:**
1. Database (Domain)
   - [ ] Create estates_legionella_outlets table
   - [ ] Seed example outlets
   - [ ] Create legionella task templates

2. Legionella UI
   - [ ] Outlet registration form
   - [ ] Outlet list with QR codes
   - [ ] Weekly flush flow (mobile-first)
   - [ ] Monthly inspection flow (contractor)
   - [ ] Temperature recording form
   - [ ] Risk assessment form
   - [ ] Compliance dashboard (RAG)

3. AI Skills Package
   - [ ] Create `skill-legionella` package
   - [ ] Implement MCP tools:
     - `check_flush_requirement` (7+ day rule)
     - `validate_temperature` (cold <20°C, hot >50°C)
     - `check_authorization` (delegation, qualification)
     - `create_finding` (out of range reading)
   - [ ] Knowledge pack (HSE L8 requirements)
   - [ ] Conversation flows:
     - Weekly flush intake
     - Monthly inspection intake
     - Temperature finding handling

4. Integrations
   - [ ] Task scheduling (weekly flush)
   - [ ] Contractor booking (monthly inspection)
   - [ ] Certificate upload (contractor reports)
   - [ ] AI processing (findings detection)
   - [ ] Helpdesk integration (create ticket from finding)
   - [ ] Notification reminders

5. Mobile App (Native)
   - [ ] React Native setup
   - [ ] Auth integration
   - [ ] Offline mode (queue tasks)
   - [ ] Camera integration (photo evidence)
   - [ ] QR/barcode scanner
   - [ ] Voice input (Edwina)

**Deliverables:**
- Working Legionella module
- Weekly flush mobile flow
- Monthly inspection contractor workflow
- Ed AI guidance throughout
- Native mobile app (iOS/Android)
- Governor reporting

---

### Phase 3: Fire Safety (Week 5-6)

**Goal:** Second domain module (reuse patterns)

**Tasks:**
1. Database
   - [ ] Create estates_fire_equipment table
   - [ ] Create estates_fire_logbook table
   - [ ] Seed task templates

2. Fire Safety UI
   - [ ] Equipment register (extinguishers, alarms, lights)
   - [ ] Weekly alarm test flow
   - [ ] Monthly equipment check flow
   - [ ] Emergency lighting test flow
   - [ ] Fire drill logging
   - [ ] Fire risk assessment

3. AI Skills Package
   - [ ] Create `skill-fire-safety` package
   - [ ] MCP tools for fire safety validation
   - [ ] Knowledge pack (RRO 2005, BS5839)

4. Extend Mobile App
   - [ ] Fire safety workflows
   - [ ] Equipment scanning

**Deliverables:**
- Working Fire Safety module
- Fire logbook functionality
- Print/export for physical logbook

---

### Phase 4: Additional Domains (Week 7+)

**Sequence:**
1. Asbestos Management
2. Electrical Safety
3. Mechanical (Gas Safety)
4. Water Quality
5. Lift/LOLER
6. Playground Safety
7. Accessibility

**Each domain follows same pattern:**
1. Database tables
2. UI components
3. AI skills package
4. Mobile app extension

---

## File Structure

### Routes

```
apps/platform/src/app/(dashboard)/estates-compliance/
├── page.tsx                          # Dashboard (RAG overview)
├── layout.tsx                        # Module layout
│
├── dashboard/
│   ├── page.tsx                      # Main dashboard
│   └── components/
│       ├── ComplianceStatusCard.tsx
│       ├── UpcomingTasksList.tsx
│       ├── OverdueItemsAlert.tsx
│       └── FindingsFeed.tsx
│
├── tasks/
│   ├── page.tsx                      # My tasks
│   └── [id]/
│       ├── page.tsx                  # Task detail
│       └── complete/page.tsx         # Task completion flow
│
├── assets/
│   ├── page.tsx                      # Asset register
│   ├── new/page.tsx                  # Add asset
│   └── [id]/
│       └── page.tsx                  # Asset detail
│
├── contractors/
│   ├── page.tsx                      # Contractor register
│   ├── new/page.tsx                  # Add contractor
│   └── [id]/
│       ├── page.tsx                  # Contractor detail
│       └── contracts/page.tsx        # Contracts
│
├── helpdesk/
│   ├── page.tsx                      # Ticket list
│   ├── new/page.tsx                  # New ticket
│   └── [id]/
│       └── page.tsx                  # Ticket detail
│
├── legionella/
│   ├── page.tsx                      # Domain overview
│   ├── outlets/
│   │   ├── page.tsx                  # Outlet list
│   │   ├── new/page.tsx              # Add outlet
│   │   └── [id]/
│   │       └── page.tsx              # Outlet detail
│   ├── flush/
│   │   └── [id]/page.tsx             # Weekly flush flow
│   ├── inspection/
│   │   └── [id]/page.tsx             # Monthly inspection
│   └── reports/page.tsx              # Compliance reports
│
├── fire/
│   ├── page.tsx                      # Domain overview
│   └── ...                           # Similar structure
│
└── reports/
    └── governors/page.tsx            # One-click governor reports
```

### Components

```
apps/platform/src/components/estates-compliance/
├── shared/                            # Shared components
│   ├── AssetCard.tsx
│   ├── AssetRegister.tsx
│   ├── ContractorCard.tsx
│   ├── TaskCard.tsx
│   ├── TaskList.tsx
│   ├── HelpdeskTicketForm.tsx
│   ├── RAGStatusBadge.tsx
│   ├── CalendarView.tsx
│   └── ComplianceDashboard.tsx
│
├── legionella/                        # Domain-specific
│   ├── OutletCard.tsx
│   ├── FlushFlow.tsx                 # Weekly flush wizard
│   ├── InspectionFlow.tsx            # Monthly inspection
│   ├── TemperatureInput.tsx          # With validation
│   ├── QRCodeScanner.tsx
│   └── ComplianceReports.tsx
│
└── fire/                              # Domain-specific
    ├── EquipmentCard.tsx
    ├── AlarmTestFlow.tsx
    └── FireLogbook.tsx
```

### Services

```
apps/platform/src/lib/estates-compliance/
├── database/
│   ├── assets.ts
│   ├── contractors.ts
│   ├── contracts.ts
│   ├── tasks.ts
│   ├── qualifications.ts
│   ├── delegations.ts
│   └── helpdesk.ts
│
├── services/
│   ├── AssetService.ts
│   ├── ContractorService.ts
│   ├── TaskService.ts
│   ├── QualificationService.ts
│   ├── DelegationService.ts
│   ├── HelpdeskService.ts
│   └── SchedulingService.ts
│
├── authorization/
│   ├── compliance-middleware.ts
│   ├── qualification-check.ts
│   └── delegation-check.ts
│
└── integrations/
    ├── notification-service.ts
    ├── ai-processor.ts
    └── certificate-storage.ts
```

### AI Skills Packages

```
packages/skills-estates-compliance/
├── skill-legionella/
│   ├── package.json
│   ├── mcp-tools.ts                  # MCP tool implementations
│   ├── knowledge-pack.ts             # HSE L8 requirements
│   ├── conversation-flows.ts         # User interaction flows
│   └── validation-rules.ts           # Business logic
│
├── skill-fire-safety/
│   └── ...                           # Similar structure
│
├── skill-asbestos/
│   └── ...
│
└── shared-skills/
    ├── skill-compliance-basics/
    │   └── ...
    └── skill-contractor-management/
        └── ...
```

### Mobile App

```
apps/estates-mobile/                  # React Native app
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── TasksListScreen.tsx
│   │   ├── TaskDetailScreen.tsx
│   │   ├── FlushFlowScreen.tsx
│   │   └── ScanQRScreen.tsx
│   │
│   ├── components/
│   │   ├── TaskCard.tsx
│   │   ├── TemperatureInput.tsx
│   │   └── CameraCapture.tsx
│   │
│   ├── services/
│   │   ├── offline-queue.ts
│   │   ├── sync-service.ts
│   │   └── api-client.ts
│   │
│   └── navigation/
│       └── AppNavigator.tsx
```

---

## User Workflows

### Workflow 1: Site Manager - Weekly Legionella Flush

```
1. Mobile notification: "3 outlets need flushing today"
2. Opens app, sees task list
3. Taps "Classroom 1 Sink - Weekly Flush"
4. Ed appears: "Hi! I'll guide you through this weekly flush."
5. Ed: "This outlet was last used 10 days ago. A flush is required."
6. Ed: "You'll need to run the water for at least 5 minutes."
7. User: "OK" → Timer starts
8. User completes flush, taps "Done"
9. Ed: "Now record the temperature. Cold water should be below 20°C."
10. User enters: 18°C
11. Ed: "18°C is within limits. Who completed this flush?"
12. User: "John Smith (me)"
13. Ed: "Are you the appointed person or delegated by them?"
14. User: "Delegated by Sarah Jones"
15. Ed: "Task complete! Next flush due in 7 days."
16. Ed: "Don't forget to record this in your log book too."
```

**Behind the scenes:**
- Ed validated 7+ day rule
- Ed validated temperature <20°C
- Ed checked delegation exists
- Ed scheduled next task
- Ed logged to timeline
- Created logbook export

### Workflow 2: Business Manager - Monthly Inspection Booking

```
1. Dashboard shows: "Legionella monthly inspection due by 15th"
2. Clicks "Schedule Inspection"
3. Selects contractor: "Aqua-Trust (Preferred)"
4. Selects date: Next Tuesday 7-8am
5. Selects assets: All outlets (12)
6. Generates unique upload link: schoolgle.co.uk/estates/upload/abc123
7. Sends link to contractor via email
8. Calendar invite sent to SBM and contractor
9. Task status: "Awaiting contractor - Tuesday 7-8am"
```

**Behind the scenes:**
- Created external task in estates_compliance_tasks
- Linked to contract
- Generated secure upload link
- Sent calendar invite
- Set reminder for day before
- Created helpdesk ticket if needed

### Workflow 3: Contractor - Document Upload

```
1. Contractor receives email with link
2. Clicks link, opens secure upload page
3. Uploads: PDF inspection report, temperature readings, findings
4. Submits
5. AI processes document:
   - Extracts temperature readings
   - Identifies findings (e.g., "high temperature at outlet 3")
   - Creates findings in system
   - Updates asset records
6. SBM notified: "Inspection complete. 1 finding requires action."
7. Helpdesk ticket auto-created for outlet 3 investigation
8. Task marked complete
9. Certificate stored in Documents
```

**Behind the scenes:**
- Document uploaded to storage
- AI extraction (Mistral OCR)
- Validation against HSE L8 limits
- Findings created
- Notifications sent
- Task completed
- Certificate linked

### Workflow 4: Unified Helpdesk

```
1. Teacher notices: "Classroom 4 window won't open"
2. Sends email: estates@schoolname.schoolgle.co.uk
3. Subject: "Window stuck - Classroom 4"
4. Body: "Can't open window, safety issue for fire exit"
5. System auto-creates ticket: EST-00123
6. Auto-categorized: "estates > maintenance > fire_safety"
7. Priority: High (fire safety keyword)
8. SBM assigned notification
9. SBM assigns to caretaker or creates contractor task
10. Resolved
11. Teacher notified: "Ticket EST-00123 resolved"
12. Satisfaction request: "Rate 1-5"
```

**Behind the scenes:**
- Email-to-ticket conversion
- AI categorization
- Priority detection
- Assignment logic
- SLA tracking
- Notification workflow

---

## API Routes

```typescript
// apps/platform/src/app/api/estates/

// Assets
GET    /api/estates/assets              # List assets
POST   /api/estates/assets              # Create asset
GET    /api/estates/assets/:id          # Get asset
PUT    /api/estates/assets/:id          # Update asset
DELETE /api/estates/assets/:id          # Delete asset

// Contractors
GET    /api/estates/contractors         # List contractors
POST   /api/estates/contractors         # Create contractor
GET    /api/estates/contractors/:id     # Get contractor
PUT    /api/estates/contractors/:id     # Update contractor
DELETE /api/estates/contractors/:id     # Delete contractor

// Tasks
GET    /api/estates/tasks               # List tasks
POST   /api/estates/tasks               # Create task
GET    /api/estates/tasks/:id           # Get task
PUT    /api/estates/tasks/:id           # Update task
POST   /api/estates/tasks/:id/complete  # Complete task
GET    /api/estates/tasks/my            # My tasks
GET    /api/estates/tasks/overdue       # Overdue tasks

// Helpdesk
POST   /api/estates/helpdesk/tickets    # Create ticket
GET    /api/estates/helpdesk/tickets    # List tickets
GET    /api/estates/helpdesk/tickets/:id # Get ticket
PUT    /api/estates/helpdesk/tickets/:id # Update ticket
POST   /api/estates/helpdesk/tickets/:id/resolve # Resolve ticket

// Legionella
GET    /api/estates/legionella/outlets  # List outlets
POST   /api/estates/legionella/outlets  # Register outlet
GET    /api/estates/legionella/outlets/:id # Get outlet
POST   /api/estates/legionella/flush    # Complete flush
POST   /api/estates/legionella/inspection # Complete inspection

// Authorization
GET    /api/estates/qualifications      # List my qualifications
POST   /api/estates/qualifications      # Add qualification
GET    /api/estates/delegations         # List my delegations
POST   /api/estates/delegations         # Create delegation

// Reports
GET    /api/estates/reports/governors   # Generate governor report
GET    /api/estates/reports/compliance  # Compliance status
GET    /api/estates/reports/logbook     # Logbook export (PDF)

// Upload (Contractor)
POST   /api/estates/upload/:token       # Contractor document upload
```

---

## Differentiators (What Makes Us Different)

### 1. Ed AI Expert Layer

**Competitors:** Record-keeping systems with limited guidance

**Schoolgle:** Always-available expert that:
- Knows the regulations inside out
- Asks the right questions
- Validates inputs with explanations
- Prevents common mistakes
- Bridges knowledge gaps

### 2. Mobile-First with Offline Mode

**Competitors:** Web-based with mobile responsive (or no app at all)

**Schoolgle:** Native mobile app that:
- Works offline (queue tasks for sync)
- Camera integration for photos
- QR/barcode scanner for assets
- Voice input (Edwina)
- Push notifications for tasks

### 3. Role-Based Authorization

**Competitors:** No qualification tracking

**Schoolgle:** Built-in authorization:
- Qualification tracking
- Delegation management
- Authorization checks before task completion
- Audit trail of who did what

### 4. Contractor Integration

**Competitors:** Manual contractor coordination

**Schoolgle:** End-to-end workflow:
- Appointment booking
- Secure document upload
- AI processing of contractor reports
- Findings auto-detection
- Integrated helpdesk

### 5. Unified Helpdesk

**Competitors:** Module-specific ticketing

**Schoolgle:** Unified across ALL modules:
- Single email address for all staff
- Auto-categorization
- SLA tracking
- Cross-module visibility

### 6. Print/Export for Logbook

**Competitors:** Digital-only (user complaint)

**Schoolgle:** Export to PDF for physical logbook:
- Fire logbook
- Water testing log
- Equipment inspection log
- Formatted for printing

### 7. One-Click Governor Reports

**Competitors:** Manual compilation

**Schoolgle:** Generate reports instantly:
- Compliance status
- Outstanding actions
- Findings summary
- Certificate status
- Audit trail

---

## MVP Feature Checklist

### Phase 1: Foundation
- [ ] Asset register (CRUD)
- [ ] Contractor register (CRUD)
- [ ] Contract register (CRUD)
- [ ] Qualification tracking
- [ ] Delegation management
- [ ] Unified helpdesk
- [ ] Task scheduling framework
- [ ] RAG status dashboard
- [ ] Notification integration
- [ ] API routes for all above

### Phase 2: Legionella MVP
- [ ] Outlet registration
- [ ] Weekly flush flow (mobile)
- [ ] Monthly inspection flow
- [ ] Temperature recording with validation
- [ ] Authorization checks
- [ ] Contractor booking
- [ ] Document upload (AI processed)
- [ ] Findings detection
- [ ] Ed AI guidance throughout
- [ ] Compliance reports
- [ ] Native mobile app
- [ ] Offline mode
- [ ] QR code generation/scanning
- [ ] Photo evidence
- [ ] Logbook export

### Phase 3: Fire Safety
- [ ] Equipment register
- [ ] Weekly alarm test flow
- [ ] Monthly equipment check
- [ ] Emergency lighting test
- [ ] Fire drill logging
- [ ] Fire logbook export

---

## Success Metrics

### User Engagement
- Daily active users (site managers, caretakers)
- Task completion rate
- Mobile app adoption
- Offline sync success rate

### Compliance
- Reduction in overdue tasks
- Improvement in RAG status
- Findings resolved within SLA
- Certificate expiry coverage

### User Satisfaction
- NPS score
- Time savings vs previous process
- User confidence in compliance
- Support ticket reduction

### Revenue
- Module subscriptions
- Mobile app downloads
- Training/onboarding revenue
- Consultant referral revenue

---

## Next Actions

1. **This Week**
   - [ ] Review and approve implementation plan
   - [ ] Create database migration for Phase 1
   - [ ] Set up project structure
   - [ ] Begin Phase 1 development

2. **Week 1**
   - [ ] Complete Phase 1 database migrations
   - [ ] Build shared UI components
   - [ ] Implement backend services

3. **Week 2**
   - [ ] Complete Phase 1
   - [ ] Start Phase 2 (Legionella)
   - [ ] Begin skill-legionella development

4. **Week 3-4**
   - [ ] Complete Legionella MVP
   - [ ] User testing
   - [ ] Mobile app beta

---

**Document Status:** Draft - Ready for Review
**Owner:** Product Team
**Last Updated:** 2026-01-23
