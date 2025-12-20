// Mouse Watcher - Kill Switch for Act Mode
// Instantly stops automation if user moves their mouse

export type MouseWatcherCallback = () => void;

interface MouseWatcherOptions {
  /** Pixels of movement to ignore (default: 5) */
  threshold?: number;
  /** Callback when user moves mouse */
  onUserInterrupt: MouseWatcherCallback;
  /** Show visual indicator that Ed is controlling */
  showIndicator?: boolean;
}

/**
 * Mouse Watcher for Act Mode
 * Detects user mouse movement to stop automation
 */
export class MouseWatcher {
  private isWatching: boolean = false;
  private lastPosition: { x: number; y: number } | null = null;
  private threshold: number;
  private onUserInterrupt: MouseWatcherCallback;
  private showIndicator: boolean;
  private indicator: HTMLDivElement | null = null;
  
  // Bound handlers for cleanup
  private handleMouseMove: (e: MouseEvent) => void;
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleClick: (e: MouseEvent) => void;
  
  constructor(options: MouseWatcherOptions) {
    this.threshold = options.threshold ?? 5;
    this.onUserInterrupt = options.onUserInterrupt;
    this.showIndicator = options.showIndicator ?? true;
    
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleClick = this.onClick.bind(this);
  }
  
  /**
   * Start watching for user input
   */
  start(): void {
    if (this.isWatching) return;
    
    this.isWatching = true;
    this.lastPosition = null;
    
    // Listen for mouse movement
    document.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    
    // Listen for keyboard (any key stops automation)
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Listen for clicks (user taking control)
    document.addEventListener('click', this.handleClick, { capture: true });
    
    // Show indicator
    if (this.showIndicator) {
      this.createIndicator();
    }
    
    console.log('[Ed MouseWatcher] Started watching for user input');
  }
  
  /**
   * Stop watching
   */
  stop(): void {
    if (!this.isWatching) return;
    
    this.isWatching = false;
    
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleClick, { capture: true });
    
    this.removeIndicator();
    
    console.log('[Ed MouseWatcher] Stopped watching');
  }
  
  /**
   * Check if currently watching
   */
  get watching(): boolean {
    return this.isWatching;
  }
  
  /**
   * Handle mouse move events
   */
  private onMouseMove(e: MouseEvent): void {
    const currentPosition = { x: e.clientX, y: e.clientY };
    
    // First movement - just record position
    if (!this.lastPosition) {
      this.lastPosition = currentPosition;
      return;
    }
    
    // Calculate distance moved
    const dx = currentPosition.x - this.lastPosition.x;
    const dy = currentPosition.y - this.lastPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If moved beyond threshold, user is taking control
    if (distance > this.threshold) {
      console.log('[Ed MouseWatcher] User moved mouse:', distance, 'px');
      this.triggerInterrupt('mouse');
    }
  }
  
  /**
   * Handle keyboard events
   */
  private onKeyDown(e: KeyboardEvent): void {
    // Ignore modifier keys alone
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
      return;
    }
    
    // Escape always stops
    if (e.key === 'Escape') {
      console.log('[Ed MouseWatcher] User pressed Escape');
      this.triggerInterrupt('escape');
      return;
    }
    
    // Any other key stops automation
    console.log('[Ed MouseWatcher] User pressed key:', e.key);
    this.triggerInterrupt('keyboard');
  }
  
  /**
   * Handle click events
   */
  private onClick(e: MouseEvent): void {
    // Check if this click came from Ed's automation
    const target = e.target as HTMLElement;
    if (target.closest('#ed-automation-cursor')) {
      return; // Ed's own click, ignore
    }
    
    console.log('[Ed MouseWatcher] User clicked');
    this.triggerInterrupt('click');
  }
  
  /**
   * Trigger user interrupt
   */
  private triggerInterrupt(reason: string): void {
    this.stop();
    console.log('[Ed MouseWatcher] Interrupt triggered:', reason);
    this.onUserInterrupt();
  }
  
  /**
   * Create the "Ed is working" indicator
   */
  private createIndicator(): void {
    this.indicator = document.createElement('div');
    this.indicator.id = 'ed-automation-indicator';
    this.indicator.innerHTML = `
      <div style="
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          animation: ed-working-pulse 1s infinite;
        "></div>
        <span>Ed is working... Move mouse to stop</span>
      </div>
      <style>
        @keyframes ed-working-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      </style>
    `;
    document.body.appendChild(this.indicator);
  }
  
  /**
   * Remove the indicator
   */
  private removeIndicator(): void {
    this.indicator?.remove();
    this.indicator = null;
  }
  
  /**
   * Update the last known position (call this when Ed moves the cursor)
   */
  updatePosition(x: number, y: number): void {
    this.lastPosition = { x, y };
  }
}

