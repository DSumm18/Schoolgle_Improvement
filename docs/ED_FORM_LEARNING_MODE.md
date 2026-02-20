# Ed Form Learning Mode

## Concept

Ed learns how to fill forms by **watching users complete them**. Like an apprentice observing a master, Ed builds up knowledge of:
- Form structure and navigation
- Which fields matter and which don't
- Where information typically comes from
- Common mistakes and how to avoid them

**Crucially:** No personal data is stored. Only structure and patterns.

---

## How It Works

### Phase 1: Observation Mode

```
┌─────────────────────────────────────────────────────────────┐
│  User fills form normally                                  │
│  ↓                                                          │
│  Browser extension captures:                               │
│  - DOM selectors for each field                            │
│  - Field types (text, dropdown, date, etc.)                │
│  - Required vs optional                                    │
│  - Validation rules (patterns, error messages)             │
│  - Navigation flow (tabs, sections, progress)              │
│  ↓                                                          │
│  Personal values are HASHED or discarded                    │
│  ↓                                                          │
│  Structure is stored as a "Form Template"                  │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Clarification Mode

As Ed watches, it asks questions to understand:

| Field | Ed Asks | Why |
|-------|---------|-----|
| `incident_date` | "What does this field represent?" | Understands semantic meaning |
| `employee_name` | "Where does this data come from?" | Learns data source mapping |
| `injury_type` | "What are the valid options?" | Builds validation knowledge |
| Section C | "When do users typically need help here?" | Identifies pain points |

### Phase 3: Skill Generation

Once enough examples are collected (3-5 fills), Ed generates:

1. **Form Template** - Structure with selectors and metadata
2. **Field Knowledge** - Explanations, red flags, suggested wordings
3. **Data Source Map** - Where to find each piece of information
4. **Skill Definition** - RPA-ready automation steps

---

## Architecture

### 1. Browser Extension (Observer)

```typescript
// packages/ed-extension/src/content/form-learner.ts

interface FieldObservation {
  selector: string;           // #incidentDate
  type: string;              // 'text', 'select', 'date'
  label: string;             // 'Date of Incident'
  placeholder?: string;
  required: boolean;
  options?: string[];        // For dropdowns
  validation?: {             // Learned from errors
    pattern?: string;
    message?: string;
  };
  semanticMeaning?: string;  // Learned from user
  dataSource?: string;       // Learned from user
}

interface FormObservation {
  url: string;
  formName: string;          // Learned from user
  fields: FieldObservation[];
  sections: Array<{
    title: string;
    fields: string[];
  }>;
  navigation: Array<{
    action: string;          // 'click', 'select'
    target: string;
    condition?: string;
  }>;
  submission: {
    method: string;          // 'click', 'api'
    target: string;
    confirmation?: string;
  };
}

class FormLearner {
  private observations: Map<string, FormObservation> = new Map();
  private currentSession: string | null = null;

  startLearning(formName: string) {
    this.currentSession = crypto.randomUUID();
    // Show UI: "Ed is learning..."
  }

  observeField(field: HTMLElement, value: any) {
    // Store structure, hash the value
    const observation: FieldObservation = {
      selector: this.getSelector(field),
      type: field.type,
      label: this.getLabel(field),
      required: field.required,
      // value is NOT stored - only that it was filled
    };
  }

  async askAboutField(field: HTMLElement): Promise<string> {
    // Ask user: "What is this field for?"
    // Return semantic meaning
  }

  finishLearning() {
    // Consolidate observations into template
    // Generate skill definition
    // Store in database
  }
}
```

### 2. Chat API (Clarification)

```typescript
// apps/platform/src/app/api/ed/form-learn/route.ts

interface LearningMessage {
  type: 'field_question' | 'data_source' | 'confirmation';
  field: {
    selector: string;
    label: string;
  };
  question: string;
}

// Ed asks user during observation:
POST /api/ed/form-learn/ask
{
  "field_selector": "#incidentDate",
  "question": "I see this is a date field. What information should go here?",
  "options": [
    "Date the incident occurred",
    "Date the incident was reported",
    "Date of injury",
    "Other (explain)"
  ]
}
```

### 3. Database (Learning Storage)

```sql
-- Tables for learned forms

