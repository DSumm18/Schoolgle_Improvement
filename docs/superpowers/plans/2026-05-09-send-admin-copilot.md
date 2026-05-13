# SEND Admin Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a SENCO-ready SEND Admin Copilot that manages pupil-linked SEND meetings, statutory agendas, live guidance prompts, evidence packs, annual review/EHCP/HNF workflows, and follow-up documentation.

**Architecture:** Extend the existing SEND Hub, Meeting Companion, Document Production, Ed SEND specialist, and evidence/database layers rather than creating a parallel product. Meeting templates and statutory prompt packs become versioned data; meetings link to SEND pupil records; transcripts/minutes feed SEND evidence files, review history, actions, deadlines, and generated documents.

**Tech Stack:** Next.js 16 App Router, Supabase Postgres/RLS, existing `/api/send/*` routes, existing `/api/meetings/*` routes, Deepgram transcription, OpenRouter-approved model policy, Vitest, existing Schoolgle document/evidence patterns.

---

## Approved Product Design Link

This implementation plan now works from the approved product design in `docs/superpowers/specs/2026-05-09-send-copilot-product-design.md`.

The Phase 1 product line is:

1. `SEND Today` command centre for SENCO daily priorities.
2. `Pupil One View` for register, EHCP/APDR/provision/evidence/referrals/funding/actions.
3. `Annual Review Meeting Copilot` using the existing Meeting Companion architecture.
4. `EHCP Request Evidence Pack` readiness scoring and document generation.
5. `Arbor/Wonde/CSV Import Path` starting with read-only import into Schoolgle-managed SEND workflows.
6. `Versioned Statutory Rule Pack` for APDR, EHCP request and annual review workflows.

The product must stay SENCO-simple: every screen should answer either "who needs attention?", "what is missing?", or "what do I need to do next?"

---

## Product Decisions

- The product name in code should be `SEND Admin Copilot`; UI copy can say `SEND Meeting Copilot` for the live meeting surface.
- The assistant must present itself as statutory guidance support, not legal advice. Use “suggested challenge”, “statutory prompt”, and “evidence question” language.
- The system must preserve human judgement: SENCO decides whether to use a prompt, submit a challenge, or include text in minutes.
- The first commercial demo should target one trust hub and support these workflows end-to-end: EHCP Annual Review, SEN Support/APDR Review, EHCP Needs Assessment Planning, High Needs Funding/Band Review, TAC/TAF, Transition Planning, Placement Consultation.
- Current statutory baseline: SEND Code of Practice 0-25 remains live statutory guidance, last updated 12 September 2024; DfE SEND reform consultation published 23 February 2026 and open until 18 May 2026; Ofsted EIF from November 2025 has `inclusion` as a separate evaluation area.

## File Structure

- Create `apps/platform/src/lib/send/statutory-guidance.ts` — versioned statutory source catalogue, quote-safe summaries, challenge prompts, and source retrieval helpers.
- Create `apps/platform/src/lib/send/statutory-guidance.test.ts` — tests for source versioning, matching, and “not legal advice” guardrails.
- Create `apps/platform/src/lib/send/meeting-agendas.ts` — SEND meeting agenda templates, checklist items, statutory prompts, evidence requirements, and output document mappings.
- Create `apps/platform/src/lib/send/meeting-agendas.test.ts` — tests for required agenda coverage per meeting type.
- Create `apps/platform/supabase/migrations/20260509_send_admin_copilot.sql` — meeting-to-pupil context, live prompt events, statutory source packs, and generated SEND document links.
- Modify `apps/platform/src/lib/meetings/types.ts` — add SEND meeting context types without breaking existing HR meetings.
- Modify `apps/platform/src/lib/meetings/meeting-template-catalog.ts` — add SEND template catalogue entries backed by `send/meeting-agendas.ts`.
- Modify `apps/platform/src/app/api/meetings/route.ts` — accept SEND context and persist pupil linkage when creating meetings.
- Modify `apps/platform/src/app/api/meetings/[id]/route.ts` — return SEND context, agenda snapshot, linked pupil, and statutory prompt state.
- Create `apps/platform/src/app/api/send/meetings/route.ts` — list/create SEND meetings from the SEND module.
- Create `apps/platform/src/app/api/send/meetings/[id]/live-prompts/route.ts` — fetch and record live prompt suggestions during meetings.
- Create `apps/platform/src/lib/send/live-guidance-engine.ts` — deterministic + model-assisted transcript analysis for statutory prompts.
- Create `apps/platform/src/lib/send/live-guidance-engine.test.ts` — tests for live trigger detection and non-trigger cases.
- Create `apps/platform/src/app/(dashboard)/dashboard/send/meetings/page.tsx` — SEND meetings list filtered by pupil/workflow.
- Create `apps/platform/src/app/(dashboard)/dashboard/send/meetings/[id]/live/page.tsx` — live meeting cockpit with agenda, transcript, statutory prompts, challenge buttons, and notes.
- Modify `apps/platform/src/app/(dashboard)/dashboard/send/page.tsx` — add `Meetings`, `Reviews`, `EHCP`, and `Funding` entry points instead of burying SEND as register-only.
- Create `apps/platform/src/lib/send/document-output.ts` — map meeting outcomes into annual review reports, EHCP evidence summaries, HNF cases, and parent/professional letters.
- Create `apps/platform/src/lib/send/document-output.test.ts` — tests for required document sections and statutory wording.
- Create `apps/platform/src/app/api/send/documents/generate/route.ts` — generate pupil-linked SEND documents from meeting/evidence context.
- Create `apps/platform/src/lib/skills/send-admin-copilot.ts` — Ed skills for evidence questions, statutory prompt lookup, agenda prep, and follow-up generation.
- Modify `apps/platform/src/lib/skills/school-skills-registry.ts` — register SEND Admin Copilot skills.
- Modify `packages/ed-agents/src/agents/prompts/send-specialist.ts` — add boundaries for statutory prompt support, challenge drafting, and live meeting assistance.
- Create `docs/modules/sen-funding/SEND_ADMIN_COPILOT_PRODUCT_SPEC.md` — product workflow, source authority, demo story, and launch boundary.

---

### Task 1: Add Statutory Guidance Source Pack

**Files:**
- Create: `apps/platform/src/lib/send/statutory-guidance.ts`
- Create: `apps/platform/src/lib/send/statutory-guidance.test.ts`

- [ ] **Step 1: Write source pack tests**

