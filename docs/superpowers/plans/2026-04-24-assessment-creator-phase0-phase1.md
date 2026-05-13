# Assessment Creator Phase 0-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not create git commits unless the user explicitly asks for commits.

**Goal:** Build the first Schoolgle-native, paper-first Assessment Creator slice: create a teacher-approved assessment blueprint, generate a QR-coded paper pack, upload scanned papers, propose AI marks, require teacher approval, and emit an Assessment Evidence Passport.

**Architecture:** Add a focused `assessment-creator` domain beside the existing `school-assessment` and `trust-assessor` modules. Keep pupil identity pseudonymised, store scan metadata separately from raw names, and make the teacher review state the canonical marking record. Phase 0 proves scan/marking assumptions; Phase 1 ships a mock-backed but end-to-end teacher workflow.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Vitest, existing `qrcode` package, existing Schoolgle UI primitives, existing vision service patterns.

---

## File Structure

Create these files:

- `apps/platform/src/lib/assessment-creator/types.ts` - shared domain types and status enums.
- `apps/platform/src/lib/assessment-creator/blueprint.ts` - deterministic blueprint builder and validation helpers.
- `apps/platform/src/lib/assessment-creator/confidence.ts` - evidence confidence scoring.
- `apps/platform/src/lib/assessment-creator/qr.ts` - QR payload creation and parsing helpers.
- `apps/platform/src/lib/assessment-creator/mock-data.ts` - seed data for Phase 1 UI only.
- `apps/platform/src/lib/assessment-creator/marking.ts` - proposed mark model and teacher approval reducer.
- `apps/platform/src/lib/assessment-creator/scan-roundtrip.ts` - page matching and scan batch helpers.
- `apps/platform/src/lib/assessment-creator/__tests__/blueprint.test.ts`
- `apps/platform/src/lib/assessment-creator/__tests__/confidence.test.ts`
- `apps/platform/src/lib/assessment-creator/__tests__/qr.test.ts`
- `apps/platform/src/lib/assessment-creator/__tests__/marking.test.ts`
- `apps/platform/src/components/assessment-creator/AssessmentCreatorShell.tsx`
- `apps/platform/src/components/assessment-creator/CreateAssessmentPanel.tsx`
- `apps/platform/src/components/assessment-creator/BlueprintReview.tsx`
- `apps/platform/src/components/assessment-creator/PaperPackPreview.tsx`
- `apps/platform/src/components/assessment-creator/ScanUploadPanel.tsx`
- `apps/platform/src/components/assessment-creator/MarkingReviewPanel.tsx`
- `apps/platform/src/components/assessment-creator/EvidencePassportPanel.tsx`
- `apps/platform/src/app/api/assessment-creator/blueprints/route.ts`
- `apps/platform/src/app/api/assessment-creator/paper-pack/route.ts`
- `apps/platform/src/app/api/assessment-creator/scan-batches/route.ts`
- `apps/platform/src/app/api/assessment-creator/marking-proposals/route.ts`
- `apps/platform/src/app/api/assessment-creator/evidence-passports/route.ts`
- `apps/platform/supabase/migrations/20260424_assessment_creator_phase1.sql`

Modify these files:

- `apps/platform/src/app/(dashboard)/dashboard/teaching-learning/assessment-support/page.tsx` - replace placeholder with Assessment Creator shell.
- `apps/platform/src/components/intelligence/index.ts` only if the Evidence Passport needs exporting later; do not touch in Phase 1 unless required.

Do not modify:

- `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx` during Phase 1. Trust Assessor integration starts with evidence passport shape only.
- Existing `pupil-pseudonymiser.ts` except to import or reference patterns; do not weaken its zero-knowledge boundary.

---

## Task 1: Add Domain Types

**Files:**

- Create: `apps/platform/src/lib/assessment-creator/types.ts`
- Test: no direct test; consumed by later tests.

- [ ] **Step 1: Create the type module**

Add:

