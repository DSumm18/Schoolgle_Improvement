import type { AIProvider, AIResponse, ChatContext, AudioBlob } from '../types';
export declare class GeminiProvider implements AIProvider {
    readonly providerName = "gemini";
    private ai;
    constructor();
    chat(prompt: string, context?: ChatContext): Promise<AIResponse>;
    transcribe(audioBlob: AudioBlob): Promise<AIResponse>;
    private createErrorResponse;
    /**
     * Performs a health check on the Gemini provider
     */
    healthCheck(): Promise<boolean>;
}
