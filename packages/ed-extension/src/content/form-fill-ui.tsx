/**
 * Form Fill UI - I-I-I Flow (Intent → Implementation → Impact)
 * Complete end-to-end UX for Ed form filling
 */

import type { FormSchema, InputData, FillPlan, FillAction, ExecutionResult } from '@schoolgle/form-skill';
import { saveAuditLog, getCleanHostname } from './form-fill-audit';
import { ActionRunner } from './form-fill-runner';
import { 
  generateDiagnosticReport, 
  printDiagnosticReport, 
  createRedactedDebugBundle, 
  copyDebugBundleToClipboard,
  isDevMode 
} from './form-fill-diagnostics';

// Functions will be imported at runtime or bundled
async function getFormSkill() {
  try {
    return await import('@schoolgle/form-skill');
  } catch {
    return {
      domSnapshot: (window as any).domSnapshot,
      planFill: (window as any).planFill,
      planFillSimple: (window as any).planFillSimple,
      executeActions: (window as any).executeActions,
      validate: (window as any).validate,
      detectSystem: (window as any).detectSystem,
      getCapabilityProfile: (window as any).getCapabilityProfile,
      recognizeFieldsWithVision: (window as any).recognizeFieldsWithVision,
      captureFormScreenshot: (window as any).captureFormScreenshot,
    };
  }
}

type IntentStep = 'scan' | 'input' | 'plan' | 'preview';
type ImplementationStep = 'executing' | 'paused' | 'stopped';
type ImpactStep = 'complete';
type FormFillStep = IntentStep | ImplementationStep | ImpactStep;

export interface FormFillState {
  stage: 'intent' | 'implementation' | 'impact';
  step: FormFillStep;
  schema: FormSchema | null;
  inputData: InputData;
  plan: FillPlan | null;
  validation: any | null;
  executionResult: ExecutionResult | null;
  errors: string[];
  warnings: string[];
  currentFieldIndex: number;
  isPaused: boolean;
  isStopped: boolean;
  isStepMode: boolean;
  useVisionFallback: boolean;
  visionFallbackRequested: boolean;
  visionFallbackUsed: boolean;
  demoMode: boolean;
}

/**
 * Form Fill Dialog - I-I-I Flow
 */
export class FormFillDialog {
  private state: FormFillState = {
    stage: 'intent',
    step: 'scan',
    schema: null,
    inputData: {},
    plan: null,
    validation: null,
    executionResult: null,
    errors: [],
    warnings: [],
    currentFieldIndex: 0,
    isPaused: false,
    isStopped: false,
    isStepMode: false,
    useVisionFallback: false,
    visionFallbackRequested: false,
    visionFallbackUsed: false,
    demoMode: false,
  };
  
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private activeFieldHighlight: HTMLElement | null = null;
  private runner: ActionRunner | null = null;
  private onClose: () => void;
  private apiKey: string;
  private keyboardHandlers: Map<string, () => void> = new Map();
  private currentAction: FillAction | null = null;
  private lastActionStatus: 'succeeded' | 'failed' | 'skipped' | null = null;
  private executionStartTime: number | null = null;
  private executionEndTime: number | null = null;
  
  constructor(apiKey: string, onClose: () => void) {
    this.apiKey = apiKey;
    this.onClose = onClose;
    
    // Check for demo mode (dev only)
    const urlParams = new URLSearchParams(window.location.search);
    this.state.demoMode = urlParams.get('ed_demo') === 'true';
  }
  
  /**
   * Show dialog
   */
  show(): void {
    this.container = document.createElement('div');
    this.container.id = 'ed-form-fill-dialog';
    this.container.innerHTML = this.render();
    document.body.appendChild(this.container);
    
    // Inject styles
    injectFormFillStyles();
    
    // Bind events
    this.bindEvents();
    this.bindKeyboard();
    
    // Auto-scan form
    this.scanForm();
  }
  
  /**
   * Hide dialog
   */
  hide(): void {
    this.unbindKeyboard();
    this.removeActiveFieldHighlight();
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.onClose();
  }
  
