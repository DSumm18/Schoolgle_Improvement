# 🚀 Inspection Readiness - Run + Navigate Pack

> Generated: 2026-01-14 | Version: 1.0
>
> **Purpose:** Complete reference for running, navigating, and testing the Inspection Readiness module end-to-end.

---

## 📍 Route Reference

### 1. Login
| Property | Value |
|----------|-------|
| **URL Path** | `/login` |
| **File Path** | `apps/platform/src/app/(auth)/login/page.tsx` |
| **Required Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Required Tables** | `auth.users` (Supabase Auth) |
| **Notes** | Supports Google + Microsoft SSO. Redirects to `/dashboard` on success. |

---

### 2. Organization Selection (Onboarding)
| Property | Value |
|----------|-------|
| **URL Path** | `/onboarding/select-school` |
| **File Path** | `apps/platform/src/app/(dashboard)/onboarding/select-school/page.tsx` |
| **Required Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Required Tables** | `organizations`, `organization_members`, `users` |
| **Notes** | Shown to new users without an organization. Uses `OrgSwitcher` in sidebar after initial setup. |

---

### 3. Inspection Readiness Landing (Risk Dashboard)
| Property | Value |
|----------|-------|
| **URL Path** | `/dashboard` |
| **File Path** | `apps/platform/src/app/(dashboard)/dashboard/page.tsx` |
| **Required Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY` (for AI features) |
| **Required Tables** | `organizations`, `evidence_items`, `ofsted_assessments`, `sdp_documents`, `actions` |
| **Notes** | Main dashboard showing risk profile, evidence coverage, and priority actions. Uses `/api/risk/profile` for risk calculations. |

---

### 4. Actions / Priorities (Strategic Action Plan)
| Property | Value |
|----------|-------|
| **URL Path** | `/dashboard/action-plan` |
| **File Path** | `apps/platform/src/app/(dashboard)/dashboard/action-plan/page.tsx` |
| **Required Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Required Tables** | `actions`, `ofsted_assessments`, `notifications` |
| **Features** | Create action, assign owner, link evidence, track status, export PDF |
| **Components** | `ActionsDashboard`, `ActionModal` |

---

### 5. Evidence Library
| Property | Value |
|----------|-------|
| **URL Path** | `/evidence` |
| **File Path** | `apps/platform/src/app/(dashboard)/evidence/page.tsx` |
| **Required Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (for uploads) |
| **Required Tables** | `evidence_items`, `actions` (for linked actions display) |
| **API Endpoint** | `/api/evidence` |
| **Notes** | Grid/List view toggle, category filters, bulk actions. Uses `EvidenceUploader` component. |

---

### 6. Self-Evaluation Form (SEF)
| Property | Value |
|----------|-------|
| **URL Path** | `/dashboard/sef` |
| **File Path** | `apps/platform/src/app/(dashboard)/dashboard/sef/page.tsx` |
| **Required Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY` |
| **Required Tables** | `sef_documents`, `ofsted_assessments`, `evidence_matches`, `actions` |
| **Features** | AI generation per section, version history, publish/lock, export HTML/PDF |
| **Components** | `SEFSectionEditor`, `SEFVersionHistory` |

---

### 7. School Development Plan (SDP)
| Property | Value |
|----------|-------|
| **URL Path** | `/dashboard/sdp` |
| **File Path** | `apps/platform/src/app/(dashboard)/dashboard/sdp/page.tsx` |
| **Required Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY` |
| **Required Tables** | `sdp_documents`, `ofsted_assessments`, `actions` |
| **Features** | AI-suggested priorities, drag-and-drop builder, budget tracking, export HTML |
| **Components** | `SDPBuilder` |

---

### 8. Audit Log (Timeline)
| Property | Value |
|----------|-------|
| **URL Path** | `/timeline` |
| **File Path** | `apps/platform/src/app/(dashboard)/timeline/page.tsx` |
| **Required Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Required Tables** | `audit_log` |
| **Features** | Immutable timeline, category filters (auth/action/evidence/sef), before/after state diff |
| **Notes** | Shows last 100 entries. Expandable rows for detailed state changes. |

---

### 9. Evidence Matrix (Embedded in Dashboard)
| Property | Value |
|----------|-------|
| **URL Path** | `/dashboard` (embedded component) |
| **File Path** | `apps/platform/src/app/(dashboard)/dashboard/page.tsx` |
| **Required Tables** | `ofsted_assessments`, `evidence_items` |
| **Notes** | The evidence coverage matrix is displayed on the main dashboard. It shows coverage across the 4 Ofsted inspection areas. No separate dedicated route. |

---

## 🔧 Environment Variables Required

```env
# Core Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://ygquvauptwyvlhkyxkwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# AI Features (REQUIRED for SEF/SDP generation)
OPENROUTER_API_KEY=<your-openrouter-key>

