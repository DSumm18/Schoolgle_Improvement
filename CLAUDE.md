# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Schoolgle** is an AI-powered school improvement platform for UK schools. It scans cloud storage (Google Drive/OneDrive), extracts evidence from documents, and maps them to Ofsted/SIAMS framework requirements using AI. Includes 20+ modules: Estates, HR, Governance, Compliance, Intelligence, Risk, SEND, Attendance, Behaviour, and more.

**Turborepo monorepo** — main Next.js 16 app in `apps/platform/`, shared packages in `packages/`.

## Build & Development Commands

```bash
# From project root
npm run dev             # Start dev server (runs on port 3002)
npm run build           # Build all apps
npm run lint            # ESLint
npm run test            # Vitest (watch mode)
npm run test:run        # Vitest (single run, no watch)
npm run test:coverage   # Vitest with coverage
npm run typecheck       # TypeScript checking (from apps/platform/)

# Single test
npx vitest run path/to/test.test.ts

# Bundle analysis
ANALYZE=true npm run build

# Form fill E2E (Playwright)
npm run test:formfill
npm run test:formfill:headed   # With browser UI
```

**Node.js 20.x required** — use `nvm use 20`.

## Critical Gotchas

### Supabase Projects

- **Production** (Vercel uses): `ygquvauptwyvlhkyxkwy` — env vars point here
- **MISSION_CONTROL** (MCP access): `dybdxegrgofmmlvkthqb` — NOT used by Vercel
- Always apply migrations to production. DATABASE_URL in `.env.local` has the pooler connection string.

### RLS Policies

`organization_members.user_id` is TEXT but `auth.uid()` returns UUID. **ALL RLS policies MUST use `auth.uid()::text`**.

### Next.js Config (`apps/platform/next.config.ts`)

- Uses **webpack** (not Turbopack) — Turbopack has config conflicts
- `@schoolgle/ed-widget` aliased to stub (`src/lib/ed-widget-stub.ts`) for marketing routes — only import in dashboard
- `@schoolgle/ed-agents` aliased to `packages/ed-agents/src`
- TypeScript errors ignored during builds (`ignoreBuildErrors: true`) — ESLint also not blocking builds
- Platform dev script uses `next dev --webpack` explicitly (Turbopack disabled)

### TypeScript (`apps/platform/tsconfig.json`)

- `src/context/AuthContext.tsx` is **excluded** from compilation — use `SupabaseAuthContext` instead
- Path alias: `@/*` → `./src/*`

## Architecture

### Auth Flow

- **Firebase Auth** (Google/Microsoft OAuth) for authentication
- **Supabase** (PostgreSQL + pgvector) for database with Row Level Security
- Auth context: `apps/platform/src/context/SupabaseAuthContext.tsx`

### API Route Pattern

All API routes use `protectedRoute` wrapper (unless intentionally public):

```typescript
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  // auth provides: userId, email, organizationId, role
  return apiSuccess({ data });
});
```

