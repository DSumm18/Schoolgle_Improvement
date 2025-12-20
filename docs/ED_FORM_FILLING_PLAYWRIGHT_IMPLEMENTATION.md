# Ed Dynamic Form-Filling with Playwright and Vision

## Executive Summary

This document outlines the implementation plan for enhancing Ed (Chrome extension AI assistant) with dynamic form-filling capabilities using Playwright for browser automation and vision models for field recognition. This enables Ed to fill forms in systems like Arbor without requiring predefined field maps.

---

## Current Architecture Review

### Existing Components

1. **Chrome Extension** (`packages/ed-extension/`)
   - Content scripts for page context extraction
   - Form detection via `page-reader.ts` (DOM-based)
   - Basic `FormFiller` class (DOM manipulation only)
   - MCP/Anthropic integration via OpenRouter

2. **Backend Services**
   - Next.js API routes (`apps/platform/src/app/api/`)
   - MCP server (`packages/mcp-server/`)
   - OpenRouter LLM integration

3. **Form Extraction**
   - `extractForms()` in `page-reader.ts` - extracts form fields via DOM
   - Limited to static HTML attributes (name, id, label)

### Limitations

- **Static field mapping**: Relies on HTML attributes (name, id) which may not exist or be meaningful
- **No visual understanding**: Cannot recognize fields by appearance or context
- **Client-side only**: Cannot handle complex interactions (modals, multi-step forms)
- **No cross-origin support**: Cannot fill forms that require navigation or authentication

---

## Solution Architecture

### High-Level Flow

```
┌─────────────────┐
│  Chrome Ext     │
│  (User Action)   │
└────────┬────────┘
         │ 1. User: "Fill this form with spreadsheet data"
         ▼
┌─────────────────┐
│  Content Script │
│  - Capture form │
│  - Screenshot   │
│  - Extract DOM  │
└────────┬────────┘
         │ 2. POST /api/ed/form-fill
         ▼
┌─────────────────┐
│  Next.js API     │
│  - Vision model │
│  - Field mapping │
└────────┬────────┘
         │ 3. Playwright automation
         ▼
┌─────────────────┐
│  Playwright      │
│  - Navigate      │
│  - Fill fields   │
│  - Submit        │
└─────────────────┘
```

### Key Design Decisions

1. **Server-Side Playwright**: Playwright runs on the backend (not in extension) to:
   - Handle authentication flows
   - Support cross-origin navigation
   - Avoid browser extension limitations
   - Centralize automation logic

2. **Vision Model for Field Recognition**: Use vision-capable LLM (Claude 3.5 Sonnet Vision, GPT-4V, or Gemini Pro Vision) to:
   - Recognize fields by visual appearance
   - Understand context (e.g., "Date of Birth" field even if HTML says "dob")
   - Handle dynamic/SPA forms

3. **Hybrid Approach**: Combine DOM extraction (fast) with vision (accurate) for best results

---

## Implementation Plan

### Phase 1: Backend Infrastructure (Week 1-2)

#### 1.1 Install Playwright Dependencies

```bash
cd apps/platform
npm install playwright @playwright/test
npx playwright install chromium
```

**Files to create:**
- `apps/platform/src/lib/playwright/playwright-client.ts` - Playwright client wrapper
- `apps/platform/src/lib/playwright/form-filler.ts` - Form filling logic

#### 1.2 Create Playwright Service

```typescript
// apps/platform/src/lib/playwright/playwright-client.ts

import { chromium, Browser, Page } from 'playwright';
import type { FormFieldMapping, FormFillRequest } from '@/types/form-fill';

export class PlaywrightClient {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('Playwright not initialized');
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async fillForm(mappings: FormFieldMapping[]): Promise<void> {
    if (!this.page) throw new Error('Playwright not initialized');
    
    for (const mapping of mappings) {
      const { selector, value, type } = mapping;
      
      switch (type) {
        case 'input':
        case 'textarea':
          await this.page.fill(selector, value);
          break;
        case 'select':
          await this.page.selectOption(selector, value);
          break;
        case 'checkbox':
          if (value === 'true' || value === '1') {
            await this.page.check(selector);
          } else {
            await this.page.uncheck(selector);
          }
          break;
        case 'radio':
          await this.page.check(selector);
          break;
      }
      
      // Small delay between fields
      await this.page.waitForTimeout(200);
    }
  }

  async screenshot(): Promise<Buffer> {
    if (!this.page) throw new Error('Playwright not initialized');
    return await this.page.screenshot({ fullPage: true });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
```

