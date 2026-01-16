# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Schoolgle** is an AI-powered evidence management system for UK schools preparing for Ofsted and SIAMS inspections. The platform automatically scans Google Drive/OneDrive folders, extracts evidence from documents, and maps them to framework requirements using AI.

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
```

### Platform App Specific (cd apps/platform/)
```bash
npm run dev           # Start dev with webpack (not Turbopack)
npm run build         # Build for production
npm run typecheck     # TypeScript type checking
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
├── ed-backend/        # Backend logic for evidence detection
├── ed-widget/         # Widget components (uses Vite)
├── ed-extension/      # Browser extension
├── form-fill-lab/     # Form automation with Playwright tests
├── form-skill/        # Form filling skill
├── mcp-server/        # MCP server implementation
└── shared/            # Shared types and utilities
```

---

## Key Architecture Decisions

### Next.js Configuration (apps/platform/next.config.ts)
- Uses **webpack** instead of Turbopack due to config conflicts
- `@schoolgle/ed-widget` is aliased to a stub module (`src/lib/ed-widget-stub.ts`) for the marketing site
- TypeScript and ESLint errors are ignored during builds (`ignoreBuildErrors: true`)

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

**To change models**: Update `MODEL_CONFIG` in `ai-evidence-matcher.ts` and document rationale in README.md.

### Database
- **Supabase** with pgvector extension for semantic search
- Migrations in `apps/platform/supabase/migrations/`
- Core tables: `users`, `organizations`, `evidence`, `assessments`, `actions`, `documents`

### Document Processing
- DOCX: mammoth
- XLSX: xlsx
- PDF: Google Drive export API / pdf2json
- Images: Mistral OCR
- OCR: Mistral OCR for scanned documents

---

## Core Libraries (apps/platform/src/lib/)

| File | Purpose |
|------|---------|
| `ai-evidence-matcher.ts` | AI matching engine for evidence to framework requirements |
| `ofsted-framework.ts` | Ofsted framework data structure and logic |
| `siams-framework.ts` | SIAMS framework data |
| `cloud-service.ts` | Google Drive/OneDrive API integration |
| `extractors.ts` | Document text extraction |
| `embeddings.ts` | Vector embeddings for semantic search |
| `assessment-updater.ts` | Auto-update assessments based on evidence |
| `supabase.ts` | Supabase client configuration |

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
- Evidence management, Ofsted/SIAMS framework views, action tracking

### Evidence System
- `apps/platform/src/lib/evidence/` - Evidence types and utilities
- `apps/platform/src/components/evidence/` - Evidence UI components

### Pack System
- `apps/platform/src/lib/packs/` - Pack types and utilities
- `apps/platform/src/components/packs/` - Pack UI components

---

## Git Repository Notes

- Main branch: `main`
- Recent work: Antigravity-style redesign with planet logo and interactive effects
- Significant untracked files in `apps/platform/src/app/(dashboard)/` - new dashboard structure being implemented

---

## Integration Context

See `docs/INTEGRATION_ARCHITECTURE.md` for context on migrating apps from the separate Vercel repository. The project is designed as a federated monorepo where each app can be independent while sharing core infrastructure.

---

## Troubleshooting

- **Build fails with Turbopack**: Run with `npm run dev --webpack` (uses webpack instead)
- **ed-widget errors**: The widget is stubbed out for marketing pages - only import in dashboard routes
- **Type errors during build**: Currently ignored in config, but run `npm run typecheck` to see them
- **Supabase migrations**: Use `supabase db push` or manually run SQL in Supabase dashboard
