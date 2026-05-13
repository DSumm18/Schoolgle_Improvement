# Agent Prompt: Continue KPI Dashboard Work

**Copy and paste this prompt to continue the Trust Assessor KPI Dashboard implementation.**

---

## Context

You're continuing work on the Trust Assessor KPI Dashboard. The previous session created a `KpiDashboard` component and integrated it into the Trust Assessor page, but there's a **critical bug**: the dashboard only shows for some schools (e.g., Grove House Primary) but not others (e.g., Rawdon St Peter's Primary).

**User's Requirement:** The KPI Dashboard must show for ALL schools with DfE data, not just schools that uploaded assessment data. This is DfE-powered analysis available to any school with a URN.

## What Was Done

1. **Created:** `apps/platform/src/components/intelligence/KpiDashboard.tsx`
   - 6 expandable KPI cards (KS2 Combined, Reading/Maths Progress, Attendance, Persistent Absence, Disadvantaged Gap)
   - LA/cohort/national benchmark comparisons
   - Charts using Recharts

2. **Modified:** `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx`
   - Added KPI state and fetch logic
   - Fixed a bug where KPI fetch was in wrong useEffect
   - Replaced mock `LaBenchmarkCard` with real `KpiDashboard`

3. **Files to review:**
   - `docs/trust-assessor/HANDOVER_KPI_DASHBOARD.md` — Full handover document
   - `docs/TRUST_ASSESSOR_KNOWLEDGE_BASE.md` — Updated with KPI info

## Your Tasks

### Priority 1: Fix School Visibility Bug (CRITICAL)

The dashboard shows for Grove House (URN 148201) but NOT Rawdon St Peter's. Investigate:

1. **Check DfE data exists for both schools:**
   ```sql
   SELECT DISTINCT urn FROM dfe_data.ks2_results WHERE urn IN (
     SELECT urn FROM dfe_data.schools WHERE name ILIKE '%Rawdon St Peter%'
     OR name ILIKE '%Grove House%'
   );
   ```

2. **Trace the data flow in the page:**
   - Does `scopedSchools` populate correctly for Rawdon St Peter's?
   - Does `dfeData.ks2Results` contain data for that URN?
   - Do `/api/intelligence/la-benchmarks?urn=XXX` and `/api/intelligence/demographic-cohort?urn=XXX` return data?

3. **Add logging to understand the difference:**
   ```typescript
   console.log('KPI Debug:', {
     schoolName: primarySchool.name,
     urn: primarySchool.urn,
     hasKs2Results: dfeData?.ks2Results?.length || 0,
     laBenchmarks: !!laBenchmarks,
     schoolKpiData: !!schoolKpiData
   });
   ```

4. **Fix the root cause** — ensure the dashboard renders for ALL schools with DfE data.

### Priority 2: Add School Attendance Data

Currently `schoolKpiData` doesn't include attendance because the DfE data fetch only pulls `ks2Results` and `census`. The attendance table exists in Supabase but isn't queried.

1. Query `dfe_data.attendance` for the school
2. Add attendance/persistent_absence to `schoolKpiData`
3. Verify the dashboard cards populate with school data

### Priority 3: Test and Verify

1. Use Playwright with real session or dev auth (see `scripts/dev-auth/`)
2. Take screenshots showing the dashboard works for multiple schools
3. Verify all 6 KPI cards populate with real data

## Important Notes

- **Don't ask the user to test** — verify your own changes first
- **Use the dev auth bootstrap** for screenshots: `scripts/dev-auth/bootstrap.ts`
- **Check the database directly** if data isn't showing — don't guess
- **The user expects this to work for ALL schools** with DfE data, not just some

## Expected Outcome

When you're done:
1. KPI Dashboard shows for every school that has KS2 results in the DfE database
2. All 6 cards display with actual school data (not empty)
3. Charts render correctly with LA and national comparisons
4. You have verified with screenshots or actual browser testing

## Files to Work With

| File | Purpose |
|------|---------|
| `src/components/intelligence/KpiDashboard.tsx` | The dashboard component |
| `src/app/(dashboard)/dashboard/school-improvement/trust-assessor/page.tsx` | Main page with state/fetch |
| `src/app/api/intelligence/la-benchmarks/route.ts` | LA benchmark API |
| `src/app/api/intelligence/demographic-cohort/route.ts` | Cohort API |

---

**Start by reading the handover document for full context:**
`docs/trust-assessor/HANDOVER_KPI_DASHBOARD.md`
