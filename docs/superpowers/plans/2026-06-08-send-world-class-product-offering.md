# SEND World-Class Product Offering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Schoolgle SEND into a low-friction SENCO operating system that connects pupil profile, SEND register, APDR, EHCP workflow, meetings, evidence, funding reconciliation, AI support and Ofsted inclusion assurance.

**Architecture:** Use the existing Schoolgle pupil spine as the canonical child record, then add SEND-specific workflow tables and APIs around it. SEND data should feed the unified tasks/actions system and Ofsted Readiness rather than creating a parallel universe. AI should draft, suggest, summarise and score evidence, but humans must confirm statutory outputs and decisions.

**Tech Stack:** Next.js App Router, React/TypeScript, Supabase/Postgres, existing Schoolgle auth middleware, Vitest, existing SEND routes/APIs, existing Ofsted findings/actions system, Ed AI skills.

---

## Product Decision

Schoolgle SEND should be positioned as:

> The pupil-level inclusion, statutory workflow, evidence, funding and assurance spine for schools and trusts.

This means the product is not only a SEND register and not only a provision map. It must help a SENCO answer these questions quickly:

- Who is on the SEND register and why?
- What support is each pupil receiving?
- Is the support reviewed through assess-plan-do-review?
- Is the pupil, parent/carer and class teacher voice captured?
- Are EHCP statutory deadlines and annual reviews under control?
- Does the funding match the pupil's needs and provision costs?
- Is there enough evidence for Ofsted, governors, LA conversations, annual reviews or escalation?
- What does AI recommend, what did the school accept, and what did the school decline?

## Data Required To Make The Product Powerful

### Minimum Data For A Useful First Version

| Data Area | Required Fields | Why It Matters | Source |
| --- | --- | --- | --- |
| Pupil spine | pupil ID, name, date of birth, year group, class, status | Creates one profile per child and avoids duplicate SEND rows | Arbor/SIMS/Bromcom pupil export |
| SEND register | SEN status, primary need, secondary need where available, start date | Core SENCO caseload and Ofsted inclusion population | Arbor SEND report/export |
| EHCP flag | has EHCP, EHCP issue date if available, review date if available | Drives statutory runway and annual review tracker | Arbor SEND export, EHCP documents, manual edit |
| Class ownership | current class, teacher, year group | Lets class teachers see relevant children and actions | pupil/class/staff imports |
| Evidence documents | file name, type, pupil link, source URL/upload, date | Builds APDR/EHCP/Ofsted evidence packs | Schoolgle upload, Drive/SharePoint link |
| Review tasks | owner, due date, status, linked pupil | Prevents drift and makes work visible | Schoolgle generated tasks |

### Data Required For The Funding Differentiator

| Data Area | Required Fields | Why It Matters | Source |
| --- | --- | --- | --- |
| LA banding rules | band names, descriptors, thresholds, typical amounts, evidence criteria | Lets AI compare pupil need/provision against funding logic | LA high-needs guidance, banding matrix, local offer |
| LA funding statements | pupil identifier, band, amount, period, payment date/status | Enables reconciliation and missing-funding detection | LA payment schedule/spreadsheet/PDF |
| Provision cost model | staff role, hourly cost, hours, intervention resources, therapy cost | Compares real support cost against funding received | School finance/staff data and SENCO input |
| EHCP provision | Section F provision, quantified hours, specialist advice | Checks whether what is funded/being delivered matches the plan | EHCP PDF/documents |
| Funding history | old band, new band, date changed, reason, evidence | Supports escalation, audit and governor reporting | Schoolgle-managed records |

### Data Required For A World-Class Evidence Engine

| Data Area | Required Fields | Why It Matters | Source |
| --- | --- | --- | --- |
| APDR cycles | assessment summary, plan, provision, review outcome, impact | Proves graduated approach and support effectiveness | SENCO/class teacher workflow |
| Parent voice | summary, date, method, linked meeting/document | Required for meaningful SEND process and Ofsted inclusion evidence | meeting/transcript/form |
| Pupil voice | summary, date, accessibility method, sentiment/needs | Shows the child is heard and support is adapted | meeting/transcript/form/voice note |
| Teacher voice | classroom barriers, adjustments, impact notes | Links SEND to mainstream teaching and inclusion | teacher update form |
| Specialist advice | professional, report date, recommendations, actions created | Shows expert advice is implemented, not just stored | uploaded reports/meeting notes |
| Attendance/behaviour signals | absence trend, exclusions/suspensions, behaviour flags, part-time timetable | Shows wider risk and whether support needs adapting | attendance/behaviour modules |
| Meeting records | transcript, minutes, decisions, actions, attendees | Removes SENCO admin and builds audit trail | meeting recorder |

## Core Product Features And Why

### 1. SEND Register And Caseload Table

**Purpose:** Give the SENCO a fast, sortable operational view.

**Features:**

- Table view with columns: pupil, year, class, SEN status, primary need, EHCP, next review, provision status, evidence status, funding status, owner, risk.
- Filters: status, primary need, EHCP, overdue review, missing evidence, class, year group, funding mismatch.
- Row click opens the canonical pupil profile.
- Import review banner for unmatched/ambiguous pupil rows.

**Why:** Competitors often show rich pupil cards, but SENCOs also need Excel-like filtering and sorting to manage caseload at speed.

### 2. Canonical Pupil Profile With SEND Panel

**Purpose:** Make the pupil the centre, not the app.

**Features:**

