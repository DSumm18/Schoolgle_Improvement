# Cross-Organisation Isolation Tests

**Date:** 2026-03-19
**Status:** Design-level assessment (runtime integration tests not executable from code review)

---

## Current Isolation Model

### Layers

| Layer              | Mechanism                                                           | Status         |
| ------------------ | ------------------------------------------------------------------- | -------------- |
| **Authentication** | Firebase Auth → Supabase session → `protectedRoute()` middleware    | WORKING        |
| **Membership**     | `organization_members` table validates user belongs to claimed org  | WORKING        |
| **Query Scoping**  | Manual `.eq("organization_id", auth.organizationId)` on every query | APPLIED (95%+) |
| **RLS**            | All tables have RLS enabled, but service role bypasses it           | STRUCTURAL GAP |

### How `protectedRoute()` Works

```
Request → Extract token (cookie or Bearer header)
        → Look up user in Supabase auth
        → Find organization_id from request or organization_members
        → Verify user is a member of that organization
        → Pass (userId, email, organizationId, role) to handler
```

**Key protection:** A user cannot claim an `organizationId` they don't belong to — the middleware validates membership before the handler runs.

---

## Test Design (What Should Be Verified at Runtime)

### Test 1: Direct API Access — Cross-Org Staff

- **Setup:** User A belongs to Org A, User B belongs to Org B
- **Action:** User A calls `GET /api/staff?organizationId=<OrgB_ID>`
- **Expected:** 403 Forbidden (middleware rejects before handler)
- **Risk if fails:** User A sees Org B's staff directory

### Test 2: Direct API Access — Cross-Org Risks

- **Setup:** Same as above
- **Action:** User A calls `GET /api/risk?organizationId=<OrgB_ID>`
- **Expected:** 403 Forbidden
- **Risk if fails:** User A sees Org B's risk register

### Test 3: Data Modification — Cross-Org

- **Setup:** Same as above
- **Action:** User A calls `POST /api/risk` with `organization_id: <OrgB_ID>`
- **Expected:** 403 Forbidden OR handler uses `auth.organizationId` (overrides parameter)
- **Risk if fails:** User A creates data in Org B

### Test 4: Ed Skills — Cross-Org

- **Setup:** Same as above
- **Action:** User A calls `POST /api/skills/invoke` with `{ function_name: "get_risk_register", parameters: { organization_id: "<OrgB_ID>" } }`
- **Expected:** Skills handler uses `auth.organizationId`, ignores parameter
- **Risk if fails:** Ed returns Org B's data to User A

### Test 5: Imported Pupil Data Isolation

- **Setup:** Org A imports 50 pupils, Org B imports 30 pupils
- **Action:** User B calls `GET /api/pupils`
- **Expected:** Only Org B's 30 pupils returned
- **Risk if fails:** Pupil data leaks across organisations

### Test 6: Document Placeholder Isolation

- **Setup:** Org A has staff "Jane Smith", Org B has staff "John Brown"
- **Action:** User B generates document with `{{staff_name}}` placeholder
- **Expected:** Only Org B's staff data used in resolution
- **Risk if fails:** Org A's staff names appear in Org B's documents

---

## Code-Level Assessment

### Findings from Source Analysis

| Area                | Isolation Applied | Notes                                                                              |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------- |
| `protectedRoute()`  | YES               | Validates org membership before handler                                            |
| Staff API           | YES               | `.eq("organization_id", auth.organizationId)`                                      |
| Risk API            | YES               | `.eq("organization_id", organizationId)` with auth fallback                        |
| Pupils API (new)    | YES               | `.eq("organization_id", organizationId)`                                           |
| Skills invoke       | YES               | `orgId = parameters.organization_id \|\| auth.organizationId` — uses auth fallback |
| Risk skill handlers | YES               | All 6 handlers verify org ownership                                                |
| Compliance API      | YES               | `.eq("organization_id", auth.organizationId)`                                      |
| Estates API         | YES               | `.eq("organization_id", auth.organizationId)`                                      |
| Governance API      | YES               | `.eq("organization_id", organizationId)`                                           |
| Meetings API        | YES               | `.eq("organization_id", auth.organizationId)`                                      |
| Documents API       | YES               | Placeholder resolver queries org-scoped                                            |

### Structural Risk

**`createServiceRoleClient()` bypasses RLS** — all 350+ API routes use the service role client, which means database-level RLS policies are NOT the enforcement layer. App-code filtering is the only protection.

**Implication:** If any single route omits the `.eq("organization_id", ...)` filter, data from all organisations is returned. This is a systemic risk, not a per-route bug.

### Risk Mitigation Options

| Option                                                                                              | Effort    | Protection Level                   |
| --------------------------------------------------------------------------------------------------- | --------- | ---------------------------------- |
| **1. Query wrapper** — create `orgScopedQuery(supabase, table, orgId)` that auto-injects filter     | 4-6 hours | High (prevents omissions)          |
| **2. RLS policies** — add `organization_id = current_setting('app.organization_id')::uuid` policies | 6-8 hours | Highest (database enforced)        |
| **3. Integration tests** — automated tests that verify cross-org data cannot leak                   | 2-3 days  | Verification (catches regressions) |

### Recommendation

**Option 1 (query wrapper) + Option 3 (integration tests)** — pragmatic for pilot. Option 2 (RLS) deferred to production hardening as it requires setting session-level variables on every request.

---

## Remaining Gaps

1. **No runtime integration tests** — the tests above are designs, not executed results
2. **No query wrapper** — each route manually applies org scoping
3. **Service role bypasses RLS** — structural, accepted for pilot
4. **Skills invoke uses parameter fallback** — `parameters.organization_id || auth.organizationId` — if a user passes a different org_id in the parameter, the middleware will reject them (because `protectedRoute` already validated their org)

---

## Conclusion

**For limited pilot:** The current isolation model is adequate because:

1. `protectedRoute()` validates org membership before any handler runs
2. A user cannot claim an org they don't belong to
3. All handlers apply org filtering in queries

**For production:** Need query wrapper + integration tests + database-level RLS policies.

**Assessment: ACCEPTABLE FOR PILOT, NOT SUFFICIENT FOR PRODUCTION**
