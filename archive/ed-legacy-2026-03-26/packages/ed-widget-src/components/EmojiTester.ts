/**
 * Emoji Shape Tester Widget
 * Allows testing all particle shapes independently to verify visual accuracy
 */

import type { ParticleShape } from '../types';
import { Particle3D } from './Particle3D';

export class EmojiTester {
  private container: HTMLElement;
  private particle3D: Particle3D | null = null;
  private currentShape: ParticleShape = 'sphere';
  private isVisible = false;

  // All available shapes
  private readonly shapes: ParticleShape[] = [
    'sphere',
    'pencil',
    'lightbulb',
    'flag',
    'heart',
    'star',
    'logo',
    'thumbsup',
    'checkmark',
    'smiley',
    'book',
    'clock',
    'warning',
    'question',
    'loading',
    'calendar',
    'search',
    'phone',
    'location',
    'fireworks',
    'party',
    'confetti',
    'trophy',
    'excited',
    'thinking',
    'confused',
    'error',
    'speech',
    'document',
    'calculator',
    'bell',
    'graduation',
  ];

  constructor(container: HTMLElement) {
    this.container = container;
    this.createUI();
  }

  private createUI(): void {
    // Create tester panel
    const panel = document.createElement('div');
    panel.id = 'emoji-tester-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 90vh;
      background: rgba(20, 20, 30, 0.95);
      border: 2px solid #2dd4bf;
      border-radius: 12px;
      padding: 20px;
      z-index: 10000;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
      display: none;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(45, 212, 191, 0.3);
    `;

    const title = document.createElement('h2');
    title.textContent = '🎨 Emoji Shape Tester';
    title.style.cssText = `
      margin: 0;
      font-size: 1.2rem;
      color: #2dd4bf;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: transparent;
      border: 1px solid #2dd4bf;
      color: #2dd4bf;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.2rem;
      line-height: 1;
      transition: all 0.2s;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = '#2dd4bf';
      closeBtn.style.color = '#000';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = 'transparent';
      closeBtn.style.color = '#2dd4bf';
    };
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'emoji-tester-canvas';
    canvasContainer.style.cssText = `
      width: 300px;
      height: 300px;
      margin: 0 auto 20px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      border: 1px solid rgba(45, 212, 191, 0.2);
      position: relative;
    `;

    // Shape selector
    const selectorLabel = document.createElement('div');
    selectorLabel.textContent = 'Select Shape:';
    selectorLabel.style.cssText = `
      font-size: 0.9rem;
      color: #aaa;
      margin-bottom: 10px;
    `;

    const shapeGrid = document.createElement('div');
    shapeGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
      padding: 10px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    `;

    // Create buttons for each shape
    this.shapes.forEach((shape) => {
      const btn = document.createElement('button');
      btn.textContent = this.getShapeEmoji(shape);
      btn.title = shape;
      btn.style.cssText = `
        padding: 12px;
        background: rgba(45, 212, 191, 0.1);
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1.5rem;
        transition: all 0.2s;
        color: #fff;
      `;
      btn.onmouseover = () => {
        btn.style.background = 'rgba(45, 212, 191, 0.2)';
        btn.style.borderColor = '#2dd4bf';
      };
      btn.onmouseout = () => {
        if (this.currentShape !== shape) {
          btn.style.background = 'rgba(45, 212, 191, 0.1)';
          btn.style.borderColor = 'transparent';
        }
      };
      btn.onclick = () => this.selectShape(shape);
      
      // Highlight current shape
      if (shape === this.currentShape) {
        btn.style.background = 'rgba(45, 212, 191, 0.3)';
        btn.style.borderColor = '#2dd4bf';
      }

      const label = document.createElement('div');
      label.textContent = shape;
      label.style.cssText = `
        font-size: 0.7rem;
        color: #aaa;
        margin-top: 4px;
      `;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'text-align: center;';
      wrapper.appendChild(btn);
      wrapper.appendChild(label);
      shapeGrid.appendChild(wrapper);
    });

    // Current shape info
    const info = document.createElement('div');
    info.id = 'emoji-tester-info';
    info.style.cssText = `
      margin-top: 15px;
      padding: 12px;
      background: rgba(45, 212, 191, 0.1);
      border-radius: 6px;
      font-size: 0.9rem;
      color: #aaa;
    `;
    this.updateInfo();

    panel.appendChild(header);
    panel.appendChild(canvasContainer);
    panel.appendChild(selectorLabel);
    panel.appendChild(shapeGrid);
    panel.appendChild(info);

    document.body.appendChild(panel);
  }

  private getShapeEmoji(shape: ParticleShape): string {
    const emojiMap: Record<ParticleShape, string> = {
      sphere: '⚪',
      pencil: '✏️',
      lightbulb: '💡',
      flag: '🏴',
      heart: '❤️',
      star: '⭐',
      logo: '🎓',
      thumbsup: '👍',
      checkmark: '✅',
      smiley: '😊',
      book: '📖',
      clock: '⏰',
      warning: '⚠️',
      question: '❓',
      loading: '⏳',
      calendar: '📅',
      search: '🔍',
      phone: '📞',
      location: '📍',
      fireworks: '🎆',
      party: '🎉',
      confetti: '🎊',
      trophy: '🏆',
      excited: '⚡',
      thinking: '🤔',
      confused: '😕',
      error: '❌',
      speech: '💬',
      document: '📄',
      calculator: '🧮',
      bell: '🔔',
      graduation: '🎓',
    };
    return emojiMap[shape] || '⚪';
  }

  private updateInfo(): void {
    const info = document.getElementById('emoji-tester-info');
    if (info) {
      info.textContent = `Current: ${this.currentShape} ${this.getShapeEmoji(this.currentShape)}`;
    }
  }

  private selectShape(shape: ParticleShape): void {
    this.currentShape = shape;
    this.particle3D?.morphTo(shape);
    this.updateInfo();
    this.updateButtonStates();
  }

  private updateButtonStates(): void {
    const panel = document.getElementById('emoji-tester-panel');
    if (!panel) return;

    const buttons = panel.querySelectorAll('button');
    buttons.forEach((btn) => {
      if (btn.title === this.currentShape) {
        btn.style.background = 'rgba(45, 212, 191, 0.3)';
        btn.style.borderColor = '#2dd4bf';
      } else {
        btn.style.background = 'rgba(45, 212, 191, 0.1)';
        btn.style.borderColor = 'transparent';
      }
    });
  }

  public show(): void {
    const panel = document.getElementById('emoji-tester-panel');
    if (!panel) return;

    this.isVisible = true;
    panel.style.display = 'block';

    // Initialize particle system if not already done
    const canvasContainer = document.getElementById('emoji-tester-canvas');
    if (canvasContainer && !this.particle3D) {
      this.particle3D = new Particle3D(canvasContainer);
      this.particle3D.start();
      this.particle3D.morphTo(this.currentShape);
    }
  }

  public hide(): void {
    const panel = document.getElementById('emoji-tester-panel');
    if (!panel) return;

    this.isVisible = false;
    panel.style.display = 'none';

    // Stop particle system to save resources
    if (this.particle3D) {
      this.particle3D.stop();
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public destroy(): void {
    if (this.particle3D) {
      this.particle3D.stop();
      this.particle3D = null;
    }
    const panel = document.getElementById('emoji-tester-panel');
    if (panel) {
      panel.remove();
    }
  }
}

