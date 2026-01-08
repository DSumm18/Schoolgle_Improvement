# Onboarding Flow Test Checklist

## Server Status
✅ **Server is running at http://localhost:3000**

## Test Steps

### 1. Access Onboarding Flow
- [ ] Navigate to `http://localhost:3000/onboarding`
- [ ] Should redirect to `/onboarding/select-school` if logged in
- [ ] Should redirect to `/login` if not logged in

### 2. Select School Page (`/onboarding/select-school`)
**Visual Checks:**
- [ ] Page loads without errors
- [ ] Search input is visible and functional
- [ ] "Search" button is enabled/disabled correctly
- [ ] "Explore without linking a school" link is visible at bottom

**Functionality:**
- [ ] Search by school name (e.g., "St Mary's")
  - [ ] Results appear below search
  - [ ] Each result shows: school name, URN, town, postcode, phase, LA
  - [ ] Clicking a result navigates to confirm page
- [ ] Search by URN (e.g., "100000")
  - [ ] Returns exact match
  - [ ] Can select and proceed
- [ ] Search by town (e.g., "London")
  - [ ] Returns multiple results
  - [ ] Results are scrollable if many
- [ ] Error handling:
  - [ ] Search with < 2 characters shows error
  - [ ] Empty search shows error
  - [ ] API errors display user-friendly message

**Skip Path:**
- [ ] Click "Explore without linking a school"
- [ ] Navigates to `/onboarding/confirm-school?skip=true`

### 3. Confirm School Page (`/onboarding/confirm-school`)
**With School Selected:**
- [ ] School details display correctly:
  - [ ] School name
  - [ ] URN
  - [ ] Address (if available)
  - [ ] Phase
  - [ ] Local Authority
- [ ] "Back" button works (returns to select-school)
- [ ] "Confirm and continue" button works
- [ ] Loading state shows "Setting up..." when processing

**Skip Path:**
- [ ] Shows message about exploring without school
- [ ] "Continue without school" button works
- [ ] No "Back" button (correct)

**Error Handling:**
- [ ] If no school in sessionStorage, redirects to select-school
- [ ] API errors display in red error box
- [ ] Error doesn't block UI

### 4. Onboarding Complete API
**With School:**
- [ ] Creates organization if URN doesn't exist
- [ ] Reuses organization if URN already exists (no duplicates)
- [ ] Enriches organization with DfE data
- [ ] Creates organization_members record
- [ ] Sets user as admin (first user)
- [ ] Returns success response

**Without School (Skip):**
- [ ] No organization created
- [ ] Returns success response
- [ ] User can proceed

### 5. Redirect to Dashboard
- [ ] After successful completion, redirects to `/dashboard`
- [ ] Dashboard loads without errors
- [ ] Organization context is available (if school linked)
- [ ] Dashboard handles missing organization gracefully (if skipped)

## Common Issues to Check

### Browser Console
- [ ] No React errors
- [ ] No API errors (check Network tab)
- [ ] No hydration mismatches

### Network Requests
- [ ] `/api/school/search` returns 200 with school data
- [ ] `/api/onboarding/complete` returns 200 with success
- [ ] No CORS errors
- [ ] No 401/403 errors (auth working)

### Database Verification
After completing onboarding, check:
- [ ] Organization exists in `organizations` table (if school selected)
- [ ] Organization has correct URN
- [ ] Organization_members record exists
- [ ] User has correct role (admin for first user)
- [ ] No duplicate organizations for same URN

## Test Scenarios

### Scenario 1: New User, New School
1. Log in as new user
2. Search for school that doesn't exist in database
3. Select school and confirm
4. Verify: New organization created, user is admin

### Scenario 2: New User, Existing School
1. Log in as new user
2. Search for school that already exists (URN match)
3. Select school and confirm
4. Verify: Existing organization reused, user added as member

### Scenario 3: Skip School
1. Log in as new user
2. Click "Explore without linking a school"
3. Confirm skip
4. Verify: No organization created, user proceeds to dashboard

### Scenario 4: Multiple Users, Same School
1. User A completes onboarding for School X
2. User B completes onboarding for same School X (same URN)
3. Verify: Both users in same organization, no duplicate org created

## Known Issues Fixed
- ✅ `useSearchParams` wrapped in Suspense boundary
- ✅ Export default wrapper added to confirm-school page
- ✅ Server running and accessible

## Next Steps After Testing
1. Document any bugs found
2. Verify database constraints (URN uniqueness)
3. Test error scenarios (DfE lookup failures, network errors)
4. Verify dashboard handles missing organization gracefully



