# Estates Client-Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the estates compliance module production-ready for new school clients, with Grove House Primary as the real test case.

**Architecture:** Fix the statutory check provisioning to use correct frequencies, seed Grove House with all 150+ checks, add 8 Ed AI skills for ticket/task creation with human-in-the-loop, and add governor PDF export. The dashboard, API routes, and database schema already exist and are solid.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase, Tailwind CSS, OpenRouter AI

---

### Task 1: Fix Provisioning to Use Correct Check Frequencies

**Files:**
- Modify: `apps/platform/src/lib/estates-compliance/database/statutory-completions.ts:438-457`
- Test: `apps/platform/src/lib/estates-compliance/database/statutory-completions.test.ts`

The `initializeDomainCompletions` function currently hardcodes "annual" for all checks. It needs to look up the actual frequency from `STATUTORY_CHECKS`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/platform/src/lib/estates-compliance/database/statutory-completions.test.ts
import { describe, it, expect } from 'vitest';
import { calculateNextDueDate } from './statutory-completions';
import { getChecksForDomain } from '../statutory-checks';

describe('calculateNextDueDate', () => {
  it('returns tomorrow for daily frequency', () => {
    const result = calculateNextDueDate('daily');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result).toBe(tomorrow.toISOString().split('T')[0]);
  });

  it('returns 7 days out for weekly frequency', () => {
    const result = calculateNextDueDate('weekly');
    const expected = new Date();
    expected.setDate(expected.getDate() + 7);
    expect(result).toBe(expected.toISOString().split('T')[0]);
  });

  it('returns 1 month out for monthly frequency', () => {
    const result = calculateNextDueDate('monthly');
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 1);
    expect(result).toBe(expected.toISOString().split('T')[0]);
  });

  it('returns 3 months out for quarterly frequency', () => {
    const result = calculateNextDueDate('quarterly');
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 3);
    expect(result).toBe(expected.toISOString().split('T')[0]);
  });
});

