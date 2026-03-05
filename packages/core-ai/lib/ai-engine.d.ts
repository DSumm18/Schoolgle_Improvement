import type { AIResponse, ChatContext, AudioBlob } from './types';
/**
 * @class AIEngine
 * The main orchestrator for AI requests. It dynamically selects providers,
 * handles fallback logic, and normalizes responses.
 */
export declare class AIEngine {
    private availableProviders;
    private providerSequence;
    constructor();
    /**
     * Executes a task by trying each provider in the configured sequence until one succeeds.
     * @param task A function that takes a provider and executes a specific method (e.g., chat, transcribe).
     * @returns The AIResponse from the first successful provider.
     * @throws An aggregated error if all providers in the sequence fail.
     */
    private executeWithFallback;
    /**
     * Main method for handling chat requests.
     */
    chat(prompt: string, context?: ChatContext): Promise<AIResponse>;
    /**
     * Main method for handling audio transcription.
     */
    transcribe(audioBlob: AudioBlob): Promise<AIResponse>;
    private logResult;
    /**
     * Performs health checks on all available providers
     */
    healthCheck(): Promise<{
        [providerName: string]: boolean;
    }>;
}
export declare const aiEngine: AIEngine;
