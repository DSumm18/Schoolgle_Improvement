# CLAUDE.md

**Schoolgle** — AI-powered school improvement platform for UK schools. Single monorepo with Next.js 16 platform app and shared packages.

---

## 🚨 ACTIVE WORK: Onboarding Pipeline

**Current session work**: Building complete onboarding pipeline (interest → quote → contract → payment → activation)

📋 **See handover document**: [`HANDOVER_ONBOARDING.md`](./HANDOVER_ONBOARDING.md) for:
- Complete flow diagram
- API endpoints
- Testing checklist
- Pending work

🔗 **Local test URL**: http://localhost:3000/admin/onboarding

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| **UI Components** | Radix UI primitives, shadcn/ui patterns, Framer Motion, Recharts |
| **Auth** | Supabase Auth (Google/Microsoft OAuth), RLS |
| **Database** | Supabase (PostgreSQL) with pgvector extension |
| **AI Models** | OpenRouter multi-model: Gemini 2.0 Flash (primary), Mistral OCR (EU), Claude Sonnet (premium) |
| **Testing** | Vitest + jsdom, Playwright (form-fill E2E) |
| **3D** | Three.js, React Three Fiber (Drei) |

---

## Project Structure

```
apps/platform/          # Main Next.js web app
  src/
    app/
      (auth)/           # OAuth callback, login
      (dashboard)/      # Protected dashboard pages
      (marketing)/      # Public landing pages
      api/              # API routes by domain
    components/         # React components by feature
    context/            # SupabaseAuthContext (use this, not AuthContext.tsx)
    lib/                # Core business logic (see Key Libraries below)
    test/               # Test setup
  supabase/migrations/  # Database migrations

packages/
  ed-agents/            # Ed AI chatbot framework (specialist agents, skills)
  ed-backend/           # Evidence detection backend
  ed-extension/         # Browser extension (form automation)
  ed-widget/            # Widget components (aliased to stub in marketing)
  form-fill-lab/        # Playwright form-fill tests
  mcp-server/           # Model Context Protocol server
  shared/               # Shared types and utilities
```

---

## Key Libraries

| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client configuration |
| `supabase-server.ts` | Service role client (admin operations) |
| `ai-evidence-matcher.ts` | AI model routing, evidence matching |
| `pupil-pseudonymiser.ts` | Client-side HMAC-SHA256 pseudonymisation |
| `pupil-assessment-analyser.ts` | Server-side assessment gap analysis |
| `school-intelligence-engine.ts` | Cross-module intelligence with DfE + EEF |
| `ofsted-framework.ts` | Ofsted framework data |
| `siams-framework.ts` | SIAMS framework data |
| `cloud-service.ts` | Google Drive / OneDrive integration |
| `email-service.ts` | Resend email wrapper |
| `auth-middleware.ts` | Auth utilities for API routes |
| `skills/school-skills-registry.ts` | AI skill function schemas |

---

## Data Architecture Rules (NON-NEGOTIABLE)

### Pupil Data Privacy — Zero-Knowledge Architecture

1. **MIS pupil data MUST NEVER be stored in Supabase**
   - Pupil data stays in school's MIS (Arbor, SIMS, Bromcom, etc.)
   - Supabase only receives pseudonymised assessment data

2. **Pupil PII MUST NEVER be stored — only SHA-256(UPN+salt) pseudonymised references**
   - Client-side hashing: `pupil_hash = HMAC-SHA256(upn_or_name, school_salt)`
   - Salt stored in browser localStorage, NEVER sent to server
   - Server receives: `pupil_hash`, `year_group`, `is_fsm`, `is_send`, `attainment_level`, `scaled_score`
   - Server CANNOT identify pupils even with database access

3. **Pupil names resolved LIVE from Google Drive at display time**
   - When displaying pupil data, resolve names from the source file (Drive/OneDrive)
   - Do NOT cache names in Supabase
   - Lookup table (`pupil_hash → "First L."`) lives in browser only

### Implementation Files
- `src/lib/pupil-pseudonymiser.ts` — Client-side hashing
- `src/lib/pupil-assessment-analyser.ts` — Server-side gap analysis
- Migration `20260309_pupil_assessment_analysis.sql` — Schema

---

## Environment Variables

