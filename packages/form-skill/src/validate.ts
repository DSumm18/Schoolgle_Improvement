/**
 * Validate - HARDENED
 * Preflight checks, safety rules, confidence gating, and validation
 */

import type { FillAction, ValidationResult, ValidationError, SafetyWarning } from './types';

/**
 * Sensitive field keywords (always gated regardless of confidence)
 */
const SENSITIVE_FIELD_KEYWORDS = [
  'status', 'outcome', 'decision', 'result', 'attendance',
  'authorised', 'unauthorised', 'approved', 'rejected',
  'present', 'absent', 'late', 'code', 'reason',
];

/**
 * Validate actions before execution with confidence gating
 */
export function validate(actions: FillAction[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: SafetyWarning[] = [];
  let canSubmit = true;
  
  for (const action of actions) {
    const confidence = action.confidence ?? 1.0;
    
    // Check for password fields
    const element = document.querySelector(action.selector) as HTMLElement;
    if (element instanceof HTMLInputElement && element.type === 'password') {
      warnings.push({
        type: 'password_field',
        message: `Action targets password field: ${action.fieldId}`,
        action: 'block',
        fieldId: action.fieldId,
      });
      canSubmit = false;
      errors.push({
        fieldId: action.fieldId,
        message: 'Cannot fill password fields',
        severity: 'error',
        confidence,
      });
      continue;
    }
    
    // Check for sensitive field categories (always gated)
    const isSensitiveField = isSensitiveFieldCategory(action, element);
    if (isSensitiveField) {
      warnings.push({
        type: 'sensitive_field',
        message: `Sensitive field requires confirmation: ${action.fieldId}`,
        action: 'block',
        fieldId: action.fieldId,
        confidence,
      });
      errors.push({
        fieldId: action.fieldId,
        message: 'Sensitive field (status/outcome/decision/attendance) requires explicit confirmation',
        severity: 'error',
        confidence,
      });
      canSubmit = false;
      continue;
    }
    
    // Confidence gating
    if (confidence < 0.60) {
      warnings.push({
        type: 'low_confidence',
        message: `Low confidence mapping (${(confidence * 100).toFixed(0)}%): ${action.fieldId}`,
        action: 'block',
        fieldId: action.fieldId,
        confidence,
      });
      errors.push({
        fieldId: action.fieldId,
        message: `Low confidence mapping (${(confidence * 100).toFixed(0)}%). Manual approval required.`,
        severity: 'error',
        confidence,
      });
      canSubmit = false;
      continue;
    } else if (confidence < 0.85) {
      // 0.60-0.84: requires explicit confirmation
      warnings.push({
        type: 'low_confidence',
        message: `Medium confidence mapping (${(confidence * 100).toFixed(0)}%): ${action.fieldId}. Requires confirmation.`,
        action: 'warn',
        fieldId: action.fieldId,
        confidence,
      });
      // Don't block, but mark as requiring confirmation
      action.requiresConfirmation = true;
    }
    
    // Check for sensitive data fields
    if (element) {
      const label = findFieldLabel(element);
      if (label && isPIIField(label)) {
        warnings.push({
          type: 'sensitive_data',
          message: `Field may contain sensitive data: ${label}`,
          action: 'warn',
          fieldId: action.fieldId,
        });
      }
    }
    
    // Check for payment fields
    if (isPaymentField(action.selector, element)) {
      warnings.push({
        type: 'payment',
        message: 'Form contains payment fields',
        action: 'warn',
        fieldId: action.fieldId,
      });
    }
    
    // Check for authentication fields
    if (isAuthenticationField(action.selector, element)) {
      warnings.push({
        type: 'authentication',
        message: 'Form contains authentication fields',
        action: 'warn',
        fieldId: action.fieldId,
      });
    }
    
    // Validate selector exists
    if (!element) {
      errors.push({
        fieldId: action.fieldId,
        message: `Element not found: ${action.selector}`,
        severity: 'error',
        confidence,
      });
    }
    
    // Validate value format
    const valueError = validateValueFormat(action);
    if (valueError) {
      errors.push(valueError);
    }
  }
  
  // Check if form has submit button
  const hasSubmitButton = document.querySelector('input[type="submit"], button[type="submit"], button:not([type])');
  if (hasSubmitButton && canSubmit) {
    warnings.push({
      type: 'unknown_field',
      message: 'Form has submit button. Ed will NOT submit unless explicitly requested.',
      action: 'allow',
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canSubmit: canSubmit && errors.length === 0,
  };
}

/**
 * Check if field is in sensitive category
 */
function isSensitiveFieldCategory(action: FillAction, element: HTMLElement | null): boolean {
  const checkText = (text: string): boolean => {
    const lower = text.toLowerCase();
    return SENSITIVE_FIELD_KEYWORDS.some(keyword => lower.includes(keyword));
  };
  
  // Check field ID
  if (checkText(action.fieldId)) return true;
  
  // Check selector
  if (checkText(action.selector)) return true;
  
  // Check element label
  if (element) {
    const label = findFieldLabel(element);
    if (label && checkText(label)) return true;
    
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && checkText(ariaLabel)) return true;
    
    // Check name attribute
    if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
      const name = element.name;
      if (name && checkText(name)) return true;
    }
  }
  
  return false;
}

/**
 * Check if field label suggests PII
 */
function isPIIField(label: string): boolean {
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

/**
 * Find field label
 */
function findFieldLabel(element: HTMLElement): string | null {
  // Check for explicit label[for]
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent?.trim() || null;
  }
  
  // Check for parent label
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel.textContent?.trim() || null;
  
  // Check for aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;
  
  // Check for placeholder
  if (element instanceof HTMLInputElement && element.placeholder) {
    return element.placeholder;
  }
  
  return null;
}

/**
 * Check if field is payment-related
 */
function isPaymentField(selector: string, element: HTMLElement | null): boolean {
  const lowerSelector = selector.toLowerCase();
  const paymentKeywords = ['card', 'payment', 'billing', 'credit', 'debit', 'cvv', 'cvc'];
  
  if (paymentKeywords.some(keyword => lowerSelector.includes(keyword))) {
    return true;
  }
  
  if (element) {
    const label = findFieldLabel(element);
    if (label) {
      const lowerLabel = label.toLowerCase();
      return paymentKeywords.some(keyword => lowerLabel.includes(keyword));
    }
  }
  
  return false;
}

/**
 * Check if field is authentication-related
 */
function isAuthenticationField(selector: string, element: HTMLElement | null): boolean {
  const lowerSelector = selector.toLowerCase();
  const authKeywords = ['login', 'signin', 'username', 'email', 'password', 'auth'];
  
  if (authKeywords.some(keyword => lowerSelector.includes(keyword))) {
    return true;
  }
  
  if (element) {
    const label = findFieldLabel(element);
    if (label) {
      const lowerLabel = label.toLowerCase();
      return authKeywords.some(keyword => lowerLabel.includes(keyword));
    }
  }
  
  return false;
}

/**
 * Validate value format
 */
function validateValueFormat(action: FillAction): ValidationError | null {
  const { type, value } = action;
  
  // Email validation
  if (type === 'fill_text' && action.selector.includes('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        fieldId: action.fieldId,
        message: 'Invalid email format',
        severity: 'error',
        confidence: action.confidence,
      };
    }
  }
  
  // Date validation
  if (type === 'fill_date') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        fieldId: action.fieldId,
        message: 'Invalid date format',
        severity: 'error',
        confidence: action.confidence,
      };
    }
  }
  
  // Number validation
  if (type === 'fill_text' && action.selector.includes('number')) {
    if (isNaN(Number(value))) {
      return {
        fieldId: action.fieldId,
        message: 'Invalid number format',
        severity: 'error',
        confidence: action.confidence,
      };
    }
  }
  
  return null;
}

/**
 * Check if form should be submitted
 */
export function shouldSubmitForm(explicitRequest: boolean, warnings: SafetyWarning[]): boolean {
  // Never submit unless explicitly requested
  if (!explicitRequest) return false;
  
  // Block if there are blocking warnings
  const blockingWarnings = warnings.filter(w => w.action === 'block');
  if (blockingWarnings.length > 0) return false;
  
  return true;
}
