# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Schoolgle** is an AI-powered school improvement platform for UK schools. The platform automatically scans cloud storage (Google Drive/OneDrive), extracts evidence from documents, and maps them to Ofsted/SIAMS framework requirements using AI. It also includes modules for Estates Compliance, HR & People, Governance, and Teaching & Learning.

This is a **Turborepo monorepo** with the main Next.js 16 application in `apps/platform/` and shared packages in `packages/`.

---

## Build & Development Commands

### Root Commands (run from project root)

```bash
npm run dev           # Start Next.js dev server
npm run build         # Build all applications
npm run lint          # Run ESLint across project
npm run test          # Run Vitest tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run test coverage
npm run test:run      # Run tests once (CI mode)
```

### Single Test Execution

```bash
# Run a specific test file
npx vitest run path/to/test.test.ts

# Run tests in watch mode for a file
npx vitest path/to/test.test.ts
```

### Platform App Specific (cd apps/platform/)

```bash
npm run dev           # Start dev with webpack (not Turbopack)
npm run build         # Build for production
npm run typecheck     # TypeScript type checking
```

### Bundle Analysis

```bash
ANALYZE=true npm run build  # Analyze bundle size with @next/bundle-analyzer
```

### Form Fill Testing

```bash
npm run test:formfill         # Run Playwright tests
npm run test:formfill:headed  # Run tests with browser UI
npm run test:formfill:ci      # Run tests with CI reporter
```

**Important**: Use nvm: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 22`

---

## MANDATORY Quality Rules (NON-NEGOTIABLE)

Every task — whether done by Jarvis, a worker session, or any Claude Code instance — MUST follow these rules. No exceptions.

### No Hardcoding, No Shortcuts, No Bypassing Product Architecture

**This is a live product used by schools handling children's data. Every shortcut is a potential data breach.**

1. **NEVER hardcode data, organization IDs, file paths, or school-specific values into product code.** If a feature needs school-specific data, it MUST come from the database scoped to the authenticated user's organization. A hardcoded org ID means every school sees another school's data.

2. **NEVER save sensitive data (file contents, assessment records, pupil data) to localStorage, session storage, or client-side caches** as a shortcut for proper server-side persistence. If data needs to persist, it goes in Supabase with RLS policies scoping it to the organization.

3. **NEVER bypass authentication or authorization to "make it work".** If an API route requires auth and the page can't call it, fix the auth flow — don't make the route public.

4. **Connectors must be real connectors.** If the product says "Connected to Google Drive", it must maintain a live connection to the actual file via the Drive API, not save a cached copy. The user expects that changing the source file updates the report. If a proper connector can't be built yet, say so and get approval for a temporary approach — don't silently implement a fake connector.

5. **Think multi-tenant.** Every feature you build will be used by multiple schools. If you're building something that only works for one specific school, one specific spreadsheet, or one specific file — STOP. Ask yourself: "Would this work if a different school signed up tomorrow?" If the answer is no, redesign it.

6. **If you need to take a shortcut, ASK FIRST.** Explain what the proper approach is, why you want to shortcut it, and what the risks are. David will approve or reject. Do not proceed without approval. This is non-negotiable.

**Why this matters:** Schoolgle handles student PII, SEND status, FSM eligibility, and assessment data. A hardcoded org ID, a cached file in localStorage, or a public API route is not a minor bug — it's a safeguarding failure. Schools trust us with their children's data. We do not cut corners with that trust.

### Before Claiming ANY Work is Done:

1. **BUILD CHECK** — Run `npm run build` from `apps/platform/`. If it fails, FIX IT before committing. A broken build is never acceptable.

2. **TEST YOUR CHANGES** — If you created an API route, `curl` it and verify the response. If you created a UI component, take a screenshot with Playwright and verify it renders. If you changed auth, test both authenticated and unauthenticated paths. Evidence, not assumption.

3. **CHECK THE BROWSER CONSOLE** — If the dev server is running (port 3001), check for console errors. Fix any errors your changes introduced. Pre-existing errors should be noted but not ignored.

4. **VERIFY API RESPONSES** — Every API endpoint you create or modify must be tested with `curl` showing a successful response. Paste the test command and output in your report.

5. **NO GUESSING MODEL NAMES** — Before using any AI model (Gemini, Claude, etc.), list available models via the API first. Never guess a model ID. Run: `curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"` or equivalent.

