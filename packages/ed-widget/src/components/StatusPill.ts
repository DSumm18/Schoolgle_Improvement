/**
 * Status Pill - Shows current widget state
 * Positioned at bottom: 100px, centered
 */

export type StatusState = 'ready' | 'listening' | 'thinking' | 'speaking';

export class StatusPill {
  private element: HTMLElement;
  private currentState: StatusState = 'ready';

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'status-pill';
    this.element.id = 'status-pill';
    this.element.textContent = 'Ready';
    container.appendChild(this.element);
  }

  /**
   * Update status state
   */
  public setState(state: StatusState): void {
    this.currentState = state;
    
    const labels: Record<StatusState, string> = {
      ready: 'Ready',
      listening: 'Listening...',
      thinking: 'Thinking...',
      speaking: 'Speaking...',
    };

    this.element.textContent = labels[state];
    
    // Show/hide based on state
    if (state === 'ready') {
      this.element.style.opacity = '0';
    } else {
      this.element.style.opacity = '1';
    }
  }

  /**
   * Get current state
   */
  public getState(): StatusState {
    return this.currentState;
  }

  /**
   * Show status pill
   */
  public show(): void {
    this.element.style.opacity = '1';
  }

  /**
   * Hide status pill
   */
  public hide(): void {
    this.element.style.opacity = '0';
  }
}


