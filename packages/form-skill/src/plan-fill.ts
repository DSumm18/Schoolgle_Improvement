/**
 * Plan Fill
 * Uses LLM to create a strict JSON action plan from schema and input data
 */

import type { FormSchema, InputData, FillPlan, FillAction, ElementFingerprint } from './types';

/**
 * Call LLM to plan form fill actions
 */
export async function planFill(
  schema: FormSchema,
  inputData: InputData,
  apiKey: string,
  apiUrl: string = 'https://openrouter.ai/api/v1/chat/completions'
): Promise<FillPlan> {
  
  // Build prompt for LLM
  const prompt = buildPlanningPrompt(schema, inputData);
  
  // Call LLM
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Ed Form Fill Planner',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet', // or 'google/gemini-flash-1.5'
      messages: [
        {
          role: 'system',
          content: `You are a form filling assistant. Your job is to map input data fields to form fields and generate a STRICT JSON action plan.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no explanation
2. Match input field names to form field labels (fuzzy matching allowed)
3. Use field IDs from the schema, not labels
4. Generate CSS selectors from elementHints
5. Never create actions for password fields
6. If a field can't be matched, add to unmappedFields
7. Confidence should be 0-1 (1 = perfect match, 0 = no match)

Output format:
{
  "actions": [
    {
      "id": "action-1",
      "fieldId": "form-1-field-0",
      "type": "fill_text",
      "value": "John",
      "selector": "input[name='firstName']",
      "fallbackSelectors": ["#firstName"],
      "confidence": 0.95,
      "matchRationale": "Matched by label"
    }
  ],
  "warnings": [],
  "unmappedFields": [],
  "confidence": 0.95
}

IMPORTANT: Include confidence (0-1) and matchRationale for each action.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent output
      response_format: { type: 'json_object' },
    },
  });
  
  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const planText = data.choices?.[0]?.message?.content;
  
  if (!planText) {
    throw new Error('No response from LLM');
  }
  
  // Parse JSON response
  let plan: FillPlan;
  try {
    plan = JSON.parse(planText);
  } catch (error) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = planText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      plan = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Invalid JSON response from LLM');
    }
  }
  
  // Validate plan structure
  validatePlan(plan);
  
  return plan;
}

/**
 * Build planning prompt
 */
function buildPlanningPrompt(schema: FormSchema, inputData: InputData): string {
  const inputFields = Object.keys(inputData);
  const inputValues = Object.entries(inputData).map(([key, value]) => 
    `  "${key}": "${String(value)}"`
  ).join('\n');
  
  const formFields = schema.fields.map(field => ({
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    selector: field.elementHints.selector,
    currentValue: field.currentValue,
  }));
  
  return `Map the following input data to form fields:

INPUT DATA:
{
${inputValues}
}

FORM FIELDS:
${JSON.stringify(formFields, null, 2)}

TASK:
1. Match each input field to the most appropriate form field
2. Generate actions with correct selectors
3. Use field types to determine action types:
   - text/email/tel/number → fill_text
   - textarea → fill_textarea
   - select → select_option
   - checkbox → check/uncheck
   - radio → select_radio
   - date → fill_date
   - typeahead → typeahead_select

Return the JSON plan as specified.`;
}

/**
 * Validate plan structure
 */
function validatePlan(plan: any): asserts plan is FillPlan {
  if (!plan || typeof plan !== 'object') {
    throw new Error('Plan must be an object');
  }
  
  if (!Array.isArray(plan.actions)) {
    throw new Error('Plan must have actions array');
  }
  
  if (typeof plan.confidence !== 'number' || plan.confidence < 0 || plan.confidence > 1) {
    throw new Error('Plan confidence must be 0-1');
  }
  
  // Validate each action
  for (const action of plan.actions) {
    if (!action.id || !action.fieldId || !action.type || !action.selector || action.value === undefined) {
      throw new Error(`Invalid action: ${JSON.stringify(action)}`);
    }
  }
}

/**
 * Fallback: Simple DOM-based matching (no LLM)
 */
export function planFillSimple(schema: FormSchema, inputData: InputData): FillPlan {
  const actions: FillAction[] = [];
  const unmappedFields: string[] = [];
  const warnings: string[] = [];
  
  // Simple fuzzy matching
  for (const [inputKey, inputValue] of Object.entries(inputData)) {
    const lowerInputKey = inputKey.toLowerCase();
    
    // Find best matching field
    let bestMatch: { field: typeof schema.fields[0]; score: number } | null = null;
    
    for (const field of schema.fields) {
      const lowerLabel = field.label.toLowerCase();
      
      // Exact match
      if (lowerLabel === lowerInputKey) {
        bestMatch = { field, score: 1.0 };
        break;
      }
      
      // Contains match
      if (lowerLabel.includes(lowerInputKey) || lowerInputKey.includes(lowerLabel)) {
        const score = Math.max(
          lowerLabel.length / Math.max(lowerInputKey.length, lowerLabel.length),
          lowerInputKey.length / Math.max(lowerInputKey.length, lowerLabel.length)
        );
        
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { field, score };
        }
      }
    }
    
    if (bestMatch && bestMatch.score > 0.5) {
      const field = bestMatch.field;
      const actionType = getActionTypeForField(field.type);
      
      // Extract fingerprint from field
      const element = document.querySelector(field.elementHints.selector) as HTMLElement;
      const fingerprint = element ? extractFingerprint(element) : undefined;
      
      actions.push({
        id: `action-${actions.length + 1}`,
        fieldId: field.id,
        type: actionType,
        value: String(inputValue),
        selector: field.elementHints.selector,
        fallbackSelectors: field.elementHints.fallbackSelectors,
        confidence: bestMatch.score,
        fingerprint,
        matchRationale: bestMatch.score === 1.0 ? 'Exact label match' : 'Fuzzy label match',
      });
    } else {
      unmappedFields.push(inputKey);
    }
  }
  
  const confidence = actions.length / Object.keys(inputData).length;
  
  return {
    actions,
    warnings,
    unmappedFields,
    confidence,
  };
}

/**
 * Extract fingerprint from element
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
 * Get element index in parent
 */
function getElementIndex(element: HTMLElement): number {
  const parent = element.parentElement;
  if (!parent) return -1;
  
  const siblings = Array.from(parent.children);
  return siblings.indexOf(element);
}

/**
 * Get action type for field type
 */
function getActionTypeForField(fieldType: string): FillAction['type'] {
  switch (fieldType) {
    case 'textarea':
      return 'fill_textarea';
    case 'select':
      return 'select_option';
    case 'checkbox':
      return 'check';
    case 'radio':
      return 'select_radio';
    case 'date':
      return 'fill_date';
    case 'typeahead':
      return 'typeahead_select';
    default:
      return 'fill_text';
  }
}

