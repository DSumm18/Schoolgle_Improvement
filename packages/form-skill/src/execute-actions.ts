/**
 * Execute Actions - HARDENED
 * Reliable handlers for all field types with SPA protection, verification, and retries
 */

import type { FillAction, ExecutionResult, ElementFingerprint, FormVersionTracker, CapabilityProfile } from './types';
import { detectSystem, getCapabilityProfile, getDefaultProfile } from './capability-profiles';

/**
 * Execute fill actions with full hardening
 */
export async function executeActions(
  actions: FillAction[],
  formContainer?: HTMLElement | null
): Promise<ExecutionResult> {
  const result: ExecutionResult = {
    succeeded: [],
    failed: [],
    skipped: [],
  };
  
  // Detect system and get capability profile
  const system = detectSystem(window.location.href);
  const profile = getCapabilityProfile(system) || getDefaultProfile();
  
  // Find form container
  const container = formContainer || 
                    document.querySelector('form') || 
                    document.querySelector('[role="form"]') ||
                    document.body;
  
  if (!container) {
    result.failed.push({
      actionId: 'setup',
      error: 'No form container found',
    });
    return result;
  }
  
  // Set up form version tracking
  const versionTracker = setupFormVersionTracking(container as HTMLElement);
  const initialVersion = versionTracker.version;
  
  try {
    for (const action of actions) {
      // Check if form re-rendered
      if (versionTracker.version !== initialVersion) {
        result.failed.push({
          actionId: action.id,
          error: 'Form re-rendered during execution. Aborted for safety.',
        });
        // Continue to collect all failures, but mark as aborted
        break;
      }
      
      // Re-resolve element before each action
      let element = await findElementWithRetry(
        action.selector,
        action.fallbackSelectors,
        profile.maxRetries || 2
      );
      
      if (!element) {
        result.failed.push({
          actionId: action.id,
          error: `Element not found after retries: ${action.selector}`,
        });
        continue;
      }
      
      // Verify fingerprint if available
      if (action.fingerprint) {
        const fingerprint = extractFingerprint(element);
        if (!verifyFingerprint(fingerprint, action.fingerprint)) {
          result.failed.push({
            actionId: action.id,
            error: 'Element fingerprint mismatch - form may have changed',
          });
          continue;
        }
      }
      
      // Scroll into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(100);
      
      // Execute action
      let success = false;
      let attempts = 0;
      const maxAttempts = profile.maxRetries || 2;
      
      while (!success && attempts < maxAttempts) {
        attempts++;
        
        try {
          success = await executeAction(element, action, profile);
          
          // Verify execution
          if (success) {
            const verified = await verifyExecution(element, action, profile);
            if (!verified) {
              // Retry with fallback selector if available
              if (attempts < maxAttempts && action.fallbackSelectors && action.fallbackSelectors.length > 0) {
                const fallbackElement = await findElement(
                  action.fallbackSelectors[0],
                  action.fallbackSelectors.slice(1)
                );
                if (fallbackElement) {
                  element = fallbackElement;
                  success = false; // Retry with fallback
                  continue;
                }
              }
              success = false;
            }
          }
        } catch (error) {
          console.error(`Action attempt ${attempts} failed:`, error);
          success = false;
        }
      }
      
      if (success) {
        result.succeeded.push(action.id);
        
        // Post-fill delay from profile
        if (profile.postFillDelay) {
          await delay(profile.postFillDelay);
        }
      } else {
        result.failed.push({
          actionId: action.id,
          error: `Action failed after ${attempts} attempts: ${action.type}`,
        });
      }
      
      // Small delay between actions
      await delay(200);
    }
  } finally {
    // Clean up observer
    if (versionTracker.observer) {
      versionTracker.observer.disconnect();
    }
  }
  
  // Capture final state
  result.finalState = captureFormState();
  
  return result;
}

/**
 * Set up form version tracking with MutationObserver
 */
function setupFormVersionTracking(container: HTMLElement): FormVersionTracker {
  let version = 0;
  
  const observer = new MutationObserver(() => {
    version++;
  });
  
  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: false,
  });
  
  return {
    version,
    observer,
    container,
  };
}

/**
 * Find element with retry logic
 */
async function findElementWithRetry(
  selector: string,
  fallbackSelectors?: string[],
  maxRetries: number = 2
): Promise<HTMLElement | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const element = await findElement(selector, fallbackSelectors);
    if (element) return element;
    
    if (attempt < maxRetries - 1) {
      await delay(100 * (attempt + 1)); // Exponential backoff
    }
  }
  
  return null;
}

/**
 * Find element by selector with fallbacks
 */
async function findElement(
  selector: string,
  fallbackSelectors?: string[]
): Promise<HTMLElement | null> {
  // Try primary selector
  let element = document.querySelector(selector) as HTMLElement;
  
  if (element) return element;
  
  // Try fallback selectors
  if (fallbackSelectors) {
    for (const fallback of fallbackSelectors) {
      element = document.querySelector(fallback) as HTMLElement;
      if (element) return element;
    }
  }
  
  return null;
}