6. **NO GUESSING EXPORT NAMES** — Before importing from a module, check what it actually exports. Run `grep "export" <file>` first. Never assume an export exists.

7. **USE SUPERPOWERS SKILLS** — Every significant task must invoke at least one:
   - `systematic-debugging` for bug fixes
   - `verification-before-completion` before claiming done
   - `write-plan` before building anything with 3+ files
   - `test-driven-development` for new features

8. **REPORT WHAT WAS TESTED** — In your chat.md output, include a "Verification" section showing:
   - Commands run and their output
   - Screenshots taken (with Playwright if available)
   - Endpoints tested with curl
   - Build status

### What "Done" Means:
- Code compiles (npm run build passes OR only pre-existing errors remain)
- Feature works when tested (not just "I wrote the code")
- No new console errors introduced
- Committed with a descriptive message
- Progress written to the session chat.md with evidence

### What Is NOT Acceptable:
- Claiming something works without testing it
- Guessing at model names, export names, or API endpoints
- Leaving 500/401 errors untested
- Committing code that introduces new build failures
- Using a wrong model name when the API is available to list them

### Integration Test Gate (Mandatory for External AI/API Models)

Any task that integrates an external AI model or API (Gemini, OpenRouter, Fish Audio, Firecrawl, DfE GIAS, etc.) is **NOT COMPLETE** until ALL of the following are met:

1. **Real API call made** — with representative, realistic input data (not mocks)
2. **Output evaluated for accuracy** — does the model return correct, useful results?
3. **Evidence saved** — JSON dump or screenshot of real results saved to `/tmp/` or Supabase storage
4. **Sandra test** — honest assessment: would a school business manager find this output useful? If no, the task is NOT done.
5. **UI verified** — if there's a user-facing page, it must be loaded in a browser with real data and screenshotted

Mocked unit tests are necessary but NOT sufficient. They prove code structure, not product value.

---

## Monorepo Structure

```
apps/
├── platform/          # Main Next.js web app (schoolgle.co.uk)
├── ed-parent/         # Parent/teacher dashboard
└── ed-staff/          # Staff dashboard

packages/
├── core/              # Core utilities and configs
├── ed-agents/         # AI agent framework (aliased to @schoolgle/ed-agents)
├── ed-backend/        # Backend logic for evidence detection
├── ed-widget/         # Widget components (uses Vite, aliased to stub in marketing routes)
├── ed-extension/      # Browser extension
├── form-fill-lab/     # Form automation with Playwright tests
├── form-skill/        # Form filling skill
├── mcp-server/        # MCP server implementation
└── shared/            # Shared types and utilities
```

### Turborepo Pipeline

- Build dependencies are managed via `turbo.json`
- `build` tasks depend on `^build` (upstream packages build first)
- `dev` and `test` tasks have special caching rules

---

## Key Architecture Decisions

### Next.js Configuration (apps/platform/next.config.ts)

- Uses **webpack** instead of Turbopack due to config conflicts
- `@schoolgle/ed-widget` is aliased to a stub module (`src/lib/ed-widget-stub.ts`) for the marketing site
- `@schoolgle/ed-agents` is aliased to `packages/ed-agents/src`
- TypeScript and ESLint errors are ignored during builds (`ignoreBuildErrors: true`)
- Webpack fallback for `fs` module disabled on client side (prevent Node.js polyfills in browser)
- Bundle analyzer available via `ANALYZE=true npm run build`

### TypeScript Configuration (apps/platform/tsconfig.json)

- **Critical**: `src/context/AuthContext.tsx` is excluded from compilation (use SupabaseAuthContext instead)
- Path alias: `@/*` maps to `./src/*`
- Test files (`*.test.ts`, `*.test.tsx`) are excluded from type checking

### Authentication

- **Firebase Auth** (Google, Microsoft OAuth) for authentication
- **Supabase** (PostgreSQL) for database with Row Level Security (RLS)
- Auth context: `apps/platform/src/context/SupabaseAuthContext.tsx`

### AI Model Stack (Multi-Model via OpenRouter)

Models configured in `apps/platform/src/lib/ai-evidence-matcher.ts`:

