/**
 * Voice-to-Form Adapter
 *
 * Intelligently converts spoken input to properly formatted form field values.
 * Handles emails, dates, dropdowns, phone numbers, postcodes, etc.
 */

// ============================================================================
// Types
// ============================================================================

interface ProcessResult {
  value: string;
  confidence: number;
  needsConfirmation: boolean;
  alternatives?: string[];
  error?: string;
}

interface FieldHandler {
  parse(input: string, field?: HTMLElement): ProcessResult | Promise<ProcessResult>;
}

interface DateParts {
  day: number;
  month: number;
  year: number;
}

// ============================================================================
// Email Handler
// ============================================================================

class EmailFieldHandler implements FieldHandler {
  async parse(input: string): Promise<ProcessResult> {
    let email = input.toLowerCase().trim();

    // Remove common filler words
    email = email
      .replace(/^(my email is|email address is|it's|its)\s*/i, '')
      .replace(/^(i said|i think|it is)\s*/i, '')
      .trim();

    // Track if we need confirmation
    let needsConfirmation = false;
    let alternatives: string[] = [];

    // 1. Common substitutions
    const substitutions = [
      { pattern: /\bat\b/g, replacement: '@' },
      { pattern: /\bdot\b/g, replacement: '.' },
      { pattern: /\[at\]/g, replacement: '@' },
      { pattern: /\(at\)/g, replacement: '@' },
      { pattern: /\bat symbol\b/g, replacement: '@' },
      { pattern: /\s+/g, replacement: '' },  // Remove all spaces
    ];

    let beforeSubs = email;
    for (const sub of substitutions) {
      email = email.replace(sub.pattern, sub.replacement);
    }

    // Check if we made significant changes
    if (beforeSubs !== email) {
      needsConfirmation = true;
    }

    // 2. Handle "underscore" spoken as "underscore"
    email = email.replace(/underscore/g, '_');

    // 3. Smart TLD completion
    if (!email.includes('.') || !email.split('@')[1]?.includes('.')) {
      const domain = email.split('@')[1] || '';

      if (domain === 'gmail' || domain === 'googlemail') {
        email = email.includes('@') ? email : `${email}@`;
        email += '.com';
        alternatives = [email, `${email.replace('.com', '.co.uk')}`];
      } else if (domain === 'school' || domain === 'sch') {
        // For UK schools, try common patterns
        const localPart = email.split('@')[0];
        email = `${localPart}@school.co.uk`;
        alternatives = [
          `${localPart}@school.co.uk`,
          `${localPart}@school.com`,
          `${localPart}@sch.uk`,
        ];
        needsConfirmation = true;
      } else {
        // Default to .co.uk for UK context
        if (email.includes('@')) {
          email += '.co.uk';
          alternatives = [
            email.replace('.co.uk', '.com'),
            email.replace('.co.uk', '.uk'),
          ];
        }
        needsConfirmation = true;
      }
    }

    // 4. Handle "dot co dot uk" → ".co.uk"
    email = email
      .replace(/\.co\s*\.uk/g, '.co.uk')
      .replace(/\.co\s*dot\s*uk/gi, '.co.uk')
      .replace(/dot\s*co\s*dot\s*uk/gi, '.co.uk');

    // 5. Validate format
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailRegex.test(email)) {
      return {
        value: '',
        confidence: 0,
        needsConfirmation: true,
        error: `Could not parse email from "${input}". Please spell it out letter by letter.`,
      };
    }

    // 6. Confidence scoring
    let confidence = 95;
    if (needsConfirmation) confidence = 70;
    if (input.includes(' at ') || input.includes(' dot ')) confidence = 85;

    return {
      value: email,
      confidence,
      needsConfirmation,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    };
  }
}

// ============================================================================
// Select/Dropdown Handler
// ============================================================================

class SelectFieldHandler implements FieldHandler {
  async parse(input: string, field?: HTMLElement): Promise<ProcessResult> {
    const options = this.getOptions(field);

    // 1. Exact match (case insensitive)
    const exactMatch = options.find(
      o => o.toLowerCase().trim() === input.toLowerCase().trim()
    );
    if (exactMatch) {
      return {
        value: exactMatch,
        confidence: 100,
        needsConfirmation: false,
      };
    }

    // 2. Partial match
    const inputLower = input.toLowerCase();
    const partialMatch = options.find(
      o => o.toLowerCase().includes(inputLower) ||
           inputLower.includes(o.toLowerCase())
    );
    if (partialMatch) {
      return {
        value: partialMatch,
        confidence: 80,
        needsConfirmation: true,
        alternatives: options.filter(o => o.toLowerCase().includes(inputLower)),
      };
    }

    // 3. Fuzzy match using Levenshtein distance
    const fuzzyResult = this.fuzzyMatch(input, options);
    if (fuzzyResult && fuzzyResult.score <= 3) {
      return {
        value: fuzzyResult.option,
        confidence: Math.max(50, 100 - fuzzyResult.score * 15),
        needsConfirmation: true,
        alternatives: fuzzyResult.alternatives,
      };
    }

    // 4. No match found
    return {
      value: '',
      confidence: 0,
      needsConfirmation: true,
      error: `Could not match "${input}" to any option. Please choose from: ${options.join(', ')}`,
      alternatives: options.slice(0, 5), // Show first 5 options
    };
  }

