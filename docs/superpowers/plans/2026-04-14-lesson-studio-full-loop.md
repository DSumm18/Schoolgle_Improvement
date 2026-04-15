# Lesson Studio Full Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the complete lesson delivery loop — scheme drives lesson generation → visual teach content on whiteboard → personalised pupil work on devices → AI-graded assessment feeding back into pupil records and Ofsted readiness.

**Architecture:** Three layers. (1) Scheme layer — school picks their scheme (White Rose, etc.) once per class, it drives every lesson. (2) Delivery layer — generate endpoint produces visual content (SVG diagrams via existing `generate-visualisation.ts`) alongside text, TeachMode renders it, pupils receive their group's work on devices. (3) Assessment layer — pupils answer questions on their device, AI grades in real-time, triangulates against teacher judgement, feeds into Intelligence module.

**Tech Stack:** Next.js 16, Supabase (RLS), OpenRouter (Gemini Flash for text, Claude Sonnet for visuals), Web Audio API (timer chime), existing `generate-visualisation.ts` + `generate-variants.ts` + `WorksheetRenderer.tsx`.

---

## Phase 1: Scheme Library — Set Once, Drives Everything

### Task 1: Pre-loaded scheme registry

**Files:**
- Create: `apps/platform/src/lib/lesson-studio/scheme-registry.ts`
- Test: `apps/platform/src/lib/lesson-studio/scheme-registry.test.ts`

The school shouldn't have to upload a PDF to use White Rose. We should know the major UK schemes and their term-by-term progressions.

- [ ] **Step 1: Write the failing test**

```typescript
// scheme-registry.test.ts
import { describe, it, expect } from "vitest";
import { getAvailableSchemes, getSchemeProgression } from "./scheme-registry";

describe("scheme-registry", () => {
  it("lists available schemes for maths", () => {
    const schemes = getAvailableSchemes("Maths");
    expect(schemes.length).toBeGreaterThan(0);
    expect(schemes.find((s) => s.id === "white-rose-maths")).toBeTruthy();
    expect(schemes[0]).toHaveProperty("name");
    expect(schemes[0]).toHaveProperty("publisher");
    expect(schemes[0]).toHaveProperty("yearGroups");
  });

  it("returns progression for White Rose Year 6 Autumn", () => {
    const prog = getSchemeProgression("white-rose-maths", "Year 6", "Autumn");
    expect(prog.length).toBeGreaterThan(0);
    expect(prog[0]).toHaveProperty("unitName");
    expect(prog[0]).toHaveProperty("weekRange");
    expect(prog[0]).toHaveProperty("ncCodes");
    expect(prog[0]).toHaveProperty("keyTopics");
  });

  it("returns empty for unknown scheme", () => {
    const schemes = getAvailableSchemes("Underwater Basket Weaving");
    expect(schemes).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/platform/src/lib/lesson-studio/scheme-registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement scheme registry**

```typescript
// scheme-registry.ts
export interface SchemeDefinition {
  id: string;
  name: string;
  publisher: string;
  subject: string;
  yearGroups: string[];
  description: string;
  website?: string;
}

export interface SchemeUnit {
  unitName: string;
  weekRange: string; // e.g. "Weeks 1-3"
  ncCodes: string[];
  keyTopics: string[];
  suggestedHours: number;
}

