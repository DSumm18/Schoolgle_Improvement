# OAuth Implementation for Google Drive and OneDrive

**Status**: ✅ COMPLETE - Ready for Testing

---

## What's Been Built

### 1. Database Schema (`20260326_oauth_tokens.sql`)
- ✅ `oauth_tokens` table with encrypted token storage
- ✅ Row-Level Security policies
- ✅ Helper functions for encryption/decryption
- ✅ Token refresh triggers
- ✅ Storage bucket for connected drives

### 2. OAuth Configuration (`src/lib/oauth-config.ts`)
- ✅ Google OAuth config with PKCE
- ✅ Microsoft OAuth config with PKCE
- ✅ Token exchange functions
- ✅ Token refresh functions
- ✅ State validation (CSRF protection)

### 3. API Endpoints
- ✅ `POST /api/oauth/authorize` - Initiate OAuth flow
- ✅ `GET /api/oauth/callback` - Handle OAuth callback

### 4. UI Components
- ✅ `OAuthConnectButton` component
- ✅ Popup handling for OAuth flow
- ✅ Error handling and success callbacks

### 5. Documentation
- ✅ OAuth setup guide for developers
- ✅ Environment variable reference
- ✅ Troubleshooting guide

---

## How It Works

### User Flow (Same for Both Google & Microsoft)

```
1. User clicks "Connect Google Drive" or "Connect OneDrive"
   ↓
2. Schoolgle generates OAuth authorization URL
   ↓
3. Popup opens → User redirected to Google/Microsoft
   ↓
4. User signs in and reviews permissions
   ↓
5. User clicks "Allow"
   ↓
6. Redirect back to Schoolgle with authorization code
   ↓
7. Schoolgle exchanges code for access token
   ↓
8. Token encrypted and stored in database
   ↓
9. Connection successful! ✅
```

### Security Features

- ✅ **PKCE** (Proof Key for Code Exchange) - Prevents code interception
- ✅ **State parameter** - Prevents CSRF attacks
- ✅ **Encrypted tokens** - Tokens encrypted at rest using pgcrypto
- ✅ **HttpOnly cookies** - State and verifier stored securely
- ✅ **Minimal scopes** - Read-only access where possible
- ✅ **Auto-refresh** - Tokens refreshed before expiry

---

## What Schools See

### Before Connection
```
┌─────────────────────────────────────┐
│  Data Connections                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔵 Connect Google Drive     │   │
│  │    You'll be redirected to   │   │
│  │    Google to authorize      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔷 Connect OneDrive        │   │
│  │    You'll be redirected to   │   │
│  │    Microsoft to authorize   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### After Connection
```
┌─────────────────────────────────────┐
│  Data Connections                    │
│                                     │
│  ✅ Google Drive                    │
│     Connected as john@school.co.uk  │
│     [Manage] [Disconnect]           │
│                                     │
│  ✅ OneDrive                        │
│     Connected as john@school.co.uk  │
│     [Manage] [Disconnect]           │
└─────────────────────────────────────┘
```

---

## Next Steps

### For Developers (YOU)
1. ⏳ **Set up Google OAuth app** (30 mins)
   - Follow guide in `docs/OAUTH_SETUP_GUIDE.md`
   - Get Client ID and Secret
   - Add to `.env.local`

2. ⏳ **Set up Microsoft OAuth app** (30 mins)
   - Follow guide in `docs/OAUTH_SETUP_GUIDE.md`
   - Get Client ID and Secret
   - Add to `.env.local`

3. ⏳ **Test locally**
   - Run `npm run dev`
   - Try connecting to Google Drive
   - Try connecting to OneDrive

4. ⏳ **Deploy to production**
   - Add production redirect URIs
   - Update `NEXT_PUBLIC_APP_URL`
   - Test in production

### For Schools (USERS)
- ✅ Nothing to configure!
- Just click "Connect" and authorize

---

## Files Created

```
apps/platform/
├── supabase/migrations/
│   └── 20260326_oauth_tokens.sql           # Database schema
├── src/
│   ├── lib/
│   │   └── oauth-config.ts                 # OAuth config & functions
│   ├── app/api/oauth/
│   │   ├── authorize/route.ts              # Initiate OAuth
│   │   └── callback/route.ts              # Handle callback
│   └── components/oauth/
│       └── OAuthConnectButton.tsx          # UI component
docs/
└── OAUTH_SETUP_GUIDE.md                    # Setup guide
```

---

## Environment Variables Needed

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Dev
# NEXT_PUBLIC_APP_URL=https://www.schoolgle.co.uk  # Prod
```

---

## Testing Checklist

### Google Drive
- [ ] OAuth app created in Google Cloud Console
- [ ] Client ID and Secret added to `.env.local`
- [ ] Redirect URI added to OAuth app
- [ ] Google Drive API enabled
- [ ] Test "Connect Google Drive" button
- [ ] Verify token stored in database
- [ ] Verify files can be accessed

### OneDrive
- [ ] OAuth app created in Azure Portal
- [ ] Client ID and Secret added to `.env.local`
- [ ] Redirect URI added to OAuth app
- [ ] API permissions configured
- [ ] Test "Connect OneDrive" button
- [ ] Verify token stored in database
- [ ] Verify files can be accessed

---

## Migration from API Key Approach

### Old Approach (Being Replaced)
- ❌ User shares folder as "Anyone with the link"
- ❌ Paste folder link in Schoolgle
- ❌ Security concerns (public folders)
- ❌ Different UX for Google vs OneDrive

### New Approach (OAuth)
- ✅ User clicks "Connect" → OAuth popup → Authorize
- ✅ Secure, private folder access
- ✅ Consistent UX for both providers
- ✅ Professional, industry-standard
- ✅ Better security and control

---

## Advantages Over API Key Approach

1. **Security**: Private folder access, no public sharing needed
2. **Consistency**: Same flow for Google and Microsoft
3. **Control**: Schools can revoke access anytime
4. **Professional**: Industry-standard OAuth flow
5. **Audit Trail**: Track who connected what and when
6. **Automatic Refresh**: Tokens refresh automatically
7. **User Trust**: Clear authorization dialog shows what's being accessed

---

**Status**: ✅ Ready for Developer Testing
**Effort**: ~1-2 hours to set up OAuth apps
**User Impact**: Much better experience, more secure

---

**Questions?** See `docs/OAUTH_SETUP_GUIDE.md` for detailed setup instructions.
