/**
 * Action Planner - Converts user requests into automation actions
 * 
 * Uses Gemini 3 Flash for:
 * - Fast action planning
 * - Cost-effective processing
 * - Strong reasoning for complex automation tasks
 */

import { analyzeScreen } from '../vision/screen-analyzer';
import type { AutomationAction } from '../playwright/types';
import { AUTOMATION_MODELS, MODEL_SETTINGS } from './model-config';

export interface PlanOptions {
  apiKey?: string;
  maxActions?: number;
}

/**
 * Plan actions based on user task and screen analysis
 */
export async function planActions(
  task: string,
  screenshot: Buffer | string,
  domSnapshot: string,
  options: PlanOptions = {}
): Promise<AutomationAction[]> {
  const { apiKey, maxActions = 50 } = options;

  // First, analyze the screen
  const analysis = await analyzeScreen(screenshot, domSnapshot, apiKey);

  // Build prompt for action planning
  const prompt = `You are an automation planner. Given a user's task and a screen analysis, generate a step-by-step action plan.

USER TASK: ${task}

SCREEN ANALYSIS:
${JSON.stringify(analysis, null, 2)}

DOM SNAPSHOT (first 3000 chars):
${domSnapshot.substring(0, 3000)}

Generate a JSON array of actions to complete this task. Each action should be one of:
- click: { type: "click", selector: "css-selector", description: "what to click" }
- type: { type: "type", selector: "css-selector", value: "text to type", description: "what to type" }
- select: { type: "select", selector: "css-selector", value: "option-value", description: "what to select" }
- navigate: { type: "navigate", url: "https://...", description: "where to navigate" }
- wait: { type: "wait", duration: 1000, description: "why waiting" }
- scroll: { type: "scroll", direction: "up|down|left|right", amount: 500, description: "why scrolling" }
- screenshot: { type: "screenshot", description: "why taking screenshot" }

Rules:
1. Use CSS selectors from the screen analysis when available
2. If selector not available, use descriptive selectors like "button:has-text('Submit')"
3. Never interact with password fields
4. Never submit forms unless explicitly requested
5. Add wait actions after navigation or dynamic content
6. Be specific and clear in descriptions
7. Maximum ${maxActions} actions

Return ONLY a valid JSON array of actions, no markdown or explanation.`;

  try {
    const apiKeyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!apiKeyToUse) {
      throw new Error('GEMINI_API_KEY not set');
    }

    // Use Google's Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${AUTOMATION_MODELS.PLANNING}:generateContent?key=${apiKeyToUse}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert automation planner. Return only valid JSON arrays of actions.\n\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: MODEL_SETTINGS.TEMPERATURE,
            maxOutputTokens: MODEL_SETTINGS.MAX_TOKENS,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Action planning API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from action planner');
    }

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const actions = JSON.parse(jsonMatch[0]) as AutomationAction[];

    // Validate and limit actions
    if (actions.length > maxActions) {
      console.warn(`Too many actions: ${actions.length}, limiting to ${maxActions}`);
      return actions.slice(0, maxActions);
    }

    // Add IDs to actions if missing
    return actions.map((action, index) => ({
      ...action,
      id: action.id || `action-${index}`,
    }));
  } catch (error) {
    console.error('[ActionPlanner] Error:', error);
    
    // Return fallback plan
    return [
      {
        type: 'screenshot',
        description: 'Taking screenshot to understand current state',
        id: 'fallback-screenshot',
      },
    ];
  }
}

/**
 * Validate actions before execution
 */
export function validateActions(actions: AutomationAction[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (actions.length === 0) {
    errors.push('No actions provided');
  }

  if (actions.length > 50) {
    errors.push(`Too many actions: ${actions.length} (max: 50)`);
  }

  for (const action of actions) {
    if (!action.type) {
      errors.push(`Action missing type: ${JSON.stringify(action)}`);
    }

    if (action.type === 'click' && !('selector' in action)) {
      errors.push(`Click action missing selector: ${JSON.stringify(action)}`);
    }

    if (action.type === 'type' && (!('selector' in action) || !('value' in action))) {
      errors.push(`Type action missing selector or value: ${JSON.stringify(action)}`);
    }

    if (action.type === 'select' && (!('selector' in action) || !('value' in action))) {
      errors.push(`Select action missing selector or value: ${JSON.stringify(action)}`);
    }

    if (action.type === 'navigate' && !('url' in action)) {
      errors.push(`Navigate action missing URL: ${JSON.stringify(action)}`);
    }

    // Check for password fields
    if (action.type === 'type' && 'selector' in action) {
      const selector = action.selector.toLowerCase();
      if (selector.includes('password') || selector.includes('passwd')) {
        errors.push(`Attempted to type into password field: ${selector}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

