// Control State Machine for Ed Form Helper
// Manages handover, interrupts, and reactivation

export type ControlState =
  | 'IDLE'       // Waiting for user, Ed is ready
  | 'ASKING'     // Ed is asking a question to the user
  | 'LISTENING'  // Ed is waiting for user's response
  | 'FILLING'    // Ed is actively filling a field
  | 'PAUSED'     // Ed was interrupted, waiting to resume
  | 'COMPLETE';  // Form is done

export type UserExperience = 'beginner' | 'learning' | 'competent' | 'expert';

export type InterruptReason = 'mouse' | 'keyboard' | 'click' | 'user_pause' | 'error';

export interface ControlStateOptions {
  /** Callback when state changes */
  onStateChange?: (state: ControlState, previousState: ControlState) => void;
  /** Callback when user interrupts */
  onInterrupt?: (reason: InterruptReason) => void;
  /** Callback when Ed needs user input */
  onUserInputNeeded?: (question: string, fieldIndex: number) => void;
  /** Callback when field is filled */
  onFieldFilled?: (fieldIndex: number, value: string) => void;
  /** Callback when form is complete */
  onComplete?: () => void;
  /** Callback for showing messages to user */
  onMessage?: (message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export interface FieldAction {
  fieldIndex: number;
  selector: string;
  value: string;
  confirmBeforeFill: boolean;
}

export interface UserConfidence {
  sessionsCompleted: number;
  averageInterruptions: number;
  successfulCompletions: number;
  needsHelpRequests: number;
  score: number;
}

/**
 * Control State Machine
 *
 * Manages the interaction between Ed and the user during form filling.
 * Handles graceful handover when user takes control.
 */
export class ControlStateMachine {
  private state: ControlState = 'IDLE';
  private previousState: ControlState = 'IDLE';
  private options: ControlStateOptions;
  private confidence: UserConfidence;
  private currentFieldIndex: number = 0;
  private totalFields: number = 0;
  private interruptCount: number = 0;
  private lastInterruptTime: number = 0;
  private fieldQueue: FieldAction[] = [];
  private filledValues: Map<number, string> = new Map();
  private userLanguage: string = 'en';

  // Debounce for rapid interrupts
  private interruptDebounceMs: number = 500;
  private isProcessing: boolean = false;

  constructor(options: ControlStateOptions = {}) {
    this.options = options;
    this.confidence = this.loadConfidence();
  }

  /**
   * Get current state
   */
  getState(): ControlState {
    return this.state;
  }

  /**
   * Get user experience level based on confidence
   */
  getUserExperience(): UserExperience {
    if (this.confidence.score < 20) return 'beginner';
    if (this.confidence.score < 50) return 'learning';
    if (this.confidence.score < 80) return 'competent';
    return 'expert';
  }

  /**
   * Get current confidence score
   */
  getConfidence(): UserConfidence {
    return { ...this.confidence };
  }

  /**
   * Start a form filling session
   */
  startSession(fieldCount: number, userLanguage: string = 'en'): void {
    this.totalFields = fieldCount;
    this.currentFieldIndex = 0;
    this.userLanguage = userLanguage;
    this.interruptCount = 0;
    this.fieldQueue = [];
    this.filledValues.clear();
    this.isProcessing = false;

    const experience = this.getUserExperience();

    if (experience === 'beginner') {
      this.transitionTo('ASKING');
      this.options.onMessage?.(
        this.getMessage('firstTimeIntro'),
        'info'
      );
    } else {
      this.transitionTo('ASKING');
    }
  }

  /**
   * Queue a field to be filled
   */
  queueField(action: FieldAction): void {
    this.fieldQueue.push(action);
  }

  /**
   * Process next field in queue
   */
  async processNextField(): Promise<boolean> {
    if (this.fieldQueue.length === 0) {
      this.completeForm();
      return false;
    }

    const action = this.fieldQueue.shift()!;
    this.currentFieldIndex = action.fieldIndex;

    // Should we ask user to confirm?
    const experience = this.getUserExperience();
    const shouldConfirm = action.confirmBeforeFill || experience === 'beginner';

    if (shouldConfirm) {
      this.transitionTo('ASKING');
      this.options.onUserInputNeeded?.(
        this.getMessage('confirmField', { value: action.value }),
        action.fieldIndex
      );
      this.transitionTo('LISTENING');
      return true;
    }

    // Auto-fill for experienced users
    return this.fillField(action);
  }

  /**
   * Fill a field (after confirmation or auto-fill)
   */
  async fillField(action: FieldAction): Promise<boolean> {
    this.transitionTo('FILLING');

    // Simulate filling (in real implementation, this calls FormFiller)
    await this.delay(this.getFillDelay());

    this.filledValues.set(action.fieldIndex, action.value);
    this.options.onFieldFilled?.(action.fieldIndex, action.value);

    // Move to next field
    if (this.fieldQueue.length > 0) {
      this.transitionTo('ASKING');
      this.processNextField();
    } else {
      this.completeForm();
    }

    return true;
  }

  /**
   * User confirmed the value
   */
  async onUserConfirm(fieldIndex: number): Promise<void> {
    if (this.state !== 'LISTENING') return;

    const action = this.fieldQueue.find(a => a.fieldIndex === fieldIndex);
    if (action) {
      // Remove from queue if we were waiting
      const idx = this.fieldQueue.indexOf(action);
      if (idx > -1) {
        this.fieldQueue.splice(idx, 1);
      }
      await this.fillField(action);
    }
  }

  /**
   * User wants to correct a value
   */
  onUserCorrection(fieldIndex: number, newValue: string): void {
    const action = this.fieldQueue.find(a => a.fieldIndex === fieldIndex);
    if (action) {
      action.value = newValue;
      this.options.onMessage?.(
        this.getMessage('valueUpdated'),
        'info'
      );
    }
  }

  /**
   * Handle user interrupt (mouse move, keyboard, etc.)
   */
  onInterrupt(reason: InterruptReason): void {
    const now = Date.now();

    // Debounce rapid interrupts
    if (now - this.lastInterruptTime < this.interruptDebounceMs) {
      return;
    }

    this.lastInterruptTime = now;

    // Only count interrupts during active filling
    if (this.state === 'FILLING' || this.state === 'ASKING') {
      this.interruptCount++;
    }

    // Store previous state for potential resume
    const wasActive = this.state === 'FILLING';

    this.transitionTo('PAUSED');
    this.options.onInterrupt?.(reason);

    // Show appropriate message based on experience
    const experience = this.getUserExperience();

    if (experience === 'beginner' && wasActive) {
      this.options.onMessage?.(
        this.getMessage('interruptedBeginner'),
        'warning'
      );
    } else if (wasActive) {
      this.options.onMessage?.(
        this.getMessage('interruptedExperienced'),
        'info'
      );
    }
  }

  /**
   * Resume after interrupt
   */
  resume(): boolean {
    if (this.state !== 'PAUSED') {
      return false;
    }

    this.options.onMessage?.(
      this.getMessage('resuming'),
      'info'
    );

    // Continue from where we left off
    if (this.fieldQueue.length > 0) {
      this.processNextField();
    } else {
      this.completeForm();
    }

    return true;
  }

  /**
   * User manually paused Ed
   */
  pause(): void {
    if (this.state === 'FILLING' || this.state === 'ASKING') {
      this.onInterrupt('user_pause');
    }
  }

  /**
   * Cancel the entire session
   */
  cancel(): void {
    this.transitionTo('IDLE');
    this.fieldQueue = [];
    this.filledValues.clear();
    this.updateConfidence(false); // Incomplete session
  }

  /**
   * Complete the form
   */
  private completeForm(): void {
    this.transitionTo('COMPLETE');
    this.options.onMessage?.(
      this.getMessage('complete', {
        filled: this.filledValues.size,
        total: this.totalFields
      }),
      'success'
    );
    this.updateConfidence(true);
    this.saveConfidence();
    this.options.onComplete?.();

    // Auto-reset to idle after a delay
    setTimeout(() => {
      this.transitionTo('IDLE');
    }, 3000);
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: ControlState): void {
    if (this.state === newState) return;

    this.previousState = this.state;
    this.state = newState;

    console.log(`[ControlStateMachine] ${this.previousState} → ${this.state}`);
    this.options.onStateChange?.(newState, this.previousState);
  }

  /**
   * Get localized message
   */
  private getMessage(key: string, params: Record<string, any> = {}): string {
    const messages: Record<string, Record<string, string>> = {
      en: {
        firstTimeIntro: "I'll take over now. Just watch and talk to me. I'll fill in the form for you.",
        confirmField: `Is "${params.value || ''}" correct?`,
        valueUpdated: "I've updated that value.",
        interruptedBeginner: "I noticed you moved the mouse. Do you want to take over, or should I continue?",
        interruptedExperienced: "Paused. Say 'continue' when you're ready.",
        resuming: "Great! I'll continue from where we left off.",
        complete: `All done! I filled ${params.filled} of ${params.total} fields. Please review and submit.`,
      },
      ur: {
        firstTimeIntro: "Mein ab control karunga. Bas dekhtay rahiye aur baat kijiye.",
        confirmField: `Kya "${params.value || ''}" sahi hai?`,
        valueUpdated: "Mein ne update kar diya.",
        interruptedBeginner: "Aap mouse move kar rahe hain. Kya aap khud karenge?",
        interruptedExperienced: "Ruk gaya. Jab ready hain toh boliye.",
        resuming: "Achha! Mein wahi se continue karunga.",
        complete: `Ho gaya! ${params.filled} mein se ${params.total} fields bhare. Review karke submit kar dijiye.`,
      },
      pl: {
        firstTimeIntro: "Przejmę kontrolę. Po prostu obserwuj i rozmawiaj ze mną.",
        confirmField: `Czy "${params.value || ''}" jest poprawne?`,
        valueUpdated: "Zaktualizowałem tę wartość.",
        interruptedBeginner: "Zauważyłem ruch myszą. Chcesz przejąć kontrolę?",
        interruptedExperienced: "Wstrzymano. Powiedz 'kontynuuj' gdy będziesz gotowy.",
        resuming: "Świetnie! Kontynuuję od momentu, w którym skończyliśmy.",
        complete: `Gotowe! Wypełniłem ${params.filled} z ${params.total} pól. Sprawdź i wyślij.`,
      },
    };

    return messages[this.userLanguage]?.[key] || messages['en'][key] || key;
  }

  /**
   * Get delay before filling based on experience level
   */
  private getFillDelay(): number {
    const experience = this.getUserExperience();
    switch (experience) {
      case 'beginner': return 1500;
      case 'learning': return 800;
      case 'competent': return 400;
      case 'expert': return 200;
      default: return 500;
    }
  }

  /**
   * Update user confidence based on session outcome
   */
  private updateConfidence(completed: boolean): void {
    if (completed) {
      this.confidence.sessionsCompleted++;
      this.confidence.successfulCompletions++;

      // Reduce score if many interrupts (indicates struggle)
      const avgInterruptions = this.interruptCount;
      if (avgInterruptions === 0) {
        this.confidence.score = Math.min(100, this.confidence.score + 10);
      } else if (avgInterruptions < 2) {
        this.confidence.score = Math.min(100, this.confidence.score + 5);
      } else if (avgInterruptions > 5) {
        this.confidence.score = Math.max(0, this.confidence.score - 5);
      }
    } else {
      // Incomplete session
      this.confidence.score = Math.max(0, this.confidence.score - 2);
    }

    // Cap at reasonable bounds
    this.confidence.score = Math.max(0, Math.min(100, this.confidence.score));
  }

  /**
   * Load confidence from storage
   */
  private loadConfidence(): UserConfidence {
    try {
      const stored = localStorage.getItem('ed_form_confidence');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[ControlStateMachine] Could not load confidence:', e);
    }

    return {
      sessionsCompleted: 0,
      averageInterruptions: 0,
      successfulCompletions: 0,
      needsHelpRequests: 0,
      score: 0, // Start at 0 = beginner
    };
  }

  /**
   * Save confidence to storage
   */
  private saveConfidence(): void {
    try {
      localStorage.setItem('ed_form_confidence', JSON.stringify(this.confidence));
    } catch (e) {
      console.warn('[ControlStateMachine] Could not save confidence:', e);
    }
  }

  /**
   * Reset confidence (for testing or user request)
   */
  resetConfidence(): void {
    this.confidence = {
      sessionsCompleted: 0,
      averageInterruptions: 0,
      successfulCompletions: 0,
      needsHelpRequests: 0,
      score: 0,
    };
    this.saveConfidence();
  }

  /**
   * Get current progress
   */
  getProgress(): { filled: number; total: number; percent: number } {
    const filled = this.filledValues.size;
    const total = this.totalFields;
    return {
      filled,
      total,
      percent: total > 0 ? Math.round((filled / total) * 100) : 0,
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Destroy the state machine
   */
  destroy(): void {
    this.cancel();
    this.filledValues.clear();
  }
}

/**
 * Factory function to create or get singleton instance
 */
let machineInstance: ControlStateMachine | null = null;

export function getControlStateMachine(options?: ControlStateOptions): ControlStateMachine {
  if (!machineInstance) {
    machineInstance = new ControlStateMachine(options);
  }
  return machineInstance;
}

export function resetControlStateMachine(): void {
  if (machineInstance) {
    machineInstance.destroy();
    machineInstance = null;
  }
}
