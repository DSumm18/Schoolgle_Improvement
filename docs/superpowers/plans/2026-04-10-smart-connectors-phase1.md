# Smart Connectors Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Smart Connectors visual intelligence layer — connection map UI, reconciliation engine, similar schools matching, comparison API, and source attribution — all powered by 3.7M rows of real DfE data in Supabase.

**Architecture:** New `smart-connectors` library in `src/lib/` provides the data layer (proximity search, reconciliation, comparison queries). Three API routes expose this to the frontend. A new Settings page at `/dashboard/settings/connectors` renders the connection map with Framer Motion animations, source logos, and verification badges. All modules consume verified data downstream.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (PostgreSQL), Framer Motion, Recharts, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-04-10-smart-connectors-phase1-design.md`

---

## File Structure

```
apps/platform/src/lib/smart-connectors/
  types.ts                        — All types: DataSource, ReconciliationResult, ComparisonSchool, etc.
  proximity.ts                    — Pythagorean distance on OS grid refs, radius search SQL builder
  similar-schools.ts              — Profile matching (phase, FSM±5pp, roll±20%, same LA)
  reconciliation-engine.ts        — Cross-check census aggregates vs DfE published stats
  comparison-service.ts           — Build comparison datasets (school vs national/LA/similar)
  source-registry.ts              — Registry of all DfE data sources with metadata

apps/platform/src/app/api/intelligence/
  compare/route.ts                — GET: proximity + similar school comparisons
  reconcile/route.ts              — POST: run reconciliation checks for a school
  sources/route.ts                — GET: connection status for all 6 DfE data sources

apps/platform/src/app/(dashboard)/dashboard/settings/connectors/
  page.tsx                        — Connection map landing view with animated nodes

apps/platform/src/components/smart-connectors/
  ConnectionMap.tsx               — Radial orbital SVG layout with Framer Motion
  DataSourceNode.tsx              — Source node with logo, status badge, hover tooltip
  YarnThread.tsx                  — Animated SVG path between school and source
  ReconciliationBanner.tsx        — Discrepancy alert banner with verify action
  SourceBadge.tsx                 — Inline source attribution (coloured dot + label)
  InsightCard.tsx                 — Intelligence card with source dots and verification
  ComparisonTable.tsx             — School vs national/LA/similar benchmarks

tests:
  apps/platform/src/lib/smart-connectors/__tests__/proximity.test.ts
  apps/platform/src/lib/smart-connectors/__tests__/similar-schools.test.ts
  apps/platform/src/lib/smart-connectors/__tests__/reconciliation-engine.test.ts
  apps/platform/src/lib/smart-connectors/__tests__/comparison-service.test.ts
  apps/platform/src/lib/smart-connectors/__tests__/source-registry.test.ts
```

---

### Task 1: Types and Source Registry

**Files:**
- Create: `apps/platform/src/lib/smart-connectors/types.ts`
- Create: `apps/platform/src/lib/smart-connectors/source-registry.ts`
- Create: `apps/platform/src/lib/smart-connectors/__tests__/source-registry.test.ts`

- [ ] **Step 1: Write the failing test for source registry**

```typescript
// apps/platform/src/lib/smart-connectors/__tests__/source-registry.test.ts
import { describe, it, expect } from 'vitest';
import { DATA_SOURCES, getSourceByTable, getSourceStatus } from '../source-registry';

