# OAuth Callback Flow Explained

## How It Works

The OAuth flow has **two redirect URIs**:

1. **Google → Supabase:** `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback`
   - This is what you give to **Google Cloud Console**
   - Google redirects here after user authenticates

2. **Supabase → Your App:** `http://localhost:3000/auth/callback`
   - This is what you set in **Supabase Dashboard**
   - Supabase redirects here after processing the auth

## The Flow

```
User clicks "Sign in with Google"
    ↓
Your app redirects to Supabase OAuth
    ↓
Supabase redirects to Google
    ↓
User authenticates with Google
    ↓
Google redirects to: https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback
    ↓
Supabase processes the auth token
    ↓
Supabase redirects to: http://localhost:3000/auth/callback
    ↓
Your app receives the session
```

## What to Do

### In Google Cloud Console:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. In **Authorized redirect URIs**, add:
   - `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback`
   - (This is the Supabase callback URL)

### In Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers
2. Toggle Google ON
3. Add your Client ID and Secret
4. The **Redirect URL** field should show: `http://localhost:3000/auth/callback`
   - (This is where Supabase redirects after processing)

## Summary

✅ **Give to Google:** `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback`
✅ **Set in Supabase:** `http://localhost:3000/auth/callback` (auto-filled)

## Quick Links

- **Google Cloud Console (Credentials):** https://console.cloud.google.com/apis/credentials
- **Supabase Auth Providers:** https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers

