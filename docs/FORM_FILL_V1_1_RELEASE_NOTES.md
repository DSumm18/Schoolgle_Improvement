# Form Fill v1.1 - Release Notes

## Overview

Form Fill v1.1 adds interruptible execution with pause/stop/step mode, vision fallback consent UI, and enhanced diagnostics for QA and debugging.

## New Features

### 1. Interruptible Execution
- **Pause/Resume**: Pause execution at any time (P key or button)
- **Stop**: Stop execution immediately (S key or button)
- **Step Mode**: Execute one action at a time with manual confirmation
- Works during typeahead polling, retries, and all waits

### 2. Vision Fallback Consent
- Automatic prompt when fields can't be mapped reliably
- Options: Use Vision (Once) / Continue Without / Cancel
- Screenshot capture and vision API integration
- Enhanced schema merging and re-planning

### 3. Enhanced Diagnostics (Dev Mode)
- Console diagnostic reports with confidence stats
- System detection and capability profile info
- Execution timings
- Redacted debug bundle (no raw values) for issue reporting

### 4. Per-Field Progress
- Real-time progress updates (action x/y)
- Current field label display
- Last action status indicator
- Active field highlighting (pulsing border)

## Improvements

- **Form Re-render Detection**: Aborts execution safely if form re-renders mid-run
- **Audit Logging**: Enhanced with vision fallback usage, step mode usage
- **Keyboard Shortcuts**: Enter key advances step in step mode
- **Error Handling**: Better error messages and graceful degradation

## Browser Support

- ✅ Chrome (latest)
- ✅ Edge (latest)
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

## Dev Mode

Enable dev mode for diagnostic features:
- Add `?ed_dev=true` to URL, OR
- Run in console: `localStorage.setItem('ed_form_fill_dev', 'true')`

Dev mode enables:
- Console diagnostic reports
- "Report Issue" button on Impact screen
- Enhanced logging

## Testing

See `/docs/FORM_FILL_TEST_SCRIPTS.md` for comprehensive manual test scripts.

## Known Limitations

1. **Step Mode Performance**: Pausing after every action adds overhead. Acceptable for debugging/verification.
2. **Vision Fallback Dependency**: Requires `html2canvas` or Chrome extension screenshot API.
3. **Pause During Network Calls**: Vision API calls cannot be paused (they complete or fail).

## Migration Notes

No breaking changes. Existing code continues to work. The runner is a new wrapper that can be used optionally.

## Files Changed

- `packages/ed-extension/src/content/form-fill-ui.tsx` - Integrated runner, step mode, vision UI
- `packages/ed-extension/src/content/form-fill-runner.ts` - New interruptible runner
- `packages/ed-extension/src/content/form-fill-audit.ts` - Extended audit logging
- `packages/ed-extension/src/content/form-fill-diagnostics.ts` - New diagnostics module
- `packages/form-skill/src/index.ts` - Exported vision functions

## Documentation

- `/docs/FORM_FILL_RUNNER_DESIGN.md` - Runner architecture
- `/docs/FORM_FILL_V1_1_CHANGES.md` - Detailed changelog
- `/docs/FORM_FILL_TEST_SCRIPTS.md` - Manual test procedures

## Support

For issues, use the "Report Issue" button (dev mode) to generate a redacted debug bundle.

