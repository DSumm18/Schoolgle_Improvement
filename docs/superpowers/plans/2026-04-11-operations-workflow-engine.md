# Operations Workflow Engine — Cross-Module Orchestration

**Author:** Jarvis
**Date:** 11 April 2026
**Status:** Design for approval — no code until David signs off

---

## 1. Why this document exists

David's concern:
> "We don't want different places to do certain tasks. Ideally if I have an invoice I want to upload it to one place every time. But there's a full process that goes before that — getting a quote, approval, procurement, analysis, decision, scheduling, work done, QA, invoice, payment, asset update, strategy feedback. It's a lot and it's a bit convoluted. We've got to get some use cases to see how it all fits together and plug the gaps."

The problem isn't any single module. It's that a single real-world event (a boiler needs fixing) touches estates, risk, finance, procurement, communications, calendar, and strategy. Right now each module knows its own job but **nothing owns the orchestration**. Users end up repeating data entry, switching tabs, and losing context.

What we need is an **operations workflow engine** — a state machine that lives above the modules and moves a piece of work through them, keeping every module in sync.

---

## 2. The canonical scenario

One boiler at Grove House Primary has started playing up. We'll walk through the happy path end-to-end.

### Step 0 — The trigger

Three possible origin events:
1. **Scheduled compliance check** — annual gas safety inspection runs, contractor reports a fault
2. **User-reported** — caretaker logs a ticket "boiler keeps losing pressure"
3. **Auto-detected** — IoT sensor reports irregular energy draw

All three end up as the same thing: **a Finding against an asset**.

### Step 1 — Finding linked to asset + risk

- Finding created with: description, severity, asset_id, compliance_domain
- Photos/video/report uploaded as evidence linked to the finding AND the asset
- Ed/Terry assesses risk: 5×5 matrix likelihood × impact
- If score ≥ 12, a row is auto-created in `risk_register` and linked to the asset
- Asset's `condition_grade` may drop (B → C)
- **Module owner:** Estates + Risk Register (already built)

### Step 2 — Budget check

Before procuring anything, the user needs to know:
- Is there budget in the right CFR line (E12 for premises maintenance)?
- How much is left?
- Does this purchase need preapproval (value > £X)?

Ed checks finance via a new skill `check_budget_headroom(cfr_code, estimated_amount)`:
- "You have £3,400 left in E12 for this financial year. This £1,000 repair leaves £2,400. No preapproval required (threshold £5,000)."
- OR: "This exceeds the remaining headroom in E12. You'll need to either (a) defer to next year, (b) transfer from another budget line, or (c) request preapproval."

**Module owner:** Finance module (currently has CFR codes + budget items but needs the `check_budget_headroom` skill)
**Gap:** the skill itself, plus a preapproval workflow if the school uses one

### Step 3 — Procurement kicks off

Now we know the fault and we have a rough number. The next question: **who do we ask for a quote?**

This is where procurement (DealFind) comes in — but it has two modes:

**Mode A: product purchase** (e.g. buying new pencils, playground equipment)
- DealFind's existing product catalogue + price comparison runs
- Out of scope for this document — already specced

**Mode B: service procurement** (our case — someone needs to come fix the boiler)
- Look in the school's approved contractor register first
- Filter by trade (`gas`) and status (`active`, `insurance_valid`, `dbs_valid_if_needed`)
- Target: get 3 quotes for comparison
- If the school has ≥3 approved contractors with the right trade → go to Step 4
- If the school has < 3 → escalate to DealFind's contractor network (built from other schools)

**The contractor network** is the underrated bit. Every school that rates a contractor after a job feeds the rating into a shared database. When a new school needs a boiler engineer in Bradford, DealFind surfaces:
- BluePlumb Ltd — 4.7/5 (8 schools)
- Northern Heating Solutions — 4.5/5 (12 schools)
- Yorkshire Gas Services — 4.2/5 (5 schools)

Each with price band, response time, recent reviews.

**Module owner:** DealFind (new sub-app — currently just a stub)
**Gap:** the whole procurement flow, contractor network database, rating system, search

### Step 4 — Quote requests

For each selected contractor, we need to send a quote request email containing:
- The fault description
- The service report from the original inspection
- The asset details (make, model, serial, location)
- Photos if relevant
- A response deadline

