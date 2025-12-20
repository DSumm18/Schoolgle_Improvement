# Fix: Supabase OAuth Using Hash Fragment Instead of Code

## Problem

Supabase is returning tokens in hash fragments (`#access_token=...`) instead of query parameters (`?code=...`). This happens when:
- PKCE flow is not properly configured
- Supabase falls back to implicit flow

## Solution Applied

Updated the callback page to handle **both** flows:
1. **PKCE Flow** (preferred): `?code=...` → Exchange code for session
2. **Implicit Flow** (fallback): `#access_token=...` → Get session from URL

## Additional Fix Needed in Supabase Dashboard

To ensure PKCE flow is used (more secure), check these settings:

### 1. Check OAuth Provider Settings
- Go to: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers
- Click on **Google** provider
- Ensure **"Use PKCE"** is enabled (should be default)

### 2. Check URL Configuration
- Go to: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/url-configuration
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** 
  - `http://localhost:3000/auth/callback`
  - Make sure this is **exactly** matching (no trailing slashes)

### 3. Verify Google Cloud Console
- Go to: https://console.cloud.google.com/apis/credentials
- Edit your OAuth 2.0 Client ID
- **Authorized redirect URIs** should include:
  - `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback`
  - (This is the Supabase callback, not your app's callback)

## Current Status

✅ **Code Updated:** Callback now handles both hash fragments and query parameters
✅ **Session Detection:** Uses `detectSessionInUrl: true` to automatically parse hash fragments
✅ **Fallback:** If no code, tries to get existing session

## Testing

1. Sign in with Google again
2. Should work with either flow now
3. Check browser console for any errors
4. Session should persist after redirect

