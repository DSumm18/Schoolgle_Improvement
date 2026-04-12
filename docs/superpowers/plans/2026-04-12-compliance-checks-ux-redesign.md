# Implementation Plan: Compliance Checks UX Redesign

**Spec:** `docs/superpowers/specs/2026-04-12-compliance-checks-ux-redesign.md`
**Date:** 12 April 2026

---

## Phase 1: Rebuild the main compliance page (the big one)

### Step 1.1: Create the new page component
**File:** `apps/platform/src/app/(dashboard)/estates-compliance/page.tsx`
**Action:** Rewrite

Replace the entire 5-section layout with:

1. **Stats strip component** — 4 compact pills (Overdue, Due This Week, Completed, Compliance Rate). Compute from the existing `statutory-completions` API data + the static check definitions.

2. **Domain filter bar** — Horizontal scrollable row of pill buttons. "All" selected by default. Each pill shows `[domain name] ([completed]/[total])`. Pill colour: red if any overdue, amber if due soon, green if all done. State managed with `useState` — no URL params needed, it's just client-side filtering.

3. **Sorted check list** — Render ALL checks from `getChecksForDomain()` across all domains (or filtered domain). For each check, join with completion data from API to determine: last completed date, next due date, status (overdue/due-today/due-this-week/upcoming/not-due). Sort by urgency: overdue first (most overdue at top), then due today, then this week, then month, then not-yet-due. "Not yet due" items collapsed behind a "Show X more" toggle.

4. **Each check row:** Clickable card linking to `/estates-compliance/[domain]/[checkId]`. Shows: domain icon, check name, domain + frequency subtitle, due date badge (colour-coded), status pill. No buttons, no modals — the entire row is a link.

5. **Daily Checks tab** — Add "Checks" | "Daily Routines" tab bar above the domain filters. "Daily Routines" tab shows the existing morning/evening checklist UI (move the current Daily Routines JSX into this tab).

**What to remove:**
- Today's Tasks section (entire block)
- Site Layout & Assignments section (entire block)
- Compliance Overview section (replaced by stats strip)
- Domain accordion (replaced by filter pills + sorted list)
- View Details modal dialog (delete entirely)
- All modal-related state and handlers

**Key logic — computing due status for each check:**
```typescript
function getCheckStatus(check: StatutoryCheck, completions: Completion[]) {
  const checkCompletions = completions.filter(c => c.check_id === check.id);
  const latest = checkCompletions[0]; // sorted by date desc
  
  if (!latest) {
    // Never completed — treat as overdue
    return { status: 'overdue', daysOverdue: null, nextDue: null };
  }
  
  const nextDue = new Date(latest.next_due);
  const today = new Date();
  const daysUntilDue = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) return { status: 'overdue', daysOverdue: Math.abs(daysUntilDue), nextDue };
  if (daysUntilDue === 0) return { status: 'due-today', nextDue };
  if (daysUntilDue <= 7) return { status: 'due-this-week', nextDue };
  if (daysUntilDue <= 30) return { status: 'due-this-month', nextDue };
  return { status: 'not-due', nextDue };
}
```

**Data fetching:** Single API call to `/api/estates/statutory-completions?organizationId=X&summary=true` on page load. Already exists and returns all completions. Combine with static check definitions from `statutory-checks.ts`.

### Step 1.2: Verify with Playwright
- Open `/estates-compliance` in browser
- Screenshot the new layout
- Verify stats strip shows correct counts
- Verify domain pills filter the list
- Verify sort order is overdue first
- Verify clicking a check row navigates to detail page
- Compare against spec screenshot

---

## Phase 2: Merge check detail + completion into one page

### Step 2.1: Consolidate the check detail page
**File:** `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/page.tsx`
**Action:** Rewrite to merge detail + complete + history

The page shows different content based on check status:

**If check needs completing (overdue or due soon):**
- Check info header (name, regulation, frequency, required evidence)
- Completion form directly on the page:
  - Status selector (Fully Completed / Awaiting Documentation / Pending Contractor / Incomplete)
  - Completion Notes textarea (required)
  - Evidence upload area (drag-and-drop + camera icon)
  - Next due date (auto-calculated, editable)
  - "Save & Complete" button
- Past completions timeline below the form

**If check is up to date:**
- Check info header
- Last completion summary (date, who, notes, evidence with thumbnails)
- "Complete Again" button (expands the form)
- Past completions timeline

**The completion form logic:** Reuse the submission handler from the current `complete/page.tsx` — the one I already fixed to upload evidence files first, then save the completion with evidence IDs. Move that logic into this page.

**The history timeline:** Reuse the timeline rendering from `history/page.tsx` — the one I already fixed to fetch evidence by IDs. Render inline below the form.

### Step 2.2: Remove the separate pages
**Files to delete:**
- `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/complete/page.tsx`
- `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/history/page.tsx`  
- `apps/platform/src/app/(dashboard)/estates-compliance/[domain]/[checkId]/evidence/page.tsx`

**Redirects:** Add redirects from old URLs to the new consolidated page so any bookmarks or links don't break. Simple `redirect()` in small route files, or handle in the main page component.

### Step 2.3: Verify with Playwright
- Navigate to a check that needs completing
- Fill notes, upload a file, submit
- Verify redirect back to list
- Navigate back to same check
- Verify completion appears in timeline with evidence
- Screenshot everything

---

## Phase 3: Visual polish and mobile

### Step 3.1: Responsive design
- Stats strip: 2x2 grid on mobile
- Domain pills: horizontal scroll with overflow
- Check list: full-width cards on mobile
- Completion form: large touch targets, prominent camera button

### Step 3.2: Colour coding
- Overdue rows: red left border + red due badge
- Due today: amber left border + amber badge
- Due this week: light amber border
- Completed: green status pill
- Not due: grey text

### Step 3.3: Final Playwright walkthrough
Full end-to-end test:
1. Open compliance page
2. See sorted list with overdue first
3. Click domain pill to filter
4. Click a check
5. Fill notes + upload photo
6. Submit
7. Back to list — check now shows as completed
8. Click back into check — see completion in timeline with photo
9. Screenshot every step

---

## Execution Notes

- **No database changes needed** — purely frontend
- **No API changes needed** — existing endpoints support everything
- **The evidence upload fix from earlier today is prerequisite** — already committed (e08f87f)
- **Test with real data** — Grove House has 63 completions and 3 evidence records in the DB
- **Build must pass** before committing each phase
