# Where to Set Up Google Login in Supabase

## Direct Link
**Go to:** https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers

## Step-by-Step Navigation

### Option 1: Direct Link (Fastest)
1. Click this link: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers
2. You'll see a list of OAuth providers
3. Find **"Google"** in the list
4. Toggle it **ON**

### Option 2: Manual Navigation
1. Go to: https://supabase.com/dashboard
2. Select your project: **ygquvauptwyvlhkyxkwy**
3. In the left sidebar, click: **Authentication**
4. Click: **Providers** (under Authentication)
5. Find **"Google"** in the list
6. Toggle it **ON**

## What You'll See

Once you toggle Google ON, you'll see fields for:
- **Client ID** (paste your Google Client ID here)
- **Client Secret** (paste your Google Client Secret here)
- **Redirect URL** (should auto-fill: `http://localhost:3000/auth/callback`)

## After Adding Credentials

1. Paste your **Client ID** from Google Cloud Console
2. Paste your **Client Secret** from Google Cloud Console
3. Verify the **Redirect URL** is: `http://localhost:3000/auth/callback`
4. Click **"Save"** at the bottom

## Visual Guide

The page will look like this:
```
┌─────────────────────────────────────┐
│ Authentication → Providers          │
├─────────────────────────────────────┤
│                                     │
│  Google          [Toggle: ON]      │
│  ├─ Client ID:   [paste here]      │
│  ├─ Client Secret: [paste here]     │
│  └─ Redirect URL: [auto-filled]    │
│                                     │
│  [Save]                             │
└─────────────────────────────────────┘
```

## Quick Links

- **Supabase Auth Providers:** https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **Get Google Credentials:** See `GOOGLE_OAUTH_SETUP.md`

