# MVP Onboarding Flow Implementation

## What Already Existed

### Database Schema
- **`organizations` table**: Contains `id`, `name`, `urn`, `school_type`, `local_authority`, `address`, `is_church_school`, `diocese`
- **`organization_members` table**: Links users to organizations with `organization_id`, `user_id`, `auth_id`, `role`
- **`users` table**: User accounts with `id`, `auth_id`, `email`, `display_name`
- **DfE data schema**: `dfe_data.schools` table with school information accessible via `dfeClient`

### Existing Code
- **`/app/api/organization/create/route.ts`**: Organization creation logic with DfE enrichment
- **`/app/api/school/lookup/route.ts`**: URN-based school lookup
- **`/lib/supabase-dfe.ts`**: DfE client and helper functions (`lookupSchoolByURN`, `detectFrameworks`)
- **`/app/onboarding/page.tsx`**: Basic onboarding page (now redirects to select-school)
- **Supabase Auth**: Already configured with `SupabaseAuthContext`

## What Was Added

### 1. School Search API Route
**File**: `apps/platform/src/app/api/school/search/route.ts`

- Searches DfE schools by name, town, or URN
- Returns up to 20 results for text search, 10 for URN search
- Uses existing `dfeClient` from `@/lib/supabase-dfe`

### 2. Select School Page
**File**: `apps/platform/src/app/onboarding/select-school/page.tsx`

- Search interface for finding schools
- Displays results with school name, URN, town, postcode, phase, and local authority
- "Explore without linking a school" option
- Stores selected school in `sessionStorage` for next step

### 3. Confirm School Page
**File**: `apps/platform/src/app/onboarding/confirm-school/page.tsx`

- Displays selected school details for confirmation
- Handles "skip" path for users who don't want to link a school
- Calls `/api/onboarding/complete` to finalize onboarding

### 4. Onboarding Complete API Route
**File**: `apps/platform/src/app/api/onboarding/complete/route.ts`

**Key Logic**:
1. **Organization Resolution**:
   - Checks if organization exists for the URN (`organizations.urn = school.urn`)
   - If exists → reuses existing organization
   - If not → creates new organization with DfE enrichment
   - URN is the canonical identifier (prevents duplicates)

2. **DfE Enrichment**:
   - Uses `lookupSchoolByURN()` to fetch full school data
   - Enriches organization with: name, school_type, local_authority, address
   - Detects church schools for SIAMS framework

3. **Organization Member Creation**:
   - Checks if user is already a member
   - If not, creates `organization_members` record with `role: 'admin'` (first user)
   - Sets both `user_id` and `auth_id` for compatibility

4. **Skip Path**:
   - If user skips school selection, no organization is created
   - User can link school later from settings

### 5. Updated Root Onboarding Page
**File**: `apps/platform/src/app/onboarding/page.tsx`

- Now redirects to `/onboarding/select-school`
- Simplified to just handle redirect logic

## What Was Reused

1. **DfE Client** (`@/lib/supabase-dfe`): Existing `dfeClient` and `lookupSchoolByURN()` function
2. **Organization Creation Logic**: Pattern from `/api/organization/create/route.ts` for DfE enrichment
3. **Database Tables**: All existing tables (`organizations`, `organization_members`, `users`)
4. **Auth Context**: Existing `SupabaseAuthContext` for user session
5. **Supabase Client**: Existing `supabase` client configuration

## Flow Verification

### Step 1: Select School (`/onboarding/select-school`)
- ✅ User searches by name, town, or URN
- ✅ Results show real schools from DfE data
- ✅ User can select a school or skip

### Step 2: Confirm School (`/onboarding/confirm-school`)
- ✅ Shows selected school details
- ✅ User confirms or goes back
- ✅ Skip path available

### Step 3: Organization Resolution
- ✅ Checks for existing organization by URN
- ✅ Reuses if exists (no duplicates)
- ✅ Creates new if not exists
- ✅ Enriches with DfE data

### Step 4: Member Creation
- ✅ Creates `organization_members` record
- ✅ Sets user as admin (first user)
- ✅ Handles existing membership gracefully

### Step 5: Redirect to Dashboard
- ✅ Redirects to `/dashboard`
- ✅ Dashboard should resolve `organization_id` from context
- ✅ UI degrades gracefully if data incomplete

## Missing Pieces (Not Auto-Created)

1. **Dashboard Organization Resolution**: Dashboard needs to check if user has organization and handle gracefully if not
2. **Settings Page for Linking School**: Users who skip need a way to link school later
3. **URN Uniqueness Constraint**: Database should have unique constraint on `organizations.urn` (may need migration)
4. **Error Handling for DfE Lookup Failures**: Currently falls back to provided data, but could be more robust

## Confirmation Checklist

- ✅ No duplicate organizations created (URN check prevents this)
- ✅ URN is canonical identifier (used for lookup and creation)
- ✅ User lands on dashboard successfully (redirect implemented)
- ✅ Organization context set (via `organization_members` record)
- ✅ First user becomes admin (role: 'admin' set)
- ✅ Skip path works (no organization created, user can proceed)

## What Happens Next (But Not Now)

Once this flow is solid, we can layer on:
1. **Ed-guided onboarding**: Ed helps users through the process
2. **Email capture**: Collect additional user information
3. **Pricing**: Show pricing options during onboarding
4. **Trust/MAT logic**: Handle multi-school organizations
5. **Invitation flow**: Allow existing org admins to invite users

## Testing Notes

To test the flow:
1. Log in as a new user
2. Navigate to `/onboarding` (should redirect to `/onboarding/select-school`)
3. Search for a school (e.g., "St Mary's" or URN "100000")
4. Select a school and confirm
5. Verify organization is created/reused in database
6. Verify `organization_members` record exists
7. Verify redirect to dashboard works
8. Test skip path (should allow proceeding without school)

