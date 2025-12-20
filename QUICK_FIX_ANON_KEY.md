# Quick Fix: Add Supabase Anon Key

## The Problem
Error: `supabaseKey is required` in `OrgSwitcher.tsx`

## The Solution

**Add this line to `apps/platform/.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_from_supabase
```

## How to Get Your Anon Key

1. Open: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/settings/api
2. Find **"Project API keys"** section
3. Copy the **`anon` `public`** key (NOT the service_role key)
4. Paste it in `.env.local` after `NEXT_PUBLIC_SUPABASE_ANON_KEY=`

## Then Restart Server

```bash
# Stop server (Ctrl+C in terminal)
# Restart:
cd apps/platform
npm run dev
```

The error should disappear once the key is added and the server restarted.

