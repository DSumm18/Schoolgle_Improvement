/**
 * Google Cloud Text-to-Speech - FREE TIER
 * 
 * Free Limits:
 * - 4 million characters per month (WaveNet/Neural2)
 * - ~5,000 conversations (avg 800 chars each)
 * 
 * Cost: £0 for first 4M chars 🎉
 * Then: $16 per 1M characters
 */

import type { PersonaType } from '../types';

// Voice configurations for different personas
const VOICE_CONFIGS = {
  ed: {
    languageCode: 'en-GB',
    name: 'en-GB-Neural2-B', // Male, professional
    pitch: 0,
    speakingRate: 1.0,
  },
  santa: {
    languageCode: 'en-GB',
    name: 'en-GB-Neural2-D', // Male, deep voice
    pitch: -2,
    speakingRate: 0.9,
  },
  elf: {
    languageCode: 'en-GB',
    name: 'en-GB-Neural2-A', // Female, energetic
    pitch: 2,
    speakingRate: 1.1,
  },
};

// Language voice mappings
const LANGUAGE_VOICES: Record<string, string> = {
  'en-GB': 'en-GB-Neural2-B',
  'pl': 'pl-PL-Wavenet-A',
  'ro': 'ro-RO-Wavenet-A',
  'es': 'es-ES-Neural2-B',
  'pt': 'pt-PT-Wavenet-A',
  'fr': 'fr-FR-Neural2-B',
  'zh': 'cmn-CN-Wavenet-A',
  'ar': 'ar-XA-Wavenet-A',
  'pa': 'pa-IN-Wavenet-A',
  // Bengali, Urdu, Somali - fallback to browser TTS
};

export class GoogleTTSFree {
  private apiKey: string;
  private baseUrl = 'https://texttospeech.googleapis.com/v1';
  private audioCache: Map<string, string> = new Map();
  
  // Usage tracking
  private monthlyCharCount = 0;
  private lastResetDate = new Date().getMonth();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Check and update usage limits
   */
  private checkUsage(textLength: number): boolean {
    const currentMonth = new Date().getMonth();
    
    // Reset counter on new month
    if (currentMonth !== this.lastResetDate) {
      this.monthlyCharCount = 0;
      this.lastResetDate = currentMonth;
    }
    
    // Check if we're within free tier (4M chars)
    if (this.monthlyCharCount + textLength > 4000000) {
      console.warn('[Google TTS] Approaching free tier limit (4M chars/month)');
      return false;
    }
    
    this.monthlyCharCount += textLength;
    return true;
  }

  /**
   * Convert text to speech
   */
  public async speak(
    text: string,
    persona: PersonaType = 'ed',
    languageCode: string = 'en-GB'
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${persona}-${languageCode}-${text}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    // Check usage limits
    if (!this.checkUsage(text.length)) {
      throw new Error('Monthly free tier limit approaching. Consider fallback.');
    }

    // Get voice config
    const voiceConfig = VOICE_CONFIGS[persona] || VOICE_CONFIGS.ed;
    const voiceName = LANGUAGE_VOICES[languageCode] || LANGUAGE_VOICES['en-GB'];

    try {
      const response = await fetch(
        `${this.baseUrl}/text:synthesize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode,
              name: voiceName,
            },
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: voiceConfig.pitch,
              speakingRate: voiceConfig.speakingRate,
              volumeGainDb: 0,
              sampleRateHertz: 24000,
              effectsProfileId: ['small-bluetooth-speaker-class-device'],
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Google TTS] API Error:', error);
        throw new Error(`TTS error: ${response.status}`);
      }

      const data = await response.json();
      const audioContent = data.audioContent;

      // Convert base64 to blob
      const audioBlob = this.base64ToBlob(audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache (limit size)
      if (this.audioCache.size > 50) {
        const firstKey = this.audioCache.keys().next().value;
        const firstUrl = this.audioCache.get(firstKey);
        if (firstUrl) URL.revokeObjectURL(firstUrl);
        this.audioCache.delete(firstKey);
      }
      this.audioCache.set(cacheKey, audioUrl);

      // Log usage
      console.log('[Google TTS] Usage:', {
        charsThisRequest: text.length,
        charsThisMonth: this.monthlyCharCount,
        remainingFree: 4000000 - this.monthlyCharCount,
        percentUsed: ((this.monthlyCharCount / 4000000) * 100).toFixed(1) + '%',
        cost: '£0 🎉',
      });

      return audioUrl;
    } catch (error) {
      console.error('[Google TTS] Error:', error);
      throw error;
    }
  }

  /**
   * Play audio from URL
   */
  public async play(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => resolve();
      audio.onerror = (error) => reject(error);
      audio.play().catch(reject);
    });
  }

  /**
   * Speak and play in one call
   */
  public async speakAndPlay(
    text: string,
    persona: PersonaType = 'ed',
    language: string = 'en-GB'
  ): Promise<void> {
    const audioUrl = await this.speak(text, persona, language);
    await this.play(audioUrl);
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(): {
    charsUsedThisMonth: number;
    charsRemaining: number;
    percentUsed: number;
    estimatedConversationsRemaining: number;
  } {
    const remaining = 4000000 - this.monthlyCharCount;
    return {
      charsUsedThisMonth: this.monthlyCharCount,
      charsRemaining: remaining,
      percentUsed: (this.monthlyCharCount / 4000000) * 100,
      estimatedConversationsRemaining: Math.floor(remaining / 800), // avg 800 chars/conversation
    };
  }

  /**
   * Check if approaching free tier limit
   */
  public isApproachingLimit(): boolean {
    return this.monthlyCharCount > 3200000; // 80% of 4M
  }

  /**
   * Helper: Convert base64 to Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Clear audio cache
   */
  public clearCache(): void {
    this.audioCache.forEach((url) => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.clearCache();
  }
}

