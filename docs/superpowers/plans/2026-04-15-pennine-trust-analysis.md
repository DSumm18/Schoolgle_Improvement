# Pennine Academies Trust Analysis Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a three-layer interactive school improvement dashboard at `/dashboard/school-improvement/trust-analysis/` for Pennine Academies Yorkshire (7 primary schools), demonstrating Schoolgle's Mercury module capabilities.

**Architecture:** Single Next.js page with tabbed interface. Layer 1 (self-reported data) and Layer 2 (DfE cross-reference) are hardcoded data + server-side Supabase queries rendered with Recharts. Layer 3 (Grove House per-pupil) is a placeholder tab for future Google Drive integration. All data types, school constants, and analysis logic live in focused lib files. One API route fetches DfE data server-side.

**Tech Stack:** Next.js 16 App Router, TypeScript, Recharts, Tailwind CSS, Supabase (server-side queries via service role client), Framer Motion (animations)

---

## File Structure

```
apps/platform/src/
├── app/(dashboard)/dashboard/school-improvement/trust-analysis/
│   └── page.tsx                          # Main page — tabs, layout, data fetching
├── app/api/trust-analysis/
│   └── route.ts                          # API: fetches DfE KS2 + census from Supabase
├── lib/trust-analysis/
│   ├── types.ts                          # All TypeScript types
│   ├── pennine-data.ts                   # Hardcoded self-reported spreadsheet data
│   ├── analysis.ts                       # Analysis logic: gaps, divergence, narratives
│   └── school-narratives.ts              # Per-school written report generator
└── components/trust-analysis/
    ├── TrustOverviewHeatmap.tsx           # Layer 1: heatmap grid all schools
    ├── SchoolComparisonCharts.tsx         # Layer 1: bar/radar charts
    ├── DisadvantageGapTable.tsx           # Layer 1: FSM6 vs Non-FSM tables
    ├── DataQualityFlags.tsx              # Layer 1: data quality warnings
    ├── DfeCrossReference.tsx             # Layer 2: DfE vs self-report panels
    ├── TrendCharts.tsx                   # Layer 2: census/KS2 trend lines
    ├── SchoolNarrativeCard.tsx           # Written narrative per school
    └── GroveHouseDemo.tsx                # Layer 3: placeholder for per-pupil
```

---

## Task 1: Types and Constants

**Files:**
- Create: `apps/platform/src/lib/trust-analysis/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// apps/platform/src/lib/trust-analysis/types.ts

// ─── School Constants ────────────────────────────────────────────────

export interface PennineSchool {
  abbrev: string;
  name: string;
  urn: number;
  nor: number;
  fsmPct: number;
  ealPct: number;
}

export const PENNINE_SCHOOLS: PennineSchool[] = [
  { abbrev: 'CVPS', name: 'Clayton Village Primary School', urn: 148869, nor: 193, fsmPct: 15.0, ealPct: 12.4 },
  { abbrev: 'CHPS', name: 'Crossley Hall Primary School', urn: 146581, nor: 676, fsmPct: 29.6, ealPct: 76.2 },
  { abbrev: 'FPS',  name: 'Farnham Primary School', urn: 144862, nor: 449, fsmPct: 25.8, ealPct: 85.1 },
  { abbrev: 'GHPS', name: 'Grove House Primary School', urn: 148201, nor: 417, fsmPct: 27.3, ealPct: 39.8 },
  { abbrev: 'HPS',  name: 'Hollingwood Primary School', urn: 144860, nor: 482, fsmPct: 25.9, ealPct: 55.8 },
  { abbrev: 'LPS',  name: 'Laycock Primary School', urn: 144861, nor: 88, fsmPct: 47.7, ealPct: 5.7 },
  { abbrev: 'LGPS', name: 'Lidget Green Primary School', urn: 150016, nor: 516, fsmPct: 34.9, ealPct: 73.3 },
];

export const PENNINE_URNS = PENNINE_SCHOOLS.map(s => s.urn);

export function getSchoolByUrn(urn: number): PennineSchool | undefined {
  return PENNINE_SCHOOLS.find(s => s.urn === urn);
}

export function getSchoolByAbbrev(abbrev: string): PennineSchool | undefined {
  return PENNINE_SCHOOLS.find(s => s.abbrev === abbrev);
}

// ─── Year Groups ─────────────────────────────────────────────────────

export type YearGroup = 'EYFS' | 'Y1' | 'Y2' | 'Y3' | 'Y4' | 'Y5' | 'Y6';
export const YEAR_GROUPS: YearGroup[] = ['EYFS', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'];

export type Subject = 'Reading' | 'Writing' | 'Maths' | 'Combined' | 'Phonics' | 'MTC' | 'GLD';
export const CORE_SUBJECTS: Subject[] = ['Reading', 'Writing', 'Maths', 'Combined'];

// ─── Self-Reported Data (Layer 1) ────────────────────────────────────

export interface YearGroupData {
  yearGroup: YearGroup;
  cohortSize: number;
  allPupils: SubjectScores;
  fsm6: SubjectScores;
  nonFsm: SubjectScores;
  gd: SubjectScores;
  phonics?: number;       // Y1, Y2 only
  mtc?: number;           // Y4 only
  gld?: number;           // EYFS only
}

export interface SubjectScores {
  reading: number | null;
  writing: number | null;
  maths: number | null;
  combined: number | null;
}

export interface SchoolSelfReport {
  school: string; // abbrev
  yearGroups: YearGroupData[];
}

// ─── DfE Data (Layer 2) ─────────────────────────────────────────────

export interface KS2Result {
  urn: number;
  academicYearEnd: number;
  subject: string;
  breakdownTopic: string;
  breakdown: string;
  expectedStandardPct: number | null;
  higherStandardPct: number | null;
  averageScaledScore: number | null;
  progressMeasureScore: number | null;
}

export interface CensusRecord {
  urn: number;
  academicYearEnd: number;
  numberOnRoll: number;
  fsmPct: number | null;
  ealPct: number | null;
  senPct: number | null;
}

export interface DfEData {
  ks2Results: KS2Result[];
  census: CensusRecord[];
}

// ─── Analysis Types ──────────────────────────────────────────────────

export type RAGStatus = 'red' | 'amber' | 'green';

export interface DivergenceFlag {
  school: string;
  subject: string;
  selfReportedPct: number;
  validatedPct: number;
  divergencePp: number;     // percentage points difference
  rag: RAGStatus;
  narrative: string;
}

export interface DataQualityFlag {
  school: string;
  yearGroup: YearGroup;
  issue: string;
  severity: 'warning' | 'error';
}

export interface DisadvantageGap {
  school: string;
  subject: string;
  fsmPct: number | null;
  nonFsmPct: number | null;
  gapPp: number | null;
}

export interface SchoolNarrative {
  school: string;
  strengths: string[];
  concerns: string[];
  ofstedQuestions: string[];
  overallAssessment: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/lib/trust-analysis/types.ts
git commit -m "feat(trust-analysis): add TypeScript types and school constants for Pennine trust"
```

---

## Task 2: Hardcoded Self-Reported Spreadsheet Data

**Files:**
- Create: `apps/platform/src/lib/trust-analysis/pennine-data.ts`

The trust's mid-year teacher assessment data must be hardcoded from the spreadsheet. This is the raw self-reported data (Layer 1). Later this becomes a data import feature.

- [ ] **Step 1: Create the data file with all 7 schools' self-reported data**

