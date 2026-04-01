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

**Important**: Node.js 20.x is required (see `package.json` `engines`). Use `nvm use 20` or `nodeenv -n 20` to ensure correct version.

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
| `ofsted-framework.ts`           | Ofsted framework data structure and logic                 |
| `siams-framework.ts`            | SIAMS framework data                                      |
| `skills/`                       | AI skill definitions, function schemas, handlers          |
| `staff-directory.ts`            | Staff types and utilities                                 |
| `cloud-service.ts`              | Google Drive/OneDrive API integration                     |
| `extractors.ts`                 | Document text extraction                                  |
| `embeddings.ts`                 | Vector embeddings for semantic search                     |
| `firecrawl-crawler.ts`          | Firecrawl-based website crawler (primary, with Playwright fallback) |
| `website-crawler.ts`            | Playwright-based website crawler (fallback when no Firecrawl key)   |
| `assessment-updater.ts`         | Auto-update assessments based on evidence                 |
| `supabase.ts`                   | Supabase client configuration                             |
| `school-intelligence-engine.ts` | Cross-module intelligence analysis with DfE + EEF         |
| `pupil-pseudonymiser.ts`        | Client-side HMAC-SHA256 pupil data pseudonymisation       |
| `pupil-assessment-analyser.ts`  | Server-side gap analysis, teacher accuracy, EEF matching  |
| `living-sef-engine.ts`          | Living SEF document engine                                |
| `sef-data-aggregator.ts`        | SEF data aggregation across modules                       |
| `email-service.ts`              | Email service for notifications                           |
| `pii-masker.ts`                 | PII detection and masking                                 |

---

## Recently Built Modules

### Staff Directory (`/dashboard/hr/people`)

- **Purpose**: Manage school staff with round-trip CSV import/export
- **Features**: Add/edit staff, role assignments, import/export, CSV with embedded instructions
- **API**: `/api/staff/*` - CRUD, import/export endpoints
- **Skill**: `staff-directory` - AI can manage staff on user's behalf

### Actions Hub (`/dashboard/actions-hub`)

- **Purpose**: AI-augmented school improvement with dual status tracking
- **Features**: Create/update actions, EEF research backing, cost tracking, staff assignment
- **Dual Status**: User progress (draft→complete) + AI validation (not_met→met)
- **API**: `/api/actions/*` - CRUD endpoints
- **Skill**: `actions-hub` - AI can create/suggest actions with EEF strategies

### Estates Compliance (`/estates-compliance`)

- **Purpose**: Statutory compliance tracking with source attribution
- **Key Differentiator**: Separates statutory requirements from good practice/contractor suggestions
- **Features**: Asset register, contractor management, task scheduling, helpdesk, budget planning
- **Estates Evolution (NEW)**: Hierarchical locations, mobile inspections, harmonized AI skills
- **API**: `/api/estates/*` - Full CRUD for assets, contractors, tasks, helpdesk
- **Skills**: `estates-supervisor`, `compliance-legionella`
- **Documentation**: See `docs/modules/estates-compliance/SUMMARY.md` for complete details

### Governance Portal (`/dashboard/governance`)

- **Purpose**: Governor portal with board meetings, training tracking, policy management
- **Features**: Governor directory, meeting scheduling, visit tracking, training matrix
- **API**: `/api/governance/*` - Board, governors, meetings, training, policies, visits

### Ed Form Helper (NEW - ~80% Complete)

- **Purpose**: AI-powered form filling assistant with voice intelligence for non-English speakers
- **Key Features**: Multi-language voice input (17 languages), privacy-first design, adaptive UX based on user experience
- **Components**:
  - Backend skills: `apps/platform/src/lib/skills/form-helper*.ts`
  - API endpoints: `/api/ed/form-helper/*`, `/api/form-templates/*`
  - Browser automation: `packages/ed-extension/src/content/automation/`
  - UI components: `apps/platform/src/components/form-helper/`
