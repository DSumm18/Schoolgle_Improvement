/**
 * OpenRouter Client
 * Unified model access via OpenRouter API
 */

import type { ModelConfig, TokenUsage } from '../types';

// ============================================================================
// Configuration
// ============================================================================

export interface OpenRouterConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

// ============================================================================
// Available Models on OpenRouter
// ============================================================================

/**
 * Model catalog with OpenRouter model IDs
 * Costs are approximate and may change - check openrouter.ai/docs for current pricing
 */
export const OPENROUTER_MODELS: Record<string, ModelConfig> = {
  // ========== PREMIUM MODELS (High quality, higher cost) ==========

  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    costPerMillionTokens: 3.00, // Input, output is ~$15
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false,
    },
  },

  'anthropic/claude-3.5-sonnet:beta': {
    id: 'anthropic/claude-3.5-sonnet:beta',
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet:beta',
    costPerMillionTokens: 3.00,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false,
    },
  },

  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    provider: 'openrouter',
    model: 'openai/gpt-4o',
    costPerMillionTokens: 2.50, // Input, output is ~$10
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: true,
    },
  },

  'google/gemini-2.0-flash-exp': {
    id: 'google/gemini-2.0-flash-exp',
    provider: 'openrouter',
    model: 'google/gemini-2.0-flash-exp',
    costPerMillionTokens: 0.075, // Very cheap!
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false,
    },
  },

  'google/gemini-2.5-pro': {
    id: 'google/gemini-2.5-pro',
    provider: 'openrouter',
    model: 'google/gemini-2.5-pro',
    costPerMillionTokens: 1.25,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false,
    },
  },

  'google/gemini-2.5-flash-thinking-exp': {
    id: 'google/gemini-2.5-flash-thinking-exp',
    provider: 'openrouter',
    model: 'google/gemini-2.5-flash-thinking-exp',
    costPerMillionTokens: 0.10,
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: false,
    },
  },

  // ========== FAST CHEAP MODELS (Routing, classification) ==========

  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    costPerMillionTokens: 0.15, // Input, output is ~$0.60
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: true,
    },
  },

  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    provider: 'openrouter',
    model: 'deepseek/deepseek-chat',
    costPerMillionTokens: 0.27, // Input, output is ~$1.10
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: true,
    },
  },

  'deepseek/deepseek-chat-v3-0324': {
    id: 'deepseek/deepseek-chat-v3-0324',
    provider: 'openrouter',
    model: 'deepseek/deepseek-chat-v3-0324',
    costPerMillionTokens: 0.27,
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: true,
    },
  },

  'deepseek/deepseek-r1': {
    id: 'deepseek/deepseek-r1',
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1',
    costPerMillionTokens: 0.55, // Reasoning model
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: true,
    },
  },

  // ========== ULTRA-CHEAP MODELS ==========

  // Note: Free models change frequently - check openrouter.ai for current free options

  // ========== VISION MODELS ==========

  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    costPerMillionTokens: 3.00,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false,
    },
  },

  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    provider: 'openrouter',
    model: 'openai/gpt-4o',
    costPerMillionTokens: 2.50,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: true,
    },
  },

  'google/gemini-2.0-flash-exp': {
    id: 'google/gemini-2.0-flash-exp',
    provider: 'openrouter',
    model: 'google/gemini-2.0-flash-exp',
    costPerMillionTokens: 0.075,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false,
    },
  },

  // ========== REASONING MODELS ==========

  'deepseek/deepseek-r1': {
    id: 'deepseek/deepseek-r1',
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1',
    costPerMillionTokens: 0.55,
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: true,
    },
  },
};

/**
 * Model aliases for easy reference
 */
export const MODEL_ALIASES: Record<string, string> = {
  // Primary models
  'premium': 'anthropic/claude-3.5-sonnet',
  'fast': 'openai/gpt-4o-mini',
  'cheap': 'deepseek/deepseek-chat',

  // Specific model aliases
  'claude': 'anthropic/claude-3.5-sonnet',
  'gpt4': 'openai/gpt-4o',
  'gpt4-mini': 'openai/gpt-4o-mini',
  'gemini': 'google/gemini-2.5-flash-thinking-exp',
  'deepseek': 'deepseek/deepseek-chat',
  'deepseek-r1': 'deepseek/deepseek-r1',
};

// ============================================================================
// OpenRouter Client Class
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

/**
 * OpenRouter API Client
 */
export class OpenRouterClient {
  private config: OpenRouterConfig;
  private baseURL: string;

  constructor(config: OpenRouterConfig) {
    this.config = config;
    this.baseURL = config.baseURL || 'https://openrouter.ai/api/v1';
  }

  /**
   * Send a chat completion request
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    const model = options.model || 'anthropic/claude-3.5-sonnet';

    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      top_p: options.topP,
      stream: options.stream ?? false,
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://schoolgle.co.uk',
        'X-Title': 'Schoolgle Ed',
      },
      body: JSON.stringify(requestBody),
      signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new OpenRouterError(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
        response.status,
        errorText
      );
    }

    const data = await response.json();

    // Extract response
    const choice = data.choices?.[0];
    if (!choice) {
      throw new OpenRouterError('No choices returned from OpenRouter', 500);
    }

    return {
      content: choice.message?.content || '',
      model: data.model || model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Send a chat completion request with system prompt
   */
  async chatWithSystem(
    systemPrompt: string,
    userMessage: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    return this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      options
    );
  }

  /**
   * Stream a chat completion (for future implementation)
   */
  async *chatStream(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || 'anthropic/claude-3.5-sonnet';

    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://schoolgle.co.uk',
        'X-Title': 'Schoolgle Ed',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new OpenRouterError(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    // Stream parsing
    const reader = response.body?.getReader();
    if (!reader) throw new OpenRouterError('No response body', 500);

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) yield content;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get model info
   */
  getModel(modelIdOrAlias: string): ModelConfig | undefined {
    // Resolve alias
    const modelId = MODEL_ALIASES[modelIdOrAlias] || modelIdOrAlias;
    return OPENROUTER_MODELS[modelId];
  }

  /**
   * Get all available models
   */
  getAllModels(): Record<string, ModelConfig> {
    return { ...OPENROUTER_MODELS };
  }
}

// ============================================================================
// Error Class
// ============================================================================

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseText?: string
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create OpenRouter client from environment
 */
export function createOpenRouterClient(apiKey?: string): OpenRouterClient {
  const key = apiKey || process.env.OPENROUTER_API_KEY || '';

  if (!key) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  // Log for debugging (remove in production)
  console.log('[OpenRouter] Using API key starting with:', key.substring(0, 10) + '...');

  return new OpenRouterClient({
    apiKey: key,
    timeout: 30000, // 30 second default
  });
}

/**
 * Calculate token cost
 */
export function calculateTokenCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = OPENROUTER_MODELS[modelId];
  if (!model) return 0;

  // Note: OpenRouter pricing can vary by provider
  // This is an approximation using the base cost per million tokens
  const inputCost = (inputTokens / 1_000_000) * model.costPerMillionTokens;
  const outputCost = (outputTokens / 1_000_000) * (model.costPerMillionTokens * 3); // Rough estimate

  return inputCost + outputCost;
}
