# OAuth User Setup - How It Works

## Current Flow

1. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth
   - User authenticates with Google
   - Google redirects to Supabase

2. **Supabase processes OAuth**
   - Creates/updates user in Supabase Auth (automatic)
   - Returns tokens in hash fragment or query param
   - Redirects to your callback: `/auth/callback#access_token=...`

3. **Your callback receives tokens**
   - Tries to set session with tokens
   - **ERROR HERE:** "Invalid API key" - this is BEFORE user creation

4. **If session succeeds:**
   - Creates user record in `users` table
   - Checks for organization membership
   - Redirects to dashboard or onboarding

## The Problem

The "Invalid API key" error happens when trying to **set the session**, which is BEFORE we even check if the user exists in the database. This suggests:

1. **The tokens from Supabase might be invalid/expired**
2. **The Supabase client configuration might be wrong**
3. **The anon key might not match the project**

## User Database Setup

**Good news:** You DON'T need to pre-create users in the database!

- Supabase Auth automatically creates users when they first sign in
- Your callback code then syncs them to the `users` table
- The error is happening BEFORE this sync step

## What We Need to Fix

The issue is likely that:
- The tokens in the hash fragment are from Supabase's OAuth flow
- When we call `setSession()`, Supabase validates the tokens
- The validation is failing with "Invalid API key"

This could mean the tokens are meant for a different Supabase project, or they're in a format we're not handling correctly.

