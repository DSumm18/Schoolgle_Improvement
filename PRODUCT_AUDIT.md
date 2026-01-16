# 🔍 SCHOOLGLE PRODUCT AUDIT - Complete Inventory

> **Audit Date:** 2026-01-14
> **Status:** CRITICAL - Needs consolidation and fixes before testing

---

## 📊 EXECUTIVE SUMMARY

### What We Have (3 Apps)

| App | Location | Status | Purpose |
|-----|----------|--------|---------|
| **Platform** | `apps/platform` | ⚠️ Partially Working | Main dashboard, Inspection Readiness |
| **Ed Staff** | `apps/ed-staff` | ❓ Separate App | AI assistant for school staff operations |
| **Ed Parent** | `apps/ed-parent` | ❓ Separate App | Parent-facing AI assistant |

### Critical Issues Found

| Issue | Severity | Page |
|-------|----------|------|
| **Action Plan stuck loading** | 🔴 BLOCKER | `/dashboard/action-plan` |
| **AbortError from Supabase Auth** | 🔴 BLOCKER | All dashboard pages intermittently |
| **Duplicate pages for same functions** | 🟡 Confusion | Multiple |
| **Legacy components not surfaced** | 🟡 Lost Features | `OfstedFrameworkView_Legacy` |
| **No navigation to SEF/SDP** | 🟡 UX Gap | Sidebar |

---

## 📁 COMPLETE PAGE INVENTORY

### Dashboard Routes (`apps/platform/src/app/(dashboard)/`)

| Route | File | Status | Purpose | Notes |
|-------|------|--------|---------|-------|
| `/dashboard` | `dashboard/page.tsx` | ✅ Works | Main Risk Dashboard | Shows risk score, evidence coverage, priorities |
| `/dashboard/action-plan` | `dashboard/action-plan/page.tsx` | 🔴 BROKEN | Strategic Actions | Stuck on "Syncing your plan..." - AbortError |
| `/dashboard/sef` | `dashboard/sef/page.tsx` | ✅ Works | SEF Builder | AI generation, 4 Ofsted domains |
| `/dashboard/sdp` | `dashboard/sdp/page.tsx` | ✅ Works | SDP Builder | Strategic priorities, budget tracking |
| `/dashboard/risk` | `dashboard/risk/page.tsx` | ❓ Untested | Risk Profile | Detailed risk analysis |
| `/dashboard/settings` | `dashboard/settings/page.tsx` | ❓ Untested | User/Org Settings | Configuration |
| `/dashboard/account` | `dashboard/account/page.tsx` | ❓ Untested | Billing | Subscription management |
| `/dashboard/interventions` | `dashboard/interventions/page.tsx` | ❓ Untested | Interventions | Pupil intervention tracking |
| `/dashboard/trial` | `dashboard/trial/page.tsx` | ❓ Untested | Trial Status | Trial period info |
| `/dashboard/upgrade` | `dashboard/upgrade/page.tsx` | ❓ Untested | Upgrade CTA | Upgrade prompts |
| `/evidence` | `evidence/page.tsx` | ✅ Works | Evidence Library | Upload, categorize, link evidence |
| `/timeline` | `timeline/page.tsx` | ⚠️ Different from expected | Audit Log | Shows system audit trail (NOT the calendar/staffing feature you described) |
| `/packs` | `packs/page.tsx` | ❓ Untested | Governor Packs | Board pack generation |
| `/marketplace` | `marketplace/page.tsx` | ❓ Untested | App Marketplace | Module purchasing |
| `/toolbox` | `toolbox/page.tsx` | ❓ Untested | Tools Directory | List of all school tools |
| `/insights` | `insights/page.tsx` | ❓ Untested | Insights Hub | Industry research/articles |
| `/admin` | `admin/page.tsx` | ❓ Untested | Admin Panel | User management |
| `/admin/super` | `admin/super/page.tsx` | ❓ Untested | Super Admin | Cross-organization management |
| `/admin/features` | `admin/features/page.tsx` | ❓ Untested | Feature Flags | Toggle features on/off |

