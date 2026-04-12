# Module UX Audit — "Features Piled on Features"

**Date:** 12 April 2026
**Trigger:** David's observation that compliance was confusing. Applied the same lens across all modules.

---

## Summary

| Module | Rating | Verdict |
|--------|--------|---------|
| Estates (card grid) | 5/5 | Clean — just cards, click and go |
| HR & People | 5/5 | Clean — simple tool grid |
| Governance | 2/5 | Modal sprawl — 5 modals, unclear starting point |
| Compliance (main) | 1/5 | Already being redesigned (see compliance UX spec) |
| Risk Register | 1/5 | 4 redundant data views of same dataset |
| Attendance | 2/5 | Overlapping tabs (register/summary/analysis) |
| Behaviour | 1/5 | State explosion — 15+ useState, too many workflows on one page |
| Finance | 2/5 | 6 equal tabs — no priority hierarchy |
| Comms | 2/5 | 6 tabs + Overview with 7 sub-sections duplicating tab content |
| SEND | Not yet built |

## The Pattern

The modules that work (Estates cards, HR cards) follow one pattern:
- **Grid of clearly labelled tools → click → go to that tool**

The modules that don't work all share the same anti-pattern:
- **Dashboard with multiple competing sections showing the same data different ways**
- No clear "what do I do first?"
- Tabs/modals that duplicate information
- Features built incrementally without rethinking the overall layout

## The Fix (Apply After Compliance Redesign)

The compliance redesign establishes the pattern: **one sorted list, filter by category, click to act**. After it's proven, apply the same thinking to:

### Priority 1 (Worst offenders — 1/5 rating)
1. **Risk Register** — Replace heat map + breakdown sidebar + table with a single risk list sorted by severity. Filter pills by category. Click to view/edit.
2. **Behaviour** — Replace state explosion with: (1) Incident log feed sorted by recency, (2) Click to view/edit, (3) Analytics as a secondary tab.

### Priority 2 (Confusing but functional — 2/5 rating)
3. **Finance** — Lead with budget overview + alerts, collapse detailed tabs into drill-downs.
4. **Governance** — Replace modal-heavy approach with visible card grid (like Estates/HR).
5. **Attendance** — Lead with register (the thing teachers do every day), move analysis behind it.
6. **Comms** — Reduce 6 tabs to 3 (Messages, Meetings, Broadcasts).

### No Action Needed
- Estates (card grid) — already good
- HR — already good
