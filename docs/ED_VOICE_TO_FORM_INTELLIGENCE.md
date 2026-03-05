# Ed Voice-to-Form Intelligence

## The Problem

Voice-to-text often gets things wrong in form contexts:
- **Emails**: "at symbol" → `@`, "dot com" → `.com`
- **Dropdowns**: User says an option, not realizing it needs selection
- **Dates**: "20th of February 2025" → needs to match form's expected format
- **Numbers**: "One two three" → `123` or `one two three`?
- **Postcodes**: "LS1 3AB" → might need spaces, might not

## The Solution

Ed acts as an **intelligent adapter** between voice input and form requirements.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  User Speaks                                                    │
│  "My email is john at school dot co dot uk"                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Voice-to-Text (Browser/Speech API)                             │
│  "My email is john at school dot co dot uk"                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ed Form Intelligence Layer                                     │
│  - Detects field type (email, dropdown, date, etc.)            │
│  - Parses spoken language for that field type                  │
│  - Validates against form requirements                         │
│  - Asks clarifying questions when needed                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Form Field Value                                               │
│  john@school.co.uk                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Field Type Handlers

### 1. Email Handler

**Spoken Patterns Recognized:**
```
"john at school dot co dot uk"     → john@school.co.uk
"john at gmail dot com"            → john@gmail.com
"john underscore 2025 at outlook"  → john_2025@outlook.com
"john dot smith at school"         → john.smith@school.co.uk (assumes)
"my email is john [at] school"     → john@school.co.uk
```

**Handler Logic:**
```typescript
interface EmailFieldHandler {
  field: {
    selector: string;
    type: 'email';
    pattern?: string;
  };

  parse(spokenInput: string): string {
    // 1. Common substitutions
    let email = spokenInput
      .replace(/\bat\b/gi, '@')
      .replace(/\bdot\b/gi, '.')
      .replace(/\s+/g, '')          // Remove spaces
      .replace(/\[at\]/gi, '@')
      .replace(/\(at\)/gi, '@')
      .replace(/round/gi, '');

    // 2. Smart TLD completion
    if (!email.includes('.')) {
      email += '.co.uk';  // Assume for UK schools
    }

    // 3. Validate format
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      throw new Error('Could not parse email. Please spell it out.');
    }

    return email;
  }

  confirm(parsed: string, original: string): string {
    return `I heard "${original}". Did you mean: ${parsed}?`;
  }
}
```

---

### 2. Dropdown/Select Handler

**The Challenge:** User says "I'm a teacher" but the form has a dropdown with:
- Teaching Staff
- Support Staff
- Leadership
- Governor

**Solution:** Ed matches spoken input to closest option

```typescript
interface SelectFieldHandler {
  field: {
    selector: string;
    type: 'select';
    options: string[];
  };

  parse(spokenInput: string, options: string[]): string {
    // 1. Exact match
    const exactMatch = options.find(o =>
      o.toLowerCase() === spokenInput.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // 2. Partial match
    const partialMatch = options.find(o =>
      o.toLowerCase().includes(spokenInput.toLowerCase()) ||
      spokenInput.toLowerCase().includes(o.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    // 3. Fuzzy match (Levenshtein distance)
    const fuzzyMatch = this.fuzzyMatch(spokenInput, options);
    if (fuzzyMatch) return fuzzyMatch;

    // 4. Ask user to clarify
    throw new Error(
      `I couldn't match "${spokenInput}" to any option. ` +
      `Please choose from: ${options.join(', ')}`
    );
  }

  fuzzyMatch(input: string, options: string[]): string | null {
    const inputLower = input.toLowerCase();
    const scores = options.map(option => ({
      option,
      score: levenshteinDistance(inputLower, option.toLowerCase()),
    }));

    const best = scores.sort((a, b) => a.score - b.score)[0];

    // Only match if reasonably close (within 3 edits)
    if (best.score <= 3) {
      return best.option;
    }

    return null;
  }

  confirm(matched: string, original: string): string {
    return `I heard "${original}". The closest option is "${matched}". Is that correct?`;
  }
}
```

---

### 3. Date Handler

**The Challenge:** User says "20th of February 2025" but form expects:
- DD/MM/YYYY
- DD-MM-YYYY
- YYYY-MM-DD
- Or separate fields (day, month, year)

**Solution:** Detect form format, parse spoken date, convert

```typescript
interface DateFieldHandler {
  field: {
    selector: string;
    type: 'date';
    format?: 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'separate';
  };

