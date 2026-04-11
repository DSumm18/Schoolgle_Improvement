# Connector Registry Foundation + First BYO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalise Smart Connectors into a 4-layer registry supporting we-control, school-control, BYO, and derived connectors. Ship the first BYO implementation (CSV upload with column mapping and join key auto-detection).

**Architecture:** New `src/lib/connectors/` module wraps the existing `smart-connectors/` work. Registry returns connectors grouped by layer with consumer mapping. Two new Supabase tables (`byo_connectors`, `byo_connector_rows`) store BYO data with RLS. Settings page refactored into 4-layer view. New BYO upload wizard at `/dashboard/settings/connectors/byo/new`.

**Tech Stack:** Next.js 16, TypeScript, Supabase (PostgreSQL), React, Tailwind, Vitest, Papa Parse (CSV).

**Spec:** `docs/superpowers/specs/2026-04-11-connector-registry-phase2.md`

---

## File Structure

```
apps/platform/src/lib/connectors/
  types.ts                       — Connector, JoinKey, ConnectorFieldSchema, BYOColumn
  registry.ts                    — getConnector, getConnectorsForConsumer, getAllConnectors
  consumer-mapping.ts            — CONSUMER_DEPENDENCIES map
  sources/
    dfe.ts                       — 6 DfE Layer 1 connectors (migrates from smart-connectors)
    schoolgle-internal.ts        — EEF, Contextual Factors, Schoolgle Intelligence
    documents.ts                 — Google Drive, OneDrive (Layer 2)
    live-mis.ts                  — Live Attendance, Live Assessments (Layer 2)
    planned.ts                   — All PLANNED stubs (Police, LA SEND, Arbor, etc.)
    byo.ts                       — Runtime loader for BYO connectors from DB
  byo/
    csv-parser.ts                — Parse CSV, detect headers, sample rows
    column-mapper.ts             — Auto-detect join keys, type inference
    byo-store.ts                 — Supabase CRUD for byo_connectors + rows
  __tests__/
    registry.test.ts             — Registry lookup + consumer mapping tests
    csv-parser.test.ts           — CSV parsing tests
    column-mapper.test.ts        — Type inference + join key detection tests
    byo-store.test.ts            — BYO store mock tests

apps/platform/supabase/migrations/
  20260411_byo_connectors.sql    — New tables + RLS policies

apps/platform/src/app/api/connectors/
  registry/route.ts              — GET registry filtered
  [id]/route.ts                  — GET one connector
  byo/route.ts                   — POST new BYO from CSV
  byo/[id]/route.ts              — GET/DELETE BYO connector
  byo/[id]/data/route.ts         — GET paginated rows

apps/platform/src/app/(dashboard)/dashboard/settings/connectors/
  page.tsx                       — Refactored 4-layer view
  byo/new/page.tsx               — BYO CSV upload wizard

apps/platform/src/components/connectors/
  ConnectorRegistryView.tsx      — Main 4-layer view
  ConnectorLayerSection.tsx      — One layer with its cards
  ConnectorCardV2.tsx            — Unified card for any connector
  RequiredConnectorsPanel.tsx    — Reusable panel for apps
  byo/
    ByoCsvUploader.tsx           — Drag-drop + parse + preview
    ByoColumnMapper.tsx          — Type mapping UI
    ByoWizard.tsx                — 4-step wizard orchestrator
```

---

### Task 1: Types and Registry Core

**Files:**
- Create: `apps/platform/src/lib/connectors/types.ts`
- Create: `apps/platform/src/lib/connectors/registry.ts`
- Create: `apps/platform/src/lib/connectors/consumer-mapping.ts`
- Create: `apps/platform/src/lib/connectors/__tests__/registry.test.ts`

- [ ] **Step 1: Write failing test for registry**

```typescript
// apps/platform/src/lib/connectors/__tests__/registry.test.ts
import { describe, it, expect } from 'vitest';
import {
  getConnector,
  getAllConnectors,
  getConnectorsByLayer,
  getConnectorsForConsumer,
} from '../registry';

describe('connector registry', () => {
  it('returns all connectors', () => {
    const all = getAllConnectors();
    expect(all.length).toBeGreaterThan(15); // 6 DfE + internals + documents + live + planned
  });

  it('returns a connector by id', () => {
    const c = getConnector('dfe-attendance');
    expect(c).toBeDefined();
    expect(c?.name).toBe('DfE Attendance');
    expect(c?.layer).toBe(1);
    expect(c?.dataController).toBe('us');
  });

  it('returns undefined for unknown id', () => {
    expect(getConnector('nonexistent')).toBeUndefined();
  });

  it('filters by layer', () => {
    const layer1 = getConnectorsByLayer(1);
    expect(layer1.length).toBeGreaterThanOrEqual(6);
    expect(layer1.every(c => c.layer === 1)).toBe(true);
  });

  it('returns connectors for ofsted-readiness consumer', () => {
    const deps = getConnectorsForConsumer('ofsted-readiness');
    const ids = deps.map(c => c.id);
    expect(ids).toContain('dfe-attendance');
    expect(ids).toContain('dfe-ks2-results');
    expect(ids).toContain('dfe-census');
    expect(ids).toContain('google-drive');
    expect(ids).toContain('contextual-factors');
  });

  it('returns connectors for attendance-behaviour subsection', () => {
    const deps = getConnectorsForConsumer('ofsted-readiness/attendance-behaviour');
    const ids = deps.map(c => c.id);
    expect(ids).toContain('dfe-attendance');
    expect(ids).toContain('dfe-exclusions');
    expect(ids).toContain('live-attendance');
    expect(ids).not.toContain('dfe-ks2-results');
  });

  it('returns empty array for unknown consumer', () => {
    expect(getConnectorsForConsumer('nonexistent-app')).toEqual([]);
  });

  it('all layer 1 connectors are auto and we-control', () => {
    const layer1 = getConnectorsByLayer(1).filter(c => c.status === 'active');
    expect(layer1.every(c => c.dataController === 'us')).toBe(true);
  });

  it('includes planned connectors', () => {
    const all = getAllConnectors();
    const planned = all.filter(c => c.status === 'planned');
    expect(planned.length).toBeGreaterThan(0);
    const ids = planned.map(c => c.id);
    expect(ids).toContain('police-api');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/platform/src/lib/connectors/__tests__/registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create types.ts**

```typescript
// apps/platform/src/lib/connectors/types.ts

export type ConnectorLayer = 1 | 2 | 3 | 4;
export type DataController = 'us' | 'school';
export type ConnectorStatus = 'active' | 'setup-needed' | 'planned';
export type SetupType = 'auto' | 'oauth' | 'upload' | 'api' | 'byo' | 'planned';

export type JoinKey =
  | 'urn'
  | 'laestab'
  | 'postcode'
  | 'pupil_hash'
  | 'staff_id'
  | 'date'
  | 'year_group'
  | 'cohort'
  | 'location_code';

export type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'urn'
  | 'postcode'
  | 'pupil_hash'
  | 'staff_id'
  | 'year_group'
  | 'cohort'
  | 'location_code';

export interface ConnectorColumn {
  name: string;
  type: ColumnType;
  is_join_key?: boolean;
  is_pii?: boolean;
}

export interface ConnectorFieldSchema {
  columns: ConnectorColumn[];
}

export interface ConnectorDataSource {
  type: 'supabase-table' | 'external-api' | 'oauth-fetch' | 'byo-upload';
  reference: string;
}

export interface Connector {
  id: string;
  layer: ConnectorLayer;
  category: string;
  name: string;
  description: string;
  icon: string;
  colour: string;
  dataController: DataController;
  setupType: SetupType;
  status: ConnectorStatus;
  joinKeys: JoinKey[];
  schema?: ConnectorFieldSchema;
  consumers: string[];
  setupGuideUrl?: string;
  dataSource?: ConnectorDataSource;
  rowCount?: number;
  lastSyncAt?: string;
  createdByOrg?: string; // for BYO connectors
}

