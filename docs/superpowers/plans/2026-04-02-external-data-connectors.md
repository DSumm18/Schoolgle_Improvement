# External Data Connectors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 6 external data connectors (Postcodes.io, GIAS similar schools, EEF Toolkit API, IDACI deprivation, Police UK crime, DfE KS Benchmarks) that overlay public data onto school data — the key differentiator of Canvas Intelligence.

**Architecture:** Each connector is a lightweight API client in `apps/platform/src/lib/external-data/` with a corresponding Next.js API route in `apps/platform/src/app/api/external-data/`. Public reference data (IDACI, DfE benchmarks) is stored in Supabase tables with no RLS restriction. On-demand connectors (Postcodes.io, Police UK) call external APIs at request time. Existing data (GIAS in DfE warehouse, EEF in TypeScript) gets thin API wrappers.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL), TypeScript, fetch API for external calls

**Existing assets:**
- GIAS data: Already in DfE warehouse Supabase (`getDfeClient()` from `supabase-dfe.ts`, 52K schools)
- EEF Toolkit: Already in `src/lib/eef-toolkit.ts` (33 strategies with impact/cost/evidence)
- DfE KS data: Skeleton tables exist in DfE warehouse but values are NULL
- School lookup API: Exists at `/api/school/lookup` using `lookupSchoolByURN()`

**Test school:** Grove House Primary — URN 148201, postcode BD2 4ED, Bradford

---

## File Structure

```
apps/platform/src/lib/external-data/
├── postcodes-io.ts        # Postcodes.io API client (on-demand, no DB)
├── police-uk.ts           # Police UK API client (on-demand, no DB)
├── idaci.ts               # IDACI lookup from Supabase table
├── gias-similar.ts        # Similar schools query against DfE warehouse
├── dfe-benchmarks.ts      # DfE KS national/LA averages from Supabase table
└── eef-api.ts             # Thin wrapper around existing eef-toolkit.ts

apps/platform/src/app/api/external-data/
├── postcodes/route.ts     # GET ?postcode=BD24ED
├── police/route.ts        # GET ?postcode=BD24ED&date=2024-01
├── idaci/route.ts         # GET ?postcode=BD24ED  (or ?lsoa=Bradford028A)
├── gias/similar/route.ts  # GET ?urn=148201
├── benchmarks/route.ts    # GET ?year=2024&subject=reading&phase=primary
└── eef/route.ts           # GET ?query=feedback  (or GET for all)

apps/platform/supabase/migrations/
└── 20260402_external_data_connectors.sql  # IDACI + DfE benchmarks tables

scripts/
├── import-idaci.ts        # One-time IDACI CSV import script
└── import-dfe-benchmarks.ts  # DfE KS results CSV import script
```

---

## Task 1: Postcodes.io API Client

**Why first:** Bridge connector — Police UK needs lat/lng, IDACI needs LSOA. Both come from postcode lookup.

**Files:**
- Create: `apps/platform/src/lib/external-data/postcodes-io.ts`
- Create: `apps/platform/src/app/api/external-data/postcodes/route.ts`
- Test: `apps/platform/src/lib/external-data/__tests__/postcodes-io.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/external-data/__tests__/postcodes-io.test.ts
import { describe, it, expect } from 'vitest';
import { lookupPostcode, bulkLookupPostcodes } from '../postcodes-io';

describe('postcodes-io', () => {
  it('looks up a valid postcode and returns lat/lng/lsoa', async () => {
    const result = await lookupPostcode('BD2 4ED');
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(53.816, 1);
    expect(result!.longitude).toBeCloseTo(-1.742, 1);
    expect(result!.lsoa).toContain('Bradford');
    expect(result!.admin_district).toBe('Bradford');
  });

  it('returns null for an invalid postcode', async () => {
    const result = await lookupPostcode('ZZ99 9ZZ');
    expect(result).toBeNull();
  });

  it('bulk looks up multiple postcodes', async () => {
    const results = await bulkLookupPostcodes(['BD2 4ED', 'SW1A 1AA']);
    expect(results).toHaveLength(2);
    expect(results[0]?.admin_district).toBe('Bradford');
    expect(results[1]?.admin_district).toBe('Westminster');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/external-data/__tests__/postcodes-io.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/platform/src/lib/external-data/postcodes-io.ts

const BASE_URL = 'https://api.postcodes.io';

export interface PostcodeLookupResult {
  postcode: string;
  latitude: number;
  longitude: number;
  lsoa: string;       // e.g. "Bradford 028A"
  lsoa21: string;     // 2021 LSOA code
  msoa: string;
  admin_district: string;  // e.g. "Bradford"
  admin_ward: string;
  region: string;
  parliamentary_constituency: string;
  ccg: string;
  pfa: string;  // Police Force Area — useful for Police UK
}

export async function lookupPostcode(postcode: string): Promise<PostcodeLookupResult | null> {
  const encoded = encodeURIComponent(postcode.replace(/\s/g, ''));
  const res = await fetch(`${BASE_URL}/postcodes/${encoded}`);
  if (!res.ok) return null;

  const json = await res.json();
  if (json.status !== 200 || !json.result) return null;

  const r = json.result;
  return {
    postcode: r.postcode,
    latitude: r.latitude,
    longitude: r.longitude,
    lsoa: r.lsoa,
    lsoa21: r.lsoa21 ?? r.lsoa,
    msoa: r.msoa,
    admin_district: r.admin_district,
    admin_ward: r.admin_ward,
    region: r.region,
    parliamentary_constituency: r.parliamentary_constituency_2024 ?? r.parliamentary_constituency,
    ccg: r.ccg,
    pfa: r.pfa,
  };
}

export async function bulkLookupPostcodes(postcodes: string[]): Promise<(PostcodeLookupResult | null)[]> {
  // Postcodes.io allows up to 100 postcodes per bulk request
  const chunks: string[][] = [];
  for (let i = 0; i < postcodes.length; i += 100) {
    chunks.push(postcodes.slice(i, i + 100));
  }

  const results: (PostcodeLookupResult | null)[] = [];

  for (const chunk of chunks) {
    const res = await fetch(`${BASE_URL}/postcodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcodes: chunk }),
    });

    if (!res.ok) {
      results.push(...chunk.map(() => null));
      continue;
    }

    const json = await res.json();
    for (const item of json.result) {
      if (!item.result) {
        results.push(null);
        continue;
      }
      const r = item.result;
      results.push({
        postcode: r.postcode,
        latitude: r.latitude,
        longitude: r.longitude,
        lsoa: r.lsoa,
        lsoa21: r.lsoa21 ?? r.lsoa,
        msoa: r.msoa,
        admin_district: r.admin_district,
        admin_ward: r.admin_ward,
        region: r.region,
        parliamentary_constituency: r.parliamentary_constituency_2024 ?? r.parliamentary_constituency,
        ccg: r.ccg,
        pfa: r.pfa,
      });
    }
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/external-data/__tests__/postcodes-io.test.ts`
Expected: 3 tests PASS

- [ ] **Step 5: Write the API route**

```typescript
// apps/platform/src/app/api/external-data/postcodes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { lookupPostcode, bulkLookupPostcodes } from '@/lib/external-data/postcodes-io';

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const postcode = request.nextUrl.searchParams.get('postcode');
  if (!postcode) return apiError('postcode query parameter required', 400);

  const result = await lookupPostcode(postcode);
  if (!result) return apiError('Postcode not found', 404);

  return apiSuccess(result);
});

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();
  const postcodes: string[] = body.postcodes;
  if (!Array.isArray(postcodes) || postcodes.length === 0) {
    return apiError('postcodes array required', 400);
  }
  if (postcodes.length > 100) {
    return apiError('Maximum 100 postcodes per request', 400);
  }

  const results = await bulkLookupPostcodes(postcodes);
  return apiSuccess({ results });
});
```

- [ ] **Step 6: Test the API route with curl**

Run: `curl -s "http://localhost:3001/api/external-data/postcodes?postcode=BD24ED" -H "Authorization: Bearer <token>" | python3 -m json.tool | head -20`
Expected: JSON with latitude ~53.816, longitude ~-1.742, lsoa containing "Bradford"

- [ ] **Step 7: Commit**

```bash
git add apps/platform/src/lib/external-data/postcodes-io.ts \
       apps/platform/src/lib/external-data/__tests__/postcodes-io.test.ts \
       apps/platform/src/app/api/external-data/postcodes/route.ts
