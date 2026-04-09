# Schoolgle External System Audit & Architecture Report

## Executive Summary

This report provides a comprehensive external audit of the **Schoolgle** project, a monorepo-based EdTech platform designed to help UK schools manage compliance, improvement, and intelligence. Evaluating the codebase from an external architectural perspective, the system demonstrates an ambitious, feature-rich design that successfully meshes modern AI paradigms (multi-agent orchestrations, OpenRouter, RAG) with traditional SaaS architecture (Turborepo, Next.js, Supabase, RLS). 

The platform's ambition is reflected in its vast scope (Estates, HR, Governance, Form Filling, Intelligence Engine, School Website Builder). However, as is common with rapidly evolving AI-integrated apps, there are structural gaps, technical debt, and architectural inconsistencies that must be resolved to ensure the platform is robust, scalable, and "shipping-ready".

---

## 1. System Interconnectivity & Data Flow

The project's vision relies on a tightly integrated ecosystem where data flows across traditionally siloed domains. 

### How the Modules Connect
* **The Intelligence Engine (`school-intelligence-engine.ts`)**: This is the heart of the analytical interconnectivity. It successfully aggregates external DfE warehouse data (attendance, KS2, census) with internal contextual factors (e.g., HR absences, Estates disruptions) to provide root-cause analysis for cohort outcomes.
* **The AI Agent Orbit ('Ed')**: Organized via `ed-agents`, the system uses an Intent Classifier to route user requests to 14 domain-specific specialists. The agents execute tool calls (over 43 skills) that pull real-time data from the database, ensuring the AI responses are grounded in the school's actual context rather than generic LLM hallucinations.
* **Database & RLS Interlinks**: The PostgreSQL (Supabase) schema is highly relational. Core items like `lesson_observations` and `actions` are directly tied to `ofsted_subcategories` and `siams_questions`. This ensures that an action taken in one module (e.g., HR performance review) can feed directly into the Ofsted Self-Evaluation Form (SEF) generator.

### Effectiveness of the Strategy
The strategy of client-side pseudonymisation (HMAC-SHA256) for pupil data before hitting the AI/server is an excellent approach to GDPR compliance in an AI-first application. Cross-module data sharing via Supabase is structurally sound as it relies on unified database relations rather than brittle API-to-API communication.

---

## 2. Identified Gaps & Architectural Inconsistencies

Despite the strong conceptual architecture, an audit of the documentation, schema, and directory structures reveals several critical gaps:

### A. Authentication Identity Crisis
* **The Gap**: There is a severe contradiction in the authentication architecture. `README_ARCHITECTURE.md` explicitly asserts the use of "Native Supabase Auth... Uses Supabase Auth (not Firebase)". However, `CLAUDE.md`, the `supabase_schema.sql` (which maps `users.id` to "Firebase UID"), and the presence of `firebase` in the root `package.json` suggest an incomplete migration from Firebase to Supabase Auth.
* **The Risk**: Dual auth systems or partially migrated auth state lead to token mismatch, orphaned users, and critically, severe security vulnerabilities regarding the `organization_id` claims that drive the vital Row Level Security (RLS) system.

### B. Over-reliance on "Ignore Errors" for Shipping
* **The Gap**: The Next.js configuration and `tsconfig.json` are currently configured to ignore TypeScript and ESLint errors during the build step (`ignoreBuildErrors: true`). 
* **The Risk**: While acceptable in early prototyping, ignoring type errors during the build of a complex, heavily-typed system (with many Zod schemas mapping to DB types) guarantees that silent runtime crashes will occur in production. 

### C. The EIF 2025 dual-framework split 
* **The Gap**: The codebase currently maintains two parallel Ofsted frameworks (`ofsted-framework.ts` for legacy 6-category and `ofsted/types.ts` for the November 2025 framework). 
* **The Risk**: Maintaining a "Legacy" vs "New" framework creates branched logic across the SEF aggregator, Evidence Matcher, and the AI intelligence context loader. There is a risk of AI generating advice on obsolete framework requirements.

