"use strict";
// /lib/ai/tts-providers/gemini-tts.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiTTSProvider = void 0;
const genai_1 = require("@google/genai");
class GeminiTTSProvider {
    constructor() {
        this.providerName = 'gemini-tts';
        // FIX: Standardized to use GEMINI_API_KEY to match other Gemini services.
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set for GeminiTTSProvider.");
        }
        this.ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    async synthesize(text, voiceProfile) {
        const startTime = Date.now();
        // SIMPLIFIED: No mapping needed. Use the name directly from the profile.
        const geminiVoiceName = voiceProfile.voiceName;
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [genai_1.Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: geminiVoiceName },
                        },
                    },
                },
            });
            const latency = Date.now() - startTime;
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                throw new Error("Failed to generate audio from text; response was empty.");
            }
            return {
                success: true,
                base64Audio: base64Audio,
                provider: this.providerName,
                latency: latency,
                voiceUsed: geminiVoiceName, // Return the actual voice used for verification
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                success: false,
                base64Audio: '',
                provider: this.providerName,
                latency: latency,
                error: error.message || 'An unknown error occurred with the Gemini TTS API.',
                voiceUsed: geminiVoiceName,
            };
        }
    }
    /**
     * Performs a health check on the Gemini TTS provider
     */
    async healthCheck() {
        try {
            // Simple test synthesis to verify the API is working
            const response = await this.synthesize("Hello", {
                provider: 'gemini-tts',
                voiceName: 'Puck',
                gender: 'male',
                style: 'test'
            });
            return response.success;
        }
        catch (error) {
            return false;
        }
    }
}
exports.GeminiTTSProvider = GeminiTTSProvider;
