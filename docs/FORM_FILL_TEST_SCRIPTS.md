# Form Fill v1.1 - Manual Test Scripts

## Prerequisites

- Chrome/Edge browser
- Ed extension installed and configured
- Test form page (Arbor-like SPA or demo mode)
- API key configured in extension

## Test Environment Setup

### Demo Mode
Add `?ed_demo=true` to any URL to enable demo mode with sample data.

### Test Form Requirements
- At least 5 form fields (text, select, date, etc.)
- One typeahead/autocomplete field (if available)
- One sensitive field (status/outcome/decision/attendance)
- Form should be in an SPA (single-page application)

---

## Test Suite 1: Basic Flow (I-I-I)

### Test 1.1: Intent Stage - Form Scan
**Steps:**
1. Navigate to form page
2. Trigger form fill dialog
3. Observe INTENT stage

**Expected:**
- Dialog shows "Intent: Review Fill Plan"
- Form scanning completes
- Shows "Found X fields" message
- Transitions to input step

**Pass/Fail:** ☐

---

### Test 1.2: Intent Stage - Data Input
**Steps:**
1. In input step, paste JSON data:
   ```json
   {
     "First Name": "John",
     "Last Name": "Doe",
     "Date of Birth": "2010-01-15",
     "Email": "john.doe@example.com"
   }
   ```
2. Click "Parse Data"

**Expected:**
- Data parses successfully
- Transitions to plan step
- Shows "Creating fill plan..." spinner

**Pass/Fail:** ☐

---

### Test 1.3: Intent Stage - Preview with Confidence
**Steps:**
1. Wait for plan to complete
2. Review preview screen

**Expected:**
- Shows list of fields to fill
- Each field shows:
  - Label → value mapping
  - Confidence badge (green/amber/red)
  - Status indicator
- Fields with confidence >= 0.85 show green badge
- Fields with confidence 0.60-0.84 show amber badge
- Fields with confidence < 0.60 show red badge and are blocked
- Sensitive fields show 🔒 lock icon
- "Why matched?" tooltips available

**Pass/Fail:** ☐

---

### Test 1.4: Intent Stage - Approve Plan
**Steps:**
1. Review plan
2. Press Enter key OR click "Approve" button

**Expected:**
- Transitions to IMPLEMENTATION stage
- Execution overlay appears (border glow)
- Progress bar shows "Action 1 of X"

**Pass/Fail:** ☐

---

### Test 1.5: Implementation Stage - Execution Progress
**Steps:**
1. Observe execution
2. Watch progress updates

**Expected:**
- Progress bar updates (x/y actions)
- Current field label displayed
- Active field highlighted (pulsing green border)
- Last action status shown (succeeded/failed)

**Pass/Fail:** ☐

---

### Test 1.6: Impact Stage - Results Summary
**Steps:**
1. Wait for execution to complete
2. Review IMPACT stage

**Expected:**
- Shows summary: "X succeeded, Y failed, Z skipped"
- Clear message: "✓ Nothing was submitted"
- Lists fields needing manual input (if any)
- Shows errors (if any)
- Buttons: Copy Report, Re-scan, Close

**Pass/Fail:** ☐

---

## Test Suite 2: Pause/Resume

### Test 2.1: Pause During Text Fill
**Steps:**
1. Start execution
2. While a text field is being filled, press P key

**Expected:**
- Execution pauses immediately
- Overlay shows "⏸ Paused"
- Pause button changes to "▶ Resume (P)"
- Active field highlight remains visible

**Pass/Fail:** ☐

---

### Test 2.2: Resume After Pause
**Steps:**
1. After pausing (Test 2.1)
2. Press P key again OR click "Resume"

**Expected:**
- Execution resumes from exact point
- Continues filling the same field
- Progress updates continue

**Pass/Fail:** ☐

---

### Test 2.3: Pause During Typeahead Wait
**Steps:**
1. Start execution on form with typeahead field
2. When typeahead polling starts, press P key

**Expected:**
- Pauses immediately (even during polling)
- Resume continues polling from where it paused

**Pass/Fail:** ☐

---

### Test 2.4: Pause During Retry
**Steps:**
1. Start execution
2. If a field fails and retries, press P during retry

**Expected:**
- Pauses immediately
- Resume continues retry attempt

**Pass/Fail:** ☐

---

## Test Suite 3: Stop

### Test 3.1: Stop During Execution
**Steps:**
1. Start execution
2. Press S key OR click "Stop" button