### D. Monolithic Monorepo Bleed
* **The Gap**: Despite being structured as a Turborepo, the `apps/platform` app is acting as a monolithic dumping ground. Large sub-systems like `form-fill-lab`, `school-website-builder`, and complex `lib/*` engines are tightly coupled within the Next.js app rather than being isolated in respective `@schoolgle/*` packages.
* **The Risk**: This increases build times, makes cold starts heavier, and defeats the isolation benefits of a Turborepo, making it difficult to deploy independent micro-services (like the MCP server) without pulling in the entire Next.js dependency tree.

---

## 3. Tooling & Technical Recommendations

To push this product from a highly-functional prototype to an outstanding, enterprise-ready shipping product, the following changes are recommended:

### Codebase & Development Tooling
1. **Enforce Strict Builds**: Immediately remove `ignoreBuildErrors: true` from the `next.config.ts`. Run a concerted effort to clean up all TypeScript errors. An AI-driven codebase *must* rely on strict typing to ensure the structured outputs generated by AI (via Zod) strictly map to actual database operations.
2. **Package Extraction**: Refactor the platform. Move the `school-intelligence-engine`, `website-crawler`, and `ai-evidence-matcher` out of `apps/platform/src/lib` and into `packages/core-ai` or similar dedicated packages. This allows independent testing of complex logic without invoking the Next.js runtime.
3. **Deprecate Firebase Fully**: If the architecture has moved to Native Supabase Auth (which is superior given your reliance on Postgres RLS), rip out all Firebase dependencies, update the users table to drop the "Firebase UID" mapping, and ensure all JWTs are signed directly by Supabase. Update `CLAUDE.md` to reflect the single source of truth.

### Database & Backend Architecture
1. **Consolidate Ofsted Frameworks**: Prioritize a complete migration strategy to the EIF 2025 framework. Map legacy data to the new 4 Key Judgements and deprecate the old framework structures entirely to keep the AI context windows uncluttered.
2. **Module Entitlement Enforcement**: The DB defines a robust App Store entitlement system (`organization_modules`), but ensure that this gating is enforced directly at the API edge (e.g., via Next.js middleware) before spinning up heavy AI agents, ensuring un-entitled tools cannot even be listed to the LLM.
3. **AI Fallback Resilience**: The current OpenRouter fallback (DeepSeek -> Mistral -> Gemini) is a solid setup, but ensure the token/cost tracker is strictly tied to the actual model invoked, as costs vary wildly between DeepSeek v3 and Gemini Flash. Implement a hard circuit breaker for LLM timeouts.

### Security
1. **PII Masking Verification**: The client-side pseudonymisation is a brilliant architectural choice. However, an automated test suite should be mandated that aggressively tries to leak PII through the `pupil-pseudonymiser.ts` to ensure no raw names ever hit the LLM API. 

## 4. Next Steps for Shipping

If looking from the outside in, the project represents a massive leap in EdTech capability but suffers from surface-area bloat. **To ship an outstanding product, narrow the focus.**

1. **Phase 1: Stabilization (Weeks 1-2)**
   - Turn on strict typing. Resolve the Auth provider disconnect.
   - Separate the monolithic `lib/` directory into the defined Turborepo packages.
2. **Phase 2: Deprecation (Weeks 3-4)**
   - Remove the legacy Ofsted framework codebase.
   - Clean up untracked or abandoned "in-progress" files (e.g., older Drive integrations).
3. **Phase 3: Launch Scope Definition**
   - Ship the platform with the core modules (Intelligence, HR, Estates). Leave the "Specced, Not Yet Built" modules (SEND Hub, Staff Connectors) completely out of the UI and LLM context until the base is robust. 

**Conclusion:** Schoolgle is an incredibly well-thought-out system conceptually. The data structure effectively supports cross-pollination of data that schools desperately need. Resolving the technical debt surrounding type-safety, completing the Supabase migration, and isolating the business logic into packages will easily elevate this code from "prototype" to "enterprise".
