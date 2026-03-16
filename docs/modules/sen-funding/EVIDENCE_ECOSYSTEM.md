# EHCP Evidence Ecosystem & Cross-Module Integration Map

**Date:** 2026-03-14
**Purpose:** Map every EHCP evidence type to the Schoolgle module that captures it, identify gaps, and define the cross-module architecture for "SEND in a Box"

---

## 1. The Evidence Challenge

An EHCP application requires evidence from **multiple sources across multiple formats**. A typical application pack contains 15-30 documents. The SEND Code of Practice 2015 (Chapter 9) requires the LA to gather evidence from:

- The child's school/setting (Section 9.14)
- Parents/carers (Section 9.21)
- Health professionals (Section 9.15)
- Social care (Section 9.16)
- Educational psychologists (Section 9.15)
- The child/young person themselves (Section 9.21)

**The core problem**: This evidence is scattered across filing cabinets, email inboxes, MIS systems, Word documents, photos on phones, and external professionals' separate systems. No school tool currently brings it all together.

**The SEND Hub opportunity**: Almost every evidence type maps to an existing Schoolgle module. SEND Hub becomes the **orchestration layer** that connects them.

---

## 2. Complete Evidence Type Map

### 2.1 School-Based Evidence

| Evidence Type | Format | Who Provides | Stage Needed | Schoolgle Module | Status |
|--------------|--------|-------------|-------------|-----------------|--------|
| **SENCO Report / SEN Support Summary** | Word/PDF | SENCO | Request, Annual Review | **SEND Hub** (Document Production) | Existing: `send_register` table + Doc Production |
| **Graduated Approach (APDR) Cycles** | Structured records | Class teacher/SENCO | Request (min 2 cycles), Annual Review | **SEND Hub** | Existing: `send_graduated_approach` table |
| **Costed Provision Map** | Spreadsheet/table | SENCO | Request (proves £6k threshold), Annual Review, Band Escalation | **SEND Hub** | Existing: `send_provision_map` table |
| **Attendance Records** | Data export/report | School admin | Request, Annual Review | **Attendance Module** | Existing: `attendance` DfE warehouse data |
| **Exclusion Records** | Data export/report | School admin | Request, Annual Review | **Behaviour Module** | Existing: `exclusions` DfE warehouse data |
| **Pupil Assessment Data** (SATs, standardised tests, baseline) | Spreadsheet/PDF | Class teacher/assessment lead | Request, Annual Review, Band Escalation | **Intelligence Engine** | Existing: `pupil_assessments_pseudo` table |
| **Progress Tracking** (termly data, against age-related expectations) | Spreadsheet/PDF | Class teacher | Request, Annual Review | **Intelligence Engine** | Existing: cohort tracking + gap analysis |
| **Behaviour Logs** | Structured records | Class teacher/pastoral | Request (SEMH), Annual Review | **Behaviour Module** | Existing: behaviour module tables |
| **Individual Education Plan / Support Plan** | Word/PDF | SENCO/class teacher | Request, Annual Review | **SEND Hub** (Document Production) | NEW: Template needed |
| **Risk Assessments** (for pupils with PD/medical/behavioural needs) | Word/PDF | SENCO/H&S lead | Request, Annual Review | **Risk Register** | Existing: risk register module |
| **Curriculum Modifications / Differentiated Work Samples** | Photos/scans | Class teacher | Annual Review | **SEND Hub** (File Upload) | NEW: File upload needed |

### 2.2 External Professional Reports

| Evidence Type | Format | Who Provides | Stage Needed | Schoolgle Module | Status |
|--------------|--------|-------------|-------------|-----------------|--------|
| **Educational Psychologist (EP) Report** | PDF (typically 8-15 pages) | EP (LA or private) | Request, 20-week assessment | **SEND Hub** (File Upload) | NEW: Upload + metadata extraction |
| **Speech & Language Therapy (SALT) Report** | PDF/Word | NHS or private SaLT | Request, Annual Review | **SEND Hub** (File Upload) | NEW: Upload + metadata extraction |
| **Occupational Therapy (OT) Report** | PDF/Word | NHS or private OT | Request, Annual Review | **SEND Hub** (File Upload) | NEW: Upload + metadata extraction |
| **Physiotherapy Report** | PDF/Word | NHS physio | Request, Annual Review | **SEND Hub** (File Upload) | NEW: Upload + metadata extraction |
| **CAMHS / Mental Health Report** | PDF (restricted sharing) | CAMHS clinician | Request (SEMH), Annual Review | **SEND Hub** (File Upload) | NEW: Upload with restricted access |
| **Paediatric / Medical Report** | PDF/letter | Paediatrician/consultant | Request, 20-week assessment | **SEND Hub** (File Upload) | NEW: Upload with restricted access |
| **Specialist Teacher Report** (VI/HI/PD advisory) | PDF/Word | LA specialist teacher | Request, 20-week assessment, Annual Review | **SEND Hub** (File Upload) | NEW: Upload |
| **Social Worker / Early Help Report** | PDF/Word | Social care | Request (where applicable), Annual Review | **SEND Hub** (File Upload) | NEW: Upload with safeguarding flag |
| **External Agency Referral Outcomes** | PDF/letters | Various agencies | Request, Annual Review | **SEND Hub** | Existing: `send_referrals` table tracks referral lifecycle |

