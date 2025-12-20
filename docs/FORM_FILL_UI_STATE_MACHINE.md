# Form Fill UI State Machine (I-I-I)

## States

### INTENT Stage
1. **scan** - Scanning form (domSnapshot)
2. **input** - User enters/pastes data
3. **plan** - Creating plan (planFill/planFillSimple)
4. **preview** - Showing plan with confidence scores
5. **approve** - User confirms (Enter or Approve button)

### IMPLEMENTATION Stage
6. **executing** - Running execution with visual feedback
   - Sub-states: running, paused, stopped
   - Shows current field highlight
   - Progress indicator (x/y)
   - Floating control bar

### IMPACT Stage
7. **complete** - Results summary
   - Succeeded / failed / skipped counts
   - "Nothing was submitted" message
   - Copy report, Re-scan, Close buttons

## Transitions

```
scan → input → plan → preview → approve → executing → complete
                                    ↓
                                 (cancel)
                                    ↓
                                  closed
```

## Key Features Per State

### INTENT (preview)
- Show field label → value mapping
- Confidence badges (>=0.85 green, 0.60-0.84 amber, <0.60 red)
- Lock icon for sensitive fields (status/outcome/decision/attendance)
- "Why matched?" tooltip (matchRationale)
- Approve button (Enter key)
- Review fields button
- Cancel button (Esc key)

### IMPLEMENTATION (executing)
- Full-screen border glow overlay
- Active field highlight (pulsing border)
- Floating control bar:
  - Pause/Resume button
  - Stop button (S key)
  - Step mode toggle
  - Skip field button
- Progress: "Filling field 3 of 8"
- Abort on formVersion change
- Record per-field results

### IMPACT (complete)
- Summary: "5 succeeded, 1 failed, 2 skipped"
- Clear: "Nothing was submitted"
- Buttons: Copy report, Re-scan, Close
- Show skipped fields that need manual input

## Keyboard Shortcuts

- **Enter** (INTENT): Approve plan
- **Esc** (any): Cancel/Close
- **S** (IMPLEMENTATION): Stop execution
- **P** (IMPLEMENTATION): Pause/Resume (optional)

## Audit Log Structure

```typescript
{
  timestamp: number,
  hostname: string, // no query params
  consentGiven: boolean,
  planCounts: {
    total: number,
    gated: number,
    blocked: number
  },
  executionResults: Array<{
    fieldLabel: string,
    status: 'succeeded' | 'failed' | 'skipped'
  }>,
  abortReason?: 'rerender' | 'user_stop' | 'mismatch' | 'timeout'
}
```

