import type { VoiceProfile } from '../types';
export type { VoiceProfile };
/**
 * A centralized registry of all available voice personas for the application.
 * The key for each entry (e.g., 'ed') is used as the `personaName` identifier.
 */
export declare const voiceProfiles: Record<string, VoiceProfile>;
