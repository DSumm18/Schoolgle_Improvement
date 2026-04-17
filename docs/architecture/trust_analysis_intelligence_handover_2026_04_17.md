# Trust Analysis + Intelligence Handover (17 Apr 2026)

## Purpose
This note is the canonical handover for recent Trust Analysis hardening work so Claude (or any other agent) can continue without losing context.

---

## Strategic Direction (Agreed)
- Build one shared intelligence orchestration approach across Schoolgle.
- Keep connectors owned by their respective modules/apps.
- Intelligence consumes normalized module outputs/contracts; it does not duplicate module connector logic.

---

## What Was Changed

### 1) Deterministic spreadsheet parsing for Trust mid-year workbook
- File: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx`
- Added explicit parser logic:
  - `extractNumberFromCell(...)`
  - `parseTrustCell(...)`
  - `buildTrustWorkbookPayload(...)`
- Explicit sheet profiles for `EYFS`, `Year 1` to `Year 6`, with fixed column starts for:
  - cohort counts (`number_in_cohort`, `number_send`, `ehcp`, `number_fsm`)
  - sections (`all_pupils`, `fsm6`, `not_fsm6`)
- Why:
  - Eliminates ambiguous `sheet_to_json(..., { header: ... })` inference and `__EMPTY` column drift.
  - Produces stable metric extraction for CVPS and other schools.

### 2) Trust Analysis frontend now sends structured payload
- File: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx`
- `executeExtraction(...)` now builds deterministic workbook payload and sends JSON stringified structure to generative route.
- Why:
  - Gives the LLM normalized schema rather than noisy flat spreadsheet text.

### 3) OpenRouter model fallback chain in generative route
- File: `apps/platform/src/app/api/ai/generative-canvas/route.ts`
- Added model candidate list:
  - `TRUST_ANALYSIS_OPENROUTER_MODEL`
  - `TRUST_ANALYSIS_LEGACY_MODEL`
  - `DEFAULT_ROUTING_FALLBACKS` from `lib/ai-openrouter`
- Why:
  - Avoid hard failure when a single endpoint/model is unavailable (e.g., 404 for unavailable model).

### 4) Model observability exposed to frontend
- File: `apps/platform/src/app/api/ai/generative-canvas/route.ts`
  - Returns `modelUsed` in success response.
- File: `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx`
  - Stores and displays model/pipeline in UI header/footer.
- Why:
  - Makes runtime model behavior explicit for testing and debugging.

### 5) Prompt guardrails tightened for percent deltas
- File: `apps/platform/src/app/api/ai/generative-canvas/route.ts`
- Added rules:
  - percentage comparisons must use percentage points (`pp`)
  - key metrics should be backed by supporting table values
- Why:
  - Reduce narrative math misstatements.

---

## Validation Performed

## Source Checked
- Workbook: `/Users/jarvis/Desktop/Trust mid year Data Capture 2025_26 (2).xlsx`

## CVPS factual checks
- Confirmed core CVPS table values match source workbook in the latest run:
  - EYFS GLD: `52%`
  - Y1 Phonics: `59%`
  - Y2 Phonics: `74%`
  - Y6 Combined ARE: `60%`
  - Y3 FSM Combined: `33%`, Non-FSM `67%` -> gap `34pp`
  - Y4 FSM Combined: `0%`, Non-FSM `60%` -> gap `60pp`

## Remaining issue found
- A narrative claim stated Y6 outcomes were all at/above trust average.
- Weighted trust averages from source contradict this (Reading/Writing/Maths are below CVPS).
- This is a narrative-fact consistency issue, not a raw extraction issue.

---

## Current Boundary Clarification

## Trust Analysis path (current)
- Frontend page uses: `POST /api/ai/generative-canvas`
- Files:
  - `apps/platform/src/app/(dashboard)/dashboard/school-improvement/trust-analysis/page.tsx`
  - `apps/platform/src/app/api/ai/generative-canvas/route.ts`

## School Intelligence path (separate)
- UI route:
  - `apps/platform/src/app/(dashboard)/dashboard/school-intelligence/page.tsx`
- API route:
  - `apps/platform/src/app/api/intelligence/route.ts`

These are currently separate flows.

---

## Recommended Next Step (Highest Priority)
Implement a **claim verification gate** before report render/publish:

1. Compute canonical metrics deterministically from normalized payload.
2. Parse generated key claims (or structured claim list).
3. Compare each claim to canonical metrics with strict tolerance (`0` for percentages unless rounding policy defined).
4. Block publish on mismatch.
5. Show explicit verification panel:
   - `verified_claims`
   - `failed_claims`
   - source metric trace per claim
   - confidence status

This closes the gap observed in CVPS narrative contradictions.

---

## Non-goals / Guardrails
- Do not move connectors into central intelligence.
- Do not duplicate connector business logic already owned by modules.
- Keep intelligence layer as orchestrator/composer over module contracts.

---

## Suggested Claude Action Queue
1. Add `report_verification` object to generative response contract.
2. Build deterministic comparison helper in Trust Analysis route/service.
3. Update UI to block export/sync when verification fails.
4. Add tests with the current Trust mid-year workbook as regression fixture.

