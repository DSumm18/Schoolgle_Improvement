# Estates Compliance - Workflows, Roles & Integration

**Module:** Estates Compliance
**Date:** 2026-01-23
**Purpose:** Detailed workflows, role-based authorization, contractor management, and system integration requirements

---

## Critical Clarifications

### Task Type Distinction

**Important:** Compliance tasks come in two very different types:

| Aspect | Internal Task | External (Contractor) Task |
|--------|---------------|---------------------------|
| **Who performs** | School staff (anyone trained) | External qualified contractor |
| **Example** | Weekly Legionella flush (turn tap on for 5 mins) | Monthly Legionella inspection (temperature checks, certification) |
| **Qualifications needed** | Basic training, delegated by responsible person | Accredited certification, insurance |
| **Risk level** | Low - routine maintenance | Higher - requires expertise |
| **Documentation** | Simple record in logbook | Formal report with findings |
| **Verification** | Self-verified | Contractor verified |
| **Cost** | No additional cost | Contracted service |

**Lesson:** The system must distinguish between these task types and apply different workflows.

---

## Role-Based Authorization System

### User Roles & Qualifications

```typescript
// User profile with role-based authorization
interface UserProfile {
  id: string;
  name: string;
  email: string;

  // School role
  role: SchoolRole;
  department: string;

  // Qualifications for compliance work
  qualifications: Qualification[];

  // Delegations (who has delegated authority to this person)
  delegations: Delegation[];

  // Responsibilities (what this person is responsible for)
  responsibilities: Responsibility[];
}

type SchoolRole =
  | 'site_manager'
  | 'caretaker'
  | 'business_manager'
  | 'school_business_leader'
  | 'headteacher'
  | 'estates_manager'
  | 'trust_estates_manager';

interface Qualification {
  id: string;
  type: QualificationType;
  title: string;
  certificate_number?: string;
  expiry_date?: Date;
  issuing_body: string;
  verified: boolean;
  verification_date?: Date;
}

type QualificationType =
  | 'legionella_responsible_person'
  | 'legionella_risk_assessor'
  | 'fire_warden'
  | 'fire_risk_assessor'
  | 'electrical_competent_person'
  | 'gas_safe_registered'
  | 'asbestos_awareness'
  | 'lolers_competent_person';

interface Delegation {
  delegated_by: string; // User ID of delegator
  delegated_to: string; // User ID of delegatee (this user)
  scope: string[]; // What they can do
  valid_from: Date;
  valid_until?: Date;
  conditions?: string;
}

interface Responsibility {
  domain: ComplianceDomain;
  role_in_domain: 'responsible_person' | 'delegated' | 'contractor_coordinator' | 'none';
  appointed_date: Date;
  appointed_by: string;
}
```

### Authorization Matrix

| Task | Responsible Person | Delegated Person | Untrained Staff | External Contractor |
|------|-------------------|------------------|-----------------|---------------------|
| **Weekly Legionella Flush** | ✅ Can do | ✅ Can do | ✅ Can do | ❌ Not needed |
| **Monthly Legionella Inspection** | ⚠️ If qualified | ❌ | ❌ | ✅ Required |
| **Annual Legionella Risk Assessment** | ❌ Requires specialist | ❌ | ❌ | ✅ Required |
| **Weekly Fire Alarm Test** | ✅ Can do | ✅ Can do | ✅ Can do | ❌ Not needed |
| **Monthly Fire Equipment Check** | ✅ Can do | ✅ Can do | ⚠️ With guidance | ✅ Can do |
| **Annual Fire Risk Assessment** | ❌ Requires qualified assessor | ❌ | ❌ | ✅ Required |

---

## Contractor Management System

### Contractor Register

