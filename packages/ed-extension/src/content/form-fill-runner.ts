/**
 * Form Fill Runner
 * Interruptible execution with pause/stop/step mode support
 */

import type { FillAction, ExecutionResult, FormVersionTracker, CapabilityProfile } from '@schoolgle/form-skill';
import { detectSystem, getCapabilityProfile, getDefaultProfile } from '@schoolgle/form-skill';

export interface RunnerState {
  isPaused: boolean;
  isStopped: boolean;
  isStepMode: boolean;
  currentActionIndex: number;
  abortController: AbortController;
  pauseResolve: (() => void) | null;
  formVersionTracker: FormVersionTracker | null;
  initialFormVersion: number;
}

export interface RunnerOptions {
  onProgress?: (action: FillAction, index: number, status: 'running' | 'succeeded' | 'failed') => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

/**
 * Interruptible action runner
 */
export class ActionRunner {
  private state: RunnerState;
  private options: RunnerOptions;
  private formContainer: HTMLElement;
  
  constructor(
    formContainer: HTMLElement,
    options: RunnerOptions = {}
  ) {
    this.formContainer = formContainer;
    this.options = options;
    
    this.state = {
      isPaused: false,
      isStopped: false,
      isStepMode: false,
      currentActionIndex: 0,
      abortController: new AbortController(),
      pauseResolve: null,
      formVersionTracker: null,
      initialFormVersion: 0,
    };
  }
  
  /**
   * Set step mode
   */
  setStepMode(enabled: boolean): void {
    this.state.isStepMode = enabled;
  }
  
  /**
   * Pause execution
   */
  pause(): void {
    if (this.state.isStopped) return;
    this.state.isPaused = true;
    this.options.onPause?.();
  }
  
  /**
   * Resume execution
   */
  resume(): void {
    if (this.state.isStopped) return;
    this.state.isPaused = false;
    if (this.state.pauseResolve) {
      this.state.pauseResolve();
      this.state.pauseResolve = null;
    }
    this.options.onResume?.();
  }
  
  /**
   * Stop execution
   */
  stop(): void {
    this.state.isStopped = true;
    this.state.isPaused = false;
    this.state.abortController.abort();
    if (this.state.pauseResolve) {
      this.state.pauseResolve();
      this.state.pauseResolve = null;
    }
    this.options.onStop?.();
  }
  
  /**
   * Wait if paused
   */
  private async waitIfPaused(): Promise<void> {
    while (this.state.isPaused && !this.state.abortController.signal.aborted) {
      await new Promise<void>(resolve => {
        this.state.pauseResolve = resolve;
      });
    }
  }
  
  /**
   * Wait for step continue (step mode)
   */
  private async waitForStepContinue(): Promise<void> {
    if (!this.state.isStepMode) return;
    
    this.state.isPaused = true;
    this.options.onPause?.();
    
    // Wait for resume (triggered by "Next step" button or Enter)
    await this.waitIfPaused();
  }
  
  /**
   * Check abort signal
   */
  private checkAbort(): void {
    if (this.state.abortController.signal.aborted) {
      throw new Error('Execution aborted by user');
    }
    if (this.state.isStopped) {
      throw new Error('Execution stopped by user');
    }
  }
  
  /**
   * Setup form version tracking
   */
  private setupFormVersionTracking(): FormVersionTracker {
    let version = 0;
    
    const observer = new MutationObserver(() => {
      version++;
    });
    
    observer.observe(this.formContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: false,
    });
    
    return {
      version,
      observer,
      container: this.formContainer,
    } as FormVersionTracker;
  }
  
  /**
   * Check form version
   */
  private checkFormVersion(): void {
    if (!this.state.formVersionTracker) return;
    
    if (this.state.formVersionTracker.version !== this.state.initialFormVersion) {
      this.stop();
      throw new Error('Form re-rendered during execution. Aborted for safety.');
    }
  }
  