```ts
export type AssessmentMode = "quick_check" | "unit_check" | "retention_check" | "statutory_readiness";

export type AssessmentStatus =
  | "draft"
  | "blueprint_review"
  | "generated"
  | "changes_requested"
  | "approved"
  | "locked"
  | "scan_uploaded"
  | "marking_review"
  | "reviewed"
  | "archived";

export type EvidenceConfidence = "high" | "medium" | "low" | "mismatch";

export interface AssessmentBlend {
  taughtCurriculum: number;
  nationalExpectation: number;
  retention: number;
  statutoryReadiness: number;
}

export interface CurriculumObjective {
  id: string;
  label: string;
  strand: string;
  source: "school_curriculum" | "national_curriculum" | "prior_learning" | "statutory_readiness";
  yearGroup: string;
}

export interface AssessmentBlueprint {
  id: string;
  organizationId: string;
  schoolId: string;
  classId: string;
  subject: "reading" | "maths";
  yearGroup: "Year 4" | "Year 5" | "Year 6";
  term: "Autumn" | "Spring" | "Summer";
  mode: AssessmentMode;
  status: AssessmentStatus;
  durationMinutes: number;
  blend: AssessmentBlend;
  objectives: CurriculumObjective[];
  pressureRating: 1 | 2 | 3 | 4 | 5;
  workloadRating: 1 | 2 | 3 | 4 | 5;
  warnings: string[];
  createdAt: string;
  approvedAt: string | null;
}

export interface PaperQuestion {
  id: string;
  assessmentId: string;
  number: number;
  prompt: string;
  marks: number;
  objectiveId: string;
  answerType: "multiple_choice" | "short_answer" | "working_out" | "extended_response";
  misconceptionTags: string[];
  markScheme: StructuredMarkScheme;
}

export interface StructuredMarkScheme {
  correctAnswer: string;
  acceptedAnswers: string[];
  partialCreditRules: Array<{ label: string; marks: number; pattern: string }>;
  commonMisconceptions: Array<{ tag: string; description: string; feedbackPrompt: string }>;
}

export interface ScanPageMatch {
  pageId: string;
  scanBatchId: string;
  assessmentId: string;
  pupilHash: string;
  pageNumber: number;
  matchConfidence: number;
  status: "matched" | "needs_review" | "unmatched";
}

export interface MarkingProposal {
  id: string;
  questionId: string;
  pupilHash: string;
  proposedMarks: number;
  maxMarks: number;
  confidence: number;
  rationale: string;
  misconceptionTag: string | null;
  teacherDecision: "pending" | "accepted" | "edited" | "rejected";
  teacherMarks: number | null;
}

export interface EvidencePassport {
  id: string;
  assessmentId: string;
  organizationId: string;
  schoolId: string;
  classId: string;
  subject: "reading" | "maths";
  yearGroup: "Year 4" | "Year 5" | "Year 6";
  evidenceConfidence: EvidenceConfidence;
  confidenceReasons: string[];
  objectiveCoverage: number;
  markingReviewCompletion: number;
  unresolvedUncertainty: number;
  nextTeachingActions: string[];
}
```

- [ ] **Step 2: Typecheck imports indirectly**

Run after Task 2 has tests:

```bash
npx vitest run apps/platform/src/lib/assessment-creator/__tests__/blueprint.test.ts
```

Expected: TypeScript compiles the new type module through the test import.

---

## Task 2: Blueprint Builder

**Files:**

- Create: `apps/platform/src/lib/assessment-creator/blueprint.ts`
- Create: `apps/platform/src/lib/assessment-creator/__tests__/blueprint.test.ts`

- [ ] **Step 1: Write the failing tests**

Add:

