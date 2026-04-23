# OAuth Setup Guide for Google Drive and Microsoft OneDrive

## Overview

Schoolgle uses OAuth to connect to Google Drive and Microsoft OneDrive, providing a secure and professional way to access school files.

## What Schools Need to Do

### For School Administrators: NOTHING! ✅

The OAuth flow is handled entirely by Schoolgle:
- No API keys needed from schools
- No manual configuration required
- Schools just click "Connect" and authorize

### For Schoolgle Developers: SETUP REQUIRED ⚠️

You need to create OAuth apps in Google Cloud Console and Microsoft Azure Portal.

---

## Google Drive OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Schoolgle Production"

### Step 3: Configure OAuth Consent Screen

1. Go to "OAuth consent screen" (if prompted)
2. User type: "External"
3. Fill in required fields:
   - App name: "Schoolgle"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (during development)
6. Submit for verification (for production)

### Step 4: Add Authorized Redirect URIs

In the OAuth client settings, add these redirect URIs:
- `http://localhost:3000/api/oauth/callback/google` (development)
- `https://www.schoolgle.co.uk/api/oauth/callback/google` (production)

### Step 5: Copy Credentials

You'll get:
- **Client ID** (public) - Add to `.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- **Client Secret** (private) - Add to `.env.local` as `GOOGLE_CLIENT_SECRET`

---

## Microsoft OneDrive OAuth Setup

### Step 1: Register App in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Microsoft Entra ID" (formerly Azure Active Directory)
3. Click "App registrations" → "New registration"
4. Name: "Schoolgle Production"
5. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
6. Redirect URI: `http://localhost:3000/api/oauth/callback/microsoft` (development)
7. Click "Register"

### Step 2: Configure API Permissions

1. In your app, go to "API permissions" → "Add a permission"
2. Select "Microsoft Graph" → "Delegated permissions"
3. Add these permissions:
   - `Files.Read.All` - Read files in OneDrive
   - `User.Read` - Sign in and read user profile
4. Click "Add permissions"
5. Click "Grant admin consent for [your organization]"

### Step 3: Add Redirect URIs (Production)

1. Go to "Authentication"
2. Add platform: "Web"
3. Redirect URI: `https://www.schoolgle.co.uk/api/oauth/callback/microsoft`

### Step 4: Copy Credentials

1. Go to "Overview" → Copy:
   - **Application (client) ID** - Add to `.env.local` as `NEXT_PUBLIC_MICROSOFT_CLIENT_ID`
2. Go to "Certificates & secrets" → "New client secret":
   - Name: "Schoolgle Production"
   - Expires: Never (or 1-2 years)
   - Copy **Value** immediately - Add to `.env.local` as `MICROSOFT_CLIENT_SECRET`

---

## Environment Variables

Add these to `.env.local`:

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common  # Optional, defaults to 'common'

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://www.schoolgle.co.uk  # Production
```

---

## Testing OAuth Locally

### Google Drive

1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000/settings/data-connections`
3. Click "Connect Google Drive"
4. You'll be redirected to Google:
   - Sign in with your Google account
   - Review permissions (Drive readonly access, email)
   - Click "Allow"
5. Redirect back to Schoolgle → Connected!

### Microsoft OneDrive

1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000/settings/data-connections`
3. Click "Connect OneDrive"
4. You'll be redirected to Microsoft:
   - Sign in with your Microsoft account
   - Review permissions (Files.Read.All, User.Read)
   - Click "Accept"
5. Redirect back to Schoolgle → Connected!

---

## Production Deployment

1. Update `NEXT_PUBLIC_APP_URL` to production URL
2. Add production redirect URIs to Google/Microsoft OAuth apps
3. Test OAuth flow in production
4. Submit Google OAuth app for verification (required for public use)

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Cause**: Redirect URI in OAuth app doesn't match request
**Fix**: Add the exact redirect URI to your OAuth app configuration

### Error: "invalid_client"
**Cause**: Client ID or secret is incorrect
**Fix**: Verify environment variables are set correctly

### Error: "access_denied"
**Cause**: User denied access or OAuth app not verified
**Fix**:
- For development: Add your email as test user in Google OAuth consent screen
- For production: Submit OAuth app for verification

### Error: "popup blocked"
**Cause**: Browser blocked popup window
**Fix**: Allow popups for schoolgle.co.uk in browser settings

---

## Security Best Practices

✅ **DO**:
- Store client secrets in `.env.local` (never commit)
- Use HTTPS in production
- Implement PKCE (already done)
- Validate state parameter (already done)
- Encrypt tokens at rest (already done)
- Use minimal scopes (read-only where possible)

❌ **DON'T**:
- Commit client secrets to Git
- Share client secrets with anyone
- Request more scopes than needed
- Bypass OAuth security checks

---

## Token Management

- **Access tokens**: Expire after 1 hour (auto-refreshed)
- **Refresh tokens**: Long-lived (used to get new access tokens)
- **Storage**: Encrypted in database using pgcrypto
- **Revocation**: Users can revoke access anytime from Google/Microsoft accounts

---

**Last Updated**: 2026-03-26
**Version**: 1.0
