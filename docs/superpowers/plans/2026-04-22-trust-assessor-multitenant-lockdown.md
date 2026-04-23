# Trust Assessor — Multi-Tenant Lockdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock down the Trust Assessor so any school/trust login sees only its own data, with zero PAYMAT/Grove-House hardcoding. Trust-level orgs see the trust overview + per-school drill-down; school-level orgs see only their own school's view.

**Architecture:** All scoping flows from `useAuth().organization.organization_type` and `scopedSchools` (fetched from `/api/organizations/children`). Server-side scoping (`auth.organizationId`) already exists in `/api/trust-analysis/*` — we remove the remaining client-side hardcoding and the one server-side leak in `grove-house/route.ts`, then add a trust-vs-school UI branch. Upstream seed data and RLS policies are already correct.

**Tech Stack:** Next.js 16 App Router, React, Supabase (service-role via `createServiceRoleClient`), Vitest for unit tests, Playwright via magic-link injection for regression.

---

## Out of scope for this plan

- **Phase 2 — Data utilisation enhancement** (combining captures + DfE context into cross-source insights): separate plan after lockdown ships.
- **Phase 3 — Ofsted Readiness dovetail** (auto-publishing Trust Assessor findings as `ofsted_evidence_matches` rows): separate plan after Phase 2.

This plan ships **Phase 1 only**: correctness + multi-tenant safety. No new insights, no new charts.

---

## Files touched

| File | Responsibility | Change |
|---|---|---|
| `apps/platform/src/app/api/trust-analysis/grove-house/route.ts` | Per-pupil aggregator | Remove `SPREADSHEET_FIGURES` hardcode; fetch trust-spreadsheet figures live per-org. Rename to `/api/trust-analysis/per-pupil` (keep old route as redirect for now). |
| `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx` | Trust Assessor UI | Remove `TRUST_SCHOOLS` constant; rename `groveHouseData` → `perPupilData`; remove `GROVE_HOUSE_ORG_ID` gate; add trust-vs-school branch; scope school tabs. |
| `apps/platform/src/lib/trust-analysis/scoped-schools.ts` (new) | Pure helper | Build abbrev lookup from scopedSchools (replaces `TRUST_SCHOOLS`). Unit-tested. |
| `apps/platform/src/lib/trust-analysis/__tests__/scoped-schools.test.ts` (new) | Unit tests | TDD for helper. |
| `apps/platform/src/app/api/trust-analysis/per-pupil/route.ts` (new, replaces grove-house) | Per-pupil aggregator | Cleanly-named route with spreadsheet-figures sourced from DB. |
| `/tmp/playwright-trust-lockdown.mjs` (new, ad-hoc) | Regression test | Three logins: PAYMAT trust, Grove House school, standalone school. |

---

## Test strategy

- **Unit tests** (`scoped-schools.test.ts`) for the abbrev-lookup helper — pure function, easy to test.
- **API integration** — call `/api/trust-analysis/per-pupil` as each of the three test users via curl with Bearer token; verify response body does not contain `SPREADSHEET_FIGURES` values for orgs that haven't uploaded a spreadsheet.
- **Playwright regression** — magic-link login as David (PAYMAT), Alex (Grove House), and a standalone school user; screenshot the Trust Assessor page for each; assert Alex sees only Grove House tabs (no CHPS, CVPS, FPS, HPS, LPS, LGPS visible anywhere).
- **Build gate** — `npm run build` from `apps/platform/` must pass before any commit.

---

## Task 1: TDD helper — abbrev lookup from scopedSchools

Extract the `name.split(' ')[0][0] + ...` logic into a pure function so the page doesn't keep a hardcoded constant. Build it test-first.

**Files:**
- Create: `apps/platform/src/lib/trust-analysis/scoped-schools.ts`
- Create: `apps/platform/src/lib/trust-analysis/__tests__/scoped-schools.test.ts`

- [ ] **Step 1.1: Write the failing test**