- **AI Models**: Qwen 2.5 VL 72B (form detection), Gemini 2.0 Flash Lite (translation), Web Speech API (voice)
- **Database Schema**: `form_templates`, `form_template_fields`, `form_template_values`, `form_helper_sessions`
- **Privacy Guarantees**: Zero data retention, anonymous analytics only, no password/credit card forms
- **Documentation**: `docs/ED_FORM_HELPER_SUMMARY.md` - Complete implementation guide
- **Status**: Ready for integration testing and extension build

### SEND Hub (`/modules/send`) — Specced, Not Yet Built

- **Purpose**: Complete SEND management — SEN register, EHCP lifecycle, funding tracking, evidence packs, provision mapping
- **Key Features**: LA funding reconciliation (Element 1/2/3), EHCP annual review workflow, graduated approach (APDR) documentation, tribunal-ready evidence bundles
- **Cross-Module Integration**: Finance (CFR I03/E03), HR (staff allocation + payroll costing), Meetings (5 SEND templates), Governance (governor SEND report), Estates (accessibility), Intelligence (pupil assessment gaps)
- **Documentation**: `docs/modules/sen-funding/` — PRODUCT_SPEC.md, CROSS_MODULE_INTEGRATION.md, EVIDENCE_ECOSYSTEM.md, RESEARCH.md
- **Database**: `send_register`, `send_funding_allocations`, `send_provision_costs`, `send_evidence_files`, `send_review_history`
- **Status**: Fully specced, awaiting implementation

### Staff Connectors (Cross-Module) — Specced, Not Yet Built

- **Purpose**: Responsibility engine — tracks who holds which roles/duties, auto-generates tasks, monitors training/ratios, manages handover when staff leave
- **Two Types**: Statutory (platform-defined, ~20 types: DSL, SENCO, Fire Marshal, First Aider, etc.) and Custom (school-defined: subject leads, key holders, contract managers, etc.)
- **Key Features**: Active task generation from connector definitions, training expiry monitoring, ratio compliance (e.g. 1:100 first aiders), leaving staff impact analysis with one-click transfer
- **Cross-Module Surfacing**: Lives on staff profiles in HR; surfaces in Estates (fire marshals), SEND (SENCO), Compliance (statutory roles), Governance (governor link roles), Meetings (auto-invite)
- **Homepage Integration**: Each staff member sees "Your Responsibilities" dashboard with all tasks from all connectors
- **Ed AI Skills**: 6 new skills — list_my_connectors, get_connector_holder, check_compliance, get_leaving_impact, get_overdue_tasks, schedule_task
- **Database**: `connector_types`, `staff_connectors`, `connector_tasks`, `connector_change_log`, `contract_connector_links`
- **Documentation**: `docs/STAFF_CONNECTORS.md` — Full specification with data model, UI designs, implementation phases
- **Status**: Fully specced, awaiting implementation

### School Intelligence Engine (built March 2026)

- **Purpose**: Cross-references ALL data sources (DfE warehouse, contextual factors, cross-module signals from HR/Estates/Compliance/Governance) with EEF research to produce cohort-aware, research-backed analysis
- **Core Engine**: `apps/platform/src/lib/school-intelligence-engine.ts` — singleton `SchoolIntelligenceEngine` class
- **Key Capabilities**:
  - **Cohort Tracking**: Traces year groups backwards using `cohort_reception_year = academic_year - year_group`, auto-detects COVID lockdown impact
  - **DfE Data Trends**: Multi-year attendance, census, KS2, workforce, exclusions (KS2 filter: `breakdown_topic = 'All pupils'`)
  - **Cross-Module Signals**: Alerts from Estates, Compliance, HR, Governance modules
  - **EEF Strategy Matching**: 33 strategies ranked by `impact × evidence`, matched to gaps by keyword
  - **Full Analysis**: Sends all data to DeepSeek for AI pattern detection, stored in `school_intelligence_analyses`
  - **Inspection Context**: `buildInspectionContext()` feeds demographics + factors into AI Ofsted inspector
