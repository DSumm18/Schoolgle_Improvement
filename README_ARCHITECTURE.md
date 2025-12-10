# Schoolgle MCP Server Architecture

**Version:** 2.0 (Native Supabase Auth)  
**Date:** 2025-01-26  
**GDPR Compliant:** ✅ EU Region (eu-west-2)

---

## Overview

The Schoolgle MCP (Model Context Protocol) Server is a secure, multi-tenant system designed for UK EdTech compliance. It provides AI agents with controlled access to school data through a module-based entitlement system.

---

## Core Architecture Principles

### 1. **Native Supabase Auth**
- ✅ Uses Supabase Auth (not Firebase)
- ✅ JWT tokens contain `organization_id` in claims
- ✅ RLS policies use `auth.uid()` and `auth.jwt() ->> 'organization_id'`
- ✅ No middleware injection - all security at database level

### 2. **Dual-Auth System**

#### User JWTs (Frontend Users)
```typescript
// Authentication flow:
1. User signs in via Supabase Auth
2. JWT contains: auth.uid() + organization_id in claims
3. MCP server validates JWT and extracts context
4. RLS policies automatically filter by organization_id
```

**JWT Claims Structure:**
```json
{
  "sub": "user-uuid",
  "email": "user@school.com",
  "organization_id": "org-uuid",
  "role": "admin"
}
```

#### API Keys (B2B Partners)
```typescript
// Authentication flow:
1. Partner provides API key in Authorization header
2. Server hashes key and looks up in api_keys table
3. Returns organization context
4. Same RLS policies apply
```

**API Key Format:**
```
Authorization: sk_live_abc123def456...
```

**Storage:**
- Keys are hashed with SHA-256 before storage
- Original key shown only once during creation
- Keys can be scoped with permissions array

---

## Module Entitlements (App Store)

### Concept

Schools purchase different modules (e.g., "Ofsted Inspector", "Finance Bot"). Tools are gated behind module ownership.

### Schema

```sql
-- Available modules
modules (
  id, key, name, description,
  price_monthly, price_annual,
  features, default_limits
)

-- Organization purchases
organization_modules (
  organization_id, module_id, module_key,
  enabled, expires_at, custom_limits
)

-- Tool definitions
tool_definitions (
  tool_key, tool_name, description,
  module_key, risk_level, requires_approval
)
```

### How It Works

1. **Tool Registration:**
   ```typescript
   // Tools are registered in tool_definitions table
   {
     tool_key: 'get_financial_records',
     module_key: 'finance_bot',
     risk_level: 'low'
   }
   ```

2. **Entitlement Check:**
   ```sql
   -- Function checks if org has module
   SELECT organization_has_module(org_id, 'finance_bot');
   ```

3. **Tool Filtering:**
   ```typescript
   // MCP server.listTools() only returns tools for purchased modules
   const tools = await filterTools(authContext);
   // Returns: ['get_financial_records'] if org has finance_bot
   // Returns: [] if org doesn't have finance_bot
   ```

4. **Core Module:**
   - Tools with `module_key = 'core'` are always available
   - No purchase required

---

## Tool Safety Layer (GDPR & Safeguarding)

### Audit Logging

**Every tool call is logged:**
```sql
tool_audit_logs (
  id, organization_id, user_id,
  tool_name, tool_module_key,
  request_inputs, request_timestamp,
  response_output, response_timestamp,
  response_status, risk_level,
  requires_approval, approved_by, approved_at
)
```

### Risk Levels

- **Low:** Read-only operations (e.g., `get_financial_records`)
- **Medium:** Write operations (e.g., `update_assessment`)
- **High:** Destructive operations (e.g., `delete_data`, `email_parent`)

### Approval Workflow

1. **High-Risk Tool Called:**
   ```typescript
   {
     tool: 'delete_data',
     risk_level: 'high',
     requires_approval: true
   }
   ```

2. **Middleware Blocks Execution:**
   ```json
   {
     "error": "Tool requires human approval",
     "requiresApproval": true,
     "approvalRequestId": "audit-log-uuid"
   }
   ```

3. **Admin Approves via Dashboard:**
   ```typescript
   await safety.approveRequest(auditLogId, adminUserId, context);
   ```

4. **Tool Executes:**
   - Original request is replayed
   - Response is logged

### Data Sanitization

Sensitive fields are redacted in audit logs:
```typescript
// tool_definitions.sensitive_fields = ['password', 'ssn']
// Input: { username: 'john', password: 'secret123' }
// Logged: { username: 'john', password: '[REDACTED]' }
```

