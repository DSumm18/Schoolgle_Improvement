# Ed Form Helper - Using Existing Infrastructure

## You're Right! We Already Have the Pieces

Like Firecrawl reads pages to understand structure, we need the **reverse** - understand structure to populate data.

---

## What We Already Have

### 1. Page Reader (`page-reader.ts`)
âœ… Already exists - extracts forms from DOM
```typescript
extractForms(doc: Document): FormInfo[] {
  // Finds all <form> elements
  // Extracts fields with labels, types, ids, names
  // Handles <label for="..."> and parent labels
  // Skips password fields (security)
}
```

### 2. Website Knowledge (`/api/ed/website-knowledge`)
âœ… Already exists - scans and stores page content
```sql
-- Table already exists:
ed_website_knowledge (
  page_url,
  page_title,
  headings,      -- H1, H2, H3...
  content,       -- Visible text
  content_type   -- page, policy, etc.
)
```

### 3. Tool Detector (`tool-detector.ts`)
âœ… Already exists - detects school systems (Arbor, SIMS, etc.)

---

## The Missing Piece: Form â†’ Site Mapping

We need to **map forms back to the website structure** we already scanned:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    EXISTING INFRASTRUCTURE                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                 â”‚
â”‚  Website Scanner â”€â”€â”€â”€â”€â”€> ed_website_knowledge table             â”‚
â”‚  (already built)          - page_url                            â”‚
â”‚                           - headings                            â”‚
â”‚                           - content                             â”‚
â”‚                           - forms (WE SHOULD ADD THIS!)         â”‚
â”‚                                                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    NEW: FORM STRUCTURE CACHE                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                 â”‚
â”‚  When we scan a page, ALSO store:                               â”‚
â”‚  - Form IDs and names                                           â”‚
â”‚  - Field labels and types                                       â”‚
â”‚  - Form structure (what fields belong together)                â”‚
â”‚                                                                 â”‚
â”‚  This means NEXT TIME we visit:                                  â”‚
â”‚  - We already know the form structure!                          â”‚
â”‚  - No need to re-analyze with AI                                 â”‚
â”‚  - Just ask: "What's your name?" â†’ fill field #0               â”‚
â”‚                                                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Implementation: Extend Website Scanner

```sql
-- Add form structure to existing table
ALTER TABLE ed_website_knowledge
ADD COLUMN forms JSONB;

-- Example stored value:
{
  "forms": [
    {
      "id": "safeguarding-form",
      "url": "https://school.org/report-concern",
      "type": "safeguarding",
      "fields": [
        {"index": 0, "label": "Your Name", "type": "text", "selector": "#your-name"},
        {"index": 1, "label": "Contact Number", "type": "tel", "selector": "#contact-number"},
        {"index": 2, "label": "Email Address", "type": "email", "selector": "#email-address"},
        {"index": 3, "label": "Relationship", "type": "select", "selector": "#relationship"},
        {"index": 4, "label": "Concern Details", "type": "textarea", "selector": "#concern-details"}
      ]
    }
  ]
}
```

---

## Enhanced Website Scanner

```typescript
// apps/platform/src/lib/website-scanner.ts (extend existing)

async function scanPageWithForms(url: string) {
  // 1. Use Playwright to get rendered page
  const page = await browser.newPage();
  await page.goto(url);

  // 2. Extract content (existing code)
  const content = await page.evaluate(() => {
    return {
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
      text: document.body.innerText,
    };
  });

  // 3. Extract form structure (NEW!)
  const forms = await page.evaluate(() => {
    const formElements = document.querySelectorAll('form');
    return Array.from(formElements).map(form => ({
      id: form.id || form.name,
      action: form.action,
      fields: Array.from(form.querySelectorAll('input, select, textarea'))
        .filter(el => !['hidden', 'submit', 'button'].includes(el.type))
        .map((el, idx) => ({
          index: idx,
          type: el.type,
          name: el.name,
          id: el.id,
          label: findLabel(el),  // Helper function
          selector: getSelector(el),  // Helper function
        }))
    }));
  });

  // 4. Classify form type with AI
  const formTypes = await classifyForms(forms);

  // 5. Store in database
  await supabase.from('ed_website_knowledge').upsert({
    page_url: url,
    page_title: content.title,
    headings: content.headings,
    content: content.text,
    forms: {
      forms: forms,
      types: formTypes  // "safeguarding", "job_application", etc.
    },
    scanned_at: new Date().toISOString()
  });
}

// Helper: Find CSS selector for an element
function getSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  if (el.name) return `[name="${el.name}"]`;
  // Generate unique selector
  return `[data-ed-field="${generateId()}"]`;
}
```

