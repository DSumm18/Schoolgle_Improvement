/**
 * PII (Personally Identifiable Information) Masking Utility
 *
 * Detects and masks common UK PII patterns in text before sending to AI providers.
 * This is a best-effort filter using regex patterns, not a full NLP system.
 *
 * GDPR Context: Under UK GDPR (Article 5(1)(c) - data minimisation), we should
 * avoid sending personal data to third-party AI providers where possible. This
 * utility strips identifiable information from text before it leaves our system,
 * replacing it with numbered placeholders that can be re-inserted afterwards.
 *
 * Usage:
 *   const { maskedText, maskMap } = maskPII(rawText);
 *   const aiResponse = await callAI(maskedText);
 *   const finalResponse = unmaskPII(aiResponse, maskMap);
 */

export interface MaskResult {
  /** The text with PII replaced by numbered placeholders */
  maskedText: string;
  /** Map from placeholder (e.g. "[EMAIL_1]") to the original value */
  maskMap: Map<string, string>;
  /** Total number of PII items masked */
  maskCount: number;
}

export interface MaskOptions {
  /**
   * PII categories to skip (leave unmasked).
   * e.g. ["PERSON"] to preserve names for SENCO/headteacher checks.
   * Valid categories: EMAIL, NI_NUMBER, DOB, PHONE, PERSON, POSTCODE
   */
  skipCategories?: string[];
}

interface PatternDef {
  category: string;
  pattern: RegExp;
  /** If set, only the named capture group "pii" is masked, rest is preserved */
  captureGroup?: boolean;
}

/**
 * Ordered list of PII patterns to detect. Order matters: more specific patterns
 * (e.g. NI numbers) should come before more general ones (e.g. postcodes) to
 * avoid partial matches.
 */
const PII_PATTERNS: PatternDef[] = [
  // Email addresses
  {
    category: "EMAIL",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },

  // UK National Insurance numbers: two letters, six digits, one letter (e.g. AB123456C)
  {
    category: "NI_NUMBER",
    pattern: /\b[A-Za-z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-Da-d]\b/g,
  },

  // Dates of birth with explicit prefix (DOB, date of birth, born, d.o.b)
  {
    category: "DOB",
    pattern:
      /(?:DOB|D\.O\.B|date of birth|born)[:\s]+(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/gi,
    captureGroup: true,
  },

  // UK phone numbers: mobile (07xxx), landline (01xxx, 02xxx, 03xxx), international (+44)
  {
    category: "PHONE",
    pattern:
      /(?:\+44\s?(?:\(0\))?\s?|0)(?:7\d{3}|\d{3,4})[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g,
  },

  // Person names after role/title prefixes
  // Captures 1-3 capitalised words following the prefix
  {
    category: "PERSON",
    pattern:
      /(?:Headteacher|Head\s*Teacher|Principal|Deputy|Deputy\s*Head|Chair of Governors|SENCO|DSL|Bursar|Mr|Mrs|Ms|Miss|Dr|Prof)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g,
    captureGroup: true,
  },

  // UK postcodes (e.g. SW1A 1AA, M1 1AA, B33 8TH)
  // Placed last as postcode-like patterns can appear in other contexts
  {
    category: "POSTCODE",
    pattern: /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi,
  },
];

/**
 * Mask PII in the given text, replacing detected personal information with
 * numbered placeholders like [EMAIL_1], [PHONE_2], etc.
 *
 * The masking is conservative: it may occasionally mask non-PII text that
 * matches a pattern (e.g. a postcode-shaped product code), which is preferable
 * to leaking real personal data.
 *
 * @param text - The raw text that may contain PII
 * @returns MaskResult with the masked text, a map for re-insertion, and a count
 */
export function maskPII(text: string, options?: MaskOptions): MaskResult {
  const skipCategories = new Set(
    (options?.skipCategories ?? []).map((c) => c.toUpperCase()),
  );
  const maskMap = new Map<string, string>();
  const counters = new Map<string, number>();
  let maskedText = text;

  for (const { category, pattern, captureGroup } of PII_PATTERNS) {
    // Skip categories the caller wants to preserve
    if (skipCategories.has(category)) continue;

    // Reset the regex lastIndex for global patterns
    pattern.lastIndex = 0;

    // Collect all matches first to avoid mutation issues during replacement
    const matches: Array<{ full: string; pii: string; index: number }> = [];
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(maskedText)) !== null) {
      const pii = captureGroup && match[1] ? match[1] : match[0];
      matches.push({ full: match[0], pii, index: match.index });
    }

    // Replace in reverse order to preserve indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const { full, pii } = matches[i];

      // Skip if this text was already masked by a previous pattern
      if (pii.includes("[") && pii.includes("]")) {
        continue;
      }

      // Deduplicate: if we already masked this exact value, reuse the placeholder
      let placeholder: string | undefined;
      for (const [key, value] of maskMap.entries()) {
        if (value === pii) {
          placeholder = key;
          break;
        }
      }

      if (!placeholder) {
        const count = (counters.get(category) ?? 0) + 1;
        counters.set(category, count);
        placeholder = `[${category}_${count}]`;
        maskMap.set(placeholder, pii);
      }

      if (captureGroup) {
        // Only replace the PII portion, keeping the prefix intact
        const replacement = full.replace(pii, placeholder);
        maskedText = maskedText.replace(full, replacement);
      } else {
        maskedText = maskedText.replace(full, placeholder);
      }
    }
  }

  return {
    maskedText,
    maskMap,
    maskCount: maskMap.size,
  };
}

/**
 * Re-insert original PII values into text that was previously masked.
 *
 * Use this to restore personal information in AI responses before displaying
 * them to authorised users.
 *
 * @param maskedText - Text containing placeholders like [EMAIL_1]
 * @param maskMap - The map returned by maskPII() mapping placeholders to originals
 * @returns The text with all placeholders replaced by their original values
 */
export function unmaskPII(
  maskedText: string,
  maskMap: Map<string, string>,
): string {
  let result = maskedText;

  for (const [placeholder, original] of maskMap.entries()) {
    // Replace all occurrences of this placeholder
    const escaped = placeholder.replace(/[[\]]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "g"), original);
  }

  return result;
}