**Expected:**
- Execution stops immediately
- Overlay removed
- Active field highlight removed
- Shows "Stopped" message with progress count
- Audit log records abort reason: 'user_stop'

**Pass/Fail:** ☐

---

### Test 3.2: Stop During Typeahead Wait
**Steps:**
1. Start execution on form with typeahead
2. During typeahead polling, press S key

**Expected:**
- Stops immediately (even during polling)
- No further actions executed

**Pass/Fail:** ☐

---

## Test Suite 4: Step Mode

### Test 4.1: Enable Step Mode
**Steps:**
1. Start execution
2. Click "⚡ Step Mode OFF" button

**Expected:**
- Button changes to "⚡ Step Mode ON"
- Execution pauses after current action completes
- Shows "Next: [action description]" preview

**Pass/Fail:** ☐

---

### Test 4.2: Step Through Actions
**Steps:**
1. In step mode (Test 4.1)
2. Click "Next Step" button OR press Enter

**Expected:**
- Executes next action
- Pauses again after completion
- Updates "Next:" preview
- Progress updates (x/y)

**Pass/Fail:** ☐

---

### Test 4.3: Step Mode - Stop
**Steps:**
1. In step mode
2. Click "Stop" button

**Expected:**
- Stops execution
- Step mode state preserved in audit log

**Pass/Fail:** ☐

---

## Test Suite 5: Form Re-render Abort

### Test 5.1: Trigger Re-render During Execution
**Steps:**
1. Start execution
2. While execution is running, manually trigger a form re-render:
   - Open browser console
   - Run: `document.querySelector('form').innerHTML = document.querySelector('form').innerHTML`
   - OR navigate to another page section (if SPA)

**Expected:**
- Execution aborts immediately
- Shows error: "Form re-rendered during execution. Aborted for safety."
- Audit log records abort reason: 'rerender'
- No partial fills remain

**Pass/Fail:** ☐

---

### Test 5.2: Re-render Detection Accuracy
**Steps:**
1. Start execution
2. Make a minor DOM change that shouldn't trigger abort:
   - Change a non-form element
   - Update a style attribute

**Expected:**
- Execution continues (no false positive)
- Only form container changes trigger abort

**Pass/Fail:** ☐

---

## Test Suite 6: Vision Fallback Consent

### Test 6.1: Vision Prompt Appears
**Steps:**
1. Scan form with low-confidence fields OR unmapped fields
2. Complete planning

**Expected:**
- Vision fallback prompt appears (if needed)
- Shows blocked/unmapped field counts
- Options: "Use Vision (Once)", "Continue Without", "Cancel"

**Pass/Fail:** ☐

---

### Test 6.2: Use Vision Fallback
**Steps:**
1. When vision prompt appears (Test 6.1)
2. Click "Use Vision (Once)"

**Expected:**
- Shows "Creating fill plan..." (re-planning)
- Screenshot captured (if html2canvas available)
- Vision API called
- Enhanced schema merged
- Preview updated with new mappings
- Audit log records `visionFallbackUsed: true`

**Pass/Fail:** ☐

---

### Test 6.3: Continue Without Vision
**Steps:**
1. When vision prompt appears
2. Click "Continue Without"

**Expected:**
- Prompt dismissed
- Returns to preview with original plan
- Blocked fields remain blocked

**Pass/Fail:** ☐

---

### Test 6.4: Cancel Vision Prompt
**Steps:**
1. When vision prompt appears
2. Click "Cancel"

**Expected:**
- Dialog closes
- No execution started

**Pass/Fail:** ☐

---

## Test Suite 7: Sensitive Fields Gating

### Test 7.1: Sensitive Field Detection
**Steps:**
1. Scan form with field labeled "Status", "Outcome", "Decision", or "Attendance"
2. Review preview

**Expected:**
- Sensitive field shows 🔒 lock icon
- Shows "Needs confirmation" status
- "Confirm" button available
- Field marked as gated in audit log

**Pass/Fail:** ☐

---

### Test 7.2: Confirm Sensitive Field
**Steps:**
1. In preview with sensitive field (Test 7.1)
2. Click "Confirm" button on sensitive field

**Expected:**
- "Confirm" button disappears
- Status changes to "Ready"
- Field can be approved for execution

**Pass/Fail:** ☐

---

### Test 7.3: Blocked Field Cannot Execute
**Steps:**
1. Create plan with field confidence < 0.60
2. Try to approve plan

