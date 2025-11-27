# Feature Inventory: Vercel-Schoolgle Repository

**2 Years of Development - Asset Catalogue**

This document captures all valuable features, patterns, and ideas from the Vercel-Schoolgle repo that can be reused across Schoolgle products.

---

## 🏆 Tier 1: Production-Ready Features

### 1. Universal Task System
**Location:** `types/universal-task.ts`, `app/school-business-manager/estates/maintenance/page.tsx`

A comprehensive cross-module task management system. This is GOLD.

```typescript
// Core types
Module: 'estates' | 'teaching' | 'finance' | 'hr' | 'compliance'
Priority: 'urgent' | 'high' | 'normal' | 'low'
Status: 'open' | 'in_progress' | 'completed' | 'cancelled'
Visibility: 'personal' | 'team' | 'school' | 'trust'
```

**Features:**
- ✅ Cross-module task types (heating, plumbing, electrical, fire safety, etc.)
- ✅ Risk assessment matrix (likelihood × impact)
- ✅ Task delegation & escalation
- ✅ Task dependencies (blocks, precedes, related)
- ✅ Comments/notes system
- ✅ File attachments
- ✅ Calendar integration (ICS, Google, Outlook, Apple)
- ✅ Notification preferences
- ✅ Task analytics & reporting
- ✅ Ed AI integration ("Ask Ed" on every task)

**Reuse in:** Action Planning, Monday Dashboard, ALL modules

---

### 2. Compliance Centre
**Location:** `app/school-business-manager/estates/compliance/page.tsx`

Full statutory compliance tracking aligned with DfE 2025 standards.

**Features:**
- ✅ 50+ pre-built compliance templates
- ✅ Aligned with HSE, DfE GEMS, RIDDOR, COSHH, LOLER
- ✅ RAG (Red/Amber/Green) status dashboard
- ✅ Critical alerts with escalation
- ✅ Category drill-down views
- ✅ Three view modes (Cards, List, Table)
- ✅ Schedules management
- ✅ Evidence types (certificates, photos, logs, sensor readings)
- ✅ Retention periods per template
- ✅ Custom fields per template
- ✅ Trust-level template locking

**Categories covered:**
- Fire Safety
- Water Hygiene / Legionella
- Electrical Safety
- Gas Safety
- Health & Safety
- Structural / Building
- Security
- Environmental

**Reports:**
- Trustee Board Pack (PDF)
- Governors Report (PDF)
- Audit Trail Export (Excel)
- Evidence Log (ZIP)

**Reuse in:** Schoolgle Compliance suite, Ofsted evidence gathering

---

### 3. Statutory Compliance Templates
**Location:** `lib/compliance/templates.ts`

Pre-configured templates with UK legislation references.

**Example Template:**
```typescript
{
  id: 'legionella-risk-assessment',
  name: 'Legionella Risk Assessment',
  legislation_reference: ['HSE L8', 'COSHH 2002'],
  default_frequency: 'biennial',
  warning_days: 60,
  critical_days_overdue: 30,
  risk_if_missed: 'critical',
  required_evidence_types: ['inspection_report', 'certificate'],
  evidence_retention_years: 5,
  escalation_path: ['site_team', 'sbm', 'head_teacher', 'trustees', 'hse_reportable'],
  custom_fields: [...]
}
```

**Reuse in:** Policy Hub, Risk Register, Safeguarding

---

### 4. Energy Dashboard
**Location:** `app/energy-dashboard/`, `components/energy-dashboard/`

Real utility monitoring with Google Drive CSV integration.

**Features:**
- ✅ KPI cards (total kWh, total cost, avg monthly, cost per kWh)
- ✅ Multi-school filtering
- ✅ Meter-level filtering
- ✅ Energy type filtering (electricity, gas)
- ✅ Date range selection
- ✅ Charts & visualizations
- ✅ Data tables
- ✅ Anomaly detection
- ✅ Google Drive sync
- ✅ CSV export
- ✅ Insights panel

**Reuse in:** Schoolgle Estates, Carbon Reporting

---

### 5. Risk Assessment Matrix Component
**Location:** `components/projects/risk-assessment-matrix.tsx`

Visual 5×5 risk matrix with interactive selection.

**Features:**
- ✅ Likelihood × Impact grid
- ✅ Color-coded risk levels (green → red)
- ✅ Click to select risk score
- ✅ Auto-calculated risk score
- ✅ RAG rating output

**Reuse in:** Risk Register, Incident Logger, Actions, Compliance

---

## 🥈 Tier 2: Valuable Patterns & Components

### 6. Workspace Layout (Split-Screen)
**Location:** Multiple pages (governance, estates, hr)

iPad-style workspace with split-screen app loading.

**Features:**
- ✅ App launcher (iOS grid style)
- ✅ Single / Vertical / Horizontal split modes
- ✅ Cross-module app switching
- ✅ Category-based color coding
- ✅ Embedded app loading via iframe

**Pattern worth extracting** - but should use component loading instead of iframes.

---

### 7. Module Theming System
**Location:** `lib/themes/module-themes.ts`, `app/components/ModuleTheme.tsx`

Consistent color theming per module.

```typescript
modules: {
  estates: { color: 'cyan', gradient: 'from-cyan-500 to-teal-600' },
  compliance: { color: 'red', gradient: 'from-red-500 to-rose-600' },
  hr: { color: 'purple', gradient: 'from-purple-500 to-violet-600' },
  finance: { color: 'green', gradient: 'from-green-500 to-emerald-600' },
  teaching: { color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
}
```

**Reuse in:** All Schoolgle products for visual consistency

---

### 8. Category Card Component
**Location:** `components/compliance/ComplianceCategoryCard.tsx`

