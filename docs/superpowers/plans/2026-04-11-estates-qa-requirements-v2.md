# Estates Compliance Module — QA Test Requirements v2

**Author:** Jarvis (acting as QA Test Lead)
**Date:** 11 April 2026
**Target:** Estates Compliance module for Schoolgle Platform
**Methodology:** Zero-trust, bug-hunter mindset. Assume nothing works until proven. Click every button, upload every file, come back tomorrow and check it's still there.

---

## 1. Purpose and Mindset

This document defines the test requirements for sign-off of the Estates Compliance module for UK school clients. It is written from the perspective of a QA Test Lead at a leading UK compliance SaaS company whose job is to **find bugs before customers do**.

The test philosophy is:

1. **Every button must do something.** If it's on the screen, it must serve a purpose in the user journey. Buttons that don't work, don't lead anywhere useful, or exist as placeholders are bugs.
2. **Every feature must complete the loop.** Create → store → retrieve → display → modify → delete. If any step is broken, the feature is broken.
3. **Every field must be validated.** Empty input, invalid input, too long, SQL injection, XSS — all handled gracefully.
4. **Every error must be human-readable.** No raw JSON dumps, no stack traces, no "Authentication error" without context.
5. **Every file upload must persist.** Upload → storage bucket → DB reference → retrievable → downloadable → viewable in context.
6. **Every user journey must be completable on mobile.** Caretakers do rounds with a tablet, not at a desk.
7. **Every regulation must map to a workable feature.** If HSE L8 requires monthly temperature checks, can a school actually record those temperatures end-to-end and prove compliance to an inspector?
8. **Every feature must stand up next to competitors.** If Every Compliance, Atlas, or Parago has it, we need to know why we don't — and decide whether we should.

**If any of the above is not met, it is a bug, a UX gap, or a product feature gap. All three go into the report.**

---

## 2. Scope

### In Scope
- All pages under `/estates-compliance/*` and `/dashboard/estates/*`
- All API routes under `/api/estates/*` and `/api/estates-compliance/*`
- All Ed AI skills in the estates, compliance, and risk domains
- All Supabase tables prefixed `estates_*` and `compliance_*`
- Supabase storage buckets `estates-documents` and `estates-images`
- Cross-module data flows to risk register, actions hub, helpdesk
- Governor report generation and export
- Mobile responsive behaviour on tablet and phone viewports
- Terry Taurus PROPOSE-APPROVE flow end-to-end

### Out of Scope
- Pricing, billing, subscription management (handled elsewhere)
- Other modules (HR, SEND, Governance) — only tested at the integration boundary
- Email delivery (SMTP configuration testing)
- Third-party integrations outside estates (Arbor, SIMS)
- Load testing at scale (only smoke-level performance)
- Penetration testing beyond basic auth checks

---

## 3. Test Personas

Tests are organised by persona because different users have different journeys and different tolerances for complexity.

| Persona | Role | Context | Tolerance | Key Needs |
|---------|------|---------|-----------|-----------|
| **Brian the Caretaker** | Site manager | Tablet in the boiler room, hands wet, 2 minutes between jobs | Very low — big buttons, plain English, camera opens instantly | Complete daily checks, log issues, take photos |
| **Sandra the SBM** | School Business Manager | Desktop, budget meeting in 30 min, needs to extract data to Excel | Medium — will read instructions but wants export buttons | Run reports, see cost forecasts, approve contractor spend |
| **Hannah the Head** | Headteacher | Mobile at 7am or desktop during prep, 30 seconds to answer a governor question | Very low — needs a single RAG number and a plain-English summary | "Are we compliant?" + Ofsted-ready evidence |
| **Gavin the Governor** | Premises committee chair | Paper agenda, rarely logs in, wants a PDF before the meeting | None — cannot tolerate login friction | PDF report summarising the full estates position |
| **Olivia the Ofsted Inspector** | External inspector | Sits at school for 2 days, asks for evidence on demand | Zero — this is a compliance moment | Evidence trail on every statutory duty, dated and attributed |
| **Emma the Environmental Health Officer** | External regulator | Unscheduled visit, requests legionella records on the spot | Zero — statutory | Temperature logs, risk assessment, remedial actions |

---

## 4. Test Environment