**Expected:**
- Approve button disabled (if blocked fields exist)
- Error message: "X field(s) are blocked"
- Blocked fields skipped during execution

**Pass/Fail:** ☐

---

## Test Suite 8: Keyboard Shortcuts

### Test 8.1: Enter to Approve
**Steps:**
1. In preview stage
2. Press Enter key

**Expected:**
- Plan approved
- Execution starts

**Pass/Fail:** ☐

---

### Test 8.2: Esc to Cancel
**Steps:**
1. In any stage
2. Press Esc key

**Expected:**
- Dialog closes
- No execution started (if in INTENT stage)

**Pass/Fail:** ☐

---

### Test 8.3: S to Stop
**Steps:**
1. During execution
2. Press S key

**Expected:**
- Execution stops immediately

**Pass/Fail:** ☐

---

### Test 8.4: P to Pause/Resume
**Steps:**
1. During execution
2. Press P key (pause)
3. Press P key again (resume)

**Expected:**
- Pauses on first P
- Resumes on second P

**Pass/Fail:** ☐

---

### Test 8.5: Enter in Step Mode
**Steps:**
1. Enable step mode
2. When paused, press Enter

**Expected:**
- Advances to next step
- Executes next action

**Pass/Fail:** ☐

---

## Test Suite 9: Audit Logging

### Test 9.1: Basic Audit Entry
**Steps:**
1. Complete full execution (all stages)
2. Check audit log (via diagnostics or storage)

**Expected:**
- Entry created with:
  - timestamp
  - hostname (no query params)
  - consentGiven: true
  - planCounts (total, gated, blocked)
  - executionResults (fieldLabel + status only, NO raw values)
  - visionFallbackUsed (if used)
  - stepModeUsed (if used)

**Pass/Fail:** ☐

---

### Test 9.2: Abort Reason Logging
**Steps:**
1. Stop execution mid-run
2. Check audit log

**Expected:**
- `abortReason: 'user_stop'` recorded

**Pass/Fail:** ☐

---

### Test 9.3: No Raw Values in Log
**Steps:**
1. Fill form with PII data (name, email, etc.)
2. Complete execution
3. Check audit log

**Expected:**
- Only field labels in log
- NO actual values stored
- NO PII in log entries

**Pass/Fail:** ☐

---

## Test Suite 10: Error Handling

### Test 10.1: Network Error During Planning
**Steps:**
1. Disconnect network
2. Try to create plan

**Expected:**
- Falls back to `planFillSimple` (DOM-only)
- Shows error message
- Preview still available (with reduced confidence)

**Pass/Fail:** ☐

---

### Test 10.2: Element Not Found
**Steps:**
1. Start execution
2. Manually remove a form field from DOM

**Expected:**
- Action fails gracefully
- Error recorded: "Element not found after retries"
- Execution continues with next action
- Failed action logged in results

**Pass/Fail:** ☐

---

### Test 10.3: Vision API Failure
**Steps:**
1. Request vision fallback
2. Simulate API failure (invalid key, network error)

**Expected:**
- Shows error: "Vision fallback failed: [reason]"
- Returns to preview with original plan
- No crash

**Pass/Fail:** ☐

---

## Test Suite 11: Browser Compatibility

### Test 11.1: Chrome
**Steps:**
1. Test in Chrome (latest)
2. Run basic flow (Test Suite 1)

**Expected:**
- All features work
- Screenshot capture works (if extension API available)

**Pass/Fail:** ☐

---

### Test 11.2: Edge
**Steps:**
1. Test in Edge (latest)
2. Run basic flow (Test Suite 1)

**Expected:**
- All features work
- Same behavior as Chrome

**Pass/Fail:** ☐

---

## Test Suite 12: Performance

### Test 12.1: Large Form (20+ fields)
**Steps:**
1. Test on form with 20+ fields
2. Complete full execution

**Expected:**
- No performance degradation
- Progress updates smoothly
- No UI freezing

**Pass/Fail:** ☐

---

### Test 12.2: Rapid Pause/Resume
**Steps:**
1. Start execution
2. Rapidly press P multiple times

**Expected:**
- No race conditions
- State remains consistent
- No crashes

**Pass/Fail:** ☐

---

## Test Report Template

**Test Date:** _______________
**Tester:** _______________
**Browser:** _______________
**Extension Version:** _______________

**Summary:**
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

**Failed Tests:**
1. Test ID: ______ Issue: ________________
2. Test ID: ______ Issue: ________________

**Notes:**
_________________________________________________
_________________________________________________

