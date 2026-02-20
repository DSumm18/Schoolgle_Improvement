// Form Template Matcher - Content Script
// Checks if current page matches a known form template and offers to help

/**
 * Form template structure from database
 */
export interface FormTemplate {
  form_key: string;
  form_name: string;
  form_category: string;
  url_pattern: string;
  form_structure: {
    fields: Array<{
      index: number;
      label: string;
      type: string;
      selector: string;
      required: boolean;
      question?: string;
      example?: string;
      options?: string[];
    }>;
  };
  conversation_template: {
    intro: {
      en: string;
      [key: string]: string;
    };
    questions: Array<{
      fieldIndex: number;
      question: {
        en: string;
        [key: string]: string;
      };
      helpText?: {
        en: string;
        [key: string]: string;
      };
    }>;
    outro: {
      en: string;
      [key: string]: string;
    };
  };
  description: string;
  help_text: string;
  estimated_time_minutes?: number;
}

/**
 * Check if current URL matches a known form template
 * @returns Form template if found, null otherwise
 */
export async function checkForTemplateMatch(currentUrl: string): Promise<FormTemplate | null> {
  try {
    // Get user's organization from chrome storage
    const orgId = await getUserOrganizationId();

    // Build API URL - use the platform's API
    const apiBase = getApiBaseUrl();
    const apiUrl = new URL('/api/ed/form-templates', apiBase);
    apiUrl.searchParams.set('url', currentUrl);
    if (orgId) {
      apiUrl.searchParams.set('org_id', orgId);
    }

    console.log('[Ed FormHelper] Checking for template:', apiUrl.toString());

    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      console.warn('[Ed FormHelper] API response not OK:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.found && data.template) {
      console.log('[Ed FormHelper] ✅ Template found:', data.template.form_name);
      return data.template;
    }

    console.log('[Ed FormHelper] No template found for URL');
    return null;
  } catch (error) {
    console.warn('[Ed FormHelper] Template check failed:', error);
    return null;
  }
}

/**
 * Get the API base URL based on current environment
 */
function getApiBaseUrl(): string {
  const hostname = window.location.hostname;

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // Production
  return 'https://schoolgle.co.uk';
}

/**
 * Quick local check for known form patterns
 * This avoids unnecessary API calls for pages that definitely aren't forms
 */
function quickFormPatternCheck(url: string): boolean {
  // Known form URL patterns (matches patterns in database)
  const knownPatterns = [
    'hse.gov.uk/riddor',
    'notifications.hse.gov.uk/riddor',
    'riddorforms',
    // Add more patterns as templates are created
  ];

  const lowerUrl = url.toLowerCase();
  return knownPatterns.some(pattern => lowerUrl.includes(pattern));
}

/**
 * Get user's organization ID from storage
 */
async function getUserOrganizationId(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['ed_org_id'], (result) => {
      resolve(result.ed_org_id || null);
    });
  });
}

/**
 * Fill form using template structure
 */
export async function fillFormUsingTemplate(
  template: FormTemplate,
  userValues: Record<string, string>
): Promise<{ filled: number; skipped: number }> {
  let filled = 0;
  let skipped = 0;

  for (const field of template.form_structure.fields) {
    try {
      // Find the element using the selector
      const element = document.querySelector(field.selector) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

      if (!element) {
        console.warn(`[Ed FormHelper] Field not found: ${field.selector}`);
        skipped++;
        continue;
      }

      // Scroll to element
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(300);

      // Highlight the field
      highlightElement(element);

      // Get the value (from user responses or ask)
      const value = userValues[field.label] || userValues[field.index.toString()];

      if (!value) {
        console.log(`[Ed FormHelper] No value for ${field.label}`);
        skipped++;
        continue;
      }

      // Fill the field
      await fillElement(element, value);
      filled++;

      console.log(`[Ed FormHelper] Filled: ${field.label} = ${value}`);

    } catch (error) {
      console.error(`[Ed FormHelper] Error filling field:`, error);
      skipped++;
    }
  }

  return { filled, skipped };
}

/**
 * Highlight an element to show Ed is working on it
 */
