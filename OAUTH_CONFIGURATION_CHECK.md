# OAuth Configuration Check - Action Items

## Immediate Checks Needed

### 1. Supabase Dashboard
**Location:** Authentication > URL Configuration

**Check:**
- [ ] Is PKCE enabled? (Should be ON)
- [ ] Site URL: `http://localhost:3000` (for dev)
- [ ] Redirect URLs includes: `http://localhost:3000/auth/callback`

**Location:** Authentication > Providers > Google

**Check:**
- [ ] Google provider is enabled
- [ ] Client ID matches Google Cloud Console
- [ ] Client Secret matches Google Cloud Console

### 2. Google Cloud Console
**Location:** APIs & Services > Credentials > OAuth 2.0 Client ID

**Check:**
- [ ] Authorized redirect URIs includes:
  - `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback`
  - (This is Supabase's callback, NOT your app's callback)

- [ ] Authorized JavaScript origins includes:
  - `http://localhost:3000` (dev)
  - `https://yourdomain.com` (prod)

### 3. Code Configuration
**File:** `apps/platform/src/context/SupabaseAuthContext.tsx`

**Current Code:**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});
```

**This is correct** - PKCE is the default.

## The Issue

When Google returns tokens in hash fragments (`#access_token=...`), it means:
1. **Either:** PKCE is disabled in Supabase
2. **Or:** Google redirect URI is wrong (pointing to your app instead of Supabase)

## The Fix

**Supabase handles OAuth, then redirects to your app.**

Flow:
1. User clicks "Sign in with Google"
2. Redirects to: `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/authorize?...`
3. Supabase redirects to Google
4. Google redirects back to: `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback`
5. Supabase processes OAuth, creates session
6. Supabase redirects to: `http://localhost:3000/auth/callback?code=...`
7. Your app exchanges code for session

**If you see `#access_token=...` instead of `?code=...`, the flow is broken.**

## Action Required

1. **Verify Google redirect URI** - Must be Supabase's callback URL
2. **Verify Supabase PKCE is enabled**
3. **Test the flow** - Should get `?code=...` not `#access_token=...`
4. **Remove workarounds** - Once PKCE works, clean up manual localStorage code

