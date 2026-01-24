/**
 * Model Router
 * Selects the best model for each task using OpenRouter
 */

import type { ModelConfig, TaskType, AppContext } from '../types';
import {
  OPENROUTER_MODELS,
  MODEL_ALIASES,
  createOpenRouterClient,
  calculateTokenCost as calculateORCost,
  type ChatMessage,
  type ChatOptions,
  type ChatResponse,
} from './openrouter';

// ============================================================================
// Task-to-Model Mapping
// ============================================================================

/**
 * Default model selection by task type
 * Ordered by preference (first is optimal, last is fallback)
 */
const TASK_MODEL_MAP: Record<TaskType, string[]> = {
  // Fast/cheap for routing
  'intent-classification': ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-exp', 'deepseek/deepseek-chat'],
  'work-focus-check': ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-exp'],

  // High quality for specialist responses
  'specialist-response': ['anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat', 'openai/gpt-4o'],
  'perspective-generation': ['deepseek/deepseek-chat', 'openai/gpt-4o-mini', 'google/gemini-2.0-flash-exp'],
  'synthesis': ['anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat'],

  // Vision needed
  'ui-analysis': ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-2.5-pro'],

  // Fast/cheap for actions
  'action-planning': ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-exp'],
};

/**
 * Plan-based model constraints
 */
const PLAN_MODEL_CONSTRAINTS: Record<string, string[]> = {
  'free': ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-exp', 'deepseek/deepseek-chat'],
  'schools': ['anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat', 'openai/gpt-4o', 'google/gemini-2.0-flash-exp'],
  'trusts': ['anthropic/claude-3.5-sonnet', 'deepseek/deepseek-r1', 'openai/gpt-4o'],
};

// ============================================================================
// Model Router
// ============================================================================

/**
 * Model Router class
 */
export class ModelRouter {
  private client: ReturnType<typeof createOpenRouterClient>;

  constructor(client?: ReturnType<typeof createOpenRouterClient>) {
    this.client = client || createOpenRouterClient();
  }

  /**
   * Select the best model for a given task based on context
   */
  selectModel(task: TaskType, context: AppContext): ModelConfig {
    const availableModels = TASK_MODEL_MAP[task] || TASK_MODEL_MAP['specialist-response'];
    const { plan, creditsRemaining } = context.subscription;

    // Filter models by plan
    const planModels = PLAN_MODEL_CONSTRAINTS[plan] || availableModels;
    const eligibleModels = availableModels.filter(m => planModels.includes(m));

    // If low credits, use cheapest option
    if (creditsRemaining < 1000) {
      return this.getCheapestModel(eligibleModels);
    }

    // Otherwise use optimal (first) model
    const modelId = eligibleModels[0];
    const model = OPENROUTER_MODELS[modelId];

    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    return model;
  }

  /**
   * Send chat completion request
   */
  async chat(
    systemPrompt: string,
    userMessage: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    return this.client.chatWithSystem(systemPrompt, userMessage, options);
  }

  /**
   * Send chat completion with message array
   */
  async chatMessages(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    return this.client.chat(messages, options);
  }

  /**
   * Stream chat completion (for future use)
   */
  async *chatStream(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string> {
    yield* this.client.chatStream(messages, options);
  }

  /**
   * Get cheapest model from list
   */
  private getCheapestModel(modelIds: string[]): ModelConfig {
    let cheapest = OPENROUTER_MODELS[modelIds[0]];
    let lowestCost = cheapest?.costPerMillionTokens || Infinity;

    for (const modelId of modelIds) {
      const model = OPENROUTER_MODELS[modelId];
      if (model && model.costPerMillionTokens < lowestCost) {
        cheapest = model;
        lowestCost = model.costPerMillionTokens;
      }
    }

    return cheapest || OPENROUTER_MODELS['openai/gpt-4o-mini'];
  }

  /**
   * Get model by ID or alias
   */
  getModel(idOrAlias: string): ModelConfig | undefined {
    const modelId = MODEL_ALIASES[idOrAlias] || idOrAlias;
    return OPENROUTER_MODELS[modelId];
  }

  /**
   * Get all available models
   */
  getAllModels(): Record<string, ModelConfig> {
    return { ...OPENROUTER_MODELS };
  }
}

// Singleton instance
let routerInstance: ModelRouter | null = null;
let instanceApiKey: string | undefined = undefined;

/**
 * Get or create model router instance
 * @param apiKey Optional API key to override environment variable
 */
export function getModelRouter(apiKey?: string): ModelRouter {
  // If API key changed, recreate instance
  if (routerInstance && instanceApiKey !== apiKey) {
    routerInstance = null;
  }

  if (!routerInstance) {
    // Pass API key to the OpenRouter client
    const client = apiKey ? createOpenRouterClient(apiKey) : createOpenRouterClient();
    routerInstance = new ModelRouter(client);
    instanceApiKey = apiKey;
  }
  return routerInstance;
}

// ============================================================================
// Legacy Compatibility Functions
// ============================================================================

/**
 * Select model for task (legacy function signature)
 */
export async function selectModel(
  task: TaskType,
  context: AppContext
): Promise<ModelConfig> {
  const router = getModelRouter();
  return router.selectModel(task, context);
}

/**
 * Check credits (simplified)
 */
export async function checkCredits(subscription: { creditsRemaining: number }): Promise<{
  sufficient: boolean;
  estimatedCost: number;
}> {
  // Estimate for typical query
  const estimatedTokens = 1000;
  const model = OPENROUTER_MODELS['google/gemini-2.0-flash-exp'];
  const estimatedCost = (estimatedTokens / 1_000_000) * model.costPerMillionTokens;

  return {
    sufficient: subscription.creditsRemaining > estimatedCost,
    estimatedCost,
  };
}

/**
 * Calculate cost
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  return calculateORCost(modelId, inputTokens, outputTokens);
}

/**
 * Get model by ID
 */
export function getModel(id: string): ModelConfig | undefined {
  const router = getModelRouter();
  return router.getModel(id);
}

/**
 * Get all models
 */
export function getAllModels(): Record<string, ModelConfig> {
  const router = getModelRouter();
  return router.getAllModels();
}
