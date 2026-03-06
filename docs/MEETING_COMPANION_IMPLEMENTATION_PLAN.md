# Meeting Companion & HR Sentinel — Implementation Plan

**Based on**: Product Spec v1.0 (6 March 2026)
**Approach**: Phase 1 (Free Tier MVP) broken into 8 work packages, then Phases 2–4 outlined at high level.

---

## Phase 1: Free Tier MVP (Weeks 1–4)

### WP1 — Database Schema & Migration

**Files to create:**

- `apps/platform/supabase/migrations/20260310_meeting_companion.sql`

**Tables (5):**

```
meeting_templates
├── id UUID PK
├── name TEXT NOT NULL
├── category TEXT NOT NULL (hr, operational, governance)
├── description TEXT
├── opening_script JSONB — array of paragraphs
├── closing_script JSONB — array of paragraphs
├── compliance_items JSONB — [{phrase, category, is_critical, order_index}]
├── preparation_guide JSONB — {context_prompts[], documents_needed[], key_phrases[], policy_refs[]}
├── is_custom BOOLEAN DEFAULT false
├── organization_id UUID FK → organizations (NULL for global templates)
├── created_by UUID FK → users
├── created_at TIMESTAMPTZ DEFAULT now()
├── updated_at TIMESTAMPTZ DEFAULT now()

meetings
├── id UUID PK
├── template_id UUID FK → meeting_templates
├── organization_id UUID FK → organizations NOT NULL
├── leader_id UUID FK → users NOT NULL
├── attendee_name TEXT NOT NULL
├── attendee_role TEXT
├── purpose TEXT
├── scheduled_at TIMESTAMPTZ NOT NULL
├── location TEXT
├── calendar_event_id TEXT — Google Calendar ID
├── status TEXT NOT NULL DEFAULT 'scheduled'
│   CHECK (status IN ('scheduled','in_progress','completed','cancelled'))
├── started_at TIMESTAMPTZ
├── ended_at TIMESTAMPTZ
├── notes JSONB DEFAULT '[]' — [{timestamp, text}]
├── compliance_score INTEGER — 0–100 (paid tier, NULL for free)
├── created_at TIMESTAMPTZ DEFAULT now()
├── updated_at TIMESTAMPTZ DEFAULT now()

meeting_checklist_items
├── id UUID PK
├── meeting_id UUID FK → meetings ON DELETE CASCADE
├── phrase TEXT NOT NULL
├── category TEXT — grouping label
├── is_critical BOOLEAN DEFAULT false
├── status TEXT NOT NULL DEFAULT 'red'
│   CHECK (status IN ('red','amber','green'))
├── manually_ticked BOOLEAN DEFAULT false
├── detected_at TIMESTAMPTZ — paid tier
├── ai_confidence FLOAT — paid tier
├── ai_suggestion TEXT — paid tier
├── order_index INTEGER NOT NULL

meeting_transcripts (Phase 3, create table now, leave empty)
├── id UUID PK
├── meeting_id UUID FK → meetings ON DELETE CASCADE
├── chunks JSONB DEFAULT '[]' — [{timestamp, speaker, text}]
├── full_text TEXT
├── audio_url TEXT — Supabase Storage path

meeting_minutes
├── id UUID PK
├── meeting_id UUID FK → meetings ON DELETE CASCADE
├── content JSONB — structured minute data
├── html TEXT — rendered HTML
├── status TEXT NOT NULL DEFAULT 'draft'
│   CHECK (status IN ('draft','finalised'))
├── exported_url TEXT
├── created_at TIMESTAMPTZ DEFAULT now()
├── updated_at TIMESTAMPTZ DEFAULT now()
```

**RLS Policies:**

- All tables: `organization_id = auth.jwt() → org_id` (match existing pattern)
- `meeting_templates`: Global templates (org_id IS NULL) readable by all; custom templates scoped to org
- `meeting_transcripts`: Restrict to leader_id + admin/headteacher roles

**Seed data:** Insert the 8 launch templates from the product spec (RTW short, RTW long, informal sickness, formal sickness, informal capability, wellbeing, probation, grievance) as global templates (organization_id = NULL).

**Dependencies:** None
**Effort:** ~2 hours

---

### WP2 — TypeScript Types & Lib Layer

**Files to create:**

- `apps/platform/src/lib/meetings/types.ts` — All TypeScript interfaces
- `apps/platform/src/lib/meetings/templates.ts` — Template data (mirrors DB seed for client-side use)
- `apps/platform/src/lib/meetings/minutes-generator.ts` — Template-based minutes generation
- `apps/platform/src/lib/meetings/index.ts` — Barrel export