```typescript
interface Contractor {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;

  // Services provided
  services: ContractorService[];

  // Compliance documentation
  accreditations: Accreditation[];
  insurance_certificates: InsuranceCertificate[];
  safeguarding_docs: SafeguardingDocument[];

  // Contract details
  contracts: Contract[];

  // Performance
  rating?: number;
  notes?: string;

  // Status
  status: 'active' | 'inactive' | 'under_review';
  preferred: boolean; // Is this the preferred contractor for this service?
}

interface ContractorService {
  domain: ComplianceDomain;
  service_type: string;
  can_perform: string[]; // List of task types they can perform
  service_area: string[]; // Geographic areas they cover
}

interface Accreditation {
  type: string; // e.g., "Gas Safe", "NICEIC", " Legionella Control Association"
  number: string;
  issued_date: Date;
  expiry_date: Date;
  document_url: string;
  verified: boolean;
}

interface InsuranceCertificate {
  type: 'public_liability' | 'employers_liability' | 'professional_indemnity';
  policy_number: string;
  insurer: string;
  cover_amount: number;
  expiry_date: Date;
  document_url: string;
}

interface SafeguardingDocument {
  type: 'dbs_check' | 'letter_of_authority' | 'safeguarding_training';
  reference_number?: string;
  issue_date: Date;
  expiry_date?: Date;
  document_url: string;
}
```

### Contract Register

```typescript
interface Contract {
  id: string;
  contractor_id: string;
  service_type: string;

  // Contract details
  contract_number: string;
  start_date: Date;
  end_date: Date;
  notice_period_days: number;
  renewal_date: Date;
  value: number;

  // SLA
  sla: {
    response_time_hours?: number;
    attendance_window: string[]; // ["06:00-08:00", "15:30-18:00"]
    cancellation_notice_hours: number;
    required_certifications: string[];
  };

  // Documents
  contract_document_url: string;
  ssa_details?: string; // School Specific Agreement details

  // Status
  status: 'active' | 'expiring_soon' | 'expired' | 'terminated';
  auto_renew: boolean;
}
```

---

## Appointment Booking System

### Booking Workflow

```typescript
interface AppointmentBooking {
  id: string;
  task_id: string; // The compliance task this appointment is for
  contractor_id: string;
  school_contact_id: string; // Who will meet them

  // Scheduled time
  scheduled_date: Date;
  start_time: string; // "15:30"
  end_time: string; // "17:00"
  duration_minutes: number;

  // Access arrangements
  access_instructions?: string;
  parking_info?: string;
  meeting_location: string; // "Reception", "Site office", etc.

  // Status
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'missed';

  // Communication
  invitation_sent: boolean;
  invitation_sent_date?: Date;
  reminder_sent: boolean;

  // Attendance
  arrived_at?: Date;
  completed_at?: Date;
  completed_by?: string; // User ID of site manager who confirmed

  // Documentation
  documentation_upload_url?: string; // Unique link for contractor
  documentation_uploaded: boolean;
  documentation_uploaded_at?: Date;
}
```