| Model                              | Purpose                        | Cost                 |
| ---------------------------------- | ------------------------------ | -------------------- |
| `deepseek/deepseek-chat`           | Primary analysis (95% of docs) | $0.24/M input        |
| `mistral-ocr`                      | Scanned PDFs/images            | ~$0.20-0.40/100 docs |
| `google/gemini-2.0-flash-lite-001` | Fallback/retry logic           | $0.075/M input       |
| `qwen/qwen-2.5-vl-72b-instruct`    | Charts/diagrams (optional)     | $0.40/M input        |

**To change models**: Update `MODEL_CONFIG` in `ai-evidence-matcher.ts` and document rationale in `docs/AI_MODELS.md`.

### Database

- **Supabase** with pgvector extension for semantic search
- Migrations in `apps/platform/supabase/migrations/`
- Core tables: `users`, `organizations`, `evidence`, `assessments`, `actions`, `documents`

### UI Components

- **Radix UI**: Unstyled, accessible primitives (Dialog, Dropdown, Select, Tabs, Toast, etc.)
- **shadcn/ui patterns**: Using class-variance-authority, clsx, tailwind-merge for component variants
- **Additional libraries**:
  - `framer-motion` for animations
  - `recharts` for data visualization
  - `vaul` for drawer/sheet components
  - `cmdk` for command palette
  - `embla-carousel-react` for carousels

### Document Processing

- DOCX: mammoth
- XLSX: xlsx
- PDF: Google Drive export API / pdf2json
- Images: Mistral OCR
- OCR: Mistral OCR for scanned documents

### DFE Data Integration

- **Service**: Get Information about Schools (GIAS)
- **API**: `/api/school/lookup` - School data lookup
- **Purpose**: Auto-detect school type, phase, religion for SIAMS/Ofsted context
- **Documentation**: `docs/DFE_INTEGRATION_SETUP.md`
- **Lazy Loading**: DFE client is lazy-loaded to avoid build issues (see `docs/LAZY_LOAD_DFE_CLIENT_FIX.md`)

---

## Core Libraries (apps/platform/src/lib/)

| File                            | Purpose                                                   |
| ------------------------------- | --------------------------------------------------------- |
| `actions-hub.ts`                | Action types, status matrix, EEF toolkit integration      |
| `ai-evidence-matcher.ts`        | AI matching engine for evidence to framework requirements |
| `eef-toolkit.ts`                | EEF research strategies with cost/evidence ratings        |
| `ofsted/types.ts`               | Primary Ofsted EIF 2025 framework data structure and logic                |
| `siams-framework.ts`            | SIAMS framework data                                      |
| `skills/`                       | AI skill definitions, function schemas, handlers          |
| `staff-directory.ts`            | Staff types and utilities                                 |
| `cloud-service.ts`              | Google Drive/OneDrive API integration                     |
| `extractors.ts`                 | Document text extraction                                  |
| `embeddings.ts`                 | Vector embeddings for semantic search                     |
| `supabase.ts`                   | Supabase client configuration                             |
| `pupil-pseudonymiser.ts`        | Client-side HMAC-SHA256 pupil data pseudonymisation       |
| `pupil-assessment-analyser.ts`  | Server-side gap analysis, teacher accuracy, EEF matching  |
| `living-sef-engine.ts`          | Living SEF document engine                                |
| `sef-data-aggregator.ts`        | SEF data aggregation across modules                       |
| `email-service.ts`              | Email service for notifications                           |
| `pii-masker.ts`                 | Legacy PII detection (deprecated)                         |
| `school-data-guardian.ts`       | Zero-Trust PII Firewall (Intercepts, scrubs, and tokens)  |

---

## Modules (built + specced)

One-line index. Follow the doc link for details — each doc owns its own spec.