Ed drafts the email — same PROPOSE → APPROVE flow Terry already uses. User reviews, edits if needed, clicks Send.

**THIS IS THE BIG GAP**: we don't have email integration.

See §6 for the email integration design.

### Step 5 — Quote responses arrive

Contractors reply with their quotes. Right now these go to the user's personal inbox and we never see them. The system has half the story.

With email integration (§6) the replies are captured and attached to the same workflow automatically. Ed parses them: price, scope, conditions, timeline.

**Module owner:** Communications (inbound email routing)
**Gap:** inbound email parsing + attachment to workflow

### Step 6 — Quote analysis

Ed compares the quotes against each other AND against the original inspection report:
- Does Contractor A's scope cover everything the inspection flagged?
- Contractor B is £200 cheaper — why? Missing parts? Different brand?
- Is anyone clearly price-gouging vs market rates?

Ed produces a comparison matrix and recommends:
> "Contractor A matches the inspection scope exactly but is £180 above the others. Contractor B is cheapest but has excluded the flue replacement the inspection flagged as statutory. Contractor C's price is mid-range and matches scope — **my recommendation**. Shall I draft a follow-up to B asking about the flue exclusion?"

User approves or asks Ed to challenge a contractor. Follow-up emails go through the same propose/approve/send flow.

**Module owner:** Estates + DealFind + Ed
**Gap:** the quote comparison skill (`compare_quotes(finding_id)`)

### Step 7 — Decision + requisition

User picks Contractor C. System:
- Updates the workflow state to `quote_accepted`
- Creates a purchase requisition (PO) with CFR code E12
- Commits the £1,000 against the budget (not paid, just reserved)
- Generates the PO document (PDF) — schools can print it, email it, or process it digitally depending on their workflow
- Attaches it to the workflow

**Module owner:** Finance (requisition + budget commit)
**Gap:** requisition generation, budget commitment API

### Step 8 — Scheduling

Now we need to book the contractor's visit:
- Shared calendar visible to: caretaker, SBM, head, the relevant teacher if classroom access needed
- Booking entered with: contractor name, date/time, asset being serviced, duration estimate
- Caretaker gets a notification the day before
- Google Calendar / Outlook integration pushes the event to the user's personal calendar

**Module owner:** Shared calendar (new cross-module capability)
**Gap:** the calendar itself — we have `estates_compliance_tasks.scheduled_for` but no UI calendar view, no integration with external calendars

### Step 9 — Work done on site

Contractor arrives. Site manager (via mobile) or caretaker:
- Opens the workflow on their tablet/phone
- Takes before/after photos
- Records voice note describing the fix
- Marks any issues that came up during work (scope creep, additional faults found)

**Module owner:** Estates (mobile PWA)
**Gap:** the mobile PWA (deferred sub-app)

### Step 10 — Quality assessment

Before we pay, we check the work:
- Ed analyses the photos/video using vision AI
- Compares against the scope in the PO
- Flags any gaps: "The PO included flue replacement but the photos show the old flue still in place — ask the contractor to confirm"
- If clean: mark the job as `work_completed`
- If gaps: `work_disputed` — generates a challenge email back to the contractor

**Module owner:** Estates + Ed
**Gap:** the `assess_completed_work` skill

### Step 11 — Invoice received + matched

The contractor sends their invoice. It lands in **one place** — the **Document Inbox** (see §5). AI classifies it:
- Type: invoice
- Vendor: Contractor C
- Amount: £1,000
- Matches PO: PO-2026-0047
- Linked to: asset BOI-001 via workflow

Crucially it's a single inbox — the user never has to remember which module to upload to. Same place whether it's an invoice, a quote, a service report, a warranty certificate, a photo of a broken window.

**Module owner:** Document Inbox (new cross-module feature)
**Gap:** the inbox itself, the AI classifier, the routing engine

### Step 12 — Payment released

Only after `work_completed` is marked, the invoice can be released for payment:
- Finance module picks up invoices in `awaiting_payment` status
- Routes through the school's normal payment process (SBM approval, BACS run, whatever they use)
- When marked paid: budget moved from `committed` to `spent`
- Workflow state → `paid`