---

## Row Level Security (RLS)

### Policy Pattern

All tenant-scoped tables use this pattern:

```sql
-- Helper function
create function is_organization_member(org_id uuid) returns boolean
as $$
  select exists (
    select 1 from organization_members
    where user_id = auth.uid()::text
      and organization_id = org_id
  );
$$;

-- RLS Policy
create policy "Users can view data for their organizations"
  on evidence_matches
  for select
  using (is_organization_member(organization_id));
```

### How It Works

1. **User authenticates** → JWT contains `organization_id`
2. **Query executes** → RLS policy checks `is_organization_member(organization_id)`
3. **Function verifies** → Checks `organization_members` table
4. **Access granted/denied** → Based on membership

### Key Points

- ✅ **No application-level filtering needed** - RLS handles it
- ✅ **Works with both User JWTs and API Keys**
- ✅ **Automatic** - No code changes required
- ✅ **GDPR compliant** - Data isolation at database level

---

## MCP Server Flow

### 1. Connection Establishment

```typescript
// Client connects
const server = await createMCPServer('stdio');

// Client authenticates
await server.request({
  method: 'auth/authenticate',
  params: { authHeader: 'Bearer <jwt>' }
});

// Context stored per connection
connectionContexts.set(connectionId, authContext);
```

### 2. Tool Discovery

```typescript
// Client requests available tools
const tools = await server.listTools();

// Server filters by entitlements
const availableTools = await filterTools(authContext);
// Returns only tools for purchased modules
```

### 3. Tool Execution

```typescript
// Client calls tool
await server.callTool({
  name: 'get_financial_records',
  arguments: { fiscalYear: '2024-25' }
});

// Flow:
// 1. Safety middleware logs request
// 2. Checks if approval required
// 3. Validates inputs (Zod)
// 4. Executes handler
// 5. Logs response
// 6. Returns result
```

---

## Security Guarantees