- Profile header: name, year, class, SEN status, EHCP, primary need, live/archive state.
- SEND summary cards: next review, evidence strength, active provision, funding gap, open actions.
- Tabs: Overview, APDR, Provision, EHCP, Evidence, Meetings, Funding, Timeline, Ofsted.
- Timeline containing imports, status changes, meetings, evidence uploads, review decisions, actions and funding changes.

**Why:** A GDPR request, parent meeting, annual review or Ofsted conversation all start with "show me the child record".

### 3. APDR Engine

**Purpose:** Turn the graduated approach into a guided, reviewable workflow.

**Features:**

- Create APDR cycle from pupil profile.
- Capture assess, plan, do and review sections separately.
- Add SMART outcomes and linked provision.
- Attach evidence and teacher/parent/pupil voice.
- Set review date and owner.
- AI suggests next steps and checks for weak/missing evidence.

**Why:** This is the day-to-day SEND process and the strongest evidence for early support before EHCP escalation.

### 4. Provision Mapping And Costing

**Purpose:** Show what is being delivered, by whom, at what cost, and whether it works.

**Features:**

- Provision/intervention records linked to pupils, groups or classes.
- Frequency, duration, start/end date, owner, staff/resource cost.
- Impact review linked to APDR.
- Provision cost rolls up to pupil, cohort, need type and school.

**Why:** It replaces the disconnected spreadsheet/provision map and feeds funding reconciliation.

### 5. EHCP Lifecycle And Annual Review Runway

**Purpose:** Keep statutory work under control.

**Features:**

- EHCP status: none, considering EHCNA, EHCNA requested, assessment, draft, final, active, annual review due, amendment, cease/appeal.
- Annual review due date and warning bands.
- Phase-transfer deadline flags.
- Evidence checklist for EHCNA and annual review.
- Draft EHCP review checklist for quantified provision and SMART outcomes.

**Why:** The SENCO must not miss reviews, decision points or evidence gaps.

### 6. Meeting Copilot

**Purpose:** Remove the admin burden from SEND meetings.

**Features:**

- Start meeting from pupil profile or annual review.
- Record/transcribe where consent is confirmed.
- Live action extraction during the meeting.
- Generate minutes before the meeting ends.
- Tag parent voice, pupil voice, professional advice and decisions.
- Create actions with owners/dates and attach to pupil timeline.
- Store accepted and declined AI suggestions.

**Why:** This is the feature that will feel magical to overworked SENCOs because it removes hours of typing and chasing.

### 7. Evidence Strength And Case Builder

**Purpose:** Tell schools whether they have enough evidence before they need it.

**Features:**

- Evidence score for APDR, annual review, EHCNA and funding escalation.
- Missing evidence list with one-click request tasks.
- AI summary generator for SENCO report, governor report, EHCNA pack and funding challenge.
- Source-linked statements so the user can see where every claim came from.
- Human approval before external export.

**Why:** AI should help SENCOs build stronger cases while avoiding unsupported claims.

### 8. LA Funding Rules And Reconciliation

**Purpose:** Connect need, provision and money.

**Features:**

- Import LA banding descriptors and funding schedules.
- Match funding statement pupils to Schoolgle pupils.
- Compare EHCP pupils against funding received.
- Compare provision cost against funding amount.
- Flag missing funding, incorrect band, expired funding, left pupils still funded, unfunded new starters.
- AI explains possible funding mismatch using evidence and local rules.

**Why:** This is the strongest commercial differentiator because it can recover or protect money.

### 9. Ofsted Inclusion Evidence Matrix

**Purpose:** Convert SEND work into inspection-ready evidence.

**Features:**

- Matrix rows: identification, inclusive teaching, APDR, reasonable adjustments, parent/pupil voice, specialist advice, attendance/behaviour adaptation, safeguarding vulnerability, alternative provision, leadership/governance.
- Each row shows RAG, evidence count, stale evidence, missing actions and linked pupils/cohorts.
- Gaps create Ofsted Readiness findings and unified tasks.

**Why:** Ofsted's renewed model makes inclusion visible. Schoolgle should make evidence visible before inspection.

### 10. Reports For SENCO, Headteacher, Governors And Trusts

**Purpose:** Let leaders see risk, workload, provision and impact without manually assembling reports.

**Features:**

- SENCO weekly caseload report.
- Headteacher risk/overdue/funding summary.
- Governor SEND report with narrative, KPIs and actions.
- Trust dashboard for schools, needs, EHCPs, funding gaps and review compliance.
- Exportable PDF/Word where required.

**Why:** SEND is both operational and strategic. Reports should be generated from live evidence, not recreated each term.

## Implementation File Map

### Existing Files To Build On

- `apps/platform/src/app/(dashboard)/dashboard/send/page.tsx` — current SEND dashboard and tab UI.
- `apps/platform/src/app/api/send/dashboard/route.ts` — current aggregate dashboard API.
- `apps/platform/src/app/api/send/register/route.ts` — current SEND register API.
- `apps/platform/src/app/api/send/register/[id]/route.ts` — current pupil SEND detail/update API.
- `apps/platform/src/app/api/send/graduated-approach/route.ts` — current APDR API.
- `apps/platform/src/app/api/send/provision-map/route.ts` — current provision API.
- `apps/platform/src/app/api/send/referrals/route.ts` — current referrals API.
- `apps/platform/src/app/api/pupils/[id]/profile/route.ts` — current canonical pupil profile API.
- `apps/platform/src/lib/send-status-import.ts` — current Arbor SEND import parsing.
- `apps/platform/src/lib/send-pupil-matching.ts` — current pupil matching helpers.
- `apps/platform/src/lib/send/funding-reconciliation.ts` — current funding reconciliation library.
- `apps/platform/src/lib/ofsted-readiness/findings.ts` — current Ofsted findings source types and task mapping.
- `apps/platform/src/app/api/tasks/route.ts` — current unified tasks feed.