### 2.3 Parent/Carer Views

| Evidence Type | Format | Who Provides | Stage Needed | Schoolgle Module | Status |
|--------------|--------|-------------|-------------|-----------------|--------|
| **Structured Parent View Form** (LA template) | PDF/Word/online form | Parent/carer | Request, Annual Review | **Surveys Module** | Existing: survey builder can create parent view questionnaires |
| **Written Parental Statement** | Word/email/handwritten scan | Parent/carer | Request, Annual Review | **SEND Hub** (File Upload) | NEW: Upload + template |
| **Parent Meeting Notes** | Structured record | SENCO (from meeting) | Request, Annual Review | **Meetings Module** | Existing: meeting recording, transcription, minutes |
| **Parent Correspondence** | Email/letters | Parent/carer | Any stage | **SEND Hub** (File Upload) | NEW: Attach from email/upload |
| **Parent Annual Review Contributions** | Structured form | Parent/carer | Annual Review (pre-meeting) | **Surveys Module** | Existing: pre-meeting survey template |

### 2.4 Child/Young Person Views

| Evidence Type | Format | Who Provides | Stage Needed | Schoolgle Module | Status |
|--------------|--------|-------------|-------------|-----------------|--------|
| **One-Page Profile** | Structured document | SENCO/class teacher with child | Request, Annual Review | **Document Production** | Existing: template generation |
| **"All About Me" / My Views Form** | Adapted form (age-appropriate) | Child (with adult support) | Request, Annual Review | **Surveys Module** | Existing: age-adapted survey |
| **Photographs of Child's Work/Activities** | JPEG/PNG | Class teacher/TA | Annual Review, Band Escalation | **SEND Hub** (File Upload) | NEW: Photo upload gallery |
| **Video Evidence** (communication, behaviour, physical needs) | MP4/MOV | Class teacher/TA/parent | Request (complex needs), Annual Review | **SEND Hub** (File Upload) | NEW: Video upload (size considerations) |
| **Drawings / Art by the Child** | Scanned image | Child | Annual Review | **SEND Hub** (File Upload) | NEW: Scan/photo upload |
| **Recorded Voice / Assisted Communication Output** | Audio/text | Child (with AAC device) | Request, Annual Review | **SEND Hub** (File Upload) | NEW: Audio upload |

### 2.5 Meeting Records

| Evidence Type | Format | Who Provides | Stage Needed | Schoolgle Module | Status |
|--------------|--------|-------------|-------------|-----------------|--------|
| **Annual Review Meeting Minutes** | Word/PDF | SENCO (meeting chair) | Annual Review | **Meetings Module** | Existing: AI-generated minutes from recording |
| **TAC/TAF Meeting Records** (Team Around the Child/Family) | Word/PDF | Lead professional | Request, Annual Review | **Meetings Module** | Existing: meeting templates + recording |
| **Multi-Agency Meeting Minutes** | Word/PDF | Meeting chair (varies) | 20-week assessment, Annual Review | **Meetings Module** | Existing: meeting recording + minutes |
| **EHCP Review Meeting Record** (the formal LA document) | LA template (PDF/Word) | SENCO | Annual Review | **SEND Hub** (Document Production) | NEW: LA-specific template |
| **Professionals Meeting Notes** | Word/PDF | SENCO | Request, Annual Review | **Meetings Module** | Existing: meeting notes |
| **Parent Meeting Records** | Structured notes | SENCO | Any stage | **Meetings Module** | Existing: meeting companion |

### 2.6 Assessment Data (Standardised)

| Evidence Type | Format | Who Provides | Stage Needed | Schoolgle Module | Status |
|--------------|--------|-------------|-------------|-----------------|--------|
| **KS1/KS2 SATs Results** | Data (from MIS) | School | Request, Annual Review | **Intelligence Engine** | Existing: KS2 results in DfE warehouse (1M+ records) |
| **Phonics Screening Check** | Data | School | Request (primary) | **Intelligence Engine** | Can import via pupil assessment CSV |
| **Standardised Test Scores** (NFER, GL Assessment, etc.) | Data/PDF | School/EP | Request, Annual Review | **Intelligence Engine** | Existing: pupil assessment analyser |
| **Baseline Assessments** (Reception/EYFS) | Data | School | Request (early years) | **Intelligence Engine** | Can import via CSV |
| **Reading Age / Spelling Age Tests** | Data | School/EP | Request, Annual Review | **Intelligence Engine** | Can import via CSV |
| **Boxall Profile / SDQ** (SEMH assessment) | Structured scores | SENCO/class teacher | Request (SEMH), Annual Review | **SEND Hub** | NEW: SEMH assessment tracker |
| **B-Squared / Engagement Model** (for SLD/PMLD) | Structured data | Class teacher (special school) | Annual Review | **SEND Hub** | NEW: Specialist assessment import |
| **Teacher Assessment Judgements** (against ARE) | Data | Class teacher | Request, Annual Review | **Intelligence Engine** | Existing: teacher accuracy analysis |