### 1. **Tenant Isolation**
- ✅ RLS policies enforce organization boundaries
- ✅ `organization_id` injected from auth context (never user input)
- ✅ Database-level enforcement (can't bypass)

### 2. **Input Validation**
- ✅ Zod schemas for all tool inputs
- ✅ Type-safe validation
- ✅ Prevents hallucinated parameters

### 3. **Audit Trail**
- ✅ Every tool call logged
- ✅ Request/response captured
- ✅ GDPR compliance (data retention policies)

### 4. **Approval Gates**
- ✅ High-risk tools require human approval
- ✅ Approval workflow tracked
- ✅ Prevents accidental data loss

---

## Module Examples

### Finance Bot Module

**Tools:**
- `get_financial_records` - Pupil Premium, Sports Premium data
- `get_spending_breakdown` - Detailed spending analysis
- `generate_financial_report` - PDF report generation

**Pricing:**
- Monthly: £39
- Annual: £399

**Entitlement:**
```sql
INSERT INTO organization_modules (organization_id, module_id, module_key)
VALUES ('org-uuid', 'finance_suite', 'finance_bot');
```

### Ofsted Inspector Module

**Tools:**
- `get_evidence_matches` - Evidence for subcategories
- `get_assessments` - Self-assessment data
- `generate_sef` - Self-Evaluation Form

**Pricing:**
- Monthly: £49
- Annual: £499

---

## GDPR Compliance

### Data Residency
- ✅ Supabase project in `eu-west-2` (London)
- ✅ All data stored in EU region
- ✅ Backup regions also EU-compliant

### Data Access
- ✅ Users can only access their organization's data
- ✅ RLS enforces isolation
- ✅ Audit logs track all access

### Data Export
- ✅ Tools available for GDPR Article 20 (data portability)
- ✅ Export functionality in dashboard
- ✅ Structured data formats (JSON, CSV)

### Data Deletion
- ✅ Tools available for GDPR Article 17 (right to erasure)
- ✅ Requires approval (high-risk operation)
- ✅ Cascading deletes handled by foreign keys

---

## API Key Management

### Creating API Keys

```typescript
// Admin creates API key for B2B partner
const apiKey = generateSecureKey(); // e.g., 'sk_live_...'
const keyHash = sha256(apiKey);

await supabase.from('api_keys').insert({
  organization_id: 'org-uuid',
  name: 'Partner Integration',
  key_hash: keyHash,
  permissions: ['read:financials', 'read:evidence'],
  expires_at: '2025-12-31'
});
```

### Using API Keys

```typescript
// Partner authenticates
const context = await authenticateAPIKey(supabaseUrl, apiKey);

// Same RLS policies apply
// Same tool filtering applies
// Same audit logging applies
```

---

## Development Workflow

### 1. Add New Tool

```typescript
// 1. Define Zod schema
export const GetNewDataSchema = z.object({ ... });

// 2. Implement handler
export async function handleGetNewData(
  args: GetNewDataInput,
  context: AuthContext
): Promise<NewDataResult> {
  // Use context.organizationId (never args.organizationId)
  // Use context.supabase (RLS-enabled client)
}

// 3. Register in tool_definitions
INSERT INTO tool_definitions (tool_key, tool_name, module_key, risk_level)
VALUES ('get_new_data', 'Get New Data', 'finance_bot', 'low');

// 4. Add to MCP server routing
case 'get_new_data':
  handler = async (req) => {
    const validated = GetNewDataSchema.parse(req.inputs);
    return handleGetNewData(validated, req.context);
  };
```

### 2. Add New Module

```sql
-- 1. Create module
INSERT INTO modules (id, key, name, category, price_monthly)
VALUES ('new_module', 'new_module_key', 'New Module', 'operations', 29);

-- 2. Link tools to module
UPDATE tool_definitions
SET module_key = 'new_module_key'
WHERE tool_key IN ('tool1', 'tool2');

-- 3. Organizations purchase module
INSERT INTO organization_modules (organization_id, module_id, module_key)
VALUES ('org-uuid', 'new_module', 'new_module_key');
```

---

## Testing

### Unit Tests

```typescript
// Test tool handler
const result = await handleGetFinancialRecords(
  { fiscalYear: '2024-25' },
  mockAuthContext
);
expect(result.pupilPremium).toBeDefined();
```

### Integration Tests

```typescript
// Test RLS isolation
const org1Context = await authenticate(org1JWT);
const org2Context = await authenticate(org2JWT);

const org1Data = await org1Context.supabase
  .from('evidence_matches')
  .select('*');

const org2Data = await org2Context.supabase
  .from('evidence_matches')
  .select('*');

expect(org1Data).not.toContain(org2Data);
```

### Security Tests

```typescript
// Test organization_id injection prevention
const maliciousInput = {
  organizationId: 'other-org-uuid', // Should be ignored
  fiscalYear: '2024-25'
};

const result = await handleGetFinancialRecords(
  maliciousInput,
  validContext
);

// Should return data for validContext.organizationId, not malicious input
expect(result.organizationId).toBe(validContext.organizationId);
```

---

## Deployment

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co  # Must be EU region
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Only for API key lookup

# Optional
MCP_TRANSPORT=stdio  # or 'sse'
```

### Supabase Setup

1. **Run migrations:**
   ```bash
   supabase db push
   ```

2. **Verify RLS:**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Set up Auth hooks:**
   - Database → Functions → Auth Hooks
   - Add hook to set `organization_id` in JWT claims

---

## Monitoring

### Audit Log Queries

```sql
-- High-risk tool calls
SELECT * FROM tool_audit_logs
WHERE risk_level = 'high'
ORDER BY request_timestamp DESC;

-- Pending approvals
SELECT * FROM tool_audit_logs
WHERE requires_approval = true
  AND approved_at IS NULL;

-- Tool usage by organization
SELECT 
  organization_id,
  tool_name,
  COUNT(*) as call_count
FROM tool_audit_logs
WHERE request_timestamp > NOW() - INTERVAL '30 days'
GROUP BY organization_id, tool_name;
```

---

## Troubleshooting

### "Not authenticated" Error

**Cause:** Connection not authenticated  
**Fix:** Call `auth/authenticate` before listing/calling tools

### "Tool not found" Error

**Cause:** Organization doesn't have module  
**Fix:** Purchase module or check `organization_modules` table

### "Requires approval" Error

**Cause:** High-risk tool needs admin approval  
**Fix:** Approve via dashboard or check `tool_audit_logs`

### RLS Policy Not Working

**Cause:** JWT doesn't contain `organization_id`  
**Fix:** Set `organization_id` in user metadata during signup or via Auth hook

---

## Future Enhancements

1. **Rate Limiting:** Per-organization tool call limits
2. **Caching:** Redis cache for frequently accessed data
3. **Webhooks:** Notify external systems on tool execution
4. **Analytics:** Usage dashboards per organization
5. **Multi-Region:** Support for non-EU regions (with data residency controls)

---

**Last Updated:** 2025-01-26  
**Maintainer:** Schoolgle Engineering Team


