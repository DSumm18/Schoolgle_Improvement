/**
 * Screen Analyzer - Uses Gemini 3 Flash vision model to understand page state
 * 
 * Gemini 3 Flash provides:
 * - Fast response times for real-time automation
 * - Cost-effective pricing
 * - Excellent vision capabilities for UI understanding
 */

import { AUTOMATION_MODELS, MODEL_SETTINGS } from '../automation/model-config';

export interface ScreenAnalysis {
  elements: Array<{
    type: 'button' | 'input' | 'link' | 'text' | 'form' | 'other';
    description: string;
    selector?: string;
    position?: { x: number; y: number; width: number; height: number };
  }>;
  pageDescription: string;
  interactiveElements: number;
}

/**
 * Analyze a screenshot using vision model
 */
export async function analyzeScreen(
  screenshot: Buffer | string,
  domSnapshot?: string,
  apiKey?: string
): Promise<ScreenAnalysis> {
  // Use provided key, or fall back to environment variable
  const apiKeyToUse = apiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKeyToUse) {
    throw new Error('GEMINI_API_KEY not set');
  }

  // Convert screenshot to base64 if it's a Buffer
  const imageBase64 = typeof screenshot === 'string' 
    ? screenshot.replace(/^data:image\/\w+;base64,/, '')
    : screenshot.toString('base64');

  // Build prompt
  const domContext = domSnapshot 
    ? `\n\nDOM Structure (first 5000 chars):\n${domSnapshot.substring(0, 5000)}`
    : '';

  const prompt = `Analyze this web page screenshot and identify all interactive elements and their purposes.

${domContext}

Return a JSON object with this structure:
{
  "pageDescription": "Brief description of what this page is",
  "elements": [
    {
      "type": "button|input|link|text|form|other",
      "description": "What this element is/does",
      "selector": "CSS selector if identifiable (optional)",
      "position": {"x": 0, "y": 0, "width": 0, "height": 0}
    }
  ],
  "interactiveElements": number
}

Focus on:
- Buttons and clickable elements
- Form inputs and fields
- Navigation elements
- Important text labels

Return ONLY valid JSON, no markdown or explanation.`;

  try {
    // Use Google's Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${AUTOMATION_MODELS.VISION}:generateContent?key=${apiKeyToUse}`,
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
                  text: prompt,
                },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: imageBase64,
                  },
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
      throw new Error(`Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from vision model');
    }

    // Extract JSON from response (might be wrapped in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const analysis = JSON.parse(jsonMatch[0]) as ScreenAnalysis;
    return analysis;
  } catch (error) {
    console.error('[ScreenAnalyzer] Error:', error);
    
    // Return fallback analysis
    return {
      elements: [],
      pageDescription: 'Unable to analyze page',
      interactiveElements: 0,
    };
  }
}