Expandable category cards with status indicators.

**Reuse in:** Ofsted Framework categories, SIAMS strands

---

### 9. Schedules View Component
**Location:** `components/compliance/SchedulesView.tsx`

Calendar-style view of upcoming compliance tasks.

**Reuse in:** Action Planning, Monday Dashboard

---

### 10. Ed AI Chat Widget Variants
**Location:** `components/ed/`

Multiple Ed widget implementations:
- `SimpleEdChatWidget.tsx` - Basic text chat
- `LiveEdChatWidget.tsx` - Voice integration
- `PublicEdChatWidget.tsx` - Public website embed

**Features:**
- ✅ Tiered pricing awareness (Basic/Premium/Enterprise)
- ✅ Voice input/output
- ✅ Function calling (create tasks, search)
- ✅ Module-aware context

---

## 🥉 Tier 3: Ideas & Features to Develop

### 11. Estates Apps (Partially Built)

| App | Status | Location |
|-----|--------|----------|
| Maintenance/Helpdesk | 70% | `estates/maintenance/` |
| Asset Management | 30% | `estates/assets/` |
| 3-Year Estates Plan | 20% | `estates/estates-plan/` |
| Incident Management | 20% | `estates/incidents/` |
| Projects/Requests | 40% | `estates/projects/` |

---

### 12. HR Apps (Partially Built)

| App | Status | Location |
|-----|--------|----------|
| Maternity Calculator | 90% | `hr/Maternity_Leave_Calculator/` |
| Staff Directory | 20% | Planned |
| Leave Management | 20% | Planned |
| Performance Reviews | 20% | Planned |
| Wellbeing | 10% | Planned |

---

### 13. Teaching Hub (Partially Built)

| App | Status | Location |
|-----|--------|----------|
| Lesson Planner | 40% | `teachers-hub/lesson-planner/` |
| Story Creator | 40% | `teachers-hub/story-creator/` |

---

### 14. Finance Apps (Planned)

| App | Status |
|-----|--------|
| Budget Planner | Planned |
| Invoice Processing | Planned |
| Purchase Orders | Planned |
| Financial Reports | Planned |

---

## 🔌 API Endpoints to Review

```
/api/maintenance-requests     - Universal task CRUD
/api/compliance/stats         - Compliance dashboard stats
/api/compliance/schedules     - Schedule management
/api/scan/{id}                - Website compliance scanning
/energy-dashboard/api/        - Energy data endpoints
```

---

## 📦 Reusable Components Inventory

| Component | Location | Reuse Priority |
|-----------|----------|----------------|
| `RiskAssessmentMatrix` | `components/projects/` | HIGH |
| `KPICards` | `components/energy-dashboard/` | HIGH |
| `FilterPanel` | `components/energy-dashboard/` | MEDIUM |
| `DataTable` | `components/energy-dashboard/` | MEDIUM |
| `SchedulesView` | `components/compliance/` | HIGH |
| `CategoryDrillDown` | `components/compliance/` | MEDIUM |
| `ComplianceCategoryCard` | `components/compliance/` | MEDIUM |
| `SimpleEdChatWidget` | `components/ed/` | HIGH |
| `ThemeToggle` | `app/components/` | Already have |
| `ModuleTheme` | `app/components/` | HIGH |

---

## 🗄️ Database Migrations Worth Reviewing

```
supabase/migrations/
├── 20251006_compliance_multi_tenancy.sql      ⭐ Multi-tenant compliance
├── 20251006_asset_register_integration.sql    ⭐ Asset management
├── 20251007_my_day_tasks_system.sql           ⭐ Personal dashboard tasks
├── 20251007_compliance_safe_install.sql       ⭐ Safe upsert patterns
├── 20251025_schoolgle_expansion_schema.sql    ⭐ Full expansion schema
└── 20250115_universal_task_system.sql         ⭐ Universal tasks
```

---

## 💡 Key Ideas to Implement

### From Universal Tasks:
1. **Cross-module task visibility** - personal → team → school → trust
2. **Task escalation chains** - auto-escalate overdue tasks
3. **Calendar sync** - export to Google/Outlook/Apple
4. **Ed AI on every task** - "Ask Ed for help"

### From Compliance Centre:
1. **Template library** - pre-built, legislation-linked
2. **Evidence retention** - auto-archive after X years
3. **Escalation paths** - site → SBM → Head → Trustees → HSE
4. **Board pack generation** - one-click governor reports

### From Estates:
1. **Helpdesk ticketing** - staff submit requests
2. **Risk assessment on creation** - score every task
3. **Contractor management** - track external work
4. **3-year planning** - strategic estates roadmap

---

## 🎯 Recommended Integration Priority

### Week 1-2: Quick Wins
1. **RiskAssessmentMatrix** → Add to Action Planning
2. **Module Theming** → Unify visual style
3. **KPI Cards pattern** → Monday Dashboard

### Week 3-4: Compliance Suite
1. **Compliance Templates** → Rebuild as Schoolgle Compliance
2. **Schedules View** → Reuse pattern
3. **Category Cards** → Reuse pattern

### Week 5-6: Estates Module
1. **Universal Tasks** → Merge with our actions
2. **Energy Dashboard** → Port directly
3. **Helpdesk** → New build using patterns

### Week 7-8: Polish
1. **Ed AI variants** → Standardize
2. **Workspace layout** → Extract to shared component
3. **Reports generation** → Board packs, exports

---

## ✅ Summary

**Total development effort captured:** ~2 years
**Reusable code value:** HIGH
**Recommended approach:** Cherry-pick patterns, rebuild core apps

The Universal Task System and Compliance Centre are particularly valuable - they represent significant thought and development that should be preserved and enhanced, not discarded.

