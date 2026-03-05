// Control Indicator - Visual badge showing Ed's control state
// Floating UI element that shows form filling progress and status

import type { ControlState } from './control-state-machine';

export interface IndicatorOptions {
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Show progress bar */
  showProgress?: boolean;
  /** Show field count */
  showFieldCount?: boolean;
  /** Callback when pause clicked */
  onPause?: () => void;
  /** Callback when resume clicked */
  onResume?: () => void;
  /** Callback when cancel clicked */
  onCancel?: () => void;
}

/**
 * Control Indicator
 *
 * Floating badge that shows Ed's current state and provides controls
 */
export class ControlIndicator {
  private container: HTMLDivElement | null = null;
  private options: Required<IndicatorOptions>;
  private currentState: ControlState = 'IDLE';
  private progress: { filled: number; total: number } = { filled: 0, total: 0 };
  private currentFieldLabel: string = '';
  private isAnimating: boolean = false;

  constructor(options: IndicatorOptions = {}) {
    this.options = {
      position: options.position ?? 'bottom-right',
      showProgress: options.showProgress ?? true,
      showFieldCount: options.showFieldCount ?? true,
      onPause: options.onPause ?? (() => {}),
      onResume: options.onResume ?? (() => {}),
      onCancel: options.onCancel ?? (() => {}),
    };
  }

  /**
   * Create and attach the indicator to the page
   */
  attach(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'ed-control-indicator';
    this.updateDisplay();

    document.body.appendChild(this.container);
  }

  /**
   * Remove the indicator from the page
   */
  detach(): void {
    this.container?.remove();
    this.container = null;
  }

  /**
   * Update the control state
   */
  setState(state: ControlState): void {
    this.currentState = state;
    this.updateDisplay();
  }

  /**
   * Update progress information
   */
  setProgress(filled: number, total: number): void {
    this.progress = { filled, total };
    this.updateDisplay();
  }

  /**
   * Update current field label
   */
  setCurrentField(label: string): void {
    this.currentFieldLabel = label;
    this.updateDisplay();
  }

