/**
 * Form Learning Mode
 *
 * Ed learns how to fill forms by watching users complete them.
 * Personal data is never stored - only structure and patterns.
 */

// ============================================================================
// Types
// ============================================================================

interface FieldObservation {
  selector: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    pattern?: string;
    message?: string;
  };
  // Learned from user
  semanticMeaning?: string;
  dataSource?: string;
  helpText?: string;
}

interface FormObservation {
  url: string;
  formName: string;
  fields: FieldObservation[];
  sections: Array<{
    title: string;
    fields: string[];
  }>;
  navigation: Array<{
    action: string;
    target: string;
    condition?: string;
  }>;
  submission: {
    method: string;
    target: string;
    confirmation?: string;
  };
}

interface LearningSession {
  id: string;
  formName: string;
  startedAt: Date;
  fields: Map<string, FieldObservation>;
  questionsAsked: number;
  questionsAnswered: number;
}

// ============================================================================
// Privacy Filter
// ============================================================================

class PrivacyFilter {
  private readonly sensitivePatterns = [
    { pattern: /^\d{16}$/, type: 'CREDIT_CARD' },
    { pattern: /^[A-Z]{3}\d{6}$/, type: 'NI_NUMBER' },
    { pattern: /@/, type: 'EMAIL' },
    { pattern: /^\d{11}$/, type: 'PHONE_NUMBER' },
    { pattern: /^\d{4}-\d{2}-\d{2}$/, type: 'DATE' },
    { pattern: /^\d{2}\/\d{2}\/\d{4}$/, type: 'DATE' },
  ];

  /**
   * Sanitize a value - return type only, never the actual value
   */
  sanitize(value: any): string {
    if (value === null || value === undefined) return 'EMPTY';
    if (typeof value !== 'string') return typeof value;

    const str = String(value).trim();

    // Check for sensitive patterns
    for (const { pattern, type } of this.sensitivePatterns) {
      if (pattern.test(str)) {
        return type;
      }
    }

    // Long text - return type only
    if (str.length > 50) {
      return 'LONG_TEXT';
    }

    // Short non-sensitive values - hash them
    return this.hash(str);
  }

  /**
   * Determine the type of a field value without storing the value
   */
  getType(value: any): string {
    if (value === null || value === undefined) return 'empty';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'array';

    const str = String(value).trim();

    if (str === '') return 'empty';
    if (/^\d+$/.test(str)) return 'number';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return 'date';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return 'date';
    if (/@/.test(str)) return 'email';
    if (str.includes(',')) return 'list';

    return 'text';
  }

  /**
   * One-way hash - can't reverse to original
   */
  private hash(value: string): string {
    // Simple hash for demo - use proper crypto in production
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `H${Math.abs(hash).toString(16)}`;
  }

  /**
   * Check if a value should be captured at all
   */
  shouldCapture(value: any): boolean {
    // We always capture structure, but never sensitive values
    return true;
  }
}

// ============================================================================
// Form Learner
// ============================================================================

export class FormLearner {
  private session: LearningSession | null = null;
  private privacyFilter = new PrivacyFilter();
  private observer: MutationObserver | null = null;
  private uiContainer: HTMLElement | null = null;

  /**
   * Start a learning session
   */
  startLearning(formName: string): void {
    this.session = {
      id: crypto.randomUUID(),
      formName,
      startedAt: new Date(),
      fields: new Map(),
      questionsAsked: 0,
      questionsAnswered: 0,
    };

    console.log('[Ed Form Learner] Starting learning session:', formName);
    this.showUI();
    this.observeForm();
  }

  /**
   * Stop the learning session
   */
  async stopLearning(): Promise<FormObservation | null> {
    if (!this.session) return null;

    console.log('[Ed Form Learner] Stopping learning session');

    // Stop observing
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Consolidate observations
    const observation = this.consolidateObservations();

    // Clean up UI
    this.hideUI();

    // Reset session
    this.session = null;

    return observation;
  }

