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

**Important**: Node.js 20.x is required (see `package.json` `engines`).

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

| Model | Purpose | Cost |
|-------|---------|------|
| `deepseek/deepseek-chat` | Primary analysis (95% of docs) | $0.24/M input |
| `mistral-ocr` | Scanned PDFs/images | ~$0.20-0.40/100 docs |
| `google/gemini-2.0-flash-lite-001` | Fallback/retry logic | $0.075/M input |
| `qwen/qwen-2.5-vl-72b-instruct` | Charts/diagrams (optional) | $0.40/M input |

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

| File | Purpose |
|------|---------|
| `actions-hub.ts` | Action types, status matrix, EEF toolkit integration |
| `ai-evidence-matcher.ts` | AI matching engine for evidence to framework requirements |
| `eef-toolkit.ts` | EEF research strategies with cost/evidence ratings |
| `ofsted-framework.ts` | Ofsted framework data structure and logic |
| `siams-framework.ts` | SIAMS framework data |
| `skills/` | AI skill definitions, function schemas, handlers |
| `staff-directory.ts` | Staff types and utilities |
| `cloud-service.ts` | Google Drive/OneDrive API integration |
| `extractors.ts` | Document text extraction |
| `embeddings.ts` | Vector embeddings for semantic search |
| `assessment-updater.ts` | Auto-update assessments based on evidence |
| `supabase.ts` | Supabase client configuration |

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
- **API**: `/api/estates/*` - Full CRUD for assets, contractors, tasks, helpdesk
- **Skills**: `estates-supervisor`, `compliance-legionella`
- **Documentation**: See `docs/modules/estates-compliance/SUMMARY.md` for complete details

### Governance Portal (`/dashboard/governance`)
- **Purpose**: Governor portal with board meetings, training tracking, policy management
- **Features**: Governor directory, meeting scheduling, visit tracking, training matrix
- **API**: `/api/governance/*` - Board, governors, meetings, training, policies, visits

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
- **Categories**: School Management, Governance & Compliance, Estates & Facilities, Research & Analysis
- **Current Skills**: staff-directory, actions-hub, estates-supervisor, compliance-legionella, deep-research, guardian-privacy

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
- Recent work: Antigravity-style redesign with planet logo and interactive effects
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

| Domain | Routes | Purpose |
|--------|--------|---------|
| `/api/admin/*` | health, subscriptions | Admin operations |
| `/api/auth/*` | verify, profile | Authentication |
| `/api/estates/*` | assets, contractors, tasks, helpdesk, evidence | Estate management |
| `/api/estates-compliance/*` | routines, daily-checks, diary | Compliance workflows |
| `/api/governance/*` | board, governors, meetings, training, policies, visits | Governance portal |
| `/api/organization/*` | members, invitations, import, template | Organization management |
| `/api/packs/*` | crud, versions, templates, export | Pack system |
| `/api/siams/*` | assessments, church-status, school-lookup | SIAMS framework |
| `/api/skills/*` | invoke | Skills execution |
| `/api/staff/*` | crud, import, export | Staff directory |
| `/api/subscription/*` | checkout, webhook, invoices, gocardless | Billing |
| `/api/tasks/*` | crud | Unified tasks |

---

## Troubleshooting

- **Build fails with Turbopack**: Run with `npm run dev --webpack` (uses webpack instead)
- **ed-widget errors**: The widget is stubbed out for marketing pages - only import in dashboard routes
- **Type errors during build**: Currently ignored in config, but run `npm run typecheck` to see them
- **Supabase migrations**: Use `supabase db push` or manually run SQL in Supabase dashboard
