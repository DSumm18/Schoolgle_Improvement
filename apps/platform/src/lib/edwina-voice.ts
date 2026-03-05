/**
 * Edwina Voice Integration - Fish Audio TTS for Ed Chatbot
 *
 * Provides text-to-speech functionality using Fish Audio API with Edwina's voice.
 *
 * Voice Configuration:
 * - Edwina Voice ID: 72e3a3135204461ba041df787dc5c834
 * - Female voice, friendly and professional
 * - Used as default voice for Ed's browser automation chatbot
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_FISH_AUDIO_API_KEY or NEXT_PUBLIC_FISH_AUDIO_VOICE_ID_EDWINA
 * - Or configure via data attributes on the widget container
 *
 * @see https://fish.audio
 * @see packages/ed-extension/SETUP_FISH_AUDIO.md
 */

import { useState, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Play, Stop } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceConfig {
  apiKey: string;
  voiceId: string;
  speed?: number; // 0.5 - 2.0, default 1.0
  pitch?: number; // -12 - 12, default 0
}

export interface VoiceState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentText?: string;
}

// ============================================================================
// DEFAULT EDWINA CONFIGURATION
// ============================================================================

const EDWINA_DEFAULTS: Partial<VoiceConfig> = {
  voiceId: '72e3a3135204461ba041df787dc5c834', // Edwina's voice ID
  speed: 1.0,
  pitch: 0,
};

// ============================================================================
// VOICE SERVICE
// ============================================================================

class EdwinaVoiceService {
  private config: VoiceConfig;
  private audioQueue: HTMLAudioElement[] = [];
  private isPlaying = false;

  constructor(config: VoiceConfig) {
    this.config = config;
  }

  /**
   * Convert text to speech using Fish Audio API
   */
  async speak(text: string, options?: Partial<VoiceConfig>): Promise<void> {
    if (!text || text.trim().length === 0) {
      return;
    }

    try {
      // Call Fish Audio Text-to-Speech API
      const response = await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice_id: options?.voiceId || this.config.voiceId,
          speed: options?.speed ?? this.config.speed ?? 1.0,
          pitch: options?.pitch ?? this.config.pitch ?? 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate speech');
      }

      // Get audio data
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Play the audio
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };

        audio.play();
        this.isPlaying = true;

        audio.onpause = () => {
          this.isPlaying = false;
        };

        audio.onplay = () => {
          this.isPlaying = true;
        };
      });

    } catch (error) {
      console.error('[EdwinaVoiceService] Error:', error);
      throw error;
    }
  }

  /**
   * Stop current playback
   */
  stop(): void {
    this.audioQueue.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Check if currently speaking
   */
  isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Get estimated duration for text (rough approximation)
   */
  estimateDuration(text: string): number {
    // Average reading speed: ~150 words per minute
    // Speech is slightly slower: ~130 words per minute
    const words = text.split(/\s+/).length;
    const seconds = (words / 130) * 60;
    return Math.ceil(seconds);
  }
}

// ============================================================================
// HOOK: Use Edwina Voice
// ============================================================================

interface UseEdwinaVoiceOptions {
  /** Auto-play messages as they arrive */
  autoPlay?: boolean;
  /** Voice ID override (for testing or different personas) */
  voiceId?: string;
  /** API Key override (for server-side) */
  apiKey?: string;
  /** Callback when speech starts */
  onStart?: () => void;
  /** Callback when speech ends */
  onEnd?: () => void;
  /** Callback when speech errors */
  onError?: (error: Error) => void;
}

