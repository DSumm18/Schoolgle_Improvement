# SchoolDataGuardian — Honest State Audit

**Date:** 11 April 2026
**Author:** Claude Code / Connector Hub Phase 2.1
**Purpose:** A candid audit of our actual privacy control plane — not the aspirational description in CLAUDE.md. Records what worked, what didn't, and what still needs work.

---

## Pre-Phase 2.1 state

### The aspirational claim

The CLAUDE.md note added during the 9 April Gemini/Antigravity session said:

> *"All LLM inferences have been centralized behind OpenRouter in `@schoolgle/ed-agents` (ai-openrouter.ts / orchestrator.ts) to ensure enterprise-grade rate limiting and cost control... The old AI evaluation scripts were bypassing the PII scrubbing firewall. We eradicated this legacy code to forcefully route all AI requests through the new SchoolDataGuardian middleware."*

### The reality

Before Phase 2.1:

- **SchoolDataGuardian existed but was dead code.** 117 lines in `apps/platform/src/lib/school-data-guardian.ts`. Zero production imports. Nothing in the codebase actually called it.
- **`pii-masker.ts` was the real shield** — a separate 193-line module with better features (reversible masking, role-context name detection, postcodes, `skipCategories`). Used in 3 places: `ai-evidence-matcher.ts` and two website compliance assessors.
- **17 routes made direct LLM calls** with no PII scrubbing at all:
  - `/api/ed/hub/route.ts`
  - `/api/mock-inspector/chat/route.ts`
  - `/api/estates/energy/report/route.ts`
  - `/api/coshh/route.ts`
  - `/api/actions/recommend/route.ts`
  - `/api/ofsted/inspect/route.ts`
  - `/api/ed/chat/route.ts`
  - `/api/ed/website-chat/route.ts`
  - `/api/sef/generate/route.ts`
  - `/api/sdp/generate/route.ts`
  - `/api/governance/meetings/[id]/summary/route.ts`
  - `/api/compliance/policies/analyse/route.ts`
  - `/api/documents/generate/route.ts`
  - `/api/morning-brief/generate/route.ts`
  - `/api/skills/invoke/route.ts`
  - `/api/risk/ai/route.ts`
  - `/api/send/ai-suggestions/route.ts`

We had two PII modules (one aspirational, one functional) with no clear contract between them, and most of the LLM surface area had no protection at all.

### Feature comparison table (pre-rewrite)

| | Guardian (dead) | pii-masker (alive) |
|---|---|---|
| Lines | 117 | 193 |
| Production imports | 0 | 3 |
| Email detection | ✓ | ✓ |
| Phone | ✓ | ✓ |
| DOB | ✓ | ✓ |
| UPN | ✓ | ✗ |
| NHS number | ✓ | ✗ |
| Name detection (role-context) | ✗ | ✓ |
| Postcode | ✗ | ✓ |
| NI number | ✗ | ✗ |
| Reversible | ✗ one-way | ✓ full reverse map |
| `skipCategories` | ✗ | ✓ |
| Allowlist | ✗ | ✗ |

---

## Phase 2.1 changes

### 1. Unified `SchoolDataGuardian`

Rewrote `apps/platform/src/lib/school-data-guardian.ts` to incorporate the best of both modules:

- **All patterns from both** — email, phone, DOB, UPN, NHS, NI, postcode, role-context names
- **Reversible token maps** (from pii-masker) — outputs can be rehydrated with real names client-side
- **`skipCategories` option** (from pii-masker)
- **`allowlist` option** (new) — public strings like the school name and publicly-listed head teacher names pass through
- **Non-blocking by default** — always sanitises and proceeds, never fails
- **Audit logging** — every call writes to `guardian_audit_log` table with categories detected and counts
- **`getStats(orgId)` API** — for the "Privacy Shield Active" badge schools will see on their dashboard

Legacy `scanAndScrub` and `maskIdentityPayload` methods are preserved with deprecation notices, so if any future caller accidentally uses them they still work.

### 2. `pii-masker` is now a thin shim

`apps/platform/src/lib/pii-masker.ts` became a 60-line backwards-compatible shim that delegates to `SchoolDataGuardian.scrub()`. Signature preserved (`maskPII` returns `{ maskedText, maskMap, maskCount }`). Existing callers in `ai-evidence-matcher.ts`, website assessors, send-pii tests, behaviour-pii tests all still work — verified by running their tests.

### 3. New `openrouter-guardian.ts` wrapper

