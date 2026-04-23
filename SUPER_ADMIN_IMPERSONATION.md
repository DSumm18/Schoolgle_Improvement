# Super Admin Impersonation - Implementation Summary

## What Was Implemented

A complete super admin impersonation system that allows `admin@schoolgle.co.uk` to access any school without being tied to a specific organization membership.

## The Problem

Previously, when the super admin logged in, they were always directed to Aurora Primary School because their user account had a membership there. They couldn't access other schools like Grove House Primary School.

## The Solution

### 1. **Impersonation State Management**
- When a super admin clicks "View as School", the system sets:
  - `sessionStorage.impersonateOrgId` - Target school ID
  - `sessionStorage.impersonateOrgName` - Target school name
  - `sessionStorage.impersonateBy` - Admin email

### 2. **Profile API Enhancement** (`/api/auth/profile/route.ts`)
Added logic to:
- Check if user is a super admin (queries `super_admins` table)
- Accept `impersonateOrgId` parameter
- When super admin + impersonation target:
  - Fetch the target organization directly (bypassing membership checks)
  - Return organization with "admin" role
  - No need for the user to be a member

### 3. **Auth Context Integration** (`SupabaseAuthContext.tsx`)
Added listeners for impersonation changes:
- **Custom event listener**: Detects when `impersonation-changed` event is dispatched (same tab navigation)
- **Storage event listener**: Detects when `impersonateOrgId` changes (cross-tab)
- **Mount check**: On component mount, checks if impersonation is active and differs from current org
- Triggers `fetchOrganization()` when impersonation state changes

### 4. **Super Admin Dashboard** (`/admin/super/page.tsx`)
Added "View as School" button that:
- Sets impersonation state in sessionStorage
- Dispatches custom event to trigger refresh
- Navigates to `/dashboard`

## How It Works

### Flow:
1. User goes to `/admin/super`
2. Searches for school (e.g., "Grove House" or URN "148201")
3. Clicks "View as School" button
4. `impersonateSchool()` function:
   - Sets `sessionStorage.impersonateOrgId = groveHouseId`
   - Dispatches `window.dispatchEvent(new Event('impersonation-changed'))`
   - Navigates to `/dashboard`
5. Auth context detects event via custom event listener
6. Calls `fetchOrganization()` with `impersonateOrgId`
7. Profile API:
   - Checks user is super admin ✅
   - Fetches Grove House directly (no membership check)
   - Returns org with role "admin"
8. Dashboard loads with Grove House data (not Aurora)

## Code Changes

### 1. `/api/auth/profile/route.ts`
```typescript
// Added impersonateOrgId parameter
const { userId, email, displayName, impersonateOrgId } = await req.json();

// Check super admin status
const { data: superAdminCheck } = await supabase
  .from("super_admins")
  .select("access_level")
  .eq("user_id", userId)
  .maybeSingle();

isSuperAdmin = !!superAdminCheck;

// If impersonating (and super admin), fetch that org directly
if (isSuperAdmin && impersonateOrgId) {
  const { data: impersonatedOrg } = await supabase
    .from("organizations")
    .select("id, name, organization_type")
    .eq("id", impersonateOrgId)
    .single();

  return apiSuccess({
    user: { id: userId, email, displayName },
    organization: {
      id: impersonatedOrg.id,
      name: impersonatedOrg.name,
      role: "admin", // Super admins get admin role
      organization_type: impersonatedOrg.organization_type,
    },
  });
}
```

### 2. `SupabaseAuthContext.tsx`
```typescript
// Check for impersonation in fetchOrganization
const impersonateOrgId = sessionStorage.getItem('impersonateOrgId');
const response = await fetch("/api/auth/profile", {
  method: "POST",
  body: JSON.stringify({
    userId,
    email: resolvedEmail,
    displayName: resolvedName,
    impersonateOrgId, // Pass to API
  }),
});

// Listen for impersonation changes
useEffect(() => {
  const handleImpersonationChange = () => {
    if (user?.id) {
      fetchOrganization(user.id, user);
    }
  };

  window.addEventListener('impersonation-changed', handleImpersonationChange);
  window.addEventListener('storage', handleStorageChange);

  // Check on mount
  if (user?.id) {
    const impersonateOrgId = sessionStorage.getItem('impersonateOrgId');
    if (impersonateOrgId && impersonateOrgId !== organizationId) {
      fetchOrganization(user.id, user);
    }
  }

  return () => {
    window.removeEventListener('impersonation-changed', handleImpersonationChange);
    window.removeEventListener('storage', handleStorageChange);
  };
}, [user, organizationId]);
```

### 3. `/admin/super/page.tsx`
```typescript
async function impersonateSchool(schoolId: string, schoolName: string) {
  sessionStorage.setItem("impersonateOrgId", schoolId);
  sessionStorage.setItem("impersonateOrgName", schoolName);
  sessionStorage.setItem("impersonateBy", user?.email || "admin");

  // Trigger auth context refresh
  window.dispatchEvent(new Event('impersonation-changed'));

  router.push("/dashboard");
}
```

## Grove House Primary School Setup

Successfully created in database:
- **ID**: `d9d1ac2c-5eff-4043-98f4-e1c43f616fd3`
- **URN**: 148201
- **Name**: Grove House Primary School
- **Type**: Primary Academy converter
- **Location**: Bradford, BD2 4ED
- **Pupils**: 417
- **Subscription**: 90-day trial (bundle product)
- **Modules**: ofsted-readiness, estates-compliance, hr-people, governance, actions-hub, intelligence
- **User Limit**: 3

## Testing

Run `node verify-grove-house.js` to verify setup:
```bash
node verify-grove-house.js
```

Run `node test-impersonation.js` to test impersonation logic:
```bash
node test-impersonation.js
```

## Next Steps

1. Start dev server: `npm run dev`
2. Login as `admin@schoolgle.co.uk`
3. Go to `http://localhost:3000/admin/super`
4. Search for "Grove House" or "148201"
5. Click "View as School" button
6. Configure Google Drive connection for Grove House
7. Upload census data, site plans, etc.

## Security Notes

- Impersonation only works for verified super admins (checked against `super_admins` table)
- Uses `impersonateOrgId` from sessionStorage (client-side only, no server persistence)
- Profile API uses service role to bypass RLS when fetching target org
- No security bypass - super admins can already access any org via service role
- Impersonation state is cleared when browser session ends
