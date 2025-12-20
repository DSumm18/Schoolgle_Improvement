/**
 * Form Fill Diagnostics
 * Dev-only diagnostic panel and console reporting
 */

import type { FormSchema, FillPlan, ExecutionResult, ValidationResult } from '@schoolgle/form-skill';
import { detectSystem, getCapabilityProfile } from '@schoolgle/form-skill';

export interface DiagnosticReport {
  timestamp: number;
  hostname: string;
  schema: {
    fieldCount: number;
    confidenceStats: {
      high: number; // >= 0.85
      medium: number; // 0.60-0.84
      low: number; // < 0.60
      average: number;
    };
    gatedCount: number;
    blockedCount: number;
  };
  plan: {
    actionCount: number;
    unmappedCount: number;
    confidenceStats: {
      high: number;
      medium: number;
      low: number;
      average: number;
    };
  };
  validation: {
    valid: boolean;
    errorCount: number;
    warningCount: number;
    blockedCount: number;
    gatedCount: number;
  };
  execution: {
    succeeded: number;
    failed: number;
    skipped: number;
    timings?: {
      startTime: number;
      endTime: number;
      duration: number;
    };
  };
  system: {
    detected: string;
    profile: string;
  };
}

/**
 * Generate diagnostic report
 */
export function generateDiagnosticReport(
  schema: FormSchema | null,
  plan: FillPlan | null,
  validation: ValidationResult | null,
  executionResult: ExecutionResult | null,
  startTime?: number,
  endTime?: number
): DiagnosticReport {
  const confidenceStats = schema ? calculateConfidenceStats(schema.fields.map(f => f.confidence)) : { high: 0, medium: 0, low: 0, average: 0 };
  const planConfidenceStats = plan ? calculateConfidenceStats(plan.actions.map(a => a.confidence ?? 1.0)) : { high: 0, medium: 0, low: 0, average: 0 };
  
  const gatedCount = schema?.fields.filter(f => f.gated).length || 0;
  const blockedCount = schema?.fields.filter(f => f.confidence < 0.60).length || 0;
  
  const system = detectSystem(window.location.href);
  const profile = getCapabilityProfile(system);
  
  return {
    timestamp: Date.now(),
    hostname: new URL(window.location.href).hostname,
    schema: {
      fieldCount: schema?.fields.length || 0,
      confidenceStats,
      gatedCount,
      blockedCount,
    },
    plan: {
      actionCount: plan?.actions.length || 0,
      unmappedCount: plan?.unmappedFields.length || 0,
      confidenceStats: planConfidenceStats,
    },
    validation: {
      valid: validation?.valid || false,
      errorCount: validation?.errors.length || 0,
      warningCount: validation?.warnings.length || 0,
      blockedCount: validation?.warnings.filter(w => w.action === 'block').length || 0,
      gatedCount: validation?.warnings.filter(w => w.action === 'confirm').length || 0,
    },
    execution: {
      succeeded: executionResult?.succeeded.length || 0,
      failed: executionResult?.failed.length || 0,
      skipped: executionResult?.skipped.length || 0,
      timings: startTime && endTime ? {
        startTime,
        endTime,
        duration: endTime - startTime,
      } : undefined,
    },
    system: {
      detected: system,
      profile: profile.name,
    },
  };
}

/**
 * Calculate confidence statistics
 */
function calculateConfidenceStats(confidences: number[]): { high: number; medium: number; low: number; average: number } {
  if (confidences.length === 0) {
    return { high: 0, medium: 0, low: 0, average: 0 };
  }
  
  const high = confidences.filter(c => c >= 0.85).length;
  const medium = confidences.filter(c => c >= 0.60 && c < 0.85).length;
  const low = confidences.filter(c => c < 0.60).length;
  const average = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  
  return { high, medium, low, average };
}

/**
 * Print diagnostic report to console
 */
