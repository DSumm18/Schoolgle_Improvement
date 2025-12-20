# 🔴 CRITICAL: "Invalid API key" Error - Root Cause & Fix

## The Problem

The error "Invalid API key" when calling `setSession()` suggests the **anon key in your `.env.local` doesn't match the one in Supabase Dashboard**.

## Immediate Action Required

### Step 1: Get the Correct Anon Key from Supabase

1. Go to: **https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/settings/api**
2. Scroll to **"Project API keys"**
3. Copy the **anon/public** key (starts with `eyJhbGci...`)

### Step 2: Update `.env.local`

1. Open: `apps/platform/.env.local`
2. Find: `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
3. Replace with the key from Supabase Dashboard
4. **Save the file**

### Step 3: Restart Dev Server

The server needs to restart to load the new environment variable.

## Why This Happens

- Supabase generates a new anon key if you reset API keys
- The key in `.env.local` might be from an old project or different environment
- When `setSession()` tries to validate the token, it uses the anon key
- If the key is wrong, you get "Invalid API key"

## Fallback Status

The fallback code (manual session storage) should work even with the wrong key, but:
- It won't work properly with Supabase's auth system
- The AuthContext might not recognize the manually stored session
- You'll have issues on page refresh

## Verification

After updating the key, test again. You should see:
- ✅ "Session successfully set" (instead of fallback)
- ✅ No "Invalid API key" errors
- ✅ Proper session persistence

## Quick Check

Run this to see your current anon key:
```powershell
cd apps/platform
Get-Content .env.local | Select-String "NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Compare the first 20 characters with the one in Supabase Dashboard - they should match exactly.