| Module | Route | API | Docs |
| --- | --- | --- | --- |
| Staff Directory | `/dashboard/hr/people` | `/api/staff/*` | skill: `staff-directory` |
| Actions Hub | `/dashboard/actions-hub` | `/api/actions/*` | dual status + EEF backing; skill: `actions-hub` |
| Estates Compliance | `/estates-compliance` | `/api/estates/*` | `docs/modules/estates-compliance/SUMMARY.md` |
| Governance Portal | `/dashboard/governance` | `/api/governance/*` | board, governors, meetings, training, policies, visits |
| Ed Form Helper | (extension) | `/api/ed/form-helper/*`, `/api/form-templates/*` | `docs/ED_FORM_HELPER_SUMMARY.md` |
| SEND Hub | `/modules/send` | — | `docs/modules/sen-funding/` (specced, not built) |
| Staff Connectors | (cross-module) | — | `docs/STAFF_CONNECTORS.md` (specced, not built) |
| Website Builder | `/dashboard/website` | `/api/website/*` | Firecrawl compliance, 15 expert assessors |
| Intelligence Engine | `/dashboard/intelligence` | `/api/intelligence/*` | `@schoolgle/core-ai` pkg; HMAC-SHA256 pupil pseudonymisation; cohort/EEF/DfE |
| Trust Assessor | `/dashboard/school-improvement/trust-assessor` | `/api/trust-analysis/*` | `docs/TRUST_ASSESSOR_KNOWLEDGE_BASE.md` |
| Lesson Studio | `/dashboard/lesson-studio` | `/api/lesson-studio/*` | per-pupil personalisation, NC tagging |

Intelligence Engine key facts: KS2 filter `breakdown_topic = 'All pupils'`; cohort formula `cohort_reception_year = academic_year - year_group`; server NEVER sees pupil names.

---

## Ed AI Chatbot Architecture

Ed = multi-specialist chatbot in `packages/ed-agents/` (aliased `@schoolgle/ed-agents`).

**Pipeline:** User → Intent Classifier → Agent Router → Specialist → `SchoolDataGuardian` (PII scrub) → OpenRouter LLM → Guardrails → Response. Skills call `/api/skills/invoke`.

**Key files in `packages/ed-agents/src/`:**
- `orchestrator/` — orchestrator, agent-router, intent-classifier, context-loader
- `agents/agents.ts` — 14 specialist registry; prompts in `agents/prompts/`
- `models/` — OpenRouter only (no direct provider calls)
- `guardrails/pipeline.ts` — response safety
- `credit/manager.ts` — token/cost tracking

**Zero-trust rule (April 2026 migration):** ALL LLM calls route through OpenRouter AND `SchoolDataGuardian`. Never add direct provider SDK calls or bypass PII scrub. New AI features = formal Skills in `ed-agents` or go through `routeToSpecialist`.

**14 specialists + feature access by plan + full skill list:** see `docs/AGENT_DEFINITIONS.md` (single source of truth — update that file when changing any agent).

**API:** `/api/ed/chat`, `/api/ed/knowledge`, `/api/ed/analytics`, `/api/ed/embed`, `/api/ed/website-chat`, `/api/skills/invoke` (POST invoke, GET discovery).

**Zero-PII guarantee for Intelligence specialist:** cohort patterns only, never individual pupils by name (HMAC-SHA256 pseudonymised).

---

## Environment Variables Required

```bash
# Firebase (Authentication)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenRouter (AI Models)
OPENROUTER_API_KEY=
# Alternative: OPENAI_API_KEY=

# OAuth Providers
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=

# Firecrawl (Website Crawling — used by website compliance scanner & Ofsted readiness)
# If set, uses Firecrawl API for faster, more reliable website crawling
# If not set, falls back to Playwright-based crawler
FIRECRAWL_API_KEY=
```

---

## Testing

- **Vitest** for unit/integration tests (`vitest.config.ts`, jsdom, `@` → `src/`)
- **Playwright** for form-fill E2E (`packages/form-fill-lab/`)
- Test files: `*.test.ts` or `*.spec.ts`
- Integration Test Gate for external AI/API models: see MANDATORY Quality Rules above

---

## Skills System

- Definitions: `.agent/skills/<name>/SKILL.md` — register in `.agent/skills/INDEX.md`
- Schemas/handlers: `apps/platform/src/lib/skills/` — registry at `school-skills-registry.ts` (STAFF 6, ACTIONS 6, ESTATES 8, ESTATES_SPATIAL 6, INTELLIGENCE 6, RISK 6, DOCUMENT 7)
- API: `POST /api/skills/invoke` (execute), `GET /api/skills/invoke` (discover)
- Docs: `docs/SKILLS_SYSTEM.md`
- **Adding a new skill:** create SKILL.md → add to INDEX.md → schemas in `src/lib/skills/` → API route → test via invoke endpoint