### Booking Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APPOINTMENT BOOKING WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Task Due                                                          │
│  ┌─────────────┐                                                           │
│  │ System:     │ → "Monthly Legionella inspection due in 2 weeks"        │
│  │ "Task [X]   │    → Sends email to Aqua-Trust contractor               │
│  │  is due     │    → "Book appointment for week of [date]"              │
│  │  on [date]" │    → Includes unique booking link                       │
│  └─────────────┘                                                           │
│       ↓                                                                     │
│  STEP 2: Contractor Books                                                  │
│  ┌─────────────────────────────────────┐                                   │
│  │ Contractor clicks link              │                                   │
│  │ → Sees available time slots         │                                   │
│  │ → School has blocked: 08:00-15:30  │                                   │
│  │ → Available slots:                  │                                   │
│  │   - Mon 15:30-17:00                 │                                   │
│  │   - Tue 06:30-08:00                 │                                   │
│  │   - Wed 15:30-17:00                 │                                   │
│  │ → Selects time & confirms           │                                   │
│  │ → Site manager receives notification│                                   │
│  └─────────────────────────────────────┘                                   │
│       ↓                                                                     │
│  STEP 3: Confirmation                                                    │
│  ┌─────────────────────────────────────┐                                   │
│  │ Site manager confirms appointment   │                                   │
│  │ → Calendar updated for all staff    │                                   │
│  │ → Reception receives notification   │                                   │
│  │ → Security receives notification    │                                   │
│  │ → Email reminder sent 24hrs before  │                                   │
│  └─────────────────────────────────────┘                                   │
│       ↓                                                                     │
│  STEP 4: Appointment Day                                                 │
│  ┌─────────────────────────────────────┐                                   │
│  │ Contractor arrives at reception     │                                   │
│  │ → Reception checks calendar         │                                   │
│  │ → Confirmed appointment: Yes → Allow│
│  │ → Site manager notified             │                                   │
│  │ → Site manager meets contractor     │                                   │
│  └─────────────────────────────────────┘                                   │
│       ↓                                                                     │
│  STEP 5: Task Execution & Documentation                                │
│  ┌─────────────────────────────────────┐                                   │
│  │ Contractor completes inspection     │                                   │
│  │ → Site manager triggers:            │                                   │
│  │    "Attended site - task in progress"│                                  │
│  │ → Status: "Completed - awaiting docs"│                                  │
│  │ → System sends email:               │                                   │
│  │    "Please upload documentation:"    │                                   │
│  │    [Unique link for this task]      │                                   │
│  └─────────────────────────────────────┘                                   │
│       ↓                                                                     │
│  STEP 6: Documentation Upload                                          │
│  ┌─────────────────────────────────────┐                                   │
│  │ Contractor uploads:                 │                                   │
│  │ → PDF report                        │                                   │
│  │ → Test results spreadsheet          │                                   │
│  │ → Certificate(s)                    │                                   │
│  │ → Any photos of issues              │                                   │
│  │ → Clicks "Submit"                   │                                   │
│  └─────────────────────────────────────┘                                   │
│       ↓                                                                     │
│  STEP 7: AI Processing                                                  │
│  ┌─────────────────────────────────────┐                                   │
│  │ AI analyzes documentation:          │                                   │
│  │ → Extracts readings & results       │                                   │
│  │ → Identifies any issues/findings    │                                   │
│  │ → Flags recommendations             │                                   │
│  │ → Links findings to assets          │                                   │
│  │ → Updates compliance check          │                                   │
│  │ → Creates help desk tickets if needed│                                  │
│  │ → Attaches all documentation        │                                   │
│  │ → Status: "Completed"               │                                   │
│  │ → Schedules next inspection         │                                   │
│  │ → Sends confirmation email          │                                   │
│  └─────────────────────────────────────┘                                   │
│       ↓                                                                     │
│  STEP 8: Exception Handling (If needed)                                 │
│  ┌─────────────────────────────────────┐                                   │
│  │ If AI detects issues:               │                                   │
│  │ → Creates help desk ticket          │                                   │
│  │ → Notifies site manager             │                                   │
│  │ → Flags for review if uncertain     │                                   │
│  │ → Logs for audit trail              │                                   │
│  └─────────────────────────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Time Slot Configuration

```typescript
interface SchoolTimeSlotConfig {
  school_id: string;
  // Times when contractors CANNOT attend
  blocked_times: {
    days: string[]; // ["monday", "tuesday", "wednesday", "thursday", "friday"]
    start_time: string; // "08:30"
    end_time: string; // "15:30"
    reason: string; // "School hours - children on site"
  };
  // Preferred times for contractors
  preferred_contractor_slots: {
    morning: { start: "06:00", end: "08:00" };
    afternoon: { start: "15:30", end: "18:00" };
    weekends: boolean; // Some schools allow weekend work
  };
  // Exceptions (inset days, holidays)
  exceptions: {
    date: Date;
    all_day_blocked: boolean;
    custom_slots?: Array<{ start: string; end: string }>;
  }[];
}
```

---

## Documentation Processing Workflow

