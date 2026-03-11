# Ofsted Readiness Scanner

## Module Summary

The Ofsted Readiness Scanner is Schoolgle's core inspection preparation tool. It connects to a school's Google Drive (or OneDrive), analyses documents against the 2025 Education Inspection Framework, and produces a comprehensive readiness report card mirroring what Ofsted inspectors generate.

**Module ID**: `improvement` / App ID: `ofsted-readiness`
**Route**: `/dashboard/ofsted-readiness`
**Accent Colour**: Sky blue (`#0ea5e9`)
**Access**: admin, headteacher, slt, teacher

---

## Architecture Overview

### Data Flow (GDPR-Compliant)

```
School Google Drive → OAuth (read-only) → Stream to memory → AI Analysis → Discard content → Store anonymised report
```

1. School admin connects Google Drive via OAuth 2.0 (read-only, designated folder only)
2. School admin triggers "Run Scan" in Schoolgle
3. Backend reads folder structure and file list via Google Drive API
4. For each document, content is streamed into memory on the server
5. Content sent to AI model (OpenRouter commercial API — no training, no retention)
6. AI response parsed into report card structure
7. **Document content immediately discarded** — never written to disk or database
8. Anonymised report card (grades, flags, recommendations) stored in Supabase

### Critical GDPR Guarantees

- **No pupil data stored**: Only grades, percentages, flags — never names, UPNs, or identifiable data
- **No training**: OpenRouter commercial API with contractual no-training guarantees
- **School controls access**: Connect/disconnect at any time, choose which folder to share
- **Encrypted tokens**: Drive access tokens encrypted at rest in `ofsted_drive_connections`
- **Audit trail**: All scans logged with timestamps and user IDs

---

## 2025 Framework: 6 Evaluation Areas + Safeguarding

### 5-Point Grading Scale

| Grade              | Score | Colour                 | Description                          |
| ------------------ | ----- | ---------------------- | ------------------------------------ |
| Exceptional        | 100   | `#16A34A` (green-600)  | Highest quality, sustained over time |
| Strong Standard    | 80    | `#65A30D` (lime-600)   | All expected + strong standards met  |
| Expected Standard  | 60    | `#CA8A04` (yellow-600) | Meets all statutory requirements     |
| Needs Attention    | 40    | `#EA580C` (orange-600) | Some standards not fully met         |
| Urgent Improvement | 20    | `#DC2626` (red-600)    | Significant failures identified      |

**Safeguarding**: Graded separately as **Met** or **Not Met** (binary).

### 6 Core Evaluation Areas (21 Subcategories)

| #   | Area                        | Subcategories                                           | Key Evidence                                         |
| --- | --------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| 1   | **Inclusion**               | SEND Provision, Disadvantaged Pupils, Mental Health     | SEND Policy, PP Strategy, Provision Maps             |
| 2   | **Curriculum & Teaching**   | Curriculum Design, Teaching Quality, Reading & Literacy | Curriculum Maps, Observations, Phonics Programme     |
| 3   | **Achievement**             | Academic Outcomes, Progress, Next Stage Preparation     | KS2 Results, Tracking Data, Baseline Assessments     |
| 4   | **Attendance & Behaviour**  | Attendance, Conduct, Attitudes to Learning              | Attendance Data, Behaviour Policy, Exclusion Records |
| 5   | **Personal Development**    | Character, British Values, Enrichment, RSE              | PSHE Curriculum, RSE Policy, Enrichment Programme    |
| 6   | **Leadership & Governance** | Vision & Strategy, Governance, Staff Development        | SEF, SIP, Governor Minutes, CPD Records              |

### Safeguarding Checklist (10 Items)

All items must be met for overall "Met" status:

1. Safeguarding policy (references KCSIE 2024)
2. Single Central Record (SCR) — all required fields
3. DBS checks — current, no gaps
4. DSL training — within 2 years
5. Online safety policy — current
6. Staff safeguarding training — annual KCSIE Part 1
7. Whistleblowing policy — present
8. Safer recruitment procedures — documented
9. Referral procedures — MASH/LADO pathways
10. Safeguarding culture — whole-school awareness (recommended)

---

## UI Tabs

The module has 6 tabs:

| Tab                  | Component                 | Purpose                                                             |
| -------------------- | ------------------------- | ------------------------------------------------------------------- |
| **Overview**         | `OfstedDashboard`         | Overall readiness score, category breakdown, welcome guide          |
| **Safeguarding**     | `SafeguardingPanel`       | Binary Met/Not Met checklist with 10 safeguarding requirements      |
| **Framework**        | `OfstedFrameworkView`     | Interactive 6-category assessment with Google Drive scanning        |
| **Documents**        | `DocumentPresenceChecker` | Checks which expected documents exist in the connected Drive folder |
| **Evidence**         | `OfstedEvidenceMatcher`   | AI-powered evidence linking to framework requirements               |
| **Readiness Report** | `OfstedReadinessReport`   | Full report card with gaps analysis, trends, PDF export             |

---

## Database Schema

### Tables

| Table                        | Purpose                                              | RLS                        |
| ---------------------------- | ---------------------------------------------------- | -------------------------- |
| `ofsted_assessments`         | School self-assessments per subcategory              | Yes — org-based            |
| `ofsted_evidence_matches`    | AI-matched evidence links to framework criteria      | Yes — org-based            |
| `ofsted_readiness_snapshots` | Historical readiness snapshots for trends            | Yes — org-based            |
| `ofsted_drive_connections`   | Persistent Google Drive/OneDrive connections         | Yes — admin only for write |
| `ofsted_safeguarding_checks` | Safeguarding checklist items (Met/Not Met)           | Yes — org-based            |
| `ofsted_document_checks`     | Document presence check results                      | Yes — org-based            |
| `documents`                  | Scanned document metadata (no content!) + embeddings | Yes — org-based            |

### Migrations

- `20260128_ofsted_integration.sql` — Core tables (assessments, evidence, snapshots, documents)
- `20260308_ofsted_drive_connections.sql` — Drive connections, safeguarding checks, document checks

---

## API Routes

