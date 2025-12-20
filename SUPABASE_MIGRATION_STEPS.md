# Supabase Migration Steps - Phase 2: Precision Teaching

## What You Need to Do

### Step 1: Run the Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Migration**
   - Open the file: `supabase/migrations/20240201_precision_teaching.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

### Step 2: Verify Tables Were Created

Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'students',
    'cohorts', 
    'research_strategies',
    'school_interventions',
    'pulse_checks'
  )
ORDER BY table_name;
```

**Expected**: 5 rows returned

### Step 3: Verify RLS is Enabled

Run this query to check RLS policies:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'students',
    'cohorts',
    'research_strategies', 
    'school_interventions',
    'pulse_checks'
  )
ORDER BY tablename, policyname;
```

**Expected**: Multiple policies (at least one per table)

### Step 4: Verify Tools Are Registered

Run this query to check tool definitions:

```sql
SELECT tool_key, tool_name, module_key, risk_level
FROM tool_definitions
WHERE tool_key IN (
  'search_research_strategies',
  'create_intervention',
  'analyze_cohort_impact'
)
ORDER BY tool_key;
```

**Expected**: 3 rows returned

### Step 5: Check Research Strategies Were Seeded

Run this query to see pre-seeded EEF strategies:

```sql
SELECT title, impact_months, evidence_strength, category
FROM research_strategies
WHERE is_active = true
ORDER BY evidence_strength DESC, impact_months_numeric DESC;
```

**Expected**: At least 6 rows (pre-seeded strategies)

---

## If You Get Errors

### Error: "relation already exists"
- **Cause**: Tables might already exist from a previous run
- **Fix**: The migration uses `create table if not exists`, so it should be safe. If you get errors, you may need to drop tables first (be careful in production!)

### Error: "function already exists"
- **Cause**: Helper functions might already exist
- **Fix**: The migration uses `create or replace function`, so it should update existing functions

### Error: "permission denied"
- **Cause**: Your user might not have permissions
- **Fix**: Make sure you're using the SQL Editor (which uses service role) or have admin permissions

---

## What the Migration Does

1. ✅ Creates 5 new tables (students, cohorts, research_strategies, school_interventions, pulse_checks)
2. ✅ Enables RLS on all tables
3. ✅ Creates RLS policies for tenant isolation
4. ✅ Seeds research_strategies with example EEF strategies
5. ✅ Creates helper functions (get_cohort_students, calculate_cohort_impact)
6. ✅ Registers 3 MCP tools in tool_definitions

---

## After Migration

Once the migration is complete:

1. **Test the Tools**: The MCP tools should now be available
2. **Create Test Data**: You can create cohorts and interventions via the tools
3. **Verify Access**: Make sure RLS is working (users can only see their organization's data)

---

## Quick Verification Script

Run this all-in-one verification:

```sql
-- Check tables
SELECT 'Tables' as check_type, count(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('students', 'cohorts', 'research_strategies', 'school_interventions', 'pulse_checks')

UNION ALL

-- Check RLS policies
SELECT 'RLS Policies' as check_type, count(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('students', 'cohorts', 'research_strategies', 'school_interventions', 'pulse_checks')

UNION ALL

-- Check tools
SELECT 'Tools Registered' as check_type, count(*) as count
FROM tool_definitions
WHERE tool_key IN ('search_research_strategies', 'create_intervention', 'analyze_cohort_impact')

UNION ALL

-- Check strategies
SELECT 'Research Strategies' as check_type, count(*) as count
FROM research_strategies
WHERE is_active = true;
```

**Expected Output**: 4 rows, all with count > 0

---

**That's it!** Once the migration runs successfully, Phase 2 is ready to use.