**Module owner:** Finance
**Gap:** payment routing

### Step 13 — Asset updated

This is what we just built:
- `estates_service_records` row created with contractor, date, cost, evidence
- `estates_service_record_assets` junction row with the £1,000 allocated to BOI-001
- Asset's `last_service_date` updated
- Asset's `next_service_due` bumped forward
- Running maintenance spend recomputed
- If spend crosses 50% of replacement value → alert
- If spend crosses 75% → strong replacement recommendation

**Module owner:** Estates ✓ (built)

### Step 14 — Strategy feedback

The finding + repair is now closed. But the data lives on:
- If it was a high-risk repair → risk register entry closed with resolution evidence
- If the asset's spend/replacement ratio is high → suggests estates strategy item ("consider boiler replacement in 2027 budget")
- If the contractor did a good job → rating nudged up in the network
- If the invoice was above estimate → flagged for future quote analysis

**Module owner:** Estates Strategy (sub-app, deferred) + DealFind (ratings)
**Gap:** strategy sub-app, ratings loop

---

## 3. Summary of modules touched in one scenario

| Step | Module | Status |
|------|--------|--------|
| 1 Finding + risk | Estates, Risk Register | ✓ Built |
| 2 Budget check | Finance | ⚠ Needs `check_budget_headroom` skill |
| 3 Procurement start | DealFind | ✗ New sub-app required |
| 4 Quote requests | Communications (email) | ✗ Email integration missing |
| 5 Quote responses | Communications (email inbound) | ✗ Email integration missing |
| 6 Quote analysis | Estates + Ed | ⚠ Needs `compare_quotes` skill |
| 7 Decision + requisition | Finance | ⚠ Needs requisition + budget commit |
| 8 Scheduling | Shared Calendar | ✗ New cross-module feature |
| 9 Work on site | Estates (mobile PWA) | ✗ Mobile deferred |
| 10 QA assessment | Estates + Ed | ⚠ Needs `assess_completed_work` skill |
| 11 Invoice received | Document Inbox | ✗ New cross-module feature |
| 12 Payment | Finance | ⚠ Needs payment routing |
| 13 Asset update | Estates | ✓ Built (service records) |
| 14 Strategy feedback | Estates Strategy + DealFind | ✗ Deferred |

**6 modules, 8 gaps, 1 orchestration layer missing.**

---

## 4. The workflow engine (the glue)

Every other UK compliance tool models this as a ticket or a task. That's why they break when the work crosses modules — a "ticket" is one thing, a "task" is another, a "finding" is a third. They can't share state.

We model it as a **workflow** — a first-class entity that:
- Has a single ID that threads through every module
- Moves through a state machine (see §4.2)
- Owns the document trail (all uploads reference it)
- Owns the timeline (every event logged)
- Owns the roll-up metrics (total cost, time elapsed, people involved)

### 4.1 Data model

```sql
CREATE TABLE estates_operations_workflows (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  reference TEXT NOT NULL,         -- e.g. "WF-00042" for user display
  title TEXT NOT NULL,              -- "Main Hall boiler repair"
  workflow_type TEXT NOT NULL,      -- 'asset_repair' | 'procurement' | 'compliance_chain' | 'safety_incident'

  -- The thing the workflow is about
  primary_asset_id UUID REFERENCES estates_assets(id),
  primary_finding_id UUID,          -- link to finding / inspection result
  primary_risk_id UUID REFERENCES risk_register(id),

  -- Current state (see state machine)
  state TEXT NOT NULL,
  state_entered_at TIMESTAMPTZ NOT NULL,

  -- Financial
  estimated_cost NUMERIC,
  committed_cost NUMERIC,
  actual_cost NUMERIC,
  cfr_code TEXT,
  budget_line_id UUID,

  -- Ownership
  owner_user_id UUID,
  assigned_to UUID,

  -- Metadata
  priority TEXT,
  due_date DATE,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,

  created_at, updated_at
);

CREATE TABLE estates_operations_workflow_events (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES estates_operations_workflows(id),
  event_type TEXT NOT NULL,     -- 'state_change' | 'document_added' | 'email_sent' | 'email_received' | 'note' | 'decision' | 'approval'
  payload JSONB,                 -- event-specific data
  actor_user_id UUID,
  actor_name TEXT,               -- denormalised
  created_at TIMESTAMPTZ NOT NULL
);

-- All documents (quotes, invoices, reports, photos) reference a workflow
ALTER TABLE estates_evidence ADD COLUMN workflow_id UUID REFERENCES estates_operations_workflows(id);

-- Tickets, risk entries, service records all reference a workflow
ALTER TABLE estates_helpdesk_tickets ADD COLUMN workflow_id UUID;
ALTER TABLE estates_service_records ADD COLUMN workflow_id UUID;
ALTER TABLE risk_register ADD COLUMN workflow_id UUID;
```

