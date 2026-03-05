"use strict";
// /lib/ai/providers/gemini.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const genai_1 = require("@google/genai");
const logger_1 = require("../utils/logger");
class GeminiProvider {
    constructor() {
        this.providerName = 'gemini';
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set for GeminiProvider.");
        }
        this.ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    async chat(prompt, context) {
        const model = 'gemini-2.5-pro'; // Upgraded model for better reasoning
        const startTime = Date.now();
        logger_1.logger.aiRequest(this.providerName, model, prompt, context);
        try {
            const response = await this.ai.models.generateContent({
                model: model,
                contents: prompt,
                ...(context?.systemInstruction && { config: { systemInstruction: context.systemInstruction } }),
            });
            const latency = Date.now() - startTime;
            // Gemini API v1 does not provide token counts in the standard response.
            const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
            const result = {
                success: true,
                text: response.text || 'No response generated',
                provider: this.providerName,
                model: model,
                latency: latency,
                usage: usage
            };
            logger_1.logger.aiResponse(this.providerName, model, latency, usage);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Gemini chat request failed', { error: error.message, model }, this.providerName);
            return this.createErrorResponse(error, startTime);
        }
    }
    async transcribe(audioBlob) {
        const model = 'gemini-2.5-pro'; // Upgraded model
        const startTime = Date.now();
        try {
            const base64Audio = audioBlob.data;
            const audioPart = {
                inlineData: {
                    mimeType: audioBlob.mimeType,
                    data: base64Audio,
                },
            };
            const textPart = {
                text: "Transcribe this audio message from a parent reporting their child's absence from school. Capture the child's name, class, and the reason for absence clearly.",
            };
            const response = await this.ai.models.generateContent({
                model,
                contents: { parts: [audioPart, textPart] },
            });
            const latency = Date.now() - startTime;
            return {
                success: true,
                text: response.text || 'No transcription available',
                provider: this.providerName,
                model,
                latency,
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
            };
        }
        catch (error) {
            return this.createErrorResponse(error, startTime);
        }
    }
    createErrorResponse(error, startTime) {
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
     * Performs a health check on the Gemini provider
     */
    async healthCheck() {
        try {
            // Simple test request to verify the API is working
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: 'Hello',
            });
            return response.text !== undefined;
        }
        catch (error) {
            logger_1.logger.warn('Gemini health check failed', { error: error.message }, this.providerName);
            return false;
        }
    }
}
exports.GeminiProvider = GeminiProvider;
