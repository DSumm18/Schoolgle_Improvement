import type { TTSProvider, TTSResponse } from '../types';
import type { VoiceProfile } from "../config/voiceProfiles";
export declare class GeminiTTSProvider implements TTSProvider {
    readonly providerName = "gemini-tts";
    private ai;
    constructor();
    synthesize(text: string, voiceProfile: VoiceProfile): Promise<TTSResponse>;
    /**
     * Performs a health check on the Gemini TTS provider
     */
    healthCheck(): Promise<boolean>;
}
