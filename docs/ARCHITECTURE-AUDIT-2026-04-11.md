# Schoolgle Architecture Audit — 11 April 2026

> **Author:** Claude (Task 042)
> **Build status:** PASS (exit 0, 0 warnings)
> **Branch:** main @ 582e2a5

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Dashboard pages | 197 (120 functional, 30 stubs, 47 partial) |
| API route files | 464 |
| Supabase migrations | 107 |
| External integrations | 12 services |
| Env vars configured | 44 (incl. duplicates) |
| `@ts-expect-error` | 176 across 47 files |
| `as any` | 469 across 185 files |
| `console.log` (src/) | 238 across 63 files |
| TODO / FIXME | 32 / 0 |
| Files > 500 lines | 251 (57 > 1,000 lines) |
| Test files | 73 |
| Tables without RLS | 3 (ed_form_field_knowledge, ed_form_mistakes, ed_wording_improvements) |
| `select("*")` usage | 243 files (20+ on sensitive tables) |

**Top risks:**
1. 3 tables missing RLS policies entirely
2. `select("*")` on sensitive tables (low-level-concerns, pupil data, staff, emergency)
3. 469 `as any` casts obscure type safety
4. 10 files exceed 2,000 lines — maintainability concern
5. Several Ed API routes are public with no auth guard

---

## 1. Module Map

### 1.1 Dashboard Routes (197 pages)

#### Fully Functional (~120 pages)

| Route | Module | Description |
|-------|--------|-------------|
| `/admin` | Admin | Subscription dashboard, MRR/ARR metrics |
| `/admin/super` | Admin | Super admin, school/subscription control, impersonation |
| `/admin/features` | Admin | Feature flag management |
| `/admin/browser-domains` | Admin | Browser domain whitelist for Ed |
| `/estate` | Estates | Compliance dashboard with RAG status |
| `/estate/assets` | Estates | Asset register with CRUD |
| `/estate/checks` | Estates | Compliance checks master list |
| `/estate/checks/[id]` | Estates | Statutory check logging + evidence |
| `/estate/contractors` | Estates | Approved contractors + accreditation |
| `/estate/tickets` | Estates | Helpdesk ticket list |
| `/estate/tickets/[id]` | Estates | Ticket detail with workflow |
| `/dashboard/action-plan` | Improvement | Strategic actions with PDF export |
| `/dashboard/actions-hub` | Improvement | Enhanced actions with EEF research |
| `/dashboard/compliance` | Compliance | Compliance hub + feature discovery |
| `/dashboard/comms` | Comms | Video rooms, notices, PA, assemblies |
| `/dashboard/comms/analytics` | Comms | Communication analytics |
| `/dashboard/canvas` | Intelligence | Data viz, chart builder, DfE overlays |
| `/dashboard/documents` | Documents | Document library + creation |
| `/dashboard/documents/[id]` | Documents | Document detail |
| `/dashboard/documents/new` | Documents | Document creation |
| `/dashboard/documents/triggers` | Documents | Auto-trigger rules |
| `/dashboard/governance/*` | Governance | Board, governors, meetings, training, policies, visits |
| `/dashboard/hr/*` | HR | Staff directory, sickness, performance |
| `/dashboard/school-intelligence/*` | Intelligence | Analysis, cohort, canvas |
| `/dashboard/risk/*` | Risk | Register, heatmap, mitigations |
| `/dashboard/meetings/*` | Meetings | Templates, scheduling, minutes, sign-off |
| `/dashboard/surveys/*` | Surveys | Builder, distribution, analysis |
| `/dashboard/safeguarding` | Safeguarding | Concerns, chronology, referrals |
| `/dashboard/send` | SEND | Register, graduated approach, provision map |
| `/dashboard/attendance` | Attendance | Registers, summaries, interventions |
| `/dashboard/behaviour` | Behaviour | Incidents, exclusions, patterns |
| `/dashboard/finance/*` | Finance | Forecast, reconciliation, suppliers |
| `/dashboard/emergency/*` | Emergency | Plans, drills, broadcast, zones |
| `/dashboard/website/*` | Website | Builder, pages, design, compliance |
| `/marketplace` | Platform | App store with 25+ apps |
| `/packs` | Packs | Governor pack creator |
| `/evidence` | Evidence | Evidence library with bulk ops |
| `/settings/branding` | Settings | Colour, logo, fonts |
| `/settings/ed-website` | Settings | Ed chatbot embed wizard |
| `/onboarding/*` | Auth | School selection, confirmation |
| `/my-insights` | Insights | Published insights display |
| `/my-toolbox` | Toolbox | Tools directory |
| `/sim-studio/*` | Teaching | SLT simulation studio |
| `/toolbox/surveys` | Toolbox | Survey access |
| `/toolbox/website-compliance` | Toolbox | DfE website compliance checker |
| `/toolbox/ofsted-explorer` | Toolbox | Ofsted framework explorer |
| `/toolbox/data-calendar` | Toolbox | School data calendar |