- **Pupil Assessment Analysis** (GDPR-safe zero-knowledge):
  - `pupil-pseudonymiser.ts` — Client-side HMAC-SHA256 hashing, MIS detection (Arbor, SIMS, Bromcom, etc.)
  - `pupil-assessment-analyser.ts` — Server-side gap analysis (FSM/SEND/gender/PP), teacher accuracy checking, EEF recommendations
  - `PupilAssessmentUploader.tsx` — Drag-and-drop CSV uploader, real-name preview (browser only), auto-pseudonymisation
  - **Privacy**: Server NEVER sees pupil names. HMAC-SHA256 with school-local salt in localStorage.
- **Database**: `school_cohorts`, `school_contextual_factors`, `school_cohort_outcomes`, `school_intelligence_analyses`, `school_assessment_imports`, `pupil_assessments_pseudo`, `pupil_analysis_insights`
- **Views**: `cohort_journey_ks2`, `cohort_journey_attendance`
- **API**: `/api/intelligence`, `/api/intelligence/contextual-factors`, `/api/intelligence/cohort-outcomes`, `/api/intelligence/pupil-assessments`
- **Migrations**: `20260309_school_intelligence_engine.sql`, `20260309_pupil_assessment_analysis.sql`
- **DfE Warehouse**: `attendance` (184K), `census` (146K), `ks2_results` (1M+), `workforce` (164K), `exclusions` (1.1M)

---

## Ed AI Chatbot Architecture

Ed is the school's AI assistant — a multi-specialist chatbot with domain expertise, function calling, and proactive intelligence.

### Architecture

```
User Message → Intent Classifier → Agent Router → Specialist Agent → LLM (OpenRouter) → Guardrails → Response
                                         ↓                               ↓
                                   Context Loader                  Skills (Function Calling)
                                   (School + Intelligence)         via /api/skills/invoke
```

### Core Package: `packages/ed-agents/src/`

- **Orchestrator**: `orchestrator/orchestrator.ts` — Main `EdOrchestrator` class, coordinates all processing
- **Agent Router**: `orchestrator/agent-router.ts` — Routes to specialist, manages LLM calls + tool execution
- **Intent Classifier**: `orchestrator/intent-classifier.ts` — Keyword scoring per domain, form detection, work-focus check
- **Context Loader**: `orchestrator/context-loader.ts` — School context, expert knowledge injection, proactive alerts, intelligence data
- **Agents Registry**: `agents/agents.ts` — 12 specialist definitions + domain keywords
- **Skills Agent**: `agents/skills-agent.ts` — LLM function-calling bridge to `/api/skills/invoke`
- **Models**: `models/` — OpenRouter integration, model selection by task type
- **Guardrails**: `guardrails/pipeline.ts` — Response safety checks
- **Perspectives**: `perspectives/generator.ts` — Multi-perspective for complex decisions
- **Communications**: `communication/` — Email (Resend), SMS (Twilio), TTS (Fish Audio)
- **Credit Manager**: `credit/manager.ts` — Token/cost tracking per session

### 12 Specialist Agents

| Agent                       | Domain           | Expertise                                                                    |
| --------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| Estates Specialist          | `estates`        | RIDDOR, fire, asbestos, legionella, electrical, contractors                  |
| HR Specialist               | `hr`             | Sickness, contracts, maternity, performance, disciplinary                    |
| SEND Specialist             | `send`           | EHCP, graduated approach, annual reviews, funding                            |
| Data Specialist             | `data`           | Census returns, CLLA, attendance codes, GDPR                                 |
| Curriculum Specialist       | `curriculum`     | Ofsted deep dives, pedagogy, key stage transitions                           |
| IT Tech Specialist          | `it-tech`        | Networks, Google/Microsoft admin, SIMS/Arbor, Chromebooks                    |
| Procurement Specialist      | `procurement`    | Frameworks, tendering, value for money (Trusts plan)                         |
| Governance Specialist       | `governance`     | Board responsibilities, trustee recruitment (Trusts plan)                    |
| Communications Specialist   | `communications` | Parent/staff comms, media, crisis communication                              |
| Form Specialist             | `form`           | Form filling, wording suggestions, red flags, RIDDOR help                    |
| **Intelligence Specialist** | `intelligence`   | Cohort tracking, attainment gaps, EEF research, teacher accuracy, DfE trends |
| Ed General                  | `general`        | Routing, platform guidance, general support                                  |

