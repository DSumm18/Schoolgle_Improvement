# Quick Start: Connect Your Google Drive to Schoolgle

Follow these exact steps to connect YOUR Google Drive to Schoolgle for testing.

---

## STEP 1: Create Google OAuth App (5 mins)

### 1a. Go to Google Cloud Console
1. Open https://console.cloud.google.com/
2. Sign in with your Google account (the one with Drive you want to connect)
3. Click "Select a project" → "NEW PROJECT"
4. Name: "Schoolgle Test" → Click "CREATE"

### 1b. Enable Google Drive API
1. In the left sidebar, search for "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it → Click "ENABLE"

### 1c. Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. External → Click "CREATE"
3. Fill in:
   - App name: `Schoolgle Test`
   - User support email: `your-email@gmail.com`
   - Developer contact: `your-email@gmail.com`
4. Click "SAVE AND CONTINUE"
5. Scopes → Click "ADD OR REMOVE SCOPES"
   - Filter: `..auth/drive..`
   - Check: `.../auth/drive.readonly`
   - Click "UPDATE" → "SAVE AND CONTINUE"
6. Test users → Click "ADD YOURSELF"
   - Add your email address
7. Click "SAVE AND CONTINUE"

### 1d. Create OAuth Client ID
1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `Schoolgle Test Web Client`
5. Authorized JavaScript origins:
   - Add: `http://localhost:3000`
6. Authorized redirect URIs:
   - Add: `http://localhost:3000/api/oauth/callback/google`
7. Click "CREATE"

### 1e. Copy Your Credentials
You'll see a popup with:
- **Client ID** (starts with numbers, like `123456789-abcde...`)
- **Client Secret** (click "SHOW" to reveal)

**COPY BOTH** - you'll need them in Step 2!

---

## STEP 2: Add Credentials to Schoolgle (2 mins)

### 2a. Open `.env.local` file
Location: `C:\Dev\Schoolgle_Improvement\.env.local`

### 2b. Add these lines at the bottom:

```bash
# Google OAuth - Test Setup
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with the actual values from Google.

### 2c. Save the file

### 2d. Restart dev server
1. Stop the current server (Ctrl+C in terminal)
2. Run: `npm run dev`

---

## STEP 3: Test the Connection (2 mins)

### 3a. Open Schoolgle
Go to: http://localhost:3000/settings/data-connections

### 3b. Sign in
- Sign in as yourself (any test user)

### 3c. Click "Connect Google Drive"
1. You should see a button: "🔵 Connect Google Drive"
2. Click it
3. A popup will open → Google sign-in page
4. Sign in with your Google account
5. Review permissions:
   - "See and download all your Google Drive files"
   - This is read-only, so it's safe ✅
6. Click "Allow"
7. Popup closes → Back to Schoolgle
8. You should see: "✅ Google Drive Connected!"

---

## What Should Happen

### Success:
```
┌─────────────────────────────────┐
│  Data Connections               │
│                                 │
│  ✅ Google Drive                │
│     Connected as your@email.com │
│     [Manage] [Disconnect]       │
└─────────────────────────────────┘
```

### If Something Goes Wrong:

**Error: "redirect_uri_mismatch"**
- Solution: Make sure you added `http://localhost:3000/api/oauth/callback/google` exactly
- Check for trailing slashes or typos

**Error: "invalid_client"**
- Solution: Check `.env.local` has correct Client ID and Secret
- Restart dev server after changing `.env.local`

**Error: "access_denied"**
- Solution: Make sure you added your email as a test user in OAuth consent screen

**Error: "Popup blocked"**
- Solution: Allow popups for `localhost:3000` in your browser

---

## Verification

### Check if it worked:

1. **Browser Console** (F12):
   - Should see: "OAuth success: google"
   - No errors in red

2. **Database Check**:
   ```bash
   node check-oauth-connection.js
   ```

3. **Manual Test**:
   - Try browsing your Google Drive files
   - Should see your folders and files

---

## Next Steps After Success

Once connected, you can:
1. ✅ Browse your Google Drive files in Schoolgle
2. ✅ Scan folder structure automatically
3. ✅ Connect specific folders
4. ✅ Revoke access anytime from your Google Account settings

---

## Need Help?

If you get stuck at any step:
1. Check the browser console (F12) for errors
2. Check the terminal for server errors
3. Share the error message with me

---

**Ready to try?** Start with Step 1a above! 🚀
