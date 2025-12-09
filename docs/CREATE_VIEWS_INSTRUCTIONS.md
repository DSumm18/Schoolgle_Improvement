# Create DfE Views - Quick Instructions

## 🚀 Quick Setup (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: **https://app.supabase.com/project/ygquvauptwyvlhkyxkwy**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Copy & Paste SQL

Copy the entire contents of `RUN_THIS_SQL.sql` (or `supabase/create-dfe-views.sql`) and paste into the SQL Editor.

### Step 3: Run SQL

Click the **"Run"** button (or press `Ctrl+Enter`)

### Step 4: Verify

You should see: ✅ "Success. No rows returned"

---

## ✅ Verification

After running the SQL, test the connection:

```bash
node scripts/test-dfe-connection-simple.mjs
```

You should see:
- ✅ Found schools count
- ✅ Sample schools listed
- ✅ Connection successful

---

## 📋 What the SQL Does

Creates 4 views in the `public` schema:
1. `public.schools` → Points to `dfe_data.schools`
2. `public.area_demographics` → Points to `dfe_data.area_demographics`
3. `public.local_authority_finance` → Points to `dfe_data.local_authority_finance`
4. `public.school_area_links` → Points to `dfe_data.school_area_links`

Grants permissions so the Supabase client can access them.

---

## 🔗 Direct Link

**SQL Editor:** https://app.supabase.com/project/ygquvauptwyvlhkyxkwy/sql/new

**SQL File:** `RUN_THIS_SQL.sql` (in project root)

---

**That's it!** Once views are created, the DfE data will be accessible via the Supabase client. 🎯

