# Estates Compliance Module — Agent Test Prompt

## Instructions for Testing Agent

You are testing the Schoolgle Estates Compliance module as a **real user would use it**. Not API curls. Not unit tests. You are opening a browser, clicking buttons, filling forms, uploading files, and checking that everything persists and retrieves correctly.

**Dev server**: port 3000 (check with `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`)

## Test Categories

### A. NAVIGATION & RENDERING (Does the page load?)

For each page below, navigate in Playwright, take a screenshot, check for:
- Page loads (200 status, no blank screen)
- Key content renders (not just a spinner forever)
- No uncaught JS errors in console
- Correct breadcrumbs/back links

| # | Page | URL |
|---|------|-----|
| A1 | Compliance Dashboard | `/estates-compliance` |
| A2 | Fire Safety Domain | `/estates-compliance/fire-safety` |
| A3 | Electrical Domain | `/estates-compliance/electrical` |
| A4 | Gas Safety Domain | `/estates-compliance/gas` |
| A5 | Water Hygiene Domain | `/estates-compliance/water-hygiene` |
| A6 | Asbestos Domain | `/estates-compliance/asbestos` |
| A7 | General H&S Domain | `/estates-compliance/general-health-safety` |
| A8 | Building Fabric | `/estates-compliance/building-fabric` |
| A9 | Fire Alarm Test Detail | `/estates-compliance/fire-safety/fire-alarm-test` |
| A10 | Fire Alarm Complete Form | `/estates-compliance/fire-safety/fire-alarm-test/complete` |
| A11 | Fire Alarm History | `/estates-compliance/fire-safety/fire-alarm-test/history` |

### B. FORM FUNCTIONALITY (Does the form work?)

For the completion form (`/estates-compliance/fire-safety/fire-alarm-test/complete`):

| # | Test | Steps | Expected |
|---|------|-------|----------|
| B1 | Notes field accepts text | Type in the textarea | Text appears |
| B2 | Observations field works | Type in second textarea | Text appears |
| B3 | Status selector works | Click "Completed" option | Option selected |
| B4 | File upload works | Use file input to add a PNG | File preview shown |
| B5 | Multiple files | Upload 2+ files | All shown in preview |
| B6 | Remove file | Click remove on uploaded file | File removed from list |
| B7 | Add finding | Fill finding form, click Add | Finding appears in list |
| B8 | Remove finding | Click delete on finding | Finding removed |
| B9 | Next due date auto-calculates | Check date field is pre-filled | Has future date |
| B10 | Submit with empty notes | Clear notes, click submit | Error shown, submit blocked |
| B11 | Submit with valid data | Fill notes + click submit | Success, redirect to domain page |

### C. DATA PERSISTENCE (Is it in the database?)

After submitting a completion:

| # | Test | How to verify |
|---|------|---------------|
| C1 | Completion saved to DB | GET `/api/estates/statutory-completions?domain=fire-safety` — find the record |
| C2 | Notes saved correctly | Check `completion_notes` matches what was typed |
| C3 | Status saved correctly | Check `status` is "completed" |
| C4 | Evidence IDs populated | Check `evidence_ids` array has entries (if files uploaded) |
| C5 | Documents received flag | Check `documents_received` is true when files attached |
| C6 | Next due date saved | Check `next_due` has the expected date |
| C7 | Findings saved | Check `findings` array matches what was entered |

### D. FILE UPLOADS (Do files actually persist?)

| # | Test | How to verify |
|---|------|---------------|
| D1 | File reaches Supabase | GET `/api/estates/evidence?ids=<id>` — returns file metadata |
| D2 | File URL is accessible | Download the `file_url` — should return the file |
| D3 | File metadata correct | `evidence_type`, `title`, `compliance_domain` all set |
| D4 | Multiple files all saved | If 3 files uploaded, 3 evidence IDs in completion |

### E. RETRIEVAL / HISTORY (Can you see it again?)

After completing a check, navigate to history:

| # | Test | How to verify |
|---|------|---------------|
| E1 | History page loads | `/estates-compliance/fire-safety/fire-alarm-test/history` loads |
| E2 | Completion record shown | Notes from our test visible in timeline |
| E3 | Status badge correct | Shows "Completed" with correct styling |
| E4 | Evidence files listed | Uploaded files shown with download links |
| E5 | Evidence download works | Click download link — file opens/downloads |
| E6 | Multiple records shown | If multiple completions, all listed chronologically |
| E7 | Documents received indicator | Shows green "Documents Received" when files attached |

### F. CROSS-PAGE CONSISTENCY

| # | Test | How to verify |
|---|------|---------------|
| F1 | Domain page updates | After completing, domain page shows check as "Completed" |
| F2 | Check detail updates | Check detail page shows "Last completed" date |
| F3 | Stats update | Completed count increases, Pending decreases |
| F4 | Governor report reflects | Dashboard summary shows updated completion stats |

## How to Run

### Option 1: Playwright Test Suite
```bash
cd ~/dev/Schoolgle_Improvement
npx playwright test tests/estates-compliance-e2e.spec.ts --headed --reporter=list
```

### Option 2: Manual with Playwright MCP
Use `mcp__playwright__browser_navigate` to visit each URL, `browser_snapshot` to check content, `browser_fill_form` to enter data, `browser_click` to interact, and `browser_take_screenshot` for evidence.

### Option 3: API + Browser Hybrid
1. Use curl/fetch for API verification (C and D sections)
2. Use Playwright for browser verification (A, B, E, F sections)

## Reporting Format

For each test, report:
```
[TC-XX] [PASS/FAIL/SKIP] Description
  Expected: ...
  Actual: ...
  Evidence: screenshot path or API response
  Error: (if failed) exact error message
```

At the end, produce a summary table:
```
| Category | Pass | Fail | Skip | Notes |
|----------|------|------|------|-------|
| Navigation | X/11 | Y | Z | ... |
| Forms | X/11 | Y | Z | ... |
| Persistence | X/7 | Y | Z | ... |
| File Upload | X/4 | Y | Z | ... |
| Retrieval | X/7 | Y | Z | ... |
| Cross-page | X/4 | Y | Z | ... |
| **TOTAL** | **X/44** | **Y** | **Z** | |
```

## Critical Failures (Must Fix Before Customer)

Any test that fails in these categories is a **blocker**:
- B11 (Submit doesn't save)
- C1 (Data not in database)
- D1 (Files don't upload)
- E2 (Can't see history)
- E4 (Can't see uploaded files in history)

These must work or we can't show this to a school.