export function useEdwinaVoice(options: UseEdwinaVoiceOptions = {}) {
  const [state, setState] = useState<VoiceState>({
    isPlaying: false,
    isLoading: false,
    error: null,
  });

  const serviceRef = useRef<EdwinaVoiceService | null>(null);

  // Get API key from environment or options
  const getApiKey = useCallback((): string => {
    if (options.apiKey) return options.apiKey;
    if (typeof window !== 'undefined') {
      // Check for Fish Audio API key in various locations
      return (
        (window as any).FISH_AUDIO_API_KEY ||
        process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY ||
        ''
      );
    }
    return process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY || '';
  }, [options.apiKey]);

  // Get voice ID
  const getVoiceId = useCallback((): string => {
    return options.voiceId || EDWINA_DEFAULTS.voiceId!;
  }, [options.voiceId]);

  // Initialize service
  useEffect(() => {
    const apiKey = getApiKey();
    if (apiKey) {
      serviceRef.current = new EdwinaVoiceService({
        apiKey,
        voiceId: getVoiceId(),
      });
    }
  }, [getApiKey, getVoiceId]);

  /**
   * Speak text with Edwina's voice
   */
  const speak = useCallback(async (text: string) => {
    if (!serviceRef.current) {
      console.warn('[EdwinaVoice] Service not initialized - missing API key');
      setState(prev => ({ ...prev, error: 'Voice not configured' }));
      return;
    }

    setState({ isPlaying: true, isLoading: true, error: null, currentText: text });

    if (options.onStart) {
      options.onStart();
    }

    try {
      await serviceRef.current.speak(text);
      setState({ isPlaying: false, isLoading: false, error: null });

      if (options.onEnd) {
        options.onEnd();
      }
    } catch (error) {
      const err = error as Error;
      setState({ isPlaying: false, isLoading: false, error: err.message });

      if (options.onError) {
        options.onError(err);
      }
    }
  }, [options]);

  /**
   * Stop current speech
   */
  const stop = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
      setState({ isPlaying: false, isLoading: false, error: null });
    }
  }, []);

  /**
   * Toggle speech on/off
   */
  const toggle = useCallback(async (text: string) => {
    if (state.isPlaying) {
      stop();
    } else {
      await speak(text);
    }
  }, [state.isPlaying, speak, stop]);

  return {
    ...state,
    speak,
    stop,
    toggle,
    isConfigured: !!serviceRef.current,
  };
}

// ============================================================================
// VOICE CONTROL COMPONENT
// ============================================================================

interface EdwinaVoiceControlProps {
  text: string;
  onPlay?: () => void;
  onStop?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'button' | 'icon' | 'card';
}

export function EdwinaVoiceControl({
  text,
  onPlay,
  onStop,
  disabled = false,
  size = 'md',
  showLabel = false,
  variant = 'button',
}: EdwinaVoiceControlProps) {
  const { isPlaying, isLoading, error, speak, stop, isConfigured, toggle } = useEdwinaVoice({
    onStart: onPlay,
    onEnd: onStop,
  });

  // Icon button variant
  if (variant === 'icon') {
    return (
      <button
        onClick={() => {
          if (text) {
            toggle(text);
          }
        }}
        disabled={disabled || isLoading || !text || !isConfigured}
        className={`p-2 rounded-full transition-all ${
          isPlaying
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isPlaying ? 'Stop speaking' : 'Listen with Edwina'}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Stop className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
    );
  }

  // Card variant (shows Edwina info)
  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-purple-900">Edwina's Voice</h4>
            <p className="text-sm text-purple-700">
              {isPlaying ? 'Speaking...' : 'Click to hear Edwina read this aloud'}
            </p>
          </div>
          <button
            onClick={() => {
              if (text) {
                toggle(text);
              }
            }}
            disabled={disabled || isLoading || !text || !isConfigured}
            className={`p-3 rounded-full transition-all ${
              isPlaying
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-600 hover:bg-purple-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Stop className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
        </div>

        {!isConfigured && (
          <p className="text-xs text-orange-600 mt-2">
            ⚠️ Voice not configured - Check API key
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600 mt-2">
            ⚠️ {error}
          </p>
        )}
      </div>
    );
  }

  // Default button variant
  return (
    <button
      onClick={() => {
        if (text) {
          toggle(text);
        }
      }}
      disabled={disabled || isLoading || !text || !isConfigured}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isPlaying
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isPlaying ? (
        <Stop className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}

      {showLabel && (
        <span className={size === 'sm' ? 'text-sm' : 'text-base'}>
          {isPlaying ? 'Stop' : 'Listen'}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// TEXT-TO-SPEECH WRAPPER FOR MESSAGES
// ============================================================================

interface TTSMessageProps {
  message: string;
  autoPlay?: boolean;
  showControl?: boolean;
}

export function TTSMessage({ message, autoPlay = false, showControl = true }: TTSMessageProps) {
  const { isPlaying, isLoading, speak, stop } = useEdwinaVoice({
    autoPlay,
  });

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && message) {
      speak(message);
    }
  }, [autoPlay, message]);

  if (!showControl) {
    return null; // Silent TTS, just plays audio
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          if (isPlaying) {
            stop();
          } else if (message) {
            speak(message);
          }
        }}
        disabled={isLoading || !message}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        title={isPlaying ? 'Stop' : 'Listen to this message'}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Stop className="w-4 h-4 text-gray-600" />
        ) : (
          <Volume2 className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        )}
      </button>
    </div>
  );
}

export default EdwinaVoiceService;
