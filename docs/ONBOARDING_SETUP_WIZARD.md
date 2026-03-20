# Onboarding Setup Wizard

**Date:** 2026-03-19
**Status:** Implemented

---

## Purpose

Provide a clear post-onboarding setup flow that guides new school administrators through initial data population and module configuration.

---

## Location

`/dashboard/setup` — accessible after initial onboarding (org creation).

---

## What It Does

The setup wizard:

1. Checks the current setup status by querying 5 key data endpoints
2. Shows a progress bar (X of 5 steps complete)
3. Displays each step with clear status (complete/incomplete)
4. Links directly to the relevant module for each step
5. Provides CSV template downloads for staff and pupil imports

---

## Setup Steps

| Step                 | Module           | Complete When    | Link                                   |
| -------------------- | ---------------- | ---------------- | -------------------------------------- |
| Import Staff         | HR → People      | ≥3 staff members | `/dashboard/hr/people`                 |
| Import Pupils        | Data Connections | ≥10 pupils       | `/dashboard/settings/data-connections` |
| Set Up Governance    | Governance       | ≥1 governor      | `/dashboard/governance`                |
| Create Risk Register | Risk             | ≥1 risk entry    | `/dashboard/risk`                      |
| Review Compliance    | Compliance       | ≥1 policy item   | `/dashboard/compliance`                |

---

## Implementation Details

### Data Checking

Each step queries its module's API endpoint to count existing records:

- Staff: `GET /api/staff`
- Pupils: `GET /api/pupils`
- Risks: `GET /api/risk`
- Governors: `GET /api/governance/governors`
- Compliance: `GET /api/compliance/items`

### Template Downloads

- **Staff CSV**: Links to `GET /api/staff/import` (existing endpoint)
- **Pupil CSV**: Fetches from `POST /api/pupils { template: true }` (new endpoint)

### Behaviour

- Steps can be completed in any order
- Progress persists automatically (checks live data, not stored state)
- "Skip setup" link always available
- Steps update in real-time as data is imported

---

## Design

- Clean, minimal card-based layout
- Animated progress bar
- Green checkmarks for completed steps
- Blue highlights for next recommended action
- Dark mode supported
- Responsive (mobile-friendly)

---

## Integration Points

The setup wizard should be:

1. Linked from the main dashboard (e.g., "Complete setup" card when progress < 100%)
2. Accessible via sidebar under Settings or directly via URL
3. Referenced in Ed's onboarding guidance

---

## Future Enhancements

- Auto-redirect new users to `/dashboard/setup` after first onboarding
- Add class assignments as a step
- Add term dates as a step
- Show module-specific readiness indicators
- "Standard school template" auto-population option