```typescript
// apps/platform/src/lib/trust-analysis/__tests__/scoped-schools.test.ts
import { describe, it, expect } from 'vitest';
import { buildAbbrevLookup, resolveSchoolByName, abbreviateSchoolName } from '../scoped-schools';

describe('scoped-schools helpers', () => {
  const scoped = [
    { id: 'o1', name: 'Grove House Primary School', urn: 148201 },
    { id: 'o2', name: 'Clayton Village Primary School', urn: 148869 },
    { id: 'o3', name: 'Lidget Green Primary School', urn: 150016 },
    { id: 'o4', name: 'Rawdon St Peter\'s CE Primary School', urn: 107903 },
  ];

  it('abbreviateSchoolName takes first letter of each significant word', () => {
    expect(abbreviateSchoolName('Grove House Primary School')).toBe('GHPS');
    expect(abbreviateSchoolName('Clayton Village Primary School')).toBe('CVPS');
    expect(abbreviateSchoolName('Lidget Green Primary School')).toBe('LGPS');
  });

  it('abbreviateSchoolName ignores CE / of / the / apostrophes', () => {
    expect(abbreviateSchoolName('Rawdon St Peter\'s CE Primary School')).toBe('RSPPS');
    expect(abbreviateSchoolName('St Mary of the Angels')).toBe('SMA');
  });

  it('buildAbbrevLookup returns abbrev -> {name, urn, id}', () => {
    const lookup = buildAbbrevLookup(scoped);
    expect(lookup.GHPS).toEqual({ id: 'o1', name: 'Grove House Primary School', urn: 148201 });
    expect(lookup.CVPS).toEqual({ id: 'o2', name: 'Clayton Village Primary School', urn: 148869 });
  });

  it('buildAbbrevLookup disambiguates duplicate abbrevs with a numeric suffix', () => {
    const dup = [
      { id: 'a', name: 'Park Primary School', urn: 1 },
      { id: 'b', name: 'Park Primary School', urn: 2 },
    ];
    const lookup = buildAbbrevLookup(dup);
    expect(Object.keys(lookup).sort()).toEqual(['PPS', 'PPS2']);
  });

  it('resolveSchoolByName fuzzy-matches against filename fragments', () => {
    expect(resolveSchoolByName('GHPS_DATA_SUMMARY_2024.xlsx', scoped)).toEqual(
      expect.objectContaining({ name: 'Grove House Primary School' }),
    );
    expect(resolveSchoolByName('Grove House data.xlsx', scoped)).toEqual(
      expect.objectContaining({ name: 'Grove House Primary School' }),
    );
    expect(resolveSchoolByName('no match.xlsx', scoped)).toBeNull();
  });

  it('resolveSchoolByName is case-insensitive', () => {
    expect(resolveSchoolByName('grove house.xlsx', scoped)?.urn).toBe(148201);
    expect(resolveSchoolByName('CLAYTON village.xlsx', scoped)?.urn).toBe(148869);
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `cd apps/platform && npx vitest run src/lib/trust-analysis/__tests__/scoped-schools.test.ts`
Expected: FAIL with "Cannot find module '../scoped-schools'"

- [ ] **Step 1.3: Write the implementation**

```typescript
// apps/platform/src/lib/trust-analysis/scoped-schools.ts

export interface ScopedSchool {
  id: string;
  name: string;
  urn: number | null;
}

const IGNORE_WORDS = new Set([
  'CE', 'C.E.', 'C.E', 'OF', 'THE', 'AND', '&', 'VA', 'VC', 'FOUNDATION',
]);

/**
 * Derive a 3–5 letter abbreviation from a school name by taking the first
 * letter of each significant word. e.g. "Grove House Primary School" → "GHPS".
 * Apostrophes are stripped; "of"/"the"/"CE" are dropped.
 */
export function abbreviateSchoolName(name: string): string {
  const tokens = name
    .toUpperCase()
    .replace(/['']/g, '')
    .split(/[\s-]+/)
    .filter((t) => t.length > 0 && !IGNORE_WORDS.has(t));
  return tokens.map((t) => t[0]).join('');
}

/**
 * Build a map of abbrev → { id, name, urn } for the schools in scope.
 * Disambiguates collisions by appending a numeric suffix (GHPS, GHPS2, …).
 */
export function buildAbbrevLookup(
  schools: ScopedSchool[],
): Record<string, ScopedSchool> {
  const out: Record<string, ScopedSchool> = {};
  for (const s of schools) {
    const base = abbreviateSchoolName(s.name);
    if (!(base in out)) {
      out[base] = s;
      continue;
    }
    for (let i = 2; i < 100; i++) {
      const candidate = `${base}${i}`;
      if (!(candidate in out)) {
        out[candidate] = s;
        break;
      }
    }
  }
  return out;
}

