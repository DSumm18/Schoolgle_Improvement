# Simple Next Steps - What To Do Now

**You need to run 2 SQL files in Supabase. Here's exactly how:**

---

## Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Click on your project (the one you want to use)

---

## Step 2: Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New query"** button (top right)

---

## Step 3: Run First Migration File

### File: `supabase/migrations/20240101_security_core.sql`

**What to do:**
1. Open the file `supabase/migrations/20240101_security_core.sql` in your code editor
2. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
3. **Paste into the SQL Editor** in Supabase
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for it to complete (should say "Success")

**What this does:** Adds security policies to protect your data. Your existing data is safe!

---

## Step 4: Run Second Migration File

### File: `supabase/migrations/20240102_entitlements_and_safety.sql`

**What to do:**
1. Open the file `supabase/migrations/20240102_entitlements_and_safety.sql` in your code editor
2. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
3. **Paste into the SQL Editor** in Supabase
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for it to complete (should say "Success")

**What this does:** Adds module system and audit logging tables.

---

## Step 5: Verify It Worked

Run this SQL query in Supabase SQL Editor:

```sql
-- Check that security policies were created
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';
```

**Expected result:** Should show 100+ policies

---

## Step 6: Set Up Authentication (Important!)

You need to tell Supabase to include `organization_id` in user tokens.

### Option A: During User Signup (Easier)

When creating users, include organization_id:

```typescript
await supabase.auth.signUp({
  email: 'user@school.com',
  password: 'password',
  options: {
    data: {
      organization_id: 'your-org-uuid-here'
    }
  }
});
```

### Option B: Auth Hook (More Automatic)

1. Go to Supabase Dashboard → **Database** → **Functions**
2. Create a new function that sets `organization_id` in user metadata
3. (This is more advanced - Option A is simpler for now)

---

## That's It! ✅

After running these 2 SQL files, you have:
- ✅ Security policies protecting your data
- ✅ Module system ready to use
- ✅ Audit logging set up

---

## Quick Test (Optional)

To verify everything works, run this in Supabase SQL Editor:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('api_keys', 'tool_definitions', 'tool_audit_logs');
```

**Expected result:** Should show 3 rows (the new tables)

---

## File Locations

The SQL files you need are in your project:

1. **`supabase/migrations/20240101_security_core.sql`** - Run this first
2. **`supabase/migrations/20240102_entitlements_and_safety.sql`** - Run this second

Both files are in the `supabase/migrations/` folder in your project.

---

## Need Help?

- If you get errors, check that you copied the ENTIRE file
- Make sure you're running them in order (1st file, then 2nd file)
- Your existing data is safe - these migrations only ADD features

---

**Total time:** ~5 minutes  
**Difficulty:** Easy (just copy/paste SQL)

