export type MessageSender = 'user' | 'bot';
export type MessageStatus = 'in-progress' | 'complete';
export type AgentName = 'ed' | 'hugh' | 'kate';
export interface ChatMessage {
    id: string;
    text: string;
    sender: MessageSender;
    status: MessageStatus;
    agent?: AgentName;
}
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
    raw?: any;
}
export interface AudioBlob {
    data: string;
    mimeType: string;
}
export interface AIProvider {
    providerName: string;
    chat(prompt: string, context?: ChatContext): Promise<AIResponse>;
    transcribe?(audioBlob: AudioBlob): Promise<AIResponse>;
    summarize?(text: string): Promise<AIResponse>;
    translate?(text: string, targetLang: string): Promise<AIResponse>;
    healthCheck?(): Promise<boolean>;
}
export interface VoiceProfile {
    provider: 'gemini-tts' | 'google-cloud-tts';
    voiceName: string;
    geminiLiveVoiceName?: 'Kore' | 'Puck' | 'Charon' | 'Zephyr' | 'Fenrir';
    style: string;
    gender: 'male' | 'female' | 'neutral';
    pitch?: number;
    speakingRate?: number;
    isDefault?: boolean;
}
export interface TTSResponse {
    success: boolean;
    base64Audio: string;
    provider: string;
    latency: number;
    error?: string;
    voiceUsed?: string;
}
export interface TTSProvider {
    providerName: string;
    synthesize(text: string, voiceProfile: VoiceProfile): Promise<TTSResponse>;
    healthCheck?(): Promise<boolean>;
}
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
export interface EnvironmentConfig {
    GOOGLE_API_KEY: string;
    GEMINI_API_KEY: string;
    AI_PROVIDER: string;
    AI_FALLBACK_PROVIDERS?: string;
    GOOGLE_TTS_VOICES: string;
    NEXT_PUBLIC_SITE_URL: string;
    LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}
export interface AgentConfig {
    personaName: string;
    systemInstruction: string;
    voiceProfile: VoiceProfile;
}
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