const SCHEME_LIBRARY: SchemeDefinition[] = [
  {
    id: "white-rose-maths",
    name: "White Rose Maths",
    publisher: "White Rose Education",
    subject: "Maths",
    yearGroups: ["Reception", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"],
    description: "Small steps mastery approach aligned to NC. Most popular primary maths scheme in England.",
    website: "https://whiteroseeducation.com",
  },
  {
    id: "power-maths",
    name: "Power Maths",
    publisher: "Pearson",
    subject: "Maths",
    yearGroups: ["Reception", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"],
    description: "Mastery textbook programme. DfE approved.",
  },
  {
    id: "maths-no-problem",
    name: "Maths — No Problem!",
    publisher: "Maths — No Problem!",
    subject: "Maths",
    yearGroups: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"],
    description: "Singapore-style mastery. DfE approved.",
  },
  {
    id: "oak-maths",
    name: "Oak National Academy",
    publisher: "Oak National Academy",
    subject: "Maths",
    yearGroups: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"],
    description: "Free government-backed curriculum resources.",
  },
  {
    id: "read-write-inc",
    name: "Read Write Inc.",
    publisher: "Ruth Miskin / Oxford University Press",
    subject: "English",
    yearGroups: ["Reception", "Year 1", "Year 2"],
    description: "Systematic synthetic phonics programme.",
  },
  {
    id: "twinkl-planit",
    name: "Twinkl PlanIt",
    publisher: "Twinkl",
    subject: "Maths",
    yearGroups: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"],
    description: "Ready-made scheme aligned to NC. Popular with smaller schools.",
  },
  {
    id: "nelson-maths",
    name: "Nelson International Mathematics",
    publisher: "Oxford University Press",
    subject: "Maths",
    yearGroups: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"],
    description: "International primary maths programme.",
  },
  {
    id: "custom",
    name: "Custom / School's Own",
    publisher: "School",
    subject: "Any",
    yearGroups: ["Any"],
    description: "Upload your own scheme progression (PDF, text, or manual entry).",
  },
];

// White Rose Year 6 progression (representative sample — full data would come from API/DB)
const WHITE_ROSE_Y6: Record<string, SchemeUnit[]> = {
  Autumn: [
    { unitName: "Place Value", weekRange: "Weeks 1-2", ncCodes: ["6N1", "6N2", "6N3", "6N4"], keyTopics: ["Numbers to 10 million", "Round any number", "Negative numbers"], suggestedHours: 10 },
    { unitName: "Addition, Subtraction, Multiplication & Division", weekRange: "Weeks 3-6", ncCodes: ["6C1", "6C2", "6C3", "6C4"], keyTopics: ["Long division", "Order of operations", "Multi-step problems", "Mental strategies"], suggestedHours: 20 },
    { unitName: "Fractions", weekRange: "Weeks 7-10", ncCodes: ["6F1", "6F2", "6F3", "6F4", "6F5", "6F6", "6F7", "6F8", "6F9", "6F10", "6F11"], keyTopics: ["Equivalent fractions", "Compare and order", "Add and subtract", "Multiply and divide fractions", "Fractions of amounts"], suggestedHours: 20 },
    { unitName: "Converting Units", weekRange: "Weeks 11-12", ncCodes: ["6M1", "6M2", "6M3", "6M4", "6M5"], keyTopics: ["Metric units", "Miles and kilometres", "Imperial units"], suggestedHours: 10 },
  ],
  Spring: [
    { unitName: "Ratio", weekRange: "Weeks 1-2", ncCodes: ["6R1"], keyTopics: ["Ratio and proportion", "Scale factors", "Similar shapes", "Ratio problems"], suggestedHours: 10 },
    { unitName: "Algebra", weekRange: "Weeks 3-4", ncCodes: ["6A1", "6A2", "6A3", "6A4", "6A5"], keyTopics: ["Find a rule", "Formulae", "Linear sequences", "Unknown values"], suggestedHours: 10 },
    { unitName: "Decimals", weekRange: "Weeks 5-6", ncCodes: ["6F9", "6F10", "6F11", "6D1", "6D2"], keyTopics: ["Multiply/divide by 10/100/1000", "Multiply/divide decimals"], suggestedHours: 10 },
    { unitName: "Fractions, Decimals & Percentages", weekRange: "Weeks 7-8", ncCodes: ["6F6", "6F7", "6F8", "6D3", "6D4"], keyTopics: ["FDP equivalence", "Order FDP", "Percentage of amount"], suggestedHours: 10 },
    { unitName: "Area, Perimeter & Volume", weekRange: "Weeks 9-10", ncCodes: ["6M7", "6M8", "6M9"], keyTopics: ["Area of triangles", "Area of parallelograms", "Volume of cuboids"], suggestedHours: 10 },
    { unitName: "Statistics", weekRange: "Weeks 11-12", ncCodes: ["6S1", "6S2"], keyTopics: ["Line graphs", "Pie charts", "Mean average"], suggestedHours: 10 },
  ],
  Summer: [
    { unitName: "Shape", weekRange: "Weeks 1-3", ncCodes: ["6G1", "6G2", "6G3", "6G4"], keyTopics: ["Angles", "Classify shapes", "Circles", "Nets"], suggestedHours: 15 },
    { unitName: "Position & Direction", weekRange: "Weeks 4-5", ncCodes: ["6P1", "6P2", "6P3"], keyTopics: ["Coordinates", "Translation", "Reflection"], suggestedHours: 10 },
    { unitName: "Themed Projects & Investigations", weekRange: "Weeks 6-8", ncCodes: [], keyTopics: ["SATs preparation", "Problem solving", "Reasoning practice", "Cross-topic challenges"], suggestedHours: 15 },
  ],
};

export function getAvailableSchemes(subject: string): SchemeDefinition[] {
  return SCHEME_LIBRARY.filter(
    (s) => s.subject === subject || s.subject === "Any",
  );
}

export function getSchemeProgression(
  schemeId: string,
  yearGroup: string,
  term: string,
): SchemeUnit[] {
  if (schemeId === "white-rose-maths" && yearGroup === "Year 6") {
    return WHITE_ROSE_Y6[term] ?? [];
  }
  // Other schemes return empty — teacher uploads progression or we fetch from Oak API
  return [];
}

export function getAllSchemes(): SchemeDefinition[] {
  return SCHEME_LIBRARY;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run apps/platform/src/lib/lesson-studio/scheme-registry.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/lesson-studio/scheme-registry.ts apps/platform/src/lib/lesson-studio/scheme-registry.test.ts
git commit -m "feat(lesson-studio): add scheme registry with White Rose Y6 progression data"
```

---

### Task 2: Default scheme per class with simple setup UI

**Files:**
- Modify: `apps/platform/src/components/lesson-studio/SchemeManager.tsx`
- Modify: `apps/platform/src/components/lesson-studio/LessonStudio.tsx`

The scheme selector should show a clean list of known schemes. Teacher picks one → it's saved for that class → every lesson auto-aligns. No PDF upload needed for major schemes.

- [ ] **Step 1: Add scheme picker to SchemeManager**

Add an import for `getAllSchemes` from `./scheme-registry` and render a grid of scheme cards at the top of SchemeManager, before the existing PDF/Oak/paste options. When a scheme card is clicked, save it directly to `ls_scheme_mappings` without requiring file upload.

- [ ] **Step 2: Add scheme badge to LessonStudio header**

In `LessonStudio.tsx`, next to the class selector pills, show the connected scheme name (e.g. "White Rose Maths") as a small badge. If no scheme is connected, show "No scheme — tap to set up" linking to the Schemes tab.

- [ ] **Step 3: Test in browser — verify scheme selection persists and shows on header**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(lesson-studio): add scheme picker with pre-loaded UK schemes"
```

---

## Phase 2: Visual Teach Content — Not Just Text

### Task 3: Wire `generateVisualisation()` into the generate endpoint

**Files:**
- Modify: `apps/platform/src/app/api/lesson-studio/generate/route.ts`

Currently the generate endpoint only calls Gemini for text JSON. The existing `generateVisualisation()` function (which calls Claude Sonnet to create SVG diagrams) is never invoked. Wire it in.

- [ ] **Step 1: Import and call generateVisualisation after text generation**

After the AI returns the text plan (line ~350 of `generate/route.ts`), build a `LessonIntent` from the plan data and call `generateVisualisation()`. Store the result in `generated_resources_json.visualisation`.

```typescript
import { generateVisualisation } from "@/lib/lesson-studio/generate-visualisation";

// After JSON parse of generated plan...
// Build visualisation intent from the generated content
const visIntent = {
  subject: slot.subject,
  year_group: cls.year_group,
  topic: (generated.title as string) || slot.subject,
  concept_to_visualise: (generated.objective as string) || "",
  learning_objectives: generated.successCriteria as string[] ?? [],
  key_vocabulary: ((generated.vocabulary as Array<{word: string; definition: string}>) ?? []).map(v => v.word),
  curriculum_codes: progression?.steps?.[(schemeMapping?.scheme_config?.current_step ?? 1) - 1]?.nc_codes ?? [],
  suggested_interaction_points: [],
};

let visualisation = null;
try {
  visualisation = await generateVisualisation(visIntent);
} catch (e) {
  console.warn("[Lesson Generate] Visualisation generation failed, continuing without:", e);
}
```

Add the visualisation to `generated_resources_json`:

```typescript
generated_resources_json: {
  worksheetQuestions: generated.worksheetQuestions ?? {},
  exitTicket: generated.exitTicket ?? [],
  quiz: generated.quiz ?? [],
  starterQuestions: generated.starterQuestions ?? [],
  visualisation: visualisation ?? null,
},
```

- [ ] **Step 2: Test by generating a new lesson and checking the response includes visualisation SVG**

```bash
curl -s -X POST http://localhost:3000/api/lesson-studio/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"classId":"...","slotId":"...","weekCommencing":"2026-04-14","organizationId":"..."}' \
  | jq '.generated_resources_json.visualisation | keys'
```

Expected: `["svg", "html", "interaction_manifest"]`

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(lesson-studio): wire visualisation generation into lesson generate endpoint"
```

---

### Task 4: Render visualisations in Teach Mode slides

**Files:**
- Modify: `apps/platform/src/components/lesson-studio/TeachMode.tsx`

Each phase slide currently shows text description only. If a visualisation SVG exists in `generated_resources_json.visualisation`, render it alongside the phase content. The existing `LessonVisualisation.tsx` component handles fraction walls, labelled diagrams, etc. — but for generated SVGs, render the raw SVG inline.

- [ ] **Step 1: Add a visualisation slide after the Objective slide**

If `plan.generated_resources_json?.visualisation?.svg` exists, insert a dedicated "Visual" slide that renders the SVG full-width. Also add a smaller version alongside each phase slide.

```typescript
// After objective slide, before vocabulary:
const visData = (plan.generated_resources_json as any)?.visualisation;
if (visData?.svg) {
  slides.push({
    type: "visual" as any,
    label: "Visual",
    title: "Interactive Visual",
    content: (
      <div className="max-w-4xl mx-auto w-full">
        <div
          className="w-full rounded-xl overflow-hidden border border-slate-200 bg-white p-4"
          dangerouslySetInnerHTML={{ __html: visData.svg }}
        />
      </div>
    ),
  });
}
```

- [ ] **Step 2: Test in browser — open Teach Mode, verify Visual slide appears with SVG diagram**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(lesson-studio): render generated SVG visualisations in Teach Mode"
```

---

## Phase 3: Pupil-Facing Work on Devices

### Task 5: Pupil work page — login and see your group's questions

**Files:**
- Create: `apps/platform/src/app/(dashboard)/dashboard/teaching-learning/lesson-studio/pupil/page.tsx`
- Create: `apps/platform/src/app/api/lesson-studio/pupil-work/route.ts`

A simple page where a pupil (or teacher on behalf of pupil) selects their name from the class list and sees their differentiation group's worksheet questions. No separate auth — accessed via the school's logged-in session.

- [ ] **Step 1: Create the API route**

`GET /api/lesson-studio/pupil-work?lessonPlanId=X&pupilId=Y`

Returns: the pupil's differentiation group, their specific worksheet questions, and any SEND adaptations.

```typescript
// Determine which group the pupil belongs to by matching their name
// against differentiation_groups[].pupils string
// Return: { group, questions, adaptations, lessonTitle, subject }
```

- [ ] **Step 2: Create the pupil work page**

Clean, simple, light UI. Shows:
- Lesson title and subject at the top
- Pupil name and group badge
- Questions rendered as interactive form fields (text input for open, radio for multiple_choice, fill-in-blank)
- "Submit" button at the bottom
- On submit → POST to `/api/lesson-studio/assess` with answers as text

- [ ] **Step 3: Add "Send to Pupils" button in LessonPlanPanel**

In the plan detail panel, add a button that generates a shareable link: `/dashboard/teaching-learning/lesson-studio/pupil?plan=X`

The teacher can project this link/QR code. Pupils on their devices go to it, pick their name, and see their work.

- [ ] **Step 4: Test end-to-end — generate plan → open pupil link → select pupil → see questions → submit**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(lesson-studio): add pupil-facing work page with group-differentiated questions"
```

---

### Task 6: Real-time answer submission and AI grading

**Files:**
- Create: `apps/platform/src/app/api/lesson-studio/pupil-work/submit/route.ts`

When a pupil submits their answers, grade them immediately using the existing grading pipeline and store results in `ls_assessments`.

- [ ] **Step 1: Create the submit endpoint**

`POST /api/lesson-studio/pupil-work/submit`

Body: `{ lessonPlanId, pupilId, answers: [{ questionIndex, answer }] }`

Process: Format answers as text → call existing `gradeWork()` from `grading-pipeline.ts` → upsert into `ls_assessments` with `ai_suggested_grade`, `misconceptions`, `feedback_text`.

- [ ] **Step 2: Show results to pupil after submission**

After submit, show: score, AI feedback, next steps. Green/amber/red indicator.

- [ ] **Step 3: Show live submission status on teacher's plan panel**

In AssessmentPanel, show which pupils have submitted and their grades in real-time (poll every 10s or use Supabase realtime).

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(lesson-studio): real-time pupil answer submission with AI grading"
```

---

## Phase 4: Assessment Verification Loop

### Task 7: Teacher grade vs AI grade comparison

**Files:**
- Modify: `apps/platform/src/components/lesson-studio/AssessmentPanel.tsx`

Show the teacher a side-by-side: AI suggested grade vs teacher's judgement. Flag discrepancies. Teacher can agree, override, or send to moderation.

- [ ] **Step 1: Enhance AssessmentPanel to show triangulation**

For each pupil who has submitted work:
- Show AI grade (with confidence %) and teacher's current grade from `ls_pupils.attainment_*`
- Highlight mismatches in amber/red
- "Agree" button accepts AI grade → updates pupil attainment
- "Override" button lets teacher set their own grade with reason
- Discrepancy feeds into Intelligence module as a data point

- [ ] **Step 2: Add assessment summary stats**

At the top of the panel: "8/12 submitted, 3 discrepancies flagged, class average: EXS"

- [ ] **Step 3: Test with real graded work — verify discrepancy detection works**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(lesson-studio): assessment triangulation UI with teacher vs AI grade comparison"
```

---

### Task 8: Feed assessment data into Intelligence module

**Files:**
- Create: `apps/platform/src/lib/lesson-studio/intelligence-bridge.ts`

After assessments are verified, push the data into the Intelligence module so it appears in cohort tracking and Ofsted readiness.

- [ ] **Step 1: Create the bridge function**

```typescript
export async function syncAssessmentToIntelligence(
  lessonPlanId: string,
  organizationId: string,
): Promise<void> {
  // Load all verified assessments for this lesson
  // Group by attainment level
  // Upsert into pupil_assessments_pseudo (pseudonymised)
  // Update pupil_analysis_insights with new data points
  // Flag any pupils whose lesson assessment contradicts their historical level
}
```

- [ ] **Step 2: Call the bridge after teacher verifies assessments**

When teacher clicks "Agree" or "Override" in the triangulation UI, call `syncAssessmentToIntelligence()`.

- [ ] **Step 3: Verify data appears in Intelligence dashboard**

Navigate to `/dashboard/school-intelligence` → verify the lesson's assessment data shows in pupil insights.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(lesson-studio): bridge verified assessments to Intelligence module for Ofsted readiness"
```

---

## Summary: The Full Circle

```
School picks scheme (White Rose) → saved per class
    ↓
Teacher clicks Generate on timetable slot
    ↓
AI generates: text plan + SVG visual + differentiated worksheet questions
    ↓
Teacher enters Teach Mode → animated visual on whiteboard
    ↓
Teacher taps "Send to Pupils" → QR code / link
    ↓
Pupils on iPads open link → see their group's questions → submit answers
    ↓
AI grades in real-time → teacher sees results in Assessment panel
    ↓
Teacher verifies: Agree / Override AI grade
    ↓
Verified assessment feeds into Intelligence module → Ofsted readiness
    ↓
Next lesson's AI prompt includes misconceptions from this lesson
```

**Estimated build time:** 8 tasks, each 1-3 hours of focused work. Phases 1-2 (scheme + visuals) could ship in a day. Phases 3-4 (pupil devices + assessment loop) are 2-3 days.
