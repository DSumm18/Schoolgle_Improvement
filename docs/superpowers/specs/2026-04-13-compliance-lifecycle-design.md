# Compliance Lifecycle — Connected Checks, Assets, Contractors & Scheduling

**Date:** 13 April 2026
**Status:** Spec draft — awaiting David's review
**Trigger:** David's feedback that checks aren't connected to assets, contractors, or scheduling

---

## The Problem

Right now compliance checks exist in isolation. You complete a check and it records notes + evidence. But:

- **No asset link** — a LOLER check isn't connected to the actual lift (serial number, make, model)
- **No contractor link** — no record of who does the gas safety check or who to book next year
- **No scheduling** — can't proactively book inspections, send calendar invites, or manage appointment slots
- **No risk scoring on assets** — an asset with repeated failures should be flagged
- **Awaiting docs has no chase workflow** — no way to filter, follow up, or see outstanding paperwork

## The Vision

**One connected lifecycle:**

```
Check due → Contractor booked (calendar invite) → Inspection done → 
Asset updated → Docs received → Next due auto-set → Risk recalculated
```

---

## Design

### 1. Status Filters on Main List

Add a filter bar below domain pills:

`Needs doing` (default) | `Awaiting docs (3)` | `All completed` | `All checks`

- **Needs doing** — overdue + due today + due this week + due this month (current default view)
- **Awaiting docs** — inspections done but paperwork outstanding. Shows contractor name, days waiting, chase button
- **All completed** — everything up to date, for the "holistic view"
- **All checks** — everything including not-yet-due

### 2. Asset Link on Each Check

Each statutory check can optionally link to an asset from the asset register.

**On the check detail page:**
- "Linked asset" section showing asset name, serial number, make/model, location
- If no asset linked: prompt "No asset connected — link an existing asset or upload an inspection report and we'll create one"
- Clicking the asset navigates to the asset detail page

**Auto-detection from evidence:**
- When a user uploads an inspection report (PDF/image), the AI vision skill extracts asset details (serial number, make, model, manufacturer)
- If the asset exists in the register → auto-link
- If not → prompt to create it with pre-filled details from the report

**On the asset register:**
- Each asset shows its compliance history — all checks that have been performed against it
- Timeline view: daily checks, monthly services, annual inspections all on one timeline
- Issues/findings from any check flagged in red on the asset

### 3. Asset Risk Scoring

Each asset gets a risk score based on:
- **Failure frequency** — how many issues found in the last 12 months
- **Age vs expected life** — boiler at 15 years when expected life is 15-20 years
- **Maintenance spend ratio** — if maintenance cost > 50% of replacement cost, flag it
- **Compliance gap** — if checks are consistently overdue for this asset

**Risk indicator on the asset register:**
- Green: no issues, checks up to date
- Amber: some issues found, or approaching end of life
- Red: repeated failures, high maintenance spend, or overdue checks

This feeds into the estates capital plan — "these 3 assets are at risk and should be budgeted for replacement."

### 4. Contractor Assignment

Each check type can have a preferred contractor assigned.

**On the check detail page:**
- "Contractor" field showing assigned contractor name, company, contact
- If no contractor: prompt to assign one from the contractor register
- Audit trail: shows history of which contractor was assigned and when changed

**Data model:**
- `contractor_id` already exists on the `estates_statutory_completions` table
- Need to also store preferred contractor per check type per org (new field or lookup table)

### 5. Scheduling & Calendar Integration

**Proactive booking flow:**
1. Check is due in X weeks (configurable lead time per frequency)
2. System generates a booking request → sends email/calendar invite to assigned contractor
3. Contractor receives invite with: school name, check type, preferred dates, contact person
4. School calendar shows the booking as a pending appointment
5. Contractor confirms or proposes alternative
6. Once confirmed, the appointment appears in the shared school calendar

**Calendar overlay:**
- School term dates
- Staff holidays (especially site manager)
- Existing bookings from other contractors
- Available slots highlighted

**Summer holiday scheduling intelligence:**
- Flag checks that could be aligned to summer holidays (annual/termly inspections)
- Warn about risks of summer scheduling: "If the boiler fails during the check, repair may take 4-6 weeks — will it be fixed before September?"
- Financial year awareness: Academy trusts (Sept year-end) vs LA schools (April year-end) — budget implications of timing

### 6. Holistic Compliance Dashboard

A table/grid view showing every domain at a glance:

| Domain | Last Inspection | Next Due | Status | Docs | Contractor | Asset |
|---|---|---|---|---|---|---|
| Fire Alarm Test | 12 Apr | 19 Apr | ✅ Done | ✅ | Internal | Panel #FA-001 |
| Gas Safety | 15 Jan | 15 Jan 2027 | ✅ Done | ⏳ Awaiting | BritishGas | Boiler #BLR-01 |
| LOLER Examination | N/A | N/A | ⊘ N/A | — | — | No lift |
| Asbestos Survey | 3 Mar | 3 Mar 2029 | ✅ Done | ✅ | EnviroSafe | Register |

This is the governor report view / SBM overview. One screen, everything at a glance.

---

## Implementation Priority

### Phase 1 (Now — quick wins)
- [ ] Status filters on main list (Needs doing / Awaiting docs / Completed / All)
- [ ] Awaiting docs chase view with days waiting

### Phase 2 (Next sprint)
- [ ] Asset link on check detail page
- [ ] Contractor assignment on check detail page
- [ ] Holistic compliance table view

### Phase 3 (Future)
- [ ] AI auto-detection of asset details from uploaded reports
- [ ] Asset risk scoring
- [ ] Calendar integration and proactive booking
- [ ] Summer holiday scheduling intelligence

---

## Data Model Changes Needed

### Phase 1: None
Status filters use existing `status` field on `estates_statutory_completions`

### Phase 2:
- Add `asset_id` to `estates_statutory_completions` (optional FK to `estates_assets`)
- Add `preferred_contractor_id` lookup table or field on check definitions
- Asset register: add `risk_score`, `failure_count_12m`, `total_maintenance_cost` computed fields

### Phase 3:
- Calendar events table (or integration with Google Calendar / Microsoft 365)
- Contractor booking requests table
- Scheduling preferences per org (lead time, preferred months, financial year type)
