// Ed Widget - The floating AI assistant UI
// Uses Shadow DOM for style isolation

import type { ToolMatch } from '@/shared/types';

interface EdWidgetOptions {
  isVisible: boolean;
  isMinimized: boolean;
  onAskQuestion: (question: string) => Promise<string>;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Ed Widget - Floating AI assistant
 */
export class EdWidget {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private isVisible: boolean;
  private isMinimized: boolean;
  private isExpanded: boolean = false;
  private currentTool: ToolMatch | null = null;
  private messages: ChatMessage[] = [];
  private isLoading: boolean = false;
  private onAskQuestion: (question: string) => Promise<string>;
  private onClose: () => void;
  
  constructor(options: EdWidgetOptions) {
    this.isVisible = options.isVisible;
    this.isMinimized = options.isMinimized;
    this.onAskQuestion = options.onAskQuestion;
    this.onClose = options.onClose;
  }
  
  /**
   * Mount the widget to the page
   */
  mount(): void {
    if (this.container) return; // Already mounted
    
    // Create container - positioned to not overlap with other chat widgets
    this.container = document.createElement('div');
    this.container.id = 'ed-extension-widget';
    this.container.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Create shadow root for style isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });
    
    // Inject styles
    this.injectStyles();
    
    // Render initial UI
    this.render();
    
    // Add to page
    document.body.appendChild(this.container);
    