### AI Document Analysis

```typescript
interface DocumentProcessingResult {
  task_id: string;
  uploaded_by: string;
  uploaded_at: Date;

  // Analysis
  findings: Finding[];
  recommendations: string[];
  issues_identified: Issue[];

  // Extracted data
  extracted_data: {
    temperatures_readings?: TemperatureReading[];
    asset_ids?: string[];
    next_inspection_date?: Date;
    certificate_number?: string;
    inspector_name?: string;
    inspector_credentials?: string;
  };

  // Status update
  status: 'completed' | 'completed_with_findings' | 'requires_review';

  // Actions taken
  actions_taken: {
    compliance_check_updated: boolean;
    tickets_created: string[]; // Ticket IDs
    next_inspection_scheduled: boolean;
    documents_attached: string[];
  };

  // If uncertain
  flags_for_review?: boolean;
  review_reason?: string;
}

interface TemperatureReading {
  asset_id: string;
  asset_name: string;
  location: string;
  type: 'cold_water' | 'hot_water_sent' | 'hot_water_dist' | 'calorifier';
  temperature_celsius: number;
  within_limits: boolean;
  recorded_at: Date;
}

interface Finding {
  severity: 'information' | 'advisory' | 'concern' | 'critical';
  category: string;
  description: string;
  asset_id?: string;
  recommendation: string;
  urgency: 'immediate' | 'within_7_days' | 'within_30_days' | 'at_next_review';
}

interface Issue {
  id: string;
  type: string;
  description: string;
  asset_id?: string;
  requires_action: boolean;
  suggested_actions: string[];
}
```

### Guardrails for AI Processing

```typescript
interface ProcessingGuardrails {
  // Always require human review for:
  require_review_for: {
    critical_findings: boolean; // Anything flagged as critical
    ambiguous_documentation: boolean; // Can't clearly extract data
    missing_certification: boolean; // Contractor credentials not visible
    unusual_readings: boolean; // Temperatures way outside normal range
    new_contractor: boolean; // First time using this contractor
  };

  // Automatic approval for:
  auto_approve: {
    routine_passing_results: boolean; // All readings within limits
    returning_contractor: boolean; // Used before, no issues
    clear_documentation: boolean; // PDF clearly structured
  };

  // Notification triggers
  notify_site_manager_when: {
    critical_issue_found: boolean;
    documentation_incomplete: boolean;
    contractor_not_on_register: boolean;
    certification_expired: boolean;
  };

  // Escalation
  escalate_to_business_manager_when: {
    repeated_failures: boolean; // Same asset failing 3+ times
    safety_critical: boolean;
    contractor_performance_issue: boolean;
  };
}
```

---

## Help Desk / Ticket System Architecture

### Holistic Ticket System (Cross-Module)

```typescript
interface Ticket {
  id: string;
  ticket_number: string; // e.g., "EST-2026-00123"

  // Classification
  module: Module; // 'estates', 'hr', 'finance', 'teaching_learning', etc.
  category: string; // 'legionella', 'fire', 'asbestos', 'maintenance', etc.
  sub_category?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';

  // People
  raised_by: string; // User ID
  raised_by_role: string; // Their role at time of raising
  assigned_to?: string; // User ID
  assigned_to_role?: string;
  watchers?: string[]; // Other users who need visibility

  // Details
  title: string;
  description: string;
  location?: string; // For estates tickets
  asset_id?: string; // Linked to asset register

  // Related items
  related_compliance_check?: string; // If from compliance finding
  related_contractor?: string; // If contractor-related
  related_ticket_ids?: string[]; // Connected tickets

  // Timeline
  status: TicketStatus;
  created_at: Date;
  updated_at: Date;
  due_date?: Date;
  resolved_at?: Date;
  closed_at?: Date;

  // SLA
  sla_target?: string; // e.g., "7 days"
  sla_met?: boolean;
  overdue: boolean;

  // Documentation
  attachments: Attachment[];
  notes: TicketNote[];
  email_thread?: EmailMessage[]; // If tickets created via email

  // Resolution
  resolution?: string;
  resolution_summary?: string;

  // Analytics
  source: 'web' | 'email' | 'api' | 'ai_generated' | 'compliance_finding';
  tags?: string[];
}

type TicketStatus =
  | 'new'
  | 'acknowledged'
  | 'in_progress'
  | 'pending_third_party'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'on_hold';

type Module =
  | 'estates'
  | 'hr'
  | 'finance'
  | 'teaching_learning'
  | 'safeguarding'
  | 'governance'
  | 'comms'
  | 'other';

interface TicketNote {
  id: string;
  ticket_id: string;
  added_by: string;
  added_at: Date;
  note_type: 'update' | 'question' | 'resolution' | 'internal' | 'email_forward';
  content: string;
  is_internal: boolean; // Visible to staff only or customer?
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  filename: string;
  file_type: string;
  url: string;
  uploaded_by: string;
  uploaded_at: Date;
  size_bytes: number;
}
```

