// Element Highlighter for Watch Mode
// Highlights elements on the page to guide users

export interface HighlightOptions {
  type: 'pulse' | 'arrow' | 'box' | 'spotlight';
  color?: string;
  message?: string;
  duration?: number;
}

interface ActiveHighlight {
  element: HTMLElement;
  overlay: HTMLElement;
  cleanup: () => void;
}

/**
 * Highlighter class for Watch Mode
 */
export class Highlighter {
  private activeHighlights: Map<string, ActiveHighlight> = new Map();
  private container: HTMLDivElement | null = null;
  
  constructor() {
    this.createContainer();
  }
  
  /**
   * Create the highlight container
   */
  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'ed-highlight-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483646;
    `;
    document.body.appendChild(this.container);
    
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      .ed-highlight-pulse {
        position: absolute;
        border: 3px solid #10b981;
        border-radius: 8px;
        animation: ed-pulse 2s infinite;
        pointer-events: none;
      }
      
      @keyframes ed-pulse {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      
      .ed-highlight-box {
        position: absolute;
        border: 3px solid #3b82f6;
        border-radius: 8px;
        background: rgba(59, 130, 246, 0.1);
        pointer-events: none;
      }
      
      .ed-highlight-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border-left: 15px solid transparent;
        border-right: 15px solid transparent;
        border-top: 20px solid #10b981;
        animation: ed-bounce 1s infinite;
        pointer-events: none;
      }
      
      @keyframes ed-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      .ed-highlight-spotlight {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        pointer-events: none;
      }
      
      .ed-highlight-spotlight-hole {
        position: absolute;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        border: 3px solid #10b981;
      }
      
      .ed-highlight-message {
        position: absolute;
        background: #0f172a;
        color: #e2e8f0;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 2147483647;
      }
      
      .ed-highlight-message::before {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 20px;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid #0f172a;
      }
      
      .ed-step-indicator {
        position: absolute;
        width: 28px;
        height: 28px;
        background: #10b981;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 2px 10px rgba(16, 185, 129, 0.4);
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Highlight an element
   */
  highlight(
    id: string,
    selector: string,
    options: HighlightOptions = { type: 'pulse' }
  ): boolean {
    // Find the element
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      console.warn('[Ed Highlighter] Element not found:', selector);
      return false;
    }
    
    // Remove existing highlight for this ID
    this.removeHighlight(id);
    
    // Get element position
    const rect = element.getBoundingClientRect();
    
    // Create highlight overlay
    const overlay = document.createElement('div');
    overlay.className = `ed-highlight-${options.type}`;
    overlay.style.cssText = `
      left: ${rect.left + window.scrollX - 5}px;
      top: ${rect.top + window.scrollY - 5}px;
      width: ${rect.width + 10}px;
      height: ${rect.height + 10}px;
    `;
    
    if (options.color) {
      overlay.style.borderColor = options.color;
    }
    
    this.container?.appendChild(overlay);
    
    // Add message if provided
    let messageEl: HTMLElement | null = null;
    if (options.message) {
      messageEl = document.createElement('div');
      messageEl.className = 'ed-highlight-message';
      messageEl.textContent = options.message;
      messageEl.style.cssText = `
        left: ${rect.left + window.scrollX}px;
        top: ${rect.top + window.scrollY - 60}px;
      `;
      this.container?.appendChild(messageEl);
    }
    
    // Track the highlight
    const cleanup = () => {
      overlay.remove();
      messageEl?.remove();
    };
    
    this.activeHighlights.set(id, { element, overlay, cleanup });
    
    // Auto-remove if duration specified
    if (options.duration) {
      setTimeout(() => this.removeHighlight(id), options.duration);
    }
    
    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    return true;
  }
  
  /**
   * Add a step indicator (numbered circle)
   */
  addStepIndicator(
    id: string,
    selector: string,
    stepNumber: number,
    message?: string
  ): boolean {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      console.warn('[Ed Highlighter] Element not found for step:', selector);
      return false;
    }
    
    const rect = element.getBoundingClientRect();
    
    // Create step indicator
    const indicator = document.createElement('div');
    indicator.className = 'ed-step-indicator';
    indicator.textContent = stepNumber.toString();
    indicator.style.cssText = `
      left: ${rect.left + window.scrollX - 14}px;
      top: ${rect.top + window.scrollY - 14}px;
    `;
    
    this.container?.appendChild(indicator);
    
    // Also add a pulse highlight
    this.highlight(id, selector, { type: 'pulse', message });
    
    // Update cleanup to include indicator
    const existing = this.activeHighlights.get(id);
    if (existing) {
      const originalCleanup = existing.cleanup;
      existing.cleanup = () => {
        originalCleanup();
        indicator.remove();
      };
    }
    
    return true;
  }
  
  /**
   * Remove a specific highlight
   */
  removeHighlight(id: string): void {
    const highlight = this.activeHighlights.get(id);
    if (highlight) {
      highlight.cleanup();
      this.activeHighlights.delete(id);
    }
  }
  
  /**
   * Remove all highlights
   */
  clearAll(): void {
    for (const [id] of this.activeHighlights) {
      this.removeHighlight(id);
    }
  }
  
  /**
   * Destroy the highlighter
   */
  destroy(): void {
    this.clearAll();
    this.container?.remove();
    this.container = null;
  }
  
  /**
   * Update highlight positions (e.g., after scroll)
   */
  updatePositions(): void {
    for (const [id, highlight] of this.activeHighlights) {
      const rect = highlight.element.getBoundingClientRect();
      highlight.overlay.style.left = `${rect.left + window.scrollX - 5}px`;
      highlight.overlay.style.top = `${rect.top + window.scrollY - 5}px`;
    }
  }
}

// Listen for scroll/resize to update positions
let highlighterInstance: Highlighter | null = null;

export function getHighlighter(): Highlighter {
  if (!highlighterInstance) {
    highlighterInstance = new Highlighter();
    
    // Update positions on scroll
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        highlighterInstance?.updatePositions();
      }, 50);
    }, { passive: true });
    
    // Update positions on resize
    window.addEventListener('resize', () => {
      highlighterInstance?.updatePositions();
    }, { passive: true });
  }
  
  return highlighterInstance;
}

