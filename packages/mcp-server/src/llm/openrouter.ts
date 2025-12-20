/**
 * OpenRouter LLM Wrapper
 * 
 * Provides typed, telemetry-enabled LLM calls via OpenRouter API.
 * 
 * Features:
 * - Environment-based model selection
 * - Typed errors with error codes
 * - Usage tracking
 * - Strict output contracts
 */

export interface OpenRouterCallOptions {
  model: string;
  system?: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OpenRouterResponse {
  text: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterError extends Error {
  error_code: string;
  status_code?: number;
}

/**
 * Get default models from environment variables
 */
export function getDefaultModels(): {
  cheap: string;
  smart: string;
  vision: string;
} {
  return {
    cheap: process.env.OPENROUTER_CHEAP_MODEL || 'google/gemini-flash-1.5',
    smart: process.env.OPENROUTER_SMART_MODEL || 'anthropic/claude-3.5-sonnet',
    vision: process.env.OPENROUTER_VISION_MODEL || 'google/gemini-pro-vision',
  };
}

/**
 * Call OpenRouter API
 * 
 * @throws {OpenRouterError} with error_code if API call fails
 */
export async function callOpenRouter(
  options: OpenRouterCallOptions
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw createOpenRouterError(
      'OPENROUTER_API_KEY not set',
      'MISSING_API_KEY',
      500
    );
  }

  const {
    model,
    system,
    user,
    temperature = 0.7,
    maxTokens = 2000,
  } = options;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://schoolgle.com',
        'X-Title': 'Schoolgle MCP Server',
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: user },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createOpenRouterError(
        errorData.error?.message || `OpenRouter API error: ${response.statusText}`,
        'OPENROUTER_API_ERROR',
        response.status
      );
    }

    const data = await response.json();
    
    // Extract text from response
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw createOpenRouterError(
        'No text in OpenRouter response',
        'INVALID_RESPONSE',
        500
      );
    }

    // Extract usage if available
    const usage = data.usage ? {
      prompt_tokens: data.usage.prompt_tokens || 0,
      completion_tokens: data.usage.completion_tokens || 0,
      total_tokens: data.usage.total_tokens || 0,
    } : undefined;

    return {
      text,
      model: data.model || model,
      usage,
    };
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw error;
    }
    
    // Network or other errors
    throw createOpenRouterError(
      error instanceof Error ? error.message : 'Unknown error',
      'NETWORK_ERROR',
      500
    );
  }
}

/**
 * Create typed OpenRouter error
 */
function createOpenRouterError(
  message: string,
  errorCode: string,
  statusCode?: number
): OpenRouterError {
  const error = new Error(message) as OpenRouterError;
  error.error_code = errorCode;
  error.status_code = statusCode;
  error.name = 'OpenRouterError';
  return error;
}

/**
 * Estimate token usage from text length (rough approximation)
 * Used when OpenRouter doesn't provide usage data
 */
export function estimateTokenUsage(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}