### Intelligence Specialist (NEW)

Ed's intelligence specialist has full access to:

- **6 callable skills**: `run_intelligence_analysis`, `get_cohort_journey`, `get_assessment_insights`, `get_contextual_factors`, `get_dfe_trends`, `get_cross_module_signals`
- **Proactive context**: When user is on intelligence pages, Ed automatically loads latest analysis, critical insights, active contextual factors, and assessment import status
- **60+ routing keywords**: cohort, attainment gap, EEF, progress, teacher assessment, scaled score, intervention, KS2, etc.
- **Zero-PII guarantee**: Ed discusses cohort patterns but never individual pupils by name (HMAC-SHA256 pseudonymised)

### Skill Categories Available to Ed (43+ functions)

- **Staff Directory** (6): create/update/list/export/import/deactivate staff
- **Actions Hub** (6): create/update/list actions, stats, EEF strategies, notes
- **Estates & Compliance** (8): helpdesk tickets, contractors, compliance tasks, knowledge base, document extraction, spatial analysis
- **Estates Spatial** (6): floor plans, asset locations, QR scans, energy readings
- **Intelligence & Data** (6): full analysis, cohort journey, assessment insights, contextual factors, DfE trends, cross-module signals
- **Risk Register** (6): risk CRUD, heatmap, mitigations, decisions, score recalc
- **Document Production** (7): list_document_templates, generate_document, list_generated_documents, get_document, send_document, generate_newsletter
- **Form Helper** (6): detect forms, start session, field questions, verify responses, change requests, field summary

### Feature Access by Plan

| Plan    | Domains Available                  |
| ------- | ---------------------------------- |
| Free    | general, it-tech                   |
| Schools | All except procurement, governance |
| Trusts  | All domains                        |

### API Endpoints

- **Chat**: `POST /api/ed/chat` — Main chat endpoint
- **Knowledge**: `GET/POST/PATCH /api/ed/knowledge` — Self-improving knowledge base
- **Analytics**: `GET /api/ed/analytics` — Usage analytics
- **Embed**: `GET /api/ed/embed?key=<key>` — Website embed JS loader
- **Website Chat**: `POST /api/ed/website-chat` — Public chat for embedded widget
- **Skills**: `POST /api/skills/invoke` — Unified skill execution
- **Skills Discovery**: `GET /api/skills/invoke` — List all available functions + categories

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

- **Vitest** for unit/integration tests (config: `vitest.config.ts`)
- **Playwright** for form-fill E2E tests (`packages/form-fill-lab/`)
- Test files: `*.test.ts` or `*.spec.ts`
- Tests run in jsdom environment with `@` alias for `src/`

---

## Key Features by Directory

### Marketing/Landing Pages

- `apps/platform/src/app/page.tsx` - Homepage
- `apps/platform/src/components/landing/` - Landing page components
- `apps/platform/src/components/website/` - Website components

### Dashboard Application

- `apps/platform/src/app/(dashboard)/` - Dashboard pages (using route groups)
- `apps/platform/src/app/(marketing)/` - Marketing/landing pages
- `apps/platform/src/app/(auth)/` - Authentication pages
- Evidence management, Ofsted/SIAMS framework views, action tracking

### Evidence System

- `apps/platform/src/lib/evidence/` - Evidence types and utilities
- `apps/platform/src/components/evidence/` - Evidence UI components

### Pack System

- `apps/platform/src/lib/packs/` - Pack types and utilities
- `apps/platform/src/components/packs/` - Pack UI components

### Skills System (AI Assistant)