  /**
   * Delay with abort/pause support
   */
  private async delay(ms: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < ms) {
      this.checkAbort();
      await this.waitIfPaused();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small chunks
    }
  }
  
  /**
   * Execute single action (imported from form-skill)
   */
  private async executeSingleAction(action: FillAction): Promise<boolean> {
    // This will be replaced with actual executeAction call
    // For now, we'll import and use the form-skill functions
    const formSkill = await this.getFormSkill();
    
    // Re-resolve element
    const element = await this.findElementWithRetry(
      action.selector,
      action.fallbackSelectors || []
    );
    
    if (!element) {
      return false;
    }
    
      // Verify fingerprint
      if (action.elementFingerprint) {
        const fingerprint = this.extractFingerprint(element);
        if (!this.verifyFingerprint(fingerprint, action.elementFingerprint)) {
          return false;
        }
      }
    
    // Scroll into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.delay(100);
    
    // Execute based on type
    const system = detectSystem(window.location.href);
    const profile = getCapabilityProfile(system) || getDefaultProfile();
    const success = await this.runAction(element, action, profile);
    
    // Verify
    if (success) {
      const verified = await this.verifyExecution(element, action, profile);
      return verified;
    }
    
    return false;
  }
  
  /**
   * Run action on element
   */
  private async runAction(
    element: HTMLElement,
    action: FillAction,
    profile: CapabilityProfile
  ): Promise<boolean> {
    // Import executeAction logic (simplified version)
    // This is a wrapper around the actual execution
    
    switch (action.type) {
      case 'fill_text':
      case 'fill_textarea':
        return this.fillText(element as HTMLInputElement | HTMLTextAreaElement, action.value);
      
      case 'select_option':
        return this.selectOption(element as HTMLSelectElement, action.value);
      
      case 'check':
        return this.checkCheckbox(element as HTMLInputElement);
      
      case 'uncheck':
        return this.uncheckCheckbox(element as HTMLInputElement);
      
      case 'select_radio':
        return this.selectRadio(element as HTMLInputElement, action.value);
      
      case 'fill_date':
        return this.fillDate(element as HTMLInputElement, action.value);
      
      case 'typeahead_select':
        return this.typeaheadSelect(element as HTMLInputElement, action.value, profile);
      
      default:
        return false;
    }
  }
  
  /**
   * Fill text
   */
  private fillText(element: HTMLInputElement | HTMLTextAreaElement, value: string): boolean {
    element.focus();
    element.value = '';
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return element.value === value;
  }
  
  /**
   * Select option
   */
  private selectOption(element: HTMLSelectElement, value: string): boolean {
    const match = Array.from(element.options).find(opt => 
      opt.value === value || opt.text.toLowerCase().includes(value.toLowerCase())
    );
    if (match) {
      element.value = match.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }
  
  /**
   * Check checkbox
   */
  private checkCheckbox(element: HTMLInputElement): boolean {
    if (element.type !== 'checkbox') return false;
    element.checked = true;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return element.checked;
  }
  
  /**
   * Uncheck checkbox
   */
  private uncheckCheckbox(element: HTMLInputElement): boolean {
    if (element.type !== 'checkbox') return false;
    element.checked = false;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return !element.checked;
  }
  
  /**
   * Select radio
   */
  private selectRadio(element: HTMLInputElement, value: string): boolean {
    if (element.type !== 'radio' || !element.name) return false;
    const radios = document.querySelectorAll<HTMLInputElement>(`input[name="${element.name}"]`);
    for (const radio of radios) {
      if (radio.value === value || radio.value.toLowerCase() === value.toLowerCase()) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }
  
  /**
   * Fill date
   */
  private fillDate(element: HTMLInputElement, value: string): boolean {
    if (element.type !== 'date') return false;
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    element.value = date.toISOString().split('T')[0];
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return element.value !== '';
  }
  
  /**
   * Typeahead select with polling and abort support
   */
  private async typeaheadSelect(
    element: HTMLInputElement,
    value: string,
    profile: CapabilityProfile
  ): Promise<boolean> {
    const pollInterval = profile.typeaheadPollInterval || 100;
    const maxWait = profile.typeaheadMaxWait || 2500;
    
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Poll for dropdown with abort/pause support
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      this.checkAbort();
      await this.waitIfPaused();
      
      const dropdown = document.querySelector('[role="listbox"], .dropdown, .autocomplete-results') as HTMLElement;
      if (dropdown && dropdown.offsetParent !== null) {
        const options = dropdown.querySelectorAll('[role="option"], li, .option');
        for (const option of options) {
          if (option.textContent?.toLowerCase().includes(value.toLowerCase())) {
            (option as HTMLElement).click();
            await this.delay(100);
            return element.value.toLowerCase().includes(value.toLowerCase());
          }
        }
        
        // Keyboard fallback
        element.focus();
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await this.delay(100);
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await this.delay(100);
        return element.value.toLowerCase().includes(value.toLowerCase());
      }
      
      await this.delay(pollInterval);
    }
    
    return element.value === value || element.value.toLowerCase().includes(value.toLowerCase());
  }
  
  /**
   * Verify execution
   */
  private async verifyExecution(element: HTMLElement, action: FillAction, profile: CapabilityProfile): Promise<boolean> {
    await this.delay(50);
    
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      if (action.type === 'fill_text' || action.type === 'fill_textarea') {
        return element.value === action.value || 
               element.value.includes(action.value) ||
               action.value.includes(element.value);
      }
      if (action.type === 'check') return element.checked === true;
      if (action.type === 'uncheck') return element.checked === false;
      if (action.type === 'fill_date') return element.value !== '';
    }
    
    if (element instanceof HTMLSelectElement && action.type === 'select_option') {
      const selected = element.options[element.selectedIndex];
      return selected?.value === action.value ||
             selected?.text.toLowerCase().includes(action.value.toLowerCase());
    }
    
    return true;
  }
  
  /**
   * Find element with retry
   */
  private async findElementWithRetry(
    selector: string,
    fallbackSelectors: string[],
    maxRetries: number = 2
  ): Promise<HTMLElement | null> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      this.checkAbort();
      await this.waitIfPaused();
      
      let element = document.querySelector(selector) as HTMLElement;
      if (element) return element;
      
      for (const fallback of fallbackSelectors) {
        element = document.querySelector(fallback) as HTMLElement;
        if (element) return element;
      }
      
      if (attempt < maxRetries - 1) {
        await this.delay(100 * (attempt + 1));
      }
    }
    
    return null;
  }
  
  /**
   * Extract fingerprint
   */
  private extractFingerprint(element: HTMLElement): any {
    const label = this.findLabel(element);
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      name: (element as HTMLInputElement).name || undefined,
      ariaLabel: element.getAttribute('aria-label') || undefined,
      labelText: label?.textContent?.trim() || undefined,
      index: this.getElementIndex(element),
    };
  }
  
  /**
   * Verify fingerprint
   */
  private verifyFingerprint(current: any, expected: any): boolean {
    if (expected.id && current.id === expected.id) return true;
    if (expected.name && current.name === expected.name) return true;
    if (current.tagName === expected.tagName && expected.labelText && current.labelText) {
      const match = current.labelText.toLowerCase().includes(expected.labelText.toLowerCase()) ||
                   expected.labelText.toLowerCase().includes(current.labelText.toLowerCase());
      if (match) return true;
    }
    return false;
  }
  
  /**
   * Find label
   */
  private findLabel(element: HTMLElement): HTMLLabelElement | null {
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`) as HTMLLabelElement;
      if (label) return label;
    }
    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel as HTMLLabelElement;
    return null;
  }
  
  /**
   * Get element index
   */
  private getElementIndex(element: HTMLElement): number {
    const parent = element.parentElement;
    if (!parent) return -1;
    const siblings = Array.from(parent.children);
    return siblings.indexOf(element);
  }
  
  /**
   * Get form skill functions
   */
  private async getFormSkill(): Promise<any> {
    try {
      return await import('@schoolgle/form-skill');
    } catch {
      return {};
    }
  }
  
  /**
   * Run actions sequentially with interrupt support
   */
  async run(actions: FillAction[]): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      succeeded: [],
      failed: [],
      skipped: [],
    };
    
    // Setup form version tracking
    this.state.formVersionTracker = this.setupFormVersionTracking();
    this.state.initialFormVersion = this.state.formVersionTracker.version;
    
    try {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        this.state.currentActionIndex = i;
        
        // Check abort
        this.checkAbort();
        
        // Check form version
        this.checkFormVersion();
        
        // Wait if paused
        await this.waitIfPaused();
        
        // Report progress (running)
        this.options.onProgress?.(action, i, 'running');
        
        try {
          // Execute action
          const success = await this.executeSingleAction(action);
          
          if (success) {
            result.succeeded.push(action.id);
            this.options.onProgress?.(action, i, 'succeeded');
          } else {
            result.failed.push({
              actionId: action.id,
              error: `Action execution failed: ${action.type}`,
            });
            this.options.onProgress?.(action, i, 'failed');
          }
        } catch (error) {
          result.failed.push({
            actionId: action.id,
            error: error instanceof Error ? error.message : String(error),
          });
          this.options.onProgress?.(action, i, 'failed');
          
          // If aborted, break
          if (error instanceof Error && error.message.includes('aborted')) {
            break;
          }
        }
        
        // If step mode, pause and wait for continue
        if (this.state.isStepMode && i < actions.length - 1) {
          await this.waitForStepContinue();
        }
        
        // Small delay between actions
        await this.delay(200);
      }
    } finally {
      // Cleanup
      if (this.state.formVersionTracker?.observer) {
        this.state.formVersionTracker.observer.disconnect();
      }
    }
    
    result.finalState = this.captureFormState();
    return result;
  }
  
  /**
   * Capture form state
   */
  private captureFormState(): Record<string, string> {
    const state: Record<string, string> = {};
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const name = element.name || element.id;
      if (name && element.type !== 'password') {
        if (element instanceof HTMLSelectElement) {
          state[name] = element.options[element.selectedIndex]?.value || '';
        } else {
          state[name] = element.value || '';
        }
      }
    });
    return state;
  }
  
  /**
   * Get current state
   */
  getState(): RunnerState {
    return { ...this.state };
  }
}