### 4.2 State machine

```
  [triggered]                        <- Step 0: user reports / inspection reports / sensor detects
      |
      v
  [assessing]                        <- Step 1: Ed + user assess severity + risk
      |
      v
  [budget_check]                     <- Step 2: finance confirms headroom
      |
      +--> [blocked_budget]          <- need preapproval, escalate
      |
      v
  [procurement_started]              <- Step 3: search contractor register / DealFind
      |
      v
  [quotes_requested]                 <- Step 4: emails sent
      |
      v
  [quotes_received]                  <- Step 5: all replies in (or deadline hit)
      |
      v
  [quotes_analysed]                  <- Step 6: Ed's comparison + recommendation
      |
      v
  [awaiting_decision]                <- Step 7a: user approves winning quote
      |
      v
  [requisition_created]              <- Step 7b: PO generated, budget committed
      |
      v
  [scheduled]                        <- Step 8: calendar booking made
      |
      v
  [in_progress]                      <- Step 9: contractor on site
      |
      v
  [work_completed]                   <- Step 9/10: QA passes
      |
      +--> [work_disputed]           <- QA fails, challenge back to contractor
      |
      v
  [awaiting_invoice]                 <- Step 11: waiting for invoice
      |
      v
  [invoice_received]                 <- Step 11: invoice matched to PO
      |
      v
  [awaiting_payment]                 <- Step 12: finance queue
      |
      v
  [paid]                             <- Step 12: budget moved from committed to spent
      |
      v
  [closed]                           <- Step 13+14: asset updated, strategy feedback, workflow closed
```

Each state transition is logged as an event. Any user or skill can look at a workflow and see: where are we, what's next, what's blocked, who needs to act.

### 4.3 Roles and responsibilities

| Actor | Responsibility |
|-------|----------------|
| **User (SBM/caretaker)** | Triggers workflows, approves decisions, confirms sends, marks work complete |
| **Ed / Terry** | Drafts emails, analyses quotes, recommends decisions, assesses QA, maintains compliance rules |
| **Modules** | Each module owns its data and exposes APIs. Workflow engine coordinates. |
| **Workflow engine** | State machine, timeline, cross-module notifications, document routing |

---

## 5. Single Document Inbox — "upload once, route everywhere"

### 5.1 The principle

A school has a single email address, a single file-upload endpoint, a single mobile "scan document" action. Everything goes to the same place. The system works out what it is and where it belongs.

### 5.2 Flow

```
  User action                        Document Inbox                 AI Classifier                Routed to
  ───────────                        ──────────────                 ─────────────                ─────────
  Upload via web                     ─┐
  Email to inbox@school.schoolgle   ─┼──> documents table        ─> Gemini vision      ─> invoice  -> Finance + workflow N
  WhatsApp/SMS to school number     ─┼─                             + context ranker     quote    -> Procurement + workflow N
  Mobile camera capture              ─┘                                                  report   -> Estates + asset
                                                                                         cert     -> Estates evidence
                                                                                         manual   -> Estates evidence (docs)
                                                                                         photo    -> Asset / ticket evidence
```

### 5.3 Classification prompt

Gemini is sent the file + a context bundle containing:
- The school's current workflows (to match document → workflow)
- The school's contractor list (to identify vendors)
- The school's asset register (to identify equipment)
- The school's open tickets

