# Form Fill v1 - Quick Start

## Usage

### In Extension Code

```typescript
import { FormFillDialog, injectFormFillStyles } from '@/content/form-fill-ui';
import { loadEdConfig } from '@/shared/config';

// Get API key
const config = await loadEdConfig();
const apiKey = config.openRouterApiKey || config.geminiApiKey;

// Show dialog
injectFormFillStyles();
const dialog = new FormFillDialog(apiKey, () => {
  console.log('Form fill complete');
});
dialog.show();
```

### Demo Mode

Add `?ed_demo=true` to URL to test without real data:

```
https://example.com/form?ed_demo=true
```

## User Flow

1. **INTENT**: User opens dialog → scans form → pastes data → reviews plan → approves
2. **IMPLEMENTATION**: Ed fills form with visual feedback
3. **IMPACT**: User sees results summary

## Keyboard Shortcuts

- **Enter**: Approve plan (INTENT stage)
- **Esc**: Cancel/Close (any stage)
- **S**: Stop execution (IMPLEMENTATION stage)
- **P**: Pause/Resume (IMPLEMENTATION stage)

## Audit Log

Stored in `chrome.storage.local` under key `ed_form_fill_audit_log`.

Access via:
```typescript
import { getAuditLog } from '@/content/form-fill-audit';
const logs = await getAuditLog();
```

## Testing

1. Load extension in Chrome
2. Navigate to a form page
3. Trigger form fill dialog
4. Test each stage:
   - Scan form
   - Enter/paste data
   - Review plan with confidence scores
   - Approve and execute
   - View results

## Known Limitations

- Execution runs all actions at once (not step-by-step)
- Pause/Stop buttons stop before execution starts (execution itself can't be paused mid-run)
- Vision fallback flag exists but UI not yet implemented