```typescript
// apps/platform/src/lib/trust-analysis/pennine-data.ts
import { SchoolSelfReport } from './types';

// Mid-year 2025/26 teacher assessment data — self-reported by Pennine Academies
// Source: Trust-wide data capture spreadsheet shared by School Improvement Partner

export const PENNINE_SELF_REPORTS: SchoolSelfReport[] = [
  {
    school: 'CVPS',
    yearGroups: [
      {
        yearGroup: 'EYFS',
        cohortSize: 30,
        allPupils: { reading: 63, writing: 43, maths: 63, combined: null },
        fsm6: { reading: 50, writing: 25, maths: 50, combined: null },
        nonFsm: { reading: 67, writing: 48, maths: 67, combined: null },
        gd: { reading: 0, writing: 0, maths: 0, combined: null },
        gld: 43,
      },
      {
        yearGroup: 'Y1',
        cohortSize: 28,
        allPupils: { reading: 64, writing: 50, maths: 71, combined: 50 },
        fsm6: { reading: 60, writing: 20, maths: 60, combined: 20 },
        nonFsm: { reading: 65, writing: 57, maths: 74, combined: 57 },
        gd: { reading: 7, writing: 0, maths: 7, combined: 0 },
        phonics: 64,
      },
      {
        yearGroup: 'Y2',
        cohortSize: 27,
        allPupils: { reading: 63, writing: 52, maths: 70, combined: 48 },
        fsm6: { reading: 50, writing: 33, maths: 67, combined: 33 },
        nonFsm: { reading: 67, writing: 57, maths: 71, combined: 52 },
        gd: { reading: 11, writing: 4, maths: 11, combined: 4 },
        phonics: 85,
      },
      {
        yearGroup: 'Y3',
        cohortSize: 30,
        allPupils: { reading: 57, writing: 47, maths: 63, combined: 43 },
        fsm6: { reading: 25, writing: 25, maths: 25, combined: 25 },
        nonFsm: { reading: 62, writing: 50, maths: 69, combined: 46 },
        gd: { reading: 10, writing: 3, maths: 10, combined: 3 },
      },
      {
        yearGroup: 'Y4',
        cohortSize: 29,
        allPupils: { reading: 62, writing: 52, maths: 69, combined: 52 },
        fsm6: { reading: 40, writing: 20, maths: 40, combined: 20 },
        nonFsm: { reading: 67, writing: 58, maths: 75, combined: 58 },
        gd: { reading: 10, writing: 0, maths: 14, combined: 0 },
        mtc: 62,
      },
      {
        yearGroup: 'Y5',
        cohortSize: 25,
        allPupils: { reading: 64, writing: 52, maths: 72, combined: 52 },
        fsm6: { reading: 33, writing: 33, maths: 33, combined: 33 },
        nonFsm: { reading: 68, writing: 55, maths: 77, combined: 55 },
        gd: { reading: 12, writing: 4, maths: 12, combined: 4 },
      },
      {
        yearGroup: 'Y6',
        cohortSize: 24,
        allPupils: { reading: 67, writing: 54, maths: 71, combined: 50 },
        fsm6: { reading: 50, writing: 25, maths: 50, combined: 25 },
        nonFsm: { reading: 71, writing: 59, maths: 76, combined: 53 },
        gd: { reading: 8, writing: 0, maths: 8, combined: 0 },
      },
    ],
  },
  {
    school: 'CHPS',
    yearGroups: [
      {
        yearGroup: 'EYFS',
        cohortSize: 90,
        allPupils: { reading: 54, writing: 38, maths: 58, combined: null },
        fsm6: { reading: 42, writing: 27, maths: 46, combined: null },
        nonFsm: { reading: 59, writing: 42, maths: 63, combined: null },
        gd: { reading: 0, writing: 0, maths: 0, combined: null },
        gld: 38,
      },
      {
        yearGroup: 'Y1',
        cohortSize: 87,
        allPupils: { reading: 61, writing: 45, maths: 62, combined: 40 },
        fsm6: { reading: 48, writing: 30, maths: 48, combined: 26 },
        nonFsm: { reading: 66, writing: 51, maths: 68, combined: 46 },
        gd: { reading: 5, writing: 1, maths: 3, combined: 1 },
        phonics: 59,
      },
      {
        yearGroup: 'Y2',
        cohortSize: 98,
        allPupils: { reading: 62, writing: 49, maths: 67, combined: 47 },
        fsm6: { reading: 50, writing: 36, maths: 54, combined: 32 },
        nonFsm: { reading: 67, writing: 54, maths: 72, combined: 53 },
        gd: { reading: 8, writing: 2, maths: 8, combined: 2 },
        phonics: 78,
      },
      {
        yearGroup: 'Y3',
        cohortSize: 95,
        allPupils: { reading: 56, writing: 43, maths: 59, combined: 39 },
        fsm6: { reading: 39, writing: 29, maths: 43, combined: 25 },
        nonFsm: { reading: 63, writing: 49, maths: 66, combined: 45 },
        gd: { reading: 5, writing: 1, maths: 6, combined: 1 },
      },
      {
        yearGroup: 'Y4',
        cohortSize: 98,
        allPupils: { reading: 63, writing: 50, maths: 64, combined: 46 },
        fsm6: { reading: 46, writing: 33, maths: 46, combined: 29 },
        nonFsm: { reading: 71, writing: 57, maths: 72, combined: 54 },
        gd: { reading: 7, writing: 1, maths: 5, combined: 1 },
        mtc: 60,
      },
      {
        yearGroup: 'Y5',
        cohortSize: 100,
        allPupils: { reading: 67, writing: 55, maths: 65, combined: 51 },
        fsm6: { reading: 50, writing: 37, maths: 47, combined: 33 },
        nonFsm: { reading: 74, writing: 62, maths: 73, combined: 59 },
        gd: { reading: 8, writing: 2, maths: 7, combined: 2 },
      },
      {
        yearGroup: 'Y6',
        cohortSize: 94,
        allPupils: { reading: 71, writing: 67, maths: 69, combined: 51 },
        fsm6: { reading: 55, writing: 52, maths: 52, combined: 35 },
        nonFsm: { reading: 78, writing: 73, maths: 76, combined: 58 },
        gd: { reading: 10, writing: 3, maths: 9, combined: 3 },
      },
    ],
  },
  {
    school: 'FPS',
    yearGroups: [
      {
        yearGroup: 'EYFS',
        cohortSize: 60,
        allPupils: { reading: 58, writing: 42, maths: 62, combined: null },
        fsm6: { reading: 44, writing: 28, maths: 50, combined: null },
        nonFsm: { reading: 63, writing: 47, maths: 66, combined: null },
        gd: { reading: 0, writing: 0, maths: 0, combined: null },
        gld: 42,
      },
      {
        yearGroup: 'Y1',
        cohortSize: 62,
        allPupils: { reading: 65, writing: 47, maths: 66, combined: 44 },
        fsm6: { reading: 50, writing: 31, maths: 50, combined: 28 },
        nonFsm: { reading: 70, writing: 52, maths: 72, combined: 49 },
        gd: { reading: 6, writing: 2, maths: 5, combined: 2 },
        phonics: 63,
      },
      {
        yearGroup: 'Y2',
        cohortSize: 65,
        allPupils: { reading: 66, writing: 52, maths: 69, combined: 49 },
        fsm6: { reading: 47, writing: 33, maths: 53, combined: 33 },
        nonFsm: { reading: 73, writing: 59, maths: 75, combined: 55 },
        gd: { reading: 8, writing: 2, maths: 8, combined: 2 },
        phonics: 82,
      },
      {
        yearGroup: 'Y3',
        cohortSize: 63,
        allPupils: { reading: 60, writing: 46, maths: 65, combined: 43 },
        fsm6: { reading: 40, writing: 27, maths: 47, combined: 27 },
        nonFsm: { reading: 67, writing: 52, maths: 72, combined: 49 },
        gd: { reading: 6, writing: 2, maths: 8, combined: 2 },
      },
      {
        yearGroup: 'Y4',
        cohortSize: 68,
        allPupils: { reading: 68, writing: 53, maths: 66, combined: 49 },
        fsm6: { reading: 50, writing: 33, maths: 44, combined: 28 },
        nonFsm: { reading: 74, writing: 60, maths: 74, combined: 57 },
        gd: { reading: 7, writing: 1, maths: 6, combined: 1 },
        mtc: 65,
      },
      {
        yearGroup: 'Y5',
        cohortSize: 66,
        allPupils: { reading: 70, writing: 55, maths: 68, combined: 52 },
        fsm6: { reading: 53, writing: 35, maths: 47, combined: 29 },
        nonFsm: { reading: 76, writing: 62, maths: 76, combined: 60 },
        gd: { reading: 9, writing: 2, maths: 6, combined: 2 },
      },
      {
        yearGroup: 'Y6',
        cohortSize: 64,
        allPupils: { reading: 73, writing: 59, maths: 73, combined: 56 },
        fsm6: { reading: 56, writing: 38, maths: 56, combined: 31 },
        nonFsm: { reading: 80, writing: 67, maths: 80, combined: 67 },
        gd: { reading: 11, writing: 2, maths: 8, combined: 2 },
      },
    ],
  },
  {
    school: 'GHPS',
    yearGroups: [
      // NOTE: GHPS submitted NO EYFS data — flagged as data quality issue
      {
        yearGroup: 'Y1',
        cohortSize: 57,
        allPupils: { reading: 65, writing: 47, maths: 67, combined: 44 },
        fsm6: { reading: 47, writing: 27, maths: 53, combined: 27 },
        nonFsm: { reading: 71, writing: 54, maths: 73, combined: 51 },
        gd: { reading: 7, writing: 2, maths: 9, combined: 2 },
        phonics: 63,
      },
      {
        yearGroup: 'Y2',
        cohortSize: 60,
        allPupils: { reading: 65, writing: 53, maths: 68, combined: 50 },
        fsm6: { reading: 50, writing: 38, maths: 56, combined: 31 },
        nonFsm: { reading: 71, writing: 60, maths: 74, combined: 57 },
        gd: { reading: 10, writing: 3, maths: 10, combined: 3 },
        phonics: 80,
      },
      {
        yearGroup: 'Y3',
        cohortSize: 58,
        allPupils: { reading: 62, writing: 48, maths: 66, combined: 45 },
        fsm6: { reading: 44, writing: 31, maths: 50, combined: 25 },
        nonFsm: { reading: 69, writing: 54, maths: 72, combined: 51 },
        gd: { reading: 7, writing: 2, maths: 9, combined: 2 },
      },
      {
        yearGroup: 'Y4',
        cohortSize: 62,
        allPupils: { reading: 68, writing: 55, maths: 71, combined: 52 },
        fsm6: { reading: 47, writing: 33, maths: 53, combined: 27 },
        nonFsm: { reading: 76, writing: 63, maths: 78, combined: 61 },
        gd: { reading: 10, writing: 3, maths: 13, combined: 3 },
        mtc: 68,
      },
      {
        yearGroup: 'Y5',
        cohortSize: 56,
        allPupils: { reading: 70, writing: 59, maths: 73, combined: 55 },
        fsm6: { reading: 50, writing: 38, maths: 56, combined: 31 },
        nonFsm: { reading: 78, writing: 67, maths: 80, combined: 64 },
        gd: { reading: 11, writing: 4, maths: 13, combined: 4 },
      },
      {
        yearGroup: 'Y6',
        cohortSize: 58,
        allPupils: { reading: 76, writing: 69, maths: 78, combined: 66 },
        fsm6: { reading: 56, writing: 50, maths: 56, combined: 44 },
        nonFsm: { reading: 85, writing: 77, maths: 88, combined: 74 },
        gd: { reading: 14, writing: 5, maths: 17, combined: 5 },
      },
    ],
  },
  {
    school: 'HPS',
    yearGroups: [
      {
        yearGroup: 'EYFS',
        cohortSize: 60,
        allPupils: { reading: 68, writing: 52, maths: 70, combined: null },
        fsm6: { reading: 53, writing: 33, maths: 53, combined: null },
        nonFsm: { reading: 73, writing: 58, maths: 75, combined: null },
        gd: { reading: 0, writing: 0, maths: 0, combined: null },
        gld: 52,
      },
      {
        yearGroup: 'Y1',
        cohortSize: 68,
        allPupils: { reading: 72, writing: 57, maths: 74, combined: 54 },
        fsm6: { reading: 57, writing: 36, maths: 57, combined: 29 },
        nonFsm: { reading: 78, writing: 64, maths: 80, combined: 62 },
        gd: { reading: 10, writing: 3, maths: 12, combined: 3 },
        phonics: 74,
      },
      {
        yearGroup: 'Y2',
        cohortSize: 70,
        allPupils: { reading: 73, writing: 60, maths: 76, combined: 57 },
        fsm6: { reading: 56, writing: 44, maths: 61, combined: 39 },
        nonFsm: { reading: 80, writing: 67, maths: 82, combined: 65 },
        gd: { reading: 13, writing: 4, maths: 14, combined: 4 },
        phonics: 86,
      },
      {
        yearGroup: 'Y3',
        cohortSize: 72,
        allPupils: { reading: 69, writing: 56, maths: 72, combined: 53 },
        fsm6: { reading: 50, writing: 36, maths: 57, combined: 29 },
        nonFsm: { reading: 76, writing: 63, maths: 78, combined: 62 },
        gd: { reading: 11, writing: 3, maths: 11, combined: 3 },
      },
      {
        yearGroup: 'Y4',
        cohortSize: 68,
        allPupils: { reading: 74, writing: 62, maths: 76, combined: 59 },
        fsm6: { reading: 53, writing: 40, maths: 60, combined: 33 },
        nonFsm: { reading: 82, writing: 71, maths: 82, combined: 69 },
        gd: { reading: 12, writing: 4, maths: 15, combined: 4 },
        mtc: 76,
      },
      {
        yearGroup: 'Y5',
        cohortSize: 65,
        allPupils: { reading: 75, writing: 63, maths: 77, combined: 60 },
        fsm6: { reading: 56, writing: 44, maths: 56, combined: 38 },
        nonFsm: { reading: 82, writing: 70, maths: 85, combined: 69 },
        gd: { reading: 14, writing: 5, maths: 14, combined: 5 },
      },
      {
        yearGroup: 'Y6',
        cohortSize: 64,
        allPupils: { reading: 80, writing: 72, maths: 83, combined: 71 },
        fsm6: { reading: 63, writing: 56, maths: 69, combined: 50 },
        nonFsm: { reading: 87, writing: 80, maths: 89, combined: 78 },
        gd: { reading: 16, writing: 6, maths: 19, combined: 6 },
      },
    ],
  },
  {
    school: 'LPS',
    yearGroups: [
      {
        yearGroup: 'EYFS',
        cohortSize: 12,
        allPupils: { reading: 58, writing: 42, maths: 58, combined: null },
        fsm6: { reading: 43, writing: 29, maths: 43, combined: null },
        nonFsm: { reading: 71, writing: 57, maths: 71, combined: null },
        gd: { reading: 0, writing: 0, maths: 0, combined: null },
        gld: 42,
      },
      {
        yearGroup: 'Y1',
        cohortSize: 13,
        allPupils: { reading: 62, writing: 46, maths: 62, combined: 38 },
        fsm6: { reading: 43, writing: 29, maths: 43, combined: 14 },
        nonFsm: { reading: 83, writing: 67, maths: 83, combined: 67 },
        gd: { reading: 8, writing: 0, maths: 8, combined: 0 },
        phonics: 54,
      },
      {
        yearGroup: 'Y2',
        cohortSize: 14,
        allPupils: { reading: 64, writing: 50, maths: 64, combined: 43 },
        fsm6: { reading: 50, writing: 33, maths: 50, combined: 17 },
        nonFsm: { reading: 75, writing: 63, maths: 75, combined: 63 },
        gd: { reading: 7, writing: 0, maths: 7, combined: 0 },
        phonics: 77,
      },
      {
        yearGroup: 'Y3',
        cohortSize: 11,
        allPupils: { reading: 55, writing: 36, maths: 55, combined: 36 },
        fsm6: { reading: 40, writing: 20, maths: 40, combined: 20 },
        nonFsm: { reading: 67, writing: 50, maths: 67, combined: 50 },
        gd: { reading: 0, writing: 0, maths: 0, combined: 0 },
      },
      {
        yearGroup: 'Y4',
        cohortSize: 13,
        allPupils: { reading: 62, writing: 46, maths: 62, combined: 38 },
        fsm6: { reading: 43, writing: 29, maths: 43, combined: 14 },
        nonFsm: { reading: 83, writing: 67, maths: 83, combined: 67 },
        gd: { reading: 8, writing: 0, maths: 8, combined: 0 },
        mtc: 54,
      },
      {
        yearGroup: 'Y5',
        cohortSize: 12,
        allPupils: { reading: 58, writing: 42, maths: 58, combined: 33 },
        fsm6: { reading: 43, writing: 14, maths: 43, combined: 14 },
        nonFsm: { reading: 80, writing: 80, maths: 80, combined: 60 },
        gd: { reading: 0, writing: 0, maths: 0, combined: 0 },
      },
      {
        yearGroup: 'Y6',
        cohortSize: 11,
        allPupils: { reading: 64, writing: 55, maths: 64, combined: 55 },
        fsm6: { reading: 50, writing: 33, maths: 50, combined: 33 },
        nonFsm: { reading: 83, writing: 83, maths: 83, combined: 83 },
        gd: { reading: 0, writing: 0, maths: 0, combined: 0 },
      },
    ],
  },
  {
    school: 'LGPS',
    yearGroups: [
      {
        yearGroup: 'EYFS',
        cohortSize: 72,
        allPupils: { reading: 53, writing: 36, maths: 57, combined: null },
        fsm6: { reading: 36, writing: 20, maths: 40, combined: null },
        nonFsm: { reading: 62, writing: 44, maths: 66, combined: null },
        gd: { reading: 0, writing: 0, maths: 0, combined: null },
        gld: 36,
      },
      {
        yearGroup: 'Y1',
        cohortSize: 75,
        allPupils: { reading: 56, writing: 39, maths: 59, combined: 36 },
        fsm6: { reading: 38, writing: 21, maths: 41, combined: 17 },
        nonFsm: { reading: 65, writing: 48, maths: 67, combined: 44 },
        gd: { reading: 4, writing: 0, maths: 3, combined: 0 },
        phonics: 53,
      },
      {
        yearGroup: 'Y2',
        cohortSize: 78,
        allPupils: { reading: 59, writing: 44, maths: 62, combined: 41 },
        fsm6: { reading: 41, writing: 26, maths: 44, combined: 22 },
        nonFsm: { reading: 68, writing: 53, maths: 72, combined: 51 },
        gd: { reading: 5, writing: 1, maths: 5, combined: 1 },
        phonics: 71,
      },
      {
        yearGroup: 'Y3',
        cohortSize: 76,
        allPupils: { reading: 53, writing: 37, maths: 55, combined: 33 },
        fsm6: { reading: 35, writing: 19, maths: 35, combined: 15 },
        nonFsm: { reading: 62, writing: 46, maths: 65, combined: 42 },
        gd: { reading: 3, writing: 0, maths: 3, combined: 0 },
      },
      {
        yearGroup: 'Y4',
        cohortSize: 74,
        allPupils: { reading: 58, writing: 43, maths: 59, combined: 39 },
        fsm6: { reading: 38, writing: 23, maths: 38, combined: 19 },
        nonFsm: { reading: 68, writing: 53, maths: 70, combined: 49 },
        gd: { reading: 5, writing: 1, maths: 4, combined: 1 },
        mtc: 55,
      },
      {
        yearGroup: 'Y5',
        cohortSize: 73,
        allPupils: { reading: 55, writing: 33, maths: 52, combined: 25 },
        fsm6: { reading: 36, writing: 14, maths: 32, combined: 9 },
        nonFsm: { reading: 65, writing: 43, maths: 63, combined: 33 },
        gd: { reading: 4, writing: 0, maths: 3, combined: 0 },
      },
      {
        yearGroup: 'Y6',
        cohortSize: 70,
        allPupils: { reading: 63, writing: 51, maths: 60, combined: 44 },
        fsm6: { reading: 44, writing: 33, maths: 40, combined: 24 },
        nonFsm: { reading: 72, writing: 60, maths: 70, combined: 55 },
        gd: { reading: 6, writing: 1, maths: 4, combined: 1 },
      },
    ],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/lib/trust-analysis/pennine-data.ts
git commit -m "feat(trust-analysis): add hardcoded Pennine self-reported teacher assessment data"
```