- **URL:** http://localhost:3000
- **Tenant:** Grove House Primary School (URN 148201)
- **User:** admin@schoolgle.co.uk (David Summerscales, role: admin)
- **Database:** Supabase project `ygquvauptwyvlhkyxkwy`
- **Storage buckets:** `estates-documents` (50MB max, PDF/DOCX/XLSX), `estates-images` (20MB max, JPEG/PNG/WebP)
- **Browser:** Chromium via Playwright MCP (standalone)
- **Test artefacts:**
  - Screenshots in `.playwright-mcp/qa-screenshots-v2/`
  - Test fixture files in `.playwright-mcp/qa-fixtures/` (sample PDF, sample PNG)
  - Results log in `/tmp/estates-qa-v2-results.md`

---

## 5. Test Categories

### 5.1 UX Button Audit

**Every button, link, icon, dropdown, and tab on every page** must be verified against this checklist:

- Does clicking it do what the label says?
- Does the destination page exist and load?
- Does the destination serve a clear user purpose?
- Is there a loading state between click and destination?
- Does the back button work after clicking?
- On mobile, is the tap target at least 44×44 pixels?
- Does keyboard Tab reach it, and Enter activate it?
- If disabled, is there a tooltip explaining why?
- If it triggers a destructive action (delete, complete, submit), is there a confirmation?

**Dead buttons are bugs.** A button labelled "Upload Plan" that does nothing is worse than no button at all — it erodes trust.

### 5.2 Data Integrity

For every resource type (ticket, check completion, asset, contractor, evidence, cost request):

1. **Create** — Submit the form, verify 2xx response, verify DB row exists with correct fields
2. **Read** — Navigate to the detail view, verify all fields display correctly
3. **List** — Navigate to the list view, verify the new item appears with correct summary info
4. **Update** — Edit a field, submit, verify DB row reflects the change, verify the list view updates
5. **Delete/Archive** — Where allowed, soft-delete, verify item disappears from list but is recoverable from audit log
6. **Audit trail** — Verify every mutation is logged with user_id, timestamp, and before/after values

### 5.3 File and Image Handling

For every feature that accepts file uploads:

1. **Upload valid file** — PNG, JPG, PDF, DOCX, XLSX. Verify 2xx response.
2. **Verify storage** — File actually appears in Supabase storage bucket with org-scoped path.
3. **Verify DB reference** — Row in `estates_evidence` or equivalent table with file_url populated.
4. **Verify retrieval** — Navigate away, come back, verify file is still listed.
5. **Verify display** — Images render as thumbnails; PDFs open in viewer or download.
6. **Verify download** — Download the file and confirm it's not corrupt.
7. **Upload oversized file** — Verify rejection with human-readable error.
8. **Upload invalid type** — Verify rejection with human-readable error.
9. **Upload file with weird name** — `file with spaces.pdf`, `résumé.pdf`, `../../etc/passwd.png`. Verify sanitisation.
10. **Cross-tenant isolation** — Upload as Grove House, try to view from another org's URL. Verify blocked.

### 5.4 Form Validation

For every form:

- Submit empty → required fields flagged with readable errors
- Submit with only whitespace → treated as empty
- Submit with maximum length strings → either accepted or rejected with message
- Submit with SQL-like input → `'); DROP TABLE students;--` → no crash, escaped correctly
- Submit with HTML/JS → `<script>alert(1)</script>` → rendered as text, not executed
- Submit with unicode → Arabic, Chinese, emoji → stored and displayed correctly
- Submit with invalid date format → rejected with example of correct format
- Submit with future date when past is required (or vice versa) → rejected with explanation
- Submit with disabled button clicked via devtools → server-side rejected

### 5.5 Critical User Journeys

Each journey is a happy-path test, followed by edge case variations.

#### J1: Brian the Caretaker does the morning walkaround
1. Opens tablet, navigates to estates-compliance mobile URL
2. Sees "Today's Tasks" card with daily opening checks
3. Taps "Opening Checks" → check list appears
4. Taps first check (e.g. "Fire exits clear") → confirmation dialog
5. Marks pass → moves to next
6. Taps a check that needs attention (e.g. "Water temperature below 20°C fridge") → form appears
7. Takes a photo using device camera
8. Submits with note "Fridge reading 24°C — investigate"
9. Returns to home, sees that check marked as attention-required
10. Logs a new helpdesk ticket: "Staffroom fridge not cooling"
11. Takes another photo, submits
12. Returns to dashboard → new ticket appears in helpdesk list