/**
 * Try to resolve which school a filename refers to. First checks each school's
 * abbreviation against the filename (upper-cased); falls back to a
 * case-insensitive substring match on the full name.
 */
export function resolveSchoolByName(
  filename: string,
  schools: ScopedSchool[],
): ScopedSchool | null {
  const upper = filename.toUpperCase();
  const lower = filename.toLowerCase();
  for (const s of schools) {
    const abbrev = abbreviateSchoolName(s.name);
    if (upper.includes(abbrev)) return s;
  }
  for (const s of schools) {
    if (lower.includes(s.name.toLowerCase())) return s;
  }
  return null;
}
```

- [ ] **Step 1.4: Run test to verify it passes**

Run: `cd apps/platform && npx vitest run src/lib/trust-analysis/__tests__/scoped-schools.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 1.5: Commit**

```bash
git add apps/platform/src/lib/trust-analysis/scoped-schools.ts apps/platform/src/lib/trust-analysis/__tests__/scoped-schools.test.ts
git commit -m "feat(trust-analysis): add scoped-schools helper — drop-in replacement for hardcoded TRUST_SCHOOLS"
```

---

## Task 2: Remove SPREADSHEET_FIGURES data leak in grove-house API

The `/api/trust-analysis/grove-house/route.ts` route hardcodes Grove House's self-reported Y1/Y2/Y6 figures (lines 18-23) and returns them to **every** org's `spreadsheetComparison.rows`. If a PAYMAT school with no spreadsheet data logs in, they currently see Grove House's numbers on the spreadsheet side of the comparison. This is a data leak.

**Files:**
- Modify: `apps/platform/src/app/api/trust-analysis/grove-house/route.ts`

- [ ] **Step 2.1: Delete SPREADSHEET_FIGURES constant (lines 18-23)**

Remove the entire constant:
```typescript
// DELETE THESE LINES from grove-house/route.ts
const SPREADSHEET_FIGURES: Record<string, { r: number; w: number; m: number; c?: number }> = {
  Y1: { r: 39, w: 54, m: 59, c: 44 },
  Y2: { r: 66, w: 69, m: 74, c: 62 },
  Y6: { r: 57, w: 54, m: 51, c: 43 },
};
```

- [ ] **Step 2.2: Fetch the org's real spreadsheet data from trust_spreadsheets table**

Replace the `spreadsheetComparison` build block (lines 463-482) with a live DB query. Add this block just before the `spreadsheetComparison` assignment:

```typescript
// Fetch the org's own most-recent trust-spreadsheet (if any) so the CTF-vs-spreadsheet
// comparison uses real self-reported figures, not hardcoded constants.
const { data: spreadsheetRow } = await supabase
  .from('trust_spreadsheets')
  .select('parsed_data, created_at')
  .eq('organization_id', ORG_ID)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

// parsed_data shape: { schools: string[], data: { [abbrev]: { [yg]: { all_pupils: {...} } } } }
// We need the current school's row. For a school-level org, there should be one school entry.
type SpreadsheetRow = {
  r: number | null;
  w: number | null;
  m: number | null;
  c: number | null;
};
const emptyRow: SpreadsheetRow = { r: null, w: null, m: null, c: null };

const buildSpreadsheetRow = (yg: string): SpreadsheetRow => {
  const parsed = spreadsheetRow?.parsed_data as
    | { schools?: string[]; data?: Record<string, Record<string, { all_pupils?: {
        r_are?: number | null; w_are?: number | null; m_are?: number | null; c_are?: number | null;
      } }>> }
    | undefined;
  if (!parsed?.data || !parsed.schools?.length) return emptyRow;
  // Pick the first school — for a school-level org this should be the only one;
  // for a trust this route shouldn't be called at per-school granularity anyway.
  const firstAbbrev = parsed.schools[0];
  const yearData = parsed.data[firstAbbrev]?.[yg]?.all_pupils;
  if (!yearData) return emptyRow;
  return {
    r: yearData.r_are ?? null,
    w: yearData.w_are ?? null,
    m: yearData.m_are ?? null,
    c: yearData.c_are ?? null,
  };
};

const spreadsheetComparison = {
  latestYear,
  rows: [
    { yearGroup: 'Y1', ctf: buildCtfPct(1), spreadsheet: buildSpreadsheetRow('Year 1') },
    { yearGroup: 'Y2', ctf: buildCtfPct(2), spreadsheet: buildSpreadsheetRow('Year 2') },
    { yearGroup: 'Y6', ctf: buildCtfPct(6), spreadsheet: buildSpreadsheetRow('Year 6') },
  ],
};
```