**Key types:**

```ts
(MeetingTemplate,
  Meeting,
  MeetingChecklistItem,
  MeetingTranscript,
  MeetingMinutes);
MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
ChecklistStatus = "red" | "amber" | "green";
TemplateCategory = "hr" | "operational" | "governance";
MinutesStatus = "draft" | "finalised";
```

**minutes-generator.ts logic (free tier):**

1. Takes meeting record + checklist items + notes
2. Builds structured minutes: metadata → opening script → agenda items (from checklist, grouped by category) → notes → actions → closing script
3. Renders to HTML string for preview
4. Returns both JSONB structure and HTML

**Dependencies:** WP1 (types match schema)
**Effort:** ~2 hours

---

### WP3 — API Routes

**Files to create:**

```
apps/platform/src/app/api/meetings/route.ts              — GET (list), POST (create)
apps/platform/src/app/api/meetings/[id]/route.ts          — GET, PATCH, DELETE
apps/platform/src/app/api/meetings/[id]/start/route.ts    — POST (transition to in_progress)
apps/platform/src/app/api/meetings/[id]/complete/route.ts  — POST (transition to completed)
apps/platform/src/app/api/meetings/[id]/checklist/route.ts — PATCH (update checklist items)
apps/platform/src/app/api/meetings/[id]/minutes/route.ts   — GET, POST (generate), PATCH (edit)
apps/platform/src/app/api/meetings/[id]/export/route.ts    — GET (PDF/DOCX download)
apps/platform/src/app/api/meetings/templates/route.ts      — GET (list), POST (create custom)
apps/platform/src/app/api/meetings/templates/[id]/route.ts — GET, PATCH, DELETE
```

**Pattern:** Follow existing governance/meetings API pattern:

- `createClient(supabaseUrl, supabaseServiceKey)` for server-side
- `organizationId` from query params (GET) or body (POST/PATCH)
- Standard error handling with try/catch
- UUID generation with `uuid` package

**Key endpoint details:**

| Endpoint                       | Method | Purpose                                                            |
| ------------------------------ | ------ | ------------------------------------------------------------------ |
| `/api/meetings`                | GET    | List meetings for org, filterable by status/date/template          |
| `/api/meetings`                | POST   | Create meeting from template, copy compliance items to checklist   |
| `/api/meetings/[id]/start`     | POST   | Set status=in_progress, set started_at                             |
| `/api/meetings/[id]/checklist` | PATCH  | Bulk update checklist items (tick/untick)                          |
| `/api/meetings/[id]/complete`  | POST   | Set status=completed, set ended_at, calc score                     |
| `/api/meetings/[id]/minutes`   | POST   | Generate minutes from template+checklist+notes                     |
| `/api/meetings/[id]/export`    | GET    | Generate PDF or DOCX from minutes (query param: ?format=pdf\|docx) |
| `/api/meetings/templates`      | GET    | List global + org custom templates                                 |

**Export implementation:**

- PDF: Use existing `pdf-lib` or `@react-pdf/renderer`
- DOCX: Use `docx` package (already a pattern in the codebase for staff export)

**Dependencies:** WP1, WP2
**Effort:** ~4 hours

---

### WP4 — Module Registry & Navigation

**Files to modify:**

- `apps/platform/src/lib/modules/registry.ts` — Add Meeting Companion app to HR module

**Changes:**

```ts
// Add to APPS array under HR module:
{
  id: "meeting-companion",
  moduleId: "hr",
  name: "Meeting Companion",
  route: "/dashboard/hr/meetings",
  icon: ClipboardCheck, // from lucide-react
  shortDescription: "AI-guided HR meeting management.",
  requiredPermissions: ["admin", "headteacher", "slt"],
}
```

**Also add** to the HR landing page (`dashboard/hr/page.tsx`) tools array:

```ts
{
  title: 'Meeting Companion',
  description: 'Guided HR meetings with compliance checklists and auto-generated minutes.',
  status: 'Live',
  href: '/dashboard/hr/meetings',
  icon: ClipboardCheck
}
```

**Add path mapping** in `getModuleByPath()` for `/dashboard/hr/meetings`.

**Dependencies:** None (can be done in parallel with WP1–3)
**Effort:** ~30 minutes

---

### WP5 — UI Components

**Files to create:**

