# @schoolgle/form-skill

In-browser form filling skill for Ed Chrome extension. Works entirely in the user's authenticated browser session - no server-side automation required.

## Features

- ✅ **DOM-first mapping** - Fast, reliable field detection
- ✅ **PII masking** - Automatically detects and masks sensitive data
- ✅ **LLM planning** - Uses Claude/Gemini to map data to fields
- ✅ **Vision fallback** - Screenshot-based recognition when DOM fails
- ✅ **Safety validation** - Preflight checks, password field blocking
- ✅ **All field types** - text, select, checkbox, radio, date, typeahead

## Installation

```bash
cd packages/form-skill
npm install
npm run build
```

## Usage

### Basic Flow

```typescript
import { domSnapshot, planFill, executeActions, validate } from '@schoolgle/form-skill';

// 1. Scan form
const schema = domSnapshot();

// 2. Plan fill actions
const inputData = {
  'First Name': 'John',
  'Last Name': 'Doe',
  'Date of Birth': '2010-01-15',
};

const plan = await planFill(schema, inputData, apiKey);

// 3. Validate
const validation = validate(plan.actions);
if (!validation.valid) {
  console.error('Validation failed:', validation.errors);
  return;
}

// 4. Execute
const result = await executeActions(plan.actions);
console.log(`Filled ${result.succeeded.length} fields`);
```

### Simple Matching (No LLM)

```typescript
import { planFillSimple } from '@schoolgle/form-skill';

// Fallback when LLM is unavailable
const plan = planFillSimple(schema, inputData);
```

### Vision Fallback

```typescript
import { recognizeFieldsWithVision, captureFormScreenshot } from '@schoolgle/form-skill';

// When DOM mapping fails, use vision
const screenshot = await captureFormScreenshot();
const fields = await recognizeFieldsWithVision(screenshot, apiKey);
```

## API Reference

### `domSnapshot(formElement?)`

Extracts form field schema from DOM.

**Returns:** `FormSchema` with fields, labels, types, selectors, PII masking

### `planFill(schema, inputData, apiKey, apiUrl?)`

Uses LLM to create fill action plan.

**Returns:** `FillPlan` with actions, warnings, unmapped fields, confidence

### `planFillSimple(schema, inputData)`

Simple DOM-based matching (no LLM).

**Returns:** `FillPlan`

### `executeActions(actions)`

Executes fill actions on the page.

**Returns:** `ExecutionResult` with succeeded/failed/skipped actions

### `validate(actions)`

Preflight validation and safety checks.

**Returns:** `ValidationResult` with errors, warnings, canSubmit flag

## Field Types Supported

- `text` - Text inputs
- `textarea` - Multi-line text
- `select` - Dropdowns
- `checkbox` - Checkboxes
- `radio` - Radio buttons
- `date` - Date inputs
- `email` - Email inputs
- `tel` - Phone inputs
- `number` - Number inputs
- `typeahead` - Autocomplete fields

## Safety Features

- ❌ **Never fills password fields**
- ⚠️ **Warns on sensitive data** (email, phone, DOB)
- ⚠️ **Warns on payment fields**
- ✅ **Validates field formats** (email, date, number)
- ✅ **Requires explicit submit** - Never submits forms automatically

## PII Detection

Automatically detects and masks:
- Email addresses
- Phone numbers
- UK postcodes
- Dates of birth
- National Insurance numbers
- UPNs
- Bank account numbers

## Integration with Ed Extension

See `packages/ed-extension/src/content/form-fill-ui.tsx` for UI components.

```typescript
import { FormFillDialog, injectFormFillStyles } from './form-fill-ui';

// Inject styles
injectFormFillStyles();

// Show dialog
const dialog = new FormFillDialog(apiKey, () => {
  console.log('Dialog closed');
});
dialog.show();
```

## License

Proprietary - Schoolgle Ltd.