### New Files Proposed

- `apps/platform/supabase/migrations/20260608_send_world_class_workflows.sql` — workflow tables for evidence, meetings, funding rules and Ofsted links.
- `apps/platform/src/lib/send/evidence-strength.ts` — deterministic evidence-strength scoring before AI narrative.
- `apps/platform/src/lib/send/meeting-copilot.ts` — transcript-to-minutes/action extraction helpers.
- `apps/platform/src/lib/send/ofsted-inclusion-matrix.ts` — maps SEND records to inclusion evidence rows.
- `apps/platform/src/lib/send/pupil-send-timeline.ts` — builds canonical pupil SEND timeline.
- `apps/platform/src/app/api/send/evidence/route.ts` — evidence CRUD/list API.
- `apps/platform/src/app/api/send/meetings/route.ts` — meeting record/minutes/actions API.
- `apps/platform/src/app/api/send/funding-rules/route.ts` — LA rules import/list API.
- `apps/platform/src/app/api/send/funding-reconciliation/route.ts` — reconciliation run/read API.
- `apps/platform/src/app/api/send/ofsted-matrix/route.ts` — inclusion matrix API.
- `apps/platform/src/app/api/send/reports/governor/route.ts` — governor SEND report API.
- `apps/platform/src/components/send/SendCaseloadTable.tsx` — sortable table.
- `apps/platform/src/components/send/PupilSendProfilePanel.tsx` — profile panel/tabs.
- `apps/platform/src/components/send/ApdrCyclePanel.tsx` — APDR UI.
- `apps/platform/src/components/send/MeetingCopilotPanel.tsx` — meeting workflow UI.
- `apps/platform/src/components/send/FundingReconciliationPanel.tsx` — funding UI.
- `apps/platform/src/components/send/OfstedInclusionMatrix.tsx` — Ofsted evidence UI.
- `apps/platform/src/lib/send/evidence-strength.test.ts` — evidence scoring tests.
- `apps/platform/src/lib/send/funding-reconciliation-world-class.test.ts` — funding reconciliation edge tests.
- `apps/platform/src/lib/send/ofsted-inclusion-matrix.test.ts` — inclusion mapping tests.
- `apps/platform/src/lib/send/meeting-copilot.test.ts` — meeting extraction tests.

---

## Task 1: Lock The SEND Data Contract

**Files:**

- Create: `apps/platform/supabase/migrations/20260608_send_world_class_workflows.sql`
- Modify: `docs/PUPIL_PROFILE_SPINE.md`
- Modify: `docs/modules/sen-funding/SEND_WORLD_CLASS_BLUEPRINT_2026-06-08.md`

- [ ] **Step 1: Add workflow tables**

Create `apps/platform/supabase/migrations/20260608_send_world_class_workflows.sql` with tables for:

```sql
create table if not exists send_evidence_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  pupil_record_id uuid not null,
  send_register_id uuid,
  evidence_type text not null,
  title text not null,
  summary text,
  source_url text,
  source_file_path text,
  evidence_date date,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists send_meeting_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  pupil_record_id uuid not null,
  send_register_id uuid,
  meeting_type text not null,
  meeting_date timestamptz not null,
  consent_confirmed boolean not null default false,
  transcript text,
  minutes text,
  parent_voice text,
  pupil_voice text,
  decisions jsonb not null default '[]'::jsonb,
  ai_suggestions jsonb not null default '[]'::jsonb,
  accepted_suggestions jsonb not null default '[]'::jsonb,
  declined_suggestions jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists send_la_funding_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  local_authority_name text not null,
  rule_set_name text not null,
  effective_from date,
  effective_to date,
  band_descriptors jsonb not null default '[]'::jsonb,
  evidence_requirements jsonb not null default '[]'::jsonb,
  source_url text,
  source_file_path text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists send_ofsted_inclusion_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  snapshot_date date not null default current_date,
  matrix jsonb not null,
  generated_from jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 2: Document ID semantics**

Add this policy to `docs/PUPIL_PROFILE_SPINE.md`:

```markdown
## SEND Linkage Policy

- `pupils.id` is the canonical Schoolgle pupil profile key.
- `pupils.pupil_id` is the source-system pupil identifier from Arbor/SIMS/Bromcom where available.
- `send_register.id` is the SEND register row key.
- `send_register.pupil_id` stores the source pupil identifier used during import.
- SEND UI should route to `/dashboard/pupils/{pupils.id}` wherever a matched pupil profile exists.
- SEND workflow records should store `pupil_record_id = pupils.id` and optionally `send_register_id = send_register.id`.
- Import rows that cannot be matched should remain reviewable and must not create duplicate pupil profiles without human confirmation.
```

- [ ] **Step 3: Run migration lint check**

Run:

```powershell
git diff --check -- apps/platform/supabase/migrations/20260608_send_world_class_workflows.sql docs/PUPIL_PROFILE_SPINE.md
```

Expected: no output.

---

## Task 2: Build Evidence Strength Scoring

**Files:**

- Create: `apps/platform/src/lib/send/evidence-strength.ts`
- Create: `apps/platform/src/lib/send/evidence-strength.test.ts`

- [ ] **Step 1: Write tests**

Create `apps/platform/src/lib/send/evidence-strength.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scoreSendEvidenceStrength } from "./evidence-strength";