#### J2: Sandra the SBM runs a compliance review
1. Opens desktop browser, logs in
2. Navigates to estates-compliance
3. Sees RAG summary: X% complete, Y overdue
4. Clicks into Fire Safety domain
5. Sees detail with all 11 checks, status, next due date
6. Clicks "Export to Excel" (DOES THIS BUTTON EXIST?)
7. Gets Excel file with all check data
8. Navigates to Contractors
9. Sees list with expiry warnings for insurance/DBS
10. Clicks a contractor → full profile with attached documents
11. Downloads a contractor's insurance PDF
12. Verifies the PDF opens correctly

#### J3: Hannah the Head prepares for a governor meeting
1. Opens mobile browser at 7am
2. Asks Ed: "what's our compliance status for the governor meeting tonight?"
3. Ed returns RAG summary + 3 key concerns
4. Taps "Generate Governor Report"
5. PDF generates in under 5 seconds
6. Taps "Email to governors" → selects governors → sends
7. Governors receive email with PDF attachment

#### J4: Gavin the Governor receives the report
1. Opens email on iPad
2. Taps attachment → PDF opens
3. Sees "Premises Compliance Report" with executive summary
4. Scrolls through 18 domain status table
5. Sees overdue items highlighted
6. Can read without needing to log in to Schoolgle

#### J5: Olivia the Ofsted Inspector requests evidence
1. At the school, asks "show me your fire risk assessment and monthly temperature logs"
2. SBM logs in, navigates to Fire Safety domain
3. Opens most recent Fire Risk Assessment — PDF visible with date stamp
4. Opens Legionella → Monthly Temperature Monitoring
5. Sees completion history with dates, readings, who completed
6. Clicks into specific completion → evidence photo visible
7. Exports audit trail as PDF for inspector's records

#### J6: Ed creates a ticket from Terry's PROPOSE flow
1. User types "The window latch in Year 3 is broken, it's a safeguarding risk"
2. Terry returns PROPOSAL with: ticket fields pre-filled, 5×5 risk assessment (likelihood 3, impact 4, score 12, safeguarding flag true), regulatory refs
3. User clicks "Approve" on the proposal
4. Ticket is created in DB with status=open, safeguarding_flag=true, risk_score=12
5. Ticket appears in helpdesk list
6. Risk register entry auto-created (because safeguarding + score >= 8 in safeguarding category)
7. User can open the ticket and see it linked to the risk register entry

### 5.6 Regulatory Completeness

The product must allow a UK school to actually demonstrate compliance with:

| Regulation | Requirement | Test |
|-----------|-------------|------|
| HSE L8 (Legionella) | Weekly flushing log, monthly temperatures, annual risk assessment | Verify these checks exist, can be completed, evidence uploaded, historical log retrievable |
| RRO 2005 (Fire) | Fire risk assessment, weekly alarm test, termly drill, annual servicing | Same — check presence + lifecycle |
| CAR 2012 (Asbestos) | Register, management plan, 3-yearly re-inspection | Does the system store an asbestos register? Can it alert on re-inspection due? |
| EAWR 1989 (Electrical) | 5-yearly fixed wire test, PAT testing | Can I see the last fixed wire test certificate? |
| Gas Safety (I&U) Regs | Annual landlord certificate | Does the system alert on expiring certificates? |
| RIDDOR | Report >7 day incapacitation, specified injuries | Does the incident reporting flow detect RIDDOR and route to HSE F2508? |
| COSHH 2002 | Risk assessments per substance, safety data sheets | Can SDS be uploaded, linked to a substance register? |
| LOLER 1998 | 6-monthly lift examinations | Alert on next examination due? |
| DfE Good Estate Management | Condition data collection, 3-year maintenance plan | Can you record CDC scores and forecast a plan? |
| Academies Financial Handbook | Asset register for trusts | Does the asset register meet AFH requirements? |

**For each row, the test is: can a school produce the evidence an inspector would ask for?** If not, it's a product gap.

