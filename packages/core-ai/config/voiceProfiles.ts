// /lib/ai/config/voiceProfiles.ts

import type { VoiceProfile } from '../types';

export type { VoiceProfile };

/**
 * A centralized registry of all available voice personas for the application.
 * The key for each entry (e.g., 'ed') is used as the `personaName` identifier.
 */
export const voiceProfiles: Record<string, VoiceProfile> = {
  /**
   * Ed: The calm, professional school assistant.
   * The default voice for all primary user interactions.
   * FIX: Reverted to gemini-tts to resolve API key errors. 'Puck' is a calm British male voice.
   */
  ed: {
    provider: "gemini-tts",
    voiceName: "Puck",
    geminiLiveVoiceName: 'Puck',
    gender: "male",
    style: "calm-professional",
    speakingRate: 1.0,
    isDefault: true,
  },

  /**
   * Hugh: The precise and expert translator.
   * Voice for multilingual tasks, clear and accurate.
   * FIX: Reverted to gemini-tts. 'Charon' is a clear male voice suitable for an expert.
   */
  hugh: {
    provider: "gemini-tts",
    voiceName: "Charon",
    geminiLiveVoiceName: 'Charon',
    gender: "male",
    style: "precise-expert",
    speakingRate: 1.0,
  },

  /**
   * Kate: The warm and capable personal assistant.
   * A warm, inclusive female voice for scheduling, booking, and empathetic communication.
   * FIX: Reverted to gemini-tts. 'Kore' is the primary female voice available.
   */
  kate: {
    provider: "gemini-tts",
    voiceName: "Kore",
    geminiLiveVoiceName: 'Kore',
    gender: "female",
    style: "inclusive-gentle",
    speakingRate: 1.0,
  },
};
