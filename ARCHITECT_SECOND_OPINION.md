# Architect's Second Opinion: MCP Multi-Tenancy Security

**Date:** 2025-01-26  
**Reviewer:** Lead Backend Architect  
**Context:** Review of Antigravity's Structural Integrity Plan for MCP Migration

---

## Executive Summary

**Verdict:** The Antigravity plan identifies critical vulnerabilities correctly, but the proposed solution has **3 fundamental flaws** that must be addressed before implementation.

**Risk Assessment:** HIGH - Current plan would fail in production due to auth architecture mismatch.

---

## Critical Issues with Antigravity's Plan

### Issue 1: Auth Architecture Mismatch ⚠️ CRITICAL

**Problem:** The plan assumes Supabase Auth with `auth.jwt() ->> 'organization_id'`, but your system uses **Firebase Auth** with `users.id` as text (Firebase UID), not Supabase `auth.uid()`.

**Evidence:**
- Schema shows `users.id text primary key` (Firebase UID format)
- No Supabase Auth tables visible
- Current API routes use service role key (bypassing auth entirely)

**Impact:** The proposed `TenantContextManager.createContext()` would fail because:
```typescript
// THIS WON'T WORK - you don't have Supabase Auth users
const { data: { user }, error } = await supabaseAnon.auth.getUser(authToken);
```

**Fix Required:**
1. MCP connection handshake must accept Firebase JWT token
2. Validate Firebase token using Firebase Admin SDK
3. Extract `user_id` from Firebase token
4. Lookup `organization_id` from `organization_members` table (user can belong to multiple orgs)
5. For MCP, require `organization_id` to be passed explicitly in connection metadata (user selects which org context)

### Issue 2: Multi-Organization Users Not Handled ⚠️ HIGH

**Problem:** Users can belong to multiple organizations (see `organization_members` table with composite primary key). The plan assumes single `organization_id` per connection.

**Evidence:**
```sql
create table organization_members (
  organization_id uuid references organizations(id),
  user_id text references users(id),
  role text not null,
  primary key (organization_id, user_id)  -- User can have multiple orgs
);
```

**Impact:** If a user is admin of Org A and teacher at Org B, which `organization_id` should the MCP connection use?

**Fix Required:**
- MCP connection handshake must include `organization_id` as a required parameter
- Validate user is a member of that organization before creating context
- Store `organization_id` in connection metadata (not JWT claims)

### Issue 3: RLS Policy Approach is Incomplete ⚠️ HIGH

**Problem:** The plan suggests `auth.jwt() ->> 'organization_id'`, but:
1. You're using Firebase Auth (no Supabase JWT)
2. Even if you add custom claims, RLS can't easily check `organization_members` membership

**Current State:**
- RLS is enabled on all tables
- Only "Service role full access" policies exist
- **NO user-facing RLS policies** - this is the critical gap

**Better Approach:**
Use a security definer function that checks `organization_members`:

```sql
-- Helper function to check if user is member of organization
create or replace function is_organization_member(
  user_id_param text,
  org_id uuid
) returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from organization_members
    where user_id = user_id_param
      and organization_id = org_id
  );
$$;

-- RLS policy using the function
create policy "Users can access their organization data"
  on evidence_matches
  for select
  using (
    is_organization_member(
      current_setting('request.jwt.claims', true)::json->>'user_id',
      organization_id
    )
  );
```

**However:** This still requires setting `request.jwt.claims` via a custom claim or connection-level setting.

**Recommended Fix:**
For MCP, use **connection-scoped context** rather than JWT claims:
1. MCP connection establishes with `{ userId, organizationId }` in handshake
2. Store in connection metadata
3. Use RLS policies that check a connection-local setting (via `set_config()`)
4. Or, use application-level filtering with RLS as defense-in-depth

---

## Recommended Architecture Adjustments

### 1. MCP Connection Handshake (Revised)