  private getOptions(field?: HTMLElement): string[] {
    if (!field || field.tagName !== 'SELECT') {
      return [];
    }

    return Array.from((field as HTMLSelectElement).options)
      .map(opt => opt.text)
      .filter(text => text && text !== 'Select...' && text !== 'Choose...');
  }

  private fuzzyMatch(input: string, options: string[]): {
    option: string;
    score: number;
    alternatives?: string[];
  } | null {
    const inputLower = input.toLowerCase();
    const scores = options
      .map(option => ({
        option,
        score: this.levenshteinDistance(inputLower, option.toLowerCase()),
      }))
      .sort((a, b) => a.score - b.score);

    const best = scores[0];
    if (!best) return null;

    // Return top 3 alternatives
    const alternatives = scores.slice(0, 3).map(s => s.option);

    return {
      option: best.option,
      score: best.score,
      alternatives: alternatives.length > 1 ? alternatives : undefined,
    };
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}

// ============================================================================
// Date Handler
// ============================================================================

class DateFieldHandler implements FieldHandler {
  async parse(input: string, field?: HTMLElement): Promise<ProcessResult> {
    try {
      const date = this.parseSpokenDate(input);
      const format = this.detectFormat(field);
      const formatted = this.formatDate(date, format);

      return {
        value: formatted,
        confidence: input.includes('today') || input.includes('yesterday') ? 95 : 85,
        needsConfirmation: format === 'unknown',
        alternatives: this.generateAlternativeFormats(date),
      };
    } catch (error) {
      return {
        value: '',
        confidence: 0,
        needsConfirmation: true,
        error: `Could not parse date: "${input}". Please try "DD/MM/YYYY" format.`,
      };
    }
  }

  private parseSpokenDate(input: string): DateParts {
    const today = new Date();
    const currentYear = today.getFullYear();

    // 1. Relative dates
    if (/^today$/i.test(input.trim())) {
      return {
        day: today.getDate(),
        month: today.getMonth() + 1,
        year: currentYear,
      };
    }

    if (/^yesterday$/i.test(input.trim())) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        day: yesterday.getDate(),
        month: yesterday.getMonth() + 1,
        year: yesterday.getFullYear(),
      };
    }

    // 2. Ordinal format: "20th of February 2025" or "20th February 2025"
    const ordinalMatch = input.match(
      /(\d{1,2})(?:st|nd|rd|th)?(?:\s+(?:of\s+)?|,\s*)(\w+)\s+(\d{4})/i
    );
    if (ordinalMatch) {
      return {
        day: parseInt(ordinalMatch[1]),
        month: this.monthNameToNumber(ordinalMatch[2]),
        year: parseInt(ordinalMatch[3]),
      };
    }

    // 3. Month-first: "February 20th, 2025"
    const monthFirstMatch = input.match(
      /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i
    );
    if (monthFirstMatch) {
      return {
        day: parseInt(monthFirstMatch[2]),
        month: this.monthNameToNumber(monthFirstMatch[1]),
        year: parseInt(monthFirstMatch[3]),
      };
    }

    // 4. Numeric formats: "20/02/2025", "20-02-2025", "20.02.2025"
    const numericMatch = input.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (numericMatch) {
      let day = parseInt(numericMatch[1]);
      let month = parseInt(numericMatch[2]);
      let year = parseInt(numericMatch[3]);

      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      // UK context: assume DD/MM for ambiguous dates
      // If first number > 12, it must be day
      if (day > 12 && month <= 12) {
        // Already in DD/MM format
      } else if (month > 12 && day <= 12) {
        // Swap to DD/MM
        [day, month] = [month, day];
      }

      return { day, month, year };
    }

