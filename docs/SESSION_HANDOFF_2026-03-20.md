# Session Handoff — 2026-03-20

## What Was Done This Session

### Show Me Integration

- Built Show Me as a shared Schoolgle workspace pattern (not a separate app)
- Created reusable `ShowMeShell` component (`components/show-me/ShowMeShell.tsx`)
- Built 3 live Show Me views:
  - **Show Me: Setup** (`/dashboard/show-me`) — school onboarding status from live API data
  - **Show Me: Compliance** (`/dashboard/show-me/compliance`) — compliance posture from live data
  - **Show Me: Site** (`/dashboard/show-me/site`) — interactive floor plan with overlays

### Show Me Site — Aurora Primary

- Created spatial model (`lib/show-me-site/aurora-site-model.ts`) — 31 rooms, 4 floors, evacuation routes
- Generated SVG floor plans (`public/site-plans/aurora-*.svg`)
- Built interactive page with 6 overlay modes: Normal, Tickets, Compliance, Evacuation, Induction, COSHH
- Room click opens detail drawer with structured sections
- Live ticket data from helpdesk API
- COSHH register data from `/api/coshh`
- Monthly review workflow wired to `compliance_reviews` table

### COSHH Workflow

- Built `/api/coshh` route (GET register, POST add/analyse/update_status)
- AI vision analysis via Gemini 2.5 Flash for product detection
- Human confirmation flow for register updates
- Monthly review start/complete/sign-off in Show Me drawer
- All writes go to Estates Compliance tables (system of record)

### Estates Compliance Rationalisation

- Full codebase audit: 170+ files, 36 pages, 49 API routes
- Fixed broken `estates_routines` migration (tables were missing)
- Wired `EvidenceManager` into evidence upload page (was TODO)
- Wired `FindingsAutoSuggest` into check completion flow (was orphaned)
- Wired `DocumentVerifier` into evidence verification flow (was orphaned)
- Added Compliance Reviews section to main Estates Compliance dashboard
- Resolved floor plan duplication (old page now redirects to Show Me Site)
- Created `compliance_reviews` table + API for review cycles with sign-off

### Ed Integration

- Added `openChatWith(message)` to EdChatbotProvider for contextual prompts
- Show Me pages use Ed with step-specific and room-specific prompts
- Ed context cache reduced to 2 min + invalidation after skill execution

---

## Current State of Key Areas

### Show Me

- **Show Me: Setup** — LIVE, derives steps from real school data only
- **Show Me: Compliance** — LIVE, 6 compliance steps from real APIs
- **Show Me: Site** — LIVE, 6 overlays, COSHH drawer with register + evidence + AI + reviews
- Nav item in sidebar under Workspace section
- Dashboard card for incomplete-setup schools

### Estates Compliance

- 36 pages all functional
- Reviews now visible on main dashboard
- `FindingsAutoSuggest` wired into check completion
- `DocumentVerifier` wired into evidence verification (certificates + reports)
- `EvidenceManager` wired into evidence upload page
- `estates_routines` table migration created (was missing)
- Floor plan page redirects to Show Me Site

### COSHH

- Register view in Show Me drawer with live data
- Evidence gallery with thumbnails
- AI analysis (Gemini vision) for product detection
- Human confirmation for register additions
- Monthly review workflow: start → complete → sign-off
- All data stored in Estates Compliance tables

### Data Connections

- Google Drive share-link flow with guided UX
- Import actions for Staff, Pupils, Finance, Attendance, Behaviour
- Freshness badges and stale data warnings
- Disconnect confirmation with impact warning
- Progress stepper across connection journey
- Reconnect shortcut after disconnect

### Pilot Status

- Overall readiness: 8.5/10
- 13 modules visible, 4 hidden (Finance, T&L, Website, Canvas)
- 46/52 Ed skills working
- Self-service onboarding for staff + pupils + assessments + evidence

---

## Files Changed (Not Yet Committed)

### New Files

- `apps/platform/src/components/show-me/ShowMeShell.tsx`
- `apps/platform/src/app/(dashboard)/dashboard/show-me/page.tsx`
- `apps/platform/src/app/(dashboard)/dashboard/show-me/compliance/page.tsx`
- `apps/platform/src/app/(dashboard)/dashboard/show-me/site/page.tsx`
- `apps/platform/src/lib/show-me-site/aurora-site-model.ts`
- `apps/platform/scripts/generate-aurora-site-plan.mjs`
- `apps/platform/public/site-plans/aurora-*.svg` (5 files)
- `apps/platform/src/app/api/coshh/route.ts`
- `apps/platform/src/app/api/compliance/reviews/route.ts`
- `apps/platform/supabase/migrations/20260320_compliance_review_cycle.sql`
- `apps/platform/supabase/migrations/20260320_estates_routines.sql`
- `docs/` — multiple audit, spec, and progress docs

### Modified Files

- `apps/platform/src/lib/modules/registry.ts` — Show Me nav item
- `apps/platform/src/app/(dashboard)/layout.tsx` — pilotHidden filtering
- `apps/platform/src/app/(dashboard)/dashboard/page.tsx` — Show Me setup card
- `apps/platform/src/components/EdChatbotProvider.tsx` — openChatWith
- `packages/ed-agents/src/orchestrator/context-loader.ts` — cache invalidation
- `packages/ed-agents/src/orchestrator/agent-router.ts` — cache invalidation after skills
- `apps/platform/src/app/(dashboard)/estates-compliance/page.tsx` — reviews section
- `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/complete/page.tsx` — FindingsAutoSuggest
- `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/evidence/page.tsx` — DocumentVerifier
- `apps/platform/src/app/(dashboard)/estates-compliance/evidence/upload/page.tsx` — EvidenceManager
- `apps/platform/src/app/(dashboard)/dashboard/estates/floor-plan/page.tsx` — redirect to Show Me

---

## What Should Be Done Next

### Immediate

1. Overdue review reminders in `/api/cron/daily`
2. Fire Safety overlay in Show Me Site (~1 hour)
3. Wire `TaskScheduler` + `DomainManager` orphaned components

### Short-term

4. Legionella overlay (~1 hour)
5. My Classroom / My Room dashboard shortcut
6. External report upload pattern (contractor FRA/legionella reports)

### Medium-term

7. AMP / strategic estate management
8. Benchmarking / KPIs
9. Real floor plan upload (replace synthetic Aurora with school-uploaded plans)