| Method | Route                        | Purpose                                                                      |
| ------ | ---------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/api/ofsted/assessments`    | Fetch assessments by org/category/subcategory                                |
| POST   | `/api/ofsted/assessments`    | Upsert assessments                                                           |
| GET    | `/api/ofsted/readiness`      | Calculate overall readiness with gaps                                        |
| POST   | `/api/ofsted/readiness`      | Create readiness snapshot                                                    |
| GET    | `/api/ofsted/evidence`       | Fetch evidence matches                                                       |
| POST   | `/api/ofsted/evidence`       | **AI-powered document matching** — analyses document text and stores matches |
| GET    | `/api/ofsted/safeguarding`   | Fetch safeguarding checklist                                                 |
| POST   | `/api/ofsted/safeguarding`   | Upsert safeguarding check items                                              |
| GET    | `/api/ofsted/connections`    | List active Drive connections                                                |
| POST   | `/api/ofsted/connections`    | Create/update Drive connection                                               |
| DELETE | `/api/ofsted/connections`    | Deactivate connection (soft delete)                                          |
| POST   | `/api/ofsted/document-check` | Run document presence check against expected evidence                        |
| POST   | `/api/scan`                  | Full Drive scan — streams files, extracts text, runs AI matching             |
| GET    | `/api/drive/auth`            | Initiate Google Drive OAuth                                                  |
| GET    | `/api/drive/callback`        | Handle OAuth callback                                                        |

---

## AI Model Stack

| Model                 | Purpose                            | Cost           | Used For           |
| --------------------- | ---------------------------------- | -------------- | ------------------ |
| DeepSeek V3           | Primary document analysis          | $0.24/M input  | 95% of documents   |
| Mistral OCR           | Scanned PDFs/images                | ~$0.002/doc    | OCR extraction     |
| Qwen 2.5 VL 72B       | Charts, diagrams, **work samples** | $0.40/M input  | Visual content     |
| Gemini 2.0 Flash Lite | Fallback/retry                     | $0.075/M input | When primary fails |
| Claude 3.5 Sonnet     | SEF generation, synthesis          | $0.015/req     | Premium features   |

Configuration: `apps/platform/src/lib/ai-evidence-matcher.ts`

---

## Key Files

### Framework & Types

- `src/lib/ofsted/types.ts` — All TypeScript types (categories, assessments, API DTOs)
- `src/lib/ofsted/framework-data.ts` — EIF 2025 framework data (6 categories, 21 subcategories, 80+ evidence items, safeguarding requirements)
- `src/lib/ofsted/index.ts` — Module exports
- `src/lib/ofsted.ts` — Barrel file with backwards compatibility
- `src/lib/ofsted-framework.ts` — Legacy framework (deprecated, kept for backwards compat)

### Components

- `src/components/ofsted/OfstedDashboard.tsx` — Overview dashboard
- `src/components/ofsted/SafeguardingPanel.tsx` — Safeguarding Met/Not Met checklist
- `src/components/ofsted/OfstedFrameworkView.tsx` — Interactive framework assessment
- `src/components/ofsted/DocumentPresenceChecker.tsx` — Document presence audit
- `src/components/ofsted/OfstedEvidenceMatcher.tsx` — Evidence linking UI
- `src/components/ofsted/OfstedReadinessReport.tsx` — Readiness report with trends

### AI & Cloud

- `src/lib/ai-evidence-matcher.ts` — Multi-model AI matching engine (evidence → framework area)
- `src/lib/ai-quality-assessor.ts` — **Area-specific quality assessment** (7 specialist prompts + DfE benchmarks)
- `src/lib/assessment-updater.ts` — Count-based assessment (Phase 1, fast fallback)
- `src/lib/cloud-service.ts` — Google Drive + OneDrive API integration
- `src/lib/extractors.ts` — Document text extraction (DOCX, XLSX, PDF, images)

### Pages

- `src/app/(dashboard)/dashboard/ofsted-readiness/page.tsx` — Main page (6 tabs)

### API Routes

- `src/app/api/ofsted/assessments/route.ts`
- `src/app/api/ofsted/readiness/route.ts`
- `src/app/api/ofsted/evidence/route.ts` — **AI matching integration**
- `src/app/api/ofsted/safeguarding/route.ts`
- `src/app/api/ofsted/connections/route.ts`
- `src/app/api/ofsted/document-check/route.ts`
- `src/app/api/scan/route.ts` — Full scan pipeline
- `src/app/api/drive/auth/route.ts` + `callback/route.ts`

---

## Document Presence Checker

The scanner checks for expected documents mapped to each evaluation area:

| Area                   | Expected Documents                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Safeguarding           | Safeguarding Policy, SCR, DSL Training, Online Safety Policy, Whistleblowing, Safer Recruitment              |
| Inclusion              | SEND Policy, SEND Register, Pupil Premium Strategy, Provision Map, Accessibility Plan                        |
| Curriculum & Teaching  | Curriculum Overview, Subject Policies, Progression Maps, Phonics Programme, CPD Records, Monitoring Schedule |
| Achievement            | Assessment Data, KS2 Results, Phonics Results, EYFS Outcomes, Progress Tracking                              |
| Attendance & Behaviour | Attendance Data, Attendance Policy, Behaviour Policy, Exclusion Data                                         |
| Personal Development   | PSHE Curriculum, RSE Policy, British Values, Enrichment Programme                                            |
| Leadership             | SEF, School Improvement Plan, Governor Minutes, Governor Training, Staff Wellbeing                           |

Matching is fuzzy (case-insensitive, partial match) — "safeguarding-policy-2025.pdf" matches "Safeguarding Policy".

---

## Recommended Folder Structure (for schools)

Schools should create this folder structure in their Google Drive:

```
📁 Ofsted Evidence/
├── 📁 01-Safeguarding/
├── 📁 02-Inclusion/
├── 📁 03-Curriculum-and-Teaching/
├── 📁 04-Achievement/
├── 📁 05-Attendance-and-Behaviour/
├── 📁 06-Personal-Development/
├── 📁 07-Leadership-and-Governance/
└── 📁 08-Self-Evaluation/
```

---

## Build Status & Roadmap

### Completed

- [x] EIF 2025 framework data (6 categories, 21 subcategories)
- [x] 5-point grading scale with colour coding
- [x] Google Drive OAuth (read-only, designated folder)
- [x] OneDrive support via Microsoft Graph API
- [x] Recursive folder scanning with progress callbacks
- [x] AI evidence matcher (multi-model: DeepSeek, Mistral OCR, Qwen Vision, Gemini)
- [x] Document extraction (DOCX, XLSX, PDF, images with OCR)
- [x] AI matching wired to `/api/ofsted/evidence` POST endpoint
- [x] Evidence counts auto-update on assessments
- [x] Safeguarding binary Met/Not Met assessment (10-item checklist)
- [x] Document presence checker (fuzzy matching against expected evidence)
- [x] Persistent Drive connections with encrypted tokens
- [x] RLS policies on all tables
- [x] 6-tab dashboard UI
- [x] Readiness report with gaps analysis
- [x] Historical snapshots with trend comparison
- [x] Report card UI matching Ofsted format
- [x] **Area-specific quality assessment** — 7 specialist AI prompts (one per evaluation area + safeguarding) that assess document quality against Ofsted criteria, not just presence
- [x] **DfE benchmark integration** — Quality assessor automatically pulls attendance, census, and outcomes data for contextualised ratings
- [x] **Database constraint fix** — Migration to correct CHECK constraints from legacy 4-category to EIF 2025 6-category IDs
- [x] **UI rating alignment** — SubcategoryAssessment and FrameworkCategoryCard updated to support all 5 EIF 2025 ratings
- [x] **Two-phase assessment pipeline** — Scan route now runs Phase 1 (count-based) then Phase 2 (quality-based) with graceful fallback
- [x] **Living SEF/SDP engine** — Cross-module data aggregator that pulls from ALL Schoolgle modules (assessments, evidence, actions, DfE data, estates, governance, compliance, staff) to generate evaluative SEF sections using Claude AI, with auto-generated SDP priorities sorted by lowest-scoring areas
- [x] **SEF/SDP API routes** — `/api/sef/generate` (POST generate, GET latest), `/api/sef/[id]` (GET/PUT), `/api/sdp/generate` (POST regenerate, GET list)
- [x] **SEF data aggregator** — Parallel Supabase queries across 8 module table sets with graceful fallback per module
- [x] **SDP priorities table** — Normalised `sdp_priorities` with EEF strategy links, cross-module impact tracking, milestones, and budget tracking

### Phase 2.5 — Quality Assessment Architecture

The quality assessment engine (`ai-quality-assessor.ts`) provides area-specific evaluation:

| Area                    | AI Prompt Knows About                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Inclusion               | Graduated approach (APDR), SEND Code of Practice, PP barriers, EEF strategies         |
| Curriculum & Teaching   | DfE-validated SSP, curriculum sequencing, knowledge building, assessment for learning |
| Achievement             | KS2 benchmarks, progress scores, disaggregated data, trend analysis                   |
| Attendance & Behaviour  | 96% attendance benchmark, PA rates, same-day absence response, exclusion data         |
| Personal Development    | Statutory RSE, British Values embedding, character education, SMSC                    |
| Leadership & Governance | SEF accuracy, SMART targets, governor challenge, workload management                  |
| Safeguarding            | KCSIE 2024 reference, SCR completeness, DBS currency, binary Met/Not Met              |

Each prompt has 5-level quality criteria (Exceptional → Urgent Improvement) describing exactly what inspectors look for at each level. The safeguarding prompt is binary (Met/Not Met) with 10 mandatory checks.

### Phase 3 — Assessment Data Engine (Next)

- [ ] CSV/Excel parser for school tracking data (SIMS, Arbor, ScholarPack exports)
- [ ] Statistical anomaly detection (teacher assessments vs national benchmarks)
- [ ] Year-on-year cohort trajectory analysis
- [ ] Disadvantaged/SEND gap analysis vs national data
- [ ] SEF cross-reference (does data support SEF claims?)

### Phase 4 — Vision AI Work Sampling (Premium)

- [ ] Image processing pipeline for pupil work photographs
- [ ] Year-group-appropriate assessment criteria (National Curriculum expectations)
- [ ] Cross-reference work quality against teacher-reported levels
- [ ] Moderation flag generation ("worth moderating" not "teacher is wrong")

### Phase 5 — Polish & Scale

- [ ] MAT dashboard (aggregate report cards across schools)
- [ ] PDF export of report card for governors
- [ ] Scheduled automatic scans (daily/weekly/monthly)
- [ ] Email notifications when scan completes or issues found
