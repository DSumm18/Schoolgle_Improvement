# Arbor Integration & Ed Task Automation — Full Analysis

**Date:** 2026-03-11
**Scope:** Codebase audit, Arbor connector architecture, Ed task automation design, implementation plan

---

## Step 1: Codebase Summary — What Exists Today

### Platform Scale

| Metric          | Count                             |
| --------------- | --------------------------------- |
| Database tables | 284                               |
| Dashboard pages | 173                               |
| API routes      | 325+                              |
| Components      | 325+                              |
| Library files   | 189                               |
| Migrations      | 62                                |
| Ed AI skills    | 43+ functions across 7 categories |

### Module Status (Functional vs Placeholder)

| Module                    | Status         | Pages    | Notes                                                                             |
| ------------------------- | -------------- | -------- | --------------------------------------------------------------------------------- |
| **Estates & Compliance**  | ✅ Fully built | 12       | 200+ statutory checks, AI findings, QR asset tags, floor plans, energy monitoring |
| **HR & People**           | ✅ Fully built | 8        | Staff directory, sickness/Bradford Factor, appraisals, cover management           |
| **Governance**            | ✅ Fully built | 6        | Governor portal, meetings, training matrix, policy management                     |
| **Compliance**            | ✅ Fully built | 12+      | 25 DB tables, 36 templates, GDPR/SCR/H&S/safeguarding, DPO outsource              |
| **Improvement (SEF/SDP)** | ✅ Fully built | 8        | Living SEF engine, cross-module aggregation, EEF research matching                |
| **Intelligence**          | ✅ Fully built | 4        | Cohort tracking, DfE warehouse (184K+ records), zero-PII pupil analysis           |
| **Risk Register**         | ✅ Fully built | 4        | Dual scoring (user + AI), 5×5 heat map, trust escalation, ATH 2025                |
| **Safeguarding**          | ✅ Fully built | 3        | Body map, KCSIE 2025, chronology, multi-agency referrals                          |
| **Attendance**            | ✅ Fully built | 2        | AM/PM registration (25 DfE codes), PA/severe tracking, interventions              |
| **SEND**                  | ✅ Fully built | 3        | SEN register K/E, graduated approach, provision map, referrals                    |
| **Behaviour**             | ✅ Fully built | 2        | Incidents, exclusions (FTE/PEX), consequence ladder                               |
| **Documents**             | ✅ Fully built | 3        | 38 templates, handlebars placeholders, lifecycle management                       |
| **Meetings**              | ✅ Fully built | 5        | 11 categories, live companion, digital signatures, auto-minutes                   |
| **Surveys**               | ✅ Fully built | 3        | Parent/staff/pupil/governor, multi-page, analysis                                 |
| **Admissions**            | ✅ Built       | 2        | Rounds, applications, waiting list                                                |
| **Performance**           | ✅ Built       | 2        | Appraisal cycles, ECT tracking                                                    |
| **Cover**                 | ✅ Built       | 2        | Absence types, supply cost tracking                                               |
| **Pupil Premium**         | ✅ Built       | 2        | 3 EEF strands, DfE statement builder                                              |
| **Strategic Plan/ICFP**   | ✅ Built       | 3        | Pay scales seeded, budget planning                                                |
| **Ed AI Chatbot**         | ✅ Fully built | Embedded | 12 specialists, 43+ skills, function calling, self-improving                      |

### What's Already Connected

- **Google Drive + OneDrive**: Full recursive file listing, document extraction (DOCX, XLSX, PDF, OCR)
- **DfE Data Warehouse**: Attendance (184K rows), Census (146K), KS2 (1M+), Workforce (164K), Exclusions (1.1M)
- **EEF Toolkit**: 33 evidence-based strategies with impact/evidence/cost ratings
- **Document AI**: Mistral OCR, DeepSeek analysis, Gemini fallback

### What's NOT Connected

- **No MIS integration** — No Arbor, SIMS, Bromcom, ScholarPack connectors
- **No automated data sync** — No scheduler, sync jobs, change tracking
- **No credential vault** — No secure API key storage for third-party systems
- **No field mapping engine** — No configurable mapping between external and internal schemas

### Ed AI — Current Capabilities

Ed is a fully functional multi-specialist AI chatbot with:

**Architecture:**

```
User Message → Rate Limit (20/min) → Intent Classification → Work-Focus Check
    → Knowledge Base Lookup → School Context Loading → Specialist Routing
    → LLM Call (OpenRouter) with Tool Schemas → Skill Execution → Guardrails → Response
```

**12 Specialist Agents:** estates, hr, send, data, curriculum, it-tech, procurement, governance, communications, form, intelligence, general

**43+ Callable Skills (7 categories):**

- STAFF (6): create/update/list/export/import/deactivate
- ACTIONS (6): create/update/list, stats, EEF strategies, notes
- ESTATES (8): helpdesk, contractors, compliance, knowledge base, document extraction, spatial
- ESTATES_SPATIAL (6): floor plans, asset locations, QR scans, energy readings
- INTELLIGENCE (6): full analysis, cohort journey, assessment insights, DfE trends, cross-module signals
- RISK (6): risk CRUD, heatmap, mitigations, decisions, score recalc
- DOCUMENT (7): templates, generate, send, newsletter

**Extension Points for Arbor:**

1. Add new skill category: `MIS_SYNC` (6-8 functions)
2. Add specialist agent keywords for MIS/Arbor routing
3. Context loader already injects school data — extend with live MIS feed freshness
4. Skills invoke endpoint (`POST /api/skills/invoke`) is the universal execution layer

