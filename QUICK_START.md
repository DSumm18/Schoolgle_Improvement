# Schoolgle - Quick Start Guide

## Current Status ✅

Your development environment is set up and running:

- ✅ **Dev Server**: http://localhost:3000
- ✅ **Firebase Auth**: Configured
- ✅ **Environment**: `.env.local` created with real credentials
- ✅ **Dependencies**: Installed (517 packages)

## ⚠️ Database Setup Required

**You cannot sign in yet because the database tables haven't been created in Supabase.**

### Step 1: Create Database Tables

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/
   - Login and select your project

2. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Schema**
   - Open `supabase_schema.sql` in this directory
   - Copy ALL contents (it's a large file)
   - Paste into the SQL Editor
   - Click "Run" button
   - Wait for "Success" message (may take 30-60 seconds)

4. **Verify Tables Created**
   - Go to "Table Editor" in left sidebar
   - You should see 20+ tables including:
     - users
     - organizations
     - organization_members
     - ofsted_assessments
     - evidence_items
     - actions
     - etc.

### Step 2: Configure Firebase Authentication

Your Firebase is already configured, but you need to enable the auth providers:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select project: `schoolgle`

2. **Enable Google Sign-In**
   - Go to "Authentication" → "Sign-in method"
   - Click "Google"
   - Enable it
   - Save

3. **Enable Microsoft Sign-In (Optional)**
   - Click "Microsoft"
   - You'll need to set up Azure AD app
   - Add Client ID and Secret
   - Save

### Step 3: First Sign-In

1. **Open Application**
   - Go to: http://localhost:3000
   - Click "Sign In" or go to http://localhost:3000/login

2. **Sign In with Google**
   - Click "Sign in with Google"
   - Choose your Google account
   - Authorize the app

3. **Create Organization**
   - After first sign-in, you'll need to create/join an organization
   - Fill in school details
   - You'll be set as admin

## Authentication Flow

```
User → Google/Microsoft → Firebase Auth → Your App
                                            ↓
                                      Supabase Database
                                            ↓
                                  Creates user record
                                  + organization link
```

## Troubleshooting

### Can't Sign In
- ✅ Check Firebase Console → Authentication is enabled
- ✅ Verify `.env.local` has correct Firebase keys
- ✅ Make sure dev server is running

### Database Errors
- ✅ Run `supabase_schema.sql` in Supabase SQL Editor
- ✅ Check Supabase Dashboard → Logs for errors
- ✅ Verify tables exist in Table Editor

### "User not found" After Sign-In
- This is normal on first sign-in
- The app will create user record automatically
- Check `users` table in Supabase

### Firebase Errors
```
Error: auth/invalid-api-key
```
- Check `.env.local` has correct `NEXT_PUBLIC_FIREBASE_API_KEY`
- Restart dev server after changing `.env.local`

```
Error: auth/unauthorized-domain
```
- Go to Firebase Console → Authentication → Settings
- Add `localhost` to authorized domains

## What Each Service Does

### Firebase Authentication
- Handles user login/signup
- Supports Google and Microsoft OAuth
- Manages user sessions
- Returns user ID (UID) used everywhere

### Supabase Database
- Stores all application data
- User profiles, organizations, assessments
- Evidence, actions, documents
- Uses Firebase UID as primary key

### OpenRouter AI
- Powers evidence matching
- Analyzes documents
- Generates reports
- Uses DeepSeek V3 model (cost-effective)

## Available Features After Setup

Once signed in, you can access:

### 🎯 Ofsted Dashboard
- `/dashboard` - Main inspection readiness dashboard
- Self-assessment ratings
- Evidence mapping
- Action planning
- Gantt charts

### 📊 SIAMS Framework (Church Schools)
- `/dashboard` - Toggle to SIAMS view
- 7 inspection strands
- Evidence requirements

### 📄 Document Scanning
- Upload documents (Word, PDF, Excel, images)
- AI-powered evidence extraction
- Automatic framework mapping

### ✅ Action Management
- Create improvement actions
- Assign to staff
- Track progress
- Timeline view

### 📝 Reports
- SEF Generator
- Pupil Premium Strategy
- Sports Premium
- School Development Plan

## Next Steps

1. ✅ **Set up database** (run SQL schema)
2. ✅ **Enable Firebase auth providers**
3. ✅ **Sign in with Google**
4. ✅ **Create your organization**
5. ✅ **Start using the dashboard!**

## Need Help?

- Check `SUPABASE_SETUP.md` for detailed database setup
- Check browser console (F12) for errors
- Check dev server terminal for backend errors
- Review Firebase Console for auth issues

## Development Server Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage/landing
│   ├── login/page.tsx        # Login page
│   ├── dashboard/page.tsx    # Main dashboard
│   └── api/                  # API routes
├── components/
│   ├── OfstedFrameworkView.tsx
│   ├── ActionsDashboard.tsx
│   └── ...
├── lib/
│   ├── firebase.ts           # Firebase config
│   ├── ofsted-framework.ts   # Framework data
│   └── ...
└── context/
    └── AuthContext.tsx       # Auth state
```

## Important URLs

- **Application**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **Firebase Console**: https://console.firebase.google.com/
- **Supabase Dashboard**: https://app.supabase.com/

---

**Remember**: The database MUST be set up before you can sign in!
