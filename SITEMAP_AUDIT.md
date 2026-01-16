# Schoolgle Platform Sitemap & Inventory Audit

## 1. Visual Sitemap (Tree)
```text
/ (Landing Page)
├── /auth
│   ├── /login
│   ├── /signup
│   └── /callback
├── /dashboard (Unified Sidebar Area)
│   ├── /dashboard (Risk Dashboard / Live Intelligence)
│   ├── /dashboard/evidence (Navigator: My Evidence)
│   ├── /dashboard/interventions (Precision: Interventions)
│   ├── /dashboard/action-plan (School Improvement)
│   ├── /dashboard/risk (Risk Profile)
│   ├── /dashboard/account (Billing)
│   └── /dashboard/settings (Global Settings)
├── /packs (Navigator: Governor Packs)
├── /timeline (Navigator: Audit Timeline)
├── /onboarding (Multi-step flow)
├── /insights (School Insight Reports)
├── /toolbox (AI Workspace)
└── /modules (Directory of feature-specific landing pages)
    ├── /governance
    ├── /hr
    ├── /finance
    └── /send
```

## 2. Route Map (Detail)

| Route Path | File Path | Linked in Nav | Description | Status |
| :--- | :--- | :---: | :--- | :--- |
| `/` | `src/app/page.tsx` | No | Marketing Landing Page | **Active** |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | **Yes** | Main dashboard with Risk Profile summary | **Active** |
| `/dashboard/evidence` | `src/app/(dashboard)/evidence/page.tsx` | **Yes** | Evidence Library & Framework Matching | **Active** |
| `/dashboard/interventions` | `src/app/(dashboard)/interventions/page.tsx` | **Yes** | Student Intervention Tracker | **Active** |
| `/packs` | `src/app/(dashboard)/packs/page.tsx` | **Yes** | Governor Pack Builder (Navigator MVP) | **Active** |
| `/timeline` | `src/app/(dashboard)/timeline/page.tsx` | **Yes** | Historical Audit Timeline (Navigator MVP) | **Active** |
| `/dashboard/action-plan` | `src/app/(dashboard)/dashboard/action-plan/page.tsx` | **Yes** | Strategic SDP planning | **Active** |
| `/dashboard/risk` | `src/app/(dashboard)/dashboard/risk/page.tsx` | **Yes** | Detailed Risk Analysis | **Active** |
| `/onboarding` | `src/app/onboarding/page.tsx` | No | User/Org setup flow | **Active** |
| `/toolbox` | `src/app/toolbox/page.tsx` | No | AI Assistant sandbox | **Legacy** |
| `/governance` | `src/app/governance/page.tsx` | No | Legacy module landing | **Orphaned** |

## 3. Component Inventory

### Core Framework (Used)
- `OrgSwitcher.tsx`
- `SupabaseAuthProvider.tsx`
- `NotificationBell.tsx`
- `EdWidgetWrapper.tsx`
- `UpgradeModal.tsx`

### Feature Components (Used)
- `EvidenceUploader.tsx` (Evidence Library)
- `PackEditor.tsx` (Governor Packs)
- `ApprovalPanel.tsx` (Governor Packs)
- `RiskCard.tsx` (Dashboard)
- `InterventionTimeline.tsx` (Dashboard)

### Orphaned Components (Not in active routes)
- `website/BlogSection.tsx`
- `website/Testimonials.tsx`
- `website/TrustSection.tsx`
- `website/AudienceSection.tsx`
- `toolbox/Workspace.tsx`

## 4. API Inventory

| Endpoint | Purpose | Method |
| :--- | :--- | :---: |
| `/api/auth/profile` | Sync user auth data | POST/GET |
| `/api/evidence` | Manage evidence files & matches | POST |
| `/api/packs` | Governor Pack CRUD & Versions | POST/PATCH |
| `/api/timeline` | Fetch audit timeline entries | GET |
| `/api/waitlist` | Capture pilot program leads | POST |
| `/api/onboarding/complete`| Finalize org setup | POST |

## 5. Database Schema (Tables)

| Table Name | Purpose |
| :--- | :--- |
| `organizations` | Multi-tenant core |
| `organization_members` | RBAC & Membership |
| `organization_modules` | Feature flagging per tenant |
| `packs` / `pack_versions` | Governor Pack management |
| `evidence_items` | Navigator evidence storage references |
| `timeline_entries` | Sequential audit log |
| `ofsted_assessments` | Framework assessment state |
| `waitlist` | Marketing data |

## 6. Recommended Navigation Structure

To unify the transition between "Legacy Dashboard" and "Navigator MVP", the side-bar should be structured as follows:

1. **Strategic Intelligence**
   - **Risk Dashboard** (`/dashboard`)
   - **Action Plan** (`/dashboard/action-plan`)
   - **Risk Profile** (`/dashboard/risk`)
2. **Navigator MVP**
   - **My Evidence** (`/dashboard/evidence`)
   - **Governor Packs** (`/packs`)
   - **Audit Timeline** (`/timeline`)
3. **Operations**
   - **Interventions** (`/dashboard/interventions`)
4. **Global**
   - **Settings** (`/dashboard/settings`)
   - **Billing** (`/dashboard/account`)

---
**Audit Generated:** 2026-01-12