---

## Step 2: Arbor Integration Research

### Path A: Arbor REST API (Primary — Requires Partnership)

**Authentication:** HTTP Basic Auth (email + API key/password) per school
**Base URL:** `https://{school-slug}.arbor.sc/rest-v2/{resource}/`
**Registration:** Email `api@arbor-education.com` to register as partner app
**Approval:** Schools approve in Arbor: System → Partner Apps (API Users)

**Known API Resources** (from PHP SDK + Ruby client):
| Resource | Operations | Key Fields |
|----------|-----------|------------|
| `Student` | GET/POST/PUT/DELETE | id, legal_first_name, legal_last_name, date_of_birth, gender, year_group |
| `StaffWorkingPeriod` | GET | staff member, role, FTE, start/end dates |
| `AttendanceMark` | GET | student, date, session (AM/PM), mark code, is_statistical |
| `AcademicUnit` | GET | year group, class, registration group |
| `AssessmentResult` | GET | student, assessment, grade, date |
| `BehaviourEvent` | GET | student, type, category, date, points |
| `Exclusion` | GET | student, type, reason, start_date, end_date, days |
| `Person` | GET | display_name, email, phone |
| `Guardian` | GET | linked student, relationship, parental responsibility |

**Query System:** Property-based filtering via `Arbor\Query\Query` class
**Pagination:** Supported (paging, ordering, changelog per Ruby client TODO list)
**Permissions:** Granular — school sees exactly what data the app requests before approving
**Sync Direction:** One-way by default (Arbor → Schoolgle). Two-way requires Arbor approval.

**Limitation:** API docs are behind login at `developers-portal.arbor.sc`. We need to register as a partner to get full endpoint documentation.

### Path B: Arbor Custom Report Writer → Google Drive (Zero-Friction Fallback)

**How it works:**

1. School creates CRW reports in Arbor using templates we provide
2. Reports can be **scheduled weekly** and emailed to external addresses
3. School saves exports to a shared Google Drive folder
4. Schoolgle reads from Drive using existing `cloud-service.ts` connector
5. Parses Excel/CSV using existing extraction stack (xlsx library)

**Available CRW Templates (54 total):**

| Template Category | Key Reports for Schoolgle                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Attendance**    | Less than 90% Attendance, Weekly Attendance Report by Year, Year on Year PA %, Attendance Current Year VS Last Year, This Week Last Week Comparison |
| **Demographics**  | Individual Student Demographics (FSM/PP/SEN counts), Class Numbers, Enrolled Siblings                                                               |
| **Staff**         | Current Staff Members, Gender Pay Gap, Staff Payroll, Staff Leavers, SCR                                                                            |
| **Assessment**    | Reception Baseline Assessment (note: assessment columns need manual addition per school)                                                            |
| **Behaviour**     | Number of Behaviour Incidents, Behaviour by Student and Type                                                                                        |
| **Safeguarding**  | EHCP and Social Worker, Looked After Students                                                                                                       |
| **Other**         | Admissions Register, Leavers, Mode of Travel, Religion %                                                                                            |

**Critical Note:** Assessment data in CRW exports requires school-specific column setup because assessment frameworks differ between schools.

### Path C: Wonde as Middleware (Best of Both Worlds)

**Why Wonde matters:** Wonde already has 21,000+ UK school connections and handles the MIS connector complexity. Schoolgle connects to Wonde's clean REST API instead of each MIS directly.

**Wonde API Technical Details:**

- **Auth:** Bearer token (`Authorization: Bearer {token}`)
- **Base URL:** `https://api.wonde.com/v1.0/schools/{school_id}/`
- **Pagination:** Offset (50/page default) or cursor-based
- **Rate Limiting:** 429 error code (specific limits TBD)

**Available Resources via Wonde:**
| Resource | Key Fields | Writeback |
|----------|-----------|-----------|
| Students | id, mis_id, first_name, last_name, dob, gender, year_group | No |
| Attendance (Session) | date, session (AM/PM), code, student_id | Yes |
| Attendance (Lesson) | date, period, code, student_id | Yes |
| Assessments | aspects, results, templates, mark sheets | No |
| Staff/Employees | name, contact, role, FTE | No |
| Behaviour | type, points, comment, date, student | Yes |
| Exclusions | type, reason, dates, days | No |
| Classes/Groups | name, subject, year_group, students | No |

**Advantages over direct Arbor API:**

- Works with ALL MIS platforms (Arbor, SIMS, Bromcom, ScholarPack, iSAMS, etc.)
- Consistent API regardless of underlying MIS
- Wonde handles MIS-specific authentication complexity
- Schools may already have Wonde enabled
- Scoped permissions — school controls exactly what data is shared

### Recommended Integration Strategy

```
Priority 1 (NOW):     Google Drive CSV connector — works with ANY MIS, zero friction
Priority 2 (Month 1): Wonde API connector — covers 21,000+ schools, all MIS platforms
Priority 3 (Month 2): Direct Arbor API — deeper integration, real-time sync
```

---

## Step 3: Arbor Connector Architecture

### Supabase Schema

