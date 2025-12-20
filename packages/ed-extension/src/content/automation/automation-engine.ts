// Automation Engine
// Orchestrates watch mode and act mode workflows

import { getHighlighter, Highlighter } from './highlighter';
import { Clicker } from './clicker';
import type { WatchStep, AutomationAction } from '@/shared/types';

export type AutomationMode = 'idle' | 'watch' | 'act';

export interface AutomationEngineOptions {
  onModeChange?: (mode: AutomationMode) => void;
  onStepComplete?: (stepId: string) => void;
  onInterrupt?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Automation Engine
 * Manages watch mode (highlighting) and act mode (clicking)
 */
export class AutomationEngine {
  private mode: AutomationMode = 'idle';
  private highlighter: Highlighter;
  private clicker: Clicker | null = null;
  private options: AutomationEngineOptions;
  private currentSteps: WatchStep[] = [];
  private currentActions: AutomationAction[] = [];
  private currentIndex: number = 0;
  private isPaused: boolean = false;
  
  constructor(options: AutomationEngineOptions = {}) {
    this.options = options;
    this.highlighter = getHighlighter();
  }
  
  /**
   * Get current mode
   */
  getMode(): AutomationMode {
    return this.mode;
  }
  
  /**
   * Start watch mode - highlight steps for user to follow
   */
  startWatchMode(steps: WatchStep[]): void {
    if (this.mode !== 'idle') {
      this.stop();
    }
    
    this.mode = 'watch';
    this.currentSteps = steps;
    this.currentIndex = 0;
    this.options.onModeChange?.('watch');
    
    // Show first step
    this.showCurrentStep();
    
    console.log('[Ed Automation] Watch mode started with', steps.length, 'steps');
  }
  
  /**
   * Show current step in watch mode
   */
  private showCurrentStep(): void {
    if (this.mode !== 'watch' || this.currentIndex >= this.currentSteps.length) {
      return;
    }
    
    const step = this.currentSteps[this.currentIndex];
    
    // Add step indicator with number
    this.highlighter.addStepIndicator(
      step.id,
      step.selector,
      this.currentIndex + 1,
      step.instruction
    );
  }
  
  /**
   * Move to next step in watch mode
   */
  nextStep(): void {
    if (this.mode !== 'watch') return;
    
    // Remove current highlight
    const currentStep = this.currentSteps[this.currentIndex];
    this.highlighter.removeHighlight(currentStep.id);
    
    this.options.onStepComplete?.(currentStep.id);
    
    this.currentIndex++;
    
    if (this.currentIndex >= this.currentSteps.length) {
      // All steps complete
      this.complete();
    } else {
      this.showCurrentStep();
    }
  }
  
  /**
   * Go to previous step in watch mode
   */
  prevStep(): void {
    if (this.mode !== 'watch' || this.currentIndex === 0) return;
    
    // Remove current highlight
    const currentStep = this.currentSteps[this.currentIndex];
    this.highlighter.removeHighlight(currentStep.id);
    
    this.currentIndex--;
    this.showCurrentStep();
  }
  
  /**
   * Start act mode - automatically perform actions
   */
  async startActMode(actions: AutomationAction[]): Promise<boolean> {
    if (this.mode !== 'idle') {
      this.stop();
    }
    
    this.mode = 'act';
    this.currentActions = actions;
    this.currentIndex = 0;
    this.isPaused = false;
    this.options.onModeChange?.('act');
    
    // Initialize clicker
    this.clicker = new Clicker({
      onInterrupt: () => {
        this.handleInterrupt();
      },
      onComplete: () => {
        // Action complete
      },
    });
    
    console.log('[Ed Automation] Act mode started with', actions.length, 'actions');
    
    // Execute actions sequentially
    return this.executeNextAction();
  }
  