  /**
   * Update the entire display based on current state
   */
  private updateDisplay(): void {
    if (!this.container) return;

    const style = this.getPositionStyle();
    const content = this.getContent();

    this.container.innerHTML = `
      <style>
        #ed-control-indicator * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        #ed-control-indicator {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          z-index: 2147483647;
        }
        .ed-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }
        .ed-badge-idle {
          background: #6b7280;
          color: white;
        }
        .ed-badge-asking {
          background: #3b82f6;
          color: white;
        }
        .ed-badge-filling {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          animation: ed-pulse 1.5s infinite;
        }
        .ed-badge-paused {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
        .ed-badge-complete {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }
        @keyframes ed-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        }
        .ed-icon {
          font-size: 16px;
        }
        .ed-progress {
          margin-top: 8px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          height: 4px;
          overflow: hidden;
        }
        .ed-progress-bar {
          height: 100%;
          background: white;
          transition: width 0.3s ease;
          border-radius: 10px;
        }
        .ed-controls {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .ed-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ed-btn:hover {
          transform: scale(1.05);
        }
        .ed-btn-primary {
          background: white;
          color: #10b981;
        }
        .ed-btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        .ed-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #1f2937;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
          margin-bottom: 8px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .ed-tooltip.show {
          opacity: 1;
        }
        .ed-warning {
          color: #fef3c7;
          font-size: 11px;
          margin-top: 4px;
        }
      </style>
      <div style="${style}">
        ${content}
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Get position CSS based on configured position
   */
  private getPositionStyle(): string {
    const positions = {
      'bottom-right': 'position: fixed; bottom: 20px; right: 20px;',
      'bottom-left': 'position: fixed; bottom: 20px; left: 20px;',
      'top-right': 'position: fixed; top: 20px; right: 20px;',
      'top-left': 'position: fixed; top: 20px; left: 20px;',
    };
    return positions[this.options.position];
  }

  /**
   * Get HTML content based on current state
   */
  private getContent(): string {
    switch (this.currentState) {
      case 'IDLE':
        return this.getIdleContent();
      case 'ASKING':
        return this.getAskingContent();
      case 'LISTENING':
        return this.getListeningContent();
      case 'FILLING':
        return this.getFillingContent();
      case 'PAUSED':
        return this.getPausedContent();
      case 'COMPLETE':
        return this.getCompleteContent();
      default:
        return '';
    }
  }

  /**
   * Content for IDLE state
   */
  private getIdleContent(): string {
    return `
      <div class="ed-badge ed-badge-idle">
        <span class="ed-icon">💤</span>
        <span>Ed ready</span>
      </div>
    `;
  }

  /**
   * Content for ASKING state
   */
  private getAskingContent(): string {
    return `
      <div>
        <div class="ed-badge ed-badge-asking">
          <span class="ed-icon">👁️</span>
          <span>Ed is asking...</span>
        </div>
        ${this.getProgressHTML()}
      </div>
    `;
  }

  /**
   * Content for LISTENING state
   */
  private getListeningContent(): string {
    return `
      <div>
        <div class="ed-badge ed-badge-asking">
          <span class="ed-icon">👂</span>
          <span>Listening...</span>
        </div>
        ${this.getProgressHTML()}
      </div>
    `;
  }

  /**
   * Content for FILLING state
   */
  private getFillingContent(): string {
    return `
      <div>
        <div class="ed-badge ed-badge-filling">
          <span class="ed-icon">🎯</span>
          <span>Ed is filling...</span>
        </div>
        ${this.currentFieldLabel ? `<div class="ed-warning">Now: ${this.currentFieldLabel}</div>` : ''}
        ${this.getProgressHTML()}
        <div class="ed-controls">
          <button class="ed-btn ed-btn-secondary" data-action="pause">Pause</button>
        </div>
      </div>
    `;
  }

  /**
   * Content for PAUSED state
   */
  private getPausedContent(): string {
    const progressPercent = this.progress.total > 0
      ? Math.round((this.progress.filled / this.progress.total) * 100)
      : 0;

    return `
      <div>
        <div class="ed-badge ed-badge-paused">
          <span class="ed-icon">⏸️</span>
          <span>Paused - ${progressPercent}% done</span>
        </div>
        <div class="ed-controls">
          <button class="ed-btn ed-btn-primary" data-action="resume">Resume</button>
          <button class="ed-btn ed-btn-secondary" data-action="cancel">Cancel</button>
        </div>
      </div>
    `;
  }

  /**
   * Content for COMPLETE state
   */
  private getCompleteContent(): string {
    return `
      <div>
        <div class="ed-badge ed-badge-complete">
          <span class="ed-icon">✅</span>
          <span>Done! ${this.progress.filled}/${this.progress.total} fields</span>
        </div>
      </div>
    `;
  }

  /**
   * Get progress bar HTML
   */
  private getProgressHTML(): string {
    if (!this.options.showProgress || this.progress.total === 0) {
      return '';
    }

    const percent = Math.round((this.progress.filled / this.progress.total) * 100);

    return `
      <div class="ed-progress">
        <div class="ed-progress-bar" style="width: ${percent}%"></div>
      </div>
      ${this.options.showFieldCount ? `<div class="ed-warning">${this.progress.filled} of ${this.progress.total} fields</div>` : ''}
    `;
  }

  /**
   * Attach event listeners to buttons
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Pause button
    this.container.querySelector('[data-action="pause"]')?.addEventListener('click', () => {
      this.options.onPause();
    });

    // Resume button
    this.container.querySelector('[data-action="resume"]')?.addEventListener('click', () => {
      this.options.onResume();
    });

    // Cancel button
    this.container.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      this.options.onCancel();
    });
  }

  /**
   * Show a temporary tooltip message
   */
  showTooltip(message: string, duration: number = 3000): void {
    if (!this.container) return;

    const existing = this.container.querySelector('.ed-tooltip');
    existing?.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'ed-tooltip';
    tooltip.textContent = message;

    this.container.appendChild(tooltip);

    // Trigger reflow for animation
    requestAnimationFrame(() => {
      tooltip.classList.add('show');
    });

    setTimeout(() => {
      tooltip.classList.remove('show');
      setTimeout(() => tooltip.remove(), 200);
    }, duration);
  }

  /**
   * Animate to a new position
   */
  animateToPosition(position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'): void {
    this.options.position = position;
    if (this.container) {
      this.container.style.transition = 'all 0.5s ease';
      this.updateDisplay();
    }
  }
}

/**
 * Factory function
 */
export function createControlIndicator(options?: IndicatorOptions): ControlIndicator {
  return new ControlIndicator(options);
}