```sql
-- ============================================================
-- MIS CONNECTOR INFRASTRUCTURE
-- ============================================================

-- 1. Connection Configuration (one per school per provider)
CREATE TABLE mis_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Provider details
  provider TEXT NOT NULL CHECK (provider IN (
    'arbor_api', 'wonde', 'google_drive_csv',
    'sims', 'bromcom', 'scholarpack', 'isams'
  )),
  provider_config JSONB NOT NULL DEFAULT '{}',
  -- arbor_api:      { school_slug, api_email, site_url }
  -- wonde:          { school_id, school_name }
  -- google_drive_csv: { folder_id, folder_name, drive_type }

  -- Encrypted credentials (encrypt via pgcrypto or app-layer)
  credentials_encrypted TEXT,  -- AES-256-GCM encrypted API key/token
  credentials_hint TEXT,       -- Last 4 chars for display: "****abcd"

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'connected', 'syncing', 'error', 'paused', 'revoked'
  )),
  last_test_at TIMESTAMPTZ,
  last_test_result JSONB,      -- { success, message, latency_ms }

  -- Metadata
  connected_by UUID,
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, provider)
);

-- 2. Data Feed Configuration (what to sync per connection)
CREATE TABLE mis_data_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES mis_connections(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  feed_type TEXT NOT NULL CHECK (feed_type IN (
    'attendance', 'assessment', 'demographics',
    'behaviour', 'staff', 'exclusions', 'classes'
  )),

  -- Sync settings
  enabled BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN (
    'hourly', 'daily', 'weekly', 'manual'
  )),
  sync_day_of_week INT,        -- 0-6 for weekly
  sync_hour INT DEFAULT 6,     -- Hour to run (UTC)

  -- Field mapping (provider fields → Schoolgle fields)
  field_mapping JSONB DEFAULT '{}',
  -- e.g. { "arbor.legal_first_name": "first_name", "arbor.attendance_mark": "mark" }

  -- Aggregation preferences
  store_individual_records BOOLEAN DEFAULT false,  -- GDPR: prefer aggregated
  aggregation_level TEXT DEFAULT 'year_group' CHECK (aggregation_level IN (
    'individual', 'class', 'year_group', 'school'
  )),

  -- Status
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN (
    'success', 'partial', 'error', 'skipped'
  )),
  last_sync_summary JSONB,     -- { records_fetched, records_updated, errors[] }
  next_sync_at TIMESTAMPTZ,

  UNIQUE(connection_id, feed_type)
);

-- 3. Sync Job Log (audit trail)
CREATE TABLE mis_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES mis_data_feeds(id),
  organization_id UUID NOT NULL,

  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,

  status TEXT NOT NULL CHECK (status IN (
    'running', 'success', 'partial', 'error', 'cancelled'
  )),

  records_fetched INT DEFAULT 0,
  records_created INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_skipped INT DEFAULT 0,

  errors JSONB DEFAULT '[]',   -- [{ field, message, record_ref }]
  warnings JSONB DEFAULT '[]',

  sync_cursor TEXT,            -- For incremental sync (last modified timestamp/ID)
  triggered_by TEXT DEFAULT 'scheduler' CHECK (triggered_by IN (
    'scheduler', 'manual', 'webhook', 'file_upload'
  ))
);

-- 4. Normalised MIS Data Store (aggregated by default)
CREATE TABLE mis_attendance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  feed_id UUID REFERENCES mis_data_feeds(id),

  academic_year TEXT NOT NULL,  -- e.g. "2025-2026"
  term TEXT,                    -- autumn/spring/summer
  week_ending DATE,            -- For weekly granularity

  -- Dimensions
  year_group INT,
  pupil_group TEXT,            -- 'all', 'fsm', 'pp', 'sen_k', 'sen_e', 'eal', 'boys', 'girls'

  -- Metrics
  possible_sessions INT,
  attended_sessions INT,
  authorised_absences INT,
  unauthorised_absences INT,
  late_marks INT,
  attendance_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN possible_sessions > 0
    THEN (attended_sessions::numeric / possible_sessions * 100)
    ELSE NULL END
  ) STORED,

  -- PA tracking
  pupils_below_90_pct INT,
  pupils_below_50_pct INT,     -- Severe absence
  total_pupils INT,
  pa_rate NUMERIC(5,2),

  synced_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'mis_api' -- 'mis_api', 'csv_import', 'manual'
);

CREATE TABLE mis_assessment_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  feed_id UUID REFERENCES mis_data_feeds(id),

  academic_year TEXT NOT NULL,
  term TEXT,
  assessment_date DATE,

  year_group INT,
  subject TEXT,                -- reading, writing, maths, combined, science, phonics
  pupil_group TEXT DEFAULT 'all',

  -- Metrics
  total_assessed INT,
  at_expected_pct NUMERIC(5,2),
  above_expected_pct NUMERIC(5,2),
  below_expected_pct NUMERIC(5,2),
  at_greater_depth_pct NUMERIC(5,2),
  average_scaled_score NUMERIC(5,1),
  progress_measure NUMERIC(5,2),

  -- Teacher vs test comparison (Ofsted red flag)
  teacher_assessment_expected_pct NUMERIC(5,2),
  test_result_expected_pct NUMERIC(5,2),
  ta_test_gap NUMERIC(5,2),   -- Positive = TA above test (flag if > 10pp)

  synced_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'mis_api'
);

CREATE TABLE mis_demographics_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  feed_id UUID REFERENCES mis_data_feeds(id),

  snapshot_date DATE DEFAULT CURRENT_DATE,
  academic_year TEXT NOT NULL,

  year_group INT,

  total_on_roll INT,
  boys INT,
  girls INT,
  fsm_count INT,
  fsm_ever6_count INT,        -- PP eligibility
  pp_count INT,
  sen_k_count INT,             -- SEN Support
  sen_e_count INT,             -- EHCP
  eal_count INT,
  lac_count INT,               -- Looked After Children
  post_lac_count INT,
  service_children INT,
  ethnicity_breakdown JSONB,   -- { "White British": 45, "Asian": 12, ... }

  synced_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'mis_api'
);

CREATE TABLE mis_behaviour_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  feed_id UUID REFERENCES mis_data_feeds(id),

  academic_year TEXT NOT NULL,
  term TEXT,
  week_ending DATE,

  year_group INT,

  positive_incidents INT,
  negative_incidents INT,

  -- Breakdown by category (top-level summary)
  category_breakdown JSONB,    -- { "disruption": 5, "defiance": 3, ... }
  consequence_breakdown JSONB, -- { "verbal_warning": 4, "detention": 2, ... }

  -- Exclusion summary
  fixed_term_exclusions INT,
  fixed_term_days NUMERIC(4,1),
  permanent_exclusions INT,
  internal_exclusions INT,

  synced_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'mis_api'
);

CREATE TABLE mis_staff_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  feed_id UUID REFERENCES mis_data_feeds(id),

  snapshot_date DATE DEFAULT CURRENT_DATE,

  -- Individual staff (links to staff_directory for responsibility assignment)
  staff_mis_id TEXT,
  display_name TEXT,
  role TEXT,
  job_title TEXT,
  email TEXT,
  fte NUMERIC(3,2),
  contract_type TEXT,          -- permanent, fixed_term, supply, casual
  start_date DATE,

  -- Link to Schoolgle staff directory
  staff_directory_id UUID,     -- FK to staff_directory if matched
  match_confidence NUMERIC(3,2),

  synced_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'mis_api'
);

-- 5. CSV Import Staging (for Google Drive path)
CREATE TABLE mis_csv_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  file_name TEXT NOT NULL,
  file_source TEXT NOT NULL,   -- 'google_drive', 'upload', 'email'
  drive_file_id TEXT,          -- Google Drive file ID

  import_type TEXT NOT NULL CHECK (import_type IN (
    'attendance', 'assessment', 'demographics',
    'behaviour', 'staff', 'exclusions', 'generic'
  )),

  -- Processing
  raw_data JSONB,              -- Parsed CSV rows (temporary, cleared after processing)
  row_count INT,
  column_mapping JSONB,        -- { csv_column: schoolgle_field }
  auto_detected_format TEXT,   -- 'arbor_crw', 'sims_export', 'custom'

  status TEXT DEFAULT 'uploaded' CHECK (status IN (
    'uploaded', 'parsing', 'mapped', 'validating', 'importing',
    'completed', 'error', 'partial'
  )),

  processed_rows INT DEFAULT 0,
  error_rows INT DEFAULT 0,
  errors JSONB DEFAULT '[]',

  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE mis_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_data_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_assessment_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_demographics_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_behaviour_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_staff_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_csv_imports ENABLE ROW LEVEL SECURITY;

-- Standard org-scoped RLS (repeat for each table)
CREATE POLICY "org_access" ON mis_connections
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()::text
    )
  );
-- (Same pattern for all mis_* tables)

-- Indexes
CREATE INDEX idx_mis_connections_org ON mis_connections(organization_id);
CREATE INDEX idx_mis_feeds_connection ON mis_data_feeds(connection_id);
CREATE INDEX idx_mis_sync_log_feed ON mis_sync_log(feed_id);
CREATE INDEX idx_mis_attendance_org_year ON mis_attendance_summary(organization_id, academic_year);
CREATE INDEX idx_mis_assessment_org_year ON mis_assessment_summary(organization_id, academic_year);
CREATE INDEX idx_mis_demographics_org ON mis_demographics_snapshot(organization_id);
CREATE INDEX idx_mis_behaviour_org_year ON mis_behaviour_summary(organization_id, academic_year);
CREATE INDEX idx_mis_staff_org ON mis_staff_snapshot(organization_id);
CREATE INDEX idx_mis_csv_org ON mis_csv_imports(organization_id);
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SCHOOLGLE PLATFORM                          │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Ed Chat  │  │Dashboard │  │   SEF    │  │ Intelligence     │   │
│  │ (Skills) │  │  Pages   │  │ Engine   │  │ Engine           │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │              │                  │             │
│       └──────────────┴──────────────┴──────────────────┘             │
│                              │                                       │
│                   ┌──────────┴──────────┐                           │
│                   │   MIS Data Layer    │                           │
│                   │  (Normalised Store) │                           │
│                   │                      │                           │
│                   │  mis_attendance_*    │                           │
│                   │  mis_assessment_*    │                           │
│                   │  mis_demographics_*  │                           │
│                   │  mis_behaviour_*     │                           │
│                   │  mis_staff_*         │                           │
│                   └──────────┬──────────┘                           │
│                              │                                       │
│              ┌───────────────┼───────────────┐                      │
│              │               │               │                      │
│     ┌────────┴──────┐ ┌─────┴─────┐ ┌──────┴────────┐             │
│     │  CSV Parser   │ │ Wonde     │ │ Arbor Direct  │             │
│     │  (Drive/      │ │ Connector │ │ API Connector │             │
│     │   Upload)     │ │           │ │               │             │
│     └───────┬───────┘ └─────┬─────┘ └──────┬────────┘             │
│             │               │               │                       │
└─────────────┼───────────────┼───────────────┼───────────────────────┘
              │               │               │
     ┌────────┴────┐    ┌────┴────┐    ┌─────┴─────┐
     │ Google Drive │    │  Wonde  │    │   Arbor   │
     │ / OneDrive   │    │  API    │    │ REST API  │
     │ / CSV Upload │    │ 21,000+ │    │  v2       │
     └─────────────┘    │ schools │    └───────────┘
                         └─────────┘
```

