# How to Get Google OAuth Credentials

## Step-by-Step Guide

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 2. Create or Select a Project
- Click the project dropdown at the top
- Click "New Project" (or select existing)
- Name it: "Schoolgle" (or your preferred name)
- Click "Create"

### 3. Enable Google+ API
- Go to: **APIs & Services** → **Library**
- Search for: "Google+ API" or "Google Identity"
- Click on it and click **"Enable"**

### 4. Create OAuth Credentials
- Go to: **APIs & Services** → **Credentials**
- Click **"+ CREATE CREDENTIALS"** at the top
- Select **"OAuth client ID"**

### 5. Configure OAuth Consent Screen (First Time Only)
If prompted, you'll need to configure the consent screen:
- **User Type:** External (or Internal if using Google Workspace)
- Click **"Create"**
- **App name:** "Schoolgle"
- **User support email:** Your email
- **Developer contact:** Your email
- Click **"Save and Continue"**
- **Scopes:** Click "Save and Continue" (default is fine)
- **Test users:** Add your email, click "Save and Continue"
- **Summary:** Click "Back to Dashboard"

### 6. Create OAuth Client ID
- **Application type:** Web application
- **Name:** "Schoolgle Local Dev" (or any name)
- **Authorized JavaScript origins:**
  - Add: `http://localhost:3000`
- **Authorized redirect URIs:**
  - Add: `http://localhost:3000/auth/callback`
- Click **"Create"**

### 7. Copy Your Credentials
- A popup will show:
  - **Client ID** (long string ending in `.apps.googleusercontent.com`)
  - **Client Secret** (shorter string)
- **Copy both** - you'll need them in Supabase!

### 8. Add to Supabase
- Go to: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers
- Toggle **"Google"** ON
- Paste:
  - **Client ID** → Client ID field
  - **Client Secret** → Client Secret field
- **Redirect URL** should already be set to: `http://localhost:3000/auth/callback`
- Click **"Save"**

## Quick Links

- **Google Cloud Console:** https://console.cloud.google.com/
- **Credentials Page:** https://console.cloud.google.com/apis/credentials
- **Supabase Auth Providers:** https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers

## Troubleshooting

**"Redirect URI mismatch" error:**
- Make sure the redirect URI in Google Cloud Console **exactly matches**:
  - `http://localhost:3000/auth/callback`
- No trailing slashes, no `https://` (use `http://` for local dev)

**"OAuth consent screen not configured":**
- Complete Step 5 above (Configure OAuth Consent Screen)

**"Invalid client" error:**
- Double-check you copied the Client ID and Secret correctly
- Make sure there are no extra spaces