### Required
```bash
# Supabase (Database + Auth)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Models
OPENROUTER_API_KEY=           # Primary AI routing (Gemini, Mistral, Claude)
GEMINI_API_KEY=               # Gemini direct (voice, vision)
OPENAI_API_KEY=               # Optional fallback

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=

# Google Services
GOOGLE_API_KEY=               # Drive API, data connections

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Voice (Ed AI Assistant)
FISH_AUDIO_API_KEY=
NEXT_PUBLIC_FISH_AUDIO_API_KEY=
NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_ED=

# DfE Data (separate Supabase project)
DFE_SUPABASE_URL=
DFE_SUPABASE_SERVICE_ROLE_KEY=

# Optional
FIRECRAWL_API_KEY=            # Website crawling (if not set, uses Playwright)
CRON_SECRET=                  # Cron job authorization
NEXT_PUBLIC_APP_URL=          # Default: https://schoolgle.co.uk
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## Build Commands

```bash
# Development (uses webpack, not Turbopack)
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Testing
npm run test                  # Vitest
npm run test:ui               # Vitest UI
npm run test:coverage         # Coverage report

# Form-fill E2E tests
npm run test:formfill
npm run test:formfill:headed
```

**Node Version**: 20.x required

---

## API Route Auth Pattern

All protected routes use the `protectedRoute` wrapper:

```typescript
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  // auth provides: userId, email, organizationId, role
  return apiSuccess({ data });
});
```

Intentionally public routes: webhooks, OAuth callbacks, DfE lookups, survey submissions, ed embed/website-chat.

---

## AI Model Configuration

| Model | Purpose | Cost |
|-------|---------|------|
| `google/gemini-2.0-flash-001` | Primary (docs, xlsx, txt) | $0.001/request |
| `mistralai/mistral-ocr-latest` | OCR (scanned PDFs, images) | $0.002/request |
| `google/gemini-2.0-flash-lite-001` | Fallback/retry | $0.0003/request |
| `anthropic/claude-3.5-sonnet` | Premium (SEF generation) | $0.015/request |

Configure in `src/lib/ai-evidence-matcher.ts`. All models routed via OpenRouter.

---

## Ed AI Chatbot

**Package**: `packages/ed-agents/src/`

**Architecture**: User Message → Intent Classifier → Agent Router → Specialist Agent → LLM → Guardrails → Response

**13 Specialist Agents**: estates, hr, send, data, curriculum, it-tech, procurement, governance, communications, form, intelligence, risk, canvas, general

**Skills System**: 60+ callable functions via `/api/skills/invoke` (staff, actions, estates, intelligence, risk, documents, etc.)

---

## Dashboard Modules

Key modules in `src/app/(dashboard)/dashboard/`:
- `/improvement` — Ofsted readiness, evidence management
- `/estates` — Compliance, asset register, contractors
- `/hr` — Staff directory, sickness, cover, performance
- `/governance` — Board meetings, training, policies
- `/compliance` — GDPR, policies, training, SCR
- `/safeguarding` — DSL concern logging, triage
- `/risk` — Risk register, heatmap, ICFP
- `/actions-hub` — AI-augmented school improvement
- `/intelligence` — School intelligence engine, DfE trends
- `/send` — SEND register, funding tracking
- `/meetings` — Meeting companion with minutes
- `/surveys` — Survey builder
- `/documents` — Document production engine
- `/canvas` — Data intelligence platform

---

## Webpack Aliases (next.config.ts)

```typescript
"@schoolgle/ed-widget" → "packages/ed-widget/src"
"@schoolgle/ed-agents" → "packages/ed-agents/src"
```

For marketing pages, ed-widget resolves to a stub module (`src/lib/ed-widget-stub.ts`).

---

## TypeScript Config Notes

- `src/context/AuthContext.tsx` is **excluded** from compilation — use `SupabaseAuthContext` instead
- Test files (`*.test.ts`, `*.test.tsx`) excluded from type checking
- Path alias: `@/*` → `./src/*`

---

## Troubleshooting

- **Build fails**: Run with `npm run dev --webpack` (Turbopack has config issues)
- **ed-widget errors**: Only import in dashboard routes, not marketing (stubbed for marketing)
- **Type errors**: Currently ignored in builds (`ignoreBuildErrors: true`), run `npm run typecheck` to see
- **Module resolution**: Restart dev server after changing aliases in `next.config.ts`

---

## Quick Reference

| Task | Command/Path |
|------|--------------|
| Create API route | `apps/platform/src/app/api/your-domain/route.ts` |
| Create dashboard page | `apps/platform/src/app/(dashboard)/dashboard/your-page/page.tsx` |
| Add AI skill | Edit `src/lib/skills/school-skills-registry.ts` |
| Database migration | Create in `apps/platform/supabase/migrations/`, run in Supabase dashboard |
| Environment | `.env.local` at project root |
| Main config | `apps/platform/next.config.ts` |
| Migrations | `apps/platform/supabase/migrations/` |