describe("scoreSendEvidenceStrength", () => {
  it("marks APDR as weak when parent or pupil voice is missing", () => {
    const result = scoreSendEvidenceStrength({
      context: "apdr",
      hasAssessmentSummary: true,
      hasPlan: true,
      hasProvision: true,
      hasReviewOutcome: true,
      hasParentVoice: false,
      hasPupilVoice: false,
      hasSpecialistAdvice: false,
      hasImpactEvidence: true,
    });

    expect(result.rating).toBe("amber");
    expect(result.missing).toContain("parent_voice");
    expect(result.missing).toContain("pupil_voice");
  });

  it("marks EHCNA readiness as red when APDR and specialist advice are missing", () => {
    const result = scoreSendEvidenceStrength({
      context: "ehcna",
      hasAssessmentSummary: true,
      hasPlan: false,
      hasProvision: false,
      hasReviewOutcome: false,
      hasParentVoice: true,
      hasPupilVoice: true,
      hasSpecialistAdvice: false,
      hasImpactEvidence: false,
    });

    expect(result.rating).toBe("red");
    expect(result.score).toBeLessThan(50);
  });
});
```

- [ ] **Step 2: Implement scoring helper**

Create `apps/platform/src/lib/send/evidence-strength.ts`:

```ts
export type SendEvidenceContext = "apdr" | "annual_review" | "ehcna" | "funding_escalation";

export type SendEvidenceRating = "red" | "amber" | "green";

export interface SendEvidenceStrengthInput {
  context: SendEvidenceContext;
  hasAssessmentSummary: boolean;
  hasPlan: boolean;
  hasProvision: boolean;
  hasReviewOutcome: boolean;
  hasParentVoice: boolean;
  hasPupilVoice: boolean;
  hasSpecialistAdvice: boolean;
  hasImpactEvidence: boolean;
}

export interface SendEvidenceStrengthResult {
  score: number;
  rating: SendEvidenceRating;
  missing: string[];
  recommendedActions: string[];
}

const WEIGHTS: Record<keyof Omit<SendEvidenceStrengthInput, "context">, number> = {
  hasAssessmentSummary: 15,
  hasPlan: 15,
  hasProvision: 15,
  hasReviewOutcome: 15,
  hasParentVoice: 10,
  hasPupilVoice: 10,
  hasSpecialistAdvice: 10,
  hasImpactEvidence: 10,
};

const MISSING_LABELS: Record<keyof typeof WEIGHTS, string> = {
  hasAssessmentSummary: "assessment_summary",
  hasPlan: "plan",
  hasProvision: "provision",
  hasReviewOutcome: "review_outcome",
  hasParentVoice: "parent_voice",
  hasPupilVoice: "pupil_voice",
  hasSpecialistAdvice: "specialist_advice",
  hasImpactEvidence: "impact_evidence",
};

export function scoreSendEvidenceStrength(input: SendEvidenceStrengthInput): SendEvidenceStrengthResult {
  const missing = Object.entries(WEIGHTS)
    .filter(([key]) => !input[key as keyof typeof WEIGHTS])
    .map(([key]) => MISSING_LABELS[key as keyof typeof WEIGHTS]);

  let score = Object.entries(WEIGHTS).reduce((total, [key, weight]) => {
    return input[key as keyof typeof WEIGHTS] ? total + weight : total;
  }, 0);

  if (input.context === "ehcna" && (!input.hasPlan || !input.hasReviewOutcome || !input.hasSpecialistAdvice)) {
    score = Math.min(score, 45);
  }

  const rating: SendEvidenceRating = score >= 80 ? "green" : score >= 50 ? "amber" : "red";

  return {
    score,
    rating,
    missing,
    recommendedActions: missing.map((field) => `Add ${field.replaceAll("_", " ")} evidence`),
  };
}
```

- [ ] **Step 3: Run tests**

Run:

```powershell
cd apps/platform
npx vitest run src/lib/send/evidence-strength.test.ts
```

Expected: two tests pass.

---

## Task 3: Build Meeting Copilot Extraction

**Files:**

- Create: `apps/platform/src/lib/send/meeting-copilot.ts`
- Create: `apps/platform/src/lib/send/meeting-copilot.test.ts`

- [ ] **Step 1: Write tests**

Create `apps/platform/src/lib/send/meeting-copilot.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { extractSendMeetingActions } from "./meeting-copilot";

describe("extractSendMeetingActions", () => {
  it("extracts owner and due date from simple meeting notes", () => {
    const result = extractSendMeetingActions(
      "Mrs Jones will update the sensory plan by 2026-06-20. SENCO to request speech and language advice by 2026-06-25."
    );

    expect(result.actions).toHaveLength(2);
    expect(result.actions[0]).toMatchObject({
      ownerText: "Mrs Jones",
      dueDate: "2026-06-20",
    });
    expect(result.actions[1]).toMatchObject({
      ownerText: "SENCO",
      dueDate: "2026-06-25",
    });
  });
});
```

- [ ] **Step 2: Implement deterministic extractor**

Create `apps/platform/src/lib/send/meeting-copilot.ts`:

```ts
export interface SendMeetingActionDraft {
  title: string;
  ownerText: string;
  dueDate: string | null;
  sourceText: string;
}