```ts
import { describe, expect, it } from "vitest";
import { buildAssessmentBlueprint, DEFAULT_BLEND, normaliseBlend } from "../blueprint";

describe("Assessment Creator blueprint", () => {
  it("uses the default 60/25/10/5 blend", () => {
    expect(DEFAULT_BLEND).toEqual({
      taughtCurriculum: 60,
      nationalExpectation: 25,
      retention: 10,
      statutoryReadiness: 5,
    });
  });

  it("normalises an edited blend to total 100", () => {
    expect(normaliseBlend({
      taughtCurriculum: 30,
      nationalExpectation: 30,
      retention: 30,
      statutoryReadiness: 30,
    })).toEqual({
      taughtCurriculum: 25,
      nationalExpectation: 25,
      retention: 25,
      statutoryReadiness: 25,
    });
  });

  it("builds a low-pressure retention check without statutory warnings", () => {
    const blueprint = buildAssessmentBlueprint({
      organizationId: "org-1",
      schoolId: "school-1",
      classId: "class-1",
      subject: "maths",
      yearGroup: "Year 5",
      term: "Spring",
      mode: "retention_check",
      taughtObjectives: [
        { id: "fractions", label: "Compare and order fractions", strand: "Fractions", yearGroup: "Year 5" },
      ],
    });

    expect(blueprint.status).toBe("blueprint_review");
    expect(blueprint.pressureRating).toBeLessThanOrEqual(2);
    expect(blueprint.objectives.some((objective) => objective.source === "prior_learning")).toBe(true);
    expect(blueprint.warnings).not.toContain("Statutory readiness is high-pressure; use sparingly.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run apps/platform/src/lib/assessment-creator/__tests__/blueprint.test.ts
```

Expected: FAIL because `blueprint.ts` does not exist.

- [ ] **Step 3: Implement blueprint logic**

Add:

```ts
import type { AssessmentBlend, AssessmentBlueprint, AssessmentMode, CurriculumObjective } from "./types";

export const DEFAULT_BLEND: AssessmentBlend = {
  taughtCurriculum: 60,
  nationalExpectation: 25,
  retention: 10,
  statutoryReadiness: 5,
};

interface BuildBlueprintInput {
  organizationId: string;
  schoolId: string;
  classId: string;
  subject: "reading" | "maths";
  yearGroup: "Year 4" | "Year 5" | "Year 6";
  term: "Autumn" | "Spring" | "Summer";
  mode: AssessmentMode;
  taughtObjectives: Array<{ id: string; label: string; strand: string; yearGroup: string }>;
  blend?: AssessmentBlend;
}

export function normaliseBlend(blend: AssessmentBlend): AssessmentBlend {
  const total = blend.taughtCurriculum + blend.nationalExpectation + blend.retention + blend.statutoryReadiness;
  if (total <= 0) return DEFAULT_BLEND;

  return {
    taughtCurriculum: Math.round((blend.taughtCurriculum / total) * 100),
    nationalExpectation: Math.round((blend.nationalExpectation / total) * 100),
    retention: Math.round((blend.retention / total) * 100),
    statutoryReadiness: Math.round((blend.statutoryReadiness / total) * 100),
  };
}

export function buildAssessmentBlueprint(input: BuildBlueprintInput): AssessmentBlueprint {
  const blend = normaliseBlend(input.blend ?? DEFAULT_BLEND);
  const objectives: CurriculumObjective[] = [
    ...input.taughtObjectives.map((objective) => ({
      ...objective,
      source: "school_curriculum" as const,
    })),
    {
      id: `${input.subject}-${input.yearGroup}-national-core`,
      label: `Core ${input.subject} expectations for ${input.yearGroup}`,
      strand: "National expectations",
      source: "national_curriculum",
      yearGroup: input.yearGroup,
    },
    {
      id: `${input.subject}-${input.yearGroup}-retention`,
      label: `Prior learning retrieval for ${input.yearGroup}`,
      strand: "Retention",
      source: "prior_learning",
      yearGroup: input.yearGroup,
    },
  ];

  const isStatutory = input.mode === "statutory_readiness";
  if (isStatutory) {
    objectives.push({
      id: `${input.subject}-${input.yearGroup}-statutory`,
      label: `Statutory-style ${input.subject} readiness`,
      strand: "Statutory readiness",
      source: "statutory_readiness",
      yearGroup: input.yearGroup,
    });
  }

  return {
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    classId: input.classId,
    subject: input.subject,
    yearGroup: input.yearGroup,
    term: input.term,
    mode: input.mode,
    status: "blueprint_review",
    durationMinutes: input.mode === "quick_check" ? 10 : input.mode === "retention_check" ? 15 : 35,
    blend,
    objectives,
    pressureRating: isStatutory ? 4 : input.mode === "unit_check" ? 3 : 2,
    workloadRating: input.mode === "quick_check" ? 1 : input.mode === "retention_check" ? 2 : 3,
    warnings: isStatutory ? ["Statutory readiness is high-pressure; use sparingly."] : [],
    createdAt: new Date().toISOString(),
    approvedAt: null,
  };
}
```

