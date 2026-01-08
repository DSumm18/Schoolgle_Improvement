# Onboarding Errors Fixed

## Issues Identified and Resolved

### 1. sessionStorage SSR Error
**Problem**: Accessing `sessionStorage` during server-side rendering causes errors.

**Fix**: Added `typeof window !== 'undefined'` checks before accessing sessionStorage in:
- `select-school/page.tsx` - `handleSelectSchool()`
- `confirm-school/page.tsx` - `useEffect()` and `handleConfirm()`

### 2. Supabase Query Errors
**Problem**: Using `.single()` throws errors when no rows exist (PGRST116).

**Fix**: Changed to `.maybeSingle()` in:
- `onboarding/complete/route.ts` - Organization lookup (line 68)
- `onboarding/complete/route.ts` - Member lookup (line 157)

### 3. Missing Error Handling
**Problem**: API routes didn't handle DfE client configuration errors gracefully.

**Fix**: Added environment variable checks and better error messages in:
- `api/school/search/route.ts` - Checks for DfE env vars
- `lib/supabase-dfe.ts` - Added env var validation in `lookupSchoolByURN()`

### 4. User ID Validation
**Problem**: No null check before accessing `user.id`.

**Fix**: Added explicit null check in `confirm-school/page.tsx`:
```typescript
if (!user || !user.id) {
  setError('User not found. Please log in again.');
  return;
}
```

### 5. API Response Error Handling
**Problem**: Didn't check `response.ok` before parsing JSON.

**Fix**: Added response status check:
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: 'Network error' }));
  throw new Error(errorData.error || `Server error: ${response.status}`);
}
```

## Testing Checklist

After these fixes, test:
1. ✅ Page loads without console errors
2. ✅ Search works (if DfE configured)
3. ✅ School selection stores in sessionStorage
4. ✅ Confirm page displays school data
5. ✅ API calls handle errors gracefully
6. ✅ Skip path works
7. ✅ Organization creation/reuse works
8. ✅ Redirect to dashboard works

## Remaining Potential Issues

If errors persist, check:
1. **DfE Environment Variables**: `DFE_SUPABASE_URL` and `DFE_SUPABASE_SERVICE_ROLE_KEY` must be set
2. **Supabase Auth**: User must be properly authenticated
3. **Database Permissions**: RLS policies may block organization creation
4. **Network**: Slow DfE queries may timeout (add timeout handling if needed)