```ts
import { describe, expect, it } from "vitest";
import {
  SEND_STATUTORY_SOURCES,
  findGuidancePrompts,
  getGuidanceDisclaimer,
} from "./statutory-guidance";

describe("SEND statutory guidance pack", () => {
  it("includes current statutory and reform sources with dates", () => {
    expect(SEND_STATUTORY_SOURCES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "send-code-of-practice-0-25",
          status: "statutory",
          lastChecked: "2026-05-09",
        }),
        expect.objectContaining({
          id: "dfe-send-reform-2026-consultation",
          status: "consultation",
          lastChecked: "2026-05-09",
        }),
      ]),
    );
  });

  it("finds annual review prompts for overdue LA responses", () => {
    const prompts = findGuidancePrompts({
      meetingType: "ehcp_annual_review",
      transcriptText: "The local authority has not responded after six weeks.",
      desiredOutcome: "secure_la_decision",
    });

    expect(prompts[0]).toMatchObject({
      category: "statutory_deadline",
      suggestedAction: "Ask for the LA decision and record the overdue response in the minutes.",
    });
  });

  it("always includes a guidance-not-legal-advice disclaimer", () => {
    expect(getGuidanceDisclaimer()).toContain("statutory guidance support");
    expect(getGuidanceDisclaimer()).toContain("not legal advice");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd apps/platform; npx vitest run src/lib/send/statutory-guidance.test.ts`

Expected: fails because `statutory-guidance.ts` does not exist.

- [ ] **Step 3: Implement source pack**

```ts
export type SendSourceStatus = "statutory" | "consultation" | "inspection" | "practice";

export type SendGuidanceSource = {
  id: string;
  title: string;
  status: SendSourceStatus;
  authority: "DfE" | "Ofsted" | "IPSEA" | "Council for Disabled Children" | "Schoolgle";
  url: string;
  effectiveFrom?: string;
  lastUpdated?: string;
  lastChecked: string;
  summary: string;
};

export type SendMeetingType =
  | "ehcp_annual_review"
  | "sen_support_apdr_review"
  | "ehcp_needs_assessment_planning"
  | "high_needs_funding_review"
  | "tac_taf"
  | "transition_planning"
  | "placement_consultation"
  | "isp_readiness_review";

export type GuidancePrompt = {
  id: string;
  meetingType: SendMeetingType;
  category: "statutory_deadline" | "evidence_gap" | "provision_specificity" | "parent_voice" | "pupil_voice" | "placement" | "funding";
  triggerPhrases: string[];
  sourceIds: string[];
  suggestedAction: string;
  suggestedWords: string;
  minuteNote: string;
};

export const SEND_STATUTORY_SOURCES: SendGuidanceSource[] = [
  {
    id: "send-code-of-practice-0-25",
    title: "SEND Code of Practice: 0 to 25 years",
    status: "statutory",
    authority: "DfE",
    url: "https://www.gov.uk/government/publications/send-code-of-practice-0-to-25",
    lastUpdated: "2024-09-12",
    lastChecked: "2026-05-09",
    summary: "Statutory guidance for the SEND system, including SEN support, EHC needs assessments, EHC plans, and annual reviews.",
  },
  {
    id: "dfe-send-reform-2026-consultation",
    title: "SEND reform: putting children and young people first",
    status: "consultation",
    authority: "DfE",
    url: "https://www.gov.uk/government/consultations/send-reform-putting-children-and-young-people-first",
    effectiveFrom: "2026-02-23",
    lastChecked: "2026-05-09",
    summary: "Current consultation on digital ISPs, Targeted and Targeted Plus support, Inclusion Bases, mainstream inclusion, and EHCP transition protections.",
  },
  {
    id: "ofsted-eif-november-2025",
    title: "Education inspection framework: for use from November 2025",
    status: "inspection",
    authority: "Ofsted",
    url: "https://www.gov.uk/government/publications/education-inspection-framework/education-inspection-framework-for-use-from-november-2025",
    effectiveFrom: "2025-11-10",
    lastChecked: "2026-05-09",
    summary: "Inspection framework that includes inclusion as a school evaluation area.",
  },
];

const GUIDANCE_PROMPTS: GuidancePrompt[] = [
  {
    id: "annual-review-la-response-overdue",
    meetingType: "ehcp_annual_review",
    category: "statutory_deadline",
    triggerPhrases: ["not responded", "six weeks", "no decision", "waiting for the local authority"],
    sourceIds: ["send-code-of-practice-0-25"],
    suggestedAction: "Ask for the LA decision and record the overdue response in the minutes.",
    suggestedWords: "Can we record that the review paperwork has been submitted and that the school is seeking the local authority decision, including whether the plan will be maintained, amended or ceased?",
    minuteNote: "The meeting recorded that the school is awaiting the local authority decision following annual review paperwork submission.",
  },
  {
    id: "provision-not-quantified",
    meetingType: "ehcp_annual_review",
    category: "provision_specificity",
    triggerPhrases: ["access to", "as required", "regular support", "opportunities for"],
    sourceIds: ["send-code-of-practice-0-25"],
    suggestedAction: "Ask for provision to be specified and quantified where possible.",
    suggestedWords: "Can we clarify the frequency, duration, staffing and intended outcome for that provision so the plan is specific enough to deliver and monitor?",
    minuteNote: "The meeting requested that provision be specified and quantified so delivery can be monitored.",
  },
];

export function findGuidancePrompts(args: {
  meetingType: SendMeetingType;
  transcriptText: string;
  desiredOutcome?: string;
}): GuidancePrompt[] {
  const text = args.transcriptText.toLowerCase();
  return GUIDANCE_PROMPTS.filter(
    (prompt) =>
      prompt.meetingType === args.meetingType &&
      prompt.triggerPhrases.some((phrase) => text.includes(phrase)),
  );
}

export function getGuidanceDisclaimer(): string {
  return "Schoolgle provides statutory guidance support for school decision-making. It is not legal advice, and the SENCO or school leader remains responsible for professional judgement and final wording.";
}
```

- [ ] **Step 4: Run source pack tests**

Run: `cd apps/platform; npx vitest run src/lib/send/statutory-guidance.test.ts`

Expected: PASS.

---

### Task 2: Define SEND Meeting Agenda Library

**Files:**
- Create: `apps/platform/src/lib/send/meeting-agendas.ts`
- Create: `apps/platform/src/lib/send/meeting-agendas.test.ts`
- Modify: `apps/platform/src/lib/meetings/types.ts`

- [ ] **Step 1: Add agenda tests**

```ts
import { describe, expect, it } from "vitest";
import { SEND_MEETING_AGENDAS, getSendMeetingAgenda } from "./meeting-agendas";

describe("SEND meeting agendas", () => {
  it("covers the launch meeting suite", () => {
    expect(SEND_MEETING_AGENDAS.map((agenda) => agenda.type)).toEqual([
      "ehcp_annual_review",
      "sen_support_apdr_review",
      "ehcp_needs_assessment_planning",
      "high_needs_funding_review",
      "tac_taf",
      "transition_planning",
      "placement_consultation",
      "isp_readiness_review",
    ]);
  });

  it("requires parent and pupil voice in EHCP annual reviews", () => {
    const agenda = getSendMeetingAgenda("ehcp_annual_review");
    expect(agenda.checklistItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ phrase: "Parent/carer views considered", is_critical: true }),
        expect.objectContaining({ phrase: "Child or young person views considered", is_critical: true }),
      ]),
    );
  });

  it("maps annual review meetings to annual review documents and evidence files", () => {
    const agenda = getSendMeetingAgenda("ehcp_annual_review");
    expect(agenda.outputs).toContain("annual_review_report");
    expect(agenda.outputs).toContain("sen_evidence_file");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `cd apps/platform; npx vitest run src/lib/send/meeting-agendas.test.ts`

Expected: fails because `meeting-agendas.ts` does not exist.

- [ ] **Step 3: Add meeting context types**

In `apps/platform/src/lib/meetings/types.ts`, add:

```ts
export type SendMeetingWorkflowType =
  | "ehcp_annual_review"
  | "sen_support_apdr_review"
  | "ehcp_needs_assessment_planning"
  | "high_needs_funding_review"
  | "tac_taf"
  | "transition_planning"
  | "placement_consultation"
  | "isp_readiness_review";

