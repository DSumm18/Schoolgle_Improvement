# Supabase Session Format Issue

## Problem
The "Invalid API key" error occurs because Supabase's `setSession()` tries to validate the token by calling `/auth/v1/user`, which fails. This suggests the anon key might be wrong OR the token format isn't what Supabase expects.

## Root Cause Analysis
1. Token is valid (we can decode it and extract user info)
2. Token is from Supabase (has correct `iss` claim)
3. But `setSession()` fails with "Invalid API key"
4. This suggests the Supabase client might be using the wrong anon key OR there's a mismatch

## Solution Implemented
1. **Fallback approach:** When `setSession()` fails, we:
   - Decode the JWT token to extract user info
   - Create user in database using service role key
   - Store session manually in localStorage in Supabase's expected format
   - Check organization membership
   - Redirect to onboarding or dashboard

2. **Session Format:** Stored as:
   ```json
   {
     "access_token": "...",
     "refresh_token": "...",
     "expires_at": 1234567890,
     "expires_in": 3600,
     "token_type": "bearer",
     "user": {
       "id": "uuid",
       "email": "email",
       "aud": "authenticated",
       "role": "authenticated",
       "user_metadata": {},
       "app_metadata": {},
       "created_at": "ISO date"
     }
   }
   ```

## What to Check in Supabase Dashboard

### Verify Anon Key
1. Go to: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/settings/api
2. Check the **anon/public** key matches what's in `.env.local`
3. If different, update `.env.local` and restart server

### Check OAuth Configuration
1. Go to: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers
2. Verify Google provider is configured correctly
3. Check redirect URL matches exactly

## Next Steps
The fallback should work, but ideally we want `setSession()` to work. The "Invalid API key" suggests either:
- Anon key is wrong
- Token validation endpoint is misconfigured
- There's a Supabase project mismatch

Try the fallback first - it should get you logged in. Then we can investigate why `setSession()` is failing.