```
apps/platform/src/components/meetings/
├── MeetingTemplateCard.tsx      — Template selection card with category badge
├── MeetingTemplateList.tsx      — Grid of templates with search/filter
├── MeetingScheduleForm.tsx      — Form: date, time, location, attendee, purpose
├── MeetingPreparationPack.tsx   — Read-only prep guide (phrases, docs, context)
├── MeetingLiveChecklist.tsx     — The core meeting-time checklist UI
├── MeetingChecklistItem.tsx     — Individual item with tick/status indicator
├── MeetingScriptDisplay.tsx     — Opening/closing script with "read aloud" styling
├── MeetingNotesInput.tsx        — Freeform notes textarea with timestamps
├── MeetingMinutesPreview.tsx    — Rendered minutes in reviewable format
├── MeetingMinutesEditor.tsx     — Editable minutes before finalising
├── MeetingHistoryTable.tsx      — Table of past meetings with status/score
├── MeetingStatusBadge.tsx       — Coloured badge for scheduled/in_progress/completed
├── index.ts                     — Barrel export
```

**Design patterns:**

- Follow existing governance component patterns (modals, motion animations, Radix UI primitives)
- Tailwind + class-variance-authority for variants
- Lucide icons throughout
- HR module accent color: `indigo` (from registry)
- Mobile-responsive: checklist must work on tablet/phone during meetings

**Key UX decisions:**

1. **MeetingLiveChecklist** — The most critical component:
   - Full-screen-capable mode (for use during actual meetings)
   - Large touch targets for tablet use
   - Items grouped by category
   - Red/amber/green indicators (red = unticked, green = ticked; amber reserved for Phase 3 AI)
   - Progress bar at top showing % complete
   - Unticked critical items highlighted with red border after 50% of items are ticked
   - Auto-saves tick state via API on each interaction

2. **MeetingScriptDisplay** — Prominent, readable text:
   - Large font size for reading aloud
   - Subtle background to distinguish from checklist
   - "Copy to clipboard" button for virtual meetings

3. **MeetingMinutesPreview** — Print-friendly layout:
   - School letterhead placeholder
   - Structured sections matching template
   - Export buttons (PDF, DOCX, email)

**Dependencies:** WP2 (types), WP3 (API endpoints)
**Effort:** ~6 hours

---

### WP6 — Pages (Route Handlers)

**Files to create:**

```
apps/platform/src/app/(dashboard)/dashboard/hr/meetings/page.tsx
  — Landing: meeting history + "New Meeting" button + template quick-start

apps/platform/src/app/(dashboard)/dashboard/hr/meetings/new/page.tsx
  — Template selection → schedule form → confirmation

apps/platform/src/app/(dashboard)/dashboard/hr/meetings/[id]/page.tsx
  — Meeting detail: shows status-appropriate view
    - If scheduled: preparation pack + "Start Meeting" button
    - If in_progress: live checklist + script + notes
    - If completed: minutes preview + export

apps/platform/src/app/(dashboard)/dashboard/hr/meetings/[id]/live/page.tsx
  — Dedicated full-screen live meeting view (checklist + script + notes only)

apps/platform/src/app/(dashboard)/dashboard/hr/meetings/[id]/minutes/page.tsx
  — Minutes review, edit, finalise, export
```

**Page flow:**

```
/dashboard/hr/meetings
  → "New Meeting" → /dashboard/hr/meetings/new
    → Select template → Fill details → Create
      → Redirect to /dashboard/hr/meetings/[id] (prep view)
        → "Start Meeting" → /dashboard/hr/meetings/[id]/live
          → During meeting: tick checklist, add notes
            → "End Meeting" → /dashboard/hr/meetings/[id] (completed view)
              → "Generate Minutes" → /dashboard/hr/meetings/[id]/minutes
                → Review → Finalise → Export
```

**Dependencies:** WP4 (navigation), WP5 (components)
**Effort:** ~4 hours

---

### WP7 — Template Seed Data

**Files to create:**

- `apps/platform/src/lib/meetings/seed-templates.ts` — Full template definitions

**Contains all 8 launch templates** from the product spec, each with:

- `name`, `category`, `description`
- `opening_script` — Array of paragraphs (verbatim from spec)
- `closing_script` — Appropriate closing for each template type
- `compliance_items` — Array of `{phrase, category, is_critical, order_index}`
- `preparation_guide` — `{context_prompts, documents_needed, key_phrases, policy_refs}`

**Also used in the migration** (WP1) to seed the database.

**Templates:**

