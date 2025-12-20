# Form Fill v1.1 - Automated Testing

## Overview

Automated Playwright test suite for Ed Form Fill v1.1, testing on local/demo pages only (no third-party MIS systems).

## Test Lab Pages

Located in `packages/form-fill-lab/`:

1. **basic-form.html** - Standard form with all field types (text, select, date, checkbox, radio, textarea)
2. **spa-form.html** - React-like SPA that re-renders on blur and replaces DOM nodes
3. **typeahead-form.html** - Async typeahead with debounce (200ms) and network delay (300-500ms)
4. **wizard-form.html** - Multi-step form with Next/Back navigation
5. **hidden-label-form.html** - Fields with aria-label only, no visible labels
6. **sensitive-form.html** - Form with status/outcome/decision/attendance fields

## Test Suite

Located in `packages/form-fill-lab/tests/form-fill.spec.ts`:

### Test Groups

1. **Basic Flow** - Completes full I-I-I flow
2. **Pause/Resume** - Pauses and resumes during execution and typeahead
3. **Stop** - Stops execution immediately, including during typeahead polling
4. **Step Mode** - Pauses after each action, requires manual advance
5. **Re-render Abort** - Detects form re-render and aborts with correct reason
6. **Confidence Gating** - Verifies confidence badges in preview
7. **Sensitive Fields** - Verifies sensitive fields are marked as gated
8. **Audit Logging** - Verifies no raw values in audit log
9. **Debug Bundle** - Verifies no raw values in debug bundle

## Running Tests

### Local Development

```bash
# Install dependencies
cd packages/form-fill-lab
npm install
npx playwright install chromium

# Run tests (headless)
npm test

# Run tests (headed - see browser)
npm run test:headed

# Run tests (CI mode)
npm run test:ci
```

### From Root

```bash
npm run test:formfill
npm run test:formfill:headed
npm run test:formfill:ci
```

## CI Integration

GitHub Actions workflow (`.github/workflows/form-fill-tests.yml`) runs tests on:
- Pull requests (when form-fill files change)
- Pushes to main/develop (when form-fill files change)

## Test Architecture

### Extension Integration

Tests use a mock extension injection pattern:
- `injectEdExtension()` - Mocks chrome.storage and exposes test hooks
- Tests trigger form fill via custom events (simulating extension UI)
- Real extension code would be loaded in production

### Test Hooks

For dev mode, extension exposes:
- `window.edFormFillTestHook.triggerFormFill(inputData)` - Programmatic trigger
- `window.edFormFillTestHook.getState()` - Get current state
- `window.edFormFillTestHook.getAuditLog()` - Get audit log

## Key Test Assertions

1. **Pause/Resume**: Verifies execution pauses and resumes correctly
2. **Stop**: Verifies execution stops immediately, even during typeahead
3. **Step Mode**: Verifies pausing after each action
4. **Re-render**: Verifies abort reason = 'rerender' in audit log
5. **No Raw Values**: Verifies audit log and debug bundle contain NO field values (only labels)
6. **Sensitive Fields**: Verifies lock icon and "Needs confirmation" status
7. **Nothing Submitted**: Verifies "Nothing was submitted" message in Impact stage

## Limitations

- Tests run on local pages only (no real MIS systems)
- Extension must be mocked/injected (not loaded as real extension)
- Some tests may need adjustment based on actual extension integration

## Future Enhancements

- Visual regression testing
- Performance benchmarks
- Cross-browser testing (Edge)
- Accessibility testing

