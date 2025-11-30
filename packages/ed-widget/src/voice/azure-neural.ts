/**
 * Azure Neural TTS - BEST VALUE for Quality
 * 
 * Free Tier: 500K characters/month (~650 conversations)
 * Paid: £12 per 1M characters
 * 
 * Quality: 7.5/10 (Much better than Google, affordable)
 */

import type { PersonaType } from '../types';

// Azure Neural voice mappings for all Ed's languages
const VOICE_MAP: Record<string, string> = {
  // UK English - Professional voices
  'en-GB': 'en-GB-RyanNeural',      // Male, professional
  'en-US': 'en-US-GuyNeural',
  
  // European languages
  'pl': 'pl-PL-MarekNeural',         // Polish
  'ro': 'ro-RO-EmilNeural',          // Romanian
  'es': 'es-ES-AlvaroNeural',        // Spanish
  'pt': 'pt-PT-DuarteNeural',        // Portuguese
  'fr': 'fr-FR-HenriNeural',         // French
  
  // Asian languages
  'zh': 'zh-CN-YunxiNeural',         // Chinese (Mandarin)
  'ar': 'ar-SA-HamedNeural',         // Arabic
  'pa': 'pa-IN-GaganNeural',         // Punjabi
  
  // Note: Bengali (bn), Urdu (ur), Somali (so) may need fallback
};

// Persona voice variants
const PERSONA_VOICES: Record<string, Record<PersonaType, string>> = {
  'en-GB': {
    ed: 'en-GB-RyanNeural',          // Professional male
    santa: 'en-GB-ThomasNeural',     // Mature, deeper
    elf: 'en-GB-MaisieNeural',       // Young, energetic female
  },
};

export class AzureNeuralVoice {
  private apiKey: string;
  private region: string;
  private audioCache: Map<string, string> = new Map();
  
  // Usage tracking
  private monthlyCharCount = 0;
  private lastResetDate = new Date().getMonth();

  constructor(apiKey: string, region: string = 'uksouth') {
    this.apiKey = apiKey;
    this.region = region;
  }

  /**
   * Check and update usage limits
   */
  private checkUsage(textLength: number): { withinFree: boolean; estimatedCost: number } {
    const currentMonth = new Date().getMonth();
    
    // Reset counter on new month
    if (currentMonth !== this.lastResetDate) {
      this.monthlyCharCount = 0;
      this.lastResetDate = currentMonth;
    }
    
    this.monthlyCharCount += textLength;
    
    const FREE_TIER = 500000; // 500K chars/month
    const withinFree = this.monthlyCharCount <= FREE_TIER;
    
    // Calculate cost
    let cost = 0;
    if (!withinFree) {
      const overageChars = this.monthlyCharCount - FREE_TIER;
      cost = (overageChars / 1000000) * 12; // £12 per 1M chars
    }
    
    return { withinFree, estimatedCost: cost };
  }

  /**
   * Convert text to speech using Azure Neural voices
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

    // Check usage
    const usage = this.checkUsage(text.length);

    // Get voice name
    let voiceName: string;
    if (languageCode === 'en-GB' && PERSONA_VOICES['en-GB'][persona]) {
      voiceName = PERSONA_VOICES['en-GB'][persona];
    } else {
      voiceName = VOICE_MAP[languageCode] || VOICE_MAP['en-GB'];
    }

    try {
      // Build SSML for better control
      const ssml = this.buildSSML(text, voiceName, persona);

      const response = await fetch(
        `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
          },
          body: ssml,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Azure Neural] API Error:', error);
        throw new Error(`TTS error: ${response.status}`);
      }

      // Convert to blob URL
      const audioBlob = await response.blob();
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
      console.log('[Azure Neural] Usage:', {
        charsThisRequest: text.length,
        charsThisMonth: this.monthlyCharCount,
        withinFreeTier: usage.withinFree,
        estimatedCost: `£${usage.estimatedCost.toFixed(2)}`,
        voice: voiceName,
      });

      return audioUrl;
    } catch (error) {
      console.error('[Azure Neural] Error:', error);
      throw error;
    }
  }

  /**
   * Build SSML for better voice control
   */
  private buildSSML(text: string, voiceName: string, persona: PersonaType): string {
    // Adjust speaking style based on persona
    const styles: Record<PersonaType, { rate: string; pitch: string }> = {
      ed: { rate: '1.05', pitch: '+0%' },
      santa: { rate: '0.95', pitch: '-5%' },
      elf: { rate: '1.15', pitch: '+8%' },
    };

    const style = styles[persona] || styles.ed;

    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
             xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-GB">
        <voice name="${voiceName}">
          <prosody rate="${style.rate}" pitch="${style.pitch}">
            ${this.escapeXml(text)}
          </prosody>
        </voice>
      </speak>
    `.trim();
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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
    charsInFreeTier: number;
    charsRemaining: number;
    percentUsed: number;
    estimatedCost: number;
    estimatedConversationsRemaining: number;
  } {
    const FREE_TIER = 500000;
    const charsInFree = Math.min(this.monthlyCharCount, FREE_TIER);
    const remaining = Math.max(FREE_TIER - this.monthlyCharCount, 0);
    
    let cost = 0;
    if (this.monthlyCharCount > FREE_TIER) {
      const overage = this.monthlyCharCount - FREE_TIER;
      cost = (overage / 1000000) * 12;
    }

    return {
      charsUsedThisMonth: this.monthlyCharCount,
      charsInFreeTier: charsInFree,
      charsRemaining: remaining,
      percentUsed: (this.monthlyCharCount / FREE_TIER) * 100,
      estimatedCost: cost,
      estimatedConversationsRemaining: Math.floor(remaining / 800),
    };
  }

  /**
   * Check if approaching free tier limit
   */
  public isApproachingLimit(): boolean {
    return this.monthlyCharCount > 400000; // 80% of 500K
  }

  /**
   * Check if a language is supported
   */
  public isLanguageSupported(languageCode: string): boolean {
    return languageCode in VOICE_MAP;
  }

  /**
   * Get available voices for language
   */
  public getVoicesForLanguage(languageCode: string): string[] {
    if (languageCode === 'en-GB') {
      return Object.values(PERSONA_VOICES['en-GB']);
    }
    const voice = VOICE_MAP[languageCode];
    return voice ? [voice] : [];
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