export function printDiagnosticReport(report: DiagnosticReport): void {
  console.group('🔍 Form Fill Diagnostics');
  
  console.log('📊 Schema');
  console.table({
    'Field Count': report.schema.fieldCount,
    'High Confidence (≥0.85)': report.schema.confidenceStats.high,
    'Medium Confidence (0.60-0.84)': report.schema.confidenceStats.medium,
    'Low Confidence (<0.60)': report.schema.confidenceStats.low,
    'Average Confidence': report.schema.confidenceStats.average.toFixed(3),
    'Gated Fields': report.schema.gatedCount,
    'Blocked Fields': report.schema.blockedCount,
  });
  
  console.log('📋 Plan');
  console.table({
    'Action Count': report.plan.actionCount,
    'Unmapped Fields': report.plan.unmappedCount,
    'High Confidence Actions': report.plan.confidenceStats.high,
    'Medium Confidence Actions': report.plan.confidenceStats.medium,
    'Low Confidence Actions': report.plan.confidenceStats.low,
    'Average Confidence': report.plan.confidenceStats.average.toFixed(3),
  });
  
  console.log('✅ Validation');
  console.table({
    'Valid': report.validation.valid ? '✓' : '✗',
    'Errors': report.validation.errorCount,
    'Warnings': report.validation.warningCount,
    'Blocked': report.validation.blockedCount,
    'Gated': report.validation.gatedCount,
  });
  
  if (report.execution.timings) {
    console.log('⏱️ Execution');
    console.table({
      'Succeeded': report.execution.succeeded,
      'Failed': report.execution.failed,
      'Skipped': report.execution.skipped,
      'Duration (ms)': report.execution.timings.duration,
    });
  } else {
    console.log('⏱️ Execution');
    console.table({
      'Succeeded': report.execution.succeeded,
      'Failed': report.execution.failed,
      'Skipped': report.execution.skipped,
    });
  }
  
  console.log('🔧 System');
  console.table({
    'Detected': report.system.detected,
    'Profile': report.system.profile,
  });
  
  console.groupEnd();
}

/**
 * Create redacted debug bundle (no raw values)
 */
export function createRedactedDebugBundle(
  schema: FormSchema | null,
  plan: FillPlan | null,
  validation: ValidationResult | null,
  executionResult: ExecutionResult | null,
  report: DiagnosticReport
): string {
  const bundle: any = {
    version: '1.1',
    timestamp: report.timestamp,
    hostname: report.hostname,
    diagnostics: report,
    schema: schema ? {
      formId: schema.formId,
      fieldCount: schema.fields.length,
      fields: schema.fields.map(f => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        confidence: f.confidence,
        gated: f.gated,
        isPII: f.isPII,
        // NO currentValue, NO raw data
      })),
    } : null,
    plan: plan ? {
      actionCount: plan.actions.length,
      unmappedFields: plan.unmappedFields,
      actions: plan.actions.map(a => ({
        id: a.id,
        fieldId: a.fieldId,
        type: a.type,
        confidence: a.confidence,
        requiresConfirmation: a.requiresConfirmation,
        // NO value, NO raw data
      })),
    } : null,
    validation: validation ? {
      valid: validation.valid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      errors: validation.errors.map(e => ({
        fieldId: e.fieldId,
        message: e.message,
        severity: e.severity,
      })),
      warnings: validation.warnings.map(w => ({
        type: w.type,
        message: w.message,
        action: w.action,
        fieldId: w.fieldId,
      })),
    } : null,
    execution: executionResult ? {
      succeeded: executionResult.succeeded,
      failed: executionResult.failed.map(f => ({
        actionId: f.actionId,
        error: f.error,
        retried: f.retried,
        // NO originalSelector/finalSelector (may contain sensitive info)
      })),
      skipped: executionResult.skipped,
    } : null,
  };
  
  return JSON.stringify(bundle, null, 2);
}

/**
 * Copy debug bundle to clipboard
 */
export async function copyDebugBundleToClipboard(bundle: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(bundle);
    return true;
  } catch (error) {
    console.error('[Form Fill Diagnostics] Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Check if dev mode is enabled
 */
export function isDevMode(): boolean {
  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('ed_dev') === 'true') return true;
  
  // Check localStorage flag
  try {
    return localStorage.getItem('ed_form_fill_dev') === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable dev mode
 */
export function enableDevMode(): void {
  try {
    localStorage.setItem('ed_form_fill_dev', 'true');
  } catch {
    // Ignore
  }
}

/**
 * Disable dev mode
 */
export function disableDevMode(): void {
  try {
    localStorage.removeItem('ed_form_fill_dev');
  } catch {
    // Ignore
  }
}