    console.log('[Ed Widget] Mounted');
  }
  
  /**
   * Unmount the widget
   */
  unmount(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
      this.shadowRoot = null;
    }
  }
  
  /**
   * Toggle visibility
   */
  toggle(): void {
    this.isVisible = !this.isVisible;
    this.render();
  }
  
  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.render();
  }
  
  /**
   * Set detected tool
   */
  setTool(tool: ToolMatch | null): void {
    this.currentTool = tool;
    
    // Add a greeting message when tool is detected
    if (tool && this.messages.length === 0) {
      this.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hi! I see you're using ${tool.name}. I can help you with anything here - just ask!`,
        timestamp: new Date(),
      });
    }
    
    this.render();
  }
  
  /**
   * Inject styles into shadow DOM
   */
  private injectStyles(): void {
    if (!this.shadowRoot) return;
    
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      .ed-container {
        position: relative;
      }
      
      /* Ed Particle Orb - CSS recreation of Three.js particle sphere */
      .ed-orb {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, 
          rgba(45, 212, 191, 0.9) 0%, 
          rgba(16, 185, 129, 0.95) 40%, 
          rgba(5, 150, 105, 1) 70%,
          rgba(4, 120, 87, 1) 100%);
        cursor: pointer;
        position: relative;
        border: none;
        outline: none;
        animation: ed-orb-rotate 8s linear infinite;
        transform-style: preserve-3d;
      }
      
      /* Outer glow */
      .ed-orb::before {
        content: '';
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background: radial-gradient(circle, 
          rgba(16, 185, 129, 0.4) 0%, 
          rgba(16, 185, 129, 0.2) 40%,
          transparent 70%);
        animation: ed-glow-pulse 2s ease-in-out infinite;
        z-index: -1;
      }
      
      /* Particle dots layer */
      .ed-orb::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background-image: 
          radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.8) 50%, transparent 50%),
          radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.6) 50%, transparent 50%),
          radial-gradient(2px 2px at 60% 20%, rgba(255,255,255,0.7) 50%, transparent 50%),
          radial-gradient(2px 2px at 80% 50%, rgba(255,255,255,0.5) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 15% 60%, rgba(45,212,191,0.9) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 35% 15%, rgba(45,212,191,0.8) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 55% 85%, rgba(45,212,191,0.7) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 75% 35%, rgba(45,212,191,0.9) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 25% 45%, rgba(16,185,129,0.8) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 45% 55%, rgba(16,185,129,0.7) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 65% 40%, rgba(16,185,129,0.9) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 85% 75%, rgba(16,185,129,0.6) 50%, transparent 50%),
          radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.4) 50%, transparent 50%),
          radial-gradient(1px 1px at 30% 90%, rgba(255,255,255,0.3) 50%, transparent 50%),
          radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.5) 50%, transparent 50%),
          radial-gradient(1px 1px at 70% 65%, rgba(255,255,255,0.4) 50%, transparent 50%),
          radial-gradient(1px 1px at 90% 25%, rgba(255,255,255,0.3) 50%, transparent 50%);
        animation: ed-particles-shimmer 3s ease-in-out infinite;
      }
      
      /* Inner shine */
      .ed-orb-inner {
        position: absolute;
        top: 6px;
        left: 10px;
        width: 20px;
        height: 12px;
        background: rgba(255, 255, 255, 0.35);
        border-radius: 50%;
        filter: blur(3px);
      }
      
      @keyframes ed-orb-rotate {
        from { transform: rotate3d(0, 1, 0.1, 0deg); }
        to { transform: rotate3d(0, 1, 0.1, 360deg); }
      }
      
      @keyframes ed-glow-pulse {
        0%, 100% { 
          opacity: 0.8;
          transform: scale(1);
        }
        50% { 
          opacity: 1;
          transform: scale(1.1);
        }
      }
      
      @keyframes ed-particles-shimmer {
        0%, 100% { opacity: 0.9; }
        50% { opacity: 0.6; }
      }
      
      .ed-orb:hover {
        animation-play-state: paused;
        transform: scale(1.1);
      }
      
      .ed-orb:hover::before {
        background: radial-gradient(circle, 
          rgba(16, 185, 129, 0.6) 0%, 
          rgba(16, 185, 129, 0.3) 40%,
          transparent 70%);
      }
      
      .ed-orb:active {
        transform: scale(0.95);
      }
      
      .ed-orb-icon {
        display: none; /* Hide emoji, use particle effect instead */
      }
      
      .ed-orb.hidden {
        display: none;
      }
      
      /* Pulse animation for new messages */
      .ed-orb.has-notification {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4); }
        50% { box-shadow: 0 4px 30px rgba(5, 150, 105, 0.7); }
        100% { box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4); }
      }
      
      /* Chat Panel */
      .ed-panel {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 380px;
        max-height: 500px;
        background: #0f172a;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(10px) scale(0.95);
        transition: all 0.2s ease;
        pointer-events: none;
      }
      
      .ed-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      
      /* Panel Header */
      .ed-header {
        padding: 16px;
        background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .ed-header-icon {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      
      .ed-header-text {
        flex: 1;
      }
      
      .ed-header-title {
        font-size: 15px;
        font-weight: 600;
        color: white;
      }
      
      .ed-header-subtitle {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .ed-close-btn {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: background 0.15s;
      }
      
      .ed-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      /* Tool Badge */
      .ed-tool-badge {
        padding: 8px 16px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .ed-tool-badge-icon {
        font-size: 14px;
      }
      
      .ed-tool-badge-text {
        font-size: 12px;
        color: #10b981;
        font-weight: 500;
      }
      
      /* Messages */
      .ed-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 200px;
        max-height: 300px;
      }
      
      .ed-message {
        display: flex;
        gap: 8px;
        max-width: 85%;
      }
      
      .ed-message.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      
      .ed-message-avatar {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }
      
      .ed-message.assistant .ed-message-avatar {
        background: #059669;
      }
      
      .ed-message.user .ed-message-avatar {
        background: #3b82f6;
      }
      
      .ed-message-content {
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .ed-message.assistant .ed-message-content {
        background: #1e293b;
        color: #e2e8f0;
        border-bottom-left-radius: 4px;
      }
      
      .ed-message.user .ed-message-content {
        background: #3b82f6;
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      /* Loading indicator */
      .ed-loading {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
        background: #1e293b;
        border-radius: 12px;
        border-bottom-left-radius: 4px;
      }
      
      .ed-loading-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #64748b;
        animation: loadingDot 1.4s infinite ease-in-out both;
      }
      
      .ed-loading-dot:nth-child(1) { animation-delay: -0.32s; }
      .ed-loading-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes loadingDot {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      
      /* Input */
      .ed-input-container {
        padding: 12px 16px;
        background: #1e293b;
        border-top: 1px solid #334155;
      }
      
      .ed-input-wrapper {
        display: flex;
        gap: 8px;
        align-items: center;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 4px;
      }
      
      .ed-input {
        flex: 1;
        padding: 8px 12px;
        background: transparent;
        border: none;
        outline: none;
        color: #e2e8f0;
        font-size: 14px;
        font-family: inherit;
      }
      
      .ed-input::placeholder {
        color: #64748b;
      }
      
      .ed-send-btn {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #059669;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.15s;
      }
      
      .ed-send-btn:hover {
        background: #047857;
      }
      
      .ed-send-btn:disabled {
        background: #334155;
        cursor: not-allowed;
      }
      
      /* Empty state */
      .ed-empty {
        text-align: center;
        padding: 20px;
        color: #64748b;
      }
      
      .ed-empty-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      
      .ed-empty-text {
        font-size: 13px;
        line-height: 1.5;
      }
    `;
    
    this.shadowRoot.appendChild(style);
  }
  
  /**
   * Render the widget
   */
  private render(): void {
    if (!this.shadowRoot) return;
    
    // Clear existing content (except styles)
    const existingUI = this.shadowRoot.querySelector('.ed-container');
    if (existingUI) {
      existingUI.remove();
    }
    
    // Create new UI
    const container = document.createElement('div');
    container.className = 'ed-container';
    
    if (!this.isVisible) {
      container.innerHTML = ''; // Hidden
      this.shadowRoot.appendChild(container);
      return;
    }
    
    // Floating orb - particle sphere style
    const orb = document.createElement('button');
    orb.className = `ed-orb ${this.isExpanded ? 'hidden' : ''}`;
    orb.innerHTML = '<div class="ed-orb-inner"></div>';
    orb.onclick = () => {
      this.isExpanded = true;
      this.render();
    };
    
    // Chat panel
    const panel = document.createElement('div');
    panel.className = `ed-panel ${this.isExpanded ? 'open' : ''}`;
    panel.innerHTML = this.renderPanel();
    
    container.appendChild(orb);
    container.appendChild(panel);
    this.shadowRoot.appendChild(container);
    
    // Attach event listeners
    this.attachEventListeners();
  }
  
  /**
   * Render the chat panel HTML
   */
  private renderPanel(): string {
    const toolBadge = this.currentTool
      ? `<div class="ed-tool-badge">
           <span class="ed-tool-badge-icon">🔧</span>
           <span class="ed-tool-badge-text">${this.currentTool.name}</span>
         </div>`
      : '';
    
    const messagesHtml = this.messages.length > 0
      ? this.messages.map(msg => `
          <div class="ed-message ${msg.role}">
            <div class="ed-message-avatar">${msg.role === 'assistant' ? '🎓' : '👤'}</div>
            <div class="ed-message-content">${this.escapeHtml(msg.content)}</div>
          </div>
        `).join('')
      : `<div class="ed-empty">
           <div class="ed-empty-icon">💬</div>
           <div class="ed-empty-text">
             Ask me anything about<br/>what you're working on!
           </div>
         </div>`;
    
    const loadingHtml = this.isLoading
      ? `<div class="ed-message assistant">
           <div class="ed-message-avatar">🎓</div>
           <div class="ed-loading">
             <div class="ed-loading-dot"></div>
             <div class="ed-loading-dot"></div>
             <div class="ed-loading-dot"></div>
           </div>
         </div>`
      : '';
    
    return `
      <div class="ed-header">
        <div class="ed-header-icon">🎓</div>
        <div class="ed-header-text">
          <div class="ed-header-title">Ed</div>
          <div class="ed-header-subtitle">School Tools Assistant</div>
        </div>
        <button class="ed-close-btn" id="ed-close">✕</button>
      </div>
      ${toolBadge}
      <div class="ed-messages" id="ed-messages">
        ${messagesHtml}
        ${loadingHtml}
      </div>
      <div class="ed-input-container">
        <div class="ed-input-wrapper">
          <input 
            type="text" 
            class="ed-input" 
            id="ed-input"
            placeholder="Ask Ed anything..."
            ${this.isLoading ? 'disabled' : ''}
          />
          <button class="ed-send-btn" id="ed-send" ${this.isLoading ? 'disabled' : ''}>
            ➤
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Attach event listeners to the panel
   */
  private attachEventListeners(): void {
    if (!this.shadowRoot) return;
    
    // Close button
    const closeBtn = this.shadowRoot.getElementById('ed-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        this.isExpanded = false;
        this.render();
      };
    }
    
    // Input and send
    const input = this.shadowRoot.getElementById('ed-input') as HTMLInputElement;
    const sendBtn = this.shadowRoot.getElementById('ed-send');
    
    if (input && sendBtn) {
      // Send on button click
      sendBtn.onclick = () => this.handleSend(input);
      
      // Send on Enter key
      input.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend(input);
        }
      };
      
      // Focus input when panel opens
      setTimeout(() => input.focus(), 100);
    }
    
    // Scroll messages to bottom
    const messages = this.shadowRoot.getElementById('ed-messages');
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  }
  
  /**
   * Handle sending a message
   */
  private async handleSend(input: HTMLInputElement): Promise<void> {
    const text = input.value.trim();
    if (!text || this.isLoading) return;
    
    // Add user message
    this.messages.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    });
    
    input.value = '';
    this.isLoading = true;
    this.render();
    
    try {
      // Get response from Ed
      const response = await this.onAskQuestion(text);
      
      // Add assistant message
      this.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('[Ed Widget] Error:', error);
      this.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Sorry, I had trouble with that. Please try again.",
        timestamp: new Date(),
      });
    }
    
    this.isLoading = false;
    this.render();
  }
  
  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

