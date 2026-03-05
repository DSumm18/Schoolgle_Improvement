# Schoolgle Codebase Audit: Ed Skills & AI Architecture

**Date:** February 9, 2026
**Scope:** AI Skill-based architecture, Ed Chatbot, Estates/Helpdesk Module, Database Schema, and Communication Integrations.

---

## 1. Ed Chatbot Implementation

### 1.1 Overview
Agent "Ed" exists as a multi-domain AI assistant designed to support school staff with compliance, management, and work tasks. It is implemented as a monorepo package and integrated into the platform via API and UI widgets.

### 1.2 AI Model & Logic
- **Models:** Integrated via **OpenRouter** (configured via `OPENROUTER_API_KEY`). Defaults to high-performance models (Google Gemini / GPT-4 via bridge).
- **Core Package:** `packages/ed-agents`
- **Orchestration:** Managed by `EdOrchestrator` (`packages/ed-agents/src/orchestrator/orchestrator.ts`).
- **Intent Classification:** Uses a dedicated intent classifier (`intent-classifier.ts`) to determine if queries are work-related.
- **Specialist Personas:** Domain-specific system prompts exist in `packages/ed-agents/src/agents/prompts/`:
    - `estates-specialist.ts` (IOSH/NEBOSH qualified persona)
    - `hr-specialist.ts`
    - `communications-specialist.ts`
    - `data-specialist.ts`
    - `send-specialist.ts`
    - `governance-specialist.ts`

### 1.3 UI & Deployment
- **UI:** Integrated as a widget (`packages/ed-widget`) and button components in the platform (`apps/platform/src/components/estates/EdChatButton.tsx`).
- **Parent vs Staff:** Directories `apps/ed-parent` and `apps/ed-staff` exist, suggesting separate public-facing and internal-facing versions.
- **Context Awareness:** Ed can ingest page state (URL, title, visible text, screenshot) via the browser extension (`packages/ed-extension`) and a specialized context loader (`context-loader.ts`).

---

## 2. API Routes Strategy

### 2.1 Ed Chat API
- **Endpoint:** `POST /api/ed/chat` (`apps/platform/src/app/api/ed/chat/route.ts`)
- **Capabilities:**
    - Handles greetings contextually.
    - Routes to specialist agents.
    - Bridges to skill invocation.
    - Supports browser automation via `/api/ed/automate`.

### 2.2 Skill Invocation API
- **Endpoint:** `POST /api/skills/invoke` (`apps/platform/src/app/api/skills/invoke/route.ts`)
- **Purpose:** Synchronous execution of platform functions by the AI.
- **Supported Modules:** Staff Directory, Actions Hub.

---

## 3. Skills Architecture

### 3.1 Registry & Handlers
- **Registry:** `apps/platform/src/lib/skills/school-skills-registry.ts`
    - Defines structured JSON schemas for functions like `create_staff_member`, `suggest_eef_strategy`, `list_actions`, etc.
- **Detection Logic:** Currently relies on keyword/regex matching in `packages/ed-agents/src/agents/skills-agent.ts` rather than native LLM tool-calling.
- **Execution:** Bridges to library services in `apps/platform/src/lib/`.

### 3.2 Wave 1 Skills Status
| Skill | Status | Location |
|---|---|---|
| **Staff Directory** | Partially Integrated | `lib/staff-directory.ts` |
| **Actions Hub (Pupil Premium)** | Partially Integrated | `lib/actions-hub.ts` & `lib/eef-toolkit.ts` |
| **Estates Compliance** | In Development | `lib/estates-compliance/` |
| **Website Compliance** | Documentation Only | `skills-lab/skills/website-compliance-checker.ts` |
| **HT Report Generator** | Documentation Only | `skills-lab/skills/ht-report-generator.ts` |

---

## 4. Estates / Helpdesk Module Audit

### 4.1 Helpdesk & Tickets
- **Service:** `HelpdeskService.ts` (`apps/platform/src/lib/estates-compliance/services/HelpdeskService.ts`)
- **Ticket Lifecycle:** `draft` -> `open` -> `in_progress` -> `resolved` -> `closed`.
- **Key Fields:** Title, Description, Priority (Critical/High/Medium/Low), Reporter, Assignee, Location, Domain (Fire/Water/Legionella/etc.), Resolution Notes, Actual Cost.
- **Escalation:** Built-in escalation logic to critical priority.

### 4.2 Contractor Management
- **Service:** `ContractorService.ts`
- **Features:**
    - Accreditation management (IOSH, SafeContractor, etc. with expiry tracking).
    - Contract management (start/end/renewal dates).
    - Preferred status toggle.
    - Service type filtering (Gas, Electrical, Lifts, etc.).

### 4.3 Automated Workflows
- **Existing:** `reminder-service.ts` calculates upcoming/overdue tasks and generates notification data.
- **Gaps:** Actual sending logic is currently a placeholder (Console log with TODO for Email/Twilio).

---

## 5. Communication & External Services

- **Email:** Placeholder logic in `notification-service.ts` and `reminder-service.ts`.
- **SMS/Twilio:** Identified as a requirement; no active integration code found (Placeholders only).
- **TTS (Text-to-Speech):** Integrated via `microsoft-cognitiveservices-speech-sdk` and `edwina-voice.ts` in `lib`.
- **Database:** Supabase for Auth, DB, and RLS. Managed via RLS policies on tables like `organizations`, `users`, and `mc_skill_executions`.

---

## 6. Database Schema Overview (Supabase)

Key tables supporting the AI Ecosystem:
- `mc_skills`: Definitions of AI skills.
- `mc_tools`: Definitions of external tools (APIs).
- `mc_skill_executions`: Audit log of all skill calls.
- `tool_definitions`: Metadata for risk levels and sanitization.
- `estates_helpdesk_tickets`: Helpdesk records.
- `organizations`: Multi-tenant isolation.
- `api_keys`: Management for external AI services.

---

## 7. Strategic Assessment

### 7.1 Infrastructure Readiness: 65%
- **Strengths:** Orchestration framework is solid; monorepo structure is well-organized; sub-module service layers (Estates, Staff) are robust.
- **Weaknesses:** Skill invocation relies on pattern-matching; communication bridges (Email/SMS) are not wired to live providers; RAG ingestion pipeline is missing.

### 7.2 Top 5 Build Priorities
1. **Native LLM Tool-Calling:** Update the Orchestrator to use LLM `tools` (function-calling) instead of regex matching in `skills-agent.ts`.
2. **Notification Bridge:** Integrate a live provider (Twilio for SMS, Postmark/SendGrid for Email).
3. **Knowledge Ingestion (RAG):** Build a pipeline to ingest the `skills-lab/knowledge` MD files into a vector store (or context window).
4. **Human-in-the-Loop UI:** Create the "Approval Hub" where staff can review AI-drafted actions before they commit to DB.
5. **Estates Automation:** Wire the `reminder-service.ts` to a CRON job / Edge Function to trigger live notifications.

### 7.3 Reuse vs Rewrite
- **Reuse:** Specialist prompts, Functional Service layers, Supabase Schema, Orchestration logic.
- **Rewrite:** `skills-agent.ts` detection logic (needs to be LLM-native), Placeholder notification functions.

---
*Audit conducted by Antigravity AI.*
