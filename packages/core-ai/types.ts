// /lib/ai/types.ts
// Unified type definitions for the Schoolgle Assistant

// --- Core Message Types ---
export type MessageSender = 'user' | 'bot';
export type MessageStatus = 'in-progress' | 'complete';
export type AgentName = 'ed' | 'hugh' | 'kate';

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  status: MessageStatus;
  agent?: AgentName; // Identifies which bot persona is speaking
}

// --- AI Engine Types ---
export interface ChatContext {
  systemInstruction?: string;
  history?: ChatMessage[];
}

export interface UsageStats {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AIResponse {
  success: boolean;
  text: string;
  provider: string;
  model?: string;
  latency?: number;
  usage?: UsageStats | null;
  error?: string;
  raw?: any; // For provider-specific raw output
}

export interface AudioBlob {
  data: string; // base64 encoded audio data
  mimeType: string; // MIME type of the audio
}

export interface AIProvider {
  providerName: string;
  chat(prompt: string, context?: ChatContext): Promise<AIResponse>;
  transcribe?(audioBlob: AudioBlob): Promise<AIResponse>; // Optional capability
  summarize?(text: string): Promise<AIResponse>; // Optional capability
  translate?(text: string, targetLang: string): Promise<AIResponse>; // Optional capability
  healthCheck?(): Promise<boolean>; // Health check capability
}

// --- Voice Engine Types ---
export interface VoiceProfile {
  provider: 'gemini-tts' | 'google-cloud-tts'; // Supported TTS providers
  voiceName: string; // Provider-specific voice name for premium TTS
  geminiLiveVoiceName?: 'Kore' | 'Puck' | 'Charon' | 'Zephyr' | 'Fenrir'; // Voice for the real-time Gemini Live API
  style: string; // A descriptive style (e.g., 'warm-professional', 'confident-neutral')
  gender: 'male' | 'female' | 'neutral';
  pitch?: number; // Pitch adjustment (some providers)
  speakingRate?: number; // Speed adjustment (some providers)
  isDefault?: boolean; // Identifies the default persona for the application
}

export interface TTSResponse {
  success: boolean;
  base64Audio: string;
  provider: string;
  latency: number;
  error?: string;
  voiceUsed?: string; // The actual voice name used by the provider
}

export interface TTSProvider {
  providerName: string;
  synthesize(text: string, voiceProfile: VoiceProfile): Promise<TTSResponse>;
  healthCheck?(): Promise<boolean>; // Health check capability
}

// --- Error Handling Types ---
export interface AIError {
  code: string;
  message: string;
  provider?: string;
  context?: any;
}

export interface TTSError {
  code: string;
  message: string;
  provider?: string;
  voiceProfile?: string;
  context?: any;
}

// --- Action Registry Types ---
// Action-specific types are defined in their respective action files

// --- Environment Configuration Types ---
export interface EnvironmentConfig {
  GOOGLE_API_KEY: string;
  GEMINI_API_KEY: string;
  AI_PROVIDER: string;
  AI_FALLBACK_PROVIDERS?: string;
  GOOGLE_TTS_VOICES: string;
  NEXT_PUBLIC_SITE_URL: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

// --- Agent Base Types ---
export interface AgentConfig {
  personaName: string;
  systemInstruction: string;
  voiceProfile: VoiceProfile;
}

// --- Live Session Types ---
export interface LiveSessionConfig {
  model: string;
  systemInstruction: string;
  responseModalities: string[];
  inputAudioTranscription: object;
  outputAudioTranscription: object;
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: string;
      };
    };
  };
}
