/**
 * ElevenLabs Voice Client
 * Premium text-to-speech with emotion and personality
 */

import type { PersonaType } from '../types';

// ElevenLabs voice IDs for different characters
export const VOICE_PERSONAS = {
  ed: {
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - Professional female
    name: 'Rachel',
    stability: 0.7,
    similarity_boost: 0.8,
    style: 0.5,
  },
  santa: {
    voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold - Deep, mature male
    name: 'Arnold',
    stability: 0.6,
    similarity_boost: 0.8,
    style: 0.7,
  },
  elf: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - Young, energetic female
    name: 'Bella',
    stability: 0.4,
    similarity_boost: 0.9,
    style: 0.8,
  },
} as const;

export interface VoiceSettings {
  stability?: number; // 0-1: Lower = more expressive
  similarity_boost?: number; // 0-1: Higher = closer to original voice
  style?: number; // 0-1: Higher = more exaggerated
  use_speaker_boost?: boolean;
}

export class ElevenLabsVoice {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private audioCache: Map<string, string> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Convert text to speech with ElevenLabs
   */
  public async speak(
    text: string,
    persona: PersonaType = 'ed',
    language: string = 'en'
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${persona}-${language}-${text}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    const voiceConfig = VOICE_PERSONAS[persona] || VOICE_PERSONAS.ed;

    try {
      // Use multilingual v2 model
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceConfig.voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: voiceConfig.stability,
              similarity_boost: voiceConfig.similarity_boost,
              style: voiceConfig.style,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[ElevenLabs] API Error:', error);
        throw new Error(`TTS error: ${response.status}`);
      }

      // Get audio blob and create URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache for reuse (limit cache size)
      if (this.audioCache.size > 50) {
        const firstKey = this.audioCache.keys().next().value;
        const firstUrl = this.audioCache.get(firstKey);
        if (firstUrl) URL.revokeObjectURL(firstUrl);
        this.audioCache.delete(firstKey);
      }
      this.audioCache.set(cacheKey, audioUrl);

      return audioUrl;
    } catch (error) {
      console.error('[ElevenLabs] Error:', error);
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
    language: string = 'en'
  ): Promise<void> {
    const audioUrl = await this.speak(text, persona, language);
    await this.play(audioUrl);
  }

  /**
   * Get available voices from ElevenLabs
   */
  public async getVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('[ElevenLabs] Error getting voices:', error);
      return [];
    }
  }

  /**
   * Check API quota
   */
  public async getQuota(): Promise<{ character_count: number; character_limit: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get quota: ${response.status}`);
      }

      const data = await response.json();
      return {
        character_count: data.subscription?.character_count || 0,
        character_limit: data.subscription?.character_limit || 0,
      };
    } catch (error) {
      console.error('[ElevenLabs] Error getting quota:', error);
      return { character_count: 0, character_limit: 0 };
    }
  }

  /**
   * Clear audio cache
   */
  public clearCache(): void {
    // Revoke all URLs to free memory
    this.audioCache.forEach((url) => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }

  /**
   * Clean up
   */
  public destroy(): void {
    this.clearCache();
  }
}

/**
 * Fallback to browser TTS if ElevenLabs fails
 */
export class BrowserVoice {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    const voices = this.synth.getVoices();
    this.voice = voices.find((v) => v.lang === 'en-GB') || voices[0];
  }

  public speak(text: string, language: string = 'en-GB'): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.voice = this.voice;
      
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      
      this.synth.speak(utterance);
    });
  }

  public stop(): void {
    this.synth.cancel();
  }
}

