// /lib/ai/ai-engine.ts

import { GeminiProvider } from './providers/gemini';
import { OpenRouterProvider } from './providers/openrouter';
// import { LocalProvider } from './providers/local'; // Placeholder for future local models
import type { 
  AIProvider, 
  AIResponse, 
  ChatContext, 
  AIError,
  AudioBlob
} from './types';
import { logger } from './utils/logger';

/**
 * @class AIEngine
 * The main orchestrator for AI requests. It dynamically selects providers,
 * handles fallback logic, and normalizes responses.
 */
export class AIEngine {
  private availableProviders: Map<string, AIProvider> = new Map();
  private providerSequence: AIProvider[] = [];

  constructor() {
    // 1. Instantiate all available providers
    if (process.env.GEMINI_API_KEY) {
      this.availableProviders.set('gemini', new GeminiProvider());
      logger.info('Gemini provider initialized', undefined, 'gemini');
    }
    if (process.env.OPENROUTER_API_KEY) {
      this.availableProviders.set('openrouter', new OpenRouterProvider());
      logger.info('OpenRouter provider initialized', undefined, 'openrouter');
    }
    // To add a local provider:
    // this.availableProviders.set('local', new LocalProvider());
    
    // 2. Build the provider sequence based on environment variables
    const primaryProviderName = process.env.AI_PROVIDER || 'gemini';
    const fallbackNamesStr = process.env.AI_FALLBACK_PROVIDERS || '';
    
    const sequenceNames = [
        primaryProviderName,
        ...fallbackNamesStr.split(',').map(s => s.trim()).filter(Boolean)
    ];

    // Create a unique sequence of provider instances
    const uniqueSequenceNames = [...new Set(sequenceNames)];
    this.providerSequence = uniqueSequenceNames
      .map(name => this.availableProviders.get(name))
      .filter((p): p is AIProvider => p !== undefined);

    if (this.providerSequence.length === 0) {
      logger.error("AI Engine FATAL: No AI providers configured. Please check your .env file for AI_PROVIDER and relevant API keys.");
      throw new Error("No AI providers available");
    } else {
      logger.info("AI Engine Initialized", { 
        providerSequence: this.providerSequence.map(p => p.providerName).join(' -> '),
        totalProviders: this.providerSequence.length
      });
    }
  }

  /**
   * Executes a task by trying each provider in the configured sequence until one succeeds.
   * @param task A function that takes a provider and executes a specific method (e.g., chat, transcribe).
   * @returns The AIResponse from the first successful provider.
   * @throws An aggregated error if all providers in the sequence fail.
   */
  private async executeWithFallback<T>(
    task: (provider: AIProvider) => Promise<T | null>
  ): Promise<T> {
    const errors: AIError[] = [];

    for (const provider of this.providerSequence) {
      try {
        const result = await task(provider);
        if (result) {
          // Assuming the task function returns a response object with a 'success' property
          const response = result as unknown as AIResponse;
          if (response.success) {
            this.logResult(response);
            return result;
          }
          const errorMessage = response.error || 'Request failed without a specific error.';
          errors.push({
            code: 'PROVIDER_ERROR',
            message: errorMessage,
            provider: provider.providerName
          });
        }
        // If result is null, it means the provider doesn't support the capability. Continue to the next.
      } catch (error: any) {
        logger.warn(`Provider '${provider.providerName}' threw an exception`, { error: error.message }, provider.providerName);
        errors.push({
          code: 'PROVIDER_EXCEPTION',
          message: error.message,
          provider: provider.providerName,
          context: { stack: error.stack }
        });
      }
    }

    const errorSummary = errors.map(e => `${e.provider}: ${e.message}`).join('; ');
    logger.error('All AI providers failed', { errors: errors.length, summary: errorSummary });
    throw new Error(`All AI providers failed. Errors: [${errorSummary}]`);
  }

  /**
   * Main method for handling chat requests.
   */
  public async chat(prompt: string, context?: ChatContext): Promise<AIResponse> {
    return this.executeWithFallback(provider => provider.chat(prompt, context));
  }
  
  /**
   * Main method for handling audio transcription.
   */
  public async transcribe(audioBlob: AudioBlob): Promise<AIResponse> {
    return this.executeWithFallback(async provider => {
        // Only attempt to call transcribe if the provider implements it
        return provider.transcribe ? await provider.transcribe(audioBlob) : null;
    });
  }

  private logResult(response: AIResponse): void {
    logger.aiResponse(
      response.provider, 
      response.model || 'unknown', 
      response.latency || 0, 
      response.usage
    );
  }

  /**
   * Performs health checks on all available providers
   */
  public async healthCheck(): Promise<{ [providerName: string]: boolean }> {
    const results: { [providerName: string]: boolean } = {};
    
    for (const [name, provider] of this.availableProviders) {
      try {
        if (provider.healthCheck) {
          results[name] = await provider.healthCheck();
        } else {
          // If no health check method, assume healthy
          results[name] = true;
        }
      } catch (error) {
        logger.warn(`Health check failed for provider ${name}`, { error: (error as Error).message }, name);
        results[name] = false;
      }
    }
    
    return results;
  }
}

// Export a singleton instance for easy use throughout the app.
export const aiEngine = new AIEngine();