    // 5. "Next Monday", "Last Tuesday"
    const weekdayMatch = input.match(/(next|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (weekdayMatch) {
      const direction = weekdayMatch[1].toLowerCase();
      const weekday = this.weekdayNameToNumber(weekdayMatch[2]);
      const targetDate = this.getRelativeWeekday(weekday, direction === 'next');
      return {
        day: targetDate.getDate(),
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
      };
    }

    throw new Error(`Could not parse date: ${input}`);
  }

  private detectFormat(field?: HTMLElement): string {
    if (!field) return 'DD/MM/YYYY'; // UK default

    // Check placeholder
    const placeholder = field.getAttribute('placeholder') || '';
    if (placeholder.includes('DD/MM/YYYY')) return 'DD/MM/YYYY';
    if (placeholder.includes('DD-MM-YYYY')) return 'DD-MM-YYYY';
    if (placeholder.includes('YYYY-MM-DD')) return 'YYYY-MM-DD';
    if (placeholder.includes('MM/DD/YYYY')) return 'MM/DD/YYYY';

    // Check name/ID
    const name = (field.getAttribute('name') || '').toLowerCase();
    if (name.includes('dob') || name.includes('birth')) return 'DD/MM/YYYY';

    // Default UK format
    return 'DD/MM/YYYY';
  }

  private formatDate(date: DateParts, format: string): string {
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

  private generateAlternativeFormats(date: DateParts): string[] {
    const dd = String(date.day).padStart(2, '0');
    const mm = String(date.month).padStart(2, '0');
    const yyyy = String(date.year);

    return [
      `${dd}/${mm}/${yyyy}`,
      `${dd}-${mm}-${yyyy}`,
      `${yyyy}-${mm}-${dd}`,
    ];
  }

  private monthNameToNumber(name: string): number {
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

  private weekdayNameToNumber(name: string): number {
    const days: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return days[name.toLowerCase()] || 1;
  }

  private getRelativeWeekday(weekday: number, next: boolean): Date {
    const date = new Date();
    const currentDay = date.getDay();
    const diff = weekday - currentDay;

    if (next) {
      date.setDate(date.getDate() + (diff >= 0 ? diff : diff + 7));
    } else {
      date.setDate(date.getDate() + (diff <= 0 ? diff : diff - 7));
    }

    return date;
  }
}

// ============================================================================
// Phone Number Handler
// ============================================================================

class PhoneFieldHandler implements FieldHandler {
  async parse(input: string): Promise<ProcessResult> {
    // Remove common filler words
    let phone = input
      .replace(/^(my phone number is|my number is|phone is|number is)\s*/i, '')
      .replace(/^(zero|oh)/gi, '0')
      .replace(/\s+/g, '') // Remove spaces first
      .toLowerCase();

    // Handle "double", "triple" repetitions
    phone = phone
      .replace(/double(\d)/g, '$1$1')
      .replace(/triple(\d)/g, '$1$1$1')
      .replace(/treble(\d)/g, '$1$1$1');

    // Handle "oh seven seven" → "077"
    phone = phone.replace(/oh/g, '0');

    // Convert number words
    const numberWords: Record<string, string> = {
      'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8',
      'nine': '9', 'zero': '0',
    };

    for (const [word, digit] of Object.entries(numberWords)) {
      phone = phone.replace(new RegExp(word, 'g'), digit);
    }

    // UK phone number formatting
    // Mobile: 07XXX XXXXXX or +44 7XXX XXXXXX
    // Landline: 01XXX XXXXXX or 02XXX XXXXXX

    // Remove any leading +44 and replace with 0
    phone = phone.replace(/^\+44/, '0');

    // Format: 07700 900461
    if (/^0[1-9]\d{8,9}$/.test(phone)) {
      // Add space for readability
      if (phone.startsWith('07') || phone.startsWith('08')) {
        phone = phone.replace(/^(\d{5})(\d+)$/, '$1 $2');
      } else {
        phone = phone.replace(/^(\d{3})(\d+)$/, '$1 $2');
        phone = phone.replace(/^(\d{4})(\d+)$/, '$1 $2');
      }

      return {
        value: phone,
        confidence: 90,
        needsConfirmation: phone.length !== 11, // May be incomplete
      };
    }

    // Might be incomplete - return as-is for confirmation
    return {
      value: phone,
      confidence: 50,
      needsConfirmation: true,
      error: 'Phone number may be incomplete. Please confirm.',
    };
  }
}

// ============================================================================
// Postcode Handler
// ============================================================================

class PostcodeFieldHandler implements FieldHandler {
  async parse(input: string): Promise<ProcessResult> {
    // Remove filler words
    let postcode = input
      .replace(/^(my postcode is|postcode is|it's)\s*/i, '')
      .toUpperCase()
      .trim();

    // Handle phonetic alphabet
    const phoneticMap: Record<string, string> = {
      'alpha': 'A', 'bravo': 'B', 'charlie': 'C', 'delta': 'D',
      'echo': 'E', 'foxtrot': 'F', 'golf': 'G', 'hotel': 'H',
      'india': 'I', 'juliet': 'J', 'kilo': 'K', 'lima': 'L',
      'mike': 'M', 'november': 'N', 'oscar': 'O', 'papa': 'P',
      'quebec': 'Q', 'romeo': 'R', 'sierra': 'S', 'tango': 'T',
      'uniform': 'U', 'victor': 'V', 'whiskey': 'W', 'x-ray': 'X',
      'yankee': 'Y', 'zulu': 'Z',
    };

    for (const [word, letter] of Object.entries(phoneticMap)) {
      postcode = postcode.replace(new RegExp(word, 'gi'), letter);
    }

    // Remove spaces and special characters
    postcode = postcode.replace(/[^A-Z0-9]/g, '');

    // Format UK postcode: LS1 3AB, SW1A 1AA, etc.
    // Pattern: 1-2 letters, 1-2 digits, space, digit, 2 letters
    const ukPostcodeRegex = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})$/;

    if (ukPostcodeRegex.test(postcode)) {
      // Add space in correct position
      const match = postcode.match(ukPostcodeRegex);
      if (match) {
        postcode = `${match[1]} ${match[2]}`;
      }

      return {
        value: postcode,
        confidence: 95,
        needsConfirmation: false,
      };
    }

    // Try to add space in common position
    if (postcode.length >= 5 && postcode.length <= 7) {
      const inward = postcode.slice(-3);
      const outward = postcode.slice(0, -3);
      postcode = `${outward} ${inward}`;

      return {
        value: postcode,
        confidence: 70,
        needsConfirmation: true,
      };
    }

    return {
      value: postcode,
      confidence: 30,
      needsConfirmation: true,
      error: `Could not format postcode from "${input}". Please try again.`,
    };
  }
}

// ============================================================================
// Main Adapter
// ============================================================================

export class VoiceFormAdapter {
  private handlers = new Map<string, FieldHandler>();

  constructor() {
    this.handlers.set('email', new EmailFieldHandler());
    this.handlers.set('select', new SelectFieldHandler());
    this.handlers.set('select-one', new SelectFieldHandler());
    this.handlers.set('date', new DateFieldHandler());
    this.handlers.set('tel', new PhoneFieldHandler());
    this.handlers.set('phone', new PhoneFieldHandler());
    this.handlers.set('postcode', new PostcodeFieldHandler());
  }

  async processVoiceInput(
    field: HTMLElement,
    spokenText: string
  ): Promise<ProcessResult> {
    const fieldType = this.detectFieldType(field);
    const handler = this.handlers.get(fieldType);

    if (!handler) {
      // Default: just use the spoken text as-is
      return {
        value: spokenText,
        confidence: 50,
        needsConfirmation: true,
      };
    }

    return await handler.parse(spokenText, field);
  }

  private detectFieldType(field: HTMLElement): string {
    // Check type attribute
    const type = field.getAttribute('type');
    if (type && type !== 'text') return type;

    // Check for select
    if (field.tagName === 'SELECT') return 'select';

    // Check for textarea
    if (field.tagName === 'TEXTAREA') return 'textarea';

    // Try to infer from name/placeholder/id
    const name = (field.getAttribute('name') || '').toLowerCase();
    const placeholder = (field.getAttribute('placeholder') || '').toLowerCase();
    const id = (field.id || '').toLowerCase();
    const combined = `${name} ${placeholder} ${id}`;

    if (combined.includes('email') || combined.includes('e-mail')) return 'email';
    if (combined.includes('phone') || combined.includes('tel') || combined.includes('mobile')) return 'tel';
    if (combined.includes('date') || combined.includes('dob') || combined.includes('birth')) return 'date';
    if (combined.includes('postcode') || combined.includes('post code') || combined.includes('zip')) return 'postcode';
    if (combined.includes('amount') || combined.includes('price') || combined.includes('cost')) return 'number';

    return 'text';
  }
}

// ============================================================================
// Export
// ============================================================================

export function getVoiceFormAdapter(): VoiceFormAdapter {
  return new VoiceFormAdapter();
}