export interface ConnectorStatusSummary {
  total: number;
  active: number;
  setupNeeded: number;
  planned: number;
  byLayer: Record<ConnectorLayer, number>;
}
```

- [ ] **Step 4: Create consumer-mapping.ts**

```typescript
// apps/platform/src/lib/connectors/consumer-mapping.ts

export const CONSUMER_DEPENDENCIES: Record<string, string[]> = {
  'ofsted-readiness': [
    'dfe-attendance', 'dfe-ks2-results', 'dfe-census', 'dfe-workforce',
    'dfe-exclusions', 'dfe-ks4-results', 'google-drive', 'contextual-factors',
  ],
  'ofsted-readiness/attendance-behaviour': [
    'dfe-attendance', 'dfe-exclusions', 'live-attendance',
    'contextual-factors', 'google-drive',
  ],
  'ofsted-readiness/achievement': [
    'dfe-ks2-results', 'dfe-ks4-results', 'live-assessments',
    'contextual-factors', 'google-drive',
  ],
  'ofsted-readiness/inclusion': [
    'dfe-census', 'contextual-factors', 'google-drive',
  ],
  'ofsted-readiness/leadership': [
    'dfe-workforce', 'google-drive', 'contextual-factors',
  ],
  'school-intelligence': [
    'dfe-attendance', 'dfe-ks2-results', 'dfe-census', 'dfe-workforce',
    'dfe-exclusions', 'dfe-ks4-results', 'eef-research',
    'contextual-factors', 'live-attendance', 'live-assessments',
  ],
  'living-sef': [
    'dfe-attendance', 'dfe-ks2-results', 'dfe-census', 'dfe-workforce',
    'dfe-exclusions', 'google-drive', 'contextual-factors', 'schoolgle-intelligence',
  ],
  'estates-compliance': [
    'google-drive',
  ],
  'send-hub': [
    'dfe-census', 'live-assessments', 'la-send-portal',
  ],
  'actions-hub': [
    'eef-research',
  ],
};
```

- [ ] **Step 5: Create registry.ts**

```typescript
// apps/platform/src/lib/connectors/registry.ts
import type { Connector, ConnectorLayer } from './types';
import { CONSUMER_DEPENDENCIES } from './consumer-mapping';
import { DFE_CONNECTORS } from './sources/dfe';
import { SCHOOLGLE_INTERNAL_CONNECTORS } from './sources/schoolgle-internal';
import { DOCUMENT_CONNECTORS } from './sources/documents';
import { LIVE_MIS_CONNECTORS } from './sources/live-mis';
import { PLANNED_CONNECTORS } from './sources/planned';

const STATIC_CONNECTORS: Connector[] = [
  ...DFE_CONNECTORS,
  ...SCHOOLGLE_INTERNAL_CONNECTORS,
  ...DOCUMENT_CONNECTORS,
  ...LIVE_MIS_CONNECTORS,
  ...PLANNED_CONNECTORS,
];

export function getAllConnectors(): Connector[] {
  return STATIC_CONNECTORS;
}

export function getConnector(id: string): Connector | undefined {
  return STATIC_CONNECTORS.find(c => c.id === id);
}

export function getConnectorsByLayer(layer: ConnectorLayer): Connector[] {
  return STATIC_CONNECTORS.filter(c => c.layer === layer);
}

export function getConnectorsForConsumer(consumerId: string): Connector[] {
  const depIds = CONSUMER_DEPENDENCIES[consumerId];
  if (!depIds) return [];
  return depIds
    .map(id => getConnector(id))
    .filter((c): c is Connector => c !== undefined);
}

export function getConnectorsByJoinKey(key: string): Connector[] {
  return STATIC_CONNECTORS.filter(c => c.joinKeys.includes(key as never));
}
```

- [ ] **Step 6: Create sources/dfe.ts stub (will fail test if empty)**

```typescript
// apps/platform/src/lib/connectors/sources/dfe.ts
import type { Connector } from '../types';

export const DFE_CONNECTORS: Connector[] = [
  {
    id: 'dfe-attendance',
    layer: 1,
    category: 'dfe-historic',
    name: 'DfE Attendance',
    description: 'Overall, authorised, unauthorised absence with persistent absence rates — historic data from DfE.',
    icon: '🏛',
    colour: '#8b5cf6',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys: ['urn', 'laestab'],
    consumers: ['ofsted-readiness', 'school-intelligence', 'living-sef'],
    dataSource: { type: 'supabase-table', reference: 'attendance' },
  },
  {
    id: 'dfe-ks2-results',
    layer: 1,
    category: 'dfe-historic',
    name: 'DfE KS2 Results',
    description: 'Key Stage 2 attainment, progress measures, scaled scores — historic data from DfE.',
    icon: '🏛',
    colour: '#ef4444',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys: ['urn', 'laestab'],
    consumers: ['ofsted-readiness', 'school-intelligence', 'living-sef'],
    dataSource: { type: 'supabase-table', reference: 'ks2_results' },
  },
  {
    id: 'dfe-census',
    layer: 1,
    category: 'dfe-historic',
    name: 'DfE Census',
    description: 'Pupil demographics — roll, FSM, EAL, SEN, ethnicity, mobility.',
    icon: '🏛',
    colour: '#10b981',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys: ['urn', 'laestab', 'postcode'],
    consumers: ['ofsted-readiness', 'school-intelligence', 'living-sef', 'send-hub'],
    dataSource: { type: 'supabase-table', reference: 'census' },
  },
  {
    id: 'dfe-workforce',
    layer: 1,
    category: 'dfe-historic',
    name: 'DfE Workforce',
    description: 'FTE teachers, TAs, support staff, vacancies, pay data.',
    icon: '🏛',
    colour: '#f59e0b',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys: ['urn', 'laestab'],
    consumers: ['ofsted-readiness', 'school-intelligence', 'living-sef'],
    dataSource: { type: 'supabase-table', reference: 'workforce' },
  },
  {
    id: 'dfe-exclusions',
    layer: 1,
    category: 'dfe-historic',
    name: 'DfE Exclusions',
    description: 'Suspensions and permanent exclusions by term and reason.',
    icon: '🏛',
    colour: '#06b6d4',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys: ['urn', 'laestab'],
    consumers: ['ofsted-readiness', 'school-intelligence'],
    dataSource: { type: 'supabase-table', reference: 'exclusions' },
  },
  {
    id: 'dfe-ks4-results',
    layer: 1,
    category: 'dfe-historic',
    name: 'DfE KS4 Results',
    description: 'Attainment 8, Progress 8, EBacc, basics measures.',
    icon: '🏛',
    colour: '#3b82f6',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys: ['urn', 'laestab'],
    consumers: ['ofsted-readiness', 'school-intelligence'],
    dataSource: { type: 'supabase-table', reference: 'ks4_results' },
  },
];
```

- [ ] **Step 7: Create sources/schoolgle-internal.ts**

```typescript
// apps/platform/src/lib/connectors/sources/schoolgle-internal.ts
import type { Connector } from '../types';

export const SCHOOLGLE_INTERNAL_CONNECTORS: Connector[] = [
  {
    id: 'eef-research',
    layer: 1,
    category: 'schoolgle-internal',
    name: 'EEF Research Corpus',
    description: '33 evidence-backed strategies with impact ratings and cost bands.',
    icon: '📚',
    colour: '#a78bfa',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys: [],
    consumers: ['school-intelligence', 'actions-hub', 'ofsted-readiness'],
    dataSource: { type: 'supabase-table', reference: 'eef_strategies' },
  },
  {
    id: 'contextual-factors',
    layer: 1,
    category: 'schoolgle-internal',
    name: 'Contextual Factors',
    description: 'School-logged events and interventions — staff changes, curriculum shifts, pivotal moments.',
    icon: '📍',
    colour: '#f59e0b',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys: ['urn', 'date', 'year_group'],
    consumers: ['ofsted-readiness', 'school-intelligence', 'living-sef'],
    dataSource: { type: 'supabase-table', reference: 'school_contextual_factors' },
  },
  {
    id: 'schoolgle-intelligence',
    layer: 1,
    category: 'schoolgle-internal',
    name: 'Schoolgle Intelligence',
    description: 'AI-generated cross-module analyses and narratives.',
    icon: '🧠',
    colour: '#a78bfa',
    dataController: 'us',
    setupType: 'auto',
    status: 'active',
    joinKeys: ['urn'],
    consumers: ['living-sef', 'ofsted-readiness'],
    dataSource: { type: 'supabase-table', reference: 'school_intelligence_analyses' },
  },
];
```

- [ ] **Step 8: Create sources/documents.ts**

```typescript
// apps/platform/src/lib/connectors/sources/documents.ts
import type { Connector } from '../types';