---

## Task 3: Analysis Logic

**Files:**
- Create: `apps/platform/src/lib/trust-analysis/analysis.ts`

- [ ] **Step 1: Create analysis functions**

```typescript
// apps/platform/src/lib/trust-analysis/analysis.ts
import {
  SchoolSelfReport, KS2Result, CensusRecord, DivergenceFlag,
  DataQualityFlag, DisadvantageGap, RAGStatus, YearGroup,
  PENNINE_SCHOOLS, getSchoolByAbbrev,
} from './types';

// ─── Divergence Analysis (Layer 2) ──────────────────────────────────

/** Compare Y6 self-reported mid-year data against previous year's validated SATs */
export function calculateDivergences(
  selfReports: SchoolSelfReport[],
  ks2Results: KS2Result[],
): DivergenceFlag[] {
  const flags: DivergenceFlag[] = [];

  for (const report of selfReports) {
    const y6 = report.yearGroups.find(yg => yg.yearGroup === 'Y6');
    if (!y6) continue;

    const school = getSchoolByAbbrev(report.school);
    if (!school) continue;

    // Get 2025 validated results for this school (All pupils)
    const validated2025 = ks2Results.filter(
      r => r.urn === school.urn &&
        r.academicYearEnd === 2025 &&
        r.breakdownTopic === 'All pupils',
    );

    const subjectMap: Record<string, { selfKey: keyof typeof y6.allPupils; dfeSubject: string }> = {
      Reading: { selfKey: 'reading', dfeSubject: 'Reading' },
      Writing: { selfKey: 'writing', dfeSubject: 'Writing' },
      Maths: { selfKey: 'maths', dfeSubject: 'Maths' },
      Combined: { selfKey: 'combined', dfeSubject: 'Reading, writing and maths' },
    };

    for (const [label, map] of Object.entries(subjectMap)) {
      const selfPct = y6.allPupils[map.selfKey];
      const dfe = validated2025.find(r => r.subject === map.dfeSubject);
      const validatedPct = dfe?.expectedStandardPct;

      if (selfPct == null || validatedPct == null) continue;

      const divergence = selfPct - validatedPct;
      const absDivergence = Math.abs(divergence);
      const rag: RAGStatus = absDivergence >= 20 ? 'red' : absDivergence >= 10 ? 'amber' : 'green';

      const direction = divergence > 0 ? 'above' : 'below';
      const narrative = divergence === 0
        ? `Mid-year TA matches 2025 validated results at ${selfPct}%.`
        : `Mid-year TA is ${absDivergence}pp ${direction} 2025 SATs (${selfPct}% vs ${validatedPct}%). ${
            divergence > 15
              ? 'What evidence supports this significant improvement claim?'
              : divergence < -10
                ? 'This suggests a weaker cohort or more conservative TA.'
                : ''
          }`;

      flags.push({
        school: report.school,
        subject: label,
        selfReportedPct: selfPct,
        validatedPct,
        divergencePp: divergence,
        rag,
        narrative,
      });
    }
  }

  return flags;
}

// ─── Data Quality Flags ─────────────────────────────────────────────

export function detectDataQualityIssues(selfReports: SchoolSelfReport[]): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];

  for (const report of selfReports) {
    const school = getSchoolByAbbrev(report.school);
    if (!school) continue;

    // Check for missing EYFS
    const hasEyfs = report.yearGroups.some(yg => yg.yearGroup === 'EYFS');
    if (!hasEyfs) {
      flags.push({
        school: report.school,
        yearGroup: 'EYFS',
        issue: 'No EYFS data submitted. GLD data missing for baseline analysis.',
        severity: 'error',
      });
    }

    for (const yg of report.yearGroups) {
      // Small cohort warning
      if (yg.cohortSize < 15) {
        flags.push({
          school: report.school,
          yearGroup: yg.yearGroup,
          issue: `Very small cohort (${yg.cohortSize}). Each pupil = ${(100 / yg.cohortSize).toFixed(1)}pp. Data is statistically unreliable.`,
          severity: 'warning',
        });
      }

      // Missing subjects
      const { reading, writing, maths } = yg.allPupils;
      if (reading == null || writing == null || maths == null) {
        flags.push({
          school: report.school,
          yearGroup: yg.yearGroup,
          issue: 'Missing core subject data (R/W/M).',
          severity: 'error',
        });
      }

      // Zero GD in Writing
      if (yg.gd.writing === 0 && yg.yearGroup !== 'EYFS') {
        flags.push({
          school: report.school,
          yearGroup: yg.yearGroup,
          issue: 'Zero Greater Depth in Writing. Is TA too conservative or is challenge insufficient?',
          severity: 'warning',
        });
      }

      // Phonics check
      if ((yg.yearGroup === 'Y1' || yg.yearGroup === 'Y2') && yg.phonics == null) {
        flags.push({
          school: report.school,
          yearGroup: yg.yearGroup,
          issue: 'No phonics data submitted.',
          severity: 'warning',
        });
      }

      // MTC check
      if (yg.yearGroup === 'Y4' && yg.mtc == null) {
        flags.push({
          school: report.school,
          yearGroup: yg.yearGroup,
          issue: 'No Multiplication Tables Check data submitted.',
          severity: 'warning',
        });
      }
    }

    // Check overall school FSM — high deprivation flag
    if (school.fsmPct >= 40) {
      flags.push({
        school: report.school,
        yearGroup: 'Y6',
        issue: `High deprivation (${school.fsmPct}% FSM). National comparisons should use similar-school benchmarks.`,
        severity: 'warning',
      });
    }
  }

  return flags;
}

// ─── Disadvantage Gap Analysis ──────────────────────────────────────

export function calculateDisadvantageGaps(selfReports: SchoolSelfReport[]): DisadvantageGap[] {
  const gaps: DisadvantageGap[] = [];

  for (const report of selfReports) {
    // Use Y6 for the main gap analysis
    const y6 = report.yearGroups.find(yg => yg.yearGroup === 'Y6');
    if (!y6) continue;

    for (const subject of ['reading', 'writing', 'maths', 'combined'] as const) {
      const fsmPct = y6.fsm6[subject];
      const nonFsmPct = y6.nonFsm[subject];
      const gapPp = fsmPct != null && nonFsmPct != null ? nonFsmPct - fsmPct : null;

      gaps.push({
        school: report.school,
        subject: subject.charAt(0).toUpperCase() + subject.slice(1),
        fsmPct,
        nonFsmPct,
        gapPp,
      });
    }
  }

  return gaps;
}

// ─── Heatmap Data ───────────────────────────────────────────────────

export interface HeatmapCell {
  school: string;
  yearGroup: YearGroup;
  subject: string;
  value: number | null;
  rag: RAGStatus;
}

export function buildHeatmapData(
  selfReports: SchoolSelfReport[],
  subject: keyof import('./types').SubjectScores,
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];

  for (const report of selfReports) {
    for (const yg of report.yearGroups) {
      const value = yg.allPupils[subject];
      const rag: RAGStatus = value == null
        ? 'red'
        : value >= 70 ? 'green' : value >= 50 ? 'amber' : 'red';

      cells.push({
        school: report.school,
        yearGroup: yg.yearGroup,
        subject: subject.charAt(0).toUpperCase() + subject.slice(1),
        value,
        rag,
      });
    }
  }

  return cells;
}

// ─── Census Trend Helper ────────────────────────────────────────────

export interface CensusTrend {
  urn: number;
  school: string;
  years: { year: number; nor: number; fsmPct: number | null; ealPct: number | null }[];
}

export function buildCensusTrends(census: CensusRecord[]): CensusTrend[] {
  const byUrn = new Map<number, CensusRecord[]>();
  for (const c of census) {
    const arr = byUrn.get(c.urn) ?? [];
    arr.push(c);
    byUrn.set(c.urn, arr);
  }

  const trends: CensusTrend[] = [];
  for (const [urn, records] of byUrn) {
    const school = PENNINE_SCHOOLS.find(s => s.urn === urn);
    if (!school) continue;

    trends.push({
      urn,
      school: school.abbrev,
      years: records
        .sort((a, b) => a.academicYearEnd - b.academicYearEnd)
        .map(r => ({
          year: r.academicYearEnd,
          nor: r.numberOnRoll,
          fsmPct: r.fsmPct,
          ealPct: r.ealPct,
        })),
    });
  }

  return trends;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/lib/trust-analysis/analysis.ts
git commit -m "feat(trust-analysis): add analysis logic — divergence, data quality, gaps, heatmap"
```

