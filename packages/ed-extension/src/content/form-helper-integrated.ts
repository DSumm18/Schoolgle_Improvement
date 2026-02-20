// Form Helper - Integrated control system
// Combines state machine, indicator, mouse watcher, and form filler

import { ControlStateMachine, type ControlState, type UserExperience, type InterruptReason } from './automation/control-state-machine';
import { ControlIndicator } from './automation/control-indicator';
import { MouseWatcher } from './automation/mouse-watcher';
import { FormFiller, type FormFillData } from './automation/form-filler';
import { getHighlighter } from './automation/highlighter';
import type { FormInfo, FormFieldInfo } from '@/shared/types';

export interface FormHelperOptions {
  /** User's preferred language */
  userLanguage?: string;
  /** Show visual indicator */
  showIndicator?: boolean;
  /** Indicator position */
  indicatorPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Callback when form is complete */
  onComplete?: (result: FormHelperResult) => void;
  /** Callback when user interrupts */
  onUserInterrupt?: (reason: InterruptReason) => void;
  /** Callback for logging */
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

export interface FormHelperResult {
  success: boolean;
  fieldsFilled: number;
  totalFields: number;
  interrupted: boolean;
  duration: number;
}

/**
 * Form Helper - Main orchestrator
 *
 * Coordinates the state machine, mouse watcher, form filler, and UI indicator
 * to provide a seamless form filling experience with graceful handover.
 */
export class FormHelper {
  private stateMachine: ControlStateMachine;
  private indicator: ControlIndicator;
  private mouseWatcher: MouseWatcher | null = null;
  private formFiller: FormFiller | null = null;
  private highlighter = getHighlighter();
  private options: Required<FormHelperOptions>;
  private startTime: number = 0;
  private currentForm: FormInfo | null = null;

  constructor(options: FormHelperOptions = {}) {
    this.options = {
      userLanguage: options.userLanguage ?? 'en',
      showIndicator: options.showIndicator ?? true,
      indicatorPosition: options.indicatorPosition ?? 'bottom-right',
      onComplete: options.onComplete ?? (() => {}),
      onUserInterrupt: options.onUserInterrupt ?? (() => {}),
      onLog: options.onLog ?? (() => {}),
    };

    // Initialize state machine
    this.stateMachine = new ControlStateMachine({
      onStateChange: this.handleStateChange.bind(this),
      onInterrupt: this.handleInterrupt.bind(this),
      onUserInputNeeded: this.handleUserInputNeeded.bind(this),
      onFieldFilled: this.handleFieldFilled.bind(this),
      onComplete: this.handleComplete.bind(this),
      onMessage: this.handleMessage.bind(this),
    });

    // Initialize indicator
    this.indicator = new ControlIndicator({
      position: this.options.indicatorPosition,
      showProgress: true,
      showFieldCount: true,
      onPause: this.pause.bind(this),
      onResume: this.resume.bind(this),
      onCancel: this.cancel.bind(this),
    });
  }

  /**
   * Start a form filling session
   */
  async startForm(form: FormInfo, data: FormFillData): Promise<void> {
    this.log('Starting form helper session', 'info');
    this.startTime = Date.now();
    this.currentForm = form;

    // Filter out password fields
    const safeFields = form.fields.filter(f => !f.isPassword);
    const fieldCount = safeFields.length;

    if (fieldCount === 0) {
      this.log('No fillable fields found', 'warn');
      return;
    }

    // Show indicator
    if (this.options.showIndicator) {
      this.indicator.attach();
    }

    // Start mouse watcher
    this.mouseWatcher = new MouseWatcher({
      threshold: 5,
      onUserInterrupt: () => this.stateMachine.onInterrupt('mouse'),
      showIndicator: false, // We use our own indicator
    });

    // Start state machine
    this.stateMachine.startSession(fieldCount, this.options.userLanguage);

    // Queue all fields
    for (let i = 0; i < safeFields.length; i++) {
      const field = safeFields[i];
      const value = this.findValueForField(field, data);

      if (value) {
        this.stateMachine.queueField({
          fieldIndex: i,
          selector: this.getFieldSelector(field),
          value,
          confirmBeforeFill: this.shouldConfirmField(field),
        });
      }
    }

    // Start processing
    this.mouseWatcher.start();
    await this.stateMachine.processNextField();
  }

  /**
   * Pause the form filling
   */
  pause(): void {
    this.log('Pausing form helper', 'info');
    this.mouseWatcher?.stop();
    this.stateMachine.pause();
  }

  /**
   * Resume after pause
   */
  resume(): void {
    this.log('Resuming form helper', 'info');
    this.mouseWatcher?.start();
    this.stateMachine.resume();
  }

  /**
   * Cancel the session
   */
  cancel(): void {
    this.log('Cancelling form helper', 'info');
    this.mouseWatcher?.stop();
    this.stateMachine.cancel();
    this.cleanup();

    this.options.onComplete?.({
      success: false,
      fieldsFilled: this.stateMachine.getProgress().filled,
      totalFields: this.stateMachine.getProgress().total,
      interrupted: true,
      duration: Date.now() - this.startTime,
    });
  }

