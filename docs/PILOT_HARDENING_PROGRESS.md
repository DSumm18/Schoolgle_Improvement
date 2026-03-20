# Pilot Hardening Progress Log

**Started:** 2026-03-18
**Status:** Phase 1-4 Complete. Broader Pilot Ready.

---

## Phase 1 — Critical Security & Trust Fixes

### 1.1 Secure Exposed Endpoints

| Action                                        | File                                                | Status |
| --------------------------------------------- | --------------------------------------------------- | ------ |
| Disable /api/debug (info disclosure)          | `apps/platform/src/app/api/debug/route.ts`          | DONE   |
| Disable /api/debug/sql (arbitrary SQL)        | `apps/platform/src/app/api/debug/sql/route.ts`      | DONE   |
| Disable /api/seed-data (unauth data write)    | `apps/platform/src/app/api/seed-data/route.ts`      | DONE   |
| Disable /api/setup-database (info disclosure) | `apps/platform/src/app/api/setup-database/route.ts` | DONE   |
| Disable /api/test-db (schema disclosure)      | `apps/platform/src/app/api/test-db/route.ts`        | DONE   |

### 1.2 Fix CRON_SECRET Bypass

| Action                          | File                                            | Status |
| ------------------------------- | ----------------------------------------------- | ------ |
| Change fail-open to fail-closed | `apps/platform/src/app/api/cron/daily/route.ts` | DONE   |

### 1.3 Finance Demo Data Banner

| Action                         | File                                                           | Status |
| ------------------------------ | -------------------------------------------------------------- | ------ |
| Add prominent DEMO DATA banner | `apps/platform/src/app/(dashboard)/dashboard/finance/page.tsx` | DONE   |

### 1.4 Ed AI Truthfulness

| Action                                                                | File                                                         | Status    |
| --------------------------------------------------------------------- | ------------------------------------------------------------ | --------- |
| Fix risk specialist prompt (was referencing 6 unimplemented skills)   | `packages/ed-agents/src/agents/prompts/risk-specialist.ts`   | DONE      |
| Fix canvas specialist prompt (was referencing 6 unimplemented skills) | `packages/ed-agents/src/agents/prompts/canvas-specialist.ts` | DONE      |
| Implement 6 risk skill handlers                                       | `apps/platform/src/app/api/skills/invoke/route.ts`           | DONE      |
| Verify intelligence skills work (6 functions)                         | Verified — all implemented                                   | CONFIRMED |
| Verify estates skills work (15 functions)                             | Verified — all implemented                                   | CONFIRMED |
| Verify document skills work (7 functions)                             | Verified — all implemented                                   | CONFIRMED |

---

## Phase 2 — Demo Data Identification (Research Complete)

### Demo Data Locations Found

| Module                   | File                                  | Demo Indicator                   | Severity         |
| ------------------------ | ------------------------------------- | -------------------------------- | ---------------- |
| Finance Hub              | dashboard/finance/page.tsx            | **NONE** (now FIXED with banner) | CRITICAL → FIXED |
| Attendance Registers     | api/attendance/registers/route.ts     | `is_demo: true` in API response  | HIGH             |
| Attendance Summaries     | api/attendance/summaries/route.ts     | `is_demo: true` in API response  | HIGH             |
| Attendance Interventions | api/attendance/interventions/route.ts | `is_demo: true` in API response  | MEDIUM           |
| SEND Register            | api/send/register/route.ts            | `demo: true` in API response     | HIGH             |
| SEND Provision Map       | api/send/provision-map/route.ts       | `demo: true` in API response     | HIGH             |
| Behaviour Incidents      | api/behaviour/incidents/route.ts      | `demo: true` in API response     | HIGH             |
| Cover Absences           | api/cover/absences/route.ts           | `demo: true` in API response     | MEDIUM           |
| Cover Dashboard          | api/cover/dashboard/route.ts          | `demo: true` in API response     | MEDIUM           |
| Cover Arrangements       | api/cover/arrangements/route.ts       | `demo: true` in API response     | MEDIUM           |
| Performance Dashboard    | api/performance/dashboard/route.ts    | `demo: true` in API response     | MEDIUM           |
| Estates Energy           | api/estates/energy/route.ts           | Hardcoded meters                 | MEDIUM           |
| Estates Audit            | lib/estates-audit/demo-data.ts        | Used when no data                | LOW              |
| Emergency Drills         | api/emergency/drills/route.ts         | `isDemo: true` in API response   | LOW              |