### 5.7 Cross-Module Integration

| Integration | Test |
|------------|------|
| Estates → Risk Register | Overdue check → risk auto-created with correct category and score |
| Estates → Actions Hub | Finding → action created, visible in actions list |
| Estates → Helpdesk | Compliance issue → ticket with linked_compliance_check_id |
| Estates → Finance | Cost request → appears in finance module for approval |
| Estates → Governance | Compliance data → governor pack auto-populated |
| Estates → Staff Connectors | Fire Marshal role → auto task generation |
| Estates → Intelligence Engine | Building closure → cohort attendance factor |
| Estates → SEF/SDP | Space constraint → surfaced in SEF evaluation |

For each, verify the data actually flows, not just that the code exists.

### 5.8 Permissions and Row-Level Security

- Admin user: full access — verify all CRUD works
- Non-admin member of org: verify read access, no access to delete/approve
- User in different org: verify zero access (RLS blocks)
- Unauthenticated user: verify 401 on all routes
- Service role: verify bypasses RLS only where appropriate
- Attempt to mutate another org's data via modified request → blocked

### 5.9 Error States

For every feature:

- Submit form → unplug network → does it fail gracefully?
- Load page while logged out → redirect to login with return URL?
- Open a resource that doesn't exist → 404 with useful message, not stack trace?
- Supabase returns 500 → user sees "something went wrong, try again" not JSON dump?
- File upload fails mid-way → user told why, can retry?
- Ed skill throws exception → user told Ed couldn't complete task, not raw error?

### 5.10 Competitive Gap Analysis

Benchmark against the UK market leaders in school estates compliance:

- **Every Compliance** (evry-fm.com) — feature checklist
- **Atlas Facilities** — feature checklist
- **Parago** — feature checklist
- **PlanitPlus Estates** — feature checklist
- **Civica Estates** — feature checklist
- **Capita SIMS Estate module** — feature checklist
- **Strive Estates (new entrant)** — feature checklist

For each competitor, list the features they have that Schoolgle estates does not. Those become product feature gaps in the final report.

### 5.11 Accessibility (WCAG 2.1 AA minimum)

- Keyboard-only navigation — can I complete J1 without a mouse?
- Screen reader — does the dashboard announce meaningfully?
- Colour contrast — does the RAG dashboard meet 4.5:1 for text?
- Focus indicators — visible on every interactive element?
- Form labels — every input has a visible label or aria-label?
- Error identification — errors announced to screen reader users?
- Zoom to 200% — does layout still work?

### 5.12 Performance (Smoke Level)

- Dashboard first contentful paint < 2s on dev server
- Governor report generates < 3s with 51 checks
- Check completion submit < 1s
- File upload (2MB PDF) < 5s
- Ed skill response < 3s for read skills
- No query returns >1000 rows without pagination

### 5.13 Security (Basic Audit)

- Auth bypass attempts on all estates routes
- CSRF protection on state-changing requests
- File upload path traversal (`../`)
- SQL injection in search fields
- XSS in ticket descriptions
- Direct object reference — can I read `/ticket/123` belonging to another org by URL manipulation?

---

## 6. Test Matrix

Each row is an executable test case with a specific pass criterion.

### 6.1 Dashboard Page Tests

| ID | Test | Pass Criterion |
|----|------|----------------|
| DASH-01 | Page loads in <2s | TTFB + FCP measured |
| DASH-02 | RAG summary card shows real totals | Totals match DB service-role query |
| DASH-03 | 18 domain cards render | Count = 18 |
| DASH-04 | "Governor Report" button navigates to `/estates-compliance/reports/governor` | URL matches |
| DASH-05 | "Daily Routines" button starts the routine flow | Routine starts |
| DASH-06 | Clicking a domain card drills into detail | URL includes `[domain]` |
| DASH-07 | "Today's Tasks" card lists real tasks | Tasks match DB |
| DASH-08 | Settings button opens settings dialog | Dialog visible |
| DASH-09 | Domain visibility toggle persists in localStorage | Reload and check |
| DASH-10 | Keyboard Tab reaches every card | Focus ring visible |
| DASH-11 | Mobile viewport 375×667 — all content accessible | No horizontal scroll |
| DASH-12 | Console has zero NEW errors (baseline errors ignored) | Clean console |

