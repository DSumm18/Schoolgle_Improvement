// /lib/ai/providers/openrouter.ts

import type { AIProvider, AIResponse, ChatContext } from '../types';
import { logger } from '../utils/logger';

export class OpenRouterProvider implements AIProvider {
  public readonly providerName = 'openrouter';

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not set for OpenRouterProvider.");
    }
  }

  async chat(prompt: string, context?: ChatContext): Promise<AIResponse> {
    const startTime = Date.now();
    
    logger.aiRequest(this.providerName, 'openrouter', prompt, context);
    
    try {
      // Placeholder implementation - would need actual OpenRouter API integration
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            ...(context?.systemInstruction ? [{ role: 'system', content: context.systemInstruction }] : []),
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      const result = {
        success: true,
        text: data.choices[0]?.message?.content || '',
        provider: this.providerName,
        model: 'openrouter',
        latency: latency,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };

      logger.aiResponse(this.providerName, 'openrouter', latency, result.usage);
      return result;
    } catch (error: any) {
      logger.error('OpenRouter chat request failed', { error: error.message }, this.providerName);
      return this.createErrorResponse(error, startTime);
    }
  }

  private createErrorResponse(error: any, startTime: number): AIResponse {
    const latency = Date.now() - startTime;
    return {
      success: false,
      text: '',
      provider: this.providerName,
      latency: latency,
      error: error.message || `An unknown error occurred with the ${this.providerName} API.`,
      usage: null,
      raw: error,
    };
  }

  /**
   * Performs a health check on the OpenRouter provider
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple test request to verify the API is working
      const response = await this.chat('Hello');
      return response.success;
    } catch (error) {
      logger.warn('OpenRouter health check failed', { error: (error as Error).message }, this.providerName);
      return false;
    }
  }
}