  /**
   * User confirmed a field value
   */
  confirmField(fieldIndex: number): void {
    this.stateMachine.onUserConfirm(fieldIndex);
  }

  /**
   * User wants to correct a field value
   */
  correctField(fieldIndex: number, newValue: string): void {
    this.stateMachine.onUserCorrection(fieldIndex, newValue);
  }

  /**
   * Handle state changes from state machine
   */
  private handleStateChange(state: ControlState, previousState: ControlState): void {
    this.log(`State changed: ${previousState} → ${state}`, 'info');

    // Update indicator
    this.indicator.setState(state);

    // Start/stop mouse watcher based on state
    if (state === 'FILLING' || state === 'ASKING') {
      if (!this.mouseWatcher?.watching) {
        this.mouseWatcher?.start();
      }
    } else if (state === 'PAUSED' || state === 'COMPLETE') {
      this.mouseWatcher?.stop();
    }
  }

  /**
   * Handle interrupt from user
   */
  private handleInterrupt(reason: InterruptReason): void {
    this.log(`User interrupted: ${reason}`, 'info');
    this.options.onUserInterrupt?.(reason);

    // Show tooltip message
    const messages = {
      mouse: 'Paused - move mouse to stop',
      keyboard: 'Paused - you took control',
      click: 'Paused - you clicked',
      user_pause: 'Paused',
      error: 'Paused due to error',
    };
    this.indicator.showTooltip(messages[reason] || 'Paused');
  }

  /**
   * Handle request for user input
   */
  private handleUserInputNeeded(question: string, fieldIndex: number): void {
    this.log(`Asking user: ${question}`, 'info');

    // Highlight the field
    if (this.currentForm && this.currentForm.fields[fieldIndex]) {
      const field = this.currentForm.fields[fieldIndex];
      const selector = this.getFieldSelector(field);

      this.highlighter.highlight(
        `field-${fieldIndex}`,
        selector,
        { type: 'pulse', duration: 2000 }
      );

      // Update indicator with field label
      this.indicator.setCurrentField(field.label || field.name);
    }

    // Show confirmation dialog
    this.showConfirmationDialog(question, fieldIndex);
  }

  /**
   * Handle field filled
   */
  private handleFieldFilled(fieldIndex: number, value: string): void {
    this.log(`Field ${fieldIndex} filled with: ${value}`, 'info');

    // Update progress
    const progress = this.stateMachine.getProgress();
    this.indicator.setProgress(progress.filled, progress.total);

    // Clear highlight
    this.highlighter.removeHighlight(`field-${fieldIndex}`);
  }

  /**
   * Handle form complete
   */
  private handleComplete(): void {
    this.log('Form filling complete', 'info');

    const progress = this.stateMachine.getProgress();

    this.options.onComplete?.({
      success: true,
      fieldsFilled: progress.filled,
      totalFields: progress.total,
      interrupted: false,
      duration: Date.now() - this.startTime,
    });

    // Cleanup after a delay
    setTimeout(() => this.cleanup(), 5000);
  }

  /**
   * Handle message to show user
   */
  private handleMessage(message: string, type: 'info' | 'warning' | 'error' | 'success'): void {
    this.indicator.showTooltip(message, 4000);
    this.log(`Message to user: [${type}] ${message}`, 'info');
  }

  /**
   * Show confirmation dialog for field value
   */
  private showConfirmationDialog(question: string, fieldIndex: number): void {
    // Create dialog element
    const dialog = document.createElement('div');
    dialog.id = 'ed-confirmation-dialog';
    dialog.innerHTML = `
      <style>
        #ed-confirmation-dialog {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          z-index: 2147483646;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 400px;
          animation: ed-slide-up 0.3s ease;
        }
        @keyframes ed-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .ed-dialog-question {
          font-size: 15px;
          color: #1f2937;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .ed-dialog-buttons {
          display: flex;
          gap: 12px;
        }
        .ed-dialog-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ed-dialog-btn-primary {
          background: #10b981;
          color: white;
        }
        .ed-dialog-btn-primary:hover {
          background: #059669;
        }
        .ed-dialog-btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }
        .ed-dialog-btn-secondary:hover {
          background: #e5e7eb;
        }
      </style>
      <div class="ed-dialog-question">${question}</div>
      <div class="ed-dialog-buttons">
        <button class="ed-dialog-btn ed-dialog-btn-secondary" data-action="no">No, change it</button>
        <button class="ed-dialog-btn ed-dialog-btn-primary" data-action="yes">Yes, that's right</button>
      </div>
    `;

    document.body.appendChild(dialog);

    // Attach event listeners
    dialog.querySelector('[data-action="yes"]')?.addEventListener('click', () => {
      this.confirmField(fieldIndex);
      dialog.remove();
    });

    dialog.querySelector('[data-action="no"]')?.addEventListener('click', () => {
      // User wants to change - let them type
      dialog.remove();
      this.showCorrectionDialog(fieldIndex);
    });

    // Auto-remove after 30 seconds (user didn't respond)
    setTimeout(() => {
      if (dialog.parentElement) {
        dialog.remove();
        this.log('Confirmation dialog timed out', 'warn');
      }
    }, 30000);
  }

