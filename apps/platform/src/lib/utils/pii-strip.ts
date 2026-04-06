/**
 * PII Stripping Utility
 *
 * Best-effort heuristic removal of personally identifiable information
 * from text before storing in ed_feedback table.
 *
 * NOT a guarantee — logs a warning if potential PII patterns detected
 * that couldn't be confidently stripped.
 */

// UK phone patterns: 07xxx, 01xxx, 02xxx, +44, etc.
const UK_PHONE_REGEX =
  /(?:\+44\s?|0)(?:\d\s?){9,10}\b/g;

// Email addresses
const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// UK postcodes: AB1 2CD, AB12 3CD
const POSTCODE_REGEX =
  /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi;

// "My name is X" / "I'm X" / "I am X" patterns
const NAME_INTRO_REGEX =
  /(?:my name is|i'?m|i am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;

// National Insurance numbers: AB 12 34 56 C
const NINO_REGEX =
  /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi;

// UPN (Unique Pupil Numbers): letter + 12 digits + check letter
const UPN_REGEX =
  /\b[A-Z]\d{12}[A-Z]\b/gi;

// Date of birth patterns: dd/mm/yyyy, dd-mm-yyyy
const DOB_REGEX =
  /\b(?:born|dob|date of birth|birthday)\s*[:=]?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi;

interface StripResult {
  text: string;
  piiDetected: boolean;
  strippedTypes: string[];
}

export function stripPii(input: string): StripResult {
  let text = input;
  const strippedTypes: string[] = [];

  // Email
  if (EMAIL_REGEX.test(text)) {
    text = text.replace(EMAIL_REGEX, "[EMAIL REMOVED]");
    strippedTypes.push("email");
  }

  // Phone
  if (UK_PHONE_REGEX.test(text)) {
    text = text.replace(UK_PHONE_REGEX, "[PHONE REMOVED]");
    strippedTypes.push("phone");
  }

  // Postcode
  if (POSTCODE_REGEX.test(text)) {
    text = text.replace(POSTCODE_REGEX, "[POSTCODE REMOVED]");
    strippedTypes.push("postcode");
  }

  // Name introductions
  if (NAME_INTRO_REGEX.test(text)) {
    text = text.replace(NAME_INTRO_REGEX, "[NAME REMOVED]");
    strippedTypes.push("name");
  }

  // NI numbers
  if (NINO_REGEX.test(text)) {
    text = text.replace(NINO_REGEX, "[NINO REMOVED]");
    strippedTypes.push("nino");
  }

  // UPN
  if (UPN_REGEX.test(text)) {
    text = text.replace(UPN_REGEX, "[UPN REMOVED]");
    strippedTypes.push("upn");
  }

  // DOB
  if (DOB_REGEX.test(text)) {
    text = text.replace(DOB_REGEX, "[DOB REMOVED]");
    strippedTypes.push("dob");
  }

  const piiDetected = strippedTypes.length > 0;

  if (piiDetected) {
    console.warn(
      `[pii-strip] Stripped PII types: ${strippedTypes.join(", ")} from Ed feedback input`
    );
  }

  return { text, piiDetected, strippedTypes };
}
