# School-Wide Timetable Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-class timetable setup with a school-wide timetable builder owned by admin/SLT. Handles shared resources (hall, pool), staggered lunches, PPA cover, EYFS continuous provision, staff allocation, and generates complete timetables in 30 minutes with AI assistance.

**Architecture:** Three layers. (1) School Day Config — define the school's time structure, breaks, lunches. (2) Resource & Constraint Engine — shared halls, fixed events (swimming, assembly), staff availability. (3) Grid Builder — visual drag-drop interface where admin allocates subjects to classes across all time slots simultaneously, with AI auto-fill and clash detection.

**Tech Stack:** Next.js 16, Supabase (RLS), React state for drag-drop, existing `ls_timetable_slots` + `ls_classes` tables extended with new `school_timetable_config` table.

---

## File Structure

```
apps/platform/src/
├── lib/lesson-studio/
│   ├── timetable-config.ts          # School day config types + defaults
│   ├── timetable-constraints.ts     # Clash detection, PPA validation
│   └── timetable-ai-fill.ts         # AI auto-fill logic
├── components/lesson-studio/
│   ├── SchoolTimetableBuilder.tsx    # Main school-wide builder (replaces TimetableSetup for admin)
│   ├── SchoolDayConfig.tsx           # Step 1: Configure school day timings
│   ├── SharedResourceManager.tsx     # Step 2: Hall, pool, specialist room booking
│   └── TimetableSetup.tsx           # (existing — keep as fallback for single-class quick setup)
├── app/api/lesson-studio/
│   └── timetable-config/route.ts    # CRUD for school timetable configuration
```

---

### Task 1: School Day Configuration — types and defaults

**Files:**
- Create: `apps/platform/src/lib/lesson-studio/timetable-config.ts`
- Test: `apps/platform/src/lib/lesson-studio/timetable-config.test.ts`

Define the school day structure — time periods, breaks, lunches — as a configurable object rather than hard-coded values.

- [ ] **Step 1: Write the failing test**

```typescript
// timetable-config.test.ts
import { describe, it, expect } from "vitest";
import {
  getDefaultSchoolDay,
  getPeriodsForKeyStage,
  getLunchSlot,
  type SchoolDayConfig,
} from "./timetable-config";

describe("timetable-config", () => {
  it("returns default school day with 5 teaching periods", () => {
    const config = getDefaultSchoolDay();
    expect(config.periods.length).toBe(5);
    expect(config.periods[0].start).toBe("09:00");
    expect(config.schoolStart).toBe("08:45");
    expect(config.schoolEnd).toBe("15:15");
  });

  it("returns KS2 periods (all 5)", () => {
    const config = getDefaultSchoolDay();
    const periods = getPeriodsForKeyStage(config, "KS2");
    expect(periods.length).toBe(5);
  });

  it("returns EYFS periods (3 flexible blocks)", () => {
    const config = getDefaultSchoolDay();
    const periods = getPeriodsForKeyStage(config, "EYFS");
    expect(periods.length).toBe(3);
    expect(periods[0].label).toContain("Morning");
  });

  it("returns staggered lunch by year group", () => {
    const config = getDefaultSchoolDay();
    const lunch = getLunchSlot(config, "Year 1");
    expect(lunch.start).toBe("12:00");
    expect(lunch.end).toBe("12:30");
  });

  it("returns later lunch for Year 5", () => {
    const config = getDefaultSchoolDay();
    const lunch = getLunchSlot(config, "Year 5");
    expect(lunch.start).toBe("12:30");
    expect(lunch.end).toBe("13:00");
  });

  it("includes morning break", () => {
    const config = getDefaultSchoolDay();
    expect(config.breaks.length).toBeGreaterThanOrEqual(1);
    expect(config.breaks[0].label).toBe("Morning Break");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/platform/src/lib/lesson-studio/timetable-config.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement timetable config**

```typescript
// timetable-config.ts