describe('statutory checks have valid frequencies', () => {
  it('all legionella checks have correct frequencies', () => {
    const checks = getChecksForDomain('legionella');
    expect(checks.length).toBeGreaterThan(0);
    for (const check of checks) {
      expect(['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'termly', 'ad_hoc', 'hourly']).toContain(check.frequency);
    }
  });

  it('all fire checks have correct frequencies', () => {
    const checks = getChecksForDomain('fire');
    expect(checks.length).toBeGreaterThan(0);
    for (const check of checks) {
      expect(['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'termly', 'ad_hoc', 'hourly']).toContain(check.frequency);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it passes (these are testing existing functions)**

Run: `npx vitest run apps/platform/src/lib/estates-compliance/database/statutory-completions.test.ts`
Expected: PASS

- [ ] **Step 3: Fix initializeDomainCompletions to use actual frequencies**

In `apps/platform/src/lib/estates-compliance/database/statutory-completions.ts`, replace the `initializeDomainCompletions` function (lines 438-457):

```typescript
export async function initializeDomainCompletions(
  organizationId: string,
  domain: ComplianceDomain,
  checks: Array<{ id: string; frequency: string }>,
): Promise<number> {
  let seeded = 0;
  for (const check of checks) {
    const existing = await getLatestCompletion(organizationId, check.id);

    if (!existing) {
      await createCompletion(organizationId, {
        check_id: check.id,
        compliance_domain: domain,
        next_due_date: calculateNextDueDate(check.frequency),
      });
      seeded++;
    }
  }
  return seeded;
}
```

- [ ] **Step 4: Update initializeAllStatutoryCompletions to pass frequency data**

Replace the existing function (lines 462-471):

```typescript
export async function initializeAllStatutoryCompletions(
  organizationId: string,
): Promise<{ totalSeeded: number; byDomain: Record<string, number> }> {
  const { getAllStatutoryChecks, getChecksForDomain } = await import('../statutory-checks');
  const domains = Object.keys(
    await import('../statutory-checks').then(m => m.DOMAIN_METADATA)
  ) as ComplianceDomain[];

  const byDomain: Record<string, number> = {};
  let totalSeeded = 0;

  for (const domain of domains) {
    const checks = getChecksForDomain(domain);
    const checksWithFreq = checks.map(c => ({ id: c.id, frequency: c.frequency }));
    const count = await initializeDomainCompletions(organizationId, domain, checksWithFreq);
    byDomain[domain] = count;
    totalSeeded += count;
  }

  return { totalSeeded, byDomain };
}
```

- [ ] **Step 5: Update API route to use simplified signature**

In `apps/platform/src/app/api/estates/statutory-completions/route.ts`, update the "initialize" case:

```typescript
case "initialize": {
  const result = await initializeAllStatutoryCompletions(organizationId);
  return apiSuccess({
    success: true,
    message: `Seeded ${result.totalSeeded} statutory completion records`,
    ...result,
  });
}
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run apps/platform/src/lib/estates-compliance/database/statutory-completions.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/platform/src/lib/estates-compliance/database/statutory-completions.ts apps/platform/src/lib/estates-compliance/database/statutory-completions.test.ts apps/platform/src/app/api/estates/statutory-completions/route.ts
git commit -m "fix(estates): use actual check frequencies in provisioning instead of hardcoded annual"
```

---

### Task 2: Seed Grove House Primary with Real Data

**Files:**
- Create: `apps/platform/src/app/api/estates/provision/route.ts`
- Test: manual curl test

This creates a provisioning endpoint that seeds all statutory checks for an organization. We'll use it to set up Grove House.

- [ ] **Step 1: Create the provision API route**

```typescript
// apps/platform/src/app/api/estates/provision/route.ts
import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { initializeAllStatutoryCompletions } from '@/lib/estates-compliance/database/statutory-completions';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * POST /api/estates/provision
 * Seeds all statutory compliance checks for an organization.
 * Idempotent — skips checks that already have completion records.
 */
export const POST = protectedRoute(async (auth) => {
  const { organizationId } = auth;

  // Verify the org exists
  const supabase = createServiceRoleClient();
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    return apiError('Organization not found', 404);
  }

  // Seed all statutory checks
  const result = await initializeAllStatutoryCompletions(organizationId);

  // Update org to mark estates as provisioned
  await supabase
    .from('organizations')
    .update({
      compliance_last_review: new Date().toISOString().split('T')[0],
    })
    .eq('id', organizationId);

  return apiSuccess({
    success: true,
    organization: org.name,
    ...result,
  });
}, { requiredRole: 'admin' });
```

- [ ] **Step 2: Test provisioning with curl**

```bash
# Get the org ID for Grove House from Supabase
# Then hit the provision endpoint:
curl -X POST http://localhost:3001/api/estates/provision \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

Expected: `{ success: true, totalSeeded: ~52, byDomain: { legionella: 8, fire: 7, ... } }`

- [ ] **Step 3: Verify in Supabase**

```sql
SELECT compliance_domain, count(*), 
  min(next_due_date) as earliest_due,
  max(next_due_date) as latest_due
FROM estates_statutory_completions 
WHERE organization_id = '<grove-house-org-id>'
GROUP BY compliance_domain
ORDER BY compliance_domain;
```

Expected: All 18 domains with correct check counts, varied due dates (not all annual).

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/app/api/estates/provision/route.ts
git commit -m "feat(estates): add provisioning endpoint to seed statutory checks for new schools"
```

---

### Task 3: Add RAG Summary Card to Dashboard

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/estates-compliance/page.tsx`

The dashboard already shows individual domain cards with status. Add a top-level summary showing overall RAG across all domains.

- [ ] **Step 1: Add RAG summary section above domain cards**

Find the main render section and add a summary card at the top. After the "Today's Tasks" card, add:

```tsx
{/* Overall Compliance RAG Summary */}
<Card className="border-2 border-gray-200">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg">Compliance Overview</CardTitle>
    <CardDescription>Across all {filteredDomains.length} compliance domains</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-3xl font-bold">
          {filteredDomains.reduce((sum, d) => sum + d.totalChecks, 0)}
        </div>
        <div className="text-sm text-muted-foreground">Total Checks</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-green-600">
          {filteredDomains.reduce((sum, d) => sum + d.completedChecks, 0)}
        </div>
        <div className="text-sm text-muted-foreground">Completed</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-amber-500">
          {filteredDomains.reduce((sum, d) => sum + (d.totalChecks - d.completedChecks - d.overdueChecks), 0)}
        </div>
        <div className="text-sm text-muted-foreground">Pending</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-red-600">
          {filteredDomains.reduce((sum, d) => sum + d.overdueChecks, 0)}
        </div>
        <div className="text-sm text-muted-foreground">Overdue</div>
      </div>
    </div>
    <div className="mt-4">
      <Progress 
        value={filteredDomains.reduce((sum, d) => sum + d.totalChecks, 0) > 0 
          ? (filteredDomains.reduce((sum, d) => sum + d.completedChecks, 0) / filteredDomains.reduce((sum, d) => sum + d.totalChecks, 0)) * 100 
          : 0} 
        className="h-3" 
      />
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>{Math.round(filteredDomains.reduce((sum, d) => sum + d.totalChecks, 0) > 0 
          ? (filteredDomains.reduce((sum, d) => sum + d.completedChecks, 0) / filteredDomains.reduce((sum, d) => sum + d.totalChecks, 0)) * 100 
          : 0)}% compliant</span>
        <span>Last provisioned: {new Date().toLocaleDateString('en-GB')}</span>
      </div>
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 2: Verify dashboard loads with summary card**

Open http://localhost:3001/estates-compliance and verify the summary card appears.

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/app/\(dashboard\)/estates-compliance/page.tsx
git commit -m "feat(estates): add compliance overview RAG summary card to dashboard"
```

---

### Task 4: Add Governor PDF Export

**Files:**
- Create: `apps/platform/src/app/api/estates/reports/governor-pdf/route.ts`
- Modify: `apps/platform/src/app/(dashboard)/estates-compliance/page.tsx` (add export button)

- [ ] **Step 1: Create the governor PDF API route**

This returns a JSON report that can be rendered as PDF client-side using the browser's print functionality (simplest MVP — no server-side PDF library needed).

```typescript
// apps/platform/src/app/api/estates/reports/governor-pdf/route.ts
import { protectedRoute, apiSuccess } from '@/lib/api-utils';
import { getDomainsCompletionSummary } from '@/lib/estates-compliance/database/statutory-completions';
import { DOMAIN_METADATA, type ComplianceDomain } from '@/lib/estates-compliance/statutory-checks';

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const domains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];
  const summaries = await getDomainsCompletionSummary(organizationId, domains);

  const totalChecks = summaries.reduce((s, d) => s + d.totalChecks, 0);
  const completedChecks = summaries.reduce((s, d) => s + d.completedChecks, 0);
  const overdueChecks = summaries.reduce((s, d) => s + d.overdueChecks, 0);

  return apiSuccess({
    reportTitle: 'Premises Compliance Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalChecks,
      completedChecks,
      overdueChecks,
      compliancePercentage: totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0,
      overallStatus: overdueChecks > 0 ? 'action_required' : completedChecks === totalChecks ? 'fully_compliant' : 'in_progress',
    },
    domains: summaries.map(d => ({
      domain: d.domain,
      name: DOMAIN_METADATA[d.domain]?.name || d.domain,
      icon: DOMAIN_METADATA[d.domain]?.icon || '',
      totalChecks: d.totalChecks,
      completedChecks: d.completedChecks,
      overdueChecks: d.overdueChecks,
      status: d.status,
      overdueItems: d.completions
        .filter(c => c.status === 'overdue')
        .map(c => ({ checkId: c.check_id, nextDue: c.next_due_date })),
    })),
  });
});
```

- [ ] **Step 2: Add "Export Governor Report" button to dashboard**

Add a button in the dashboard header area that opens a print-friendly page.

- [ ] **Step 3: Create print-friendly report page**

```typescript
// apps/platform/src/app/(dashboard)/estates-compliance/reports/governor/page.tsx
```

This page fetches from `/api/estates/reports/governor-pdf` and renders a clean, print-optimised layout with `@media print` CSS. User clicks "Print" to save as PDF.

- [ ] **Step 4: Test with curl**

```bash
curl http://localhost:3001/api/estates/reports/governor-pdf \
  -H "Authorization: Bearer <token>"
```

Expected: JSON with domain summaries, compliance percentage, overdue items.

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/app/api/estates/reports/governor-pdf/route.ts apps/platform/src/app/\(dashboard\)/estates-compliance/reports/
git commit -m "feat(estates): add governor compliance report with print-to-PDF"
```

---

### Task 5: Add 8 Ed Estates Skills

**Files:**
- Modify: `apps/platform/src/lib/skills/school-skills-registry.ts`
- Create: `apps/platform/src/lib/skills/estates-skills.ts`
- Modify: `apps/platform/src/app/api/skills/invoke/route.ts`

Register 8 new skills with full field schemas so Ed knows exactly what to ask users:

1. `create_helpdesk_ticket` — Title, description, priority, location, photo
2. `create_compliance_task` — Domain, check type, due date, assignee
3. `log_inspection` — Domain, pass/fail, findings, photos, next due
4. `report_incident` — What, where, when, injuries, RIDDOR auto-detect
5. `get_compliance_status` — No input, returns RAG summary
6. `get_overdue_checks` — Optional domain filter
7. `create_cost_request` — Item, estimated cost, business case, urgency, CFR code
8. `get_estates_strategy` — Returns 5-year strategy summary

Each skill function schema includes:
- `required` fields (Ed MUST ask for these)
- `optional` fields (Ed asks if relevant)
- `description` on each field (Ed uses this to explain what's needed)
- `enum` values where applicable (Ed offers as choices)
- `confirmation_required: true` (human-in-the-loop — Ed shows summary before submitting)

- [ ] **Step 1: Write the skill schemas**

Create `apps/platform/src/lib/skills/estates-skills.ts` with all 8 function schemas following the existing pattern in `school-skills-registry.ts`.

- [ ] **Step 2: Register skills in the registry**

Add to `school-skills-registry.ts` alongside existing ESTATES schemas.

- [ ] **Step 3: Implement skill handlers**

Wire each skill to the existing API routes:
- `create_helpdesk_ticket` → POST `/api/estates/helpdesk`
- `create_compliance_task` → POST `/api/estates/tasks`
- `log_inspection` → POST `/api/estates/statutory-completions` with action: "complete"
- `report_incident` → POST `/api/estates/helpdesk` with category: "incident"
- `get_compliance_status` → GET `/api/estates/statutory-completions?summary=true`
- `get_overdue_checks` → GET `/api/estates/statutory-completions?status=overdue`
- `create_cost_request` → POST `/api/estates/tasks` with type: "cost_request"
- `get_estates_strategy` → GET `/api/estates/dashboard`

- [ ] **Step 4: Add HITL confirmation to skill schemas**

Each write skill must include `"requires_confirmation": true` in the schema metadata. The Ed orchestrator checks this flag and presents a summary to the user before executing.

- [ ] **Step 5: Test via skills invoke endpoint**

```bash
curl -X POST http://localhost:3001/api/skills/invoke \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"function": "get_compliance_status", "args": {}}'
```

Expected: RAG summary with domain breakdowns.

- [ ] **Step 6: Test ticket creation**

```bash
curl -X POST http://localhost:3001/api/skills/invoke \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"function": "create_helpdesk_ticket", "args": {"title": "Broken fire exit Block B", "description": "East fire exit blocked by furniture", "priority": "high", "location": "Block B East Corridor"}}'
```

Expected: Ticket created with ID, linked to fire_safety domain.

- [ ] **Step 7: Commit**

```bash
git add apps/platform/src/lib/skills/estates-skills.ts apps/platform/src/lib/skills/school-skills-registry.ts
git commit -m "feat(estates): add 8 Ed AI skills for ticket/task creation with HITL verification"
```

---

### Task 6: Build Verification

- [ ] **Step 1: Run the full build**

```bash
cd apps/platform && npm run build
```

Expected: Build passes (or only pre-existing errors).

- [ ] **Step 2: Verify dashboard loads**

Open http://localhost:3001/estates-compliance and confirm:
- RAG summary card shows at top
- All 18 domains display with correct check counts
- Today's Tasks card works
- Domain drill-down works

- [ ] **Step 3: Verify provisioning**

```bash
curl -X POST http://localhost:3001/api/estates/statutory-completions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

Expected: Returns seeded counts with varied frequencies (not all annual).

- [ ] **Step 4: Verify Ed skills**

```bash
curl http://localhost:3001/api/skills/invoke \
  -H "Authorization: Bearer <token>"
```

Expected: Skills list includes all 8 new estates skills.
