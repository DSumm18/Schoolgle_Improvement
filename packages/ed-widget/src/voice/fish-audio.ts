/**
 * Fish Audio S1 - Expressive Voice with Emotion Control
 * 
 * Perfect for Ed because:
 * - Built specifically for conversational chatbots
 * - Emotion/tone tags (helpful, empathetic, upbeat)
 * - Voice cloning in 15 seconds
 * - Real-time streaming
 * - 30+ languages
 * 
 * Source: https://fish.audio/
 */

import type { PersonaType } from '../types';

// Emotion and tone configurations for Ed's personas
const PERSONA_CONFIGS = {
  ed: {
    tone: 'helpful',
    emotion: 'friendly',
    pitch: 0,
    speed: 1.0,
    description: 'Professional, warm school assistant (male)',
  },
  edwina: {
    tone: 'helpful',
    emotion: 'friendly',
    pitch: 5,
    speed: 1.0,
    description: 'Professional, warm school assistant (female)',
  },
  santa: {
    tone: 'jolly',
    emotion: 'warm',
    pitch: -10,
    speed: 0.95,
    description: 'Festive, deep Santa voice',
  },
  elf: {
    tone: 'upbeat',
    emotion: 'excited',
    pitch: 15,
    speed: 1.1,
    description: 'Energetic, playful elf helper',
  },
  headteacher: {
    tone: 'professional',
    emotion: 'calm',
    pitch: -5,
    speed: 0.9,
    description: 'Authoritative, welcoming headteacher',
  },
  custom: {
    tone: 'neutral',
    emotion: 'neutral',
    pitch: 0,
    speed: 1.0,
    description: 'Custom voice',
  },
} as const;

// Language to Fish Audio language code mapping
const LANGUAGE_MAP: Record<string, string> = {
  'en-GB': 'en',
  'en-US': 'en',
  'pl': 'pl',
  'ro': 'ro',
  'es': 'es',
  'pt': 'pt',
  'fr': 'fr',
  'zh': 'zh',
  'ar': 'ar',
  'pa': 'hi', // Punjabi → Hindi (closest)
  'bn': 'bn',
  'ur': 'ur',
  'so': 'en', // Somali → fallback to English
};

export class FishAudioVoice {
  private apiKey: string;
  // Use proxy to avoid CORS issues when calling from browser
  // Don't add /tts here - it's added in the speak() method
  private baseUrl = '/api/fish-audio';
  private audioCache: Map<string, string> = new Map();
  private activeAudio: HTMLAudioElement | null = null; // Track active audio to stop it

  // Voice IDs for cloned personas (set after cloning)
  private voiceIds: Record<PersonaType, string> = {
    ed: '', // Set this after cloning
    edwina: '', // Edwina (female voice) - set from env: VITE_FISH_AUDIO_VOICE_ID_EDWINA
    santa: '',
    elf: '',
    headteacher: '',
    custom: '',
  };

  // Usage tracking
  private monthlyCharCount = 0;
  private lastResetDate = new Date().getMonth();

  constructor(apiKey: string, voiceIds?: Record<PersonaType, string>) {
    this.apiKey = apiKey;
    if (voiceIds) {
      this.voiceIds = voiceIds;
    }
  }