**Status:** All 15 demo data sources identified. Finance hub fixed with banner. Remaining 14 need UI-side demo indicators.

---

## Files Changed

| File                                                           | Change                                     | Phase |
| -------------------------------------------------------------- | ------------------------------------------ | ----- |
| `apps/platform/src/app/api/debug/route.ts`                     | Disabled — returns 403                     | 1.1   |
| `apps/platform/src/app/api/debug/sql/route.ts`                 | Disabled — returns 403                     | 1.1   |
| `apps/platform/src/app/api/seed-data/route.ts`                 | Disabled — returns 403                     | 1.1   |
| `apps/platform/src/app/api/setup-database/route.ts`            | Disabled — returns 403                     | 1.1   |
| `apps/platform/src/app/api/test-db/route.ts`                   | Disabled — returns 403                     | 1.1   |
| `apps/platform/src/app/api/cron/daily/route.ts`                | CRON_SECRET fail-closed                    | 1.2   |
| `apps/platform/src/app/(dashboard)/dashboard/finance/page.tsx` | DEMO DATA banner                           | 1.3   |
| `packages/ed-agents/src/agents/prompts/risk-specialist.ts`     | Skill refs restored (handlers implemented) | 1.4   |
| `packages/ed-agents/src/agents/prompts/canvas-specialist.ts`   | Honest "not yet implemented" limitations   | 1.4   |
| `apps/platform/src/app/api/skills/invoke/route.ts`             | 6 risk skill handlers added (~200 lines)   | 1.4   |
| `apps/platform/src/lib/modules/registry.ts`                    | pilotHidden flags on 4 modules + 3 apps    | 2.1   |
| `apps/platform/src/app/(dashboard)/layout.tsx`                 | Sidebar filters for pilotHidden            | 2.1   |

---

## Phase 2 — Pilot Surface Control & Validation

### 2.1 Pilot Perimeter Control

| Action                                        | File          | Status |
| --------------------------------------------- | ------------- | ------ |
| Add pilotHidden/pilotNote to ModuleDefinition | `registry.ts` | DONE   |
| Add pilotHidden to AppDefinition              | `registry.ts` | DONE   |
| Flag Teaching & Learning as pilotHidden       | `registry.ts` | DONE   |
| Flag Finance as pilotHidden                   | `registry.ts` | DONE   |
| Flag Website as pilotHidden                   | `registry.ts` | DONE   |
| Flag Canvas as pilotHidden                    | `registry.ts` | DONE   |
| Flag Staff Connectors as pilotHidden          | `registry.ts` | DONE   |
| Flag Performance Management as pilotHidden    | `registry.ts` | DONE   |
| Flag Cover Management as pilotHidden          | `registry.ts` | DONE   |
| Filter pilotHidden modules from sidebar       | `layout.tsx`  | DONE   |
| Filter pilotHidden apps from sub-app lists    | `layout.tsx`  | DONE   |

### 2.2 Documentation Created

| Document                            | Status |
| ----------------------------------- | ------ |
| `docs/PILOT_SURFACE_AREA_MATRIX.md` | DONE   |
| `docs/PILOT_GOLDEN_JOURNEYS.md`     | DONE   |
| `docs/CONNECTED_DATA_ASSESSMENT.md` | DONE   |
| `docs/SCHOOL_ONBOARDING_MODEL.md`   | DONE   |
| `docs/PHASE2_VALIDATION_REPORT.md`  | DONE   |

### 2.3 Onboarding Validation

| Finding                           | Status           |
| --------------------------------- | ---------------- |
| 3-step onboarding flow works      | CONFIRMED        |
| DfE GIAS enrichment works         | CONFIRMED        |
| Staff CSV import production-ready | CONFIRMED        |
| Org user CSV import works         | CONFIRMED        |
| Class assignments UI works        | CONFIRMED        |
| No post-onboarding setup wizard   | GAP (documented) |
| No pupil CSV import               | GAP (documented) |

