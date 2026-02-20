# Ed Form Helper - Template Allowlist

## What We Built

A system for **pre-configured forms** that Ed knows how to fill. Schools can add their own templates, plus there are public templates like RIDDOR.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORM TEMPLATE SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER VISITS URL                                             │
│     https://notifications.hse.gov.uk/riddorforms/Injury         │
│              │                                                  │
│              ▼                                                  │
│  2. ED CHECKS ALLOWLIST                                        │
│     "Found template: RIDDOR Injury Reporting"                  │
│              │                                                  │
│              ▼                                                  │
│  3. ED PROMPTS                                                 │
│     "I can help you fill this RIDDOR report. Start?"           │
│              │                                                  │
│              ▼                                                  │
│  4. CONVERSATIONAL FILLING                                     │
│     Ed: "When did the incident happen?"                         │
│     User: "This morning at 10am"                                │
│     Ed: [Fills date field]                                      │
│     Ed: "What type of incident?"                                │
│     ...                                                          │
│              │                                                  │
│              ▼                                                  │
│  5. COMPLETE                                                   │
│     "I've filled 10 fields. Please review and submit."         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
ed_form_templates (
  id UUID PRIMARY KEY,
  organization_id UUID,              -- NULL = public template
  form_key TEXT UNIQUE,              -- e.g., "hse_riddor_injury"
  form_name TEXT,                    -- "RIDDOR Injury Reporting"
  form_category TEXT,                -- "hse", "safeguarding", etc.
  url_pattern TEXT,                  -- URL to match
  url_pattern_type TEXT,             -- "exact", "contains", "wildcard"
  form_structure JSONB,              -- Field definitions
  conversation_template JSONB,       -- Questions in multiple languages
  is_public BOOLEAN,                 -- Available to all schools?
  requires_role TEXT[],              -- Who can use this template
  ...
)
```

---

## Pre-Installed Templates

### 1. RIDDOR Injury Reporting
- **URL**: `notifications.hse.gov.uk/riddorforms/Injury`
- **Category**: HSE (Health & Safety Executive)
- **Fields**: 10 fields including date, incident type, person involved, injury details
- **Time**: ~10 minutes
- **Roles**: Admin, SLT, School Business Manager, Site Manager

### 2. RIDDOR Death Reporting
- **URL**: `notifications.hse.gov.uk/riddorforms/Death`
- **Category**: HSE
- **Fields**: 5 critical fields
- **Roles**: Headteacher, SLT only (urgent)

---

## Template Structure

Each template contains:

### Form Structure (what fields exist)
```json
{
  "fields": [
    {
      "index": 0,
      "label": "Date and time of incident",
      "type": "datetime",
      "selector": "[name*=\"date\"]",
      "required": true
    },
    {
      "index": 1,
      "label": "Type of incident",
      "type": "select",
      "options": ["Injury", "Death", "Dangerous occurrence"],
      "required": true
    }
  ]
}
```

### Conversation Template (what Ed asks)
```json
{
  "intro": {
    "en": "I can help you fill in this RIDDOR report...",
    "ur": "Mein RIDDOR report madad kar sakta hoon..."
  },
  "questions": [
    {
      "fieldIndex": 0,
      "question": {
        "en": "When did the incident happen?",
        "ur": "Incident kab hua?"
      }
    }
  ]
}
```

---

## Adding New Templates

### Via Dashboard
1. Go to `/dashboard/ed/form-templates`
2. Click "Add Custom Template"
3. Enter:
   - Form Key (e.g., `school_absence_report`)
   - Form Name (e.g., "School Absence Report")
   - Category (e.g., "safeguarding")
   - URL Pattern (e.g., `school.org/absence-report`)
   - Description
4. Save

### Via SQL (for public templates)
```sql
INSERT INTO ed_form_templates (
  form_key, form_name, form_category, url_pattern,
  form_structure, conversation_template, is_public
) VALUES (
  'hse_gas_safe',
  'Gas Safety Certificate',
  'hse',
  'gassaferegister.co.uk',
  '{
    "fields": [
      {"index": 0, "label": "Postcode", "type": "text", "selector": "#postcode"},
      {"index": 1, "label": "School name", "type": "text", "selector": "#school"}
    ]
  }'::jsonb,
  '{
    "intro": {"en": "I can help you check Gas Safe register..."},
    "questions": [...]
  }'::jsonb,
  true
);
```

---

## URL Matching Strategies

| Type | Example Pattern | Matches |
|------|----------------|---------|
| **exact** | `school.org/admissions` | Only that exact URL |
| **contains** | `riddorforms` | Any URL containing "riddorforms" |
| **wildcard** | `hse.gov.uk/*` | Any HSE page |

---

## Role-Based Access

Different templates require different roles:

| Template | Requires Role |
|----------|--------------|
| RIDDOR Injury | admin, slt, sbm, site_manager |
| RIDDOR Death | headteacher, slt |
| Safeguarding | admin, slt, dsl |
| Absence Report | admin, office_staff |

---

## API Endpoints

### Check URL for Template
```http
GET /api/ed/form-templates?url=https://notifications.hse.gov.uk/riddorforms/Injury

Response:
{
  "found": true,
  "template": {
    "form_key": "hse_riddor_injury",
    "form_name": "RIDDOR Injury Reporting",
    "form_category": "hse",
    "form_structure": {...},
    "conversation_template": {...}
  }
}
```

### Get All Templates
```http
GET /api/ed/form-templates?category=hse

Response:
{
  "templates": {
    "public": [...],
    "school": [...]
  }
}
```

### Create Custom Template
```http
POST /api/ed/form-templates

Body:
{
  "form_key": "school_trip_form",
  "form_name": "School Trip Permission",
  "form_category": "other",
  "url_pattern": "school.org/trip-permission",
  "form_structure": {"fields": [...]},
  "description": "Parent consent for school trips"
}
```

---

## Content Script Integration

```typescript
// When user navigates to a page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Check if URL matches a template
    const template = await checkForTemplateMatch(tab.url);

    if (template) {
      // Show badge
      chrome.action.setIcon({ tabId, path: 'icon-active.png' });
      chrome.action.setBadgeText({ tabId, text: 'ED' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#10b981' });

      // Auto-prompt after delay
      chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_TEMPLATE_PROMPT',
        template
      });
    }
  }
});
```

---

## Common Forms to Add

Suggested templates for UK schools:

| Form | URL Pattern | Category | Priority |
|------|-------------|----------|----------|
| **RIDDOR Injury** | `notifications.hse.gov.uk/riddor` | HSE | ✅ Done |
| **RIDDOR Death** | `notifications.hse.gov.uk/riddor/Death` | HSE | ✅ Done |
| **Ofsted Concerns** | `reports.ofsted.gov.uk` | Compliance | High |
| **DBS Check** | `dbscheck.org` | Compliance | High |
| **Gas Safety** | `gassaferegister.co.uk` | HSE | Medium |
| **School Admissions** | `*.gov.uk/admissions` | Admissions | Medium |
| **Free School Meals** | `*.gov.uk/free-school-meals` | Welfare | Medium |
| **EHCP Request** | `*.gov.uk/ehcp` | SEND | High |

---

## Summary

| Component | File | Purpose |
|-----------|------|---------|
| **Database** | `20260219_ed_form_allowlist.sql` | Store templates |
| **API** | `/api/ed/form-templates/route.ts` | CRUD operations |
| **Dashboard** | `/dashboard/ed/form-templates/page.tsx` | Management UI |
| **Matcher** | `form-template-matcher.ts` | Content script integration |

Schools can now:
1. ✅ Use pre-configured HSE templates (RIDDOR)
2. ✅ Add their own school-specific forms
3. ✅ Share templates within their MAT/trust
4. ✅ Control who can use which templates