### Connector Service Architecture

```typescript
// apps/platform/src/lib/mis/
//
// mis-connector.ts        — Base connector interface + factory
// arbor-connector.ts      — Direct Arbor API implementation
// wonde-connector.ts      — Wonde middleware implementation
// csv-connector.ts        — CSV/Excel parser for Drive imports
// field-mapper.ts         — Provider field → Schoolgle field mapping
// sync-scheduler.ts       — Cron-based sync orchestration
// types.ts                — Shared types for all connectors
```

**Key Design Decisions:**

1. **Aggregated by default** — Store year-group summaries, not individual pupil records (GDPR)
2. **Provider-agnostic normalisation** — All connectors output to same `mis_*` tables
3. **Existing pupil-pseudonymiser** stays for opt-in individual analysis (SEND module)
4. **Google Drive CSV works immediately** — Uses existing `cloud-service.ts`
5. **Credential encryption** — App-layer AES-256-GCM before storing in Supabase

---

## Step 4: Ed Task Automation Design — Top 10 Highest-Value Tasks

### Task 1: "Which pupils are below 90% attendance?"

**Trigger Patterns:**

- "which pupils/students are below 90%/persistent absent"
- "who has poor/low attendance"
- "PA list", "attendance concerns"
- "pupils below [X]% attendance"