---

## 3. Cross-Module Integration Architecture

### The Orchestration Model

SEND Hub doesn't replace existing Schoolgle modules — it **connects them**. Each module continues to own its data, but SEND Hub provides a pupil-centric view that pulls evidence from everywhere.

```
                                    ┌─────────────────┐
                                    │   SEND Hub      │
                                    │  (Orchestrator)  │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
            ┌───────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
            │ Evidence Layer  │    │ Funding Layer    │    │ Lifecycle Layer  │
            │ (Cross-Module)  │    │ (New)            │    │ (Existing+New)   │
            └───────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
                    │                        │                        │
    ┌───────────────┼───────────────┐        │        ┌──────────────┼──────────────┐
    │               │               │        │        │              │              │
┌───▼───┐     ┌────▼────┐   ┌─────▼──┐  ┌──▼───┐  ┌▼─────┐  ┌───▼────┐  ┌──────▼──────┐
│Meeting│     │ Survey  │   │Doc Prod│  │ Fund │  │APDR  │  │Annual  │  │   EHCP      │
│Module │     │ Builder │   │ Module │  │ Recon│  │Cycles│  │Reviews │  │  Lifecycle   │
└───┬───┘     └────┬────┘   └────┬───┘  └──────┘  └──────┘  └────────┘  └─────────────┘
    │              │              │
    │              │              │
┌───▼───┐     ┌───▼────┐   ┌────▼───┐
│Intelli│     │ Staff  │   │ Risk   │
│gence  │     │ Dir    │   │Register│
│Engine │     │        │   │        │
└───────┘     └────────┘   └────────┘
```

### Module Integration Details

#### 1. Meetings Module → SEND Hub
**Integration Type**: Evidence source (meeting minutes, recordings, transcriptions)

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| Annual review meetings | Meeting → SEND Hub | AI-transcribed minutes become part of the EHCP evidence pack |
| TAC/TAF meetings | Meeting → SEND Hub | Multi-agency meeting records linked to pupil's SEND file |
| Parent meetings | Meeting → SEND Hub | Parent consultation records as evidence |
| Professional meetings | Meeting → SEND Hub | EP debrief, therapy review meetings |

**How it works**: When creating a meeting in Meetings Module, tag it as "SEND-related" and link to a pupil. The meeting recording, transcript, and AI-generated minutes automatically appear in that pupil's SEND evidence pack.

#### 2. Surveys Module → SEND Hub
**Integration Type**: Evidence source (parent views, pupil views, staff assessments)

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| Parent view questionnaires | Survey responses → SEND Hub | Structured parent views for EHCP application / annual review |
| Pupil view forms | Survey responses → SEND Hub | Child/young person voice captured digitally |
| Staff perception surveys | Survey responses → SEND Hub | TA/teacher assessment of pupil needs |
| Pre-review questionnaires | Survey responses → SEND Hub | Gather all party views before annual review meeting |

**How it works**: SEND Hub provides pre-built survey templates (parent views, pupil views) deployed via Surveys Module. Responses auto-link to the pupil's SEND profile. Multi-language support via existing translation.

#### 3. Document Production Module → SEND Hub
**Integration Type**: Evidence generator (reports, letters, forms)

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| SENCO report generation | SEND data → Doc Production → PDF | Auto-generate the SENCO contribution to EHCP application |
| One-page profiles | SEND data → Doc Production → PDF | Generate pupil passports from SEND profile data |
| Governor SEND reports | SEND data → Doc Production → PDF | Termly governor report from live SEND data |
| Annual review forms | SEND data → Doc Production → PDF | Pre-populated review forms with latest data |
| Transition documents | SEND data → Doc Production → PDF | Year 6→7 / Year 11→12 transition packs |
| Parent letters | SEND data → Doc Production → email | Review invitations, outcome notifications |

**How it works**: Document Production templates reference SEND Hub data fields. When generating a SENCO report, the template pulls: provision map, APDR history, assessment data, attendance, funding band, and evidence summary.

#### 4. Intelligence Engine → SEND Hub
**Integration Type**: Data analysis (assessment gaps, cohort tracking, DfE benchmarks)

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| Pupil assessment analysis | Intelligence → SEND Hub | Gap analysis (FSM/SEND/PP intersections) feeds into EHCP evidence |
| Cohort tracking | Intelligence → SEND Hub | Track SEND cohort progress over time — evidence for band reviews |
| DfE benchmark data | Intelligence → SEND Hub | Compare school's SEND outcomes against national/LA averages |
| Teacher accuracy | Intelligence → SEND Hub | Validate teacher assessments against standardised tests |
| Contextual factors | Intelligence → SEND Hub | School-level SEND context (% EHCP, deprivation, mobility) |

