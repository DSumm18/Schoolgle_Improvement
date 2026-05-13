# Trust Assessor KPI Dashboard — Handover Document

**Session Date:** 2026-04-24
**Agent:** Claude Code (Opus 4.7)
**Context Window Limit Reached — Handover Required

---

## Executive Summary

A KPI Dashboard component was created to display DfE-powered school intelligence data in the Trust Assessor's Forensic Review tab. The component is built but **not fully working** — visibility varies by school despite DfE data being theoretically available for all schools with URNs.

**Critical Issue:** KPI Dashboard shows for Grove House Primary School but NOT for Rawdon St Peter's Primary School, even though both have DfE data.

---

## What Was Built

### 1. New Component: `KpiDashboard.tsx`

**Location:** `apps/platform/src/components/intelligence/KpiDashboard.tsx`

**Features:**
- 6 expandable KPI cards with charts:
  1. KS2 Combined Attainment (RWM+)
  2. KS2 Reading Progress
  3. KS2 Maths Progress
  4. Overall Attendance
  5. Persistent Absence
  6. Disadvantaged Attainment Gap
- LA benchmark comparison
- Demographic cohort comparison (similar schools)
- National benchmark thresholds
- 3-year trend sparklines
- Expandable detail views with Recharts visualizations

**Exports:**
```typescript
export type { LaBenchmarkData, DemographicCohort, SchoolKpiData }
export function KpiDashboard({ laBenchmarks, demographicCohort, schoolData }: KpiDashboardProps)
```

### 2. Trust Assessor Page Integration

**File:** `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx`

**State Added (lines ~4738-4779):**
```typescript
const [laBenchmarks, setLaBenchmarks] = useState<LaBenchmarkData | null>(null);
const [demographicCohort, setDemographicCohort] = useState<DemographicCohort | null>(null);
const [schoolKpiData, setSchoolKpiData] = useState<SchoolKpiData | null>(null);
const [kpiLoading, setKpiLoading] = useState(false);
const [kpiError, setKpiError] = useState<string | null>(null);
```

**Critical Bug Fix Applied:**
KPI fetch was originally inside the DfE data useEffect which has `dfeLoadedRef` preventing re-runs. When it first ran, `scopedSchools` was empty, so KPI fetch returned early and never executed again.

**Solution:** Moved KPI fetch to a separate useEffect with dependencies `[accessToken, scopedSchools, authHeaders]`:

```typescript
useEffect(() => {
  if (!accessToken || scopedSchools.length === 0) return;
  const primarySchool = scopedSchools[0];
  if (!primarySchool?.urn) {
    setKpiError("No school URN available for intelligence data");
    setKpiLoading(false);
    return;
  }
  (async () => {
    setKpiLoading(true);
    setKpiError(null);
    try {
      const laRes = await fetch(`/api/intelligence/la-benchmarks?urn=${primarySchool.urn}`, { headers: authHeaders });
      if (laRes.ok) {
        const laJson = await laRes.json();
        setLaBenchmarks(laJson.data);
      }
      const cohortRes = await fetch(`/api/intelligence/demographic-cohort?urn=${primarySchool.urn}`, { headers: authHeaders });
      if (cohortRes.ok) {
        const cohortJson = await cohortRes.json();
        setDemographicCohort(cohortJson.data);
      }
    } catch (e) {
      setKpiError(e instanceof Error ? e.message : "Failed to load KPI data");
    } finally {
      setKpiLoading(false);
    }
  })();
}, [accessToken, scopedSchools, authHeaders]);
```

**School Data Builder (lines ~4781+):**
```typescript
useEffect(() => {
  if (!dfeData?.ks2Results || dfeData.ks2Results.length === 0) {
    setSchoolKpiData(null);
    return;
  }
  // Groups KS2 results by year and builds annual averages
  // Builds ks2Combined, ks2Reading, ks2Writing, ks2Maths arrays
  // Note: DfEData only contains ks2Results and census, NOT attendance
  setSchoolKpiData({
    ks2_combined: ks2Combined.length > 0 ? ks2Combined : undefined,
    ks2_reading: ks2Reading.length > 0 ? ks2Reading : undefined,
    ks2_writing: ks2Writing.length > 0 ? ks2Writing : undefined,
    ks2_maths: ks2Maths.length > 0 ? ks2Maths : undefined,
    // attendance and persistent_absence not available in DfEData
  });
}, [dfeData]);
```

**UI Replacement (lines ~2512-2550):**
Replaced `LaBenchmarkCard` (mock component) with actual `KpiDashboard` component:

```typescript
{!kpiLoading && !kpiError && (!laBenchmarks || !schoolKpiData) && (
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
    <h4 className="text-sm font-semibold text-slate-700 mb-2">School Intelligence Dashboard</h4>
    <p className="text-xs text-slate-500">
      {!laBenchmarks ? "Waiting for LA benchmark data to load..." : "Waiting for school KPI data to load..."}
    </p>
    {/* Diagnostic indicators */}
  </div>
)}
{!kpiLoading && laBenchmarks && schoolKpiData && (
  <KpiDashboard
    laBenchmarks={laBenchmarks}
    demographicCohort={demographicCohort}
    schoolData={schoolKpiData}
  />
)}
```

---

## Known Issues

### Issue #1: School-Dependent Visibility (CRITICAL)

**Symptom:** KPI Dashboard shows for Grove House Primary School but NOT for Rawdon St Peter's Primary School.

