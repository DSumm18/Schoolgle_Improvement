# Schoolgle Admin Console — Build-Out Prompt

> Copy everything from `## Prompt` to `End of prompt.` into a fresh Claude Code session. Self-contained briefing — no prior context needed.

---

## Prompt

You are continuing work on **Schoolgle** (`/Users/jarvis/dev/Schoolgle_Improvement`), a multi-tenant Next.js 16 platform for UK schools. User is David Summerscales (solo founder, CEO, vibe coder — follow Superpowers + gstack methodology). You take local, reversible actions autonomously; you ask before destructive or cross-cutting changes.

### One system, one scope (do NOT expand beyond this)

Build the **Schoolgle Admin Console** — David's admin panel for running the Schoolgle SaaS. Four functions:

1. **Customers** — see every customer organisation (trusts + schools), onboard new ones, view members
2. **Subscriptions** — toggle modules/apps, manage plans, run the trial → paid → renewal lifecycle
3. **Invoicing** — view and issue invoices for paid subscriptions
4. **Monitoring** — live status of who's on trial, who's expiring, who's lapsed, who's active

**Not in scope (different system entirely):** David's separate OpenClaw / founder-ops dashboard that runs on his Mac Mini via Cloudflare Tunnel (repo `DSumm18/mission-control`, Supabase `dybdxegrgofmmlvkthqb`). That is a cross-project tool, NOT the Schoolgle admin. Never touch it, never propose to merge it.

### Where it lives

- **Code**: inside this repo, in a new route group `apps/platform/src/app/(admin)/`
- **Host**: `admin.schoolgle.co.uk` — served by the same Vercel project (`schoolgle-improvement`) via hostname-based middleware
- **Gate table**: `mc_admin_users` (has `role` enum `super_admin/admin/viewer` — designed for multiple admin users as you scale)
- **Subscription canon**: `subscriptions.enabled_modules text[]` (single source of truth)

### What already exists (VERIFY before touching — there's confusing naming here)

Two unfinished prior attempts both live inside this repo. Part of this session is unifying them into the single `(admin)` surface.

**A. `/admin/super`** (`apps/platform/src/app/(dashboard)/admin/super/page.tsx`, 866 lines, client component) — works today
- Stats cards, school search, module toggle grid, trial buttons (+7/+30 days), impersonation
- Gated on `super_admins` table (David has owner row)
- Impersonation API: `apps/platform/src/app/(dashboard)/admin/impersonate/route.ts`
- The Total Schools stat-card click-handler at line 542 is broken (placeholder)

**B. `(mission-control)` route group** (`apps/platform/src/app/(mission-control)/…`) — partial, broken
- Pages: `page.tsx`, `clients/page.tsx`, `finance/page.tsx`, `activity/page.tsx`, `skills/page.tsx`, `approvals/page.tsx`
- Gated on `mc_admin_users` (David has super_admin row)
- `clients/page.tsx` reads `mc_contracts.active_modules` which is empty → display is broken
- **Remove the "mission-control" naming entirely** — it was named after an unrelated system of David's and has caused weeks of confusion

**The duplicate-module-table bug:**

| Table | Column | Populated | Canonical? |
|---|---|---|---|
| `subscriptions` | `enabled_modules text[]` | ✅ 8 rows | ✅ Yes — `lib/subscription/state.ts` gates app access on this |
| `mc_contracts` | `active_modules text[]` | ❌ 0 rows | ❌ No — duplicate; drop the column |

### Other key facts