- For `[id]` routes: extract ID from `req.nextUrl.pathname` (protectedRoute doesn't pass params)
- ~95% of routes (310+/325) use this pattern
- Intentionally public: webhooks, OAuth callbacks, DfE lookups, survey submissions, ed embed/website-chat

### AI Model Stack (via OpenRouter)

Configured in `apps/platform/src/lib/ai-evidence-matcher.ts`:

| Model                              | Purpose                        | Cost                 |
| ---------------------------------- | ------------------------------ | -------------------- |
| `deepseek/deepseek-chat`           | Primary analysis (95% of docs) | $0.24/M input        |
| `mistral-ocr`                      | Scanned PDFs/images            | ~$0.20-0.40/100 docs |
| `google/gemini-2.0-flash-lite-001` | Fallback/retry                 | $0.075/M input       |
| `qwen/qwen-2.5-vl-72b-instruct`    | Charts/diagrams                | $0.40/M input        |

Ed chatbot vision uses Gemini 2.5 Flash via OpenRouter ($0.15/M tokens).

### Ed AI Chatbot (`packages/ed-agents/src/`)

Multi-specialist chatbot with 12 domain agents and 43+ callable skills:

```
User Message → Intent Classifier → Agent Router → Specialist Agent → LLM → Guardrails → Response
                                        ↓                              ↓
                                  Context Loader                 Skills (Function Calling)
                                  (School + Intelligence)        via /api/skills/invoke
```

Key files: `orchestrator/orchestrator.ts` (main class), `orchestrator/agent-router.ts` (routing + LLM), `agents/agents.ts` (12 specialist definitions), `agents/skills-agent.ts` (function-calling bridge).

Skills registry: `apps/platform/src/lib/skills/school-skills-registry.ts` — 7 schema groups: STAFF (6), ACTIONS (6), ESTATES (8), ESTATES_SPATIAL (6), INTELLIGENCE (6), RISK (6), DOCUMENT (7).

### Ofsted Dual Framework

Two coexisting frameworks — check which one a component uses:

1. **Legacy 6-Category** (`ofsted-framework.ts`) — used by most UI components
2. **EIF 2025** (`ofsted/types.ts`) — 4 key judgements, new rating system

`ofsted.ts` re-exports both for backwards compatibility.

### Module System

`apps/platform/src/lib/modules/registry.ts` — modules (governance, improvement, estates, hr) contain apps with accent colors, icons, and role-based access control (admin, headteacher, slt, teacher, governor, caretaker, viewer).

## Monorepo Structure

```
apps/
├── platform/          # Main Next.js web app (schoolgle.co.uk)
├── ed-parent/         # Parent/teacher dashboard
└── ed-staff/          # Staff dashboard

packages/
├── ed-agents/         # AI agent framework (@schoolgle/ed-agents)
├── ed-backend/        # Backend logic for evidence detection
├── ed-widget/         # Widget components (Vite, stubbed in marketing)
├── ed-extension/      # Browser extension
├── form-fill-lab/     # Form automation with Playwright
├── form-skill/        # Form filling skill
├── mcp-server/        # MCP server
└── shared/            # Shared types and utilities
```

### Route Groups (`apps/platform/src/app/`)

- `(dashboard)/` — authenticated dashboard pages
- `(marketing)/` — public landing/marketing pages
- `(auth)/` — authentication pages

### API Routes

Organized by domain under `apps/platform/src/app/api/` — 325+ routes across 20+ domains (estates, governance, compliance, intelligence, ed, staff, documents, risk, meetings, surveys, etc.).

## Key Conventions

- **UI**: Radix UI primitives + shadcn/ui patterns (class-variance-authority, tailwind-merge). Lucide React for icons. Framer Motion for animations.
- **Styling**: Tailwind CSS. Planet colour system: HR=#ADD8E6, Finance=#FFAA4C, Estates=#00D4D4, Compliance=#E6C3FF, Teaching=#FFB6C1, SEND=#98FF98, Governance=#FFD700, Improvement=#0ea5e9.
- **Server Components** by default; `"use client"` only when needed.
- **Data fetching**: SWR for client-side. React Server Components for server-side.
- **Database**: Supabase with RLS. Migrations in `apps/platform/supabase/migrations/` with timestamp prefix.
- **Git**: Conventional Commits (feat:, fix:, chore:, docs:). Feature branches with `feature/` prefix.
- **Testing**: Vitest with jsdom. Test files: `*.test.ts` / `*.test.tsx`. Playwright for E2E.

## Adding New Features

**New API route**: Create `apps/platform/src/app/api/your-domain/route.ts`, wrap with `protectedRoute`.

**New page**: Dashboard at `apps/platform/src/app/(dashboard)/your-page/page.tsx`, marketing at `(marketing)/`.

**New AI skill**:

1. Create `.agent/skills/your-skill/SKILL.md` with frontmatter
2. Register in `.agent/skills/INDEX.md`
3. Add function schemas in `apps/platform/src/lib/skills/`
4. Create API endpoints
5. Test via `POST /api/skills/invoke`

**Database migration**: Create timestamped SQL in `apps/platform/supabase/migrations/`, run via `supabase db push` or execute in Supabase dashboard.

## Troubleshooting

- **Build fails with Turbopack**: Use webpack (`npm run dev` already configured for this)
- **ed-widget errors**: Only import in dashboard routes, not marketing
- **Module resolution**: Check webpack aliases in `next.config.ts`, restart dev server
- **RLS errors**: Ensure `auth.uid()::text` cast and `organization_id` is set
- **DFE client**: Lazy-loaded to avoid build issues (see `docs/LAZY_LOAD_DFE_CLIENT_FIX.md`)

## Environment Variables

```bash
# Firebase (Auth)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenRouter (AI)
OPENROUTER_API_KEY=

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=
```

## Google Workspace CLI (`gws`)

The `gws` CLI at `/opt/homebrew/bin/gws` is authenticated with David's Google Workspace account. Use it via Bash to access Google Drive, Gmail, Calendar, Docs, and Sheets. **Do not use MCP for Google Workspace** — use `gws` via Bash instead.

### JSON Params Pattern

`gws` takes `--params '<json>'` for API parameters. When JSON contains single quotes (e.g. Drive query strings), use a **heredoc with xargs** to avoid shell escaping issues:

```bash
# GOOD — heredoc avoids single-quote escaping problems
cat <<'JSONEOF' | xargs -0 /opt/homebrew/bin/gws drive files list --params
{"pageSize":10,"q":"mimeType != 'application/vnd.google-apps.folder'","fields":"files(id,name,mimeType,modifiedTime,size)"}
JSONEOF

# GOOD — simple params without single quotes work inline
/opt/homebrew/bin/gws drive files list --params '{"pageSize":10,"fields":"files(id,name,mimeType)"}'

# BAD — shell mangles single quotes inside single-quoted JSON
/opt/homebrew/bin/gws drive files list --params '{"q":"mimeType != 'folder'"}'
```

### Google Drive

```bash
# List files (most recent first)
/opt/homebrew/bin/gws drive files list --params '{"pageSize":10,"orderBy":"modifiedByMeTime desc","fields":"files(id,name,mimeType,modifiedTime,size,parents)"}'

# List files in a specific folder
cat <<'JSONEOF' | xargs -0 /opt/homebrew/bin/gws drive files list --params
{"pageSize":50,"q":"'FOLDER_ID' in parents","fields":"files(id,name,mimeType,modifiedTime,size)"}
JSONEOF

# Search by name
cat <<'JSONEOF' | xargs -0 /opt/homebrew/bin/gws drive files list --params
{"pageSize":10,"q":"name contains 'fms'","fields":"files(id,name,mimeType,modifiedTime,size)"}
JSONEOF

# Get file metadata
/opt/homebrew/bin/gws drive files get --params '{"fileId":"FILE_ID","fields":"id,name,mimeType,size,modifiedTime,parents,webViewLink"}'

# Download a binary file (xlsx, pdf, etc.)
/opt/homebrew/bin/gws drive files get --params '{"fileId":"FILE_ID","alt":"media"}' --output /tmp/filename.xlsx

# Export a Google Sheets/Docs as xlsx/pdf
/opt/homebrew/bin/gws drive files export --params '{"fileId":"FILE_ID","mimeType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}' --output /tmp/export.xlsx

# Upload a file
/opt/homebrew/bin/gws drive files create --json '{"name":"filename.xlsx","parents":["FOLDER_ID"]}' --upload /path/to/file.xlsx
```

### Gmail

```bash
# List recent messages
/opt/homebrew/bin/gws gmail users messages list --params '{"userId":"me","maxResults":10}'

# Read a message
/opt/homebrew/bin/gws gmail users messages get --params '{"userId":"me","id":"MESSAGE_ID","format":"full"}'

# Search messages
/opt/homebrew/bin/gws gmail users messages list --params '{"userId":"me","q":"from:someone@example.com subject:budget","maxResults":5"}'

# Quick triage (helper)
/opt/homebrew/bin/gws gmail +triage

# Send email (helper)
/opt/homebrew/bin/gws gmail +send --json '{"to":"recipient@example.com","subject":"Subject","body":"Body text"}'
```

### Google Calendar

```bash
# List upcoming events
/opt/homebrew/bin/gws calendar events list --params '{"calendarId":"primary","timeMin":"2026-03-13T00:00:00Z","maxResults":10,"singleEvents":true,"orderBy":"startTime"}'

# Quick agenda (helper)
/opt/homebrew/bin/gws calendar +agenda

# Create event (helper)
/opt/homebrew/bin/gws calendar +insert --json '{"calendarId":"primary","summary":"Meeting","start":{"dateTime":"2026-03-14T10:00:00Z"},"end":{"dateTime":"2026-03-14T11:00:00Z"}}'
```

### Google Sheets

```bash
# Read spreadsheet values
/opt/homebrew/bin/gws sheets +read --params '{"spreadsheetId":"SHEET_ID","range":"Sheet1!A1:Z100"}'

# Get spreadsheet metadata
/opt/homebrew/bin/gws sheets spreadsheets get --params '{"spreadsheetId":"SHEET_ID","fields":"properties,sheets.properties"}'

# Append a row (helper)
/opt/homebrew/bin/gws sheets +append --params '{"spreadsheetId":"SHEET_ID","range":"Sheet1"}' --json '{"values":[["col1","col2","col3"]]}'
```

### Google Docs

```bash
# Read a document
/opt/homebrew/bin/gws docs documents get --params '{"documentId":"DOC_ID"}'

# Append text (helper)
/opt/homebrew/bin/gws docs +write --params '{"documentId":"DOC_ID"}' --json '{"text":"New content here"}'
```

### Key Drive Folder: Aurora Primary School

- **Root folder ID**: `14QgdEXLctas5g2RkqXR9wQXvXkf3nZo8`
- Contains: Budget Reports, Attendance, Staff & HR, Behaviour, and more
- Use `'14QgdEXLctas5g2RkqXR9wQXvXkf3nZo8' in parents` to list top-level contents
