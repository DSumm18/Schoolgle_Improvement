# Migration Order - IMPORTANT!

**You must run migrations in this order:**

---

## Step 1: Run Security Core Migration (First)

**File:** `supabase/migrations/20240101_security_core.sql`

**What it does:**
- Enables RLS on all tables
- Creates `is_organization_member()` function
- Creates `get_user_organization_ids()` function
- Creates RLS policies for all tables

**Status:** ✅ This should work now (we fixed the errors)

---

## Step 2: Run Entitlements & Safety Migration (Second)

**File:** `supabase/migrations/20240102_entitlements_and_safety.sql`

**What it does:**
- Creates `api_keys` table
- Creates/updates `modules` table
- Creates `organization_modules` table
- Creates `tool_definitions` table
- Creates `tool_audit_logs` table
- Creates `organization_has_module()` function
- Creates `get_available_tools()` function

**Status:** ⚠️ Run this BEFORE the security fix migration

---

## Step 3: Run Security Fix Migration (Third)

**File:** `supabase/migrations/20240103_fix_security_issues.sql`

**What it does:**
- Fixes security warnings (adds `set search_path = ''` to functions)
- Updates all functions from previous migrations with security fixes

**Status:** ✅ Now handles missing tables gracefully

---

## Current Error

You're getting: `relation "public.tool_definitions" does not exist`

**Reason:** You're trying to run Step 3 before Step 2.

**Solution:** Run `20240102_entitlements_and_safety.sql` FIRST, then run `20240103_fix_security_issues.sql`.

---

## Correct Order

1. ✅ `20240101_security_core.sql` - Run this first
2. ✅ `20240102_entitlements_and_safety.sql` - Run this second
3. ✅ `20240103_fix_security_issues.sql` - Run this third

---

## Quick Fix

**Right now, do this:**

1. Open `supabase/migrations/20240102_entitlements_and_safety.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. **Then** run `20240103_fix_security_issues.sql`

The security fix migration will now work because the tables will exist!

