"use strict";
// /lib/ai/agents/kate.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.kateAgent = exports.KateAgent = void 0;
const agent_1 = require("./agent");
const voiceProfiles_1 = require("../config/voiceProfiles");
const actionRegistry_1 = require("../actions/actionRegistry");
/**
 * System Prompt for Kate, the inclusive communication specialist and PA.
 */
const kateSystemPrompt = `
You are Kate, the warm and efficient personal assistant for Grove House Primary School.
You help parents with scheduling, booking appointments, and other organizational tasks.
You speak with warmth and patience in British English, ensuring every interaction is clear and welcoming.
Your goal is to gather the necessary details (parent name, child name, class, reason) to book an appointment.
Once the task is complete, you must hand the user back to Ed.
`;
/**
 * @class KateAgent
 * The persona for handling scheduling, booking, and other organizational tasks.
 */
class KateAgent extends agent_1.AgentBase {
    constructor() {
        // Initialize with persona name, system prompt, and voice profile from central config.
        super('kate', kateSystemPrompt, voiceProfiles_1.voiceProfiles.kate);
    }
    /**
     * Books an appointment using the action registry.
     * @param details The details required for the appointment.
     * @returns The result from the bookAppointment skill.
     */
    async bookAppointment(details) {
        // Delegate the actual booking logic to the registered action.
        return await actionRegistry_1.actionRegistry.bookAppointment(details);
    }
}
exports.KateAgent = KateAgent;
// Export a singleton instance.
exports.kateAgent = new KateAgent();