export interface SendMeetingExtractionResult {
  actions: SendMeetingActionDraft[];
}

const ACTION_PATTERN = /(?<owner>[A-Z][A-Za-z\\s.]+?|SENCO)\\s+(?:will|to)\\s+(?<task>.+?)\\s+by\\s+(?<date>\\d{4}-\\d{2}-\\d{2})/gi;

export function extractSendMeetingActions(transcript: string): SendMeetingExtractionResult {
  const actions: SendMeetingActionDraft[] = [];

  for (const match of transcript.matchAll(ACTION_PATTERN)) {
    const groups = match.groups;
    if (!groups) continue;

    actions.push({
      title: groups.task.trim().replace(/[.。]$/, ""),
      ownerText: groups.owner.trim(),
      dueDate: groups.date,
      sourceText: match[0].trim(),
    });
  }

  return { actions };
}
```

- [ ] **Step 3: Run tests**

Run:

```powershell
cd apps/platform
npx vitest run src/lib/send/meeting-copilot.test.ts
```

Expected: one test passes.

---

## Task 4: Build SEND Timeline Aggregator

**Files:**

- Create: `apps/platform/src/lib/send/pupil-send-timeline.ts`
- Create: `apps/platform/src/lib/send/pupil-send-timeline.test.ts`
- Modify: `apps/platform/src/app/api/pupils/[id]/profile/route.ts`

- [ ] **Step 1: Write timeline tests**

Create `apps/platform/src/lib/send/pupil-send-timeline.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildPupilSendTimeline } from "./pupil-send-timeline";

describe("buildPupilSendTimeline", () => {
  it("sorts mixed SEND events newest first", () => {
    const timeline = buildPupilSendTimeline({
      registerEvents: [{ date: "2026-01-10", title: "Added to SEND register" }],
      apdrCycles: [{ date: "2026-03-01", title: "APDR review completed" }],
      meetings: [{ date: "2026-02-01", title: "Parent meeting" }],
      evidence: [{ date: "2026-04-01", title: "Speech report uploaded" }],
      fundingEvents: [{ date: "2026-05-01", title: "Funding schedule matched" }],
    });

    expect(timeline.map((event) => event.title)).toEqual([
      "Funding schedule matched",
      "Speech report uploaded",
      "APDR review completed",
      "Parent meeting",
      "Added to SEND register",
    ]);
  });
});
```

- [ ] **Step 2: Implement timeline builder**

Create `apps/platform/src/lib/send/pupil-send-timeline.ts`:

```ts
export type PupilSendTimelineType = "register" | "apdr" | "meeting" | "evidence" | "funding";

export interface PupilSendTimelineEventInput {
  date: string | null;
  title: string;
  summary?: string | null;
}

export interface PupilSendTimelineInput {
  registerEvents: PupilSendTimelineEventInput[];
  apdrCycles: PupilSendTimelineEventInput[];
  meetings: PupilSendTimelineEventInput[];
  evidence: PupilSendTimelineEventInput[];
  fundingEvents: PupilSendTimelineEventInput[];
}

export interface PupilSendTimelineEvent extends PupilSendTimelineEventInput {
  type: PupilSendTimelineType;
}

function withType(type: PupilSendTimelineType, events: PupilSendTimelineEventInput[]): PupilSendTimelineEvent[] {
  return events.map((event) => ({ ...event, type }));
}

export function buildPupilSendTimeline(input: PupilSendTimelineInput): PupilSendTimelineEvent[] {
  return [
    ...withType("register", input.registerEvents),
    ...withType("apdr", input.apdrCycles),
    ...withType("meeting", input.meetings),
    ...withType("evidence", input.evidence),
    ...withType("funding", input.fundingEvents),
  ].sort((left, right) => {
    const leftTime = left.date ? Date.parse(left.date) : 0;
    const rightTime = right.date ? Date.parse(right.date) : 0;
    return rightTime - leftTime;
  });
}
```

- [ ] **Step 3: Add timeline to pupil profile API**

Modify `apps/platform/src/app/api/pupils/[id]/profile/route.ts` so the response includes a `send_timeline` array generated from matched SEND records, APDR cycles, evidence items, meetings and funding events.

- [ ] **Step 4: Run tests**

Run:

```powershell
cd apps/platform
npx vitest run src/lib/send/pupil-send-timeline.test.ts
```

Expected: one test passes.

---

## Task 5: Build Ofsted Inclusion Matrix

**Files:**

- Create: `apps/platform/src/lib/send/ofsted-inclusion-matrix.ts`
- Create: `apps/platform/src/lib/send/ofsted-inclusion-matrix.test.ts`
- Create: `apps/platform/src/app/api/send/ofsted-matrix/route.ts`
- Modify: `apps/platform/src/lib/ofsted-readiness/findings.ts`

- [ ] **Step 1: Write matrix tests**

Create `apps/platform/src/lib/send/ofsted-inclusion-matrix.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildOfstedInclusionMatrix } from "./ofsted-inclusion-matrix";