### User Dashboard (Cross-Module View)

```typescript
interface UserDashboard {
  user_id: string;

  // Tickets I raised
  tickets_raised: {
    active: Ticket[];
    awaiting_my_response: Ticket[];
    resolved_this_week: Ticket[];
  };

  // Tickets assigned to me
  tickets_assigned_to_me: {
    overdue: Ticket[];
    due_today: Ticket[];
    due_this_week: Ticket[];
    all_active: Ticket[];
  };

  // Tickets I'm watching
  tickets_watching: Ticket[];

  // My compliance tasks
  my_compliance_tasks: {
    due_today: ComplianceTask[];
    due_this_week: ComplianceTask[];
    delegated_to_me: ComplianceTask[];
  };

  // My appointments (site meetings, etc.)
  my_appointments: {
    today: Appointment[];
    this_week: Appointment[];
  };

  // Notifications
  notifications: {
    urgent: Notification[];
    information: Notification[];
  };
}
```

---

## System Integration Matrix

### Connected Applications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCHOOLGLE SYSTEM INTEGRATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐         │
│  │   COMPLIANCE │◄──────►│  ASSET       │◄──────►│   CONTRACT   │         │
│  │   MODULE     │        │  REGISTER    │        │   REGISTER   │         │
│  │              │        │              │        │              │         │
│  │ - Tasks      │        │ - Assets     │        │ - Contractors│         │
│  │ - Schedules  │        │ - Location   │        │ - Accredit.  │         │
│  │ - Certs      │        │ - Status     │        │ - Insurance  │         │
│  │ - Findings   │        │ - Maintenance│        │ - Contracts  │         │
│  └──────────────┘        └──────────────┘        └──────────────┘         │
│         │                       │                       │                   │
│         └───────────────────────┴───────────────────────┘                   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         HELP DESK / TICKETS                          │  │
│  │                                                                     │  │
│  │  - Creates tickets from compliance findings                        │  │
│  │  - Links tickets to assets                                         │  │
│  │  - Assigns tickets to contractors or staff                         │  │
│  │  - Tracks resolution                                               │  │
│  │  - Audit trail                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     USER DASHBOARD (Unified)                         │  │
│  │                                                                     │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │  │
│  │ │  My     │  │  Tickets│  │  Tasks  │  │  Appts. │  │  Alerts │  │  │
│  │ │Tickets  │  │Assigned│  │  Due    │  │  Today  │  │         │  │  │
│  │ └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │  │
│  │                                                                     │  │
│  │  "All my work in one place"                                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Examples

#### Example 1: Compliance Finding Creates Ticket

```
1. Monthly Legionella inspection completed
2. AI analyzes uploaded report
3. Finds: Cold water calorifier at 28°C (limit: 20°C)
4. System:
   - Updates compliance check with finding
   - Creates ticket: "EST-2026-00123: Calorifier temperature exceeded"
   - Links to asset: "Calorifier - Boiler Room"
   - Assigns to: Site Manager
   - Sets priority: High
   - Schedules follow-up
5. Site Manager sees ticket in dashboard
6. Can raise sub-ticket to contractor
7. All tracked in one place
```

