# Ed Form Filling - Quick Start Guide

## Overview

Ed can now dynamically fill web forms using:
- **Vision Models** (Claude 3.5 Sonnet Vision / Gemini Pro Vision) to recognize fields
- **Playwright** for browser automation
- **Hybrid approach** (DOM + Vision) for speed and accuracy

## Architecture

```
Extension → API → Playwright → Vision Model → Fill Form
```

## Setup (5 minutes)

### 1. Install Dependencies

```bash
cd apps/platform
npm install playwright @playwright/test
npx playwright install chromium
```

### 2. Environment Variables

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-...
VISION_MODEL=anthropic/claude-3.5-sonnet  # or google/gemini-pro-vision
```

### 3. Create API Endpoint

See `docs/ED_FORM_FILLING_PLAYWRIGHT_IMPLEMENTATION.md` for full code.

## Usage

### From Extension

```typescript
// User says: "Fill this form with data from spreadsheet.csv"

const formFiller = new FormFiller();
await formFiller.fillFormWithData({
  'First Name': 'John',
  'Last Name': 'Doe',
  'Date of Birth': '2010-01-15',
});
```

### API Call

```bash
curl -X POST https://schoolgle.co.uk/api/ed/form-fill \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://arbor.example.com/enroll",
    "formData": {
      "First Name": "John",
      "Last Name": "Doe"
    }
  }'
```

## How It Works

1. **Capture**: Extension takes screenshot + DOM snapshot
2. **Recognize**: Vision model maps data fields → form fields
3. **Fill**: Playwright fills fields using CSS selectors
4. **Verify**: Returns success + final screenshot

## Field Recognition

Vision model analyzes:
- Field labels (visible text)
- Field types (input, select, textarea)
- Context (surrounding text)
- Position (for disambiguation)

Returns:
```json
{
  "fieldLabel": "First Name",
  "selector": "input[name='firstName']",
  "fieldType": "input",
  "confidence": 0.95
}
```

## Best Practices

✅ **Do:**
- Cache field mappings per URL
- Ask user consent before filling
- Fill fields incrementally with feedback
- Handle errors gracefully

❌ **Don't:**
- Fill password fields
- Attempt CAPTCHA automation
- Fill without user approval
- Store form data unnecessarily

## Troubleshooting

**"Field not found"**
- Form may have changed
- Selector may be incorrect
- Try re-running vision recognition

**"Authentication required"**
- User must log in first
- Playwright can maintain session after login

**"Timeout"**
- Form may be slow to load
- Increase `FORM_FILL_TIMEOUT` env var

## Cost Estimate

- Vision model: ~$0.003 per image
- Per form fill: ~$0.01-0.05 (with caching)
- Caching reduces cost by 80%+

## Security

- Form data encrypted in transit
- Never stores passwords
- Requires user consent
- Audit logs all actions

## Next Steps

1. Read full implementation: `ED_FORM_FILLING_PLAYWRIGHT_IMPLEMENTATION.md`
2. Set up Playwright infrastructure
3. Test with sample forms
4. Deploy to production

