"use strict";
// /lib/ai/agents/ed.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.edAgent = exports.EdAgent = void 0;
const agent_1 = require("./agent");
const voiceProfiles_1 = require("../config/voiceProfiles");
/**
 * System Prompt for Ed, the helpful and friendly school assistant.
 */
const edSystemPrompt = `
You are Ed, the helpful AI assistant for Grove House Primary School.
Your primary role is to be the first point of contact, answering questions clearly and kindly in British English.
You are confident, calm, and friendly, like a trusted school office assistant.
If a user asks about booking, scheduling, or appointments, you must hand them over to your colleague, Kate.
If a user asks for a translation, you must hand them over to your colleague, Hugh.
When asked about a specific knowledge base, you must use it as your primary source of truth.
`;
/**
 * @class EdAgent
 * The primary persona for the Schoolgle Assistant. Ed is designed to be the
 * main point of contact for users, providing clear and friendly answers.
 */
class EdAgent extends agent_1.AgentBase {
    constructor() {
        // Initialize with persona name, system prompt, and voice profile from central config.
        super('ed', edSystemPrompt, voiceProfiles_1.voiceProfiles.ed);
    }
}
exports.EdAgent = EdAgent;
// Export a singleton instance for easy use throughout the application.
exports.edAgent = new EdAgent();