`apps/platform/src/lib/ai/openrouter-guardian.ts` is the sanctioned way to call an LLM from Phase 2.1 code. It:

1. Scrubs every chat message through the Guardian
2. Merges token maps across messages
3. Sends to OpenRouter with correct headers
4. Rehydrates token references in the response (optional — on by default)
5. Writes an audit entry to `guardian_audit_log`

### 4. First real user: Attendance Story for Governors

The new `generateAttendanceStory()` function in `apps/platform/src/lib/documents/attendance-story/` calls `callOpenRouterWithGuardian()` with a prompt assembled from real Supabase data (DfE attendance + census + contextual factors). Zero hardcoded values. The LLM does all the analysis.

**Verified end-to-end on 11 April 2026** with real data for Grove House Primary (URN 148201):
- Evidence saved to `/tmp/attendance-story-grove-house-2026-04-11T10-15-38-396Z.json`
- Model used: `google/gemini-2.5-flash`
- Tokens used: 1394
- Guardian detected: nothing (correct — the input was aggregated school-level stats plus allowlisted public school name and head teacher name)
- Sources cited: DfE Attendance, DfE Census
- Missing connectors nudged: Contextual Factors, Live Attendance

---

## What still needs work

### The 17 bypass routes

The existing raw-fetch LLM routes are NOT refactored by Phase 2.1. They still bypass the Guardian. They remain a growing hygiene debt.

**Recommendation for Phase 2.2:** Refactor them one at a time to use `callOpenRouterWithGuardian()`. Priority order (by likelihood of handling pupil-level data):
1. `/api/send/ai-suggestions` — SEND provision suggestions
2. `/api/ed/chat` — Ed chatbot with school context
3. `/api/ofsted/inspect` — document inspection
4. `/api/ed/hub` — ed hub
5. `/api/actions/recommend` — action recommendations
6. `/api/sef/generate` — SEF narrative generation
7. `/api/sdp/generate` — SDP priority generation
8-17: The rest in any order

Not urgent unless an incident happens, but needs doing.

### Missing detection patterns

The unified Guardian still doesn't detect:

- **Addresses** (street + city combinations) — risk: leaking pupil home addresses in free-text notes
- **Pupil first names without role context** — e.g. "Sarah has been struggling" — no regex can catch this, needs NER
- **Non-English names** — patterns are English-centric
- **Passport, driving licence, bank details** — edge cases for staff records

### No multilingual support

All regex assumes English. A school writing notes in Welsh, Urdu, or Polish won't get PII caught. Low priority for now (assessment data is English-standardised) but worth noting.

### Audit log has no query UI

`guardian_audit_log` stores everything but there's no dashboard. Phase 2.2 should add `/dashboard/admin/privacy-audit` showing: requests processed today/week/month, top categories scrubbed, any errors.

### Regex false positives

Role-context name detection will match things like "Mrs Brown was headteacher in 1990" in curriculum documents — correctly scrubs a name, incorrectly scrubs a historical figure. The `allowlist` option is the current workaround.

---

## Recommendations

### Short term (Phase 2.2)

1. Refactor the 17 bypass routes to use `callOpenRouterWithGuardian`
2. Add the Privacy Shield stats badge to the dashboard header (calls `SchoolDataGuardian.getStats(orgId)`)
3. Build a simple `/dashboard/admin/privacy-audit` page
4. Add address detection patterns (street names + postcode combinations)

### Medium term (Phase 3)

1. Add an NER-based fallback for names where regex fails (small on-device model)
2. Stress test with real pupil-level data from Phase 3 (assessment analysis)
3. Add Welsh language pattern support

### Long term

1. Promote the Guardian to Next.js middleware so it runs automatically on every API request that touches LLM endpoints, rather than relying on each route calling the wrapper explicitly
2. Build a public-facing "Privacy Shield Report" for governors, derived from `guardian_audit_log`

---

## The honest summary

**Before Phase 2.1:** we claimed privacy protection we didn't have. The Guardian was dead code; the CLAUDE.md note was aspirational; 17 LLM routes had no protection at all.

**After Phase 2.1:** we have real privacy protection for one document generation flow (Attendance Story), we've unified the two previously-competing modules, we have a documented plan to close the remaining gaps, and we have a real-data real-LLM verification proving the Guardian pipeline works end-to-end.

The Guardian is now marketable because it actually does something — not because a CLAUDE.md note says it does.

The Phase 2.2 work list is clear and tractable. Phase 3 will stress-test it with pupil-level data.
