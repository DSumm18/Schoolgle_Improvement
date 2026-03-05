import type { AIResponse, ChatContext, VoiceProfile } from '../types';
/**
 * @class AgentBase
 * A reusable base class for creating AI agent personas. It handles the core
 * logic of interacting with the AI and Voice engines, using a specific
 * system instruction and voice profile provided on initialization.
 */
export declare class AgentBase {
    readonly personaName: string;
    protected systemInstruction: string;
    readonly voiceProfile: VoiceProfile;
    constructor(personaName: string, systemInstruction: string, voiceProfile: VoiceProfile);
    /**
     * Sends a prompt to the AI engine with the agent's predefined system instruction.
     * @param prompt The user's message.
     * @param context Optional additional context like chat history.
     * @returns A standardized AIResponse.
     */
    ask(prompt: string, context?: Omit<ChatContext, 'systemInstruction'>): Promise<AIResponse>;
    /**
     * Synthesizes speech from text using the agent's predefined voice profile.
     * It now explicitly tells the voice engine which persona is speaking.
     * @param text The text to be spoken.
     * @returns A base64 encoded audio string.
     */
    speak(text: string): Promise<string>;
    /**
     * A convenience method that gets a text response and immediately synthesizes it to audio.
     * @param prompt The user's message.
     * @returns An object containing both the text response and the base64 audio.
     */
    askAndSpeak(prompt: string): Promise<{
        text: string;
        audio: string;
    }>;
}
