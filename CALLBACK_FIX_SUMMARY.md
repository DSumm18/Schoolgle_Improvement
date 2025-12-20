# Callback Session Fix

## Problem
When Supabase returns tokens in hash fragments (`#access_token=...`), the callback was calling `getSession()` immediately, but Supabase needs time to process the hash and set the session.

## Solution
Added retry logic that:
1. Checks for session immediately
2. If not found, waits 300ms and retries
3. Retries up to 10 times (3 seconds total)
4. This gives Supabase time to process the hash fragment

## How It Works
- `detectSessionInUrl: true` tells Supabase to automatically parse hash fragments
- But this happens asynchronously
- The retry loop waits for Supabase to finish processing
- Once session is found, continues with user creation and redirect

## Test
Try signing in with Google again - it should now wait for the session to be set before proceeding.

