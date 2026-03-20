# Pilot Surface Area Matrix

**Date:** 2026-03-19
**Purpose:** Define what is visible, hidden, and restricted for pilot users

---

## Pilot-Visible Modules

| Module               | ID               | Pilot Status | Notes                                                  |
| -------------------- | ---------------- | ------------ | ------------------------------------------------------ |
| Governance           | `governance`     | VISIBLE      | Full portal, meetings, training, visits, policies      |
| Risk Register        | `risk`           | VISIBLE      | Full CRUD, heatmap, 4T decisions, Ed skills working    |
| Inspection Readiness | `improvement`    | VISIBLE      | Ofsted, SIAMS, SEF, SDP, Actions, Evidence, Tasks      |
| Estates              | `estates`        | VISIBLE      | 12 sub-pages, compliance, helpdesk, energy, floor plan |
| Compliance           | `compliance`     | VISIBLE      | 36 templates, full lifecycle, GDPR, SCR, training      |
| HR & People          | `hr`             | VISIBLE      | Staff directory, meetings, maternity calculator        |
| Safeguarding         | `safeguarding`   | VISIBLE      | DSL dashboard, concerns, chronology, body map          |
| Attendance           | `attendance`     | VISIBLE      | Registration, PA tracking, interventions               |
| SEND                 | `send`           | VISIBLE      | SEN register, graduated approach, provision map        |
| Behaviour            | `behaviour`      | VISIBLE      | Incidents, consequences, exclusions                    |
| Communications       | `communications` | VISIBLE      | Notices, emergency broadcast, drills                   |
| Calendar             | `calendar`       | VISIBLE      | Term dates, events, parents' evening                   |
| Surveys & Feedback   | `surveys`        | VISIBLE      | Builder, templates, analytics                          |

## Hidden from Pilot Navigation

| Module              | ID                  | Reason                                               | `pilotHidden` |
| ------------------- | ------------------- | ---------------------------------------------------- | ------------- |
| Teaching & Learning | `teaching-learning` | Pages exist but untested, no validated data flow     | `true`        |
| Finance             | `finance`           | Shows demo data, no real import flow for pilot users | `true`        |
| School Website      | `website`           | Website builder untested for pilot scope             | `true`        |
| Canvas              | `canvas`            | Schema only, no implementation                       | `true`        |

## Hidden Apps (within visible modules)

| App                    | Module | Reason                         | `pilotHidden` |
| ---------------------- | ------ | ------------------------------ | ------------- |
| Staff Connectors       | HR     | DB tables only, no API or UI   | `true`        |
| Performance Management | HR     | Basic API, relies on demo data | `true`        |
| Cover Management       | HR     | Relies on demo data            | `true`        |

## Implementation

Filtering is applied at two levels:

1. **Module level**: `MODULES` array entries with `pilotHidden: true` are excluded from the sidebar "MY MODULES" section in the dashboard layout.

2. **App level**: `APPS` array entries with `pilotHidden: true` are excluded from sub-app lists when expanding a module in the sidebar.

3. **Direct URL access**: Not blocked. Admins and internal users can still reach hidden pages via direct URL. This is intentional — pilot perimeter is about navigation discovery, not hard enforcement.

## Files Changed

- `apps/platform/src/lib/modules/registry.ts` — Added `pilotHidden` and `pilotNote` properties to interfaces; flagged 4 modules and 3 apps
- `apps/platform/src/app/(dashboard)/layout.tsx` — Added `!module.pilotHidden` and `!a.pilotHidden` filters to sidebar rendering

## Remaining Entry Points to Audit

| Entry Point              | Status                                 | Action Needed               |
| ------------------------ | -------------------------------------- | --------------------------- |
| Dashboard homepage cards | Check if hidden modules appear         | Verify                      |
| Ed routing               | Ed should not route to hidden modules  | Updated in Phase 1 (canvas) |
| Settings pages           | Check if hidden module settings appear | Verify                      |
| Marketing modules page   | Public, not filtered by pilot          | Acceptable                  |
| Direct URL access        | Accessible but undiscoverable          | Acceptable for pilot        |