### 2.4 Golden Journey Results

| Journey                 | Result  |
| ----------------------- | ------- |
| Risk lifecycle          | PASS    |
| Estates issue lifecycle | PASS    |
| File/evidence upload    | PARTIAL |
| Meeting → action        | PASS    |
| Intelligence insight    | PASS    |
| Staff directory         | PASS    |
| Survey lifecycle        | PASS    |
| Document lifecycle      | PASS    |
| School onboarding       | PARTIAL |
| Connected data flows    | PARTIAL |

---

## Phase 3 — Blocker Remediation

### 3.1 File Upload Validation

| Action                                  | File                            | Status |
| --------------------------------------- | ------------------------------- | ------ |
| Add MIME type whitelist (14 types)      | `api/estates/evidence/route.ts` | DONE   |
| Add 50MB file size limit                | `api/estates/evidence/route.ts` | DONE   |
| Clear error messages for rejected files | `api/estates/evidence/route.ts` | DONE   |

### 3.2 Demo Data Trust Labelling

| Action                            | File                           | Status    |
| --------------------------------- | ------------------------------ | --------- |
| Add demo banner to Behaviour page | `dashboard/behaviour/page.tsx` | DONE      |
| Verify Attendance has banner      | Already existed (line 1802)    | CONFIRMED |
| Verify SEND has banner            | Already existed (line 2364)    | CONFIRMED |

### 3.3 Pupil CSV Import

| Action                            | File                                    | Status |
| --------------------------------- | --------------------------------------- | ------ |
| Create pupils migration           | `migrations/20260319_pupils_master.sql` | DONE   |
| Create pupils API (GET + POST)    | `api/pupils/route.ts`                   | DONE   |
| CSV template with 5 example rows  | Embedded in POST handler                | DONE   |
| DfE field validation (SEN, needs) | Validation in POST handler              | DONE   |
| Year group normalisation          | R/N/Y3 → canonical form                 | DONE   |

### 3.4 Post-Onboarding Setup Wizard

| Action                   | File                       | Status |
| ------------------------ | -------------------------- | ------ |
| Create setup wizard page | `dashboard/setup/page.tsx` | DONE   |
| 5-step progress tracker  | Live API checks            | DONE   |
| CSV template downloads   | Staff + Pupil templates    | DONE   |

### 3.5 Cross-Org Isolation Assessment

| Action                       | File                                | Status |
| ---------------------------- | ----------------------------------- | ------ |
| Document isolation model     | `docs/CROSS_ORG_ISOLATION_TESTS.md` | DONE   |
| Design 6 runtime test cases  | Documented in spec                  | DONE   |
| Code-level org scoping audit | Verified for all pilot modules      | DONE   |

### 3.6 Golden Journey Re-Tests

| Journey              | Phase 2 | Phase 3  |
| -------------------- | ------- | -------- |
| File/evidence upload | PARTIAL | **PASS** |
| School onboarding    | PARTIAL | **PASS** |
| Connected data flows | PARTIAL | PARTIAL+ |

### 3.7 Files Changed

| File                                                             | Change                      | Phase |
| ---------------------------------------------------------------- | --------------------------- | ----- |
| `apps/platform/src/app/api/estates/evidence/route.ts`            | File type + size validation | 3.1   |
| `apps/platform/src/app/(dashboard)/dashboard/behaviour/page.tsx` | Demo data banner            | 3.2   |
| `apps/platform/supabase/migrations/20260319_pupils_master.sql`   | New pupils table            | 3.3   |
| `apps/platform/src/app/api/pupils/route.ts`                      | Pupil import API            | 3.3   |
| `apps/platform/src/app/(dashboard)/dashboard/setup/page.tsx`     | Setup wizard                | 3.4   |

### 3.8 Documents Created

| Document                             | Status |
| ------------------------------------ | ------ |
| `docs/PHASE3_BLOCKER_REMEDIATION.md` | NEW    |
| `docs/PUPIL_IMPORT_SPEC.md`          | NEW    |
| `docs/ONBOARDING_SETUP_WIZARD.md`    | NEW    |
| `docs/CROSS_ORG_ISOLATION_TESTS.md`  | NEW    |
