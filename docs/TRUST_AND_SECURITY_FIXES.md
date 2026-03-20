# Trust & Security Fixes — Pilot Hardening

**Date:** 2026-03-18
**Status:** Phase 1 Complete

---

## Endpoints Removed/Secured

| Endpoint                  | Previous Risk                                                            | Fix Applied                                      | Status |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ | ------ |
| `GET /api/debug`          | Exposed Supabase URL, service key preview, table accessibility — no auth | Returns 403 with "disabled for security" message | FIXED  |
| `POST /api/debug/sql`     | Arbitrary SQL execution via service role — no auth                       | Returns 403 with "disabled for security" message | FIXED  |
| `GET /api/seed-data`      | Unauthenticated data population into Aurora org, lists all users         | Returns 403 with "disabled" message              | FIXED  |
| `GET /api/setup-database` | Exposed migration instructions and Supabase service key in fetch headers | Returns 403 with "disabled" message              | FIXED  |
| `GET /api/test-db`        | Exposed table schema, connection status, Supabase URL preview — no auth  | Returns 403 with "disabled" message              | FIXED  |

**Approach:** All five routes now return HTTP 403 with a clear message. Original functionality preserved in comments for developer reference. No data leakage possible.

---

## Auth Fixes

### CRON_SECRET Fail-Closed Fix

**File:** `apps/platform/src/app/api/cron/daily/route.ts`

**Previous behaviour:**

```typescript
const cronSecret = process.env.CRON_SECRET;
if (cronSecret) {
  // ← Skipped entirely if env var undefined
  if (authHeader !== `Bearer ${cronSecret}`) return 401;
}
```

**Fixed behaviour:**

```typescript
const cronSecret = process.env.CRON_SECRET;
const authHeader = request.headers.get("authorization");
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return 401; // ← Always rejects if secret missing or wrong
}
```

**Impact:** Cron endpoint can no longer be triggered without a valid `CRON_SECRET` environment variable. If the env var is missing in any deployment, the endpoint safely rejects all requests rather than allowing unauthenticated execution.

---

## Organisation Isolation Status

### Current Model

- All API routes use `createServiceRoleClient()` which bypasses RLS
- Organisation scoping enforced via manual `.eq("organization_id", auth.organizationId)` in each route
- `protectedRoute()` middleware validates user membership in the claimed organisation

### Remaining Risks

- **No database-level enforcement**: If any route omits the org filter, cross-org data leaks
- **350+ routes** rely on this manual pattern — not all have been audited individually
- **New risk skill handlers** (6 functions added) all enforce org scoping via parameter and query filters

### What Was Changed

- All 6 new risk skill handlers verify `organization_id` matches before read/write operations
- `add_mitigation` and `record_risk_decision` both verify the target risk belongs to the caller's organisation before proceeding

### What Still Blocks Production Readiness

1. Integration tests that attempt cross-org data access and verify it fails
2. A query wrapper that auto-injects org filtering for service role queries
3. Audit of all 350+ routes for consistent org_id filtering (not done in this phase)

---

## Ed AI Truthfulness Fixes

### Specialist Prompt Changes

| Agent                   | Previous State                                    | Fix Applied                                               |
| ----------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Risk Specialist         | Referenced 6 callable skills that had no handlers | **Implemented all 6 handlers**, restored skill references |
| Canvas Specialist       | Referenced 6 callable skills with no handlers     | Replaced with honest "Current Limitations" section        |
| Intelligence Specialist | Referenced 6 callable skills                      | No change needed — all 6 ARE implemented                  |
| Estates Specialist      | Referenced 7 callable skills                      | No change needed — all 7 ARE implemented                  |
| Document skills         | Referenced in skills-agent.ts                     | No change needed — all 6 ARE implemented                  |

### Finance Demo Data Fix

**File:** `apps/platform/src/app/(dashboard)/dashboard/finance/page.tsx`

**Fix:** Added prominent DEMO DATA warning banner that:

- Appears when viewing demo data (`plan.school_id === "demo-school"`)
- Uses amber/orange styling that's impossible to miss
- Explains this is sample data, not real school finances
- Includes "Upload Real Budget" button to guide users to correct action

---

## Remaining Security Concerns

| Concern                                      | Severity | Status                          |
| -------------------------------------------- | -------- | ------------------------------- |
| No file type validation on evidence uploads  | HIGH     | Not yet fixed                   |
| 72 unprotected API routes (most intentional) | MEDIUM   | Not yet audited individually    |
| PII masking uses weak regex before AI calls  | MEDIUM   | Not yet fixed                   |
| No right-to-erasure GDPR implementation      | MEDIUM   | Not yet implemented             |
| No auth failure logging                      | LOW      | Not yet implemented             |
| Bearer token auth not TLS-enforced           | LOW      | Acceptable risk (HTTPS assumed) |
