// Clicker - Simulates mouse clicks for Act Mode
// Shows visual cursor and performs clicks on behalf of user

import { MouseWatcher } from './mouse-watcher';

export interface ClickerOptions {
  /** Animation duration in ms (default: 500) */
  animationDuration?: number;
  /** Delay before clicking after arriving (default: 200) */
  clickDelay?: number;
  /** Show virtual cursor (default: true) */
  showCursor?: boolean;
  /** Callback when user interrupts */
  onInterrupt?: () => void;
  /** Callback when action completes */
  onComplete?: () => void;
}

/**
 * Virtual Cursor for Act Mode
 * Animates to elements and clicks them
 */
export class Clicker {
  private cursor: HTMLDivElement | null = null;
  private mouseWatcher: MouseWatcher | null = null;
  private isActive: boolean = false;
  private currentAnimation: Animation | null = null;
  private options: Required<ClickerOptions>;
  
  constructor(options: ClickerOptions = {}) {
    this.options = {
      animationDuration: options.animationDuration ?? 500,
      clickDelay: options.clickDelay ?? 200,
      showCursor: options.showCursor ?? true,
      onInterrupt: options.onInterrupt ?? (() => {}),
      onComplete: options.onComplete ?? (() => {}),
    };
  }
  
  /**
   * Initialize the clicker
   */
  initialize(): void {
    if (this.cursor) return;
    
    // Create virtual cursor
    this.cursor = document.createElement('div');
    this.cursor.id = 'ed-automation-cursor';
    this.cursor.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        position: relative;
      ">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
        </svg>
      </div>
      <div id="ed-cursor-ripple" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 40px;
        height: 40px;
        border: 2px solid #10b981;
        border-radius: 50%;
        transform: translate(-8px, -8px);
        opacity: 0;
      "></div>
    `;
    this.cursor.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      opacity: 0;
      transform: translate(-4px, -2px);
    `;
    document.body.appendChild(this.cursor);
    
    // Initialize mouse watcher
    this.mouseWatcher = new MouseWatcher({
      onUserInterrupt: () => this.stop(true),
      showIndicator: true,
    });
    
    // Inject click animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ed-click-ripple {
        0% { transform: translate(-8px, -8px) scale(0.5); opacity: 1; }
        100% { transform: translate(-8px, -8px) scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Click on an element
   */
  async click(selector: string): Promise<boolean> {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      console.warn('[Ed Clicker] Element not found:', selector);
      return false;
    }
    
    return this.clickElement(element);
  }
  
  /**
   * Click on a specific element
   */
  async clickElement(element: HTMLElement): Promise<boolean> {
    if (this.isActive) {
      console.warn('[Ed Clicker] Already active, ignoring click request');
      return false;
    }
    
    this.initialize();
    this.isActive = true;
    
    // Start mouse watcher
    this.mouseWatcher?.start();
    
    // Get element center
    const rect = element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    
    // Show cursor
    if (this.cursor && this.options.showCursor) {
      this.cursor.style.opacity = '1';
      
      // Animate to target
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight / 2;
      
      this.cursor.style.left = `${startX}px`;
      this.cursor.style.top = `${startY}px`;
      
      // Update mouse watcher position
      this.mouseWatcher?.updatePosition(startX, startY);
      
      try {
        await this.animateTo(targetX, targetY);
        
        // Check if still active (user might have interrupted)
        if (!this.isActive) return false;
        
        // Small delay before click
        await this.delay(this.options.clickDelay);
        
        if (!this.isActive) return false;
        
        // Show click effect
        await this.showClickEffect();
        
        if (!this.isActive) return false;
        
        // Perform actual click
        this.performClick(element);
        
        // Complete
        this.stop(false);
        return true;
        
      } catch (error) {
        console.error('[Ed Clicker] Animation error:', error);
        this.stop(false);
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Type text into an element
   */
  async type(selector: string, text: string): Promise<boolean> {
    const element = document.querySelector(selector) as HTMLInputElement;
    if (!element) {
      console.warn('[Ed Clicker] Element not found:', selector);
      return false;
    }
    
    // First click to focus
    const clicked = await this.clickElement(element);
    if (!clicked) return false;
    
    // Initialize again for typing
    this.isActive = true;
    this.mouseWatcher?.start();
    
    try {
      // Type each character
      for (const char of text) {
        if (!this.isActive) return false;
        
        // Simulate keypress
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Small delay between characters
        await this.delay(50);
      }
      
      this.stop(false);
      return true;
      
    } catch (error) {
      console.error('[Ed Clicker] Typing error:', error);
      this.stop(false);
      return false;
    }
  }
  
  /**
   * Select an option in a dropdown
   */
  async select(selector: string, value: string): Promise<boolean> {
    const element = document.querySelector(selector) as HTMLSelectElement;
    if (!element) {
      console.warn('[Ed Clicker] Select element not found:', selector);
      return false;
    }
    
    // Click to focus
    const clicked = await this.clickElement(element);
    if (!clicked) return false;
    
    // Set value
    element.value = value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  /**
   * Stop the clicker
   */
  stop(interrupted: boolean): void {
    this.isActive = false;
    this.currentAnimation?.cancel();
    this.currentAnimation = null;
    this.mouseWatcher?.stop();
    
    // Hide cursor
    if (this.cursor) {
      this.cursor.style.opacity = '0';
    }
    
    if (interrupted) {
      this.options.onInterrupt();
    } else {
      this.options.onComplete();
    }
  }
  
  /**
   * Destroy the clicker
   */
  destroy(): void {
    this.stop(false);
    this.cursor?.remove();
    this.cursor = null;
    this.mouseWatcher = null;
  }
  
  /**
   * Animate cursor to position
   */
  private animateTo(x: number, y: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.cursor) {
        reject(new Error('Cursor not initialized'));
        return;
      }
      
      const keyframes = [
        { left: this.cursor.style.left, top: this.cursor.style.top },
        { left: `${x}px`, top: `${y}px` },
      ];
      
      this.currentAnimation = this.cursor.animate(keyframes, {
        duration: this.options.animationDuration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      });
      
      this.currentAnimation.onfinish = () => {
        if (this.cursor) {
          this.cursor.style.left = `${x}px`;
          this.cursor.style.top = `${y}px`;
        }
        this.mouseWatcher?.updatePosition(x, y);
        resolve();
      };
      
      this.currentAnimation.oncancel = () => {
        reject(new Error('Animation cancelled'));
      };
    });
  }
  
  /**
   * Show click effect
   */
  private showClickEffect(): Promise<void> {
    return new Promise((resolve) => {
      const ripple = this.cursor?.querySelector('#ed-cursor-ripple') as HTMLElement;
      if (ripple) {
        ripple.style.animation = 'ed-click-ripple 0.3s ease-out';
        ripple.onanimationend = () => {
          ripple.style.animation = '';
          resolve();
        };
      } else {
        resolve();
      }
    });
  }
  
  /**
   * Perform actual click on element
   */
  private performClick(element: HTMLElement): void {
    // Create and dispatch mouse events
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const mouseDown = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
    });
    
    const mouseUp = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
    });
    
    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
    });
    
    element.dispatchEvent(mouseDown);
    element.dispatchEvent(mouseUp);
    element.dispatchEvent(click);
    
    // Also try focus
    element.focus();
    
    console.log('[Ed Clicker] Clicked element:', element);
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