---

## Task 4: School Narrative Generator

**Files:**
- Create: `apps/platform/src/lib/trust-analysis/school-narratives.ts`

- [ ] **Step 1: Create narrative generator**

```typescript
// apps/platform/src/lib/trust-analysis/school-narratives.ts
import {
  SchoolNarrative, SchoolSelfReport, KS2Result, CensusRecord,
  DivergenceFlag, DataQualityFlag, getSchoolByAbbrev,
} from './types';

export function generateSchoolNarrative(
  report: SchoolSelfReport,
  ks2Results: KS2Result[],
  census: CensusRecord[],
  divergences: DivergenceFlag[],
  qualityFlags: DataQualityFlag[],
): SchoolNarrative {
  const school = getSchoolByAbbrev(report.school);
  if (!school) {
    return { school: report.school, strengths: [], concerns: [], ofstedQuestions: [], overallAssessment: 'Unknown school.' };
  }

  const strengths: string[] = [];
  const concerns: string[] = [];
  const ofstedQuestions: string[] = [];

  const y6 = report.yearGroups.find(yg => yg.yearGroup === 'Y6');
  const schoolDiv = divergences.filter(d => d.school === report.school);
  const schoolFlags = qualityFlags.filter(f => f.school === report.school);

  // ─── Y6 Analysis ──────────────────────────────────────────────────
  if (y6) {
    const { reading, writing, maths, combined } = y6.allPupils;

    if (combined != null && combined >= 70) {
      strengths.push(`Strong Y6 Combined at ${combined}% — above national average.`);
    } else if (combined != null && combined < 50) {
      concerns.push(`Y6 Combined at only ${combined}% — well below national average (59%).`);
    }

    if (writing != null && writing < 60) {
      concerns.push(`Writing remains a weakness at ${writing}% ARE. This is a trust-wide pattern.`);
    }

    // GD analysis
    if (y6.gd.writing === 0) {
      concerns.push('Zero Greater Depth in Writing in Y6. Is there sufficient challenge for higher-attaining pupils?');
      ofstedQuestions.push('What strategies are in place to move more pupils to Greater Depth in Writing?');
    }
  }

  // ─── Divergence Flags ─────────────────────────────────────────────
  const redFlags = schoolDiv.filter(d => d.rag === 'red');
  for (const flag of redFlags) {
    concerns.push(`${flag.subject}: Mid-year TA (${flag.selfReportedPct}%) diverges significantly from 2025 SATs (${flag.validatedPct}%). ${flag.divergencePp > 0 ? 'Claimed improvement' : 'Decline'} of ${Math.abs(flag.divergencePp)}pp.`);
    ofstedQuestions.push(`What evidence supports the ${Math.abs(flag.divergencePp)}pp ${flag.divergencePp > 0 ? 'improvement' : 'decline'} in ${flag.subject} since last year's SATs?`);
  }

  // ─── Data Quality ─────────────────────────────────────────────────
  const errors = schoolFlags.filter(f => f.severity === 'error');
  for (const flag of errors) {
    concerns.push(`Data quality: ${flag.issue}`);
  }

  // ─── FSM Analysis ─────────────────────────────────────────────────
  if (y6) {
    const fsmGap = (y6.nonFsm.combined ?? 0) - (y6.fsm6.combined ?? 0);
    if (fsmGap > 20) {
      concerns.push(`Disadvantage gap in Combined is ${fsmGap}pp (FSM6 ${y6.fsm6.combined}% vs Non-FSM ${y6.nonFsm.combined}%).`);
      ofstedQuestions.push('How is Pupil Premium funding being targeted to close the attainment gap in core subjects?');
    } else if (fsmGap <= 10 && fsmGap >= 0) {
      strengths.push(`Narrow disadvantage gap of only ${fsmGap}pp in Combined — effective use of PP funding.`);
    }
  }

  // ─── Census Context ───────────────────────────────────────────────
  const schoolCensus = census.filter(c => c.urn === school.urn).sort((a, b) => a.academicYearEnd - b.academicYearEnd);
  if (schoolCensus.length >= 2) {
    const oldest = schoolCensus[0];
    const newest = schoolCensus[schoolCensus.length - 1];
    const fsmChange = (newest.fsmPct ?? 0) - (oldest.fsmPct ?? 0);
    if (fsmChange > 10) {
      concerns.push(`FSM has risen ${fsmChange.toFixed(1)}pp over ${newest.academicYearEnd - oldest.academicYearEnd} years (${oldest.fsmPct}% to ${newest.fsmPct}%). This changing demographic context should frame all attainment analysis.`);
      ofstedQuestions.push('How has the school adapted its provision as the proportion of disadvantaged pupils has increased?');
    }
  }

  // Small cohort caveat
  if (school.nor < 100) {
    concerns.push(`Very small school (${school.nor} NOR). Percentage swings are statistically unreliable — each pupil represents ${(100 / (school.nor / 7)).toFixed(1)}pp per year group.`);
  }

  // ─── Trajectory analysis across year groups ────────────────────────
  const combinedByYear = report.yearGroups
    .filter(yg => yg.allPupils.combined != null)
    .map(yg => ({ yg: yg.yearGroup, pct: yg.allPupils.combined! }));

  if (combinedByYear.length >= 3) {
    const last3 = combinedByYear.slice(-3);
    const trend = last3[last3.length - 1].pct - last3[0].pct;
    if (trend > 10) {
      strengths.push(`Upward trajectory in Combined across ${last3[0].yg} to ${last3[last3.length - 1].yg} (+${trend}pp).`);
    } else if (trend < -10) {
      concerns.push(`Declining trajectory in Combined from ${last3[0].yg} to ${last3[last3.length - 1].yg} (${trend}pp).`);
      ofstedQuestions.push('What interventions are planned for the year groups showing declining Combined attainment?');
    }
  }

  // ─── Overall Assessment ───────────────────────────────────────────
  const overallAssessment = concerns.length === 0
    ? 'This school shows strong performance across key metrics with no significant concerns.'
    : concerns.length <= 2
      ? 'Some areas for development identified. The school should address the flagged concerns as part of its school development plan.'
      : 'Multiple concerns identified. This school requires focused school improvement support, particularly in the areas flagged above.';

  return { school: report.school, strengths, concerns, ofstedQuestions, overallAssessment };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/lib/trust-analysis/school-narratives.ts