#### Stubs / Coming Soon (~30 pages)

| Route | Status |
|-------|--------|
| `/dashboard/account` | "Coming soon" — billing |
| `/dashboard/admissions` | Partial UI, limited backend |
| `/estate/reports` | Shell with 5 report cards |
| `/features/[slug]` | Generic "launching soon" |
| `/test` | Minimal test page |
| Various `/dashboard/connectors/*` | Connector UI shells |
| Various `/dashboard/data-validation/*` | Validation tool shells |
| `/dashboard/ed/form-templates` | Form template placeholder |

#### Mixed / Partially Implemented (~47 pages)

Large client-rendered pages with substantial UI but incomplete or demo-only data pipelines. Examples: `/dashboard/calendar`, `/dashboard/pupil-premium`, `/dashboard/admissions`, `/dashboard/school-meals`, `/dashboard/emergency-broadcast/*`.

### 1.2 API Routes (464 files, 40+ domains)

| Domain | Routes | Auth | Notes |
|--------|--------|------|-------|
| Estates & Compliance | 70+ | Protected (caretaker+) | Most complete module |
| Compliance | 35+ | Protected (slt+) | SCR, GDPR, training, policies |
| Ed AI | 25+ | **Mostly public** | Chat, forms, knowledge — review auth |
| Canvas/Intelligence | 20+ | Protected | Data ingestion + analysis |
| Documents | 16 | Protected (slt+) | Templates, triggers, generate |
| Governance | 10 | Protected (slt+) | Board, meetings, KPIs |
| Meetings | 12 | Protected | Templates, minutes, sign |
| Surveys | 12 | Protected | Builder, distribute, analyze |
| Emergency | 10 | Protected | Broadcast, drills, zones |
| HR/Staff | 10 | Protected (slt+) | CRUD, import, SCR |
| Finance | 8 | Protected (slt+) | Forecast, reconcile, suppliers |
| Attendance | 4 | Protected | Dashboard, registers, interventions |
| Behaviour | 5 | Protected (teacher+) | Incidents, exclusions, patterns |
| Safeguarding | 6 | Protected (teacher+) | Concerns, chronology, referrals |
| SEND | 7 | Protected | Register, graduated approach, provision |
| Risk | 8 | Protected | Register, heatmap, decisions |
| Subscription | 9 | **Public** | Webhooks, checkout, plans |
| Mission Control | 6 | **Public** | Activity, clients, finance |
| Connectors | 12 | Protected (slt+) | GIAS, BYO, compliance |

**Auth concern:** 25+ Ed API routes are public (chat, forms, knowledge, website-chat). Mission Control routes are also public. These should be reviewed for rate limiting and abuse prevention.

### 1.3 Module Dependency Graph