- **Module registry**: `apps/platform/src/lib/modules/registry.ts` — canonical list. 7 modules: `improvement`, `governance`, `business-ops`, `compliance`, `communications`, `intelligence`, `teaching`. Each has child "apps" (`AppDefinition.moduleId`). David thinks in modules; end-users use apps.
- **Subscription state**: `apps/platform/src/lib/subscription/state.ts` — single source of truth for "does org X have module Y". Reads `subscriptions.status`, `enabled_modules`, `trial_end`, `current_period_end`.
- **Trial API**: `apps/platform/src/app/api/subscription/trial/route.ts` — currently hard-coded 7-day trial. Needs updating to 30-day default (see Phase 2).
- **Impersonation**: sessionStorage keys `impersonateOrgId`, `impersonateOrgName`, `impersonateBy`. Banner: `apps/platform/src/components/ImpersonationBanner.tsx`.
- **API auth**: `protectedRoute` wrapper in `lib/api-utils.ts`. For routes without `organizationId` in URL: `{ orgOptional: true }`.
- **Database**: Supabase project `ygquvauptwyvlhkyxkwy`. Service role key in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`. Vercel project `schoolgle-improvement` (`prj_IymTRpfLnDwzNdX7yea7CRLWhXNO`) on team `dsummerscales46-gmailcoms-projects`.

### Tables in play

```
organizations            — id, name, urn, parent_organization_id, organization_type
organization_members     — organization_id, auth_id, user_id, role
super_admins             — user_id, email, access_level, can_impersonate, can_manage_subscriptions, can_view_financials
mc_admin_users           — id, email, role (super_admin/admin/viewer), is_active
subscriptions            — organization_id, plan_id, product, status, enabled_modules, trial_end, current_period_end, user_limit, ...
subscription_audit_log   — subscription_id, organization_id, action, old_status, new_status, new_plan_id, notes, performed_by
mc_contracts             — organization_id, contract_type, contract_status, start_date, end_date, active_modules (DROP), annual_value, notes
mc_invoices              — contract_id, organization_id, invoice_number, status, amount, total_amount
mc_communications        — organization_id, log_type, direction, subject, body, status
impersonation_log        — admin_id, admin_email, organization_id, organization_name, action, ip_address
```

### The work — phased

Use `superpowers:writing-plans` to produce a plan doc at `docs/superpowers/plans/2026-04-22-admin-console-buildout.md` BEFORE coding.

**Phase 0 — Foundations (no feature code)**
- Configure `admin.schoolgle.co.uk` on the `schoolgle-improvement` Vercel project (DNS is GoDaddy — verify CNAME target)
- Add middleware routing so `(admin)` resolves only on `admin.schoolgle.co.uk` and returns 404 on `schoolgle.co.uk`; the customer dashboard `(dashboard)` resolves only on the main domain
- Create new empty route group `apps/platform/src/app/(admin)/` with its own layout
- Gate reconciliation: use `mc_admin_users` going forward. Migrate the granular flags from `super_admins` (`can_impersonate`, `can_manage_subscriptions`, `can_view_financials`) onto `mc_admin_users` as columns. Keep both tables during migration; drop `super_admins` after parity is verified.
- Module-table reconciliation: drop `mc_contracts.active_modules`. Keep `mc_contracts` for commercial metadata only (`annual_value`, `signed_by`, `document_url`, `start_date`, `end_date`).

**Phase 1 — Customers (list + detail)**
- `admin.schoolgle.co.uk/customers` — table of every customer org. Columns: name, URN, plan, status, trial days left, modules count, member count. Search by name/URN. Click → detail.
- `admin.schoolgle.co.uk/customers/[orgId]` — detail page with:
  - Summary card (org name, type, members, last login, subscription status, plan)
  - **Module grid** — each module from `registry.ts` as a card (registry colour when enabled, greyscale when disabled). Click card → expands to show child apps with per-app toggles. Module-level toggle enables/disables all apps under it.
  - Members list (read-only for now)
  - Impersonate button (existing API at `/api/admin/impersonate` — reuse, move into `(admin)` path)
- Data-model addition: add `subscriptions.enabled_apps text[]` to support per-app toggling. Migration in `apps/platform/supabase/migrations/`.
- Design: light mode, clean info design, no animation, Poppins.

**Phase 2 — Subscription lifecycle (the hard one — design carefully)**
- **Default trial = 30 days** (update `/api/subscription/trial/route.ts`).
- Required `subscriptions.status` values (confirm enum, migrate if missing): `trialing`, `trial_expired`, `active`, `past_due`, `suspended`, `cancelled`
- Before coding the controls, produce a short design note in the plan doc covering:
  1. School banner + email cadence on day 28 / 30 / 31 (specify, don't build yet)
  2. Conversion: does "Convert to paid" generate an `mc_invoices` row, or just flip status?
  3. Renewal: annual default; auto-renew vs manual-renew flag?
  4. Grace period on `past_due` before auto-suspend (propose 14 days)
  5. Suspend = recoverable, cancel = terminal — confirm?
  6. "Grant days" control: extends `trial_end` (status stays/returns to `trialing`); audit-log the reason
- Then build on the customer detail page:
  - Trial expiry datepicker → `trial_end`, status=`trialing`
  - Renewal datepicker → `current_period_end`
  - Grant days preset (+7 / +14 / +30) + custom N input
  - Convert to paid → `status=active`, `current_period_start=now()`, `current_period_end=now()+1y`, optional "generate invoice" tickbox
  - Suspend → `status=suspended`, modules frozen
  - Cancel → `status=cancelled`, prompts for reason
  - Reactivate → restores last non-terminal status
- Every action writes `subscription_audit_log` with `performed_by`, `old_status`, `new_status`, `notes`

**Phase 3 — Invoicing**
- `admin.schoolgle.co.uk/invoicing` — list all `mc_invoices`, filter by status, customer, date
- Issue new invoice for a customer + line items
- Mark paid / overdue
- PDF export (use existing doc-gen infra if available)

**Phase 4 — Overview + cleanup**
- `admin.schoolgle.co.uk` root dashboard: stats (total customers, trials active, trials expiring in 7d, revenue, past-due count), "Expiring soon" list, recent activity feed (merge `subscription_audit_log` + `impersonation_log`)
- Fix the broken Total-Schools click on `/admin/super` → redirect visitors to `admin.schoolgle.co.uk` instead
- Delete `(mission-control)` route group entirely
- Delete `(dashboard)/admin/super` route and retire the `super_admins` table (after migrating flags in Phase 0)
- Update nav: remove any admin links from the customer dashboard layout

### Testing approach (MUST follow)

Multi-tenant product handling student data. Regression-test every phase on:

- **David** — `dsummerscales46@gmail.com` / auth `d1640650-ed16-4fef-913e-244f984e093b` — admin; lands on PAYMAT
- **Alex** (school admin, not admin) — `a.summerscales@ghps.paymat.org` / `9fb23479-02c6-4956-a336-07a9dfd20c62` — MUST NOT resolve anything on `admin.schoolgle.co.uk`
- **PAYMAT trust** — `4a82a4ed-dbf0-453a-8066-963382471cd2` — root, 7 child schools
- **Grove House** — URN `148201`, org `d9d1ac2c-5eff-4043-98f4-e1c43f616fd3`, PAYMAT child, `enabled_modules=["improvement"]`
- **Rawdon St Peter's** — URN `107903`, org `7c5f74f5-0f8b-41b9-9e3a-6c3d7e8f9a0b`, standalone

Playwright via magic-link injection (`/tmp/playwright-paymat-regression.mjs` template). Headless, screenshot every change.

**Before claiming done** (per CLAUDE.md):
1. `npm run build` from `apps/platform/` passes
2. Screenshots of each UI change
3. Test hostname routing: `admin.schoolgle.co.uk/customers` 200s for David, 404s for Alex; `schoolgle.co.uk/customers` 404s for everyone
4. Unit tests for any new server actions
5. Integration test: toggle a module on PAYMAT → confirm `subscriptions.enabled_modules` → confirm `lib/subscription/state.ts` returns the updated list → confirm the customer dashboard respects it

### Hard rules

- **Never use the name "Mission Control"** in this codebase's admin console — code, routes, URLs, UI copy, commit messages, none of it. It refers to a completely separate system of David's.
- **Never touch** `DSumm18/mission-control` repo, the `dybdxegrgofmmlvkthqb` Supabase, the `schoolgle-mission-control` Vercel project, or the `control.schoolgle.co.uk` domain.
- **Never hardcode** an organisation ID. No `if (orgId === '…')` branches. PAYMAT and Grove House are customers, not platform state.
- **Never bypass** `subscription_audit_log` — every admin-driven state change gets a row.
- **Never expose** `(admin)` routes to non-admins. Check the gate on every server component load.
- **Single source of truth** for module enablement: `subscriptions.enabled_modules`. Anything else is wrong.

### Deliverables

1. Plan doc at `docs/superpowers/plans/2026-04-22-admin-console-buildout.md`
2. Phase 0: `admin.schoolgle.co.uk` routed via middleware, `(admin)` route group scaffolded, gate + module table reconciled
3. Phase 1: customers list + detail with module/app toggles
4. Phase 2: subscription lifecycle controls with audit logging, default 30-day trial
5. Phase 3: invoicing view + issue flow
6. Phase 4: dashboard + cleanup (kill `(mission-control)` + `/admin/super`)
7. One commit per phase, branch `feature/admin-console-buildout`
8. Screenshot evidence in final chat message (David as admin at `admin.schoolgle.co.uk`; Alex hitting 404)

### Files to read on first pass

```
apps/platform/src/app/(dashboard)/admin/super/page.tsx              # what works today — absorb it
apps/platform/src/app/(dashboard)/admin/impersonate/route.ts        # impersonation — keep, move under (admin)
apps/platform/src/app/(mission-control)/                            # partial work — absorb useful bits, delete the name
apps/platform/src/lib/modules/registry.ts                           # canonical module list
apps/platform/src/lib/subscription/state.ts                         # auth check lib — source of truth
apps/platform/src/lib/mission-control/auth.ts                       # gate logic for mc_admin_users
apps/platform/src/app/api/subscription/trial/route.ts               # existing trial — update default to 30d
apps/platform/supabase/migrations/20260407_mission_control_phase1.sql
apps/platform/supabase/migrations/20260409170000_mission_control_crm.sql
CLAUDE.md
~/.claude/CLAUDE.md
```

### Ask David these before starting

1. **Per-app toggling**: module-level only, or module + per-app from day one? If per-app, approve adding `subscriptions.enabled_apps text[]`.
2. **Conversion invoicing**: auto-generate `mc_invoices` on "Convert to paid", or manual?
3. **Suspend vs cancel**: distinct (suspend = recoverable) or collapse to one?
4. **Auto-renew default**: new paid subs auto-renew, or manual click each year?
5. **Grace window** on `past_due` before auto-suspend — propose 14 days. Confirm or override.
6. **Admin access besides David**: Alex, support staff? At what `mc_admin_users.role` (`super_admin` / `admin` / `viewer`)?

End of prompt.