1. Return to Work — Short-term Absence (6 compliance phrases)
2. Return to Work — Long-term Absence (7 compliance phrases)
3. Informal Sickness Review (7 compliance phrases)
4. Formal Sickness Review Stage 1/2/3 (8 compliance phrases)
5. Informal Capability Conversation (7 compliance phrases)
6. Wellbeing Check-in (6 compliance phrases)
7. Probation Review (6 compliance phrases)
8. Grievance Hearing Initial (7 compliance phrases)

**Total: 54 compliance phrases** across 8 templates.

**Dependencies:** None
**Effort:** ~2 hours (transcribing from spec + adding closing scripts and prep guides)

---

### WP8 — Google Calendar Integration

**Files to create:**

- `apps/platform/src/lib/meetings/calendar.ts` — Calendar sync helper

**Approach:**

- Use existing Google Calendar MCP integration pattern
- When a meeting is created, optionally create a Google Calendar event
- Event includes: title, date/time, location, description with link to Schoolgle meeting page
- Store `calendar_event_id` on the meeting record
- If meeting is cancelled/rescheduled, update/delete the calendar event

**This is optional for MVP** — can be a fast-follow if calendar API is already wired up, or deferred to Phase 2 if not.

**Dependencies:** WP3 (meeting create API)
**Effort:** ~2 hours (if calendar API exists) or ~4 hours (if new)

---

## Phase 1 Summary

| WP        | Deliverable               | Depends On | Effort   |
| --------- | ------------------------- | ---------- | -------- |
| WP1       | Database migration + seed | —          | 2h       |
| WP2       | Types + lib layer         | WP1        | 2h       |
| WP3       | API routes (10 endpoints) | WP1, WP2   | 4h       |
| WP4       | Module registry + nav     | —          | 0.5h     |
| WP5       | UI components (13)        | WP2, WP3   | 6h       |
| WP6       | Pages (5 routes)          | WP4, WP5   | 4h       |
| WP7       | Template seed data        | —          | 2h       |
| WP8       | Google Calendar sync      | WP3        | 2–4h     |
| **Total** |                           |            | **~23h** |

**Parallelisation:** WP1 + WP4 + WP7 can run in parallel. Then WP2 → WP3 → WP5 → WP6. WP8 is independent after WP3.

**Suggested build order:**

1. WP7 (templates) + WP4 (registry) — no dependencies
2. WP1 (migration) — uses WP7 data
3. WP2 (types/lib)
4. WP3 (API routes)
5. WP5 (components) + WP8 (calendar) — parallel
6. WP6 (pages)

---

## Phase 2: UX Refinement (Weeks 5–8)

| Deliverable                    | Details                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| PDF/DOCX export polish         | Branded templates, school logo, letterhead                         |
| Mobile-responsive live view    | Optimise checklist for phone/tablet during meetings                |
| Preparation guide enhancements | Auto-pull staff absence data if available, link to school policies |
| Template expansion             | Add operational templates (parent meeting, exclusion review, etc.) |
| Email integration              | Send minutes to attendees directly from the platform               |
| Meeting reminders              | Push notification / email reminder before scheduled meetings       |
| Beta pilot                     | Deploy to 5–10 schools, collect feedback, iterate                  |

---

## Phase 3: HR Sentinel — Paid Tier (Weeks 9–14)

| Deliverable             | Details                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Audio recording         | Browser MediaRecorder API, save to Supabase Storage                                  |
| Consent workflow        | Scripted consent prompt, leader confirmation gate, fallback to free tier             |
| Real-time transcription | Deepgram WebSocket integration for live transcript                                   |
| AI phrase detection     | Claude API pipeline: transcript chunks → compliance matching → checklist auto-update |
| Traffic-light tracker   | Real-time UI updates via Supabase Realtime subscriptions                             |
| Live coaching nudges    | Configurable threshold (e.g., 50% meeting elapsed), nudge UI component               |
| Supabase Edge Function  | `meeting-phrase-detector` — receives chunks, calls Claude, updates checklist         |

**AI Architecture (Phase 3):**

```
Browser (MediaRecorder)
  → AudioWorklet (chunk every 15–30s)
    → Deepgram WebSocket (transcription)
      → Supabase Edge Function (phrase detection)
        → Claude API (semantic matching)
          → Supabase Realtime (checklist update)
            → React UI (traffic-light update)
```

**Claude prompt strategy:**

