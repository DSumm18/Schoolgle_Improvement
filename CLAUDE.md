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
- **Current Skills**: staff-directory, actions-hub, estates-supervisor, compliance-legionella, deep-research, guardian-privacy, ed-form-helper

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

| Purpose | Path |
|---------|------|
| Environment variables | `.env.local` (root) |
| Main app config | `apps/platform/next.config.ts` |
| TypeScript config | `apps/platform/tsconfig.json` |
| Tailwind config | `apps/platform/tailwind.config.ts` |
| Supabase migrations | `apps/platform/supabase/migrations/` |
| AI model config | `apps/platform/src/lib/ai-evidence-matcher.ts` |
| Skills registry | `.agent/skills/INDEX.md` |
| Module registry | `apps/platform/src/lib/modules/registry.ts` |
| Auth context | `apps/platform/src/context/SupabaseAuthContext.tsx` |
| API routes | `apps/platform/src/app/api/` |
| Components | `apps/platform/src/components/` |
| Auto memory | `.claude/projects/C--Git-Schoolgle-Improvement/memory/` |

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