Returns:
```json
{
  "document_type": "invoice" | "quote" | "inspection_report" | "certificate" | "manual" | "photo" | "receipt" | "letter" | "other",
  "vendor": "BluePlumb Ltd" | null,
  "total_amount": 900,
  "currency": "GBP",
  "reference_numbers": ["INV-2234", "PO-2026-0047"],
  "likely_workflow_id": "uuid or null",
  "likely_asset_id": "uuid or null",
  "confidence": 0.92,
  "summary": "This is an invoice from BluePlumb Ltd for £900 referencing PO-2026-0047, which matches workflow WF-00042 (Main Hall boiler repair)."
}
```

The user sees the classification and can correct it before the document is filed.

### 5.4 Data model

```sql
CREATE TABLE document_inbox_items (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  source TEXT NOT NULL,         -- 'web_upload' | 'email' | 'mobile_capture' | 'sms' | 'api'
  source_reference TEXT,         -- e.g. email message-id
  uploaded_by UUID,
  received_at TIMESTAMPTZ NOT NULL,

  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,

  -- AI classification
  classified_at TIMESTAMPTZ,
  classified_type TEXT,
  classified_data JSONB,
  confidence NUMERIC,

  -- Final routing (after user confirmation or auto-route for high confidence)
  routed_at TIMESTAMPTZ,
  routed_to_module TEXT,
  routed_to_workflow_id UUID,
  routed_to_asset_id UUID,
  routed_to_evidence_id UUID,

  status TEXT NOT NULL             -- 'pending' | 'classified' | 'needs_review' | 'routed' | 'rejected'
);
```

### 5.5 Why this matters

- **User never learns "which module to upload to"** — there's one place
- **Cross-workflow documents** (one invoice covering multiple assets) become trivial — the classifier splits and routes
- **Audit trail is centralised** — every document the school has received or produced is queryable in one place
- **Ed has a unified view** — "show me everything BluePlumb Ltd has sent us this year"

---

## 6. Email integration — the biggest gap

David called this out clearly: if we can't capture outbound and inbound emails, the system only has half the story. Three possible architectures, each with trade-offs.

### Option A — OAuth into the user's own mailbox (Gmail / Microsoft 365)

**How it works:**
- User connects their Google or Microsoft account once via OAuth
- System has read + send permissions for that mailbox
- Outbound: Ed drafts → user reviews → system sends via the user's own account (so replies go to the right place)
- Inbound: system polls or webhooks for new messages matching known workflow references (e.g. subject line includes `WF-00042` or a contractor we've sent to)

**Pros:**
- Emails come from the user's real address — contractors aren't suspicious
- Inbound replies come back to the same place, full thread preserved
- No new email infrastructure to maintain
- Works with the school's existing IT setup

**Cons:**
- Requires each user to authorise — friction
- Access revoked if user leaves the school
- Microsoft 365 admin sometimes blocks OAuth apps
- Requires careful scope management (read/send only, not full mailbox)

### Option B — BCC / forwarding address per school

**How it works:**
- Each school gets an inbound email address like `grove-house@inbound.schoolgle.co.uk`
- Users BCC that address on every relevant email
- Inbound replies get CC'd to it too (or user manually forwards)
- System parses incoming mail, extracts attachments, matches to workflow by subject/thread ID, routes to Document Inbox

**Pros:**
- Zero OAuth friction — works day 1
- Trivial for the school's IT to set up (one rule: forward to schoolgle address)
- Captures everything the user wants to share without requiring system send
- Works across any email client

**Cons:**
- User discipline required — if they forget to BCC, we lose the email
- Contractors see the BCC address (usually hidden, but still)
- Can't draft-and-send from inside the system (user still sends from their own app)

### Option C — System sends on behalf with reply-to routing

**How it works:**
- System sends emails from `noreply+wf42@schoolgle.co.uk` with a reply-to of `grove-house+wf42@inbound.schoolgle.co.uk`
- Contractors reply to the tagged address
- System parses inbound mail by the tag, routes to workflow
- Outbound is fully handled by system
- Each workflow gets a unique inbound tag

**Pros:**
- Fully closed loop — no user action required to capture either direction
- Ed can draft and send autonomously (with approval)
- Perfect thread matching via the tag
- Centralised outbound deliverability (SPF/DKIM/DMARC we configure once)

**Cons:**
- Emails come from a generic address — less trusted by contractors
- Legal / impersonation concerns if the sender claims to be the school
- Requires SES/Postmark/SendGrid setup + domain auth
- Inbound parser is more complex

### Recommendation

**Hybrid: Option A as primary + Option B as fallback.**

- Schools that can OAuth their mailbox get the best experience (Option A)
- Schools that can't (or don't want to) get a BCC address to forward to (Option B)
- Option C reserved for system-generated notifications (reminders, receipts) from a clearly-branded system address so there's no impersonation concern

