# Troubleshooting: Tables Not Found

**Issue:** Verification query returns "No rows returned" for reference tables.

---

## Possible Causes

1. **Tables don't exist yet** - You haven't run the main schema file
2. **Tables in different schema** - They might be in a different schema
3. **Tables were dropped** - They might have been removed

---

## Diagnostic Steps

### Step 1: Check if tables exist anywhere

Run this in Supabase SQL Editor:

```sql
-- Check all schemas
SELECT 
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_name IN (
  'ofsted_categories',
  'ofsted_subcategories',
  'evidence_requirements',
  'siams_strands',
  'siams_questions',
  'framework_updates'
)
ORDER BY table_schema, table_name;
```

**If this returns rows:** Tables exist, just check which schema.

**If this returns no rows:** Tables don't exist yet.

---

### Step 2: Check what tables you DO have

```sql
-- List all tables in public schema
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

This will show you what tables actually exist.

---

## Solutions

### Solution 1: Tables Don't Exist Yet

If the tables don't exist, you need to create them first:

1. **Option A:** Run your main schema file (`supabase_schema.sql`)
2. **Option B:** Create just these reference tables

The migration `20240104_fix_remaining_rls.sql` is now updated to handle missing tables gracefully - it will skip tables that don't exist.

---

### Solution 2: Tables in Different Schema

If tables exist but in a different schema (e.g., `dfe_data`), you have two options:

**Option A:** Move them to public schema
```sql
ALTER TABLE dfe_data.ofsted_categories SET SCHEMA public;
```

**Option B:** Enable RLS in their current schema
```sql
ALTER TABLE dfe_data.ofsted_categories ENABLE ROW LEVEL SECURITY;
```

---

### Solution 3: Tables Were Dropped

If tables were accidentally dropped, recreate them from your schema file or restore from backup.

---

## Updated Migration

The migration `20240104_fix_remaining_rls.sql` is now **safe to run** even if tables don't exist - it will:
- Check if each table exists before trying to enable RLS
- Skip tables that don't exist
- Only create policies for tables that exist

**You can run it now** - it won't error if tables are missing.

---

## Next Steps

1. **Run the diagnostic query** above to see what exists
2. **If tables don't exist:** Create them from your schema file
3. **Run the migration** - it's now safe even if tables are missing
4. **Verify** after creating tables

---

**The migration is now safe to run regardless of table state!**

