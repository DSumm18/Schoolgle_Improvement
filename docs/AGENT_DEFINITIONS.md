# Agent Definitions — Single Source of Truth

> **Last updated:** 2026-04-06
> **Purpose:** Central index of ALL agent definitions across the Schoolgle monorepo.
> Every agent — whether it's a Claude Code dev agent, an Ed specialist, or a review persona — is catalogued here.

---

## 1. Claude Code Development Agents

Location: `.claude/agents/`

These agents are invoked by Claude Code for development tasks within this repo.

| Agent | File | Model | Tools | Purpose |
|-------|------|-------|-------|---------|
| **Coder** | `coder.md` | sonnet | Read, Write, Edit, Bash, Grep, Glob | Writes/edits production code, runs builds, commits |
| **Reviewer** | `reviewer.md` | sonnet | Read, Grep, Glob | Adversarial code review — bugs, security, spec drift |
| **Tester** | `tester.md` | sonnet | Read, Write, Edit, Bash, Grep, Glob | Writes tests, runs test suites, verifies builds |

**All dev agents** must follow:
- Project `CLAUDE.md` and global `~/.claude/CLAUDE.md` rules
- Worker Agent Test Requirements (test-first, evidence-based)
- Post results to Notion OUTBOX: `33812d38-a96f-81a2-98c4-f18b2ad2d6b7`

---

## 2. VECTOR — Adversarial Review Agent

Location: `.codex/AGENTS.md`

**VECTOR** (Validation, Edge-case, Customer, Technical, Outcome Reviewer) is a hired-gun consultant persona for brutal, honest code reviews.

**Three Lenses:**
1. **School User Lens** — Would Sandra the SBM / Helen the Headteacher / Governors actually use this?
2. **Spec Delivery Lens** — Does this match the 7-planet module system? Is it worth £500?
3. **Data & Compliance Lens** — Is pupil data safe? RLS enforced? ICO-compliant?

**Output:** Verdict, User Score /10, Spec Score /10, Data Safety Score /10, Critical Issues, Significant Issues, Questions, One Thing Done Well.

---

## 3. Ed AI Specialist Agents (14 Specialists + 1 General)

Location: `packages/ed-agents/src/agents/`

Registry: `agents.ts` | Prompts: `prompts/*.ts`

These are the domain-specialist agents that power Ed, the school AI assistant. Each has a system prompt with qualifications, domain keywords, capabilities, and response format rules.

| # | Agent | ID | Domain | Qualifications | Key Expertise |
|---|-------|----|--------|---------------|---------------|
| 1 | Estates Specialist | `estates-specialist` | `estates` | IOSH, NEBOSH, IWFM Level 4 | RIDDOR, fire, asbestos, legionella, electrical, contractors |
| 2 | HR Specialist | `hr-specialist` | `hr` | CIPD Level 7, MCIPD | Sickness, contracts, maternity, performance, disciplinary |
| 3 | SEND Specialist | `send-specialist` | `send` | NASENCO, M.Ed SEND | EHCP, graduated approach, annual reviews, funding |
| 4 | Data Specialist | `data-specialist` | `data` | MSc Data Science, IGCSE | Census, CLLA, attendance, GDPR, workforce census |
| 5 | Curriculum Specialist | `curriculum-specialist` | `curriculum` | NPQSL, MA Curriculum, ex-Ofsted | Ofsted deep dives, pedagogy, key stage transitions |
| 6 | IT Tech Specialist | `it-tech-specialist` | `it-tech` | CompTIA A+, Azure, CCNA | Networks, Google/Microsoft admin, SIMS/Arbor, Chromebooks |
| 7 | Procurement Specialist | `procurement-specialist` | `procurement` | MCIPS, CIPS Level 6 | Frameworks, tendering, value for money (Trusts plan) |
| 8 | Governance Specialist | `governance-specialist` | `governance` | NPQH, DfE trainer, ex-MAT chair | Board roles, trust governance, Ofsted governance |
| 9 | Communications Specialist | `communications-specialist` | `communications` | CIPR Diploma, journalism | Parent/staff comms, media, crisis communication |
| 10 | Form Specialist | `form-specialist` | `general` | — | Form filling, wording, red flags, RIDDOR help |
| 11 | Intelligence Specialist | `intelligence-specialist` | `intelligence` | MSc Ed Research & Data Science, EEF assessor | Cohort tracking, attainment gaps, EEF, DfE trends |
| 12 | Risk Specialist | `risk-specialist` | `risk` | IRM Certified, ISO 31000 | Risk registers, 5x5 scoring, 4T framework, ATH 2025 |
| 13 | Canvas Specialist | `canvas-specialist` | `canvas` | Data ETL, GDPR Art 5(1)(d) | Smart data ingestion, MIS detection, field matching |
| 14 | Ed General | `ed-general` | `general` | — | Routing, platform guidance, general support |

### Feature Access by Plan

| Plan | Domains Available |
|------|-------------------|
| Free | general, it-tech |
| Schools | All except procurement, governance |
| Trusts | All domains |

### Skill Categories Available to Ed (51+ functions)

| Category | Count | Functions |
|----------|-------|-----------|
| Staff Directory | 6 | create/update/list/export/import/deactivate staff |
| Actions Hub | 6 | create/update/list actions, stats, EEF strategies, notes |
| Estates & Compliance | 8 | helpdesk, contractors, compliance tasks, knowledge base, doc extraction, spatial |
| Estates Spatial | 6 | floor plans, asset locations, QR scans, energy readings |
| Intelligence & Data | 6 | analysis, cohort journey, assessment insights, contextual factors, DfE trends, signals |
| Risk Register | 6 | risk CRUD, heatmap, mitigations, decisions, score recalc |
| Document Production | 7 | templates, generate, list, get, send, newsletter |
| Form Helper | 6 | detect forms, start session, field questions, verify, change requests, field summary |

---

## 4. Core-AI Persona Agents

Location: `packages/core-ai/agents/`

These are lightweight persona wrappers around the base AI agent class. Separate from the Ed specialist system.

| Agent | File | Purpose |
|-------|------|---------|
| **Ed** | `ed.ts` | Main school assistant persona (British English, confident, friendly) |
| **Hugh** | `hugh.ts` | Translation specialist for multi-language support |
| **Kate** | `kate.ts` | Personal assistant for scheduling and organizational tasks |

Base class: `agent.ts` — `AgentBase` with system instruction and voice profile.

---

## 5. Cross-Cutting Rules for All Agents

These rules apply to EVERY agent regardless of type:

1. **No PII in plaintext.** Pupil data uses SHA-256(UPN+salt) pseudonymisation. Names resolved live from Google Drive only.
2. **RLS enforced.** Every Supabase query must be scoped to the authenticated school's organization.
3. **Test everything.** No agent claims something works without evidence (curl output, test results, screenshots).
4. **Respect existing patterns.** Check how the codebase already handles similar cases before introducing new patterns.
5. **Commit frequently.** Small, descriptive commits. Never accumulate 500 lines of uncommitted changes.

---

## Maintenance

When adding a new agent:
1. Create the definition file in the appropriate location
2. Add an entry to this index
3. Update `CLAUDE.md` if the agent count or categories change
4. For Ed specialists: register in `packages/ed-agents/src/agents/agents.ts` and add a prompt file in `prompts/`
