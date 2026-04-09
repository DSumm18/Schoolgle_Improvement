# VECTOR Full Codebase Review — Post-Sprint

**Date:** 2026-04-09
**Reviewer:** VECTOR (3 parallel adversarial agents via Claude Code)
**Scope:** Full codebase — all modified routes, components, migrations, and recent sprint deliverables

---

## THE VERDICT

Schoolgle has impressive surface area but dangerous depth problems. Three independently exploitable security flaws exist in production code, half the modules are stubs or hidden behind pilot flags, and the dashboard fabricates data to look good. This platform is not ready for a paying school.

---

## SCORES

| Lens | Score | Summary |
|------|-------|---------|
| School User Experience | **3/10** | Built for the demo, not for Sandra or Helen. Would not survive a real school week. |
| Spec Delivery | **4/10** | ~60% of dashboard routes are UI shells. Only Mars/Compliance is genuinely complete. |
| Data Safety | **5/10** | Pseudonymisation architecture is conceptually sound, but 3 independently exploitable flaws exist right now. |

---

## CRITICAL ISSUES (Fix before ANY school sees this)

### 1. [SECURITY] /api/ed/hub has NO authentication
Both GET and POST handlers are bare `async function` exports — not wrapped in `protectedRoute`. Any unauthenticated caller with an orgId UUID can read school question history, shortcuts, and metadata. Staff may have typed pupil names into Ed chat — those are now publicly readable.
- **File:** `apps/platform/src/app/api/ed/hub/route.ts`

### 2. [SECURITY] /api/scan accepts organizationId from request body with no auth
An attacker can POST with any organizationId and inject evidence into any school's account. Cross-tenant contamination on the most sensitive pipeline.
- **File:** `apps/platform/src/app/api/scan/route.ts`

### 3. [DATA] pupils master table stores first_name and last_name as NOT NULL TEXT
Directly contradicts "PII never stored in Supabase" architecture claim. RLS policy is `USING(true)` — every service role call sees every school's pupils.
- **File:** `apps/platform/supabase/migrations/20260319_pupils_master.sql`

### 4. [DATA] safeguarding_concerns stores pupil_display_name as freetext
No validation it's pseudonymised. Section 9 special category data with no protection. ICO Article 9 violation risk.
- **File:** `apps/platform/src/app/api/safeguarding/concerns/route.ts` (line 130)

### 5. [DATA] national_insurance_number stored unencrypted in Supabase
Migration comment says "encrypted at app level" but MIS sync route writes raw NI numbers from Excel with zero encryption.
- **File:** `apps/platform/supabase/migrations/20260313_hr_personnel_records.sql` (line 236)
- **File:** `apps/platform/src/app/api/mis/sync/route.ts` (line 356)

### 6. [TRUST] Ofsted readiness score fabricated
`overallReadiness = Math.min(percentage + 30, 95)` — adds 30 points to real score. Helen tells governors "78% ready" based on fabricated data. No disclaimer, no asterisk.
- **File:** `apps/platform/src/app/(dashboard)/dashboard/action-plan/page.tsx` (line 130)

### 7. [SECURITY] /api/intelligence accepts caller-supplied organizationId overriding auth
School A can pass School B's organizationId and trigger a full intelligence analysis against School B's data.
- **File:** `apps/platform/src/app/api/intelligence/route.ts` (line 14)

---

## SIGNIFICANT ISSUES

1. **SchoolDataGuardian is not wired into the request pipeline.** The GDPR "intercept" claim in docs is false — it's a standalone utility nobody calls.

2. **Canva template library: all 30 templates have `canvaUrl: ""`** — every "Open" button goes nowhere. Committed as complete in Task 034.

3. **Morning Brief has backend + tests + API but NO dashboard route.** Feature is invisible to users. No `/dashboard/morning-brief` page exists.

4. **179 `@ts-expect-error` suppressions across 45 files + 94 `as any` casts across 41 API routes.** Build safety is cosmetic — `ignoreBuildErrors` masks real regressions.

5. **Ed Strategy Recommendation panel is entirely hardcoded.** Every school sees same "Pupil Premium tutoring" advice. Accept button wired to empty function `() => {}`.

