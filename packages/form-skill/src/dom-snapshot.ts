/**
 * DOM Snapshot
 * Extracts form field schema from DOM with PII masking
 */

import type { FieldSchema, FormSchema, ElementHints } from './types';
import { containsPII, maskPII, isPIIField } from './pii-detection';

/**
 * Generate CSS selector for an element
 */
function generateSelector(element: HTMLElement): string {
  // Prefer data-testid
  if (element.dataset.testid) {
    return `[data-testid="${element.dataset.testid}"]`;
  }
  
  // Prefer ID
  if (element.id) {
    return `#${element.id}`;
  }
  
  // Prefer name
  if ((element as HTMLInputElement).name) {
    const name = (element as HTMLInputElement).name;
    return `input[name="${name}"], select[name="${name}"], textarea[name="${name}"]`;
  }
  
  // Fallback: use label + type
  const label = findLabel(element);
  if (label) {
    const labelText = label.textContent?.trim() || '';
    const type = element.tagName.toLowerCase();
    return `${type}[aria-label*="${labelText.substring(0, 20)}"]`;
  }
  
  // Last resort: nth-of-type
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element);
    const tag = element.tagName.toLowerCase();
    return `${tag}:nth-of-type(${index + 1})`;
  }
  
  return '';
}

/**
 * Generate fallback selectors
 */
function generateFallbackSelectors(element: HTMLElement): string[] {
  const selectors: string[] = [];
  
  // Try by name
  if ((element as HTMLInputElement).name) {
    selectors.push(`[name="${(element as HTMLInputElement).name}"]`);
  }
  
  // Try by placeholder
  const placeholder = (element as HTMLInputElement).placeholder;
  if (placeholder) {
    selectors.push(`[placeholder="${placeholder}"]`);
  }
  
  // Try by aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    selectors.push(`[aria-label="${ariaLabel}"]`);
  }
  
  return selectors;
}

/**
 * Find associated label element
 */
