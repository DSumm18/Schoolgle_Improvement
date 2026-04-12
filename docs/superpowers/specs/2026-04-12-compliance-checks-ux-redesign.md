# Compliance Checks UX Redesign

**Date:** 12 April 2026
**Status:** Ready for review
**Author:** Jarvis Brain (from David's direction + competitor research)

---

## Problem

The estates compliance page (`/estates-compliance`) has grown into a confusing layout with 5 competing sections all trying to show "things you need to do":

1. **Today's Tasks** — shows due-soon tasks, "View Details" opens a modal where "Complete Task" does nothing useful
2. **Daily Routines** — Morning/End of Day checklists, separate concept from Today's Tasks
3. **Site Layout** — floor plan section (irrelevant to the task flow)
4. **Compliance Overview** — stats bar
5. **18 Domain Groups** — long scrollable accordion, each expandable to show individual checks

This is the result of features built on top of features without thinking about the end-to-end user journey. A caretaker opening this at 7am sees a wall of sections and doesn't know where to start.

The "Complete Task" button in the modal literally does nothing — it closes the modal without saving. To actually complete a check with notes and evidence, the user must: View Details → modal → Full Form link → separate page. That's 4 clicks to do the one thing they came to do.

## Competitor Research Summary

Every competitor (Smartlog, Every, Parago, CompliancePod, Statlog, iAMCompliant) follows the same pattern:

1. **Dashboard first** — RAG-rated compliance health at a glance
2. **Single task list sorted by urgency** — overdue → due today → upcoming → done
3. **3-tap completion** — open task → fill fields → attach photo → done
4. **No manual date filters** — the sort order IS the filter
5. **Click domain to filter** — not to expand an accordion

## Design

### Core Principle

**One list. Sorted by urgency. Click to complete.**

### Page Layout (top to bottom)

#### 1. Header Bar (compact)
- Title: "Compliance Checks"
- Right side: Governor Report button, Settings
- No subtitle paragraph — the title is enough

#### 2. Stats Strip (single row, always visible)
Four compact stat pills in a horizontal row:
- **Overdue** (red) — count
- **Due This Week** (amber) — count
- **Completed** (green) — count / total
- **Compliance Rate** — percentage

This replaces the current "Compliance Overview" section with its 4 large cards. Same data, 1/4 the vertical space.

#### 3. Domain Filter Bar (horizontal pill tabs)
A horizontal scrollable row of domain pills:
`All` | `Fire Safety (2/11)` | `Legionella (0/8)` | `Electrical (0/6)` | `Gas (0/4)` | ...

- "All" selected by default — shows every check
- Clicking a domain filters the list below to just that domain
- Each pill shows completion count (e.g. "2/11")
- Pill colour reflects domain status: red if any overdue, amber if due soon, green if all done
- **This replaces the 18-item accordion list.** Same information, one row instead of a full screen of scrolling.

#### 4. The Check List (the main event)
A single list of all compliance checks, always sorted by urgency:

**Sort order (fixed, not user-changeable):**
1. **Overdue** — red left border, sorted by how overdue (most overdue first)
2. **Due Today** — amber left border
3. **Due This Week** — light amber left border
4. **Due This Month** — no border
5. **Not Due Yet** — grey text, collapsed by default (show count: "32 checks not yet due")

**Each check row shows:**
```
[Domain icon] [Check name]                    [Due date badge]  [→]
              [Domain name] · [Frequency]      [Status pill]
```

- **Due date badge:** "Overdue 3 days" (red), "Due today" (amber), "Due Fri" (neutral), "Due 18 Jun" (grey)
- **Status pill:** "Overdue" / "Due Soon" / "Completed 2 Apr" / "Not Due"
- **Click the entire row** → navigates to check detail/completion page
- No "View Details" button. No modal. Just click and go.

**The "not yet due" section:** Collapsed by default showing "32 checks not yet due — show all". Clicking expands them. This keeps the default view focused on what actually needs attention.

#### 5. Quick Actions (sticky bottom bar, mobile-friendly)
Only visible when checks are overdue:
- "X overdue checks need attention" with a red badge

### What Gets Removed

| Current Section | Action | Reason |
|---|---|---|
| Today's Tasks | **Remove** | Replaced by the unified sorted list |
| Daily Routines | **Move** to a separate "Daily Checks" tab or keep as a collapsible section at top | Different workflow (checklist vs individual tasks) |
| Site Layout & Assignments | **Remove** from this page | Not relevant to compliance checks — lives at `/dashboard/estates/floor-plan` |
| Compliance Overview (4 big cards) | **Replace** with stats strip | Same data, much less space |
| 18 Domain Group accordion | **Replace** with domain filter pills | Same functionality, one row |
| "View Details" modal | **Remove entirely** | Clicking a check row goes straight to the detail page |
| "Complete Task" button (in modal) | **Remove** | Did nothing anyway |

### Check Detail / Completion Page

When a user clicks a check row, they go to `/estates-compliance/[domain]/[checkId]`.

This page consolidates the current separate "detail", "complete", and "history" pages into **one page with two states**:

**If check needs completing (overdue or due):**
- Shows the completion form directly — no extra "Complete Check" button to click
- Form sections: Status selector → Notes (required) → Photo/evidence upload → Next due date (auto-calculated)
- Large "Save & Complete" button at bottom
- Previous completions shown below the form as a timeline

**If check is up to date (completed, not yet due):**
- Shows the last completion record (date, who, notes, evidence)
- Timeline of all past completions below
- "Complete Again" button if the user wants to record an ad-hoc completion

**Evidence/photo upload:**
- Camera icon prominent next to the notes field
- Drag-and-drop area for files
- Uploaded files show inline with thumbnails
- Files are uploaded to `/api/estates/evidence` and IDs attached to the completion record (bug now fixed)

### Daily Checks (the "Morning/Evening routine" flow)

Daily routines are a different workflow — they're checklists (tick 10 items quickly) rather than individual task completions. Two options:

**Option A (recommended): Tab on the same page**
Add a "Daily Checks" tab next to the domain filter bar. When selected, shows:
- Morning Opening Checks (expandable checklist)
- End of Day Closing Checks (expandable checklist)
- Each item is a simple tick with optional notes
- "Complete All" button at bottom

**Option B: Keep as collapsible section at top**
Keep the Daily Routines section but make it collapsible/dismissable, so it doesn't push the main check list down.

### Mobile Considerations

- Domain filter pills: horizontal scroll on mobile
- Check list: full-width cards, tap to open
- Completion form: camera button prominent, large touch targets
- Stats strip: 2x2 grid on mobile instead of horizontal row

## Data Model Changes

**None required.** The existing `estates_statutory_completions` table and `estates_evidence` table support everything. The changes are purely frontend — reorganising how the same data is displayed.

## Files to Modify

| File | Change |
|---|---|
| `apps/platform/src/app/(dashboard)/estates-compliance/page.tsx` | **Rewrite** — replace 5-section layout with stats strip + filter pills + sorted list |
| `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/page.tsx` | **Merge** detail + complete into one page |
| `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/complete/page.tsx` | **Remove** — merged into detail page |
| `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/history/page.tsx` | **Remove** — history timeline moved into detail page |
| `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/evidence/page.tsx` | **Remove** — evidence upload is inline in completion form |
| `apps/platform/src/lib/estates-compliance/statutory-checks.ts` | **No change** — check definitions stay the same |
| `apps/platform/src/app/api/estates/statutory-completions/route.ts` | **No change** — API stays the same |

## Success Criteria

1. A caretaker can see what's overdue and complete a check in **2 clicks** (click check → fill notes → save)
2. The page loads showing the most urgent items first with no scrolling past irrelevant sections
3. Uploaded photos appear in the completion history when you come back later
4. Domain filtering works without page reload
5. No "View Details" modals, no accordions, no dead-end buttons

## Out of Scope

- Offline mobile support (future PWA work)
- Automated escalation chains (future feature)
- Dual test modules / contractor portal (future feature)
- Changes to other module dashboards (separate spec — see Task #3)