- `.agent/skills/` - Skill definitions for AI assistant (SKILL.md files)
- `apps/platform/src/lib/skills/` - Function schemas and handlers
- `docs/SKILLS_SYSTEM.md` - Complete skills documentation
- **API**: `POST /api/skills/invoke` - Unified skill execution endpoint
- **Discovery**: `GET /api/skills/invoke` - List all available functions
- **Categories**: School Management, Governance & Compliance, Estates & Facilities, Research & Analysis, Intelligence & Data, Document Production
- **Current Skills**: staff-directory, actions-hub, estates-supervisor, compliance-legionella, deep-research, guardian-privacy, ed-form-helper, school-intelligence, document-production
- **Function Registry**: `apps/platform/src/lib/skills/school-skills-registry.ts` — 7 schema groups: STAFF (6), ACTIONS (6), ESTATES (8), ESTATES_SPATIAL (6), INTELLIGENCE (6), RISK (6), DOCUMENT (7)

**Adding a New Skill**:

1. Create skill directory: `.agent/skills/your-skill/`
2. Create `SKILL.md` with frontmatter (name, description, category, triggers)
3. Register in `.agent/skills/INDEX.md`
4. Add function schemas in `apps/platform/src/lib/skills/`
5. Implement API endpoints in `apps/platform/src/app/api/`
6. Test with the skills invoke endpoint

### Skills Lab

- `skills-lab/` - Knowledge-based skills system
- `skills-lab/knowledge/` - MD knowledge bases for skills
- `skills-lab/skills/` - TypeScript skill prototypes
- `skills-lab/examples/` - Conversation examples for training

### Module System

- `apps/platform/src/lib/modules/registry.ts` - Module and app definitions
- Modules are organizational units (e.g., governance, improvement, estates, hr)
- Apps are specific features within modules (e.g., ofsted-readiness, staff-directory, estates-audit)
- Each module has an accent color and icon for visual consistency
- Access control based on user roles (admin, headteacher, slt, teacher, governor, caretaker, viewer)

---

## Git Repository Notes

- Main branch: `main`
- Current branch: `feature/estates-evolution` (as of session start)
- Recent commits:
  - `feat(ed): implement Ed Form Helper with voice intelligence and learning mode`
  - `feat(estates): implement Estates Evolution - hierarchical locations, mobile inspections, and harmonized AI skills`
  - `chore: add additional Radix UI primitives for component library`
- Design: Antigravity-style redesign with planet logo and interactive effects
- Untracked files in `apps/platform/src/app/api/drive/`, `/api/ofsted/` - Google Drive/Ofsted integration in progress

---

## Ofsted Framework Architecture

### Dual Framework System

The codebase maintains **two** Ofsted frameworks:

1. **Legacy 6-Category Framework** (`ofsted-framework.ts`):
   - Used by most UI components
   - Categories: Quality of Education, Behaviour & Attitudes, Personal Development, Leadership & Management, Safeguarding (separate), Inclusion

2. **New EIF 2025 Framework** (`ofsted/types.ts`):
   - 4 Key Judgements (EIF 2025)
   - Updated types and assessment structure
   - New rating system: exceptional, strong_standard, expected_standard, needs_attention, urgent_improvement

### Framework Export Pattern

`ofsted.ts` serves as the main export file, re-exporting both frameworks for backwards compatibility. When working with Ofsted-related code, check which framework the component uses.

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

## NotebookLM Integration (tools/notebooklm/)

Google NotebookLM automation for research and content generation.

**Setup:**
```bash
# Install CLI
python -m pip install notebooklm-py[browser] yt-dlp

# Authenticate (one-time)
python -m notebooklm login
```

**Scripts:**
| Script | Purpose |
|--------|---------|
| `youtube_fetcher.py` | Auto-fetch latest videos from AI YouTubers |
| `scheduler.py` | Run scheduled tasks (fetch, status, list) |

**Notebooks:**
| Notebook | ID | Purpose |
|----------|-----|---------|
| AI News - YouTube Sources | `9be1115e` | 61 videos from AI/tech channels |
| Education Research | `f3db1de5` | EEF early years evidence |

**Usage from Claude Code:**
```
/schedule "0 9 * * *" python tools/notebooklm/scheduler.py fetch-youtube
```
(Runs daily at 9am to fetch new videos)

