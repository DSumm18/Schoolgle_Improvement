# Form Skill Integration Guide

## Overview

The `@schoolgle/form-skill` package provides in-browser form filling for Ed extension. It works entirely in the user's authenticated browser session - no server-side Playwright needed.

## Architecture

```
User Action → Scan Form → Input Data → Plan Fill → Validate → Execute → Report
```

## Package Structure

```
packages/form-skill/
├── src/
│   ├── index.ts              # Main exports
│   ├── types.ts              # TypeScript types
│   ├── dom-snapshot.ts       # DOM extraction with PII masking
│   ├── plan-fill.ts          # LLM planning + simple fallback
│   ├── execute-actions.ts    # Field type handlers
│   ├── validate.ts           # Safety validation
│   ├── pii-detection.ts      # PII detection/masking
│   └── vision-fallback.ts   # Vision model fallback
```

## Integration Steps

### 1. Add Package to Workspace

Update root `package.json`:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

### 2. Install Dependencies

```bash
npm install
cd packages/form-skill
npm run build
```

### 3. Add to Extension

Update `packages/ed-extension/package.json`:

```json
{
  "dependencies": {
    "@schoolgle/form-skill": "workspace:*"
  }
}
```

### 4. Integrate UI

In `packages/ed-extension/src/content/inject.ts`:

```typescript
import { FormFillDialog, injectFormFillStyles } from './form-fill-ui';

// When user clicks "Fill Form" button
function handleFillFormClick() {
  injectFormFillStyles();
  
  const apiKey = await getApiKey(); // From chrome.storage
  const dialog = new FormFillDialog(apiKey, () => {
    console.log('Form fill complete');
  });
  
  dialog.show();
}
```

### 5. Add to Ed Widget

In `packages/ed-widget/src/Ed.ts`:

```typescript
import { domSnapshot, planFill, executeActions } from '@schoolgle/form-skill';

// Add form fill command
this.addCommand('fillForm', async (data: Record<string, string>) => {
  const schema = domSnapshot();
  const plan = await planFill(schema, data, this.apiKey);
  const result = await executeActions(plan.actions);
  return result;
});
```

## Usage Flow

### Step 1: User Initiates

User clicks "Fill Form" button in Ed widget or extension.

### Step 2: Scan Form

```typescript
const schema = domSnapshot();
// Returns: { formId, fields: [...], url, timestamp }
```

### Step 3: Input Data

User pastes/uploads data (CSV, JSON, or manual entry).

```typescript
const inputData = {
  'First Name': 'John',
  'Last Name': 'Doe',
  'Date of Birth': '2010-01-15',
};
```

### Step 4: Plan Fill

```typescript
// Try LLM first
let plan: FillPlan;
try {
  plan = await planFill(schema, inputData, apiKey);
} catch (error) {
  // Fallback to simple matching
  plan = planFillSimple(schema, inputData);
}
```

### Step 5: Validate

```typescript
const validation = validate(plan.actions);
if (!validation.valid) {
  // Show errors to user
  console.error(validation.errors);
  return;
}

if (validation.warnings.length > 0) {
  // Show warnings
  console.warn(validation.warnings);
}
```

### Step 6: Execute

```typescript
const result = await executeActions(plan.actions);
// Returns: { succeeded, failed, skipped, finalState }
```

### Step 7: Report

Show success/failure to user. **Never auto-submit** unless explicitly requested.

## Vision Fallback

When DOM mapping fails (e.g., SPA forms, custom components):

```typescript
import { recognizeFieldsWithVision, captureFormScreenshot } from '@schoolgle/form-skill';

// Capture screenshot
const screenshot = await captureFormScreenshot();

// Recognize fields with vision
const fields = await recognizeFieldsWithVision(screenshot, apiKey);

// Merge with DOM schema
schema.fields = [...schema.fields, ...fields];
```

## Safety Rules

1. **Never fill password fields** - Blocked in validation
2. **Warn on sensitive data** - Email, phone, DOB fields
3. **Warn on payment fields** - Card, billing, etc.
4. **Never auto-submit** - Requires explicit user request
5. **Validate formats** - Email, date, number validation

## Error Handling

```typescript
try {
  const schema = domSnapshot();
} catch (error) {
  // No form found, or DOM parsing failed
  // Show error to user
}

try {
  const plan = await planFill(schema, inputData, apiKey);
} catch (error) {
  // LLM API error
  // Fallback to planFillSimple()
}

try {
  const result = await executeActions(plan.actions);
} catch (error) {
  // Execution failed
  // Show partial results to user
}
```

## Testing

### Unit Tests

```typescript
// packages/form-skill/src/__tests__/dom-snapshot.test.ts
import { domSnapshot } from '../dom-snapshot';

test('extracts form fields', () => {
  document.body.innerHTML = `
    <form>
      <label for="name">Name</label>
      <input id="name" name="name" type="text" />
    </form>
  `;
  
  const schema = domSnapshot();
  expect(schema.fields).toHaveLength(1);
  expect(schema.fields[0].label).toBe('Name');
});
```

### Integration Tests

Test with real forms (Arbor, SIMS, etc.) in browser extension context.

## Performance

- **DOM snapshot**: < 50ms
- **LLM planning**: 1-3s (depends on API)
- **Simple planning**: < 10ms
- **Execution**: ~200ms per field

## Cost

- **LLM calls**: ~$0.001-0.01 per form (Claude Haiku)
- **Vision fallback**: ~$0.003 per screenshot (Claude Sonnet Vision)
- **Caching**: Field mappings can be cached per URL

## Next Steps

1. ✅ Package created
2. ✅ Core functions implemented
3. ✅ UI components created
4. ⏳ Integration with Ed widget
5. ⏳ Testing with real forms
6. ⏳ Performance optimization
7. ⏳ User documentation