#### Example 2: Asset Maintenance Scheduling

```
1. Asset register shows: "Fire Alarm Control Panel - Main Building"
2. Asset has maintenance schedule: "Quarterly inspection required"
3. System:
   - Creates compliance task automatically
   - Identifies preferred contractor (from contract register)
   - Sends booking request
   - Puts appointment in calendar
4. When completed:
   - Documentation uploaded
   - AI processes
   - Asset status updated
   - Next maintenance scheduled
```

---

## Updated Legionella Skills Requirements

### Correct Task Understanding

**Weekly Flush (Internal Task)**
- **Who:** Anyone trained (caretaker, site manager, delegated staff)
- **What:** Turn on tap, run for 5+ minutes
- **Qualifications:** Basic training, delegated by responsible person
- **Documentation:** Simple record in logbook
- **Ed's role:**
  - Remind which outlets need flushing (unused 7+ days)
  - Confirm 5-minute duration
  - Ask who completed it (for logbook)
  - No temperature reading required (simple flow)
  - Schedule next flush

**Monthly Inspection (External Contractor)**
- **Who:** Accredited external contractor (e.g., Aqua-Trust)
- **What:** Full temperature checks, visual inspection, certification
- **Qualifications:** Legionella Control Association member, insurance
- **Documentation:** Formal report with readings, findings, recommendations
- **Ed's role:**
  - Coordinate appointment booking
  - Verify contractor is accredited
  - Process uploaded report
  - Extract readings and findings
  - Flag any issues
  - Create tickets if needed
  - Schedule next inspection
  - NOT: "How do I flush this tap?" (wrong task!)

---

## Implementation Phases (Updated)

### Phase 1: Foundation (Weeks 1-4)

**Core Systems:**
1. User profiles with role-based authorization
2. Contractor register
3. Contract register
4. Asset register (basic)
5. Help desk/ticket system (basic)
6. Appointment booking system

### Phase 2: Compliance Module (Weeks 5-8)

**Compliance Features:**
1. Task scheduling (internal vs external)
2. Appointment workflow
3. Documentation upload
4. AI processing (basic)
5. Status updates

### Phase 3: Legionella Domain (Weeks 9-12)

**Legionella-Specific:**
1. Weekly flush workflow (internal)
2. Monthly inspection workflow (external)
3. Temperature monitoring
4. Risk assessment tracking
5. Ed skills for both task types

### Phase 4: Other Domains (Weeks 13+)

**Sequential Rollout:**
1. Fire Safety
2. Asbestos Management
3. Electrical Safety
4. Mechanical
5. Water Quality
6. Other domains

---

## Questions for Clarification

1. **Contractor Invitation Flow:**
   - Should the system send a one-time booking link for each appointment?
   - Or should contractors have ongoing access to a portal?
   - What happens if contractor doesn't book by deadline?

2. **Documentation Processing:**
   - Should ALL contractor reports require human review initially?
   - Or trust AI from day one for routine passing results?
   - What's the escalation path if AI is uncertain?

3. **Asset Register:**
   - Is this being built from scratch?
   - Or integrating with existing system?
   - Should assets be geo-tagged for mobile access?

4. **Help Desk System:**
   - Should this handle email-to-ticket conversion?
   - What SLAs should apply to different priority levels?
   - Should tickets be visible to parents/students (like IT help desk)?

5. **Dashboard Personalization:**
   - Should users be able to customize their dashboard?
   - Mobile app vs web dashboard parity?
   - Notification preferences (email, SMS, push, in-app)?

---

**Document Status:** Updated with critical clarifications
**Next Steps:** Review with team, prioritize features, begin Phase 1
**Owner:** Product Team

**Last Updated:** 2026-01-23