# Optional - Production URL
NEXT_PUBLIC_APP_URL=https://www.schoolgle.co.uk
```

---

## 🗄️ Supabase Tables Summary

| Table | Purpose | Used By |
|-------|---------|---------|
| `auth.users` | Supabase Auth users | Login, all auth flows |
| `users` | App user profiles | Dashboard, permissions |
| `organizations` | Schools/Trusts | Org switcher, all pages |
| `organization_members` | User ↔ Org mapping | Authorization |
| `actions` | Strategic action items | Action Plan, Evidence linking |
| `evidence_items` | Uploaded evidence files | Evidence Library |
| `evidence_matches` | AI-matched evidence ↔ framework | SEF generation |
| `ofsted_assessments` | Self-assessment ratings per area | Dashboard, SEF, SDP |
| `sef_documents` | Generated SEF documents | SEF page |
| `sdp_documents` | School Development Plans | SDP page |
| `audit_log` | Immutable activity log | Timeline page |
| `notifications` | User notifications | NotificationBell |
| `super_admins` | Super admin users | Admin access |

---

## ▶️ Run Command

From the **repository root** (`c:\Git\Schoolgle_Improvement`):

```bash
cd apps/platform && npm run dev
```

**Or from repo root in one command:**

```bash
npm run dev --prefix apps/platform
```

### Expected Output:
```
   ▲ Next.js 16.0.3
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000
```

**Port:** `3000` (default Next.js dev port)

---

## 🧪 10-Step Manual Test Script: Actions Engine

> **Goal:** Create action → Assign owner → Add evidence → Change status → Verify audit

### Prerequisites
1. App running on `http://localhost:3000`
2. Logged in with a valid Google/Microsoft account
3. Organization selected (or create one via onboarding)

---

### Step 1: Navigate to Action Plan
1. Click **"Action Plan"** in the left sidebar (under STRATEGIC INTELLIGENCE)
2. **Verify:** Page loads showing "Strategic Action Plan" title and stats cards

---

### Step 2: Open New Action Modal
1. Click the blue **"+ New Strategic Action"** button (top right)
2. **Verify:** Modal appears with form fields

---

### Step 3: Create New Action
1. Fill in the form:
   - **Description:** "Improve pupil premium outcomes tracking"
   - **Priority:** Select "High" from dropdown
   - **Category:** Select an Ofsted area (e.g., "Quality of Education")
   - **Due Date:** Pick a date 14 days from now
2. Click **"Save Action"** / **"Create"** button
3. **Verify:** Modal closes, new action appears in the dashboard list

---

### Step 4: Assign Owner to Action
1. Click on the newly created action to edit it
2. In the edit modal/panel, find the **"Owner"** or **"Assignee"** field
3. Enter owner name: "Sarah Thompson"
4. Click **Save**
5. **Verify:** Action now shows "Sarah Thompson" as assignee

---

### Step 5: Navigate to Evidence Library
1. Click **"My Evidence"** in the sidebar (under NAVIGATOR)
2. **Verify:** Evidence Library page loads

---

### Step 6: Upload Evidence
1. Click **"+ Upload New Evidence"** button
2. Select or drag a test file (PDF, Word, or image)
3. Set category to match your action (e.g., "Quality of Education")
4. Add title: "PP Tracking Dashboard Screenshot"
5. Click **Upload**
6. **Verify:** Evidence appears in the library grid

---

### Step 7: Link Evidence to Action
1. Go back to **Action Plan** (`/dashboard/action-plan`)
2. Edit the action you created
3. Find **"Linked Evidence"** field
4. Click **"Link Evidence"** or the attach button
5. Select the evidence you just uploaded
6. **Save** the action
7. **Verify:** Action shows linked evidence indicator

---

### Step 8: Change Action Status
1. On the Action Plan page, find your action
2. Click to edit, or use inline status dropdown
3. Change status from **"Open"** to **"In Progress"**
4. **Save**
5. **Verify:** Action card/row updates to show "In Progress" status badge

---

### Step 9: Navigate to Audit Timeline
1. Click **"Audit Timeline"** in the sidebar (under NAVIGATOR)
2. **Verify:** Timeline page loads with "System Integrity Audit" header

---

### Step 10: Verify Audit Entry
1. In the timeline, look for your recent activity
2. Use the category filter: Select **"Strategic Actions"**
3. Look for entries with:
   - Action: "Action Created" or "Action Updated"
   - Your email as actor
   - Recent timestamp
4. Click an entry to expand it
5. **Verify:** 
   - Previous State shows before values (or "No previous state" for new)
   - Resulting State shows the action data including title, status, assignee

---

## ✅ Test Completion Checklist

| Step | Task | Status |
|------|------|--------|
| 1 | Navigate to Action Plan | ☐ |
| 2 | Open New Action Modal | ☐ |
| 3 | Create New Action | ☐ |
| 4 | Assign Owner | ☐ |
| 5 | Navigate to Evidence Library | ☐ |
| 6 | Upload Evidence | ☐ |
| 7 | Link Evidence to Action | ☐ |
| 8 | Change Action Status | ☐ |
| 9 | Navigate to Audit Timeline | ☐ |
| 10 | Verify Audit Entry | ☐ |

---

## 📊 Quick Navigation Reference

| Screen | Sidebar Section | URL |
|--------|-----------------|-----|
| Risk Dashboard | STRATEGIC INTELLIGENCE | `/dashboard` |
| Action Plan | STRATEGIC INTELLIGENCE | `/dashboard/action-plan` |
| Risk Profile | STRATEGIC INTELLIGENCE | `/dashboard/risk` |
| My Evidence | NAVIGATOR | `/evidence` |
| Governor Packs | NAVIGATOR | `/packs` |
| Audit Timeline | NAVIGATOR | `/timeline` |
| SEF Builder | (From Dashboard link) | `/dashboard/sef` |
| SDP Builder | (From Dashboard link) | `/dashboard/sdp` |
| Settings | SETTINGS | `/dashboard/settings` |
| Billing | SETTINGS | `/dashboard/account` |

---

## 🔗 Direct Links (when running locally)

- **Login:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/dashboard
- **Action Plan:** http://localhost:3000/dashboard/action-plan
- **Evidence Library:** http://localhost:3000/evidence
- **SEF Builder:** http://localhost:3000/dashboard/sef
- **SDP Builder:** http://localhost:3000/dashboard/sdp
- **Audit Timeline:** http://localhost:3000/timeline

---

*End of Run + Navigate Pack*