function highlightElement(element: Element): void {
  // Add highlight class
  element.classList.add('ed-field-highlight');

  // Create highlight style if not exists
  if (!document.getElementById('ed-highlight-style')) {
    const style = document.createElement('style');
    style.id = 'ed-highlight-style';
    style.textContent = `
      .ed-field-highlight {
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.5) !important;
        border-color: #10b981 !important;
        transition: all 0.3s ease;
      }
      .ed-field-highlight.filled {
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3) !important;
        background-color: #f0fdf4 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Remove highlight after 2 seconds
  setTimeout(() => {
    element.classList.remove('ed-field-highlight');
    element.classList.add('filled');
  }, 2000);
}

/**
 * Fill an element with a value (human-like typing)
 */
async function fillElement(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string
): Promise<void> {
  element.focus();

  switch (element.tagName.toLowerCase()) {
    case 'select':
      // Select the option
      const select = element as HTMLSelectElement;
      for (const option of select.options) {
        if (option.value === value || option.text === value) {
          select.selectedIndex = option.index;
          break;
        }
      }
      select.dispatchEvent(new Event('change', { bubbles: true }));
      break;

    case 'input':
    case 'textarea':
      // Type the value character by character (human-like)
      const input = element as HTMLInputElement | HTMLTextAreaElement;
      input.value = '';

      for (const char of value) {
        input.value += char;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await delay(50 + Math.random() * 50); // Human-like timing
      }

      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      break;

    case 'radio':
    case 'checkbox':
      (element as HTMLInputElement).checked = true;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      break;
  }
}

/**
 * Show Ed is working badge
 */
export function showWorkingBadge(message: string): HTMLElement {
  let badge = document.getElementById('ed-working-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'ed-working-badge';
    badge.innerHTML = `
      <style>
        #ed-working-badge {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: ed-slide-up 0.3s ease;
        }
        @keyframes ed-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ed-pulse {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: ed-pulse 1s infinite;
        }
        @keyframes ed-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
      <div class="ed-pulse"></div>
      <span class="ed-message"></span>
    `;
    document.body.appendChild(badge);
  }

  const messageEl = badge.querySelector('.ed-message');
  if (messageEl) {
    messageEl.textContent = message;
  }

  return badge!;
}

/**
 * Update the badge message
 */
export function updateBadgeMessage(message: string): void {
  const badge = document.getElementById('ed-working-badge');
  if (badge) {
    const messageEl = badge.querySelector('.ed-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
  }
}

/**
 * Remove the working badge
 */
export function hideWorkingBadge(): void {
  const badge = document.getElementById('ed-working-badge');
  if (badge) {
    badge.style.animation = 'ed-slide-up 0.3s ease reverse';
    setTimeout(() => badge.remove(), 300);
  }
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Show a form helper prompt to the user
 * @param template The matched form template
 * @returns Promise<boolean> - true if user accepted help, false otherwise
 */
export function showFormHelperPrompt(template: FormTemplate): Promise<boolean> {
  return new Promise((resolve) => {
    // Remove any existing prompt
    removeExistingPrompt();

    // Create prompt container
    const prompt = createFormPromptElement(template);
    document.body.appendChild(prompt);

    // Add event listeners
    const guideBtn = prompt.querySelector('[data-action="guide"]');
    const dismissBtn = prompt.querySelector('[data-action="dismiss"]');

    guideBtn?.addEventListener('click', () => {
      removePrompt(prompt);
      resolve(true);
    });

    dismissBtn?.addEventListener('click', () => {
      removePrompt(prompt);
      resolve(false);
    });

    // Auto-dismiss after 30 seconds if no action
    setTimeout(() => {
      if (document.body.contains(prompt)) {
        removePrompt(prompt);
        resolve(false);
      }
    }, 30000);
  });
}

/**
 * Create the form prompt DOM element
 */
function createFormPromptElement(template: FormTemplate): HTMLElement {
  const prompt = document.createElement('div');
  prompt.id = 'ed-form-helper-prompt';
  prompt.className = 'ed-form-helper-prompt';

  const estimatedTime = template.estimated_time_minutes || 5;

  prompt.innerHTML = `
    <style>
      .ed-form-helper-prompt {
        position: fixed;
        bottom: 90px;
        right: 24px;
        width: 360px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        z-index: 2147483646;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: ed-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes ed-slide-up {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .ed-form-prompt-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      .ed-form-avatar {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .ed-form-title {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
      .ed-form-prompt-body {
        padding: 16px 20px;
      }
      .ed-form-intro {
        font-size: 14px;
        color: #374151;
        line-height: 1.5;
        margin-bottom: 8px;
      }
      .ed-form-intro strong {
        color: #111827;
        font-weight: 600;
      }
      .ed-form-description {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.4;
        margin-bottom: 12px;
      }
      .ed-form-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 12px;
        color: #9ca3af;
        padding: 8px 12px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .ed-form-meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .ed-form-actions {
        display: flex;
        gap: 8px;
      }
      .ed-btn-primary, .ed-btn-secondary {
        flex: 1;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        border: none;
      }
      .ed-btn-primary {
        background: #059669;
        color: white;
      }
      .ed-btn-primary:hover {
        background: #047857;
      }
      .ed-btn-secondary {
        background: #f3f4f6;
        color: #6b7280;
      }
      .ed-btn-secondary:hover {
        background: #e5e7eb;
      }
      .ed-close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: #9ca3af;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      .ed-close-btn:hover {
        background: #f3f4f6;
        color: #6b7280;
      }
    </style>

    <div class="ed-form-prompt-header">
      <div class="ed-form-avatar">💬</div>
      <div class="ed-form-title">Ed noticed a form</div>
      <button class="ed-close-btn" data-action="dismiss" title="Close">×</button>
    </div>
    <div class="ed-form-prompt-body">
      <p class="ed-form-intro">
        I can see you're on the <strong>${escapeHtml(template.form_name)}</strong> form.
      </p>
      <p class="ed-form-description">
        ${escapeHtml(template.description || 'I can guide you through filling out this form step by step.')}
      </p>
      <div class="ed-form-meta">
        <span class="ed-form-meta-item">⏱️ ~${estimatedTime} min</span>
        <span class="ed-form-meta-item">📋 ${template.form_category}</span>
      </div>
      <div class="ed-form-actions">
        <button class="ed-btn-secondary" data-action="dismiss">
          No thanks
        </button>
        <button class="ed-btn-primary" data-action="guide">
          Guide me through it
        </button>
      </div>
    </div>
  `;

  return prompt;
}

/**
 * Remove prompt with animation
 */
function removePrompt(prompt: HTMLElement): void {
  prompt.style.animation = 'ed-slide-up 0.2s ease reverse';
  setTimeout(() => prompt.remove(), 200);
}

/**
 * Remove any existing form prompt
 */
function removeExistingPrompt(): void {
  const existing = document.getElementById('ed-form-helper-prompt');
  if (existing) {
    existing.remove();
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Auto-detect and prompt when on a known form page
 * Call this after Ed widget is initialized
 */
export async function autoDetectFormPage(): Promise<boolean> {
  const currentUrl = window.location.href;

  console.log('[Ed FormHelper] Auto-detecting form for:', currentUrl);

  // First, do a quick local check for known form patterns (to avoid API call)
  const quickMatch = quickFormPatternCheck(currentUrl);
  if (!quickMatch) {
    console.log('[Ed FormHelper] No local pattern match, skipping API check');
    return false;
  }

  // Check for template match via API
  const template = await checkForTemplateMatch(currentUrl);

  if (template) {
    console.log('[Ed FormHelper] Form detected, showing prompt...');
    // Show the prompt and wait for user response
    const userAccepted = await showFormHelperPrompt(template);

    if (userAccepted) {
      console.log('[Ed FormHelper] User accepted help - opening Ed chat');
      // Open Ed chat - will be handled by message to widget
      openEdChatForForm(template);
      return true;
    } else {
      console.log('[Ed FormHelper] User declined help');
      // Store preference to not ask again for this session
      sessionStorage.setItem('ed-form-skip-' + template.form_key, Date.now().toString());
      return false;
    }
  }

  return false;
}

/**
 * Send message to Ed widget to start form helper mode
 */
function openEdChatForForm(template: FormTemplate): void {
  console.log('[Ed FormHelper] Opening Ed chat for form:', template.form_name);

  // Post message to the page script to open Ed with form context
  window.postMessage({
    source: 'ed-content-script',
    extensionId: (typeof chrome !== 'undefined' && chrome?.runtime?.id) || 'test',
    type: 'START_FORM_HELPER',
    payload: {
      template: template,
      url: window.location.href,
    }
  }, '*');

  // Also try sending via chrome runtime for background script handling
  if (typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      type: 'OPEN_ED_FOR_FORM',
      template: template,
    }).catch(() => {
      // Background script might not be listening, that's okay
      console.log('[Ed FormHelper] Background script message failed (expected in some contexts)');
    });
  }
}

// Export for use in content script
export const FormTemplateHelper = {
  checkForTemplateMatch,
  fillFormUsingTemplate,
  showWorkingBadge,
  updateBadgeMessage,
  hideWorkingBadge,
  autoDetectFormPage,
};