**Key Commands:**
```bash
# Check notebook status
python tools/notebooklm/scheduler.py status

# List all notebooks
python tools/notebooklm/scheduler.py list-notebooks

# Manual YouTube fetch
python tools/notebooklm/youtube_fetcher.py
```

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

## Development Patterns & Conventions

### File Organization

- **Route groups**: Use `(dashboard)`, `(marketing)`, `(auth)` for logical organization without affecting URL structure
- **API routes**: Organized by domain under `/api/{domain}/*` (e.g., `/api/staff/*`, `/api/estates/*`)
- **Components**: Organized by feature/domain in `src/components/{domain}/`
- **Libraries**: Core business logic in `src/lib/`, organized by domain

### Component Patterns

- **Server Components**: Default for all pages (Next.js 16)
- **Client Components**: Mark with `"use client"` directive only when needed (interactivity, hooks, browser APIs)
- **UI Primitives**: Prefer Radix UI over browser native elements for accessibility
- **Styling**: Use Tailwind CSS with class-variance-authority for component variants
- **Icons**: Use Lucide React consistently

### State Management

- **Server State**: Use React Server Components and Server Actions
- **Client State**: Use React Context API for global state (auth, theme)
- **Form State**: Use React Hook Form or native FormData with Server Actions
- **Remote State**: Use SWR for data fetching (already in dependencies)

### API Route Auth Pattern

All API routes must use the `protectedRoute` wrapper (unless intentionally public):

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
- Intentionally public: webhooks, OAuth callbacks, DfE lookups, survey submissions, ed embed/website-chat
- ~95% of routes (310+/325) now use this pattern

### Database Patterns

- **Supabase Client**: Use `@supabase/ssr` for server-side, `@supabase/supabase-js` for client-side
- **Row Level Security (RLS)**: Enable for all tables, use organization-based access control
- **Migrations**: Store in `apps/platform/supabase/migrations/` with timestamp prefix
- **Type Safety**: Generate TypeScript types from Supabase schema

### AI Integration Patterns

- **OpenRouter**: Primary AI model provider (multi-model support)
- **Model Selection**: Choose based on cost vs quality tradeoffs (see AI Model Stack section)
- **Function Calling**: Use structured schemas in `src/lib/skills/` for AI skill execution
- **Error Handling**: Always implement fallback logic for AI model failures
- **Cost Monitoring**: Track token usage and costs, especially for DeepSeek V3

### Testing Strategy

- **Unit Tests**: Vitest with jsdom environment, test files co-located with source
- **Integration Tests**: API route tests using Vitest
- **E2E Tests**: Playwright for form filling and user workflows
- **Test Naming**: Use `*.test.ts` or `*.test.tsx` suffix
- **Coverage**: Run with `npm run test:coverage`

### Git Workflow

- **Feature Branches**: Use `feature/` prefix for new features
- **Commit Messages**: Conventional Commits format (feat:, fix:, chore:, docs:)
- **Pull Requests**: Required before merging to main
- **Code Review**: At least one approval required

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

## Quick Reference

### Common Development Tasks

**Create a new API route**:

```bash
# Create file at apps/platform/src/app/api/your-domain/route.ts
# Export async function GET/POST/PUT/DELETE handlers
```

**Create a new page**:

```bash
# For dashboard: apps/platform/src/app/(dashboard)/your-page/page.tsx
# For marketing: apps/platform/src/app/(marketing)/your-page/page.tsx
```

**Add a new AI skill**:

```bash
# 1. Create .agent/skills/your-skill/SKILL.md
# 2. Add to .agent/skills/INDEX.md
# 3. Add schemas to apps/platform/src/lib/skills/
# 4. Create API endpoints
```

**Run database migration**:

```bash
# Create migration file in apps/platform/supabase/migrations/
# Run: supabase db push
# Or manually execute in Supabase dashboard
```

**Add a new module/app**:

```bash
# Update apps/platform/src/lib/modules/registry.ts
# Add module definition with accent color and icon
# Add app definition with access control
```

### Useful File Paths

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