- [ ] **Step 4: Run the test**

Run:

```bash
npx vitest run apps/platform/src/lib/assessment-creator/__tests__/blueprint.test.ts
```

Expected: PASS.

---

## Task 3: Evidence Confidence Algorithm

**Files:**

- Create: `apps/platform/src/lib/assessment-creator/confidence.ts`
- Create: `apps/platform/src/lib/assessment-creator/__tests__/confidence.test.ts`

- [ ] **Step 1: Write the failing tests**

Add tests for high, medium, low, and mismatch:

```ts
import { describe, expect, it } from "vitest";
import { scoreEvidenceConfidence } from "../confidence";

describe("evidence confidence", () => {
  it("returns high confidence for fresh, broad, reviewed evidence", () => {
    const result = scoreEvidenceConfidence({
      daysOld: 10,
      objectiveCoverage: 0.88,
      depthScore: 0.8,
      questionCountPerObjective: 3,
      markingReviewCompletion: 1,
      teacherOverrideRate: 0.08,
      responseCompleteness: 0.97,
      moderated: true,
      submittedJudgementMismatch: false,
    });

    expect(result.rating).toBe("high");
    expect(result.reasons).toContain("Evidence is recent.");
  });

  it("returns mismatch when submitted judgement materially differs from evidence", () => {
    const result = scoreEvidenceConfidence({
      daysOld: 7,
      objectiveCoverage: 0.9,
      depthScore: 0.85,
      questionCountPerObjective: 4,
      markingReviewCompletion: 1,
      teacherOverrideRate: 0.02,
      responseCompleteness: 0.99,
      moderated: true,
      submittedJudgementMismatch: true,
    });

    expect(result.rating).toBe("mismatch");
  });

  it("returns low confidence when review and coverage are weak", () => {
    const result = scoreEvidenceConfidence({
      daysOld: 100,
      objectiveCoverage: 0.25,
      depthScore: 0.2,
      questionCountPerObjective: 1,
      markingReviewCompletion: 0.4,
      teacherOverrideRate: 0.4,
      responseCompleteness: 0.6,
      moderated: false,
      submittedJudgementMismatch: false,
    });

    expect(result.rating).toBe("low");
  });
});
```

- [ ] **Step 2: Implement scoring**

Use a deterministic points model:

```ts
import type { EvidenceConfidence } from "./types";

export interface EvidenceConfidenceInput {
  daysOld: number;
  objectiveCoverage: number;
  depthScore: number;
  questionCountPerObjective: number;
  markingReviewCompletion: number;
  teacherOverrideRate: number;
  responseCompleteness: number;
  moderated: boolean;
  submittedJudgementMismatch: boolean;
}

export interface EvidenceConfidenceResult {
  rating: EvidenceConfidence;
  score: number;
  reasons: string[];
}

export function scoreEvidenceConfidence(input: EvidenceConfidenceInput): EvidenceConfidenceResult {
  if (input.submittedJudgementMismatch) {
    return { rating: "mismatch", score: 0, reasons: ["Submitted judgement differs materially from assessment evidence."] };
  }

  let score = 0;
  const reasons: string[] = [];

  if (input.daysOld <= 45) { score += 20; reasons.push("Evidence is recent."); }
  if (input.objectiveCoverage >= 0.75) { score += 20; reasons.push("Objective coverage is broad."); }
  if (input.depthScore >= 0.7) { score += 15; reasons.push("Question depth supports a secure judgement."); }
  if (input.questionCountPerObjective >= 3) { score += 10; reasons.push("There are enough questions per objective."); }
  if (input.markingReviewCompletion >= 0.95) { score += 15; reasons.push("Teacher review is complete."); }
  if (input.teacherOverrideRate <= 0.15) { score += 5; reasons.push("Teacher override rate is low."); }
  if (input.responseCompleteness >= 0.9) { score += 10; reasons.push("Most pupil responses are complete and readable."); }
  if (input.moderated) { score += 5; reasons.push("Evidence has been moderated."); }

  if (score >= 80) return { rating: "high", score, reasons };
  if (score >= 50) return { rating: "medium", score, reasons };
  return { rating: "low", score, reasons };
}
```