**Data Flow:**

```
Ed (attendance/data specialist)
  → skill: query_mis_attendance
  → Supabase: mis_attendance_summary WHERE attendance_pct < 90
  → Group by year_group, pupil_group
  → Format as table with trends (this term vs last term)
  → Return to Ed for natural language summary
```

**Skill Schema:**

```typescript
{
  name: "query_mis_attendance",
  parameters: {
    threshold_pct: { type: "number", default: 90 },
    year_group: { type: "number", optional: true },
    pupil_group: { type: "string", optional: true },
    period: { type: "string", enum: ["this_week", "this_term", "this_year", "custom"] },
    compare_to: { type: "string", enum: ["last_week", "last_term", "last_year", "national"] }
  }
}
```

**Output:** Screen (chat response with table), option to export CSV or generate letters.

---

### Task 2: "Draft absence letters for persistent absentees"

**Trigger Patterns:**

- "draft/write/create absence letters"
- "attendance letters for PA pupils"
- "send letters to parents of persistent absentees"

**Data Flow:**

```
Ed (data/communications specialist)
  → skill: query_mis_attendance (threshold: 90%)
  → skill: get_document_template (type: "attendance_concern_letter")
  → For each year group with PAs:
      → Fill template with: school name, headteacher, term dates, attendance %,
         sessions missed, legal context (Section 444 Education Act 1996)
  → skill: generate_document (bulk, one per year group or per pupil group)
  → Return: "I've drafted X attendance concern letters. Review them in Documents."
```

**Output:** Generated documents in Documents module, email draft option.

---

### Task 3: "How are Year 6 doing against national expectations?"

**Trigger Patterns:**

- "how is Year [X] doing"
- "Year 6 against national"
- "KS2 expectations/benchmarks"
- "are we on track for SATs"

**Data Flow:**

```
Ed (intelligence/data specialist)
  → skill: query_mis_assessment (year_group: 6)
  → skill: get_dfe_trends (urn, dataset: "ks2_results")
  → Compare: school expected_pct vs national expected_pct (DfE published)
  → Compare: teacher assessment vs test results (flag if gap > 10pp)
  → Cross-reference with attendance data for same cohort
  → Format: subject-by-subject comparison table + narrative
```

**Output:** Chat response with comparison table. Offer to add to SEF.

---

### Task 4: "Update our SEF quality of education section"

**Trigger Patterns:**

- "update/write/draft SEF"
- "quality of education narrative"
- "SEF quality of education"
- "self-evaluation form"

**Data Flow:**

```
Ed (intelligence specialist)
  → skill: query_mis_attendance (this year, by pupil group)
  → skill: query_mis_assessment (all year groups, all subjects)
  → skill: query_mis_behaviour (summary)
  → skill: get_dfe_trends (attendance, KS2, census)
  → skill: get_cross_module_signals (HR absence, curriculum changes)
  → skill: run_intelligence_analysis (if stale)
  → Feed ALL data to LLM with Ofsted SEF template
  → Generate narrative paragraphs for Quality of Education:
      - Intent (curriculum design evidence)
      - Implementation (teaching quality, CPD, attendance impact)
      - Impact (outcomes, progress measures, gaps)
  → skill: update_sef_section (section: "quality_of_education")
```

**Output:** Draft SEF narrative saved to SEF module. Ed highlights data sources used.

---

### Task 5: "Create a governor report for this term"

**Trigger Patterns:**

- "governor report"
- "termly report for governors"
- "board report", "FGB report"

**Data Flow:**