git commit -m "feat(connectors): add Postcodes.io API client and route"
```

---

## Task 2: GIAS Similar Schools API

**Why:** Wraps existing DfE warehouse data to find schools similar by phase, type, LA, size, FSM%.

**Files:**
- Create: `apps/platform/src/lib/external-data/gias-similar.ts`
- Create: `apps/platform/src/app/api/external-data/gias/similar/route.ts`
- Test: `apps/platform/src/lib/external-data/__tests__/gias-similar.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/external-data/__tests__/gias-similar.test.ts
import { describe, it, expect } from 'vitest';
import { findSimilarSchools, type SimilarSchoolResult } from '../gias-similar';

describe('gias-similar', () => {
  it('finds schools similar to Grove House Primary by phase and LA', async () => {
    const results = await findSimilarSchools({
      urn: 148201,
      phase: 'Primary',
      la_name: 'Bradford',
      limit: 10,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(10);
    // Should not include the school itself
    expect(results.every((s: SimilarSchoolResult) => s.urn !== 148201)).toBe(true);
    // All should be primary phase
    expect(results.every((s: SimilarSchoolResult) =>
      s.phase_of_education?.toLowerCase().includes('primary')
    )).toBe(true);
  });

  it('returns empty array for non-existent URN with no matches', async () => {
    const results = await findSimilarSchools({
      urn: 999999,
      phase: 'Nonexistent',
      la_name: 'Nowhere',
      limit: 5,
    });
    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/external-data/__tests__/gias-similar.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/platform/src/lib/external-data/gias-similar.ts
import { getDfeClient } from '@/lib/supabase-dfe';

export interface SimilarSchoolQuery {
  urn: number;
  phase: string;
  la_name?: string;
  type_of_establishment?: string;
  fsm_pct?: number;       // For similarity ranking
  number_of_pupils?: number;
  limit?: number;          // Default 20
}

export interface SimilarSchoolResult {
  urn: number;
  establishment_name: string;
  phase_of_education: string;
  type_of_establishment: string;
  la_name: string;
  postcode: string;
  number_of_pupils: number | null;
  percentage_fsm: number | null;
  ofsted_rating: string | null;
  head_title: string | null;
  head_first_name: string | null;
  head_last_name: string | null;
  school_website: string | null;
  similarity_score: number;  // 0-100, higher = more similar
}

export async function findSimilarSchools(query: SimilarSchoolQuery): Promise<SimilarSchoolResult[]> {
  const dfe = getDfeClient();
  const limit = query.limit ?? 20;

  // Query schools matching phase in same LA first, then widen
  let dbQuery = dfe
    .from('schools')
    .select('urn, establishment_name, phase_of_education, type_of_establishment, la_name, postcode, number_of_pupils, percentage_fsm, ofsted_rating, head_title, head_first_name, head_last_name, school_website')
    .neq('urn', query.urn)
    .ilike('phase_of_education', `%${query.phase}%`)
    .eq('establishment_status', 'Open')
    .limit(limit * 3);  // Fetch more, then rank

  if (query.la_name) {
    dbQuery = dbQuery.eq('la_name', query.la_name);
  }

  const { data, error } = await dbQuery;

  if (error || !data || data.length === 0) return [];

  // Score similarity
  const scored = data.map((school: Record<string, unknown>) => {
    let score = 50; // Base score for matching phase

    // Same LA = +20
    if (query.la_name && school.la_name === query.la_name) score += 20;

    // Same type = +15
    if (query.type_of_establishment && school.type_of_establishment === query.type_of_establishment) score += 15;

    // Similar FSM% (within 10 points) = +10
    if (query.fsm_pct != null && school.percentage_fsm != null) {
      const fsmDiff = Math.abs((school.percentage_fsm as number) - query.fsm_pct);
      if (fsmDiff <= 5) score += 10;
      else if (fsmDiff <= 10) score += 5;
    }

    // Similar size (within 25%) = +5
    if (query.number_of_pupils != null && school.number_of_pupils != null) {
      const sizeDiff = Math.abs((school.number_of_pupils as number) - query.number_of_pupils) / query.number_of_pupils;
      if (sizeDiff <= 0.1) score += 5;
      else if (sizeDiff <= 0.25) score += 2;
    }

    return {
      urn: school.urn as number,
      establishment_name: school.establishment_name as string,
      phase_of_education: school.phase_of_education as string,
      type_of_establishment: school.type_of_establishment as string,
      la_name: school.la_name as string,
      postcode: school.postcode as string,
      number_of_pupils: school.number_of_pupils as number | null,
      percentage_fsm: school.percentage_fsm as number | null,
      ofsted_rating: school.ofsted_rating as string | null,
      head_title: school.head_title as string | null,
      head_first_name: school.head_first_name as string | null,
      head_last_name: school.head_last_name as string | null,
      school_website: school.school_website as string | null,
      similarity_score: Math.min(score, 100),
    };
  });

  // Sort by similarity score descending, take top N
  scored.sort((a: SimilarSchoolResult, b: SimilarSchoolResult) => b.similarity_score - a.similarity_score);
  return scored.slice(0, limit);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/external-data/__tests__/gias-similar.test.ts`
Expected: PASS (requires DFE_SUPABASE_URL and DFE_SUPABASE_SERVICE_ROLE_KEY in .env.local)

- [ ] **Step 5: Write the API route**

```typescript
// apps/platform/src/app/api/external-data/gias/similar/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { findSimilarSchools } from '@/lib/external-data/gias-similar';

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const sp = request.nextUrl.searchParams;
  const urn = parseInt(sp.get('urn') ?? '', 10);
  if (isNaN(urn)) return apiError('urn query parameter required (numeric)', 400);

  const phase = sp.get('phase') ?? 'Primary';
  const la_name = sp.get('la_name') ?? undefined;
  const fsm_pct = sp.get('fsm_pct') ? parseFloat(sp.get('fsm_pct')!) : undefined;
  const number_of_pupils = sp.get('pupils') ? parseInt(sp.get('pupils')!, 10) : undefined;
  const limit = sp.get('limit') ? parseInt(sp.get('limit')!, 10) : 20;

  const results = await findSimilarSchools({
    urn, phase, la_name, fsm_pct, number_of_pupils, limit: Math.min(limit, 50),
  });

  return apiSuccess({ school_urn: urn, similar_schools: results, count: results.length });
});
```

- [ ] **Step 6: Test with curl**

Run: `curl -s "http://localhost:3001/api/external-data/gias/similar?urn=148201&phase=Primary&la_name=Bradford&limit=5" -H "Authorization: Bearer <token>" | python3 -m json.tool`
Expected: JSON with 5 similar primary schools in Bradford

- [ ] **Step 7: Commit**

```bash
git add apps/platform/src/lib/external-data/gias-similar.ts \
       apps/platform/src/lib/external-data/__tests__/gias-similar.test.ts \
       apps/platform/src/app/api/external-data/gias/similar/route.ts
git commit -m "feat(connectors): add GIAS similar schools connector"
```

---

## Task 3: EEF Toolkit API Route

**Why:** Wraps existing `eef-toolkit.ts` with an API route so Ed and the frontend can query strategies.

**Files:**
- Create: `apps/platform/src/lib/external-data/eef-api.ts`
- Create: `apps/platform/src/app/api/external-data/eef/route.ts`
- Test: `apps/platform/src/lib/external-data/__tests__/eef-api.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/external-data/__tests__/eef-api.test.ts
import { describe, it, expect } from 'vitest';
import { queryEEFStrategies } from '../eef-api';

describe('eef-api', () => {
  it('returns all strategies when no filter', () => {
    const results = queryEEFStrategies({});
    expect(results.length).toBe(33);
  });

  it('filters by keyword', () => {
    const results = queryEEFStrategies({ query: 'feedback' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLowerCase()).toContain('feedback');
  });

  it('filters by category', () => {
    const results = queryEEFStrategies({ category: 'teaching' });
    expect(results.every(s => s.category === 'teaching')).toBe(true);
  });

  it('filters by minimum impact', () => {
    const results = queryEEFStrategies({ minMonthsProgress: 5 });
    expect(results.every(s => s.monthsProgress >= 5)).toBe(true);
  });

  it('filters by max cost rating', () => {
    const results = queryEEFStrategies({ maxCostRating: 2 });
    expect(results.every(s => s.costRating <= 2)).toBe(true);
  });

  it('sorts by impact descending by default', () => {
    const results = queryEEFStrategies({});
    for (let i = 1; i < results.length; i++) {
      expect(results[i].monthsProgress).toBeLessThanOrEqual(results[i - 1].monthsProgress);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/external-data/__tests__/eef-api.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/platform/src/lib/external-data/eef-api.ts
import { eefStrategies, type EEFStrategy } from '@/lib/eef-toolkit';

export interface EEFQueryParams {
  query?: string;
  category?: 'teaching' | 'targeted' | 'wider';
  minMonthsProgress?: number;
  maxCostRating?: number;
  minEvidenceStrength?: number;
  sortBy?: 'impact' | 'cost' | 'evidence';
  limit?: number;
}

export function queryEEFStrategies(params: EEFQueryParams): EEFStrategy[] {
  let results = [...eefStrategies];

  if (params.query) {
    const q = params.query.toLowerCase();
    results = results.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.keywords.some(k => k.toLowerCase().includes(q))
    );
  }

  if (params.category) {
    results = results.filter(s => s.category === params.category);
  }

  if (params.minMonthsProgress != null) {
    results = results.filter(s => s.monthsProgress >= params.minMonthsProgress!);
  }

  if (params.maxCostRating != null) {
    results = results.filter(s => s.costRating <= params.maxCostRating!);
  }

  if (params.minEvidenceStrength != null) {
    results = results.filter(s => s.evidenceStrength >= params.minEvidenceStrength!);
  }

  // Sort
  const sortBy = params.sortBy ?? 'impact';
  results.sort((a, b) => {
    if (sortBy === 'impact') return b.monthsProgress - a.monthsProgress;
    if (sortBy === 'cost') return a.costRating - b.costRating;
    return b.evidenceStrength - a.evidenceStrength;
  });

  if (params.limit) {
    results = results.slice(0, params.limit);
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/external-data/__tests__/eef-api.test.ts`
Expected: 6 tests PASS

- [ ] **Step 5: Write the API route**

```typescript
// apps/platform/src/app/api/external-data/eef/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess } from '@/lib/api-utils';
import { queryEEFStrategies } from '@/lib/external-data/eef-api';

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const sp = request.nextUrl.searchParams;

  const results = queryEEFStrategies({
    query: sp.get('query') ?? undefined,
    category: (sp.get('category') as 'teaching' | 'targeted' | 'wider') ?? undefined,
    minMonthsProgress: sp.get('min_impact') ? parseFloat(sp.get('min_impact')!) : undefined,
    maxCostRating: sp.get('max_cost') ? parseInt(sp.get('max_cost')!, 10) : undefined,
    minEvidenceStrength: sp.get('min_evidence') ? parseInt(sp.get('min_evidence')!, 10) : undefined,
    sortBy: (sp.get('sort') as 'impact' | 'cost' | 'evidence') ?? undefined,
    limit: sp.get('limit') ? parseInt(sp.get('limit')!, 10) : undefined,
  });

  return apiSuccess({ strategies: results, count: results.length });
});
```

- [ ] **Step 6: Test with curl**

Run: `curl -s "http://localhost:3001/api/external-data/eef?query=feedback&max_cost=2" -H "Authorization: Bearer <token>" | python3 -m json.tool`
Expected: JSON with feedback strategy, monthsProgress=6, costRating=1

- [ ] **Step 7: Commit**

```bash
git add apps/platform/src/lib/external-data/eef-api.ts \
       apps/platform/src/lib/external-data/__tests__/eef-api.test.ts \
       apps/platform/src/app/api/external-data/eef/route.ts
git commit -m "feat(connectors): add EEF Toolkit API route"
```

---

## Task 4: IDACI Deprivation Connector

**Why:** Maps postcodes to deprivation scores via LSOA. Used for contextual analysis ("your most deprived cohort has 12% lower attendance").

**Files:**
- Create: `apps/platform/supabase/migrations/20260402_external_data_connectors.sql`
- Create: `apps/platform/src/lib/external-data/idaci.ts`
- Create: `apps/platform/src/app/api/external-data/idaci/route.ts`
- Create: `scripts/import-idaci.ts`
- Test: `apps/platform/src/lib/external-data/__tests__/idaci.test.ts`

- [ ] **Step 1: Create the Supabase migration**

```sql
-- apps/platform/supabase/migrations/20260402_external_data_connectors.sql

-- ══════════════════════════════════════════════════════════════════════════
-- IDACI / IMD Deprivation Data (English Indices of Deprivation 2019)
-- Source: https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019
-- Public data — no RLS restriction needed
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.idaci_deprivation (
  lsoa_code text PRIMARY KEY,             -- e.g. "E01000001"
  lsoa_name text NOT NULL,                -- e.g. "City of London 001A"
  la_name text,                            -- e.g. "City of London"
  imd_rank integer,                        -- 1 = most deprived, 32844 = least
  imd_decile smallint,                     -- 1 (most deprived) to 10 (least)
  idaci_rank integer,                      -- Income Deprivation Affecting Children Index rank
  idaci_decile smallint,                   -- 1-10
  idaci_score numeric(6,4),               -- Raw IDACI score (proportion)
  income_rank integer,
  income_decile smallint,
  education_rank integer,
  education_decile smallint,
  health_rank integer,
  health_decile smallint,
  crime_rank integer,
  crime_decile smallint,
  living_environment_rank integer,
  living_environment_decile smallint,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_idaci_la ON public.idaci_deprivation(la_name);
CREATE INDEX IF NOT EXISTS idx_idaci_decile ON public.idaci_deprivation(idaci_decile);

-- ══════════════════════════════════════════════════════════════════════════
-- LSOA to Postcode mapping (for postcode → LSOA → IDACI lookup)
-- This is populated by Postcodes.io on-demand and cached
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.postcode_lsoa_cache (
  postcode text PRIMARY KEY,              -- Normalised, no spaces
  lsoa_code text,                         -- Links to idaci_deprivation
  lsoa_name text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  admin_district text,
  cached_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_postcode_lsoa ON public.postcode_lsoa_cache(lsoa_code);

-- ══════════════════════════════════════════════════════════════════════════
-- DfE KS National Benchmarks
-- Source: explore-education-statistics.service.gov.uk
-- Public data — no RLS restriction
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.dfe_national_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year text NOT NULL,            -- e.g. "2023-24"
  phase text NOT NULL,                     -- "primary", "secondary"
  level text NOT NULL,                     -- "national", "la"
  la_name text,                            -- NULL for national, LA name for LA-level
  subject text NOT NULL,                   -- "reading", "writing", "maths", "combined", "gps"
  metric text NOT NULL,                    -- "expected_standard_pct", "higher_standard_pct", "average_scaled_score"
  value numeric(6,2),                     -- The percentage or score
  pupil_count integer,                    -- Number of pupils in cohort
  source_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(academic_year, phase, level, la_name, subject, metric)
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_year_phase ON public.dfe_national_benchmarks(academic_year, phase);
CREATE INDEX IF NOT EXISTS idx_benchmarks_la ON public.dfe_national_benchmarks(la_name) WHERE la_name IS NOT NULL;
```

- [ ] **Step 2: Apply the migration**

Run the SQL in the Supabase dashboard or via:
```bash
cd apps/platform && npx supabase db push
```

- [ ] **Step 3: Write the IDACI import script**

```typescript
// scripts/import-idaci.ts
//
// Downloads IoD2019 CSV from gov.uk and imports into idaci_deprivation table.
// Run: npx tsx scripts/import-idaci.ts
//
// CSV source: File 7 from https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019
// Direct: https://assets.publishing.service.gov.uk/media/5d8b364740f0b604d9a168d3/File_7_-_All_IoD2019_Scores__Ranks__Deciles_and_Population_Denominators_3.csv

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_PATH = path.join(__dirname, '../.tmp-data/iod2019.csv');

async function downloadCSV() {
  const url = 'https://assets.publishing.service.gov.uk/media/5d8b364740f0b604d9a168d3/File_7_-_All_IoD2019_Scores__Ranks__Deciles_and_Population_Denominators_3.csv';
  console.log('Downloading IoD2019 CSV...');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const text = await res.text();
  fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
  fs.writeFileSync(CSV_PATH, text);
  console.log(`Downloaded ${(text.length / 1024 / 1024).toFixed(1)}MB`);
}

async function importData() {
  if (!fs.existsSync(CSV_PATH)) await downloadCSV();

  const csv = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  console.log(`Parsed ${records.length} LSOAs`);

  // Map CSV columns to our schema
  // CSV columns: LSOA code (2011), LSOA name (2011), Local Authority District code (2019),
  // Local Authority District name (2019), Index of Multiple Deprivation (IMD) Score, Rank, Decile, etc.
  const rows = records.map((r: Record<string, string>) => ({
    lsoa_code: r['LSOA code (2011)'],
    lsoa_name: r['LSOA name (2011)'],
    la_name: r['Local Authority District name (2019)'],
    imd_rank: parseInt(r['Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)']) || null,
    imd_decile: parseInt(r['Index of Multiple Deprivation (IMD) Decile (where 1 is most deprived 10% of LSOAs)']) || null,
    idaci_rank: parseInt(r['Income Deprivation Affecting Children Index (IDACI) Rank (where 1 is most deprived)']) || null,
    idaci_decile: parseInt(r['Income Deprivation Affecting Children Index (IDACI) Decile (where 1 is most deprived 10% of LSOAs)']) || null,
    idaci_score: parseFloat(r['Income Deprivation Affecting Children Index (IDACI) Score (rate)']) || null,
    income_rank: parseInt(r['Income Rank (where 1 is most deprived)']) || null,
    income_decile: parseInt(r['Income Decile (where 1 is most deprived 10% of LSOAs)']) || null,
    education_rank: parseInt(r['Education, Skills and Training Rank (where 1 is most deprived)']) || null,
    education_decile: parseInt(r['Education, Skills and Training Decile (where 1 is most deprived 10% of LSOAs)']) || null,
    health_rank: parseInt(r['Health Deprivation and Disability Rank (where 1 is most deprived)']) || null,
    health_decile: parseInt(r['Health Deprivation and Disability Decile (where 1 is most deprived 10% of LSOAs)']) || null,
    crime_rank: parseInt(r['Crime Rank (where 1 is most deprived)']) || null,
    crime_decile: parseInt(r['Crime Decile (where 1 is most deprived 10% of LSOAs)']) || null,
    living_environment_rank: parseInt(r['Living Environment Rank (where 1 is most deprived)']) || null,
    living_environment_decile: parseInt(r['Living Environment Decile (where 1 is most deprived 10% of LSOAs)']) || null,
  }));

  // Upsert in batches of 1000
  const BATCH = 1000;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('idaci_deprivation').upsert(batch, { onConflict: 'lsoa_code' });
    if (error) {
      console.error(`Batch ${i / BATCH} failed:`, error.message);
    } else {
      console.log(`Imported ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
    }
  }

  // Verify
  const { count } = await supabase.from('idaci_deprivation').select('*', { count: 'exact', head: true });
  console.log(`\nTotal rows in idaci_deprivation: ${count}`);
}

importData().catch(console.error);
```

- [ ] **Step 4: Run the import script**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 22
npx tsx scripts/import-idaci.ts
```
Expected: ~32,844 LSOAs imported

- [ ] **Step 5: Write the IDACI lookup library**

```typescript
// apps/platform/src/lib/external-data/idaci.ts
import { createServiceRoleClient } from '@/lib/supabase-server';
import { lookupPostcode } from './postcodes-io';

export interface DeprivationResult {
  postcode: string;
  lsoa_code: string;
  lsoa_name: string;
  la_name: string;
  imd_rank: number;
  imd_decile: number;           // 1 = most deprived 10%
  idaci_rank: number;
  idaci_decile: number;
  idaci_score: number;          // Proportion (0-1)
  deprivation_label: string;    // "Most deprived 10%", etc.
}

function decileToLabel(decile: number): string {
  if (decile <= 1) return 'Most deprived 10%';
  if (decile <= 2) return 'Most deprived 20%';
  if (decile <= 3) return 'Most deprived 30%';
  if (decile <= 5) return 'Below average deprivation';
  if (decile <= 7) return 'Average deprivation';
  if (decile <= 9) return 'Above average affluence';
  return 'Least deprived 10%';
}

export async function lookupDeprivation(postcode: string): Promise<DeprivationResult | null> {
  // Step 1: Get LSOA from postcode (via Postcodes.io, cached)
  const supabase = createServiceRoleClient();
  const normalised = postcode.replace(/\s/g, '').toUpperCase();

  // Check cache first
  const { data: cached } = await supabase
    .from('postcode_lsoa_cache')
    .select('lsoa_code, lsoa_name')
    .eq('postcode', normalised)
    .single();

  let lsoaCode: string;
  let lsoaName: string;

  if (cached?.lsoa_code) {
    lsoaCode = cached.lsoa_code;
    lsoaName = cached.lsoa_name;
  } else {
    // Look up via Postcodes.io
    const pcResult = await lookupPostcode(postcode);
    if (!pcResult) return null;

    // The LSOA name from Postcodes.io is like "Bradford 028A"
    // We need the LSOA code (E01...) — query by name match
    lsoaName = pcResult.lsoa;

    // Cache the postcode → LSOA mapping
    await supabase.from('postcode_lsoa_cache').upsert({
      postcode: normalised,
      lsoa_name: pcResult.lsoa,
      lsoa_code: pcResult.lsoa21,
      latitude: pcResult.latitude,
      longitude: pcResult.longitude,
      admin_district: pcResult.admin_district,
    }, { onConflict: 'postcode' });

    lsoaCode = pcResult.lsoa21;
  }

  // Step 2: Look up IDACI by LSOA name (since Postcodes.io gives name, not code)
  const { data: idaci } = await supabase
    .from('idaci_deprivation')
    .select('*')
    .or(`lsoa_code.eq.${lsoaCode},lsoa_name.eq.${lsoaName}`)
    .limit(1)
    .single();

  if (!idaci) return null;

  return {
    postcode,
    lsoa_code: idaci.lsoa_code,
    lsoa_name: idaci.lsoa_name,
    la_name: idaci.la_name,
    imd_rank: idaci.imd_rank,
    imd_decile: idaci.imd_decile,
    idaci_rank: idaci.idaci_rank,
    idaci_decile: idaci.idaci_decile,
    idaci_score: idaci.idaci_score,
    deprivation_label: decileToLabel(idaci.idaci_decile),
  };
}

export async function bulkLookupDeprivation(postcodes: string[]): Promise<Map<string, DeprivationResult | null>> {
  const results = new Map<string, DeprivationResult | null>();
  // Process in parallel batches of 10
  const BATCH = 10;
  for (let i = 0; i < postcodes.length; i += BATCH) {
    const batch = postcodes.slice(i, i + BATCH);
    const promises = batch.map(pc => lookupDeprivation(pc).then(r => ({ pc, r })));
    const resolved = await Promise.all(promises);
    for (const { pc, r } of resolved) {
      results.set(pc, r);
    }
  }
  return results;
}
```

- [ ] **Step 6: Write the failing test**

```typescript
// apps/platform/src/lib/external-data/__tests__/idaci.test.ts
import { describe, it, expect } from 'vitest';
import { lookupDeprivation } from '../idaci';

describe('idaci', () => {
  it('looks up deprivation for BD2 4ED (Bradford)', async () => {
    const result = await lookupDeprivation('BD2 4ED');
    // This test only passes after IDACI data is imported
    expect(result).not.toBeNull();
    expect(result!.la_name).toBe('Bradford');
    expect(result!.imd_decile).toBeGreaterThanOrEqual(1);
    expect(result!.imd_decile).toBeLessThanOrEqual(10);
    expect(result!.idaci_score).toBeGreaterThan(0);
    expect(result!.deprivation_label).toBeTruthy();
  });

  it('returns null for invalid postcode', async () => {
    const result = await lookupDeprivation('ZZ99 9ZZ');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 7: Write the API route**

```typescript
// apps/platform/src/app/api/external-data/idaci/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { lookupDeprivation, bulkLookupDeprivation } from '@/lib/external-data/idaci';

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const postcode = request.nextUrl.searchParams.get('postcode');
  const lsoa = request.nextUrl.searchParams.get('lsoa');

  if (!postcode && !lsoa) return apiError('postcode or lsoa query parameter required', 400);

  if (postcode) {
    const result = await lookupDeprivation(postcode);
    if (!result) return apiError('No deprivation data found for this postcode', 404);
    return apiSuccess(result);
  }

  // Direct LSOA lookup
  const { createServiceRoleClient } = await import('@/lib/supabase-server');
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('idaci_deprivation')
    .select('*')
    .or(`lsoa_code.eq.${lsoa},lsoa_name.eq.${lsoa}`)
    .limit(1)
    .single();

  if (!data) return apiError('LSOA not found', 404);
  return apiSuccess(data);
});

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();
  const postcodes: string[] = body.postcodes;
  if (!Array.isArray(postcodes) || postcodes.length === 0) {
    return apiError('postcodes array required', 400);
  }
  if (postcodes.length > 50) {
    return apiError('Maximum 50 postcodes per request', 400);
  }

  const results = await bulkLookupDeprivation(postcodes);
  const output = Object.fromEntries(results);
  return apiSuccess({ results: output });
});
```

- [ ] **Step 8: Test with curl**

Run: `curl -s "http://localhost:3001/api/external-data/idaci?postcode=BD24ED" -H "Authorization: Bearer <token>" | python3 -m json.tool`
Expected: JSON with imd_decile, idaci_score, deprivation_label

- [ ] **Step 9: Commit**

```bash
git add apps/platform/supabase/migrations/20260402_external_data_connectors.sql \
       apps/platform/src/lib/external-data/idaci.ts \
       apps/platform/src/lib/external-data/__tests__/idaci.test.ts \
       apps/platform/src/app/api/external-data/idaci/route.ts \
       scripts/import-idaci.ts
git commit -m "feat(connectors): add IDACI deprivation connector with import script"
```

---

## Task 5: Police UK Crime Data Connector

**Why:** Correlates local crime data with attendance patterns. "Crime in BD3 has increased 15% — correlating with attendance dips."

**Files:**
- Create: `apps/platform/src/lib/external-data/police-uk.ts`
- Create: `apps/platform/src/app/api/external-data/police/route.ts`
- Test: `apps/platform/src/lib/external-data/__tests__/police-uk.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/external-data/__tests__/police-uk.test.ts
import { describe, it, expect } from 'vitest';
import { getCrimesNearSchool, type CrimeSummary } from '../police-uk';

describe('police-uk', () => {
  it('fetches crimes near BD2 4ED (Grove House Primary)', async () => {
    const result = await getCrimesNearSchool('BD2 4ED');
    expect(result).not.toBeNull();
    expect(result!.total_crimes).toBeGreaterThan(0);
    expect(result!.categories).toBeDefined();
    expect(Object.keys(result!.categories).length).toBeGreaterThan(0);
    expect(result!.postcode).toBe('BD2 4ED');
  });

  it('returns month-over-month comparison when two months provided', async () => {
    const result = await getCrimesNearSchool('BD2 4ED', { months: 2 });
    expect(result).not.toBeNull();
    expect(result!.monthly_breakdown.length).toBe(2);
  });

  it('returns null for invalid postcode', async () => {
    const result = await getCrimesNearSchool('ZZ99 9ZZ');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/external-data/__tests__/police-uk.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/platform/src/lib/external-data/police-uk.ts
import { lookupPostcode } from './postcodes-io';

const BASE_URL = 'https://data.police.uk/api';

export interface CrimeRecord {
  category: string;
  location: { latitude: string; longitude: string; street: { name: string } };
  month: string;
  outcome_status: { category: string } | null;
}

export interface CrimeSummary {
  postcode: string;
  latitude: number;
  longitude: number;
  total_crimes: number;
  categories: Record<string, number>;  // category → count
  monthly_breakdown: Array<{
    month: string;
    total: number;
    categories: Record<string, number>;
  }>;
  top_streets: Array<{ name: string; count: number }>;
  period: { from: string; to: string };
}

interface CrimeQueryOptions {
  months?: number;  // How many months back (default 1, max 12)
  date?: string;    // Specific month YYYY-MM (default: latest available)
}

async function fetchCrimesForMonth(lat: number, lng: number, date: string): Promise<CrimeRecord[]> {
  const url = `${BASE_URL}/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${date}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

function getAvailableMonths(count: number, fromDate?: string): string[] {
  const months: string[] = [];
  const now = fromDate ? new Date(fromDate + '-01') : new Date();
  // Police UK data is typically 2-3 months behind
  now.setMonth(now.getMonth() - 2);

  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export async function getCrimesNearSchool(
  postcode: string,
  options?: CrimeQueryOptions
): Promise<CrimeSummary | null> {
  const pc = await lookupPostcode(postcode);
  if (!pc) return null;

  const monthCount = Math.min(options?.months ?? 1, 12);
  const months = options?.date ? [options.date] : getAvailableMonths(monthCount);

  const allCrimes: CrimeRecord[] = [];
  const monthlyBreakdown: CrimeSummary['monthly_breakdown'] = [];

  for (const month of months) {
    const crimes = await fetchCrimesForMonth(pc.latitude, pc.longitude, month);
    allCrimes.push(...crimes);

    const cats: Record<string, number> = {};
    for (const c of crimes) {
      cats[c.category] = (cats[c.category] || 0) + 1;
    }
    monthlyBreakdown.push({ month, total: crimes.length, categories: cats });
  }

  // Aggregate categories
  const categories: Record<string, number> = {};
  const streetCounts: Record<string, number> = {};
  for (const c of allCrimes) {
    categories[c.category] = (categories[c.category] || 0) + 1;
    const street = c.location?.street?.name ?? 'Unknown';
    streetCounts[street] = (streetCounts[street] || 0) + 1;
  }

  const top_streets = Object.entries(streetCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    postcode,
    latitude: pc.latitude,
    longitude: pc.longitude,
    total_crimes: allCrimes.length,
    categories,
    monthly_breakdown: monthlyBreakdown,
    top_streets,
    period: {
      from: months[months.length - 1],
      to: months[0],
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/external-data/__tests__/police-uk.test.ts`
Expected: 3 tests PASS (first two may be slow — Police UK API can take a few seconds)

- [ ] **Step 5: Write the API route**

```typescript
// apps/platform/src/app/api/external-data/police/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { getCrimesNearSchool } from '@/lib/external-data/police-uk';

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const sp = request.nextUrl.searchParams;
  const postcode = sp.get('postcode');
  if (!postcode) return apiError('postcode query parameter required', 400);

  const months = sp.get('months') ? parseInt(sp.get('months')!, 10) : 1;
  const date = sp.get('date') ?? undefined;

  const result = await getCrimesNearSchool(postcode, {
    months: Math.min(months, 12),
    date,
  });

  if (!result) return apiError('Could not fetch crime data for this postcode', 404);

  return apiSuccess(result);
});
```

- [ ] **Step 6: Test with curl**

Run: `curl -s "http://localhost:3001/api/external-data/police?postcode=BD24ED&months=1" -H "Authorization: Bearer <token>" | python3 -m json.tool | head -30`
Expected: JSON with total_crimes > 0, categories object, top_streets array

- [ ] **Step 7: Commit**

```bash
git add apps/platform/src/lib/external-data/police-uk.ts \
       apps/platform/src/lib/external-data/__tests__/police-uk.test.ts \
       apps/platform/src/app/api/external-data/police/route.ts
git commit -m "feat(connectors): add Police UK crime data connector"
```

---

## Task 6: DfE KS National Benchmarks Connector

**Why:** "Your KS2 reading at 68% is below the national average of 73%." Compares school results against national and LA-level averages.

**Files:**
- Create: `scripts/import-dfe-benchmarks.ts`
- Create: `apps/platform/src/lib/external-data/dfe-benchmarks.ts`
- Create: `apps/platform/src/app/api/external-data/benchmarks/route.ts`
- Test: `apps/platform/src/lib/external-data/__tests__/dfe-benchmarks.test.ts`

- [ ] **Step 1: Write the import script**

```typescript
// scripts/import-dfe-benchmarks.ts
//
// Imports DfE national KS2 benchmark data into dfe_national_benchmarks table.
// Data source: https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment
// Run: npx tsx scripts/import-dfe-benchmarks.ts
//
// Since DfE doesn't have a clean API, we manually define the known national averages.
// These are updated annually when DfE publishes results (typically December).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Source: DfE Statistical First Release, KS2 2022-23 and 2023-24
// https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment
const KS2_NATIONAL = [
  // 2023-24 (latest)
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'reading', metric: 'expected_standard_pct', value: 74, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'reading', metric: 'higher_standard_pct', value: 29, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'reading', metric: 'average_scaled_score', value: 105, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'writing', metric: 'expected_standard_pct', value: 72, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'writing', metric: 'greater_depth_pct', value: 13, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'maths', metric: 'expected_standard_pct', value: 73, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'maths', metric: 'higher_standard_pct', value: 24, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'maths', metric: 'average_scaled_score', value: 104, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'gps', metric: 'expected_standard_pct', value: 72, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'gps', metric: 'higher_standard_pct', value: 30, pupil_count: 636000 },
  { academic_year: '2023-24', phase: 'primary', level: 'national', la_name: null, subject: 'combined', metric: 'expected_standard_pct', value: 61, pupil_count: 636000 },

  // 2022-23
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'reading', metric: 'expected_standard_pct', value: 73, pupil_count: 640000 },
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'reading', metric: 'higher_standard_pct', value: 29, pupil_count: 640000 },
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'reading', metric: 'average_scaled_score', value: 105, pupil_count: 640000 },
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'writing', metric: 'expected_standard_pct', value: 71, pupil_count: 640000 },
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'writing', metric: 'greater_depth_pct', value: 13, pupil_count: 640000 },
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'maths', metric: 'expected_standard_pct', value: 73, pupil_count: 640000 },
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'maths', metric: 'higher_standard_pct', value: 24, pupil_count: 640000 },
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'maths', metric: 'average_scaled_score', value: 104, pupil_count: 640000 },
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'gps', metric: 'expected_standard_pct', value: 72, pupil_count: 640000 },
  { academic_year: '2022-23', phase: 'primary', level: 'national', la_name: null, subject: 'combined', metric: 'expected_standard_pct', value: 60, pupil_count: 640000 },

  // 2021-22 (first year post-COVID)
  { academic_year: '2021-22', phase: 'primary', level: 'national', la_name: null, subject: 'reading', metric: 'expected_standard_pct', value: 75, pupil_count: 620000 },
  { academic_year: '2021-22', phase: 'primary', level: 'national', la_name: null, subject: 'writing', metric: 'expected_standard_pct', value: 69, pupil_count: 620000 },
  { academic_year: '2021-22', phase: 'primary', level: 'national', la_name: null, subject: 'maths', metric: 'expected_standard_pct', value: 71, pupil_count: 620000 },
  { academic_year: '2021-22', phase: 'primary', level: 'national', la_name: null, subject: 'combined', metric: 'expected_standard_pct', value: 59, pupil_count: 620000 },

  // Bradford LA-level 2023-24 (for local comparison)
  { academic_year: '2023-24', phase: 'primary', level: 'la', la_name: 'Bradford', subject: 'reading', metric: 'expected_standard_pct', value: 69, pupil_count: 8200 },
  { academic_year: '2023-24', phase: 'primary', level: 'la', la_name: 'Bradford', subject: 'writing', metric: 'expected_standard_pct', value: 67, pupil_count: 8200 },
  { academic_year: '2023-24', phase: 'primary', level: 'la', la_name: 'Bradford', subject: 'maths', metric: 'expected_standard_pct', value: 69, pupil_count: 8200 },
  { academic_year: '2023-24', phase: 'primary', level: 'la', la_name: 'Bradford', subject: 'combined', metric: 'expected_standard_pct', value: 55, pupil_count: 8200 },
];

async function importBenchmarks() {
  console.log(`Importing ${KS2_NATIONAL.length} benchmark records...`);

  const rows = KS2_NATIONAL.map(r => ({
    ...r,
    source_url: 'https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment',
  }));

  const { error } = await supabase
    .from('dfe_national_benchmarks')
    .upsert(rows, {
      onConflict: 'academic_year,phase,level,la_name,subject,metric',
    });

  if (error) {
    console.error('Import failed:', error.message);
    return;
  }

  const { count } = await supabase
    .from('dfe_national_benchmarks')
    .select('*', { count: 'exact', head: true });

  console.log(`Total rows in dfe_national_benchmarks: ${count}`);
  console.log('Done!');
}

importBenchmarks().catch(console.error);
```

- [ ] **Step 2: Run the import script**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement
npx tsx scripts/import-dfe-benchmarks.ts
```
Expected: ~30 benchmark records imported

- [ ] **Step 3: Write the benchmark lookup library**

```typescript
// apps/platform/src/lib/external-data/dfe-benchmarks.ts
import { createServiceRoleClient } from '@/lib/supabase-server';

export interface BenchmarkQuery {
  academic_year?: string;   // Default: latest
  phase?: string;           // Default: 'primary'
  subject?: string;         // Filter by subject
  la_name?: string;         // Include LA-level data
}

export interface BenchmarkResult {
  academic_year: string;
  phase: string;
  subject: string;
  national: Record<string, number>;   // metric → value
  la?: Record<string, number>;        // metric → value (if la_name provided)
  la_name?: string;
}

export interface SchoolComparison {
  subject: string;
  school_value: number;
  metric: string;
  national_value: number;
  la_value?: number;
  vs_national: number;     // Difference (positive = above national)
  vs_la?: number;
  verdict: 'above' | 'in_line' | 'below';
}

export async function getBenchmarks(query: BenchmarkQuery): Promise<BenchmarkResult[]> {
  const supabase = createServiceRoleClient();
  const year = query.academic_year ?? '2023-24';
  const phase = query.phase ?? 'primary';

  let dbQuery = supabase
    .from('dfe_national_benchmarks')
    .select('*')
    .eq('academic_year', year)
    .eq('phase', phase);

  if (query.subject) {
    dbQuery = dbQuery.eq('subject', query.subject);
  }

  // Get national data
  const { data: nationalData } = await dbQuery.eq('level', 'national');

  // Get LA data if requested
  let laData: typeof nationalData = null;
  if (query.la_name) {
    const { data } = await supabase
      .from('dfe_national_benchmarks')
      .select('*')
      .eq('academic_year', year)
      .eq('phase', phase)
      .eq('level', 'la')
      .eq('la_name', query.la_name);
    laData = data;
  }

  // Group by subject
  const subjects = new Set<string>();
  nationalData?.forEach((r: Record<string, unknown>) => subjects.add(r.subject as string));

  const results: BenchmarkResult[] = [];
  for (const subject of subjects) {
    const national: Record<string, number> = {};
    nationalData
      ?.filter((r: Record<string, unknown>) => r.subject === subject)
      .forEach((r: Record<string, unknown>) => { national[r.metric as string] = r.value as number; });

    const la: Record<string, number> = {};
    laData
      ?.filter((r: Record<string, unknown>) => r.subject === subject)
      .forEach((r: Record<string, unknown>) => { la[r.metric as string] = r.value as number; });

    results.push({
      academic_year: year,
      phase,
      subject,
      national,
      ...(query.la_name ? { la, la_name: query.la_name } : {}),
    });
  }

  return results;
}

export function compareSchoolToBenchmarks(
  schoolResults: Array<{ subject: string; metric: string; value: number }>,
  benchmarks: BenchmarkResult[]
): SchoolComparison[] {
  const comparisons: SchoolComparison[] = [];

  for (const sr of schoolResults) {
    const benchmark = benchmarks.find(b => b.subject === sr.subject);
    if (!benchmark) continue;

    const nationalValue = benchmark.national[sr.metric];
    if (nationalValue == null) continue;

    const diff = sr.value - nationalValue;
    const laValue = benchmark.la?.[sr.metric];
    const laDiff = laValue != null ? sr.value - laValue : undefined;

    comparisons.push({
      subject: sr.subject,
      school_value: sr.value,
      metric: sr.metric,
      national_value: nationalValue,
      la_value: laValue,
      vs_national: diff,
      vs_la: laDiff,
      verdict: diff >= 2 ? 'above' : diff <= -2 ? 'below' : 'in_line',
    });
  }

  return comparisons;
}
```

- [ ] **Step 4: Write the failing test**

```typescript
// apps/platform/src/lib/external-data/__tests__/dfe-benchmarks.test.ts
import { describe, it, expect } from 'vitest';
import { getBenchmarks, compareSchoolToBenchmarks } from '../dfe-benchmarks';

describe('dfe-benchmarks', () => {
  it('gets national KS2 benchmarks for 2023-24', async () => {
    const results = await getBenchmarks({ academic_year: '2023-24', phase: 'primary' });
    expect(results.length).toBeGreaterThan(0);

    const reading = results.find(r => r.subject === 'reading');
    expect(reading).toBeDefined();
    expect(reading!.national.expected_standard_pct).toBe(74);
  });

  it('includes Bradford LA data when requested', async () => {
    const results = await getBenchmarks({
      academic_year: '2023-24',
      phase: 'primary',
      la_name: 'Bradford',
    });

    const reading = results.find(r => r.subject === 'reading');
    expect(reading?.la?.expected_standard_pct).toBe(69);
  });

  it('compares school results against benchmarks', async () => {
    const benchmarks = await getBenchmarks({
      academic_year: '2023-24',
      phase: 'primary',
      la_name: 'Bradford',
    });

    const comparisons = compareSchoolToBenchmarks(
      [{ subject: 'reading', metric: 'expected_standard_pct', value: 68 }],
      benchmarks
    );

    expect(comparisons).toHaveLength(1);
    expect(comparisons[0].vs_national).toBe(-6); // 68 - 74
    expect(comparisons[0].verdict).toBe('below');
    expect(comparisons[0].vs_la).toBe(-1); // 68 - 69
  });
});
```

- [ ] **Step 5: Write the API route**

```typescript
// apps/platform/src/app/api/external-data/benchmarks/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { getBenchmarks, compareSchoolToBenchmarks } from '@/lib/external-data/dfe-benchmarks';

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const sp = request.nextUrl.searchParams;

  const benchmarks = await getBenchmarks({
    academic_year: sp.get('year') ?? undefined,
    phase: sp.get('phase') ?? undefined,
    subject: sp.get('subject') ?? undefined,
    la_name: sp.get('la_name') ?? undefined,
  });

  if (benchmarks.length === 0) {
    return apiError('No benchmark data found for these parameters', 404);
  }

  return apiSuccess({ benchmarks, count: benchmarks.length });
});

// POST: Compare school results against benchmarks
export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();
  const { school_results, academic_year, phase, la_name } = body;

  if (!Array.isArray(school_results) || school_results.length === 0) {
    return apiError('school_results array required with {subject, metric, value}', 400);
  }

  const benchmarks = await getBenchmarks({
    academic_year: academic_year ?? '2023-24',
    phase: phase ?? 'primary',
    la_name,
  });

  const comparisons = compareSchoolToBenchmarks(school_results, benchmarks);

  return apiSuccess({
    comparisons,
    benchmarks,
    summary: {
      above_national: comparisons.filter(c => c.verdict === 'above').length,
      in_line: comparisons.filter(c => c.verdict === 'in_line').length,
      below_national: comparisons.filter(c => c.verdict === 'below').length,
    },
  });
});
```

- [ ] **Step 6: Test with curl**

Run: `curl -s "http://localhost:3001/api/external-data/benchmarks?year=2023-24&phase=primary&la_name=Bradford" -H "Authorization: Bearer <token>" | python3 -m json.tool`
Expected: JSON with reading/writing/maths benchmarks, both national and Bradford LA values

- [ ] **Step 7: Commit**

```bash
git add scripts/import-dfe-benchmarks.ts \
       apps/platform/src/lib/external-data/dfe-benchmarks.ts \
       apps/platform/src/lib/external-data/__tests__/dfe-benchmarks.test.ts \
       apps/platform/src/app/api/external-data/benchmarks/route.ts
git commit -m "feat(connectors): add DfE KS national benchmarks connector"
```

---

## Task 7: Integration Verification & Documentation

**Why:** Verify all 6 connectors work end-to-end with real data for Grove House Primary.

**Files:**
- Modify: `~/dev/_brain/sessions/build-connectors/chat.md` (write evidence)

- [ ] **Step 1: Run all unit tests**

```bash
cd apps/platform
npx vitest run src/lib/external-data/__tests__/
```
Expected: All tests pass

- [ ] **Step 2: Test Postcodes.io API with curl**

```bash
curl -s "https://api.postcodes.io/postcodes/BD24ED" | python3 -c "import sys,json; d=json.load(sys.stdin)['result']; print(f'Lat: {d[\"latitude\"]}, Lng: {d[\"longitude\"]}, LSOA: {d[\"lsoa\"]}')"
```

- [ ] **Step 3: Test Police UK API with curl**

```bash
curl -s "https://data.police.uk/api/crimes-street/all-crime?lat=53.816&lng=-1.742&date=2024-06" | python3 -c "import sys,json; crimes=json.load(sys.stdin); cats={}
for c in crimes: cats[c['category']]=cats.get(c['category'],0)+1
print(f'Total crimes: {len(crimes)}')
for k,v in sorted(cats.items(),key=lambda x:-x[1])[:5]: print(f'  {k}: {v}')"
```

- [ ] **Step 4: Verify IDACI data in Supabase**

```bash
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/idaci_deprivation?lsoa_name=eq.Bradford%20028A&select=lsoa_code,lsoa_name,imd_decile,idaci_decile,idaci_score" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" | python3 -m json.tool
```

- [ ] **Step 5: Verify DfE benchmarks in Supabase**

```bash
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/dfe_national_benchmarks?academic_year=eq.2023-24&subject=eq.reading&select=level,la_name,metric,value" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" | python3 -m json.tool
```

- [ ] **Step 6: Run build check**

```bash
cd apps/platform && npm run build
```
Expected: Build succeeds (or only pre-existing errors)

- [ ] **Step 7: Write evidence to chat.md**

Append all test results, curl outputs, and verification evidence to `~/dev/_brain/sessions/build-connectors/chat.md`.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat(connectors): complete 6 external data connectors with tests and verification"
```

---

## Connector Summary

| # | Connector | Type | Data Source | Join Key | Storage | Status |
|---|-----------|------|------------|----------|---------|--------|
| 1 | Postcodes.io | On-demand API | postcodes.io (free) | Postcode → lat/lng/LSOA | Cache table | NEW |
| 2 | GIAS Similar | DfE warehouse query | Existing schools table | URN | Existing | WRAPPER |
| 3 | EEF Toolkit | Static data API | eef-toolkit.ts (33 strategies) | Strategy keywords | In-code | WRAPPER |
| 4 | IDACI | Imported CSV | gov.uk IoD2019 | Postcode → LSOA → deprivation | New table | NEW |
| 5 | Police UK | On-demand API | data.police.uk | Lat/lng from postcode | None | NEW |
| 6 | DfE Benchmarks | Imported data | DfE EES | Year + subject | New table | NEW |

## Data Flow

```
School (URN 148201, BD2 4ED)
  │
  ├─ URN ──→ GIAS Similar Schools (Task 2)
  │           "10 similar primaries in Bradford"
  │
  ├─ Postcode ──→ Postcodes.io (Task 1)
  │   │           lat=53.816, lng=-1.742, LSOA=Bradford 028A
  │   │
  │   ├──→ IDACI (Task 4)
  │   │     "IMD decile 3 — most deprived 30%"
  │   │
  │   └──→ Police UK (Task 5)
  │         "142 crimes in June 2024, ASB highest"
  │
  ├─ KS2 results ──→ DfE Benchmarks (Task 6)
  │                   "Reading 68% vs national 74% (below)"
  │
  └─ Findings ──→ EEF Toolkit (Task 3)
                   "Feedback: +6 months, cost £, evidence 5/5"
```
