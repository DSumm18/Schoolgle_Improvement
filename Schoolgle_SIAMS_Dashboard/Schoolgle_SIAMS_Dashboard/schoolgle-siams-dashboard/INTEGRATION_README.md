# Schoolgle SIAMS Dashboard - Integration Guide

## 🎯 Project Overview

The **Schoolgle SIAMS Dashboard** is a module within the Schoolgle platform that automates SIAMS (Statutory Inspection of Anglican and Methodist Schools) inspection preparation for church schools.

**Purpose:** Help schools self-assess against SIAMS framework, gather evidence, and auto-generate Self-Evaluation Forms (SEFs) using AI.

---

## 📊 Current Status: FUNCTIONAL MVP

### ✅ What's Working:
1. **Google Sheets Integration**
   - Schools connect their own Google Sheet (template provided)
   - Dashboard reads 7 SIAMS categories with activities
   - Real-time score calculation and visualization
   - School name pulled from cell B1
   - Evidence text (Column D) and folder links (Column E) displayed

2. **Visual Dashboard**
   - Overall SIAMS readiness score (animated counter)
   - Category performance charts (bar + radar charts)
   - Expandable detailed breakdown per activity
   - Color-coded ratings (Advanced, Fully Effective, Transitioning, Baseline, Insufficient)
   - Dark/light mode toggle
   - Multi-school support (tabs for each sheet)

3. **AI Assessment (Gemini 1.5 Flash)**
   - "Run AI Assessment" button per activity
   - Connects to Google Drive folders
   - Reads Google Docs, Google Sheets, plain text files
   - SIAMS-specific prompts for each of 7 strands
   - Provides: Quality score, summary, strengths, gaps, actions, inspector-ready language
   - Cost: ~£0.18-0.35 per full school assessment

4. **Settings Modal**
   - User-friendly setup (no code required)
   - Paste Google Sheet URL + API Key
   - Saves to localStorage
   - Instructions for non-technical users

### 🚧 Partially Complete:
- **PDF/Image Support** - Code ready, needs Drive API enabled
- **Write AI Assessment Back to Sheet** - Displays in UI, not writing to Column F yet

### 📝 Planned Features:
- **Voice Evidence Capture** - Record voice memos on-the-go
- **Bulk AI Assessment** - Analyze all activities at once
- **SEF Auto-Generation** - Generate full Self-Evaluation Form from evidence
- **Universal Chatbot Integration** - Voice/text assistant for evidence management

---

## 🏗️ Architecture

### **Tech Stack:**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS + shadcn/ui components
- **Charts:** react-chartjs-2 (Chart.js)
- **Animations:** Framer Motion, custom hooks
- **AI:** Google Gemini 1.5 Flash
- **Data Source:** Google Sheets API
- **File Storage:** Google Drive API

### **Key Files:**

```
schoolgle-siams-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Landing page
│   │   ├── dashboard/page.tsx                # Main dashboard (entry point)
│   │   └── api/
│   │       └── analyze-evidence/route.ts     # AI assessment API endpoint
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── SchoolDetailView.tsx          # Single school view with charts
│   │   │   └── AllSchoolsView.tsx            # Multi-school overview
│   │   └── SettingsModal.tsx                 # Google Sheet connection UI
│   ├── hooks/
│   │   ├── useGoogleSheetData.ts             # Fetch/parse Google Sheets
│   │   └── useAnimatedCounter.ts             # Number animations
│   ├── lib/
│   │   ├── config.ts                         # Google API keys (localStorage)
│   │   └── utils/colors.ts                   # Color scheme utilities
│   ├── context/
│   │   └── ThemeContext.tsx                  # Dark/light mode state
│   └── types/
│       └── siams.ts                          # TypeScript interfaces
├── AI_ASSESSMENT_PLAN.md                     # Detailed AI implementation plan
├── GOOGLE_SHEETS_TEMPLATE.md                 # Sheet structure guide
└── Schoolgle_SIAMS_Template.xlsx             # Pre-built Excel template

```

---

## 🔌 Integration Points for Schoolgle Hub

### **1. Authentication**
**Current:** None (standalone module)
**Required:** 
- User auth from Schoolgle Hub (JWT/session)
- School ID passed to module
- Multi-tenant support (each school sees only their data)

**Recommendation:**
```typescript
// Pass from hub to module
interface SchoolgleAuth {
  userId: string;
  schoolId: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  modules: string[]; // ['siams', 'estates', ...]
}
```

### **2. API Endpoints for Chatbot**

**Endpoints to Create:**
```typescript
// Get SIAMS status
GET /api/siams/status?schoolId={id}
Response: { overallScore: 69.3, categories: [...], lastUpdated: "..." }

// Add voice evidence
POST /api/siams/evidence/voice
Body: { 
  schoolId: string,
  category: string, 
  activity: string,
  audioBlob: File,
  transcript?: string 
}
Response: { success: true, evidenceUrl: "...", formattedText: "..." }

// Run AI assessment
POST /api/siams/assess
Body: { schoolId: string, category: string, activity: string }
Response: { assessment: "...", quality: "Strong", filesAnalyzed: 5 }

// Get evidence for activity
GET /api/siams/evidence?schoolId={id}&activity={name}
Response: { evidenceText: "...", folderUrl: "...", aiAssessment: "..." }
```

