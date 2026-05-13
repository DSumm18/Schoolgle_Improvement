# Estates Risk-Led Operating Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Estates easier to use by turning compliance, assets, contractors, evidence, risks, and strategy into one risk-led operating model.

**Architecture:** Keep Estates Compliance as the operational workbench, with Asset Register, Contractor Register, SOPs/Policies, Risk Register, and Estate Strategy as connected apps. Each operational event should create or update a clear trail: check/ticket/report → asset/contractor/evidence → risk → strategy/reporting where appropriate.

**Tech Stack:** Next.js App Router, React client components, Supabase-backed API routes, Vitest for pure domain logic, existing Ed skills via `/api/skills/invoke`.

---

## File Structure

- `apps/platform/src/lib/estates-compliance/compliance-briefing.ts` — pure compliance briefing and risk-of-failure scoring logic.
- `apps/platform/src/lib/estates-compliance/compliance-briefing.test.ts` — unit tests for compliance status, future risk, evidence confidence, and N/A checks.
- `apps/platform/src/components/estates-compliance/ComplianceCheckBriefing.tsx` — clean user-facing briefing card for check detail pages.
- `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/page.tsx` — integrates the briefing into each compliance check.
- Future slice: `apps/platform/src/lib/estates-compliance/contractor-history.ts` — contractor relationship timeline across contracts, reports, service records, complaints, spend, and linked assets.
- Future slice: `apps/platform/src/lib/estates-compliance/strategy-items.ts` — draft strategy item model from condition survey/report findings.
- Future slice: `apps/platform/src/app/(dashboard)/estate-strategy/` — finance/trustee-facing estate strategy app.

---

### Task 1: Compliance Check Briefing

**Files:**
- Create: `apps/platform/src/lib/estates-compliance/compliance-briefing.ts`
- Create: `apps/platform/src/lib/estates-compliance/compliance-briefing.test.ts`
- Create: `apps/platform/src/components/estates-compliance/ComplianceCheckBriefing.tsx`
- Modify: `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/page.tsx`

- [x] **Step 1: Write failing tests**

Test current evidenced checks, green compliance with future asset risk, overdue statutory checks without evidence, and not-applicable checks.

- [x] **Step 2: Implement pure scoring model**

Calculate separate values for compliance status, risk-of-failure score, confidence, key points, Ed prompts, KPIs, and a report-ready line.

- [x] **Step 3: Surface briefing card**

Render the card near the top of each compliance check detail page so the user gets the “where are we?” view before the form and history.

- [x] **Step 4: Link current open actions**

Fetch domain tasks and only include tasks that match the check ID/name, so the card can call out known open actions without overloading the page.

- [x] **Step 5: Validate**

Run: `npx vitest run src/lib/estates-compliance/compliance-briefing.test.ts`

Expected: 4 passing tests.

---

### Task 2: Contractor Record Hardening

**Files:**
- Inspect: `apps/platform/src/types/estates-compliance.ts`
- Inspect: `apps/platform/src/lib/estates-compliance/database/contractors.ts`
- Modify or create API/UI only after confirming current schema columns.

- [ ] **Step 1: Confirm canonical contractor schema**

Check whether `estates_contractors` already stores contact name, email, finance email, telephone, emergency contact, business details, DBS authority, insurance, accreditations, complaints, feedback, and preferred/restricted status.

- [ ] **Step 2: Add missing schema fields only where absent**

Add missing fields via Supabase migration instead of overloading JSON notes:
`finance_email`, `emergency_phone`, `emergency_contact_name`, `business_details`, `dbs_authority_status`, `complaints_count`, `last_feedback_rating`.

- [ ] **Step 3: Build contractor relationship timeline**

Aggregate contracts, reports, service records, helpdesk tickets, asset links, complaints, feedback, and spend into one timeline for each contractor page.

- [ ] **Step 4: Add Ed prompts**

When selecting a contractor, Ed should surface restrictions, expiring insurance/accreditations, complaints, warranty installer links, and recent spend.