  /**
   * Observe the form for changes
   */
  private observeForm(): void {
    if (!this.session) return;

    // Find all form inputs
    const formElements = document.querySelectorAll(
      'input, textarea, select'
    );

    formElements.forEach(element => {
      this.observeField(element as HTMLElement);
    });

    // Watch for dynamically added fields
    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            const inputs = node.querySelectorAll(
              'input, textarea, select'
            );
            inputs.forEach(input => {
              this.observeField(input as HTMLElement);
            });
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Observe a single field
   */
  private observeField(element: HTMLElement): void {
    if (!this.session) return;

    const selector = this.getSelector(element);
    if (this.session.fields.has(selector)) return; // Already observed

    const field = this.extractFieldInfo(element);

    // Listen for value changes
    if (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement) {

      element.addEventListener('change', (e) => {
        this.onFieldValueChange(element, (e.target as any).value);
      });

      element.addEventListener('blur', (e) => {
        this.onFieldBlur(element, (e.target as any).value);
      });
    }

    this.session.fields.set(selector, field);

    // Ask user about this field if we don't understand it
    this.maybeAskAboutField(field, element);
  }

  /**
   * Extract field information without capturing values
   */
  private extractFieldInfo(element: HTMLElement): FieldObservation {
    const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    return {
      selector: this.getSelector(element),
      type: input.type || element.tagName.toLowerCase(),
      label: this.getLabel(element),
      placeholder: (input as HTMLInputElement).placeholder || undefined,
      required: input.required || false,
      options: this.getOptions(element),
    };
  }

  /**
   * Get a unique selector for an element
   */
  private getSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.name) {
      return `[name="${element.name}"]`;
    }