function findLabel(element: HTMLElement): HTMLLabelElement | null {
  // Check for explicit label[for]
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`) as HTMLLabelElement;
    if (label) return label;
  }
  
  // Check for parent label
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel as HTMLLabelElement;
  
  // Check for aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const label = document.getElementById(labelledBy);
    if (label && label.tagName.toLowerCase() === 'label') {
      return label as HTMLLabelElement;
    }
  }
  
  return null;
}

/**
 * Extract field type from element
 */
function extractFieldType(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'input') {
    const input = element as HTMLInputElement;
    const type = input.type || 'text';
    
    // Special handling for typeahead/autocomplete
    if (input.hasAttribute('autocomplete') || 
        input.getAttribute('role') === 'combobox' ||
        input.classList.contains('typeahead') ||
        input.classList.contains('autocomplete')) {
      return 'typeahead';
    }
    
    return type;
  }
  
  if (tagName === 'select') {
    return 'select';
  }
  
  if (tagName === 'textarea') {
    return 'textarea';
  }
  
  return 'text';
}

/**
 * Extract options for select/radio/checkbox
 */
function extractOptions(element: HTMLElement): Array<{ value: string; label: string; selected?: boolean }> {
  const options: Array<{ value: string; label: string; selected?: boolean }> = [];
  
  if (element instanceof HTMLSelectElement) {
    Array.from(element.options).forEach(option => {
      options.push({
        value: option.value,
        label: option.text,
        selected: option.selected,
      });
    });
  } else if (element instanceof HTMLInputElement && element.type === 'radio') {
    const name = element.name;
    if (name) {
      const radios = document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);
      radios.forEach(radio => {
        const label = findLabel(radio);
        options.push({
          value: radio.value,
          label: label?.textContent?.trim() || radio.value,
          selected: radio.checked,
        });
      });
    }
  }
  
  return options;
}

/**
 * Get element position for disambiguation
 */
function getElementPosition(element: HTMLElement): { x: number; y: number } | undefined {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Calculate confidence score for field detection
 */
function calculateConfidence(element: HTMLElement, label: string | null): number {
  let confidence = 0.5; // Base confidence
  
  // Has ID: +0.2
  if (element.id) confidence += 0.2;
  
  // Has name: +0.15
  if ((element as HTMLInputElement).name) confidence += 0.15;
  
  // Has label: +0.15
  if (label) confidence += 0.15;
  
  // Has data-testid: +0.1
  if (element.dataset.testid) confidence += 0.1;
  
  // Has placeholder: +0.05
  if ((element as HTMLInputElement).placeholder) confidence += 0.05;
  
  return Math.min(confidence, 1.0);
}

/**
 * Extract field schema from a form element
 */
function extractFieldSchema(element: HTMLElement, formId: string, index: number): FieldSchema | null {
  const tagName = element.tagName.toLowerCase();
  
  // Only process input, select, textarea
  if (!['input', 'select', 'textarea'].includes(tagName)) {
    return null;
  }
  
  // Skip hidden, submit, button, image fields
  if (element instanceof HTMLInputElement) {
    const type = element.type;
    if (['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) {
      return null;
    }
    
    // Never process password fields
    if (type === 'password') {
      return null;
    }
  }
  
  const label = findLabel(element);
  const labelText = label?.textContent?.trim() || 
                    element.getAttribute('aria-label') || 
                    (element as HTMLInputElement).placeholder || 
                    '';
  
  const fieldType = extractFieldType(element);
  const selector = generateSelector(element);
  const fallbackSelectors = generateFallbackSelectors(element);
  
  // Get current value (mask if PII)
  let currentValue = '';
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    currentValue = element.value || '';
  } else if (element instanceof HTMLSelectElement) {
    currentValue = element.options[element.selectedIndex]?.value || '';
  }
  
  const isPII = containsPII(currentValue) || isPIIField(labelText);
  const maskedValue = isPII ? maskPII(currentValue) : currentValue;
  
  // Build element hints
  const elementHints: ElementHints = {
    selector,
    fallbackSelectors,
    dataAttributes: element.dataset ? Object.fromEntries(Object.entries(element.dataset)) : undefined,
    position: getElementPosition(element),
  };
  
  // Extract options if applicable
  const options = ['select', 'radio', 'checkbox'].includes(fieldType) 
    ? extractOptions(element) 
    : undefined;
  
  // Check if required
  const required = element.hasAttribute('required') || 
                   element.getAttribute('aria-required') === 'true';
  
  // Calculate confidence
  const confidence = calculateConfidence(element, labelText);
  
  return {
    id: `${formId}-field-${index}`,
    label: labelText,
    type: fieldType as any,
    required,
    options,
    currentValue: maskedValue,
    confidence,
    elementHints,
    isPII,
    name: (element as HTMLInputElement).name || undefined,
    placeholder: (element as HTMLInputElement).placeholder || undefined,
  };
}

/**
 * Extract form schema from DOM
 */
export function domSnapshot(formElement?: HTMLFormElement | null): FormSchema {
  // Find form element
  let form: HTMLFormElement | null = null;
  
  if (formElement) {
    form = formElement;
  } else {
    // Find first form on page, or create virtual form from all inputs
    form = document.querySelector('form');
    
    // If no form element, create a virtual form from all inputs
    if (!form) {
      const allInputs = document.querySelectorAll('input, select, textarea');
      if (allInputs.length > 0) {
        // Create a virtual form schema
        const fields: FieldSchema[] = [];
        allInputs.forEach((element, index) => {
          const field = extractFieldSchema(element as HTMLElement, 'virtual-form', index);
          if (field) fields.push(field);
        });
        
        return {
          formId: 'virtual-form',
          url: window.location.href,
          fields,
          timestamp: Date.now(),
        };
      }
    }
  }
  
  if (!form) {
    throw new Error('No form found on page');
  }
  
  const formId = form.id || form.name || `form-${Date.now()}`;
  const fields: FieldSchema[] = [];
  
  // Extract all form fields
  const formElements = form.querySelectorAll('input, select, textarea');
  formElements.forEach((element, index) => {
    const field = extractFieldSchema(element as HTMLElement, formId, index);
    if (field) {
      fields.push(field);
    }
  });
  
  // Get form title/heading
  const heading = form.querySelector('h1, h2, h3, legend')?.textContent?.trim();
  
  return {
    formId,
    action: form.action || undefined,
    method: (form.method || 'get').toLowerCase() as 'get' | 'post',
    fields,
    title: heading,
    url: window.location.href,
    timestamp: Date.now(),
  };
}

