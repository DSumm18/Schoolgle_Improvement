"use strict";
// /lib/ai/tts-providers/google-tts.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCloudTTSProvider = void 0;
const text_to_speech_1 = require("@google-cloud/text-to-speech");
class GoogleCloudTTSProvider {
    constructor() {
        this.providerName = 'google-cloud-tts';
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error("GOOGLE_API_KEY is not set for GoogleCloudTTSProvider.");
        }
        // Initialize the Google Cloud TTS client
        this.client = new text_to_speech_1.TextToSpeechClient({
            keyFilename: process.env.GOOGLE_API_KEY, // This should be a service account key file path
        });
    }
    async synthesize(text, voiceProfile) {
        const startTime = Date.now();
        try {
            const request = {
                input: { text: text },
                voice: {
                    languageCode: 'en-GB', // Default to British English
                    name: voiceProfile.voiceName,
                    ssmlGender: voiceProfile.gender === 'male' ? 'MALE' : 'FEMALE',
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: voiceProfile.speakingRate || 1.0,
                    pitch: voiceProfile.pitch || 0.0,
                },
            };
            const [response] = await this.client.synthesizeSpeech(request);
            const latency = Date.now() - startTime;
            if (!response.audioContent) {
                throw new Error("Failed to generate audio from text; response was empty.");
            }
            // Convert the audio content to base64
            const base64Audio = Buffer.from(response.audioContent).toString('base64');
            return {
                success: true,
                base64Audio: base64Audio,
                provider: this.providerName,
                latency: latency,
                voiceUsed: voiceProfile.voiceName,
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                success: false,
                base64Audio: '',
                provider: this.providerName,
                latency: latency,
                error: error.message || 'An unknown error occurred with the Google Cloud TTS API.',
                voiceUsed: voiceProfile.voiceName,
            };
        }
    }
    /**
     * Performs a health check on the Google Cloud TTS provider
     */
    async healthCheck() {
        try {
            // Simple test synthesis to verify the API is working
            const response = await this.synthesize("Hello", {
                provider: 'google-cloud-tts',
                voiceName: 'en-GB-Neural2-B',
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
exports.GoogleCloudTTSProvider = GoogleCloudTTSProvider;