6. **Two separate hashing regimes for pupil IDs.** Client HMAC-SHA256 with localStorage salt vs server `PUPIL_HASH_SALT`. Cross-module pupil tracking is broken — hashes don't match.

7. **Finance module self-described as unbuilt** (`pilotHidden: true`). Teaching & Learning same. Jupiter/Comms is stubs. Only Mars/Compliance is genuinely complete.

8. **Evidence page swallows errors to `console.error` only.** Blank page on failure — no spinner, no message, no retry.

9. **SEND register routes use `select("*")` on Article 9 special category data.** Any future column addition auto-exposes in API responses.

10. **Connectors impact analysis has a dead code branch** — `sameCategory` fallback always returns false. Statutory role replacement suggestions permanently broken.

---

## MODULE STATUS

| Planet | Module | Status | Notes |
|--------|--------|--------|-------|
| Mercury | School Improvement | **PARTIAL** | Ofsted/action-hub have API backing; SEF/SDP are launcher cards |
| Venus | Governance | **PARTIAL** | CRUD built; report-pack exists; zero tests |
| Earth | Business Ops | **PARTIAL** | Staff/sickness built; Finance is pilotHidden "in development" |
| Mars | Compliance | **BUILT** | Most complete. Real CRUD, RIDDOR engine with tests. Gold standard. |
| Jupiter | Comms | **STUB** | Website builder pilotHidden. Canva connector has 30 dead links. |
| Saturn | Intelligence | **PARTIAL** | Engine + API real; Morning Brief unreachable by users |
| Uranus | Teaching & Learning | **STUB** | pilotHidden, "in development", no functional sub-pages |

---

## QUESTIONS THAT NEED ANSWERS

1. What data is in `pupils.first_name` and `pupils.last_name` in production Supabase RIGHT NOW? Have real names been inserted?
2. Is `PUPIL_HASH_SALT` global or per-school? If global and it leaks, all hashes are reversible (UPNs follow predictable format).
3. What does the `ed_questions` table contain? Staff may have typed pupil names — that table is now publicly readable.
4. Is `pupil_display_name` in `safeguarding_concerns` populated with pseudonyms or real names in the pilot?

---

## WHAT'S DONE WELL

1. **Estates compliance module** is the platform's most honest product — real CRUD, RIDDOR engine with tests, findings database with meaningful test coverage. If every module matched this standard, scores would be 8/10.

2. **Governance report pack** (RAG thresholds, term detection, structured types) is clean and directly useful to SBMs.

3. **SEND register POST route + test suite** (`send-pii.test.ts`) is the strongest safety engineering — mocks Supabase, injects PII, asserts it's absent from insert. This proves the team knows how. The question is why it wasn't applied everywhere.

---

## PRIORITY REMEDIATION ORDER

### P0 — Before any school demo or pilot
1. Wrap `/api/ed/hub` and `/api/scan` in `protectedRoute`
2. Remove `first_name`/`last_name` from pupils table, fix RLS to filter by `organization_id`
3. Validate/sanitise `pupil_display_name` in safeguarding_concerns before insert
4. Encrypt or remove `national_insurance_number` column
5. Remove `organizationId` override from `/api/intelligence` — enforce `auth.organizationId` only

### P1 — Before first paying customer
6. Remove fabricated +30 from Ofsted readiness score
7. Wire SchoolDataGuardian into AI request pipeline or remove false claims from docs
8. Create `/dashboard/morning-brief` route to surface existing backend
9. Populate Canva template URLs or remove the feature from the UI
10. Fix the dual-salt pupil hashing problem

### P2 — Before scale
11. Eliminate 179 `@ts-expect-error` suppressions systematically
12. Add auth bypass tests for every API route
13. Replace `select("*")` with explicit column lists on SEND/safeguarding tables
14. Add error state UI to Evidence page and other data-loading pages

---

*VECTOR review executed by Jarvis (Claude Code) on 2026-04-09. Three parallel adversarial agents reviewed School User UX, Spec Delivery, and Data Safety across the full codebase.*
