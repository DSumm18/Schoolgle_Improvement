import type { TTSProvider, TTSResponse } from '../types';
import type { VoiceProfile } from "../config/voiceProfiles";
export declare class GoogleCloudTTSProvider implements TTSProvider {
    readonly providerName = "google-cloud-tts";
    private client;
    constructor();
    synthesize(text: string, voiceProfile: VoiceProfile): Promise<TTSResponse>;
    /**
     * Performs a health check on the Google Cloud TTS provider
     */
    healthCheck(): Promise<boolean>;
}
