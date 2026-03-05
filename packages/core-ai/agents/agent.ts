// /lib/ai/agents/agent.ts

import { aiEngine } from '../ai-engine';
import { voiceEngine } from '../voice-engine';
import type { AIResponse, ChatContext, VoiceProfile } from '../types';
import { logger } from '../utils/logger';

/**
 * @class AgentBase
 * A reusable base class for creating AI agent personas. It handles the core
 * logic of interacting with the AI and Voice engines, using a specific
 * system instruction and voice profile provided on initialization.
 */
export class AgentBase {
  public readonly personaName: string;
  protected systemInstruction: string;
  public readonly voiceProfile: VoiceProfile;

  constructor(personaName: string, systemInstruction: string, voiceProfile: VoiceProfile) {
    this.personaName = personaName;
    this.systemInstruction = systemInstruction;
    this.voiceProfile = voiceProfile;
  }

  /**
   * Sends a prompt to the AI engine with the agent's predefined system instruction.
   * @param prompt The user's message.
   * @param context Optional additional context like chat history.
   * @returns A standardized AIResponse.
   */
  public async ask(prompt: string, context?: Omit<ChatContext, 'systemInstruction'>): Promise<AIResponse> {
    const agentContext: ChatContext = {
      ...context,
      systemInstruction: this.systemInstruction,
    };
    
    logger.info(`Agent ${this.personaName} processing request`, { 
      promptLength: prompt.length,
      hasHistory: !!context?.history?.length
    }, undefined, this.personaName);
    
    return aiEngine.chat(prompt, agentContext);
  }

  /**
   * Synthesizes speech from text using the agent's predefined voice profile.
   * It now explicitly tells the voice engine which persona is speaking.
   * @param text The text to be spoken.
   * @returns A base64 encoded audio string.
   */
  public async speak(text: string): Promise<string> {
    const response = await voiceEngine.speak(text, this.personaName);
    if (!response.success) {
      logger.error(`Failed to synthesize speech`, { 
        provider: response.provider, 
        voiceUsed: response.voiceUsed, 
        error: response.error 
      }, response.provider, this.personaName);
      throw new Error(`Failed to synthesize speech for agent ${this.personaName}: ${response.error}`);
    }
    return response.base64Audio;
  }

  /**
   * A convenience method that gets a text response and immediately synthesizes it to audio.
   * @param prompt The user's message.
   * @returns An object containing both the text response and the base64 audio.
   */
  public async askAndSpeak(prompt: string): Promise<{ text: string; audio: string }> {
    const response = await this.ask(prompt);
    if (!response.success) {
      throw new Error(`Agent failed to get a text response: ${response.error}`);
    }
    const audio = await this.speak(response.text);
    return { text: response.text, audio };
  }
}