  /**
   * Convert text to speech
   * 
   * NOTE: Fish Audio does NOT support emotion tags in text format.
   * Emotion comes from the cloned voice itself, not text tags.
   * All emotion tags and pause tags are removed before sending to API.
   */
  public async speak(
    text: string,
    persona: PersonaType = 'ed',
    languageCode: string = 'en-GB'
  ): Promise<string> {
    // Remove ALL emotion tags and pause tags - Fish Audio doesn't support them
    // Fish Audio uses voice cloning for emotion, not text-based tags
    const cleanedText = this.cleanTextForTTS(text, false); // false = remove all tags

    // Check cache first
    const cacheKey = `${persona}-${languageCode}-${cleanedText}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    // Track usage (count only actual text, not emotion tags)
    const textOnly = this.stripEmotionTags(cleanedText);
    this.updateUsage(textOnly.length);

    const config = PERSONA_CONFIGS[persona];
    const fishLang = LANGUAGE_MAP[languageCode] || 'en';
    const voiceId = this.voiceIds[persona];

    if (!voiceId || voiceId.trim() === '') {
      console.warn(`[Fish Audio] ⚠️ No voice ID set for ${persona}, using default Fish Audio voice`);
      console.warn(`[Fish Audio] To use cloned voice, set voice ID in config: fishAudioVoiceIds.${persona}`);
    } else {
      console.log(`[Fish Audio] Using cloned voice for ${persona}: ${voiceId}`);
    }

    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Fish Audio API key is required');
    }

    try {
      // Fish Audio API request body - simplified to required fields only
      const requestBody: any = {
        text: cleanedText, // Required: text to convert to speech (cleaned but with Fish Audio tags)
      };

      // Add reference_id only if voice ID is provided
      if (voiceId && voiceId.trim() !== '') {
        requestBody.reference_id = voiceId;
      }

      // Add optional parameters (only if Fish Audio supports them)
      // Note: Some parameters might not be supported - test without them first
      if (fishLang) {
        requestBody.language = fishLang;
      }

      // Debug logging (mask API key for security)
      const maskedKey = this.apiKey ? `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 'MISSING';
      console.log('[Fish Audio] Request Details:', {
        url: `${this.baseUrl}`,
        method: 'POST',
        apiKeyMasked: maskedKey,
        apiKeyLength: this.apiKey?.length || 0,
        voiceId: voiceId || 'none',
        requestBody: requestBody,
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorDetails: any = {};
        try {
          const errorText = await response.text();
          console.error('[Fish Audio] API Error Response (raw):', errorText);

          // Try to parse as JSON
          try {
            errorDetails = JSON.parse(errorText);
            errorMessage = errorDetails.message || errorDetails.error || errorMessage;
            console.error('[Fish Audio] API Error Response (parsed):', errorDetails);
          } catch (e) {
            // Not JSON, use raw text
            errorMessage = errorText || errorMessage;
            console.error('[Fish Audio] API Error Response (text):', errorText);
          }

          // Provide helpful error messages
          if (response.status === 402) {
            console.error('[Fish Audio] ❌ 402 Payment Required - Possible causes:');
            console.error('  1. Invalid API key (check .env.local)');
            console.error('  2. Account has no credits/balance');
            console.error('  3. API key might be a voice ID instead of API key');
            console.error('  → Get API key from: https://fish.audio dashboard → Account Settings');
          } else if (response.status === 401) {
            console.error('[Fish Audio] ❌ 401 Unauthorized - API key is invalid');
          } else if (response.status === 400) {
            console.error('[Fish Audio] ❌ 400 Bad Request - Request format issue:');
            console.error('  - Check request body format');
            console.error('  - Verify reference_id format');
            console.error('  - Check if all required fields are present');
            console.error('  Request body sent:', JSON.stringify(requestBody, null, 2));
          } else if (response.status === 500) {
            console.error('[Fish Audio] ❌ 500 Internal Server Error - Fish Audio API issue');
            console.error('  - This might be a temporary Fish Audio service issue');
            console.error('  - Try again in a few moments');
          }
        } catch (e) {
          console.error('[Fish Audio] Error parsing response:', e);
        }
        throw new Error(`TTS error: ${response.status} - ${errorMessage}`);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache (limit size)
      if (this.audioCache.size > 50) {
        const firstKey = this.audioCache.keys().next().value;
        if (firstKey) {
          const firstUrl = this.audioCache.get(firstKey);
          if (firstUrl) URL.revokeObjectURL(firstUrl);
          this.audioCache.delete(firstKey);
        }
      }
      this.audioCache.set(cacheKey, audioUrl);

      // Log usage
      console.log('[Fish Audio] Generated:', {
        persona,
        tone: config.tone,
        emotion: config.emotion,
        chars: text.length,
        monthlyTotal: this.monthlyCharCount,
        cost: this.estimateCost(),
      });

      return audioUrl;
    } catch (error) {
      console.error('[Fish Audio] Error:', error);
      throw error;
    }
  }

  /**
   * Clone a voice from audio sample
   */
  public async cloneVoice(
    audioFile: File | Blob,
    name: string,
    description: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('name', name);
    formData.append('description', description);

    try {
      const response = await fetch(`${this.baseUrl}/voices/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Voice cloning failed: ${response.status}`);
      }

      const data = await response.json();
      const voiceId = data.voice_id || data.id;

      console.log('[Fish Audio] Voice cloned:', {
        name,
        voiceId,
        duration: '15 seconds',
      });

      return voiceId;
    } catch (error) {
      console.error('[Fish Audio] Clone error:', error);
      throw error;
    }
  }