export interface TimePeriod {
  id: string;
  start: string; // HH:MM
  end: string;
  label: string;
  type: "teaching" | "break" | "lunch" | "assembly" | "registration";
}

export interface LunchSlot {
  start: string;
  end: string;
  yearGroups: string[];
}

export interface SchoolDayConfig {
  schoolStart: string; // e.g. "08:45"
  schoolEnd: string;   // e.g. "15:15"
  periods: TimePeriod[];
  breaks: TimePeriod[];
  lunchSittings: LunchSlot[];
  assemblySlot?: { day: number; start: string; end: string }; // e.g. Friday 9:00
  fixedEvents: Array<{
    name: string;
    day: number;
    start: string;
    end: string;
    yearGroups: string[]; // which year groups this affects
    resource?: string; // e.g. "Main Hall", "Swimming Pool"
  }>;
}

export function getDefaultSchoolDay(): SchoolDayConfig {
  return {
    schoolStart: "08:45",
    schoolEnd: "15:15",
    periods: [
      { id: "p1", start: "09:00", end: "10:00", label: "Period 1", type: "teaching" },
      { id: "p2", start: "10:15", end: "11:15", label: "Period 2", type: "teaching" },
      { id: "p3", start: "11:30", end: "12:15", label: "Period 3", type: "teaching" },
      { id: "p4", start: "13:15", end: "14:15", label: "Period 4", type: "teaching" },
      { id: "p5", start: "14:30", end: "15:15", label: "Period 5", type: "teaching" },
    ],
    breaks: [
      { id: "brk1", start: "10:00", end: "10:15", label: "Morning Break", type: "break" },
      { id: "brk2", start: "14:15", end: "14:30", label: "Afternoon Break", type: "break" },
    ],
    lunchSittings: [
      { start: "11:30", end: "12:00", yearGroups: ["Nursery"] },
      { start: "11:45", end: "12:15", yearGroups: ["Reception"] },
      { start: "12:00", end: "12:30", yearGroups: ["Year 1", "Year 2"] },
      { start: "12:15", end: "12:45", yearGroups: ["Year 3", "Year 4"] },
      { start: "12:30", end: "13:00", yearGroups: ["Year 5", "Year 6"] },
    ],
    assemblySlot: { day: 5, start: "09:00", end: "09:30" }, // Friday assembly
    fixedEvents: [],
  };
}

const EYFS_PERIODS: TimePeriod[] = [
  { id: "eyfs-am", start: "09:00", end: "11:30", label: "Morning Session", type: "teaching" },
  { id: "eyfs-pm1", start: "13:00", end: "14:15", label: "Afternoon Session 1", type: "teaching" },
  { id: "eyfs-pm2", start: "14:30", end: "15:15", label: "Afternoon Session 2", type: "teaching" },
];

export function getPeriodsForKeyStage(config: SchoolDayConfig, keyStage: string): TimePeriod[] {
  if (keyStage === "EYFS") return EYFS_PERIODS;
  return config.periods;
}

export function getLunchSlot(config: SchoolDayConfig, yearGroup: string): { start: string; end: string } {
  for (const sitting of config.lunchSittings) {
    if (sitting.yearGroups.some((yg) => yearGroup.startsWith(yg) || yearGroup === yg)) {
      return { start: sitting.start, end: sitting.end };
    }
  }
  // Default fallback
  return { start: "12:15", end: "12:45" };
}