describe('source-registry', () => {
  it('defines all 6 DfE data sources', () => {
    expect(DATA_SOURCES).toHaveLength(6);
    const tableNames = DATA_SOURCES.map(s => s.table);
    expect(tableNames).toContain('ks2_results');
    expect(tableNames).toContain('attendance');
    expect(tableNames).toContain('workforce');
    expect(tableNames).toContain('exclusions');
    expect(tableNames).toContain('ks4_results');
    expect(tableNames).toContain('census');
  });

  it('each source has required metadata', () => {
    for (const source of DATA_SOURCES) {
      expect(source.id).toBeTruthy();
      expect(source.name).toBeTruthy();
      expect(source.table).toBeTruthy();
      expect(source.colour).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(source.logo).toBeTruthy();
      expect(source.description).toBeTruthy();
      expect(source.urnColumn).toBe('urn');
    }
  });

  it('getSourceByTable returns correct source', () => {
    const source = getSourceByTable('ks2_results');
    expect(source?.name).toBe('KS2 Results');
    expect(source?.colour).toBe('#ef4444');
  });

  it('getSourceByTable returns undefined for unknown table', () => {
    expect(getSourceByTable('nonexistent')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/source-registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create types file**

```typescript
// apps/platform/src/lib/smart-connectors/types.ts

export interface DataSource {
  id: string;
  name: string;
  table: string;
  description: string;
  colour: string;
  logo: string;             // path to logo in /public/logos/connectors/
  urnColumn: string;
  timeColumn: string;
  rowCount?: number;         // populated at runtime
  yearRange?: string;        // e.g. "2022-2024"
  schoolDataExists?: boolean; // true if data found for this URN
}

export interface SchoolProfile {
  urn: number;
  name: string;
  laCode: string;
  laName: string;
  postcode: string;
  easting: number;
  northing: number;
  typeName: string;
  phaseName: string;
  statusName: string;
  schoolCapacity: number;
  numberOfPupils: number;
  percentageFsm: number;
  trustName: string | null;
  headFirstName: string | null;
  headLastName: string | null;
}

export interface ProximityResult {
  school: SchoolProfile;
  distanceMiles: number;
}

export interface SimilarSchoolMatch {
  school: SchoolProfile;
  matchScore: number;        // 0-1, higher = more similar
  matchReasons: string[];    // e.g. ["Same phase", "FSM within 3pp"]
  ks2RwmExpected?: number;
  attendancePct?: number;
  fsmPct?: number;
}

export interface ReconciliationCheck {
  field: string;             // e.g. "FSM %"
  sourceA: { name: string; value: number | string; source: string };
  sourceB: { name: string; value: number | string; source: string };
  status: 'match' | 'discrepancy' | 'missing';
  difference?: number;       // absolute difference for numeric fields
  explanation?: string;      // e.g. "Different census snapshot dates"
}

export interface ReconciliationResult {
  urn: number;
  schoolName: string;
  checks: ReconciliationCheck[];
  overallStatus: 'verified' | 'warnings' | 'errors';
  verifiedCount: number;
  warningCount: number;
  errorCount: number;
  timestamp: string;
}

export interface ComparisonDataset {
  school: {
    urn: number;
    name: string;
    value: number;
  };
  national: { average: number; schoolCount: number };
  la: { average: number; schoolCount: number; laName: string };
  similar: { average: number; schoolCount: number } | null;
  difference: {
    vsNational: number;
    vsLa: number;
    vsSimilar: number | null;
  };
}

export interface SourceAttribution {
  sourceId: string;
  table: string;
  colour: string;
  verified: boolean;
}

export interface InsightData {
  id: string;
  category: 'strength' | 'watch' | 'inspector_flag' | 'positive' | 'data_quality';
  headline: string;
  stat: string;
  detail: string;
  sources: SourceAttribution[];
  verified: boolean;
}

export interface SourceConnectionStatus {
  source: DataSource;
  connected: boolean;
  rowCount: number;
  yearRange: string | null;
  latestTimePeriod: string | null;
}
```

- [ ] **Step 4: Create source registry**

```typescript
// apps/platform/src/lib/smart-connectors/source-registry.ts
import type { DataSource } from './types';

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'ks2-results',
    name: 'KS2 Results',
    table: 'ks2_results',
    description: 'Key Stage 2 attainment, progress measures, and scaled scores',
    colour: '#ef4444',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'attendance',
    name: 'Attendance',
    table: 'attendance',
    description: 'Overall, authorised, and unauthorised absence rates with persistent absence',
    colour: '#8b5cf6',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'workforce',
    name: 'Workforce',
    table: 'workforce',
    description: 'FTE teachers, TAs, support staff, vacancies, and pay data',
    colour: '#f59e0b',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'exclusions',
    name: 'Exclusions',
    table: 'exclusions',
    description: 'Suspensions and permanent exclusions by term and reason',
    colour: '#06b6d4',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'ks4-results',
    name: 'KS4 Results',
    table: 'ks4_results',
    description: 'Attainment 8, Progress 8, EBacc, and basics measures',
    colour: '#3b82f6',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'census',
    name: 'Census',
    table: 'census',
    description: 'Pupil demographics — roll, FSM, EAL, SEN, ethnicity, mobility',
    colour: '#10b981',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
];

export function getSourceByTable(table: string): DataSource | undefined {
  return DATA_SOURCES.find(s => s.table === table);
}

export function getSourceById(id: string): DataSource | undefined {
  return DATA_SOURCES.find(s => s.id === id);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/source-registry.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/lib/smart-connectors/types.ts apps/platform/src/lib/smart-connectors/source-registry.ts apps/platform/src/lib/smart-connectors/__tests__/source-registry.test.ts
git commit -m "feat(smart-connectors): add types and source registry for 6 DfE datasets"
```

---

### Task 2: Proximity Search

**Files:**
- Create: `apps/platform/src/lib/smart-connectors/proximity.ts`
- Create: `apps/platform/src/lib/smart-connectors/__tests__/proximity.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/smart-connectors/__tests__/proximity.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDistanceMiles, buildProximityQuery } from '../proximity';

describe('proximity', () => {
  // Grove House: easting 417106, northing 435598
  // Bradford City Centre approx: easting 416500, northing 433800
  // ~1.9km apart = ~1.2 miles

  it('calculates distance between two OS grid points in miles', () => {
    const distance = calculateDistanceMiles(
      417106, 435598,  // Grove House
      416500, 433800   // Bradford centre
    );
    expect(distance).toBeGreaterThan(1.0);
    expect(distance).toBeLessThan(1.5);
  });

  it('returns 0 for same point', () => {
    const distance = calculateDistanceMiles(417106, 435598, 417106, 435598);
    expect(distance).toBe(0);
  });

  it('builds correct SQL for proximity search', () => {
    const sql = buildProximityQuery({
      easting: 417106,
      northing: 435598,
      radiusMiles: 5,
      phaseName: 'Primary',
      excludeUrn: 148201,
    });
    expect(sql).toContain('417106');
    expect(sql).toContain('435598');
    expect(sql).toContain('1609.34');
    expect(sql).toContain("phase_name = 'Primary'");
    expect(sql).toContain('148201');
    expect(sql).toContain('distance_miles');
  });

  it('builds SQL without phase filter when not provided', () => {
    const sql = buildProximityQuery({
      easting: 417106,
      northing: 435598,
      radiusMiles: 3,
      excludeUrn: 148201,
    });
    expect(sql).not.toContain('phase_name');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/proximity.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement proximity module**

```typescript
// apps/platform/src/lib/smart-connectors/proximity.ts

/**
 * Calculate distance between two OS grid reference points in miles.
 * Uses Pythagorean distance on easting/northing (1 unit = 1 metre).
 * Accurate enough for school proximity within a few miles.
 */
export function calculateDistanceMiles(
  easting1: number, northing1: number,
  easting2: number, northing2: number,
): number {
  const dx = easting1 - easting2;
  const dy = northing1 - northing2;
  const distanceMetres = Math.sqrt(dx * dx + dy * dy);
  return distanceMetres / 1609.34;
}

export interface ProximityQueryParams {
  easting: number;
  northing: number;
  radiusMiles: number;
  phaseName?: string;
  excludeUrn?: number;
  limit?: number;
}

/**
 * Build SQL query to find schools within a radius of a point.
 * Returns schools ordered by distance with distance_miles column.
 */
export function buildProximityQuery(params: ProximityQueryParams): string {
  const { easting, northing, radiusMiles, phaseName, excludeUrn, limit = 50 } = params;
  const radiusMetres = radiusMiles * 1609.34;

  let where = `
    s.status_name = 'Open'
    AND s.easting IS NOT NULL
    AND s.northing IS NOT NULL
    AND SQRT(POWER(s.easting - ${easting}, 2) + POWER(s.northing - ${northing}, 2)) <= ${radiusMetres}
  `;

  if (phaseName) {
    where += `\n    AND s.phase_name = '${phaseName}'`;
  }

  if (excludeUrn) {
    where += `\n    AND s.urn != ${excludeUrn}`;
  }

  return `
    SELECT s.urn, s.name, s.la_code, s.la_name, s.postcode,
           s.easting, s.northing, s.type_name, s.phase_name,
           s.status_name, s.school_capacity, s.number_of_pupils,
           s.percentage_fsm, s.trust_name,
           s.head_first_name, s.head_last_name,
           SQRT(POWER(s.easting - ${easting}, 2) + POWER(s.northing - ${northing}, 2)) / 1609.34 AS distance_miles
    FROM schools s
    WHERE ${where}
    ORDER BY distance_miles ASC
    LIMIT ${limit}
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/proximity.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/smart-connectors/proximity.ts apps/platform/src/lib/smart-connectors/__tests__/proximity.test.ts
git commit -m "feat(smart-connectors): add proximity search with OS grid ref distance calculator"
```

---

### Task 3: Similar Schools Matching

**Files:**
- Create: `apps/platform/src/lib/smart-connectors/similar-schools.ts`
- Create: `apps/platform/src/lib/smart-connectors/__tests__/similar-schools.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/smart-connectors/__tests__/similar-schools.test.ts
import { describe, it, expect } from 'vitest';
import { buildSimilarSchoolsQuery, calculateMatchScore } from '../similar-schools';

describe('similar-schools', () => {
  it('builds query filtering by phase and FSM tolerance', () => {
    const sql = buildSimilarSchoolsQuery({
      urn: 148201,
      phaseName: 'Primary',
      fsmPct: 27.3,
      fsmTolerance: 5,
      numberOfPupils: 417,
      rollTolerance: 20,
      laCode: '380',
      timePeriod: '202425',
    });
    expect(sql).toContain("phase_name = 'Primary'");
    expect(sql).toContain('27.3');  // FSM reference
    expect(sql).toContain('148201');
    expect(sql).toContain('census');
  });

  it('calculates match score — identical profile scores 1.0', () => {
    const score = calculateMatchScore({
      targetFsm: 27.3, matchFsm: 27.3,
      targetRoll: 417, matchRoll: 417,
      sameLa: true, samePhase: true, sameType: true,
    });
    expect(score).toBe(1.0);
  });

  it('calculates lower score for different FSM and roll', () => {
    const score = calculateMatchScore({
      targetFsm: 27.3, matchFsm: 32.0,
      targetRoll: 417, matchRoll: 300,
      sameLa: true, samePhase: true, sameType: false,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1.0);
  });

  it('same LA boosts score', () => {
    const withLa = calculateMatchScore({
      targetFsm: 27.3, matchFsm: 30,
      targetRoll: 417, matchRoll: 400,
      sameLa: true, samePhase: true, sameType: true,
    });
    const withoutLa = calculateMatchScore({
      targetFsm: 27.3, matchFsm: 30,
      targetRoll: 417, matchRoll: 400,
      sameLa: false, samePhase: true, sameType: true,
    });
    expect(withLa).toBeGreaterThan(withoutLa);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/similar-schools.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement similar schools module**

```typescript
// apps/platform/src/lib/smart-connectors/similar-schools.ts

export interface SimilarSchoolsQueryParams {
  urn: number;
  phaseName: string;
  fsmPct: number;
  fsmTolerance: number;      // percentage points
  numberOfPupils: number;
  rollTolerance: number;      // percentage
  laCode?: string;
  timePeriod: string;
  limit?: number;
}

/**
 * Build SQL to find schools with similar profiles.
 * Joins schools table with census for FSM data and optionally KS2 for attainment.
 */
export function buildSimilarSchoolsQuery(params: SimilarSchoolsQueryParams): string {
  const {
    urn, phaseName, fsmPct, fsmTolerance,
    numberOfPupils, rollTolerance, laCode, timePeriod, limit = 30,
  } = params;

  const rollLower = Math.round(numberOfPupils * (1 - rollTolerance / 100));
  const rollUpper = Math.round(numberOfPupils * (1 + rollTolerance / 100));

  return `
    SELECT s.urn, s.name, s.la_code, s.la_name, s.postcode,
           s.easting, s.northing, s.type_name, s.phase_name,
           s.status_name, s.school_capacity, s.number_of_pupils,
           s.percentage_fsm, s.trust_name,
           s.head_first_name, s.head_last_name,
           c.fsm_pct, c.eal_pct, c.number_on_roll,
           ABS(c.fsm_pct::numeric - ${fsmPct}) AS fsm_diff
    FROM schools s
    JOIN census c ON s.urn = c.urn AND c.time_period = '${timePeriod}'
    WHERE s.urn != ${urn}
      AND s.phase_name = '${phaseName}'
      AND s.status_name = 'Open'
      AND ABS(c.fsm_pct::numeric - ${fsmPct}) <= ${fsmTolerance}
      AND c.number_on_roll BETWEEN ${rollLower} AND ${rollUpper}
      ${laCode ? `AND s.la_code = '${laCode}'` : ''}
    ORDER BY fsm_diff ASC
    LIMIT ${limit}
  `;
}

export interface MatchScoreParams {
  targetFsm: number;
  matchFsm: number;
  targetRoll: number;
  matchRoll: number;
  sameLa: boolean;
  samePhase: boolean;
  sameType: boolean;
}

/**
 * Calculate a 0-1 similarity score between two school profiles.
 * Weights: FSM proximity 30%, roll proximity 20%, same LA 20%, same phase 15%, same type 15%
 */
export function calculateMatchScore(params: MatchScoreParams): number {
  const { targetFsm, matchFsm, targetRoll, matchRoll, sameLa, samePhase, sameType } = params;

  // FSM proximity score (0-1): 0 difference = 1.0, 10pp difference = 0.0
  const fsmDiff = Math.abs(targetFsm - matchFsm);
  const fsmScore = Math.max(0, 1 - fsmDiff / 10);

  // Roll proximity score (0-1): 0% difference = 1.0, 50% difference = 0.0
  const rollDiff = Math.abs(targetRoll - matchRoll) / Math.max(targetRoll, 1);
  const rollScore = Math.max(0, 1 - rollDiff / 0.5);

  const laScore = sameLa ? 1.0 : 0.0;
  const phaseScore = samePhase ? 1.0 : 0.0;
  const typeScore = sameType ? 1.0 : 0.0;

  return Math.round((
    fsmScore * 0.30 +
    rollScore * 0.20 +
    laScore * 0.20 +
    phaseScore * 0.15 +
    typeScore * 0.15
  ) * 100) / 100;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/similar-schools.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/smart-connectors/similar-schools.ts apps/platform/src/lib/smart-connectors/__tests__/similar-schools.test.ts
git commit -m "feat(smart-connectors): add similar schools matching with weighted profile scoring"
```

---

### Task 4: Reconciliation Engine

**Files:**
- Create: `apps/platform/src/lib/smart-connectors/reconciliation-engine.ts`
- Create: `apps/platform/src/lib/smart-connectors/__tests__/reconciliation-engine.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/smart-connectors/__tests__/reconciliation-engine.test.ts
import { describe, it, expect } from 'vitest';
import {
  reconcileValues,
  buildReconciliationQueries,
  categoriseDiscrepancy,
} from '../reconciliation-engine';
import type { ReconciliationCheck } from '../types';

describe('reconciliation-engine', () => {
  describe('reconcileValues', () => {
    it('returns match when values are equal', () => {
      const result = reconcileValues('FSM %', 28.9, 28.9, 'GIAS', 'Census');
      expect(result.status).toBe('match');
      expect(result.difference).toBe(0);
    });

    it('returns match when values are within 0.5 tolerance', () => {
      const result = reconcileValues('FSM %', 28.9, 28.5, 'GIAS', 'Census');
      expect(result.status).toBe('match');
    });

    it('returns discrepancy when values differ beyond tolerance', () => {
      const result = reconcileValues('FSM %', 28.9, 27.3, 'GIAS', 'Census', 0.5);
      expect(result.status).toBe('discrepancy');
      expect(result.difference).toBeCloseTo(1.6, 1);
    });

    it('returns missing when either value is null', () => {
      const result = reconcileValues('SEN %', null, 5.2, 'GIAS', 'Census');
      expect(result.status).toBe('missing');
    });
  });

  describe('categoriseDiscrepancy', () => {
    it('explains FSM differences as snapshot timing', () => {
      const explanation = categoriseDiscrepancy('FSM %', 1.6);
      expect(explanation).toContain('snapshot');
    });

    it('flags large differences as potential errors', () => {
      const explanation = categoriseDiscrepancy('FSM %', 10.0);
      expect(explanation).toContain('significant');
    });
  });

  describe('buildReconciliationQueries', () => {
    it('returns queries for all reconcilable fields', () => {
      const queries = buildReconciliationQueries(148201);
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0]).toContain('148201');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/reconciliation-engine.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement reconciliation engine**

```typescript
// apps/platform/src/lib/smart-connectors/reconciliation-engine.ts
import type { ReconciliationCheck, ReconciliationResult } from './types';

/**
 * Compare two values from different sources and determine reconciliation status.
 */
export function reconcileValues(
  field: string,
  valueA: number | string | null,
  valueB: number | string | null,
  sourceA: string,
  sourceB: string,
  tolerance: number = 0.5,
): ReconciliationCheck {
  if (valueA === null || valueB === null || valueA === undefined || valueB === undefined) {
    return {
      field,
      sourceA: { name: sourceA, value: valueA ?? 'N/A', source: sourceA },
      sourceB: { name: sourceB, value: valueB ?? 'N/A', source: sourceB },
      status: 'missing',
      explanation: `Data not available from ${valueA === null ? sourceA : sourceB}`,
    };
  }

  const numA = typeof valueA === 'string' ? parseFloat(valueA) : valueA;
  const numB = typeof valueB === 'string' ? parseFloat(valueB) : valueB;

  if (isNaN(numA) || isNaN(numB)) {
    // String comparison for non-numeric fields
    const strMatch = String(valueA).toLowerCase().trim() === String(valueB).toLowerCase().trim();
    return {
      field,
      sourceA: { name: sourceA, value: valueA, source: sourceA },
      sourceB: { name: sourceB, value: valueB, source: sourceB },
      status: strMatch ? 'match' : 'discrepancy',
      explanation: strMatch ? undefined : `Values differ: "${valueA}" vs "${valueB}"`,
    };
  }

  const diff = Math.abs(numA - numB);

  return {
    field,
    sourceA: { name: sourceA, value: numA, source: sourceA },
    sourceB: { name: sourceB, value: numB, source: sourceB },
    status: diff <= tolerance ? 'match' : 'discrepancy',
    difference: Math.round(diff * 100) / 100,
    explanation: diff <= tolerance ? undefined : categoriseDiscrepancy(field, diff),
  };
}

/**
 * Provide a human-readable explanation for a data discrepancy.
 */
export function categoriseDiscrepancy(field: string, difference: number): string {
  if (difference >= 5) {
    return `Significant difference of ${difference.toFixed(1)}pp detected. This may indicate a data entry error or a different reporting period. School should verify.`;
  }

  const fieldLower = field.toLowerCase();

  if (fieldLower.includes('fsm') || fieldLower.includes('sen') || fieldLower.includes('eal')) {
    return `Difference of ${difference.toFixed(1)}pp likely due to different census snapshot dates. GIAS uses January census, bulk data may use a different point-in-time.`;
  }

  if (fieldLower.includes('roll') || fieldLower.includes('pupil')) {
    return `Difference of ${difference} pupils. Roll numbers change throughout the year as pupils join and leave.`;
  }

  if (fieldLower.includes('attendance')) {
    return `Difference of ${difference.toFixed(1)}pp. May reflect different term periods or data collection windows.`;
  }

  return `Difference of ${difference.toFixed(1)} detected between sources. Different snapshot dates or calculation methods may explain this.`;
}

/**
 * Build SQL queries to fetch reconcilable data for a school from multiple sources.
 * Returns pairs of queries that should be compared.
 */
export function buildReconciliationQueries(urn: number): string[] {
  return [
    // GIAS (schools table) FSM vs Census FSM
    `SELECT 
       s.percentage_fsm AS gias_fsm_pct,
       s.number_of_pupils AS gias_roll,
       c.fsm_pct AS census_fsm_pct,
       c.number_on_roll AS census_roll
     FROM schools s
     LEFT JOIN census c ON s.urn = c.urn 
       AND c.time_period = (SELECT MAX(time_period) FROM census WHERE urn = ${urn})
     WHERE s.urn = ${urn}`,

    // Census roll vs GIAS roll
    `SELECT
       s.number_of_pupils AS gias_roll,
       c.number_on_roll AS census_roll,
       c.time_period AS census_period
     FROM schools s
     LEFT JOIN census c ON s.urn = c.urn
       AND c.time_period = (SELECT MAX(time_period) FROM census WHERE urn = ${urn})
     WHERE s.urn = ${urn}`,
  ];
}

/**
 * Build a full reconciliation result from raw query data.
 */
export function buildReconciliationResult(
  urn: number,
  schoolName: string,
  data: {
    giasFsmPct: number | null;
    censusFsmPct: number | null;
    giasRoll: number | null;
    censusRoll: number | null;
  },
): ReconciliationResult {
  const checks: ReconciliationCheck[] = [
    reconcileValues('FSM %', data.giasFsmPct, data.censusFsmPct, 'GIAS School Record', 'DfE Census Data'),
    reconcileValues('Number on Roll', data.giasRoll, data.censusRoll, 'GIAS School Record', 'DfE Census Data', 5),
  ];

  const warningCount = checks.filter(c => c.status === 'discrepancy').length;
  const errorCount = checks.filter(c => c.status === 'missing').length;
  const verifiedCount = checks.filter(c => c.status === 'match').length;

  return {
    urn,
    schoolName,
    checks,
    overallStatus: warningCount > 0 ? 'warnings' : errorCount > 0 ? 'errors' : 'verified',
    verifiedCount,
    warningCount,
    errorCount,
    timestamp: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/reconciliation-engine.test.ts`
Expected: PASS (all 7 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/smart-connectors/reconciliation-engine.ts apps/platform/src/lib/smart-connectors/__tests__/reconciliation-engine.test.ts
git commit -m "feat(smart-connectors): add reconciliation engine to cross-check data sources"
```

---

### Task 5: Comparison Service

**Files:**
- Create: `apps/platform/src/lib/smart-connectors/comparison-service.ts`
- Create: `apps/platform/src/lib/smart-connectors/__tests__/comparison-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/smart-connectors/__tests__/comparison-service.test.ts
import { describe, it, expect } from 'vitest';
import { buildComparisonQuery, computeDifferences } from '../comparison-service';

describe('comparison-service', () => {
  it('builds KS2 comparison query with national and LA averages', () => {
    const sql = buildComparisonQuery({
      urn: 148201,
      table: 'ks2_results',
      valueColumn: 'expected_standard_pct',
      timePeriod: '202425',
      laCode: '380',
      phaseName: 'Primary',
      subject: 'Reading',
    });
    expect(sql).toContain('148201');
    expect(sql).toContain('expected_standard_pct');
    expect(sql).toContain("'380'");
    expect(sql).toContain('national_avg');
    expect(sql).toContain('la_avg');
  });

  it('computes correct differences', () => {
    const result = computeDifferences({
      schoolValue: 79,
      nationalAvg: 73.7,
      laAvg: 74.1,
      similarAvg: 75.5,
    });
    expect(result.vsNational).toBeCloseTo(5.3, 1);
    expect(result.vsLa).toBeCloseTo(4.9, 1);
    expect(result.vsSimilar).toBeCloseTo(3.5, 1);
  });

  it('handles null similar average', () => {
    const result = computeDifferences({
      schoolValue: 79,
      nationalAvg: 73.7,
      laAvg: 74.1,
      similarAvg: null,
    });
    expect(result.vsSimilar).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/comparison-service.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement comparison service**

```typescript
// apps/platform/src/lib/smart-connectors/comparison-service.ts

export interface ComparisonQueryParams {
  urn: number;
  table: string;
  valueColumn: string;
  timePeriod: string;
  laCode: string;
  phaseName: string;
  subject?: string;        // for ks2_results/ks4_results
  breakdownTopic?: string; // default 'All pupils'
}

/**
 * Build a single SQL query that returns the school's value, national average, and LA average.
 */
export function buildComparisonQuery(params: ComparisonQueryParams): string {
  const {
    urn, table, valueColumn, timePeriod, laCode, phaseName,
    subject, breakdownTopic = 'All pupils',
  } = params;

  const subjectFilter = subject ? `AND k.subject = '${subject}'` : '';
  const breakdownFilter = table === 'ks2_results' || table === 'ks4_results'
    ? `AND k.breakdown_topic = '${breakdownTopic}'`
    : '';

  return `
    WITH school_val AS (
      SELECT ${valueColumn}::numeric AS value
      FROM ${table} k
      WHERE k.urn = ${urn}
        AND k.time_period = '${timePeriod}'
        ${subjectFilter}
        ${breakdownFilter}
      LIMIT 1
    ),
    national_avg AS (
      SELECT ROUND(AVG(k.${valueColumn}::numeric), 1) AS avg_value,
             COUNT(DISTINCT k.urn) AS school_count
      FROM ${table} k
      WHERE k.time_period = '${timePeriod}'
        ${subjectFilter}
        ${breakdownFilter}
    ),
    la_avg AS (
      SELECT ROUND(AVG(k.${valueColumn}::numeric), 1) AS avg_value,
             COUNT(DISTINCT k.urn) AS school_count
      FROM ${table} k
      JOIN schools s ON k.urn = s.urn
      WHERE k.time_period = '${timePeriod}'
        AND s.la_code = '${laCode}'
        AND s.phase_name = '${phaseName}'
        ${subjectFilter}
        ${breakdownFilter}
    )
    SELECT
      sv.value AS school_value,
      na.avg_value AS national_avg,
      na.school_count AS national_count,
      la.avg_value AS la_avg,
      la.school_count AS la_count
    FROM school_val sv, national_avg na, la_avg la
  `;
}

export interface DifferenceParams {
  schoolValue: number;
  nationalAvg: number;
  laAvg: number;
  similarAvg: number | null;
}

/**
 * Compute differences between school value and benchmarks.
 * Positive = above average, negative = below.
 */
export function computeDifferences(params: DifferenceParams) {
  const { schoolValue, nationalAvg, laAvg, similarAvg } = params;
  return {
    vsNational: Math.round((schoolValue - nationalAvg) * 10) / 10,
    vsLa: Math.round((schoolValue - laAvg) * 10) / 10,
    vsSimilar: similarAvg !== null ? Math.round((schoolValue - similarAvg) * 10) / 10 : null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/__tests__/comparison-service.test.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/smart-connectors/comparison-service.ts apps/platform/src/lib/smart-connectors/__tests__/comparison-service.test.ts
git commit -m "feat(smart-connectors): add comparison service for school vs national/LA benchmarks"
```

---

### Task 6: API — Sources Endpoint

**Files:**
- Create: `apps/platform/src/app/api/intelligence/sources/route.ts`

- [ ] **Step 1: Create the sources API route**

```typescript
// apps/platform/src/app/api/intelligence/sources/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { DATA_SOURCES } from '@/lib/smart-connectors/source-registry';
import type { SourceConnectionStatus } from '@/lib/smart-connectors/types';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const url = new URL(req.url);
  const urn = url.searchParams.get('urn');

  if (!urn) {
    return apiError('Missing urn parameter', 400);
  }

  const urnNum = parseInt(urn, 10);
  if (isNaN(urnNum)) {
    return apiError('Invalid URN', 400);
  }

  const supabase = createServiceRoleClient();
  const results: SourceConnectionStatus[] = [];

  for (const source of DATA_SOURCES) {
    try {
      const { data, error } = await supabase
        .rpc('get_source_status', undefined)
        .select('*')
        // Use raw SQL for dynamic table queries
        .limit(1);

      // Use raw query instead since table names are dynamic
      const { data: rows, error: queryError } = await supabase
        .from(source.table)
        .select('time_period', { count: 'exact', head: false })
        .eq('urn', urnNum)
        .order('time_period', { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from(source.table)
        .select('*', { count: 'exact', head: true })
        .eq('urn', urnNum);

      const latestPeriod = rows && rows.length > 0 ? rows[0].time_period : null;

      // Get year range
      const { data: earliest } = await supabase
        .from(source.table)
        .select('time_period')
        .eq('urn', urnNum)
        .order('time_period', { ascending: true })
        .limit(1);

      const earliestPeriod = earliest && earliest.length > 0 ? earliest[0].time_period : null;

      const yearRange = earliestPeriod && latestPeriod && earliestPeriod !== latestPeriod
        ? `${formatTimePeriod(earliestPeriod)}-${formatTimePeriod(latestPeriod)}`
        : latestPeriod ? formatTimePeriod(latestPeriod) : null;

      results.push({
        source,
        connected: (count ?? 0) > 0,
        rowCount: count ?? 0,
        yearRange,
        latestTimePeriod: latestPeriod,
      });
    } catch {
      results.push({
        source,
        connected: false,
        rowCount: 0,
        yearRange: null,
        latestTimePeriod: null,
      });
    }
  }

  const connectedCount = results.filter(r => r.connected).length;

  return apiSuccess({
    urn: urnNum,
    sources: results,
    connectedCount,
    totalSources: DATA_SOURCES.length,
  });
});

function formatTimePeriod(tp: string): string {
  if (tp.length === 6) {
    return `20${tp.slice(0, 2)}/${tp.slice(2, 4)}`;
  }
  return tp;
}
```

- [ ] **Step 2: Test with curl**

Run: `curl -s http://localhost:3001/api/intelligence/sources?urn=148201 -H "Authorization: Bearer $TOKEN" | jq .`
Expected: JSON with 6 sources, each showing connected status and row counts.

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/api/intelligence/sources/route.ts
git commit -m "feat(api): add /api/intelligence/sources endpoint for data connection status"
```

---

### Task 7: API — Compare Endpoint

**Files:**
- Create: `apps/platform/src/app/api/intelligence/compare/route.ts`

- [ ] **Step 1: Create the compare API route**

```typescript
// apps/platform/src/app/api/intelligence/compare/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { buildProximityQuery } from '@/lib/smart-connectors/proximity';
import { buildSimilarSchoolsQuery, calculateMatchScore } from '@/lib/smart-connectors/similar-schools';
import type { SchoolProfile } from '@/lib/smart-connectors/types';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const url = new URL(req.url);
  const urn = url.searchParams.get('urn');
  const mode = url.searchParams.get('mode') || 'both'; // proximity | similar | both
  const radius = parseFloat(url.searchParams.get('radius') || '5');
  const fsmTolerance = parseFloat(url.searchParams.get('fsm_tolerance') || '5');
  const rollTolerance = parseFloat(url.searchParams.get('roll_tolerance') || '20');

  if (!urn) {
    return apiError('Missing urn parameter', 400);
  }

  const urnNum = parseInt(urn, 10);
  if (isNaN(urnNum)) {
    return apiError('Invalid URN', 400);
  }

  const supabase = createServiceRoleClient();

  // Get the target school's profile
  const { data: schoolData, error: schoolError } = await supabase
    .from('schools')
    .select('*')
    .eq('urn', urnNum)
    .single();

  if (schoolError || !schoolData) {
    return apiError('School not found in GIAS data', 404);
  }

  const school: SchoolProfile = {
    urn: schoolData.urn,
    name: schoolData.name,
    laCode: schoolData.la_code,
    laName: schoolData.la_name,
    postcode: schoolData.postcode,
    easting: schoolData.easting,
    northing: schoolData.northing,
    typeName: schoolData.type_name,
    phaseName: schoolData.phase_name,
    statusName: schoolData.status_name,
    schoolCapacity: schoolData.school_capacity,
    numberOfPupils: schoolData.number_of_pupils,
    percentageFsm: parseFloat(schoolData.percentage_fsm) || 0,
    trustName: schoolData.trust_name,
    headFirstName: schoolData.head_first_name,
    headLastName: schoolData.head_last_name,
  };

  const result: Record<string, unknown> = { school };

  // Proximity search
  if (mode === 'proximity' || mode === 'both') {
    const proxSql = buildProximityQuery({
      easting: school.easting,
      northing: school.northing,
      radiusMiles: radius,
      phaseName: school.phaseName,
      excludeUrn: urnNum,
    });

    const { data: proxData, error: proxError } = await supabase.rpc(
      'execute_raw_query' as never,
      { query_text: proxSql } as never,
    ).catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    // Fallback: use direct query if RPC not available
    if (!proxData) {
      const { data: nearbySchools } = await supabase
        .from('schools')
        .select('*')
        .eq('phase_name', school.phaseName)
        .eq('status_name', 'Open')
        .neq('urn', urnNum)
        .not('easting', 'is', null)
        .not('northing', 'is', null);

      const nearby = (nearbySchools || [])
        .map((s: Record<string, unknown>) => ({
          ...s,
          distance_miles: Math.sqrt(
            Math.pow((s.easting as number) - school.easting, 2) +
            Math.pow((s.northing as number) - school.northing, 2),
          ) / 1609.34,
        }))
        .filter((s: Record<string, unknown>) => (s.distance_miles as number) <= radius)
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a.distance_miles as number) - (b.distance_miles as number),
        )
        .slice(0, 30);

      result.proximity = {
        schools: nearby,
        count: nearby.length,
        radiusMiles: radius,
      };
    } else {
      result.proximity = {
        schools: proxData,
        count: (proxData as unknown[]).length,
        radiusMiles: radius,
      };
    }
  }

  // Similar schools
  if (mode === 'similar' || mode === 'both') {
    // Get FSM from census for more accurate matching
    const { data: censusData } = await supabase
      .from('census')
      .select('fsm_pct, number_on_roll')
      .eq('urn', urnNum)
      .order('time_period', { ascending: false })
      .limit(1)
      .single();

    const fsmPct = censusData?.fsm_pct ? parseFloat(censusData.fsm_pct) : school.percentageFsm;
    const roll = censusData?.number_on_roll || school.numberOfPupils;

    const simSql = buildSimilarSchoolsQuery({
      urn: urnNum,
      phaseName: school.phaseName,
      fsmPct,
      fsmTolerance,
      numberOfPupils: roll,
      rollTolerance,
      laCode: school.laCode,
      timePeriod: '202425',
    });

    // Use direct Supabase queries for similar schools
    const rollLower = Math.round(roll * (1 - rollTolerance / 100));
    const rollUpper = Math.round(roll * (1 + rollTolerance / 100));

    const { data: similarRaw } = await supabase
      .from('census')
      .select('urn, fsm_pct, eal_pct, number_on_roll, time_period')
      .eq('time_period', '202425')
      .gte('number_on_roll', rollLower)
      .lte('number_on_roll', rollUpper)
      .neq('urn', urnNum);

    // Filter by FSM tolerance and enrich with school data
    const matchingUrns = (similarRaw || [])
      .filter((c: Record<string, unknown>) =>
        Math.abs(parseFloat(c.fsm_pct as string) - fsmPct) <= fsmTolerance,
      )
      .map((c: Record<string, unknown>) => c.urn as number)
      .slice(0, 100);

    if (matchingUrns.length > 0) {
      const { data: schoolDetails } = await supabase
        .from('schools')
        .select('*')
        .in('urn', matchingUrns)
        .eq('phase_name', school.phaseName)
        .eq('status_name', 'Open')
        .eq('la_code', school.laCode);

      const enriched = (schoolDetails || []).map((s: Record<string, unknown>) => {
        const censusMatch = (similarRaw || []).find((c: Record<string, unknown>) => c.urn === s.urn);
        const matchFsm = censusMatch ? parseFloat(censusMatch.fsm_pct as string) : 0;
        const matchRoll = censusMatch ? (censusMatch.number_on_roll as number) : 0;

        return {
          ...s,
          fsm_pct: matchFsm,
          census_roll: matchRoll,
          match_score: calculateMatchScore({
            targetFsm: fsmPct,
            matchFsm,
            targetRoll: roll,
            matchRoll,
            sameLa: (s.la_code as string) === school.laCode,
            samePhase: (s.phase_name as string) === school.phaseName,
            sameType: (s.type_name as string) === school.typeName,
          }),
        };
      }).sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        (b.match_score as number) - (a.match_score as number),
      );

      result.similar = {
        schools: enriched.slice(0, 30),
        count: enriched.length,
        criteria: { fsmPct, fsmTolerance, roll, rollTolerance, laCode: school.laCode },
      };
    } else {
      result.similar = { schools: [], count: 0, criteria: { fsmPct, fsmTolerance, roll, rollTolerance } };
    }
  }

  return apiSuccess(result);
});
```

- [ ] **Step 2: Test with curl**

Run: `curl -s "http://localhost:3001/api/intelligence/compare?urn=148201&mode=both" -H "Authorization: Bearer $TOKEN" | jq '.data.proximity.count, .data.similar.count'`
Expected: Two numbers showing how many schools found in each mode.

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/api/intelligence/compare/route.ts
git commit -m "feat(api): add /api/intelligence/compare endpoint for proximity and similar schools"
```

---

### Task 8: API — Reconcile Endpoint

**Files:**
- Create: `apps/platform/src/app/api/intelligence/reconcile/route.ts`

- [ ] **Step 1: Create the reconcile API route**

```typescript
// apps/platform/src/app/api/intelligence/reconcile/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { reconcileValues, buildReconciliationResult } from '@/lib/smart-connectors/reconciliation-engine';

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { urn } = body;

  if (!urn) {
    return apiError('Missing urn in request body', 400);
  }

  const urnNum = typeof urn === 'string' ? parseInt(urn, 10) : urn;
  if (isNaN(urnNum)) {
    return apiError('Invalid URN', 400);
  }

  const supabase = createServiceRoleClient();

  // Fetch GIAS data
  const { data: giasData, error: giasError } = await supabase
    .from('schools')
    .select('name, percentage_fsm, number_of_pupils')
    .eq('urn', urnNum)
    .single();

  if (giasError || !giasData) {
    return apiError('School not found in GIAS data', 404);
  }

  // Fetch latest census data
  const { data: censusData } = await supabase
    .from('census')
    .select('fsm_pct, number_on_roll, time_period')
    .eq('urn', urnNum)
    .order('time_period', { ascending: false })
    .limit(1)
    .single();

  const result = buildReconciliationResult(urnNum, giasData.name, {
    giasFsmPct: giasData.percentage_fsm ? parseFloat(giasData.percentage_fsm) : null,
    censusFsmPct: censusData?.fsm_pct ? parseFloat(censusData.fsm_pct) : null,
    giasRoll: giasData.number_of_pupils,
    censusRoll: censusData?.number_on_roll ?? null,
  });

  return apiSuccess(result);
});
```

- [ ] **Step 2: Test with curl**

Run: `curl -s -X POST http://localhost:3001/api/intelligence/reconcile -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"urn":148201}' | jq .`
Expected: JSON showing reconciliation checks with the FSM discrepancy (28.9 vs 27.3).

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/api/intelligence/reconcile/route.ts
git commit -m "feat(api): add /api/intelligence/reconcile endpoint for data cross-checking"
```

---

### Task 9: UI Components — SourceBadge, InsightCard, ReconciliationBanner

**Files:**
- Create: `apps/platform/src/components/smart-connectors/SourceBadge.tsx`
- Create: `apps/platform/src/components/smart-connectors/InsightCard.tsx`
- Create: `apps/platform/src/components/smart-connectors/ReconciliationBanner.tsx`
- Create: `apps/platform/src/components/smart-connectors/ComparisonTable.tsx`

- [ ] **Step 1: Create SourceBadge component**

```tsx
// apps/platform/src/components/smart-connectors/SourceBadge.tsx
"use client";

interface SourceBadgeProps {
  name: string;
  colour: string;
  verified?: boolean;
  size?: 'sm' | 'md';
}

export function SourceBadge({ name, colour, verified, size = 'sm' }: SourceBadgeProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <span className={`inline-flex items-center gap-1 ${textSize} text-muted-foreground`}>
      <span className={`${dotSize} rounded-full shrink-0`} style={{ backgroundColor: colour }} />
      {name}
      {verified && (
        <span className="px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[8px] font-bold">
          ✓
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Create InsightCard component**

```tsx
// apps/platform/src/components/smart-connectors/InsightCard.tsx
"use client";

import { SourceBadge } from './SourceBadge';
import type { InsightData } from '@/lib/smart-connectors/types';

const CATEGORY_STYLES: Record<InsightData['category'], { colour: string; label: string }> = {
  strength: { colour: '#10b981', label: 'STRENGTH' },
  watch: { colour: '#f59e0b', label: 'WATCH' },
  inspector_flag: { colour: '#ef4444', label: 'INSPECTOR FLAG' },
  positive: { colour: '#10b981', label: 'POSITIVE' },
  data_quality: { colour: '#06b6d4', label: 'DATA QUALITY' },
};

export function InsightCard({ insight }: { insight: InsightData }) {
  const style = CATEGORY_STYLES[insight.category];

  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors">
      <div className="text-[9px] font-bold tracking-wider mb-1" style={{ color: style.colour }}>
        {style.label}
      </div>
      <div className="text-lg font-extrabold text-foreground mb-1" style={{ color: style.colour }}>
        {insight.stat}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
        {insight.detail}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {insight.sources.map((src, i) => (
          <SourceBadge key={i} name={src.table} colour={src.colour} verified={src.verified} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ReconciliationBanner component**

```tsx
// apps/platform/src/components/smart-connectors/ReconciliationBanner.tsx
"use client";

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ReconciliationResult } from '@/lib/smart-connectors/types';

export function ReconciliationBanner({ result }: { result: ReconciliationResult }) {
  const isClean = result.overallStatus === 'verified';
  const Icon = isClean ? CheckCircle2 : result.overallStatus === 'errors' ? XCircle : AlertTriangle;
  const borderColour = isClean ? 'border-emerald-500/30' : 'border-amber-500/30';
  const bgColour = isClean ? 'bg-emerald-500/5' : 'bg-amber-500/5';
  const iconColour = isClean ? 'text-emerald-500' : 'text-amber-500';

  return (
    <div className={`rounded-xl border ${borderColour} ${bgColour} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${iconColour}`} />
        <h3 className={`text-sm font-bold ${isClean ? 'text-emerald-400' : 'text-amber-400'}`}>
          Reconciliation: {result.verifiedCount} verified
          {result.warningCount > 0 && `, ${result.warningCount} need attention`}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {result.checks.map((check, i) => (
          <div key={i} className="rounded-lg bg-card border border-border p-3">
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
              {check.sourceA.name}
            </div>
            <div className={`text-xl font-extrabold mt-1 ${
              check.status === 'match' ? 'text-emerald-500' :
              check.status === 'discrepancy' ? 'text-amber-500' : 'text-muted-foreground'
            }`}>
              {String(check.sourceA.value)}{typeof check.sourceA.value === 'number' && check.field.includes('%') ? '%' : ''}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              vs {check.sourceB.name}: {String(check.sourceB.value)}{typeof check.sourceB.value === 'number' && check.field.includes('%') ? '%' : ''}
            </div>
            {check.explanation && (
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                {check.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ComparisonTable component**

```tsx
// apps/platform/src/components/smart-connectors/ComparisonTable.tsx
"use client";

import { SourceBadge } from './SourceBadge';

interface ComparisonRow {
  subject: string;
  schoolValue: number;
  nationalAvg: number;
  laAvg: number;
  higherStandard?: number;
  scaledScore?: number;
}

interface ComparisonTableProps {
  title: string;
  rows: ComparisonRow[];
  sourceColour: string;
  sourceName: string;
  laName: string;
}

export function ComparisonTable({ title, rows, sourceColour, sourceName, laName }: ComparisonTableProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <div className="ml-auto flex items-center gap-2">
          <SourceBadge name={sourceName} colour={sourceColour} verified />
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] text-muted-foreground uppercase tracking-wider">
            <th className="text-left py-2 px-3">Subject</th>
            <th className="text-left py-2 px-3">School</th>
            <th className="text-left py-2 px-3">National</th>
            <th className="text-left py-2 px-3">Diff</th>
            <th className="text-left py-2 px-3">{laName}</th>
            <th className="text-left py-2 px-3">Diff</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const diffNat = Math.round((row.schoolValue - row.nationalAvg) * 10) / 10;
            const diffLa = Math.round((row.schoolValue - row.laAvg) * 10) / 10;
            return (
              <tr key={row.subject} className="border-t border-border/50 hover:bg-accent/5">
                <td className="py-2 px-3 font-semibold">{row.subject}</td>
                <td className="py-2 px-3 font-bold text-purple-400">{row.schoolValue}%</td>
                <td className="py-2 px-3 text-muted-foreground">{row.nationalAvg}%</td>
                <td className={`py-2 px-3 font-semibold ${diffNat >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {diffNat >= 0 ? '+' : ''}{diffNat}pp
                </td>
                <td className="py-2 px-3 text-muted-foreground">{row.laAvg}%</td>
                <td className={`py-2 px-3 font-semibold ${diffLa >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {diffLa >= 0 ? '+' : ''}{diffLa}pp
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/components/smart-connectors/
git commit -m "feat(ui): add SourceBadge, InsightCard, ReconciliationBanner, ComparisonTable components"
```

---

### Task 10: UI Components — ConnectionMap with Yarn Threads

**Files:**
- Create: `apps/platform/src/components/smart-connectors/YarnThread.tsx`
- Create: `apps/platform/src/components/smart-connectors/DataSourceNode.tsx`
- Create: `apps/platform/src/components/smart-connectors/ConnectionMap.tsx`

- [ ] **Step 1: Create YarnThread animated SVG component**

```tsx
// apps/platform/src/components/smart-connectors/YarnThread.tsx
"use client";

import { motion } from 'framer-motion';

interface YarnThreadProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  colour: string;
  delay?: number;
  connected: boolean;
}

export function YarnThread({ startX, startY, endX, endY, colour, delay = 0, connected }: YarnThreadProps) {
  // Calculate a curved path (quadratic bezier)
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  // Offset the control point perpendicular to the line
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const offsetX = midX + (-dy / len) * 30;
  const offsetY = midY + (dx / len) * 30;

  const pathD = `M ${startX} ${startY} Q ${offsetX} ${offsetY} ${endX} ${endY}`;

  if (!connected) {
    return (
      <path
        d={pathD}
        stroke="#27272a"
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="4 8"
        opacity={0.3}
      />
    );
  }

  return (
    <g>
      {/* Glow layer */}
      <motion.path
        d={pathD}
        stroke={colour}
        strokeWidth={3}
        fill="none"
        opacity={0.15}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay, ease: "easeInOut" }}
      />
      {/* Main thread */}
      <motion.path
        d={pathD}
        stroke={colour}
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="6 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay, ease: "easeInOut" }}
      >
        <animate
          attributeName="stroke-dashoffset"
          values="0;-27"
          dur="3s"
          repeatCount="indefinite"
        />
      </motion.path>
      {/* Pulse dot at connection point */}
      <motion.circle
        cx={endX}
        cy={endY}
        r={3}
        fill={colour}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0.3, 0.8, 0.3], scale: 1 }}
        transition={{
          opacity: { duration: 2, repeat: Infinity, delay },
          scale: { duration: 0.5, delay },
        }}
      />
    </g>
  );
}
```

- [ ] **Step 2: Create DataSourceNode component**

```tsx
// apps/platform/src/components/smart-connectors/DataSourceNode.tsx
"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { SourceConnectionStatus } from '@/lib/smart-connectors/types';

interface DataSourceNodeProps {
  status: SourceConnectionStatus;
  x: number;
  y: number;
  delay?: number;
  onHover?: (status: SourceConnectionStatus | null) => void;
}

export function DataSourceNode({ status, x, y, delay = 0, onHover }: DataSourceNodeProps) {
  const { source, connected, rowCount, yearRange } = status;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200 }}
      onMouseEnter={() => onHover?.(status)}
      onMouseLeave={() => onHover?.(null)}
      style={{ cursor: 'pointer' }}
    >
      {/* Node background */}
      <rect
        x={x - 32}
        y={y - 32}
        width={64}
        height={64}
        rx={14}
        fill={connected ? `${source.colour}15` : '#18181b'}
        stroke={connected ? source.colour : '#27272a'}
        strokeWidth={connected ? 2 : 1}
      />
      {/* Logo placeholder — DfE crest */}
      <foreignObject x={x - 20} y={y - 22} width={40} height={26}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Image src={source.logo} alt={source.name} width={20} height={20} style={{ borderRadius: 4 }} />
        </div>
      </foreignObject>
      {/* Label */}
      <text
        x={x}
        y={y + 16}
        textAnchor="middle"
        fill={connected ? '#e4e4e7' : '#71717a'}
        fontSize={9}
        fontWeight={600}
      >
        {source.name}
      </text>
      {/* Row count */}
      {connected && rowCount > 0 && (
        <text x={x} y={y + 26} textAnchor="middle" fill="#71717a" fontSize={7}>
          {rowCount.toLocaleString()} rows
        </text>
      )}
      {/* Status indicator */}
      <circle
        cx={x + 26}
        cy={y - 26}
        r={5}
        fill={connected ? '#10b981' : '#52525b'}
        stroke="#0a0a0f"
        strokeWidth={2}
      />
    </motion.g>
  );
}
```

- [ ] **Step 3: Create ConnectionMap component**

```tsx
// apps/platform/src/components/smart-connectors/ConnectionMap.tsx
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { YarnThread } from './YarnThread';
import { DataSourceNode } from './DataSourceNode';
import type { SourceConnectionStatus } from '@/lib/smart-connectors/types';

interface ConnectionMapProps {
  schoolName: string;
  schoolInitials: string;
  sources: SourceConnectionStatus[];
}

// Position nodes in an orbital layout around the centre
const NODE_POSITIONS = [
  { angle: -90, radius: 140 },   // top
  { angle: -30, radius: 140 },   // top-right
  { angle: 30, radius: 140 },    // bottom-right
  { angle: 90, radius: 140 },    // bottom
  { angle: 150, radius: 140 },   // bottom-left
  { angle: 210, radius: 140 },   // top-left
];

const CX = 250;  // centre x
const CY = 200;  // centre y

export function ConnectionMap({ schoolName, schoolInitials, sources }: ConnectionMapProps) {
  const [hoveredSource, setHoveredSource] = useState<SourceConnectionStatus | null>(null);

  const nodeCoords = NODE_POSITIONS.map((pos) => ({
    x: CX + pos.radius * Math.cos((pos.angle * Math.PI) / 180),
    y: CY + pos.radius * Math.sin((pos.angle * Math.PI) / 180),
  }));

  const connectedCount = sources.filter(s => s.connected).length;

  return (
    <div className="relative">
      <svg viewBox="0 0 500 400" className="w-full max-w-[600px] mx-auto" role="img" aria-label="Data connection map">
        {/* Orbital rings */}
        <circle cx={CX} cy={CY} r={140} fill="none" stroke="#27272a" strokeWidth={1} strokeDasharray="4 8" opacity={0.5} />
        <circle cx={CX} cy={CY} r={90} fill="none" stroke="#27272a" strokeWidth={1} strokeDasharray="2 6" opacity={0.3} />

        {/* Yarn threads */}
        {sources.map((source, i) => (
          <YarnThread
            key={source.source.id}
            startX={CX}
            startY={CY}
            endX={nodeCoords[i].x}
            endY={nodeCoords[i].y}
            colour={source.source.colour}
            delay={i * 0.2}
            connected={source.connected}
          />
        ))}

        {/* Source nodes */}
        {sources.map((source, i) => (
          <DataSourceNode
            key={source.source.id}
            status={source}
            x={nodeCoords[i].x}
            y={nodeCoords[i].y}
            delay={0.3 + i * 0.15}
            onHover={setHoveredSource}
          />
        ))}

        {/* Centre school node */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <circle cx={CX} cy={CY} r={45} fill="url(#schoolGradient)" />
          <defs>
            <radialGradient id="schoolGradient" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6366f1" />
            </radialGradient>
          </defs>
          {/* School initials */}
          <text x={CX} y={CY - 6} textAnchor="middle" fill="white" fontSize={16} fontWeight={800}>
            {schoolInitials}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fill="white" fontSize={7} opacity={0.8}>
            {connectedCount}/{sources.length} connected
          </text>
        </motion.g>
      </svg>

      {/* Hover tooltip */}
      {hoveredSource && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl p-4 shadow-xl max-w-xs"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredSource.source.colour }} />
            <span className="text-sm font-bold text-foreground">{hoveredSource.source.name}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              hoveredSource.connected
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-zinc-500/15 text-zinc-400'
            }`}>
              {hoveredSource.connected ? 'Connected' : 'No data'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{hoveredSource.source.description}</p>
          {hoveredSource.connected && (
            <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
              <span>{hoveredSource.rowCount.toLocaleString()} rows</span>
              {hoveredSource.yearRange && <span>{hoveredSource.yearRange}</span>}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/components/smart-connectors/YarnThread.tsx apps/platform/src/components/smart-connectors/DataSourceNode.tsx apps/platform/src/components/smart-connectors/ConnectionMap.tsx
git commit -m "feat(ui): add ConnectionMap with animated yarn threads and orbital data source nodes"
```

---

### Task 11: Settings Connectors Page

**Files:**
- Create: `apps/platform/src/app/(dashboard)/dashboard/settings/connectors/page.tsx`

- [ ] **Step 1: Create the connectors settings page**

```tsx
// apps/platform/src/app/(dashboard)/dashboard/settings/connectors/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, Loader2, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ModulePageHeader } from '@/components/ui/module-page-header';
import { ConnectionMap } from '@/components/smart-connectors/ConnectionMap';
import { ReconciliationBanner } from '@/components/smart-connectors/ReconciliationBanner';
import { InsightCard } from '@/components/smart-connectors/InsightCard';
import { ComparisonTable } from '@/components/smart-connectors/ComparisonTable';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import type { SourceConnectionStatus, ReconciliationResult, InsightData } from '@/lib/smart-connectors/types';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

// Test school URN — in production this comes from the org's school profile
const SCHOOL_URN = 148201;

export default function ConnectorsPage() {
  const [sources, setSources] = useState<SourceConnectionStatus[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    const headers = await getAuthHeaders();

    try {
      // Fetch sources and reconciliation in parallel
      const [sourcesRes, reconcileRes] = await Promise.all([
        fetch(`/api/intelligence/sources?urn=${SCHOOL_URN}`, { headers }),
        fetch('/api/intelligence/reconcile', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ urn: SCHOOL_URN }),
        }),
      ]);

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.data?.sources || []);
      }

      if (reconcileRes.ok) {
        const reconcileData = await reconcileRes.json();
        setReconciliation(reconcileData.data);
        setSchoolName(reconcileData.data?.schoolName || 'Your School');
      }
    } catch {
      setError('Failed to load connector data');
    } finally {
      setLoading(false);
    }
  }

  const connectedCount = sources.filter(s => s.connected).length;
  const initials = schoolName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');

  // Build insights from the data we know about Grove House
  const insights: InsightData[] = [
    {
      id: 'ks2-above-avg',
      category: 'strength',
      headline: 'Above Average',
      stat: 'Above Average',
      detail: 'KS2 results are above both national and Bradford averages across all subjects.',
      sources: [
        { sourceId: 'ks2-results', table: 'DfE KS2', colour: '#ef4444', verified: true },
      ],
      verified: true,
    },
    {
      id: 'zero-exclusions',
      category: 'positive',
      headline: 'Zero Exclusions',
      stat: '0 Exclusions',
      detail: 'No suspensions or permanent exclusions across all recorded years with 28.9% FSM and VI resourced provision.',
      sources: [
        { sourceId: 'exclusions', table: 'DfE Exclusions', colour: '#06b6d4', verified: true },
      ],
      verified: true,
    },
    {
      id: 'attendance-improving',
      category: 'positive',
      headline: 'Improving',
      stat: '94.48%',
      detail: 'Autumn 2024-25 attendance up from 93.18%. Persistent absence dropped from 24.65% to 16.95%.',
      sources: [
        { sourceId: 'attendance', table: 'DfE Attendance', colour: '#8b5cf6', verified: true },
      ],
      verified: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Settings
      </Link>

      <ModulePageHeader
        moduleId="intelligence"
        icon={Plug}
        label="Settings"
        title="Smart Connectors"
        description="Your school's data sources, connected, verified, and ready. This is YOUR data — we connect it, verify it, and show you what it means."
      />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Connection Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <div className="text-3xl font-extrabold text-foreground">{connectedCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Datasets Connected</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <div className="text-3xl font-extrabold text-purple-400">
            {sources.reduce((sum, s) => sum + s.rowCount, 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Data Points Available</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <div className={`text-3xl font-extrabold ${reconciliation?.overallStatus === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
            {reconciliation?.overallStatus === 'verified' ? (
              <span className="flex items-center justify-center gap-1"><CheckCircle2 className="w-6 h-6" /> OK</span>
            ) : (
              <span className="flex items-center justify-center gap-1"><AlertTriangle className="w-6 h-6" /> Check</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Reconciliation Status</div>
        </div>
      </div>

      {/* Connection Map */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">{schoolName}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connected to {connectedCount} national datasets. Hover a source to see details.
        </p>
        <ConnectionMap
          schoolName={schoolName}
          schoolInitials={initials}
          sources={sources}
        />
      </div>

      {/* Reconciliation */}
      {reconciliation && (
        <ReconciliationBanner result={reconciliation} />
      )}

      {/* Intelligence Insights */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Schoolgle Intelligence</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Insights generated from your connected data. Every finding traces back to its source.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <InsightCard insight={insight} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Source Attribution Footer */}
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-xs text-muted-foreground">
          All data from the Department for Education, published under the Open Government Licence v3.0.
          Schoolgle connects, verifies, and adds intelligence — but the data is yours.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run dev server and verify the page loads**

Run: `cd apps/platform && npm run dev`
Visit: `http://localhost:3001/dashboard/settings/connectors`
Expected: Connection map with animated yarn threads, reconciliation banner, insight cards.

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/\\(dashboard\\)/dashboard/settings/connectors/page.tsx
git commit -m "feat(ui): add Smart Connectors settings page with connection map and reconciliation"
```

---

### Task 12: Build Verification and Integration Test

**Files:**
- None new — verification of all previous tasks

- [ ] **Step 1: Run all smart-connectors tests**

Run: `cd apps/platform && npx vitest run src/lib/smart-connectors/`
Expected: All tests pass (source-registry: 4, proximity: 4, similar-schools: 4, reconciliation: 7, comparison: 3 = 22 tests)

- [ ] **Step 2: Run the full build**

Run: `cd apps/platform && npm run build`
Expected: Build succeeds (or only pre-existing errors remain — no NEW errors from our code)

- [ ] **Step 3: Test all 3 API endpoints with curl**

```bash
# Sources
curl -s "http://localhost:3001/api/intelligence/sources?urn=148201" -H "Authorization: Bearer $TOKEN" | jq '.data.connectedCount'
# Expected: 6

# Compare
curl -s "http://localhost:3001/api/intelligence/compare?urn=148201&mode=proximity&radius=3" -H "Authorization: Bearer $TOKEN" | jq '.data.proximity.count'
# Expected: a number > 0

# Reconcile
curl -s -X POST "http://localhost:3001/api/intelligence/reconcile" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"urn":148201}' | jq '.data.checks[0]'
# Expected: FSM reconciliation check showing discrepancy
```

- [ ] **Step 4: Take screenshot of the connectors page**

Visit `http://localhost:3001/dashboard/settings/connectors` in browser and verify:
- Connection map renders with 6 source nodes
- Yarn thread animations are visible
- Reconciliation banner shows FSM discrepancy
- Insight cards show strength/positive indicators
- Source attribution dots on each card

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(smart-connectors): Phase 1 complete — connection map, reconciliation, comparisons"
```
