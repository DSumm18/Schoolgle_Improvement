"use strict";
// /lib/ai/ai-engine.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEngine = exports.AIEngine = void 0;
const gemini_1 = require("./providers/gemini");
const openrouter_1 = require("./providers/openrouter");
const logger_1 = require("./utils/logger");
/**
 * @class AIEngine
 * The main orchestrator for AI requests. It dynamically selects providers,
 * handles fallback logic, and normalizes responses.
 */
class AIEngine {
    constructor() {
        this.availableProviders = new Map();
        this.providerSequence = [];
        // 1. Instantiate all available providers
        if (process.env.GEMINI_API_KEY) {
            this.availableProviders.set('gemini', new gemini_1.GeminiProvider());
            logger_1.logger.info('Gemini provider initialized', undefined, 'gemini');
        }
        if (process.env.OPENROUTER_API_KEY) {
            this.availableProviders.set('openrouter', new openrouter_1.OpenRouterProvider());
            logger_1.logger.info('OpenRouter provider initialized', undefined, 'openrouter');
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
            .filter((p) => p !== undefined);
        if (this.providerSequence.length === 0) {
            logger_1.logger.error("AI Engine FATAL: No AI providers configured. Please check your .env file for AI_PROVIDER and relevant API keys.");
            throw new Error("No AI providers available");
        }
        else {
            logger_1.logger.info("AI Engine Initialized", {
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
    async executeWithFallback(task) {
        const errors = [];
        for (const provider of this.providerSequence) {
            try {
                const result = await task(provider);
                if (result) {
                    // Assuming the task function returns a response object with a 'success' property
                    const response = result;
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
            }
            catch (error) {
                logger_1.logger.warn(`Provider '${provider.providerName}' threw an exception`, { error: error.message }, provider.providerName);
                errors.push({
                    code: 'PROVIDER_EXCEPTION',
                    message: error.message,
                    provider: provider.providerName,
                    context: { stack: error.stack }
                });
            }
        }
        const errorSummary = errors.map(e => `${e.provider}: ${e.message}`).join('; ');
        logger_1.logger.error('All AI providers failed', { errors: errors.length, summary: errorSummary });
        throw new Error(`All AI providers failed. Errors: [${errorSummary}]`);
    }
    /**
     * Main method for handling chat requests.
     */
    async chat(prompt, context) {
        return this.executeWithFallback(provider => provider.chat(prompt, context));
    }
    /**
     * Main method for handling audio transcription.
     */
    async transcribe(audioBlob) {
        return this.executeWithFallback(async (provider) => {
            // Only attempt to call transcribe if the provider implements it
            return provider.transcribe ? await provider.transcribe(audioBlob) : null;
        });
    }
    logResult(response) {
        logger_1.logger.aiResponse(response.provider, response.model || 'unknown', response.latency || 0, response.usage);
    }
    /**
     * Performs health checks on all available providers
     */
    async healthCheck() {
        const results = {};
        for (const [name, provider] of this.availableProviders) {
            try {
                if (provider.healthCheck) {
                    results[name] = await provider.healthCheck();
                }
                else {
                    // If no health check method, assume healthy
                    results[name] = true;
                }
            }
            catch (error) {
                logger_1.logger.warn(`Health check failed for provider ${name}`, { error: error.message }, name);
                results[name] = false;
            }
        }
        return results;
    }
}
exports.AIEngine = AIEngine;
// Export a singleton instance for easy use throughout the app.
exports.aiEngine = new AIEngine();
