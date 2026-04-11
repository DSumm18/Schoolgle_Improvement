/**
 * PII Masking — Backwards-Compatible Shim
 *
 * This module used to be the standalone PII scrubber. It's now a thin shim
 * over SchoolDataGuardian, which is the unified privacy shield for the
 * whole platform. Existing callers (ai-evidence-matcher, website compliance
 * assessor, etc.) continue to work without changes.
 *
 * For new code, import SchoolDataGuardian directly from './school-data-guardian'.
 *
 * See docs/architecture/school-data-guardian-audit.md for the history of why
 * there used to be two modules and why they were unified.
 */

import { SchoolDataGuardian, type GuardianCategory } from './school-data-guardian';

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
   * Accepts legacy uppercase names: EMAIL, NI_NUMBER, DOB, PHONE, PERSON, POSTCODE
   */
  skipCategories?: string[];
}

/**
 * Legacy category name (uppercase) → Guardian category name (lowercase).
 */
function legacyToGuardian(legacyName: string): GuardianCategory | null {
  const mapping: Record<string, GuardianCategory> = {
    EMAIL: 'email',
    NI_NUMBER: 'ni_number',
    DOB: 'dob',
    PHONE: 'phone',
    PERSON: 'name_with_role',
    POSTCODE: 'postcode',
    UPN: 'upn',
    NHS_NUMBER: 'nhs_number',
  };
  return mapping[legacyName.toUpperCase()] ?? null;
}

export function maskPII(text: string, options?: MaskOptions): MaskResult {
  const skip: GuardianCategory[] = (options?.skipCategories ?? [])
    .map(legacyToGuardian)
    .filter((c): c is GuardianCategory => c !== null);

  const result = SchoolDataGuardian.scrub(text, { skipCategories: skip });

  return {
    maskedText: result.sanitised,
    maskMap: result.tokenMap,
    maskCount: result.tokenMap.size,
  };
}

export function unmaskPII(maskedText: string, maskMap: Map<string, string>): string {
  return SchoolDataGuardian.rehydrate(maskedText, maskMap);
}