**How it works**: Intelligence Engine's pseudonymised assessment data links to SEND Hub via `pupil_hash`. SEND Hub can request a gap analysis for any SEND pupil, showing whether they're making expected progress relative to their cohort.

#### 5. Staff Directory → SEND Hub
**Integration Type**: Resource costing (link staff to provision costs)

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| Staff hourly rates | Staff Dir → SEND Hub | Auto-calculate provision costs from staff assignments |
| TA/support staff allocation | Staff Dir → SEND Hub | Link specific TAs to specific EHCP pupils |
| Key worker assignment | Staff Dir ↔ SEND Hub | SENCO assigns key worker from staff directory |
| Training records | Staff Dir → SEND Hub | Evidence that staff supporting SEND pupils have relevant CPD |

**How it works**: When a provision is added to a pupil's provision map, select the staff member from Staff Directory. Their hourly rate auto-populates the cost calculation. Training records show Ofsted that support staff are appropriately qualified.

#### 6. Risk Register → SEND Hub
**Integration Type**: Evidence source (risk assessments for complex needs)

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| Pupil risk assessments | Risk Register → SEND Hub | Risk assessments for pupils with PD/medical/SEMH needs |
| Incident records | Risk Register → SEND Hub | Evidence of incidents supporting need for higher band |
| Environmental modifications | Risk Register → SEND Hub | Reasonable adjustments documented as risk mitigations |

#### 7. Compliance Module → SEND Hub
**Integration Type**: Statutory compliance tracking

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| SEND policy | Compliance → SEND Hub | Link to school's current SEND policy and review date |
| Accessibility plan | Compliance → SEND Hub | Statutory requirement — evidence of reasonable adjustments |
| SEND Information Report | Compliance → SEND Hub | Annual SEN Information Report (statutory publication) |
| SCR checks | Compliance → SEND Hub | DBS checks for external professionals visiting school |

#### 8. Governance Module → SEND Hub
**Integration Type**: Reporting and oversight

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| SEND governor reports | SEND Hub → Governance | Auto-generated termly SEND report for governors |
| Governor visit records | Governance → SEND Hub | SEND-focused governor visits as evidence of oversight |
| Board minutes | Governance → SEND Hub | Evidence that governors discuss and monitor SEND |

#### 9. Actions Hub → SEND Hub
**Integration Type**: Improvement actions linked to SEND

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| SEND improvement actions | Actions Hub ↔ SEND Hub | Track actions arising from annual reviews, Ofsted, LA visits |
| EEF strategies | Actions Hub → SEND Hub | Evidence-based interventions linked to SEND pupils |
| SDP SEND priorities | SDP → SEND Hub | Link school development plan SEND targets to provision |

#### 10. Cloud Storage (Google Drive/OneDrive) → SEND Hub
**Integration Type**: External file ingestion

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| Document scanning | Cloud → SEND Hub | Existing cloud scan finds SEND-related documents |
| EP report storage | Cloud → SEND Hub | Auto-detect and import EP reports from shared drives |
| External reports | Cloud → SEND Hub | Any professional report shared via cloud storage |

#### 11. Email Service → SEND Hub
**Integration Type**: Communications and chase automation

| Touchpoint | Data Flow | Use Case |
|-----------|-----------|----------|
| LA deadline chasers | SEND Hub → Email | Auto-chase LA when statutory response deadlines pass |
| Parent notifications | SEND Hub → Email | Review invitations, outcome letters |
| Professional report requests | SEND Hub → Email | Request updated reports from EP, SALT, OT before annual review |

---

## 4. Evidence Pack Builder: How It All Comes Together

### For an EHCP Application

The EHCP Application Wizard pulls evidence from across Schoolgle:

```
EHCP Application Evidence Pack
├── Section A: Child/Young Person Views
│   ├── One-page profile ──────────── [Document Production]
│   ├── Pupil views questionnaire ─── [Surveys Module]
│   └── Photos/drawings ──────────── [SEND Hub File Upload]
│
├── Section B: School Evidence
│   ├── SENCO report ─────────────── [Document Production, auto-generated]
│   ├── APDR cycles (min 2) ──────── [SEND Hub: send_graduated_approach]
│   ├── Costed provision map ─────── [SEND Hub: send_provision_map]
│   ├── Attendance data ──────────── [Intelligence Engine / MIS import]
│   ├── Assessment data ──────────── [Intelligence Engine: pupil_assessments_pseudo]
│   ├── Progress tracking ────────── [Intelligence Engine: cohort tracking]
│   ├── Behaviour logs ───────────── [Behaviour Module]
│   └── Risk assessments ─────────── [Risk Register]
│
├── Section C: Parent/Carer Views
│   ├── Structured parent view ────── [Surveys Module]
│   ├── Written statement ─────────── [SEND Hub File Upload]
│   └── Meeting records ──────────── [Meetings Module]
│
├── Section D: Professional Reports
│   ├── EP report ────────────────── [SEND Hub File Upload / Cloud Storage]
│   ├── SALT report ──────────────── [SEND Hub File Upload / Cloud Storage]
│   ├── OT report ────────────────── [SEND Hub File Upload / Cloud Storage]
│   ├── Medical reports ──────────── [SEND Hub File Upload (restricted)]
│   └── Referral outcomes ────────── [SEND Hub: send_referrals]
│
├── Section E: Meeting Records
│   ├── TAC/TAF meeting minutes ──── [Meetings Module]
│   ├── Parent meeting notes ─────── [Meetings Module]
│   └── Multi-agency records ─────── [Meetings Module]
│
└── AI Analysis
    ├── Evidence strength score ────── [Ed SEND Specialist]
    ├── Missing evidence checklist ─── [Ed SEND Specialist]
    ├── Band recommendation ───────── [Ed SEND Specialist]
    └── LA-specific requirements ──── [LA Configuration Engine]
```