export function getKeyStageForYearGroup(yearGroup: string): string {
  if (yearGroup === "Nursery" || yearGroup === "Reception") return "EYFS";
  if (yearGroup.startsWith("Year 1") || yearGroup.startsWith("Year 2")) return "KS1";
  return "KS2";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run apps/platform/src/lib/lesson-studio/timetable-config.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/lesson-studio/timetable-config.ts apps/platform/src/lib/lesson-studio/timetable-config.test.ts
git commit -m "feat(timetable): school day config with periods, breaks, staggered lunches, EYFS mode"
```

---

### Task 2: Constraint engine — clash detection and PPA validation

**Files:**
- Create: `apps/platform/src/lib/lesson-studio/timetable-constraints.ts`
- Test: `apps/platform/src/lib/lesson-studio/timetable-constraints.test.ts`

Detect conflicts: double-booked hall, missing PPA, first aider gap on trip day.

- [ ] **Step 1: Write the failing test**

```typescript
// timetable-constraints.test.ts
import { describe, it, expect } from "vitest";
import { detectClashes, validatePPA, type TimetableSlotInput } from "./timetable-constraints";

describe("timetable-constraints", () => {
  const slots: TimetableSlotInput[] = [
    { classId: "c1", day: 1, start: "09:00", end: "10:00", subject: "PE", resource: "Main Hall" },
    { classId: "c2", day: 1, start: "09:00", end: "10:00", subject: "PE", resource: "Main Hall" },
    { classId: "c3", day: 1, start: "09:00", end: "10:00", subject: "Maths" },
  ];

  it("detects resource clash when two classes book the same hall", () => {
    const clashes = detectClashes(slots);
    expect(clashes.length).toBe(1);
    expect(clashes[0].type).toBe("resource");
    expect(clashes[0].resource).toBe("Main Hall");
  });

  it("no clash when different times", () => {
    const noClash: TimetableSlotInput[] = [
      { classId: "c1", day: 1, start: "09:00", end: "10:00", subject: "PE", resource: "Main Hall" },
      { classId: "c2", day: 1, start: "10:15", end: "11:15", subject: "PE", resource: "Main Hall" },
    ];
    expect(detectClashes(noClash).length).toBe(0);
  });

  it("validates PPA — flags class with no PPA slot", () => {
    const weekSlots: TimetableSlotInput[] = [
      { classId: "c1", day: 1, start: "09:00", end: "10:00", subject: "Maths" },
      { classId: "c1", day: 1, start: "10:15", end: "11:15", subject: "English" },
      // No PPA slot for c1
    ];
    const issues = validatePPA(weekSlots, ["c1"]);
    expect(issues.length).toBe(1);
    expect(issues[0].type).toBe("no_ppa");
  });

  it("passes PPA when PPA slot exists", () => {
    const weekSlots: TimetableSlotInput[] = [
      { classId: "c1", day: 3, start: "13:15", end: "14:15", subject: "PPA" },
    ];
    const issues = validatePPA(weekSlots, ["c1"]);
    expect(issues.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement constraint engine**

```typescript
// timetable-constraints.ts

export interface TimetableSlotInput {
  classId: string;
  day: number;
  start: string;
  end: string;
  subject: string;
  resource?: string; // e.g. "Main Hall", "Swimming Pool"
}

export interface TimetableClash {
  type: "resource" | "teacher" | "room";
  day: number;
  start: string;
  end: string;
  resource?: string;
  classIds: string[];
  message: string;
}

export interface TimetableIssue {
  type: "no_ppa" | "ppa_too_short" | "assembly_clash" | "missing_subject";
  classId: string;
  message: string;
  severity: "error" | "warning";
}

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 < e2 && s2 < e1;
}

export function detectClashes(slots: TimetableSlotInput[]): TimetableClash[] {
  const clashes: TimetableClash[] = [];
  const resourceSlots = slots.filter((s) => s.resource);

  for (let i = 0; i < resourceSlots.length; i++) {
    for (let j = i + 1; j < resourceSlots.length; j++) {
      const a = resourceSlots[i];
      const b = resourceSlots[j];
      if (
        a.day === b.day &&
        a.resource === b.resource &&
        a.classId !== b.classId &&
        timesOverlap(a.start, a.end, b.start, b.end)
      ) {
        clashes.push({
          type: "resource",
          day: a.day,
          start: a.start,
          end: a.end,
          resource: a.resource,
          classIds: [a.classId, b.classId],
          message: `${a.resource} double-booked on ${["", "Mon", "Tue", "Wed", "Thu", "Fri"][a.day]} ${a.start}`,
        });
      }
    }
  }

  return clashes;
}

export function validatePPA(
  slots: TimetableSlotInput[],
  classIds: string[],
): TimetableIssue[] {
  const issues: TimetableIssue[] = [];

  for (const classId of classIds) {
    const classSlots = slots.filter((s) => s.classId === classId);
    const hasPPA = classSlots.some(
      (s) => s.subject === "PPA" || s.subject === "PPA Time",
    );
    if (!hasPPA) {
      issues.push({
        type: "no_ppa",
        classId,
        message: `No PPA time scheduled`,
        severity: "warning",
      });
    }
  }

  return issues;
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/lesson-studio/timetable-constraints.ts apps/platform/src/lib/lesson-studio/timetable-constraints.test.ts
git commit -m "feat(timetable): constraint engine — clash detection and PPA validation"
```

---

### Task 3: School Day Config UI — step 1 of the builder

**Files:**
- Create: `apps/platform/src/components/lesson-studio/SchoolDayConfig.tsx`

A clean form where the admin defines their school's time structure. Pre-filled with sensible UK primary defaults. Editable periods, breaks, lunch sittings.

- [ ] **Step 1: Build the SchoolDayConfig component**

Props:
```typescript
interface SchoolDayConfigProps {
  config: SchoolDayConfig;
  onChange: (config: SchoolDayConfig) => void;
  onNext: () => void; // proceed to step 2
}
```

Layout:
- "School Day Setup" heading
- School start/end time inputs
- Editable period list (add/remove/reorder)
- Break times
- Lunch sittings with year group assignment
- Assembly slot (day + time)
- "Next: Allocate Subjects →" button

Use the `getDefaultSchoolDay()` defaults. Light, clean styling consistent with existing Lesson Studio UI. Each section is a collapsible card.

- [ ] **Step 2: Test in browser**

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/components/lesson-studio/SchoolDayConfig.tsx
git commit -m "feat(timetable): school day config UI — periods, breaks, lunches, assembly"
```

---

### Task 4: School-wide Timetable Builder — the main grid

**Files:**
- Create: `apps/platform/src/components/lesson-studio/SchoolTimetableBuilder.tsx`
- Modify: `apps/platform/src/components/lesson-studio/LessonStudio.tsx`

The core builder — a grid showing ALL classes × ALL periods for a single day. Admin clicks cells to assign subjects. Shows clashes in real-time.

- [ ] **Step 1: Build SchoolTimetableBuilder**

A 3-step wizard:
1. **School Day** — SchoolDayConfig (Task 3)
2. **Build Timetable** — the grid (this task)
3. **Review & Save** — summary with clash warnings

The grid step shows:
- Day tabs (Mon-Fri) at top
- Rows = classes (grouped by key stage with separators, matching WholeSchoolView)
- Columns = time periods (from SchoolDayConfig, with lunch column)
- EYFS rows show fewer, wider columns (continuous provision blocks)
- Cells are clickable — click to pick a subject from a dropdown
- Fixed events (assembly, swimming) pre-populate as locked cells (greyed out, not editable)
- Resource-requiring subjects (PE) show a resource picker inline
- Real-time clash detection — amber border on clashing cells with tooltip
- PPA validation — warning banner if any class is missing PPA
- Counter: "Year 1: 23/25 slots filled | PPA: ✓"
- "AI Auto-Fill" button — fills remaining empty slots with sensible subjects based on NC requirements

Props:
```typescript
interface SchoolTimetableBuilderProps {
  classes: LSClass[];
  organizationId: string;
  onComplete: () => void;
}
```

- [ ] **Step 2: Add "AI Auto-Fill" function**

When clicked, fills empty cells using simple rules:
- Year 6: Heavy Maths (5 sessions) and English (5 sessions) for SATs prep
- KS2: Maths (5), English (5), Science (2), Foundation subjects fill remaining
- KS1: Maths (5), English (5), Phonics (5 in Y1), Science (1), Foundation subjects
- EYFS: Adult-led inputs labelled by focus area
- Never double-book a shared resource
- Always include one PPA slot per class

- [ ] **Step 3: Wire into LessonStudio**

In the WholeSchoolView ("All Classes" mode), add a "Set Up Timetable" button that opens the SchoolTimetableBuilder. Replace the current per-class TimetableSetup as the primary setup flow.

The per-class TimetableSetup remains as a fallback for quick single-class edits.

- [ ] **Step 4: Save logic — write all slots to DB**

On "Save Timetable":
1. Delete all existing `ls_timetable_slots` for this org
2. Insert all new slots
3. Generate `ls_calendar_events` for the current term (12 weeks from term start)
4. Call `onComplete()` to refresh the UI

- [ ] **Step 5: Test end-to-end — set up timetable for 9 classes, verify WholeSchoolView populates**

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/components/lesson-studio/SchoolTimetableBuilder.tsx apps/platform/src/components/lesson-studio/LessonStudio.tsx
git commit -m "feat(timetable): school-wide timetable builder with AI auto-fill and clash detection"
```

---

### Task 5: Timetable config API — persist school day settings

**Files:**
- Create: `apps/platform/src/app/api/lesson-studio/timetable-config/route.ts`

Store and retrieve the school's timetable configuration so it persists across sessions.

- [ ] **Step 1: Add `timetable_config` column to `school_settings`**

```sql
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS timetable_config JSONB DEFAULT '{}';
```

- [ ] **Step 2: Create the API route**

GET `/api/lesson-studio/timetable-config` — returns saved config or defaults
POST `/api/lesson-studio/timetable-config` — saves config

Use `protectedRoute` + `createServiceRoleClient`.

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/api/lesson-studio/timetable-config/route.ts
git commit -m "feat(timetable): timetable config API — persist school day settings"
```

---

### Task 6: Shared Resource Manager — hall, pool, specialist rooms

**Files:**
- Create: `apps/platform/src/components/lesson-studio/SharedResourceManager.tsx`

A simple list of shared resources (Main Hall, Swimming Pool, ICT Suite, etc.) that the school defines. Used by the constraint engine to detect double-bookings.

- [ ] **Step 1: Build the component**

- A simple list with add/remove
- Default resources: "Main Hall", "Playground"
- Each resource has: name, capacity (optional), available days/times
- When a subject requires a resource (PE → Main Hall), the timetable builder shows the constraint

- [ ] **Step 2: Integrate with SchoolTimetableBuilder step 1**

Show SharedResourceManager as part of the SchoolDayConfig step, below the lunch settings.

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/components/lesson-studio/SharedResourceManager.tsx
git commit -m "feat(timetable): shared resource manager — hall, pool, specialist room booking"
```

---

## Summary: The School-Wide Timetable Builder Flow

```
Admin clicks "Set Up Timetable" in All Classes view
    ↓
Step 1: School Day Config
  - Confirm/edit time periods, breaks, staggered lunches
  - Define shared resources (hall, pool)
  - Set fixed events (Friday assembly, Thursday swimming Y3)
    ↓
Step 2: Build Timetable (the grid)
  - All classes × all periods for each day
  - Click to assign subjects
  - AI Auto-Fill for remaining slots
  - Real-time clash detection (double-booked hall, missing PPA)
  - EYFS rows show continuous provision blocks
    ↓
Step 3: Review & Save
  - Summary of clashes and warnings
  - PPA check per class
  - Save → writes to ls_timetable_slots
  - Generates calendar events for the term
    ↓
WholeSchoolView populates with the complete timetable
Teachers see their class timetable when they log in
```

**Estimated build time:** 6 tasks, each 1-3 hours. Tasks 1-2 (config + constraints) are pure logic with tests. Tasks 3-4 (UI) are the main build. Tasks 5-6 are supporting infrastructure.