export const DOCUMENT_CONNECTORS: Connector[] = [
  {
    id: 'google-drive',
    layer: 2,
    category: 'documents',
    name: 'Google Drive',
    description: 'Policies, evidence, SEF and curriculum documents. School grants OAuth read-only access.',
    icon: '📁',
    colour: '#3b82f6',
    dataController: 'school',
    setupType: 'oauth',
    status: 'active',
    joinKeys: [],
    consumers: ['ofsted-readiness', 'estates-compliance', 'living-sef'],
    dataSource: { type: 'oauth-fetch', reference: 'google-drive' },
    setupGuideUrl: '/dashboard/settings/data-connections',
  },
  {
    id: 'onedrive',
    layer: 2,
    category: 'documents',
    name: 'Microsoft OneDrive',
    description: 'Policies, evidence, SEF and curriculum documents from OneDrive or SharePoint.',
    icon: '📁',
    colour: '#f59e0b',
    dataController: 'school',
    setupType: 'oauth',
    status: 'setup-needed',
    joinKeys: [],
    consumers: ['ofsted-readiness', 'estates-compliance', 'living-sef'],
    dataSource: { type: 'oauth-fetch', reference: 'onedrive' },
  },
];
```

- [ ] **Step 9: Create sources/live-mis.ts**

```typescript
// apps/platform/src/lib/connectors/sources/live-mis.ts
import type { Connector } from '../types';

export const LIVE_MIS_CONNECTORS: Connector[] = [
  {
    id: 'live-attendance',
    layer: 2,
    category: 'live-mis',
    name: 'Live Attendance',
    description: 'Current attendance data from school MIS — uploaded CSV or scheduled report.',
    icon: '📊',
    colour: '#10b981',
    dataController: 'school',
    setupType: 'upload',
    status: 'setup-needed',
    joinKeys: ['urn', 'date', 'pupil_hash'],
    consumers: ['ofsted-readiness/attendance-behaviour', 'school-intelligence'],
    dataSource: { type: 'supabase-table', reference: 'attendance_summaries' },
  },
  {
    id: 'live-assessments',
    layer: 2,
    category: 'live-mis',
    name: 'Live Assessments',
    description: 'Current pupil assessment data — pseudonymised at source.',
    icon: '📝',
    colour: '#10b981',
    dataController: 'school',
    setupType: 'upload',
    status: 'setup-needed',
    joinKeys: ['urn', 'pupil_hash', 'year_group'],
    consumers: ['school-intelligence', 'ofsted-readiness/achievement', 'send-hub'],
    dataSource: { type: 'supabase-table', reference: 'pupil_assessments_pseudo' },
  },
];
```

- [ ] **Step 10: Create sources/planned.ts**

```typescript
// apps/platform/src/lib/connectors/sources/planned.ts
import type { Connector } from '../types';

export const PLANNED_CONNECTORS: Connector[] = [
  {
    id: 'arbor-api',
    layer: 2,
    category: 'mis-api',
    name: 'Arbor API',
    description: 'Direct API integration with Arbor MIS — live pupil, attendance, assessment data.',
    icon: '🔵',
    colour: '#52525b',
    dataController: 'school',
    setupType: 'planned',
    status: 'planned',
    joinKeys: ['urn', 'pupil_hash'],
    consumers: ['school-intelligence', 'ofsted-readiness'],
  },
  {
    id: 'sims-api',
    layer: 2,
    category: 'mis-api',
    name: 'SIMS API',
    description: 'Direct API integration with SIMS — when available from ESS.',
    icon: '🔵',
    colour: '#52525b',
    dataController: 'school',
    setupType: 'planned',
    status: 'planned',
    joinKeys: ['urn', 'pupil_hash'],
    consumers: ['school-intelligence', 'ofsted-readiness'],
  },
  {
    id: 'bromcom-api',
    layer: 2,
    category: 'mis-api',
    name: 'Bromcom API',
    description: 'Direct API integration with Bromcom MIS.',
    icon: '🔵',
    colour: '#52525b',
    dataController: 'school',
    setupType: 'planned',
    status: 'planned',
    joinKeys: ['urn', 'pupil_hash'],
    consumers: ['school-intelligence', 'ofsted-readiness'],
  },
  {
    id: 'police-api',
    layer: 1,
    category: 'external-api',
    name: 'Police Information API',
    description: 'Local incident data for safeguarding context — UK Police API.',
    icon: '🚔',
    colour: '#52525b',
    dataController: 'us',
    setupType: 'planned',
    status: 'planned',
    joinKeys: ['postcode'],
    consumers: ['ofsted-readiness'],
  },
  {
    id: 'la-send-portal',
    layer: 1,
    category: 'external-api',
    name: 'LA SEND Portal',
    description: 'EHCP status, funding allocations, annual review dates from local authorities.',
    icon: '🏥',
    colour: '#52525b',
    dataController: 'school',
    setupType: 'planned',
    status: 'planned',
    joinKeys: ['urn', 'pupil_hash'],
    consumers: ['send-hub'],
  },
  {
    id: 'ofsted-public-api',
    layer: 1,
    category: 'external-api',
    name: 'Ofsted Public API',
    description: 'Published inspection reports, ratings, neighbouring school comparisons.',
    icon: '👁',
    colour: '#52525b',
    dataController: 'us',
    setupType: 'planned',
    status: 'planned',
    joinKeys: ['urn'],
    consumers: ['ofsted-readiness', 'school-intelligence'],
  },
];
```

- [ ] **Step 11: Run test to verify it passes**

Run: `npx vitest run apps/platform/src/lib/connectors/__tests__/registry.test.ts`
Expected: PASS — all 9 tests

- [ ] **Step 12: Commit**

```bash
git add apps/platform/src/lib/connectors/types.ts \
        apps/platform/src/lib/connectors/registry.ts \
        apps/platform/src/lib/connectors/consumer-mapping.ts \
        apps/platform/src/lib/connectors/sources/ \
        apps/platform/src/lib/connectors/__tests__/registry.test.ts
git commit -m "feat(connectors): add 4-layer registry foundation with 17 connectors"
```

---

### Task 2: CSV Parser

**Files:**
- Create: `apps/platform/src/lib/connectors/byo/csv-parser.ts`
- Create: `apps/platform/src/lib/connectors/__tests__/csv-parser.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/platform/src/lib/connectors/__tests__/csv-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseCsvString, CsvParseResult } from '../byo/csv-parser';