/**
 * Extract element fingerprint
 */
function extractFingerprint(element: HTMLElement): ElementFingerprint {
  const label = findLabel(element);
  
  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    name: (element as HTMLInputElement).name || undefined,
    ariaLabel: element.getAttribute('aria-label') || undefined,
    labelText: label?.textContent?.trim() || undefined,
    index: getElementIndex(element),
  };
}

/**
 * Verify fingerprint matches
 */
function verifyFingerprint(
  current: ElementFingerprint,
  expected: ElementFingerprint
): boolean {
  // Must match on at least one strong identifier
  if (expected.id && current.id === expected.id) return true;
  if (expected.name && current.name === expected.name) return true;
  
  // Or match on tag + label (weaker but acceptable)
  if (current.tagName === expected.tagName) {
    if (expected.labelText && current.labelText) {
      const match = current.labelText.toLowerCase().includes(expected.labelText.toLowerCase()) ||
                   expected.labelText.toLowerCase().includes(current.labelText.toLowerCase());
      if (match) return true;
    }
  }
  
  return false;
}

/**
 * Get element index in parent
 */
function getElementIndex(element: HTMLElement): number {
  const parent = element.parentElement;
  if (!parent) return -1;
  
  const siblings = Array.from(parent.children);
  return siblings.indexOf(element);
}

/**
 * Find label for element
 */