  /**
   * Execute next action in act mode
   */
  private async executeNextAction(): Promise<boolean> {
    if (this.mode !== 'act' || this.isPaused) {
      return false;
    }
    
    if (this.currentIndex >= this.currentActions.length) {
      this.complete();
      return true;
    }
    
    const action = this.currentActions[this.currentIndex];
    
    try {
      // Highlight the element first
      this.highlighter.highlight(action.id, action.selector, {
        type: 'pulse',
        duration: 500,
      });
      
      // Wait for highlight animation
      await this.delay(action.delay || 300);
      
      if (this.mode !== 'act' || this.isPaused) return false;
      
      // Execute the action
      let success = false;
      
      switch (action.type) {
        case 'click':
          success = await this.clicker!.click(action.selector);
          break;
          
        case 'type':
          if (action.value) {
            success = await this.clicker!.type(action.selector, action.value);
          }
          break;
          
        case 'select':
          if (action.value) {
            success = await this.clicker!.select(action.selector, action.value);
          }
          break;
          
        case 'scroll':
          success = this.scrollToElement(action.selector);
          break;
          
        case 'wait':
          await this.delay(action.delay || 1000);
          success = true;
          break;
          
        default:
          console.warn('[Ed Automation] Unknown action type:', action.type);
      }
      
      if (!success) {
        throw new Error(`Action failed: ${action.type} on ${action.selector}`);
      }
      
      this.options.onStepComplete?.(action.id);
      this.currentIndex++;
      
      // Small delay between actions
      await this.delay(200);
      
      // Continue to next action
      return this.executeNextAction();
      
    } catch (error) {
      console.error('[Ed Automation] Action error:', error);
      this.options.onError?.(error as Error);
      this.stop();
      return false;
    }
  }
  
  /**
   * Scroll to an element
   */
  private scrollToElement(selector: string): boolean {
    const element = document.querySelector(selector);
    if (!element) return false;
    
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  }
  
  /**
   * Pause act mode
   */
  pause(): void {
    if (this.mode !== 'act') return;
    
    this.isPaused = true;
    this.clicker?.stop(false);
    
    console.log('[Ed Automation] Paused');
  }
  
  /**
   * Resume act mode
   */
  async resume(): Promise<boolean> {
    if (this.mode !== 'act' || !this.isPaused) return false;
    
    this.isPaused = false;
    console.log('[Ed Automation] Resumed');
    
    return this.executeNextAction();
  }
  
  /**
   * Handle user interrupt
   */
  private handleInterrupt(): void {
    console.log('[Ed Automation] User interrupted');
    
    this.mode = 'idle';
    this.highlighter.clearAll();
    this.clicker?.destroy();
    this.clicker = null;
    
    this.options.onInterrupt?.();
    this.options.onModeChange?.('idle');
  }
  
  /**
   * Complete automation
   */
  private complete(): void {
    console.log('[Ed Automation] Complete');
    
    this.mode = 'idle';
    this.highlighter.clearAll();
    this.clicker?.destroy();
    this.clicker = null;
    
    this.options.onComplete?.();
    this.options.onModeChange?.('idle');
  }
  
  /**
   * Stop automation
   */
  stop(): void {
    console.log('[Ed Automation] Stopped');
    
    this.mode = 'idle';
    this.highlighter.clearAll();
    this.clicker?.stop(false);
    this.clicker?.destroy();
    this.clicker = null;
    this.currentSteps = [];
    this.currentActions = [];
    this.currentIndex = 0;
    this.isPaused = false;
    
    this.options.onModeChange?.('idle');
  }
  
  /**
   * Get progress
   */
  getProgress(): { current: number; total: number } {
    if (this.mode === 'watch') {
      return { current: this.currentIndex, total: this.currentSteps.length };
    }
    if (this.mode === 'act') {
      return { current: this.currentIndex, total: this.currentActions.length };
    }
    return { current: 0, total: 0 };
  }
  
  /**
   * Destroy the engine
   */
  destroy(): void {
    this.stop();
    this.highlighter.destroy();
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let engineInstance: AutomationEngine | null = null;

export function getAutomationEngine(options?: AutomationEngineOptions): AutomationEngine {
  if (!engineInstance) {
    engineInstance = new AutomationEngine(options);
  }
  return engineInstance;
}