---

## When User Visits a Form

```typescript
// Content script detects URL

async function onUserVisitsForm() {
  const currentUrl = window.location.href;

  // 1. Check if we already scanned this page
  const { data: cached } = await supabase
    .from('ed_website_knowledge')
    .select('forms, page_title')
    .eq('page_url', currentUrl)
    .single();

  if (cached?.forms) {
    // âœ… CACHED! We already know the form structure
    console.log('Form structure cached, using cached data');
    startFormFilling(cached.forms);
    return;
  }

  // 2. Not cached - extract from current page
  const forms = extractForms(document);

  // 3. Classify with AI
  const formType = await classifyFormType(forms[0]);

  // 4. Start filling
  startFormFilling(forms, formType);

  // 5. Store for next time
  await supabase.from('ed_website_knowledge').insert({
    page_url: currentUrl,
    forms: { forms, types: [formType] },
  });
}
```

---

## The Flow: First Visit vs Subsequent Visits

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      FIRST VISIT                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                 â”‚
â”‚  1. User visits safeguarding form                               â”‚
â”‚  2. Ed: "I see this is a safeguarding concern form"             â”‚
â”‚  3. Ed: "Let me scan the fields..."                              â”‚
â”‚     [Uses AI + DOM to understand structure]                     â”‚
â”‚  4. Ed: "Found 5 fields. Let's start!"                          â”‚
â”‚  5. [Conversational filling]                                     â”‚
â”‚  6. [Store structure in database]                               â”‚
â”‚                                                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     SECOND VISIT (same school)                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                 â”‚
â”‚  1. User visits safeguarding form (same URL)                    â”‚
â”‚  2. Ed: [Checks database] "I know this form!"                   â”‚
â”‚  3. Ed: "It's the safeguarding concern form with 5 fields"      â”‚
â”‚  4. Ed: "What's your name?"                                     â”‚
â”‚     [No AI needed - uses cached structure]                      â”‚
â”‚  5. [Conversational filling]                                     â”‚
â”‚                                                                 â”‚
â”‚  âš¡ Much faster - no AI classification needed!                  â”‚
â”‚                                                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Form Type Classification (AI)

```typescript
// Classify what type of form this is
async function classifyFormType(form: FormInfo): Promise<string> {
  const fieldSummary = form.fields.map(f => `${f.label} (${f.type})`).join(', ');

  const response = await openrouter.chat.completions.create({
    model: 'openai/gpt-4o-mini',  // Fast and cheap
    messages: [{
      role: 'system',
      content: `Classify forms into one of these types:
      - safeguarding: Report concerns about child safety
      - job_application: Apply for a job at school
      - admissions: Apply for school place
      - free_school_meals: Apply for free meals
      - contact: General contact form
      - survey: Feedback or survey form
      - registration: Create an account
      - other: Anything else`
    },
    {
      role: 'user',
      content: `Classify this form. Fields: ${fieldSummary}

      Return ONLY the type name (one word).`
    }]
  });

  return response.choices[0].message.content.trim().toLowerCase();
}
```

---

## Benefit: School-Wide Form Knowledge

When a school scans their website, we capture ALL forms:

```
School: Rawdon St Peter's

Forms Discovered:
â”œâ”€â”€ /report-concern (Safeguarding) - 5 fields
â”œâ”€â”€ /job-application (HR) - 12 fields
â”œâ”€â”€ /admissions (Registrar) - 8 fields
â”œâ”€â”€ /free-school-meals (Finance) - 6 fields
â”œâ”€â”€ /contact-us (General) - 4 fields
â””â”€â”€ /parent-feedback (Survey) - 3 fields

When ANY parent visits these pages:
â†’ Ed already knows the structure!
â†’ Ed can help immediately!
â†’ No AI classification needed!
```

---

## Summary: Leveraging Existing Code

| Component | Status | Notes |
|-----------|--------|-------|
| `page-reader.ts` | âœ… Exists | Already extracts forms from DOM |
| `extractForms()` | âœ… Exists | Already finds fields, labels, types |
| `website-knowledge` table | âœ… Exists | Just need to add `forms` column |
| Website scanner | âœ… Exists | Just need to extract forms too |
| Form classification | ðŸ”¨ Build | Simple AI call |
| Form filling logic | ðŸ”¨ Build | Uses existing form detection |

**We're 80% there!** Just need to:
1. Add form extraction to website scanner
2. Add `forms` column to database
3. Connect the pieces together