  parse(spokenInput: string): string {
    // 1. Parse spoken date using NER or patterns
    const date = this.parseSpokenDate(spokenInput);
    // => { day: 20, month: 2, year: 2025 }

    // 2. Detect form format from placeholder or validation
    const format = this.detectFormat(this.field);

    // 3. Format accordingly
    return this.formatDate(date, format);
  }

  parseSpokenDate(input: string): DateParts {
    const today = new Date();

    // Relative dates
    if (/today/i.test(input)) {
      return {
        day: today.getDate(),
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      };
    }

    if (/yesterday/i.test(input)) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        day: yesterday.getDate(),
        month: yesterday.getMonth() + 1,
        year: yesterday.getFullYear(),
      };
    }

    // "20th of February 2025"
    const ordinalMatch = input.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)\s+(\d{4})/i);
    if (ordinalMatch) {
      return {
        day: parseInt(ordinalMatch[1]),
        month: this.monthNameToNumber(ordinalMatch[2]),
        year: parseInt(ordinalMatch[3]),
      };
    }

    // "February 20th 2025"
    const monthFirstMatch = input.match(/(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
    if (monthFirstMatch) {
      return {
        day: parseInt(monthFirstMatch[2]),
        month: this.monthNameToNumber(monthFirstMatch[1]),
        year: parseInt(monthFirstMatch[3]),
      };
    }

    // "20/02/2025" or "20-02-2025"
    const numericMatch = input.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
    if (numericMatch) {
      let day = parseInt(numericMatch[1]);
      let month = parseInt(numericMatch[2]);
      let year = parseInt(numericMatch[3]);

      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      // Ambiguous: is 20/02 American or British format?
      // Context: UK schools = DD/MM
      return { day, month, year };
    }

    throw new Error(`Could not parse date: "${input}"`);
  }

  formatDate(date: DateParts, format: string): string {
    const dd = String(date.day).padStart(2, '0');
    const mm = String(date.month).padStart(2, '0');
    const yyyy = String(date.year);

    switch (format) {
      case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`;
      case 'DD-MM-YYYY': return `${dd}-${mm}-${yyyy}`;
      case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`;
      case 'MM/DD/YYYY': return `${mm}/${dd}/${yyyy}`;
      default: return `${dd}/${mm}/${yyyy}`;
    }
  }

  monthNameToNumber(name: string): number {
    const months: Record<string, number> = {
      january: 1, jan: 1,
      february: 2, feb: 2,
      march: 3, mar: 3,
      april: 4, apr: 4,
      may: 5,
      june: 6, jun: 6,
      july: 7, jul: 7,
      august: 8, aug: 8,
      september: 9, sep: 9, sept: 9,
      october: 10, oct: 10,
      november: 11, nov: 11,
      december: 12, dec: 12,
    };
    return months[name.toLowerCase()] || 1;
  }
}
```

---

### 4. Number Handlers

**Phone Numbers:**
```
"zero seven seven zero zero nine zero zero four six one"
  → 07700900461

"triple seven 123 4567"
  → 07771234567 (assuming mobile prefix)

"oh double-seven oh..."
  → 0770...
```

**Postcodes:**
```
"L S one three A B"
  → LS1 3AB

"L-S-1-3AB"
  → LS1 3AB

"Leeds one three alpha bravo"
  → LS1 3AB (military phonetic alphabet!)
```

---

## Clarification Flow

When Ed isn't sure, it asks:

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Ed                                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  I heard: "john at school dot uk"                          │
│                                                             │
│  Did you mean:                                              │
│  ○ john@school.co.uk                                       │
│  ○ john@school.uk                                          │
│  ○ john@school.com                                         │
│  ○ Let me type something else                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Form Format Detection

Ed analyzes the form to determine expected formats:

```typescript
interface FormFormatDetector {
  detectFormat(field: HTMLElement): FieldFormat {
    // Check placeholder
    const placeholder = field.getAttribute('placeholder');
    if (placeholder === 'DD/MM/YYYY') return 'date:uk';
    if (placeholder === 'example@email.com') return 'email';

    // Check name/id
    const name = field.getAttribute('name') || '';
    if (name.includes('dob')) return 'date:uk';

    // Check existing validation
    const pattern = field.getAttribute('pattern');
    if (pattern) return this.parsePattern(pattern);

    // Check for select/options
    if (field.tagName === 'SELECT') {
      return 'select:' + Array.from(field.options)
        .map(o => o.value)
        .join(',');
    }

    return 'text';
  }
}
```

---

## Confidence Scoring

Ed assigns confidence to each parse:

```typescript
interface ParseResult {
  value: string;
  confidence: number;  // 0-100
  needsConfirmation: boolean;
  alternatives?: string[];
}