#### 1.3 Vision Model Integration

```typescript
// apps/platform/src/lib/vision/form-field-recognizer.ts

import { callOpenRouter } from '@/lib/openrouter';
import type { FormFieldInfo } from '@/types/form-fill';

export interface VisionFieldMapping {
  fieldLabel: string; // What the user sees (e.g., "Date of Birth")
  selector: string;   // CSS selector to target the field
  fieldType: 'input' | 'select' | 'textarea' | 'checkbox' | 'radio';
  confidence: number;
}

export async function recognizeFormFields(
  screenshot: Buffer,
  domSnapshot: string,
  dataFields: string[] // Field names from spreadsheet
): Promise<VisionFieldMapping[]> {
  // Convert screenshot to base64
  const imageBase64 = screenshot.toString('base64');
  
  // Build prompt for vision model
  const prompt = `You are analyzing a web form to map spreadsheet data fields to form fields.

Available data fields from spreadsheet:
${dataFields.map(f => `- ${f}`).join('\n')}

DOM structure:
${domSnapshot.substring(0, 5000)} // Limit DOM size

Task:
1. Identify all visible form fields in the screenshot
2. Match each data field to the most appropriate form field
3. Provide CSS selectors that uniquely identify each field
4. Return JSON array with: fieldLabel, selector, fieldType, confidence (0-1)

Rules:
- Never map to password fields
- Prefer labels over placeholders for matching
- Use data-testid, id, name, or label text for selectors
- If a field isn't visible, set confidence to 0

Return ONLY valid JSON array, no markdown or explanation.`;

  const response = await callOpenRouter({
    model: 'anthropic/claude-3.5-sonnet', // or 'google/gemini-pro-vision'
    system: 'You are a form field recognition expert. Return only valid JSON.',
    user: [
      {
        type: 'text',
        text: prompt,
      },
      {
        type: 'image',
        image: `data:image/png;base64,${imageBase64}`,
      },
    ],
    temperature: 0.1, // Low temperature for consistent mapping
  });

  // Parse JSON response
  try {
    const mappings = JSON.parse(response.text) as VisionFieldMapping[];
    return mappings.filter(m => m.confidence > 0.5); // Filter low-confidence matches
  } catch (error) {
    console.error('Failed to parse vision model response:', error);
    return [];
  }
}
```

#### 1.4 API Endpoint

```typescript
// apps/platform/src/app/api/ed/form-fill/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PlaywrightClient } from '@/lib/playwright/playwright-client';
import { recognizeFormFields } from '@/lib/vision/form-field-recognizer';
import { extractFormFieldsFromDOM } from '@/lib/form-extraction';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, formData, screenshot, domSnapshot } = body;

    // Initialize Playwright
    const playwright = new PlaywrightClient();
    await playwright.init();

    try {
      // Navigate to URL
      await playwright.navigate(url);

      // Take fresh screenshot if not provided
      const pageScreenshot = screenshot 
        ? Buffer.from(screenshot, 'base64')
        : await playwright.screenshot();

      // Get DOM snapshot if not provided
      const pageDOM = domSnapshot || await playwright.page!.content();

      // Extract data field names from formData
      const dataFields = Object.keys(formData);

      // Use vision model to map fields
      const fieldMappings = await recognizeFormFields(
        pageScreenshot,
        pageDOM,
        dataFields
      );

      // Convert mappings to Playwright actions
      const fillActions = fieldMappings.map(mapping => ({
        selector: mapping.selector,
        value: formData[mapping.fieldLabel] || formData[dataFields.find(f => 
          f.toLowerCase().includes(mapping.fieldLabel.toLowerCase())
        ) || ''],
        type: mapping.fieldType,
      }));

      // Fill the form
      await playwright.fillForm(fillActions);

      // Take final screenshot for verification
      const finalScreenshot = await playwright.screenshot();

      return NextResponse.json({
        success: true,
        fieldsFilled: fillActions.length,
        finalScreenshot: finalScreenshot.toString('base64'),
      });

    } finally {
      await playwright.close();
    }

  } catch (error) {
    console.error('Form fill error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Form fill failed' },
      { status: 500 }
    );
  }
}
```