**Phased build:**
1. **Phase 1** (2 weeks): Option B only — get the inbound parser working so users can forward to us
2. **Phase 2** (2 weeks): Add Option A (OAuth Gmail first, Microsoft later)
3. **Phase 3** (1 week): Option C for system notifications (reminders, governor reports)

---

## 7. Module boundaries (so we don't build things twice)

| Responsibility | Where it lives | Notes |
|----------------|---------------|-------|
| Workflow state machine | **New: workflow engine** (shared lib + API) | Sits above all modules |
| Findings + risk | Estates + Risk Register | Built |
| Asset register + service records | Estates | Built |
| Budget lines, CFR codes, payment routing | Finance | Partial — needs budget headroom API + requisition + payment routing |
| Contractor register (internal) | Estates | Built — needs expansion (accreditations, insurance tracking) |
| Contractor network (external, shared across schools) | **DealFind** | Not built |
| Product marketplace | DealFind | Not built |
| Quote analysis | Estates (Ed skills) | Skill needs building |
| Document Inbox + AI classifier | **New: Document Inbox** | Cross-module |
| Email OAuth + inbound parsing | **New: Communications — Email** | Biggest gap |
| Shared calendar / scheduling | **New: Calendar** | Cross-module |
| Mobile PWA | **New: Mobile** | Deferred |
| Strategy + long-term planning | Estates Strategy sub-app | Deferred |

**No duplicate ownership.** Each concern has exactly one home.

---

## 8. Gap summary

Ranked by how painful the gap is for the full workflow to function:

| # | Gap | Pain | Effort | Blocks |
|---|-----|------|--------|--------|
| 1 | **Email integration (inbound at minimum)** | Critical | 2 weeks | Steps 4, 5, 11 |
| 2 | **Document Inbox + AI classifier** | Critical | 2 weeks | Step 11, plus every document upload across the product |
| 3 | **Workflow engine (state machine)** | High | 2-3 weeks | Everything cross-module |
| 4 | **Budget headroom API + requisition flow** | High | 1-2 weeks | Steps 2, 7 |
| 5 | **DealFind contractor network** | High | 3-4 weeks | Step 3 (partial alternative: use internal register only until network is built) |
| 6 | **Quote comparison Ed skill** | Medium | 1 week | Step 6 |
| 7 | **Shared calendar** | Medium | 1-2 weeks | Step 8 |
| 8 | **Mobile PWA for on-site work** | Medium | 2-3 weeks | Step 9 |
| 9 | **QA assessment Ed skill** | Low | 1 week | Step 10 |
| 10 | **Estates strategy sub-app** | Low | 2 weeks | Step 14 |

---

## 9. Phased build plan

Don't try to build everything. Build in the order that **unlocks the happy-path walk-through on Grove House** one stage at a time.

### Phase 1 — Workflow engine + Document Inbox (3 weeks)
- Build the `estates_operations_workflows` table + state machine
- Build the Document Inbox with AI classifier (Gemini)
- Rewire estates_evidence / estates_helpdesk_tickets / estates_service_records to optionally link to a workflow_id
- New endpoint: `POST /api/workflows/trigger` — user reports an issue → workflow created
- Asset detail page gets a "Workflow timeline" card for the current/past workflows on that asset

**End state: the user can see the whole story on one page**, even though individual steps still need manual action across modules.

### Phase 2 — Email integration Phase 1 (Option B inbound) (2 weeks)
- Provision unique inbound email address per org (schoolslug@inbound.schoolgle.co.uk)
- SES receive rules + S3 + Lambda (or Postmark inbound webhook)
- Inbound parser: extracts sender, subject, body, attachments
- Attachments → Document Inbox automatically
- Subject-line / thread-id matching to existing workflow
- New UI card: "Inbound Inbox" showing unmatched mails the user needs to route