CREATE TABLE ed_learned_forms (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,
  form_name TEXT NOT NULL,
  learned_from_count INTEGER DEFAULT 1,

  -- The learned structure
  form_structure JSONB NOT NULL,
  -- {
  --   fields: [{ selector, type, label, required, ... }],
  --   sections: [...],
  --   navigation: [...],
  --   submission: {...}
  -- }

  -- Metadata
  confidence_score NUMERIC,  -- 0-100, based on observation count
  last_observed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ed_field_annotations (
  id UUID PRIMARY KEY,
  form_id UUID REFERENCES ed_learned_forms(id),
  field_selector TEXT NOT NULL,

  -- What users told us about this field
  semantic_meaning TEXT,        -- "Date the incident occurred"
  data_source_suggestions TEXT[], -- ["HR system", "User input", "Calendar"]
  common_issues TEXT[],          -- ["Users often put wrong date format"]
  help_text TEXT,                -- Explanation to show future users

  -- Validation learned from errors
  validation_rules JSONB,
  -- { pattern: "^\d{4}-\d{2}-\d{2}$", message: "Use YYYY-MM-DD format" }

  agreed_count INTEGER DEFAULT 0,  -- How many users confirmed this
  disagreed_count INTEGER DEFAULT 0
);

CREATE TABLE ed_learning_sessions (
  id UUID PRIMARY KEY,
  form_id UUID REFERENCES ed_learned_forms(id),
  user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Privacy: NO actual values stored
  fields_observed INTEGER,
  questions_asked INTEGER,
  questions_answered INTEGER,

  session_quality NUMERIC,  -- How complete the learning was
);
```

### 4. Privacy Layer

```typescript
// packages/ed-extension/src/content/privacy-filter.ts

class PrivacyFilter {
  // Types of data we NEVER store
  private readonly sensitivePatterns = [
    /^\d{16}$/,           // Credit card numbers
    /^[A-Z]{3}\d{6}$/,    // NI numbers
    /@/,                  // Email addresses
    /^\d{11}$/,           // Phone numbers
    /^\d{4}-\d{2}-\d{2}$/, // Dates (store as "DATE_TYPE" only)
  ];

  sanitize(value: any): string {
    const str = String(value);

    // Check for sensitive patterns
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(str)) {
        return this.getType(str);
      }
    }

    // For non-sensitive values, check length
    if (str.length > 50) {
      return "LONG_TEXT";  // Don't store long text content
    }

    // Hash to avoid storing exact values
    return this.hash(str);
  }

  private getType(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "DATE";
    if (/@/.test(value)) return "EMAIL";
    if (/^\d+$/.test(value)) return "NUMBER";
    return "TEXT";
  }

  private hash(value: string): string {
    // One-way hash - can't reverse to original
    return sha256(value + salt).substring(0, 8);
  }
}
```

---

## User Experience

### Initial Learning Session

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Ed Learning Mode                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  I'd like to learn how to fill this form. Is that okay?    │
│                                                             │
│  [Yes, teach me]  [Not now, maybe later]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### During Observation

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Ed is watching...                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Field: "Date of Incident"                                  │
│                                                             │
│  What information should go here?                           │
│  ○ The date it happened                                    │
│  ○ The date you reported it                                │
│  ○ The date of injury                                      │
│  ○ Other                                                   │
│                                                             │
│  [Your answer: ___________]                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### After 3+ Sessions

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Ed has learned this form!                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  I've watched 3 people complete this form. I can now:      │
│                                                             │
│  ✅ Guide new users through it step by step                 │
│  ✅ Explain what each field means                          │
│  ✅ Warn about common mistakes                              │
│  ✅ Suggest where to find information                       │
│                                                             │
│  Would you like me to create an automation skill?          │
│                                                             │
│  [Create Skill] [Keep Learning] [Not now]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Skill Generation

When Ed has learned enough, it generates:

```json
{
  "skill_id": "learned_hse_riddor_2025",
  "name": "RIDDOR Injury Reporting (Learned)",
  "confidence": 85,
  "learned_from": 3,
  "template": {
    "url": "https://notifications.hse.gov.uk/riddorforms/Injury",
    "fields": [
      {
        "selector": "[name*='date']",
        "label": "Date of Incident",
        "type": "date",
        "required": true,
        "meaning": "The date the incident actually occurred",
        "data_source": "user_input",
        "help": "Use the date the incident happened, not when you're reporting it"
      },
      {
        "selector": "[name*='incident']",
        "label": "Type of Incident",
        "type": "select",
        "required": true,
        "options": ["Injury", "Death", "Dangerous occurrence"],
        "meaning": "Category of the RIDDOR reportable incident",
        "help": "Choose the most appropriate category"
      }
    ],
    "validation": {
      "min_confidence": 80,
      "require_human_review": true
    }
  }
}
```

---

## Implementation Order

| Step | What | Est. Time |
|------|------|-----------|
| 1. | Browser extension observer | 2 days |
| 2. | Privacy filter and sanitization | 1 day |
| 3. | Database tables and API | 1 day |
| 4. | Chat clarification flow | 2 days |
| 5. | Skill generation from observations | 2 days |
| 6. | UI for learning mode | 2 days |

**Total: ~10 days**

---

## Privacy Guarantees

1. **No personal values stored** - Only hashes or types
2. **Users see what's captured** - Transparent observation
3. **Can delete any observation** - User control
4. **One-way hashing** - Can't reverse to original data
5. **Separation of concerns** - Structure in DB, values stay local

---

## Example: RIDDOR Form Learning

**Session 1:** User fills RIDDOR form
- Ed observes 15 fields, asks 8 questions
- Stores selectors, labels, types
- User explains: "This date is when it happened, not when reported"

**Session 2:** Different user fills same form
- Ed confirms previous observations
- Notices new field: "Fatal incident - phone required"
- Asks for clarification on severity field

**Session 3:** Third user fills form
- Ed builds confidence
- Identifies common mistake: "Users put report date instead of incident date"
- Generates help text for that field

**After Session 3:** Ed creates skill
- Can now guide new users
- Knows where users get stuck
- Has validation rules learned from errors
- Ready for automation (with review)
