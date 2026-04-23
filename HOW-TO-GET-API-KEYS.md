# 🚀 Quick Guide: Getting Your API Keys for Ed

## 🔑 Required Keys (Minimum for Ed to Work)

### 1. OpenRouter API Key (MOST IMPORTANT - Ed's AI Brain)

**Purpose**: Powers Ed's AI responses and specialist agents
**Cost**: Free tier available, then pay-per-use
**Time**: 2 minutes

**Steps**:
1. Go to: https://openrouter.ai/keys
2. Sign up/login (Google/GitHub works)
3. Click "Create Key"
4. Copy the key (starts with `sk-or-v1-`)
5. Paste in `.env.local`: `OPENROUTER_API_KEY=sk-or-v1-your-actual-key`

**Cost Estimate**: ~$0.24 per million tokens (very affordable!)

---

### 2. Supabase Credentials (Database & Authentication)

**Purpose**: Stores user data, authentication, and school information
**Cost**: Free tier available
**Time**: 5 minutes

**Steps**:
1. Go to: https://supabase.com
2. Click "Start your project"
3. Sign up/login
4. Create new project (choose a region close to you)
5. Wait for project to be ready (~2 minutes)
6. Go to: Project Settings → API
7. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

**Free Tier**: 500MB database, 1GB bandwidth, 50K monthly active users

---

### 3. Firebase Credentials (Authentication)

**Purpose**: User authentication (Google/Microsoft login)
**Cost**: Free tier available
**Time**: 5 minutes

**Steps**:
1. Go to: https://console.firebase.google.com
2. Click "Add project" (or use existing)
3. Give it a name (e.g., "schoolgle-dev")
4. Disable Google Analytics (optional, for development)
5. Click "Create project"
6. Go to: Project Settings → General → Your apps → Web app
7. Copy the config values:
   - **apiKey** → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - **authDomain** → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - **projectId** → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - **storageBucket** → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - **messagingSenderId** → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - **appId** → `NEXT_PUBLIC_FIREBASE_APP_ID`

**Free Tier**: Generous limits for development

---

## 🌟 Optional Keys (For Extra Features)

### Fish Audio (Text-to-Speech for Ed)
- **Website**: https://fish.audio/
- **Purpose**: Ed can speak responses out loud
- **Cost**: Free tier available
- **Nice-to-have**: Makes Ed more interactive

### Google OAuth (Drive Integration)
- **Website**: https://console.cloud.google.com
- **Purpose**: Import documents from Google Drive
- **Cost**: Free
- **For**: Schools using Google Workspace

### Microsoft OAuth (OneDrive Integration)
- **Website**: https://portal.azure.com
- **Purpose**: Import documents from OneDrive
- **Cost**: Free
- **For**: Schools using Microsoft 365

---

## 📋 Quick Setup Checklist

**Step 1**: Get OpenRouter key (2 min)
- [ ] Go to https://openrouter.ai/keys
- [ ] Create and copy key
- [ ] Paste in `.env.local`

**Step 2**: Get Supabase credentials (5 min)
- [ ] Go to https://supabase.com
- [ ] Create project
- [ ] Copy URL + keys
- [ ] Paste in `.env.local`

**Step 3**: Get Firebase config (5 min)
- [ ] Go to https://console.firebase.google.com
- [ ] Create project
- [ ] Copy config values
- [ ] Paste in `.env.local`

**Step 4**: Test Ed!
- [ ] Save `.env.local`
- [ ] Restart server: `npm run dev`
- [ ] Go to http://localhost:3000
- [ ] Login and start chatting with Ed!

---

## 💰 Cost Estimate (Development)

**Per Month**:
- OpenRouter: ~$1-5 (depending on usage)
- Supabase: $0 (free tier)
- Firebase: $0 (free tier)
- **Total**: $1-5/month for development

---

## 🔒 Security Tips

✅ **SAFE**:
- Your keys are in `.env.local` which is gitignored
- Never committed to GitHub
- Only stored on your local machine

❌ **NEVER**:
- Share your API keys
- Commit `.env.local` to git
- Post keys in chat/forums
- Use production keys for development

---

## 🆘 Troubleshooting

**Q: Ed says "Unauthorized" or "401"**
A: Check your Supabase/Firebase credentials are correct

**Q: Ed gives generic responses**
A: Check your OpenRouter API key is valid

**Q: Can't login**
A: Make sure Firebase credentials are properly set

**Q: Server won't start**
A: Check `.env.local` file format (no extra spaces, correct variable names)

---

## ✨ Ready to Go!

Once you have the 3 required keys, Ed will be fully functional:
- 🤖 AI conversations with specialist knowledge
- 🎯 Context-aware school management advice
- 🔐 Secure authentication
- 💾 Data persistence

Estimated setup time: **15 minutes** total
