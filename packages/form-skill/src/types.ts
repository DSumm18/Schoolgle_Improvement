/**
 * Form Skill Types
 * TypeScript definitions for form filling operations
 */

/**
 * Field schema from DOM snapshot
 */
export interface FieldSchema {
  /** Unique identifier for the field */
  id: string;
  /** Field label (visible text) */
  label: string;
  /** HTML input type or element tag */
  type: FieldType;
  /** Whether field is required */
  required: boolean;
  /** Available options (for select, radio, checkbox) */
  options?: Option[];
  /** Current value (masked if PII) */
  currentValue: string;
  /** Confidence score (0-1) for field detection */
  confidence: number;
  /** CSS selector hints for targeting */
  elementHints: ElementHints;
  /** Whether this field contains PII */
  isPII: boolean;
  /** Field name attribute */
  name?: string;
  /** Field placeholder text */
  placeholder?: string;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'email'
  | 'tel'
  | 'number'
  | 'typeahead'
  | 'file'
  | 'hidden';

export interface Option {
  value: string;
  label: string;
  selected?: boolean;
}

export interface ElementHints {
  /** Primary CSS selector */
  selector: string;
  /** Alternative selectors if primary fails */
  fallbackSelectors: string[];
  /** XPath (if available) */
  xpath?: string;
  /** Data attributes */
  dataAttributes?: Record<string, string>;
  /** Position hints (for disambiguation) */
  position?: {
    x: number;
    y: number;
  };
}

/**
 * Form schema (collection of fields)
 */
export interface FormSchema {
  /** Form identifier */
  formId: string;
  /** Form action URL */
  action?: string;
  /** Form method */
  method?: string;
  /** All fields in the form */
  fields: FieldSchema[];
  /** Form title/heading */
  title?: string;
  /** URL where form was found */
  url: string;
  /** Timestamp of snapshot */
  timestamp: number;
}

/**
 * Element fingerprint for verification
 */
export interface ElementFingerprint {
  tagName: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
  labelText?: string;
  index?: number;
}

/**
 * Action to execute for form filling
 */
export interface FillAction {
  /** Action ID (unique) */
  id: string;
  /** Field ID from schema */
  fieldId: string;
  /** Action type */
  type: ActionType;
  /** Value to fill */
  value: string;
  /** CSS selector to target */
  selector: string;
  /** Fallback selectors */
  fallbackSelectors?: string[];
  /** Validation rules */
  validation?: ValidationRule[];
  /** Confidence score (0-1) from field mapping */
  confidence?: number;
  /** Element fingerprint for verification */
  fingerprint?: ElementFingerprint;
  /** Whether this action requires explicit user confirmation */
  requiresConfirmation?: boolean;
  /** Match rationale (e.g., "Matched by label") */
  matchRationale?: string;
}

export type ActionType =
  | 'fill_text'
  | 'fill_textarea'
  | 'select_option'
  | 'check'
  | 'uncheck'
  | 'select_radio'
  | 'fill_date'
  | 'typeahead_select'
  | 'clear'
  | 'focus'
  | 'blur';

export interface ValidationRule {
  type: 'required' | 'format' | 'min' | 'max' | 'pattern';
  value?: any;
  message?: string;
}

/**
 * Input data for form filling (from spreadsheet, etc.)
 */
export interface InputData {
  /** Field name → value mapping */
  [fieldName: string]: string | number | boolean;
}

/**
 * Plan result from LLM
 */
export interface FillPlan {
  /** List of actions to execute */
  actions: FillAction[];
  /** Warnings or issues */
  warnings: string[];
  /** Fields that couldn't be mapped */
  unmappedFields: string[];
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  /** Actions executed successfully */
  succeeded: string[];
  /** Actions that failed */
  failed: Array<{
    actionId: string;
    error: string;
  }>;
  /** Fields that were skipped */
  skipped: string[];
  /** Final form state (for verification) */
  finalState?: Record<string, string>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Safety warnings */
  warnings: SafetyWarning[];
  /** Whether form can be submitted */
  canSubmit: boolean;
}

export interface ValidationError {
  fieldId: string;
  message: string;
  severity: 'error' | 'warning';
  /** Confidence level that triggered this error */
  confidence?: number;
}

export interface SafetyWarning {
  type: 'password_field' | 'sensitive_data' | 'payment' | 'authentication' | 'unknown_field' | 'low_confidence' | 'sensitive_field';
  message: string;
  action: 'block' | 'warn' | 'allow';
  fieldId?: string;
  confidence?: number;
}

/**
 * PII detection patterns
 */
export interface PIIPattern {
  name: string;
  pattern: RegExp;
  mask: (value: string) => string;
}

/**
 * Capability profile for a specific MIS system
 */
export interface CapabilityProfile {
  /** System name (e.g., "Arbor", "Bromcom") */
  name: string;
  /** Post-blur delay in ms */
  postBlurDelay?: number;
  /** Typeahead polling interval in ms */
  typeaheadPollInterval?: number;
  /** Typeahead max wait time in ms */
  typeaheadMaxWait?: number;
  /** Max retry attempts per field */
  maxRetries?: number;
  /** Whether to wait for validation DOM changes */
  waitForValidation?: boolean;
  /** Additional wait after field fill in ms */
  postFillDelay?: number;
}

/**
 * Form version tracking for SPA re-render detection
 */
export interface FormVersionTracker {
  version: number;
  observer: MutationObserver | null;
  container: HTMLElement | null;
}