function findLabel(element: HTMLElement): HTMLLabelElement | null {
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`) as HTMLLabelElement;
    if (label) return label;
  }
  
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel as HTMLLabelElement;
  
  return null;
}

/**
 * Execute a single action with profile support
 */
async function executeAction(
  element: HTMLElement,
  action: FillAction,
  profile: CapabilityProfile
): Promise<boolean> {
  try {
    switch (action.type) {
      case 'fill_text':
      case 'fill_textarea':
        return fillText(element as HTMLInputElement | HTMLTextAreaElement, action.value, profile);
      
      case 'select_option':
        return selectOption(element as HTMLSelectElement, action.value);
      
      case 'check':
        return checkCheckbox(element as HTMLInputElement);
      
      case 'uncheck':
        return uncheckCheckbox(element as HTMLInputElement);
      
      case 'select_radio':
        return selectRadio(element as HTMLInputElement, action.value);
      
      case 'fill_date':
        return fillDate(element as HTMLInputElement, action.value);
      
      case 'typeahead_select':
        return typeaheadSelect(element as HTMLInputElement, action.value, profile);
      
      case 'clear':
        return clearField(element);
      
      case 'focus':
        element.focus();
        return true;
      
      case 'blur':
        element.blur();
        // Post-blur delay from profile
        if (profile.postBlurDelay) {
          await delay(profile.postBlurDelay);
        }
        return true;
      
      default:
        console.warn(`Unknown action type: ${action.type}`);
        return false;
    }
  } catch (error) {
    console.error(`Error executing action ${action.type}:`, error);
    return false;
  }
}

/**
 * Verify execution succeeded
 */
async function verifyExecution(
  element: HTMLElement,
  action: FillAction,
  profile: CapabilityProfile
): Promise<boolean> {
  // Wait a moment for value to settle
  await delay(50);
  
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // For text inputs, verify value matches
    if (action.type === 'fill_text' || action.type === 'fill_textarea') {
      return element.value === action.value || 
             element.value.includes(action.value) ||
             action.value.includes(element.value);
    }
    
    // For checkboxes
    if (action.type === 'check') {
      return element.checked === true;
    }
    if (action.type === 'uncheck') {
      return element.checked === false;
    }
    
    // For date
    if (action.type === 'fill_date') {
      return element.value !== '';
    }
  }
  
  if (element instanceof HTMLSelectElement) {
    if (action.type === 'select_option') {
      // Verify selected option matches value
      const selected = element.options[element.selectedIndex];
      return selected?.value === action.value ||
             selected?.text.toLowerCase().includes(action.value.toLowerCase());
    }
  }
  
  // For typeahead, verification is done in the function itself
  if (action.type === 'typeahead_select') {
    return element.value === action.value || 
           element.value.toLowerCase().includes(action.value.toLowerCase());
  }
  
  // Default: assume success if no error thrown
  return true;
}

/**
 * Fill text input or textarea with profile support
 */
function fillText(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  profile: CapabilityProfile
): boolean {
  if (!element) return false;
  
  // Focus first
  element.focus();
  
  // Clear existing value
  element.value = '';
  
  // Set new value
  element.value = value;
  
  // Trigger events
  triggerChangeEvents(element);
  
  // Verify
  return element.value === value;
}

/**
 * Select option in dropdown
 */
function selectOption(element: HTMLSelectElement, value: string): boolean {
  if (!element) return false;
  
  // Try exact value match first
  const exactMatch = Array.from(element.options).find(opt => opt.value === value);
  if (exactMatch) {
    element.value = exactMatch.value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  // Try label match
  const labelMatch = Array.from(element.options).find(opt => 
    opt.text.toLowerCase().includes(value.toLowerCase()) ||
    value.toLowerCase().includes(opt.text.toLowerCase())
  );
  if (labelMatch) {
    element.value = labelMatch.value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  return false;
}

/**
 * Check checkbox
 */
function checkCheckbox(element: HTMLInputElement): boolean {
  if (!element || element.type !== 'checkbox') return false;
  
  element.checked = true;
  element.dispatchEvent(new Event('change', { bubbles: true }));
  return element.checked;
}

/**
 * Uncheck checkbox
 */
function uncheckCheckbox(element: HTMLInputElement): boolean {
  if (!element || element.type !== 'checkbox') return false;
  
  element.checked = false;
  element.dispatchEvent(new Event('change', { bubbles: true }));
  return !element.checked;
}

/**
 * Select radio button
 */
function selectRadio(element: HTMLInputElement, value: string): boolean {
  if (!element || element.type !== 'radio') return false;
  
  const name = element.name;
  if (!name) return false;
  
  // Find all radios with same name
  const radios = document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);
  
  for (const radio of radios) {
    if (radio.value === value || 
        radio.value.toLowerCase() === value.toLowerCase()) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    
    // Check label text
    const label = radio.closest('label') || 
                  document.querySelector(`label[for="${radio.id}"]`);
    if (label && label.textContent?.toLowerCase().includes(value.toLowerCase())) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  
  return false;
}

/**
 * Fill date input
 */
function fillDate(element: HTMLInputElement, value: string): boolean {
  if (!element || element.type !== 'date') return false;
  
  // Parse and format date
  const date = parseDate(value);
  if (!date) return false;
  
  // Format as YYYY-MM-DD
  const formatted = date.toISOString().split('T')[0];
  element.value = formatted;
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  return element.value === formatted;
}

/**
 * Parse date from various formats
 */
function parseDate(value: string): Date | null {
  // Try ISO format first
  const isoDate = new Date(value);
  if (!isNaN(isoDate.getTime())) return isoDate;
  
  // Try UK format (DD/MM/YYYY)
  const ukMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try US format (MM/DD/YYYY)
  const usMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return null;
}

/**
 * Select from typeahead/autocomplete with polling
 */
async function typeaheadSelect(
  element: HTMLInputElement,
  value: string,
  profile: CapabilityProfile
): Promise<boolean> {
  if (!element) return false;
  
  const pollInterval = profile.typeaheadPollInterval || 100;
  const maxWait = profile.typeaheadMaxWait || 2500;
  const maxAttempts = 2;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Focus and type
    element.focus();
    element.value = value;
    
    // Trigger input event
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Poll for dropdown appearance
    const dropdown = await waitForDropdown(pollInterval, maxWait);
    
    if (dropdown) {
      // Try to find and click dropdown option
      const options = dropdown.querySelectorAll('[role="option"], li, .option, [data-option]');
      for (const option of options) {
        if (option.textContent?.toLowerCase().includes(value.toLowerCase())) {
          (option as HTMLElement).click();
          // Verify value was set
          await delay(100);
          if (element.value.toLowerCase().includes(value.toLowerCase())) {
            return true;
          }
        }
      }
      
      // Fallback: keyboard navigation
      if (options.length > 0) {
        element.focus();
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await delay(100);
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await delay(100);
        if (element.value.toLowerCase().includes(value.toLowerCase())) {
          return true;
        }
      }
    }
    
    // Fallback: just set the value if dropdown never appears
    if (attempt === maxAttempts - 1) {
      return element.value === value || element.value.toLowerCase().includes(value.toLowerCase());
    }
    
    // Retry with slight delay
    await delay(200);
  }
  
  return false;
}

/**
 * Wait for dropdown to appear
 */
async function waitForDropdown(
  pollInterval: number,
  maxWait: number
): Promise<HTMLElement | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const dropdown = document.querySelector('[role="listbox"], .dropdown, .autocomplete-results, [data-dropdown]') as HTMLElement;
    if (dropdown && dropdown.offsetParent !== null) { // Check if visible
      return dropdown;
    }
    await delay(pollInterval);
  }
  
  return null;
}

/**
 * Clear field
 */
function clearField(element: HTMLElement): boolean {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = '';
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  if (element instanceof HTMLSelectElement) {
    element.selectedIndex = 0;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  return false;
}

/**
 * Trigger change events
 */
function triggerChangeEvents(element: HTMLElement): void {
  // Trigger input event
  element.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Trigger change event
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Capture current form state
 */
function captureFormState(): Record<string, string> {
  const state: Record<string, string> = {};
  
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const name = element.name || element.id;
    
    if (name && element.type !== 'password') {
      if (element instanceof HTMLSelectElement) {
        state[name] = element.options[element.selectedIndex]?.value || '';
      } else {
        state[name] = element.value || '';
      }
    }
  });
  
  return state;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
