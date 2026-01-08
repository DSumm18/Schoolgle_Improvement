# API Error Diagnosis

## Current Issue
"Invalid API" errors appearing in console - likely related to environment variable loading.

## Files Involved

### 1. DfE Client Creation (`apps/platform/src/lib/supabase-dfe.ts`)
**Problem**: `dfeClient` is created at **module load time** (line 9-12):
```typescript
export const dfeClient = createClient(
  process.env.DFE_SUPABASE_URL!,      // ⚠️ Created immediately
  process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!
);
```

**Issue**: If env vars aren't loaded yet, this creates a client with `undefined` values, causing "Invalid API" errors.

### 2. API Routes Using DfE Client
- `/api/school/search/route.ts` - Imports `dfeClient` from `@/lib/supabase-dfe`
- `/api/onboarding/complete/route.ts` - Uses `lookupSchoolByURN()` which uses `dfeClient`

### 3. Environment Variables Check
From `.env.local`:
- ✅ `DFE_SUPABASE_URL` exists
- ✅ `DFE_SUPABASE_SERVICE_ROLE_KEY` exists
- ✅ `NEXT_PUBLIC_SUPABASE_URL` exists
- ✅ `SUPABASE_SERVICE_ROLE_KEY` exists

## Root Cause Analysis

**Hypothesis**: The `dfeClient` is created when the module is first imported, but Next.js might not have loaded `.env.local` yet, OR the env vars aren't being passed to the server-side API routes properly.

## Current Flow

1. User navigates to `/onboarding/select-school`
2. Page loads, imports components
3. Component calls `/api/school/search`
4. API route imports `dfeClient` from `@/lib/supabase-dfe`
5. **At this point**, `dfeClient` is created with `process.env.DFE_SUPABASE_URL`
6. If env var is `undefined`, Supabase client throws "Invalid API key"

## Proposed Solutions

### Option 1: Lazy-Load the Client (Recommended)
Create the client only when needed, not at module load time:
```typescript
let dfeClientInstance: SupabaseClient | null = null;

export function getDfeClient(): SupabaseClient {
  if (!dfeClientInstance) {
    const url = process.env.DFE_SUPABASE_URL;
    const key = process.env.DFE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('DfE client not configured - missing environment variables');
    }
    
    dfeClientInstance = createClient(url, key);
  }
  return dfeClientInstance;
}
```

### Option 2: Check Env Vars Before Creating
Add validation at module load:
```typescript
const dfeUrl = process.env.DFE_SUPABASE_URL;
const dfeKey = process.env.DFE_SUPABASE_SERVICE_ROLE_KEY;

if (!dfeUrl || !dfeKey) {
  console.warn('[DfE Client] Environment variables not set - DfE features will be disabled');
}

export const dfeClient = dfeUrl && dfeKey 
  ? createClient(dfeUrl, dfeKey)
  : null;
```

### Option 3: Create Client Per Request
Create a new client in each API route (less efficient but more reliable):
```typescript
// In each API route
const dfeClient = createClient(
  process.env.DFE_SUPABASE_URL!,
  process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!
);
```

## Next Steps

1. **Check if env vars are actually loaded** - Add logging to see what values are present
2. **Choose a solution** - Option 1 (lazy-load) is best for performance and reliability
3. **Update all usages** - Change `dfeClient` to `getDfeClient()` in API routes
4. **Test** - Verify the errors are gone

## Questions to Answer

1. Are the env vars loaded when the API route runs? (Check server logs)
2. Is the error happening on first import or on actual API call?
3. Are there 3 separate errors or 3 instances of the same error?