- [ ] **Step 2.3: Run the build**

Run: `cd apps/platform && npm run build 2>&1 | tail -40`
Expected: PASS (or same pre-existing errors, no new errors related to grove-house route)

- [ ] **Step 2.4: Manual curl test — verify leak is closed**

Use David's auth token (grab from browser devtools Local Storage `sb-*-auth-token` when logged into a non-Grove-House org, e.g. Rawdon). Then:

```bash
curl -s "http://localhost:3000/api/trust-analysis/grove-house" \
  -H "Authorization: Bearer <rawdon-access-token>" \
  -H "x-organization-id: <rawdon-org-id>" \
  | jq '.data.spreadsheetComparison.rows'
```

Expected: every `spreadsheet` row is `{r:null, w:null, m:null, c:null}` because Rawdon hasn't uploaded a spreadsheet. Previously would have returned Grove House's `{r:39, w:54, m:59, c:44}`.

- [ ] **Step 2.5: Commit**

```bash
git add apps/platform/src/app/api/trust-analysis/grove-house/route.ts
git commit -m "fix(trust-analysis): close spreadsheet-figures data leak — fetch from trust_spreadsheets per-org instead of hardcoded Grove House values"
```

---

## Task 3: Remove GROVE_HOUSE_ORG_ID client-side gate

page.tsx line 4538-4542 currently short-circuits `setGroveHouseData(null)` for any org that isn't Grove House. That's defensive plumbing from when the API was itself leaky. Now the API is safe (Task 2), we can let every org fetch its own per-pupil data.

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx:4536-4570`

- [ ] **Step 3.1: Delete the org-ID gate and always call the API**

Replace lines 4536-4570 (the whole block starting with `// Also fetch Grove House full data ...` through the end of the Grove House IIFE) with:

```typescript
    // Fetch per-pupil data for the current org. Server scopes by auth.organizationId,
    // so a school login gets only its own pupils; a trust login gets the trust's
    // aggregated per-pupil table (if any school in the trust has CTF data).
    (async () => {
      try {
        const res = await fetch(
          `/api/trust-analysis/grove-house${organizationId ? `?organizationId=${organizationId}` : ''}`,
          { headers: authHeaders },
        );
        const json = await res.json();
        const payload = json.data ?? json;
        const summary = payload.summary;
        if (res.ok && summary && summary.totalPupils > 0) {
          setGrooveHouseStats({
            totalPupils: summary.totalPupils,
            trackablePupils: summary.trackablePupils,
          });
          setGroveHouseData({
            summary,
            eyfsGld: payload.eyfsGld ?? [],
            ks1Data: payload.ks1Data ?? [],
            phonicsData: payload.phonicsData ?? [],
            spreadsheetComparison: payload.spreadsheetComparison ?? { latestYear: 0, rows: [] },
            cohortJourneys: payload.cohortJourneys ?? [],
            spotlightPupil: payload.spotlightPupil ?? null,
            cohortTracking: payload.cohortTracking ?? [],
            cohortMilestones: payload.cohortMilestones ?? [],
            demographicDisaggregation: payload.demographicDisaggregation ?? null,
          });
        } else {
          // No per-pupil data for this org — locked state handled by existing UI
          setGroveHouseData(null);
        }
      } catch {
        setGroveHouseData(null);
      }
    })();
```

- [ ] **Step 3.2: Build + manual smoke**

Run: `cd apps/platform && npm run build 2>&1 | tail -20`
Expected: PASS

With dev server running on port 3001, log in as David (PAYMAT super-admin). Navigate to Grove House → Trust Assessor. Confirm the Deep Analytics section renders with Grove House's per-pupil data.

- [ ] **Step 3.3: Commit**

```bash
git add apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx
git commit -m "fix(trust-assessor): remove GROVE_HOUSE_ORG_ID client gate — let every org fetch its own per-pupil data (server already scopes correctly)"
```

---

## Task 4: Rename groveHouseData state and references