### **3. Chatbot Integration Examples**

**User:** *"Add evidence for Vision & Leadership"*

**Chatbot Action:**
1. Identify SIAMS module + strand
2. Ask for activity or show list
3. Offer: voice recording, file upload, or AI analysis
4. Call appropriate API endpoint
5. Confirm success in dashboard

**User:** *"How are we doing on SIAMS readiness?"*

**Chatbot Response:**
1. Call `GET /api/siams/status`
2. Return: *"Your overall SIAMS readiness is 69.3%. Strongest area: Community & Living Together (80%). Area for improvement: Character Development (60%). Would you like me to run an AI assessment to identify specific gaps?"*

### **4. Data Flow**

```
User Input (Voice/Text)
    ↓
Universal Chatbot (Schoolgle Hub)
    ↓
SIAMS API Endpoints
    ↓
Google Sheets (update Column D/E/F)
    ↓
Dashboard Auto-Refreshes
    ↓
User Sees Updated Score/Evidence
```

---

## 🔑 Configuration & Setup

### **Environment Variables Needed:**

```env
# Google APIs
GOOGLE_SHEETS_API_KEY=AIzaSyCW-1-SaShXavNr3JKLoOUlFDAkFg31ORw
GOOGLE_DRIVE_API_KEY=AIzaSyCW-1-SaShXavNr3JKLoOUlFDAkFg31ORw (same)

# Future: Schoolgle Hub Integration
SCHOOLGLE_HUB_URL=https://app.schoolgle.com
SCHOOLGLE_API_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=GA-XXXXX
```

### **Google Cloud Project:**
- **Project Name:** Schoolgle SIAMS Dashboard
- **Project ID:** schoolgle-siams-dashboard-xxxxx
- **APIs Enabled:**
  - ✅ Google Sheets API
  - ✅ Generative Language API (Gemini)
  - ⏳ Google Drive API (needs enabling)

### **User Setup (Current):**
1. User opens Settings modal
2. Pastes Google Sheet URL
3. Pastes API Key
4. Saves → Data loads immediately

### **User Setup (Future - Hub Integration):**
1. User subscribes to SIAMS module in Schoolgle Hub
2. Hub provisions Google Sheet template for them
3. Hub auto-configures API keys
4. User just clicks "Open SIAMS Dashboard" → Everything works

---

## 💰 Cost Model

### **Per School Costs:**
- **Google Sheets API:** FREE (60 requests/min)
- **Google Drive API:** FREE (1000 requests/day)
- **Gemini 1.5 Flash:**
  - Input: $0.075 per 1M tokens
  - Output: $0.30 per 1M tokens
  - **Per activity:** ~£0.01
  - **Full school (35 activities):** ~£0.18-0.35
  - **100 schools/year:** ~£18-35

### **Pricing Strategy:**
- **Free Tier:** Dashboard only (no AI)
- **Pro Tier (£9.99/month):** AI assessment + voice evidence
- **Enterprise (£29.99/month):** Multi-school, bulk analysis, priority support

**Margins:** 95%+ (SaaS model, minimal variable costs)

---

## 🎨 UI/UX Patterns (Estates Alignment)

The SIAMS dashboard was designed to **match the Estates Management dashboard** for consistency:

- **Same color scheme** (blue, green, orange, cyan, purple, pink, orange-red)
- **Same chart styles** (bar charts, radar charts)
- **Same card layouts** (rounded corners, shadows, dark mode support)
- **Same expandable categories** (chevron icons, smooth animations)
- **Same header structure** (school selector, score display, settings icon)

**Future:** Extract shared components into `@schoolgle/ui` package for all modules.

---

## 🔒 Security Considerations

### **Current:**
- API keys stored in localStorage (client-side)
- Google Sheets set to "Anyone with link can view"
- No user authentication
- No data encryption at rest

### **Required for Production:**
- ✅ Move API keys to server-side env variables
- ✅ Implement user authentication (from Hub)
- ✅ Row-level security (users see only their school)
- ✅ Rate limiting on AI endpoints (prevent abuse)
- ✅ Input validation and sanitization
- ✅ HTTPS only in production
- ✅ GDPR compliance (data processing agreements)
- ✅ Backup strategy for Google Sheets

---

## 🚀 Deployment

### **Current Setup:**
- Local development: `npm run dev` (port 3000)
- No production deployment yet

### **Recommended Production:**

**Option A: Vercel (Easiest)**
```bash
vercel --prod
# Auto-deploys from Git
# Edge functions for API routes
# Global CDN
```