---

### Phase 2: Extension Integration (Week 2-3)

#### 2.1 Enhance Content Script

```typescript
// packages/ed-extension/src/content/form-capture.ts

export interface FormCaptureData {
  url: string;
  screenshot: string; // base64
  domSnapshot: string;
  formFields: FormFieldInfo[];
}

export async function captureFormForFilling(): Promise<FormCaptureData> {
  // Capture screenshot
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const video = document.createElement('video');
  
  // Use html2canvas or similar for screenshot
  const html2canvas = await import('html2canvas');
  const canvasEl = await html2canvas.default(document.body);
  const screenshot = canvasEl.toDataURL('image/png');

  // Get DOM snapshot
  const domSnapshot = document.documentElement.outerHTML;

  // Extract form fields (existing logic)
  const forms = extractForms(document);

  return {
    url: window.location.href,
    screenshot: screenshot.split(',')[1], // Remove data:image/png;base64, prefix
    domSnapshot,
    formFields: forms[0]?.fields || [],
  };
}
```

#### 2.2 Add Form Fill Command to Ed Widget

```typescript
// packages/ed-widget/src/features/formFill.ts (enhance existing)

export class FormFiller {
  // ... existing code ...

  async fillFormWithData(data: Record<string, string>): Promise<void> {
    // Capture form context
    const capture = await this.captureFormForFilling();

    // Send to backend API
    const response = await fetch('https://schoolgle.co.uk/api/ed/form-fill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({
        url: capture.url,
        formData: data,
        screenshot: capture.screenshot,
        domSnapshot: capture.domSnapshot,
      }),
    });

    if (!response.ok) {
      throw new Error('Form fill failed');
    }

    const result = await response.json();
    
    // Show success message
    this.showNotification(`Filled ${result.fieldsFilled} fields`);
  }
}
```

#### 2.3 Add UI for Data Input

```typescript
// packages/ed-widget/src/components/FormFillDialog.tsx

export function FormFillDialog({ form, onClose }: Props) {
  const [dataSource, setDataSource] = useState<'manual' | 'spreadsheet'>('manual');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    // Parse CSV/Excel
    const text = await file.text();
    const rows = parseCSV(text);
    
    // Use first row as data (or show row selector)
    setFormData(rows[0]);
  };

  const handleFill = async () => {
    const filler = new FormFiller();
    await filler.fillFormWithData(formData);
    onClose();
  };

  return (
    <div className="form-fill-dialog">
      <h3>Fill Form</h3>
      
      <select value={dataSource} onChange={e => setDataSource(e.target.value)}>
        <option value="manual">Enter Manually</option>
        <option value="spreadsheet">Upload CSV/Excel</option>
      </select>

      {dataSource === 'spreadsheet' && (
        <input type="file" accept=".csv,.xlsx" onChange={e => handleFileUpload(e.target.files[0])} />
      )}

      {dataSource === 'manual' && (
        <div className="form-fields">
          {form.fields.map(field => (
            <div key={field.name}>
              <label>{field.label || field.name}</label>
              <input
                type="text"
                value={formData[field.name] || ''}
                onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      <button onClick={handleFill}>Fill Form</button>
    </div>
  );
}
```

---

### Phase 3: Vision Model Optimization (Week 3-4)

#### 3.1 Hybrid Field Recognition

Combine DOM extraction with vision for best results:

```typescript
// apps/platform/src/lib/vision/hybrid-field-recognizer.ts

export async function recognizeFieldsHybrid(
  screenshot: Buffer,
  domSnapshot: string,
  dataFields: string[],
  domFields: FormFieldInfo[] // From DOM extraction
): Promise<VisionFieldMapping[]> {
  
  // Step 1: Try DOM-based matching first (fast, free)
  const domMatches = matchFieldsByDOM(dataFields, domFields);
  
  // Step 2: For unmatched fields, use vision model
  const unmatchedFields = dataFields.filter(f => 
    !domMatches.some(m => m.fieldLabel === f)
  );
  
  if (unmatchedFields.length === 0) {
    return domMatches;
  }

  // Step 3: Vision model for remaining fields
  const visionMatches = await recognizeFormFields(
    screenshot,
    domSnapshot,
    unmatchedFields
  );

  return [...domMatches, ...visionMatches];
}
```

#### 3.2 Field Validation

```typescript
// apps/platform/src/lib/vision/field-validator.ts

export async function validateFieldMapping(
  mapping: VisionFieldMapping,
  page: Page
): Promise<boolean> {
  try {
    // Check if selector exists
    const element = await page.$(mapping.selector);
    if (!element) return false;

    // Check if element is visible
    const isVisible = await element.isVisible();
    if (!isVisible) return false;

    // Check if element is the correct type
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const expectedTag = mapping.fieldType === 'input' ? 'input' : 
                       mapping.fieldType === 'select' ? 'select' : 'textarea';
    
    return tagName === expectedTag;
  } catch {
    return false;
  }
}
```

---

### Phase 4: Testing & Refinement (Week 4-5)

#### 4.1 Test Cases

1. **Simple Form** (Arbor student enrollment)
   - Text inputs, dropdowns, date pickers
   - Expected: 95%+ field mapping accuracy

2. **Complex Form** (Multi-step wizard)
   - Dynamic fields, conditional sections
   - Expected: Handles navigation between steps

3. **SPA Form** (React/Vue form)
   - No traditional form element
   - Expected: Vision model recognizes custom components

4. **Authentication Required**
   - Form behind login
   - Expected: Playwright handles auth flow

#### 4.2 Error Handling

```typescript
// apps/platform/src/lib/playwright/error-handler.ts

export class FormFillError extends Error {
  constructor(
    message: string,
    public code: 'FIELD_NOT_FOUND' | 'AUTH_REQUIRED' | 'FORM_CHANGED' | 'NETWORK_ERROR',
    public field?: string
  ) {
    super(message);
  }
}

export function handleFormFillError(error: unknown): FormFillError {
  if (error instanceof FormFillError) return error;
  
  // Parse common errors
  if (error.message.includes('timeout')) {
    return new FormFillError('Form took too long to load', 'NETWORK_ERROR');
  }
  
  if (error.message.includes('login') || error.message.includes('auth')) {
    return new FormFillError('Authentication required', 'AUTH_REQUIRED');
  }
  
  return new FormFillError('Unknown error', 'NETWORK_ERROR');
}
```

---

## Best Practices & Pitfalls

### ✅ Best Practices

1. **Rate Limiting**: Vision model calls are expensive. Cache field mappings per URL.
2. **Selector Stability**: Prefer `data-testid` > `id` > `name` > label text for selectors.
3. **User Consent**: Always ask user before filling forms (GDPR compliance).
4. **Incremental Filling**: Fill fields one at a time with visual feedback.
5. **Rollback**: Store original form state to allow undo.

### ⚠️ Pitfalls to Avoid

1. **Password Fields**: Never attempt to fill password fields (security risk).
2. **CAPTCHA**: Cannot automate CAPTCHA - must pause for user input.
3. **Rate Limits**: Vision API has rate limits - implement exponential backoff.
4. **Dynamic Content**: Forms that load via AJAX may need wait strategies.
5. **CORS**: Some sites block automation - use stealth mode or proxy.

### 🔒 Security Considerations

1. **Data Privacy**: Form data is sent to backend - ensure encryption in transit.
2. **Authentication**: Store user credentials securely (never in extension storage).
3. **Audit Logging**: Log all form-fill actions for compliance.
4. **User Approval**: Require explicit approval for sensitive forms (financial, safeguarding).

---

## Configuration

### Environment Variables