export interface SendMeetingContext {
  meeting_id: string;
  send_register_id: string;
  workflow_type: SendMeetingWorkflowType;
  desired_outcome: string | null;
  agenda_snapshot: Record<string, unknown>;
  statutory_deadline: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 4: Implement agenda library**

```ts
import type { ComplianceItem, PreparationGuide } from "@/lib/meetings/types";
import type { SendMeetingType } from "./statutory-guidance";

export type SendMeetingOutput =
  | "annual_review_report"
  | "apdr_review_record"
  | "ehcp_evidence_summary"
  | "high_needs_funding_case"
  | "placement_consultation_response"
  | "sen_evidence_file"
  | "actions";

export type SendMeetingAgenda = {
  type: SendMeetingType;
  name: string;
  description: string;
  openingScript: string[];
  closingScript: string[];
  checklistItems: ComplianceItem[];
  preparationGuide: PreparationGuide;
  livePromptCategories: string[];
  outputs: SendMeetingOutput[];
};

export const SEND_MEETING_AGENDAS: SendMeetingAgenda[] = [
  {
    type: "ehcp_annual_review",
    name: "EHCP Annual Review",
    description: "Statutory review of needs, outcomes, provision, placement, pupil voice and parent/carer views.",
    openingScript: [
      "Welcome to the annual review of the Education, Health and Care Plan.",
      "The purpose is to review needs, outcomes, provision, placement and whether amendments should be recommended.",
      "We will make sure parent/carer views and the child or young person's views are recorded.",
    ],
    closingScript: [
      "We will record the recommendations, actions, responsible people and submission timeline.",
      "The school will keep the review paperwork and evidence linked to the pupil record.",
    ],
    checklistItems: [
      { phrase: "Current needs reviewed", category: "Needs", is_critical: true, order_index: 1 },
      { phrase: "Progress against EHCP outcomes reviewed", category: "Outcomes", is_critical: true, order_index: 2 },
      { phrase: "Provision reviewed for specificity and sufficiency", category: "Provision", is_critical: true, order_index: 3 },
      { phrase: "Parent/carer views considered", category: "Views", is_critical: true, order_index: 4 },
      { phrase: "Child or young person views considered", category: "Views", is_critical: true, order_index: 5 },
      { phrase: "Placement remains appropriate or concerns recorded", category: "Placement", is_critical: true, order_index: 6 },
      { phrase: "Recommendations to maintain, amend or cease recorded", category: "Decision", is_critical: true, order_index: 7 },
      { phrase: "Actions, owners and dates agreed", category: "Actions", is_critical: true, order_index: 8 },
    ],
    preparationGuide: {
      context_prompts: [
        "Check last EHCP issue date and previous review date.",
        "Gather parent/carer views, pupil views, progress data, attendance, provision map and professional reports.",
      ],
      documents_needed: ["Current EHCP", "Previous annual review", "Provision map", "Assessment data", "Professional reports"],
      key_phrases: ["specified and quantified provision", "parent/carer views", "child or young person's views", "maintain, amend or cease"],
      policy_refs: ["SEND Code of Practice 0-25, Chapter 9"],
    },
    livePromptCategories: ["statutory_deadline", "provision_specificity", "parent_voice", "pupil_voice", "placement"],
    outputs: ["annual_review_report", "sen_evidence_file", "actions"],
  },
  {
    type: "sen_support_apdr_review",
    name: "SEN Support APDR Review",
    description: "Assess, Plan, Do, Review meeting for pupils receiving SEN Support.",
    openingScript: ["We are reviewing the current Assess, Plan, Do, Review cycle and deciding next support."],
    closingScript: ["We will agree updated targets, provision, review date and evidence to collect."],
    checklistItems: [
      { phrase: "Assessment evidence reviewed", category: "Assess", is_critical: true, order_index: 1 },
      { phrase: "Targets and planned provision agreed", category: "Plan", is_critical: true, order_index: 2 },
      { phrase: "Delivery responsibilities confirmed", category: "Do", is_critical: true, order_index: 3 },
      { phrase: "Review date and success measures agreed", category: "Review", is_critical: true, order_index: 4 },
    ],
    preparationGuide: {
      context_prompts: ["Review previous APDR cycle and current classroom strategies."],
      documents_needed: ["Previous APDR record", "Assessment data", "Teacher evidence", "Parent/pupil views"],
      key_phrases: ["ordinarily available provision", "graduated approach", "review impact"],
      policy_refs: ["SEND Code of Practice 0-25, Chapter 6"],
    },
    livePromptCategories: ["evidence_gap", "parent_voice", "pupil_voice"],
    outputs: ["apdr_review_record", "sen_evidence_file", "actions"],
  },
  {
    type: "ehcp_needs_assessment_planning",
    name: "EHCP Needs Assessment Planning",
    description: "Internal planning meeting to decide whether the evidence supports requesting EHC needs assessment.",
    openingScript: ["We are reviewing whether needs may require support beyond SEN Support and what evidence is available."],
    closingScript: ["We will record missing evidence, responsible people and the proposed request timeline."],
    checklistItems: [
      { phrase: "Two or more APDR cycles considered", category: "Evidence", is_critical: true, order_index: 1 },
      { phrase: "Provision above ordinarily available support considered", category: "Provision", is_critical: true, order_index: 2 },
      { phrase: "Parent/carer discussion planned or recorded", category: "Views", is_critical: true, order_index: 3 },
      { phrase: "Professional advice gaps identified", category: "Evidence", is_critical: true, order_index: 4 },
    ],
    preparationGuide: {
      context_prompts: ["Check APDR history, provision cost, progress and professional involvement."],
      documents_needed: ["APDR cycles", "Provision map", "Assessment data", "Attendance/behaviour evidence", "Professional reports"],
      key_phrases: ["evidence of special educational provision required", "graduated approach exhausted or insufficient"],
      policy_refs: ["SEND Code of Practice 0-25, Chapter 9"],
    },
    livePromptCategories: ["evidence_gap", "provision_specificity"],
    outputs: ["ehcp_evidence_summary", "sen_evidence_file", "actions"],
  },
  {
    type: "high_needs_funding_review",
    name: "High Needs Funding / Band Review",
    description: "Review provision cost, need profile and LA band evidence for HNF or band escalation.",
    openingScript: ["We are reviewing whether current provision and cost evidence supports the existing or requested funding level."],
    closingScript: ["We will record the funding gap, evidence base and next submission actions."],
    checklistItems: [
      { phrase: "Current provision cost reviewed", category: "Funding", is_critical: true, order_index: 1 },
      { phrase: "LA band descriptor considered", category: "Funding", is_critical: true, order_index: 2 },
      { phrase: "Gap between provision cost and funding recorded", category: "Funding", is_critical: true, order_index: 3 },
      { phrase: "Evidence for higher band or HNF request agreed", category: "Evidence", is_critical: true, order_index: 4 },
    ],
    preparationGuide: {
      context_prompts: ["Check current band, top-up, provision costs and professional evidence."],
      documents_needed: ["Provision map", "Funding allocation", "LA band descriptors", "Professional reports"],
      key_phrases: ["provision cost", "band descriptor", "top-up funding", "funding gap"],
      policy_refs: ["Local authority high needs funding guidance", "SEND Code of Practice 0-25"],
    },
    livePromptCategories: ["funding", "evidence_gap", "provision_specificity"],
    outputs: ["high_needs_funding_case", "sen_evidence_file", "actions"],
  },
  {
    type: "tac_taf",
    name: "Team Around the Child / Team Around the Family",
    description: "Multi-agency coordination meeting for children with emerging or complex needs.",
    openingScript: ["We are meeting to align support around the child and family and agree clear actions."],
    closingScript: ["We will confirm actions, owners, timescales and the next review point."],
    checklistItems: [
      { phrase: "Agency updates shared", category: "Updates", is_critical: true, order_index: 1 },
      { phrase: "Family strengths and concerns recorded", category: "Family", is_critical: true, order_index: 2 },
      { phrase: "Actions and owners agreed", category: "Actions", is_critical: true, order_index: 3 },
    ],
    preparationGuide: {
      context_prompts: ["Check existing referrals, parent/carer concerns and professional involvement."],
      documents_needed: ["Referral records", "Previous TAC/TAF minutes", "Parent/carer views"],
      key_phrases: ["multi-agency", "family voice", "coordinated support"],
      policy_refs: ["Working Together to Safeguard Children", "SEND Code of Practice 0-25"],
    },
    livePromptCategories: ["parent_voice", "evidence_gap"],
    outputs: ["sen_evidence_file", "actions"],
  },
  {
    type: "transition_planning",
    name: "SEND Transition Planning",
    description: "Planning meeting for phase transfer, Year 9 preparation for adulthood, or school move.",
    openingScript: ["We are planning transition so support, provision and information move with the pupil."],
    closingScript: ["We will confirm transition actions, information sharing and next review date."],
    checklistItems: [
      { phrase: "Receiving setting information needs agreed", category: "Transition", is_critical: true, order_index: 1 },
      { phrase: "Pupil anxieties, strengths and support strategies recorded", category: "Pupil Voice", is_critical: true, order_index: 2 },
      { phrase: "Transition visits or support plan agreed", category: "Actions", is_critical: true, order_index: 3 },
    ],
    preparationGuide: {
      context_prompts: ["Check phase transfer deadline, current support plan and receiving setting contacts."],
      documents_needed: ["Current EHCP or support plan", "One-page profile", "Transition notes"],
      key_phrases: ["phase transfer", "preparation for adulthood", "transition support"],
      policy_refs: ["SEND Code of Practice 0-25, Chapter 9"],
    },
    livePromptCategories: ["placement", "pupil_voice"],
    outputs: ["sen_evidence_file", "actions"],
  },
  {
    type: "placement_consultation",
    name: "Placement Consultation Response",
    description: "Meeting to respond to LA placement consultation or challenge an unsuitable placement proposal.",
    openingScript: ["We are reviewing whether the proposed placement can meet the pupil's needs and what evidence supports the response."],
    closingScript: ["We will record the response position, evidence relied on and submission deadline."],
    checklistItems: [
      { phrase: "Pupil needs matched against placement offer", category: "Placement", is_critical: true, order_index: 1 },
      { phrase: "Reasonable adjustments and required provision recorded", category: "Provision", is_critical: true, order_index: 2 },
      { phrase: "Consultation deadline recorded", category: "Deadline", is_critical: true, order_index: 3 },
    ],
    preparationGuide: {
      context_prompts: ["Check the consultation deadline, proposed placement, current EHCP and professional advice."],
      documents_needed: ["Consultation letter", "Current EHCP", "Professional reports", "Provision map"],
      key_phrases: ["can meet needs", "efficient education", "reasonable adjustments"],
      policy_refs: ["Children and Families Act 2014", "SEND Code of Practice 0-25"],
    },
    livePromptCategories: ["placement", "provision_specificity", "statutory_deadline"],
    outputs: ["placement_consultation_response", "sen_evidence_file", "actions"],
  },
  {
    type: "isp_readiness_review",
    name: "Individual Support Plan Readiness Review",
    description: "Future-facing review for mainstream inclusion, Targeted support and digital ISP readiness.",
    openingScript: ["We are reviewing what day-to-day support should be clearly recorded for inclusive mainstream access."],
    closingScript: ["We will record support, barriers, interventions and evidence needed for future ISP readiness."],
    checklistItems: [
      { phrase: "Barriers to learning identified", category: "Inclusion", is_critical: true, order_index: 1 },
      { phrase: "Universal, Targeted or Specialist support layer considered", category: "Support", is_critical: true, order_index: 2 },
      { phrase: "Teacher-accessible strategies recorded", category: "Teaching", is_critical: true, order_index: 3 },
    ],
    preparationGuide: {
      context_prompts: ["Use this as reform-ready support planning, not as replacement for current EHCP duties."],
      documents_needed: ["Current support plan", "Teacher strategies", "Parent/pupil views"],
      key_phrases: ["inclusive mainstream", "digital Individual Support Plan", "Targeted support"],
      policy_refs: ["DfE SEND Reform Consultation 2026"],
    },
    livePromptCategories: ["evidence_gap", "parent_voice", "pupil_voice"],
    outputs: ["sen_evidence_file", "actions"],
  },
];

export function getSendMeetingAgenda(type: SendMeetingType): SendMeetingAgenda {
  const agenda = SEND_MEETING_AGENDAS.find((item) => item.type === type);
  if (!agenda) throw new Error(`Unknown SEND meeting agenda: ${type}`);
  return agenda;
}
```

- [ ] **Step 5: Run agenda tests**

Run: `cd apps/platform; npx vitest run src/lib/send/meeting-agendas.test.ts`

Expected: PASS.

---

### Task 3: Add SEND Meeting Context Schema

**Files:**
- Create: `apps/platform/supabase/migrations/20260509_send_admin_copilot.sql`

- [ ] **Step 1: Create migration**

```sql
create table if not exists public.send_meeting_contexts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  send_register_id uuid not null references public.send_register(id) on delete cascade,
  workflow_type text not null check (workflow_type in (
    'ehcp_annual_review',
    'sen_support_apdr_review',
    'ehcp_needs_assessment_planning',
    'high_needs_funding_review',
    'tac_taf',
    'transition_planning',
    'placement_consultation',
    'isp_readiness_review'
  )),
  desired_outcome text,
  statutory_deadline date,
  agenda_snapshot jsonb not null default '{}'::jsonb,
  source_guidance_ids text[] not null default '{}',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, meeting_id)
);

create table if not exists public.send_live_prompt_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  send_register_id uuid not null references public.send_register(id) on delete cascade,
  prompt_id text not null,
  category text not null,
  trigger_text text,
  suggested_action text not null,
  suggested_words text not null,
  minute_note text not null,
  source_guidance_ids text[] not null default '{}',
  status text not null default 'suggested' check (status in ('suggested', 'accepted', 'dismissed', 'inserted_into_minutes')),
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.send_generated_document_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  send_register_id uuid not null references public.send_register(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  generated_document_id uuid,
  document_type text not null check (document_type in (
    'annual_review_report',
    'apdr_review_record',
    'ehcp_evidence_summary',
    'high_needs_funding_case',
    'placement_consultation_response',
    'parent_letter',
    'professional_request'
  )),
  evidence_file_id uuid references public.sen_evidence_files(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_send_meeting_contexts_org on public.send_meeting_contexts(organization_id);
create index if not exists idx_send_meeting_contexts_meeting on public.send_meeting_contexts(meeting_id);
create index if not exists idx_send_meeting_contexts_pupil on public.send_meeting_contexts(send_register_id);
create index if not exists idx_send_live_prompt_events_meeting on public.send_live_prompt_events(meeting_id, created_at desc);
create index if not exists idx_send_generated_document_links_pupil on public.send_generated_document_links(send_register_id, created_at desc);

alter table public.send_meeting_contexts enable row level security;
alter table public.send_live_prompt_events enable row level security;
alter table public.send_generated_document_links enable row level security;

create policy send_meeting_contexts_service_role
  on public.send_meeting_contexts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy send_live_prompt_events_service_role
  on public.send_live_prompt_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy send_generated_document_links_service_role
  on public.send_generated_document_links for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
```

- [ ] **Step 2: Verify migration text**

Run: `Get-Content apps/platform/supabase/migrations/20260509_send_admin_copilot.sql`

Expected: migration contains three tables, indexes, RLS, and service-role policies.

---

### Task 4: Seed SEND Meeting Templates Into Meeting Companion

**Files:**
- Modify: `apps/platform/src/lib/meetings/meeting-template-catalog.ts`
- Test: `apps/platform/src/lib/meetings/custom-template-builder.test.ts`

- [ ] **Step 1: Add catalogue test**

Append a test to `apps/platform/src/lib/meetings/custom-template-builder.test.ts`:

```ts
import { DEFAULT_MEETING_TEMPLATES } from "./meeting-template-catalog";

it("includes SEND statutory meeting templates", () => {
  const sendTemplates = DEFAULT_MEETING_TEMPLATES.filter((template) => template.category === "send");
  expect(sendTemplates.map((template) => template.name)).toEqual(
    expect.arrayContaining([
      "EHCP Annual Review",
      "SEN Support APDR Review",
      "EHCP Needs Assessment Planning",
      "High Needs Funding / Band Review",
      "Team Around the Child / Team Around the Family",
      "SEND Transition Planning",
      "Placement Consultation Response",
      "Individual Support Plan Readiness Review",
    ]),
  );
});
```

- [ ] **Step 2: Run failing template test**

Run: `cd apps/platform; npx vitest run src/lib/meetings/custom-template-builder.test.ts`

Expected: FAIL until SEND templates are added.

- [ ] **Step 3: Add SEND templates to catalogue**

Import agenda data and map it to meeting templates:

```ts
import { SEND_MEETING_AGENDAS } from "@/lib/send/meeting-agendas";
```

Add this export near the existing defaults:

```ts
const SEND_MEETING_TEMPLATES = SEND_MEETING_AGENDAS.map((agenda) => ({
  id: `send-${agenda.type}`,
  name: agenda.name,
  category: "send" as const,
  description: agenda.description,
  opening_script: agenda.openingScript,
  closing_script: agenda.closingScript,
  compliance_items: agenda.checklistItems,
  preparation_guide: agenda.preparationGuide,
  is_custom: false,
  organization_id: null,
  created_by: null,
  created_at: "2026-05-09T00:00:00.000Z",
  updated_at: "2026-05-09T00:00:00.000Z",
}));
```

Ensure `DEFAULT_MEETING_TEMPLATES` includes `...SEND_MEETING_TEMPLATES`.

- [ ] **Step 4: Run template test**

Run: `cd apps/platform; npx vitest run src/lib/meetings/custom-template-builder.test.ts src/lib/send/meeting-agendas.test.ts`

Expected: PASS.

---

### Task 5: Create SEND Meeting API

**Files:**
- Create: `apps/platform/src/app/api/send/meetings/route.ts`
- Create: `apps/platform/src/app/api/send/meetings/route.test.ts`

- [ ] **Step 1: Write route tests**

```ts
import { describe, expect, it, vi } from "vitest";

const insertMeeting = vi.fn().mockResolvedValue({
  data: { id: "meeting-1", organization_id: "org-1", template_id: "send-ehcp_annual_review" },
  error: null,
});

const insertContext = vi.fn().mockResolvedValue({ data: { id: "context-1" }, error: null });

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => ({
      insert: table === "meetings"
        ? () => ({ select: () => ({ single: insertMeeting }) })
        : () => ({ select: () => ({ single: insertContext }) }),
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
    }),
  }),
}));

vi.mock("@/lib/api-utils", () => ({
  protectedRoute: (handler: any) => (req: Request) =>
    handler({ organizationId: "org-1", userId: "user-1" }, req),
  apiSuccess: (data: any, status = 200) => new Response(JSON.stringify({ success: true, ...data }), { status }),
  apiError: (error: string, status: number) => new Response(JSON.stringify({ success: false, error }), { status }),
}));

describe("/api/send/meetings", () => {
  it("creates a meeting and SEND pupil context together", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/send/meetings", {
      method: "POST",
      body: JSON.stringify({
        sendRegisterId: "pupil-1",
        workflowType: "ehcp_annual_review",
        scheduledAt: "2026-05-20T10:00:00.000Z",
        attendeeName: "Parent/carer",
        desiredOutcome: "secure_amended_plan",
      }),
    }));

    expect(response.status).toBe(201);
  });
});
```

- [ ] **Step 2: Implement route**

```ts
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { getSendMeetingAgenda } from "@/lib/send/meeting-agendas";
import type { SendMeetingWorkflowType } from "@/lib/meetings/types";

export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);
  const sendRegisterId = url.searchParams.get("sendRegisterId");

  let query = supabase
    .from("send_meeting_contexts")
    .select("*, meetings(*, meeting_templates(*))")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false });

  if (sendRegisterId) query = query.eq("send_register_id", sendRegisterId);

  const { data, error } = await query;
  if (error) return apiError("Failed to load SEND meetings", 500);
  return apiSuccess({ meetings: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const workflowType = body.workflowType as SendMeetingWorkflowType;
  const agenda = getSendMeetingAgenda(workflowType);

  if (!body.sendRegisterId || !workflowType || !body.scheduledAt) {
    return apiError("Missing sendRegisterId, workflowType or scheduledAt", 400);
  }

  const supabase = createServiceRoleClient();
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .insert({
      organization_id: auth.organizationId,
      template_id: `send-${workflowType}`,
      leader_id: auth.userId,
      attendee_name: body.attendeeName || "SEND meeting attendees",
      attendee_role: body.attendeeRole || null,
      purpose: body.purpose || agenda.description,
      scheduled_at: body.scheduledAt,
      location: body.location || null,
      status: "scheduled",
    })
    .select()
    .single();

  if (meetingError || !meeting) return apiError("Failed to create meeting", 500);

  const { data: context, error: contextError } = await supabase
    .from("send_meeting_contexts")
    .insert({
      organization_id: auth.organizationId,
      meeting_id: meeting.id,
      send_register_id: body.sendRegisterId,
      workflow_type: workflowType,
      desired_outcome: body.desiredOutcome || null,
      statutory_deadline: body.statutoryDeadline || null,
      agenda_snapshot: agenda,
      source_guidance_ids: agenda.preparationGuide.policy_refs,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (contextError) return apiError("Failed to link SEND context", 500);
  return apiSuccess({ meeting, context }, 201);
});
```

- [ ] **Step 3: Run route tests**

Run: `cd apps/platform; npx vitest run src/app/api/send/meetings/route.test.ts`

Expected: PASS.

---

### Task 6: Build Live Guidance Engine

**Files:**
- Create: `apps/platform/src/lib/send/live-guidance-engine.ts`
- Create: `apps/platform/src/lib/send/live-guidance-engine.test.ts`

- [ ] **Step 1: Write engine tests**

```ts
import { describe, expect, it } from "vitest";
import { analyseSendMeetingTranscript } from "./live-guidance-engine";

describe("analyseSendMeetingTranscript", () => {
  it("suggests a statutory prompt when provision is vague", () => {
    const result = analyseSendMeetingTranscript({
      meetingType: "ehcp_annual_review",
      transcriptText: "The pupil will have access to regular support when required.",
      desiredOutcome: "secure_specific_provision",
    });

    expect(result.prompts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "provision_specificity",
          suggestedWords: expect.stringContaining("frequency"),
        }),
      ]),
    );
  });

  it("does not suggest duplicate prompts already accepted", () => {
    const result = analyseSendMeetingTranscript({
      meetingType: "ehcp_annual_review",
      transcriptText: "The local authority has not responded after six weeks.",
      existingPromptIds: ["annual-review-la-response-overdue"],
    });

    expect(result.prompts).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Implement deterministic engine**

```ts
import { findGuidancePrompts, type SendMeetingType } from "./statutory-guidance";

export type LiveGuidanceInput = {
  meetingType: SendMeetingType;
  transcriptText: string;
  desiredOutcome?: string;
  existingPromptIds?: string[];
};

export function analyseSendMeetingTranscript(input: LiveGuidanceInput) {
  const existing = new Set(input.existingPromptIds || []);
  const prompts = findGuidancePrompts({
    meetingType: input.meetingType,
    transcriptText: input.transcriptText,
    desiredOutcome: input.desiredOutcome,
  }).filter((prompt) => !existing.has(prompt.id));

  return {
    prompts,
    analysedAt: new Date().toISOString(),
    modelUsed: "deterministic-guidance-pack-v1",
  };
}
```

- [ ] **Step 3: Run engine tests**

Run: `cd apps/platform; npx vitest run src/lib/send/live-guidance-engine.test.ts`

Expected: PASS.

---

### Task 7: Expose Live Prompts API

**Files:**
- Create: `apps/platform/src/app/api/send/meetings/[id]/live-prompts/route.ts`
- Create: `apps/platform/src/app/api/send/meetings/[id]/live-prompts/route.test.ts`

- [ ] **Step 1: Implement route**

```ts
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { analyseSendMeetingTranscript } from "@/lib/send/live-guidance-engine";

function getMeetingId(request: Request): string {
  return new URL(request.url).pathname.split("/")[4];
}

export const POST = protectedRoute(async (auth, request) => {
  const meetingId = getMeetingId(request);
  const body = await request.json();
  const supabase = createServiceRoleClient();

  const { data: context } = await supabase
    .from("send_meeting_contexts")
    .select("*")
    .eq("meeting_id", meetingId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (!context) return apiError("SEND meeting context not found", 404);

  const { data: existingEvents } = await supabase
    .from("send_live_prompt_events")
    .select("prompt_id")
    .eq("meeting_id", meetingId)
    .eq("organization_id", auth.organizationId);

  const result = analyseSendMeetingTranscript({
    meetingType: context.workflow_type,
    transcriptText: body.transcriptText || "",
    desiredOutcome: context.desired_outcome || undefined,
    existingPromptIds: (existingEvents || []).map((event) => event.prompt_id),
  });

  const rows = result.prompts.map((prompt) => ({
    organization_id: auth.organizationId,
    meeting_id: meetingId,
    send_register_id: context.send_register_id,
    prompt_id: prompt.id,
    category: prompt.category,
    trigger_text: body.triggerText || null,
    suggested_action: prompt.suggestedAction,
    suggested_words: prompt.suggestedWords,
    minute_note: prompt.minuteNote,
    source_guidance_ids: prompt.sourceIds,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from("send_live_prompt_events").insert(rows);
    if (error) return apiError("Failed to record live prompts", 500);
  }

  return apiSuccess({ prompts: result.prompts });
});
```

- [ ] **Step 2: Add tests for accepted/dismissed state**

Add tests that call `PATCH /api/send/meetings/[id]/live-prompts` after the `POST` route exists. The PATCH body must be `{ promptEventId: string, status: "accepted" | "dismissed" | "inserted_into_minutes" }`, and the route must update `accepted_by` and `accepted_at` when status is accepted or inserted.

- [ ] **Step 3: Run live prompt tests**

Run: `cd apps/platform; npx vitest run src/app/api/send/meetings/[id]/live-prompts/route.test.ts`

Expected: PASS.

---

### Task 8: Build SEND Meeting Cockpit UI

**Files:**
- Create: `apps/platform/src/app/(dashboard)/dashboard/send/meetings/page.tsx`
- Create: `apps/platform/src/app/(dashboard)/dashboard/send/meetings/[id]/live/page.tsx`
- Modify: `apps/platform/src/app/(dashboard)/dashboard/send/page.tsx`

- [ ] **Step 1: Add SEND meetings tab to dashboard**

In `apps/platform/src/app/(dashboard)/dashboard/send/page.tsx`, extend the tab type:

```ts
const [activeTab, setActiveTab] = useState<
  "overview" | "register" | "graduated" | "provisions" | "referrals" | "meetings"
>("overview");
```

Add tab item:

```ts
{ id: "meetings", label: "Meetings", icon: Calendar }
```

Render a compact entry panel that links to `/dashboard/send/meetings`.

- [ ] **Step 2: Build meetings list page**

Create `apps/platform/src/app/(dashboard)/dashboard/send/meetings/page.tsx` with:

```tsx
"use client";

import Link from "next/link";
import useSWR from "swr";
import { Calendar, Plus } from "lucide-react";
import { fetcher } from "@/lib/fetchers";

export default function SendMeetingsPage() {
  const { data, isLoading } = useSWR("/api/send/meetings", fetcher);
  const meetings = data?.meetings || [];

  return (
    <main className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SEND Meetings</h1>
          <p className="text-sm text-slate-500">Pupil-linked reviews, EHCP planning, HNF and placement meetings.</p>
        </div>
        <Link href="/dashboard/send/meetings/new" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> New SEND Meeting
        </Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Loading meetings...</p>
        ) : meetings.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No SEND meetings yet.</p>
        ) : (
          meetings.map((item: any) => (
            <Link key={item.meeting_id} href={`/dashboard/send/meetings/${item.meeting_id}/live`} className="flex items-center justify-between border-b border-slate-100 p-4 last:border-b-0 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{item.workflow_type.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">{item.desired_outcome || "No desired outcome recorded"}</p>
              </div>
              <Calendar size={16} className="text-emerald-600" />
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Build live cockpit**

Create `apps/platform/src/app/(dashboard)/dashboard/send/meetings/[id]/live/page.tsx` with four panels:

```tsx
// Left: statutory agenda checklist
// Centre: live recording/transcript using existing MeetingRecorder and MeetingNotesInput components
// Right: live statutory prompts with Accept, Dismiss, Add to minutes
// Bottom: actions/outcomes to generate documents after meeting
```

Use existing components from `apps/platform/src/components/meetings/` rather than duplicating recorder/signature functionality.

- [ ] **Step 4: Manual UI verification**

Run: `cd apps/platform; npm run dev`

Open: `http://localhost:3000/dashboard/send/meetings`

Expected: page loads, empty state is usable, SEND dashboard links to it, no hydration errors.

---

### Task 9: Generate Documentation From Meeting Outcomes

**Files:**
- Create: `apps/platform/src/lib/send/document-output.ts`
- Create: `apps/platform/src/lib/send/document-output.test.ts`
- Create: `apps/platform/src/app/api/send/documents/generate/route.ts`

- [ ] **Step 1: Write document output tests**

```ts
import { describe, expect, it } from "vitest";
import { buildSendDocumentDraft } from "./document-output";

describe("buildSendDocumentDraft", () => {
  it("creates annual review sections from meeting context", () => {
    const draft = buildSendDocumentDraft({
      documentType: "annual_review_report",
      meetingType: "ehcp_annual_review",
      pupilLabel: "Pupil A",
      meetingNotes: ["Parent views recorded.", "Provision should be quantified."],
      acceptedPromptNotes: ["The meeting requested that provision be specified and quantified so delivery can be monitored."],
    });

    expect(draft.title).toBe("EHCP Annual Review Report");
    expect(draft.sections.map((section) => section.heading)).toEqual(
      expect.arrayContaining(["Needs", "Outcomes", "Provision", "Parent/Carer Views", "Pupil Views", "Recommendations", "Actions"]),
    );
  });
});
```

- [ ] **Step 2: Implement draft builder**

```ts
export type SendDocumentType =
  | "annual_review_report"
  | "apdr_review_record"
  | "ehcp_evidence_summary"
  | "high_needs_funding_case"
  | "placement_consultation_response";

export type SendDocumentDraft = {
  title: string;
  sections: { heading: string; body: string }[];
  sourceNotes: string[];
};

export function buildSendDocumentDraft(args: {
  documentType: SendDocumentType;
  meetingType: string;
  pupilLabel: string;
  meetingNotes: string[];
  acceptedPromptNotes: string[];
}): SendDocumentDraft {
  if (args.documentType === "annual_review_report") {
    return {
      title: "EHCP Annual Review Report",
      sections: [
        { heading: "Needs", body: "Summarise current special educational needs using the meeting notes and linked evidence." },
        { heading: "Outcomes", body: "Record progress against current outcomes and any proposed changes." },
        { heading: "Provision", body: "Record provision discussed, including frequency, duration, staffing and monitoring arrangements." },
        { heading: "Parent/Carer Views", body: "Record parent/carer views discussed during the meeting." },
        { heading: "Pupil Views", body: "Record the child or young person's views in an age-appropriate way." },
        { heading: "Recommendations", body: "Record whether the recommendation is to maintain, amend or cease the plan." },
        { heading: "Actions", body: "Record actions, owners and dates." },
      ],
      sourceNotes: [...args.meetingNotes, ...args.acceptedPromptNotes],
    };
  }

  return {
    title: args.documentType.replaceAll("_", " "),
    sections: [{ heading: "Summary", body: `Draft generated for ${args.pupilLabel}.` }],
    sourceNotes: [...args.meetingNotes, ...args.acceptedPromptNotes],
  };
}
```

- [ ] **Step 3: Implement generate endpoint**

`POST /api/send/documents/generate` should accept `{ meetingId, documentType }`, load meeting, SEND context, accepted prompt events, transcript/minutes, build a draft, then call the existing document generation route or insert a `generated_documents` row following existing privacy rules.

- [ ] **Step 4: Run document tests**

Run: `cd apps/platform; npx vitest run src/lib/send/document-output.test.ts`

Expected: PASS.

---

### Task 10: Add Ed SEND Admin Skills

**Files:**
- Create: `apps/platform/src/lib/skills/send-admin-copilot.ts`
- Modify: `apps/platform/src/lib/skills/school-skills-registry.ts`
- Modify: `packages/ed-agents/src/agents/prompts/send-specialist.ts`

- [ ] **Step 1: Add skill schemas**

Create schemas for:

```ts
export const SEND_ADMIN_COPILOT_SKILLS = [
  "prepare_send_meeting_agenda",
  "find_send_statutory_prompt",
  "summarise_send_meeting_risks",
  "get_missing_ehcp_evidence",
  "draft_la_challenge_wording",
  "generate_send_follow_up_actions",
  "generate_send_document_from_meeting",
] as const;
```

- [ ] **Step 2: Implement deterministic handlers first**

Handlers must use `statutory-guidance.ts`, `meeting-agendas.ts`, and `document-output.ts` before any model call.

- [ ] **Step 3: Update SEND specialist prompt**

Add:

```ts
## SEND Admin Copilot Boundaries
- You can suggest statutory guidance prompts, meeting wording, evidence questions and follow-up actions.
- You must say when a point depends on local authority procedure or current consultation proposals.
- You must not claim to provide legal advice.
- You must keep the pupil's needs, views, parent/carer views and evidence at the centre.
- For live meetings, produce concise prompts suitable for the SENCO to say aloud.
```

- [ ] **Step 4: Run skills registry tests**

Run: `cd apps/platform; npx vitest run src/lib/skills`

Expected: existing skills tests pass or unrelated pre-existing failures are documented before proceeding.

---

### Task 11: Connect Meetings To Evidence, Deadlines, Actions

**Files:**
- Modify: `apps/platform/src/app/api/meetings/[id]/complete/route.ts`
- Modify: `apps/platform/src/app/api/meetings/[id]/minutes/route.ts`
- Create: `apps/platform/src/lib/send/meeting-completion.ts`
- Create: `apps/platform/src/lib/send/meeting-completion.test.ts`

- [ ] **Step 1: Write completion tests**

```ts
import { describe, expect, it } from "vitest";
import { buildSendCompletionEffects } from "./meeting-completion";

describe("buildSendCompletionEffects", () => {
  it("creates annual review evidence and LA response deadline", () => {
    const effects = buildSendCompletionEffects({
      workflowType: "ehcp_annual_review",
      meetingDate: "2026-05-20",
      meetingId: "meeting-1",
      sendRegisterId: "pupil-1",
    });

    expect(effects.evidenceFile.file_type).toBe("annual_review_report");
    expect(effects.deadlines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Submit annual review paperwork to LA", offsetDays: 14 }),
        expect.objectContaining({ label: "Check LA annual review decision", offsetDays: 28 }),
      ]),
    );
  });
});
```

- [ ] **Step 2: Implement completion effects**

```ts
export function buildSendCompletionEffects(args: {
  workflowType: string;
  meetingDate: string;
  meetingId: string;
  sendRegisterId: string;
}) {
  if (args.workflowType === "ehcp_annual_review") {
    return {
      evidenceFile: {
        send_register_id: args.sendRegisterId,
        linked_review_id: null,
        file_type: "annual_review_report",
        tags: ["meeting", "annual-review", args.meetingId],
      },
      deadlines: [
        { label: "Submit annual review paperwork to LA", offsetDays: 14 },
        { label: "Check LA annual review decision", offsetDays: 28 },
        { label: "Schedule next annual review", offsetDays: 365 },
      ],
    };
  }

  return {
    evidenceFile: {
      send_register_id: args.sendRegisterId,
      file_type: "other",
      tags: ["meeting", args.workflowType, args.meetingId],
    },
    deadlines: [],
  };
}
```

- [ ] **Step 3: Wire effects into completion route**

When a meeting with `send_meeting_contexts` is completed:

- create or update a `sen_evidence_files` row with the meeting minutes reference;
- create `send_review_history` entry;
- create action/deadline records using the existing actions hub pattern;
- link generated document via `send_generated_document_links`.

- [ ] **Step 4: Run completion tests**

Run: `cd apps/platform; npx vitest run src/lib/send/meeting-completion.test.ts`

Expected: PASS.

---

### Task 12: Add Product Documentation And Demo Script

**Files:**
- Create: `docs/modules/sen-funding/SEND_ADMIN_COPILOT_PRODUCT_SPEC.md`

- [ ] **Step 1: Write product spec**

Include these sections:

```md
# SEND Admin Copilot Product Spec

## User
SENCO, SEND administrator, inclusion lead, headteacher, trust SEND lead.

## Core Promise
Turn SEND meetings, evidence, deadlines and statutory guidance into one guided workflow.

## Launch Workflows
EHCP Annual Review, SEN Support APDR Review, EHCP Needs Assessment Planning, High Needs Funding/Band Review, TAC/TAF, Transition Planning, Placement Consultation, ISP Readiness Review.

## Live Meeting Behaviour
The product listens to the meeting transcript, compares statements against the selected agenda and statutory guidance pack, and suggests concise prompts the SENCO can choose to say aloud or insert into minutes.

## Guardrails
The product provides statutory guidance support, not legal advice. It labels consultation material separately from current statutory duties. It keeps parent/carer voice, pupil voice, evidence and professional judgement central.

## Trust Demo Story
Book a pupil-linked EHCP Annual Review, use the agenda, receive a live prompt when provision is vague, accept the prompt into minutes, generate the annual review report, create LA follow-up actions, and file the minutes into the pupil evidence record.
```

- [ ] **Step 2: Cross-link existing SEND docs**

Add references to:

- `docs/modules/sen-funding/PRODUCT_SPEC.md`
- `docs/modules/sen-funding/CROSS_MODULE_INTEGRATION.md`
- `docs/modules/sen-funding/EVIDENCE_ECOSYSTEM.md`

- [ ] **Step 3: Review product wording**

Search the spec for `legal advice`, `guarantee`, `win`, and `replace person`. The spec should avoid promising legal outcomes or staff replacement.

---

## Acceptance Criteria

- A SENCO can create a pupil-linked SEND meeting from the SEND module.
- The selected meeting type loads a statutory agenda, preparation guide, checklist and source pack.
- The live meeting view can record/transcribe, show the agenda, and display statutory prompt suggestions.
- Accepted prompts are stored, available for minutes, and traceable to source guidance IDs.
- Completed meetings generate structured minutes, evidence links, review history, actions and document drafts.
- EHCP annual review, APDR, HNF/band review, placement consultation and transition workflows are all represented.
- Ed can answer SEND workflow questions using deterministic source packs before model generation.
- The UI labels consultation/future reform separately from current statutory guidance.
- Pupil PII remains protected according to existing SEND register rules.

## Verification Commands

Run targeted tests first:

```powershell
cd apps/platform
npx vitest run src/lib/send/statutory-guidance.test.ts
npx vitest run src/lib/send/meeting-agendas.test.ts
npx vitest run src/lib/send/live-guidance-engine.test.ts
npx vitest run src/lib/send/document-output.test.ts
npx vitest run src/lib/send/meeting-completion.test.ts
```

Run route/skills tests:

```powershell
cd apps/platform
npx vitest run src/app/api/send/meetings/route.test.ts
npx vitest run src/app/api/send/meetings/[id]/live-prompts/route.test.ts
npx vitest run src/lib/skills
```

Run app checks:

```powershell
cd apps/platform
npm run typecheck
npm run lint
```

Manual demo:

```powershell
cd apps/platform
npm run dev
```

Open `http://localhost:3000/dashboard/send/meetings`, create an EHCP Annual Review, open the live meeting cockpit, trigger a vague-provision prompt, accept it, complete the meeting, and generate the annual review draft.

## Rollout Order

1. Build statutory guidance and agenda libraries.
2. Add schema and APIs for pupil-linked meetings.
3. Add SEND meeting templates to Meeting Companion.
4. Build live prompt engine and prompt API.
5. Build SEND meeting list and live cockpit UI.
6. Connect completion to evidence, actions, deadlines and documents.
7. Register Ed skills.
8. Produce the trust demo script and test with anonymised/demo pupil data.

## Self-Review

- Spec coverage: The plan covers booking, pupil linkage, agendas, live recording/transcription, statutory prompt support, challenge wording, minutes, evidence, deadlines, documentation and Ed skills.
- Placeholder scan: No implementation task depends on unspecified meeting types or unnamed files.
- Type consistency: `SendMeetingType`, `SendMeetingWorkflowType`, workflow IDs and document output IDs use the same string literals throughout the plan.
- Scope control: Finance reconciliation and full LA band import are not rebuilt here; this plan links HNF/band review meetings to existing planned funding tables and leaves full reconciliation to a separate funding engine sprint.
