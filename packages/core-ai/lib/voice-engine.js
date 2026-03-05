"use strict";
// /lib/ai/voice-engine.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceEngine = exports.VoiceEngine = void 0;
const gemini_tts_1 = require("./tts-providers/gemini-tts");
const google_tts_1 = require("./tts-providers/google-tts"); // New provider
const voiceProfiles_1 = require("./config/voiceProfiles");
const logger_1 = require("./utils/logger");
/**
 * @class VoiceEngine
 * The main orchestrator for TTS requests. It routes requests to the correct
 * provider based on the selected persona's voice profile.
 */
class VoiceEngine {
    constructor() {
        this.preloadedVoices = new Set();
        this.preloadPromise = null;
        // 1. Instantiate all available TTS provider adapters
        this.providers = new Map();
        if (process.env.GEMINI_API_KEY) {
            this.providers.set('gemini-tts', new gemini_tts_1.GeminiTTSProvider());
            // FIX: Use the primary GEMINI_API_KEY to configure the Google Cloud TTS provider.
            // This simplifies setup and ensures it's always available if the main key is present.
            this.providers.set('google-cloud-tts', new google_tts_1.GoogleCloudTTSProvider());
        }
        // 2. Determine the default persona from the central configuration
        this.defaultPersonaName = Object.keys(voiceProfiles_1.voiceProfiles).find(key => voiceProfiles_1.voiceProfiles[key].isDefault) || 'ed';
        if (this.providers.size === 0) {
            logger_1.logger.error("Voice Engine FATAL: No TTS providers configured. Please check environment variables.");
            throw new Error("No TTS providers available");
        }
        else {
            logger_1.logger.info("Voice Engine Initialized", {
                availableProviders: Array.from(this.providers.keys()).join(', '),
                totalProviders: this.providers.size
            });
            // Start async voice preloading
            this.preloadVoices();
        }
    }
    /**
     * Preloads commonly used voices for faster first-time playback
     */
    async preloadVoices() {
        if (this.preloadPromise) {
            return this.preloadPromise;
        }
        this.preloadPromise = this.performVoicePreload();
        return this.preloadPromise;
    }
    async performVoicePreload() {
        const preloadText = "Hello"; // Short text for preloading
        const preloadPromises = [];
        for (const [personaName, profile] of Object.entries(voiceProfiles_1.voiceProfiles)) {
            const provider = this.providers.get(profile.provider);
            if (provider) {
                preloadPromises.push(this.preloadVoice(provider, profile, preloadText, personaName));
            }
        }
        try {
            await Promise.allSettled(preloadPromises);
            logger_1.logger.info("Voice preloading completed", {
                preloadedCount: this.preloadedVoices.size,
                voices: Array.from(this.preloadedVoices)
            });
        }
        catch (error) {
            logger_1.logger.warn("Some voices failed to preload", { error: error.message });
        }
    }
    async preloadVoice(provider, profile, text, personaName) {
        try {
            const response = await provider.synthesize(text, profile);
            if (response.success) {
                this.preloadedVoices.add(profile.voiceName);
                logger_1.logger.voicePreload(profile.voiceName, provider.providerName, true);
            }
            else {
                logger_1.logger.voicePreload(profile.voiceName, provider.providerName, false);
            }
        }
        catch (error) {
            logger_1.logger.voicePreload(profile.voiceName, provider.providerName, false);
        }
    }
    /**
     * Main method for synthesizing speech from text for a specific persona.
     * @param text The text to be spoken.
     * @param personaName The identifier of the persona to use (e.g., 'ed', 'hugh'). Defaults to the application's default persona.
     * @returns a standardized TTSResponse.
     */
    async speak(text, personaName) {
        const targetPersonaName = personaName || this.defaultPersonaName;
        const profile = voiceProfiles_1.voiceProfiles[targetPersonaName];
        if (!profile) {
            const errorMsg = `Voice profile not found for persona '${targetPersonaName}'`;
            logger_1.logger.error(`Voice profile not found`, { personaName: targetPersonaName });
            throw new Error(errorMsg);
        }
        const provider = this.providers.get(profile.provider);
        if (!provider) {
            const errorMsg = `TTS provider '${profile.provider}' for persona '${targetPersonaName}' is not configured. Check your environment variables.`;
            logger_1.logger.error(`TTS provider not configured`, { provider: profile.provider, personaName: targetPersonaName });
            // Fallback to an error response instead of throwing
            return {
                success: false,
                base64Audio: '',
                provider: profile.provider,
                latency: 0,
                error: errorMsg,
            };
        }
        logger_1.logger.info(`Voice synthesis request`, {
            persona: targetPersonaName,
            provider: profile.provider,
            voice: profile.voiceName,
            textLength: text.length
        }, profile.provider, targetPersonaName);
        // Delegate the synthesis task to the specific provider adapter
        const response = await provider.synthesize(text, profile);
        if (response.success) {
            logger_1.logger.voiceSynthesis(response.provider, response.voiceUsed || profile.voiceName, text, response.latency);
        }
        else {
            logger_1.logger.error(`Voice synthesis failed`, {
                provider: response.provider,
                error: response.error,
                voice: profile.voiceName
            }, response.provider, targetPersonaName);
        }
        return response;
    }
    /**
     * Performs health checks on all available TTS providers
     */
    async healthCheck() {
        const results = {};
        for (const [name, provider] of this.providers) {
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
                logger_1.logger.warn(`Health check failed for TTS provider ${name}`, { error: error.message }, name);
                results[name] = false;
            }
        }
        return results;
    }
    /**
     * Gets the list of preloaded voices
     */
    getPreloadedVoices() {
        return Array.from(this.preloadedVoices);
    }
}
exports.VoiceEngine = VoiceEngine;
exports.voiceEngine = new VoiceEngine();
