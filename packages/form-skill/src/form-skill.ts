/**
 * Form Skill - Main API
 * Convenience wrapper for common form filling operations
 */

import { domSnapshot } from './dom-snapshot';
import { planFill, planFillSimple } from './plan-fill';
import { executeActions } from './execute-actions';
import { validate } from './validate';
import type { FormSchema, InputData, FillPlan, ExecutionResult, ValidationResult } from './types';

export interface FormFillOptions {
  /** API key for LLM calls */
  apiKey?: string;
  /** Use LLM planning (default: true) */
  useLLM?: boolean;
  /** Validate before executing (default: true) */
  validateBeforeExecute?: boolean;
  /** Explicit submit request (default: false) */
  explicitSubmit?: boolean;
}

export interface FormFillResult {
  schema: FormSchema;
  plan: FillPlan;
  validation: ValidationResult;
  execution: ExecutionResult;
  success: boolean;
}

/**
 * Complete form fill workflow
 */
export async function fillForm(
  inputData: InputData,
  options: FormFillOptions = {}
): Promise<FormFillResult> {
  const {
    apiKey,
    useLLM = true,
    validateBeforeExecute = true,
    explicitSubmit = false,
  } = options;
  
  // 1. Scan form
  const schema = domSnapshot();
  
  // 2. Plan fill
  let plan: FillPlan;
  if (useLLM && apiKey) {
    try {
      plan = await planFill(schema, inputData, apiKey);
    } catch (error) {
      console.warn('LLM planning failed, using simple matching:', error);
      plan = planFillSimple(schema, inputData);
    }
  } else {
    plan = planFillSimple(schema, inputData);
  }
  
  // 3. Validate
  const validation = validate(plan.actions);
  
  if (validateBeforeExecute && !validation.valid) {
    return {
      schema,
      plan,
      validation,
      execution: {
        succeeded: [],
        failed: [],
        skipped: [],
      },
      success: false,
    };
  }
  
  // 4. Execute
  const execution = await executeActions(plan.actions);
  
  // 5. Check if should submit (never auto-submit)
  if (explicitSubmit && validation.canSubmit) {
    const submitButton = document.querySelector('input[type="submit"], button[type="submit"]');
    if (submitButton) {
      (submitButton as HTMLElement).click();
    }
  }
  
  return {
    schema,
    plan,
    validation,
    execution,
    success: execution.failed.length === 0,
  };
}

