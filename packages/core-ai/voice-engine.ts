// /lib/ai/voice-engine.ts

import { GeminiTTSProvider } from './tts-providers/gemini-tts';
import { GoogleCloudTTSProvider } from './tts-providers/google-tts'; // New provider
import { voiceProfiles, type VoiceProfile } from './config/voiceProfiles';
import type { TTSProvider, TTSResponse, TTSError } from './types';
import { logger } from './utils/logger';

/**
 * @class VoiceEngine
 * The main orchestrator for TTS requests. It routes requests to the correct
 * provider based on the selected persona's voice profile.
 */
export class VoiceEngine {
  private providers: Map<string, TTSProvider>;
  private defaultPersonaName: string;
  private preloadedVoices: Set<string> = new Set();
  private preloadPromise: Promise<void> | null = null;

  constructor() {
    // 1. Instantiate all available TTS provider adapters
    this.providers = new Map();
    if (process.env.GEMINI_API_KEY) {
      this.providers.set('gemini-tts', new GeminiTTSProvider());
    }
    // Only initialize Google Cloud TTS if GOOGLE_API_KEY is available (optional)
    if (process.env.GOOGLE_API_KEY) {
      this.providers.set('google-cloud-tts', new GoogleCloudTTSProvider());
    }

    // 2. Determine the default persona from the central configuration
    this.defaultPersonaName = Object.keys(voiceProfiles).find(key => voiceProfiles[key].isDefault) || 'ed';
    
    if (this.providers.size === 0) {
      logger.error("Voice Engine FATAL: No TTS providers configured. Please check environment variables.");
      throw new Error("No TTS providers available");
    } else {
      logger.info("Voice Engine Initialized", { 
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
  private async preloadVoices(): Promise<void> {
    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    this.preloadPromise = this.performVoicePreload();
    return this.preloadPromise;
  }

  private async performVoicePreload(): Promise<void> {
    const preloadText = "Hello"; // Short text for preloading
    const preloadPromises: Promise<void>[] = [];

    for (const [personaName, profile] of Object.entries(voiceProfiles)) {
      const provider = this.providers.get(profile.provider);
      if (provider) {
        preloadPromises.push(
          this.preloadVoice(provider, profile, preloadText, personaName)
        );
      }
    }

    try {
      await Promise.allSettled(preloadPromises);
      logger.info("Voice preloading completed", { 
        preloadedCount: this.preloadedVoices.size,
        voices: Array.from(this.preloadedVoices)
      });
    } catch (error) {
      logger.warn("Some voices failed to preload", { error: (error as Error).message });
    }
  }

  private async preloadVoice(
    provider: TTSProvider, 
    profile: VoiceProfile, 
    text: string, 
    personaName: string
  ): Promise<void> {
    try {
      const response = await provider.synthesize(text, profile);
      if (response.success) {
        this.preloadedVoices.add(profile.voiceName);
        logger.voicePreload(profile.voiceName, provider.providerName, true);
      } else {
        logger.voicePreload(profile.voiceName, provider.providerName, false);
      }
    } catch (error) {
      logger.voicePreload(profile.voiceName, provider.providerName, false);
    }
  }

  /**
   * Main method for synthesizing speech from text for a specific persona.
   * @param text The text to be spoken.
   * @param personaName The identifier of the persona to use (e.g., 'ed', 'hugh'). Defaults to the application's default persona.
   * @returns a standardized TTSResponse.
   */
  public async speak(text: string, personaName?: string): Promise<TTSResponse> {
    const targetPersonaName = personaName || this.defaultPersonaName;
    const profile = voiceProfiles[targetPersonaName];

    if (!profile) {
      const errorMsg = `Voice profile not found for persona '${targetPersonaName}'`;
      logger.error(`Voice profile not found`, { personaName: targetPersonaName });
      throw new Error(errorMsg);
    }
    
    const provider = this.providers.get(profile.provider);
    if (!provider) {
       const errorMsg = `TTS provider '${profile.provider}' for persona '${targetPersonaName}' is not configured. Check your environment variables.`;
       logger.error(`TTS provider not configured`, { provider: profile.provider, personaName: targetPersonaName });
       // Fallback to an error response instead of throwing
       return {
            success: false,
            base64Audio: '',
            provider: profile.provider,
            latency: 0,
            error: errorMsg,
       };
    }

    logger.info(`Voice synthesis request`, { 
      persona: targetPersonaName, 
      provider: profile.provider, 
      voice: profile.voiceName,
      textLength: text.length
    }, profile.provider, targetPersonaName);

    // Delegate the synthesis task to the specific provider adapter
    const response = await provider.synthesize(text, profile);
    
    if(response.success) {
      logger.voiceSynthesis(
        response.provider, 
        response.voiceUsed || profile.voiceName, 
        text, 
        response.latency
      );
    } else {
      logger.error(`Voice synthesis failed`, { 
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
  public async healthCheck(): Promise<{ [providerName: string]: boolean }> {
    const results: { [providerName: string]: boolean } = {};
    
    for (const [name, provider] of this.providers) {
      try {
        if (provider.healthCheck) {
          results[name] = await provider.healthCheck();
        } else {
          // If no health check method, assume healthy
          results[name] = true;
        }
      } catch (error) {
        logger.warn(`Health check failed for TTS provider ${name}`, { error: (error as Error).message }, name);
        results[name] = false;
      }
    }
    
    return results;
  }

  /**
   * Gets the list of preloaded voices
   */
  public getPreloadedVoices(): string[] {
    return Array.from(this.preloadedVoices);
  }
}

export const voiceEngine = new VoiceEngine();