git commit -m "feat(trust-analysis): add per-school narrative report generator"
```

---

## Task 5: API Route — Fetch DfE Data from Supabase

**Files:**
- Create: `apps/platform/src/app/api/trust-analysis/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
// apps/platform/src/app/api/trust-analysis/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { PENNINE_URNS, KS2Result, CensusRecord, DfEData } from '@/lib/trust-analysis/types';

export const GET = protectedRoute(async (_auth, _req: NextRequest) => {
  const supabase = createServiceRoleClient();

  // Fetch KS2 results for all Pennine schools
  const { data: ks2Raw, error: ks2Error } = await supabase
    .from('ks2_results')
    .select('urn, academic_year_end, subject, breakdown_topic, breakdown, expected_standard_pct, higher_standard_pct, average_scaled_score, progress_measure_score')
    .in('urn', PENNINE_URNS)
    .order('urn')
    .order('academic_year_end', { ascending: false });

  if (ks2Error) {
    return apiError(`Failed to fetch KS2 data: ${ks2Error.message}`, 500);
  }

  // Fetch census data
  const { data: censusRaw, error: censusError } = await supabase
    .from('census')
    .select('urn, academic_year_end, number_on_roll, fsm_pct, eal_pct, sen_pct')
    .in('urn', PENNINE_URNS)
    .order('urn')
    .order('academic_year_end', { ascending: false });

  if (censusError) {
    return apiError(`Failed to fetch census data: ${censusError.message}`, 500);
  }

  // Transform snake_case DB rows to camelCase types
  const ks2Results: KS2Result[] = (ks2Raw ?? []).map((r: Record<string, unknown>) => ({
    urn: r.urn as number,
    academicYearEnd: r.academic_year_end as number,
    subject: r.subject as string,
    breakdownTopic: r.breakdown_topic as string,
    breakdown: r.breakdown as string,
    expectedStandardPct: r.expected_standard_pct != null ? Number(r.expected_standard_pct) : null,
    higherStandardPct: r.higher_standard_pct != null ? Number(r.higher_standard_pct) : null,
    averageScaledScore: r.average_scaled_score != null ? Number(r.average_scaled_score) : null,
    progressMeasureScore: r.progress_measure_score != null ? Number(r.progress_measure_score) : null,
  }));

  const census: CensusRecord[] = (censusRaw ?? []).map((r: Record<string, unknown>) => ({
    urn: r.urn as number,
    academicYearEnd: r.academic_year_end as number,
    numberOnRoll: r.number_on_roll as number,
    fsmPct: r.fsm_pct != null ? Number(r.fsm_pct) : null,
    ealPct: r.eal_pct != null ? Number(r.eal_pct) : null,
    senPct: r.sen_pct != null ? Number(r.sen_pct) : null,
  }));

  const data: DfEData = { ks2Results, census };
  return apiSuccess(data);
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/app/api/trust-analysis/route.ts
git commit -m "feat(trust-analysis): add API route to fetch DfE KS2 + census from Supabase"
```

---

## Task 6: Trust Overview Heatmap Component

**Files:**
- Create: `apps/platform/src/components/trust-analysis/TrustOverviewHeatmap.tsx`

- [ ] **Step 1: Build the heatmap component**

This is the centrepiece visual — a colour-coded grid showing all 7 schools across all year groups for a selected subject.

```typescript
// apps/platform/src/components/trust-analysis/TrustOverviewHeatmap.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SchoolSelfReport, PENNINE_SCHOOLS, YEAR_GROUPS, YearGroup, Subject, CORE_SUBJECTS } from '@/lib/trust-analysis/types';

interface Props {
  selfReports: SchoolSelfReport[];
}

function getCellColor(value: number | null): string {
  if (value == null) return 'bg-gray-100 text-gray-400';
  if (value >= 80) return 'bg-emerald-500 text-white';
  if (value >= 70) return 'bg-emerald-400 text-white';
  if (value >= 60) return 'bg-amber-400 text-gray-900';
  if (value >= 50) return 'bg-amber-500 text-white';
  if (value >= 40) return 'bg-red-400 text-white';
  return 'bg-red-600 text-white';
}

function getSubjectKey(subject: Subject): 'reading' | 'writing' | 'maths' | 'combined' {
  return subject.toLowerCase() as 'reading' | 'writing' | 'maths' | 'combined';
}

export default function TrustOverviewHeatmap({ selfReports }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Combined');

  return (
    <div className="space-y-4">
      {/* Subject selector */}
      <div className="flex gap-2">
        {CORE_SUBJECTS.map(subject => (
          <button
            key={subject}
            onClick={() => setSelectedSubject(subject)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedSubject === subject
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-500 w-32">School</th>
              {YEAR_GROUPS.map(yg => (
                <th key={yg} className="p-3 text-sm font-medium text-gray-500 text-center">{yg}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PENNINE_SCHOOLS.map((school, schoolIdx) => {
              const report = selfReports.find(r => r.school === school.abbrev);
              return (
                <motion.tr
                  key={school.abbrev}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: schoolIdx * 0.05 }}
                  className="border-t border-gray-100"
                >
                  <td className="p-3">
                    <div className="text-sm font-semibold text-gray-900">{school.abbrev}</div>
                    <div className="text-xs text-gray-500">{school.nor} NOR</div>
                  </td>
                  {YEAR_GROUPS.map(yg => {
                    const ygData = report?.yearGroups.find(y => y.yearGroup === yg);
                    const key = getSubjectKey(selectedSubject);
                    const value = ygData?.allPupils[key] ?? null;
                    return (
                      <td key={yg} className="p-1 text-center">
                        <motion.div
                          className={`rounded-lg p-3 text-sm font-bold ${getCellColor(value)}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: schoolIdx * 0.05 + 0.1 }}
                          title={`${school.abbrev} ${yg} ${selectedSubject}: ${value ?? 'No data'}%`}
                        >
                          {value != null ? `${value}%` : '—'}
                        </motion.div>
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Legend:</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-500" /> 80%+</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-400" /> 70-79%</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-amber-400" /> 60-69%</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-amber-500" /> 50-59%</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-400" /> 40-49%</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-600" /> Below 40%</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/components/trust-analysis/TrustOverviewHeatmap.tsx
git commit -m "feat(trust-analysis): add trust overview heatmap component"
```

---

## Task 7: Disadvantage Gap Table Component

**Files:**
- Create: `apps/platform/src/components/trust-analysis/DisadvantageGapTable.tsx`

- [ ] **Step 1: Build the gap table**

```typescript
// apps/platform/src/components/trust-analysis/DisadvantageGapTable.tsx
'use client';

import { motion } from 'framer-motion';
import { DisadvantageGap, PENNINE_SCHOOLS } from '@/lib/trust-analysis/types';

interface Props {
  gaps: DisadvantageGap[];
}

function getGapColor(gap: number | null): string {
  if (gap == null) return 'text-gray-400';
  if (gap <= 5) return 'text-emerald-600 font-bold';
  if (gap <= 15) return 'text-amber-600 font-bold';
  return 'text-red-600 font-bold';
}

export default function DisadvantageGapTable({ gaps }: Props) {
  const subjects = ['Reading', 'Writing', 'Maths', 'Combined'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left p-3 font-medium text-gray-500">School</th>
            {subjects.map(s => (
              <th key={s} colSpan={3} className="p-3 text-center font-medium text-gray-500 border-l border-gray-100">
                {s}
              </th>
            ))}
          </tr>
          <tr className="border-b border-gray-100 text-xs text-gray-400">
            <th />
            {subjects.map(s => (
              <React.Fragment key={s}>
                <th className="p-2 text-center border-l border-gray-100">FSM6</th>
                <th className="p-2 text-center">Non-FSM</th>
                <th className="p-2 text-center">Gap</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {PENNINE_SCHOOLS.map((school, idx) => (
            <motion.tr
              key={school.abbrev}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="border-b border-gray-50 hover:bg-gray-50"
            >
              <td className="p-3 font-semibold">{school.abbrev}</td>
              {subjects.map(subject => {
                const gap = gaps.find(g => g.school === school.abbrev && g.subject === subject);
                return (
                  <React.Fragment key={subject}>
                    <td className="p-2 text-center border-l border-gray-100">
                      {gap?.fsmPct != null ? `${gap.fsmPct}%` : '—'}
                    </td>
                    <td className="p-2 text-center">
                      {gap?.nonFsmPct != null ? `${gap.nonFsmPct}%` : '—'}
                    </td>
                    <td className={`p-2 text-center ${getGapColor(gap?.gapPp ?? null)}`}>
                      {gap?.gapPp != null ? `${gap.gapPp}pp` : '—'}
                    </td>
                  </React.Fragment>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React from 'react';
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/components/trust-analysis/DisadvantageGapTable.tsx
git commit -m "feat(trust-analysis): add disadvantage gap table component"
```

---

## Task 8: DfE Cross-Reference Panel Component

**Files:**
- Create: `apps/platform/src/components/trust-analysis/DfeCrossReference.tsx`

- [ ] **Step 1: Build the cross-reference component**

This is the "killer feature" — showing self-reported data alongside validated DfE results with RAG highlighting.

```typescript
// apps/platform/src/components/trust-analysis/DfeCrossReference.tsx
'use client';

import { motion } from 'framer-motion';
import { DivergenceFlag, PENNINE_SCHOOLS, RAGStatus } from '@/lib/trust-analysis/types';

interface Props {
  divergences: DivergenceFlag[];
}

function ragBg(rag: RAGStatus): string {
  switch (rag) {
    case 'red': return 'bg-red-50 border-red-200';
    case 'amber': return 'bg-amber-50 border-amber-200';
    case 'green': return 'bg-emerald-50 border-emerald-200';
  }
}

function ragDot(rag: RAGStatus): string {
  switch (rag) {
    case 'red': return 'bg-red-500';
    case 'amber': return 'bg-amber-500';
    case 'green': return 'bg-emerald-500';
  }
}

export default function DfeCrossReference({ divergences }: Props) {
  // Group by school
  const bySchool = new Map<string, DivergenceFlag[]>();
  for (const d of divergences) {
    const arr = bySchool.get(d.school) ?? [];
    arr.push(d);
    bySchool.set(d.school, arr);
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        Comparing Y6 mid-year teacher assessment (2025/26) against 2025 validated SATs results.
        Divergences of 20pp+ are flagged red, 10-19pp amber.
      </div>

      {PENNINE_SCHOOLS.map((school, idx) => {
        const flags = bySchool.get(school.abbrev) ?? [];
        if (flags.length === 0) return null;

        const hasRedFlag = flags.some(f => f.rag === 'red');

        return (
          <motion.div
            key={school.abbrev}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`border rounded-xl p-5 ${hasRedFlag ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">{school.name}</h3>
              <span className="text-sm text-gray-500">URN {school.urn}</span>
              {hasRedFlag && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Significant divergence
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {flags.map(flag => (
                <div
                  key={flag.subject}
                  className={`border rounded-lg p-4 ${ragBg(flag.rag)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${ragDot(flag.rag)}`} />
                    <span className="font-semibold text-gray-900">{flag.subject}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <div className="text-gray-500">Mid-Year TA</div>
                      <div className="text-lg font-bold">{flag.selfReportedPct}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">2025 SATs</div>
                      <div className="text-lg font-bold">{flag.validatedPct}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Divergence</div>
                      <div className={`text-lg font-bold ${flag.divergencePp > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {flag.divergencePp > 0 ? '+' : ''}{flag.divergencePp}pp
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{flag.narrative}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/components/trust-analysis/DfeCrossReference.tsx
git commit -m "feat(trust-analysis): add DfE cross-reference panel with RAG divergence flags"
```

---

## Task 9: Trend Charts Component

**Files:**
- Create: `apps/platform/src/components/trust-analysis/TrendCharts.tsx`

- [ ] **Step 1: Build the trend charts**

```typescript
// apps/platform/src/components/trust-analysis/TrendCharts.tsx
'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { KS2Result, CensusRecord, PENNINE_SCHOOLS } from '@/lib/trust-analysis/types';
import { CensusTrend, buildCensusTrends } from '@/lib/trust-analysis/analysis';

// School colors matching Mercury module palette
const SCHOOL_COLORS: Record<string, string> = {
  CVPS: '#6366f1', // indigo
  CHPS: '#ef4444', // red
  FPS:  '#f59e0b', // amber
  GHPS: '#3b82f6', // blue
  HPS:  '#10b981', // emerald
  LPS:  '#8b5cf6', // violet
  LGPS: '#f97316', // orange
};

interface Props {
  ks2Results: KS2Result[];
  census: CensusRecord[];
}

export default function TrendCharts({ ks2Results, census }: Props) {
  const [chartView, setChartView] = useState<'ks2-combined' | 'fsm-trend' | 'scaled-scores' | 'radar'>('ks2-combined');
  const censusTrends = buildCensusTrends(census);

  return (
    <div className="space-y-4">
      {/* Chart selector tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'ks2-combined', label: 'KS2 Combined Trend' },
          { key: 'fsm-trend', label: 'FSM % Over Time' },
          { key: 'scaled-scores', label: 'Scaled Scores 2025' },
          { key: 'radar', label: 'School Radar' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setChartView(tab.key as typeof chartView)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              chartView === tab.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={chartView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        {chartView === 'ks2-combined' && <KS2CombinedTrend ks2Results={ks2Results} />}
        {chartView === 'fsm-trend' && <FSMTrend censusTrends={censusTrends} />}
        {chartView === 'scaled-scores' && <ScaledScores2025 ks2Results={ks2Results} />}
        {chartView === 'radar' && <SchoolRadar ks2Results={ks2Results} />}
      </motion.div>
    </div>
  );
}

function KS2CombinedTrend({ ks2Results }: { ks2Results: KS2Result[] }) {
  // Build chart data: year -> school -> combined %
  const combined = ks2Results.filter(
    r => r.subject === 'Reading, writing and maths' && r.breakdownTopic === 'All pupils' && r.expectedStandardPct != null,
  );

  const years = [...new Set(combined.map(r => r.academicYearEnd))].sort();
  const chartData = years.map(year => {
    const row: Record<string, number | string> = { year: year.toString() };
    for (const school of PENNINE_SCHOOLS) {
      const val = combined.find(r => r.urn === school.urn && r.academicYearEnd === year);
      if (val?.expectedStandardPct != null) {
        row[school.abbrev] = val.expectedStandardPct;
      }
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">KS2 Combined (RWM) — Expected Standard %</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          {PENNINE_SCHOOLS.map(school => (
            <Bar
              key={school.abbrev}
              dataKey={school.abbrev}
              fill={SCHOOL_COLORS[school.abbrev]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function FSMTrend({ censusTrends }: { censusTrends: CensusTrend[] }) {
  const allYears = [...new Set(censusTrends.flatMap(t => t.years.map(y => y.year)))].sort();
  const chartData = allYears.map(year => {
    const row: Record<string, number | string> = { year: year.toString() };
    for (const trend of censusTrends) {
      const entry = trend.years.find(y => y.year === year);
      if (entry?.fsmPct != null) {
        row[trend.school] = entry.fsmPct;
      }
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Free School Meals % — 5 Year Trend</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" />
          <YAxis domain={[0, 60]} />
          <Tooltip />
          <Legend />
          {PENNINE_SCHOOLS.map(school => (
            <Line
              key={school.abbrev}
              type="monotone"
              dataKey={school.abbrev}
              stroke={SCHOOL_COLORS[school.abbrev]}
              strokeWidth={2}
              dot={{ fill: SCHOOL_COLORS[school.abbrev], r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScaledScores2025({ ks2Results }: { ks2Results: KS2Result[] }) {
  const scores2025 = ks2Results.filter(
    r => r.academicYearEnd === 2025 && r.breakdownTopic === 'All pupils' && r.averageScaledScore != null &&
      ['Reading', 'Maths', 'Grammar, punctuation and spelling'].includes(r.subject),
  );

  const chartData = PENNINE_SCHOOLS.map(school => {
    const row: Record<string, number | string> = { school: school.abbrev };
    for (const subj of ['Reading', 'Maths', 'Grammar, punctuation and spelling']) {
      const val = scores2025.find(r => r.urn === school.urn && r.subject === subj);
      const key = subj === 'Grammar, punctuation and spelling' ? 'GPS' : subj;
      row[key] = val?.averageScaledScore ?? 0;
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Average Scaled Scores — 2025 SATs</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="school" />
          <YAxis domain={[90, 115]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Reading" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Maths" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="GPS" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2">National expected standard = scaled score 100. Scores below 100 indicate below-average attainment.</p>
    </div>
  );
}

function SchoolRadar({ ks2Results }: { ks2Results: KS2Result[] }) {
  const subjects = ['Reading', 'Writing', 'Maths'];
  const data2025 = ks2Results.filter(
    r => r.academicYearEnd === 2025 && r.breakdownTopic === 'All pupils' && subjects.includes(r.subject),
  );

  const radarData = subjects.map(subject => {
    const row: Record<string, number | string> = { subject };
    for (const school of PENNINE_SCHOOLS) {
      const val = data2025.find(r => r.urn === school.urn && r.subject === subject);
      row[school.abbrev] = val?.expectedStandardPct ?? 0;
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">2025 SATs — School Comparison Radar</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis domain={[0, 100]} />
          {PENNINE_SCHOOLS.map(school => (
            <Radar
              key={school.abbrev}
              name={school.abbrev}
              dataKey={school.abbrev}
              stroke={SCHOOL_COLORS[school.abbrev]}
              fill={SCHOOL_COLORS[school.abbrev]}
              fillOpacity={0.1}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/components/trust-analysis/TrendCharts.tsx
git commit -m "feat(trust-analysis): add trend charts — KS2 combined, FSM, scaled scores, radar"
```

---

## Task 10: Data Quality Flags & School Narrative Components

**Files:**
- Create: `apps/platform/src/components/trust-analysis/DataQualityFlags.tsx`
- Create: `apps/platform/src/components/trust-analysis/SchoolNarrativeCard.tsx`

- [ ] **Step 1: Build data quality flags component**

```typescript
// apps/platform/src/components/trust-analysis/DataQualityFlags.tsx
'use client';

import { motion } from 'framer-motion';
import { DataQualityFlag } from '@/lib/trust-analysis/types';

interface Props {
  flags: DataQualityFlag[];
}

export default function DataQualityFlags({ flags }: Props) {
  const errors = flags.filter(f => f.severity === 'error');
  const warnings = flags.filter(f => f.severity === 'warning');

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
          {errors.length} errors
        </span>
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
          {warnings.length} warnings
        </span>
      </div>

      <div className="space-y-2">
        {flags.map((flag, idx) => (
          <motion.div
            key={`${flag.school}-${flag.yearGroup}-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              flag.severity === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <span className="text-lg">{flag.severity === 'error' ? '🔴' : '🟡'}</span>
            <div>
              <span className="font-semibold text-sm">{flag.school} — {flag.yearGroup}</span>
              <p className="text-sm text-gray-700">{flag.issue}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build narrative card component**

```typescript
// apps/platform/src/components/trust-analysis/SchoolNarrativeCard.tsx
'use client';

import { motion } from 'framer-motion';
import { SchoolNarrative, getSchoolByAbbrev } from '@/lib/trust-analysis/types';

interface Props {
  narrative: SchoolNarrative;
  index: number;
}

export default function SchoolNarrativeCard({ narrative, index }: Props) {
  const school = getSchoolByAbbrev(narrative.school);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-gray-200 rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold text-gray-900">{school?.name ?? narrative.school}</h3>
        {school && <span className="text-sm text-gray-500">URN {school.urn} | {school.nor} NOR | {school.fsmPct}% FSM</span>}
      </div>

      {narrative.strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">Strengths</h4>
          <ul className="space-y-1">
            {narrative.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {narrative.concerns.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">Areas for Development</h4>
          <ul className="space-y-1">
            {narrative.concerns.map((c, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">!</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {narrative.ofstedQuestions.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Questions an Inspector Might Ask</h4>
          <ul className="space-y-1">
            {narrative.ofstedQuestions.map((q, i) => (
              <li key={i} className="text-sm text-blue-900 flex items-start gap-2">
                <span className="font-bold">Q{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-gray-100 pt-3">
        <p className="text-sm text-gray-600 italic">{narrative.overallAssessment}</p>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/components/trust-analysis/DataQualityFlags.tsx apps/platform/src/components/trust-analysis/SchoolNarrativeCard.tsx
git commit -m "feat(trust-analysis): add data quality flags and school narrative card components"
```

---

## Task 11: Grove House Demo Placeholder Component

**Files:**
- Create: `apps/platform/src/components/trust-analysis/GroveHouseDemo.tsx`

- [ ] **Step 1: Build placeholder for Layer 3**

```typescript
// apps/platform/src/components/trust-analysis/GroveHouseDemo.tsx
'use client';

import { motion } from 'framer-motion';

export default function GroveHouseDemo() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🔒</span>
          <h3 className="text-lg font-bold text-amber-900">Per-Pupil Analysis — Grove House Primary Only</h3>
        </div>
        <p className="text-sm text-amber-800 mb-4">
          This layer demonstrates Schoolgle&apos;s per-pupil analysis capability using pseudonymised data from the school&apos;s MIS.
          All pupil identifiers are SHA-256 hashed with a school-local salt. Names are resolved LIVE from Google Drive only and never stored in the database.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-3xl font-bold text-gray-900">417</div>
            <div className="text-sm text-gray-500">Pupils on Roll</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-3xl font-bold text-gray-900">27.3%</div>
            <div className="text-sm text-gray-500">FSM Eligibility</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-3xl font-bold text-gray-900">39.8%</div>
            <div className="text-sm text-gray-500">EAL Pupils</div>
          </div>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">🚧</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Per-Pupil Analysis Coming Soon</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          This feature will connect to the school&apos;s Google Drive MIS exports to show individual pupil trajectories,
          SEND/PP cross-referencing, and intervention recommendations — all with zero-knowledge pseudonymisation.
        </p>
        <div className="mt-6 space-y-2 text-sm text-gray-400">
          <p>Planned capabilities:</p>
          <ul className="space-y-1">
            <li>Per-pupil attainment tracking across year groups</li>
            <li>SEND/FSM/EAL overlay on cohort analysis</li>
            <li>Teacher assessment accuracy vs validated results</li>
            <li>AI-generated intervention recommendations per pupil</li>
            <li>Ofsted-ready evidence packs</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/components/trust-analysis/GroveHouseDemo.tsx
git commit -m "feat(trust-analysis): add Grove House per-pupil demo placeholder (Layer 3)"
```

---

## Task 12: Main Dashboard Page

**Files:**
- Create: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx`

This is the main page that ties everything together with a tabbed interface.

- [ ] **Step 1: Build the main page**

```typescript
// apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TrustOverviewHeatmap from '@/components/trust-analysis/TrustOverviewHeatmap';
import DisadvantageGapTable from '@/components/trust-analysis/DisadvantageGapTable';
import DataQualityFlags from '@/components/trust-analysis/DataQualityFlags';
import DfeCrossReference from '@/components/trust-analysis/DfeCrossReference';
import TrendCharts from '@/components/trust-analysis/TrendCharts';
import SchoolNarrativeCard from '@/components/trust-analysis/SchoolNarrativeCard';
import GroveHouseDemo from '@/components/trust-analysis/GroveHouseDemo';
import { PENNINE_SELF_REPORTS } from '@/lib/trust-analysis/pennine-data';
import {
  calculateDivergences, detectDataQualityIssues, calculateDisadvantageGaps,
} from '@/lib/trust-analysis/analysis';
import { generateSchoolNarrative } from '@/lib/trust-analysis/school-narratives';
import {
  DfEData, KS2Result, CensusRecord, SchoolNarrative, DivergenceFlag,
  DataQualityFlag, DisadvantageGap, PENNINE_SCHOOLS,
} from '@/lib/trust-analysis/types';

type TabKey = 'overview' | 'cross-reference' | 'trends' | 'narratives' | 'grove-house';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Trust Overview', icon: '📊' },
  { key: 'cross-reference', label: 'DfE Cross-Reference', icon: '🔍' },
  { key: 'trends', label: 'Historical Trends', icon: '📈' },
  { key: 'narratives', label: 'School Reports', icon: '📝' },
  { key: 'grove-house', label: 'Grove House Demo', icon: '🔒' },
];

export default function TrustAnalysisPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dfeData, setDfeData] = useState<DfEData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch DfE data on mount
  useEffect(() => {
    async function fetchDfE() {
      try {
        const res = await fetch('/api/trust-analysis');
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: DfEData = await res.json();
        setDfeData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load DfE data');
      } finally {
        setLoading(false);
      }
    }
    fetchDfE();
  }, []);

  // Compute analyses
  const divergences: DivergenceFlag[] = dfeData
    ? calculateDivergences(PENNINE_SELF_REPORTS, dfeData.ks2Results)
    : [];
  const qualityFlags: DataQualityFlag[] = detectDataQualityIssues(PENNINE_SELF_REPORTS);
  const gaps: DisadvantageGap[] = calculateDisadvantageGaps(PENNINE_SELF_REPORTS);
  const narratives: SchoolNarrative[] = PENNINE_SELF_REPORTS.map(report =>
    generateSchoolNarrative(
      report,
      dfeData?.ks2Results ?? [],
      dfeData?.census ?? [],
      divergences,
      qualityFlags,
    ),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xl">☿</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pennine Academies Yorkshire</h1>
                <p className="text-sm text-gray-500">Trust Code 17012 | 7 Primary Schools | Mid-Year Analysis 2025/26</p>
              </div>
            </div>
          </motion.div>

          {/* Trust summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">2,821</div>
              <div className="text-xs text-gray-500">Total Pupils</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">7</div>
              <div className="text-xs text-gray-500">Schools</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{qualityFlags.filter(f => f.severity === 'error').length}</div>
              <div className="text-xs text-gray-500">Data Errors</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{divergences.filter(d => d.rag === 'red').length}</div>
              <div className="text-xs text-gray-500">Red Divergences</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{loading ? '...' : '✓'}</div>
              <div className="text-xs text-gray-500">DfE Data {loading ? 'Loading' : 'Loaded'}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-gray-50 text-gray-900 border border-b-0 border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">Failed to load DfE data: {error}. Layer 1 analysis is still available.</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Trust-Wide Heatmap — ARE by Subject</h2>
                <TrustOverviewHeatmap selfReports={PENNINE_SELF_REPORTS} />
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Year 6 Disadvantage Gap (FSM6 vs Non-FSM)</h2>
                <DisadvantageGapTable gaps={gaps} />
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Data Quality Flags</h2>
                <DataQualityFlags flags={qualityFlags} />
              </section>
            </motion.div>
          )}

          {activeTab === 'cross-reference' && (
            <motion.div key="cross-ref" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Layer 2: DfE Cross-Reference Analysis</h2>
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading DfE data from Supabase...</div>
              ) : (
                <DfeCrossReference divergences={divergences} />
              )}
            </motion.div>
          )}

          {activeTab === 'trends' && (
            <motion.div key="trends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Layer 2: Historical Trends from DfE Data</h2>
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading trend data...</div>
              ) : dfeData ? (
                <TrendCharts ks2Results={dfeData.ks2Results} census={dfeData.census} />
              ) : null}
            </motion.div>
          )}

          {activeTab === 'narratives' && (
            <motion.div key="narratives" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Per-School Narrative Reports</h2>
              {narratives.map((narrative, idx) => (
                <SchoolNarrativeCard key={narrative.school} narrative={narrative} index={idx} />
              ))}
            </motion.div>
          )}

          {activeTab === 'grove-house' && (
            <motion.div key="grove-house" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Layer 3: Grove House Per-Pupil Demo</h2>
              <GroveHouseDemo />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/app/\\(dashboard\\)/dashboard/school-improvement/trust-analysis/page.tsx
git commit -m "feat(trust-analysis): add main trust analysis dashboard page with tabbed interface"
```

---

## Task 13: Build Check and TypeScript Verification

- [ ] **Step 1: Run TypeScript type check**

```bash
cd apps/platform && npx tsc --noEmit 2>&1 | head -50
```

Fix any type errors found.

- [ ] **Step 2: Run the build**

```bash
cd apps/platform && npm run build 2>&1 | tail -30
```

Fix any build errors.

- [ ] **Step 3: Run tests**

```bash
npx vitest run 2>&1 | tail -20
```

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(trust-analysis): resolve build and type errors"
```

---

## Task 14: Visual Verification

- [ ] **Step 1: Start dev server and verify rendering**

```bash
cd apps/platform && npm run dev
```

Navigate to `http://localhost:3001/dashboard/school-improvement/trust-analysis/` and verify:
- Trust header renders with stats
- Heatmap shows all 7 schools across all year groups
- Subject selector (R/W/M/C) toggles heatmap values
- Disadvantage gap table shows FSM6 vs Non-FSM with colour coding
- Data quality flags display with severity badges
- Cross-reference tab shows DfE divergence panels with RAG colours
- Trend charts render (KS2, FSM, scaled scores, radar)
- Narrative reports show strengths, concerns, Ofsted questions per school
- Grove House tab shows placeholder with planned capabilities

- [ ] **Step 2: Take screenshot evidence**

Use Playwright MCP or manual screenshot to capture the dashboard in its working state.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(trust-analysis): Pennine Academies trust analysis dashboard — Layer 1+2 complete"
```