- [ ] **Step 3: Run confidence tests**

Run:

```bash
npx vitest run apps/platform/src/lib/assessment-creator/__tests__/confidence.test.ts
```

Expected: PASS.

---

## Task 4: QR Payload Helpers

**Files:**

- Create: `apps/platform/src/lib/assessment-creator/qr.ts`
- Create: `apps/platform/src/lib/assessment-creator/__tests__/qr.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, expect, it } from "vitest";
import { createPaperQrPayload, parsePaperQrPayload } from "../qr";

describe("assessment QR payloads", () => {
  it("round-trips a pseudonymised paper payload", () => {
    const payload = createPaperQrPayload({
      assessmentId: "assessment-1",
      pupilHash: "hash-abc",
      pageNumber: 2,
    });

    expect(parsePaperQrPayload(payload)).toEqual({
      version: 1,
      assessmentId: "assessment-1",
      pupilHash: "hash-abc",
      pageNumber: 2,
    });
  });

  it("rejects unrelated QR payloads", () => {
    expect(parsePaperQrPayload("https://example.com")).toBeNull();
  });
});
```

- [ ] **Step 2: Implement QR payload helper**

```ts
export interface PaperQrPayload {
  version: 1;
  assessmentId: string;
  pupilHash: string;
  pageNumber: number;
}

const PREFIX = "schoolgle-assessment:";

export function createPaperQrPayload(input: Omit<PaperQrPayload, "version">): string {
  return `${PREFIX}${Buffer.from(JSON.stringify({ version: 1, ...input })).toString("base64url")}`;
}

export function parsePaperQrPayload(value: string): PaperQrPayload | null {
  if (!value.startsWith(PREFIX)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value.slice(PREFIX.length), "base64url").toString("utf8")) as PaperQrPayload;
    if (decoded.version !== 1 || !decoded.assessmentId || !decoded.pupilHash || !decoded.pageNumber) return null;
    return decoded;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Run QR tests**

Run:

```bash
npx vitest run apps/platform/src/lib/assessment-creator/__tests__/qr.test.ts
```

Expected: PASS.

---

## Task 5: Marking Proposal Reducer

**Files:**

- Create: `apps/platform/src/lib/assessment-creator/marking.ts`
- Create: `apps/platform/src/lib/assessment-creator/__tests__/marking.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, expect, it } from "vitest";
import { acceptProposal, editProposal, isReviewComplete } from "../marking";
import type { MarkingProposal } from "../types";

const proposal: MarkingProposal = {
  id: "proposal-1",
  questionId: "question-1",
  pupilHash: "hash-1",
  proposedMarks: 1,
  maxMarks: 2,
  confidence: 0.72,
  rationale: "Answer includes the correct method but incomplete final answer.",
  misconceptionTag: "fractions_equivalence_confuses_numerator_denominator",
  teacherDecision: "pending",
  teacherMarks: null,
};

describe("marking review", () => {
  it("accepts a proposal without changing marks", () => {
    expect(acceptProposal(proposal).teacherMarks).toBe(1);
    expect(acceptProposal(proposal).teacherDecision).toBe("accepted");
  });

  it("edits a proposal with teacher marks", () => {
    const edited = editProposal(proposal, 2);
    expect(edited.teacherMarks).toBe(2);
    expect(edited.teacherDecision).toBe("edited");
  });

  it("requires every proposal to be approved or edited", () => {
    expect(isReviewComplete([proposal])).toBe(false);
    expect(isReviewComplete([acceptProposal(proposal)])).toBe(true);
  });
});
```

- [ ] **Step 2: Implement reducer**

```ts
import type { MarkingProposal } from "./types";

export function acceptProposal(proposal: MarkingProposal): MarkingProposal {
  return {
    ...proposal,
    teacherDecision: "accepted",
    teacherMarks: proposal.proposedMarks,
  };
}

export function editProposal(proposal: MarkingProposal, teacherMarks: number): MarkingProposal {
  return {
    ...proposal,
    teacherDecision: "edited",
    teacherMarks: Math.max(0, Math.min(proposal.maxMarks, teacherMarks)),
  };
}