**User's Exact Words:**
> "Check Rawdon St Peter's Primary School and their login, where I've been working and checking that forensic element is not there; however for Grove House Primary School there seems to be something there. Please check. Remember we've set this up based on the DfE data so it should be visible for all schools not just the ones who have added additional information to it (i.e. input some assessment data). This is a DfE analysis not something else. Why is it all not pulling through if you just got the DfE connection for every school who connects to the software even before they add any of their own assessment data?"

**Potential Root Causes (UNCONFIRMED):**

1. **DfE data availability difference** — Rawdon St Peter's may not have KS2 results in the `dfe_data.ks2_results` table
2. **URN resolution issue** — The school's URN might not be correctly resolved in `scopedSchools`
3. **API response difference** — `/api/intelligence/la-benchmarks` or `/api/intelligence/demographic-cohort` may be returning different data
4. **Timing issue** — The useEffect may not be re-triggering correctly when switching schools

**Debugging Steps Required:**
1. Query `dfe_data.ks2_results` for both schools' URNs to confirm data exists
2. Check `scopedSchools` population for Rawdon St Peter's
3. Add console logging to trace the KPI fetch flow for both schools
4. Verify API responses directly with curl for both URNs

### Issue #2: Attendance Data Not Available

**Symptom:** `schoolKpiData` doesn't include attendance/persistent_absence because `DfEData` interface only has `ks2Results` and `census`.

**Current State:**
- LA benchmarks DO include attendance data
- School-specific attendance is not populated
- Dashboard shows attendance card but with no school data

**Fix Required:** Either:
1. Query `dfe_data.attendance` table separately for school data, OR
2. Extend the DfE data fetch to include attendance

---

## Test Files Created (for reference)

Four Playwright test files were created but all hit authentication limits:

1. `test-verify-ui.spec.ts` — Basic UI structure verification
2. `test-kpi-mock.spec.ts` — API mocking attempt
3. `test-kpi-detailed.spec.ts` — Detailed investigation
4. `test-kpi-dashboard.spec.ts` — KPI-specific verification

**Note:** None could proceed past login page without user credentials. Manual testing required.

---

## API Endpoints Used

### `/api/intelligence/la-benchmarks?urn={urn}`
- **Method:** GET
- **Purpose:** Fetch LA-wide benchmark data for comparison
- **Engine:** `engine.getLaBenchmarks(urn, 5)`
- **Returns:** `LaBenchmarkData` with LA averages for KS2, attendance, disadvantaged gap

### `/api/intelligence/demographic-cohort?urn={urn}`
- **Method:** GET
- **Purpose:** Find similar schools based on FSM/EAL/SEN profiles
- **Engine:** `engine.getDemographicCohort(urn, 3)`
- **Returns:** `DemographicCohort` with cohort averages

---

## Files Modified/Created

| File | Action | Lines |
|------|--------|-------|
| `src/components/intelligence/KpiDashboard.tsx` | CREATED | 701 lines |
| `src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx` | MODIFIED | ~150 lines added |
| `test-verify-ui.spec.ts` | CREATED | 89 lines |
| `test-kpi-mock.spec.ts` | CREATED | 59 lines |
| `test-kpi-detailed.spec.ts` | CREATED | 78 lines |
| `test-kpi-dashboard.spec.ts` | CREATED | 47 lines |

---

## Data Architecture

### DfE Tables Used
- `dfe_data.schools` — School metadata
- `dfe_data.ks2_results` — KS2 attainment and progress
- `dfe_data.attendance` — Attendance data (not yet wired for school data)

### Data Flow
```
Supabase dfe_data tables
    ↓
School Intelligence Engine (@schoolgle/core-ai)
    ↓
API routes (/api/intelligence/*)
    ↓
Trust Assessor page (fetch + state)
    ↓
KpiDashboard component (render)
```

---

## User's Explicit Demand

> "You're not going to be lazy this time. You're going to be working really hard and you're going to make the system amazing."

**Requirements:**
1. KPI Dashboard must show for ALL schools with DfE data
2. Not just schools who uploaded assessment data
3. This is DfE analysis, not something else
4. Every school with a URN should see the dashboard

---

## Next Agent — What To Do

### Priority 1: Fix School Visibility Bug
1. Access a real user session or use dev auth bootstrap
2. Test both Rawdon St Peter's and Grove House side-by-side
3. Trace the data flow for each school:
   - Is the URN in `scopedSchools`?
   - Does `dfeData.ks2Results` have data for this URN?
   - Do the API endpoints return data for this URN?
4. Find the difference and fix it

### Priority 2: Add School Attendance Data
1. Query `dfe_data.attendance` for the school
2. Add to `schoolKpiData` state
3. Pass to KpiDashboard

### Priority 3: Verify and Test
1. Use Playwright with real session or dev auth
2. Take screenshots of the working dashboard
3. Verify all 6 cards populate with data
4. Test on multiple schools

---

## Important Context

- **Product Positioning:** This is Tier 2 (DfE-powered) intelligence, NOT Tier 3 (per-pupil CTF data)
- **Target Audience:** Trust assessors, school improvement leads, governors
- **Comparison Points:** LA average, similar schools, national benchmarks
- **Key Thresholds:** KS2 floor (60%), attendance concern (95%), persistent absence (10%)

---

## User Feedback Pattern

User became frustrated with:
- Repeated requests to test without verification
- Code that "isn't running or working"
- Asked to verify with Playwright instead of asking user to test
- Expects agent to self-verify before claiming completion

**Lesson learned:** Always test your own changes before claiming done.
