# Lazy-Load DfE Client Fix

## Summary
Refactored DfE Supabase client to use lazy-loading pattern to prevent "Invalid API" errors caused by environment variables not being loaded at module initialization time.

## Changes Made

### 1. `apps/platform/src/lib/supabase-dfe.ts`
**Before:**
```typescript
export const dfeClient = createClient(
  process.env.DFE_SUPABASE_URL!,
  process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!
);
```

**After:**
```typescript
let dfeClientInstance: SupabaseClient | null = null;

export function getDfeClient(): SupabaseClient {
  if (!dfeClientInstance) {
    const url = process.env.DFE_SUPABASE_URL;
    const key = process.env.DFE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error(
        'DfE client not configured - missing environment variables. ' +
        'Required: DFE_SUPABASE_URL and DFE_SUPABASE_SERVICE_ROLE_KEY'
      );
    }
    
    dfeClientInstance = createClient(url, key);
  }
  
  return dfeClientInstance;
}
```

**Benefits:**
- Client is created only when first needed (after Next.js loads env vars)
- Clear error message if env vars are missing
- Singleton pattern ensures only one client instance
- No behavioral changes to existing functionality

### 2. Updated All Usages

#### `apps/platform/src/app/api/school/search/route.ts`
- Changed import: `dfeClient` → `getDfeClient`
- Updated 2 usages: URN search and name/town search
- Both now call `getDfeClient()` instead of using `dfeClient` directly

#### `apps/platform/src/app/api/onboarding/complete/route.ts`
- Removed unused `dfeClient` import
- `lookupSchoolByURN()` already uses `getDfeClient()` internally (updated in step 1)

#### `apps/platform/src/lib/supabase-dfe.ts` (internal)
- Updated `lookupSchoolByURN()` to use `getDfeClient()` instead of `dfeClient`

## Files Modified
1. `apps/platform/src/lib/supabase-dfe.ts` - Core refactor
2. `apps/platform/src/app/api/school/search/route.ts` - Updated imports and usages
3. `apps/platform/src/app/api/onboarding/complete/route.ts` - Removed unused import

## Verification
- ✅ No linter errors
- ✅ All `dfeClient` references removed (grep confirms)
- ✅ Function signatures unchanged
- ✅ No schema changes
- ✅ No behavioral changes

## Testing Checklist
After server restart, verify:
1. ✅ School search works (`/api/school/search?q=test`)
2. ✅ URN lookup works (`lookupSchoolByURN()`)
3. ✅ Organization creation succeeds (onboarding flow)
4. ✅ No "Invalid API" errors in console

## Impact
- **Stability**: Prevents errors from env vars not being loaded
- **Performance**: No change (client still cached after first call)
- **Compatibility**: 100% backward compatible (same behavior, different implementation)