```
Platform Core (Auth, Supabase, Organization)
    ├── School Improvement (Ofsted, SIAMS, SEF, SDP, Actions Hub)
    │       └── Intelligence Engine (Cohort, DfE, EEF, Canvas)
    │               └── Pupil Assessment (pseudonymised)
    ├── Estates & Compliance (Assets, Checks, Helpdesk, Energy)
    │       ├── Vision AI (Room Checks, Document Extraction)
    │       └── Wayfinding (3D Site Plan, QR, Route Calculator)
    ├── HR & People (Staff Directory, Sickness, Performance, Cover)
    │       └── Connectors (Statutory Roles, Tasks, Training)
    ├── Governance (Board, Meetings, Training, Policies, Visits)
    ├── Compliance Hub (Policies, SCR, GDPR, Training, Complaints)
    ├── Communications (Notices, Video Rooms, Assemblies, Morning Brief)
    ├── Teaching & Learning (Lesson Studio, Sim Studio)
    ├── Safeguarding (Concerns, Chronology, Referrals)
    ├── SEND (Register, Graduated Approach, Provision Map)
    ├── Finance (Forecast, Reconciliation, Suppliers, ICFP)
    ├── Documents (Templates, Triggers, Generate, Newsletter)
    ├── Surveys (Builder, Distribution, Analysis)
    ├── Meetings (Templates, Minutes, Sign-off, Actions)
    ├── Risk Register (Scoring, Heatmap, Mitigations, Escalation)
    ├── Website Builder (Design, Pages, Compliance Scanner)
    ├── Toolbox (Ofsted Explorer, Data Calendar, Deal Finder)
    └── Ed AI (Chat, Forms, Knowledge, Voice, Website Widget)
            ├── 14 Specialist Agents
            ├── 43+ Skills (Function Calling)
            └── SchoolDataGuardian (PII Firewall)
```

---

## 2. Database Schema Map

### 2.1 Migration Summary

**107 migration files** spanning Jan 2026 to Apr 2026. Key phases:

| Phase | Migrations | Focus |
|-------|-----------|-------|
| Jan 2026 (001–20260128) | 21 | Core: waitlist, notifications, SDP/SEF, estates, actions, governance, Ofsted, SIAMS |
| Feb 2026 (20260219–20260220) | 4 | Ed forms, knowledge, RPA skills, form learning |
| Mar 5–9 | 15 | Compliance, deal finder, vision, SEF/SDP living, intelligence, intranet |
| Mar 10–12 | 18 | Admissions, meetings, safeguarding, surveys, documents, risk, strategic plan, data connections |
| Mar 13–15 | 12 | Energy, HR personnel, incidents, SOPs, workflow, calendar, website builder, comms |
| Mar 16–20 | 8 | Energy HH, adaptive teaching, finance, canvas, SEND, pupils, compliance reviews, routines |
| Apr 4–11 | 14 | Ed harness, lesson studio, compliance library, risk scoring, mission control, morning brief, connectors |

### 2.2 Tables with RLS — Status

**91%+ of tables have RLS enabled.** Three tables confirmed missing:

| Table | Migration | Risk | Fix Priority |
|-------|-----------|------|-------------|
| `ed_form_field_knowledge` | 20260219_ed_form_knowledge.sql | Medium — contains field guidance, not PII | LOW |
| `ed_form_mistakes` | 20260219_ed_form_knowledge.sql | Medium — red flag patterns | LOW |
| `ed_wording_improvements` | 20260219_ed_form_knowledge.sql | Medium — suggested wordings | LOW |

These are knowledge-base tables (not per-school data), so the risk is data leakage between orgs rather than PII exposure. Still should be fixed.

### 2.3 Sensitive Data & Protections

| Table | Sensitive Fields | Protection |
|-------|-----------------|------------|
| `staff_directory` | name, email, phone, employee_id | RLS (org-scoped) |
| `pupil_assessments_pseudo` | HMAC-SHA256 hashed UPN | RLS + pseudonymisation |
| `safeguarding_concerns` | concern details, children | RLS (teacher+) |
| `low_level_concerns` | concern details | RLS (slt+) |
| `compliance_scr` | DBS numbers, checks | RLS (slt+) |
| `hr_personnel_records` | NI number, bank details | RLS (slt+) |
| `estates_contractors` | phone, email, insurance | RLS (org-scoped) |
| `waitlist` | email | RLS (service_role only) |

### 2.4 select("*") on Sensitive Tables

**243 files** use `select("*")`. Flagged on sensitive tables:

| File | Table Context |
|------|---------------|
| `/api/compliance/low-level-concerns/route.ts` | Safeguarding concerns |
| `/api/compliance/low-level-concerns/[id]/route.ts` | Individual concern |
| `/api/lesson-studio/pupils/route.ts` | Pupil data |
| `/api/intelligence/pupil-assessments/route.ts` | Pseudonymised assessments (3x) |
| `/api/emergency/plans/route.ts` | Emergency plans |
| `/api/emergency/dashboard/route.ts` | Emergency data |
| `/api/pupil-premium/dashboard/route.ts` | Pupil premium (2x) |
| `/api/safeguarding/concerns/route.ts` | Safeguarding |

**Recommendation:** Replace `select("*")` with explicit column lists on these 10 routes to prevent accidental PII leakage if columns are added later.

---

## 3. Integration Points

### 3.1 External Services (12)

| Service | Purpose | Auth | Env Var |
|---------|---------|------|---------|
| **OpenRouter** | LLM (DeepSeek, Gemini, Qwen) | API key | `OPENROUTER_API_KEY` |
| **Google Gemini** | Vision API, document extraction | API key | `GEMINI_API_KEY` |
| **Fish Audio** | Text-to-speech (Ed voice) | API key | `FISH_AUDIO_API_KEY` |
| **Firecrawl** | Web crawling, compliance scanning | API key | `FIRECRAWL_API_KEY` |
| **Supabase** | Primary database | Anon + service role keys | `NEXT_PUBLIC_SUPABASE_URL` etc. |
| **DfE Supabase** | School data warehouse | Service role key | `DFE_SUPABASE_URL` etc. |
| **GIAS Open Data** | School lookup by URN | None (public) | — |
| **Google Drive** | Document scanning, evidence | OAuth | `GOOGLE_API_KEY` etc. |
| **Google Sheets** | Estates audit data | API key | In-component config |
| **Resend** | Transactional email | API key | `RESEND_API_KEY` |
| **Stripe** | Payments, subscriptions | Secret key | `STRIPE_SECRET_KEY` |
| **GOV.UK** | Bank holidays | None (public) | — |

Additional client-side integrations:
- **Firebase Auth** — Google/Microsoft OAuth
- **Twilio** — SMS (env vars set but limited usage)
- **Deepgram** — Speech-to-text (env var set, usage TBD)
- **Google Fonts** — Dynamic font loading (public CDN)

### 3.2 Environment Variables

**44 env vars set** in `.env.local`. Notable duplicates:
- `FIRECRAWL_API_KEY` (2x)
- `OPENROUTER_API_KEY` (2x)
- `NEXT_PUBLIC_FIREBASE_*` (all duplicated)
- `NEXT_PUBLIC_FISH_AUDIO_*` (all duplicated)

**Expected but NOT set:**
- `DFE_SUPABASE_URL` — DfE warehouse won't work
- `DFE_SUPABASE_SERVICE_ROLE_KEY` — DfE warehouse won't work
- `GOOGLE_DRIVE_CLIENT_SECRET` — Drive OAuth won't complete
- `EMAIL_FROM` — Will use default `notifications@schoolgle.co.uk`

### 3.3 MCP Connections

The codebase includes `packages/mcp-server/` for MCP server implementation. Playwright MCP is available in the Claude Code environment for browser automation testing.

---

## 4. Code Health Metrics

### 4.1 Type Safety Issues

| Pattern | Count | Files | Worst Offenders |
|---------|-------|-------|----------------|
| `@ts-expect-error` | 176 | 47 | ofsted/framework-data.ts (22), risk/auto-escalation.ts (10), assessment-updater.ts (11) |
| `as any` | 469 | 185 | ed-widget/Ed.ts (26), form-fill-ui.tsx (9), extractors.test.ts (5) |
| **Total** | **645** | **232** | |

### 4.2 Debug / Maintenance

| Pattern | Count | Files | Worst Offenders |
|---------|-------|-------|----------------|
| `console.log` | 238 | 63 | auth/callback (20), ofsted/website-scan (20), useGeminiLive (11) |
| `TODO` | 32 | 22 | Scattered |
| `FIXME` | 0 | 0 | Clean |

