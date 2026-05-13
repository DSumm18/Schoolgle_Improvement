# Energy Carbon Action Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production foundation for school/trust carbon reporting, mileage emissions, SECR readiness and energy action planning.

**Architecture:** Keep calculations in a pure library, expose live school data through focused API routes, and render the action plan as a new Energy tab. Use existing `energy_invoices`, `energy_invoice_readings`, `energy_hh_readings`, `energy_anomalies` and `mileage_claims` tables.

**Tech Stack:** Next.js App Router API routes, Supabase service-role reads, Vitest unit tests, React client components.

---

### Task 1: Carbon calculation library

**Files:**
- Create: `apps/platform/src/lib/energy/carbon-accounting.ts`
- Test: `apps/platform/src/lib/energy/carbon-accounting.test.ts`

- [ ] Write tests for energy, mileage, SECR readiness and action-plan generation.
- [ ] Implement emission factor constants and calculation helpers.
- [ ] Verify with `npx vitest run src/lib/energy/carbon-accounting.test.ts`.

### Task 2: Carbon/action-plan API

**Files:**
- Create: `apps/platform/src/app/api/estates/energy/carbon-plan/route.ts`

- [ ] Read energy invoice readings, anomalies and mileage claims for the authenticated organisation.
- [ ] Return school-level carbon totals, SECR readiness, evidence gaps and generated action-plan items.
- [ ] Gracefully return empty mileage/action-plan data if optional tables are not migrated locally.

### Task 3: Mileage API

**Files:**
- Create: `apps/platform/src/app/api/estates/energy/mileage/route.ts`
- Modify: `apps/platform/src/components/energy/MileageClaimsTab.tsx`

- [ ] Replace demo-only mileage with live API data.
- [ ] Add an empty state that explains how mileage CSV/API import should work.
- [ ] Keep the existing visual summary once real rows are present.

### Task 4: Action-plan UI

**Files:**
- Create: `apps/platform/src/components/energy/EnergyActionPlanTab.tsx`
- Modify: `apps/platform/src/app/(dashboard)/dashboard/estates/energy/page.tsx`

- [ ] Add an `Action Plan` tab next to Carbon and Mileage.
- [ ] Show SECR readiness, missing evidence, scope totals and recommended actions.
- [ ] Make it clear when the data is school-level and ready for trust roll-up later.

### Task 5: Verification

**Commands:**
- `npx vitest run src/lib/energy/carbon-accounting.test.ts`
- `npx eslint "src/lib/energy/carbon-accounting.ts" "src/lib/energy/carbon-accounting.test.ts" "src/app/api/estates/energy/carbon-plan/route.ts" "src/app/api/estates/energy/mileage/route.ts" "src/components/energy/EnergyActionPlanTab.tsx" "src/components/energy/MileageClaimsTab.tsx" "src/app/(dashboard)/dashboard/estates/energy/page.tsx"`

**Expected:** Tests pass and lint exits with no errors.