### 6.2 Helpdesk Ticket Tests

| ID | Test | Pass Criterion |
|----|------|----------------|
| TIC-01 | Navigate to `/estates-compliance/helpdesk` | Page loads, list visible |
| TIC-02 | "New Ticket" button exists and clickable | Form opens |
| TIC-03 | Submit empty form | All required fields flagged |
| TIC-04 | Submit valid form without attachment | Ticket created, DB row exists |
| TIC-05 | Submit with image attachment | File in storage bucket + DB reference |
| TIC-06 | Submit with PDF attachment | Same |
| TIC-07 | Submit with .exe attachment | Rejected |
| TIC-08 | Submit with 100MB file | Rejected (exceeds bucket limit) |
| TIC-09 | Ticket appears in list after creation | List shows new row |
| TIC-10 | Open the ticket | Detail view shows all fields |
| TIC-11 | Attached image renders as thumbnail | Visible |
| TIC-12 | Click thumbnail → opens full size | Modal or new tab |
| TIC-13 | Attached PDF has download link | Link works, file not corrupt |
| TIC-14 | Change status to "in progress" | DB updated, audit log entry |
| TIC-15 | Add a comment | Comment persisted and visible |
| TIC-16 | Change status to "resolved" | Resolution notes required |
| TIC-17 | Reload the page — everything still there | Full persistence |
| TIC-18 | Log out, log in, navigate to ticket | Still visible |
| TIC-19 | Mobile viewport — can complete full flow | Layout works |

### 6.3 Compliance Check Completion Tests

| ID | Test | Pass Criterion |
|----|------|----------------|
| CHK-01 | Navigate to Fire Safety domain | 11 checks listed |
| CHK-02 | Click "Weekly fire alarm test" | Detail view loads |
| CHK-03 | Click "Complete" | Completion form opens |
| CHK-04 | Select "Pass" | Status captured |
| CHK-05 | Add completion notes | Notes saved |
| CHK-06 | Upload photo evidence | File in storage |
| CHK-07 | Upload PDF inspection report | File in storage |
| CHK-08 | Submit | DB row updated, status=completed |
| CHK-09 | Dashboard RAG updates | Fire Safety shows 1/11 complete |
| CHK-10 | Governor report shows update | Executive Summary reflects |
| CHK-11 | Completion history visible on check | Shows the completion with evidence |
| CHK-12 | Click evidence link → downloads file | File downloads |
| CHK-13 | Evidence persists across sessions | Still there tomorrow |
| CHK-14 | Next due date calculated from frequency | +7 days for weekly |

### 6.4 Ed Chat Ticket Creation Tests

| ID | Test | Pass Criterion |
|----|------|----------------|
| ED-01 | Open Ed widget | Chat interface appears |
| ED-02 | Type issue description | Terry responds with proposal |
| ED-03 | Proposal contains structured fields | JSON parseable |
| ED-04 | Proposal contains risk assessment | likelihood, impact, score present |
| ED-05 | Proposal detects safeguarding keywords | flag=true for "child" mentions |
| ED-06 | Approve button on proposal card | Visible and clickable |
| ED-07 | Approving writes to DB | Ticket row exists |
| ED-08 | Approved ticket appears in helpdesk list | Visible |
| ED-09 | Rejecting the proposal | No DB write |
| ED-10 | Editing a field before approval | Edited value written |
| ED-11 | Risk register entry auto-created for high-score tickets | Row in risk_register |

### 6.5 Contractor Management Tests

| ID | Test | Pass Criterion |
|----|------|----------------|
| CON-01 | Navigate to contractors page | List loads |
| CON-02 | "Add Contractor" button works | Form opens |
| CON-03 | Create contractor with all fields | DB row exists |
| CON-04 | Upload insurance certificate PDF | File in storage, linked |
| CON-05 | Upload DBS certificate | Same |
| CON-06 | View contractor detail | All documents listed |
| CON-07 | Download a document | File downloads intact |
| CON-08 | Set expiry dates | Captured |
| CON-09 | Set expiry in the past → status shows expired | Visual indicator |
| CON-10 | Expiry within 30 days → warning shown | Amber badge |

### 6.6 Asset Register Tests

