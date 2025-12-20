# OAuth "Invalid API key" - Root Cause Analysis

## The Real Problem

**Symptom:** "Invalid API key" error when calling `supabase.auth.setSession()` with hash fragment tokens.

**Root Cause:** **Flow Mismatch** - Supabase is configured for **PKCE flow**, but Google OAuth is returning tokens in **hash fragments (Implicit flow)**.

## Why This Happens

1. **Supabase Default:** PKCE flow (secure, recommended)
   - Returns `?code=...` in query params
   - Client exchanges code for session server-side
   - No tokens in URL

2. **What's Actually Happening:** Implicit flow tokens
   - Returns `#access_token=...` in hash fragment
   - Tokens are in the URL (less secure)
   - `setSession()` fails because Supabase expects PKCE tokens

## The Fix (Production-Ready)

### Option 1: Force PKCE Flow (Recommended)

**In Supabase Dashboard:**
1. Go to Authentication > URL Configuration
2. Ensure "PKCE" is enabled
3. Set Site URL: `http://localhost:3000` (dev) / `https://yourdomain.com` (prod)
4. Add Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

**In Google Cloud Console:**
1. OAuth 2.0 Client ID > Authorized redirect URIs
2. Add: `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback`
   - This is Supabase's callback, NOT your app's callback
   - Supabase handles the OAuth, then redirects to your app

**In Code:**
```typescript
// Already correct - PKCE is default
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

### Option 2: Use Implicit Flow (Not Recommended for Production)

Only if PKCE can't be configured. Requires:
- Explicitly disabling PKCE in Supabase
- Accepting security trade-offs
- Manual session handling (what we're doing now)

## Production Deployment Checklist

### Supabase Settings (Required)
- [ ] PKCE enabled in Authentication settings
- [ ] Site URL set to production domain
- [ ] Redirect URLs include production callback URL
- [ ] Google OAuth provider configured with correct Client ID/Secret

### Google Cloud Console (Required)
- [ ] Authorized redirect URI: `https://[your-project].supabase.co/auth/v1/callback`
- [ ] Authorized JavaScript origins: Your production domain
- [ ] OAuth consent screen configured

### Environment Variables (Required)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key (server-only)

### Code Verification
- [ ] No hardcoded URLs
- [ ] All redirects use `window.location.origin`
- [ ] Session handling works without manual localStorage manipulation

## Current Workaround Issues

**What We're Doing Now:**
- Storing session manually in localStorage
- Bypassing Supabase's session validation
- Works locally but fragile

**Why It's Problematic:**
1. **Token Validation:** We're not validating tokens with Supabase
2. **Security:** Manual localStorage manipulation can be exploited
3. **Refresh Tokens:** May not work correctly
4. **Production:** Different domains, CORS, security headers

## Recommended Solution

**Fix the OAuth flow configuration** so PKCE works properly:

1. **Verify Supabase PKCE is enabled**
2. **Verify Google redirect URI matches Supabase callback**
3. **Remove manual localStorage workarounds**
4. **Use `exchangeCodeForSession()` for PKCE flow**
5. **Test in production-like environment**

## Testing Steps

1. Clear browser localStorage
2. Sign in with Google
3. Check URL: Should have `?code=...` NOT `#access_token=...`
4. Verify session is created automatically
5. Check Supabase Auth logs for errors

## Next Steps

1. Check Supabase Dashboard OAuth settings
2. Verify Google Cloud Console redirect URI
3. Test PKCE flow end-to-end
4. Remove workarounds once PKCE works
5. Document production deployment steps

