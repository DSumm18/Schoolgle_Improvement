import type { AIProvider, AIResponse, ChatContext } from '../types';
export declare class OpenRouterProvider implements AIProvider {
    readonly providerName = "openrouter";
    constructor();
    chat(prompt: string, context?: ChatContext): Promise<AIResponse>;
    private createErrorResponse;
    /**
     * Performs a health check on the OpenRouter provider
     */
    healthCheck(): Promise<boolean>;
}