| ID | Test | Pass Criterion |
|----|------|----------------|
| AST-01 | Navigate to assets page | List loads |
| AST-02 | "Add Asset" button works | Form opens |
| AST-03 | Create asset (e.g. boiler) | DB row exists |
| AST-04 | Generate QR code for asset | QR image generated |
| AST-05 | Scan QR code (URL navigation) | Opens asset detail |
| AST-06 | Link asset to location | Foreign key set |
| AST-07 | Link asset to contractor | Foreign key set |
| AST-08 | Link asset to compliance task | Foreign key set |
| AST-09 | View compliance status for asset | Aggregated from linked tasks |
| AST-10 | Parent-child asset hierarchy | Tree rendered |

### 6.7 Integration Tests

| ID | Test | Pass Criterion |
|----|------|----------------|
| INT-01 | Mark check overdue → risk register updates | Row appears with correct category |
| INT-02 | High-score ticket → auto risk entry | Linked via source_task_id |
| INT-03 | Resolve ticket → risk mitigation recorded | Row in risk_mitigations |
| INT-04 | Cost request created → finance module sees it | Data flows to finance |
| INT-05 | Contractor expiring → notification queued | Notification row or scheduled alert |
| INT-06 | Check completed → action hub item closes | Cross-module sync |

### 6.8 Security Tests

| ID | Test | Pass Criterion |
|----|------|----------------|
| SEC-01 | Unauthenticated GET /api/estates/helpdesk | 401 |
| SEC-02 | Valid auth, wrong org ID in body | 403 |
| SEC-03 | XSS in ticket description | Rendered as text |
| SEC-04 | SQL in search field | No crash, escaped |
| SEC-05 | Path traversal in filename | Sanitised |
| SEC-06 | Direct URL to another org's ticket | 404 or 403 |

---

## 7. Acceptance Criteria for Sign-Off

Module is ready for client use when:

- **100% of Category 5.1** (UX audit) passes — no dead buttons
- **100% of Category 5.2** (data integrity) passes — full CRUD works
- **100% of Category 5.3** (file handling) passes for images and PDFs
- **≥80% of Category 5.4** (form validation) passes
- **100% of journeys J1-J4 pass without workarounds**
- **J5 (Ofsted evidence) passes or is flagged as product gap**
- **J6 (Ed Terry flow) passes end-to-end**
- **Zero Critical or High severity bugs**
- **Major regulatory gaps documented with product recommendation**
- **Competitive gap analysis complete**

---

## 8. Bug Severity Definitions

| Severity | Definition | Example | Time to Fix |
|----------|-----------|---------|-------------|
| **Critical** | Blocks core user journey, data loss risk, or legal non-compliance | Completed checks don't save | Immediate |
| **High** | Major feature broken, workaround exists but painful | Governor report doesn't include evidence | Same day |
| **Medium** | Minor feature broken or confusing UX | Button label wrong, missing loading state | Next release |
| **Low** | Cosmetic, edge case, or minor polish | Icon slightly misaligned | Backlog |
| **Enhancement** | Not a bug but should be added | Bulk import for checks | Product backlog |

---

## 9. Product Feature Gaps (to be populated during QA)

This section will be filled as tests are executed and missing features identified. Each gap includes:

- Feature name
- User impact (who needs it, for what)
- Competitor reference (who has it)
- Severity (dealbreaker / important / nice-to-have)
- Estimated effort (hours / days / weeks)

---

## 10. Test Execution Schedule

This document is the spec. Execution follows in sequence:

1. Set up test fixtures (sample PNG, PDF)
2. Execute 5.1 UX button audit — every estates page
3. Execute 5.2-5.3 ticket lifecycle with attachments
4. Execute 5.2-5.3 compliance check completion with evidence
5. Execute 5.5 user journeys J1-J6
6. Execute 5.6 regulatory completeness spot checks
7. Execute 5.7 cross-module integration
8. Execute 5.8 permissions
9. Execute 5.9 error states
10. Execute 5.10 competitive gap analysis
11. Execute 5.11 accessibility quick audit
12. Execute 5.13 basic security
13. Compile bug list, UX gaps, product gaps
14. Write sign-off report v2

Time budget per phase: 15-30 minutes. Budget may expand if blocking bugs are found.
