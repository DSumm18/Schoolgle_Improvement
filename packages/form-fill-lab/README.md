# Form Fill Lab

Test lab pages and Playwright test suite for Ed Form Fill v1.1.

## Test Pages

- **basic-form.html** - Standard form with all field types
- **spa-form.html** - React-like SPA that re-renders on blur
- **typeahead-form.html** - Async typeahead with debounce and polling
- **wizard-form.html** - Multi-step form with Next/Back navigation
- **hidden-label-form.html** - Fields with aria-label only, no visible labels
- **sensitive-form.html** - Form with status/outcome/decision/attendance fields

## Running Tests

### Prerequisites

```bash
cd packages/form-fill-lab
npm install
npx playwright install chromium
```

### Run Tests

```bash
# Headless (CI mode)
npm test

# Headed (with browser UI)
npm run test:headed

# CI mode (GitHub Actions)
npm run test:ci
```

### From Root

```bash
# From project root
npm run test:formfill
npm run test:formfill:headed
npm run test:formfill:ci
```

## Test Coverage

- ✅ Basic I-I-I flow
- ✅ Pause/Resume during execution
- ✅ Pause during typeahead polling
- ✅ Stop execution immediately
- ✅ Stop during typeahead polling
- ✅ Step mode (pauses after each action)
- ✅ Form re-render abort detection
- ✅ Confidence gating
- ✅ Sensitive fields gating
- ✅ Audit log (no raw values)
- ✅ Debug bundle (no raw values)

## Local Development

Start test server:

```bash
npm run serve
```

Then open http://localhost:8080 to view test pages.

## CI Integration

Tests run automatically on PRs via GitHub Actions (`.github/workflows/form-fill-tests.yml`).