  /**
   * Render dialog HTML
   */
  private render(): string {
    const { stage, step } = this.state;
    
    return `
      <div class="ed-form-fill-overlay">
        <div class="ed-form-fill-dialog ed-form-fill-stage-${stage}">
          <div class="ed-form-fill-header">
            <h3>${this.getStageTitle()}</h3>
            ${this.state.demoMode ? '<span class="ed-form-fill-demo-badge">DEMO</span>' : ''}
            <div class="ed-form-fill-header-right">
              ${this.renderBrowserSupport()}
              <button class="ed-form-fill-close" aria-label="Close">×</button>
            </div>
          </div>
          
          <div class="ed-form-fill-content">
            ${this.renderStage()}
          </div>
          
          <div class="ed-form-fill-footer">
            ${this.renderFooter()}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render browser support note
   */
  private renderBrowserSupport(): string {
    return `
      <span class="ed-form-fill-browser-support" title="Works in Chrome and Edge browsers">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 12.5c-3 0-5.5-2.5-5.5-5.5S5 2.5 8 2.5 13.5 5 13.5 8 11 13.5 8 13.5z" fill="currentColor"/>
          <path d="M8 4.5c-1.9 0-3.5 1.6-3.5 3.5S6.1 11.5 8 11.5 11.5 9.9 11.5 8 9.9 4.5 8 4.5z" fill="currentColor"/>
        </svg>
        Chrome/Edge
      </span>
    `;
  }
  
  /**
   * Get stage title
   */
  private getStageTitle(): string {
    switch (this.state.stage) {
      case 'intent':
        return 'Intent: Review Fill Plan';
      case 'implementation':
        return 'Implementation: Filling Form';
      case 'impact':
        return 'Impact: Results Summary';
      default:
        return 'Fill Form with Ed';
    }
  }
  
  /**
   * Render current stage
   */
  private renderStage(): string {
    const { stage, step } = this.state;
    
    switch (stage) {
      case 'intent':
        return this.renderIntentStage(step as IntentStep);
      case 'implementation':
        return this.renderImplementationStage(step as ImplementationStep);
      case 'impact':
        return this.renderImpactStage();
      default:
        return '';
    }
  }
  
  /**
   * Render INTENT stage
   */
  private renderIntentStage(step: IntentStep): string {
    switch (step) {
      case 'scan':
        return `
          <div class="ed-form-fill-step">
            <p>Scanning form...</p>
            <div class="ed-form-fill-spinner"></div>
            ${this.state.schema ? `<p>Found ${this.state.schema.fields.length} fields</p>` : ''}
          </div>
        `;
      
      case 'input':
        return `
          <div class="ed-form-fill-step">
            <h4>Enter or paste data</h4>
            ${this.state.demoMode ? `
              <div class="ed-form-fill-demo-notice">
                Demo mode: Using sample data
              </div>
            ` : ''}
            <textarea 
              id="ed-form-fill-input" 
              placeholder='Paste CSV or JSON data, e.g.:
{"First Name": "John", "Last Name": "Doe", "Date of Birth": "2010-01-15"}'
              rows="10"
            >${this.state.demoMode ? this.getDemoData() : ''}</textarea>
            <button id="ed-form-fill-parse" class="ed-form-fill-btn">Parse Data</button>
            ${this.state.errors.length > 0 ? `<div class="ed-form-fill-errors">${this.state.errors.join('<br>')}</div>` : ''}
          </div>
        `;
      
      case 'plan':
        return `
          <div class="ed-form-fill-step">
            <p>Creating fill plan...</p>
            <div class="ed-form-fill-spinner"></div>
          </div>
        `;
      
      case 'preview':
        if (this.state.visionFallbackRequested) {
          return this.renderVisionFallbackPrompt();
        }
        return this.renderPreview();
      
      default:
        return '';
    }
  }
  
  /**
   * Render preview with confidence scores
   */
  private renderPreview(): string {
    if (!this.state.plan) return '';
    
    const { plan, validation } = this.state;
    const gatedCount = plan.actions.filter(a => a.requiresConfirmation).length;
    const blockedCount = plan.actions.filter(a => (a.confidence ?? 1.0) < 0.60).length;
    
    return `
      <div class="ed-form-fill-preview">
        <div class="ed-form-fill-preview-summary">
          <strong>${plan.actions.length}</strong> fields to fill
          ${gatedCount > 0 ? ` • <span class="ed-form-fill-warning-text">${gatedCount} need confirmation</span>` : ''}
          ${blockedCount > 0 ? ` • <span class="ed-form-fill-error-text">${blockedCount} blocked</span>` : ''}
        </div>
        
        <div class="ed-form-fill-preview-list">
          ${plan.actions.map(action => this.renderPreviewAction(action)).join('')}
        </div>
        
        ${plan.unmappedFields.length > 0 ? `
          <div class="ed-form-fill-warning">
            <strong>Unmapped fields:</strong> ${plan.unmappedFields.join(', ')}
          </div>
        ` : ''}
        
        ${validation && !validation.valid ? `
          <div class="ed-form-fill-errors">
            ${validation.errors.map((e: any) => e.message).join('<br>')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Render single preview action
   */
  private renderPreviewAction(action: FillAction): string {
    const confidence = action.confidence ?? 1.0;
    const confidencePercent = Math.round(confidence * 100);
    const isBlocked = confidence < 0.60;
    const requiresConfirm = action.requiresConfirmation || (confidence >= 0.60 && confidence < 0.85);
    
    // Get field label from schema
    const field = this.state.schema?.fields.find(f => f.id === action.fieldId);
    const fieldLabel = field?.label || action.fieldId;
    
    // Check if sensitive field
    const isSensitive = this.isSensitiveField(fieldLabel);
    
    let confidenceClass = 'confidence-high';
    let confidenceIcon = '✓';
    let statusText = 'Ready';
    
    if (isBlocked) {
      confidenceClass = 'confidence-blocked';
      confidenceIcon = '✗';
      statusText = 'Blocked';
    } else if (requiresConfirm || isSensitive) {
      confidenceClass = 'confidence-warning';
      confidenceIcon = '⚠';
      statusText = 'Needs confirmation';
    }
    
    return `
      <div class="ed-form-fill-preview-item ${confidenceClass}" data-action-id="${action.id}">
        <div class="ed-form-fill-preview-item-header">
          <span class="ed-form-fill-preview-field-label">
            ${isSensitive ? '🔒 ' : ''}${fieldLabel}
          </span>
          <span class="ed-form-fill-preview-confidence confidence-${this.getConfidenceClass(confidence)}">
            ${confidencePercent}%
          </span>
        </div>
        <div class="ed-form-fill-preview-item-value">
          ${action.value}
        </div>
        <div class="ed-form-fill-preview-item-footer">
          <span class="ed-form-fill-preview-status">
            ${confidenceIcon} ${statusText}
          </span>
          ${action.matchRationale ? `
            <span class="ed-form-fill-preview-rationale" title="${action.matchRationale}">
              ℹ️ Why matched?
            </span>
          ` : ''}
          ${(requiresConfirm || isSensitive) && !isBlocked ? `
            <button class="ed-form-fill-confirm-btn" data-action-id="${action.id}">
              Confirm
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Check if field is sensitive
   */
  private isSensitiveField(label: string): boolean {
    const lower = label.toLowerCase();
    const sensitiveKeywords = [
      'status', 'outcome', 'decision', 'result', 'attendance',
      'authorised', 'unauthorised', 'approved', 'rejected',
      'present', 'absent', 'late', 'code', 'reason',
    ];
    return sensitiveKeywords.some(keyword => lower.includes(keyword));
  }
  
  /**
   * Get confidence class
   */
  private getConfidenceClass(confidence: number): string {
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.60) return 'medium';
    return 'low';
  }
  
  /**
   * Render IMPLEMENTATION stage
   */
  private renderImplementationStage(step: ImplementationStep): string {
    const { plan, currentFieldIndex, isPaused, isStopped, isStepMode, currentAction, lastActionStatus } = this.state;
    const totalFields = plan?.actions.length || 0;
    const currentField = plan?.actions[currentFieldIndex];
    const field = currentField ? this.state.schema?.fields.find(f => f.id === currentField.fieldId) : null;
    const fieldLabel = field?.label || currentField?.fieldId || 'Unknown';
    
    if (isStopped) {
      return `
        <div class="ed-form-fill-step">
          <h4>⏹ Stopped</h4>
          <p>Form filling was stopped. ${currentFieldIndex} of ${totalFields} fields completed.</p>
        </div>
      `;
    }
    
    // Next action preview (for step mode)
    const nextAction = plan?.actions[currentFieldIndex];
    const nextField = nextAction ? this.state.schema?.fields.find(f => f.id === nextAction.fieldId) : null;
    const nextFieldLabel = nextField?.label || nextAction?.fieldId || 'Unknown';
    const nextActionDesc = nextAction ? `${this.getActionDescription(nextAction)} "${nextAction.value}"` : '';
    
    return `
      <div class="ed-form-fill-step">
        <div class="ed-form-fill-progress">
          <div class="ed-form-fill-progress-bar">
            <div class="ed-form-fill-progress-fill" style="width: ${(currentFieldIndex / totalFields) * 100}%"></div>
          </div>
          <div class="ed-form-fill-progress-text">
            Action ${currentFieldIndex + 1} of ${totalFields}
          </div>
        </div>
        ${currentAction ? `
          <div class="ed-form-fill-current-field">
            <strong>Current:</strong> ${fieldLabel}
            ${lastActionStatus ? ` <span class="ed-form-fill-status-${lastActionStatus}">(${lastActionStatus})</span>` : ''}
          </div>
        ` : ''}
        ${isStepMode && nextAction ? `
          <div class="ed-form-fill-next-action">
            <strong>Next:</strong> ${nextActionDesc} in "${nextFieldLabel}"
          </div>
        ` : ''}
        ${isPaused ? `
          <div class="ed-form-fill-paused-notice">
            ⏸ Paused${isStepMode ? ' - Press "Next step" or Enter to continue' : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Get action description
   */
  private getActionDescription(action: FillAction): string {
    switch (action.type) {
      case 'fill_text':
      case 'fill_textarea':
        return 'Fill';
      case 'select_option':
        return 'Select';
      case 'check':
        return 'Check';
      case 'uncheck':
        return 'Uncheck';
      case 'select_radio':
        return 'Select radio';
      case 'fill_date':
        return 'Fill date';
      case 'typeahead_select':
        return 'Select from typeahead';
      default:
        return 'Execute';
    }
  }
  
  /**
   * Render vision fallback prompt
   */
  private renderVisionFallbackPrompt(): string {
    const blockedCount = this.state.plan?.actions.filter(a => (a.confidence ?? 1.0) < 0.60).length || 0;
    const unmappedCount = this.state.plan?.unmappedFields.length || 0;
    
    return `
      <div class="ed-form-fill-vision-prompt">
        <h4>Vision Fallback Available</h4>
        <p>
          Some fields couldn't be mapped reliably:
        </p>
        <ul>
          ${blockedCount > 0 ? `<li><strong>${blockedCount}</strong> fields blocked (low confidence)</li>` : ''}
          ${unmappedCount > 0 ? `<li><strong>${unmappedCount}</strong> fields unmapped</li>` : ''}
        </ul>
        <p>
          Would you like to use vision fallback to recognize these fields from a screenshot?
        </p>
        <div class="ed-form-fill-vision-options">
          <button id="ed-form-fill-vision-yes" class="ed-form-fill-btn ed-form-fill-btn-primary">
            Use Vision (Once)
          </button>
          <button id="ed-form-fill-vision-no" class="ed-form-fill-btn">
            Continue Without
          </button>
          <button id="ed-form-fill-vision-cancel" class="ed-form-fill-btn">
            Cancel
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render IMPACT stage
   */
  private renderImpactStage(): string {
    const { executionResult, plan } = this.state;
    if (!executionResult) return '';
    
    const succeeded = executionResult.succeeded.length;
    const failed = executionResult.failed.length;
    const skipped = executionResult.skipped.length;
    const total = (plan?.actions.length || 0);
    
    // Get skipped fields that need manual input
    const skippedFields = executionResult.failed
      .map(f => {
        const action = plan?.actions.find(a => a.id === f.actionId);
        const field = action ? this.state.schema?.fields.find(f => f.id === action.fieldId) : null;
        return field?.label || action?.fieldId || f.actionId;
      })
      .filter((label, index, self) => self.indexOf(label) === index);
    
    return `
      <div class="ed-form-fill-impact">
        <div class="ed-form-fill-impact-summary">
          <h4>Results Summary</h4>
          <div class="ed-form-fill-impact-stats">
            <div class="ed-form-fill-impact-stat success">
              <strong>${succeeded}</strong> succeeded
            </div>
            <div class="ed-form-fill-impact-stat failed">
              <strong>${failed}</strong> failed
            </div>
            <div class="ed-form-fill-impact-stat skipped">
              <strong>${skipped}</strong> skipped
            </div>
          </div>
        </div>
        
        <div class="ed-form-fill-impact-message">
          <strong>✓ Nothing was submitted.</strong> Review the form and submit manually when ready.
        </div>
        
        ${skippedFields.length > 0 ? `
          <div class="ed-form-fill-impact-skipped">
            <strong>Fields needing manual input:</strong>
            <ul>
              ${skippedFields.map(field => `<li>${field}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${executionResult.failed.length > 0 ? `
          <div class="ed-form-fill-impact-errors">
            <strong>Errors:</strong>
            <ul>
              ${executionResult.failed.map(f => `<li>${f.actionId}: ${f.error}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Render footer buttons
   */
  private renderFooter(): string {
    const { stage, step, plan } = this.state;
    
    switch (stage) {
      case 'intent':
        if (step === 'input') {
          return `
            <button id="ed-form-fill-next" class="ed-form-fill-btn ed-form-fill-btn-primary">Next →</button>
            <button id="ed-form-fill-cancel" class="ed-form-fill-btn">Cancel</button>
          `;
        }
        if (step === 'preview') {
          const blockedCount = plan?.actions.filter(a => (a.confidence ?? 1.0) < 0.60).length || 0;
          const hasBlocked = blockedCount > 0;
          
          return `
            <button 
              id="ed-form-fill-approve" 
              class="ed-form-fill-btn ed-form-fill-btn-primary"
              ${hasBlocked ? 'disabled title="Some fields are blocked"' : ''}
            >
              Approve (Enter)
            </button>
            <button id="ed-form-fill-review" class="ed-form-fill-btn">Review Fields</button>
            <button id="ed-form-fill-cancel" class="ed-form-fill-btn">Cancel (Esc)</button>
          `;
        }
        return '';
      
      case 'implementation':
        const { isPaused, isStopped, isStepMode } = this.state;
        if (isStopped) {
          return `
            <button id="ed-form-fill-close" class="ed-form-fill-btn ed-form-fill-btn-primary">Close</button>
          `;
        }
        if (isPaused && isStepMode) {
          return `
            <div class="ed-form-fill-control-bar">
              <button id="ed-form-fill-step-next" class="ed-form-fill-btn ed-form-fill-btn-primary">
                Next Step (Enter)
              </button>
              <button id="ed-form-fill-stop" class="ed-form-fill-btn ed-form-fill-btn-danger">⏹ Stop (S)</button>
            </div>
          `;
        }
        return `
          <div class="ed-form-fill-control-bar">
            <button id="ed-form-fill-step-toggle" class="ed-form-fill-btn" title="Toggle step mode">
              ${isStepMode ? '⚡ Step Mode ON' : '⚡ Step Mode OFF'}
            </button>
            <button id="ed-form-fill-pause" class="ed-form-fill-btn">
              ${isPaused ? '▶ Resume (P)' : '⏸ Pause (P)'}
            </button>
            <button id="ed-form-fill-stop" class="ed-form-fill-btn ed-form-fill-btn-danger">⏹ Stop (S)</button>
          </div>
        `;
      
      case 'impact':
        return `
          ${isDevMode() ? '<button id="ed-form-fill-report-issue" class="ed-form-fill-btn">Report Issue</button>' : ''}
          <button id="ed-form-fill-copy-report" class="ed-form-fill-btn">Copy Report</button>
          <button id="ed-form-fill-rescan" class="ed-form-fill-btn">Re-scan</button>
          <button id="ed-form-fill-close" class="ed-form-fill-btn ed-form-fill-btn-primary">Close</button>
        `;
      
      default:
        return '';
    }
  }
  
  /**
   * Bind event handlers
   */
  private bindEvents(): void {
    // Close button
    const closeBtn = this.container?.querySelector('.ed-form-fill-close');
    closeBtn?.addEventListener('click', () => this.hide());
    
    // Cancel button
    const cancelBtn = this.container?.querySelector('#ed-form-fill-cancel');
    cancelBtn?.addEventListener('click', () => this.hide());
    
    // Parse button
    const parseBtn = this.container?.querySelector('#ed-form-fill-parse');
    parseBtn?.addEventListener('click', () => this.parseInput());
    
    // Next button
    const nextBtn = this.container?.querySelector('#ed-form-fill-next');
    nextBtn?.addEventListener('click', () => this.createPlan());
    
    // Approve button
    const approveBtn = this.container?.querySelector('#ed-form-fill-approve');
    approveBtn?.addEventListener('click', () => this.approvePlan());
    
    // Review button
    const reviewBtn = this.container?.querySelector('#ed-form-fill-review');
    reviewBtn?.addEventListener('click', () => {
      // Scroll to first blocked field
      const firstBlocked = this.container?.querySelector('.confidence-blocked');
      firstBlocked?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    // Confirm field buttons
    const confirmButtons = this.container?.querySelectorAll('.ed-form-fill-confirm-btn');
    confirmButtons?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actionId = (e.target as HTMLElement).dataset.actionId;
        if (actionId) {
          this.confirmField(actionId);
        }
      });
    });
    
    // Pause button
    const pauseBtn = this.container?.querySelector('#ed-form-fill-pause');
    pauseBtn?.addEventListener('click', () => this.togglePause());
    
    // Stop button
    const stopBtn = this.container?.querySelector('#ed-form-fill-stop');
    stopBtn?.addEventListener('click', () => this.stopExecution());
    
    // Step mode toggle
    const stepToggleBtn = this.container?.querySelector('#ed-form-fill-step-toggle');
    stepToggleBtn?.addEventListener('click', () => this.toggleStepMode());
    
    // Next step button (step mode)
    const stepNextBtn = this.container?.querySelector('#ed-form-fill-step-next');
    stepNextBtn?.addEventListener('click', () => this.resumeFromStep());
    
    // Vision fallback buttons
    const visionYesBtn = this.container?.querySelector('#ed-form-fill-vision-yes');
    visionYesBtn?.addEventListener('click', () => this.useVisionFallback());
    
    const visionNoBtn = this.container?.querySelector('#ed-form-fill-vision-no');
    visionNoBtn?.addEventListener('click', () => {
      this.state.visionFallbackRequested = false;
      this.update();
    });
    
    const visionCancelBtn = this.container?.querySelector('#ed-form-fill-vision-cancel');
    visionCancelBtn?.addEventListener('click', () => this.hide());
    
    // Copy report button
    const copyBtn = this.container?.querySelector('#ed-form-fill-copy-report');
    copyBtn?.addEventListener('click', () => this.copyReport());
    
    // Re-scan button
    const rescanBtn = this.container?.querySelector('#ed-form-fill-rescan');
    rescanBtn?.addEventListener('click', () => {
      this.state.stage = 'intent';
      this.state.step = 'scan';
      this.state.plan = null;
      this.state.executionResult = null;
      this.update();
      this.scanForm();
    });
    
    // Close button (impact)
    const closeImpactBtn = this.container?.querySelector('#ed-form-fill-close');
    closeImpactBtn?.addEventListener('click', () => this.hide());
    
    // Report issue button (dev only)
    const reportIssueBtn = this.container?.querySelector('#ed-form-fill-report-issue');
    reportIssueBtn?.addEventListener('click', () => this.reportIssue());
  }
  
  /**
   * Bind keyboard shortcuts
   */
  private bindKeyboard(): void {
    const handler = (e: KeyboardEvent) => {
      if (this.state.stage === 'intent' && this.state.step === 'preview') {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const approveBtn = this.container?.querySelector('#ed-form-fill-approve') as HTMLButtonElement;
          if (approveBtn && !approveBtn.disabled) {
            this.approvePlan();
          }
        }
      }
      
      if (this.state.stage === 'implementation') {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          this.stopExecution();
        }
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          this.togglePause();
        }
        if ((e.key === 'Enter' || e.key === 'Return') && this.state.isPaused && this.state.isStepMode) {
          e.preventDefault();
          this.resumeFromStep();
        }
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hide();
      }
    };
    
    document.addEventListener('keydown', handler);
    this.keyboardHandlers.set('keydown', handler);
  }
  
  /**
   * Unbind keyboard shortcuts
   */
  private unbindKeyboard(): void {
    this.keyboardHandlers.forEach((handler, event) => {
      document.removeEventListener(event, handler);
    });
    this.keyboardHandlers.clear();
  }
  
  /**
   * Scan form
   */
  private async scanForm(): Promise<void> {
    try {
      const formSkill = await getFormSkill();
      const schema = formSkill.domSnapshot();
      this.state.schema = schema;
      this.state.step = 'input';
      this.update();
    } catch (error) {
      this.state.errors.push(`Scan failed: ${error instanceof Error ? error.message : String(error)}`);
      this.update();
    }
  }
  
  /**
   * Parse input data
   */
  private parseInput(): void {
    const input = this.container?.querySelector('#ed-form-fill-input') as HTMLTextAreaElement;
    if (!input) return;
    
    const text = input.value.trim();
    if (!text && !this.state.demoMode) {
      this.state.errors.push('Please enter data');
      this.update();
      return;
    }
    
    try {
      let data: InputData;
      if (this.state.demoMode && !text) {
        data = JSON.parse(this.getDemoData());
      } else {
        // Try JSON first
        try {
          data = JSON.parse(text);
        } catch {
          // Try CSV
          data = this.parseCSV(text);
        }
      }
      
      this.state.inputData = data;
      this.state.errors = [];
      this.state.step = 'plan';
      this.update();
      this.createPlan();
    } catch (error) {
      this.state.errors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
      this.update();
    }
  }
  
  /**
   * Get demo data
   */
  private getDemoData(): string {
    return JSON.stringify({
      'First Name': 'John',
      'Last Name': 'Doe',
      'Date of Birth': '2010-01-15',
      'Email': 'john.doe@example.com',
    }, null, 2);
  }
  
  /**
   * Parse CSV text
   */
  private parseCSV(text: string): InputData {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const values = lines[1].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    const data: InputData = {};
    headers.forEach((header, i) => {
      data[header] = values[i] || '';
    });
    
    return data;
  }
  
  /**
   * Create fill plan
   */
  private async createPlan(): Promise<void> {
    if (!this.state.schema) return;
    
    try {
      const formSkill = await getFormSkill();
      
      // Try LLM planning first
      let plan: FillPlan;
      try {
        plan = await formSkill.planFill(this.state.schema, this.state.inputData, this.apiKey);
      } catch (error) {
        // Fallback to simple matching
        console.warn('LLM planning failed, using simple matching:', error);
        plan = formSkill.planFillSimple(this.state.schema, this.state.inputData);
      }
      
      // Validate plan
      const validation = formSkill.validate(plan.actions);
      
      this.state.plan = plan;
      this.state.validation = validation;
      this.state.errors = validation.errors.map((e: any) => e.message);
      this.state.warnings = validation.warnings.map((w: any) => w.message);
      
      // Check if vision fallback should be offered
      const blockedCount = plan.actions.filter(a => (a.confidence ?? 1.0) < 0.60).length;
      const unmappedCount = plan.unmappedFields.length;
      
      if ((blockedCount > 0 || unmappedCount > 0) && !this.state.visionFallbackUsed) {
        this.state.visionFallbackRequested = true;
      }
      
      this.state.step = 'preview';
      this.update();
    } catch (error) {
      this.state.errors.push(`Planning failed: ${error instanceof Error ? error.message : String(error)}`);
      this.state.step = 'input';
      this.update();
    }
  }
  
  /**
   * Confirm field (remove requiresConfirmation flag)
   */
  private confirmField(actionId: string): void {
    if (!this.state.plan) return;
    
    const action = this.state.plan.actions.find(a => a.id === actionId);
    if (action) {
      action.requiresConfirmation = false;
      this.update();
    }
  }
  
  /**
   * Approve plan and start execution
   */
  private async approvePlan(): Promise<void> {
    if (!this.state.plan) return;
    
    // Check for blocked fields
    const blocked = this.state.plan.actions.filter(a => (a.confidence ?? 1.0) < 0.60);
    if (blocked.length > 0) {
      this.state.errors.push(`${blocked.length} field(s) are blocked and cannot be filled automatically.`);
      this.update();
      return;
    }
    
    // Log audit entry
    const gatedCount = this.state.plan.actions.filter(a => a.requiresConfirmation).length;
    const blockedCount = this.state.plan.actions.filter(a => (a.confidence ?? 1.0) < 0.60).length;
    
    // Start execution
    this.state.stage = 'implementation';
    this.state.step = 'executing';
    this.state.currentFieldIndex = 0;
    this.state.isPaused = false;
    this.state.isStopped = false;
    this.executionStartTime = Date.now();
    this.executionEndTime = null;
    this.update();
    
    // Create overlay
    this.createExecutionOverlay();
    
    // Print diagnostics (dev mode)
    if (isDevMode()) {
      const report = generateDiagnosticReport(
        this.state.schema,
        this.state.plan,
        this.state.validation,
        null,
        this.executionStartTime
      );
      printDiagnosticReport(report);
    }
    
    // Execute
    await this.executePlan();
  }
  
  /**
   * Create execution overlay
   */
  private createExecutionOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'ed-form-fill-execution-overlay';
    this.overlay.innerHTML = `
      <div class="ed-form-fill-execution-glow"></div>
    `;
    document.body.appendChild(this.overlay);
  }
  
  /**
   * Execute fill plan with interruptible runner
   */
  private async executePlan(): Promise<void> {
    if (!this.state.plan) return;
    
    const formContainer = document.querySelector('form') || document.body;
    let abortReason: 'rerender' | 'user_stop' | 'mismatch' | 'timeout' | undefined;
    
    try {
      // Create runner
      this.runner = new ActionRunner(formContainer as HTMLElement, {
        onProgress: (action, index, status) => {
          this.currentAction = action;
          this.state.currentFieldIndex = index;
          this.lastActionStatus = status;
          this.highlightActiveField(action);
          this.update();
        },
        onPause: () => {
          this.state.isPaused = true;
          this.state.step = 'paused';
          this.logAuditEvent('pause');
          this.update();
        },
        onResume: () => {
          this.state.isPaused = false;
          this.state.step = 'executing';
          this.logAuditEvent('resume');
          this.update();
        },
        onStop: () => {
          this.state.isStopped = true;
          this.state.step = 'stopped';
          abortReason = 'user_stop';
          this.logAuditEvent('stop');
          this.update();
        },
      });
      
      // Set step mode
      this.runner.setStepMode(this.state.isStepMode);
      
      // Execute
      const result = await this.runner.run(this.state.plan.actions);
      
      this.state.executionResult = result;
      this.executionEndTime = Date.now();
      
      // Check for form re-render abort
      if (result.failed.some(f => f.error.includes('re-rendered'))) {
        abortReason = 'rerender';
      }
      
      // Print diagnostics (dev mode)
      if (isDevMode()) {
        const report = generateDiagnosticReport(
          this.state.schema,
          this.state.plan,
          this.state.validation,
          result,
          this.executionStartTime || undefined,
          this.executionEndTime
        );
        printDiagnosticReport(report);
      }
      
      // Log audit entry
      await this.logAuditEntry(result, abortReason);
      
      // Move to impact stage
      this.state.stage = 'impact';
      this.state.step = 'complete';
      this.removeActiveFieldHighlight();
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
      this.update();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('aborted') || errorMessage.includes('stopped')) {
        abortReason = 'user_stop';
      } else if (errorMessage.includes('re-rendered')) {
        abortReason = 'rerender';
      } else if (errorMessage.includes('mismatch')) {
        abortReason = 'mismatch';
      }
      
      this.state.errors.push(`Execution failed: ${errorMessage}`);
      
      // If stopped, show stopped state
      if (this.state.isStopped) {
        this.state.stage = 'implementation';
        this.state.step = 'stopped';
      } else {
        this.state.stage = 'intent';
        this.state.step = 'preview';
      }
      
      this.removeActiveFieldHighlight();
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
      this.update();
    }
  }
  
  /**
   * Highlight active field
   */
  private highlightActiveField(action: FillAction): void {
    this.removeActiveFieldHighlight();
    
    const element = document.querySelector(action.selector) as HTMLElement;
    if (!element) return;
    
    // Create highlight overlay
    const rect = element.getBoundingClientRect();
    this.activeFieldHighlight = document.createElement('div');
    this.activeFieldHighlight.className = 'ed-form-fill-active-field-highlight';
    this.activeFieldHighlight.style.cssText = `
      position: fixed;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 3px solid #059669;
      border-radius: 4px;
      pointer-events: none;
      z-index: 2147483645;
      animation: pulse-highlight 1s ease-in-out infinite;
      box-shadow: 0 0 20px rgba(5, 150, 105, 0.5);
    `;
    document.body.appendChild(this.activeFieldHighlight);
  }
  
  /**
   * Toggle step mode
   */
  private toggleStepMode(): void {
    this.state.isStepMode = !this.state.isStepMode;
    if (this.runner) {
      this.runner.setStepMode(this.state.isStepMode);
    }
    this.logAuditEvent(this.state.isStepMode ? 'step_mode_on' : 'step_mode_off');
    this.update();
  }
  
  /**
   * Resume from step pause
   */
  private resumeFromStep(): void {
    if (this.runner) {
      this.runner.resume();
      this.logAuditEvent('step_advance');
    }
  }
  
  /**
   * Use vision fallback
   */
  private async useVisionFallback(): Promise<void> {
    this.state.visionFallbackRequested = false;
    this.state.step = 'plan';
    this.update();
    
    try {
      const formSkill = await getFormSkill();
      
      // Capture screenshot
      const screenshot = await formSkill.captureFormScreenshot();
      
      // Recognize fields with vision
      const visionFields = await formSkill.recognizeFieldsWithVision(screenshot, this.apiKey);
      
      // Merge with existing schema
      if (this.state.schema) {
        // Add vision fields to schema
        this.state.schema.fields = [...this.state.schema.fields, ...visionFields];
        
        // Re-plan with enhanced schema
        let plan: FillPlan;
        try {
          plan = await formSkill.planFill(this.state.schema, this.state.inputData, this.apiKey);
        } catch {
          plan = formSkill.planFillSimple(this.state.schema, this.state.inputData);
        }
        
        // Re-validate
        const validation = formSkill.validate(plan.actions);
        
        this.state.plan = plan;
        this.state.validation = validation;
        this.state.visionFallbackUsed = true;
        this.state.errors = validation.errors.map((e: any) => e.message);
        this.state.warnings = validation.warnings.map((w: any) => w.message);
        this.state.step = 'preview';
        
        // Log vision fallback usage
        this.logAuditEvent('vision_fallback_used');
        
        this.update();
      }
    } catch (error) {
      this.state.errors.push(`Vision fallback failed: ${error instanceof Error ? error.message : String(error)}`);
      this.state.step = 'preview';
      this.update();
    }
  }
  
  /**
   * Toggle pause
   */
  private togglePause(): void {
    if (!this.runner) return;
    
    if (this.state.isPaused) {
      this.runner.resume();
    } else {
      this.runner.pause();
    }
  }
  
  /**
   * Stop execution
   */
  private stopExecution(): void {
    if (this.runner) {
      this.runner.stop();
    }
    this.removeActiveFieldHighlight();
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
  
  /**
   * Remove active field highlight
   */
  private removeActiveFieldHighlight(): void {
    if (this.activeFieldHighlight) {
      this.activeFieldHighlight.remove();
      this.activeFieldHighlight = null;
    }
  }
  
  /**
   * Report issue (dev only)
   */
  private async reportIssue(): Promise<void> {
    if (!isDevMode()) return;
    
    const report = generateDiagnosticReport(
      this.state.schema,
      this.state.plan,
      this.state.validation,
      this.state.executionResult,
      this.executionStartTime || undefined,
      this.executionEndTime || undefined
    );
    
    const bundle = createRedactedDebugBundle(
      this.state.schema,
      this.state.plan,
      this.state.validation,
      this.state.executionResult,
      report
    );
    
    const success = await copyDebugBundleToClipboard(bundle);
    
    // Show feedback
    const reportBtn = this.container?.querySelector('#ed-form-fill-report-issue') as HTMLButtonElement;
    if (reportBtn) {
      const originalText = reportBtn.textContent;
      reportBtn.textContent = success ? '✓ Copied!' : '✗ Failed';
      setTimeout(() => {
        if (reportBtn) reportBtn.textContent = originalText;
      }, 2000);
    }
    
    if (success) {
      console.log('[Form Fill] Debug bundle copied to clipboard. Paste it in your issue report.');
    }
  }
  
  /**
   * Copy report
   */
  private async copyReport(): Promise<void> {
    const { executionResult, plan } = this.state;
    if (!executionResult || !plan) return;
    
    const report = `Form Fill Report
================
Succeeded: ${executionResult.succeeded.length}
Failed: ${executionResult.failed.length}
Skipped: ${executionResult.skipped.length}

Nothing was submitted. Review the form and submit manually when ready.`;
    
    await navigator.clipboard.writeText(report);
    
    // Show feedback
    const copyBtn = this.container?.querySelector('#ed-form-fill-copy-report') as HTMLButtonElement;
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        if (copyBtn) copyBtn.textContent = originalText;
      }, 2000);
    }
  }
  
  /**
   * Log audit event (pause, resume, step, etc.)
   */
  private async logAuditEvent(event: 'pause' | 'resume' | 'stop' | 'step_advance' | 'step_mode_on' | 'step_mode_off' | 'vision_fallback_used'): Promise<void> {
    // Events are logged as part of the main audit entry
    // This is a placeholder for future event-level logging if needed
  }
  
  /**
   * Log audit entry
   */
  private async logAuditEntry(result: ExecutionResult, abortReason?: 'rerender' | 'user_stop' | 'mismatch' | 'timeout'): Promise<void> {
    if (!this.state.plan) return;
    
    const gatedCount = this.state.plan.actions.filter(a => a.requiresConfirmation).length;
    const blockedCount = this.state.plan.actions.filter(a => (a.confidence ?? 1.0) < 0.60).length;
    
    const executionResults = this.state.plan.actions.map(action => {
      const field = this.state.schema?.fields.find(f => f.id === action.fieldId);
      const fieldLabel = field?.label || action.fieldId;
      
      let status: 'succeeded' | 'failed' | 'skipped' = 'skipped';
      if (result.succeeded.includes(action.id)) {
        status = 'succeeded';
      } else if (result.failed.some(f => f.actionId === action.id)) {
        status = 'failed';
      }
      
      return { fieldLabel, status };
    });
    
    await saveAuditLog({
      timestamp: Date.now(),
      hostname: getCleanHostname(),
      consentGiven: true,
      planCounts: {
        total: this.state.plan.actions.length,
        gated: gatedCount,
        blocked: blockedCount,
      },
      executionResults,
      abortReason,
      visionFallbackUsed: this.state.visionFallbackUsed,
      stepModeUsed: this.state.isStepMode,
    });
  }
  
  /**
   * Update dialog
   */
  private update(): void {
    if (!this.container) return;
    
    const content = this.container.querySelector('.ed-form-fill-content');
    const footer = this.container.querySelector('.ed-form-fill-footer');
    const header = this.container.querySelector('.ed-form-fill-header h3');
    
    if (content) {
      content.innerHTML = this.renderStage();
    }
    
    if (footer) {
      footer.innerHTML = this.renderFooter();
    }
    
    if (header) {
      header.textContent = this.getStageTitle();
    }
    
    // Update dialog class
    this.container.className = `ed-form-fill-dialog ed-form-fill-stage-${this.state.stage}`;
    
    // Re-bind events
    this.bindEvents();
  }
}

/**
 * Inject CSS styles
 */
export function injectFormFillStyles(): void {
  if (document.getElementById('ed-form-fill-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'ed-form-fill-styles';
  style.textContent = `
    .ed-form-fill-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .ed-form-fill-dialog {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    
    .ed-form-fill-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .ed-form-fill-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .ed-form-fill-browser-support {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #6b7280;
      cursor: help;
    }
    
    .ed-form-fill-browser-support svg {
      width: 14px;
      height: 14px;
    }
    
    .ed-form-fill-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .ed-form-fill-demo-badge {
      background: #f59e0b;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .ed-form-fill-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
    }
    
    .ed-form-fill-content {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    
    .ed-form-fill-footer {
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    
    .ed-form-fill-btn {
      padding: 10px 20px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 14px;
    }
    
    .ed-form-fill-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .ed-form-fill-btn-primary {
      background: #059669;
      color: white;
      border-color: #059669;
    }
    
    .ed-form-fill-btn-danger {
      background: #dc2626;
      color: white;
      border-color: #dc2626;
    }
    
    .ed-form-fill-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }
    
    .ed-form-fill-btn-primary:hover:not(:disabled) {
      background: #047857;
    }
    
    .ed-form-fill-btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }
    
    .ed-form-fill-control-bar {
      display: flex;
      gap: 10px;
    }
    
    #ed-form-fill-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
      resize: vertical;
      box-sizing: border-box;
    }
    
    .ed-form-fill-errors {
      margin-top: 10px;
      padding: 10px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #991b1b;
      font-size: 13px;
    }
    
    .ed-form-fill-warning {
      margin-top: 10px;
      padding: 10px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 6px;
      color: #92400e;
      font-size: 13px;
    }
    
    .ed-form-fill-preview-summary {
      margin-bottom: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .ed-form-fill-warning-text {
      color: #f59e0b;
    }
    
    .ed-form-fill-error-text {
      color: #dc2626;
    }
    
    .ed-form-fill-preview-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .ed-form-fill-preview-item {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
    }
    
    .ed-form-fill-preview-item.confidence-high {
      border-left: 4px solid #10b981;
    }
    
    .ed-form-fill-preview-item.confidence-warning {
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
    }
    
    .ed-form-fill-preview-item.confidence-blocked {
      border-left: 4px solid #ef4444;
      background: #fef2f2;
      opacity: 0.7;
    }
    
    .ed-form-fill-preview-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .ed-form-fill-preview-field-label {
      font-weight: 600;
      font-size: 14px;
    }
    
    .ed-form-fill-preview-confidence {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .confidence-high {
      background: #10b981;
      color: white;
    }
    
    .confidence-medium {
      background: #f59e0b;
      color: white;
    }
    
    .confidence-low {
      background: #ef4444;
      color: white;
    }
    
    .ed-form-fill-preview-item-value {
      margin-bottom: 8px;
      color: #6b7280;
      font-size: 13px;
    }
    
    .ed-form-fill-preview-item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    
    .ed-form-fill-preview-status {
      color: #6b7280;
    }
    
    .ed-form-fill-preview-rationale {
      color: #059669;
      cursor: help;
      text-decoration: underline;
      text-decoration-style: dotted;
    }
    
    .ed-form-fill-confirm-btn {
      padding: 4px 12px;
      font-size: 12px;
      background: #059669;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .ed-form-fill-confirm-btn:hover {
      background: #047857;
    }
    
    .ed-form-fill-progress {
      margin-bottom: 16px;
    }
    
    .ed-form-fill-progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .ed-form-fill-progress-fill {
      height: 100%;
      background: #059669;
      transition: width 0.3s ease;
    }
    
    .ed-form-fill-progress-text {
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    
    .ed-form-fill-current-field {
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    
    .ed-form-fill-paused-notice {
      text-align: center;
      padding: 12px;
      background: #fef3c7;
      border-radius: 6px;
      color: #92400e;
      font-weight: 600;
    }
    
    .ed-form-fill-execution-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 2147483646;
    }
    
    .ed-form-fill-execution-glow {
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border: 4px solid #059669;
      border-radius: 8px;
      animation: pulse-glow 2s ease-in-out infinite;
      pointer-events: none;
    }
    
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    
    .ed-form-fill-impact-summary {
      margin-bottom: 20px;
    }
    
    .ed-form-fill-impact-stats {
      display: flex;
      gap: 16px;
      margin-top: 12px;
    }
    
    .ed-form-fill-impact-stat {
      flex: 1;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }
    
    .ed-form-fill-impact-stat.success {
      background: #d1fae5;
      color: #065f46;
    }
    
    .ed-form-fill-impact-stat.failed {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .ed-form-fill-impact-stat.skipped {
      background: #fef3c7;
      color: #92400e;
    }
    
    .ed-form-fill-impact-message {
      padding: 12px;
      background: #d1fae5;
      border: 1px solid #10b981;
      border-radius: 6px;
      margin-bottom: 16px;
      color: #065f46;
    }
    
    .ed-form-fill-impact-skipped,
    .ed-form-fill-impact-errors {
      margin-top: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    
    .ed-form-fill-impact-skipped ul,
    .ed-form-fill-impact-errors ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }
    
    .ed-form-fill-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top-color: #059669;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .ed-form-fill-demo-notice {
      padding: 8px 12px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #92400e;
    }
    
    .ed-form-fill-vision-prompt {
      padding: 20px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    
    .ed-form-fill-vision-prompt h4 {
      margin-top: 0;
      margin-bottom: 12px;
    }
    
    .ed-form-fill-vision-prompt ul {
      margin: 12px 0;
      padding-left: 20px;
    }
    
    .ed-form-fill-vision-options {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }
    
    .ed-form-fill-next-action {
      padding: 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      margin-top: 12px;
      color: #1e40af;
      font-size: 13px;
    }
    
    .ed-form-fill-status-succeeded {
      color: #10b981;
      font-weight: 600;
    }
    
    .ed-form-fill-status-failed {
      color: #ef4444;
      font-weight: 600;
    }
    
    .ed-form-fill-status-skipped {
      color: #f59e0b;
      font-weight: 600;
    }
    
    .ed-form-fill-active-field-highlight {
      position: fixed;
      pointer-events: none;
      z-index: 2147483645;
    }
    
    @keyframes pulse-highlight {
      0%, 100% {
        opacity: 0.8;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.02);
      }
    }
  `;
  
  document.head.appendChild(style);
}
