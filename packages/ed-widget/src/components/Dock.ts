/**
 * Dock - macOS-style bottom dock with actions
 */

import type { DockAction } from '../types';

interface DockOptions {
  onAction: (action: DockAction) => void;
  onToolAction?: (tool: string) => void;
  onSettingChange?: (setting: string) => void;
  onLanguageChange?: (lang: string) => void;
  onPersonaChange?: (persona: string) => void;
}

interface DockItem {
  id: DockAction;
  icon: string;
  label: string;
  className?: string;
}

const DOCK_ITEMS: DockItem[] = [
  {
    id: 'magic-tools',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5"/>
      <path d="M15 9a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1"/>
      <path d="M3 21l9-9"/>
      <path d="M12.2 6.2L11 5"/>
    </svg>`,
    label: 'Magic Tools',
  },
  {
    id: 'settings',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,
    label: 'Settings',
  },
  {
    id: 'language',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>`,
    label: 'Language',
  },
  {
    id: 'persona',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="8" width="18" height="14" rx="2"/>
      <path d="M12 8V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/>
      <path d="M8 8V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2"/>
      <path d="M9 15h6"/>
    </svg>`,
    label: 'Persona',
  },
  {
    id: 'microphone',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>`,
    label: 'Speak',
    className: 'ed-dock-mic',
  },
  {
    id: 'keyboard',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"/>
    </svg>`,
    label: 'Keyboard',
  },
  {
    id: 'close',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`,
    label: 'Close',
  },
];

export class Dock {
  private container: HTMLElement;
  private options: DockOptions;
  private items: Map<DockAction, HTMLElement> = new Map();
  private activeMenu: HTMLElement | null = null;