---

### Task 3: Asset Warranty and Service Routing

**Files:**
- Inspect: `apps/platform/src/lib/estates-compliance/database/assets.ts`
- Inspect: `apps/platform/src/app/api/skills/invoke/route.ts`
- Modify ticket/check UI after confirming current asset picker behaviour.

- [ ] **Step 1: Verify warranty data path**

Confirm asset create/edit captures purchase date, installer/supplier, warranty dates, warranty provider, invoice number, purchase order, and documents.

- [ ] **Step 2: Add warning to ticket/check flows**

When a linked asset has active warranty, show: “Check warranty/installer before paid repair.”

- [ ] **Step 3: Require override reason for paid work under warranty**

If a user bypasses warranty routing, capture reason and log it to the asset history for finance review.

---

### Task 4: Condition Survey Draft Findings

**Files:**
- Inspect: `apps/platform/src/app/api/estates/condition-survey/route.ts`
- Inspect: `apps/platform/src/components/estates-compliance/FindingsAutoSuggest.tsx`
- Inspect: `apps/platform/src/lib/estates-compliance/findings-database.ts`

- [ ] **Step 1: Classify imported report findings**

Condition survey/report uploads create draft findings with type: `compliance_defect`, `operational_repair`, `lifecycle_concern`, `capital_pressure`, or `watchlist`.

- [ ] **Step 2: Default non-urgent lifecycle items to watchlist**

End-of-life boiler guidance should not create an immediate task unless statutory, urgent, or confirmed unsafe.

- [ ] **Step 3: Promote findings through human review**

Users approve whether a draft finding becomes a task, risk, strategy item, or remains watchlist.

---

### Task 5: Estate Strategy App

**Files:**
- Create: `apps/platform/src/app/(dashboard)/estate-strategy/page.tsx`
- Create: `apps/platform/src/lib/estates-strategy/`
- Add migration after data model review.

- [ ] **Step 1: Create finance-facing strategy item model**

Each item stores source module, school/site, linked risk, linked asset, evidence/report source, year bucket, estimated cost, confidence, proposed action, consequence if unfunded, approval status, and audit trail.

- [ ] **Step 2: Default to 3-year strategy**

Support optional 5-year view because DfE GEMS describes 3–5 year medium/long-term planning, but keep the default simple.

- [ ] **Step 3: Add budget decision trail**

Capture approve/defer/reject/change decisions with reason, approver, impact, and residual risk.

- [ ] **Step 4: Generate trustee update**

Produce a termly/quarterly report of new risks, changed priorities, unfunded items, and budget impact.

---

### Task 6: Ed Skills Verification

**Files:**
- Inspect: `apps/platform/src/lib/skills/school-skills-registry.ts`
- Inspect: `apps/platform/src/app/api/skills/invoke/route.ts`
- Inspect: `packages/ed-agents/src/agents/prompts/estates-specialist.ts`

- [ ] **Step 1: Verify callable estates skills**

Confirm Ed can create/update tickets, list overdue checks, get compliance status, get asset details, check warranty, draft warranty claim emails, log service visits, and create cost requests.

- [ ] **Step 2: Add missing compliance update skill if needed**

If Ed cannot update a statutory completion/check directly, add a controlled `record_compliance_check_completion` skill using the existing completion API.

- [ ] **Step 3: Add SOP/policy guardrails**

Ed should state the applicable SOP/policy, warn before unsafe bypasses, and record any approved deviation with reason.

---

## Self-Review

- Spec coverage: Covers the agreed user experience, connected registers, warranty routing, condition-survey triage, estate strategy, finance/trustee flow, and Ed skill checks.
- Placeholder scan: No placeholder implementation steps are included; future tasks are explicit but intentionally deferred.
- Scope check: Task 1 is delivered as the first working slice. Tasks 2–6 should be implemented in separate focused passes to avoid making the already-busy estates module noisier.
