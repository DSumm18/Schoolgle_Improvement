# Fix Remaining Security Issues

**Date:** 2025-01-26  
**Status:** Ready to apply

---

## Issues Found

### 1. RLS Disabled on Reference Tables (6 tables)

These tables don't have RLS enabled:
- `ofsted_categories`
- `ofsted_subcategories`
- `evidence_requirements`
- `siams_strands`
- `siams_questions`
- `framework_updates`

**Why:** These are reference/lookup tables (not tenant-scoped), but RLS should still be enabled for security.

**Fix:** Run `supabase/migrations/20240104_fix_remaining_rls.sql`

---

### 2. Security Definer Views (8 views)

These views use `SECURITY DEFINER` which can be a security risk:
- `ks4_results`
- `exclusions`
- `ks2_results`
- `schools`
- `workforce`
- `ks1_results`
- `census`
- `attendance`

**What this means:** These views run with the creator's permissions, not the querying user's permissions. This can bypass RLS.

**Likely source:** These appear to be from DfE (Department for Education) data imports.

---

## Quick Fix

### Step 1: Enable RLS on Reference Tables

1. Open `supabase/migrations/20240104_fix_remaining_rls.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click "Run"

This will:
- Enable RLS on all 6 reference tables
- Create read-only policies (everyone can view, only service role can modify)

---

## Security Definer Views - What to Do

These views need individual review. Options:

### Option 1: Recreate Without SECURITY DEFINER (Recommended)

If the views don't need elevated permissions:

```sql
-- Example: Recreate a view without SECURITY DEFINER
CREATE OR REPLACE VIEW public.schools AS
SELECT * FROM dfe_data.schools;  -- Or whatever the source is
-- No SECURITY DEFINER = uses querying user's permissions
```

### Option 2: Add RLS to Underlying Tables

If the views need to stay as SECURITY DEFINER, ensure underlying tables have RLS:

```sql
-- Enable RLS on source tables
ALTER TABLE dfe_data.schools ENABLE ROW LEVEL SECURITY;
-- Create appropriate policies
```

### Option 3: Move to Separate Schema

Move DfE data views to a separate schema:

```sql
-- Create separate schema for DfE data
CREATE SCHEMA IF NOT EXISTS dfe_data;
-- Move views there (they won't be exposed via PostgREST by default)
```

### Option 4: Document and Accept Risk

If these views are read-only reference data and don't expose sensitive information, you can document why SECURITY DEFINER is acceptable.

---

## Priority

**High Priority (Fix Now):**
- ✅ RLS on reference tables - Run the migration

**Medium Priority (Review Soon):**
- ⚠️ Security Definer Views - Review each view individually

---

## After Running the Migration

Run this to verify:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'ofsted_categories',
    'ofsted_subcategories',
    'evidence_requirements',
    'siams_strands',
    'siams_questions',
    'framework_updates'
  );
```

**Expected:** All should show `rowsecurity = true`

---

## Security Definer Views - Investigation Needed

To see what these views do:

```sql
-- Get view definitions
SELECT 
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN (
    'ks4_results',
    'exclusions',
    'ks2_results',
    'schools',
    'workforce',
    'ks1_results',
    'census',
    'attendance'
  );
```

Then decide for each view:
1. Can it be recreated without SECURITY DEFINER?
2. Does it need RLS policies on underlying tables?
3. Should it be moved to a separate schema?

---

**Time to fix RLS issues:** ~2 minutes  
**Time to review views:** ~30 minutes (depends on complexity)