  /**
   * Show correction dialog for user to input new value
   */
  private showCorrectionDialog(fieldIndex: number): void {
    const field = this.currentForm?.fields[fieldIndex];
    if (!field) return;

    const dialog = document.createElement('div');
    dialog.id = 'ed-correction-dialog';
    dialog.innerHTML = `
      <style>
        #ed-correction-dialog {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          z-index: 2147483646;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 400px;
        }
        .ed-dialog-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .ed-dialog-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 15px;
          margin-bottom: 16px;
        }
        .ed-dialog-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .ed-dialog-buttons {
          display: flex;
          gap: 12px;
        }
        .ed-dialog-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .ed-dialog-btn-primary {
          background: #10b981;
          color: white;
        }
        .ed-dialog-btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }
      </style>
      <div class="ed-dialog-label">Enter correct value for:</div>
      <div class="ed-dialog-label" style="color: #1f2937; font-weight: 500;">${field.label || field.name}</div>
      <input type="text" class="ed-dialog-input" id="ed-correction-input" placeholder="Type the correct value..." autofocus />
      <div class="ed-dialog-buttons">
        <button class="ed-dialog-btn ed-dialog-btn-secondary" data-action="cancel">Cancel</button>
        <button class="ed-dialog-btn ed-dialog-btn-primary" data-action="save">Save</button>
      </div>
    `;

    document.body.appendChild(dialog);

    const input = dialog.querySelector('#ed-correction-input') as HTMLInputElement;
    input.focus();

    const save = () => {
      const newValue = input.value.trim();
      if (newValue) {
        this.correctField(fieldIndex, newValue);
        dialog.remove();
      }
    };

    dialog.querySelector('[data-action="save"]')?.addEventListener('click', save);
    dialog.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      dialog.remove();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') dialog.remove();
    });
  }

  /**
   * Determine if a field should be confirmed before filling
   */
  private shouldConfirmField(field: FormFieldInfo): boolean {
    const experience = this.stateMachine.getUserExperience();

    // Always confirm for beginners
    if (experience === 'beginner') return true;

    // Always confirm sensitive fields
    const sensitiveFields = ['email', 'phone', 'telephone', 'mobile'];
    if (sensitiveFields.some(s => field.name.toLowerCase().includes(s))) {
      return true;
    }

    // No confirmation for experts on simple text fields
    if (experience === 'expert' && field.type === 'text') {
      return false;
    }

    return true;
  }

  /**
   * Build CSS selector for a field
   */
  private getFieldSelector(field: FormFieldInfo): string {
    if (field.id) {
      return `#${CSS.escape(field.id)}`;
    }
    if (field.name) {
      return `[name="${CSS.escape(field.name)}"]`;
    }
    return '';
  }

  /**
   * Find value for a field from the data object
   */
  private findValueForField(field: FormFieldInfo, data: FormFillData): string | null {
    // Try exact match on id
    if (field.id && data[field.id]) {
      return data[field.id];
    }

    // Try exact match on name
    if (field.name && data[field.name]) {
      return data[field.name];
    }

    // Try fuzzy match on label
    if (field.label) {
      const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedLabel) {
          return value;
        }
      }
    }

    return null;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.mouseWatcher?.stop();
    this.mouseWatcher = null;
    this.indicator.detach();
    this.highlighter.clearAll();

    // Remove any remaining dialogs
    document.querySelector('#ed-confirmation-dialog')?.remove();
    document.querySelector('#ed-correction-dialog')?.remove();
  }

  /**
   * Destroy the form helper
   */
  destroy(): void {
    this.cleanup();
    this.stateMachine.destroy();
  }

  /**
   * Log message
   */
  private log(message: string, level: 'info' | 'warn' | 'error'): void {
    this.options.onLog(`[FormHelper] ${message}`, level);
  }

  /**
   * Get current state
   */
  getState(): ControlState {
    return this.stateMachine.getState();
  }

  /**
   * Get user experience level
   */
  getUserExperience(): UserExperience {
    return this.stateMachine.getUserExperience();
  }

  /**
   * Get progress
   */
  getProgress(): { filled: number; total: number; percent: number } {
    return this.stateMachine.getProgress();
  }
}

/**
 * Factory function
 */
export function createFormHelper(options?: FormHelperOptions): FormHelper {
  return new FormHelper(options);
}

/**
 * Singleton instance for the page
 */
let helperInstance: FormHelper | null = null;

export function getFormHelper(options?: FormHelperOptions): FormHelper {
  if (!helperInstance) {
    helperInstance = new FormHelper(options);
  }
  return helperInstance;
}

export function destroyFormHelper(): void {
  if (helperInstance) {
    helperInstance.destroy();
    helperInstance = null;
  }
}