```bash
# .env.local
PLAYWRIGHT_BROWSER_PATH=/path/to/chromium  # Optional
OPENROUTER_API_KEY=sk-or-v1-...            # For vision model
VISION_MODEL=anthropic/claude-3.5-sonnet   # or google/gemini-pro-vision
FORM_FILL_TIMEOUT=30000                    # 30 seconds
```

### Manifest Permissions

```json
// packages/ed-extension/manifest.json
{
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "tabs"  // For URL access
  ],
  "host_permissions": [
    "<all_urls>",  // For form capture
    "https://schoolgle.co.uk/*"  // For API calls
  ]
}
```

---

## Testing Guidelines

### Unit Tests

```typescript
// apps/platform/src/lib/vision/__tests__/form-field-recognizer.test.ts

describe('recognizeFormFields', () => {
  it('should map "First Name" to input field', async () => {
    const screenshot = await loadTestScreenshot('simple-form.png');
    const dom = await loadTestDOM('simple-form.html');
    
    const mappings = await recognizeFormFields(
      screenshot,
      dom,
      ['First Name', 'Last Name']
    );
    
    expect(mappings).toContainEqual(
      expect.objectContaining({
        fieldLabel: 'First Name',
        fieldType: 'input',
        confidence: expect.any(Number),
      })
    );
  });
});
```

### Integration Tests

```typescript
// apps/platform/src/app/api/ed/form-fill/__tests__/route.test.ts

describe('POST /api/ed/form-fill', () => {
  it('should fill a test form', async () => {
    const response = await fetch('http://localhost:3000/api/ed/form-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com/test-form',
        formData: { 'First Name': 'John', 'Last Name': 'Doe' },
      }),
    });
    
    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.fieldsFilled).toBeGreaterThan(0);
  });
});
```

### E2E Tests with Playwright

```typescript
// apps/platform/playwright-e2e/form-fill.spec.ts

import { test, expect } from '@playwright/test';

test('Ed form fill integration', async ({ page }) => {
  // Load extension
  // Navigate to test form
  // Trigger Ed form fill
  // Verify fields are filled
});
```

---

## Deployment Checklist

- [ ] Install Playwright browsers on production server
- [ ] Configure vision model API key
- [ ] Set up rate limiting for form-fill endpoint
- [ ] Add monitoring/alerting for failed form fills
- [ ] Test with real Arbor/SIMS forms
- [ ] Document user-facing features
- [ ] Add error messages for common failures
- [ ] Implement field mapping cache
- [ ] Set up audit logging

---

## Future Enhancements

1. **Multi-Step Forms**: Handle wizards with navigation between steps
2. **File Uploads**: Support file field filling from spreadsheet attachments
3. **Conditional Logic**: Handle forms with show/hide fields based on inputs
4. **Batch Processing**: Fill multiple forms from one spreadsheet
5. **Template System**: Save field mappings as templates for reuse
6. **Offline Mode**: Cache field mappings for offline use

---

## Questions & Answers

### Q: Why not use Puppeteer instead of Playwright?

**A:** Playwright has better cross-browser support, more reliable selectors, and better handling of modern SPAs. It's also actively maintained by Microsoft.

### Q: Can this work with forms behind authentication?

**A:** Yes, but requires user to authenticate first. Playwright can maintain session cookies, but initial login must be manual or use stored credentials (with user consent).

### Q: What about forms that use CAPTCHA?

**A:** CAPTCHA cannot be automated. Ed should pause and prompt user to complete CAPTCHA manually before continuing.

### Q: How expensive is the vision model?

**A:** Claude 3.5 Sonnet Vision costs ~$0.003 per image. With caching, cost per form fill is ~$0.01-0.05 depending on form complexity.

### Q: Can this work offline?

**A:** Partially. Field mappings can be cached, but vision model requires API access. DOM-based matching works offline.

---

## Conclusion

This implementation enables Ed to dynamically fill forms without predefined field maps, making it adaptable to any web form including Arbor, SIMS, and other school systems. The hybrid approach (DOM + Vision) balances speed and accuracy while maintaining user privacy and security.

**Next Steps:**
1. Review and approve this plan
2. Set up Playwright infrastructure
3. Implement Phase 1 (Backend)
4. Test with sample forms
5. Iterate based on results

