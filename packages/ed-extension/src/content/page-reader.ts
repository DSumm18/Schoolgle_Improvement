// Page Context Extraction
// Reads the current page to provide context for Ed

import type { PageContext, HeadingInfo, FormInfo, FormFieldInfo } from '@/shared/types';
import { detectTool } from './tool-detector';

/**
 * Extract full page context for AI processing
 */
export function extractPageContext(location: Location, doc: Document): PageContext {
  return {
    url: location.href,
    hostname: location.hostname,
    pathname: location.pathname,
    title: doc.title,
    headings: extractHeadings(doc),
    visibleText: extractVisibleText(doc),
    forms: extractForms(doc),
    selectedText: getSelectedText(),
    detectedTool: detectTool(location, doc),
    timestamp: Date.now(),
  };
}

/**
 * Extract all headings from the page
 */
function extractHeadings(doc: Document): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  const selectors = ['h1', 'h2', 'h3', 'h4'];
  
  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    elements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && text.length < 200) {
        headings.push({
          level: parseInt(selector.charAt(1)),
          text,
        });
      }
    });
  }
  
  return headings.slice(0, 30); // Limit to 30 headings
}

/**
 * Extract visible text from the page (for AI context)
 */
function extractVisibleText(doc: Document): string {
  const textParts: string[] = [];
  
  // Get main content areas first
  const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content'];
  let mainContent: Element | null = null;
  
  for (const selector of mainSelectors) {
    mainContent = doc.querySelector(selector);
    if (mainContent) break;
  }
  
  const root = mainContent || doc.body;
  
  // Walk the DOM and extract text
  const walker = doc.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        // Skip hidden elements
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip script, style, noscript
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'svg', 'path'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip tiny text (likely icons or decorative)
        const text = node.textContent?.trim() || '';
        if (text.length < 2) {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (text) {
      textParts.push(text);
    }
  }
  
  // Join and limit total length
  const fullText = textParts.join(' ');
  return fullText.slice(0, 5000); // Limit to 5000 chars
}

/**
 * Extract form information (for form-filling features)
 */
function extractForms(doc: Document): FormInfo[] {
  const forms: FormInfo[] = [];
  const formElements = doc.querySelectorAll('form');
  
  formElements.forEach((form, index) => {
    const fields: FormFieldInfo[] = [];
    
    // Get all input-like elements
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input) => {
      const el = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const type = el.type || el.tagName.toLowerCase();
      
      // Skip hidden and submit fields
      if (type === 'hidden' || type === 'submit' || type === 'button') {
        return;
      }
      
      // Check if it's a password field - we never read these
      const isPassword = type === 'password';
      
      // Find associated label
      let label = '';
      if (el.id) {
        const labelEl = doc.querySelector(`label[for="${el.id}"]`);
        label = labelEl?.textContent?.trim() || '';
      }
      if (!label) {
        // Check for parent label
        const parentLabel = el.closest('label');
        if (parentLabel) {
          label = parentLabel.textContent?.trim() || '';
        }
      }
      
      fields.push({
        type,
        name: el.name || '',
        id: el.id || '',
        label,
        placeholder: (el as HTMLInputElement).placeholder || '',
        value: isPassword ? '' : (el.value || ''), // Never read password values
        isPassword,
      });
    });
    
    if (fields.length > 0) {
      forms.push({
        id: form.id || `form-${index}`,
        name: form.name || '',
        action: form.action || '',
        fields,
      });
    }
  });
  
  return forms.slice(0, 10); // Limit to 10 forms
}

/**
 * Get currently selected text
 */
function getSelectedText(): string {
  const selection = window.getSelection();
  return selection?.toString().trim() || '';
}

