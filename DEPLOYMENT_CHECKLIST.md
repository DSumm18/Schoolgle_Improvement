# Deployment Checklist

**Project:** Schoolgle MCP Server  
**Version:** 2.0 (Native Supabase Auth)  
**Date:** 2025-01-26

---

## Pre-Deployment

### 1. Environment Verification ✅

- [ ] **Supabase Region Check**
  ```bash
  # Verify URL contains EU region
  echo $NEXT_PUBLIC_SUPABASE_URL | grep -E "(eu-west-2|eu-central-1|eu-west-1)"
  ```
  - If not EU region: **STOP** - See `WARNINGS.md`

- [ ] **Environment Variables Set**
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
  SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Only for API key lookup
  MCP_TRANSPORT=stdio  # or 'sse'
  ```

### 2. Database Migrations ✅

- [ ] **Run Security Core Migration**
  ```bash
  # In Supabase Dashboard → SQL Editor
  # Or via CLI:
  supabase db push
  ```
  - File: `supabase/migrations/20240101_security_core.sql`
  - Verifies: RLS enabled, policies created

- [ ] **Run Entitlements & Safety Migration**
  ```bash
  # Same process
  ```
  - File: `supabase/migrations/20240102_entitlements_and_safety.sql`
  - Verifies: Tables created, functions created

- [ ] **Verify Migrations**
  ```sql
  -- Check RLS is enabled
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND rowsecurity = false;
  -- Should return 0 rows

  -- Check policies exist
  SELECT COUNT(*) as policy_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  -- Should be 100+ policies

  -- Check functions exist
  SELECT routine_name 
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN (
      'is_organization_member',
      'get_user_organization_ids',
      'organization_has_module',
      'get_available_tools'
    );
  -- Should return 4 rows
  ```

### 3. Auth Configuration ✅

- [ ] **Set Up Supabase Auth Hook**
  - Go to: Supabase Dashboard → Database → Functions → Auth Hooks
  - Create hook to set `organization_id` in JWT claims
  - Or set in user metadata during signup:
    ```typescript
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          organization_id: 'org-uuid'
        }
      }
    });
    ```

- [ ] **Test User Authentication**
  ```typescript
  import { authenticateUserJWT } from '@schoolgle/core/auth';
  
  const context = await authenticateUserJWT(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    jwtToken
  );
  
  console.log('Organization ID:', context.organizationId);
  // Should print organization UUID
  ```

### 4. Module Setup ✅

- [ ] **Verify Modules Seeded**
  ```sql
  SELECT id, key, name FROM modules;
  -- Should show: core, ofsted_inspector, finance_bot, etc.
  ```

- [ ] **Verify Tool Definitions Seeded**
  ```sql
  SELECT tool_key, tool_name, module_key, risk_level 
  FROM tool_definitions;
  -- Should show: get_financial_records, get_evidence_matches, etc.
  ```

- [ ] **Test Organization Module Assignment**
  ```sql
  -- Assign module to test organization
  INSERT INTO organization_modules (organization_id, module_id, module_key)
  VALUES (
    'your-test-org-uuid',
    'finance_suite',
    'finance_bot'
  );
  
  -- Verify entitlement
  SELECT organization_has_module('your-test-org-uuid', 'finance_bot');
  -- Should return: true
  ```

---

## Build & Test

### 5. Build Packages ✅

- [ ] **Build Core Package**
  ```bash
  cd packages/core
  npm install
  npm run build
  ```

- [ ] **Build MCP Server**
  ```bash
  cd packages/mcp-server
  npm install
  npm run build
  ```

- [ ] **Type Check**
  ```bash
  npm run typecheck
  # In both packages
  ```

### 6. Unit Tests ✅

- [ ] **Test Auth Functions**
  ```typescript
  // Test User JWT auth
  const userContext = await authenticateUserJWT(url, validJWT);
  expect(userContext.organizationId).toBeDefined();

  // Test API Key auth
  const apiContext = await authenticateAPIKey(url, validAPIKey);
  expect(apiContext.organizationId).toBeDefined();
  ```

- [ ] **Test Tool Handlers**
  ```typescript
  const result = await handleGetFinancialRecords(
    { fiscalYear: '2024-25' },
    mockAuthContext
  );
  expect(result.organizationId).toBe(mockAuthContext.organizationId);
  ```

### 7. Integration Tests ✅

- [ ] **Test RLS Isolation**
  ```typescript
  // Create two org contexts
  const org1Context = await authenticate(org1JWT);
  const org2Context = await authenticate(org2JWT);

  // Query same table
  const org1Data = await org1Context.supabase
    .from('evidence_matches')
    .select('*');

  const org2Data = await org2Context.supabase
    .from('evidence_matches')
    .select('*');

  // Verify isolation
  expect(org1Data).not.toContain(org2Data);
  ```

- [ ] **Test Entitlement Filtering**
  ```typescript
  // Org without finance_bot module
  const context = await authenticate(orgJWT);
  const tools = await filterTools(context);
  
  // Should NOT include get_financial_records
  expect(tools.find(t => t.name === 'get_financial_records')).toBeUndefined();
  
  // Assign module
  await assignModule(orgId, 'finance_bot');
  
  // Should NOW include get_financial_records
  const toolsAfter = await filterTools(context);
  expect(toolsAfter.find(t => t.name === 'get_financial_records')).toBeDefined();
  ```

- [ ] **Test Safety Middleware**
  ```typescript
  // Call high-risk tool
  const response = await safety.processRequest(
    { toolName: 'delete_data', inputs: {}, context },
    mockHandler
  );

  // Should require approval
  expect(response.requiresApproval).toBe(true);
  expect(response.approvalRequestId).toBeDefined();
  ```

---

## Security Verification

### 8. Security Tests ✅

- [ ] **Test Organization ID Injection Prevention**
  ```typescript
  // Malicious input with different org ID
  const maliciousInput = {
    organizationId: 'other-org-uuid',
    fiscalYear: '2024-25'
  };

  const result = await handleGetFinancialRecords(
    maliciousInput,
    validContext
  );

  // Should return data for validContext.organizationId, not malicious input
  expect(result.organizationId).toBe(validContext.organizationId);
  expect(result.organizationId).not.toBe('other-org-uuid');
  ```

- [ ] **Test Unauthorized Access**
  ```typescript
  // User not member of organization
  const unauthorizedContext = await authenticate(unauthorizedJWT);
  
  const { data, error } = await unauthorizedContext.supabase
    .from('evidence_matches')
    .select('*')
    .eq('organization_id', 'target-org-uuid');

  // Should return empty or error
  expect(data).toEqual([]);
  ```

- [ ] **Test API Key Validation**
  ```typescript
  // Invalid API key
  await expect(
    authenticateAPIKey(url, 'invalid-key')
  ).rejects.toThrow('Invalid or inactive API key');

  // Expired API key
  await expect(
    authenticateAPIKey(url, expiredKey)
  ).rejects.toThrow('API key has expired');
  ```

---

## Production Deployment

### 9. Production Environment ✅

- [ ] **Supabase Production Project**
  - [ ] Project in `eu-west-2` (London)
  - [ ] All migrations applied
  - [ ] RLS policies verified
  - [ ] Auth hooks configured

- [ ] **Environment Variables**
  ```bash
  # Production .env
  NEXT_PUBLIC_SUPABASE_URL=https://[prod-project].supabase.co
  SUPABASE_ANON_KEY=eyJ...  # Production anon key
  SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Production service role
  MCP_TRANSPORT=stdio
  NODE_ENV=production
  ```

- [ ] **Build Production Artifacts**
  ```bash
  npm run build
  # In both packages/core and packages/mcp-server
  ```

### 10. Monitoring Setup ✅

- [ ] **Audit Log Monitoring**
  ```sql
  -- Create view for high-risk tool calls
  CREATE VIEW high_risk_tool_calls AS
  SELECT 
    organization_id,
    tool_name,
    request_timestamp,
    response_status,
    requires_approval
  FROM tool_audit_logs
  WHERE risk_level = 'high'
  ORDER BY request_timestamp DESC;
  ```

- [ ] **Alerting**
  - [ ] Set up alerts for failed authentications
  - [ ] Set up alerts for blocked high-risk tools
  - [ ] Set up alerts for RLS policy violations (if possible)

### 11. Documentation ✅

- [ ] **API Documentation**
  - [ ] Document authentication endpoints
  - [ ] Document available tools
  - [ ] Document module entitlements

- [ ] **Runbook**
  - [ ] How to approve high-risk tool calls
  - [ ] How to create API keys
  - [ ] How to assign modules to organizations
  - [ ] How to troubleshoot RLS issues

---

## Post-Deployment

### 12. Verification ✅

- [ ] **Smoke Tests**
  ```bash
  # Test MCP server starts
  npm start

  # Test authentication
  curl -X POST http://localhost:3000/auth \
    -H "Authorization: Bearer $JWT_TOKEN"

  # Test tool listing
  curl -X POST http://localhost:3000/tools/list \
    -H "Authorization: Bearer $JWT_TOKEN"
  ```

- [ ] **Load Testing**
  - [ ] Test with multiple concurrent connections
  - [ ] Test with multiple organizations
  - [ ] Monitor RLS policy performance

- [ ] **Security Audit**
  - [ ] Review audit logs
  - [ ] Verify no data leakage
  - [ ] Verify entitlements working

---

## Rollback Plan

### If Issues Occur:

1. **Rollback Migrations**
   ```sql
   -- Drop new policies (keep RLS enabled)
   DROP POLICY IF EXISTS "Users can view evidence matches for their organizations" ON evidence_matches;
   -- Repeat for all new policies
   ```

2. **Disable MCP Server**
   - Stop MCP server process
   - Revert to previous auth system (if needed)

3. **Restore Database**
   ```bash
   # Restore from backup if needed
   supabase db reset
   ```

---

## Success Criteria

✅ All migrations applied successfully  
✅ RLS policies working correctly  
✅ Authentication working (User JWTs + API Keys)  
✅ Entitlements filtering tools correctly  
✅ Safety middleware logging and blocking correctly  
✅ No data leakage between organizations  
✅ GDPR compliance verified (EU region)  
✅ All tests passing  

---

**Deployment Status:** ⏳ Pending  
**Next Action:** Run migrations and verify