```
Ed (governance specialist)
  → Parallel fetch:
    → skill: query_mis_attendance (this term summary)
    → skill: query_mis_assessment (latest data point)
    → skill: query_mis_demographics (current snapshot)
    → skill: query_mis_behaviour (this term)
    → skill: list_compliance_tasks (overdue)
    → skill: list_actions (in progress)
    → skill: get_risk_heatmap ()
  → skill: get_document_template (type: "governor_termly_report")
  → Fill template with all data
  → skill: generate_document
  → Return: "Governor report drafted. Covers attendance (X%), Y6 progress,
     Z overdue compliance items. Review in Documents."
```

**Output:** Generated PDF/document in Documents module.

---

### Task 6: "What compliance checks are overdue?"

**Trigger Patterns:**

- "overdue compliance", "what's overdue"
- "compliance checks due/overdue"
- "statutory checks"

**Data Flow:**

```
Ed (estates specialist)
  → skill: list_compliance_tasks (status: "overdue")
  → Group by: statutory vs good practice
  → Highlight: days overdue, responsible person, legal consequence
  → Cross-reference: staff_directory for assigned person
  → Return prioritised list
```

**Output:** Chat response with prioritised table. Option to create tasks.

---

### Task 7: "Flag year groups where TA is above test results"

**Trigger Patterns:**

- "teacher assessment vs test"
- "TA above FFT/test"
- "assessment inflation"
- "Ofsted readiness check"

**Data Flow:**

```
Ed (intelligence/data specialist)
  → skill: query_mis_assessment (all year groups, include TA and test)
  → Calculate: ta_test_gap per year group per subject
  → Flag: any gap > 10 percentage points
  → Context: "Ofsted inspectors specifically look for teacher assessment
     significantly above externally validated test results"
  → Suggest: moderation activities, standardisation meetings
```

**Output:** Alert-style response with specific year groups/subjects flagged.

---

### Task 8: "Generate a pupil premium impact statement"

**Trigger Patterns:**

- "pupil premium impact"
- "PP statement", "pupil premium report"
- "PP vs non-PP"

**Data Flow:**

```
Ed (data/intelligence specialist)
  → skill: query_mis_attendance (group: "pp" vs "all")
  → skill: query_mis_assessment (group: "pp" vs "all")
  → skill: query_mis_behaviour (group: "pp" vs "all")
  → skill: query_mis_demographics (PP count, funding)
  → Compare PP to non-PP across all measures
  → Match gaps to EEF 3-strand framework (teaching, targeted academic, wider strategies)
  → Generate DfE-compliant impact statement
  → skill: generate_document (type: "pupil_premium_statement")
```

**Output:** Full PP statement document with data tables and narrative.

---

### Task 9: "Log that the legionella flush was done today"

**Trigger Patterns:**

- "log/record legionella flush"
- "done the legionella today"
- "water flush completed"
- "compliance check done"

**Data Flow:**

```
Ed (estates specialist)
  → skill: update_compliance_task (type: "legionella", status: "completed")
  → Auto-fill: date (today), completed_by (current user), location
  → Update next due date based on frequency (weekly)
  → Return: "Legionella flush logged for [date]. Next due: [date]."
```

**Output:** Compliance tracker updated. Confirmation in chat.

---

### Task 10: "We need a return-to-work interview for [staff member]"

**Trigger Patterns:**

- "return to work", "RTW interview"
- "back from sickness", "staff member returned"

**Data Flow:**

```
Ed (HR specialist)
  → skill: list_staff (search: staff_name)
  → Pull absence history from staff_absences table
  → Calculate Bradford Factor (S² × D)
  → skill: get_document_template (type: "return_to_work")
  → Pre-fill: staff name, absence dates, total days, Bradford score
  → Include: scripted questions, occupational health referral trigger (if Bradford > 100)
  → skill: create_meeting (type: "1-to-1", category: "return_to_work")
```

**Output:** Meeting created with pre-filled RTW template. Chat shows Bradford Factor context.

---

### New Ed Skills Required (MIS Category)

```typescript
// Add to school-skills-registry.ts as MIS_SYNC category

const MIS_SKILLS = {
  query_mis_attendance: {
    description: "Query attendance data from synced MIS",
    parameters: { threshold_pct, year_group, pupil_group, period, compare_to },
  },
  query_mis_assessment: {
    description: "Query assessment data from synced MIS",
    parameters: { year_group, subject, pupil_group, term, include_ta_test_gap },
  },
  query_mis_demographics: {
    description: "Get current pupil demographics from synced MIS",
    parameters: { year_group, snapshot_date },
  },
  query_mis_behaviour: {
    description: "Query behaviour incidents and exclusions",
    parameters: { year_group, period, category },
  },
  query_mis_staff: {
    description: "Get staff list from synced MIS",
    parameters: { role_filter, include_fte },
  },
  get_mis_sync_status: {
    description: "Check MIS connection and sync freshness",
    parameters: {},
  },
  trigger_mis_sync: {
    description: "Manually trigger a data sync from MIS",
    parameters: { feed_type },
  },
  import_mis_csv: {
    description: "Import a CSV file from Google Drive as MIS data",
    parameters: { file_id, import_type },
  },
};
```

---

## Step 5: What To Build & Priority

### What Can We Build RIGHT NOW (Zero Dependencies)

1. **CSV Import Pipeline** — Parse Arbor CRW exports using existing `xlsx` library and `cloud-service.ts`
2. **MIS Data Layer** — Create the `mis_*` tables and API routes
3. **Ed MIS Skills** — Add 8 new query functions to Ed's skill registry
4. **Dashboard MIS Page** — Show synced data with connection status
5. **Attendance/Assessment Query APIs** — Query the normalised data store