describe("buildOfstedInclusionMatrix", () => {
  it("flags missing parent and pupil voice as amber", () => {
    const matrix = buildOfstedInclusionMatrix({
      sendPupilCount: 20,
      apdrOverdueCount: 0,
      missingParentVoiceCount: 3,
      missingPupilVoiceCount: 4,
      missingSpecialistAdviceCount: 0,
      attendanceConcernCount: 0,
      behaviourConcernCount: 0,
      evidenceStaleCount: 0,
    });

    const voiceRow = matrix.rows.find((row) => row.key === "parent_pupil_voice");

    expect(voiceRow?.rag).toBe("amber");
    expect(voiceRow?.evidenceGapCount).toBe(7);
  });
});
```

- [ ] **Step 2: Implement matrix helper**

Create `apps/platform/src/lib/send/ofsted-inclusion-matrix.ts`:

```ts
export type InclusionMatrixRag = "green" | "amber" | "red";

export interface InclusionMatrixInput {
  sendPupilCount: number;
  apdrOverdueCount: number;
  missingParentVoiceCount: number;
  missingPupilVoiceCount: number;
  missingSpecialistAdviceCount: number;
  attendanceConcernCount: number;
  behaviourConcernCount: number;
  evidenceStaleCount: number;
}

export interface InclusionMatrixRow {
  key: string;
  title: string;
  rag: InclusionMatrixRag;
  evidenceGapCount: number;
  recommendedAction: string;
}

export interface InclusionMatrixResult {
  rows: InclusionMatrixRow[];
}

function ragFromGap(gap: number, severeAt: number): InclusionMatrixRag {
  if (gap >= severeAt) return "red";
  if (gap > 0) return "amber";
  return "green";
}

export function buildOfstedInclusionMatrix(input: InclusionMatrixInput): InclusionMatrixResult {
  const voiceGap = input.missingParentVoiceCount + input.missingPupilVoiceCount;

  return {
    rows: [
      {
        key: "graduated_approach",
        title: "APDR cycles are current",
        rag: ragFromGap(input.apdrOverdueCount, 5),
        evidenceGapCount: input.apdrOverdueCount,
        recommendedAction: "Review overdue APDR cycles and record next actions.",
      },
      {
        key: "parent_pupil_voice",
        title: "Parent and pupil voice is captured",
        rag: ragFromGap(voiceGap, 10),
        evidenceGapCount: voiceGap,
        recommendedAction: "Capture missing parent and pupil voice before the next review.",
      },
      {
        key: "specialist_advice",
        title: "Specialist advice is recorded and acted on",
        rag: ragFromGap(input.missingSpecialistAdviceCount, 5),
        evidenceGapCount: input.missingSpecialistAdviceCount,
        recommendedAction: "Attach specialist advice or record why it is not required.",
      },
      {
        key: "attendance_behaviour",
        title: "Attendance and behaviour adaptations are monitored",
        rag: ragFromGap(input.attendanceConcernCount + input.behaviourConcernCount, 10),
        evidenceGapCount: input.attendanceConcernCount + input.behaviourConcernCount,
        recommendedAction: "Review pupils with attendance or behaviour concerns and update support plans.",
      },
    ],
  };
}
```

- [ ] **Step 3: Extend Ofsted source type**

Modify `apps/platform/src/lib/ofsted-readiness/findings.ts` to include SEND source types:

```ts
export type OfstedFindingSourceType =
  | "document_check"
  | "assessment_signal"
  | "safeguarding_signal"
  | "send_inclusion_matrix"
  | "send_evidence_gap"
  | "send_funding_gap";
```

- [ ] **Step 4: Run tests**

Run:

```powershell
cd apps/platform
npx vitest run src/lib/send/ofsted-inclusion-matrix.test.ts
```

Expected: one test passes.

---

## Task 6: Build Funding Reconciliation Workflow

**Files:**

- Modify: `apps/platform/src/lib/send/funding-reconciliation.ts`
- Create: `apps/platform/src/lib/send/funding-reconciliation-world-class.test.ts`
- Create: `apps/platform/src/app/api/send/funding-rules/route.ts`
- Create: `apps/platform/src/app/api/send/funding-reconciliation/route.ts`
- Create: `apps/platform/src/components/send/FundingReconciliationPanel.tsx`

- [ ] **Step 1: Add tests for the reconciliation decisions**

Create `apps/platform/src/lib/send/funding-reconciliation-world-class.test.ts` with cases for:

```ts
import { describe, expect, it } from "vitest";
import { reconcileSendFunding } from "./funding-reconciliation";