  constructor(container: HTMLElement, options: DockOptions) {
    this.container = container;
    this.options = options;
    // Ensure container is visible
    if (container) {
      container.style.display = 'flex';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
    }
    this.render();
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (this.activeMenu) {
        // Close if clicking outside menu and dock
        if (!this.activeMenu.contains(target) && !this.container.contains(target)) {
          this.closeMenu();
        }
        // Also close if clicking on a different dock button
        const clickedButton = (target as HTMLElement).closest('.dock-item');
        if (clickedButton && clickedButton !== this.container.querySelector(`[data-action="${this.activeMenu.dataset.action}"]`)) {
          this.closeMenu();
        }
      }
    });
  }

  private render(): void {
    this.container.innerHTML = '';
    // Ensure container is visible
    this.container.style.display = 'flex';
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';
    
    // Match original dock structure - items are direct children
    DOCK_ITEMS.forEach((item) => {
      const button = document.createElement('button');
      
      // Special handling for mic button
      if (item.id === 'microphone') {
        button.id = 'dock-mic-btn';
        button.className = 'dock-item';
      } else {
        button.className = 'dock-item';
      }
      
      button.setAttribute('data-action', item.id);
      button.setAttribute('aria-label', item.label);
      button.setAttribute('title', item.label);
      button.innerHTML = item.icon;
      
      // Ensure button is visible
      button.style.opacity = '1';
      button.style.visibility = 'visible';
      button.style.display = 'flex';

      button.addEventListener('click', () => this.handleClick(item.id));
      button.addEventListener('mouseenter', () => this.handleHover(button, true));
      button.addEventListener('mouseleave', () => this.handleHover(button, false));

      this.items.set(item.id, button);
      this.container.appendChild(button);
    });
    
    // Force visibility after rendering
    requestAnimationFrame(() => {
      this.container.style.display = 'flex';
      this.container.style.visibility = 'visible';
      this.container.style.opacity = '1';
    });
  }

  private handleClick(action: DockAction): void {
    // Add click animation
    const item = this.items.get(action);
    if (item) {
      item.classList.add('ed-dock-clicked');
      setTimeout(() => item.classList.remove('ed-dock-clicked'), 200);
    }

    // Show menu for actions that have options
    const menuActions: DockAction[] = ['magic-tools', 'settings', 'language', 'persona'];
    if (menuActions.includes(action)) {
      // If menu is already open for this action, close it
      if (this.activeMenu && this.activeMenu.dataset.action === action) {
        this.closeMenu();
      } else {
        // Close any other open menu first
        this.closeMenu();
        // Small delay to ensure previous menu is fully closed
        setTimeout(() => {
          this.toggleMenu(action, item!);
        }, 50);
      }
    } else {
      // Close any open menu
      this.closeMenu();
      // Execute action
      this.options.onAction(action);
    }
  }

  private toggleMenu(action: DockAction, button: HTMLElement): void {
    // Close existing menu if clicking same button
    if (this.activeMenu && this.activeMenu.dataset.action === action) {
      this.closeMenu();
      return;
    }

    // Close any existing menu
    this.closeMenu();

    // Create menu based on action
    const menu = this.createMenu(action, button);
    if (menu) {
      this.activeMenu = menu;
      // Position relative to button
      button.style.position = 'relative';
      button.appendChild(menu);
      // Force visibility
      menu.style.display = 'flex';
      menu.style.visibility = 'visible';
      // Animate in
      requestAnimationFrame(() => {
        menu.classList.add('dock-menu-visible');
        menu.style.opacity = '1';
      });
    }
  }

  private createMenu(action: DockAction, button: HTMLElement): HTMLElement | null {
    const menu = document.createElement('div');
    menu.className = 'dock-menu';
    menu.dataset.action = action;

    switch (action) {
      case 'magic-tools':
        menu.innerHTML = `
          <div class="dock-menu-item" data-tool="form-fill">
            <span class="dock-menu-icon">📝</span>
            <span>Form Fill</span>
          </div>
          <div class="dock-menu-item" data-tool="page-scan">
            <span class="dock-menu-icon">🔍</span>
            <span>Page Scan</span>
          </div>
          <div class="dock-menu-item" data-tool="calendar">
            <span class="dock-menu-icon">📅</span>
            <span>Calendar</span>
          </div>
          <div class="dock-menu-item" data-tool="emoji-tester">
            <span class="dock-menu-icon">🎨</span>
            <span>Emoji Tester</span>
          </div>
        `;
        break;
      case 'settings':
        menu.innerHTML = `
          <div class="dock-menu-item" data-setting="theme-standard">
            <span class="dock-menu-icon">🎨</span>
            <span>Standard Theme</span>
          </div>
          <div class="dock-menu-item" data-setting="theme-warm">
            <span class="dock-menu-icon">🔥</span>
            <span>Warm Theme</span>
          </div>
          <div class="dock-menu-item" data-setting="theme-cool">
            <span class="dock-menu-icon">❄️</span>
            <span>Cool Theme</span>
          </div>
          <div class="dock-menu-item" data-setting="theme-contrast">
            <span class="dock-menu-icon">⚡</span>
            <span>High Contrast</span>
          </div>
        `;
        break;
      case 'language':
        menu.innerHTML = `
          <div class="dock-menu-item" data-lang="en-GB">🇬🇧 English</div>
          <div class="dock-menu-item" data-lang="pl">🇵🇱 Polski</div>
          <div class="dock-menu-item" data-lang="ro">🇷🇴 Română</div>
          <div class="dock-menu-item" data-lang="es">🇪🇸 Español</div>
          <div class="dock-menu-item" data-lang="pt">🇵🇹 Português</div>
          <div class="dock-menu-item" data-lang="fr">🇫🇷 Français</div>
          <div class="dock-menu-item" data-lang="ur">🇵🇰 Urdu</div>
          <div class="dock-menu-item" data-lang="bn">🇧🇩 Bengali</div>
          <div class="dock-menu-item" data-lang="so">🇸🇴 Somali</div>
          <div class="dock-menu-item" data-lang="zh">🇨🇳 Chinese</div>
          <div class="dock-menu-item" data-lang="ar">🇸🇦 Arabic</div>
          <div class="dock-menu-item" data-lang="pa">🇮🇳 Punjabi</div>
        `;
        break;
      case 'persona':
        menu.innerHTML = `
          <div class="dock-menu-section">
            <div class="dock-menu-section-title">Main Assistant</div>
            <div class="dock-menu-item" data-persona="ed">
              <span class="dock-menu-icon">🎓</span>
              <span>Ed (Male Voice)</span>
            </div>
            <div class="dock-menu-item" data-persona="edwina">
              <span class="dock-menu-icon">🎓</span>
              <span>Edwina (Female Voice)</span>
            </div>
          </div>
          <div class="dock-menu-divider"></div>
          <div class="dock-menu-section">
            <div class="dock-menu-section-title">Character Voices</div>
            <div class="dock-menu-item" data-persona="santa">
              <span class="dock-menu-icon">🎅</span>
              <span>Santa</span>
            </div>
            <div class="dock-menu-item" data-persona="elf">
              <span class="dock-menu-icon">🧝</span>
              <span>Elf</span>
            </div>
            <div class="dock-menu-item" data-persona="headteacher">
              <span class="dock-menu-icon">👔</span>
              <span>Headteacher</span>
            </div>
          </div>
        `;
        break;
      default:
        return null;
    }

    // Add click handlers
    menu.querySelectorAll('.dock-menu-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const tool = (item as HTMLElement).dataset.tool;
        const setting = (item as HTMLElement).dataset.setting;
        const lang = (item as HTMLElement).dataset.lang;
        const persona = (item as HTMLElement).dataset.persona;

        // Close menu first to prevent UI freeze
        this.closeMenu();

        // Execute action after a brief delay to ensure menu closes
        setTimeout(() => {
          if (tool) {
            this.options.onToolAction?.(tool);
          } else if (setting) {
            const theme = setting.replace('theme-', '');
            this.options.onSettingChange?.(theme);
          } else if (lang) {
            this.options.onLanguageChange?.(lang);
          } else if (persona) {
            this.options.onPersonaChange?.(persona);
          }
        }, 100);
      });
    });

    return menu;
  }

  private closeMenu(): void {
    if (this.activeMenu) {
      this.activeMenu.classList.remove('dock-menu-visible');
      this.activeMenu.style.opacity = '0';
      this.activeMenu.style.pointerEvents = 'none';
      
      setTimeout(() => {
        if (this.activeMenu) {
          // Remove from parent if it exists
          if (this.activeMenu.parentNode) {
            this.activeMenu.parentNode.removeChild(this.activeMenu);
          }
          // Also remove from button if it's a direct child
          const button = this.container.querySelector(`[data-action="${this.activeMenu.dataset.action}"]`);
          if (button && button.contains(this.activeMenu)) {
            button.removeChild(this.activeMenu);
          }
          this.activeMenu = null;
        }
      }, 200);
    }
  }

  private handleHover(element: HTMLElement, entering: boolean): void {
    if (entering) {
      element.classList.add('ed-dock-hover');
    } else {
      element.classList.remove('ed-dock-hover');
    }
  }

  /**
   * Set listening state for microphone button
   */
  public setListening(listening: boolean): void {
    const micItem = this.items.get('microphone');
    if (micItem) {
      if (listening) {
        micItem.classList.add('mic-active');
      } else {
        micItem.classList.remove('mic-active');
      }
    }
  }

  /**
   * Highlight a specific action
   */
  public highlight(action: DockAction): void {
    const item = this.items.get(action);
    if (item) {
      item.classList.add('ed-dock-highlight');
      setTimeout(() => item.classList.remove('ed-dock-highlight'), 2000);
    }
  }

  /**
   * Show/hide a dock item
   */
  public setVisible(action: DockAction, visible: boolean): void {
    const item = this.items.get(action);
    if (item) {
      item.style.display = visible ? '' : 'none';
    }
  }
}

