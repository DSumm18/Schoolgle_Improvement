/**
 * Vision Fallback
 * Uses vision model to recognize form fields when DOM mapping fails
 */

import type { FieldSchema, FormSchema } from './types';

/**
 * Use vision model to recognize form fields from screenshot
 */
export async function recognizeFieldsWithVision(
  screenshot: string | Blob,
  apiKey: string,
  apiUrl: string = 'https://openrouter.ai/api/v1/chat/completions'
): Promise<FieldSchema[]> {
  
  // Convert screenshot to base64 if needed
  let imageBase64: string;
  
  if (typeof screenshot === 'string') {
    // Assume it's already base64
    imageBase64 = screenshot.replace(/^data:image\/\w+;base64,/, '');
  } else {
    // Convert Blob to base64
    imageBase64 = await blobToBase64(screenshot);
  }
  
  // Get current form DOM
  const form = document.querySelector('form') || document.body;
  const domSnapshot = form.outerHTML.substring(0, 5000); // Limit size
  
  // Build prompt
  const prompt = `Analyze this form screenshot and identify all visible form fields.

Return a JSON array of field objects with:
- label: The visible label text
- type: Field type (text, select, checkbox, radio, date, etc.)
- position: Approximate position {x, y} in pixels
- selector: CSS selector to target the field

DOM context:
${domSnapshot}

Return ONLY valid JSON array, no markdown.`;

  // Call vision model
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Ed Vision Form Recognition',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet', // Vision-capable model
      messages: [
        {
          role: 'system',
          content: 'You are a form field recognition expert. Return only valid JSON arrays.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Vision API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const resultText = data.choices?.[0]?.message?.content;
  
  if (!resultText) {
    throw new Error('No response from vision model');
  }
  
  // Parse JSON
  let result: any;
  try {
    result = JSON.parse(resultText);
  } catch (error) {
    // Try to extract from markdown
    const jsonMatch = resultText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Invalid JSON response from vision model');
    }
  }
  
  // Convert to FieldSchema format
  const fields: FieldSchema[] = [];
  const fieldArray = Array.isArray(result) ? result : result.fields || [];
  
  for (const field of fieldArray) {
    // Find actual DOM element
    const element = findElementByPosition(field.position) || 
                    document.querySelector(field.selector);
    
    if (!element) continue;
    
    // Build FieldSchema
    fields.push({
      id: `vision-field-${fields.length}`,
      label: field.label || '',
      type: field.type || 'text',
      required: false,
      currentValue: '',
      confidence: 0.8, // Vision recognition confidence
      elementHints: {
        selector: field.selector,
        fallbackSelectors: [],
        position: field.position,
      },
      isPII: false,
    });
  }
  
  return fields;
}

/**
 * Convert Blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:image/...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Find element by approximate position
 */
function findElementByPosition(position: { x: number; y: number }): HTMLElement | null {
  const elements = document.elementsFromPoint(position.x, position.y);
  
  for (const element of elements) {
    if (element instanceof HTMLInputElement || 
        element instanceof HTMLSelectElement || 
        element instanceof HTMLTextAreaElement) {
      return element as HTMLElement;
    }
  }
  
  return null;
}

/**
 * Capture screenshot of form area
 */
export async function captureFormScreenshot(formElement?: HTMLElement): Promise<string> {
  const target = formElement || document.querySelector('form') || document.body;
  
  // Use html2canvas if available, otherwise fallback
  try {
    // Dynamic import to avoid bundling issues
    const html2canvas = await import('html2canvas');
    const canvas = await html2canvas.default(target as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 1,
      logging: false,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    // Fallback: use browser screenshot API if available (Chrome extension)
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.captureVisibleTab) {
      return new Promise((resolve) => {
        chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
          resolve(dataUrl);
        });
      });
    }
    
    throw new Error('Screenshot capture not available');
  }
}