---

## 🔄 DUPLICATE/OVERLAPPING FEATURES

### 1. Dashboard vs MondayDashboard Component

| File | Purpose | Currently Used? |
|------|---------|-----------------|
| `dashboard/page.tsx` | Main dashboard with risk profile, actions, evidence | ✅ Active |
| `components/MondayDashboard.tsx` | Alternative "Monday briefing" dashboard with urgent items | ❌ Not surfaced in navigation |

**Resolution:** MondayDashboard could be embedded IN the main dashboard as the "Today" view, or removed.

---

### 2. OfstedFrameworkView vs OfstedFrameworkView_Legacy

| Component | Size | Features | Status |
|-----------|------|----------|--------|
| `OfstedFrameworkView.tsx` | 298 lines | Simplified view with categories | Current |
| `OfstedFrameworkView_Legacy.tsx` | 929 lines | **Full framework tracker with actions, evidence mapping, Ed integration** | ❌ NOT SURFACED |

**⚠️ IMPORTANT:** The Legacy version is the **original Ofsted tracker** you mentioned with:
- Full EIF framework breakdown
- Evidence scanning
- Action creation per subcategory
- Ed AI analysis panel
- Evidence matching

**Resolution:** This is the feature you're looking for! It's in the code but not linked in navigation.

---

### 3. SEFGenerator Component vs SEF Page

| Item | Purpose | Status |
|------|---------|--------|
| `dashboard/sef/page.tsx` | Full SEF page with editor | ✅ Works |
| `components/SEFGenerator.tsx` | SEF generation component | Used by page |

**No conflict** - these work together correctly.

---

### 4. Timeline Page vs Your Calendar Feature

**What exists:** `/timeline` is an **Audit Log** showing database changes, not a calendar.

**What you described:** A calendar/timeline for:
- Staffing gaps
- Staff absences
- Lesson planning when someone is sick
- Cover arrangements

**⚠️ This feature does NOT exist in the current codebase.** The Timeline page has been repurposed/replaced with an audit log.

---

## 🚫 MISSING/BROKEN FEATURES

### 1. Action Plan Page - BROKEN
**Error:** `AbortError: signal is aborted without reason`
**Location:** `node_modules/@supabase/auth-js/dist/module/lib/locks.js`
**Cause:** Supabase Auth library issue with Web Locks API conflict
**Fix Required:** Update Supabase client or adjust auth initialization

### 2. Navigation Gaps
The sidebar is missing links to:
- `/dashboard/sef` (SEF Builder)
- `/dashboard/sdp` (SDP Builder)
- Ofsted Framework Tracker (Legacy component - no page wrapper)

### 3. Ed Chatbot Integration
- Ed widget appears (bottom right "Ask Ed" button)
- Uses `EdWidgetWrapper` which wraps the `@schoolgle/ed-widget` package
- **Status:** Appears to work, needs testing

### 4. Calendar/Staffing Feature
**Status:** ❌ NOT FOUND
The calendar-based staffing/cover/absence feature you described is not in this codebase. Either:
- It was never migrated
- It's in a different repository
- It was removed/replaced

---

## 🏗️ SEPARATE APPS (Not Integrated)

### Ed Staff (`apps/ed-staff`)
- **Purpose:** AI assistant for school staff (teachers, admin)
- **Features:**
  - Screen capture for contextual help
  - Quick skills (Arbor help, SIMS navigation, etc.)
  - Chat interface with Ed
- **Status:** Standalone app, NOT linked from main platform
- **Access:** Would need separate `npm run dev` in that directory

### Ed Parent (`apps/ed-parent`)
- **Purpose:** Parent-facing AI assistant
- **Status:** Standalone app, NOT linked from main platform

---

## 📋 RECOMMENDED ACTIONS

### IMMEDIATE FIXES (Before Testing)

