/**
 * PII Detection and Masking
 * Identifies and masks personally identifiable information
 */

import type { PIIPattern } from './types';

/**
 * Common PII patterns
 */
export const PII_PATTERNS: PIIPattern[] = [
  // Email addresses
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    mask: (value) => value.replace(/(.{2}).*(@.*)/, '$1***$2'),
  },
  // UK phone numbers
  {
    name: 'phone_uk',
    pattern: /(\+44|0)[1-9]\d{8,9}/g,
    mask: (value) => value.replace(/(\d{4})\d+(\d{4})/, '$1****$2'),
  },
  // UK postcodes
  {
    name: 'postcode_uk',
    pattern: /[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/gi,
    mask: (value) => value.replace(/(.{2}).*/, '$1***'),
  },
  // Dates of birth (various formats)
  {
    name: 'dob',
    pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
    mask: () => '[DATE]',
  },
  // National Insurance numbers (UK)
  {
    name: 'ni_number',
    pattern: /\b[A-Z]{2}\d{6}[A-Z]?\b/gi,
    mask: () => '[NI]',
  },
  // UPN (Unique Pupil Number)
  {
    name: 'upn',
    pattern: /\b[A-Z0-9]{13}\b/g,
    mask: () => '[UPN]',
  },
  // Bank account numbers (UK)
  {
    name: 'account_number',
    pattern: /\b\d{8,10}\b/g,
    mask: (value) => value.replace(/\d(?=\d{4})/g, '*'),
  },
  // Sort codes
  {
    name: 'sort_code',
    pattern: /\b\d{2}-\d{2}-\d{2}\b/g,
    mask: () => '[SORT]',
  },
];

/**
 * Check if a value contains PII
 */
export function containsPII(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  return PII_PATTERNS.some(pattern => pattern.pattern.test(value));
}

/**
 * Mask PII in a value
 */
export function maskPII(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  let masked = value;
  
  for (const pattern of PII_PATTERNS) {
    masked = masked.replace(pattern.pattern, (match) => pattern.mask(match));
  }
  
  return masked;
}

/**
 * Detect PII type in a value
 */
export function detectPIIType(value: string): string[] {
  if (!value || typeof value !== 'string') return [];
  
  const detected: string[] = [];
  
  for (const pattern of PII_PATTERNS) {
    if (pattern.pattern.test(value)) {
      detected.push(pattern.name);
    }
  }
  
  return detected;
}

/**
 * Check if a field label suggests PII
 */
export function isPIIField(label: string): boolean {
  const lowerLabel = label.toLowerCase();
  
  const piiKeywords = [
    'email', 'phone', 'mobile', 'telephone',
    'dob', 'date of birth', 'birth date',
    'address', 'postcode', 'post code',
    'ni number', 'national insurance',
    'upn', 'unique pupil number',
    'account', 'sort code', 'bank',
    'password', 'passcode', 'pin',
    'ssn', 'social security',
  ];
  
  return piiKeywords.some(keyword => lowerLabel.includes(keyword));
}

