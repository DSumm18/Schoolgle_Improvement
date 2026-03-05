// /lib/ai/tts-providers/google-tts.ts

import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import type { TTSProvider, TTSResponse } from '../types';
import type { VoiceProfile } from "../config/voiceProfiles";

export class GoogleCloudTTSProvider implements TTSProvider {
  public readonly providerName = 'google-cloud-tts';
  private client: TextToSpeechClient;

  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not set for GoogleCloudTTSProvider.");
    }
    
    // Initialize the Google Cloud TTS client
    this.client = new TextToSpeechClient({
      keyFilename: process.env.GOOGLE_API_KEY, // This should be a service account key file path
    });
  }

  async synthesize(text: string, voiceProfile: VoiceProfile): Promise<TTSResponse> {
    const startTime = Date.now();
    
    try {
      const request = {
        input: { text: text },
        voice: {
          languageCode: 'en-GB', // Default to British English
          name: voiceProfile.voiceName,
          ssmlGender: voiceProfile.gender === 'male' ? 'MALE' as const : 'FEMALE' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
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

    } catch (error: any) {
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
  async healthCheck(): Promise<boolean> {
    try {
      // Simple test synthesis to verify the API is working
      const response = await this.synthesize("Hello", {
        provider: 'google-cloud-tts',
        voiceName: 'en-GB-Neural2-B',
        gender: 'male',
        style: 'test'
      });
      return response.success;
    } catch (error) {
      return false;
    }
  }
}
