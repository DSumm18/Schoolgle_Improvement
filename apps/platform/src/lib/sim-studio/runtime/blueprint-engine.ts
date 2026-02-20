// ============================================================================
// BLUEPRINT RUNTIME ENGINE
// Canvas-based simulation rendering system
// ============================================================================

export interface SimState {
  // Core state
  value: number;
  mode: 'teach' | 'pupil' | 'evidence';
  accessibility: AccessibilitySettings;
  // Place value specific
  hundreds: number;
  tens: number;
  ones: number;
  selectedBlock?: { type: 'hundreds' | 'tens' | 'ones'; index: number };
  // Interaction state
  isDragging: boolean;
  dragTarget?: { x: number; y: number };
  // Animation
  lastFrameTime: number;
  frameCount: number;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  keyboardOnly: boolean;
  screenReader: boolean;
}

export interface CanvasConfig {
  width: number;
  height: number;
  pixelRatio: number;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export interface InteractionEvent {
  type: 'click' | 'dragStart' | 'dragMove' | 'dragEnd' | 'keydown' | 'keyup';
  x: number;
  y: number;
  key?: string;
  ctrlKey: boolean;
  shiftKey: boolean;
}

export interface BlueprintRenderer {
  render: (ctx: CanvasRenderingContext2D, state: SimState, config: CanvasConfig) => void;
  handleInteraction?: (event: InteractionEvent, state: SimState) => SimState;
  reset: () => SimState;
  validate?: (state: SimState) => { valid: boolean; feedback?: string };
}

// ============================================================================
// COLOR PALETTES
// ============================================================================

const COLORS = {
  normal: {
    background: '#f8fafc',
    text: '#1e293b',
    hundreds: '#ef4444',
    tens: '#3b82f6',
    ones: '#22c55e',
    grid: '#e2e8f0',
    highlight: '#f59e0b',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  highContrast: {
    background: '#ffffff',
    text: '#000000',
    hundreds: '#ff0000',
    tens: '#0000ff',
    ones: '#008000',
    grid: '#cccccc',
    highlight: '#ff00ff',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getCanvasColors(accessibility: AccessibilitySettings) {
  return accessibility.highContrast ? COLORS.highContrast : COLORS.normal;
}

export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not get canvas context');

  const pixelRatio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * pixelRatio;
  canvas.height = rect.height * pixelRatio;

  ctx.scale(pixelRatio, pixelRatio);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  return ctx;
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

// ============================================================================
// RENDERING HELPERS
// ============================================================================

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: string,
  strokeColor?: string
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
  baseline: CanvasTextBaseline = 'middle'
) {
  ctx.font = `${size}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number,
  color: string,
  lineWidth: number = 1
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // Vertical lines
  for (let i = 0; i <= width; i += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let i = 0; i <= height; i += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + width, y + i);
    ctx.stroke();
  }
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

export class AnimationController {
  private canvas: HTMLCanvasElement;
  private renderer: BlueprintRenderer;
  private state: SimState;
  private config: CanvasConfig;
  private isRunning: boolean = false;
  private animationId?: number;
  private lastTime: number = 0;
  private targetFPS: number = 60;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: BlueprintRenderer,
    initialState: SimState,
    config: CanvasConfig
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.state = initialState;
    this.config = config;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private loop = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // Check if we should skip this frame for reduced motion mode
    const shouldRender = this.state.accessibility.reducedMotion
      ? this.state.frameCount % 2 === 0 // Render every 2nd frame (~30fps)
      : true;

    if (shouldRender) {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        clearCanvas(
          ctx,
          this.config.width,
          this.config.height,
          this.config.backgroundColor
        );

        // Render current state
        this.renderer.render(ctx, this.state, this.config);
      }
    }

    this.state.frameCount++;
    this.lastTime = currentTime;
    this.animationId = requestAnimationFrame(this.loop);
  };

  updateState(newState: Partial<SimState>) {
    this.state = { ...this.state, ...newState };
  }

  getState(): SimState {
    return this.state;
  }

  reset() {
    this.state = this.renderer.reset();
  }

  handleInteraction(event: InteractionEvent) {
    if (this.renderer.handleInteraction) {
      this.state = this.renderer.handleInteraction(event, this.state);
    }
  }

  setTargetFPS(fps: number) {
    this.targetFPS = fps;
  }
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

export function setupInputHandlers(
  canvas: HTMLCanvasElement,
  controller: AnimationController
) {
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };

  // Mouse events
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDragging = true;
    dragStart = { x, y };

    controller.handleInteraction({
      type: 'dragStart',
      x,
      y,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
    });
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    controller.handleInteraction({
      type: 'dragMove',
      x,
      y,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
    });
  });

  canvas.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if it was a click (didn't move much)
    const distance = Math.sqrt(Math.pow(x - dragStart.x, 2) + Math.pow(y - dragStart.y, 2));
    if (distance < 5) {
      controller.handleInteraction({
        type: 'click',
        x,
        y,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
      });
    } else {
      controller.handleInteraction({
        type: 'dragEnd',
        x,
        y,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
      });
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false;
      controller.handleInteraction({
        type: 'dragEnd',
        x: dragStart.x,
        y: dragStart.y,
        ctrlKey: false,
        shiftKey: false,
      });
    }
  });

  // Touch events
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    isDragging = true;
    dragStart = { x, y };

    controller.handleInteraction({
      type: 'dragStart',
      x,
      y,
      ctrlKey: false,
      shiftKey: false,
    });
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    controller.handleInteraction({
      type: 'dragMove',
      x,
      y,
      ctrlKey: false,
      shiftKey: false,
    });
  });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!isDragging) return;
    isDragging = false;

    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    controller.handleInteraction({
      type: 'dragEnd',
      x,
      y,
      ctrlKey: false,
      shiftKey: false,
    });
  });

  // Keyboard events
  canvas.addEventListener('keydown', (e) => {
    controller.handleInteraction({
      type: 'keydown',
      x: 0,
      y: 0,
      key: e.key,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
    });
  });

  canvas.addEventListener('keyup', (e) => {
    controller.handleInteraction({
      type: 'keyup',
      x: 0,
      y: 0,
      key: e.key,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
    });
  });

  // Make canvas focusable for keyboard events
  canvas.setAttribute('tabindex', '0');
  canvas.style.outline = 'none';
}

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

export function getFontSize(settings: AccessibilitySettings): number {
  const sizes = { small: 14, medium: 16, large: 18, xlarge: 20 };
  return sizes[settings.fontSize];
}

export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