```typescript
interface MCPHandshake {
  authToken: string;           // Firebase JWT
  organizationId: string;      // REQUIRED - user must specify which org
  userId?: string;             // Optional - extracted from token if not provided
}

// Validation:
// 1. Verify Firebase token → get userId
// 2. Verify userId is member of organizationId
// 3. Create TenantContext with both
```

### 2. RLS Policies (Revised Approach)

**Option A: Connection-Level Context (Recommended for MCP)**
- Set `organization_id` in connection metadata
- Use `current_setting('app.organization_id')` in RLS policies
- Set via `set_config('app.organization_id', org_id::text, false)` per connection

**Option B: Security Definer Functions (More Secure)**
- Create helper functions that check `organization_members`
- RLS policies call these functions
- Requires passing `user_id` via connection context

**Option C: Hybrid (Best for Production)**
- Use RLS as defense-in-depth
- Application code (MCP tools) also filters by `organization_id`
- Double-check: RLS blocks if app code fails

### 3. TenantContext Structure (Revised)

```typescript
interface TenantContext {
  userId: string;              // Firebase UID
  organizationId: string;      // Selected organization
  userRole: string;            // Role in this organization
  supabase: SupabaseClient;   // RLS-enabled client (anon key + user context)
  
  // For RLS to work, we need to set connection-level config
  // This is done via Supabase client initialization with custom headers
}
```

---

## Edge Cases Antigravity's Plan Misses

### Edge Case 1: User Belongs to Multiple Orgs
**Scenario:** User is admin of School A and teacher at School B.  
**Current Plan:** Fails - assumes single org.  
**Fix:** Require `organizationId` in MCP handshake, validate membership.

### Edge Case 2: User Removed from Org Mid-Session
**Scenario:** Admin removes user from organization while MCP connection is active.  
**Current Plan:** No handling.  
**Fix:** Add periodic membership validation or connection invalidation on membership change.

### Edge Case 3: Organization Deleted
**Scenario:** Organization is soft-deleted or hard-deleted.  
**Current Plan:** No handling.  
**Fix:** Check organization exists and is active before creating context.

### Edge Case 4: Service Role Key Leakage
**Scenario:** Service role key is accidentally used in MCP tools.  
**Current Plan:** Assumes RLS will block, but service role bypasses RLS.  
**Fix:** Never use service role in MCP tools. Always use anon key with user context.

---

## Final Recommendations

### ✅ Keep from Antigravity's Plan
1. TenantContext injection pattern
2. Zod schema validation for tools
3. Resource-based data access (URI-based)
4. Connection-scoped context management

### ❌ Change from Antigravity's Plan
1. **Auth:** Use Firebase Admin SDK, not Supabase Auth
2. **Organization Selection:** Require explicit `organizationId` in handshake
3. **RLS Policies:** Use security definer functions + connection context, not JWT claims
4. **Multi-Org:** Handle users with multiple organization memberships

### ➕ Add to Plan
1. Connection invalidation on membership changes
2. Organization existence/active status checks
3. Audit logging of MCP tool calls with `organization_id`
4. Rate limiting per organization (not just per user)

---

## Implementation Priority

**Phase 1 (This Week):**
1. ✅ Create MCP server package structure
2. ✅ Implement Firebase Auth validation in TenantContextManager
3. ✅ Write RLS policies using security definer functions
4. ✅ Create tool schemas matching actual database columns
5. ✅ Implement `get_financial_records` and `get_evidence_matches` tools

**Phase 2 (Next Week):**
1. Implement connection handshake with `organizationId` requirement
2. Add connection lifecycle management
3. Implement resource-based data access
4. Add audit logging

**Phase 3 (Following Week):**
1. Gateway middleware for web-based connections
2. WebSocket transport
3. Connection pooling
4. Load testing

---

## Conclusion

Antigravity correctly identified the vulnerabilities, but the solution needs architectural adjustments for Firebase Auth and multi-organization support. The revised approach maintains security while accommodating your specific auth architecture.

**Confidence Level:** HIGH - This approach will work with your current setup.