### Schema Changes Required

One new migration with 9 tables:

- `mis_connections` — Provider config + encrypted credentials
- `mis_data_feeds` — Per-feed sync settings
- `mis_sync_log` — Audit trail
- `mis_attendance_summary` — Normalised attendance
- `mis_assessment_summary` — Normalised assessments
- `mis_demographics_snapshot` — Pupil demographics
- `mis_behaviour_summary` — Behaviour incidents
- `mis_staff_snapshot` — Staff list
- `mis_csv_imports` — CSV staging

### New API Routes Required

```
/api/mis/connections          — GET (list), POST (create)
/api/mis/connections/[id]     — GET, PATCH, DELETE
/api/mis/connections/[id]/test — POST (test connection)
/api/mis/feeds                — GET (list), POST (create)
/api/mis/feeds/[id]/sync      — POST (trigger sync)
/api/mis/sync-log             — GET (list)
/api/mis/import               — POST (CSV upload/Drive import)
/api/mis/attendance           — GET (query normalised data)
/api/mis/assessment           — GET (query normalised data)
/api/mis/demographics         — GET (query normalised data)
/api/mis/behaviour            — GET (query normalised data)
/api/mis/staff                — GET (query normalised data)
/api/mis/status               — GET (connection health + freshness)
```

### Quickest Path to Real Arbor Data from a Pilot School

**Week 1 — CSV Path (works immediately):**

1. Create `mis_*` tables migration
2. Build CSV parser that auto-detects Arbor CRW format
3. Build `/api/mis/import` endpoint
4. School exports Arbor CRW weekly attendance report → uploads to Schoolgle
5. Ed can now answer "how is attendance?" with real data

**Week 2 — Google Drive Automation:**

1. School shares Drive folder with Schoolgle
2. Build Drive folder watcher (poll existing `cloud-service.ts`)
3. Auto-detect new CRW exports → parse → import
4. School schedules Arbor CRW to email → saves to Drive → auto-imported

**Week 3-4 — Wonde API:**

1. Register with Wonde as partner
2. Build Wonde connector using their well-documented API
3. Covers ALL MIS platforms, not just Arbor

### Build First for Maximum Value with Minimum Complexity

**The killer feature is Ed answering questions with real school data.**

The CSV import path gives us this in days, not weeks. A headteacher asks "how's our attendance?" and Ed responds with their actual data — that's the demo that sells the product.

Priority order:

1. **MIS data layer + CSV import** (foundation for everything)
2. **Ed MIS query skills** (makes the data useful via Ed)
3. **Attendance queries** (most-asked question in every school)
4. **Assessment comparison** (Ofsted preparation — high anxiety = high value)
5. **Governor report generation** (saves headteachers hours per term)

---

## Step 6: Actionable Task List

### Phase 1: Foundation (Week 1)

| #   | Task                  | Size | Dependencies | Description                                                                                       |
| --- | --------------------- | ---- | ------------ | ------------------------------------------------------------------------------------------------- |
| 1   | Create MIS migration  | S    | None         | Create `20260312_mis_connector.sql` with all 9 tables + RLS + indexes                             |
| 2   | MIS types file        | S    | None         | Create `src/lib/mis/types.ts` with TypeScript interfaces for all MIS tables                       |
| 3   | MIS connection API    | M    | #1           | CRUD routes at `/api/mis/connections/` with protectedRoute wrapper                                |
| 4   | CSV parser engine     | M    | #2           | Create `src/lib/mis/csv-connector.ts` — auto-detect Arbor CRW format, parse xlsx/csv, map columns |
| 5   | CSV import API        | M    | #1, #4       | `/api/mis/import` — upload CSV, parse, validate, store in `mis_*` tables                          |
| 6   | Attendance normaliser | S    | #2           | Function to transform raw CSV rows → `mis_attendance_summary` records                             |
| 7   | Assessment normaliser | S    | #2           | Function to transform raw CSV rows → `mis_assessment_summary` records                             |

### Phase 2: Ed Integration (Week 2)

| #   | Task                      | Size | Dependencies | Description                                                                                 |
| --- | ------------------------- | ---- | ------------ | ------------------------------------------------------------------------------------------- |
| 8   | MIS query API routes      | M    | #1           | `/api/mis/attendance`, `/assessment`, `/demographics`, `/behaviour` — query normalised data |
| 9   | MIS skill schemas         | S    | #8           | Add `MIS_SYNC` category to `school-skills-registry.ts` with 8 function schemas              |
| 10  | MIS skill handlers        | M    | #8, #9       | Implement skill execution in `/api/skills/invoke` for MIS query functions                   |
| 11  | Ed data specialist update | S    | #9           | Add MIS routing keywords to data specialist agent (attendance, MIS, Arbor, sync)            |
| 12  | Ed context loader update  | S    | #8           | Inject MIS sync freshness into school context when user is on data pages                    |
| 13  | MIS status API            | S    | #1           | `/api/mis/status` — connection health, last sync time, freshness indicators                 |

### Phase 3: Dashboard UI (Week 2-3)

| #   | Task                         | Size | Dependencies | Description                                                                             |
| --- | ---------------------------- | ---- | ------------ | --------------------------------------------------------------------------------------- |
| 14  | MIS connection settings page | M    | #3           | `/dashboard/settings/mis` — configure provider, upload credentials, test connection     |
| 15  | MIS data overview page       | M    | #8           | `/dashboard/data/mis` — show synced attendance, assessment, demographics with freshness |
| 16  | CSV import UI                | M    | #5           | Upload component on MIS page — drag-and-drop CSV, preview parsed data, confirm import   |
| 17  | Attendance dashboard card    | S    | #8           | Widget on main dashboard showing attendance summary from MIS data                       |