    // Build path-based selector
    const path: string[] = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.className) {
        const classes = current.className.split(' ')
          .filter(c => c)
          .map(c => `.${c}`)
          .join('');
        if (classes) {
          selector += classes;
        }
      }

      path.unshift(selector);
      current = current.parentElement as HTMLElement;
    }

    return path.join(' > ');
  }

  /**
   * Get the label for a field
   */
  private getLabel(element: HTMLElement): string {
    // Check for label element
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return label.textContent?.trim() || '';
      }
    }

    // Check for aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    // Check for placeholder
    const placeholder = (element as HTMLInputElement).placeholder;
    if (placeholder) {
      return placeholder;
    }

    // Look for nearby text
    let sibling = element.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === 'LABEL' || sibling.tagName === 'SPAN' || sibling.tagName === 'DIV') {
        const text = sibling.textContent?.trim();
        if (text && text.length < 100) {
          return text;
        }
      }
      sibling = sibling.previousElementSibling;
    }

    return 'Unknown Field';
  }

  /**
   * Get options for a select element
   */
  private getOptions(element: HTMLElement): string[] | undefined {
    if (element.tagName !== 'SELECT') {
      return undefined;
    }

    const select = element as HTMLSelectElement;
    return Array.from(select.options)
      .map(opt => opt.text)
      .filter(text => text && text !== '' && text !== 'Select...');
  }

  /**
   * Handle field value change (without storing the value)
   */
  private onFieldValueChange(element: HTMLElement, value: any): void {
    if (!this.session) return;

    const selector = this.getSelector(element);
    const field = this.session.fields.get(selector);

    if (!field) return;

    // Detect validation patterns from the value type
    const valueType = this.privacyFilter.getType(value);

    if (valueType === 'date' && !field.validation) {
      field.validation = {
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        message: 'Use YYYY-MM-DD format',
      };
    }

    if (valueType === 'email' && !field.validation) {
      field.validation = {
        pattern: '^[^@]+@[^@]+\\.[^@]+$',
        message: 'Enter a valid email address',
      };
    }
  }

  /**
   * Handle field blur (user finished entering data)
   */
  private onFieldBlur(element: HTMLElement, value: any): void {
    if (!this.session) return;

    // We could trigger a clarification question here
    // if the field seems important and we don't have a meaning for it
  }

  /**
   * Ask user about a field if we need clarification
   */
  private maybeAskAboutField(field: FieldObservation, element: HTMLElement): void {
    // Skip if we already understand this field
    if (field.semanticMeaning) return;

    // Only ask about required fields
    if (!field.required) return;

    // Defer asking to avoid overwhelming user
    setTimeout(() => {
      if (this.session && this.session.questionsAsked < 10) {
        this.askAboutField(field, element);
      }
    }, 2000);
  }

  /**
   * Ask user what a field is for
   */
  private askAboutField(field: FieldObservation, element: HTMLElement): void {
    if (!this.session) return;

    this.session.questionsAsked++;

    // Highlight the field
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.outline = '3px solid #3b82f6';
    element.style.outlineOffset = '2px';

    // Remove highlight after asking
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 5000);

    // Update UI with question
    this.updateUI({
      type: 'field_question',
      field,
      question: `What is the "${field.label}" field for?`,
      options: [
        'The date something happened',
        'The date you\'re reporting',
        'A person\'s name',
        'Other (let me explain)',
      ],
    });
  }

  /**
   * User answered a question
   */
  answerQuestion(answer: string, customExplanation?: string): void {
    if (!this.session) return;

    this.session.questionsAnswered++;

    // Store the semantic meaning
    if (this.currentQuestionField) {
      this.currentQuestionField.semanticMeaning = customExplanation || answer;
    }

    // Clear question and continue
    this.currentQuestionField = null;
    this.updateUI({ type: 'observation' });
  }

  private currentQuestionField: FieldObservation | null = null;

  /**
   * Consolidate all observations into a form template
   */
  private consolidateObservations(): FormObservation | null {
    if (!this.session) return null;

    return {
      url: window.location.href,
      formName: this.session.formName,
      fields: Array.from(this.session.fields.values()),
      sections: this.detectSections(),
      navigation: this.detectNavigation(),
      submission: this.detectSubmission(),
    };
  }

  /**
   * Detect form sections
   */
  private detectSections(): Array<{ title: string; fields: string[] }> {
    const sections: Array<{ title: string; fields: string[] }> = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, fieldset legend');

    headings.forEach(heading => {
      const title = heading.textContent?.trim();
      if (!title) return;

      // Find fields in this section
      const parent = heading.closest('fieldset, fieldset, div, section');
      if (!parent) return;

      const fields = Array.from(parent.querySelectorAll('input, textarea, select'))
        .map(el => this.getSelector(el as HTMLElement));

      if (fields.length > 0) {
        sections.push({ title, fields });
      }
    });

    return sections;
  }

  /**
   * Detect navigation steps
   */
  private detectNavigation(): Array<{ action: string; target: string; condition?: string }> {
    // Look for tabs, accordions, multi-step indicators
    const navigation: Array<{ action: string; target: string; condition?: string }> = [];

    // Tabs
    const tabs = document.querySelectorAll('[role="tab"], .tab, .step');
    tabs.forEach((tab, index) => {
      navigation.push({
        action: 'click',
        target: this.getSelector(tab as HTMLElement),
        condition: index === 0 ? 'initial' : undefined,
      });
    });

    return navigation;
  }

  /**
   * Detect submission method
   */
  private detectSubmission(): { method: string; target: string; confirmation?: string } {
    const submitButton = document.querySelector(
      'button[type="submit"], input[type="submit"], .submit, [type="submit"]'
    );

    if (submitButton) {
      return {
        method: 'click',
        target: this.getSelector(submitButton as HTMLElement),
      };
    }

    // Look for form element
    const form = document.querySelector('form');
    if (form) {
      return {
        method: (form as HTMLFormElement).method || 'post',
        target: (form as HTMLFormElement).action || window.location.href,
      };
    }

    return {
      method: 'unknown',
      target: 'unknown',
    };
  }

  /**
   * Show learning mode UI
   */
  private showUI(): void {
    if (this.uiContainer) return;

    this.uiContainer = document.createElement('div');
    this.uiContainer.id = 'ed-learning-ui';
    this.uiContainer.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; z-index: 999999;
                  background: white; border: 2px solid #3b82f6; border-radius: 12px;
                  padding: 20px; max-width: 350px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                  font-family: system-ui, -apple-system, sans-serif;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 40px; height: 40px; background: #3b82f6; border-radius: 50%;
                      display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">
            💬
          </div>
          <div>
            <div style="font-weight: 600; font-size: 16px;">Ed is Learning</div>
            <div style="font-size: 13px; color: #666;">Watching how you fill this form</div>
          </div>
        </div>
        <div id="ed-learning-content" style="min-height: 60px;">
          <p style="font-size: 14px; color: #333;">
            Fill the form normally. I'll learn the structure and ask if I need clarification.
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 12px;">
            🔒 Your data stays private - I only learn the form structure.
          </p>
        </div>
        <div id="ed-learning-actions" style="margin-top: 16px; display: none;">
        </div>
        <button id="ed-learning-stop" style="margin-top: 16px; width: 100%; padding: 10px;
                   background: #f3f4f6; border: none; border-radius: 6px;
                   cursor: pointer; font-size: 14px; font-weight: 500;">
          I'm Done - Save Learning
        </button>
      </div>
    `;

    document.body.appendChild(this.uiContainer);

    // Handle stop button
    const stopButton = this.uiContainer.querySelector('#ed-learning-stop');
    stopButton?.addEventListener('click', () => {
      this.stopLearning();
    });
  }

  /**
   * Hide learning mode UI
   */
  private hideUI(): void {
    if (this.uiContainer) {
      this.uiContainer.remove();
      this.uiContainer = null;
    }
  }

  /**
   * Update the UI with a question or status
   */
  private updateUI(content: { type: string; field?: FieldObservation; question?: string; options?: string[] }): void {
    if (!this.uiContainer) return;

    const contentDiv = this.uiContainer.querySelector('#ed-learning-content');
    const actionsDiv = this.uiContainer.querySelector('#ed-learning-actions');

    if (content.type === 'field_question' && content.field && content.question && content.options) {
      this.currentQuestionField = content.field;

      if (contentDiv) {
        contentDiv.innerHTML = `
          <p style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">${content.question}</p>
        `;
      }

      if (actionsDiv && content.options) {
        actionsDiv.style.display = 'block';
        actionsDiv.innerHTML = content.options.map(option => `
          <button class="ed-learning-option" data-option="${option}"
                  style="display: block; width: 100%; padding: 10px; margin-bottom: 8px;
                         background: white; border: 1px solid #d1d5db; border-radius: 6px;
                         cursor: pointer; font-size: 14px; text-align: left;">
            ${option}
          </button>
        `).join('') + `
          <button class="ed-learning-custom" style="display: block; width: 100%; padding: 10px;
                   background: #f9fafb; border: 1px dashed #9ca3af; border-radius: 6px;
                   cursor: pointer; font-size: 14px; color: #666;">
            Let me explain differently...
          </button>
        `;

        // Add click handlers
        actionsDiv.querySelectorAll('.ed-learning-option').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const option = (e.currentTarget as HTMLElement).getAttribute('data-option');
            this.answerQuestion(option || '');
          });
        });

        actionsDiv.querySelector('.ed-learning-custom')?.addEventListener('click', () => {
          const explanation = prompt('Please explain what this field is for:');
          if (explanation) {
            this.answerQuestion('custom', explanation);
          }
        });
      }
    } else if (content.type === 'observation') {
      if (contentDiv) {
        const fieldCount = this.session?.fields.size || 0;
        contentDiv.innerHTML = `
          <p style="font-size: 14px; color: #333;">
            Learning in progress... (${fieldCount} fields observed)
          </p>
        `;
      }
      if (actionsDiv) {
        actionsDiv.style.display = 'none';
      }
    }
  }

  /**
   * Get current session status
   */
  getStatus(): { active: boolean; fields: number; questions: number } {
    return {
      active: this.session !== null,
      fields: this.session?.fields.size || 0,
      questions: this.session?.questionsAnswered || 0,
    };
  }
}

// ============================================================================
// Global Instance
// ============================================================================

let formLearnerInstance: FormLearner | null = null;

export function getFormLearner(): FormLearner {
  if (!formLearnerInstance) {
    formLearnerInstance = new FormLearner();
  }
  return formLearnerInstance;
}

// Make available globally for background script communication
if (typeof window !== 'undefined') {
  (window as any).edFormLearner = getFormLearner();
}
