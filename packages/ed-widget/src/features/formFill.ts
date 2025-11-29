/**
 * FormFiller - Detects and helps fill forms on the page
 */

import type { FormField } from '../types';

export class FormFiller {
  private currentForm: HTMLFormElement | null = null;
  private fields: FormField[] = [];
  private currentFieldIndex = 0;
  private isActive = false;

  /**
   * Detect forms on the current page
   */
  public detectForms(): HTMLFormElement[] {
    const forms = document.querySelectorAll('form');
    return Array.from(forms).filter((form) => {
      // Filter out hidden forms or forms with no visible inputs
      const inputs = form.querySelectorAll('input, textarea, select');
      return inputs.length > 0 && this.isVisible(form);
    });
  }

  /**
   * Start filling a specific form
   */
  public startFilling(form: HTMLFormElement): FormField | null {
    this.currentForm = form;
    this.fields = this.extractFields(form);
    this.currentFieldIndex = 0;
    this.isActive = true;

    return this.getCurrentField();
  }

  /**
   * Get current field being filled
   */
  public getCurrentField(): FormField | null {
    if (!this.isActive || this.currentFieldIndex >= this.fields.length) {
      return null;
    }
    return this.fields[this.currentFieldIndex];
  }

  /**
   * Fill current field with value
   */
  public fillCurrentField(value: string): boolean {
    const field = this.getCurrentField();
    if (!field) return false;

    this.fillField(field, value);
    return true;
  }

  /**
   * Fill current field with voice input (fuzzy matching)
   */
  public fillFieldByVoice(text: string): boolean {
    const field = this.getCurrentField();
    if (!field) return false;

    // Normalize text
    const cleanText = text.trim();

    // Handle specific field types with fuzzy logic
    if (field.type === 'checkbox') {
      const yesWords = ['yes', 'check', 'true', 'agree', 'correct', 'right'];
      const noWords = ['no', 'uncheck', 'false', 'disagree', 'wrong'];

      if (yesWords.some(w => cleanText.toLowerCase().includes(w))) {
        this.fillField(field, 'true');
        return true;
      } else if (noWords.some(w => cleanText.toLowerCase().includes(w))) {
        this.fillField(field, 'false');
        return true;
      }
    }

    // Default: just fill with text
    this.fillField(field, cleanText);
    return true;
  }

  /**
   * Move to next field
   */
  public nextField(): FormField | null {
    this.currentFieldIndex++;
    return this.getCurrentField();
  }

  /**
   * Move to previous field
   */
  public previousField(): FormField | null {
    if (this.currentFieldIndex > 0) {
      this.currentFieldIndex--;
    }
    return this.getCurrentField();
  }

  /**
   * Stop form filling
   */
  public stop(): void {
    this.isActive = false;
    this.currentForm = null;
    this.fields = [];
    this.currentFieldIndex = 0;
  }

  /**
   * Submit the current form
   */
  public submitForm(): boolean {
    if (!this.currentForm) return false;

    // Trigger form submission
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const shouldSubmit = this.currentForm.dispatchEvent(submitEvent);

    if (shouldSubmit) {
      this.currentForm.submit();
    }

    return shouldSubmit;
  }

  /**
   * Get progress info
   */
  public getProgress(): { current: number; total: number; percentage: number } {
    const total = this.fields.length;
    const current = this.currentFieldIndex + 1;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  }

  /**
   * Extract fillable fields from a form
   */
  private extractFields(form: HTMLFormElement): FormField[] {
    const fields: FormField[] = [];
    const elements = form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >('input, textarea, select');

    elements.forEach((element) => {
      // Skip hidden, submit, and button fields
      if (
        element instanceof HTMLInputElement &&
        ['hidden', 'submit', 'button', 'reset', 'image'].includes(element.type)
      ) {
        return;
      }

      // Skip invisible elements
      if (!this.isVisible(element)) return;

      const label = this.findLabel(element);
      const field: FormField = {
        element,
        label: label || element.name || element.id || 'Field',
        type: this.getFieldType(element),
        required: element.required,
        placeholder: element.placeholder,
      };

      fields.push(field);
    });

    return fields;
  }

  /**
   * Find label for an input element
   */
  private findLabel(element: HTMLElement): string {
    // Check for associated label
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || '';
    }