- System prompt includes: template context, school HR policy tone, remaining uncovered items
- User prompt includes: latest transcript chunk + 2 previous chunks for context
- Output: JSON `{items: [{phrase_id, status, confidence, suggestion}]}`
- Semantic matching, not exact string matching (as spec requires)

---

## Phase 4: Analytics & Scale (Weeks 15–20)

| Deliverable                    | Details                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| AI minutes generation          | Full transcript → Claude → structured formal minutes               |
| Compliance confidence score    | Weighted score based on critical vs non-critical items             |
| Manager dashboard              | Cross-school/MAT view of meeting compliance trends                 |
| Custom template builder        | UI for MATs to create templates with custom compliance phrases     |
| Advanced analytics             | Meeting frequency, avg compliance score, common gaps, trend charts |
| API for third-party HR systems | Webhook/REST API for external integrations                         |

---

## File Inventory (Phase 1)

### New files (~25):

```
# Database
supabase/migrations/20260310_meeting_companion.sql

# Lib
src/lib/meetings/types.ts
src/lib/meetings/templates.ts
src/lib/meetings/seed-templates.ts
src/lib/meetings/minutes-generator.ts
src/lib/meetings/calendar.ts
src/lib/meetings/index.ts

# API (10 route files)
src/app/api/meetings/route.ts
src/app/api/meetings/[id]/route.ts
src/app/api/meetings/[id]/start/route.ts
src/app/api/meetings/[id]/complete/route.ts
src/app/api/meetings/[id]/checklist/route.ts
src/app/api/meetings/[id]/minutes/route.ts
src/app/api/meetings/[id]/export/route.ts
src/app/api/meetings/templates/route.ts
src/app/api/meetings/templates/[id]/route.ts

# Components (13 + barrel)
src/components/meetings/MeetingTemplateCard.tsx
src/components/meetings/MeetingTemplateList.tsx
src/components/meetings/MeetingScheduleForm.tsx
src/components/meetings/MeetingPreparationPack.tsx
src/components/meetings/MeetingLiveChecklist.tsx
src/components/meetings/MeetingChecklistItem.tsx
src/components/meetings/MeetingScriptDisplay.tsx
src/components/meetings/MeetingNotesInput.tsx
src/components/meetings/MeetingMinutesPreview.tsx
src/components/meetings/MeetingMinutesEditor.tsx
src/components/meetings/MeetingHistoryTable.tsx
src/components/meetings/MeetingStatusBadge.tsx
src/components/meetings/index.ts

# Pages (5)
src/app/(dashboard)/dashboard/hr/meetings/page.tsx
src/app/(dashboard)/dashboard/hr/meetings/new/page.tsx
src/app/(dashboard)/dashboard/hr/meetings/[id]/page.tsx
src/app/(dashboard)/dashboard/hr/meetings/[id]/live/page.tsx
src/app/(dashboard)/dashboard/hr/meetings/[id]/minutes/page.tsx
```

### Modified files (2):

```
src/lib/modules/registry.ts          — Add meeting-companion app
src/app/(dashboard)/dashboard/hr/page.tsx — Add Meeting Companion card
```

---

## Risks & Decisions Needed

| #   | Decision                      | Options                                             | Recommendation                                                     |
| --- | ----------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | **Route location**            | `/dashboard/hr/meetings` vs `/dashboard/meetings`   | Under HR — meetings are HR-centric in Phase 1                      |
| 2   | **Calendar sync in Phase 1?** | Include vs defer                                    | Defer to Phase 2 unless Google Calendar API is already integrated  |
| 3   | **Minutes export format**     | pdf-lib vs @react-pdf/renderer vs puppeteer         | pdf-lib (lightweight, server-side, no browser needed)              |
| 4   | **DOCX generation**           | docx package vs mammoth reverse                     | `docx` package (purpose-built for generation)                      |
| 5   | **Checklist persistence**     | Optimistic UI + debounced save vs save on each tick | Optimistic UI + save on each tick (meetings are high-stakes)       |
| 6   | **Free tier transcription**   | Web Speech API vs none                              | Include Web Speech API as a bonus — zero cost, reasonable accuracy |
| 7   | **Subscription gating**       | Feature flag vs separate routes                     | Feature flag on meeting record (`tier: 'free' \| 'sentinel'`)      |

---

## Next Steps

1. **Review this plan** — confirm scope, route structure, and open decisions
2. **Start WP7 + WP4** — template data and registry (no DB needed)
3. **Run WP1** — create and apply the migration
4. **Build forward** through WP2 → WP3 → WP5 → WP6