export function isReviewComplete(proposals: MarkingProposal[]): boolean {
  return proposals.length > 0 && proposals.every((proposal) => proposal.teacherDecision === "accepted" || proposal.teacherDecision === "edited");
}
```

- [ ] **Step 3: Run marking tests**

Run:

```bash
npx vitest run apps/platform/src/lib/assessment-creator/__tests__/marking.test.ts
```

Expected: PASS.

---

## Task 6: Scan Round-Trip Helpers

**Files:**

- Create: `apps/platform/src/lib/assessment-creator/scan-roundtrip.ts`

- [ ] **Step 1: Implement matching helper**

Add:

```ts
import type { ScanPageMatch } from "./types";
import { parsePaperQrPayload } from "./qr";

export interface BuildScanMatchInput {
  scanBatchId: string;
  pageId: string;
  qrValue: string | null;
}

export function buildScanPageMatch(input: BuildScanMatchInput): ScanPageMatch {
  const payload = input.qrValue ? parsePaperQrPayload(input.qrValue) : null;

  if (!payload) {
    return {
      pageId: input.pageId,
      scanBatchId: input.scanBatchId,
      assessmentId: "",
      pupilHash: "",
      pageNumber: 0,
      matchConfidence: 0,
      status: "unmatched",
    };
  }

  return {
    pageId: input.pageId,
    scanBatchId: input.scanBatchId,
    assessmentId: payload.assessmentId,
    pupilHash: payload.pupilHash,
    pageNumber: payload.pageNumber,
    matchConfidence: 1,
    status: "matched",
  };
}
```

- [ ] **Step 2: Add this to `qr.test.ts` or create `scan-roundtrip.test.ts`**

Assert that a valid QR creates a matched page and an invalid QR creates an unmatched page.

---

## Task 7: Supabase Migration

**Files:**

- Create: `apps/platform/supabase/migrations/20260424_assessment_creator_phase1.sql`

- [ ] **Step 1: Add phase 1 schema**

Create tables with pseudonymised pupil IDs only:

```sql
create table if not exists assessment_creator_blueprints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  school_id text not null,
  class_id text not null,
  subject text not null check (subject in ('reading', 'maths')),
  year_group text not null check (year_group in ('Year 4', 'Year 5', 'Year 6')),
  term text not null check (term in ('Autumn', 'Spring', 'Summer')),
  mode text not null,
  status text not null default 'blueprint_review',
  duration_minutes integer not null,
  blend jsonb not null,
  objectives jsonb not null,
  pressure_rating integer not null,
  workload_rating integer not null,
  warnings jsonb not null default '[]'::jsonb,
  created_by text,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assessment_scan_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  assessment_id uuid not null references assessment_creator_blueprints(id) on delete cascade,
  status text not null default 'uploaded',
  storage_path text,
  page_count integer not null default 0,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists assessment_scan_pages (
  id uuid primary key default gen_random_uuid(),
  scan_batch_id uuid not null references assessment_scan_batches(id) on delete cascade,
  assessment_id uuid references assessment_creator_blueprints(id) on delete cascade,
  pupil_hash text,
  page_number integer,
  storage_path text,
  match_confidence numeric not null default 0,
  status text not null default 'unmatched',
  created_at timestamptz not null default now()
);

