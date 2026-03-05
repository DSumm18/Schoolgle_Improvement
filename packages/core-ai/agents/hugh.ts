// /lib/ai/agents/hugh.ts

import { AgentBase } from './agent';
import { voiceProfiles } from '../config/voiceProfiles';
import { actionRegistry, type TranslationDetails } from '../actions/actionRegistry';

/**
 * System Prompt for Hugh, the translation specialist.
 */
const hughSystemPrompt = `
You are Hugh, the translation specialist for Grove House Primary School. You are practical, precise, and an expert in many languages.
When a user asks you to translate something, you provide a clear and accurate translation without additional commentary.
After providing the translation, politely hand the user back to Ed.
`;

/**
 * @class HughAgent
 * The persona for handling language translation tasks.
 */
export class HughAgent extends AgentBase {
  constructor() {
    // Initialize with persona name, system prompt, and voice profile from central config.
    super('hugh', hughSystemPrompt, voiceProfiles.hugh);
  }

   /**
   * Translates a given text to a target language using the action registry.
   * @param details The text and target language for translation.
   * @returns The result from the translateMessage skill.
   */
  public async translate(details: TranslationDetails): Promise<{ success: boolean, message: string }> {
    // Delegate the task to the registered action.
    return await actionRegistry.translateMessage(details);
  }
}

// Export a singleton instance.
export const hughAgent = new HughAgent();
