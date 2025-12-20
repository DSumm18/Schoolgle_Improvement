# Login Loop Fix - User Database Issue

## Problem Identified
The login loop was caused by:
1. **New users don't exist in database** - When a user signs in for the first time, they don't have records in `users` or `organization_members` tables
2. **`.single()` throws errors** - The callback was using `.single()` which throws an error when no record exists, potentially breaking the session setup
3. **Dashboard redirects authenticated users** - The dashboard was checking for organization, and if missing, might have been causing issues

## Fixes Applied

### 1. Callback Page (`apps/platform/src/app/auth/callback/page.tsx`)
- Changed `.single()` to `.maybeSingle()` when checking organization membership
- This gracefully handles users who don't have an organization yet
- Users without organizations are redirected to `/onboarding` instead of `/dashboard`

### 2. AuthContext (`apps/platform/src/context/SupabaseAuthContext.tsx`)
- Changed `.single()` to `.maybeSingle()` when fetching organization membership
- Added logging for users without organizations (this is OK - they'll see onboarding)
- Doesn't throw errors when user has no organization

### 3. Dashboard Layout (`apps/platform/src/app/dashboard/layout.tsx`)
- Updated redirect logic to not redirect authenticated users who just don't have an organization
- The callback handles the redirect to onboarding, not the dashboard

## Expected Flow Now

1. **User signs in with Google** → OAuth redirects to `/auth/callback`
2. **Callback creates user** in `users` table (if doesn't exist)
3. **Callback checks organization membership**:
   - If user has organization → Redirect to `/dashboard`
   - If user has NO organization → Redirect to `/onboarding`
4. **Onboarding page** shows list of organizations to join
5. **After joining** → Redirect to `/dashboard`

## Testing
- Try signing in again
- If you're a new user, you should see the onboarding page
- If you have an organization, you should go straight to dashboard
- Check console logs for: `[Auth Callback] User organization status:`