### For an Annual Review

```
Annual Review Evidence Pack
├── Pre-Review (gathered automatically)
│   ├── Current provision map + costs ──── [SEND Hub: send_provision_map]
│   ├── Progress since last review ─────── [Intelligence Engine]
│   ├── Updated APDR cycles ────────────── [SEND Hub: send_graduated_approach]
│   ├── Parent pre-review survey ───────── [Surveys Module]
│   ├── Pupil pre-review survey ────────── [Surveys Module]
│   ├── Updated professional reports ──── [SEND Hub File Upload]
│   ├── Attendance since last review ──── [Intelligence Engine]
│   └── Behaviour since last review ───── [Behaviour Module]
│
├── During Review
│   ├── Meeting recording + transcript ── [Meetings Module]
│   ├── AI-generated minutes ──────────── [Meetings Module]
│   └── Actions agreed ────────────────── [Actions Hub]
│
├── Post-Review (auto-generated)
│   ├── Annual review form (LA template) ─ [Document Production]
│   ├── Updated EHCP recommendations ──── [SEND Hub]
│   ├── Band change evidence (if needed) ─ [Ed SEND Specialist]
│   └── Statutory deadline tracking ────── [SEND Hub Calendar]
│
└── Funding Impact
    ├── Current band vs recommended band ── [Funding Intelligence]
    ├── Provision cost vs funding received ─ [Funding Intelligence]
    └── Financial case for band change ──── [Ed AI Case Builder]
```

---

## 5. Gap Analysis: What's New vs What Exists

### Already Built (60-70% of evidence capture)

| Capability | Module | Tables/APIs |
|-----------|--------|-------------|
| SEN register with status/need codes | SEND APIs | `send_register` |
| Graduated approach (APDR) cycles | SEND APIs | `send_graduated_approach` |
| Costed provision mapping | SEND APIs | `send_provision_map` |
| External referral tracking | SEND APIs | `send_referrals` |
| SENCO dashboard | SEND Frontend | `/dashboard/send` |
| Meeting recording/transcription/minutes | Meetings Module | Full CRUD + AI minutes |
| Survey builder (parent/pupil views) | Surveys Module | Full CRUD + distribution |
| Document generation (reports, letters) | Document Production | Templates + generation |
| Pupil assessment analysis (pseudonymised) | Intelligence Engine | `pupil_assessments_pseudo` |
| Cohort tracking + gap analysis | Intelligence Engine | Cohort views |
| DfE data (attendance, KS2, exclusions) | Intelligence Engine | DfE warehouse tables |
| Staff directory + hourly rates | Staff Directory | Full CRUD |
| Risk assessments | Risk Register | Full CRUD |
| Governance reporting | Governance Module | Board + governor APIs |
| Action tracking with EEF strategies | Actions Hub | Full CRUD |
| Compliance policies + SCR | Compliance Module | Full CRUD |
| Ed SEND specialist agent | Ed Chatbot | SEND specialist prompt + keywords |
| HMAC-SHA256 pupil pseudonymisation | Core | `pupil-pseudonymiser.ts` |

### Needs Building (30-40% — primarily funding + file upload + orchestration)