Skills Lab (prototyping sandbox): `skills-lab/` — knowledge bases, TS prototypes, example conversations.

Module registry: `apps/platform/src/lib/modules/registry.ts` (defines modules, apps, role-based access).

---

## Ofsted Framework Architecture

### EIF 2025 Standard

The codebase exclusively uses the **New EIF 2025 Framework** (`ofsted/types.ts`):

- 4 Key Judgements (EIF 2025)
- Updated types and assessment structure
- New rating system: exceptional, strong_standard, expected_standard, needs_attention, urgent_improvement

### Rating System

- `OFSTED_RATING_INFO` defines the 5-point rating scale
- Each rating has a label, color, text color, description, and numeric score
- Ratings are used throughout assessments and readiness calculations

---

## Integration Context

See `docs/INTEGRATION_ARCHITECTURE.md` for context on migrating apps from the separate Vercel repository. The project is designed as a **federated monorepo** where each app can be independent while sharing core infrastructure (auth, database, billing, UI components).

### Key Integration Principles

- **Unified Authentication**: Single Supabase project across all apps with organization-based access control
- **App Access Control**: Subscription-based feature flags determine which apps users can access
- **Module Themes**: Each app has its own accent color while sharing consistent UI patterns
- **Revenue Priority**: Focus on apps that can generate immediate revenue (One-Click Reports, Mock Inspector, Compliance Suite)

---

## API Routes Structure

The API is organized by domain under `apps/platform/src/app/api/`:

| Domain                      | Routes                                                           | Purpose                          |
| --------------------------- | ---------------------------------------------------------------- | -------------------------------- |
| `/api/admin/*`              | health, subscriptions                                            | Admin operations                 |
| `/api/auth/*`               | verify, profile                                                  | Authentication                   |
| `/api/estates/*`            | assets, contractors, tasks, helpdesk, evidence                   | Estate management                |
| `/api/estates-compliance/*` | routines, daily-checks, diary                                    | Compliance workflows             |
| `/api/governance/*`         | board, governors, meetings, training, policies, visits           | Governance portal                |
| `/api/organization/*`       | members, invitations, import, template                           | Organization management          |
| `/api/packs/*`              | crud, versions, templates, export                                | Pack system                      |
| `/api/siams/*`              | assessments, church-status, school-lookup                        | SIAMS framework                  |
| `/api/intelligence/*`       | analysis, contextual-factors, cohort-outcomes, pupil-assessments | School intelligence              |
| `/api/ed/*`                 | chat, knowledge, analytics, embed, website-chat                  | Ed AI chatbot                    |
| `/api/compliance/*`         | policies, training, gdpr, tasks, scr, complaints, etc.           | Compliance module                |
| `/api/ofsted/*`             | inspect, evidence, connections, document-check                   | Ofsted readiness                 |
| `/api/sdp/*`                | plans, priorities                                                | School development plan          |
| `/api/sef/*`                | assessments, data                                                | Self-evaluation form             |
| `/api/skills/*`             | invoke                                                           | Skills execution (43+ functions) |
| `/api/staff/*`              | crud, import, export                                             | Staff directory                  |
| `/api/subscription/*`       | checkout, webhook, invoices, gocardless                          | Billing                          |
| `/api/tasks/*`              | crud                                                             | Unified tasks                    |
| `/api/documents/*`          | templates, generate, send, newsletter                            | Document production              |
| `/api/risk/*`               | register, heatmap, mitigations, decisions, score                 | Risk register                    |
| `/api/meetings/*`           | CRUD, start, complete, checklist, minutes, sign, templates       | Meeting companion                |
| `/api/surveys/*`            | CRUD, pages, questions, responses, analyze, distribute           | Survey builder                   |

---

## NotebookLM Integration

Internal tooling only (training podcasts, research, newsletter content) — **NOT for production Schoolgle features**. Uses undocumented Google APIs; dedicated account, not primary. 2s delays between batch ops.

See `tools/notebooklm/README.md` for setup, scripts (`youtube_fetcher.py`, `scheduler.py`), notebook IDs, and workflows. Claude Code skill: `/notebooklm`.

---

## Troubleshooting

### Build Issues