**End state: anything the user forwards or BCCs to the school address ends up in the Document Inbox tied to the right workflow.**

### Phase 3 — Budget + requisition flow (2 weeks)
- Finance module gets `budgets` table (if not already) + budget_lines per CFR code
- New API: `GET /api/finance/budget-headroom?cfr_code=E12`
- New Ed skill: `check_budget_headroom` and `create_requisition`
- Approval flow: request → SBM approves → committed → generates PO PDF
- Workflow state machine adds `blocked_budget` handling

**End state: workflow can't progress past Step 2 without a budget check; if it needs preapproval, it blocks and notifies the right person.**

### Phase 4 — Procurement (DealFind) Phase 1 (3 weeks)
- Contractor database (cross-school, shared) with ratings, trades, locations
- Search UI + API: "find me a gas engineer within 20 miles of BD2"
- Rating aggregation + display
- Quote request flow: select contractors → draft emails (Ed) → send via Phase 2 email integration → workflow moves to `quotes_requested`
- Quote response parsing: inbound emails from known contractors → parsed → attached to workflow
- Ed skill: `compare_quotes(workflow_id)` — matrix + recommendation

**End state: from a workflow in procurement state, user can kick off the quote process and Ed coordinates the whole thing.**

### Phase 5 — Scheduling + mobile (3 weeks)
- Shared calendar component with contractor bookings, compliance due dates, staff availability
- Google Calendar push (iCal subscribe or OAuth)
- Mobile PWA for the caretaker: offline-first, camera integration, QR scan

### Phase 6 — Strategy + feedback loop (2 weeks)
- Estates strategy sub-app
- Feedback loops: asset spend → replacement recommendation → strategy item
- Contractor ratings ↑/↓ based on QA outcomes

### Phase 7 — Email OAuth (Option A) (2 weeks)
- Google OAuth for Gmail send + read
- Microsoft Graph for Microsoft 365
- Switch primary email integration from Option B to Option A where available

**Total: roughly 17 weeks to the full vision. First user-visible value at end of Phase 1 (3 weeks).**

---

## 10. Open questions for David

Before we build anything I need answers to:

1. **Email integration preference** — are you OK with Option B (BCC forward address) as the starting point, or do you want to push for Option A (OAuth) from day 1?

2. **Workflow reference format** — do you want user-visible IDs like `WF-00042` or `BOI-001/REPAIR/2026-04`, or something else?

3. **Procurement spend threshold** — at what value should a preapproval be required? Is it school-configurable or a fixed default (e.g. £1,000)?

4. **Contractor network** — are you happy for the ratings database to be cross-school (every school sees every rating) or scoped (each MAT sees its own)?

5. **Document Inbox fallback** — if AI classification confidence is < 80%, who reviews? SBM only, or anyone with the right permission?

6. **Calendar provider** — is Google Calendar the primary target, or do some schools use Outlook 365 / Apple iCal?

7. **Mobile PWA vs native app** — PWA is faster to ship but has some iOS limitations (push, camera access). Are you OK with PWA-first and native later if needed?

8. **Budget commitment semantics** — when a PO is raised, do we physically reserve the budget (so it can't be double-spent) or just record an intent? This affects how finance reports work.

9. **Approval chains** — some schools have single SBM approval; some need head + governor for > £5,000. Is this configurable per school?

10. **Integration with existing school finance systems** — Arbor, SIMS, Iris — do we need to export POs/invoices to these or is Schoolgle the source of truth?

---

## 11. What I recommend doing next

I'll NOT write any code until you've read this and tell me what you think. Specifically:

- Does the workflow engine concept match your mental model?
- Are there steps I've missed or misunderstood?
- Which of the 10 open questions have clear answers?
- Which Phase do you want to start with? (My recommendation is Phase 1 — workflow engine + Document Inbox — because it unlocks every other step)
- Is anything scoped wrong (e.g. something I think is a 2-week job that you think is 2 months)?

Once you've signed off I'll write a per-phase implementation plan and start building Phase 1 properly — design → tests → implementation → verification in the browser → commit — no half-finished work.
