# Form Skill Hardening Plan

## Overview
Harden existing in-browser form filling for production use in real-world MIS systems (Arbor, Bromcom, SIMS).

## Key Changes

### 1. Confidence Gating (validate.ts)
- ≥0.85: Standard preview, auto-allow
- 0.60-0.84: Require explicit per-field confirmation
- <0.60: Block by default, manual approval required
- Sensitive fields (status/outcome/decision/attendance): Always gated regardless of confidence

### 2. SPA Re-render Protection (execute-actions.ts)
- MutationObserver on form container
- formVersion counter increments on DOM changes
- Abort execution if formVersion changes mid-run
- Safe abort with user-visible explanation

### 3. Execution Verification (execute-actions.ts)
- Re-resolve selector before each action
- Verify fingerprint (tagName, id/name, aria-label, label, index)
- Re-read field state after action to confirm persistence
- Retry once with fallback selector on failure
- Continue execution after failures, collect for reporting

### 4. Typeahead Hardening (execute-actions.ts)
- Replace fixed 300ms delay with polling (100ms intervals, 2.5s max)
- Keyboard navigation fallback (ArrowDown + Enter)
- Max 2 attempts per field
- Clear failure reporting

### 5. Capability Profiles (new file: capability-profiles.ts)
- Lightweight system hints (ArborProfile, BromcomProfile, etc.)
- Applied at executeActions() time only
- Influence: waits, blur delays, retries
- Do NOT override mapping or confidence

### 6. Focus/Blur Validation (execute-actions.ts)
- Post-blur delay: 250ms default (configurable via profile)
- Optional: Wait for validation DOM changes

### 7. Type Extensions
- Add `confidence` to `FillAction`
- Add `fingerprint` to `FillAction`
- Add `requiresConfirmation` to `FillAction`
- Add `FormVersion` tracking
- Add `CapabilityProfile` interface

### 8. UI Changes Required
- Preview: Show confidence scores per field
- Preview: Visual indicators (green/amber/red)
- Preview: Show match rationale
- Preview: Require confirmation for 0.60-0.84 confidence
- Preview: Disable <0.60 fields
- Execution: Show formVersion change warnings
- Execution: Report failures clearly

## Implementation Order

1. Extend types
2. Add capability profiles
3. Harden executeActions (re-resolution, verification, MutationObserver)
4. Improve typeahead (polling, keyboard fallback)
5. Extend validate() (confidence gating, sensitive fields)
6. Update UI integration notes

## Trade-offs

### Acceptable
- Slight performance overhead from re-resolution (mitigated by fingerprint caching)
- MutationObserver adds small memory cost (scoped to form container)
- Typeahead polling adds latency (max 2.5s, but more reliable)

### Risks Remaining
- Complex SPAs with virtual scrolling may still cause issues (fingerprint helps)
- Some MIS systems may have non-standard validation timing (capability profiles help)
- Very dynamic forms may re-render faster than we can detect (formVersion helps)

## Success Criteria

- 95%+ field fill success rate on Arbor/Bromcom test forms
- Zero silent failures (all failures reported)
- Safe abort on form re-render (no partial fills)
- Clear user feedback for low-confidence mappings