| Capability | Priority | Effort | Notes |
|-----------|----------|--------|-------|
| **File upload for external reports** (EP, SALT, OT, medical) | HIGH | Medium | Multi-file upload with metadata tagging, access control, AI text extraction |
| **Funding reconciliation engine** | HIGH | High | LA schedule import, auto-matching, variance calculation |
| **LA banding configuration** | HIGH | Medium | Configurable per-LA band structures with annual versioning |
| **EHCP lifecycle tracker** (20-week timeline) | HIGH | Medium | Visual timeline, statutory deadline alerts, status tracking |
| **Annual review workflow** (pre→during→post) | HIGH | Medium | Automated checklist, survey deployment, deadline tracking |
| **Evidence pack builder** (application wizard) | HIGH | High | Cross-module evidence aggregation into submission-ready pack |
| **AI band validation** | MEDIUM | Medium | Ed skill comparing provision costs + needs against band descriptors |
| **AI case builder** (band escalation) | MEDIUM | Medium | Ed skill drafting evidence summary for band review |
| **AI application strength scorer** | MEDIUM | Medium | Ed skill rating EHCP evidence pack completeness |
| **Income forecasting + scenario modelling** | MEDIUM | Medium | Projection engine based on current EHCP cohort |
| **SEND calendar** (integrated view) | MEDIUM | Low | Review due dates, transition deadlines, LA response tracking |
| **Photo/video evidence gallery** | LOW | Low | Simple media upload linked to pupil profile |
| **Parent portal** (view-only access) | LOW | Medium | Parent view of their child's SEND profile and provisions |
| **Cross-school benchmarking** | LOW | Medium | Anonymised comparison across schools in same LA |
| **SEMH assessment tracker** (Boxall/SDQ) | LOW | Low | Structured score input and tracking over time |
| **Specialist assessment import** (B-Squared) | LOW | Low | CSV import for special school assessment frameworks |

---

## 6. The Cross-Selling Opportunity

The evidence ecosystem creates powerful cross-selling hooks. Each integration point is a reason for a school to adopt another Schoolgle module:

| If school uses SEND Hub... | They need... | Because... |
|--------------------------|-------------|-----------|
| SEND Hub (core) | **Meetings Module** | Annual review meetings need recording + AI minutes for evidence |
| SEND Hub (core) | **Surveys Module** | Parent and pupil views are statutory requirements for every review |
| SEND Hub (core) | **Document Production** | SENCO reports, one-page profiles, governor reports need generation |
| SEND Hub (funding) | **Staff Directory** | Provision costing requires staff hourly rates and assignments |
| SEND Hub (intelligence) | **Intelligence Engine** | Assessment gap analysis feeds directly into EHCP evidence |
| SEND Hub (compliance) | **Compliance Module** | SEND policy, accessibility plan, SEN Information Report are statutory |
| SEND Hub (governance) | **Governance Module** | Governor SEND reports and monitoring visits |
| SEND Hub (improvement) | **Actions Hub** | Post-review actions with EEF-backed interventions |

**Revenue multiplier**: A school buying SEND Hub at £1,295/yr is likely to also need Meetings, Surveys, and Document Production. That's potentially £3,000-4,000 in total platform revenue per school.

---

## 7. Evidence Format & Storage Architecture

### File Storage Approach

External professional reports are the primary new file storage requirement:

```
Evidence Storage Strategy:
├── Structured data (assessments, provisions, APDR) → Supabase tables (existing)
├── Generated documents (reports, letters) → Document Production (existing)
├── Meeting recordings/transcripts → Meetings Module storage (existing)
├── Survey responses → Surveys Module tables (existing)
├── Uploaded files (EP reports, medical, photos) → NEW: Supabase Storage + metadata table
└── Cloud-sourced documents → Cloud Storage integration (existing)
```

### New Table: `sen_evidence_files`

