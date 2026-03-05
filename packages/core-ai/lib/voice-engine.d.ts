import type { TTSResponse } from './types';
/**
 * @class VoiceEngine
 * The main orchestrator for TTS requests. It routes requests to the correct
 * provider based on the selected persona's voice profile.
 */
export declare class VoiceEngine {
    private providers;
    private defaultPersonaName;
    private preloadedVoices;
    private preloadPromise;
    constructor();
    /**
     * Preloads commonly used voices for faster first-time playback
     */
    private preloadVoices;
    private performVoicePreload;
    private preloadVoice;
    /**
     * Main method for synthesizing speech from text for a specific persona.
     * @param text The text to be spoken.
     * @param personaName The identifier of the persona to use (e.g., 'ed', 'hugh'). Defaults to the application's default persona.
     * @returns a standardized TTSResponse.
     */
    speak(text: string, personaName?: string): Promise<TTSResponse>;
    /**
     * Performs health checks on all available TTS providers
     */
    healthCheck(): Promise<{
        [providerName: string]: boolean;
    }>;
    /**
     * Gets the list of preloaded voices
     */
    getPreloadedVoices(): string[];
}
export declare const voiceEngine: VoiceEngine;
