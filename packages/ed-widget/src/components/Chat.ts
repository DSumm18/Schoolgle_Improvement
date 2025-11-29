/**
 * Chat - Message history component
 */

import type { Message } from '../types';

export interface QuickReply {
  text: string;
  action: () => void;
}

export class Chat {
  private container: HTMLElement;
  private messagesContainer: HTMLElement;
  private messages: Message[] = [];
  private onQuickReply?: (text: string) => void;

  constructor(container: HTMLElement, onQuickReply?: (text: string) => void) {
    this.container = container;
    this.messagesContainer = document.createElement('div');
    this.onQuickReply = onQuickReply;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'chat-scroll scrollbar-hide';

    this.messagesContainer = this.container;
  }

  /**
   * Add a message to the chat
   */
  public addMessage(message: Message): void {
    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }

  private renderMessage(message: Message): void {
    const messageEl = document.createElement('div');
    messageEl.className = `msg msg-${message.role === 'user' ? 'user' : 'ai'}`;
    messageEl.setAttribute('data-id', message.id);

    // Format message content
    let contentHtml = this.formatMessage(message.content);
    
    // Add translation if available (dual-language display)
    if (message.translation && message.translation !== message.content) {
      contentHtml += `<div class="msg-divider"></div><span class="msg-sub">${this.escapeHtml(message.translation)}</span>`;
    }

    messageEl.innerHTML = contentHtml;

    // Add quick reply buttons for assistant messages
    if (message.role === 'assistant' && message.quickReplies && message.quickReplies.length > 0) {
      const quickRepliesContainer = document.createElement('div');
      quickRepliesContainer.className = 'quick-replies';
      
      message.quickReplies.forEach(reply => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = reply;
        btn.addEventListener('click', () => {
          if (this.onQuickReply) {
            this.onQuickReply(reply);
          }
        });
        quickRepliesContainer.appendChild(btn);
      });
      
      messageEl.appendChild(quickRepliesContainer);
    }

    // Add with animation
    messageEl.style.opacity = '0';
    messageEl.style.transform = 'scale(0.9) translateY(10px)';
    this.messagesContainer.appendChild(messageEl);

    // Trigger animation
    requestAnimationFrame(() => {
      messageEl.style.transition = 'all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      messageEl.style.opacity = '1';
      messageEl.style.transform = 'scale(1) translateY(0)';
    });
  }

  private formatMessage(content: string): string {
    // Convert markdown-like syntax to HTML
    let html = this.escapeHtml(content);

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private getUserIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4"/>
      <path d="M12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"/>
    </svg>`;
  }

  private getEdIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
      <path d="M9 12l-2 8M15 12l2 8" stroke-linecap="round"/>
    </svg>`;
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    });
  }

  /**
   * Clear all messages
   */
  public clear(): void {
    this.messages = [];
    this.messagesContainer.innerHTML = '';
  }

  /**
   * Get message history
   */
  public getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Update a specific message
   */
  public updateMessage(id: string, content: string): void {
    const message = this.messages.find((m) => m.id === id);
    if (message) {
      message.content = content;
      const el = this.messagesContainer.querySelector(`[data-id="${id}"]`);
      if (el) {
        const bubble = el.querySelector('.ed-message-bubble');
        if (bubble) {
          bubble.innerHTML = this.formatMessage(content);
        }
      }
    }
  }

  /**
   * Show typing indicator
   */
  public showTyping(): string {
    const id = 'typing-' + Date.now();
    const typingEl = document.createElement('div');
    typingEl.className = 'ed-message ed-message-assistant ed-message-typing';
    typingEl.setAttribute('data-id', id);
    typingEl.innerHTML = `
      <div class="ed-message-content">
        <div class="ed-message-avatar">${this.getEdIcon()}</div>
        <div class="ed-message-bubble">
          <div class="ed-typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
    this.messagesContainer.appendChild(typingEl);
    this.scrollToBottom();
    return id;
  }

  /**
   * Hide typing indicator
   */
  public hideTyping(id: string): void {
    const el = this.messagesContainer.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.remove();
    }
  }
}