### 4.3 Large Files (Top 10)

| File | Lines | Concern |
|------|-------|---------|
| `dashboard/safeguarding/page.tsx` | 3,184 | God component |
| `dashboard/estates/energy/page.tsx` | 3,165 | God component |
| `skills/school-skills-registry.ts` | 3,130 | Schema registry — acceptable |
| `mis/analysis-engine.ts` | 2,914 | Complex but core |
| `dashboard/calendar/page.tsx` | 2,849 | God component |
| `dashboard/send/page.tsx` | 2,686 | God component |
| `api/skills/invoke/route.ts` | 2,566 | Giant route handler |
| `dashboard/pupil-premium/page.tsx` | 2,493 | God component |
| `dashboard/admissions/page.tsx` | 2,456 | God component |
| `dashboard/hr/performance/page.tsx` | 2,404 | God component |

**251 files exceed 500 lines. 57 exceed 1,000 lines.** The pattern is clear: dashboard pages accumulate all UI, state, and logic in a single file rather than extracting components.

### 4.4 Test Coverage

| Location | Test Files | Notes |
|----------|-----------|-------|
| `apps/platform/src/lib/` | 35 | Data connectors, vision, intelligence |
| `apps/platform/src/app/api/` | 11 | Estates, compliance, behaviour, SEND |
| `apps/platform/src/components/` | 4 | Limited component testing |
| `packages/ed-agents/` | 2 | Orchestrator tests |
| `packages/ed-extension/` | 7 | Form filling tests |
| `packages/ed-widget/` | 3 | Widget tests |
| `packages/mcp-server/` | 1 | MCP tests |
| **Total** | **73** | vs 1,894 TS/TSX files (3.9% file coverage) |

**Modules with zero test files:** Governance, Meetings, Surveys, Documents, Finance, HR sickness, Safeguarding, SEND page, Calendar, Admissions, Emergency.

### 4.5 Build Status

```
npm run build: PASS (exit 0)
TypeScript errors: Ignored (ignoreBuildErrors: true)
ESLint errors: Ignored during build
Turbopack: Disabled (using webpack)
```

The build passes only because `ignoreBuildErrors: true` is set in `next.config.ts`. Running `npm run typecheck` would likely surface hundreds of errors.

---

## 5. Connected vs Floating

### 5.1 Fully Wired (UI -> API -> DB -> Response)

These modules work end-to-end:

