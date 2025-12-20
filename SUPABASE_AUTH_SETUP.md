# Supabase Auth Setup Guide

## ✅ Migration Complete

**What Changed:**
- Replaced Firebase Auth with Supabase Auth
- New `SupabaseAuthContext` uses native Supabase authentication
- OAuth (Google/Microsoft) handled by Supabase
- JWT claims include `organization_id` for RLS

## 🔧 Required Setup in Supabase Dashboard

### Step 1: Enable OAuth Providers

1. Go to: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers

2. **Enable Google:**
   - Toggle "Google" to ON
   - Add your Google OAuth credentials:
     - Client ID (from Google Cloud Console)
     - Client Secret (from Google Cloud Console)
   - Set Redirect URL: `http://localhost:3000/auth/callback`

3. **Enable Microsoft (Azure):**
   - Toggle "Azure" to ON
   - Add your Azure AD credentials:
     - Client ID (Application ID)
     - Client Secret
     - Tenant ID (or use "common")
   - Set Redirect URL: `http://localhost:3000/auth/callback`

### Step 2: Configure Site URL

1. Go to: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/url-configuration

2. Set:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** 
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/dashboard`

### Step 3: Set Up JWT Claims (Optional but Recommended)

To automatically include `organization_id` in JWT:

1. Go to: Database → Functions
2. Create a function that sets `organization_id` in user metadata on signup
3. Or use Supabase Auth Hooks (Edge Functions)

**Quick Fix:** For now, the context fetches organization from `organization_members` table.

## 🧪 Testing

1. **Restart dev server** (to load new context)
2. **Navigate to** `/login`
3. **Click "Sign in with Google"** or "Sign in with Microsoft"
4. **Should redirect** to OAuth provider
5. **After auth**, redirects to `/auth/callback`
6. **Then redirects** to `/dashboard`

## ⚠️ Migration Notes

**Existing Users:**
- Firebase users need to be migrated to Supabase Auth
- Create a migration script to:
  1. Create Supabase user with same email
  2. Link to existing `users` table record
  3. Preserve organization memberships

**User ID Mapping:**
- Firebase UID → Supabase user.id (UUID)
- Update `organization_members.user_id` to use Supabase user IDs
- Update `users.id` to use Supabase user IDs

## 📋 Next Steps

1. Set up OAuth in Supabase Dashboard (see above)
2. Test login flow
3. Create user migration script (if needed)
4. Remove Firebase dependencies (optional cleanup)