describe("reconcileSendFunding world-class scenarios", () => {
  it("flags EHCP pupils missing from the LA funding schedule", () => {
    const result = reconcileSendFunding({
      pupils: [{ pupilId: "P1", hasEhcp: true, provisionCostAnnual: 12000 }],
      fundingRows: [],
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        pupilId: "P1",
        issueType: "missing_funding",
      })
    );
  });

  it("flags provision cost above funding received", () => {
    const result = reconcileSendFunding({
      pupils: [{ pupilId: "P2", hasEhcp: true, provisionCostAnnual: 18000 }],
      fundingRows: [{ pupilId: "P2", annualAmount: 9000, band: "Band 2" }],
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        pupilId: "P2",
        issueType: "funding_gap",
      })
    );
  });
});
```

- [ ] **Step 2: Ensure reconciliation returns explainable issues**

Update `apps/platform/src/lib/send/funding-reconciliation.ts` so each issue includes:

```ts
export interface SendFundingIssue {
  pupilId: string;
  issueType: "missing_funding" | "funding_gap" | "possible_overpayment" | "band_mismatch";
  severity: "low" | "medium" | "high";
  explanation: string;
  suggestedAction: string;
}
```

- [ ] **Step 3: Add API routes**

Create API routes that:

- read LA funding rules/schedules for an organization;
- run reconciliation against EHCP pupils and provision costs;
- store the run result for audit;
- return issues grouped by severity and pupil.

- [ ] **Step 4: Run tests**

Run:

```powershell
cd apps/platform
npx vitest run src/lib/send/funding-reconciliation-world-class.test.ts
```

Expected: funding tests pass.

---

## Task 7: Build Meeting Copilot UI And API

**Files:**

- Create: `apps/platform/src/app/api/send/meetings/route.ts`
- Create: `apps/platform/src/components/send/MeetingCopilotPanel.tsx`
- Modify: `apps/platform/src/app/(dashboard)/dashboard/send/page.tsx`
- Modify: `apps/platform/src/app/api/tasks/route.ts`

- [ ] **Step 1: Add meeting API**

Create `apps/platform/src/app/api/send/meetings/route.ts` with:

- `GET` for meetings by organization and optional pupil profile;
- `POST` to save transcript/minutes/decisions/actions;
- task creation for accepted actions using the unified task/action model.

- [ ] **Step 2: Add MeetingCopilotPanel**

Create `apps/platform/src/components/send/MeetingCopilotPanel.tsx` with:

- consent checkbox;
- transcript text area for first build;
- "Generate draft minutes and actions" button;
- draft minutes preview;
- accepted/declined action checklist;
- save button.

- [ ] **Step 3: Wire panel to pupil SEND profile**

Modify `apps/platform/src/app/(dashboard)/dashboard/send/page.tsx` or the pupil profile page once split so a SENCO can start a meeting from a pupil row/profile.

- [ ] **Step 4: Manual browser test**

Run:

```powershell
cd apps/platform
npm run dev
```

Open:

```text
http://localhost:3000/dashboard/send
```

Expected:

- select a SEND pupil;
- open Meeting Copilot;
- paste meeting notes;
- generate draft actions;
- save;
- refresh;
- meeting appears in pupil timeline.

---

## Task 8: Build SEND Caseload Table And Profile Panels

**Files:**

- Create: `apps/platform/src/components/send/SendCaseloadTable.tsx`
- Create: `apps/platform/src/components/send/PupilSendProfilePanel.tsx`
- Create: `apps/platform/src/components/send/ApdrCyclePanel.tsx`
- Modify: `apps/platform/src/app/(dashboard)/dashboard/send/page.tsx`

- [ ] **Step 1: Extract caseload table**

Create a sortable table component with these columns:

```ts
export const SEND_CASELOAD_COLUMNS = [
  "Pupil",
  "Year",
  "Class",
  "SEN status",
  "Primary need",
  "EHCP",
  "Next review",
  "Provision",
  "Evidence",
  "Funding",
  "Owner",
  "Risk",
] as const;
```

- [ ] **Step 2: Add table filters**

Filters must include:

- all statuses;
- EHCP only;
- K/SEN Support only;
- overdue review;
- missing evidence;
- funding issue;
- year group;
- class.

- [ ] **Step 3: Add profile panel**

The panel must show:

- pupil identity summary;
- SEND status;
- next review;
- evidence strength;
- active provision;
- funding issue count;
- open actions;
- tabs for APDR, provision, EHCP, evidence, meetings, funding and Ofsted.

- [ ] **Step 4: Browser test with Grove House UAT data**

Open:

```text
http://localhost:3000/dashboard/send
```

Expected:

- 106 Grove SEND pupils still render;
- table filters work;
- clicking a pupil opens profile panel;
- profile panel links to `/dashboard/pupils/{id}` where matched.

---

## Task 9: Build Governor And Trust SEND Reports

**Files:**

- Create: `apps/platform/src/app/api/send/reports/governor/route.ts`
- Create: `apps/platform/src/lib/send/governor-report.ts`
- Create: `apps/platform/src/lib/send/governor-report.test.ts`

- [ ] **Step 1: Write report summary tests**

Create `apps/platform/src/lib/send/governor-report.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSendGovernorReportSummary } from "./governor-report";

describe("buildSendGovernorReportSummary", () => {
  it("summarises SEND risks for governors", () => {
    const summary = buildSendGovernorReportSummary({
      sendPupilCount: 106,
      ehcpCount: 45,
      apdrOverdueCount: 8,
      annualReviewsDueSoon: 5,
      fundingGapAnnual: 18000,
      ofstedInclusionRag: "amber",
    });

    expect(summary.headline).toContain("106 pupils");
    expect(summary.risks).toContain("8 APDR cycles are overdue");
    expect(summary.risks).toContain("£18,000 annual funding gap identified");
  });
});
```

- [ ] **Step 2: Implement report builder**

Create `apps/platform/src/lib/send/governor-report.ts`:

```ts
export interface SendGovernorReportInput {
  sendPupilCount: number;
  ehcpCount: number;
  apdrOverdueCount: number;
  annualReviewsDueSoon: number;
  fundingGapAnnual: number;
  ofstedInclusionRag: "green" | "amber" | "red";
}

export interface SendGovernorReportSummary {
  headline: string;
  risks: string[];
  assuranceQuestions: string[];
}

