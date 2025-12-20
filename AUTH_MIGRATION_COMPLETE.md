# ✅ Auth Migration: Firebase → Supabase

## What Was Changed

### 1. New Supabase Auth Context
- **File:** `apps/platform/src/context/SupabaseAuthContext.tsx`
- Replaces Firebase Auth with native Supabase Auth
- Supports Google & Microsoft OAuth via Supabase
- Automatically fetches organization from `organization_members` table
- Extracts `organization_id` from JWT claims (when available)

### 2. OAuth Callback Handler
- **File:** `apps/platform/src/app/auth/callback/route.ts`
- Handles OAuth redirect from Google/Microsoft
- Exchanges code for session
- Redirects to dashboard on success

### 3. Updated Components
- ✅ `apps/platform/src/app/layout.tsx` - Uses `SupabaseAuthProvider`
- ✅ `apps/platform/src/app/login/page.tsx` - Uses new auth context
- ✅ `apps/platform/src/app/dashboard/layout.tsx` - Uses `user.id` (not `user.uid`)
- ✅ `apps/platform/src/app/dashboard/page.tsx` - Uses new auth context
- ✅ `apps/platform/src/components/LoginButton.tsx` - Uses Supabase OAuth
- ✅ `apps/platform/src/components/MicrosoftLoginButton.tsx` - Uses Supabase OAuth

## Key Differences: Firebase vs Supabase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| User ID | `user.uid` | `user.id` |
| Display Name | `user.displayName` | `user.user_metadata.full_name` |
| Email | `user.email` | `user.email` (same) |
| Auth State | `onAuthStateChanged` | `onAuthStateChange` |
| OAuth | `signInWithPopup` | `signInWithOAuth` (redirect) |

## ⚠️ Required Setup in Supabase Dashboard

**Before testing, you MUST configure OAuth providers:**

1. **Go to:** https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers

2. **Enable Google:**
   - Toggle "Google" ON
   - Add Client ID & Secret (from Google Cloud Console)
   - Redirect URL: `http://localhost:3000/auth/callback`

3. **Enable Microsoft (Azure):**
   - Toggle "Azure" ON
   - Add Client ID, Secret, Tenant ID
   - Redirect URL: `http://localhost:3000/auth/callback`

4. **Set Site URL:**
   - Go to: Auth → URL Configuration
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

## 🧪 Testing Steps

1. **Restart dev server** (to load new context)
2. Navigate to `/login`
3. Click "Sign in with Google" or "Sign in with Microsoft"
4. Should redirect to OAuth provider
5. After auth, redirects to `/auth/callback`
6. Then redirects to `/dashboard`

## 🔄 User Migration (If Needed)

If you have existing Firebase users, create a migration script:

```sql
-- Example: Create Supabase user and link to existing data
-- This would be done via Supabase Admin API or migration script
```

**Migration Strategy:**
1. Create Supabase user with same email
2. Update `users.id` to match Supabase `user.id`
3. Update `organization_members.user_id` to match Supabase `user.id`
4. Preserve all organization memberships

## 📋 Next Steps

1. ✅ Code migration complete
2. ⏳ Configure OAuth in Supabase Dashboard
3. ⏳ Test login flow
4. ⏳ Migrate existing users (if needed)
5. ⏳ Remove Firebase dependencies (optional cleanup)

## 🐛 Troubleshooting

**"OAuth provider not configured"**
→ Enable Google/Azure in Supabase Dashboard

**"Redirect URI mismatch"**
→ Check redirect URLs in Supabase Dashboard match exactly

**"User not found in organization_members"**
→ User needs to be added to an organization first

**"RLS policy violation"**
→ Ensure `organization_id` is set in JWT claims or user is in `organization_members`