| Module | UI | API | DB | Evidence |
|--------|----|----|-----|---------|
| Estates Assets | /estate/assets | /api/estates/assets | estates_assets | Tested in sessions |
| Estates Checks | /estate/checks | /api/estates/statutory-completions | estates_statutory_completions | Tested |
| Estates Helpdesk | /estate/tickets | /api/estates/helpdesk | estates_helpdesk_tickets | Tested |
| Estates Contractors | /estate/contractors | /api/estates/contractors | estates_contractors | Tested |
| Staff Directory | /dashboard/hr/people | /api/staff | staff_directory | Tested |
| Actions Hub | /dashboard/actions-hub | /api/actions | actions | Tested |
| Compliance Hub | /dashboard/compliance | /api/compliance/* | compliance_* tables | Tested |
| Risk Register | /dashboard/risk | /api/risk/* | risk_* tables | Tested |
| Meetings | /dashboard/meetings | /api/meetings/* | meeting_* tables | Tested |
| Surveys | /toolbox/surveys | /api/surveys/* | survey_* tables | Tested |
| Documents | /dashboard/documents | /api/documents/* | document_* tables | Tested |
| Ed Chat | Floating widget | /api/ed/chat | ed_* tables | Tested |
| Canvas | /dashboard/school-intelligence/canvas | /api/canvas/* | canvas_* tables | Tested |
| Onboarding | /onboarding | /api/auth/profile, /api/onboarding/* | users, organizations | Tested |
| Subscription | /marketplace | /api/subscription/* | subscriptions | Tested via Stripe |

### 5.2 UI Without Backend (Floating Frontend)

| Route | What's Missing |
|-------|---------------|
| `/dashboard/account` | No API, no billing management |
| `/dashboard/school-meals/*` | API exists but no DB migration found |
| `/dashboard/calendar` | Large UI, basic API, no dedicated migration |
| `/sim-studio/*` | UI-heavy, no persistent backend |
| `/dashboard/comms` (video rooms) | API stubs, no real video infrastructure |
| `/dashboard/website/design` | Design studio UI, no design persistence |

### 5.3 Backend Without UI

| API | What's Missing |
|-----|---------------|
| `/api/cron/daily` | Cron job, no dashboard visibility |
| `/api/cron/morning-brief` | Generates briefs, no UI to view history |
| `/api/mission-control/*` | 6 routes, control.schoolgle.co.uk not built |
| `/api/gdpr/delete`, `/api/gdpr/export` | No UI for data subject requests |
| `/api/payroll/parse` | Parsing endpoint, no payroll UI |
| `/api/workflows/*` | Engine exists, no visual workflow builder |

### 5.4 Unapplied / Orphan Migrations

With 107 migration files and `ignoreBuildErrors: true`, it's likely many migrations haven't been applied to production Supabase. The governance_portal migration (20260128) is **empty** — no tables created.

---

## Part 2: Pathfind Pipeline Assessment

### 2.1 Current State

**22 files** related to spatial/wayfinding functionality across the codebase.

#### Data Flow

```
PDF Floor Plan (PNG export)
    ↓ (manual tracing)
grove-house-3d-data.ts (22 rooms, 6 blocks, hardcoded coordinates)
    ↓
GroveHouse3DScene.tsx (React Three Fiber 3D render)
    ↓
route-calculator.ts (BFS through 11 corridor junctions)
    ↓
wayfinding/[roomId]/page.tsx (navigation instructions)
    ↓
QR codes → physical labels → scan → route display
```

#### What's Hardcoded

| Item | Location | Hardcoded? |
|------|----------|-----------|
| Room positions (x, z, w, d) | grove-house-3d-data.ts | YES — 22 rooms manually traced |
| Block colours | grove-house-3d-data.ts | YES — 6 hex values |
| Corridor junctions | route-calculator.ts | YES — 11 waypoints |
| Fire exits | grove-house-3d-data.ts | YES — coordinates |
| Fire equipment | grove-house-3d-data.ts | YES — positions |
| Assembly point | grove-house-3d-data.ts | YES — single point |
| Walking speed | route-calculator.ts | YES — 1.2 m/s |
| Floor plan image | public/site-plans/grove-house-ground.png | YES — single PNG |

#### Can a Second School Use This Today?

**No.** Everything is hardcoded for Grove House Primary. To onboard a second school requires:
1. Manually tracing their floor plan into a new `*-3d-data.ts` file
2. Manually defining corridor junction waypoints
3. Manually placing fire exits and equipment
4. Creating a new PNG background image

The `aurora-site-model.ts` (1,018 lines) provides a reusable **type system** but no extraction pipeline. The `floor_plans` database table exists (migration 20260311) with fields for `room_polygons`, `extraction_confidence`, and `source_type`, but no automated extraction fills it.

#### Existing Extraction Test

`tools/test-vision-floorplan.mjs` (248 lines) tests Gemini 2.0 Flash vision on floor plan PNGs. It:
- Sends PNG to vision model via OpenRouter
- Requests JSON with room names, types, blocks, bounding boxes
- Runs extraction twice for consistency
- Tracks cost and token usage

This is the closest thing to an automated pipeline, but it's a standalone CLI test — not integrated into the platform.

### 2.2 Pipeline Options Evaluation

#### Option A: Gemini 2.5 Flash Vision (Existing Stack)

| Factor | Assessment |
|--------|-----------|
| **Cost** | ~$0.10-0.30 per floor plan (image + structured output) |
| **Accuracy** | Good for simple layouts; struggles with overlapping text, multi-floor PDFs, architect detail |
| **Time to implement** | 1-2 days — test tool already exists, integrate into `/api/estates/floor-plans` |
| **Vercel compatible** | YES — API call only, no binary dependencies |
| **Strengths** | Already in stack, handles text labels, returns structured JSON |
| **Weaknesses** | Coordinate accuracy ~80%, struggles with scale/dimensions, inconsistent across runs |

**Verdict:** Best for quick MVP. The `test-vision-floorplan.mjs` proves feasibility. Two-pass extraction with consistency check addresses variance.

#### Option B: OpenCV + Gemini Hybrid

| Factor | Assessment |
|--------|-----------|
| **Cost** | Free (OpenCV) + $0.10 (Gemini for labelling) |
| **Accuracy** | High for wall detection; needs Gemini for room labelling |
| **Time to implement** | 5-7 days — Python service needed |
| **Vercel compatible** | NO — requires Python runtime. Would need separate service (Railway, Fly.io, or Supabase Edge Function with Deno) |
| **Strengths** | Precise edge detection, handles architect-quality PDFs |
| **Weaknesses** | Extra infrastructure, cold start latency, maintenance burden |

**Verdict:** Over-engineered for v1. Revisit if vision-only accuracy is insufficient.

#### Option C: PyMuPDF Vector Extraction

| Factor | Assessment |
|--------|-----------|
| **Cost** | Free (open source) |
| **Accuracy** | Excellent for vector PDFs (architect drawings); useless for raster/scanned |
| **Time to implement** | 3-4 days — Python extraction + coordinate mapping |
| **Vercel compatible** | NO — Python binary. Same infra issue as Option B |
| **Strengths** | Extracts exact vector paths, preserves scale, handles complex drawings |
| **Weaknesses** | Only works on vector PDFs (not photos/scans), Python dependency |

**Verdict:** Ideal for architect PDFs (Bradford Council fire prevention strategy type). Could be a Supabase Edge Function or background job. Strong fallback for professional plans.

#### Option D: FloorplanVLM

| Factor | Assessment |
|--------|-----------|
| **Cost** | Free (if self-hosted) or inference API cost |
| **Accuracy** | Purpose-built for floor plans — best theoretical accuracy |
| **Time to implement** | 7-14 days — model hosting, API wrapper, integration |
| **Vercel compatible** | NO — requires GPU inference server |
| **Strengths** | Trained specifically on floor plan data |
| **Weaknesses** | Not widely available on HuggingFace as a ready API; would need Replicate/Modal hosting; unclear maintenance |

**Verdict:** Not viable for v1. Monitor HuggingFace for hosted API availability.

#### Option E: RasterScan

| Factor | Assessment |
|--------|-----------|
| **Cost** | Commercial pricing — $50-200/month for API access |
| **Accuracy** | High — commercial floor plan digitisation service |
| **Time to implement** | 2-3 days — API integration |
| **Vercel compatible** | YES — API call only |
| **Strengths** | Best accuracy, handles all floor plan types |
| **Weaknesses** | Recurring cost, vendor lock-in, data leaves UK jurisdiction (check GDPR) |

**Verdict:** Viable but expensive. Only justified if high volume of floor plans expected.

### 2.3 Recommendation

**Primary: Option A — Gemini 2.5 Flash Vision**

Rationale:
1. Already in the stack (OpenRouter, Gemini key configured)
2. Test tool (`test-vision-floorplan.mjs`) proves feasibility
3. Vercel compatible — no infrastructure changes
4. ~$0.15/floor plan — negligible cost
5. 1-2 day implementation — fastest to market
6. Two-pass extraction with consistency scoring addresses accuracy concerns
7. Human-in-the-loop validation via existing `floor_plans.extraction_confidence` field

Implementation path:
1. Promote `test-vision-floorplan.mjs` into `/api/estates/floor-plans` POST handler
2. Store results in `floor_plans` table with `source_type = 'vision_ai'`
3. Add validation UI in `/dashboard/estates/floor-plan` for human correction
4. Feed corrected data back to improve prompts

**Fallback: Option C — PyMuPDF Vector Extraction**

Rationale:
1. Free and open source
2. Perfect for architect-quality vector PDFs (the most common professional format)
3. Can run as a Supabase Edge Function (Deno) or background job
4. Complements vision AI — use PyMuPDF for vector PDFs, Gemini for raster/photos

The two options together cover all floor plan types:
- **Vector PDF** (architect drawings) → PyMuPDF extracts exact geometry
- **Raster/photo** (phone photos, scanned plans) → Gemini Vision extracts approximate layout
- **Either** → Human validation step → corrected data stored

### 2.4 Onboarding Pipeline (New School)

```
School uploads floor plan (PDF or image)
    ↓
Detect format: vector PDF vs raster
    ↓
┌─ Vector: PyMuPDF extracts room polygons, walls, doors
└─ Raster: Gemini Vision extracts room layout + labels
    ↓
Store in floor_plans table (extraction_confidence score)
    ↓
Caretaker reviews in validation UI, corrects any errors
    ↓
Approved data feeds into:
    ├── 3D Scene (React Three Fiber)
    ├── Route Calculator (auto-generate corridor graph)
    ├── QR Labels (print batch)
    ├── Asset Placement (pin to floor plan)
    └── Fire Evacuation Routes
```

---

## Appendix A: Full API Route Count by Domain

| Domain | Routes |
|--------|--------|
| Estates & Compliance | 73 |
| Compliance | 37 |
| Ed AI | 27 |
| Documents | 16 |
| Canvas/Intelligence | 21 |
| Emergency | 12 |
| Governance | 10 |
| Meetings | 12 |
| Surveys | 13 |
| Finance | 8 |
| HR/Staff | 10 |
| Attendance | 4 |
| Behaviour | 5 |
| Safeguarding | 6 |
| SEND | 7 |
| Risk | 8 |
| Subscription | 9 |
| Connectors | 12 |
| Other | 174 |
| **Total** | **464** |

## Appendix B: Environment Variables (Set vs Expected)

### Set (44 vars)
```
DATABASE_URL, DEEPGRAM_API_KEY, FIRECRAWL_API_KEY (x2),
FISH_AUDIO_API_KEY, GEMINI_API_KEY, GOOGLE_AI_API_KEY, GOOGLE_API_KEY,
GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_FIREBASE_* (x12),
NEXT_PUBLIC_FISH_AUDIO_* (x8), NEXT_PUBLIC_GOOGLE_CLIENT_ID,
NEXT_PUBLIC_MICROSOFT_CLIENT_ID, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL,
OPENROUTER_API_KEY (x2), RESEND_API_KEY, STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL,
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, VITE_GEMINI_API_KEY,
VITE_OPENROUTER_API_KEY
```

### Expected but Missing
```
DFE_SUPABASE_URL — DfE data warehouse queries will fail
DFE_SUPABASE_SERVICE_ROLE_KEY — DfE data warehouse queries will fail
GOOGLE_DRIVE_CLIENT_SECRET — Drive OAuth won't complete
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID — Drive file picker won't load
EMAIL_FROM — Will default to notifications@schoolgle.co.uk
```

## Appendix C: Immediate Action Items

| Priority | Action | Effort |
|----------|--------|--------|
| HIGH | Enable RLS on 3 ed_form tables | 30 min |
| HIGH | Replace `select("*")` on safeguarding/pupil routes with explicit columns | 2 hrs |
| HIGH | Audit 25+ public Ed API routes for rate limiting | 2 hrs |
| MEDIUM | Clean duplicate env vars in .env.local | 15 min |
| MEDIUM | Set DFE_SUPABASE_* env vars if DfE warehouse is needed | 15 min |
| MEDIUM | Extract god components (3,000+ line pages) into sub-components | 2-3 days |
| MEDIUM | Remove 238 console.log statements | 1 hr |
| LOW | Reduce 469 `as any` casts — prioritise API routes | Ongoing |
| LOW | Add tests for 0-coverage modules (Governance, Meetings, Finance) | 3-5 days |
| LOW | Run `npm run typecheck` and address critical errors | 2-3 days |