export function buildSendGovernorReportSummary(input: SendGovernorReportInput): SendGovernorReportSummary {
  const risks: string[] = [];

  if (input.apdrOverdueCount > 0) risks.push(`${input.apdrOverdueCount} APDR cycles are overdue`);
  if (input.annualReviewsDueSoon > 0) risks.push(`${input.annualReviewsDueSoon} EHCP annual reviews are due soon`);
  if (input.fundingGapAnnual > 0) risks.push(`£${input.fundingGapAnnual.toLocaleString("en-GB")} annual funding gap identified`);
  if (input.ofstedInclusionRag !== "green") risks.push(`Ofsted inclusion evidence is ${input.ofstedInclusionRag}`);

  return {
    headline: `${input.sendPupilCount} pupils are recorded on the SEND register, including ${input.ehcpCount} with EHCPs.`,
    risks,
    assuranceQuestions: [
      "Are APDR reviews completed on time and showing impact?",
      "Are EHCP annual reviews completed within statutory timescales?",
      "Does provision cost align with funding received?",
      "Can leaders evidence inclusive practice for pupils with SEND?",
    ],
  };
}
```

- [ ] **Step 3: Run tests**

Run:

```powershell
cd apps/platform
npx vitest run src/lib/send/governor-report.test.ts
```

Expected: one test passes.

---

## Task 10: QA And User Acceptance With Grove House

**Files:**

- Modify: `docs/modules/sen-funding/SEND_COPILOT_DAY_IN_LIFE_ACCEPTANCE_TESTS.md`
- Modify: `docs/modules/sen-funding/SEND_WORLD_CLASS_BLUEPRINT_2026-06-08.md`

- [ ] **Step 1: Add Grove House UAT scenarios**

Add scenarios:

```markdown
## Grove House UAT Scenarios

1. SENCO opens SEND register and sees 106 imported SEND pupils.
2. SENCO filters to EHCP pupils and sees 45 pupils.
3. SENCO opens a pupil profile and sees class, SEND status, primary need and profile timeline.
4. SENCO creates APDR cycle and review task.
5. SENCO records a parent meeting transcript and accepts generated actions.
6. SENCO uploads specialist evidence and evidence strength improves.
7. SENCO imports an LA funding schedule and sees funding issues.
8. Headteacher opens Ofsted Inclusion Matrix and sees SEND evidence gaps.
9. Governor report is generated from live data.
10. Archived pupil remains excluded from current caseload but retained according to retention policy.
```

- [ ] **Step 2: Run focused tests**

Run:

```powershell
cd apps/platform
npx vitest run src/lib/send-status-import.test.ts src/lib/send-pupil-matching.test.ts src/lib/send/evidence-strength.test.ts src/lib/send/ofsted-inclusion-matrix.test.ts src/lib/send/meeting-copilot.test.ts src/lib/send/governor-report.test.ts
```

Expected: all focused SEND tests pass.

- [ ] **Step 3: Browser test**

Open:

```text
http://localhost:3000/dashboard/send
```

Expected:

- no demo data banner for Grove House;
- caseload renders from UAT database;
- pupil profile opens;
- APDR, meeting, evidence and funding flows persist after refresh;
- no console errors.

---

## Delivery Priorities

### Build First

1. Pupil profile spine and SEND linkage.
2. Caseload table and profile panel.
3. APDR cycles and evidence strength.
4. Meeting Copilot text/transcript workflow.
5. Ofsted Inclusion Matrix.

### Build Second

1. EHCP lifecycle.
2. Annual review tracker.
3. Funding reconciliation with LA rules.
4. Governor/trust reports.

### Build Third

1. Audio recording/transcription inside meetings.
2. AI case builder for EHCNA, annual review and funding escalation.
3. Trust-level benchmarking.
4. Future-ready ISP workflow once government rules are confirmed.

## Product Guardrails

- AI suggestions must be stored with accepted/declined state.
- Users must approve statutory outputs before export.
- Future SEND reform concepts must be labelled as future-ready, not current statutory duty.
- Pupil data must be exportable, archivable and deletable according to school retention decisions.
- SEND tasks must appear in the unified task system.
- Ofsted gaps must link back to the source pupil/evidence/action.

## QA And Live-Like Data Guardrails

Grove House data is live-like customer trial data and must be protected as the clean starting point for real use. Do not treat the database as disposable.

Current non-sensitive baseline: `docs/uat-baselines/grove-house-send-baseline-2026-06-08.md`.

Before starting each implementation task:

- Capture a baseline for the affected organisation and tables using counts and non-sensitive checksums only.
- Identify every table the task may write to.
- Define the cleanup/revert query before running a write test.
- Use a unique `test_run_id` or clearly prefixed test data for any inserted records.
- Prefer test-only pupils/records where possible; if an existing Grove House record must be edited, capture the exact previous values and restore them after the test.

Before moving to the next task:

- Run the focused unit/API tests for the changed behaviour.
- Run the relevant browser flow if the change is user-facing.
- Confirm database persistence.
- Cleanup or revert all test writes.
- Re-check the baseline counts/checksums.
- Record the test command, browser route, database tables touched and cleanup result in the task notes.

No SEND feature is considered complete if test data remains in Grove House unintentionally or if there is no documented cleanup route.

## Open Questions For David / SENCO Validation

1. Which local authority does Grove House use for high-needs funding and banding?
2. Can Grove House provide a sample LA funding schedule with pupil identifiers anonymised if needed?
3. Can they provide one redacted EHCP, one annual review pack and one APDR/support plan?
4. Do they want meeting audio recording in-browser first, or transcript paste/upload first?
5. Which governor report format do they currently use?
6. Which reports do they already submit to the trust/headteacher and how often?
7. Are staff hourly costs available, or should phase one use configurable default rates?
