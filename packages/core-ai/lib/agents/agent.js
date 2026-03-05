"use strict";
// /lib/ai/agents/agent.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentBase = void 0;
const ai_engine_1 = require("../ai-engine");
const voice_engine_1 = require("../voice-engine");
const logger_1 = require("../utils/logger");
/**
 * @class AgentBase
 * A reusable base class for creating AI agent personas. It handles the core
 * logic of interacting with the AI and Voice engines, using a specific
 * system instruction and voice profile provided on initialization.
 */
class AgentBase {
    constructor(personaName, systemInstruction, voiceProfile) {
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
    async ask(prompt, context) {
        const agentContext = {
            ...context,
            systemInstruction: this.systemInstruction,
        };
        logger_1.logger.info(`Agent ${this.personaName} processing request`, {
            promptLength: prompt.length,
            hasHistory: !!context?.history?.length
        }, undefined, this.personaName);
        return ai_engine_1.aiEngine.chat(prompt, agentContext);
    }
    /**
     * Synthesizes speech from text using the agent's predefined voice profile.
     * It now explicitly tells the voice engine which persona is speaking.
     * @param text The text to be spoken.
     * @returns A base64 encoded audio string.
     */
    async speak(text) {
        const response = await voice_engine_1.voiceEngine.speak(text, this.personaName);
        if (!response.success) {
            logger_1.logger.error(`Failed to synthesize speech`, {
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
    async askAndSpeak(prompt) {
        const response = await this.ask(prompt);
        if (!response.success) {
            throw new Error(`Agent failed to get a text response: ${response.error}`);
        }
        const audio = await this.speak(response.text);
        return { text: response.text, audio };
    }
}
exports.AgentBase = AgentBase;
