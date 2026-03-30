# Running Sim Studio Database Migrations

## Option 1: Using Supabase Dashboard (Recommended)

### Step 1: Get your Supabase credentials
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → Database
4. Copy your:
   - **Connection string** (URI format)
   - Or individual credentials (host, port, database, user, password)

### Step 2: Run migrations via SQL Editor

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of:
   - `supabase/migrations/20260220_sim_studio_core.sql`
   - Then `supabase/migrations/20260220_sim_studio_themes.sql`
4. Click **Run** for each file

### Step 3: Verify tables created

Run this query to verify:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'sim_%'
OR table_name LIKE 'quest_%'
OR table_name LIKE 'theme_%'
OR table_name LIKE 'pupil_%'
OR table_name = 'scheme_packs'
OR table_name = 'teacher_judgements'
OR table_name = 'moderation_samples'
OR table_name = 'skill_snapshots'
OR table_name = 'sim_studio_timeline_events';
```

Expected tables (11 total):
- sim_blueprints
- sim_packages
- sim_versions
- scheme_packs
- theme_packs
- quest_defs
- quest_runs
- pupil_profiles
- teacher_judgements
- moderation_samples
- skill_snapshots
- sim_studio_timeline_events

---

## Option 2: Using psql (Command Line)

### Step 1: Install psql if not installed
- Windows: Download from https://www.postgresql.org/download/windows/
- Or use Git Bash with psql included

### Step 2: Get connection string
From Supabase Dashboard → Settings → Database → Connection String

### Step 3: Run migrations

```bash
# Navigate to your project
cd ~/Schoolgle_Improvement

# Run core schema
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20260220_sim_studio_core.sql

# Run theme schema
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20260220_sim_studio_themes.sql
```

Replace:
- `[YOUR-PASSWORD]` with your database password
- `[YOUR-PROJECT-REF]` with your Supabase project reference

---

## Option 3: Using Supabase CLI (If you want to install it)

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Link to your project
```bash
cd ~/Schoolgle_Improvement
supabase link --project-ref [YOUR-PROJECT-REF]
```

### Step 3: Push migrations
```bash
supabase db push
```

---

## Verification Queries

### Check theme packs are seeded:
```sql
SELECT id, name, is_active FROM theme_packs;
```
Expected: 3 rows (classic, space_explorer, forest_adventure)

### Check scheme packs are seeded:
```sql
SELECT id, name, is_active FROM scheme_packs;
```
Expected: 3 rows (whiterose_maths, power_maths, mnp_maths)

### Check RLS policies are enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'sim_%'
OR tablename LIKE 'quest_%'
OR tablename = 'pupil_profiles';
```
Expected: All tables should have `rowsecurity = true`

---

## Troubleshooting

### Error: "relation already exists"
This means tables already exist. You can either:
1. Drop existing tables (CAUTION: deletes data):
```sql
DROP TABLE IF EXISTS sim_studio_timeline_events CASCADE;
DROP TABLE IF EXISTS skill_snapshots CASCADE;
DROP TABLE IF EXISTS moderation_samples CASCADE;
DROP TABLE IF EXISTS teacher_judgements CASCADE;
DROP TABLE IF EXISTS pupil_profiles CASCADE;
DROP TABLE IF EXISTS quest_runs CASCADE;
DROP TABLE IF EXISTS quest_defs CASCADE;
DROP TABLE IF EXISTS theme_packs CASCADE;
DROP TABLE IF EXISTS scheme_packs CASCADE;
DROP TABLE IF EXISTS sim_versions CASCADE;
DROP TABLE IF EXISTS sim_packages CASCADE;
DROP TABLE IF EXISTS sim_blueprints CASCADE;
```
2. Or skip the migration if tables already exist

### Error: "permission denied"
Make sure you're connecting as the database owner (postgres user)

### Error: "function does not exist"
Run migrations in order:
1. 20260220_sim_studio_core.sql (first)
2. 20260220_sim_studio_themes.sql (second)

---

## Next Steps After Migration

1. **Update your environment variables** (if not already set):
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

2. **Test the connection** in your app:
```bash
cd apps/platform
npm run dev
```

3. **Navigate to Sim Studio**:
http://localhost:3000/sim-studio

4. **Verify data is loading**:
- Check browser console for any errors
- Verify theme packs and scheme packs are accessible
- Try creating a test pupil profile

---

## Rollback (If Needed)

If you need to remove Sim Studio tables:
```sql
DROP SCHEMA IF EXISTS sim_studio CASCADE;
```

Or individually:
```sql
DROP TABLE IF EXISTS sim_studio_timeline_events CASCADE;
DROP TABLE IF EXISTS skill_snapshots CASCADE;
DROP TABLE IF EXISTS moderation_samples CASCADE;
DROP TABLE IF EXISTS teacher_judgements CASCADE;
DROP TABLE IF EXISTS pupil_profiles CASCADE;
DROP TABLE IF EXISTS quest_runs CASCADE;
DROP TABLE IF EXISTS quest_defs CASCADE;
DROP TABLE IF EXISTS theme_packs CASCADE;
DROP TABLE IF EXISTS scheme_packs CASCADE;
DROP TABLE IF EXISTS sim_versions CASCADE;
DROP TABLE IF EXISTS sim_packages CASCADE;
DROP TABLE IF EXISTS sim_blueprints CASCADE;
```
