/**
 * Form Skill
 * In-browser form filling for Ed extension
 */

export { domSnapshot } from './dom-snapshot';
export { planFill, planFillSimple } from './plan-fill';
export { executeActions } from './execute-actions';
export { validate, shouldSubmitForm } from './validate';
export { containsPII, maskPII, isPIIField } from './pii-detection';
export { fillForm } from './form-skill';
export { detectSystem, getCapabilityProfile, getDefaultProfile } from './capability-profiles';
export { recognizeFieldsWithVision, captureFormScreenshot } from './vision-fallback';
export type { FormFillOptions, FormFillResult } from './form-skill';
export type { CapabilityProfile, ElementFingerprint, FormVersionTracker } from './types';

export type {
  FieldSchema,
  FormSchema,
  FillAction,
  FillPlan,
  ExecutionResult,
  ValidationResult,
  InputData,
  FieldType,
  ActionType,
} from './types';

