/**
 * Multi-Perspective Generator
 * Generates optimist, critic, and neutral perspectives for balanced responses
 */

import type { PerspectiveType, PerspectiveResponse, AppContext } from '../types';
import { getModelRouter } from '../models';

// ============================================================================
// Perspective Prompts
// ============================================================================

/**
 * Optimist perspective prompt
 */
export const OPTIMIST_PROMPT = `You are the OPTIMIST perspective.

Your role is to highlight:
- What's working well
- What's possible
- Positive outcomes
- Encouraging aspects
- Benefits and opportunities

Keep it brief (2-3 sentences max). Focus on possibilities and what could go right.

**Important:** Be specific to the question asked, not generic positivity.`;

/**
 * Critic perspective prompt
 */
export const CRITIC_PROMPT = `You are the CRITIC perspective (devil's advocate).

Your role is to highlight:
- What could go wrong
- Risks and concerns
- Missing information
- Areas that need caution
- Potential pitfalls

Keep it brief (2-3 sentences max). Focus on safety and what could go wrong.

**Important:** Be specific to the question asked, not generic negativity.`;

/**
 * Neutral perspective prompt
 */
export const NEUTRAL_PROMPT = `You are the NEUTRAL perspective.

Your role is to provide:
- Balanced factual summary
- Key points only
- No bias either way
- Objective assessment

Keep it brief (2-3 sentences max). Focus on facts.

**Important:** Be specific to the question asked, avoid vague statements.`;

/**
 * Synthesis prompt
 */
export const SYNTHESIS_PROMPT = `You are a SYNTHESIZER.

Your role is to combine three perspectives into a balanced, actionable response.

You will receive:
1. The original question
2. An expert's answer
3. Three perspectives: optimist, critic, and neutral

Create a response that:
- Acknowledges the expert guidance
- Incorporates valid points from all perspectives
- Provides a balanced view of the situation
- Ends with clear, actionable next steps

Be concise but comprehensive. Use markdown formatting for readability.`;

// ============================================================================
// Perspective Generation
// ============================================================================

/**
 * Generate multi-perspective response
 */
export async function generateMultiPerspectiveResponse(
  question: string,
  specialistResponse: string,
  context: AppContext
): Promise<{
  synthesized: string;
  perspectives: {
    optimist?: string;
    critic?: string;
    neutral?: string;
  };
}> {
  // Use cheaper model for perspectives (they're shorter, less critical)
  const perspectiveModelId = 'deepseek/deepseek-chat';
  const synthesisModelId = 'anthropic/claude-3.5-sonnet';

  try {
    // Generate three perspectives in parallel
    const [optimist, critic, neutral] = await Promise.all([
      generatePerspective(question, specialistResponse, 'optimist', context, perspectiveModelId),
      generatePerspective(question, specialistResponse, 'critic', context, perspectiveModelId),
      generatePerspective(question, specialistResponse, 'neutral', context, perspectiveModelId),
    ]);

    // Synthesize into balanced response
    const synthesized = await synthesizeResponse(question, specialistResponse, {
      optimist,
      critic,
      neutral,
    }, context, synthesisModelId);

    return {
      synthesized,
      perspectives: {
        optimist,
        critic,
        neutral,
      },
    };
  } catch (error) {
    // If perspective generation fails, return specialist response with warning
    console.error('Perspective generation failed:', error);
    return {
      synthesized: `${specialistResponse}\n\n*Note: Unable to generate additional perspectives at this time.*`,
      perspectives: undefined,
    };
  }
}

/**
 * Generate a single perspective
 */
async function generatePerspective(
  question: string,
  specialistResponse: string,
  type: PerspectiveType,
  context: AppContext,
  modelId: string
): Promise<string> {
  const router = getModelRouter(context.openRouterApiKey);
  const prompt = getPerspectivePrompt(type);

  const userMessage = `
**Question:** ${question}

**Specialist Response:** ${specialistResponse}

Provide your ${type} perspective on this guidance.`;

  try {
    const response = await router.chat(
      prompt,
      userMessage,
      {
        model: modelId,
        temperature: 0.7,
        maxTokens: 200, // Perspectives should be brief
      }
    );

    return response.content.trim();
  } catch (error) {
    // Return fallback if generation fails
    return getFallbackPerspective(type, question);
  }
}

/**
 * Get perspective prompt by type
 */
function getPerspectivePrompt(type: PerspectiveType): string {
  switch (type) {
    case 'optimist':
      return OPTIMIST_PROMPT;
    case 'critic':
      return CRITIC_PROMPT;
    case 'neutral':
      return NEUTRAL_PROMPT;
  }
}

/**
 * Synthesize multiple perspectives into final response
 */
async function synthesizeResponse(
  question: string,
  specialistResponse: string,
  perspectives: {
    optimist: string;
    critic: string;
    neutral: string;
  },
  context: AppContext,
  modelId: string
): Promise<string> {
  const router = getModelRouter(context.openRouterApiKey);

  const userMessage = `
**Question:** ${question}

**Specialist Response:**
${specialistResponse}

**Perspectives:**

**Optimist says:**
${perspectives.optimist}

**Critic says:**
${perspectives.critic}

**Neutral says:**
${perspectives.neutral}

Please synthesize this into a balanced, actionable response.`;

  try {
    const response = await router.chat(
      SYNTHESIS_PROMPT,
      userMessage,
      {
        model: modelId,
        temperature: 0.7,
        maxTokens: 1000,
      }
    );

    return response.content.trim();
  } catch (error) {
    // Fallback to simple format if synthesis fails
    return formatFallbackSynthesis(specialistResponse, perspectives);
  }
}

/**
 * Get fallback perspective when generation fails
 */
function getFallbackPerspective(type: PerspectiveType, question: string): string {
  switch (type) {
    case 'optimist':
      return "From a positive perspective, this is a solvable challenge with clear steps forward. Following the guidance should lead to successful outcomes.";
    case 'critic':
      return "From a cautious perspective, ensure you verify all guidance is current and follow procedures carefully. Don't cut corners on safety or compliance.";
    case 'neutral':
      return "From a balanced perspective, follow the established procedures and verify guidance for your specific situation.";
  }
}

/**
 * Format fallback synthesis when LLM fails
 */
function formatFallbackSynthesis(
  specialistResponse: string,
  perspectives: {
    optimist: string;
    critic: string;
    neutral: string;
  }
): string {
  return `${specialistResponse}

---

### Additional Perspectives

**Optimistic View:**
${perspectives.optimist}

**Cautious View:**
${perspectives.critic}

**Balanced View:**
${perspectives.neutral}`;
}

// ============================================================================
// Perspective Caching
// ============================================================================

/**
 * Simple in-memory cache for perspectives (to reduce API calls)
 */
const perspectiveCache = new Map<string, {
  perspectives: PerspectiveResponse;
  timestamp: number;
}>();

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Generate perspectives with caching
 */
export async function generatePerspectivesCached(
  question: string,
  specialistResponse: string,
  context: AppContext
): Promise<{
  synthesized: string;
  perspectives: {
    optimist?: string;
    critic?: string;
    neutral?: string;
  };
}> {
  const cacheKey = `${question}:${specialistResponse.substring(0, 100)}`;
  const cached = perspectiveCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.perspectives as any;
  }

  const result = await generateMultiPerspectiveResponse(question, specialistResponse, context);

  perspectiveCache.set(cacheKey, {
    perspectives: result as any,
    timestamp: Date.now(),
  });

  return result;
}

/**
 * Clear perspective cache
 */
export function clearPerspectiveCache(): void {
  perspectiveCache.clear();
}