#### 1. Fix Action Plan Page
The AbortError is blocking the page. Likely fixes:
```javascript
// In SupabaseAuthContext or supabase client init
// Try disabling persistSession or lock features
```

#### 2. Add Missing Navigation Links
Update `apps/platform/src/app/(dashboard)/layout.tsx`:
```javascript
// Add to navigationItems:
{ name: 'SEF Builder', href: '/dashboard/sef', icon: FileText },
{ name: 'SDP Builder', href: '/dashboard/sdp', icon: Target },
```

#### 3. Surface the Ofsted Framework Tracker
Create a new page that uses `OfstedFrameworkView_Legacy`:
```
/dashboard/framework → Uses OfstedFrameworkView_Legacy
```

### DECISIONS NEEDED

| Question | Options |
|----------|---------|
| **Which Dashboard design?** | Current (`dashboard/page.tsx`) vs `MondayDashboard.tsx` |
| **Calendar/Staffing feature?** | Rebuild? Find from another repo? Mark as future? |
| **Ed Staff app integration?** | Link from platform? Keep separate? |
| **Marketplace needed now?** | Hide for MVP or keep? |

---

## 🗺️ PRODUCT MAP (Current State)

```
SCHOOLGLE PLATFORM
│
├── 🏠 LANDING (marketing pages)
│   ├── /                        → Main landing
│   ├── /modules                → Module showcase
│   ├── /pricing               → Pricing page
│   └── /legacy/ofsted         → Old Ofsted marketing page
│
├── 🔐 AUTH
│   ├── /login                 → Login page (Google/Microsoft SSO)
│   ├── /signup                → Signup page
│   └── /auth/callback         → OAuth callback
│
├── 📊 DASHBOARD (Protected)
│   ├── /dashboard             → Main Risk Dashboard ✅ WORKS
│   ├── /dashboard/action-plan → Strategic Actions 🔴 BROKEN
│   ├── /dashboard/sef         → SEF Builder ✅ WORKS (not in nav)
│   ├── /dashboard/sdp         → SDP Builder ✅ WORKS (not in nav)
│   ├── /dashboard/risk        → Risk Profile ❓ UNTESTED
│   ├── /evidence              → Evidence Library ✅ WORKS
│   ├── /timeline              → Audit Log ⚠️ NOT CALENDAR
│   ├── /packs                 → Governor Packs ❓ UNTESTED
│   ├── /marketplace           → App Store ❓ UNTESTED
│   └── /toolbox               → Tools ❓ UNTESTED
│
├── 🔧 ADMIN
│   ├── /admin                 → Org Admin
│   ├── /admin/super           → Super Admin
│   └── /admin/features        → Feature Flags
│
└── 📦 SEPARATE APPS (not linked)
    ├── Ed Staff               → Staff AI assistant
    └── Ed Parent              → Parent AI assistant
```

---

## 🎯 Supabase Tables Summary

| Table | Used By | Purpose |
|-------|---------|---------|
| `actions` | Action Plan, Dashboard | Strategic improvement actions |
| `evidence_items` | Evidence Library | Uploaded files mapped to framework |
| `ofsted_assessments` | Dashboard, SEF, SDP | Self-ratings per area |
| `sef_documents` | SEF Builder | Generated SEF versions |
| `sdp_documents` | SDP Builder | School Development Plans |
| `audit_log` | Timeline | Activity tracking |
| `organizations` | All pages | Multi-tenant orgs |
| `organization_members` | Auth | User ↔ Org mapping |
| `notifications` | Bell icon | User notifications |
| `super_admins` | Admin | Super admin users |

---

## 🛠️ NEXT STEPS

1. **FIX** the Action Plan AbortError (Priority 1)
2. **ADD** SEF/SDP to sidebar navigation (5 min fix)
3. **DECIDE** on the calendar/staffing feature
4. **SURFACE** the OfstedFrameworkView_Legacy tracker
5. **TEST** all pages systematically
6. **DOCUMENT** what each feature does

Would you like me to start with fixing the Action Plan page?

---

*End of Audit Document*