- **Build fails with Turbopack**: Run with `npm run dev --webpack` (uses webpack instead)
- **ed-widget errors**: The widget is stubbed out for marketing pages - only import in dashboard routes
- **Type errors during build**: Currently ignored in config, but run `npm run typecheck` to see them
- **Module resolution errors**: Check webpack aliases in `next.config.ts`, restart dev server after changes

### Database Issues

- **Supabase migrations**: Use `supabase db push` or manually run SQL in Supabase dashboard
- **RLS policy errors**: Check Supabase dashboard for policy details, ensure organization_id is set
- **Connection errors**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### AI/Model Issues

- **OpenRouter rate limits**: Check usage at openrouter.ai/keys, consider upgrading plan
- **Model failures**: Fallback logic automatically retries with alternative models
- **High AI costs**: Review `ai-evidence-matcher.ts`, consider switching to cheaper models

### Authentication Issues

- **Firebase auth errors**: Check Firebase console for API key restrictions
- **Supabase auth errors**: Verify RLS policies, check `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- **OAuth failures**: Verify callback URLs in Firebase console match your domain

### Testing Issues

- **Test files not found**: Ensure `*.test.ts` or `*.test.tsx` suffix, check vitest.config.ts
- **jsdom errors**: Check `vitest.config.ts` environment is set to `jsdom`
- **Playwright failures**: Ensure browsers installed: `npx playwright install`

---

## Schoolgle-Specific Conventions

**API Route Auth** — all routes must use `protectedRoute` wrapper unless intentionally public:

```typescript
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  // auth provides: userId, email, organizationId, role
  return apiSuccess({ data });
});
```

- For `[id]` routes: extract ID from `req.nextUrl.pathname` (wrapper doesn't pass params)
- Intentionally public: webhooks, OAuth callbacks, DfE lookups, survey submissions, ed embed/website-chat
- Coverage: ~95% of routes (310+/325)

**Layout** — route groups `(dashboard)/`, `(marketing)/`, `(auth)/`. API by domain `/api/{domain}/*`. Components in `src/components/{domain}/`, business logic in `src/lib/`.

**Stack** — Next.js 16 Server Components by default (mark `"use client"` only when needed). Radix UI + Tailwind + class-variance-authority + Lucide. SWR for remote state. Supabase `@supabase/ssr` server-side, `@supabase/supabase-js` client-side. RLS enabled on every table with org-based policies. Migrations timestamp-prefixed.

**Git** — `feature/` branches, Conventional Commits, PR required before main merge.

---

## Marketing & Sales Materials

All marketing docs live in `docs/marketing/`:

| File/Directory                      | Purpose                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `INDEX.md`                          | Master index of all marketing materials                                                                                  |
| `AI-IN-SCHOOLS-GUIDE.md`            | Plain English AI guide for school leaders (GDPR, safety, practical advice)                                               |
| `COMPETITIVE-ANALYSIS.md`           | Competitor landscape analysis                                                                                            |
| `LA-SCHOOLS-STRATEGY.md`            | Local Authority targeting strategy                                                                                       |
| `UPSELL-STRATEGY.md`                | Upsell playbook (free → paid → trust)                                                                                    |
| `demo-scripts/LA-HEADS-BRIEFING.md` | Demo script for LA headteacher briefings                                                                                 |
| `modules/01-11`                     | Per-module pitch sheets (Ofsted, Estates, HR, Governance, Actions, Intelligence, Ed, Risk, Meetings, Documents, Surveys) |
| `modules/07a-ed-vs-staff-cost.md`   | Ed vs staff cost comparison — the "11p/hour" pitch                                                                       |
| `pitch-deck/school-in-a-box.html`   | 14-slide pitch deck (open in browser, F11 for fullscreen)                                                                |

### Pricing Model

- **Ed AI Assistant**: Two products — Ed In-School (£500/yr) and Ed Website Chat (£500/yr)
- **Foundation tiers**: 1/2/3 year contracts, LA vs Academy financial year alignment
- **Key pitch**: "20% of your problems consume 80% of your time" — systems expertise angle

---

## Useful File Paths

| Purpose               | Path                                                    |
| --------------------- | ------------------------------------------------------- |
| Environment variables | `.env.local` (root)                                     |
| Main app config       | `apps/platform/next.config.ts`                          |
| TypeScript config     | `apps/platform/tsconfig.json`                           |
| Tailwind config       | `apps/platform/tailwind.config.ts`                      |
| Supabase migrations   | `apps/platform/supabase/migrations/`                    |
| AI model config       | `apps/platform/src/lib/ai-evidence-matcher.ts`          |
| Skills registry       | `.agent/skills/INDEX.md`                                |
| Module registry       | `apps/platform/src/lib/modules/registry.ts`             |
| Auth context          | `apps/platform/src/context/SupabaseAuthContext.tsx`     |
| API routes            | `apps/platform/src/app/api/`                            |
| Components            | `apps/platform/src/components/`                         |
| Cross-module map      | `docs/CROSS_MODULE_ARCHITECTURE.md`                     |
| Staff Connectors spec | `docs/STAFF_CONNECTORS.md`                              |
| SEND Hub specs        | `docs/modules/sen-funding/`                             |
| Agent definitions     | `docs/AGENT_DEFINITIONS.md`                             |
| Claude Code agents    | `.claude/agents/` (coder, reviewer, tester)             |
| VECTOR review agent   | `.codex/AGENTS.md`                                      |
| Ed specialist prompts | `packages/ed-agents/src/agents/prompts/`                |
| Ed agent registry     | `packages/ed-agents/src/agents/agents.ts`               |
| Auto memory           | `.claude/projects/C--Git-Schoolgle-Improvement/memory/` |

---

## Marketing Idea Auto-Capture

**IMPORTANT**: During any conversation, if the user mentions something that is clearly a marketing idea, campaign concept, competitive insight, sales angle, content idea, or positioning thought — even if they're talking about something else — Claude MUST:

1. **Recognise it** — marketing ideas often come up naturally during technical or strategic conversations
2. **Capture it** — create a new file in `docs/marketing/ideas/NNN-idea-name.md` using the template from `docs/marketing/ideas/INDEX.md`
3. **Update the index** — add it to the pipeline table in `docs/marketing/ideas/INDEX.md`
4. **Acknowledge briefly** — mention "Captured that as idea #NNN" so the user knows it's been filed
5. **Continue the conversation** — don't derail the current task

**Examples of things to capture:**
- "We should position this as..." → capture as positioning idea
- "That's like how [competitor] does..." → capture as competitive insight
- "Schools would love it if we showed..." → capture as content/visual idea
- "What if we did a LinkedIn post about..." → capture as content idea
- "The motorway sign thing could also work for..." → capture as campaign extension
- Anything mentioning: LinkedIn, pitch, demo, campaign, messaging, branding, website copy, sales, pricing angle

**What NOT to capture:**
- Technical implementation decisions (those belong in code/docs)
- Bug reports or feature requests (those are development tasks)
- Questions the user asks (only capture if they suggest an answer worth keeping)

**Competitor scraping**: When asked to "update competitor intel" or "scrape competitors", use Chrome DevTools MCP or Playwright to visit competitor sites, take screenshots, extract features/pricing/claims, and save to `docs/marketing/competitor-intel/breakdowns/`.

**NotebookLM source**: When asked to "compile NotebookLM pack", concatenate all marketing materials into a single `docs/marketing/automation/notebooklm-source.md` file for upload to Google NotebookLM.

See `docs/marketing/automation/MARKETING-AUTOMATION.md` for the full system documentation.

---

## Memory System

This repository has an auto memory system that persists information across conversations at `.claude/projects/C--Git-Schoolgle-Improvement/memory/`.

**When to save memories**:

- Confirm patterns across multiple interactions (not single occurrences)
- Document architectural decisions and rationale
- Save user preferences for workflow and tools
- Record solutions to recurring problems

**What NOT to save**:

- Session-specific context (current task details, in-progress work)
- Information that might be incomplete (verify against project docs first)
- Anything duplicating CLAUDE.md instructions
- Speculative conclusions

**Searching past context**:

```bash
# Search memory files
Grep with pattern="<search term>" path=".claude/projects/C--Git-Schoolgle-Improvement/memory/" glob="*.md"

# Search session transcripts (last resort)
Grep with pattern="<search term>" path="C:\Git\Schoolgle_Improvement/" glob="*.jsonl"
```

---