**Option B: Schoolgle Monorepo**
```
schoolgle-platform/
├── apps/
│   ├── hub/              # Main Schoolgle app
│   ├── siams/            # This module
│   ├── estates/          # Existing module
│   └── chatbot/          # Universal assistant
├── packages/
│   ├── ui/               # Shared components
│   ├── auth/             # Shared auth logic
│   └── api-client/       # Shared API utilities
└── turbo.json            # Turborepo config
```

---

## 📚 SIAMS Framework Reference

### **7 SIAMS Strands:**

1. **Vision & Leadership** - Christian vision drives decision-making
2. **Wisdom, Knowledge & Skills** - Curriculum enables wise, knowledgeable learners
3. **Character Development** - Hope, aspiration, courageous advocacy
4. **Community & Living Together** - Inclusive community, church partnership
5. **Dignity & Respect** - All treated with dignity, diversity celebrated
6. **Collective Worship** - Invitational, inclusive, inspiring worship
7. **Religious Education** - Theological literacy, critical thinking

### **Rating Scale:**
- **Advanced (100%)** - Exceptional practice, widely shared
- **Fully Effective (75%)** - Strong practice, consistent impact
- **Transitioning (50%)** - Developing practice, some impact
- **Baseline (25%)** - Early stages, limited impact
- **Insufficient (0%)** - Not meeting requirements

---

## 🧪 Testing

### **Manual Testing Checklist:**
- [ ] Connect Google Sheet via Settings modal
- [ ] View overall score calculation
- [ ] Expand/collapse categories
- [ ] Click evidence folder links
- [ ] Run AI assessment on activity with evidence
- [ ] Toggle dark/light mode
- [ ] Switch between multiple schools
- [ ] Test with empty folder (0 files)
- [ ] Test with Google Doc in folder
- [ ] Test error handling (invalid Sheet ID)

### **Future: Automated Tests**
```typescript
// Unit tests
describe('SIAMS Score Calculation', () => {
  it('calculates category average correctly', () => {
    const activities = [
      { score: 100 },
      { score: 75 },
      { score: 50 }
    ];
    expect(calculateAverage(activities)).toBe(75);
  });
});

// Integration tests
describe('Google Sheets API', () => {
  it('fetches sheet data successfully', async () => {
    const data = await useGoogleSheetData();
    expect(data.schoolData).toBeDefined();
  });
});
```

---

## 🐛 Known Issues & Limitations

### **Current Limitations:**
1. **Google Drive API not enabled yet** - Prevents file reading
2. **No write-back to Sheet** - AI assessment shows in UI but doesn't save to Column F
3. **No bulk operations** - Must analyze activities one by one
4. **No offline mode** - Requires internet for Google APIs
5. **No PDF/image extraction yet** - Code ready, needs Drive API
6. **Client-side API keys** - Security risk for production
7. **No user auth** - Anyone with link can view

### **Future Improvements:**
- Write AI assessments back to Google Sheet Column F
- Bulk AI assessment (analyze all activities at once)
- SEF auto-generation from all evidence
- Voice evidence capture
- Multi-file upload via UI
- Evidence quality tracking over time
- Inspector question prediction
- Mobile app (React Native)

---

## 📞 Contact & Support

**Developer:** Built with Cursor AI Assistant
**Project Lead:** David (Schoolgle Founder)
**Repository:** `C:\Git\Schoolgle_SIAMS_Dashboard`

---

## 🎯 Next Steps for Integration

### **Phase 1: Make SIAMS Standalone Ready (1-2 days)**
1. ✅ Enable Google Drive API
2. ✅ Test PDF/image support with Gemini
3. ✅ Add voice evidence capture button
4. ✅ Write AI assessments back to Sheet Column F
5. ✅ Deploy to Vercel staging

### **Phase 2: Hub Integration (3-5 days)**
1. Extract shared UI components to `@schoolgle/ui`
2. Add authentication middleware
3. Create SIAMS API endpoints for chatbot
4. Test chatbot → SIAMS module flow
5. Add subscription tier checks

### **Phase 3: Production Launch (1 week)**
1. Security audit
2. Performance optimization
3. Multi-school testing
4. Documentation for schools
5. Marketing materials
6. Beta user onboarding

---

## 💡 Innovation Opportunities

**Voice-First Evidence:**
- "Hey Schoolgle, add evidence for Vision & Leadership..."
- Auto-format voice notes as inspector-ready text
- Timestamp and categorize automatically

**Predictive Analytics:**
- "Based on current evidence, you're on track for 'Good' rating"
- "Add 3 more pieces of evidence for 'Outstanding'"

**Collaborative Features:**
- Multi-user editing (head, governors, subject leads)
- Comments and feedback within dashboard
- Approval workflows for evidence

**Inspector View Mode:**
- Share read-only link with inspector
- Pre-formatted SEF export
- Evidence portfolio PDF generation

---

**This module is ready for integration into the Schoolgle ecosystem! 🚀**