```sql
sen_evidence_files (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES organizations(id),
  pupil_id uuid REFERENCES send_register(id),
  file_name text NOT NULL,
  file_type text NOT NULL,           -- 'ep_report', 'salt_report', 'ot_report', 'medical', 'photo', 'video', 'parent_statement', 'other'
  file_path text NOT NULL,           -- Supabase Storage path
  file_size_bytes bigint,
  mime_type text,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now(),
  professional_name text,            -- Who wrote the report
  professional_role text,            -- EP, SaLT, OT, Paediatrician, etc.
  report_date date,                  -- Date of the report/assessment
  linked_review_id uuid,             -- Link to specific annual review
  linked_application_id uuid,        -- Link to EHCP application
  ai_extracted_text text,            -- Extracted text for AI analysis
  ai_summary text,                   -- AI-generated summary
  access_level text DEFAULT 'senco', -- 'senco', 'headteacher', 'all_staff', 'restricted'
  tags text[],                       -- Searchable tags
  is_current boolean DEFAULT true,   -- Latest version flag
  superseded_by uuid,                -- Link to newer version
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Access Control for Sensitive Files

Medical and social care reports require restricted access:

| File Type | Default Access | Rationale |
|-----------|---------------|-----------|
| EP report | SENCO, Headteacher | Professional assessment — relevant staff |
| SALT/OT/Physio | SENCO, Class teacher | Provision planning |
| Medical/Paediatric | SENCO, Headteacher only | Medical confidentiality |
| CAMHS | SENCO, Headteacher only | Mental health confidentiality |
| Social care | SENCO, DSL only | Safeguarding overlap |
| Parent views | SENCO, Class teacher | Wider sharing appropriate |
| Pupil views | SENCO, Class teacher | Wider sharing appropriate |
| Photos/video | SENCO, Class teacher | Consent-dependent |

---

## 8. AI Evidence Analysis: Ed's Enhanced SEND Skills

### Existing Ed SEND Specialist Enhancement

The current Ed SEND specialist (`send-specialist.ts`) has general SEND knowledge. With SEND Hub integration, Ed gains concrete data access:

```
Enhanced SEND Skills (12 functions):
├── Existing Intelligence Skills
│   ├── get_send_register          — Full SEN register with funding data
│   ├── run_funding_reconciliation — LA schedule vs school register
│   ├── get_funding_forecast       — Income projections
│   └── generate_governor_report   — Auto-generate SEND governor report
│
├── New Evidence Skills
│   ├── validate_band_allocation   — Compare evidence strength against band descriptors
│   ├── build_escalation_case      — Draft band change evidence summary
│   ├── score_ehcp_application     — Rate evidence pack completeness (0-100)
│   ├── get_missing_evidence       — What's missing from the evidence pack
│   └── summarise_professional_reports — AI summary of uploaded EP/SALT/OT reports
│
├── New Workflow Skills
│   ├── get_review_calendar        — Upcoming reviews + deadline status
│   ├── prepare_annual_review      — Pre-populate review pack from all modules
│   └── track_ehcp_timeline        — 20-week application progress
```

### AI Evidence Scoring

When a SENCO asks Ed "Is this EHCP application strong enough?", Ed analyses:

1. **Completeness** (0-30 points): Are all required evidence types present?
   - School evidence: APDR cycles, provision map, attendance, assessments ✓/✗
   - Parent views: Captured via survey or written statement ✓/✗
   - Pupil views: One-page profile or survey ✓/✗
   - Professional reports: EP, relevant therapy reports ✓/✗

2. **Quality** (0-40 points): Does the evidence demonstrate unmet need?
   - APDR cycles show graduated approach was followed ✓/✗
   - Provision map shows costs exceed £6,000 threshold ✓/✗
   - Progress data shows lack of expected progress despite intervention ✓/✗
   - Professional reports support the need for statutory assessment ✓/✗

3. **Consistency** (0-30 points): Do all sources tell the same story?
   - School data aligns with professional assessments ✓/✗
   - Parent views consistent with school observations ✓/✗
   - Assessment data supports the identified primary need ✓/✗
   - No contradictory evidence ✓/✗

**Score interpretation**:
- 80-100: Strong application — likely to succeed
- 60-79: Reasonable but gaps exist — address before submitting
- 40-59: Weak — significant evidence gaps, likely to be refused
- 0-39: Not ready — more graduated approach cycles needed

---

## 9. EHCP Sections A-K: Evidence Mapping

The EHC Plan has a prescribed structure (Sections A-K). Each section draws from specific evidence types, all of which map to Schoolgle modules:

| Section | Content | Evidence Sources | Schoolgle Module |
|---------|---------|-----------------|-----------------|
| **A** | Views, interests and aspirations of child/parent | Parent views form, pupil views, one-page profile | Surveys, Document Production |
| **B** | Special educational needs | EP report, school assessments, SALT/OT reports, APDR cycles | Intelligence Engine, SEND Hub (file upload + APDR) |
| **C** | Health needs related to SEN | Paediatric reports, therapy records, health care plans | SEND Hub (file upload) |
| **D** | Social care needs related to SEN | Social worker assessments, CIN/CP plans, Early Help records | SEND Hub (file upload, restricted access) |
| **E** | Outcomes sought | Agreed at drafting, informed by all professional evidence | SEND Hub (targets/outcomes) |
| **F** | Special educational provision | Based on professional recommendations, costed provision map | SEND Hub (provision map), Staff Directory |
| **G** | Health provision | Based on health professional advice | SEND Hub (file upload) |
| **H1/H2** | Social care provision | Based on social care advice | SEND Hub (file upload) |
| **I** | Placement | School/setting | SEND Hub (register) |
| **J** | Personal budget | Where applicable | Funding Intelligence |
| **K** | Appendices | ALL professional reports, assessments, meeting notes | All modules — the evidence pack |

---

## 10. Standardised Assessments Reference

Common standardised tests referenced in EHCP evidence, and where results are stored in Schoolgle:

| Test | Measures | Used By | Schoolgle Storage |
|------|----------|---------|-------------------|
| **WISC-V** (Wechsler Intelligence Scale) | Cognitive ability / IQ | EP | Intelligence Engine (via CSV) or SEND Hub (EP report upload) |
| **BAS-3** (British Ability Scales) | Cognitive ability | EP | Intelligence Engine or EP report |
| **CELF-5** (Clinical Evaluation of Language) | Receptive/expressive language | SALT | SEND Hub (SALT report) |
| **BPVS-3** (British Picture Vocabulary Scale) | Receptive vocabulary | SALT / EP | SEND Hub or Intelligence Engine |
| **YARC** (York Assessment of Reading) | Reading accuracy, rate, comprehension | School / EP | Intelligence Engine (pupil assessments) |
| **WRAT-5** (Wide Range Achievement Test) | Reading, spelling, maths | EP | EP report or Intelligence Engine |
| **Boxall Profile** | Social/emotional/behavioural development | SENCO / class teacher | SEND Hub (SEMH assessment tracker) |
| **SDQ** (Strengths & Difficulties Questionnaire) | Emotional/behavioural screening | School / parents / clinicians | SEND Hub (SEMH tracker) or Surveys |
| **Conners Rating Scales** | ADHD screening | Paediatrician | SEND Hub (medical report) |
| **ADOS-2** (Autism Diagnostic Observation) | ASD diagnosis | Specialist clinician | SEND Hub (medical report) |
| **Sensory Profile** (Dunn) | Sensory processing | OT | SEND Hub (OT report) |
| **Movement ABC-2** | Motor coordination / DCD | OT / Physio | SEND Hub (OT/physio report) |
| **B-Squared** | SEN-specific progress (SLD/PMLD) | School | Intelligence Engine (specialist import) |
| **PIVATS** | Value-added target setting | School | Intelligence Engine (specialist import) |

---

## 11. Evidence Quality: What Makes Applications Succeed or Fail

### Common Reasons SEND Panels Reject Applications

| Rejection Reason | What Our AI Checks |
|-----------------|-------------------|
| "Insufficient graduated approach evidence" | Are there 2+ complete APDR cycles? Are targets SMART? |
| "Child is making progress" | Does progress data show rate of progress, not just attainment? Is the gap widening? |
| "Needs being met by current provision" | Does provision map show costs exceeding £6,000? Is there evidence provision is unsustainable? |
| "Lack of quantified targets" | Are IEP/support plan targets specific and measurable? |
| "No evidence of intervention impact" | Do intervention logs show what was tried, for how long, and what happened? |
| "Professional reports not yet implemented" | Has the school acted on existing EP/SALT/OT recommendations? |

### Critical Legal Points for Ed's AI Coaching

1. **The threshold is "may"** — schools only need to show a child *may* have needs requiring an EHCP, not prove it definitively
2. **No diagnosis required** — the SEND CoP is clear that a medical diagnosis is not necessary for an EHCP
3. **"Despite" is the key word** — evidence must show lack of progress *despite* relevant and purposeful action
4. **Quantitative beats qualitative** — standardised scores and percentiles are more compelling than narrative descriptions
5. **Tribunal success is high** — refusal-to-assess appeals have a high success rate at the First-tier Tribunal (SEND)
6. **Parents can submit their own evidence** — there is no legal requirement to use the LA's template for parent views

---

## Sources

### SEND Code of Practice
- [SEND Code of Practice 2015](https://www.gov.uk/government/publications/send-code-of-practice-0-to-25) — Chapter 9: EHC Needs Assessment
- Section 9.14: Information from school/setting
- Section 9.15: Advice from educational psychologist, health, social care
- Section 9.21: Views of child/young person and parents
- Section 9.22: Other relevant information

### Evidence Guidance
- [IPSEA: EHC Needs Assessment](https://www.ipsea.org.uk/ehc-needs-assessments) — Evidence requirements
- [Contact: Requesting an EHC Assessment](https://contact.org.uk/help-for-families/information-advice-services/education/ehc-plans/requesting-an-ehc-needs-assessment/)
- [Council for Disabled Children: EHCP Process](https://councilfordisabledchildren.org.uk/resources/all-resources/filter/ehc-plans)
- [Special Needs Jungle: Annual Reviews](https://www.specialneedsjungle.com/annual-reviews-ehcp/)

### Professional Report Standards
- [BPS: Standards for EP Reports](https://www.bps.org.uk/) — Educational Psychology report structure
- [RCSLT: SALT Report Standards](https://www.rcslt.org/) — Speech & Language Therapy reporting
- [RCOT: OT Report Standards](https://www.rcot.co.uk/) — Occupational Therapy reporting
- [AEP: Guidance for EPs providing EHCNA advice](https://www.aep.org.uk/) — EP report structure for statutory assessments

### Additional Research Sources
- [Special Needs Jungle: What evidence do I need?](https://www.specialneedsjungle.com/send-law-research/special-needs/what-evidence-do-i-need-to-collect-to-apply-for-an-ehc-plan/)
- [Education Advocacy: EHCP Annual Review Guide](https://educationadvocacy.co.uk/what-is-a-ehcp/ehcp-annual-review-guide/)
- [IPSEA: Refusal to Assess Appeals](https://www.ipsea.org.uk/refusal-to-assess-appeals)
- [Evisense: SEND Evidence System](https://evisense.com/send/) — Competitor for photo/video evidence
- [Structural Learning: 2025 Guide to EHCPs](https://www.structural-learning.com/post/ehcps)
- [KELSI Kent: EHC Needs Assessment Requests](https://www.kelsi.org.uk/special-education-needs/special-educational-needs/education,-health-and-care/Education-Health-and-Care-EHC-Needs-Assessments-requests) — LA-specific forms example
- [SENsible SENCO: Provision Mapping Resources](https://sensiblesenco.org.uk/senco-hub/sen-resource-library/) — Provision mapping templates