### Phase 4: Google Drive Auto-Import (Week 3)

| #   | Task                 | Size | Dependencies | Description                                                                 |
| --- | -------------------- | ---- | ------------ | --------------------------------------------------------------------------- |
| 18  | Drive folder watcher | M    | #4, #5       | Poll shared Drive folder using `cloud-service.ts`, detect new CRW exports   |
| 19  | Auto-import pipeline | M    | #18          | Detect file → parse → validate → import → log. Cron-based (daily check).    |
| 20  | Import notification  | S    | #19          | Notify user when new data imported. Show in dashboard + Ed proactive alert. |

### Phase 5: Wonde API Connector (Week 4)

| #   | Task                  | Size | Dependencies | Description                                                                       |
| --- | --------------------- | ---- | ------------ | --------------------------------------------------------------------------------- |
| 21  | Wonde connector       | L    | #2, #6, #7   | `src/lib/mis/wonde-connector.ts` — Bearer auth, paginated fetch, all 7 data feeds |
| 22  | Wonde OAuth flow      | M    | #21          | School connects Wonde account, approves data sharing, stores token                |
| 23  | Wonde sync scheduler  | M    | #21          | Daily sync job via Vercel Cron, records in `mis_sync_log`                         |
| 24  | Wonde webhook handler | S    | #21          | `/api/mis/webhooks/wonde` — receive real-time updates                             |

### Phase 6: Direct Arbor API (Week 5-6)

| #   | Task                       | Size | Dependencies | Description                                                            |
| --- | -------------------------- | ---- | ------------ | ---------------------------------------------------------------------- |
| 25  | Arbor partner registration | S    | None         | Email `api@arbor-education.com`, register Schoolgle as partner app     |
| 26  | Arbor connector            | L    | #2, #25      | `src/lib/mis/arbor-connector.ts` — Basic auth, REST v2, all data feeds |
| 27  | Arbor field mapper         | M    | #26          | Map Arbor-specific field names to Schoolgle normalised schema          |
| 28  | Arbor sync scheduler       | M    | #26          | Sync orchestration with incremental cursors                            |

### Phase 7: Advanced Ed Tasks (Week 6+)

| #   | Task                       | Size | Dependencies | Description                                                                     |
| --- | -------------------------- | ---- | ------------ | ------------------------------------------------------------------------------- |
| 29  | Absence letter generation  | M    | #8, #10      | Ed generates personalised attendance letters from MIS data + document templates |
| 30  | Governor report generation | L    | #8, #10      | Ed auto-generates termly governor report from all MIS data feeds                |
| 31  | SEF auto-narrative         | L    | #8, #10      | Ed drafts SEF sections using MIS data + DfE comparisons + intelligence engine   |
| 32  | PP impact statement        | M    | #8, #10      | Ed generates pupil premium impact statement from PP vs non-PP data              |
| 33  | TA vs test gap alerts      | S    | #8, #10      | Proactive Ed alert when teacher assessment significantly above test results     |
| 34  | RTW meeting helper         | M    | #8, #10      | Ed pre-fills return-to-work template with absence data and Bradford Factor      |

### Size Key

- **S** = Small (~1-2 hours, single file/component)
- **M** = Medium (~2-4 hours, multiple files)
- **L** = Large (~4-8 hours, significant new functionality)

### Critical Path

```
#1 (migration) → #2 (types) → #4 (CSV parser) → #5 (import API) → #8 (query API)
    → #9 (skill schemas) → #10 (skill handlers) → Ed can answer MIS questions
```

**Minimum viable demo: Tasks 1-10 (roughly 1 week of focused work)**

That gets you to: "Upload a CSV from Arbor, and Ed can answer questions about your school's attendance and assessment data."

---

## Appendix: Arbor CRW Templates to Provide to Pilot Schools

Create a set of pre-configured CRW report templates that schools can import into Arbor and schedule for weekly export:

1. **Schoolgle Attendance Weekly** — Year group × pupil group (FSM/PP/SEN/EAL) attendance %, PA count
2. **Schoolgle Demographics Termly** — Roll count by year group with FSM/PP/SEN/EAL/LAC breakdown
3. **Schoolgle Assessment Termly** — Subject × year group × pupil group expected/GD percentages
4. **Schoolgle Behaviour Weekly** — Incident counts by type and year group
5. **Schoolgle Staff Snapshot** — Name, role, FTE, contract type

These templates use consistent column naming that the Schoolgle CSV parser can auto-detect.

---

## Sources

- [Arbor Help Centre: Third-Party API Integrations](https://support.arbor-education.com/hc/en-us/articles/360011606557)
- [Arbor Help Centre: Setting up API Integrations](https://support.arbor-education.com/hc/en-us/articles/360009421273)
- [Arbor PHP SDK](https://github.com/arbor-education/sis-sdk-php)
- [Arbor Ruby Client](https://github.com/cpoms/arbor-rb)
- [Arbor CRW Template Library](https://support.arbor-education.com/hc/en-us/articles/28229007274269)
- [Wonde API Documentation](https://docs.wonde.com/docs/api/sync/)
- [Wonde School Data Management](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/762468391682855)
- [Arbor Developer Portal](https://developers-portal.arbor.sc/) (requires login)