// Examples:
{
  value: 'john@school.co.uk',
  confidence: 95,
  needsConfirmation: false,
}

{
  value: 'LS1 3AB',
  confidence: 60,
  needsConfirmation: true,
  alternatives: ['LS13AB', 'LS1 3AB', 'LS1-3AB'],
}
```

---

## Implementation

### Browser Extension Component

```typescript
// packages/ed-extension/src/content/voice-form-adapter.ts

export class VoiceFormAdapter {
  private handlers = new Map<string, FieldHandler>();

  constructor() {
    this.handlers.set('email', new EmailFieldHandler());
    this.handlers.set('select', new SelectFieldHandler());
    this.handlers.set('date', new DateFieldHandler());
    this.handlers.set('tel', new PhoneFieldHandler());
    this.handlers.set('number', new NumberFieldHandler());
  }

  async processVoiceInput(
    field: HTMLElement,
    spokenText: string
  ): Promise<ProcessResult> {

    // 1. Detect field type
    const fieldType = this.detectFieldType(field);

    // 2. Get appropriate handler
    const handler = this.handlers.get(fieldType);

    if (!handler) {
      // Default: just use the spoken text
      return {
        value: spokenText,
        confidence: 50,
        needsConfirmation: true,
      };
    }

    // 3. Parse with handler
    try {
      const result = await handler.parse(spokenText, field);
      return result;
    } catch (error) {
      return {
        value: '',
        confidence: 0,
        error: error.message,
        needsConfirmation: true,
      };
    }
  }

  private detectFieldType(field: HTMLElement): string {
    // Check type attribute
    const type = field.getAttribute('type');
    if (type && type !== 'text') return type;

    // Check for select
    if (field.tagName === 'SELECT') return 'select';

    // Check for textarea
    if (field.tagName === 'TEXTAREA') return 'textarea';

    // Try to infer from name/placeholder
    const name = (field.getAttribute('name') || '').toLowerCase();
    const placeholder = (field.getAttribute('placeholder') || '').toLowerCase();

    if (name.includes('email') || placeholder.includes('email')) return 'email';
    if (name.includes('phone') || name.includes('tel')) return 'tel';
    if (name.includes('date') || name.includes('dob')) return 'date';
    if (name.includes('postcode') || placeholder.includes('postcode')) return 'postcode';
    if (name.includes('amount') || name.includes('price')) return 'currency';

    return 'text';
  }
}
```

---

## User Experience

### Good Case (High Confidence)

```
User: "My email is john at school dot co dot uk"
Ed: [Fills john@school.co.uk]
Ed: ✓ Filled correctly
```

### Ambiguous Case (Medium Confidence)

```
User: "My email is john at school"
Ed: I heard "john at school". Did you mean:
User: [Selects john@school.co.uk]
Ed: ✓ Got it, john@school.co.uk
```

### Fallback Case (Low Confidence)

```
User: "The postcode is L S one three A B"
Ed: I heard "LS1 3AB". Is that right?
User: Yes
Ed: ✓ Confirmed LS1 3AB
```

---

## Error Recovery

When voice-to-text gets it wrong:

```
User: "My email is john at teacher dot mail"
Ed (hears): "john at teacher dot mail"
Ed: That doesn't look like a valid email.
Ed: Could you spell it out letter by letter?
User: "J O H N at T E A C H E R dot M A I L"
Ed: [Fills john@teacher.mail]
```

---

## Accessibility

For users who prefer typing over voice:

```
Ed: I can also help you type this faster.
Ed: Would you like me to:
Ed: • Continue with voice
Ed: • Switch to typing
Ed: • Use a combination (voice for long text, typing for emails/dates)
```

---

## Summary

| Field Type | Challenges | Ed's Solution |
|------------|------------|---------------|
| **Email** | "at" → @, "dot" → . | Pattern matching, TLD completion |
| **Select/Dropdown** | User doesn't know options | Fuzzy matching, ask for clarification |
| **Date** | Format variations (DD/MM vs MM/DD) | Detect form format, convert |
| **Phone** | "zero" vs "oh", spacing | Number normalization |
| **Postcode** | Phonetic alphabet, spacing | UK postcode pattern matching |
| **Numbers** | "one" vs 1, "double" | Natural language number parsing |
