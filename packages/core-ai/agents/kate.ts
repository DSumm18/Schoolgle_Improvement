// /lib/ai/agents/kate.ts

import { AgentBase } from './agent';
import { voiceProfiles } from '../config/voiceProfiles';
import { actionRegistry, type AppointmentDetails } from '../actions/actionRegistry';

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
export class KateAgent extends AgentBase {
  constructor() {
    // Initialize with persona name, system prompt, and voice profile from central config.
    super('kate', kateSystemPrompt, voiceProfiles.kate);
  }

  /**
   * Books an appointment using the action registry.
   * @param details The details required for the appointment.
   * @returns The result from the bookAppointment skill.
   */
  public async bookAppointment(details: AppointmentDetails): Promise<{ success: boolean, message: string }> {
    // Delegate the actual booking logic to the registered action.
    return await actionRegistry.bookAppointment(details);
  }
}

// Export a singleton instance.
export const kateAgent = new KateAgent();
