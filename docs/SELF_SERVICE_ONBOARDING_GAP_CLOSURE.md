# Self-Service Onboarding Gap Closure

**Date:** 2026-03-19

---

## Gaps Identified (from operational validation)

| #   | Gap                                          | Severity | Status                                                    |
| --- | -------------------------------------------- | -------- | --------------------------------------------------------- |
| 1   | No pupil upload UI page                      | BLOCKING | **CLOSED — page built at `/dashboard/pupils`**            |
| 2   | Setup wizard linked to wrong page for pupils | HIGH     | **CLOSED — now links to `/dashboard/pupils`**             |
| 3   | No trust signal badges on imported records   | MEDIUM   | **PARTIALLY CLOSED — components built, need integration** |
| 4   | No freshness indicators on data connections  | MEDIUM   | **PARTIALLY CLOSED — component built, need integration**  |
| 5   | Data Connections has no import actions       | MEDIUM   | OPEN — file browser is read-only                          |
| 6   | Finance/payroll pages hidden                 | MEDIUM   | OPEN — deliberate pilot scope decision                    |
| 7   | MIS read/sync has no UI                      | LOW      | OPEN — backend-only                                       |
| 8   | Canvas smart ingest has no modal             | LOW      | OPEN — backend-only                                       |

---

## What Was Built

### New Files

| File                                                          | Purpose                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/platform/src/app/(dashboard)/dashboard/pupils/page.tsx` | Full pupil CSV upload page with drag-drop, preview, validation, import |
| `apps/platform/src/components/ui/DataSourceBadge.tsx`         | Reusable `DataSourceBadge` and `DataFreshnessBadge` components         |

### Modified Files

| File                                                         | Change                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `apps/platform/src/app/(dashboard)/dashboard/setup/page.tsx` | Pupils step links to `/dashboard/pupils` instead of `/dashboard/settings/data-connections` |

---

## Self-Service Onboarding Flow — Current State

```
1. Sign Up (Google/Microsoft OAuth)
   → DfE school search → org created with enriched data
   → STATUS: SELF-SERVICE ✅

2. Setup Wizard (/dashboard/setup)
   → 5 steps with progress tracking
   → Template downloads for staff and pupils
   → STATUS: SELF-SERVICE ✅

3. Staff Import (/dashboard/hr/people → Import modal)
   → CSV upload with fuzzy role matching
   → STATUS: SELF-SERVICE ✅

4. Pupil Import (/dashboard/pupils) ← NEW
   → CSV upload with drag-drop, preview, DfE validation
   → STATUS: SELF-SERVICE ✅

5. Connect Google Drive (/dashboard/settings/data-connections)
   → Paste share link → auto-scan → browse files
   → STATUS: SELF-SERVICE ✅ (browse only, no import actions)

6. Upload Assessments (/dashboard/intelligence)
   → PupilAssessmentUploader: drag-drop, MIS detection, pseudonymise, analyse
   → STATUS: SELF-SERVICE ✅

7. Upload Evidence (/estates-compliance/evidence/upload)
   → Document type selection, drag-drop, AI extraction, approval
   → STATUS: SELF-SERVICE ✅

8. Finance/Payroll (hidden pages)
   → STATUS: REQUIRES SUPPORT (pages functional but hidden)
```

**5 of 8 onboarding steps are now fully self-service.** (Previously 4 of 8.)