Purely cosmetic but important — the name is misleading now that it holds any org's data. Rename `groveHouseData` → `perPupilData`, `setGroveHouseData` → `setPerPupilData`, and `grooveHouseStats` (which has a typo anyway) → `perPupilStats`.

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx` (multiple lines)

- [ ] **Step 4.1: Rename with find-and-replace**

```bash
cd apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor
# Replace in the single file
sed -i.bak 's/groveHouseData/perPupilData/g; s/setGroveHouseData/setPerPupilData/g; s/grooveHouseStats/perPupilStats/g; s/setGrooveHouseStats/setPerPupilStats/g' page.tsx
rm page.tsx.bak
```

- [ ] **Step 4.2: Verify no remaining references to the old names**

Run: `grep -n 'groveHouseData\|grooveHouseStats\|setGroveHouseData\|setGrooveHouseStats' apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor/page.tsx`
Expected: (no output)

- [ ] **Step 4.3: Update the no-CTF upsell condition at line ~5240**

The current condition is `!groveHouseData && activeSchoolTab !== 'GHPS'`. The `!== 'GHPS'` part is a Grove-House-special-case that shouldn't exist now. Replace:

```typescript
{/* No-CTF upsell — shows when the active school has no per-pupil data connected */}
{!perPupilData && activeSchoolTab !== 'overview' && (
```

And on the next line, change the heading so it uses the resolved school name (not `TRUST_SCHOOLS[activeSchoolTab]?.name`):

```typescript
<h3 className="text-lg font-semibold text-foreground mb-2">Connect CTF data for {abbrevLookup[activeSchoolTab]?.name ?? activeSchoolTab}</h3>
```

(Note: `abbrevLookup` is added in Task 5. This line will temporarily reference an undefined identifier — that's fine because Task 5 immediately follows and adds it. Don't commit yet.)

- [ ] **Step 4.4: Build**

Skip build for now — it will fail until Task 5 adds `abbrevLookup`. Don't commit yet.

- [ ] **Step 4.5: Commit after Task 5 only**

DO NOT commit yet. Proceed to Task 5, then commit both together.

---

## Task 5: Replace TRUST_SCHOOLS with abbrevLookup derived from scopedSchools

The mechanical heart of the lockdown. Delete the hardcoded constant; compute the same shape from live data.

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx`

- [ ] **Step 5.1: Import the helper**

Near the top of the file (with other `@/lib/trust-analysis/...` imports, around line 62):

```typescript
import { buildAbbrevLookup, resolveSchoolByName } from '@/lib/trust-analysis/scoped-schools';
```

- [ ] **Step 5.2: Delete the TRUST_SCHOOLS constant**

Remove lines 88-96:

```typescript
// DELETE:
const TRUST_SCHOOLS: Record<string, { name: string; urn: number }> = {
  CVPS: { name: "Clayton Village Primary School", urn: 148869 },
  CHPS: { name: "Crossley Hall Primary School", urn: 146581 },
  FPS: { name: "Farnham Primary School", urn: 144862 },
  GHPS: { name: "Grove House Primary School", urn: 148201 },
  HPS: { name: "Hollingwood Primary School", urn: 144860 },
  LPS: { name: "Laycock Primary School", urn: 144861 },
  LGPS: { name: "Lidget Green Primary School", urn: 150016 },
};
```

- [ ] **Step 5.3: Add abbrevLookup memo inside the TrustAssessorPage component**

Immediately after the `setScopedSchools(scoped)` line inside the fetch effect (~line 4511), the `scopedSchools` state is already populated. Add a `useMemo` at component scope (just after `const [scopedSchools, setScopedSchools] = useState(...)`, around line 4328):

```typescript
// Derived lookup: abbrev → { id, name, urn } for the schools in this user's scope.
// Replaces the old hardcoded TRUST_SCHOOLS constant. Trust users get all children;
// school-level users get just themselves.
const abbrevLookup = useMemo(
  () => buildAbbrevLookup(scopedSchools.map(s => ({ ...s, urn: s.urn ?? 0 }))),
  [scopedSchools],
);
```

- [ ] **Step 5.4: Replace all TRUST_SCHOOLS references with abbrevLookup**

Find every `TRUST_SCHOOLS[...]` in page.tsx and replace with `abbrevLookup[...]`. The shape is identical (`{ id?: string, name: string, urn: number }` — old one had no `id`, but no call site reads `.id` from it). Expected edits (line numbers may shift; the pattern is consistent):

```bash
# Preview first
grep -n 'TRUST_SCHOOLS' apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor/page.tsx

# Then replace (sed)
sed -i.bak 's/TRUST_SCHOOLS/abbrevLookup/g' apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor/page.tsx
rm apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor/page.tsx.bak
```

- [ ] **Step 5.5: Replace the filename fuzzy-match in processSummaryFile**

Old (around line 4675):

```typescript
const abbrevMatch = Object.keys(abbrevLookup).find(a => upperName.includes(a));
if (abbrevMatch) {
  resolvedAbbrev = abbrevMatch;
  setSummarySchoolAbbrev(abbrevMatch);
}
```

This already works with abbrevLookup (since we replaced TRUST_SCHOOLS). Verify line still reads `Object.keys(abbrevLookup)`.

Actually — upgrade this to use `resolveSchoolByName`:

```typescript
const match = resolveSchoolByName(
  file.name,
  scopedSchools.map(s => ({ ...s, urn: s.urn ?? 0 })),
);
if (match) {
  // Find which abbrev in abbrevLookup points to this school
  const abbrev = Object.keys(abbrevLookup).find(a => abbrevLookup[a].name === match.name);
  if (abbrev) {
    resolvedAbbrev = abbrev;
    setSummarySchoolAbbrev(abbrev);
  }
}
```

- [ ] **Step 5.6: Verify no remaining TRUST_SCHOOLS references**

Run: `grep -n 'TRUST_SCHOOLS' apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor/page.tsx`
Expected: (no output)

- [ ] **Step 5.7: Build**

Run: `cd apps/platform && npm run build 2>&1 | tail -40`
Expected: PASS (or only pre-existing errors unrelated to this file)

- [ ] **Step 5.8: Commit (rolls up Tasks 4 + 5)**

```bash
git add apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor/page.tsx
git commit -m "refactor(trust-assessor): remove TRUST_SCHOOLS hardcoding; rename groveHouseData → perPupilData

Builds abbrev lookup from scopedSchools (live /api/organizations/children data) so any trust's schools work without a hardcoded registry. Renames state to reflect that per-pupil data is no longer Grove-House-specific."
```

---

## Task 6: Scope school tabs to scopedSchools (not parsed.schools)

page.tsx line 5201 iterates `parsed.schools` to render school tabs. For a school-level user who somehow uploads a trust-level spreadsheet, this would still render tabs for every school in the spreadsheet. Scope tabs to `scopedSchools` instead.

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx` (around line 5195-5210 and related)

- [ ] **Step 6.1: Compute visible school tabs**

Add alongside the `abbrevLookup` memo (Task 5, step 3):

```typescript
// Which schools should show as tabs. For a school-level login, only self;
// for a trust-level login, all children in scope. We intersect with whatever
// the parsed spreadsheet contains so that trust users don't see tabs for
// schools missing from the spreadsheet (which would crash chart logic).
const { organization } = useAuth();
const isTrustLevel = organization?.organization_type === 'trust';
const visibleSchoolAbbrevs = useMemo(() => {
  const scopedAbbrevs = new Set(Object.keys(abbrevLookup));
  if (!parsed) return Array.from(scopedAbbrevs);
  return parsed.schools.filter(s => scopedAbbrevs.has(s));
}, [abbrevLookup, parsed]);
```

- [ ] **Step 6.2: Render tabs from visibleSchoolAbbrevs**

Replace the `parsed.schools.map((school) => ...)` block at line ~5201-5210 with:

```tsx
{visibleSchoolAbbrevs.map((school) => (
  <motion.button
    key={school}
    onClick={() => setActiveSchoolTab(school)}
    whileHover={activeSchoolTab !== school ? { scale: 1.04 } : {}}
    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSchoolTab === school ? "bg-white border border-b-white border-gray-200 -mb-px text-blue-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
  >
    {school}
  </motion.button>
))}
```

- [ ] **Step 6.3: Hide the overview tab for school-level users**

Line 5196 or similar renders the "Overview" tab button. Wrap in a trust-level check:

```tsx
{isTrustLevel && (
  <motion.button
    key="overview"
    onClick={() => setActiveSchoolTab("overview")}
    /* ...existing props... */
  >
    Overview
  </motion.button>
)}
```

- [ ] **Step 6.4: Default activeSchoolTab based on org type**

When `isTrustLevel` is true, default to `"overview"`. When false (school user), default to the single scoped school's abbrev. Adjust the `useState("overview")` at line 4345:

```typescript
const [activeSchoolTab, setActiveSchoolTab] = useState<string>("overview");
// After scopedSchools loads, auto-select the single school if this is a school-level login
useEffect(() => {
  if (isTrustLevel) return;
  if (scopedSchools.length === 1 && activeSchoolTab === "overview") {
    const onlyAbbrev = abbreviateSchoolName(scopedSchools[0].name);
    setActiveSchoolTab(onlyAbbrev);
  }
}, [isTrustLevel, scopedSchools, activeSchoolTab]);
```

And add the import at top of file:

```typescript
import { abbreviateSchoolName, buildAbbrevLookup, resolveSchoolByName } from '@/lib/trust-analysis/scoped-schools';
```

- [ ] **Step 6.5: Guard the overview content render**

Around line 5215 where `activeSchoolTab === "overview"` is checked, add an outer guard so a school-level user never renders the trust overview even if state somehow holds "overview":

```tsx
{activeSchoolTab === "overview" && isTrustLevel ? (
  /* existing TrustInsights block */
) : (
  /* existing SchoolTab block */
)}
```

- [ ] **Step 6.6: Build + manual smoke**

Run: `cd apps/platform && npm run build 2>&1 | tail -20`
Expected: PASS

Log in as David (PAYMAT trust) → see Overview tab + all 7 PAYMAT school tabs.
Log in as Alex (Grove House school) → see only Grove House tab, no Overview.

- [ ] **Step 6.7: Commit**

```bash
git add apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor/page.tsx
git commit -m "feat(trust-assessor): scope school tabs to user's org — trust sees all children, school sees only self

Ends the dev-time convenience where Grove House login saw trust-level data. Overview tab now only renders for organization_type='trust'; school-level logins see exactly one tab (their own school)."
```

---

## Task 7: Dynamic Deep Analytics heading

The Deep Analytics section renders a hardcoded "Grove House Primary School — Per-Pupil Deep Dive" heading (page.tsx ~line 5651). Make it dynamic based on the active school tab.

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx` (line ~5651 and nearby)

- [ ] **Step 7.1: Find the hardcoded heading**

Run: `grep -n 'Grove House' apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor/page.tsx`
Expected: a handful of matches; identify the one that's a heading string like `"Grove House Primary School — Per-Pupil Deep Dive"` or similar.

- [ ] **Step 7.2: Replace with dynamic school name**

Resolve the active school's name from `abbrevLookup`:

```tsx
{(() => {
  const activeSchoolName =
    activeSchoolTab === "overview"
      ? "Trust"
      : abbrevLookup[activeSchoolTab]?.name ?? activeSchoolTab;
  return (
    <h3 className="text-xl font-semibold text-foreground mb-2">
      {activeSchoolName} — Per-Pupil Deep Dive
    </h3>
  );
})()}
```

Also update any other copy in that block that says "Grove House" — the "Data source: CTF assessment files (EYFS, KS1, Phonics). X pupils across Y years (includes leavers)" line (around 5649) doesn't name the school, leave alone. But the "EYFS GLD is declining" and other narrative lines (5711 etc.) may mention Grove House — read them and remove any school-name-hardcoding.

- [ ] **Step 7.3: Build + smoke**

Run: `cd apps/platform && npm run build 2>&1 | tail -20`
Expected: PASS

Log in as David, click Grove House tab → see "Grove House Primary School — Per-Pupil Deep Dive".
Click another school tab → see "<that school name> — Per-Pupil Deep Dive".

- [ ] **Step 7.4: Commit**

```bash
git add apps/platform/src/app/\(dashboard\)/dashboard/school-improvement/trust-assessor/page.tsx
git commit -m "fix(trust-assessor): dynamic school-name in Deep Analytics heading — no more Grove House hardcoding in UI copy"
```

---

## Task 8: Playwright regression test — three logins

Verify multi-tenant isolation with a real browser. Follow the magic-link injection pattern from `/tmp/playwright-paymat-regression.mjs`.

**Files:**
- Create: `/tmp/playwright-trust-lockdown.mjs` (throwaway, do not commit)

- [ ] **Step 8.1: Write the Playwright test**

```javascript
// /tmp/playwright-trust-lockdown.mjs
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = 'http://localhost:3001';

const USERS = [
  { email: 'dsummerscales46@gmail.com', label: 'david-paymat-trust' },
  { email: 'a.summerscales@ghps.paymat.org', label: 'alex-grove-house' },
  // Add a standalone school test user here if one exists
];

const supa = createClient(SUPABASE_URL, SERVICE_KEY);

async function magicSignIn(page, email) {
  const { data, error } = await supa.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (error) throw error;
  const hash = new URL(data.properties.action_link).hash;
  await page.goto(`${APP_URL}/auth/callback${hash}`);
  await page.waitForURL(/\/dashboard/);
}

for (const user of USERS) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await magicSignIn(page, user.email);
  await page.goto(`${APP_URL}/dashboard/school-improvement/trust-assessor`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `/tmp/ta-${user.label}.png`, fullPage: true });

  // Collect tabs visible on the page
  const tabs = await page.$$eval(
    'button[role="tab"], nav button',
    (els) => els.map((e) => e.textContent?.trim()).filter(Boolean),
  );
  console.log(`[${user.label}] visible tabs:`, tabs);

  // Assertions: Alex (Grove House) should NOT see other PAYMAT schools
  if (user.label === 'alex-grove-house') {
    const banned = ['CHPS', 'CVPS', 'FPS', 'HPS', 'LPS', 'LGPS', 'Overview'];
    const leaked = tabs.filter((t) => banned.some((b) => t.includes(b)));
    if (leaked.length > 0) {
      console.error(`❌ LEAK: ${user.label} can see tabs`, leaked);
      process.exit(1);
    }
    console.log(`✅ ${user.label} isolation OK — only their own school visible`);
  }

  await browser.close();
}
console.log('All three regressions complete — see /tmp/ta-*.png for screenshots.');
```

- [ ] **Step 8.2: Run the test**

```bash
# Ensure dev server is running: npm run dev from apps/platform/
node /tmp/playwright-trust-lockdown.mjs
```

Expected output:
```
[david-paymat-trust] visible tabs: ['Overview', 'CVPS', 'CHPS', 'FPS', 'GHPS', 'HPS', 'LPS', 'LGPS']
[alex-grove-house] visible tabs: ['GHPS']
✅ alex-grove-house isolation OK — only their own school visible
All three regressions complete — see /tmp/ta-*.png for screenshots.
```

- [ ] **Step 8.3: Visually review screenshots**

Open `/tmp/ta-david-paymat-trust.png` and `/tmp/ta-alex-grove-house.png`. Confirm:
- David's view shows trust-level overview + 7 school tabs
- Alex's view shows only Grove House (no sibling tabs, no Overview tab, no trust aggregate)

If either screenshot shows a leak, stop and investigate — do not claim the work done.

- [ ] **Step 8.4: Final build gate**

Run: `cd apps/platform && npm run build && npx vitest run src/lib/trust-analysis/__tests__/scoped-schools.test.ts`
Expected: both PASS

- [ ] **Step 8.5: Final commit (if any stragglers)**

Any remaining uncommitted changes? Check with `git status`. If clean, nothing to commit. If dirty, commit with:

```bash
git add -A
git commit -m "chore(trust-assessor): final touches from regression testing"
```

---

## Self-review checklist

After completing all tasks:

- [ ] `grep TRUST_SCHOOLS apps/platform/src/` returns no matches
- [ ] `grep GROVE_HOUSE_ORG_ID apps/platform/src/` returns no matches
- [ ] `grep SPREADSHEET_FIGURES apps/platform/src/` returns no matches
- [ ] `grep groveHouseData apps/platform/src/` returns no matches in .tsx files (old state name gone)
- [ ] Three Playwright screenshots saved to `/tmp/` and visually confirm no leakage
- [ ] `npm run build` passes from `apps/platform/`
- [ ] Unit test suite for `scoped-schools.ts` passes
- [ ] At least one commit per task, each with a descriptive message
- [ ] `git status` clean on `main` (or a feature branch if one was cut)

---

## What ships after this plan

- Trust Assessor works for **any school** logging in, no hardcoding
- **PAYMAT trust login** (David/Alex at trust scope) → trust overview + per-school tabs
- **Grove House school login** (Alex at school scope) → only Grove House tab, no trust overview, no sibling schools
- **Standalone school login** (e.g., Rawdon) → only self tab
- Data leaks in `/api/trust-analysis/grove-house` closed (spreadsheet-figures no longer hardcoded)
- Foundation for Phase 2 (data utilisation enhancement) and Phase 3 (Ofsted dovetail)
