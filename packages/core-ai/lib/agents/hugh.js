"use strict";
// /lib/ai/agents/hugh.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.hughAgent = exports.HughAgent = void 0;
const agent_1 = require("./agent");
const voiceProfiles_1 = require("../config/voiceProfiles");
const actionRegistry_1 = require("../actions/actionRegistry");
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
class HughAgent extends agent_1.AgentBase {
    constructor() {
        // Initialize with persona name, system prompt, and voice profile from central config.
        super('hugh', hughSystemPrompt, voiceProfiles_1.voiceProfiles.hugh);
    }
    /**
    * Translates a given text to a target language using the action registry.
    * @param details The text and target language for translation.
    * @returns The result from the translateMessage skill.
    */
    async translate(details) {
        // Delegate the task to the registered action.
        return await actionRegistry_1.actionRegistry.translateMessage(details);
    }
}
exports.HughAgent = HughAgent;
// Export a singleton instance.
exports.hughAgent = new HughAgent();