describe('csv-parser', () => {
  it('parses simple CSV with header', () => {
    const csv = 'postcode,severity,date\nBD2 4ED,high,2026-01-15\nBD3 1XX,low,2026-01-20';
    const result = parseCsvString(csv);
    expect(result.headers).toEqual(['postcode', 'severity', 'date']);
    expect(result.rows.length).toBe(2);
    expect(result.rows[0]).toEqual({ postcode: 'BD2 4ED', severity: 'high', date: '2026-01-15' });
  });

  it('handles empty CSV', () => {
    const result = parseCsvString('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it('trims whitespace from headers', () => {
    const csv = ' postcode , severity , date \nBD2 4ED,high,2026-01-15';
    const result = parseCsvString(csv);
    expect(result.headers).toEqual(['postcode', 'severity', 'date']);
  });

  it('handles quoted values with commas', () => {
    const csv = 'postcode,notes\nBD2 4ED,"incident at school, logged by DSL"';
    const result = parseCsvString(csv);
    expect(result.rows[0]?.notes).toBe('incident at school, logged by DSL');
  });

  it('returns row count and header count', () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6\n7,8,9';
    const result = parseCsvString(csv);
    expect(result.headerCount).toBe(3);
    expect(result.rowCount).toBe(3);
  });

  it('limits preview rows', () => {
    const rows = Array.from({ length: 50 }, (_, i) => `${i},x`).join('\n');
    const csv = `id,label\n${rows}`;
    const result = parseCsvString(csv, { previewLimit: 10 });
    expect(result.preview.length).toBe(10);
    expect(result.rowCount).toBe(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/platform/src/lib/connectors/__tests__/csv-parser.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement csv-parser.ts**

```typescript
// apps/platform/src/lib/connectors/byo/csv-parser.ts

export interface CsvParseResult {
  headers: string[];
  headerCount: number;
  rows: Record<string, string>[];
  rowCount: number;
  preview: Record<string, string>[];
}

export interface CsvParseOptions {
  previewLimit?: number;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseCsvString(csv: string, options: CsvParseOptions = {}): CsvParseResult {
  const previewLimit = options.previewLimit ?? 10;
  const trimmed = csv.trim();

  if (!trimmed) {
    return { headers: [], headerCount: 0, rows: [], rowCount: 0, preview: [] };
  }

  const lines = trimmed.split(/\r?\n/);
  if (lines.length === 0) {
    return { headers: [], headerCount: 0, rows: [], rowCount: 0, preview: [] };
  }

  const headers = splitCsvLine(lines[0]).map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return {
    headers,
    headerCount: headers.length,
    rows,
    rowCount: rows.length,
    preview: rows.slice(0, previewLimit),
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run apps/platform/src/lib/connectors/__tests__/csv-parser.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/connectors/byo/csv-parser.ts \
        apps/platform/src/lib/connectors/__tests__/csv-parser.test.ts
git commit -m "feat(connectors): add CSV parser with quoted value support"
```

---

### Task 3: Column Type Auto-Detection

**Files:**
- Create: `apps/platform/src/lib/connectors/byo/column-mapper.ts`
- Create: `apps/platform/src/lib/connectors/__tests__/column-mapper.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/platform/src/lib/connectors/__tests__/column-mapper.test.ts
import { describe, it, expect } from 'vitest';
import {
  inferColumnType,
  detectJoinKeys,
  buildColumnSchema,
} from '../byo/column-mapper';

describe('column-mapper', () => {
  describe('inferColumnType', () => {
    it('detects postcode column by header name', () => {
      expect(inferColumnType('postcode', ['BD2 4ED', 'M1 1AA'])).toBe('postcode');
      expect(inferColumnType('Post Code', ['SW1A 1AA'])).toBe('postcode');
      expect(inferColumnType('postal_code', ['BD2 4ED'])).toBe('postcode');
    });

    it('detects URN column', () => {
      expect(inferColumnType('urn', ['148201', '100000'])).toBe('urn');
      expect(inferColumnType('URN', ['148201'])).toBe('urn');
    });

    it('detects date column', () => {
      expect(inferColumnType('date', ['2026-01-15', '2026-02-20'])).toBe('date');
      expect(inferColumnType('created_at', ['2026-01-15'])).toBe('date');
      expect(inferColumnType('incident_date', ['15/01/2026'])).toBe('date');
    });

    it('detects year_group column', () => {
      expect(inferColumnType('year_group', ['Year 3', 'Year 6'])).toBe('year_group');
      expect(inferColumnType('year', ['3', '6'])).toBe('year_group');
    });

    it('detects number column from values', () => {
      expect(inferColumnType('count', ['12', '45', '100'])).toBe('number');
    });

    it('defaults to text for unknown columns', () => {
      expect(inferColumnType('random_label', ['abc', 'def'])).toBe('text');
    });

    it('returns text for empty values', () => {
      expect(inferColumnType('random', [])).toBe('text');
    });
  });

  describe('detectJoinKeys', () => {
    it('returns join keys from column schema', () => {
      const schema = {
        columns: [
          { name: 'postcode', type: 'postcode' as const, is_join_key: true },
          { name: 'date', type: 'date' as const, is_join_key: true },
          { name: 'notes', type: 'text' as const },
        ],
      };
      const keys = detectJoinKeys(schema);
      expect(keys).toContain('postcode');
      expect(keys).toContain('date');
      expect(keys).not.toContain('notes');
    });

    it('returns empty array if no join keys', () => {
      const schema = { columns: [{ name: 'notes', type: 'text' as const }] };
      expect(detectJoinKeys(schema)).toEqual([]);
    });
  });

  describe('buildColumnSchema', () => {
    it('builds schema from headers and sample rows', () => {
      const headers = ['postcode', 'severity', 'date'];
      const rows = [
        { postcode: 'BD2 4ED', severity: 'high', date: '2026-01-15' },
        { postcode: 'BD3 1XX', severity: 'low', date: '2026-01-20' },
      ];
      const schema = buildColumnSchema(headers, rows);
      expect(schema.columns).toHaveLength(3);
      expect(schema.columns[0].type).toBe('postcode');
      expect(schema.columns[0].is_join_key).toBe(true);
      expect(schema.columns[2].type).toBe('date');
      expect(schema.columns[2].is_join_key).toBe(true);
      expect(schema.columns[1].type).toBe('text');
      expect(schema.columns[1].is_join_key).toBeFalsy();
    });
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npx vitest run apps/platform/src/lib/connectors/__tests__/column-mapper.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement column-mapper.ts**

```typescript
// apps/platform/src/lib/connectors/byo/column-mapper.ts
import type { ColumnType, ConnectorColumn, ConnectorFieldSchema, JoinKey } from '../types';

const JOIN_KEY_TYPES: ColumnType[] = [
  'urn', 'postcode', 'pupil_hash', 'staff_id', 'year_group', 'cohort', 'location_code', 'date',
];

const HEADER_PATTERNS: Array<{ pattern: RegExp; type: ColumnType }> = [
  { pattern: /^(post[\s_-]?code|postal[\s_-]?code|zip)$/i, type: 'postcode' },
  { pattern: /^urn$/i, type: 'urn' },
  { pattern: /^(pupil[\s_-]?hash|student[\s_-]?hash)$/i, type: 'pupil_hash' },
  { pattern: /^(staff[\s_-]?id|employee[\s_-]?id|teacher[\s_-]?id)$/i, type: 'staff_id' },
  { pattern: /(year[\s_-]?group|^year$|yr[\s_-]?group)/i, type: 'year_group' },
  { pattern: /^cohort$/i, type: 'cohort' },
  { pattern: /^(room|location|location[\s_-]?code|building)$/i, type: 'location_code' },
  { pattern: /(date|_at$|time|when)/i, type: 'date' },
];

export function inferColumnType(header: string, values: string[]): ColumnType {
  for (const { pattern, type } of HEADER_PATTERNS) {
    if (pattern.test(header)) {
      return type;
    }
  }

  const nonEmptyValues = values.filter(v => v && v.trim() !== '').slice(0, 20);
  if (nonEmptyValues.length === 0) return 'text';

  const allNumeric = nonEmptyValues.every(v => /^-?\d+(\.\d+)?$/.test(v.trim()));
  if (allNumeric) return 'number';

  const allDates = nonEmptyValues.every(v =>
    /^\d{4}-\d{2}-\d{2}/.test(v.trim()) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v.trim()),
  );
  if (allDates) return 'date';

  return 'text';
}

export function detectJoinKeys(schema: ConnectorFieldSchema): JoinKey[] {
  return schema.columns
    .filter(c => c.is_join_key && JOIN_KEY_TYPES.includes(c.type))
    .map(c => c.type as JoinKey);
}

export function buildColumnSchema(
  headers: string[],
  rows: Record<string, string>[],
): ConnectorFieldSchema {
  const columns: ConnectorColumn[] = headers.map(header => {
    const values = rows.map(r => r[header] ?? '');
    const type = inferColumnType(header, values);
    const is_join_key = JOIN_KEY_TYPES.includes(type);
    return { name: header, type, is_join_key };
  });
  return { columns };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run apps/platform/src/lib/connectors/__tests__/column-mapper.test.ts`
Expected: PASS — 10 tests

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/connectors/byo/column-mapper.ts \
        apps/platform/src/lib/connectors/__tests__/column-mapper.test.ts
git commit -m "feat(connectors): add column type inference and join key detection for BYO"
```

---

### Task 4: Supabase Migration for BYO Tables

**Files:**
- Create: `apps/platform/supabase/migrations/20260411_byo_connectors.sql`

- [ ] **Step 1: Write the migration**

```sql
-- apps/platform/supabase/migrations/20260411_byo_connectors.sql
-- Bring Your Own (BYO) connector tables for Phase 2 Connector Registry

-- BYO connector definitions (schema + metadata)
CREATE TABLE IF NOT EXISTS byo_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'sheets', 'form', 'excel', 'webhook', 'airtable')),
  column_schema JSONB NOT NULL,
  join_keys TEXT[] NOT NULL DEFAULT '{}',
  row_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

-- BYO connector row data
CREATE TABLE IF NOT EXISTS byo_connector_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES byo_connectors(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  row_data JSONB NOT NULL,
  join_values JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_byo_rows_connector ON byo_connector_rows(connector_id);
CREATE INDEX IF NOT EXISTS idx_byo_rows_org ON byo_connector_rows(organization_id);
CREATE INDEX IF NOT EXISTS idx_byo_rows_join_values ON byo_connector_rows USING GIN(join_values);
CREATE INDEX IF NOT EXISTS idx_byo_connectors_org ON byo_connectors(organization_id);

-- RLS
ALTER TABLE byo_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE byo_connector_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "byo_connectors_select" ON byo_connectors FOR SELECT USING (true);
CREATE POLICY "byo_connectors_insert" ON byo_connectors FOR INSERT WITH CHECK (true);
CREATE POLICY "byo_connectors_update" ON byo_connectors FOR UPDATE USING (true);
CREATE POLICY "byo_connectors_delete" ON byo_connectors FOR DELETE USING (true);

CREATE POLICY "byo_rows_select" ON byo_connector_rows FOR SELECT USING (true);
CREATE POLICY "byo_rows_insert" ON byo_connector_rows FOR INSERT WITH CHECK (true);
CREATE POLICY "byo_rows_delete" ON byo_connector_rows FOR DELETE USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_byo_connectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER byo_connectors_updated_at
  BEFORE UPDATE ON byo_connectors
  FOR EACH ROW
  EXECUTE FUNCTION update_byo_connectors_updated_at();
```

- [ ] **Step 2: Apply the migration via Supabase**

Run via the Supabase MCP `apply_migration` tool with project_id `ygquvauptwyvlhkyxkwy` and the SQL above.

Expected: migration applied, both tables created.

- [ ] **Step 3: Verify tables exist**

Run SQL: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'byo_%';`
Expected: returns `byo_connectors`, `byo_connector_rows`.

- [ ] **Step 4: Commit**

```bash
git add apps/platform/supabase/migrations/20260411_byo_connectors.sql
git commit -m "feat(connectors): add byo_connectors and byo_connector_rows tables with RLS"
```

---

### Task 5: BYO Store (Supabase CRUD)

**Files:**
- Create: `apps/platform/src/lib/connectors/byo/byo-store.ts`
- Create: `apps/platform/src/lib/connectors/__tests__/byo-store.test.ts`

- [ ] **Step 1: Write failing test with mocked Supabase**

```typescript
// apps/platform/src/lib/connectors/__tests__/byo-store.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildInsertRows, extractJoinValues } from '../byo/byo-store';

describe('byo-store helpers', () => {
  describe('extractJoinValues', () => {
    it('extracts join key values from a row', () => {
      const schema = {
        columns: [
          { name: 'postcode', type: 'postcode' as const, is_join_key: true },
          { name: 'severity', type: 'text' as const },
          { name: 'date', type: 'date' as const, is_join_key: true },
        ],
      };
      const row = { postcode: 'BD2 4ED', severity: 'high', date: '2026-01-15' };
      const joinValues = extractJoinValues(schema, row);
      expect(joinValues).toEqual({ postcode: 'BD2 4ED', date: '2026-01-15' });
    });

    it('returns empty object when no join keys', () => {
      const schema = { columns: [{ name: 'notes', type: 'text' as const }] };
      const row = { notes: 'hello' };
      expect(extractJoinValues(schema, row)).toEqual({});
    });
  });

  describe('buildInsertRows', () => {
    it('builds insert payload with connector id and org id', () => {
      const schema = {
        columns: [
          { name: 'postcode', type: 'postcode' as const, is_join_key: true },
          { name: 'severity', type: 'text' as const },
        ],
      };
      const rows = [
        { postcode: 'BD2 4ED', severity: 'high' },
        { postcode: 'BD3 1XX', severity: 'low' },
      ];
      const connectorId = '00000000-0000-0000-0000-000000000001';
      const orgId = '00000000-0000-0000-0000-000000000002';

      const payload = buildInsertRows(rows, schema, connectorId, orgId);

      expect(payload).toHaveLength(2);
      expect(payload[0].connector_id).toBe(connectorId);
      expect(payload[0].organization_id).toBe(orgId);
      expect(payload[0].row_data).toEqual({ postcode: 'BD2 4ED', severity: 'high' });
      expect(payload[0].join_values).toEqual({ postcode: 'BD2 4ED' });
    });
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npx vitest run apps/platform/src/lib/connectors/__tests__/byo-store.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement byo-store.ts**

```typescript
// apps/platform/src/lib/connectors/byo/byo-store.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Connector, ConnectorFieldSchema, JoinKey } from '../types';
import { detectJoinKeys } from './column-mapper';

export interface ByoConnectorRecord {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  source_type: string;
  column_schema: ConnectorFieldSchema;
  join_keys: string[];
  row_count: number;
  last_sync_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ByoRowInsert {
  connector_id: string;
  organization_id: string;
  row_data: Record<string, string>;
  join_values: Record<string, string>;
}

export function extractJoinValues(
  schema: ConnectorFieldSchema,
  row: Record<string, string>,
): Record<string, string> {
  const joinValues: Record<string, string> = {};
  for (const col of schema.columns) {
    if (col.is_join_key) {
      const value = row[col.name];
      if (value !== undefined && value !== null && value !== '') {
        joinValues[col.type] = value;
      }
    }
  }
  return joinValues;
}

export function buildInsertRows(
  rows: Record<string, string>[],
  schema: ConnectorFieldSchema,
  connectorId: string,
  organizationId: string,
): ByoRowInsert[] {
  return rows.map(row => ({
    connector_id: connectorId,
    organization_id: organizationId,
    row_data: row,
    join_values: extractJoinValues(schema, row),
  }));
}

export async function createByoConnector(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    name: string;
    description?: string;
    sourceType: string;
    schema: ConnectorFieldSchema;
    rows: Record<string, string>[];
    createdBy?: string;
  },
): Promise<{ connector: ByoConnectorRecord; rowsInserted: number }> {
  const joinKeys = detectJoinKeys(params.schema);

  // Create the connector definition
  const { data: connector, error: connectorError } = await supabase
    .from('byo_connectors')
    .insert({
      organization_id: params.organizationId,
      name: params.name,
      description: params.description ?? null,
      source_type: params.sourceType,
      column_schema: params.schema,
      join_keys: joinKeys,
      row_count: params.rows.length,
      last_sync_at: new Date().toISOString(),
      created_by: params.createdBy ?? null,
    })
    .select()
    .single();

  if (connectorError || !connector) {
    throw new Error(`Failed to create BYO connector: ${connectorError?.message}`);
  }

  // Insert rows
  if (params.rows.length > 0) {
    const rowInserts = buildInsertRows(params.rows, params.schema, connector.id, params.organizationId);
    const { error: rowsError } = await supabase
      .from('byo_connector_rows')
      .insert(rowInserts);
    if (rowsError) {
      // rollback: delete the connector we just created
      await supabase.from('byo_connectors').delete().eq('id', connector.id);
      throw new Error(`Failed to insert rows: ${rowsError.message}`);
    }
  }

  return { connector: connector as ByoConnectorRecord, rowsInserted: params.rows.length };
}

export async function getByoConnectors(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ByoConnectorRecord[]> {
  const { data, error } = await supabase
    .from('byo_connectors')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ByoConnectorRecord[]) ?? [];
}

export async function getByoConnectorRows(
  supabase: SupabaseClient,
  connectorId: string,
  limit = 100,
  offset = 0,
): Promise<{ rows: Record<string, string>[]; total: number }> {
  const { data, count, error } = await supabase
    .from('byo_connector_rows')
    .select('row_data', { count: 'exact' })
    .eq('connector_id', connectorId)
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return {
    rows: ((data ?? []) as { row_data: Record<string, string> }[]).map(r => r.row_data),
    total: count ?? 0,
  };
}

export async function deleteByoConnector(
  supabase: SupabaseClient,
  connectorId: string,
): Promise<void> {
  const { error } = await supabase.from('byo_connectors').delete().eq('id', connectorId);
  if (error) throw new Error(error.message);
}

export function connectorRecordToConnector(record: ByoConnectorRecord): Connector {
  return {
    id: `byo:${record.id}`,
    layer: 3,
    category: 'byo-csv',
    name: record.name,
    description: record.description ?? 'Bring-your-own connector uploaded by school',
    icon: '📑',
    colour: '#a78bfa',
    dataController: 'school',
    setupType: 'byo',
    status: 'active',
    joinKeys: record.join_keys as JoinKey[],
    schema: record.column_schema,
    consumers: [],
    dataSource: { type: 'byo-upload', reference: record.id },
    rowCount: record.row_count,
    lastSyncAt: record.last_sync_at ?? undefined,
    createdByOrg: record.organization_id,
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run apps/platform/src/lib/connectors/__tests__/byo-store.test.ts`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/connectors/byo/byo-store.ts \
        apps/platform/src/lib/connectors/__tests__/byo-store.test.ts
git commit -m "feat(connectors): add BYO store with Supabase CRUD and join value extraction"
```

---

### Task 6: API — Connector Registry Endpoint

**Files:**
- Create: `apps/platform/src/app/api/connectors/registry/route.ts`

- [ ] **Step 1: Create the registry API route**

```typescript
// apps/platform/src/app/api/connectors/registry/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  getAllConnectors,
  getConnectorsByLayer,
  getConnectorsForConsumer,
} from '@/lib/connectors/registry';
import { getByoConnectors, connectorRecordToConnector } from '@/lib/connectors/byo/byo-store';
import type { Connector, ConnectorLayer } from '@/lib/connectors/types';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const url = new URL(req.url);
  const layer = url.searchParams.get('layer');
  const status = url.searchParams.get('status');
  const consumer = url.searchParams.get('consumer');
  const joinKey = url.searchParams.get('joinKey');

  let connectors: Connector[] = [];

  if (consumer) {
    connectors = getConnectorsForConsumer(consumer);
  } else if (layer) {
    const layerNum = parseInt(layer, 10) as ConnectorLayer;
    if (![1, 2, 3, 4].includes(layerNum)) {
      return apiError('Invalid layer — must be 1, 2, 3 or 4', 400);
    }
    connectors = getConnectorsByLayer(layerNum);
  } else {
    connectors = getAllConnectors();
  }

  // Load BYO connectors for this organization if layer=3 or no filter
  if (!layer || layer === '3') {
    try {
      const supabase = createServiceRoleClient();
      const byoRecords = await getByoConnectors(supabase, auth.organizationId);
      const byoConnectors = byoRecords.map(connectorRecordToConnector);
      connectors = [...connectors, ...byoConnectors];
    } catch {
      // silently continue — BYO load failure shouldn't break the registry
    }
  }

  if (status) {
    connectors = connectors.filter(c => c.status === status);
  }

  if (joinKey) {
    connectors = connectors.filter(c => c.joinKeys.includes(joinKey as never));
  }

  const summary = {
    total: connectors.length,
    active: connectors.filter(c => c.status === 'active').length,
    setupNeeded: connectors.filter(c => c.status === 'setup-needed').length,
    planned: connectors.filter(c => c.status === 'planned').length,
    byLayer: {
      1: connectors.filter(c => c.layer === 1).length,
      2: connectors.filter(c => c.layer === 2).length,
      3: connectors.filter(c => c.layer === 3).length,
      4: connectors.filter(c => c.layer === 4).length,
    },
  };

  return apiSuccess({ connectors, summary });
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/app/api/connectors/registry/route.ts
git commit -m "feat(api): add /api/connectors/registry with layer/status/consumer filters"
```

---

### Task 7: API — BYO Create and Read Endpoints

**Files:**
- Create: `apps/platform/src/app/api/connectors/byo/route.ts`
- Create: `apps/platform/src/app/api/connectors/byo/[id]/route.ts`
- Create: `apps/platform/src/app/api/connectors/byo/[id]/data/route.ts`

- [ ] **Step 1: Create POST /api/connectors/byo**

```typescript
// apps/platform/src/app/api/connectors/byo/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createByoConnector, connectorRecordToConnector, getByoConnectors } from '@/lib/connectors/byo/byo-store';
import type { ConnectorFieldSchema } from '@/lib/connectors/types';

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const records = await getByoConnectors(supabase, auth.organizationId);
  return apiSuccess({
    connectors: records.map(connectorRecordToConnector),
    count: records.length,
  });
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { name, description, sourceType, schema, rows } = body as {
    name: string;
    description?: string;
    sourceType: 'csv' | 'sheets' | 'form' | 'excel' | 'webhook' | 'airtable';
    schema: ConnectorFieldSchema;
    rows: Record<string, string>[];
  };

  if (!name || !sourceType || !schema || !Array.isArray(rows)) {
    return apiError('Missing required fields: name, sourceType, schema, rows', 400);
  }

  if (name.length > 100) {
    return apiError('Name must be 100 characters or fewer', 400);
  }

  if (rows.length > 10000) {
    return apiError('Maximum 10,000 rows per upload', 400);
  }

  const supabase = createServiceRoleClient();

  try {
    const { connector, rowsInserted } = await createByoConnector(supabase, {
      organizationId: auth.organizationId,
      name,
      description,
      sourceType,
      schema,
      rows,
      createdBy: auth.userId,
    });

    return apiSuccess({
      connector: connectorRecordToConnector(connector),
      rowsInserted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create BYO connector';
    return apiError(message, 500);
  }
});
```

- [ ] **Step 2: Create GET/DELETE /api/connectors/byo/[id]**

```typescript
// apps/platform/src/app/api/connectors/byo/[id]/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { deleteByoConnector, connectorRecordToConnector } from '@/lib/connectors/byo/byo-store';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1);
  if (!id) return apiError('Missing connector id', 400);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('byo_connectors')
    .select('*')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single();

  if (error || !data) return apiError('Connector not found', 404);
  return apiSuccess({ connector: connectorRecordToConnector(data) });
});

export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1);
  if (!id) return apiError('Missing connector id', 400);

  const supabase = createServiceRoleClient();

  // Verify ownership before delete
  const { data: existing } = await supabase
    .from('byo_connectors')
    .select('id')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single();

  if (!existing) return apiError('Connector not found', 404);

  await deleteByoConnector(supabase, id);
  return apiSuccess({ deleted: true });
});
```

- [ ] **Step 3: Create GET /api/connectors/byo/[id]/data**

```typescript
// apps/platform/src/app/api/connectors/byo/[id]/data/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { getByoConnectorRows } from '@/lib/connectors/byo/byo-store';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const pathParts = req.nextUrl.pathname.split('/');
  const id = pathParts[pathParts.length - 2];
  if (!id) return apiError('Missing connector id', 400);

  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10);

  const supabase = createServiceRoleClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from('byo_connectors')
    .select('id')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single();

  if (!existing) return apiError('Connector not found', 404);

  const { rows, total } = await getByoConnectorRows(supabase, id, limit, offset);
  return apiSuccess({ rows, total, limit, offset });
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/app/api/connectors/byo/
git commit -m "feat(api): add BYO connector create/read/delete and paginated data endpoints"
```

---

### Task 8: UI — ConnectorCardV2 and RequiredConnectorsPanel

**Files:**
- Create: `apps/platform/src/components/connectors/ConnectorCardV2.tsx`
- Create: `apps/platform/src/components/connectors/RequiredConnectorsPanel.tsx`

- [ ] **Step 1: Create ConnectorCardV2 component**

```tsx
// apps/platform/src/components/connectors/ConnectorCardV2.tsx
"use client";

import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { Connector } from '@/lib/connectors/types';

interface ConnectorCardV2Props {
  connector: Connector;
  onClick?: () => void;
}

const STATUS_ICON = {
  active: CheckCircle2,
  'setup-needed': AlertCircle,
  planned: Clock,
};

const STATUS_COLOUR = {
  active: 'text-emerald-500 border-emerald-500/30',
  'setup-needed': 'text-amber-500 border-amber-500/30',
  planned: 'text-muted-foreground border-border opacity-60',
};

const SETUP_TAG_STYLE: Record<string, string> = {
  auto: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  oauth: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  upload: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  api: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  byo: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  planned: 'bg-muted text-muted-foreground border-border',
};

export function ConnectorCardV2({ connector, onClick }: ConnectorCardV2Props) {
  const StatusIcon = STATUS_ICON[connector.status];
  const statusClass = STATUS_COLOUR[connector.status];
  const setupTagClass = SETUP_TAG_STYLE[connector.setupType] ?? SETUP_TAG_STYLE.auto;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors ${statusClass} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${connector.colour}15`, border: `1px solid ${connector.colour}33` }}
        >
          {connector.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground truncate">{connector.name}</h3>
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">
            {connector.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3 pt-2 border-t border-border/30">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${setupTagClass}`}>
          {connector.setupType}
        </span>
        {connector.rowCount !== undefined && connector.rowCount > 0 && (
          <span className="text-[9px] text-muted-foreground">
            {connector.rowCount.toLocaleString()} rows
          </span>
        )}
        {connector.joinKeys.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            {connector.joinKeys.slice(0, 3).map(key => (
              <span
                key={key}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20"
              >
                {key}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RequiredConnectorsPanel**

```tsx
// apps/platform/src/components/connectors/RequiredConnectorsPanel.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Link2, AlertCircle } from 'lucide-react';
import { ConnectorCardV2 } from './ConnectorCardV2';
import { supabase } from '@/lib/supabase';
import type { Connector } from '@/lib/connectors/types';

interface RequiredConnectorsPanelProps {
  consumerId: string;
  title?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export function RequiredConnectorsPanel({ consumerId, title = 'Required Data Connectors' }: RequiredConnectorsPanelProps) {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/connectors/registry?consumer=${encodeURIComponent(consumerId)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setConnectors(data.data?.connectors ?? []);
      }
      setLoading(false);
    }
    load();
  }, [consumerId]);

  if (loading) return null;
  if (connectors.length === 0) return null;

  const activeCount = connectors.filter(c => c.status === 'active').length;
  const setupNeeded = connectors.filter(c => c.status === 'setup-needed');

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <Link2 className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {activeCount} of {connectors.length} connected
        </span>
      </div>

      {setupNeeded.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-[11px] text-amber-500 font-semibold">
            {setupNeeded.length} connector{setupNeeded.length > 1 ? 's' : ''} need setup
          </span>
          <Link
            href="/dashboard/settings/connectors"
            className="ml-auto text-[10px] font-bold text-amber-500 hover:text-amber-400"
          >
            Set up →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {connectors.map(c => (
          <ConnectorCardV2 key={c.id} connector={c} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/components/connectors/ConnectorCardV2.tsx \
        apps/platform/src/components/connectors/RequiredConnectorsPanel.tsx
git commit -m "feat(ui): add ConnectorCardV2 and RequiredConnectorsPanel components"
```

---

### Task 9: UI — Refactored Settings Page with 4 Layers

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/dashboard/settings/connectors/page.tsx`
- Create: `apps/platform/src/components/connectors/ConnectorLayerSection.tsx`

- [ ] **Step 1: Create ConnectorLayerSection**

```tsx
// apps/platform/src/components/connectors/ConnectorLayerSection.tsx
"use client";

import { ConnectorCardV2 } from './ConnectorCardV2';
import type { Connector, ConnectorLayer } from '@/lib/connectors/types';

const LAYER_META: Record<ConnectorLayer, { title: string; subtitle: string; colour: string; emoji: string }> = {
  1: {
    title: 'Layer 1 — We-Control',
    subtitle: 'Auto-connected. Zero school effort. We are data controller. National benchmark layer.',
    colour: '#1d70b8',
    emoji: '🏛',
  },
  2: {
    title: 'Layer 2 — School-Control Pre-Built',
    subtitle: 'School authorises access. We are data processor. Common MIS and Drive systems.',
    colour: '#10b981',
    emoji: '🔐',
  },
  3: {
    title: 'Layer 3 — Bring Your Own (BYO)',
    subtitle: 'Plug in ANY data source. Name it. Map columns. Use it anywhere.',
    colour: '#a78bfa',
    emoji: '📑',
  },
  4: {
    title: 'Layer 4 — Derived Connectors',
    subtitle: 'Reports built by combining other layers become connectors themselves.',
    colour: '#f59e0b',
    emoji: '📊',
  },
};

interface Props {
  layer: ConnectorLayer;
  connectors: Connector[];
  extraAction?: React.ReactNode;
}

export function ConnectorLayerSection({ layer, connectors, extraAction }: Props) {
  const meta = LAYER_META[layer];

  return (
    <div className="mb-8">
      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-border">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${meta.colour}15`, border: `1.5px solid ${meta.colour}44` }}
        >
          {meta.emoji}
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-foreground">{meta.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
        </div>
        {extraAction}
      </div>

      {connectors.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
          No connectors in this layer yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {connectors.map(c => (
            <ConnectorCardV2 key={c.id} connector={c} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the settings connectors page**

```tsx
// apps/platform/src/app/(dashboard)/dashboard/settings/connectors/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plug, Plus, ArrowLeft } from 'lucide-react';
import { ModulePageHeader } from '@/components/ui/module-page-header';
import { ConnectorLayerSection } from '@/components/connectors/ConnectorLayerSection';
import { supabase } from '@/lib/supabase';
import type { Connector } from '@/lib/connectors/types';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const headers = await getAuthHeaders();
    const res = await fetch('/api/connectors/registry', { headers });
    if (res.ok) {
      const data = await res.json();
      setConnectors(data.data?.connectors ?? []);
    }
    setLoading(false);
  }

  const l1 = connectors.filter(c => c.layer === 1);
  const l2 = connectors.filter(c => c.layer === 2);
  const l3 = connectors.filter(c => c.layer === 3);
  const l4 = connectors.filter(c => c.layer === 4);

  const activeCount = connectors.filter(c => c.status === 'active').length;
  const plannedCount = connectors.filter(c => c.status === 'planned').length;

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Settings
      </Link>

      <ModulePageHeader
        moduleId="intelligence"
        icon={Plug}
        label="Settings"
        title="Connector Registry"
        description="Every module pulls data through connectors. Four layers: we-control, school-control, bring-your-own, and derived reports."
      />

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-foreground">{connectors.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-emerald-500">{activeCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Active</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-amber-500">{connectors.filter(c => c.status === 'setup-needed').length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Setup Needed</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-muted-foreground">{plannedCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Planned</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm text-muted-foreground">Loading registry...</div>
      ) : (
        <>
          <ConnectorLayerSection layer={1} connectors={l1} />
          <ConnectorLayerSection layer={2} connectors={l2} />
          <ConnectorLayerSection
            layer={3}
            connectors={l3}
            extraAction={
              <Link
                href="/dashboard/settings/connectors/byo/new"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/15 text-purple-500 border border-purple-500/30 text-xs font-semibold hover:bg-purple-500/25 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add BYO Connector
              </Link>
            }
          />
          <ConnectorLayerSection layer={4} connectors={l4} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/\(dashboard\)/dashboard/settings/connectors/page.tsx \
        apps/platform/src/components/connectors/ConnectorLayerSection.tsx
git commit -m "feat(ui): refactor connectors settings page into 4-layer registry view"
```

---

### Task 10: UI — BYO CSV Upload Wizard

**Files:**
- Create: `apps/platform/src/app/(dashboard)/dashboard/settings/connectors/byo/new/page.tsx`

- [ ] **Step 1: Create the wizard page**

```tsx
// apps/platform/src/app/(dashboard)/dashboard/settings/connectors/byo/new/page.tsx
"use client";

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { parseCsvString, type CsvParseResult } from '@/lib/connectors/byo/csv-parser';
import { buildColumnSchema } from '@/lib/connectors/byo/column-mapper';
import type { ConnectorFieldSchema, ColumnType } from '@/lib/connectors/types';
import { supabase } from '@/lib/supabase';

const COLUMN_TYPES: ColumnType[] = [
  'text', 'number', 'date', 'boolean',
  'urn', 'postcode', 'pupil_hash', 'staff_id', 'year_group', 'cohort', 'location_code',
];

const JOIN_KEY_TYPES = new Set<ColumnType>([
  'urn', 'postcode', 'pupil_hash', 'staff_id', 'year_group', 'cohort', 'location_code', 'date',
]);

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

type Step = 'upload' | 'preview' | 'map' | 'confirm';

export default function NewByoConnectorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [schema, setSchema] = useState<ConnectorFieldSchema | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large — maximum 10 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const result = parseCsvString(csv);
      if (result.headers.length === 0) {
        setError('Could not parse CSV — no headers detected');
        return;
      }
      setParsed(result);
      setSchema(buildColumnSchema(result.headers, result.rows));
      // Derive a default name from the filename
      setName(file.name.replace(/\.csv$/i, '').replace(/[_-]/g, ' '));
      setError(null);
      setStep('preview');
    };
    reader.readAsText(file);
  }

  function updateColumnType(index: number, type: ColumnType) {
    if (!schema) return;
    const updated = {
      columns: schema.columns.map((col, i) =>
        i === index
          ? { ...col, type, is_join_key: JOIN_KEY_TYPES.has(type) }
          : col,
      ),
    };
    setSchema(updated);
  }

  async function handleSubmit() {
    if (!parsed || !schema || !name.trim()) return;
    setSubmitting(true);
    setError(null);

    const headers = await getAuthHeaders();
    const res = await fetch('/api/connectors/byo', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
        sourceType: 'csv',
        schema,
        rows: parsed.rows,
      }),
    });

    if (res.ok) {
      router.push('/dashboard/settings/connectors');
    } else {
      const body = await res.json();
      setError(body.error || 'Failed to create connector');
      setSubmitting(false);
    }
  }

  const joinKeyCount = schema?.columns.filter(c => c.is_join_key).length ?? 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <Link
        href="/dashboard/settings/connectors"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Connectors
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Add BYO Connector</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV to create a new connector. Map the columns, auto-detect join keys, and use it in any report.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['upload', 'preview', 'map', 'confirm'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                step === s
                  ? 'bg-purple-500 text-white'
                  : (['upload', 'preview', 'map', 'confirm'] as const).indexOf(step) > i
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {(['upload', 'preview', 'map', 'confirm'] as const).indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s}
            </span>
            {i < 3 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Upload step */}
      {step === 'upload' && (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-semibold">Drop a CSV file here or click to browse</p>
          <p className="text-[11px] text-muted-foreground mt-1">Maximum 10 MB. First row should be column headers.</p>
          <label className="inline-block mt-4 px-5 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold cursor-pointer hover:bg-purple-600">
            Choose file
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      )}

      {/* Preview step */}
      {step === 'preview' && parsed && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <FileText className="w-5 h-5 text-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {parsed.headerCount} columns · {parsed.rowCount} rows
              </p>
              <p className="text-[11px] text-muted-foreground">Preview shows first 10 rows</p>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  {parsed.headers.map(h => (
                    <th key={h} className="text-left py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.preview.map((row, i) => (
                  <tr key={i} className="border-t border-border/30">
                    {parsed.headers.map(h => (
                      <td key={h} className="py-2 px-3 text-foreground">
                        {row[h] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setStep('upload'); setParsed(null); setSchema(null); }}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('map')}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600"
            >
              Next — Map columns
            </button>
          </div>
        </div>
      )}

      {/* Map step */}
      {step === 'map' && schema && (
        <div className="space-y-4">
          <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-500 font-semibold">
              {joinKeyCount} join key{joinKeyCount !== 1 ? 's' : ''} auto-detected
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Join keys let you combine this data with other connectors. Change a column type to change its join key status.
            </p>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_180px_100px] bg-muted/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <div>Column</div>
              <div>Type</div>
              <div>Join Key</div>
            </div>
            {schema.columns.map((col, i) => (
              <div key={i} className="grid grid-cols-[1fr_180px_100px] items-center px-4 py-2 border-t border-border/30">
                <div className="text-sm font-mono text-foreground">{col.name}</div>
                <select
                  value={col.type}
                  onChange={e => updateColumnType(i, e.target.value as ColumnType)}
                  className="bg-card border border-border rounded px-2 py-1 text-xs"
                >
                  {COLUMN_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div>
                  {col.is_join_key ? (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      join key
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('preview')}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600"
            >
              Next — Name & confirm
            </button>
          </div>
        </div>
      )}

      {/* Confirm step */}
      {step === 'confirm' && schema && parsed && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Connector Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Safeguarding Incidents Log"
              maxLength={100}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-card border border-border text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's in this data set? How is it used?"
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-card border border-border text-sm"
            />
          </div>

          <div className="rounded-lg p-3 bg-purple-500/10 border border-purple-500/30 text-xs">
            <p className="font-semibold text-purple-400 mb-1">Summary</p>
            <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>{parsed.rowCount} rows across {parsed.headerCount} columns</li>
              <li>{joinKeyCount} join key{joinKeyCount !== 1 ? 's' : ''} detected</li>
              <li>Stored in your organisation only (RLS-protected)</li>
              <li>You can delete this connector and all its data at any time</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('map')}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || submitting}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create Connector'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/platform/src/app/\(dashboard\)/dashboard/settings/connectors/byo/
git commit -m "feat(ui): add BYO CSV upload wizard with 4-step flow"
```

---

### Task 11: Build Verification + Integration Test

**Files:**
- None new — verification of all previous tasks

- [ ] **Step 1: Run all connectors tests**

Run: `npx vitest run apps/platform/src/lib/connectors/`
Expected: all tests pass (registry: 9, csv-parser: 6, column-mapper: 10, byo-store: 3 = 28 tests)

- [ ] **Step 2: Run full build**

Run: `cd apps/platform && npm run build`
Expected: build succeeds, new routes compiled (`/api/connectors/registry`, `/api/connectors/byo`, `/dashboard/settings/connectors`, `/dashboard/settings/connectors/byo/new`)

- [ ] **Step 3: Test API endpoints with curl (requires dev server running + bearer token)**

```bash
# Get the full registry
curl -s "http://localhost:3001/api/connectors/registry" -H "Authorization: Bearer $TOKEN" | jq '.data.summary'
# Expected: { total: ~17, active: ~9, setupNeeded: ~4, planned: ~6, byLayer: {...} }

# Get ofsted-readiness consumer dependencies
curl -s "http://localhost:3001/api/connectors/registry?consumer=ofsted-readiness" -H "Authorization: Bearer $TOKEN" | jq '.data.connectors[] | .id'
# Expected: 8 connector ids matching CONSUMER_DEPENDENCIES

# Get layer 1 connectors
curl -s "http://localhost:3001/api/connectors/registry?layer=1" -H "Authorization: Bearer $TOKEN" | jq '.data.summary.byLayer'
```

- [ ] **Step 4: Manual UI check**

Visit `/dashboard/settings/connectors` — verify 4 layers display with connectors grouped correctly.
Visit `/dashboard/settings/connectors/byo/new` — upload a small test CSV, walk through the wizard, confirm connector is created and returns to main page.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(connectors): Phase 2 complete — 4-layer registry + BYO CSV upload"
```
