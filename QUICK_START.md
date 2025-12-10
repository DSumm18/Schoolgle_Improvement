# Quick Start Guide

**Schoolgle MCP Server - Getting Started in 5 Minutes**

---

## Prerequisites

- Node.js 20+
- Supabase project in EU region (`eu-west-2` recommended)
- Supabase CLI (optional, for migrations)

---

## Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install package dependencies
cd packages/core && npm install
cd ../mcp-server && npm install
```

---

## Step 2: Set Environment Variables

```bash
# .env file
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MCP_TRANSPORT=stdio
```

**⚠️ IMPORTANT:** Verify your Supabase URL is in EU region (see `WARNINGS.md`)

---

## Step 3: Run Migrations

### Option A: Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/20240101_security_core.sql`
3. Run `supabase/migrations/20240102_entitlements_and_safety.sql`

### Option B: Supabase CLI

```bash
supabase db push
```

### Verify Migrations

```sql
-- Check RLS is enabled
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Should return 100+ policies

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('is_organization_member', 'get_available_tools');
-- Should return 2 rows
```

---

## Step 4: Configure Auth

### Set Organization ID in JWT Claims

**Option A: Auth Hook (Recommended)**

1. Go to Supabase Dashboard → Database → Functions → Auth Hooks
2. Create hook to set `organization_id` in user metadata

**Option B: During Signup**

```typescript
await supabase.auth.signUp({
  email: 'user@school.com',
  password: 'secure-password',
  options: {
    data: {
      organization_id: 'org-uuid-here'
    }
  }
});
```

---

## Step 5: Build & Start

```bash
# Build packages
cd packages/core && npm run build
cd ../mcp-server && npm run build

# Start MCP server
cd packages/mcp-server && npm start
```

---

## Step 6: Test Authentication

```typescript
import { authenticateUserJWT } from '@schoolgle/core/auth';

const context = await authenticateUserJWT(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  jwtToken
);

console.log('Authenticated:', {
  userId: context.userId,
  organizationId: context.organizationId,
  role: context.userRole
});
```

---

## Step 7: Test Tool Execution

```typescript
import { createMCPServer } from '@schoolgle/mcp-server';

// Create server
const server = await createMCPServer('stdio');

// Authenticate (custom MCP extension)
await server.request({
  method: 'auth/authenticate',
  params: {
    authHeader: `Bearer ${jwtToken}`
  }
});

// List available tools (filtered by entitlements)
const { tools } = await server.listTools();
console.log('Available tools:', tools.map(t => t.name));

// Call a tool
const result = await server.callTool({
  name: 'get_financial_records',
  arguments: {
    fiscalYear: '2024-25',
    category: 'pupil_premium'
  }
});

console.log('Result:', result);
```

---

## Common Issues

### "Not authenticated" Error

**Solution:** Call `auth/authenticate` before listing/calling tools

### "Tool not found" Error

**Solution:** Organization doesn't have module. Assign module:
```sql
INSERT INTO organization_modules (organization_id, module_id, module_key)
VALUES ('org-uuid', 'finance_suite', 'finance_bot');
```

### "Requires approval" Error

**Solution:** High-risk tool needs admin approval. Approve via dashboard or:
```typescript
await safety.approveRequest(auditLogId, adminUserId, context);
```

### RLS Policy Not Working

**Solution:** JWT doesn't contain `organization_id`. Set via Auth hook or user metadata.

---

## Next Steps

1. **Read Architecture:** See `README_ARCHITECTURE.md`
2. **Deploy:** Follow `DEPLOYMENT_CHECKLIST.md`
3. **Monitor:** Check `tool_audit_logs` table

---

**Ready to go!** 🚀