  /**
   * Play audio from URL
   */
  public async play(audioUrl: string): Promise<void> {
    // Stop any currently playing audio, but wait for it to fully stop
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      // Wait a brief moment for pause to complete
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      this.activeAudio = audio;

      // Set volume
      audio.volume = 1.0;

      // Preload audio
      audio.load();

      audio.onended = () => {
        this.activeAudio = null;
        resolve();
      };
      audio.onerror = (error) => {
        console.error('[Fish Audio] Audio playback error:', error);
        this.activeAudio = null;
        reject(new Error('Audio playback failed'));
      };

      // Try to play with better error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[Fish Audio] Audio playing successfully');
          })
          .catch((error) => {
            console.error('[Fish Audio] Play promise rejected:', error);
            // If autoplay is blocked, try to play after user interaction
            if (error.name === 'NotAllowedError') {
              console.warn('[Fish Audio] Autoplay blocked, audio will play on next user interaction');
              // Don't reject - let it play when user interacts
              // Set up a one-time click handler to play
              const playOnInteraction = () => {
                audio.play()
                  .then(() => {
                    document.removeEventListener('click', playOnInteraction);
                    document.removeEventListener('touchstart', playOnInteraction);
                  })
                  .catch(() => {
                    // Still failed, reject
                    document.removeEventListener('click', playOnInteraction);
                    document.removeEventListener('touchstart', playOnInteraction);
                    reject(error);
                  });
              };
              document.addEventListener('click', playOnInteraction, { once: true });
              document.addEventListener('touchstart', playOnInteraction, { once: true });
            } else {
              reject(error);
            }
          });
      }
    });
  }

  /**
   * Stop any currently playing audio
   */
  public stop(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
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
   * Stream audio for real-time playback
   */
  public async speakStream(
    text: string,
    persona: PersonaType = 'ed',
    languageCode: string = 'en-GB'
  ): Promise<ReadableStream<Uint8Array>> {
    const config = PERSONA_CONFIGS[persona];
    const fishLang = LANGUAGE_MAP[languageCode] || 'en';

    const response = await fetch(`${this.baseUrl}/tts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        reference_id: this.voiceIds[persona],
        model: 'fish-audio-s1',
        language: fishLang,
        tone: config.tone,
        emotion: config.emotion,
        pitch: config.pitch,
        speed: config.speed,
        streaming: true, // Enable streaming!
        format: 'mp3',
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Streaming failed');
    }

    return response.body;
  }

  /**
   * Set cloned voice IDs
   */
  public setVoiceIds(voiceIds: Partial<Record<PersonaType, string>>): void {
    this.voiceIds = { ...this.voiceIds, ...voiceIds };
  }

  /**
   * Update usage tracking
   */
  private updateUsage(chars: number): void {
    const currentMonth = new Date().getMonth();

    if (currentMonth !== this.lastResetDate) {
      this.monthlyCharCount = 0;
      this.lastResetDate = currentMonth;
    }

    this.monthlyCharCount += chars;
  }

  /**
   * Estimate monthly cost
   */
  private estimateCost(): string {
    // Assuming ~$0.12 per 1K characters
    const costPer1K = 0.12;
    const totalCost = (this.monthlyCharCount / 1000) * costPer1K;
    return `£${totalCost.toFixed(2)}`;
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(): {
    charsUsedThisMonth: number;
    estimatedCost: number;
    estimatedConversationsRemaining: number;
  } {
    // Assuming Pro plan: 150K chars/month at $30 (with 50% OFF = $15)
    const planLimit = 150000;
    const remaining = Math.max(planLimit - this.monthlyCharCount, 0);

    return {
      charsUsedThisMonth: this.monthlyCharCount,
      estimatedCost: (this.monthlyCharCount / 1000) * 0.12,
      estimatedConversationsRemaining: Math.floor(remaining / 800),
    };
  }

  /**
   * Clear audio cache
   */
  public clearCache(): void {
    this.audioCache.forEach((url) => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }

  /**
   * Strip emotion tags from text for character counting
   */
  private stripEmotionTags(text: string): string {
    // Remove emotion tags like (happy), (pause:500ms), etc.
    return text
      .replace(/\([^)]+\)/g, '') // Remove (emotion) tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Clean text before TTS - remove emojis, language codes, formatting, and instructional text
   * This ensures only actual spoken content is sent to TTS
   * 
   * For Fish Audio: preserves emotion tags like (happy), (pause:500ms) that Fish Audio understands
   * For browser TTS: removes all tags including emotion/pause tags
   */
  public cleanTextForTTS(text: string, preserveFishAudioTags: boolean = true): string {
    // First, temporarily preserve Fish Audio tags if needed
    const fishAudioTagPlaceholders: Map<string, string> = new Map();
    let cleaned = text;

    if (preserveFishAudioTags) {
      // Extract and preserve Fish Audio emotion/pause tags
      // Match: (happy), (excited), (pause:500ms), etc.
      // Allow optional spaces: (pause: 500ms) or (pause:500ms)
      const fishAudioTagPattern = /\((?:happy|excited|calm|friendly|empathetic|professional|neutral|confident|warm|cheerful|enthusiastic|understanding|supportive|encouraging|laughing|sighing|pause\s*:\s*\d+\s*ms)\)/gi;
      const matches = text.matchAll(fishAudioTagPattern);
      let placeholderIndex = 0;
      for (const match of matches) {
        const placeholder = `__FISH_TAG_${placeholderIndex}__`;
        fishAudioTagPlaceholders.set(placeholder, match[0]);
        cleaned = cleaned.replace(match[0], placeholder);
        placeholderIndex++;
      }
    }

    // Remove emojis (keep text only)
    cleaned = cleaned
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      // Remove language codes like "Polski PL 🇵🇱" or "Română RO"
      .replace(/\b[A-Z]{2}\s*🇵🇱|🇷🇴|🇬🇧|🇺🇸|🇵🇱|🇷🇴\b/gi, '')
      .replace(/Polski\s+PL|Română\s+RO|English\s+EN/gi, '')
      // Remove markdown-style formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic
      .replace(/`([^`]+)`/g, '$1') // Code
      // Remove HTML-like tags
      .replace(/<[^>]+>/g, '')
      // Remove instructional text patterns
      .replace(/\[Translated to [^\]]+\]:\s*/gi, '');

    // Remove any remaining tags (non-placeholder tags)
    // If preserving, we've already replaced Fish Audio tags with placeholders
    // So any remaining (tags) are non-Fish-Audio tags and should be removed
    // But we need to be careful not to remove the placeholders
    if (preserveFishAudioTags) {
      // Only remove tags that aren't placeholders (placeholders don't match \( pattern)
      // The placeholders are like __FISH_TAG_0__ so they're safe
      cleaned = cleaned.replace(/\([^)]+\)/g, '');
    } else {
      // Remove all tags including Fish Audio tags
      cleaned = cleaned.replace(/\([^)]+\)/g, '');
    }

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Restore Fish Audio tags if preserving
    if (preserveFishAudioTags) {
      fishAudioTagPlaceholders.forEach((tag, placeholder) => {
        cleaned = cleaned.replace(placeholder, tag);
      });
    }

    return cleaned.trim();
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.clearCache();
  }
}

/**
 * Helper to record audio for voice cloning
 */
export async function recordVoiceClip(durationSeconds: number = 15): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      stream.getTracks().forEach((track) => track.stop());
      resolve(blob);
    };
    mediaRecorder.onerror = reject;

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), durationSeconds * 1000);
  });
}