create table if not exists assessment_marking_proposals (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessment_creator_blueprints(id) on delete cascade,
  question_id text not null,
  pupil_hash text not null,
  proposed_marks numeric not null,
  max_marks numeric not null,
  confidence numeric not null,
  rationale text not null,
  misconception_tag text,
  teacher_decision text not null default 'pending',
  teacher_marks numeric,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists assessment_evidence_passports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  school_id text not null,
  class_id text not null,
  assessment_id uuid not null references assessment_creator_blueprints(id) on delete cascade,
  subject text not null,
  year_group text not null,
  evidence_confidence text not null,
  confidence_reasons jsonb not null default '[]'::jsonb,
  objective_coverage numeric not null default 0,
  marking_review_completion numeric not null default 0,
  unresolved_uncertainty numeric not null default 0,
  next_teaching_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assessment_blueprints_org on assessment_creator_blueprints(organization_id);
create index if not exists idx_assessment_scan_batches_assessment on assessment_scan_batches(assessment_id);
create index if not exists idx_assessment_scan_pages_batch on assessment_scan_pages(scan_batch_id);
create index if not exists idx_assessment_marking_assessment on assessment_marking_proposals(assessment_id);
create index if not exists idx_assessment_passports_assessment on assessment_evidence_passports(assessment_id);
```

- [ ] **Step 2: Verify SQL manually**

Run only if local Supabase tooling is configured:

```bash
supabase db lint
```

Expected: no schema errors. If Supabase CLI is not configured, note that migration was not locally applied.

---

## Task 8: API Routes With Mock-Backed Phase 1 Behaviour

**Files:**

- Create all `apps/platform/src/app/api/assessment-creator/*/route.ts` files listed in File Structure.

- [ ] **Step 1: Add blueprint route**

Use `protectedRoute`, `apiSuccess`, and `apiError` from `@/lib/api-utils`, mirroring `school-assessment/captures/route.ts`.

Route:

```ts
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json().catch(() => ({}));
  const blueprint = buildAssessmentBlueprint({
    organizationId: body.organizationId || auth.organizationId,
    schoolId: body.schoolId,
    classId: body.classId,
    subject: body.subject,
    yearGroup: body.yearGroup,
    term: body.term,
    mode: body.mode,
    taughtObjectives: body.taughtObjectives ?? [],
    blend: body.blend,
  });
  return apiSuccess(blueprint);
});
```

Validate required fields before calling `buildAssessmentBlueprint`.

- [ ] **Step 2: Add paper-pack route**

Return Phase 1 mock paper questions plus QR payloads generated with `createPaperQrPayload`. Do not include pupil names; use `pupilHash`.

- [ ] **Step 3: Add scan-batches route**

Accept metadata for a scan batch and return mocked page matches using `buildScanPageMatch`. File upload processing can be mocked in Phase 1 UI; real storage comes after feasibility.

- [ ] **Step 4: Add marking-proposals route**

Return mocked `MarkingProposal[]` for the matched scan pages. Include mixed confidence examples so the review UI handles uncertainty.

- [ ] **Step 5: Add evidence-passports route**

Accept reviewed marking proposals and return an `EvidencePassport` using `scoreEvidenceConfidence`.

- [ ] **Step 6: Validate API compile**

Run:

```bash
npm run typecheck --workspace apps/platform
```

Expected: typecheck either passes or reports existing unrelated repo issues. Do not fix unrelated issues.

---

## Task 9: Assessment Creator UI Shell

**Files:**

- Modify: `apps/platform/src/app/(dashboard)/dashboard/teaching-learning/assessment-support/page.tsx`
- Create: `apps/platform/src/components/assessment-creator/AssessmentCreatorShell.tsx`
- Create child panel components.

- [ ] **Step 1: Replace placeholder page**

Change the page to render:

```tsx
"use client";

import { AssessmentCreatorShell } from "@/components/assessment-creator/AssessmentCreatorShell";

export default function AssessmentSupportPage() {
  return <AssessmentCreatorShell />;
}
```

- [ ] **Step 2: Build shell states**

Use local state for:

```ts
type Step = "create" | "blueprint" | "paper" | "scan" | "marking" | "passport";
```

Render a quiet stepper and one primary panel at a time. Keep copy teacher-centred:

- "Create check"
- "Review blueprint"
- "Print pack"
- "Upload scans"
- "Review proposed marks"
- "Evidence passport"

- [ ] **Step 3: Build CreateAssessmentPanel**

Inputs:

- Class: Oak Class placeholder.
- Subject: reading/maths segmented control.
- Year group: Year 4/5/6.
- Mode: Quick Check, Unit Check, Retention Check.
- Term: Autumn/Spring/Summer.
- Duration slider or select.

Submit calls `/api/assessment-creator/blueprints`.

- [ ] **Step 4: Build BlueprintReview**

Show:

- Blend bars.
- Objectives.
- Pressure rating.
- Workload rating.
- Warnings.
- "Request changes" and "Approve blueprint" buttons.

- [ ] **Step 5: Build PaperPackPreview**

Show:

- Printable assessment preview.
- QR code placeholder or generated payload text in Phase 1.
- "Download PDF" disabled with label "Phase 1 preview".
- "Continue to scan upload" primary action.

- [ ] **Step 6: Build ScanUploadPanel**

Use a file input that accepts `.pdf,.jpg,.jpeg,.png`. For Phase 1, submit metadata and display mocked matched/unmatched page results.

- [ ] **Step 7: Build MarkingReviewPanel**

Show table/cards:

- Question.
- Pupil pseudonym such as `Pupil 1`, not name.
- Proposed marks.
- Confidence.
- Rationale.
- Misconception tag.
- Accept/edit controls.

Do not allow passport generation until every proposal is accepted or edited.

- [ ] **Step 8: Build EvidencePassportPanel**

Show:

- Confidence rating.
- Reasons.
- Objective coverage.
- Marking review completion.
- Unresolved uncertainty.
- Next teaching actions.
- Trust Assessor handoff preview.
- Ofsted Readiness handoff preview.

---

## Task 10: Phase 0 Feasibility Harness

**Files:**

- Create: `docs/assessment-creator/phase0-feasibility-results.md`
- Optionally create: `scripts/assessment-creator/qr-roundtrip-check.mjs`

- [ ] **Step 1: Add feasibility results template**

Create:

```md
# Assessment Creator Phase 0 Feasibility Results

## Pilot A: Handwriting And Scan Accuracy

- Sample source:
- Number of papers:
- Input types:
- Page match accuracy:
- Answer extraction accuracy:
- Failure patterns:
- Decision:

## Pilot B: Mark Scheme Authoring Cost

- Assessment count:
- Subject/year groups:
- Authoring time:
- Misconception tag consistency:
- Decision:

## Pilot C: QR Scanning Round Trip

- Papers generated:
- Pages scanned:
- Auto-match rate:
- Upload-to-review time:
- Manual correction issues:
- Decision:
```

- [ ] **Step 2: Add QR round-trip script only if useful**

Generate a small set of QR payloads using `qrcode` and validate `parsePaperQrPayload`. Keep this script non-production and documented as a feasibility harness.

---

## Task 11: Targeted Validation

**Files:**

- All created and modified files.

- [ ] **Step 1: Run unit tests for new pure logic**

Run:

```bash
npx vitest run apps/platform/src/lib/assessment-creator/__tests__/blueprint.test.ts apps/platform/src/lib/assessment-creator/__tests__/confidence.test.ts apps/platform/src/lib/assessment-creator/__tests__/qr.test.ts apps/platform/src/lib/assessment-creator/__tests__/marking.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run platform typecheck**

Run:

```bash
cd apps/platform
npm run typecheck
```

Expected: PASS or existing unrelated errors. Record any unrelated errors clearly.

- [ ] **Step 3: Run app manually**

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/dashboard/teaching-learning/assessment-support
```

Expected:

- Page renders Assessment Creator, not the old coming-soon placeholder.
- Teacher can create a blueprint.
- Teacher can approve and progress to paper preview.
- Teacher can upload a mock scan.
- Teacher can review proposed marks.
- Teacher cannot create an evidence passport until every proposed mark is reviewed.
- Evidence Passport shows confidence reasons and Trust Assessor / Ofsted Readiness previews.

---

## Scope Boundaries

In this plan, do not build:

- Real PDF generation.
- Real PDF splitting.
- Real handwriting extraction.
- Real Google Classroom integration.
- Real Microsoft Teams integration.
- Full Trust Assessor UI integration.
- Full Ofsted Readiness UI integration.
- Statutory Readiness workflow.

Those come after Phase 0 feasibility proves the paper scanning and marking loop.

---

## Self-Review Checklist

- Spec coverage: includes teacher control, paper-first, QR, AI marking proposals, PII, Evidence Passport, Trust Assessor, Ofsted Readiness, and feasibility pilots.
- Placeholder scan: no `TBD` or vague "add error handling" tasks.
- Type consistency: all task snippets use `AssessmentBlueprint`, `MarkingProposal`, and `EvidencePassport` from `types.ts`.
- Risk control: Phase 1 mocks real scan processing but does not pretend handwriting recognition is solved.

