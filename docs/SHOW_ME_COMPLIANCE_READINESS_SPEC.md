# Show Me: Compliance Readiness — Specification

**Date:** 2026-03-19
**Status:** Specification (not yet built)
**Reuses:** `ShowMeShell` component from Show Me: Setup

---

## Purpose

Show a school's compliance posture — what is current, what needs review, what is missing, what is overdue — derived entirely from real data in their Schoolgle instance.

---

## Live Data Mapping

Every step is derived from real API data. Nothing is shown unless this school has data for it.

| Step                  | API Endpoint                             | Data Field                              | Status Logic                                                                                                              |
| --------------------- | ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Statutory Policies    | `GET /api/compliance/items?type=policy`  | Count, review dates                     | Complete if all have current review dates. In progress if any are due within 30 days. Overdue if any are past review date |
| Training Compliance   | `GET /api/compliance/training`           | Completions, expiry dates               | Complete if no expired training. Blocked if any expired. In progress if expiring within 30 days                           |
| Single Central Record | `GET /api/compliance/scr`                | DBS records                             | Complete if all staff have current DBS. Blocked if any expired or missing                                                 |
| GDPR: DPIAs           | `GET /api/compliance/gdpr/dpia`          | DPIA count                              | Complete if ≥1 DPIA. Not started if 0                                                                                     |
| GDPR: SARs            | `GET /api/compliance/gdpr/sar`           | SAR count, status                       | Complete if no open SARs. In progress if any are active                                                                   |
| GDPR: Breach Log      | `GET /api/compliance/gdpr/breach`        | Breach count                            | Complete if none open. Blocked if any unresolved                                                                          |
| Complaints            | `GET /api/compliance/complaints`         | Open complaint count                    | Complete if none open. In progress if any are active                                                                      |
| Website Compliance    | `GET /api/website-scan/v2` (if scanned)  | Statutory items met                     | Complete if all 28 items pass. In progress if some pass                                                                   |
| Risk Register         | `GET /api/risk`                          | Open risks in legal/compliance category | Complete if none above appetite. Blocked if any above                                                                     |
| Estates Compliance    | `GET /api/estates/statutory-completions` | Statutory check completion %            | Complete if all statutory checks current. In progress if some                                                             |

---

## Step/Status Model

Uses the same `ShowMeStep` interface from `ShowMeShell`:

```typescript
{
  id: "policies",
  title: "Statutory Policies",
  description: "12 of 15 policies have current review dates",
  icon: FileText,
  status: "in_progress",  // derived from data
  href: "/dashboard/compliance/policies",
  count: 12,
  detail: {
    whatGoodLooksLike: "All statutory policies are reviewed within their scheduled cycle and approved by the governing body.",
    whatIsMissing: "3 policies are overdue for review: Safeguarding (due Jan 2026), SEND (due Feb 2026), Complaints (due Dec 2025).",
    nextAction: "Review overdue policies",
    nextActionHref: "/dashboard/compliance/policies",
  },
}
```

---

## Which Existing APIs and Pages It Links To

| Step                  | Links To                           | API Already Exists?                             |
| --------------------- | ---------------------------------- | ----------------------------------------------- |
| Statutory Policies    | `/dashboard/compliance/policies`   | YES — `GET /api/compliance/items`               |
| Training Compliance   | `/dashboard/compliance/training`   | YES — `GET /api/compliance/training`            |
| Single Central Record | `/dashboard/compliance/scr`        | YES — `GET /api/compliance/scr`                 |
| GDPR DPIAs            | `/dashboard/compliance/gdpr`       | YES — `GET /api/compliance/gdpr/dpia`           |
| GDPR SARs             | `/dashboard/compliance/gdpr`       | YES — `GET /api/compliance/gdpr/sar`            |
| GDPR Breaches         | `/dashboard/compliance/gdpr`       | YES — `GET /api/compliance/gdpr/breach`         |
| Complaints            | `/dashboard/compliance/complaints` | YES — `GET /api/compliance/complaints`          |
| Website Compliance    | `/dashboard/website-compliance`    | YES — scan endpoints exist                      |
| Risk (Compliance)     | `/dashboard/risk`                  | YES — `GET /api/risk?category=legal_compliance` |
| Estates Compliance    | `/dashboard/estates/audit`         | YES — `GET /api/estates/statutory-completions`  |

**All APIs already exist.** No new backend work needed.

---

## What Is Already Available vs What Needs Building

### Already Available

- All 10 API endpoints exist and return real data
- `ShowMeShell` component is reusable with zero changes
- Compliance module pages exist for every linked step
- Ed skills exist for compliance guidance
- `useEdChatbot().openChatWith()` available for "Ask Ed" integration

### What Needs Building

- **One new page**: `apps/platform/src/app/(dashboard)/dashboard/show-me/compliance/page.tsx`
- **Data fetching logic**: ~10 API calls in parallel (same pattern as setup page)
- **Step derivation**: Map API responses to `ShowMeStep[]` with status logic
- **Nav entry**: Add "Compliance" as a sub-route of Show Me (or second tab)

### Estimated Effort

- 2-3 hours to build, following the exact same pattern as Show Me: Setup
- Zero changes to ShowMeShell
- Zero new APIs needed

---

## Conditional Display Rule

Same rule as Show Me: Setup — only show steps where the school has data.

| Condition                                     | Behaviour                                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| School has no compliance items at all         | Show "Statutory Policies" as not_started + "Training" as not_started. Nothing else. |
| School has policies but no SCR                | Show policies step + training step. Don't show SCR step.                            |
| School has run a website scan                 | Show website compliance step with results.                                          |
| School has not scanned website                | Don't show website step at all.                                                     |
| School has risks in legal/compliance category | Show compliance risks step.                                                         |
| School has no compliance-category risks       | Don't show that step.                                                               |

The view grows as the school uses more compliance features. It never shows features the school hasn't touched.