    // Check for wrapping label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      const text = parentLabel.textContent?.trim() || '';
      // Remove the input's value from the label text
      const inputValue = (element as HTMLInputElement).value;
      return text.replace(inputValue, '').trim();
    }

    // Check for aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check for placeholder as fallback
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    return '';
  }

  /**
   * Get friendly field type name
   */
  private getFieldType(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  ): string {
    if (element instanceof HTMLSelectElement) return 'dropdown';
    if (element instanceof HTMLTextAreaElement) return 'text area';

    switch ((element as HTMLInputElement).type) {
      case 'email':
        return 'email address';
      case 'tel':
        return 'phone number';
      case 'date':
        return 'date';
      case 'number':
        return 'number';
      case 'checkbox':
        return 'checkbox';
      case 'radio':
        return 'choice';
      case 'password':
        return 'password';
      case 'url':
        return 'website';
      default:
        return 'text';
    }
  }

  /**
   * Fill a field with animated typing effect
   */
  private fillField(field: FormField, value: string): void {
    const element = field.element;

    // Scroll field into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Focus the field
    element.focus();

    // Handle different field types
    if (element instanceof HTMLSelectElement) {
      // Find matching option
      const options = Array.from(element.options);
      const match = options.find(
        (opt) =>
          opt.value.toLowerCase() === value.toLowerCase() ||
          opt.text.toLowerCase().includes(value.toLowerCase())
      );
      if (match) {
        element.value = match.value;
      }
    } else if (
      element instanceof HTMLInputElement &&
      element.type === 'checkbox'
    ) {
      element.checked = ['yes', 'true', '1'].includes(value.toLowerCase());
    } else if (
      element instanceof HTMLInputElement &&
      element.type === 'radio'
    ) {
      // Find matching radio button
      const name = element.name;
      const radios = document.querySelectorAll<HTMLInputElement>(
        `input[name="${name}"]`
      );
      radios.forEach((radio) => {
        if (
          radio.value.toLowerCase() === value.toLowerCase() ||
          this.findLabel(radio).toLowerCase().includes(value.toLowerCase())
        ) {
          radio.checked = true;
        }
      });
    } else if (
      element instanceof HTMLInputElement &&
      element.type === 'date'
    ) {
      // Date input - parse natural language and set formatted date
      const formattedDate = this.parseDateToISO(value);
      if (formattedDate) {
        element.value = formattedDate;
      } else {
        // If parsing fails, try setting directly (might already be in correct format)
        element.value = value;
      }
    } else {
      // Text input - type with animation
      this.typeText(element as HTMLInputElement | HTMLTextAreaElement, value);
    }

    // Highlight the field
    this.highlightField(element);

    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Parse natural language date to ISO format (yyyy-MM-dd)
   * Handles formats like:
   * - "18th of June 1972"
   * - "June 18, 1972"
   * - "18/06/1972"
   * - "18-06-1972"
   * - "1972-06-18"
   */
  private parseDateToISO(dateText: string): string | null {
    if (!dateText || !dateText.trim()) return null;

    const cleanText = dateText.trim();

    // Check if already in ISO format (yyyy-MM-dd)
    const isoFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (isoFormat.test(cleanText)) {
      return cleanText;
    }

    try {
      // Try parsing directly with Date constructor
      let date = new Date(cleanText);
      
      // If that fails, try common patterns
      if (isNaN(date.getTime())) {
        // Handle "18th of June 1972" or "18th June 1972"
        const ordinalPattern = /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)\s+(\d{4})/i;
        const ordinalMatch = cleanText.match(ordinalPattern);
        if (ordinalMatch) {
          const day = parseInt(ordinalMatch[1], 10);
          const monthName = ordinalMatch[2];
          const year = parseInt(ordinalMatch[3], 10);
          date = new Date(`${monthName} ${day}, ${year}`);
        } else {
          // Try "June 18 1972" format
          const spacePattern = /([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i;
          const spaceMatch = cleanText.match(spacePattern);
          if (spaceMatch) {
            const monthName = spaceMatch[1];
            const day = parseInt(spaceMatch[2], 10);
            const year = parseInt(spaceMatch[3], 10);
            date = new Date(`${monthName} ${day}, ${year}`);
          } else {
            // Try DD/MM/YYYY or DD-MM-YYYY
            const slashPattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
            const slashMatch = cleanText.match(slashPattern);
            if (slashMatch) {
              // Assume DD/MM/YYYY format (European)
              const day = parseInt(slashMatch[1], 10);
              const month = parseInt(slashMatch[2], 10);
              const year = parseInt(slashMatch[3], 10);
              date = new Date(year, month - 1, day);
            }
          }
        }
      }

      // Check if we got a valid date
      if (isNaN(date.getTime())) {
        return null;
      }

      // Format as yyyy-MM-dd
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('[FormFill] Failed to parse date:', dateText, error);
      return null;
    }
  }

  /**
   * Type text with realistic animation
   */
  private typeText(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string
  ): Promise<void> {
    return new Promise((resolve) => {
      element.value = '';
      let index = 0;

      const type = () => {
        if (index < text.length) {
          element.value += text[index];
          index++;
          // Random delay between 30-80ms for realism
          setTimeout(type, 30 + Math.random() * 50);
        } else {
          resolve();
        }
      };

      type();
    });
  }

  /**
   * Highlight a field temporarily
   */
  private highlightField(element: HTMLElement): void {
    const originalOutline = element.style.outline;
    const originalBoxShadow = element.style.boxShadow;

    element.style.outline = '2px solid #2dd4bf';
    element.style.boxShadow = '0 0 10px rgba(45, 212, 191, 0.5)';

    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.boxShadow = originalBoxShadow;
    }, 2000);
  }

  /**
   * Check if element is visible
   */
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetParent !== null
    );
  }
}

