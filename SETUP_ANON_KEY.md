# Setup: Add Supabase Anon Key

## Issue
The dashboard is showing: `supabaseKey is required` because `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing from `.env.local`.

## Solution

### Step 1: Get Your Anon Key from Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy
2. Click **Settings** (gear icon) in the left sidebar
3. Click **API** in the settings menu
4. Under **Project API keys**, find the **`anon` `public`** key
5. Copy the key (it starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 2: Add to .env.local

Add this line to `apps/platform/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** 
- The anon key is **different** from the service role key
- The anon key is safe to use in client-side code (RLS protects your data)
- Never commit the service role key to client-side code

### Step 3: Restart Dev Server

After adding the key, restart your Next.js dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Why This Key?

The anon key is needed for:
- `OrgSwitcher` component (to fetch accessible organizations)
- `DashboardPage` (to fetch risk profile data)
- `InterventionTimeline` (to fetch intervention data)

All queries use Row Level Security (RLS), so the anon key is safe for client-side use.

