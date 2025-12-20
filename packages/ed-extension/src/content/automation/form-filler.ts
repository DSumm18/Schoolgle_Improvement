// Form Filler - Automatically fills forms for Act Mode
// Respects GDPR and never touches password fields

import { Clicker } from './clicker';
import type { FormInfo, FormFieldInfo } from '@/shared/types';

export interface FormFillData {
  [fieldName: string]: string;
}

export interface FormFillOptions {
  /** Skip password fields (default: true) */
  skipPasswords?: boolean;
  /** Skip fields that already have values (default: true) */
  skipFilled?: boolean;
  /** Delay between fields in ms (default: 300) */
  fieldDelay?: number;
  /** Callback for each field filled */
  onFieldFilled?: (field: FormFieldInfo, value: string) => void;
  /** Callback on interrupt */
  onInterrupt?: () => void;
}

/**
 * Form Filler for Act Mode
 * Intelligently fills form fields
 */
export class FormFiller {
  private clicker: Clicker;
  private options: Required<FormFillOptions>;
  private isActive: boolean = false;
  
  constructor(options: FormFillOptions = {}) {
    this.options = {
      skipPasswords: options.skipPasswords ?? true,
      skipFilled: options.skipFilled ?? true,
      fieldDelay: options.fieldDelay ?? 300,
      onFieldFilled: options.onFieldFilled ?? (() => {}),
      onInterrupt: options.onInterrupt ?? (() => {}),
    };
    
    this.clicker = new Clicker({
      onInterrupt: () => {
        this.isActive = false;
        this.options.onInterrupt();
      },
    });
  }
  
  /**
   * Fill a form with provided data
   */
  async fillForm(form: FormInfo, data: FormFillData): Promise<{ filled: number; skipped: number }> {
    this.isActive = true;
    let filled = 0;
    let skipped = 0;
    
    for (const field of form.fields) {
      if (!this.isActive) break;
      
      // Skip password fields
      if (this.options.skipPasswords && field.isPassword) {
        console.log('[Ed FormFiller] Skipping password field:', field.name);
        skipped++;
        continue;
      }
      
      // Skip already filled fields
      if (this.options.skipFilled && field.value) {
        console.log('[Ed FormFiller] Skipping filled field:', field.name);
        skipped++;
        continue;
      }
      
      // Get value for this field
      const value = this.findValueForField(field, data);
      if (!value) {
        console.log('[Ed FormFiller] No data for field:', field.name);
        skipped++;
        continue;
      }
      
      // Fill the field
      const success = await this.fillField(field, value);
      if (success) {
        filled++;
        this.options.onFieldFilled(field, value);
      } else {
        skipped++;
      }
      
      // Delay between fields
      await this.delay(this.options.fieldDelay);
    }
    
    this.isActive = false;
    return { filled, skipped };
  }
  
  /**
   * Fill a single field
   */
  private async fillField(field: FormFieldInfo, value: string): Promise<boolean> {
    const selector = this.getFieldSelector(field);
    if (!selector) {
      console.warn('[Ed FormFiller] Cannot build selector for field:', field);
      return false;
    }
    
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      console.warn('[Ed FormFiller] Field not found:', selector);
      return false;
    }
    
    try {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'number':
        case 'textarea':
          return await this.clicker.type(selector, value);
          
        case 'select':
        case 'select-one':
        case 'select-multiple':
          return await this.clicker.select(selector, value);
          
        case 'checkbox':
          // Only click if we need to change state
          const checkbox = element as HTMLInputElement;
          const shouldBeChecked = value === 'true' || value === '1' || value === 'yes';
          if (checkbox.checked !== shouldBeChecked) {
            return await this.clicker.click(selector);
          }
          return true;
          
        case 'radio':
          // Find the radio with matching value
          const radioSelector = `input[name="${field.name}"][value="${value}"]`;
          return await this.clicker.click(radioSelector);
          
        default:
          console.warn('[Ed FormFiller] Unknown field type:', field.type);
          return false;
      }
    } catch (error) {
      console.error('[Ed FormFiller] Error filling field:', error);
      return false;
    }
  }
  
  /**
   * Build CSS selector for a field
   */
  private getFieldSelector(field: FormFieldInfo): string | null {
    if (field.id) {
      return `#${CSS.escape(field.id)}`;
    }
    if (field.name) {
      return `[name="${CSS.escape(field.name)}"]`;
    }
    return null;
  }
  
  /**
   * Find the appropriate value for a field from the data
   */
  private findValueForField(field: FormFieldInfo, data: FormFillData): string | null {
    // Try exact match on id
    if (field.id && data[field.id]) {
      return data[field.id];
    }
    
    // Try exact match on name
    if (field.name && data[field.name]) {
      return data[field.name];
    }
    
    // Try fuzzy match on label
    if (field.label) {
      const normalizedLabel = this.normalizeKey(field.label);
      for (const [key, value] of Object.entries(data)) {
        if (this.normalizeKey(key) === normalizedLabel) {
          return value;
        }
      }
    }
    
    // Try common field mappings
    const commonMappings: Record<string, string[]> = {
      'firstName': ['first_name', 'firstname', 'fname', 'given_name', 'forename'],
      'lastName': ['last_name', 'lastname', 'lname', 'surname', 'family_name'],
      'email': ['email_address', 'e-mail', 'emailaddress'],
      'phone': ['telephone', 'tel', 'mobile', 'contact_number', 'phone_number'],
      'address': ['address1', 'address_line_1', 'street_address'],
      'city': ['town', 'locality'],
      'postcode': ['zip', 'postal_code', 'zipcode'],
    };
    
    const fieldKey = this.normalizeKey(field.name || field.id || field.label);
    
    for (const [dataKey, dataValue] of Object.entries(data)) {
      const normalizedDataKey = this.normalizeKey(dataKey);
      
      // Check if this data key maps to our field
      for (const [canonical, aliases] of Object.entries(commonMappings)) {
        if (normalizedDataKey === canonical || aliases.includes(normalizedDataKey)) {
          if (fieldKey === canonical || aliases.includes(fieldKey)) {
            return dataValue;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Normalize a key for comparison
   */
  private normalizeKey(key: string): string {
    return key
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }
  
  /**
   * Stop form filling
   */
  stop(): void {
    this.isActive = false;
    this.clicker.stop(false);
  }
  
  /**
   * Destroy the form filler
   */
  destroy(): void {
    this.stop();
    this.clicker.destroy();
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

